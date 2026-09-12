export type SituationType =
  | 'laid_off'
  | 'non_renewal'
  | 'contract_ending'
  | 'pivot';

export type EmploymentType =
  | 'employee'
  | 'sole_proprietor'
  | 'incorporated';

export interface StartingPointLink {
  label: string;
  description: string;
  url: string;
}

export const SITUATION_LABELS: Record<SituationType, string> = {
  laid_off: 'I was laid off',
  non_renewal: 'My contract wasn’t renewed',
  contract_ending: 'My contract is ending soon',
  pivot: 'I’m changing careers',
};

export const SITUATION_FRAMING: Record<SituationType, string> = {
  laid_off:
    'A layoff can make everything feel urgent. Start by getting the facts, documents, and official information in one place.',
  non_renewal:
    'A non-renewal creates a clear transition point. Start by confirming the dates, documents, and money already in motion.',
  contract_ending:
    'With a contract ending, use the remaining time to confirm what closes, what is still owed, and where to check official information.',
  pivot:
    'A career change is easier to navigate when the immediate facts are clear. Start by organizing what you have and the direction you want to test.',
};

const EI_APPLICATION_URL =
  'https://www.canada.ca/en/services/benefits/ei/ei-regular-benefit/apply.html';
const ROE_INFORMATION_URL =
  'https://www.canada.ca/en/employment-social-development/programs/ei/ei-list/ei-roe.html';
const SELF_EMPLOYED_EI_URL =
  'https://www.canada.ca/en/services/benefits/ei/ei-self-employed-workers.html';
const EMPLOYMENT_STATUS_URL =
  'https://www.canada.ca/en/revenue-agency/services/tax/canada-pension-plan-cpp-employment-insurance-ei-rulings/employee-self-employed.html';

const TODAY_ACTIONS: Record<EmploymentType, string[]> = {
  employee: [
    'Write down your final day worked, employer contact, and the dates of any final pay or benefits coverage.',
    'Gather your employment agreement, recent pay stubs, and any termination or benefits documents you received.',
    'Make one list of your available cash and essential monthly costs so the immediate financial picture is visible.',
  ],
  sole_proprietor: [
    'List active client contracts, their end dates, and the contact responsible for each final payment.',
    'Record every outstanding invoice and its expected payment date without counting it as cash already received.',
    'Separate essential personal costs from recurring business costs so you can see both clearly.',
  ],
  incorporated: [
    'List the corporation’s active contracts, end dates, outstanding invoices, and expected payment dates.',
    'Record corporate cash and recurring business costs separately from your personal cash and household costs.',
    'Gather relevant contract, payroll, and shareholder records before reviewing the official status information below.',
  ],
};

const EMPLOYEE_WEEK_LINKS: StartingPointLink[] = [
  {
    label: 'Review the EI application process',
    description:
      'Service Canada explains the application steps, timing, and information it may request.',
    url: EI_APPLICATION_URL,
  },
  {
    label: 'Check how Records of Employment work',
    description:
      'The federal ROE page explains what the document records and how electronic and paper ROEs are handled.',
    url: ROE_INFORMATION_URL,
  },
];

const SELF_EMPLOYED_WEEK_LINKS: StartingPointLink[] = [
  {
    label: 'Review EI information for self-employed people',
    description:
      'Service Canada explains its self-employed special-benefits program and the conditions it considers.',
    url: SELF_EMPLOYED_EI_URL,
  },
  {
    label: 'Check how employment status is determined',
    description:
      'The CRA explains the factors used to distinguish employment from self-employment and how to request a ruling.',
    url: EMPLOYMENT_STATUS_URL,
  },
];

export function getTodayActions(employmentType: EmploymentType): string[] {
  return TODAY_ACTIONS[employmentType];
}

export function getThisWeekLinks(
  employmentType: EmploymentType,
): StartingPointLink[] {
  return employmentType === 'employee'
    ? EMPLOYEE_WEEK_LINKS
    : SELF_EMPLOYED_WEEK_LINKS;
}
