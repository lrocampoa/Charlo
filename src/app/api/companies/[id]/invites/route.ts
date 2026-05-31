import { NextResponse } from 'next/server';
import { generateInviteLink } from '@/lib/firebase/dbUtils';
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
    const companyId = resolvedParams.id;
    
    const invite = await generateInviteLink(companyId, userId);
    
    return NextResponse.json(invite, { status: 201 });
  } catch (error: any) {
    console.error("Error generating invite:", error);
    return NextResponse.json({ error: error.message || "Failed to generate invite" }, { status: 500 });
  }
}
