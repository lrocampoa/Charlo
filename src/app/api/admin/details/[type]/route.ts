import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';

export async function GET(request: Request, { params }: { params: Promise<{ type: string }> }) {
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
    const extraAdmins = ['lrocampoa@gmail.com'];
    const isCharloAdmin = userEmail.endsWith('@charlo.ai') || userEmail === allowedAdminEmail || extraAdmins.includes(userEmail);

    if (!isCharloAdmin) {
      return NextResponse.json({ error: "Forbidden - Admins Only" }, { status: 403 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
    }

    const { type } = await params;
    let data: any[] = [];

    switch (type) {
      case 'users':
        const listUsersResult = await adminAuth.listUsers();
        data = listUsersResult.users.map(u => ({
          id: u.uid,
          email: u.email,
          createdAt: u.metadata.creationTime,
          lastSignIn: u.metadata.lastSignInTime,
          provider: u.providerData[0]?.providerId || 'password'
        }));
        break;
      case 'businesses':
        const companiesSnapshot = await adminDb.collection('companies').get();
        data = companiesSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || 'N/A',
          industry: doc.data().industry || 'N/A',
          createdAt: doc.data().createdAt?.toDate()?.toISOString() || 'N/A'
        }));
        break;
      case 'conversations':
        const sessionsSnapshot = await adminDb.collection('sessions').get();
        data = sessionsSnapshot.docs.map(doc => ({
          id: doc.id,
          companyId: doc.data().companyId || 'N/A',
          platform: doc.data().platform || 'web',
          status: doc.data().status || 'unknown',
          lastMessage: doc.data().lastMessage || '',
          updatedAt: doc.data().updatedAt?.toDate()?.toISOString() || 'N/A'
        }));
        break;
      case 'orders':
        const ordersSnapshot = await adminDb.collectionGroup('orders').get();
        data = ordersSnapshot.docs.map(doc => ({
          id: doc.id,
          companyId: doc.ref.parent.parent?.id || 'N/A',
          amount: doc.data().amount || 0,
          status: doc.data().status || 'N/A',
          createdAt: doc.data().createdAt?.toDate()?.toISOString() || 'N/A'
        }));
        break;
      case 'reservations':
        const reservationsSnapshot = await adminDb.collectionGroup('reservations').get();
        data = reservationsSnapshot.docs.map(doc => ({
          id: doc.id,
          companyId: doc.ref.parent.parent?.id || 'N/A',
          customerName: doc.data().customerName || doc.data().name || 'N/A',
          date: doc.data().date || doc.data().datetime || doc.data().createdAt?.toDate()?.toISOString() || 'N/A',
          status: doc.data().status || 'N/A'
        }));
        break;
      case 'qa':
        const qaSnapshot = await adminDb.collectionGroup('knowledge_gaps').get();
        data = qaSnapshot.docs.map(doc => ({
          id: doc.id,
          companyId: doc.ref.parent.parent?.id || 'N/A',
          question: doc.data().question || 'N/A',
          status: doc.data().status || 'N/A',
          createdAt: doc.data().createdAt?.toDate()?.toISOString() || 'N/A'
        }));
        break;
      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    return NextResponse.json({ data });

  } catch (error) {
    console.error(`Admin details API error:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
