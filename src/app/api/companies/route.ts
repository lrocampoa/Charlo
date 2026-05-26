import { NextResponse } from 'next/server';
import { getCompanies, createCompany } from '@/lib/firebase/dbUtils';
import { verifyIdToken } from '@/lib/firebase/admin';

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
