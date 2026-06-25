export const SKILL_CATEGORIES = [
  'Languages',
  'Backend',
  'Frontend',
  'AI & Automation',
  'Cloud & DevOps',
  'Database',
  'Tools',
  'Testing',
  'Industry',
  'Methodology',
  'Mobile',
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

export interface ResumePdfSettings {
  showTitle: boolean;
  showSubTitle: boolean;
  showCompanySkills: boolean;
  skillCategories: SkillCategory[];
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

export const DEFAULT_RESUME_PDF_SETTINGS: ResumePdfSettings = {
  showTitle: true,
  showSubTitle: true,
  showCompanySkills: true,
  skillCategories: [...SKILL_CATEGORIES],
};

const SKILL_CATEGORY_SET = new Set<string>(SKILL_CATEGORIES);

function clampCount(value: unknown, fallback: number, max = 30): number {
  const parsed = typeof value === 'number' ? value : Number(value);
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
        typeof category === 'string' && SKILL_CATEGORY_SET.has(category),
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

export function getResumePdfSettings(
  settings: ResumeSettings,
): ResumePdfSettings {
  return {
    showTitle: settings.showTitle,
    showSubTitle: settings.showSubTitle,
    showCompanySkills: settings.showCompanySkills,
    skillCategories: settings.skillCategories,
  };
}

export function filterSkillsForPdf(
  skills: Array<{ category: string; items: string[] }>,
  enabledCategories: SkillCategory[] | undefined,
): Array<{ category: string; items: string[] }> {
  const enabled = new Set(
    enabledCategories && enabledCategories.length > 0
      ? normalizeSkillCategories(enabledCategories)
      : [...SKILL_CATEGORIES],
  );

  const normalizedSkills = Array.isArray(skills) ? skills : [];

  const skillsByCategory = new Map(
    normalizedSkills.map((skill) => [skill.category, skill]),
  );

  return SKILL_CATEGORIES.filter((category) => enabled.has(category))
    .map((category) => skillsByCategory.get(category))
    .filter(
      (skill): skill is { category: string; items: string[] } =>
        !!skill && Array.isArray(skill.items) && skill.items.length > 0,
    );
}
