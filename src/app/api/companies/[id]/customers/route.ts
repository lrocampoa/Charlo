import { NextResponse } from 'next/server';
import { getCustomersByCompany } from '@/lib/firebase/dbUtils';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const customers = await getCustomersByCompany(id);
    return NextResponse.json({ customers });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}
