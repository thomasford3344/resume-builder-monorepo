export const SKILL_CATEGORIES = [
  "Languages",
  "Backend",
  "Frontend",
  "AI & Automation",
  "Cloud & DevOps",
  "Database",
  "Tools",
  "Testing",
  "Industry",
  "Methodology",
  "Mobile",
] as const;

export type SkillCategory = (typeof SKILL_CATEGORIES)[number];

export interface ResumeSettings {
  showTitle: boolean;
  showSubTitle: boolean;
  showCompanySkills: boolean;
  skillCategories: SkillCategory[];
  useDefaultOutputFormat: boolean;
  responsibilitiesCount: number;
  achievementsCount: number;
  skillsPerCategoryCount: number;
  companySkillsCount: number;
}

export const DEFAULT_RESUME_SETTINGS: ResumeSettings = {
  showTitle: true,
  showSubTitle: true,
  showCompanySkills: true,
  skillCategories: [...SKILL_CATEGORIES],
  useDefaultOutputFormat: true,
  responsibilitiesCount: 3,
  achievementsCount: 5,
  skillsPerCategoryCount: 8,
  companySkillsCount: 8,
};

const SKILL_CATEGORY_SET = new Set<string>(SKILL_CATEGORIES);

function clampCount(value: unknown, fallback: number, max = 30): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(max, Math.max(0, Math.round(parsed)));
}

export function normalizeSkillCategories(
  categories: unknown,
): SkillCategory[] {
  if (!Array.isArray(categories)) {
    return [...SKILL_CATEGORIES];
  }

  const enabled = new Set(
    categories.filter(
      (category): category is SkillCategory =>
        typeof category === "string" && SKILL_CATEGORY_SET.has(category),
    ),
  );

  if (enabled.size === 0) {
    return [...SKILL_CATEGORIES];
  }

  return SKILL_CATEGORIES.filter((category) => enabled.has(category));
}

export function resolveResumeSettings(
  partial?: Partial<ResumeSettings> | null,
): ResumeSettings {
  const base = {
    ...DEFAULT_RESUME_SETTINGS,
    ...(partial ?? {}),
  };

  return {
    showTitle: partial?.showTitle ?? base.showTitle ?? true,
    showSubTitle: partial?.showSubTitle ?? base.showSubTitle ?? true,
    showCompanySkills:
      partial?.showCompanySkills ?? base.showCompanySkills ?? true,
    skillCategories: normalizeSkillCategories(base.skillCategories),
    useDefaultOutputFormat:
      partial?.useDefaultOutputFormat ?? base.useDefaultOutputFormat ?? true,
    responsibilitiesCount: clampCount(
      base.responsibilitiesCount,
      DEFAULT_RESUME_SETTINGS.responsibilitiesCount,
    ),
    achievementsCount: clampCount(
      base.achievementsCount,
      DEFAULT_RESUME_SETTINGS.achievementsCount,
    ),
    skillsPerCategoryCount: clampCount(
      base.skillsPerCategoryCount,
      DEFAULT_RESUME_SETTINGS.skillsPerCategoryCount,
    ),
    companySkillsCount: clampCount(
      base.companySkillsCount,
      DEFAULT_RESUME_SETTINGS.companySkillsCount,
    ),
  };
}

export function resumeSettingsEqual(
  a: ResumeSettings,
  b: ResumeSettings,
): boolean {
  if (
    a.showTitle !== b.showTitle ||
    a.showSubTitle !== b.showSubTitle ||
    a.showCompanySkills !== b.showCompanySkills ||
    a.useDefaultOutputFormat !== b.useDefaultOutputFormat ||
    a.responsibilitiesCount !== b.responsibilitiesCount ||
    a.achievementsCount !== b.achievementsCount ||
    a.skillsPerCategoryCount !== b.skillsPerCategoryCount ||
    a.companySkillsCount !== b.companySkillsCount
  ) {
    return false;
  }

  if (a.skillCategories.length !== b.skillCategories.length) {
    return false;
  }

  return a.skillCategories.every(
    (category, index) => category === b.skillCategories[index],
  );
}
