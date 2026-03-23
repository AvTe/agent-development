import kimi from './kimi';

function stripCodeFences(content) {
  return content.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '');
}

function normalizeExperience(experience) {
  if (!Array.isArray(experience)) return [];

  return experience.map((item) => {
    const title = item?.title || item?.job_title || '';
    const highlights = Array.isArray(item?.highlights)
      ? item.highlights.filter(Boolean)
      : Array.isArray(item?.responsibilities)
        ? item.responsibilities.filter(Boolean)
        : [];

    return {
      title,
      job_title: item?.job_title || title,
      company: item?.company || '',
      duration: item?.duration || '',
      highlights,
      responsibilities: item?.responsibilities || highlights.join(' | '),
    };
  });
}

function normalizeEducation(education) {
  if (!Array.isArray(education)) return [];

  return education.map((item) => ({
    degree: item?.degree || '',
    institution: item?.institution || item?.school || '',
    school: item?.school || item?.institution || '',
    year: item?.year || item?.grad_year || '',
    grad_year: item?.grad_year || item?.year || '',
  }));
}

export function normalizeResumeData(parsed) {
  const data = parsed && typeof parsed === 'object' ? parsed : {};

  return {
    name: data.name || '',
    email: data.email ?? null,
    phone: data.phone ?? null,
    location: data.location ?? null,
    summary: data.summary || '',
    skills: Array.isArray(data.skills) ? data.skills : [],
    experience: normalizeExperience(data.experience),
    education: normalizeEducation(data.education),
    projects: Array.isArray(data.projects) ? data.projects : [],
    total_experience_years: Number.isFinite(Number(data.total_experience_years))
      ? Number(data.total_experience_years)
      : 0,
  };
}

export async function parseResume(rawText) {
  const response = await kimi.post('/chat/completions', {
    model: 'moonshotai/kimi-k2.5',
    temperature: 0.2,
    max_tokens: 2048,
    chat_template_kwargs: { thinking: false },
    messages: [
      {
        role: 'system',
        content: `You are a resume parser. Extract structured data from the resume text and return valid JSON with exactly these fields:
{
  "name": "Full name",
  "email": "Email address or null",
  "phone": "Phone number or null",
  "location": "City/State or null",
  "summary": "Brief professional summary (1-2 sentences)",
  "skills": ["skill1", "skill2"],
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "duration": "e.g. Jan 2022 - Present",
      "highlights": ["key achievement 1", "key achievement 2"]
    }
  ],
  "education": [
    {
      "degree": "Degree name",
      "institution": "School name",
      "year": "Graduation year or range"
    }
  ],
  "projects": [
    {
      "name": "Project name",
      "description": "Brief description",
      "tech": ["tech1", "tech2"]
    }
  ],
  "total_experience_years": 2
}
Fill in what you can extract. Use null for missing fields. Be accurate.`
      },
      {
        role: 'user',
        content: rawText
      }
    ]
  });

  let content = response.data.choices[0].message.content;
  content = stripCodeFences(content);

  const parsed = JSON.parse(content.trim());
  return normalizeResumeData(parsed);
}


