import { NextResponse } from 'next/server';
import { getCustomersByCompany } from '@/lib/firebase/dbUtils';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const customers = await getCustomersByCompany(params.id);
    return NextResponse.json({ customers });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}
