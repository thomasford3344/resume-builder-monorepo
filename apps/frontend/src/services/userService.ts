import ApiClient from "./apiClient";
import type { ResumeSettings } from "../constants/resumeSettings";

export type User = {
  id: number;
  email: string;
  name: string;
};

export type AccountFunds = {
  availableToBetBalance: number;
  exposure: number;
  retainedCommission: number;
  exposureLimit: number;
  discountRate: number;
  pointsBalance: number;
  wallet: "UK";
};

export interface UserResponse {
  _id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  template?:
    | "template1"
    | "template2"
    | "template3"
    | "template4"
    | "template5"
    | "template6"
    | "template7";
  instructions?: string;
  questionsPrompt?: string;
  coverLetterPrompt?: string;
  defaultAiModel?: "openai" | "claude";
  defaultAiVersion?: string;
  defaultGenerateFromJson?: boolean;
  defaultFromJsonAiModel?: "openai" | "claude";
  defaultFromJsonAiVersion?: string;
  resumeSettings?: ResumeSettings;
  hasOpenaiApiKey?: boolean;
  hasAnthropicApiKey?: boolean;
}

export interface CreateUserDto {
  email: string;
  name: string;
  password: string;
  role?: "user" | "admin";
  template?:
    | "template1"
    | "template2"
    | "template3"
    | "template4"
    | "template5"
    | "template6"
    | "template7";
  instructions?: string;
  questionsPrompt?: string;
  coverLetterPrompt?: string;
}

export interface UpdateUserDto {
  email?: string;
  name?: string;
  password?: string;
  role?: "user" | "admin";
  template?:
    | "template1"
    | "template2"
    | "template3"
    | "template4"
    | "template5"
    | "template6"
    | "template7";
  instructions?: string;
  questionsPrompt?: string;
  coverLetterPrompt?: string;
}

export interface UpdateProfileDto {
  name?: string;
  template?: string;
  instructions?: string;
  questionsPrompt?: string;
  coverLetterPrompt?: string;
  defaultAiModel?: "openai" | "claude";
  defaultAiVersion?: string;
  defaultGenerateFromJson?: boolean;
  defaultFromJsonAiModel?: "openai" | "claude";
  defaultFromJsonAiVersion?: string;
  resumeSettings?: Partial<ResumeSettings>;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  clearOpenaiApiKey?: boolean;
  clearAnthropicApiKey?: boolean;
  currentPassword?: string;
  newPassword?: string;
}

export interface RevealedApiKeysResponse {
  openaiApiKey: string | null;
  anthropicApiKey: string | null;
}

export interface RegisterDto {
  email: string;
  name: string;
  password: string;
}

const api = ApiClient.getInstance();

export const register = async (data: RegisterDto) => {
  const res = await api.post<{ user: UserResponse; access_token: string }>(
    "/api/auth/register",
    data,
  );
  return res.data;
};

export default {
  login: async (email: string, password: string) => {
    const res = await api.post<{ user: User; access_token: string }>(
      `/api/auth/login`,
      {
        email,
        password,
      }
    );
    return res.data;
  },
  loadAccountFunds: async (refresh: boolean = false) => {
    const res = await api.get<AccountFunds>(
      `/api/account-funds/${refresh ? "true" : "false"}`
    );
    return res.data;
  },
};

export const getUsers = async () => {
  const res = await api.get<Array<UserResponse>>("/api/users");
  return res.data;
};

export const getUser = async (id: string) => {
  const res = await api.get<UserResponse>(`/api/users/${id}`);
  return res.data;
};

export const createUser = async (data: CreateUserDto) => {
  const res = await api.post<UserResponse>("/api/users", data);
  return res.data;
};

export const updateUser = async (id: string, data: UpdateUserDto) => {
  const res = await api.put<UserResponse>(`/api/users/${id}`, data);
  return res.data;
};

export const deleteUser = async (id: string) => {
  const res = await api.delete<string>(`/api/users/${id}`);
  return res.data;
};

export const getProfile = async () => {
  const res = await api.get<UserResponse>("/api/users/profile");
  return res.data;
};

export const updateProfile = async (data: UpdateProfileDto) => {
  const res = await api.put<UserResponse>("/api/users/profile", data);
  return res.data;
};

export const revealApiKeys = async (currentPassword: string) => {
  const res = await api.post<RevealedApiKeysResponse>(
    "/api/users/profile/reveal-api-keys",
    { currentPassword },
  );
  return res.data;
};
