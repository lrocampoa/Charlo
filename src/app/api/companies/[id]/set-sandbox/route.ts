import { NextResponse } from 'next/server';
import { adminDb, verifyOwnership } from '@/lib/firebase/admin';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Verify user owns this company
    const isOwner = await verifyOwnership(request, id);
    if (!isOwner) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    // Fetch ownerId
    const companyDoc = await adminDb!.collection('companies').doc(id).get();
    const ownerId = companyDoc.data()?.ownerId;

    if (!ownerId) {
       return NextResponse.json({ error: "Company has no owner" }, { status: 400 });
    }

    // Set subscription to free/sandbox on USER
    await adminDb!.collection('users').doc(ownerId).update({ 
      'subscription.tier': 'free',
      'subscription.status': 'active'
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error setting sandbox tier:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
