'use client';

import { useState } from 'react';
import { trackEvent } from '@/lib/analytics';

type ProvinceCode =
  | 'AB'
  | 'BC'
  | 'MB'
  | 'NB'
  | 'NL'
  | 'NS'
  | 'NT'
  | 'NU'
  | 'ON'
  | 'PE'
  | 'QC'
  | 'SK'
  | 'YT';

type SituationType = 'laid_off' | 'non_renewal' | 'contract_ending' | 'pivot';
type EmploymentType = 'employee' | 'sole_proprietor' | 'incorporated';

interface ProvinceResources {
  name: string;
  employmentStandardsUrl: string;
  employmentServicesUrl: string;
}

const FEDERAL_RESOURCES = {
  eiApplicationUrl:
    'https://www.canada.ca/en/services/benefits/ei/ei-regular-benefit/apply.html',
  roeInformationUrl:
    'https://www.canada.ca/en/employment-social-development/programs/ei/ei-list/ei-roe.html',
};

const PROVINCE_RESOURCES: Record<ProvinceCode, ProvinceResources> = {
  AB: {
    name: 'Alberta',
    employmentStandardsUrl: 'https://www.alberta.ca/employment-standards',
    employmentServicesUrl: 'https://www.alberta.ca/training-and-employment-services',
  },
  BC: {
    name: 'British Columbia',
    employmentStandardsUrl:
      'https://www2.gov.bc.ca/gov/content/employment-business/employment-standards-advice/employment-standards',
    employmentServicesUrl: 'https://www.workbc.ca/',
  },
  MB: {
    name: 'Manitoba',
    employmentStandardsUrl: 'https://www.gov.mb.ca/labour/standards/index.html',
    employmentServicesUrl: 'https://www.gov.mb.ca/wd/ites/tes/jobs_careers.html',
  },
  NB: {
    name: 'New Brunswick',
    employmentStandardsUrl:
      'https://www.gnb.ca/en/topic/jobs-workplaces/labour-market-workforce/employment-standards.html',
    employmentServicesUrl: 'https://workingnb.ca/individuals/job-search',
  },
  NL: {
    name: 'Newfoundland and Labrador',
    employmentStandardsUrl: 'https://www.gov.nl.ca/gs/labour/nonunion/',
    employmentServicesUrl: 'https://www.gov.nl.ca/jgrd/empservices/',
  },
  NS: {
    name: 'Nova Scotia',
    employmentStandardsUrl: 'https://novascotia.ca/lae/employmentrights/',
    employmentServicesUrl: 'https://www.novascotia.ca/works/',
  },
  NT: {
    name: 'Northwest Territories',
    employmentStandardsUrl: 'https://www.ece.gov.nt.ca/en/employment-standards',
    employmentServicesUrl:
      'https://www.gov.nt.ca/en/services/employment-training-business',
  },
  NU: {
    name: 'Nunavut',
    employmentStandardsUrl: 'https://nu-lsco.ca/',
    employmentServicesUrl:
      'https://www.gov.nu.ca/sites/default/files/forms/2025-05/EAS_Application_Form_-_Electronically_Fillable.pdf',
  },
  ON: {
    name: 'Ontario',
    employmentStandardsUrl:
      'https://www.ontario.ca/document/your-guide-employment-standards-act-0',
    employmentServicesUrl: 'https://www.ontario.ca/page/employment-ontario',
  },
  PE: {
    name: 'Prince Edward Island',
    employmentStandardsUrl:
      'https://www.princeedwardisland.ca/en/topic/employment-standards',
    employmentServicesUrl:
      'https://www.princeedwardisland.ca/en/topic/skillspei',
  },
  QC: {
    name: 'Quebec',
    employmentStandardsUrl:
      'https://www.cnesst.gouv.qc.ca/en/working-conditions',
    employmentServicesUrl:
      'https://www.quebec.ca/en/employment/request-information-employment-assistance-services',
  },
  SK: {
    name: 'Saskatchewan',
    employmentStandardsUrl:
      'https://www.saskatchewan.ca/business/employment-standards',
    employmentServicesUrl:
      'https://www.saskatchewan.ca/residents/jobs-working-and-training/saskjobs-career-services',
  },
  YT: {
    name: 'Yukon',
    employmentStandardsUrl: 'https://yukon.ca/en/employment/employment-standards',
    employmentServicesUrl: 'https://yukon.ca/en/employment',
  },
};

const PROVINCES = Object.entries(PROVINCE_RESOURCES) as Array<
  [ProvinceCode, ProvinceResources]
>;

const SITUATION_LABELS: Record<SituationType, string> = {
  laid_off: 'I was laid off',
  non_renewal: 'My contract wasn’t renewed',
  contract_ending: 'My contract is ending soon',
  pivot: 'I’m changing careers',
};

function getPriorities(
  situation: SituationType,
  employmentType: EmploymentType,
): string[] {
  const workEnding = situation !== 'pivot';
  const first =
    employmentType === 'employee'
      ? 'Confirm your final pay details and when your Record of Employment will be issued.'
      : 'Review your contract, outstanding invoices, and the date your current income ends.';
  const second = workEnding
    ? 'Check the official benefit and employment-standard links below before making assumptions about eligibility.'
    : 'Define the role direction you are moving toward before broadening your search.';

  return [
    first,
    second,
    'Write down your available cash and essential monthly costs—the full roadmap uses them to calculate your runway.',
  ];
}

interface HomeMiniIntakeProps {
  checkoutUrl: string;
}

