import kimi from './kimi';

function stripCodeFences(content) {
  return content.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '');
}

export function normalizeJobAnalysis(parsed) {
  const data = parsed && typeof parsed === 'object' ? parsed : {};
  const benefits = Array.isArray(data.benefits) ? data.benefits.filter(Boolean) : [];

  return {
    title: data.title || '',
    company: data.company || 'Unknown',
    company_name: data.company_name || data.company || 'Unknown',
    location: data.location || 'Not specified',
    type: data.type || 'Not specified',
    required_skills: Array.isArray(data.required_skills) ? data.required_skills : [],
    preferred_skills: Array.isArray(data.preferred_skills) ? data.preferred_skills : [],
    experience_required: data.experience_required || '',
    education_required: data.education_required ?? null,
    responsibilities: Array.isArray(data.responsibilities) ? data.responsibilities : [],
    benefits,
    perks: Array.isArray(data.perks) ? data.perks.filter(Boolean) : benefits,
    summary: data.summary || '',
  };
}

export async function analyzeJob(rawDescription) {
  const response = await kimi.post('/chat/completions', {
    model: 'moonshotai/kimi-k2.5',
    temperature: 0.2,
    max_tokens: 2048,
    chat_template_kwargs: { thinking: false },
    messages: [
      {
        role: 'system',
        content: `You are a job description analyzer. Extract structured data from the job description and return valid JSON with exactly these fields:
{
  "title": "Job title",
  "company": "Company name (or 'Unknown' if not mentioned)",
  "location": "Location or 'Remote' or 'Not specified'",
  "type": "Full-time / Part-time / Contract / Internship",
  "required_skills": ["skill1", "skill2"],
  "preferred_skills": ["skill1", "skill2"],
  "experience_required": "e.g. 2-4 years",
  "education_required": "e.g. Bachelor's in CS or null",
  "responsibilities": ["responsibility1", "responsibility2"],
  "benefits": ["benefit1", "benefit2"],
  "summary": "Brief 1-2 sentence summary of the role"
}
Be accurate and extract only what's explicitly stated.`
      },
      {
        role: 'user',
        content: rawDescription
      }
    ]
  });

  let content = response.data.choices[0].message.content;
  content = stripCodeFences(content);

  try {
    return normalizeJobAnalysis(JSON.parse(content.trim()));
  } catch (error) {
    console.error('Failed to parse JSON from job analyzer:', content);
    throw new Error('Could not parse job analysis data from the AI. The format was invalid.');
  }
}
