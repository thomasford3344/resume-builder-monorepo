import { Injectable } from '@nestjs/common';
import { ResumeData } from 'src/resumes/templates';
import { type AiProvider, resolveApiModelId } from './ai-models';
import { buildResumeJsonSchema } from './resume-json-schema';
import type { ResumeSettings } from './resume-settings';
import { resolveResumeSettings } from './resume-settings';
import {
  DEFAULT_COVER_LETTER_PROMPT,
  DEFAULT_QUESTIONS_PROMPT,
} from './default-prompts';
import { cleanText } from './clean-text';
import type { UserApiKeys } from './user-api-keys';
import { OpenAIService } from '../openai/openai.service';
import { ClaudeService } from '../claude/claude.service';

export type { UserApiKeys } from './user-api-keys';

@Injectable()
export class AiService {
  constructor(
    private readonly openAIService: OpenAIService,
    private readonly claudeService: ClaudeService,
  ) {}

  async generateResume(
    jobDescription: string,
    userInstructions: string,
    aiProvider: AiProvider = 'openai',
    aiVersion: string = 'gpt-4.1-mini',
    apiKeys?: UserApiKeys,
    resumeSettings?: Partial<ResumeSettings>,
  ): Promise<{ resumeJson: ResumeData; threadId: string }> {
    if (!userInstructions || !userInstructions.trim()) {
      throw new Error('User instructions are required and cannot be empty');
    }

    const fullInstructions = cleanText(userInstructions);
    const cleanedJobDescription = cleanText(jobDescription);
    const apiModelId = resolveApiModelId(aiProvider, aiVersion);
    const settings = resolveResumeSettings(resumeSettings);
    const resumeJsonSchema = settings.useDefaultOutputFormat
      ? buildResumeJsonSchema(settings)
      : undefined;

    if (aiProvider === 'claude') {
      const { resumeJson, conversationId } = await this.claudeService.generateResume(
        cleanedJobDescription,
        fullInstructions,
        apiModelId,
        apiKeys,
        resumeJsonSchema,
      );

      return {
        resumeJson,
        threadId: conversationId,
      };
    }

    const { resumeJson, responseId } = await this.openAIService.generateResume(
      cleanedJobDescription,
      fullInstructions,
      apiModelId,
      apiKeys,
      resumeJsonSchema,
    );

    return {
      resumeJson,
      threadId: responseId,
    };
  }

  async generateCoverLetter(
    jobDescription: string,
    resumeJson: Record<string, unknown>,
    conversationId: string | undefined,
    aiProvider: AiProvider = 'openai',
    aiVersion: string = 'gpt-4.1-mini',
    apiKeys?: UserApiKeys,
    customPrompt?: string,
  ): Promise<string> {
    const cleanedJobDescription = cleanText(jobDescription);
    const compactResumeJson = JSON.stringify(resumeJson);
    const coverLetterInstructions = cleanText(
      customPrompt?.trim() || DEFAULT_COVER_LETTER_PROMPT,
    );
    const apiModelId = resolveApiModelId(aiProvider, aiVersion);

    if (aiProvider === 'claude') {
      return this.claudeService.generateCoverLetter(
        cleanedJobDescription,
        compactResumeJson,
        coverLetterInstructions,
        apiModelId,
        apiKeys,
      );
    }

    return this.openAIService.generateCoverLetter(
      conversationId,
      cleanedJobDescription,
      compactResumeJson,
      coverLetterInstructions,
      apiModelId,
      apiKeys,
    );
  }

  async parseAndAnswerQuestions(
    questionsText: string,
    resumeJson: Record<string, any>,
    jobDescription: string,
    customPrompt?: string,
    aiProvider: AiProvider = 'openai',
    aiVersion: string = 'gpt-4.1-mini',
    apiKeys?: UserApiKeys,
  ): Promise<Array<{ question: string; answer: string }>> {
    const instructions = cleanText(
      customPrompt?.trim() || DEFAULT_QUESTIONS_PROMPT,
    );

    const cleanedJobDescription = cleanText(jobDescription);
    const cleanedQuestionsText = cleanText(questionsText);

    const resumeCopy: Record<string, any> = { ...(resumeJson || {}) };
    if (resumeCopy.cover_letter) {
      delete resumeCopy.cover_letter;
    }

    const compactResumeJson = JSON.stringify(resumeCopy);
    const fullInstructions = `${instructions} Job Description: ${cleanedJobDescription} Resume Information: ${compactResumeJson}`;
    const apiModelId = resolveApiModelId(aiProvider, aiVersion);

    if (aiProvider === 'claude') {
      return this.claudeService.parseAndAnswerQuestions(
        cleanedQuestionsText,
        fullInstructions,
        apiModelId,
        apiKeys,
      );
    }

    return this.openAIService.parseAndAnswerQuestions(
      cleanedQuestionsText,
      fullInstructions,
      apiModelId,
      apiKeys,
    );
  }
}
