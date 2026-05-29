import { adminDb } from '@/lib/firebase/admin';

export interface BookingRequest {
  companyId: string;
  serviceId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  customerName: string;
  customerPhone?: string;
  partySize?: number;
}

export async function checkAvailability(companyId: string, serviceId: string, date: string, time: string, requestedPartySize: number = 1) {
  const db = adminDb;
  if (!db) throw new Error("DB not initialized");

  // 1. Fetch Service details
  const serviceDoc = await db.collection('companies').doc(companyId).collection('services').doc(serviceId).get();
  if (!serviceDoc.exists) {
    throw new Error("Service not found");
  }
  const service = serviceDoc.data()!;

  // 2. Fetch Company Booking Config
  const companyDoc = await db.collection('companies').doc(companyId).get();
  const bookingConfig = companyDoc.data()?.bookingConfig || {};
  const syncSource = bookingConfig.syncSource || 'native';

  // 3. Native Database Check
  const snapshot = await db.collection('companies').doc(companyId).collection('reservations')
    .where('date', '==', date)
    .where('time', '==', time)
    .where('serviceId', '==', serviceId)
    .where('status', 'in', ['confirmed', 'pending'])
    .get();

  let existingPartySize = 0;
  snapshot.docs.forEach(doc => {
    existingPartySize += (doc.data().partySize || 1);
  });

  const maxCap = service.capacity || 1;
  const isAvailableLocally = (existingPartySize + requestedPartySize) <= maxCap;

  if (!isAvailableLocally) {
    return { available: false, reason: 'capacity_reached', maxCap, existingPartySize };
  }

  // 4. External Sync Check (Google Calendar API hook goes here in future)
  if (syncSource === 'google_calendar') {
    console.log(`[Sync] Pinging Google Calendar API for ${date} ${time}`);
    // mock external check
  }

  return { available: true, serviceName: service.name, remainingCapacity: maxCap - existingPartySize };
}

export async function createReservation(req: BookingRequest) {
  const db = adminDb;
  if (!db) throw new Error("DB not initialized");

  // Re-verify availability to prevent race conditions
  const availability = await checkAvailability(req.companyId, req.serviceId, req.date, req.time, req.partySize || 1);
  
  if (!availability.available) {
    throw new Error(`Reservation failed: ${availability.reason}`);
  }

  const reservationData = {
    serviceId: req.serviceId,
    serviceName: availability.serviceName,
    date: req.date,
    time: req.time,
    customerName: req.customerName,
    customerPhone: req.customerPhone || null,
    partySize: req.partySize || 1,
    status: 'confirmed',
    createdAt: new Date().toISOString()
  };

  const docRef = await db.collection('companies').doc(req.companyId).collection('reservations').add(reservationData);

  // If syncSource is google_calendar, insert into GCal API here

  return { success: true, reservationId: docRef.id, ...reservationData };
}
