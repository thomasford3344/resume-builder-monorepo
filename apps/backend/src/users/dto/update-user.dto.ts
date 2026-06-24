export class UpdateUserDto {
  email?: string;
  name?: string;
  password?: string;
  role?: 'user' | 'admin';
  template?: 'template1';
  instructions?: string;
  questionsPrompt?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  clearOpenaiApiKey?: boolean;
  clearAnthropicApiKey?: boolean;
  currentPassword?: string;
  newPassword?: string;
}
