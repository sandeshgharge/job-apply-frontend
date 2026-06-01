
export interface CoverLetterPrompts {
  commonPrompt: string;                       // global prompt applied to all sections
  sectionPrompts: CoverLetterSection[]; // per-section prompt overrides
}

export interface CoverLetterSection {
  id: string;
  title: string;
  content: string;
  sectionPrompt: string; // section-specific instruction
  loading: boolean;
}

export interface CoverLetterInfo {
  id: string;
  title: string;
  userId: string
  clData: CoverLetterPrompts;
  version: string;
}

export interface CoverLetterDocInfo {

  applicantName: string;
  applicantLocation: string;
  applicantEmail: string;
  companyName: string;
  companyLocation: string;
  contactName?: string;
  date: string;
  role: string;
  paragraphs : string[];
  signUrl : string;
}

export const defaultcl = (): CoverLetterInfo => ({
    id: '',
    title: '',
    userId: '',
    version: '',
    clData: {
      commonPrompt: '',
      sectionPrompts: [
        { id: '1', title: 'Introduction', content: '', sectionPrompt: '', loading: false },
        { id: '2', title: 'Why this company?', content: '', sectionPrompt: '', loading: false },
        { id: '3', title: 'Why me?', content: '', sectionPrompt: '', loading: false },
        { id: '4', title: 'Closing', content: '', sectionPrompt: '', loading: false }
      ]
    }
  });

