import { Injectable } from '@nestjs/common';
import { ResumeData } from 'src/resumes/templates';
import { cleanText } from '../ai/clean-text';
import { parseQuestionsResponse } from '../ai/parse-questions-response';
import type { UserApiKeys } from '../ai/user-api-keys';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const OPENROUTER_APP_TITLE = 'Resume Builder';

interface ChatCompletionMessage {
  content?: string | null;
}

interface ChatCompletionChoice {
  message?: ChatCompletionMessage;
}

interface ChatCompletion {
  id: string;
  choices: ChatCompletionChoice[];
}

export interface OpenRouterKeyUsage {
  label: string | null;
  usage: number;
  usageDaily: number;
  usageWeekly: number;
  usageMonthly: number;
  limit: number | null;
  limitRemaining: number | null;
}

type OpenRouterErrorBody = {
  error?: {
    message?: string;
    code?: number | string;
    metadata?: {
      provider_name?: string;
      raw?: unknown;
    };
  };
};

@Injectable()
export class OpenRouterService {
  private resolveApiKey(apiKeys?: UserApiKeys): string {
    const key = apiKeys?.openrouter?.trim();
    if (!key) {
      throw new Error(
        'No OpenRouter API key configured. Add your OpenRouter API key in Profile settings.',
      );
    }
    return key;
  }

  private buildApiError(
    status: number,
    body: OpenRouterErrorBody,
  ): Error {
    const message = body.error?.message ?? 'OpenRouter request failed';
    const provider = body.error?.metadata?.provider_name;
    const raw = body.error?.metadata?.raw;
    const rawText =
      typeof raw === 'string'
        ? raw
        : raw
          ? JSON.stringify(raw)
          : '';

    const details = [
      `${status} ${message}`,
      provider ? `Provider: ${provider}` : '',
      rawText ? `Details: ${rawText}` : '',
    ]
      .filter(Boolean)
      .join(' — ');

    return new Error(details);
  }

