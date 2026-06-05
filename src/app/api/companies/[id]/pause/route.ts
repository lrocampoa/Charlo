import { NextResponse } from 'next/server';
import { updateCompanyPauseStatus, getCompanies, getUser } from '@/lib/firebase/dbUtils';
import { verifyOwnership } from '@/lib/firebase/admin';
import { adminAuth } from '@/lib/firebase/admin';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    // Verify user owns this company
    const isOwner = await verifyOwnership(request, id);
    if (!isOwner) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing token' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth!.verifyIdToken(token);
    const userId = decodedToken.uid;

    const { isPaused } = await request.json();

    if (!isPaused) {
      // Trying to unpause. Enforce limit.
      const userDoc: any = await getUser(userId);
      const tier = userDoc?.subscription?.tier || 'free';
      const maxBusinesses = { 'free': 1, 'starter': 2, 'growth': 5, 'pro': 10 }[tier as 'free'|'starter'|'growth'|'pro'] || 1;

      const existingCompanies = await getCompanies(userId);
      const ownedCompanies = existingCompanies.filter((c: any) => c.ownerId === userId);
      const activeCount = ownedCompanies.filter((c: any) => !c.isPaused).length;

      if (activeCount >= maxBusinesses) {
        return NextResponse.json({ 
          error: `No puedes reactivar esta empresa. Haz alcanzado el límite de empresas activas para tu plan (${tier.toUpperCase()}). Límite: ${maxBusinesses}. Puedes pausar otra empresa primero.`
        }, { status: 403 });
      }
    }

    await updateCompanyPauseStatus(id, isPaused);
    
    return NextResponse.json({ success: true, isPaused });
  } catch (error) {
    console.error("Error toggling pause status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
