// ── Types ──────────────────────────────────────────────────────────────────

export interface CvAddress { city: string; state: string; country: string; }
export interface CvLinks { linkedin: string; github: string; portfolio: string; website: string; }
export interface CvPersonalInfo {
  firstName: string; lastName: string; headline: string;
  email: string; phone: string;
  address: CvAddress; links: CvLinks;
}
export interface CvLanguage { id: string; language: string; proficiency: string; }
export interface CvSkills {
  technical: string[]; soft: string[]; tools: string[]; frameworks: string[];
  languages: CvLanguage[];
}
export interface CvExperience {
  id: string; jobTitle: string; company: string; location: string;
  startDate: string; endDate: string; current: boolean;
  responsibilities: Array<{ id: string; text: string; include: boolean }>;
  include: boolean;
}
export interface CvEducation {
  id: string; degree: string; fieldOfStudy: string; institution: string;
  location: string; startDate: string; endDate: string; include: boolean;
}
export interface CvProject {
  id: string; title: string; description: string; technologies: string[];
  role: string; startDate: string; endDate: string; link: string; include: boolean;
}
export interface CvCertification {
  id: string; name: string; issuer: string; issueDate: string;
  expiryDate: string; credentialId: string; credentialUrl: string; include: boolean;
}
export interface CvAward {
  id: string; title: string; issuer: string; date: string; description: string; include: boolean;
}
export interface CvPublication {
  id: string; title: string; publisher: string; date: string; link: string; description: string; include: boolean;
}
export interface CvVolunteer {
  id: string; role: string; organization: string; location: string;
  startDate: string; endDate: string; description: string; include: boolean;
}
export interface CvReference {
  id: string; name: string; position: string; company: string; email: string; phone: string; include: boolean;
}
export interface CvCustomSection {
  id: string; sectionTitle: string; include: boolean;
  items: Array<{ id: string; text: string; include: boolean }>;
}

export interface CvData {
  personalInfo: CvPersonalInfo;
  summary: string;
  skills: CvSkills;
  experience: CvExperience[];
  education: CvEducation[];
  projects: CvProject[];
  certifications: CvCertification[];
  awards: CvAward[];
  publications: CvPublication[];
  volunteerExperience: CvVolunteer[];
  interests: string[];
  references: CvReference[];
  customSections: CvCustomSection[];
  metadata: { createdAt: string; updatedAt: string; version: string; source: string; };
}

export interface CvSection {
  id: string;
  label: string;
  icon: string;
  include: boolean;
  collapsed: boolean;
}

export interface CVInfo {
  data: CvData;
  createdAt: string;
  updatedAt: string;
  version: string;
}