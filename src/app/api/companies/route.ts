import { NextResponse } from 'next/server';
import { getCompanies, createCompany, getCompanyByWhatsAppId, getCompanyByFacebookPageId, getUser, createUser, saveDataSource } from '@/lib/firebase/dbUtils';
import { verifyIdToken, adminDb, adminAuth } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];
    
    // We need the email from the decoded token to initialize the user if missing
    let decodedToken;
    try {
      decodedToken = await adminAuth!.verifyIdToken(token);
    } catch (e) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = decodedToken.uid;
    
    // Ensure the user document exists
    let userDoc = await getUser(userId);
    if (!userDoc) {
      userDoc = await createUser(userId, decodedToken.email || '');
    }
    
    const companies = await getCompanies(userId);
    return NextResponse.json({ companies, user: userDoc });
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
    
    // ENFORCE BUSINESS LIMITS
    const userDoc: any = await getUser(userId);
    const tier = userDoc?.subscription?.tier || 'free';
    const status = userDoc?.subscription?.status || 'pending';
    
    const maxBusinesses = {
      'free': 100, // Temporarily increased for testing
      'starter': 2,
      'growth': 5,
      'pro': 10
    }[tier as 'free'|'starter'|'growth'|'pro'] || 100;

    // Fetch existing companies owned by this user
    const existingCompanies = await getCompanies(userId);
    const ownedCompanies = existingCompanies.filter((c: any) => c.ownerId === userId && c.status !== 'draft' && !c.id.startsWith('demo_'));

    if (ownedCompanies.length >= maxBusinesses && (status === 'active' || status === 'trialing')) {
      return NextResponse.json({ 
        error: `Has alcanzado el límite de empresas para tu plan (${tier.toUpperCase()}). Límite: ${maxBusinesses}.`
      }, { status: 403 });
    }
    
    // Extract initial data sources and draftId
    const { initialDataSources, draftId, ...companyData } = body;

    let newCompany;
    
    if (draftId) {
      // Update the existing draft to be an active company
      const db = adminDb;
      if (db) {
        // Remove draftData and set status to active
        await db.collection('companies').doc(draftId).update({
          ...companyData,
          status: 'active',
          draftData: FieldValue.delete(),
          lastUpdated: new Date().toISOString()
        });
        const doc = await db.collection('companies').doc(draftId).get();
        newCompany = { id: doc.id, ...doc.data() };
      }
    } else {
      // Create a brand new company
      newCompany = await createCompany({
        ...companyData,
        status: 'active',
        ownerId: userId
      });
    }

    // Save extracted initial Data Sources from onboarding to the subcollection
    if (initialDataSources && Array.isArray(initialDataSources) && newCompany) {
      for (const source of initialDataSources) {
        // Since we already appended the content to knowledgeBase, we just save the metadata and hash for caching
        await saveDataSource(newCompany.id, {
          name: source.url,
          type: source.docType || 'website',
          extractedText: "Contenido inicial extraído y adjuntado a la Base de Conocimientos.",
          contentHash: source.contentHash
        });
      }
    }
    
    return NextResponse.json(newCompany, { status: 201 });
  } catch (error) {
    console.error("Error creating company:", error);
    return NextResponse.json({ error: "Failed to create company" }, { status: 500 });
  }
}
