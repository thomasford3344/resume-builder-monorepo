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
    return 'Claude API blocked (403): location not allowed.';
  }

  if (
    /403[\s\S]*permission_error/i.test(raw) ||
    /PermissionDeniedError/i.test(raw)
  ) {
    return 'API key lacks permission for this model. Try a different model.';
  }

  if (/401[\s\S]*authentication_error/i.test(raw)) {
    return 'Invalid or expired API key. Update your API key in Profile settings.';
  }

  if (/429[\s\S]*rate_limit/i.test(raw)) {
    return 'Rate limit exceeded. Wait a moment and retry.';
  }

  return raw.trim() || 'Failed to generate resume';
}
