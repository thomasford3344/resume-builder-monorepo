import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { ResumeData } from 'src/resumes/templates';
import {
  type AiProvider,
  resolveApiModelId,
} from '../ai/ai-models';
import { buildResumeJsonSchema } from '../ai/resume-json-schema';
import type { ResumeSettings } from '../ai/resume-settings';
import {
  DEFAULT_COVER_LETTER_PROMPT,
  DEFAULT_QUESTIONS_PROMPT,
} from '../ai/default-prompts';

export interface UserApiKeys {
  openai?: string | null;
  anthropic?: string | null;
}

@Injectable()
export class OpenAIService {
  private cleanText(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
  }

  private resolveOpenaiKey(apiKeys?: UserApiKeys): string {
    const key = apiKeys?.openai?.trim();
    if (!key) {
      throw new Error(
        'No OpenAI API key configured. Add your OpenAI API key in Profile settings.',
      );
    }
    return key;
  }

  private resolveAnthropicKey(apiKeys?: UserApiKeys): string {
    const key = apiKeys?.anthropic?.trim();
    if (!key) {
      throw new Error(
        'No Anthropic API key configured. Add your Anthropic API key in Profile settings.',
      );
    }
    return key;
  }

  private getOpenAIClient(apiKeys?: UserApiKeys): OpenAI {
    return new OpenAI({
      apiKey: this.resolveOpenaiKey(apiKeys),
    });
  }

  private getAnthropicClient(apiKeys?: UserApiKeys): Anthropic {
    return new Anthropic({
      apiKey: this.resolveAnthropicKey(apiKeys),
    });
  }

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

    const fullInstructions = this.cleanText(userInstructions);
    const cleanedJobDescription = this.cleanText(jobDescription);
    const apiModelId = resolveApiModelId(aiProvider, aiVersion);
    const resumeJsonSchema = buildResumeJsonSchema(resumeSettings);

