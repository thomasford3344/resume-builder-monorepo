import type { ResumeSettings } from '../../ai/resume-settings';

export class UpdateUserDto {
  email?: string;
  name?: string;
  password?: string;
  role?: 'user' | 'admin';
  template?: 'template1';
  instructions?: string;
  questionsPrompt?: string;
  coverLetterPrompt?: string;
  defaultAiModel?: 'openai' | 'claude';
  defaultAiVersion?: string;
  defaultGenerateFromJson?: boolean;
  defaultFromJsonAiModel?: 'openai' | 'claude';
  defaultFromJsonAiVersion?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  clearOpenaiApiKey?: boolean;
  clearAnthropicApiKey?: boolean;
  currentPassword?: string;
  newPassword?: string;
  resumeSettings?: Partial<ResumeSettings>;
}
