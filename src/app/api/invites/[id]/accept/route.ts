import { NextResponse } from 'next/server';
import { acceptInvite } from '@/lib/firebase/dbUtils';
import { verifyIdToken } from '@/lib/firebase/admin';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await verifyIdToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // In Next.js 15+, params should be awaited if they are treated as promises
    const resolvedParams = await params;
    const inviteId = resolvedParams.id;
    
    const result = await acceptInvite(inviteId, userId);
    
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Error accepting invite:", error);
    return NextResponse.json({ error: error.message || "Failed to accept invite" }, { status: 400 });
  }
}
