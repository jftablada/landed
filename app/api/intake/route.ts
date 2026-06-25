import { NextResponse } from 'next/server';
import { getAuthedUserId, createSupabaseServerClient } from '@/lib/supabase/server';

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
    const body = await req.json();

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

    if (tax_obligation_status === 'has_amount' && tax_obligation_amount == null) {
      return NextResponse.json(
        { error: 'tax_obligation_amount is required when tax_obligation_status is has_amount' },
        { status: 400 }
      );
    }

    if (tax_obligation_status === 'on_plan' && tax_plan_monthly == null) {
      return NextResponse.json(
        { error: 'tax_plan_monthly is required when tax_obligation_status is on_plan' },
        { status: 400 }
      );
    }

    if (Number(essential_burn) <= 0) {
      return NextResponse.json(
        { error: 'essential_burn must be greater than 0' },
        { status: 400 }
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