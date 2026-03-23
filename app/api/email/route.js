import { NextResponse } from 'next/server';
import getDb from '@/db/database';
import { generateEmail } from '@/lib/emailGenerator';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const match_id = Number(body.match_id ?? body.matchId);
    const tone = body.tone || 'formal';

    if (!Number.isInteger(match_id) || match_id <= 0) {
      return NextResponse.json({ error: 'match_id is required' }, { status: 400 });
    }

    const validTones = ['formal', 'casual', 'confident', 'professional', 'enthusiastic', 'concise', 'bold'];
    if (!validTones.includes(String(tone).toLowerCase())) {
      return NextResponse.json({ error: `Invalid tone. Use: ${validTones.join(', ')}` }, { status: 400 });
    }

    const db = getDb();

    // Fetch match with resume and job data
    const match = db.prepare(`
      SELECT m.*, r.parsed_data as resume_data, j.parsed_data as job_data
      FROM matches m
      JOIN resumes r ON m.resume_id = r.id
      JOIN jobs j ON m.job_id = j.id
      WHERE m.id = ?
    `).get(match_id);

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const resumeData = JSON.parse(match.resume_data);
    const jobData = JSON.parse(match.job_data);
    const matchAnalysis = JSON.parse(match.analysis);

    // Generate email via the LLM provider
    const emailResult = await generateEmail(resumeData, jobData, matchAnalysis, tone);
    const normalizedTone = emailResult.tone || tone;

    // Store email
    const stmt = db.prepare(
      'INSERT INTO emails (match_id, subject, body, tone) VALUES (?, ?, ?, ?)'
    );
    const result = stmt.run(match_id, emailResult.subject, emailResult.body, normalizedTone);

    return NextResponse.json({
      id: result.lastInsertRowid,
      match_id,
      subject: emailResult.subject,
      body: emailResult.body,
      tone: normalizedTone,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Email generation error:', error);
    return NextResponse.json({ error: 'Failed to generate email: ' + error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const db = getDb();
    const emails = db.prepare(`
      SELECT e.*, m.score as match_score, j.title as job_title, j.company as job_company
      FROM emails e
      JOIN matches m ON e.match_id = m.id
      JOIN jobs j ON m.job_id = j.id
      ORDER BY e.created_at DESC
    `).all();

    return NextResponse.json(emails);
  } catch (error) {
    console.error('Email fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 });
  }
}
