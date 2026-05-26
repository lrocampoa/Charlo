import { NextResponse } from 'next/server';
import { getCompanies, createCompany } from '@/lib/firebase/dbUtils';

export async function GET(request: Request) {
  try {
    // In a real app we'd get the uid from the auth token in headers. 
    // Using MOCK_USER_ID for now since Auth is bypassed.
    const userId = "MOCK_USER_ID"; 
    
    const companies = await getCompanies(userId);
    return NextResponse.json({ companies });
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json({ error: "Failed to fetch companies" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = "MOCK_USER_ID";
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
