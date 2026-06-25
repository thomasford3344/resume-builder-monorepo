export function parseQuestionsResponse(
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
