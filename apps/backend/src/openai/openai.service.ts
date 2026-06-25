import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { ResumeData } from 'src/resumes/templates';
import { cleanText } from '../ai/clean-text';
import { parseQuestionsResponse } from '../ai/parse-questions-response';
import type { UserApiKeys } from '../ai/user-api-keys';

@Injectable()
export class OpenAIService {
  private resolveOpenaiKey(apiKeys?: UserApiKeys): string {
    const key = apiKeys?.openai?.trim();
    if (!key) {
      throw new Error(
        'No OpenAI API key configured. Add your OpenAI API key in Profile settings.',
      );
    }
    return key;
  }

  private getOpenAIClient(apiKeys?: UserApiKeys): OpenAI {
    return new OpenAI({
      apiKey: this.resolveOpenaiKey(apiKeys),
    });
  }

  async generateResume(
    jobDescription: string,
    instructions: string,
    model: string,
    apiKeys?: UserApiKeys,
    resumeJsonSchema?: Record<string, unknown>,
  ): Promise<{ resumeJson: ResumeData; responseId: string }> {
    const client = this.getOpenAIClient(apiKeys);
    const request: OpenAI.Responses.ResponseCreateParams = {
      model,
      instructions: cleanText(instructions),
      input: cleanText(jobDescription),
    };

    if (resumeJsonSchema) {
      request.text = {
        format: {
          type: 'json_schema',
          name: 'resume',
          strict: true,
          schema: resumeJsonSchema,
        },
      };
    }

    const response = await client.responses.create(request);

    if (!response.id) {
      throw new Error('No response id received from OpenAI');
    }

    if (!response.output_text) {
      throw new Error('No output text received from OpenAI');
    }

    try {
      return {
        resumeJson: JSON.parse(response.output_text),
        responseId: response.id,
      };
    } catch (error) {
      throw new Error(
        `Failed to parse JSON from OpenAI response: ${error.message}. Response: ${response.output_text.substring(0, 200)}`,
      );
    }
  }

  async generateCoverLetter(
    conversationId: string | undefined,
    jobDescription: string,
    resumeJson: string,
    instructions: string,
    model: string,
    apiKeys?: UserApiKeys,
  ): Promise<string> {
    const client = this.getOpenAIClient(apiKeys);
    const request: OpenAI.Responses.ResponseCreateParams = {
      model,
      instructions: cleanText(instructions),
      input: conversationId
        ? 'Generate the cover letter now.'
        : `Job Description: ${cleanText(jobDescription)}\n\nResume JSON: ${resumeJson}\n\nGenerate the cover letter now.`,
    };

    if (conversationId) {
      request.previous_response_id = conversationId;
    }

    const response = await client.responses.create(request);

    if (!response.output_text?.trim()) {
      throw new Error('No cover letter text received from OpenAI');
    }

    return response.output_text.trim();
  }

  async parseAndAnswerQuestions(
    questionsText: string,
    instructions: string,
    model: string,
    apiKeys?: UserApiKeys,
  ): Promise<Array<{ question: string; answer: string }>> {
    const client = this.getOpenAIClient(apiKeys);
    const response = await client.responses.create({
      model,
      instructions: cleanText(instructions),
      input: cleanText(questionsText),
      text: {
        format: {
          type: 'json_schema',
          name: 'questions_and_answers',
          strict: true,
          schema: {
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
          },
        },
      },
    });

    if (!response.output_text) {
      throw new Error('No output text received from OpenAI');
    }

    return parseQuestionsResponse(response.output_text);
  }
}
