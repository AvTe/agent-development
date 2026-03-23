import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { createRequire } from 'module';
import getDb from '@/db/database';
import { parseResume } from '@/lib/resumeParser';

// Use CJS require to ensure pdf-parse is loaded as a callable function in both dev and prod.
const require = createRequire(import.meta.url);
const pdfModule = require('pdf-parse');
const pdfParse = pdfModule.default || pdfModule;

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('resume') || formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No resume file provided' }, { status: 400 });
    }

    if (typeof file.name !== 'string' || !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 });
    }

    // Read file buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save file to uploads/
    const uploadsDir = path.join(process.cwd(), 'uploads');
    await mkdir(uploadsDir, { recursive: true });
    const filePath = path.join(uploadsDir, `${Date.now()}-${file.name}`);
    await writeFile(filePath, buffer);

    // Extract text from PDF
    const pdfData = await pdfParse(buffer);
    const rawText = pdfData.text;

    if (!rawText || rawText.trim().length < 50) {
      return NextResponse.json({ error: 'Could not extract enough text from PDF. Make sure it is not a scanned image.' }, { status: 400 });
    }

    // Parse with OpenAI
    const parsedData = await parseResume(rawText);

    // Store in database
    const db = getDb();
    const stmt = db.prepare(
      'INSERT INTO resumes (filename, raw_text, parsed_data) VALUES (?, ?, ?)'
    );
    const result = stmt.run(file.name, rawText, JSON.stringify(parsedData));

    return NextResponse.json({
      id: result.lastInsertRowid,
      filename: file.name,
      parsed_data: parsedData,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Resume upload error:', error);
    return NextResponse.json({ error: 'Failed to process resume: ' + error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const db = getDb();
    const resumes = db.prepare('SELECT id, filename, parsed_data, created_at FROM resumes ORDER BY created_at DESC').all();

    return NextResponse.json(
      resumes.map((r) => ({
        ...r,
        parsed_data: JSON.parse(r.parsed_data),
      }))
    );
  } catch (error) {
    console.error('Resume fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch resumes' }, { status: 500 });
  }
}
