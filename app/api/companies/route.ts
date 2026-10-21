import { createSupabaseServerClient } from '../../../lib/supabase/server';
import {
  hasLandedAccess,
  PAYMENT_REQUIRED_RESPONSE,
} from '../../../lib/billing/entitlement';
import {
  COMPANY_COLUMNS,
  parseCompanyInput,
} from '../../../lib/companies/companyInput';

async function save(request: Request, editing: boolean) {
  const respond = (body: unknown, status = 200) =>
    Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin)
    return respond({ message: 'Please save from your Landed workspace.' }, 403);
  if (!request.headers.get('content-type')?.includes('application/json'))
    return respond({ message: 'Expected a company form.' }, 400);
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user)
      return respond({ message: 'Please sign in again before saving.' }, 401);
    if (!(await hasLandedAccess(supabase)))
      return respond(PAYMENT_REQUIRED_RESPONSE, 402);
    const raw = await request.text();
    if (raw.length > 5000)
      return respond({ message: 'Please shorten your company notes.' }, 400);
    let input;
    try {
      input = parseCompanyInput(JSON.parse(raw), editing);
    } catch {
      input = null;
    }
    if (!input)
      return respond(
        {
          message:
            'Check the company name, notes, and next step, then try again.',
        },
        400,
      );
    const { id, ...fields } = input;
    const query = editing
      ? supabase
          .from('target_companies')
          .update({ ...fields, updated_at: new Date().toISOString() })
          .eq('id', id!)
          .eq('user_id', user.id)
      : supabase
          .from('target_companies')
          .insert({ ...fields, user_id: user.id });
    const { data, error } = await query.select(COMPANY_COLUMNS).maybeSingle();
    if (error?.code === '23505')
      return respond(
        {
          message:
            'That company is already on your list. Edit its details below.',
        },
        409,
      );
    if (error)
      return respond(
        { message: 'Your changes weren’t saved. Please try again.' },
        500,
      );
    if (!data)
      return respond(
        { message: 'That company is no longer available to this account.' },
        404,
      );
    return respond({ company: data }, editing ? 200 : 201);
  } catch {
    return respond(
      { message: 'Your changes weren’t saved. Please try again.' },
      500,
    );
  }
}
export async function POST(request: Request) {
  return save(request, false);
}
export async function PATCH(request: Request) {
  return save(request, true);
}