  private isRetryableStructuredOutputError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }

    return /400[\s\S]*provider returned error/i.test(error.message);
  }

  private async createChatCompletion(
    apiKeys: UserApiKeys,
    body: Record<string, unknown>,
  ): Promise<ChatCompletion> {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.resolveApiKey(apiKeys)}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5173',
        'X-OpenRouter-Title': OPENROUTER_APP_TITLE,
      },
      body: JSON.stringify(body),
    });

    const payload = (await response.json()) as ChatCompletion | OpenRouterErrorBody;

    if (!response.ok) {
      throw this.buildApiError(response.status, payload as OpenRouterErrorBody);
    }

    return payload as ChatCompletion;
  }

  private extractJsonText(outputText: string): string {
    const trimmed = outputText.trim();
    return trimmed.startsWith('```')
      ? trimmed.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
      : trimmed;
  }

  private getMessageContent(response: ChatCompletion): string {
    const content = response.choices[0]?.message?.content;
    if (!content?.trim()) {
      throw new Error('No output text received from OpenRouter');
    }
    return content.trim();
  }

  private parseResumeJson(
    outputText: string,
    responseId: string,
  ): { resumeJson: ResumeData; responseId: string } {
    const jsonText = this.extractJsonText(outputText);

    try {
      return {
        resumeJson: JSON.parse(jsonText),
        responseId,
      };
    } catch (error) {
      throw new Error(
        `Failed to parse JSON from OpenRouter response: ${error.message}. Response: ${outputText.substring(0, 200)}`,
      );
    }
  }

  async getKeyUsage(apiKeys?: UserApiKeys): Promise<OpenRouterKeyUsage> {
    const key = this.resolveApiKey(apiKeys);
    const response = await fetch(`${OPENROUTER_BASE_URL}/key`, {
      headers: { Authorization: `Bearer ${key}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch OpenRouter API key usage');
    }

    const body = (await response.json()) as {
      data?: {
        label?: string;
        usage?: number;
        usage_daily?: number;
        usage_weekly?: number;
        usage_monthly?: number;
        limit?: number | null;
        limit_remaining?: number | null;
      };
    };

    const data = body.data ?? {};

    return {
      label: data.label ?? null,
      usage: data.usage ?? 0,
      usageDaily: data.usage_daily ?? 0,
      usageWeekly: data.usage_weekly ?? 0,
      usageMonthly: data.usage_monthly ?? 0,
      limit: data.limit ?? null,
      limitRemaining: data.limit_remaining ?? null,
    };
  }

  async generateResume(
    jobDescription: string,
    instructions: string,
    model: string,
    apiKeys?: UserApiKeys,
    expectJson = false,
  ): Promise<{ resumeJson: ResumeData; responseId: string }> {
    const keys = apiKeys ?? {};
    const cleanedInstructions = cleanText(instructions);
    const cleanedJobDescription = cleanText(jobDescription);

    const response = await this.createChatCompletion(keys, {
      model,
      max_completion_tokens: 16384,
      messages: [
        { role: 'system', content: cleanedInstructions },
        { role: 'user', content: cleanedJobDescription },
      ],
      ...(expectJson
        ? {
            response_format: {
              type: 'json_object',
            },
          }
        : {}),
    });

    return this.parseResumeJson(
      this.getMessageContent(response),
      response.id,
    );
  }

  async generateCoverLetter(
    jobDescription: string,
    resumeJson: string,
    instructions: string,
    model: string,
    apiKeys?: UserApiKeys,
  ): Promise<string> {
    const response = await this.createChatCompletion(apiKeys ?? {}, {
      model,
      max_completion_tokens: 1800,
      messages: [
        { role: 'system', content: cleanText(instructions) },
        {
          role: 'user',
          content: `Job Description: ${cleanText(jobDescription)}\n\nResume JSON: ${resumeJson}\n\nGenerate the cover letter now.`,
        },
      ],
    });

    return this.getMessageContent(response);
  }

  async parseAndAnswerQuestions(
    questionsText: string,
    instructions: string,
    model: string,
    apiKeys?: UserApiKeys,
  ): Promise<Array<{ question: string; answer: string }>> {
    const keys = apiKeys ?? {};
    const questionsSchema = {
      type: 'object',
      properties: {
        questions_and_answers: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            properties: {
              question: {
                type: 'string',
                minLength: 1,
              },
              answer: {
                type: 'string',
                minLength: 1,
              },
            },
            required: ['question', 'answer'],
            additionalProperties: false,
          },
        },
      },
      required: ['questions_and_answers'],
      additionalProperties: false,
    };

    const structuredRequest = {
      model,
      max_completion_tokens: 8192,
      messages: [
        { role: 'system', content: cleanText(instructions) },
        { role: 'user', content: cleanText(questionsText) },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'questions_and_answers',
          strict: true,
          schema: questionsSchema,
        },
      },
      provider: {
        require_parameters: true,
      },
    };

    try {
      const response = await this.createChatCompletion(keys, structuredRequest);
      const outputText = this.getMessageContent(response);
      return parseQuestionsResponse(
        this.extractJsonText(outputText),
        questionsText,
      );
    } catch (error) {
      if (!this.isRetryableStructuredOutputError(error)) {
        throw error;
      }
    }

    const fallbackResponse = await this.createChatCompletion(keys, {
      model,
      max_completion_tokens: 8192,
      messages: [
        {
          role: 'system',
          content: `${cleanText(instructions)}\n\nRespond with valid JSON only in this format: {"questions_and_answers": [{"question": "...", "answer": "..."}]}`,
        },
        { role: 'user', content: cleanText(questionsText) },
      ],
      response_format: {
        type: 'json_object',
      },
    });

    const outputText = this.getMessageContent(fallbackResponse);
    return parseQuestionsResponse(
      this.extractJsonText(outputText),
      questionsText,
    );
  }
}
