import { NextResponse } from 'next/server';

function normalizeJobs(data) {
  return (data.jobs_results || []).map((job) => ({
    title: job.title || '',
    company: job.company_name || '',
    company_name: job.company_name || '',
    location: job.location || '',
    via: job.via || '',
    description: job.description || '',
    extensions: job.detected_extensions || {},
    thumbnail: job.thumbnail || null,
    job_id: job.job_id || null,
    apply_links: (job.apply_options || []).map((opt) => ({
      title: opt.title,
      link: opt.link,
    })),
    related_links: job.related_links || [],
  }));
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const location = searchParams.get('location') || '';
    const start = searchParams.get('start') || '0';

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ error: 'Search query is required (min 2 characters)' }, { status: 400 });
    }

    const params = new URLSearchParams({
      engine: 'google_jobs',
      q: query,
      api_key: process.env.SERPAPI_KEY,
      start,
    });

    if (location.trim()) {
      params.set('location', location);
    }

    const serpRes = await fetch(`https://serpapi.com/search?${params.toString()}`);

    if (!serpRes.ok) {
      const errText = await serpRes.text();
      console.error('SerpAPI error:', serpRes.status, errText);
      return NextResponse.json({ error: 'Failed to fetch jobs from Google Jobs' }, { status: 502 });
    }

    const data = await serpRes.json();

    return NextResponse.json({
      ...data,
      jobs: normalizeJobs(data),
      total: (data.jobs_results || []).length,
      query,
      location,
    });
  } catch (error) {
    console.error('Job search error:', error);
    return NextResponse.json({ error: 'Failed to search jobs: ' + error.message }, { status: 500 });
  }
}
