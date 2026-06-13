export type JobStatus =
  | 'Open'
  | 'Applied'
  | '1st Interview'
  | '2nd Interview'
  | '3rd Interview'
  | 'Offer'
  | 'Rejected'
  | 'Withdrawn';

export interface SkillGroup {
  category: string;
  skills: string[];
}

export interface JobDetails {
  id?: string;
  userId?: string;
  companyName: string;
  role: string;
  companyLocation: string;
  appliedDate: string;
  status: JobStatus;
  salary?: string;
  contactName?: string;
  jobUrl?: string;
  notes?: string;
  jobDescription: string;
  coverLetterPdfUrl?: string;
  cvPdfUrl?: string;
}