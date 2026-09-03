'use client';

// app/intake/page.tsx — STYLED to the Landed design system.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LogoutButton from '@/app/components/LogoutButton';

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

type IntakeStep = 'start' | 'resources' | 'financials';

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
    employmentServicesUrl:
      'https://www.alberta.ca/training-and-employment-services',
  },
  BC: {
    name: 'British Columbia',
    employmentStandardsUrl:
      'https://www2.gov.bc.ca/gov/content/employment-business/employment-standards-advice/employment-standards',
    employmentServicesUrl: 'https://www.workbc.ca/',
  },
  MB: {
    name: 'Manitoba',
    employmentStandardsUrl:
      'https://www.gov.mb.ca/labour/standards/index.html',
    employmentServicesUrl:
      'https://www.gov.mb.ca/wd/ites/tes/jobs_careers.html',
  },
  NB: {
    name: 'New Brunswick',
    employmentStandardsUrl:
      'https://www.gnb.ca/en/topic/jobs-workplaces/labour-market-workforce/employment-standards.html',
    employmentServicesUrl: 'https://workingnb.ca/individuals/job-search',
  },
  NL: {
    name: 'Newfoundland and Labrador',
    employmentStandardsUrl:
      'https://www.gov.nl.ca/gs/labour/nonunion/',
    employmentServicesUrl: 'https://www.gov.nl.ca/jgrd/empservices/',
  },
  NS: {
    name: 'Nova Scotia',
    employmentStandardsUrl:
      'https://novascotia.ca/lae/employmentrights/',
    employmentServicesUrl: 'https://www.novascotia.ca/works/',
  },
  NT: {
    name: 'Northwest Territories',
    employmentStandardsUrl:
      'https://www.ece.gov.nt.ca/en/employment-standards',
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
    employmentStandardsUrl:
      'https://yukon.ca/en/employment/employment-standards',
    employmentServicesUrl: 'https://yukon.ca/en/employment',
  },
};

const PROVINCES = Object.entries(PROVINCE_RESOURCES) as Array<
  [ProvinceCode, ProvinceResources]
>;

