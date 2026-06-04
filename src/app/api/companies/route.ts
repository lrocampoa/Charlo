import { NextResponse } from 'next/server';
import { getCompanies, createCompany, getCompanyByWhatsAppId, getCompanyByFacebookPageId } from '@/lib/firebase/dbUtils';
import { verifyIdToken, adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(request: Request) {
  try {
    const userId = await verifyIdToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const companies = await getCompanies(userId);
    return NextResponse.json({ companies });
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json({ error: "Failed to fetch companies" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await verifyIdToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    
    // Auto-Join Existing Business
    if (body.whatsappPhoneNumberId) {
      const existingWa: any = await getCompanyByWhatsAppId(body.whatsappPhoneNumberId);
      if (existingWa) {
        // If the user is already the owner, just return it
        if (existingWa.ownerId === userId) {
          return NextResponse.json(existingWa, { status: 200 });
        }
        
        // Otherwise, add them to the teamMembers array
        if (adminDb) {
          await adminDb.collection('companies').doc(existingWa.id).update({
            teamMembers: FieldValue.arrayUnion(userId)
          });
          
          // Return the updated company
          return NextResponse.json({ ...existingWa, teamMembers: [...(existingWa.teamMembers || []), userId] }, { status: 200 });
        }
      }
    }
    
    const newCompany = await createCompany({
      ...body,
      ownerId: userId
    });
    
    return NextResponse.json(newCompany, { status: 201 });
  } catch (error) {
    console.error("Error creating company:", error);
    return NextResponse.json({ error: "Failed to create company" }, { status: 500 });
  }
}
