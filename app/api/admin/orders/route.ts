import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/adminSession';
import { getAllPOsWithVendorNames } from '@/services/filemakerService';

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1);
    const pageSize = Math.max(1, Number.parseInt(searchParams.get('pageSize') || '10', 10) || 10);
    const status = searchParams.get('status') || undefined;
    const poNumber = searchParams.get('poNumber') || undefined;

    const pagedOrders = await getAllPOsWithVendorNames(page, pageSize, {
      status,
      poNumber,
    });

    return NextResponse.json({ success: true, ...pagedOrders }, { status: 200 });
  } catch (error: unknown) {
    console.error('Admin Orders API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch purchase orders' },
      { status: 500 }
    );
  }
}
