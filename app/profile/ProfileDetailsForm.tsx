'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/config';
import { CANADIAN_PROVINCES } from '@/lib/core/canadianProvinces';
import {
  PROFILE_WORK_TYPES,
  type ProfileAnswers,
  type ProfileWorkType,
  validateRequiredProfile,
} from '@/lib/profile/profileSetup';

const fieldClass = 'w-full rounded-lg border border-hair bg-surface-2 px-4 py-3 text-text focus:border-brand focus:outline-none';

export default function ProfileDetailsForm({
  initialAnswers,
  setup = false,
}: {
  initialAnswers: ProfileAnswers;
  setup?: boolean;
}) {
  const router = useRouter();
  const [supabase] = useState(() =>
    createBrowserClient(
      getSupabaseUrl(),
      getSupabaseAnonKey(),
    ),
  );
  const [name, setName] = useState(initialAnswers.displayName);
  const [province, setProvince] = useState(initialAnswers.province);
  const [workType, setWorkType] = useState<ProfileWorkType | ''>(initialAnswers.workType);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const displayName = name.trim().replace(/\s+/g, ' ');
    const validationError = validateRequiredProfile({ displayName, province, workType });
    if (validationError) {
      setStatus(validationError);
      return;
    }

    setBusy(true);
    setStatus(null);
    const { error } = await supabase.auth.updateUser({
      data: {
        display_name: displayName,
        profile_province: province,
        profile_employment_type: workType,
        profile_setup_status: 'complete',
      },
    });
    setBusy(false);

    if (error) {
      setStatus('We couldn’t save your profile. Please try again.');
      return;
    }
    if (setup) {
      router.replace('/start');
      router.refresh();
    } else {
      setName(displayName);
      setStatus('Profile saved.');
      router.refresh();
    }
  }

  return (
    <form onSubmit={save} className="space-y-5">
      <div>
        <label htmlFor="profile-name" className="mb-2 block text-sm text-muted">
          What should we call you?
        </label>
        <input
          id="profile-name"
          type="text"
          autoComplete="name"
          maxLength={80}
          required
          disabled={busy}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your preferred name"
          className={fieldClass}
        />
      </div>
      <div>
        <label htmlFor="profile-province" className="mb-2 block text-sm text-muted">
          Province or territory
        </label>
        <select
          id="profile-province"
          value={province}
          required
          disabled={busy}
          onChange={(event) => setProvince(event.target.value as ProfileAnswers['province'])}
          className={fieldClass}
        >
          <option value="">Choose a province or territory</option>
          {CANADIAN_PROVINCES.map(({ code, name: provinceName }) => (
            <option key={code} value={code}>{provinceName}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="profile-work-type" className="mb-2 block text-sm text-muted">
          Work type
        </label>
        <select
          id="profile-work-type"
          value={workType}
          required
          disabled={busy}
          onChange={(event) => setWorkType(event.target.value as ProfileWorkType | '')}
          className={fieldClass}
        >
          <option value="">Choose your work type</option>
          {PROFILE_WORK_TYPES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>
      {setup ? (
        <p className="text-sm leading-relaxed text-muted">
          These details help us start in the right place. You can change them before building your roadmap.
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-brand px-5 py-3 font-medium text-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? 'Saving…' : setup ? 'Save and continue' : 'Save profile'}
        </button>
      </div>
      {status ? <p className="text-sm text-muted" role="status">{status}</p> : null}
    </form>
  );
}
