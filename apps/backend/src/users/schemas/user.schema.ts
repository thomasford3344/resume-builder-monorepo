import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import * as bcrypt from 'bcrypt';
import {
  DEFAULT_RESUME_SETTINGS,
  SKILL_CATEGORIES,
} from '../../ai/resume-settings';

export type UserDocument = HydratedDocument<User>;

@Schema({ _id: false })
export class ResumeSettingsEmbedded {
  @Prop({ default: true })
  showTitle: boolean;

  @Prop({ default: true })
  showSubTitle: boolean;

  @Prop({ default: true })
  showCompanySkills: boolean;

  @Prop({ type: [String], default: () => [...SKILL_CATEGORIES] })
  skillCategories: string[];

  @Prop({ default: DEFAULT_RESUME_SETTINGS.useDefaultOutputFormat })
  useDefaultOutputFormat: boolean;

  @Prop({ default: DEFAULT_RESUME_SETTINGS.responsibilitiesCount })
  responsibilitiesCount: number;

  @Prop({ default: DEFAULT_RESUME_SETTINGS.achievementsCount })
  achievementsCount: number;

  @Prop({ default: DEFAULT_RESUME_SETTINGS.skillsPerCategoryCount })
  skillsPerCategoryCount: number;

  @Prop({ default: DEFAULT_RESUME_SETTINGS.companySkillsCount })
  companySkillsCount: number;
}

@Schema()
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: 'user', enum: ['user', 'admin'] })
  role: string;

  @Prop({
    default: 'template1',
    enum: ['template1', 'template2', 'template3', 'template4', 'template5', 'template6'],
  })
  template: string;

  @Prop({ type: String, required: false })
  instructions?: string;

  @Prop({ type: String, required: false })
  questionsPrompt?: string;

  @Prop({ type: String, required: false })
  coverLetterPrompt?: string;

  @Prop({ default: 'claude', enum: ['openai', 'claude'] })
  defaultAiModel: string;

  @Prop({ default: 'claude-sonnet-4-6' })
  defaultAiVersion: string;

  @Prop({ default: false })
  defaultGenerateFromJson: boolean;

  @Prop({ default: 'openai', enum: ['openai', 'claude'] })
  defaultFromJsonAiModel: string;

  @Prop({ default: 'gpt-5.5-thinking' })
  defaultFromJsonAiVersion: string;

  @Prop({ type: String, required: false, select: false })
  encryptedOpenaiApiKey?: string;

  @Prop({ type: String, required: false, select: false })
  encryptedAnthropicApiKey?: string;

  @Prop({
    type: ResumeSettingsEmbedded,
    default: () => ({ ...DEFAULT_RESUME_SETTINGS }),
  })
  resumeSettings: ResumeSettingsEmbedded;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Hash password before saving
UserSchema.pre('save', async function () {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});
