
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
  data: CoverLetterPrompts;
  createdAt: string;
  updatedAt: string;
  version: string;
}