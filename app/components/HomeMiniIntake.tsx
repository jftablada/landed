'use client';

import { useState } from 'react';
import { trackEvent } from '@/lib/analytics';
import {
  estimateRoughRunwayWeeks,
  formatRoughRunway,
  getThisWeekLinks,
  getTodayActions,
  SITUATION_FRAMING,
  SITUATION_LABELS,
  type EmploymentType,
  type SituationType,
} from '@/lib/core/freeStartingPoint';

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

interface ProvinceResources {
  name: string;
  employmentStandardsUrl: string;
  employmentServicesUrl: string;
}

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

interface HomeMiniIntakeProps {
  checkoutUrl: string;
}

export default function HomeMiniIntake({ checkoutUrl }: HomeMiniIntakeProps) {
  const [situation, setSituation] = useState<SituationType>('laid_off');
  const [province, setProvince] = useState<ProvinceCode>('ON');
  const [employmentType, setEmploymentType] =
    useState<EmploymentType>('employee');
  const [showResult, setShowResult] = useState(false);
  const [roughCash, setRoughCash] = useState('');
  const [roughMonthlyCosts, setRoughMonthlyCosts] = useState('');
  const [roughRunwayWeeks, setRoughRunwayWeeks] = useState<number | null>(null);
  const [roughRunwayError, setRoughRunwayError] = useState<string | null>(null);

  const selectedProvince = PROVINCE_RESOURCES[province];
  const todayActions = getTodayActions(employmentType);
  const thisWeekLinks = getThisWeekLinks(employmentType);
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
    setRoughCash('');
    setRoughMonthlyCosts('');
    setRoughRunwayWeeks(null);
    setRoughRunwayError(null);
  }

  function updateRoughInput(
    setter: (value: string) => void,
    value: string,
  ) {
    setter(value);
    setRoughRunwayWeeks(null);
    setRoughRunwayError(null);
  }

  function calculateRoughRunway() {
    const cash = Number(roughCash);
    const monthlyCosts = Number(roughMonthlyCosts);
    const estimate = estimateRoughRunwayWeeks(cash, monthlyCosts);

    if (roughCash === '' || cash < 0 || !Number.isFinite(cash)) {
      setRoughRunwayError('Enter the cash you have available today.');
      return;
    }
    if (
      roughMonthlyCosts === '' ||
      monthlyCosts <= 0 ||
      !Number.isFinite(monthlyCosts) ||
      estimate === null
    ) {
      setRoughRunwayError('Enter monthly essential costs greater than $0.');
      return;
    }

    setRoughRunwayError(null);
    setRoughRunwayWeeks(estimate);
    trackEvent('free_runway_estimated');
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
              See your first steps.
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
                  Your first steps
                </p>
                <h3 className="mt-2 font-display text-3xl text-text">
                  A clearer place to begin
                </h3>
                <p className="mt-2 text-sm text-muted">
                  Based on “{SITUATION_LABELS[situation]}” in {selectedProvince.name}.
                </p>
                <p className="mt-4 text-sm leading-relaxed text-text">
                  {SITUATION_FRAMING[situation]}
                </p>

                <section className="mt-8 border-t border-hair pt-6">
                  <p className="text-xs uppercase tracking-widest text-brand">
                    Today
                  </p>
                  <h4 className="mt-2 font-display text-2xl text-text">
                    Get the immediate facts together
                  </h4>
                  <ol className="mt-4 space-y-4">
                    {todayActions.map((action, index) => (
                      <li key={action} className="flex gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand">
                        {index + 1}
                      </span>
                      <span className="pt-0.5 text-sm leading-relaxed text-text">
                        {action}
                      </span>
                      </li>
                    ))}
                  </ol>
                </section>

                <section className="mt-8 border-t border-hair pt-6">
                  <p className="text-xs uppercase tracking-widest text-brand">
                    This week
                  </p>
                  <h4 className="mt-2 font-display text-2xl text-text">
                    Check the federal information in order
                  </h4>
                  <div className="mt-4 space-y-3">
                    {thisWeekLinks.map(({ label, description, url }, index) => (
                      <a
                        key={label}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex gap-4 rounded-lg border border-hair bg-surface-2 px-4 py-4 transition-colors hover:border-brand"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-brand/40 text-sm font-semibold text-brand">
                          {index + 1}
                        </span>
                        <span>
                          <span className="block text-sm font-medium text-text">
                            {label} <span aria-hidden className="text-brand">↗</span>
                          </span>
                          <span className="mt-1 block text-xs leading-relaxed text-muted">
                            {description}
                          </span>
                        </span>
                      </a>
                    ))}
                  </div>
                </section>

                <section className="mt-8 border-t border-hair pt-6">
                  <p className="text-xs uppercase tracking-widest text-brand">
                    Your province
                  </p>
                  <h4 className="mt-2 font-display text-2xl text-text">
                    Official {selectedProvince.name} resources
                  </h4>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {[
                      {
                        label: 'Employment standards',
                        description:
                          'Official information on workplace rights and employer obligations.',
                        url: selectedProvince.employmentStandardsUrl,
                      },
                      {
                        label: 'Employment services',
                        description:
                          'Government-supported job-search, career, and training services.',
                        url: selectedProvince.employmentServicesUrl,
                      },
                    ].map(({ label, description, url }) => (
                      <a
                        key={label}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-hair bg-surface-2 px-4 py-4 transition-colors hover:border-brand"
                      >
                        <span className="block text-sm font-medium text-text">
                          {label} <span aria-hidden className="text-brand">↗</span>
                        </span>
                        <span className="mt-1 block text-xs leading-relaxed text-muted">
                          {description}
                        </span>
                      </a>
                    ))}
                  </div>
                </section>

                <p className="mt-6 text-xs leading-relaxed text-muted">
                  General information only—not legal, financial, tax, benefits,
                  or eligibility advice. The responsible government service
                  determines what applies to your situation.
                </p>

                <div className="mt-8 rounded-xl border border-brand/30 bg-brand-soft/20 p-5">
                  <p className="text-xs uppercase tracking-widest text-brand">
                    What Landed adds
                  </p>
                  <h4 className="font-display text-2xl text-text">
                    Turn official information into your plan
                  </h4>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    This free starting point shows what to investigate. The full
                    roadmap uses your cash, monthly costs, and confirmed support
                    to calculate your runway and order your next actions. Each
                    check-in then changes the plan based on what actually
                    happened—applications, responses, interviews, offers, and
                    financial shifts.
                  </p>

                  <div className="mt-5 rounded-lg border border-hair bg-surface-2 p-4">
                    <p className="text-sm font-medium text-text">
                      Try a rough cash-runway check
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted">
                      Use cash available today and essential monthly costs. The
                      estimate stays in your browser and is not saved.
                    </p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <label className="text-xs text-muted">
                        Available cash ($)
                        <input
                          type="number"
                          min="0"
                          step="100"
                          inputMode="decimal"
                          value={roughCash}
                          onChange={(event) =>
                            updateRoughInput(setRoughCash, event.target.value)
                          }
                          className="mt-1.5 w-full rounded-lg border border-hair bg-surface px-3 py-2.5 text-base text-text focus:border-brand focus:outline-none"
                        />
                      </label>
                      <label className="text-xs text-muted">
                        Essential monthly costs ($)
                        <input
                          type="number"
                          min="1"
                          step="100"
                          inputMode="decimal"
                          value={roughMonthlyCosts}
                          onChange={(event) =>
                            updateRoughInput(
                              setRoughMonthlyCosts,
                              event.target.value,
                            )
                          }
                          className="mt-1.5 w-full rounded-lg border border-hair bg-surface px-3 py-2.5 text-base text-text focus:border-brand focus:outline-none"
                        />
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={calculateRoughRunway}
                      className="mt-4 rounded-lg border border-brand px-4 py-2.5 text-sm font-semibold text-brand transition-colors hover:bg-brand-soft/30"
                    >
                      Estimate my rough runway
                    </button>

                    {roughRunwayError && (
                      <p className="mt-3 text-sm text-red-400">
                        {roughRunwayError}
                      </p>
                    )}

                    {roughRunwayWeeks !== null && (
                      <div className="mt-4 border-t border-hair pt-4" aria-live="polite">
                        <p className="text-xs uppercase tracking-widest text-muted">
                          Rough cash runway
                        </p>
                        <p className="mt-1 font-display text-4xl text-brand">
                          {formatRoughRunway(roughRunwayWeeks)}
                        </p>
                        <p className="mt-2 text-xs leading-relaxed text-muted">
                          Cash divided by essential monthly costs. This does not
                          include income, EI, taxes, debt payments, pending
                          invoices, or other obligations unless you included
                          them in the numbers above.
                        </p>
                      </div>
                    )}
                  </div>

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
