import { NextRequest, NextResponse } from 'next/server';

const BASE_ID = process.env.AIRTABLE_BASE_ID!;
const TOKEN = process.env.AIRTABLE_TOKEN!;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  const { tableId } = await params;
  const searchParams = request.nextUrl.searchParams;

  const url = `https://api.airtable.com/v0/${BASE_ID}/${tableId}?${searchParams.toString()}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${TOKEN}` },
    cache: 'no-store',
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }

  return NextResponse.json(data);
}
