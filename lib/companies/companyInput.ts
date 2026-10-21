export const NEXT_STEPS = {
  research: 'Research',
  contact: 'Reach out',
  apply: 'Apply',
} as const;
export type NextStep = keyof typeof NEXT_STEPS;
export type CompanyInput = {
  company_name: string;
  why_fit: string;
  target_role: string;
  next_step: NextStep;
};
export type TargetCompany = CompanyInput & {
  id: string;
  created_at: string;
  updated_at: string;
};
export const COMPANY_COLUMNS =
  'id,company_name,why_fit,target_role,next_step,created_at,updated_at';

export function parseCompanyInput(
  value: unknown,
  editing = false,
): (CompanyInput & { id?: string }) | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  const allowed = [
    'company_name',
    'why_fit',
    'target_role',
    'next_step',
    ...(editing ? ['id'] : []),
  ];
  if (Object.keys(v).some((key) => !allowed.includes(key))) return null;
  if (
    typeof v.company_name !== 'string' ||
    !v.company_name.trim() ||
    v.company_name.trim().length > 120
  )
    return null;
  if (typeof v.why_fit !== 'string' || v.why_fit.trim().length > 600)
    return null;
  if (typeof v.target_role !== 'string' || v.target_role.trim().length > 120)
    return null;
  if (
    typeof v.next_step !== 'string' ||
    !Object.hasOwn(NEXT_STEPS, v.next_step)
  )
    return null;
  if (
    editing &&
    (typeof v.id !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        v.id,
      ))
  )
    return null;
  return {
    company_name: v.company_name.trim(),
    why_fit: v.why_fit.trim(),
    target_role: v.target_role.trim(),
    next_step: v.next_step as NextStep,
    ...(editing ? { id: v.id as string } : {}),
  };
}
