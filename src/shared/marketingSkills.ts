import catalog from './marketingCatalog.json';

export const MARKETING_CATALOG = catalog;
export const MARKETING_FOUNDATION = 'marketing:product-marketing';
export const BUNDLED_SKILL_IDS: ReadonlySet<string> = new Set([
  'md-hive-sync', 'md-fetch-summarize', 'md-audit', ...catalog.skills.map(s => s.id)
]);
export const MAX_SELECTED_SKILLS = 8;

export function validateSkillSelection(value: unknown): { skills: string[]; error?: string } {
  if (value === undefined) return { skills: [] };
  if (!Array.isArray(value) || value.length > MAX_SELECTED_SKILLS) return { skills: [], error: 'Select at most 8 bundled skills.' };
  const skills: string[] = [];
  for (const raw of value) {
    if (typeof raw !== 'string' || !BUNDLED_SKILL_IDS.has(raw.trim())) return { skills: [], error: 'Unknown bundled skill id.' };
    const id = raw.trim();
    if (skills.includes(id)) return { skills: [], error: 'Duplicate skill id.' };
    skills.push(id);
  }
  if (skills.some(s => s.startsWith('marketing:')) && !skills.includes(MARKETING_FOUNDATION)) {
    return { skills: [], error: 'Marketing skills require product-marketing within the 8-skill limit.' };
  }
  return { skills };
}

const preset = (id: string, name: string, description: string, names: string[]) => ({
  id, name, description,
  goal: `${description}. Read the shared product marketing context first. Work on the assigned objective and produce evidence-backed drafts. Use only configured tools and the user's authorized scope.`,
  skills: ['product-marketing', ...names].map(n => `marketing:${n}`)
});

export const MARKETING_ROLES = [
  preset('lead', 'Marketing Lead', 'Strategy, positioning, offers and launch planning', ['marketing-plan', 'customer-research', 'competitor-profiling', 'offers', 'pricing', 'launch', 'marketing-ideas']),
  preset('content', 'Content & Brand', 'Editorial planning, copy and creative briefs', ['content-strategy', 'copywriting', 'copy-editing', 'social', 'marketing-psychology', 'image', 'video']),
  preset('seo', 'SEO Specialist', 'Search visibility and site structure', ['seo-audit', 'ai-seo', 'programmatic-seo', 'site-architecture', 'schema', 'competitors']),
  preset('performance', 'Performance Marketing', 'Paid campaign plans, conversion and measurement', ['ads', 'ad-creative', 'cro', 'ab-testing', 'analytics', 'attribution', 'lead-magnets']),
  preset('lifecycle', 'Lifecycle & CRM', 'Activation, retention and lifecycle communications', ['emails', 'onboarding', 'signup', 'churn-prevention', 'referrals', 'paywalls', 'sms']),
  preset('sales', 'Sales & RevOps', 'Prospecting, sales materials and revenue operations', ['revops', 'prospecting', 'cold-email', 'sales-enablement', 'customer-research', 'offers', 'competitor-profiling'])
];

export interface MarketingProvisioning {
  version: string;
  commit: string;
  contextPath: string;
  contextExists: boolean;
  entries: Array<{ id: string; path: string; status: 'provisioned' | 'failed'; error?: string }>;
}

export interface MarketingLibraryView {
  bundled: boolean;
  error?: string;
  selected: string[];
  provisioning?: MarketingProvisioning;
  contextPath?: string;
  contextExists: boolean;
}
