import { NextResponse } from 'next/server';
import { updateCompany, deleteCompany, getCompanyByWhatsAppId, getCompanyByFacebookPageId } from '@/lib/firebase/dbUtils';
import { verifyOwnership, verifyActiveSubscription } from '@/lib/firebase/admin';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    const isOwner = await verifyOwnership(request, id);
    if (!isOwner) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const isActive = await verifyActiveSubscription(id);
    if (!isActive) return NextResponse.json({ error: "Subscription inactive or past due." }, { status: 402 });

    const body = await request.json();

    // Prevent Duplicate WhatsApp/Facebook IDs
    if (body.whatsappPhoneNumberId) {
      const existingWa = await getCompanyByWhatsAppId(body.whatsappPhoneNumberId);
      if (existingWa && existingWa.id !== id) {
        return NextResponse.json({ error: "This WhatsApp Phone ID is already connected to another business." }, { status: 400 });
      }
    }

    const updated = await updateCompany(id, body);
    
    if (!updated) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }
    
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating company:", error);
    return NextResponse.json({ error: "Failed to update company" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    const isOwner = await verifyOwnership(request, id);
    if (!isOwner) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const isActive = await verifyActiveSubscription(id);
    if (!isActive) return NextResponse.json({ error: "Subscription inactive or past due." }, { status: 402 });

    await deleteCompany(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting company:", error);
    return NextResponse.json({ error: "Failed to delete company" }, { status: 500 });
  }
}
