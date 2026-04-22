import { NextRequest, NextResponse } from 'next/server';

const BASE_ID = process.env.AIRTABLE_BASE_ID!;
const TABLE_ID = 'tblGVEqH7KCo2GlXz';
const TOKEN = process.env.AIRTABLE_TOKEN!;

const AIRTABLE_FIELDS = [
  'session_id',
  'Numéro de session',
  'Nom de la formation',
  'Format (from Formation liée)',
  'Date de début de session',
  'Date de fin de session',
  "Date limite d'inscription",
  "Nombre d'inscrits",
  "Date 1ère soirée CV / Date Présentiel",
  "Date 2ème soirée CV",
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') ?? '').trim();
  const mode = searchParams.get('mode');

  if (query.length < 2) {
    return NextResponse.json([]);
  }

  const isSuggest = mode === 'suggest';
  const maxRecords = isSuggest ? 8 : 20;

  // Escape double quotes to prevent formula injection
  const safeQuery = query.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

  const cvFilter = `FIND("Classe virtuelle", ARRAYJOIN({Format (from Formation liée)})) > 0`;
  const sessionIdMatch = `FIND("${safeQuery}", {session_id}) = 1`;
  const nameMatch = `SEARCH(LOWER("${safeQuery}"), LOWER({Nom de la formation})) > 0`;
  const numSessionMatch = `SEARCH("${safeQuery}", {Numéro de session}) > 0`;

  const orClause = isSuggest
    ? `OR(${sessionIdMatch}, ${nameMatch})`
    : `OR(${sessionIdMatch}, ${nameMatch}, ${numSessionMatch})`;

  const dateFilter = `AND(
    {Date 1ère soirée CV / Date Présentiel},
    IS_AFTER({Date 1ère soirée CV / Date Présentiel}, TODAY()),
    OR(NOT({Date limite d'inscription}), NOT(IS_BEFORE({Date limite d'inscription}, TODAY())))
  )`;
  const filterFormula = `AND(${cvFilter}, ${dateFilter}, ${orClause})`;

  const params = new URLSearchParams();
  params.set('filterByFormula', filterFormula);
  params.set('maxRecords', String(maxRecords));
  params.set('sort[0][field]', "Date 1ère soirée CV / Date Présentiel");
  params.set('sort[0][direction]', 'asc');
  AIRTABLE_FIELDS.forEach((f) => params.append('fields[]', f));

  const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}?${params.toString()}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${TOKEN}` },
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.text();
    console.error('Airtable error', res.status, body);
    return NextResponse.json({ error: 'Airtable request failed' }, { status: res.status });
  }

  const data = await res.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessions = data.records.map((record: any) => ({
    id: record.id,
    session_id: record.fields['session_id'] ?? '',
    numeroSession: record.fields['Numéro de session'] ?? '',
    nomFormation: record.fields['Nom de la formation'] ?? '',
    format: record.fields['Format (from Formation liée)'] ?? [],
    dateDebut: record.fields['Date de début de session'] ?? '',
    dateFin: record.fields['Date de fin de session'] ?? '',
    dateLimiteInscription: record.fields["Date limite d'inscription"] ?? '',
    nombreInscrits: record.fields["Nombre d'inscrits"] ?? 0,
    date1ereCV: record.fields["Date 1ère soirée CV / Date Présentiel"] ?? '',
    date2emeCV: record.fields["Date 2ème soirée CV"] ?? '',
  }));

  sessions.sort((a: any, b: any) => {
    if (!a.date1ereCV) return 1;
    if (!b.date1ereCV) return -1;
    return a.date1ereCV < b.date1ereCV ? -1 : 1;
  });

  return NextResponse.json(sessions);
}