export default function HomeMiniIntake({ checkoutUrl }: HomeMiniIntakeProps) {
  const [situation, setSituation] = useState<SituationType>('laid_off');
  const [province, setProvince] = useState<ProvinceCode>('ON');
  const [employmentType, setEmploymentType] =
    useState<EmploymentType>('employee');
  const [showResult, setShowResult] = useState(false);

  const selectedProvince = PROVINCE_RESOURCES[province];
  const priorities = getPriorities(situation, employmentType);
  const fieldClass =
    'w-full rounded-lg border border-hair bg-surface-2 px-3 py-3 text-base text-text focus:border-brand focus:outline-none';

  function buildStartingPoint() {
    trackEvent('free_starting_point_generated');
    setShowResult(true);
    window.requestAnimationFrame(() => {
      document
        .getElementById('free-starting-point')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function resetPreview() {
    setShowResult(false);
  }

  return (
    <section id="free-preview" className="border-b border-hair">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-sm uppercase tracking-widest text-brand">
              Free starting point
            </p>
            <h2 className="mt-3 font-display text-4xl leading-tight text-text sm:text-5xl">
              See your first three moves.
            </h2>
            <p className="mt-4 max-w-md leading-relaxed text-muted">
              Answer three quick questions for a private, Canadian starting
              point. No account required and nothing is saved.
            </p>
          </div>

          <div className="rounded-2xl border border-hair bg-surface p-6 sm:p-8">
            {!showResult ? (
              <div className="space-y-5">
                <div>
                  <label htmlFor="preview-situation" className="mb-1.5 block text-sm text-muted">
                    What happened?
                  </label>
                  <select
                    id="preview-situation"
                    value={situation}
                    onChange={(event) =>
                      setSituation(event.target.value as SituationType)
                    }
                    className={fieldClass}
                  >
                    {Object.entries(SITUATION_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="preview-province" className="mb-1.5 block text-sm text-muted">
                    Province or territory
                  </label>
                  <select
                    id="preview-province"
                    value={province}
                    onChange={(event) =>
                      setProvince(event.target.value as ProvinceCode)
                    }
                    className={fieldClass}
                  >
                    {PROVINCES.map(([code, details]) => (
                      <option key={code} value={code}>
                        {details.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="preview-work-type" className="mb-1.5 block text-sm text-muted">
                    Your work type
                  </label>
                  <select
                    id="preview-work-type"
                    value={employmentType}
                    onChange={(event) =>
                      setEmploymentType(event.target.value as EmploymentType)
                    }
                    className={fieldClass}
                  >
                    <option value="employee">Employee</option>
                    <option value="sole_proprietor">Sole proprietor</option>
                    <option value="incorporated">Incorporated contractor</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={buildStartingPoint}
                  className="rounded-lg bg-brand px-6 py-3 font-semibold text-black transition-opacity hover:opacity-90"
                >
                  Show my starting point
                </button>
                <p className="text-xs leading-relaxed text-muted">
                  This preview runs only in your browser. It does not create an
                  account or send your answers to Landed.
                </p>
              </div>
            ) : (
              <div id="free-starting-point" className="scroll-mt-6" aria-live="polite">
                <p className="text-sm uppercase tracking-widest text-brand">
                  Your starting point
                </p>
                <h3 className="mt-2 font-display text-3xl text-text">
                  Three moves to make first
                </h3>
                <p className="mt-2 text-sm text-muted">
                  Based on “{SITUATION_LABELS[situation]}” in {selectedProvince.name}.
                </p>

                <ol className="mt-6 space-y-4">
                  {priorities.map((priority, index) => (
                    <li key={priority} className="flex gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand">
                        {index + 1}
                      </span>
                      <span className="pt-0.5 text-sm leading-relaxed text-text">
                        {priority}
                      </span>
                    </li>
                  ))}
                </ol>

                <div className="mt-8 border-t border-hair pt-6">
                  <h4 className="font-semibold text-text">Official places to check</h4>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {[
                      ['EI application', FEDERAL_RESOURCES.eiApplicationUrl],
                      ['Record of Employment', FEDERAL_RESOURCES.roeInformationUrl],
                      [`${selectedProvince.name} employment standards`, selectedProvince.employmentStandardsUrl],
                      [`${selectedProvince.name} employment services`, selectedProvince.employmentServicesUrl],
                    ].map(([label, url]) => (
                      <a
                        key={label}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-hair bg-surface-2 px-4 py-3 text-sm text-text transition-colors hover:border-brand"
                      >
                        {label} <span aria-hidden className="text-brand">↗</span>
                      </a>
                    ))}
                  </div>
                  <p className="mt-4 text-xs leading-relaxed text-muted">
                    General information only—not legal, financial, or eligibility
                    advice. The responsible government service makes eligibility
                    decisions.
                  </p>
                </div>

                <div className="mt-8 rounded-xl border border-brand/30 bg-brand-soft/20 p-5">
                  <h4 className="font-display text-2xl text-text">
                    Turn this into a complete 90-day plan
                  </h4>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    The full roadmap calculates your financial runway, orders
                    your next actions by urgency, and adapts through check-ins.
                  </p>
                  <a
                    href={checkoutUrl}
                    onClick={() => trackEvent('begin_checkout')}
                    className="mt-5 inline-flex rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90"
                  >
                    Build my full 90-day roadmap
                  </a>
                  <p className="mt-3 text-xs text-muted">
                    $5 CAD · one-time founding customer price · no subscription
                  </p>
                </div>

                <button
                  type="button"
                  onClick={resetPreview}
                  className="mt-5 text-sm text-muted underline underline-offset-4 hover:text-text"
                >
                  Change my answers
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
