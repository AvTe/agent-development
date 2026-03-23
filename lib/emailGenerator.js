import kimi from './kimi';

function stripCodeFences(content) {
  return content.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '');
}

export function normalizeTone(tone) {
  const mapping = {
    professional: 'formal',
    formal: 'formal',
    casual: 'casual',
    enthusiastic: 'casual',
    concise: 'concise',
    bold: 'confident',
    confident: 'confident',
  };

  return mapping[String(tone || '').toLowerCase()] || 'formal';
}

export async function generateEmail(resumeData, jobData, matchAnalysis, tone = 'formal') {
  const normalizedTone = normalizeTone(tone);
  const toneInstructions = {
    formal: 'Write in a professional, formal tone. Be respectful and structured.',
    casual: 'Write in a friendly, approachable tone. Be warm but still professional.',
    confident: 'Write in a bold, confident tone. Highlight achievements assertively without being arrogant.',
    concise: 'Write in a concise, efficient tone. Keep the message short, direct, and easy to skim.',
  };

  const response = await kimi.post('/chat/completions', {
    model: 'moonshotai/kimi-k2.5',
    temperature: 0.7,
    max_tokens: 2048,
    chat_template_kwargs: { thinking: false },
    messages: [
      {
        role: 'system',
        content: `You are an expert cold email writer for job applications. Write a personalized, compelling email that:
 References the specific role and company
 Highlights the candidate's most relevant skills and experience for THIS role
 Mentions 1-2 specific projects or achievements that relate to the job
- Sounds genuinely human (not AI-generated or templated)
- Is concise (under 200 words for the body)
- Has a clear call to action

Tone: ${toneInstructions[normalizedTone] || toneInstructions.formal}

Return valid JSON with these fields:
{
  "subject": "Email subject line",
  "body": "Full email body text",
  "tone": "${tone}"
}`
      },
      {
        role: 'user',
        content: `## CANDIDATE PROFILE:\n${JSON.stringify(resumeData, null, 2)}\n\n## TARGET JOB:\n${JSON.stringify(jobData, null, 2)}\n\n## MATCH ANALYSIS:\n${JSON.stringify(matchAnalysis, null, 2)}`
      }
    ]
  });

  let content = response.data.choices[0].message.content;
  content = stripCodeFences(content);

  const parsed = JSON.parse(content.trim());
  return {
    subject: parsed.subject || 'Untitled outreach draft',
    body: parsed.body || '',
    tone,
  };
}
