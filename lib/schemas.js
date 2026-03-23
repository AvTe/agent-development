import { z } from 'zod';

export const jobAnalysisSchema = z.object({
  title: z.string(),
  company: z.string(),
  location: z.string(),
  type: z.string(),
  required_skills: z.array(z.string()),
  preferred_skills: z.array(z.string()),
  experience_required: z.string(),
  education_required: z.string().nullable(),
  responsibilities: z.array(z.string()),
  benefits: z.array(z.string()),
  summary: z.string(),
});
