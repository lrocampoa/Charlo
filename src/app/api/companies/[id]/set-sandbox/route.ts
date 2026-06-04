import { NextResponse } from 'next/server';
import { updateCompany } from '@/lib/firebase/dbUtils';
import { verifyOwnership } from '@/lib/firebase/admin';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Verify user owns this company
    const isOwner = await verifyOwnership(request, id);
    if (!isOwner) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    // Set subscription to free/sandbox
    const updated = await updateCompany(id, { 
      'subscription.tier': 'free',
      'subscription.status': 'active'
    });
    
    if (!updated) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error setting sandbox tier:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