    if (aiProvider === 'claude') {
      const { resumeJson, conversationId } = await this.generateResumeWithClaude(
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

    const { resumeJson, responseId } = await this.generateResumeWithOpenAI(
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
    const cleanedJobDescription = this.cleanText(jobDescription);
    const compactResumeJson = JSON.stringify(resumeJson);
    const coverLetterInstructions = this.cleanText(
      customPrompt?.trim() || DEFAULT_COVER_LETTER_PROMPT,
    );
    const apiModelId = resolveApiModelId(aiProvider, aiVersion);

    if (aiProvider === 'claude') {
      return this.generateCoverLetterWithClaude(
        cleanedJobDescription,
        compactResumeJson,
        coverLetterInstructions,
        apiModelId,
        apiKeys,
      );
    }

    return this.generateCoverLetterWithOpenAI(
      conversationId,
      cleanedJobDescription,
      compactResumeJson,
      coverLetterInstructions,
      apiModelId,
      apiKeys,
    );
  }

  private async generateResumeWithOpenAI(
    jobDescription: string,
    instructions: string,
    model: string,
    apiKeys?: UserApiKeys,
    resumeJsonSchema = buildResumeJsonSchema(),
  ): Promise<{ resumeJson: ResumeData; responseId: string }> {
    const client = this.getOpenAIClient(apiKeys);
    const response = await client.responses.create({
      model,
      instructions,
      input: jobDescription,
      text: {
        format: {
          type: 'json_schema',
          name: 'resume',
          strict: true,
          schema: resumeJsonSchema,
        },
      },
    });

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

  private async generateResumeWithClaude(
    jobDescription: string,
    instructions: string,
    model: string,
    apiKeys?: UserApiKeys,
    resumeJsonSchema = buildResumeJsonSchema(),
  ): Promise<{ resumeJson: ResumeData; conversationId: string }> {
    const client = this.getAnthropicClient(apiKeys);
    const schemaPrompt = `You must respond with valid JSON only, matching this schema exactly:\n${JSON.stringify(resumeJsonSchema)}`;

    const response = await client.messages.create({
      model,
      max_tokens: 16384,
      system: `${instructions}\n\n${schemaPrompt}`,
      messages: [
        {
          role: 'user',
          content: jobDescription,
        },
      ],
    });

    if (!response.id) {
      throw new Error('No conversation id received from Claude');
    }

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text output received from Claude');
    }

    const outputText = textBlock.text.trim();
    const jsonText = outputText.startsWith('```')
      ? outputText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
      : outputText;

    try {
      return {
        resumeJson: JSON.parse(jsonText),
        conversationId: response.id,
      };
    } catch (error) {
      throw new Error(
        `Failed to parse JSON from Claude response: ${error.message}. Response: ${outputText.substring(0, 200)}`,
      );
    }
  }

  private async generateCoverLetterWithOpenAI(
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
      instructions,
      input: conversationId
        ? 'Generate the cover letter now.'
        : `Job Description: ${jobDescription}\n\nResume JSON: ${resumeJson}\n\nGenerate the cover letter now.`,
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

  private async generateCoverLetterWithClaude(
    jobDescription: string,
    resumeJson: string,
    instructions: string,
    model: string,
    apiKeys?: UserApiKeys,
  ): Promise<string> {
    const client = this.getAnthropicClient(apiKeys);
    const response = await client.messages.create({
      model,
      max_tokens: 1800,
      system: instructions,
      messages: [
        {
          role: 'user',
          content: `Job Description: ${jobDescription}\n\nResume JSON: ${resumeJson}\n\nGenerate the cover letter now.`,
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text' || !textBlock.text.trim()) {
      throw new Error('No cover letter text received from Claude');
    }

    return textBlock.text.trim();
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
    const instructions = this.cleanText(
      customPrompt?.trim() || DEFAULT_QUESTIONS_PROMPT,
    );

    const cleanedJobDescription = this.cleanText(jobDescription);
    const cleanedInstructions = this.cleanText(instructions);
    const cleanedQuestionsText = this.cleanText(questionsText);

    const resumeCopy: Record<string, any> = { ...(resumeJson || {}) };
    if (resumeCopy.cover_letter) {
      delete resumeCopy.cover_letter;
    }

    const compactResumeJson = JSON.stringify(resumeCopy);
    const fullInstructions = `${cleanedInstructions} Job Description: ${cleanedJobDescription} Resume Information: ${compactResumeJson}`;
    const apiModelId = resolveApiModelId(aiProvider, aiVersion);

    if (aiProvider === 'claude') {
      return this.parseAndAnswerQuestionsWithClaude(
        cleanedQuestionsText,
        fullInstructions,
        apiModelId,
        apiKeys,
      );
    }

    return this.parseAndAnswerQuestionsWithOpenAI(
      cleanedQuestionsText,
      fullInstructions,
      apiModelId,
      apiKeys,
    );
  }

  private async parseAndAnswerQuestionsWithOpenAI(
    questionsText: string,
    instructions: string,
    model: string,
    apiKeys?: UserApiKeys,
  ): Promise<Array<{ question: string; answer: string }>> {
    const client = this.getOpenAIClient(apiKeys);
    const response = await client.responses.create({
      model,
      instructions,
      input: questionsText,
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

    return this.parseQuestionsResponse(response.output_text);
  }

  private async parseAndAnswerQuestionsWithClaude(
    questionsText: string,
    instructions: string,
    model: string,
    apiKeys?: UserApiKeys,
  ): Promise<Array<{ question: string; answer: string }>> {
    const client = this.getAnthropicClient(apiKeys);
    const schemaPrompt =
      'Respond with valid JSON only in this format: {"questions_and_answers": [{"question": "...", "answer": "..."}]}';

    const response = await client.messages.create({
      model,
      max_tokens: 8192,
      system: `${instructions}\n\n${schemaPrompt}`,
      messages: [
        {
          role: 'user',
          content: questionsText,
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text output received from Claude');
    }

    const outputText = textBlock.text.trim();
    const jsonText = outputText.startsWith('```')
      ? outputText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
      : outputText;

    return this.parseQuestionsResponse(jsonText);
  }

  private parseQuestionsResponse(
    outputText: string,
  ): Array<{ question: string; answer: string }> {
    try {
      const parsed = JSON.parse(outputText)['questions_and_answers'];
      if (Array.isArray(parsed)) {
        return parsed
          .filter(
            (qa) =>
              qa &&
              typeof qa.question === 'string' &&
              typeof qa.answer === 'string',
          )
          .map((qa) => ({
            question: qa.question.trim(),
            answer: qa.answer.trim(),
          }))
          .filter((qa) => qa.question.length > 0 && qa.answer.length > 0);
      }
      throw new Error('Invalid response format: expected array');
    } catch (error) {
      throw new Error(
        `Failed to parse JSON from AI response: ${error.message}. Response: ${outputText.substring(0, 200)}`,
      );
    }
  }
}
