import { NextResponse } from 'next/server';
import { getCustomersByCompany, getCompanySessions } from '@/lib/firebase/dbUtils';
import { adminDb, verifyOwnership } from '@/lib/firebase/admin';

// Local interfaces to resolve 'any' type
interface OrderItem {
  name: string;
  price: number;
  quantity?: number;
  [key: string]: unknown;
}

interface Order {
  id?: string;
  companyId?: string;
  customerId: string;
  items?: OrderItem[];
  total?: number;
  status?: string;
  createdAt?: string;
}

interface Reservation {
  id?: string;
  companyId?: string;
  customerId: string;
  date?: string;
  time?: string;
  status?: string;
  details?: string;
  createdAt?: string;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    const isOwner = await verifyOwnership(request, id);
    if (!isOwner) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const [dbCustomers, sessions] = await Promise.all([
      getCustomersByCompany(id),
      getCompanySessions(id)
    ]);
    
    // Merge sessions into customers to ensure every conversation is treated as a customer
    const customersMap: Record<string, any> = {};
    for (const c of dbCustomers) {
      customersMap[c.customerId] = { ...c };
    }

    for (const s of sessions) {
      const customerId = s.sessionId;
      if (!customersMap[customerId]) {
        customersMap[customerId] = {
          companyId: id,
          customerId,
          extractedFacts: {},
          createdAt: s.lastUpdated || new Date(s.updatedAt || Date.now()).toISOString()
        };
      }
      customersMap[customerId].lastInteractionAt = s.lastUpdated || new Date(s.updatedAt || Date.now()).toISOString();
      if (s.customerName && !customersMap[customerId].customerName) {
        customersMap[customerId].customerName = s.customerName;
      }
    }

    const allCustomers = Object.values(customersMap);

    // Fetch orders and reservations to attach to customer profiles
    let orders: Order[] = [];
    let reservations: Reservation[] = [];

    if (adminDb) {
      const [ordersSnapshot, reservationsSnapshot] = await Promise.all([
        adminDb.collection('companies').doc(id).collection('orders').get(),
        adminDb.collection('companies').doc(id).collection('reservations').get()
      ]);
      orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      reservations = reservationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reservation));
    }

    const ordersByCustomer: Record<string, Order[]> = {};
    for (const order of orders) {
      if (!ordersByCustomer[order.customerId]) {
        ordersByCustomer[order.customerId] = [];
      }
      ordersByCustomer[order.customerId].push(order);
    }

    const reservationsByCustomer: Record<string, Reservation[]> = {};
    for (const reservation of reservations) {
      if (!reservationsByCustomer[reservation.customerId]) {
        reservationsByCustomer[reservation.customerId] = [];
      }
      reservationsByCustomer[reservation.customerId].push(reservation);
    }

    const enrichedCustomers = allCustomers.map(customer => {
      const customerOrders = ordersByCustomer[customer.customerId] || [];
      const customerReservations = reservationsByCustomer[customer.customerId] || [];
      
      const lifetimeValue = customerOrders.reduce((sum, order: Order) => sum + (Number(order.total) || 0), 0);

      return {
        ...customer,
        orders: customerOrders,
        reservations: customerReservations,
        lifetimeValue
      };
    });

    // Sort by most recent interaction
    enrichedCustomers.sort((a, b) => {
      const dateA = new Date(a.lastInteractionAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.lastInteractionAt || b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    return NextResponse.json({ customers: enrichedCustomers });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}
