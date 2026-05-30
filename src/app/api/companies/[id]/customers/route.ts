import { NextResponse } from 'next/server';
import { getCustomersByCompany } from '@/lib/firebase/dbUtils';
import { adminDb, verifyOwnership } from '@/lib/firebase/admin';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    const isOwner = await verifyOwnership(request, id);
    if (!isOwner) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const customers = await getCustomersByCompany(id);
    
    // Fetch orders and reservations to attach to customer profiles
    let orders: any[] = [];
    let reservations: any[] = [];

    if (adminDb) {
      const [ordersSnapshot, reservationsSnapshot] = await Promise.all([
        adminDb.collection('companies').doc(id).collection('orders').get(),
        adminDb.collection('companies').doc(id).collection('reservations').get()
      ]);
      orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      reservations = reservationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    const ordersByCustomer: Record<string, any[]> = {};
    for (const order of orders) {
      if (!ordersByCustomer[order.customerId]) {
        ordersByCustomer[order.customerId] = [];
      }
      ordersByCustomer[order.customerId].push(order);
    }

    const reservationsByCustomer: Record<string, any[]> = {};
    for (const reservation of reservations) {
      if (!reservationsByCustomer[reservation.customerId]) {
        reservationsByCustomer[reservation.customerId] = [];
      }
      reservationsByCustomer[reservation.customerId].push(reservation);
    }

    const enrichedCustomers = customers.map(customer => {
      const customerOrders = ordersByCustomer[customer.customerId] || [];
      const customerReservations = reservationsByCustomer[customer.customerId] || [];
      
      const lifetimeValue = customerOrders.reduce((sum, order: any) => sum + (Number(order.total) || 0), 0);

      return {
        ...customer,
        orders: customerOrders,
        reservations: customerReservations,
        lifetimeValue
      };
    });

    return NextResponse.json({ customers: enrichedCustomers });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}
