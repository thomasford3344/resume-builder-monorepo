export { ResumePDFTemplate1 } from './template_1';
export { ResumePDFTemplate2 } from './template_2';
export { ResumePDFTemplate3 } from './template_3';
export { ResumePDFTemplate4 } from './template_4';
export { ResumePDFTemplate5 } from './template_5';
export { ResumePDFTemplate6 } from './template_6';

export {
  DEFAULT_RESUME_PDF_SETTINGS,
  filterSkillsForPdf,
  type ResumePdfSettings,
} from '../../ai/resume-settings';

export { getCertificationText } from './certification-utils';

export interface ResumeData {
  name?: string;
  title?: string;
  contact?: {
    address?: string;
    email?: string;
    phone?: string;
    linkedin?: string;
  };
  summary?: string;
  skills: Array<{ category: string; items: string[] }>;
  experience?: Array<{
    title?: string;
    company?: string;
    date_range?: string;
    job_type?: string;
    location?: string;
    responsibilities?: string[];
    achievements?: string[];
    skills?: string | string[];
  }>;
  education?: Array<{
    degree?: string;
    institution?: string;
    date_range?: string;
    location?: string;
  }>;
  certifications?: Array<
    | string
    | {
        name?: string;
        title?: string;
        certification?: string;
        issuer?: string;
        organization?: string;
        authority?: string;
        date?: string;
        date_range?: string;
        issued_date?: string;
        year?: string;
      }
  >;
  cover_letter?: string;
}