export default function IntakePage() {
  const router = useRouter();

  const [step, setStep] = useState<IntakeStep>('start');
  const [situationType, setSituationType] = useState('laid_off');
  const [employmentType, setEmploymentType] = useState('employee');
  const [province, setProvince] = useState<ProvinceCode>('ON');
  const [housingType, setHousingType] = useState('rent');
  const [dependentsCount, setDependentsCount] = useState('0');
  const [confirmedCash, setConfirmedCash] = useState('');
  const [essentialBurn, setEssentialBurn] = useState('');
  const [debtMinimums, setDebtMinimums] = useState('0');
  const [taxStatus, setTaxStatus] = useState('none');
  const [taxAmount, setTaxAmount] = useState('');
  const [taxPlanMonthly, setTaxPlanMonthly] = useState('');
  const [eiStatus, setEiStatus] = useState('not_applied');
  const [eiAmount, setEiAmount] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const taxUnsure = taxStatus === 'unsure';
  const selectedProvince = PROVINCE_RESOURCES[province];

  function showResources() {
    setError(null);
    setStep('resources');
  }

  function showFinancials() {
    setError(null);
    setStep('financials');
  }

  async function handleSubmit() {
    setError(null);

    if (taxUnsure) {
      setError('Please check your CRA balance first, then come back.');
      return;
    }
    if (confirmedCash === '' || isNaN(Number(confirmedCash))) {
      setError('Enter your confirmed cash (a number).');
      return;
    }
    if (essentialBurn === '' || Number(essentialBurn) <= 0) {
      setError('Enter your essential monthly burn (greater than 0).');
      return;
    }
    if (
      taxStatus === 'has_amount' &&
      (taxAmount === '' || isNaN(Number(taxAmount)))
    ) {
      setError('Enter roughly how much tax you owe.');
      return;
    }
    if (
      taxStatus === 'on_plan' &&
      (taxPlanMonthly === '' || isNaN(Number(taxPlanMonthly)))
    ) {
      setError('Enter your monthly tax payment.');
      return;
    }
    if (
      (eiStatus === 'approved' || eiStatus === 'receiving') &&
      (eiAmount === '' || isNaN(Number(eiAmount)))
    ) {
      setError('Enter your monthly EI amount.');
      return;
    }

    setSubmitting(true);
    try {
      const intakeBody = {
        situation_type: situationType,
        employment_type: employmentType,
        province,
        housing_type: housingType,
        dependents_count: Number(dependentsCount) || 0,
        confirmed_cash: Number(confirmedCash),
        essential_burn: Number(essentialBurn),
        debt_minimums: Number(debtMinimums) || 0,
        tax_obligation_status: taxStatus,
        tax_obligation_amount:
          taxStatus === 'has_amount' ? Number(taxAmount) : null,
        tax_plan_monthly:
          taxStatus === 'on_plan' ? Number(taxPlanMonthly) : null,
        ei_status: eiStatus,
        ei_monthly_amount:
          eiStatus === 'approved' || eiStatus === 'receiving'
            ? Number(eiAmount)
            : null,
      };

      const intakeRes = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(intakeBody),
      });

      const intakeData = await intakeRes.json();
      if (!intakeRes.ok) {
        throw new Error(intakeData.error || 'Could not save your intake.');
      }

      const genRes = await fetch('/api/roadmap/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intake_id: intakeData.intake_id }),
      });

      const genData = await genRes.json();
      if (!genRes.ok) {
        throw new Error(
          genData.error || 'Saved your intake, but could not build the plan.',
        );
      }

      router.push(`/roadmap/${genData.roadmap_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setSubmitting(false);
    }
  }

  // Shared field classes for the dark form system.
  const labelCls = 'text-muted text-sm';
  const fieldCls =
    'rounded-lg border border-hair bg-surface px-3 py-2.5 text-text text-base ' +
    'focus:border-brand focus:outline-none';

  return (
    <main className="mx-auto w-full max-w-xl px-5 py-12">
      <div className="mb-8 flex justify-end">
        <LogoutButton />
      </div>

      <div className="mb-6">
        <a
          href="/start"
          className="text-sm text-muted hover:text-text transition-colors"
        >
          ← Back to my latest plan
        </a>
      </div>

      {step === 'start' && (
        <>
          <p className="text-muted text-sm uppercase tracking-widest mb-2">
            Step 1 of 2
          </p>
          <h1 className="font-display text-4xl leading-tight mb-2 max-w-md text-balance">
            Start with what happened
          </h1>
          <p className="text-muted mb-10">
            Three quick questions, then we’ll show you where to start in Canada.
          </p>

          <div className="space-y-5">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>What happened?</label>
              <select
                className={fieldCls}
                value={situationType}
                onChange={(e) => setSituationType(e.target.value)}
              >
                <option value="laid_off">I was laid off</option>
                <option value="non_renewal">My contract wasn’t renewed</option>
                <option value="contract_ending">My contract is ending soon</option>
                <option value="pivot">I’m changing careers</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Province or territory</label>
              <select
                className={fieldCls}
                value={province}
                onChange={(e) => setProvince(e.target.value as ProvinceCode)}
              >
                {PROVINCES.map(([code, details]) => (
                  <option key={code} value={code}>
                    {details.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Your work type</label>
              <select
                className={fieldCls}
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
              >
                <option value="employee">Employee</option>
                <option value="sole_proprietor">Sole proprietor</option>
                <option value="incorporated">Incorporated contractor</option>
              </select>
            </div>

            <button
              type="button"
              onClick={showResources}
              className="mt-2 rounded-lg bg-brand px-5 py-3 font-medium text-black"
            >
              Show me where to start
            </button>
          </div>
        </>
      )}

      {step === 'resources' && (
        <>
          <p className="text-muted text-sm uppercase tracking-widest mb-2">
            Your starting point
          </p>
          <h1 className="font-display text-4xl leading-tight mb-2 max-w-md text-balance">
            Start with these official resources
          </h1>
          <p className="text-muted mb-8">
            Federal links for Canada and local information for{' '}
            {selectedProvince.name}.
          </p>

          <div className="space-y-3">
            <a
              href={FEDERAL_RESOURCES.eiApplicationUrl}
              target="_blank"
              rel="noreferrer"
              className="block rounded-lg border border-hair bg-surface p-4 transition-colors hover:border-brand"
            >
              <span className="block text-text font-medium">Apply for EI</span>
              <span className="mt-1 block text-sm text-muted">
                Official Government of Canada application
              </span>
            </a>
            <a
              href={FEDERAL_RESOURCES.roeInformationUrl}
              target="_blank"
              rel="noreferrer"
              className="block rounded-lg border border-hair bg-surface p-4 transition-colors hover:border-brand"
            >
              <span className="block text-text font-medium">
                Record of Employment information
              </span>
              <span className="mt-1 block text-sm text-muted">
                Understand and view your ROE through Service Canada
              </span>
            </a>
            <a
              href={selectedProvince.employmentStandardsUrl}
              target="_blank"
              rel="noreferrer"
              className="block rounded-lg border border-hair bg-surface p-4 transition-colors hover:border-brand"
            >
              <span className="block text-text font-medium">
                {selectedProvince.name} employment standards
              </span>
              <span className="mt-1 block text-sm text-muted">
                Official workplace rights and standards information
              </span>
            </a>
            <a
              href={selectedProvince.employmentServicesUrl}
              target="_blank"
              rel="noreferrer"
              className="block rounded-lg border border-hair bg-surface p-4 transition-colors hover:border-brand"
            >
              <span className="block text-text font-medium">
                {selectedProvince.name} employment services
              </span>
              <span className="mt-1 block text-sm text-muted">
                Provincial or territorial job-search and career support
              </span>
            </a>
          </div>

          <p className="mt-5 text-xs leading-relaxed text-muted">
            These links provide general information, not legal, financial, or
            eligibility advice. The responsible government service makes all
            eligibility decisions.
          </p>

          <div className="mt-8 rounded-lg border border-hair bg-surface p-5">
            <h2 className="font-display text-2xl text-text">
              Ready for your full roadmap?
            </h2>
            <p className="mt-2 text-sm text-muted">
              Add your financial details so Landed can calculate your runway and
              build the complete plan. Nothing has been saved yet.
            </p>
            <button
              type="button"
              onClick={showFinancials}
              className="mt-5 rounded-lg bg-brand px-5 py-3 font-medium text-black"
            >
              Continue to my full roadmap
            </button>
          </div>

          <button
            type="button"
            onClick={() => setStep('start')}
            className="mt-5 text-sm text-muted transition-colors hover:text-text"
          >
            ← Edit my answers
          </button>
        </>
      )}

      {step === 'financials' && (
        <>
          <p className="text-muted text-sm uppercase tracking-widest mb-2">
            Step 2 of 2
          </p>
          <h1 className="font-display text-4xl leading-tight mb-2 max-w-md text-balance">
            Build your full roadmap
          </h1>
          <p className="text-muted mb-10">
            Add the financial details Landed needs to calculate your runway and
            priorities.
          </p>

          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Rent or own?</label>
                <select
                  className={fieldCls}
                  value={housingType}
                  onChange={(e) => setHousingType(e.target.value)}
                >
                  <option value="rent">I rent</option>
                  <option value="own">I own</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>People depending on your income</label>
                <input
                  className={fieldCls}
                  type="number"
                  min="0"
                  value={dependentsCount}
                  onChange={(e) => setDependentsCount(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Cash on hand ($)</label>
                <input
                  className={fieldCls}
                  type="number"
                  min="0"
                  value={confirmedCash}
                  onChange={(e) => setConfirmedCash(e.target.value)}
                  placeholder="8000"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Monthly costs ($)</label>
                <input
                  className={fieldCls}
                  type="number"
                  min="0"
                  value={essentialBurn}
                  onChange={(e) => setEssentialBurn(e.target.value)}
                  placeholder="3000"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Monthly minimum debt payments ($)</label>
              <input
                className={fieldCls}
                type="number"
                min="0"
                value={debtMinimums}
                onChange={(e) => setDebtMinimums(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Do you owe any taxes?</label>
              <select
                className={fieldCls}
                value={taxStatus}
                onChange={(e) => setTaxStatus(e.target.value)}
              >
                <option value="none">No outstanding taxes</option>
                <option value="has_amount">Yes, and I know roughly how much</option>
                <option value="on_plan">Yes, but I’m on a payment plan</option>
                <option value="unsure">I’m not sure</option>
              </select>
            </div>

            {taxStatus === 'has_amount' && (
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Roughly how much do you owe? ($)</label>
                <input
                  className={fieldCls}
                  type="number"
                  min="0"
                  value={taxAmount}
                  onChange={(e) => setTaxAmount(e.target.value)}
                />
              </div>
            )}

            {taxStatus === 'on_plan' && (
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Monthly payment on that plan ($)</label>
                <input
                  className={fieldCls}
                  type="number"
                  min="0"
                  value={taxPlanMonthly}
                  onChange={(e) => setTaxPlanMonthly(e.target.value)}
                />
              </div>
            )}

            {taxUnsure && (
              <div className="rounded-lg border border-brand-soft bg-surface p-4">
                <p className="text-text font-medium mb-1">
                  Let’s get one number first
                </p>
                <p className="text-muted text-sm">
                  Check your CRA My Account for any balance owing — even a rough
                  figure works — then come back and pick one of the other options.
                  We can’t build an accurate plan without it.
                </p>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>EI status</label>
              <select
                className={fieldCls}
                value={eiStatus}
                onChange={(e) => setEiStatus(e.target.value)}
              >
                <option value="not_applied">Haven’t applied yet</option>
                <option value="applied">Applied, waiting to hear</option>
                <option value="approved">Approved, payments haven’t started</option>
                <option value="receiving">Receiving payments now</option>
                <option value="not_eligible">I don’t qualify</option>
              </select>
            </div>

            {(eiStatus === 'approved' || eiStatus === 'receiving') && (
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>EI amount per month ($)</label>
                <input
                  className={fieldCls}
                  type="number"
                  min="0"
                  value={eiAmount}
                  onChange={(e) => setEiAmount(e.target.value)}
                />
              </div>
            )}

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || taxUnsure}
                className="rounded-lg bg-brand px-5 py-3 font-medium text-black disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Building your plan…' : 'Build my plan'}
              </button>
              <button
                type="button"
                onClick={() => setStep('resources')}
                disabled={submitting}
                className="text-sm text-muted transition-colors hover:text-text disabled:opacity-50"
              >
                ← Back to resources
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
