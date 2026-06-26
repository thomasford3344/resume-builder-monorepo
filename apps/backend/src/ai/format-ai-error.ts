export function formatAiProviderError(error: unknown): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : 'Failed to generate resume';

  if (
    /403[\s\S]*["']type["']\s*:\s*["']forbidden["'][\s\S]*request not allowed/i.test(
      raw,
    )
  ) {
    return (
      'Anthropic blocked the request (403: Request not allowed). ' +
      'Common causes: your server is in an unsupported region, or your API key does not have access to the selected Claude model. ' +
      'Try OpenAI instead, switch to Claude Sonnet 4.5 or Haiku 4.5, or check model access at console.anthropic.com.'
    );
  }

  if (
    /403[\s\S]*permission_error/i.test(raw) ||
    /PermissionDeniedError/i.test(raw)
  ) {
    return (
      'The API key is valid but does not have permission for this request. ' +
      'Check model access in your provider console or try a different model.'
    );
  }

  if (/401[\s\S]*authentication_error/i.test(raw)) {
    return 'Invalid or expired API key. Update your API key in Profile settings.';
  }

  if (/429[\s\S]*rate_limit/i.test(raw)) {
    return 'Rate limit exceeded. Wait a moment and retry.';
  }

  return raw.trim() || 'Failed to generate resume';
}
