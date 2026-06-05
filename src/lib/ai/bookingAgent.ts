import { GoogleGenerativeAI, FunctionDeclaration, Schema } from '@google/generative-ai';
import { BOOKING_PROMPT } from './prompts';
import { adminDb } from '../firebase/admin';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Define the tools (functions) the AI can call
const checkAvailabilityDeclaration: FunctionDeclaration = {
  name: "check_availability",
  description: "Checks if there is availability for a given date and time.",
  parameters: {
    type: "OBJECT" as any,
    properties: {
      serviceId: { type: "STRING" as any, description: "The ID of the requested service." },
      date: { type: "STRING" as any, description: "The date of the reservation in YYYY-MM-DD format." },
      time: { type: "STRING" as any, description: "The time of the reservation in HH:MM format." },
      partySize: { type: "NUMBER" as any, description: "Number of people for the reservation. Default is 1." }
    },
    required: ["serviceId", "date", "time", "partySize"],
  },
};

const createReservationDeclaration: FunctionDeclaration = {
  name: "create_reservation",
  description: "Creates a reservation in the system after availability has been confirmed.",
  parameters: {
    type: "OBJECT" as any,
    properties: {
      serviceId: { type: "STRING" as any, description: "The ID of the requested service." },
      date: { type: "STRING" as any, description: "The date of the reservation in YYYY-MM-DD format." },
      time: { type: "STRING" as any, description: "The time of the reservation in HH:MM format." },
      name: { type: "STRING" as any, description: "The name of the customer." },
      partySize: { type: "NUMBER" as any, description: "Number of people for the reservation. Default is 1." }
    },
    required: ["serviceId", "date", "time", "name", "partySize"],
  },
};

export async function handleBookingQuery(
  companyId: string, 
  sessionId: string, 
  userMessage: string, 
  history: any[], 
  calendlyLink: string, 
  crmFacts: any,
  bookingConfig?: any,
  servicesList: any[] = []
) {
  const syncSource = bookingConfig?.syncSource || 'native';
  const operatingHours = bookingConfig?.operatingHours || '9 AM to 5 PM';

  const systemPrompt = `You are the Booking Agent for this business.
Your goal is to help the user book a reservation or appointment for a specific service.

Operating Hours: ${operatingHours}
Sync Source: ${syncSource}

AVAILABLE SERVICES:
${JSON.stringify(servicesList, null, 2)}

CRITICAL RULES:
1. Be extremely concise. Use short sentences.
2. If Sync Source is 'calendly': DO NOT USE FUNCTION CALLS. Give them this Calendly link to book: ${calendlyLink}.
3. If Sync Source is 'native': Use the 'check_availability' tool to see if the requested date/time is open for a specific serviceId. NEVER say a date is open without using the tool first.
4. If the tool says it's available, immediately ask for their name and then use 'create_reservation' passing the serviceId to confirm.

Customer Facts: ${JSON.stringify(crmFacts)}
`;

  const model = genAI.getGenerativeModel({ 
    model: 'gemini-1.5-flash',
    systemInstruction: systemPrompt,
    tools: syncSource === 'native' ? [{
      functionDeclarations: [checkAvailabilityDeclaration, createReservationDeclaration]
    }] : []
  });

  try {
    const chat = model.startChat({ history });
    let result = await chat.sendMessage(userMessage);
    
    // Handle function calls
    const bookingTools = syncSource === 'native' ? {
      check_availability: async (args: any) => {
        console.log(`[BookingAgent] Tool Called: check_availability for ${args.serviceId} on ${args.date} at ${args.time}`);
        try {
          const { checkAvailability } = await import('@/lib/bookings/bookingService');
          const res = await checkAvailability(companyId, args.serviceId, args.date, args.time, args.partySize || 1);
          return {
            available: res.available,
            message: res.available ? `Available. Service: ${res.serviceName}. Remaining Capacity: ${res.remainingCapacity}` : `Not available: ${res.reason}`
          };
        } catch (err: any) {
          return { error: err.message || 'Failed to check database.' };
        }
      },
      create_reservation: async (args: any) => {
        console.log(`[BookingAgent] Tool Called: create_reservation for ${args.name} / ${args.serviceId}`);
        try {
          const { createReservation } = await import('@/lib/bookings/bookingService');
          const res = await createReservation({
            companyId,
            serviceId: args.serviceId,
            date: args.date,
            time: args.time,
            customerName: args.name || crmFacts.name || 'Cliente',
            customerPhone: sessionId,
            partySize: args.partySize || 1
          });

          console.log(`[WHATSAPP API] Sending Template 'reservation_confirmed' to ${sessionId}`);
          return { success: true, message: `Reservation confirmed for ${res.customerName} on ${res.date} at ${res.time} for ${res.serviceName}.` };
        } catch (err: any) {
          return { error: err.message || 'Failed to save reservation.' };
        }
      }
    } : {};

    const functionCalls = result.response.functionCalls ? result.response.functionCalls() : undefined;
    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      const toolFn = (bookingTools as any)[call.name];
      
      if (toolFn) {
        const toolResult = await toolFn(call.args);
        result = await chat.sendMessage([{
          functionResponse: {
            name: call.name,
            response: toolResult
          }
        }]);
      }
    }

    return result.response.text();
  } catch (error) {
    console.error("Error in Booking Agent:", error);
    return "Lo siento, tuve un problema procesando la reserva. ¿Podrías intentar más tarde?";
  }
}
