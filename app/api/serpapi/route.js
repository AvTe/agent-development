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

async function runSearch(query, location = '', start = '0') {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    return { error: 'SerpApi key is not configured', status: 500 };
  }

  const params = new URLSearchParams({
    engine: 'google_jobs',
    q: query,
    api_key: apiKey,
    start,
  });

  if (location.trim()) {
    params.set('location', location);
  }

  const serpRes = await fetch(`https://serpapi.com/search?${params.toString()}`);

  if (!serpRes.ok) {
    const errText = await serpRes.text();
    console.error('SerpAPI error:', serpRes.status, errText);
    return { error: 'Failed to fetch jobs from Google Jobs', status: 502 };
  }

  const data = await serpRes.json();
  return {
    ...data,
    jobs: normalizeJobs(data),
    query,
    location,
  };
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const query = typeof body.query === 'string' ? body.query.trim() : '';
    const location = typeof body.location === 'string' ? body.location.trim() : '';
    const start = typeof body.start === 'string' ? body.start : '0';

    if (!query || query.length < 2) {
      return NextResponse.json({ error: 'Query is required (min 2 characters)' }, { status: 400 });
    }

    const data = await runSearch(query, location, start);
    if (data.error) {
      return NextResponse.json({ error: data.error }, { status: data.status || 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('SerpApi error:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs from SerpApi' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const location = searchParams.get('location') || '';
    const start = searchParams.get('start') || '0';

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ error: 'Query is required (min 2 characters)' }, { status: 400 });
    }

    const data = await runSearch(query.trim(), location.trim(), start);
    if (data.error) {
      return NextResponse.json({ error: data.error }, { status: data.status || 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('SerpApi error:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs from SerpApi' }, { status: 500 });
  }
}
