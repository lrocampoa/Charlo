import { NextResponse } from 'next/server';
import { adminDb, adminAuth, verifyIdToken } from '@/lib/firebase/admin';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ') || !adminAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];

    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (e) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = decodedToken.email;
    if (!userEmail) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowedAdminEmail = process.env.ADMIN_EMAIL;
    const isCharloAdmin = userEmail.endsWith('@charlo.ai') || userEmail === allowedAdminEmail;

    if (!isCharloAdmin) {
      return NextResponse.json({ error: "Forbidden - Admins Only" }, { status: 403 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
    }

    // 1. Total Users
    let totalUsers = 0;
    try {
        const listUsersResult = await adminAuth.listUsers();
        totalUsers = listUsersResult.users.length;
    } catch (e) {
        console.error("Error fetching users", e);
    }

    // 2. Total Businesses
    const companiesSnapshot = await adminDb.collection('companies').get();
    const totalBusinesses = companiesSnapshot.size;

    // 3. Conversations & AI metrics
    const sessionsSnapshot = await adminDb.collection('sessions').get();
    const totalConversations = sessionsSnapshot.size;

    let aiHandled = 0;
    let humanHandled = 0;
    const escalations: any[] = [];

    sessionsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.status === 'ai_handling') {
        aiHandled++;
      } else {
        humanHandled++;
        escalations.push({
            id: doc.id,
            companyId: data.companyId,
            status: data.status,
            reason: data.lastMessage || "No reason specified",
            platform: data.platform || 'unknown'
        });
      }
    });

    const aiResolutionRate = totalConversations > 0 ? Math.round((aiHandled / totalConversations) * 100) : 0;
    const hoursSaved = parseFloat(((aiHandled * 5) / 60).toFixed(1));

    // 4. Reservations
    const reservationsSnapshot = await adminDb.collectionGroup('reservations').get();
    const totalReservations = reservationsSnapshot.size;

    // 5. Orders/Sales
    const ordersSnapshot = await adminDb.collectionGroup('orders').get();
    const totalOrders = ordersSnapshot.size;

    // 6. QA / Gaps
    const gapsSnapshot = await adminDb.collectionGroup('knowledge_gaps').get();
    const totalQA = gapsSnapshot.size;

    return NextResponse.json({
        metrics: {
            totalUsers,
            totalBusinesses,
            totalConversations,
            aiResolutionRate,
            aiHandled,
            humanHandled,
            hoursSaved,
            totalReservations,
            totalOrders,
            totalQA
        },
        escalations
    });

  } catch (error) {
    console.error("Admin Analytics GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
