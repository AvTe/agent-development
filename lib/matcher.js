import kimi from './kimi';

export async function matchResumeToJob(resumeData, jobData) {
  const response = await kimi.post('/chat/completions', {
    model: 'moonshotai/kimi-k2.5',
    temperature: 0.3,
    max_tokens: 2048,
    chat_template_kwargs: { thinking: false },
    messages: [
      {
        role: 'system',
        content: `You are a job matching analyst. Compare the candidate's resume against the job description and provide a detailed match analysis. Return valid JSON with exactly these fields:
{
  "match_score": 78,
  "verdict": "Strong Match" | "Good Match" | "Partial Match" | "Weak Match",
  "strengths": ["Matching skill or experience 1", "Matching skill or experience 2"],
  "gaps": ["Missing skill or qualification 1", "Missing skill or qualification 2"],
  "suggestions": ["Actionable suggestion to improve candidacy 1", "Suggestion 2"],
  "fit_summary": "2-3 sentence summary explaining why the candidate is or isn't a good fit"
}

Scoring guide:
- 80-100: Strong Match - meets most requirements, relevant experience
- 60-79: Good Match - meets many requirements, some gaps
- 40-59: Partial Match - meets some requirements, significant gaps
- 0-39: Weak Match - does not meet most requirements

Be honest and constructive. Focus on actionable insights.`
      },
      {
        role: 'user',
        content: `## CANDIDATE RESUME:\n${JSON.stringify(resumeData, null, 2)}\n\n## JOB DESCRIPTION:\n${JSON.stringify(jobData, null, 2)}`
      }
    ]
  });

  let content = response.data.choices[0].message.content;
  content = content.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '');
  
  return JSON.parse(content.trim());
}


