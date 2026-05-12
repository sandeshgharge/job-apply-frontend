export interface CoverLetterSectionPrompt {
  id: string;
  title: string;   // matches section title in cover letter component
  prompt: string;  // pre-defined prompt text copied to cover letter on use
}

export interface CoverLetterPrompts {
  commonPrompt: string;                       // global prompt applied to all sections
  sectionPrompts: CoverLetterSectionPrompt[]; // per-section prompt overrides
}

export interface CoverLetterSection {
  id: string;
  title: string;
  content: string;
  sectionPrompt: string; // section-specific instruction
  loading: boolean;
}