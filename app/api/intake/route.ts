import { NextResponse } from 'next/server';
import { getAuthedUserId, createSupabaseServerClient } from '@/lib/supabase/server';
import { hasLandedAccess, PAYMENT_REQUIRED_RESPONSE } from '@/lib/billing/entitlement';
import {
  validateIntakeSnapshot,
  validateSituationType,
} from '../../../lib/core/validateIntakeSnapshot';

export async function POST(req: Request) {
  try {
    const userId = await getAuthedUserId();
    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    const supabase = await createSupabaseServerClient();
    if (!(await hasLandedAccess(supabase))) {
      return NextResponse.json(PAYMENT_REQUIRED_RESPONSE, { status: 402 });
    }
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json(
        { error: 'A valid intake is required.' },
        { status: 400 },
      );
    }

    const {
      situation_type,
      employment_type,
      housing_type,
      province,
      dependents_count = 0,
      job_target = null,

      confirmed_cash,
      essential_burn,
      debt_minimums = 0,

      tax_obligation_status,
      tax_obligation_amount = null,
      tax_plan_monthly = null,

      ei_status = 'not_applied',
      ei_monthly_amount = null,

      pending_invoice_amount = null,
      pending_invoice_confirmed = false,
      upside_notes = null,
    } = body;

    if (
      !situation_type ||
      !employment_type ||
      !housing_type ||
      !province ||
      confirmed_cash == null ||
      essential_burn == null ||
      !tax_obligation_status
    ) {
      return NextResponse.json(
        { error: 'Missing required intake fields' },
        { status: 400 }
      );
    }

    const validationError =
      validateSituationType(situation_type) ??
      validateIntakeSnapshot({
        employment_type,
        housing_type,
        province,
        dependents_count,
        confirmed_cash,
        essential_burn,
        debt_minimums,
        tax_obligation_status,
        tax_obligation_amount,
        tax_plan_monthly,
        ei_status,
        ei_monthly_amount,
        pending_invoice_amount,
        pending_invoice_confirmed,
      });
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 },
      );
    }

    let journeyId: string;

    const { data: existingJourney, error: journeyReadError } = await supabase
      .from('journeys')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (journeyReadError) {
      return NextResponse.json(
        { error: journeyReadError.message },
        { status: 500 }
      );
    }

    if (existingJourney) {
      journeyId = existingJourney.id;
    } else {
      const { data: newJourney, error: journeyInsertError } = await supabase
        .from('journeys')
        .insert({
          user_id: userId,
          situation_type,
          status: 'active',
        })
        .select('id')
        .single();

      if (journeyInsertError) {
        return NextResponse.json(
          { error: journeyInsertError.message },
          { status: 500 }
        );
      }

      journeyId = newJourney.id;
    }

    const { data: intake, error: intakeError } = await supabase
      .from('intakes')
      .insert({
        journey_id: journeyId,
        user_id: userId,
        source: 'intake',

        employment_type,
        housing_type,
        province,
        dependents_count,
        job_target,

        confirmed_cash,
        essential_burn,
        debt_minimums,

        tax_obligation_status,
        tax_obligation_amount,
        tax_plan_monthly,

        ei_status,
        ei_monthly_amount,

        pending_invoice_amount,
        pending_invoice_confirmed,
        upside_notes,
      })
      .select()
      .single();

    if (intakeError) {
      return NextResponse.json(
        { error: intakeError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
        success: true,
        intake_id: intake.id,
        journey_id: journeyId,
      });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
