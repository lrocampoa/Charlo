import { NextResponse } from 'next/server';
import { adminDb, adminAuth, verifyIdToken } from '@/lib/firebase/admin';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await verifyIdToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const resolvedParams = await params;
    const companyId = resolvedParams.id;
    
    if (!adminDb || !adminAuth) {
      return NextResponse.json({ error: "Firebase not configured" }, { status: 500 });
    }

    const doc = await adminDb.collection('companies').doc(companyId).get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const data = doc.data();
    // Only owner or existing team member can view the team
    const isOwner = data?.ownerId === userId;
    const isMember = data?.teamMembers?.includes(userId);
    
    if (!isOwner && !isMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const teamMemberIds = data?.teamMembers || [];
    
    if (teamMemberIds.length === 0) {
      return NextResponse.json({ members: [] });
    }

    // Resolve emails
    const userIdentifiers = teamMemberIds.map((id: string) => ({ uid: id }));
    const getUsersResult = await adminAuth.getUsers(userIdentifiers);
    
    const members = getUsersResult.users.map(u => ({
      id: u.uid,
      email: u.email || 'Unknown Email'
    }));

    return NextResponse.json({ members });
  } catch (error: any) {
    console.error("Error fetching team members:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch team members" }, { status: 500 });
  }
}
