// src/services/resumeService.ts
import ApiClient from "./apiClient";
import { fetchBlobDownload, fetchBlobPost } from "./blobDownload";

export interface CreateResumeDto {
  companyName: string;
  roleType: string;
  jsonContent: string; // Send as string, backend will parse it
}

export interface GenerateResumeDto {
  companyName: string;
  roleType: string;
  jobDescription: string;
  industry: string;
  aiModel: "openai" | "claude";
  aiVersion: string;
}

export interface ResumeResponse {
  _id: string;
  userId: string;
  companyName: string;
  roleType: string;
  jobDescription: string;
  resumeJson?: Record<string, unknown>;
  conversationId?: string;
  status?: 'in_progress' | 'completed' | 'failed';
  failureMessage?: string;
  aiModel?: 'openai' | 'claude';
  aiVersion?: string;
  generationSource?: 'ai' | 'manual';
  coverLetter?: string;
  answers?: Array<{ question: string; answer: string }>;
  createdAt?: string;
  updatedAt?: string;
}

const api = ApiClient.getInstance();

export const createResume = async (data: CreateResumeDto) => {
  return fetchBlobPost("/api/resumes", data);
};

export interface GenerateResumeResponse {
  resume: {
    filename: string;
    pdf: string; // base64
  };
  resumeId: string;
}


/**
 * Generate resume with streaming for started/complete events
 * Note: Using fetch instead of axios because:
 * - Axios in browsers uses XMLHttpRequest, which doesn't support responseType: 'stream'
 * - Fetch API with ReadableStream is the standard for real-time streaming in browsers
 * 
 * @param data Resume generation data
 * @returns Promise that resolves with the final resume data
 */
export const generateResumeStream = async (
  data: GenerateResumeDto,
): Promise<GenerateResumeResponse> => {
  const token = localStorage.getItem("access_token");
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/resumes/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let message = `HTTP error! status: ${response.status}`;
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.message) {
        message = Array.isArray(errorJson.message)
          ? errorJson.message.join(', ')
          : errorJson.message;
      }
    } catch {
      if (errorText) {
        message = errorText;
      }
    }
    throw new Error(message);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  if (!reader) {
    throw new Error('Response body is not readable');
  }

  let finalResult: GenerateResumeResponse | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        let eventData: { type?: string; message?: string; resumeId?: string; resume?: GenerateResumeResponse['resume'] };
        try {
          eventData = JSON.parse(line.slice(6));
        } catch {
          console.warn('Failed to parse SSE data:', line);
          continue;
        }

        if (eventData.type === 'started') {
          finalResult = {
            resume: { filename: '', pdf: '' },
            resumeId: eventData.resumeId || '',
          };
          return finalResult;
        }

        if (eventData.type === 'complete') {
          finalResult = {
            resume: eventData.resume || { filename: '', pdf: '' },
            resumeId: eventData.resumeId || '',
          };
          continue;
        }

        if (eventData.type === 'error') {
          throw new Error(eventData.message || 'Failed to generate resume');
        }
      }
    }
  }

  if (!finalResult) {
    throw new Error('No result received from server');
  }

  return finalResult;
};

export interface AnswerQuestionsDto {
  resumeId: string;
  questions: string; // Single text block containing all questions
}

export interface AnswerQuestionsResponse {
  questions: string[]; // Parsed questions from the text
  answers: string[];
}

export const answerQuestions = async (data: AnswerQuestionsDto) => {
  const res = await api.post<AnswerQuestionsResponse>(
    "/api/resumes/answer-questions",
    data
  );
  return res.data;
};

export interface FilterResumeParams {
  companyName?: string;
  roleType?: string;
  startDate?: string; // YYYY-MM-DD from date inputs
  endDate?: string; // YYYY-MM-DD from date inputs
}

function toLocalStartOfDayIso(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0).toISOString();
}

function toLocalEndOfDayIso(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day, 23, 59, 59, 999).toISOString();
}

export const getResumes = async (filters?: FilterResumeParams) => {
  const params = new URLSearchParams();
  if (filters?.companyName) {
    params.append("companyName", filters.companyName);
  }
  if (filters?.roleType) {
    params.append("roleType", filters.roleType);
  }
  if (filters?.startDate) {
    params.append("startDate", toLocalStartOfDayIso(filters.startDate));
  }
  if (filters?.endDate) {
    params.append("endDate", toLocalEndOfDayIso(filters.endDate));
  }

  const queryString = params.toString();
  const url = queryString
    ? `/api/resumes?${queryString}`
    : "/api/resumes";

  const res = await api.get<ResumeResponse[]>(url);
  return res.data;
};

export const getResume = async (id: string) => {
  const res = await api.get<ResumeResponse>(`/api/resumes/${id}`);
  return res.data;
};

export const deleteResume = async (id: string) => {
  const res = await api.delete<{ message: string }>(`/api/resumes/${id}`);
  return res.data;
};

export interface BulkDeleteResumeDto {
  ids: string[];
}

export interface BulkDeleteResponse {
  deleted: number;
  failed: string[];
}

export const bulkDeleteResumes = async (data: BulkDeleteResumeDto) => {
  const res = await api.delete<BulkDeleteResponse>("/api/resumes/bulk/delete", {
    data,
  });
  return res.data;
};

export const downloadResume = async (id: string) => {
  return fetchBlobDownload(`/api/resumes/${id}/download`);
};

export const downloadResumeJSON = async (id: string) => {
  return fetchBlobDownload(`/api/resumes/${id}/download-json`);
};

export const downloadCoverLetter = async (id: string) => {
  return fetchBlobDownload(`/api/resumes/${id}/download-cover-letter`);
};

export const generateCoverLetter = async (id: string) => {
  return fetchBlobPost(`/api/resumes/${id}/generate-cover-letter`);
};

export const retryResume = async (id: string) => {
  const res = await api.post<{ message: string }>(`/api/resumes/${id}/retry`);
  return res.data;
};

export interface FromJsonDto {
  companyName: string;
  roleType: string;
  jobDescription: string;
  jsonContent: string;
  aiModel: "openai" | "claude";
  aiVersion: string;
}

export const generatePdfFromJson = async (data: FromJsonDto) => {
  return fetchBlobPost("/api/resumes/from-json", data);
};

export const downloadTemplatePreview = async (template: string) => {
  return fetchBlobDownload(`/api/resumes/templates/${template}/preview`);
};

