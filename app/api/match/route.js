import { NextResponse } from 'next/server';
import getDb from '@/db/database';
import { matchResumeToJob } from '@/lib/matcher';

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
    const resume_id = Number(body.resume_id ?? body.resumeId);
    const job_id = Number(body.job_id ?? body.jobId);

    if (!Number.isInteger(resume_id) || !Number.isInteger(job_id) || resume_id <= 0 || job_id <= 0) {
      return NextResponse.json({ error: 'resume_id and job_id are required' }, { status: 400 });
    }

    const db = getDb();

    // Fetch resume and job
    const resume = db.prepare('SELECT * FROM resumes WHERE id = ?').get(resume_id);
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(job_id);

    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const resumeData = safeJsonParse(resume.parsed_data, null);
    const jobData = safeJsonParse(job.parsed_data, null);

    if (!resumeData || !jobData) {
      return NextResponse.json({ error: 'Stored resume or job data is invalid' }, { status: 500 });
    }

    // Run matching via OpenAI
    const analysis = await matchResumeToJob(resumeData, jobData);
    const matchScore = Number.isFinite(Number(analysis.match_score))
      ? Number(analysis.match_score)
      : Number.isFinite(Number(analysis.score))
        ? Number(analysis.score)
        : 0;
    const normalizedAnalysis = {
      ...analysis,
      match_score: matchScore,
      score: matchScore,
      strengths: Array.isArray(analysis.strengths) ? analysis.strengths : [],
      gaps: Array.isArray(analysis.gaps) ? analysis.gaps : [],
      suggestions: Array.isArray(analysis.suggestions) ? analysis.suggestions : [],
      fit_summary: analysis.fit_summary || '',
      verdict: analysis.verdict || 'Partial Match',
    };

    // Store match result
    const stmt = db.prepare(
      'INSERT INTO matches (resume_id, job_id, score, analysis) VALUES (?, ?, ?, ?)'
    );
    const result = stmt.run(resume_id, job_id, matchScore, JSON.stringify(normalizedAnalysis));

    return NextResponse.json({
      id: result.lastInsertRowid,
      resume_id: Number(resume_id),
      job_id: Number(job_id),
      score: matchScore,
      match_score: matchScore,
      analysis: normalizedAnalysis,
      resume_name: resumeData.name,
      job_title: jobData.title,
      job_company: jobData.company,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Match error:', error);
    return NextResponse.json({ error: 'Failed to match: ' + error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const db = getDb();
    const matches = db.prepare(`
      SELECT m.*, r.filename as resume_filename, r.parsed_data as resume_data,
             j.title as job_title, j.company as job_company
      FROM matches m
      JOIN resumes r ON m.resume_id = r.id
      JOIN jobs j ON m.job_id = j.id
      ORDER BY m.created_at DESC
    `).all();

    return NextResponse.json(
      matches.map((m) => ({
        ...m,
        match_score: m.score,
        analysis: safeJsonParse(m.analysis, {}),
        resume_data: safeJsonParse(m.resume_data, {}),
      }))
    );
  } catch (error) {
    console.error('Match fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
  }
}
