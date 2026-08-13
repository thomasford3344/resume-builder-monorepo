type QuestionAnswer = { question: string; answer: string };

function toQuestionAnswers(parsed: unknown): QuestionAnswer[] {
  if (!Array.isArray(parsed)) {
    throw new Error('Invalid response format: expected array');
  }

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

function extractQuestionsPayload(value: unknown): unknown {
  if (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    'questions_and_answers' in value
  ) {
    return (value as { questions_and_answers: unknown }).questions_and_answers;
  }

  return value;
}

function parsePlainTextQuestions(
  text: string,
  questionsText?: string,
): QuestionAnswer[] {
  const pairs: QuestionAnswer[] = [];
  const pattern =
    /(?:^|\n)\s*(?:\d+[.)]\s*)?\b(?:question|q)\b\s*[:.\-]\s*([\s\S]+?)\s*\b(?:answer|a)\b\s*[:.\-]\s*([\s\S]+?)(?=(?:\n\s*(?:\d+[.)]\s*)?\b(?:question|q)\b\s*[:.\-])|$)/gi;

  for (const match of text.matchAll(pattern)) {
    const question = match[1].trim();
    const answer = match[2].trim();
    if (question.length > 0 && answer.length > 0) {
      pairs.push({ question, answer });
    }
  }

  if (pairs.length > 0) {
    return pairs;
  }

  const answer = text.trim();
  if (!answer) {
    throw new Error('Invalid response format: expected array');
  }

  return [
    {
      question: questionsText?.trim() || 'Question',
      answer,
    },
  ];
}

export function parseQuestionsResponse(
  outputText: string,
  questionsText?: string,
): Array<{ question: string; answer: string }> {
  try {
    let parsed: unknown;

    try {
      parsed = extractQuestionsPayload(JSON.parse(outputText));
    } catch {
      return parsePlainTextQuestions(outputText, questionsText);
    }

    if (typeof parsed === 'string') {
      const plainText = parsed;
      try {
        parsed = extractQuestionsPayload(JSON.parse(plainText));
      } catch {
        return parsePlainTextQuestions(plainText, questionsText);
      }
    }

    return toQuestionAnswers(parsed);
  } catch (error) {
    throw new Error(
      `Failed to parse JSON from AI response: ${
        error instanceof Error ? error.message : String(error)
      }. Response: ${outputText.substring(0, 200)}`,
    );
  }
}
