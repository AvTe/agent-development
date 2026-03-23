import { NextResponse } from 'next/server';
import getDb from '@/db/database';
import { analyzeJob } from '@/lib/jobAnalyzer';
import { jobAnalysisSchema } from '@/lib/schemas';

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawDescription = typeof body.description === 'string' ? body.description : '';

    if (!rawDescription) {
      return NextResponse.json({ error: 'Job description is required' }, { status: 400 });
    }

    const description = rawDescription.trim();

    if (description.length < 50) {
      return NextResponse.json({ error: 'Job description is too short (min 50 characters)' }, { status: 400 });
    }

    if (description.length > 10000) {
      return NextResponse.json({ error: 'Job description is too long (max 10000 characters)' }, { status: 400 });
    }

    // Analyze with OpenAI
    const parsedData = await analyzeJob(description);
    const validationResult = jobAnalysisSchema.safeParse(parsedData);

    if (!validationResult.success) {
      console.error('Job analysis validation error:', validationResult.error);
      return NextResponse.json({ error: 'Failed to validate job analysis data.' }, { status: 500 });
    }

    // Store in database
    const db = getDb();
    const stmt = db.prepare(
      'INSERT INTO jobs (title, company, raw_description, parsed_data) VALUES (?, ?, ?, ?)'
    );
    const result = stmt.run(
      validationResult.data.title || 'Untitled',
      validationResult.data.company || 'Unknown',
      description,
      JSON.stringify(parsedData)
    );

    return NextResponse.json({
      id: result.lastInsertRowid,
      title: parsedData.title,
      company: parsedData.company,
      parsed_data: parsedData,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Job analysis error:', error);
    return NextResponse.json({ error: 'Failed to analyze job: ' + error.message }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10) || 1, 1);
    const limit = Math.max(parseInt(searchParams.get('limit') || '10', 10) || 10, 1);
    const offset = (page - 1) * limit;

    const db = getDb();

    const totalJobs = db.prepare('SELECT COUNT(*) as count FROM jobs').get().count;
    const totalPages = Math.ceil(totalJobs / limit);

    const jobs = db
      .prepare('SELECT id, title, company, parsed_data, created_at FROM jobs ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .all(limit, offset);

    const normalizedJobs = jobs.map((j) => {
      const parsedData = safeJsonParse(j.parsed_data, {});
      return {
        ...j,
        company_name: j.company,
        parsed_data: parsedData,
      };
    });

    return NextResponse.json({
      jobs: normalizedJobs,
      data: normalizedJobs,
      pagination: {
        page,
        limit,
        totalJobs,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Jobs fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}
