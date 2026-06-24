export type AiProvider = "openai" | "claude";

export interface AiModelOption {
  label: string;
  value: string;
}

export const OPENAI_MODELS: AiModelOption[] = [
  { label: "GPT-4.1 Mini", value: "gpt-4.1-mini" },
  { label: "GPT-4.5", value: "gpt-4.5" },
  { label: "GPT-5", value: "gpt-5" },
  { label: "GPT-5 Instant", value: "gpt-5-instant" },
  { label: "GPT-5 Thinking", value: "gpt-5-thinking" },
  { label: "GPT-5 Pro", value: "gpt-5-pro" },
  { label: "GPT-5.1", value: "gpt-5.1" },
  { label: "GPT-5.1 Instant", value: "gpt-5.1-instant" },
  { label: "GPT-5.1 Thinking", value: "gpt-5.1-thinking" },
  { label: "GPT-5.1 Pro", value: "gpt-5.1-pro" },
  { label: "GPT-5.2", value: "gpt-5.2" },
  { label: "GPT-5.2 Instant", value: "gpt-5.2-instant" },
  { label: "GPT-5.2 Thinking", value: "gpt-5.2-thinking" },
  { label: "GPT-5.2 Pro", value: "gpt-5.2-pro" },
  { label: "GPT-5.5", value: "gpt-5.5" },
  { label: "GPT-5.5 Instant", value: "gpt-5.5-instant" },
  { label: "GPT-5.5 Thinking", value: "gpt-5.5-thinking" },
  { label: "GPT-5.5 Pro", value: "gpt-5.5-pro" },
];

export const CLAUDE_MODELS: AiModelOption[] = [
  { label: "Claude Sonnet 4.5", value: "claude-sonnet-4-5-20250929" },
  { label: "Claude Sonnet 4.6", value: "claude-sonnet-4-6" },
  { label: "Claude Opus 4", value: "claude-opus-4-20250514" },
  { label: "Claude Opus 4.1", value: "claude-opus-4-1-20250805" },
  { label: "Claude Opus 4.5", value: "claude-opus-4-5-20251101" },
  { label: "Claude Opus 4.6", value: "claude-opus-4-6" },
  { label: "Claude Opus 4.7", value: "claude-opus-4-7" },
  { label: "Claude Haiku 4.5", value: "claude-haiku-4-5-20251001" },
];

export const DEFAULT_AI_PROVIDER: AiProvider = "claude";
export const DEFAULT_OPENAI_VERSION = "gpt-4.1-mini";
export const DEFAULT_CLAUDE_VERSION = "claude-sonnet-4-6";
export const DEFAULT_FROM_JSON_AI_PROVIDER: AiProvider = "openai";
export const DEFAULT_FROM_JSON_AI_VERSION = "gpt-5.5-thinking";

export const DEFAULT_AI_VERSION =
  DEFAULT_AI_PROVIDER === "openai"
    ? DEFAULT_OPENAI_VERSION
    : DEFAULT_CLAUDE_VERSION;

export function getModelLabel(provider: AiProvider, version: string): string {
  const models = provider === "openai" ? OPENAI_MODELS : CLAUDE_MODELS;
  const match = models.find((m) => m.value === version);
  return match?.label ?? version;
}

export function getModelVersionLabel(
  provider: AiProvider,
  version: string,
): string {
  const label = getModelLabel(provider, version);

  if (provider === "openai") {
    return label.replace(/^GPT-?/i, "");
  }

  if (provider === "claude") {
    return label.replace(/^Claude\s+/i, "");
  }

  return label;
}

export function getProviderLabel(provider: AiProvider): string {
  return provider === "openai" ? "OpenAI" : "Claude";
}

export function getAiVersionDisplay(
  aiModel: AiProvider | undefined,
  aiVersion: string | undefined,
  generationSource?: "ai" | "manual",
): string {
  const provider = aiModel || "openai";
  const version = aiVersion || DEFAULT_OPENAI_VERSION;
  const label = getModelLabel(provider, version);

  if (generationSource === "manual") {
    return `Manual: ${label}`;
  }

  return label;
}
