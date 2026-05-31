import { NextResponse } from 'next/server';
import { adminDb, verifyIdToken } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const userId = await verifyIdToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const resolvedParams = await params;
    const companyId = resolvedParams.id;
    const memberId = resolvedParams.memberId;
    
    if (!adminDb) {
      return NextResponse.json({ error: "Firebase not configured" }, { status: 500 });
    }

    const docRef = adminDb.collection('companies').doc(companyId);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const data = doc.data();
    // Only the owner can remove a team member
    if (data?.ownerId !== userId) {
      return NextResponse.json({ error: "Forbidden: Only the owner can remove team members." }, { status: 403 });
    }

    await docRef.update({
      teamMembers: FieldValue.arrayRemove(memberId)
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error removing team member:", error);
    return NextResponse.json({ error: error.message || "Failed to remove team member" }, { status: 500 });
  }
}
