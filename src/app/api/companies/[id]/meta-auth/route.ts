import { NextResponse } from 'next/server';
import { updateCompany } from '@/lib/firebase/dbUtils';
import { verifyOwnership } from '@/lib/firebase/admin';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Verify user owns this company
    const isOwner = await verifyOwnership(request, id);
    if (!isOwner) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const body = await request.json();
    const { accessToken } = body;

    if (!accessToken) {
      return NextResponse.json({ error: "No access token provided" }, { status: 400 });
    }

    const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;

    if (!appId || !appSecret) {
      console.error("Missing Facebook App ID or Secret in environment variables.");
      // We will still save the short-lived token if env vars are missing, just as a fallback
      const updated = await updateCompany(id, { metaAccessToken: accessToken });
      return NextResponse.json({ success: true, warning: "Saved short-lived token due to missing env vars", data: updated });
    }

    // Exchange short-lived token for long-lived token
    const url = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${accessToken}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.error("Error exchanging token:", data.error);
      return NextResponse.json({ error: "Failed to exchange token with Meta" }, { status: 500 });
    }

    const longLivedToken = data.access_token;

    // Update company with long-lived token
    // In a full implementation, we would also query /me/accounts and /me/businesses to get WABA, Page, and IG IDs.
    const updated = await updateCompany(id, { 
      metaAccessToken: longLivedToken
    });
    
    if (!updated) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error in meta-auth route:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
