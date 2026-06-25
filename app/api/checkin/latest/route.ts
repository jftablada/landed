// app/api/checkin/latest/route.ts
// GET /api/checkin/latest?journey_id=...
//
// Returns the latest intake snapshot's check-in-relevant fields, so the
// check-in form can pre-fill the user's current values.
//
// Auth required. Journey ownership verified. Returns ONLY the fields the
// form needs — not the whole snapshot.

import { NextResponse } from 'next/server';
import {
  getAuthedUserId,
  createSupabaseServerClient,
} from '@/lib/supabase/server';

export async function GET(req: Request) {
  try {
    // ── auth ───────────────────────────────────────────────────────────
    const userId = await getAuthedUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // ── input: journey_id from the query string ───────────────────────
    const { searchParams } = new URL(req.url);
    const journeyId = searchParams.get('journey_id');
    if (!journeyId) {
      return NextResponse.json(
        { error: 'journey_id is required' },
        { status: 400 },
      );
    }

    const supabase = await createSupabaseServerClient();

    // ── verify journey ownership ──────────────────────────────────────
    const { data: journey, error: journeyErr } = await supabase
      .from('journeys')
      .select('id')
      .eq('id', journeyId)
      .eq('user_id', userId)
      .maybeSingle();

    if (journeyErr) {
      return NextResponse.json({ error: journeyErr.message }, { status: 500 });
    }
    if (!journey) {
      return NextResponse.json({ error: 'Journey not found' }, { status: 404 });
    }

    // ── latest snapshot, only the form-relevant fields ────────────────
    const { data: snapshot, error: snapErr } = await supabase
      .from('intakes')
      .select(
        'confirmed_cash, essential_burn, debt_minimums, ei_status, ei_monthly_amount',
      )
      .eq('journey_id', journeyId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (snapErr) {
      return NextResponse.json({ error: snapErr.message }, { status: 500 });
    }
    if (!snapshot) {
      return NextResponse.json(
        { error: 'No snapshot found for this journey' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      journey_id: journeyId,
      confirmed_cash: snapshot.confirmed_cash,
      essential_burn: snapshot.essential_burn,
      debt_minimums: snapshot.debt_minimums,
      ei_status: snapshot.ei_status,
      ei_monthly_amount: snapshot.ei_monthly_amount,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}