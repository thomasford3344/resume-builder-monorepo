import { Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { ResumeData } from 'src/resumes/templates';
import { parseQuestionsResponse } from '../ai/parse-questions-response';
import type { UserApiKeys } from '../ai/user-api-keys';

@Injectable()
export class ClaudeService {
  private resolveAnthropicKey(apiKeys?: UserApiKeys): string {
    const key = apiKeys?.anthropic?.trim();
    if (!key) {
      throw new Error(
        'No Anthropic API key configured. Add your Anthropic API key in Profile settings.',
      );
    }
    return key;
  }

  private getAnthropicClient(apiKeys?: UserApiKeys): Anthropic {
    return new Anthropic({
      apiKey: this.resolveAnthropicKey(apiKeys),
    });
  }

  private extractJsonText(outputText: string): string {
    const trimmed = outputText.trim();
    return trimmed.startsWith('```')
      ? trimmed.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
      : trimmed;
  }

  async generateResume(
    jobDescription: string,
    instructions: string,
    model: string,
    apiKeys?: UserApiKeys,
    resumeJsonSchema?: Record<string, unknown>,
  ): Promise<{ resumeJson: ResumeData; conversationId: string }> {
    const client = this.getAnthropicClient(apiKeys);
    const systemPrompt = resumeJsonSchema
      ? `${instructions}\n\nYou must respond with valid JSON only, matching this schema exactly:\n${JSON.stringify(resumeJsonSchema)}`
      : instructions;

    const response = await client.messages.create({
      model,
      max_tokens: 16384,
      system: systemPrompt,
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

    const jsonText = this.extractJsonText(textBlock.text);

    try {
      return {
        resumeJson: JSON.parse(jsonText),
        conversationId: response.id,
      };
    } catch (error) {
      throw new Error(
        `Failed to parse JSON from Claude response: ${error.message}. Response: ${textBlock.text.substring(0, 200)}`,
      );
    }
  }

  async generateCoverLetter(
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

    return parseQuestionsResponse(this.extractJsonText(textBlock.text));
  }
}
