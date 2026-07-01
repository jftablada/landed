Landed — Production QA Checklist

1. Purpose / Scope

Verify the live user journey on production before opening Landed to external testers. This checklist covers the four roadmap modes, auth and email confirmation, ownership security, mobile rendering, and error handling.

This checklist tests rendering and behavior in production. It does not re-test mode threshold math. Mode threshold math is covered by unit tests in Section A. Do not duplicate unit-tested math checks in slow, permanent-data production.

Run against the live deployed site, not localhost. Every check should have a clear PASS, FAIL, N/A, or FINDING result. If a check cannot be evaluated clearly, log it instead of hand-waving it.

2. QA Environment

* URL under test: https://www.getlanded.ca
* Deployment / commit tested: f4813eb
* Test accounts: see Appendix. Intake and check-in data is append-only and permanent. Accounts accumulate history and cannot be cleanly reset.
* Email provider: Resend via Supabase SMTP.
* Browser: run desktop pass in one browser. Run mobile checks separately on a real phone or device emulation.

⸻

Section A — Unit-Tested Mode Math

Covered by lib/core/computeMode.test.ts. QA confirms the suite passes. Production QA should not re-test boundary math.

* A1. Compute mode unit tests pass.
    Command: ./node_modules/.bin/vitest run lib/core/computeMode.test.ts
    PASS = all tests green on the QA commit.
* A2. Boundary tests are present.
    PASS = tests include:
    * just below 1 week → critical
    * exactly 1 week → survival
    * exactly 4 weeks → survival
    * just above 4 weeks → balanced
    * exactly 10 weeks → balanced
    * just above 10 weeks → strategic
    * exactly 0 cash → critical

⸻

Section B — Production Roadmap Template Render Coverage

Each roadmap mode must be render-verified on production at least once. Use mid-band values from the Appendix. Do not use production to test threshold boundaries.

* B1. Critical mode.
    Status: already production-render verified with the existing account.
    PASS = “Where you stand” shows safe copy, no negative runway, no contradictory date, roadmap phases are suppressed, and emergency programs are shown where expected.
* B2. Survival mode.
    PASS = roadmap renders Survival-specific framing, stabilization-focused copy, and the expected Survival phase structure.
* B3. Balanced mode.
    PASS = roadmap renders Balanced-specific framing, stability + search copy, and the expected Balanced phase structure.
* B4. Strategic mode.
    PASS = roadmap renders Strategic-specific framing, target-list / selective-search copy, and the expected Strategic phase structure.
* B5. Debt-minimums card appears when debt_minimums > 0.
    PASS = each mode account with debt_minimums > 0 shows the line under “What your plan is built around,” with the correct dollar amount interpolated.
* B6. Debt-minimums card is absent when debt_minimums = 0.
    PASS = roadmap does not show the debt-minimums line anywhere when the value is zero.
    Note: testing this will create another permanent check-in/intake snapshot.

⸻

Section C — Full User Journey Smoke Test

Run once from start to finish on Account 1, the real signup account for Survival mode.

* C1. Homepage loads.
    PASS = production homepage loads, shows Landed stopgap homepage, does not show Next.js boilerplate, and CTA is visible.
* C2. CTA routes to login.
    PASS = clicking the homepage CTA lands on /login.
* C3. Signup submits.
    PASS = new account signup submits without silent failure and shows a visible status message.
* C4. Confirmation email flow works.
    PASS = confirmation email arrives and confirmation link routes to live getlanded.ca, not localhost.
* C5. Confirmed user can sign in.
    PASS = confirmed user signs in successfully and reaches the app flow.
* C6. Fresh-user routing works.
    PASS = brand-new account sees the begin-intake path, not an existing roadmap.
* C7. Intake submission works.
    PASS = intake submits, roadmap generates, and user lands on the roadmap page.
* C8. Roadmap renders for selected mode.
    PASS = roadmap appears and matches the expected mode behavior from Section B.
* C9. Check-in form works with changed values.
    PASS = check-in form pre-fills current values and submitting a changed value generates an updated roadmap.
* C10. No-change recovery works.
    PASS = submitting a check-in with no changes shows the “Nothing changed” message and does not create a new snapshot.
* C11. Returning-user routing works.
    PASS = signing out and back in routes to the existing roadmap/check-in flow, not a fresh intake.
* C12. Logout works.
    PASS = logout ends the session and protected routes are no longer accessible without signing in again.

⸻

Section D — Auth & Email Confirmation

Run the real email path once on Account 1.

* D1. Confirmation email arrives.
    PASS = email arrives from Landed/Supabase/Resend.
    Inbox or junk: ________
* D2. Junk-folder risk is handled.
    PASS = if email lands in junk, /login helper copy warns users to check inbox/junk.
* D3. Confirmation link target is correct.
    PASS = confirmation link routes to live getlanded.ca, not localhost.
* D4. Post-confirmation sign-in works.
    PASS = confirmed account can sign in successfully.
* D5. Login helper copy is visible.
    Status: already production-render verified.
    PASS = /login shows guidance to check inbox or junk/spam for the confirmation email.
* D6. Password reset status.
    Status: not implemented as of commit f4813eb.
    PASS for closed internal testing = known limitation accepted because testers are known and can be manually supported.
    BLOCKER before open/self-serve testing = password reset must be implemented before broader public access.

⸻

Section E — Security / Ownership Checks

These checks verify actual behavior. Do not assume the result.

* E1. Cross-user roadmap access.
    Test: signed in as Account A, manually visit Account B’s roadmap URL.
    EXPECTED = access denied, redirect, or not found. Account B’s data must not display.
    Actual result: ________
* E2. Logged-out protected route access.
    Test: logged out, visit /start, /intake, /checkin, and a roadmap URL.
    EXPECTED = redirect to login or safe blocked state. Protected data must not display.
    Actual result: ________
* E3. Supabase Row Level Security.
    Test: confirm RLS is enabled for user-data tables.
    Tables checked: ________
* E4. Direct API ownership behavior.
    Test: if API routes are reachable directly, confirm non-owned data cannot be accessed or modified.
    Actual result: ________

⸻

Section F — Mobile Visual QA

Run on a real phone or accurate mobile emulation.

* F1. Homepage mobile.
    PASS = headline does not overflow, CTA is tappable, and there is no horizontal scroll.
* F2. Login/signup mobile.
    PASS = inputs are usable, buttons are tappable, and keyboard does not block submit.
* F3. Intake mobile.
    PASS = all fields are reachable and fillable, with no clipped labels.
* F4. Roadmap mobile.
    PASS = “Where you stand” card, factor cards, and roadmap sections stack cleanly and remain readable.
* F5. Check-in mobile.
    PASS = pre-filled form is usable and submit button is reachable.

⸻

Section G — Error States

For each item, trigger the state, observe behavior, then decide whether it is acceptable for closed testers.

* G1. Network/Supabase issue mid-submit.
    Observe whether the user sees a friendly error, white screen, or lost input.
    Actual result: ________
* G2. Invalid intake input.
    Status: zero/negative monthly burn is guarded client-side, API-side, and core-side.
    PASS = monthly burn of 0 or below is blocked and does not generate a roadmap.
* G3. Signup with already-registered email.
    PASS = user receives a clear message or safe generic message, not a silent failure.
* G4. Signup with weak/short password.
    PASS = user receives a clear validation error or safe auth message.
* G5. Expired or reused confirmation link.
    PASS = app handles the case gracefully and does not route to localhost.
* G6. Old roadmap row compatibility.
    PASS = older roadmap rows generated before recent schema/output changes degrade safely and do not crash the page.

⸻

Appendix — Current Mode-Trigger Input Matrix

These values are derived from thresholds in lib/core/computeMode.ts as of commit f4813eb. If thresholds change, recheck these values.

Constants across new mode accounts unless noted:

* essential_burn = $1000/month
* debt_minimums = $700
* tax_obligation_status = none
* ei_status = not_applied or equivalent non-income state

Mode	Target runway	confirmed_cash	tax	Expected runway
Critical	< 1 week	$8,000	has_amount, $20,000	negative / exhausted
Survival	~2.6 weeks	$600	none	~2.6 weeks
Balanced	~7 weeks	$1,600	none	~6.95 weeks
Strategic	~15 weeks	$3,500	none	~15.2 weeks

Formula:

confirmed_cash = (target_weeks / 4.345) × essential_burn

Then subtract tax obligation, if any, to get adjusted cash.

Account Provisioning Plan

* Existing account: Critical
    Already production-render verified.
* Account 1: Survival
    Real production signup. Tests:
    * confirmation email flow
    * full user journey
    * Survival roadmap render
    * debt-minimums card in Survival
* Account 2: Balanced
    Manual create + SQL confirmation, or real signup if preferred. Tests:
    * Balanced roadmap render
    * debt-minimums card in Balanced
* Account 3: Strategic
    Manual create + SQL confirmation, or real signup if preferred. Tests:
    * Strategic roadmap render
    * debt-minimums card in Strategic