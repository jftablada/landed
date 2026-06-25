# Route Spec Corrections — Final Alignment Pass (V1)

Applies the consistency-audit fixes that affect the API route contracts.
These supersede the earlier route descriptions where they differ.

---

## Fix 1 — `situation_type` is journey-level only

`/api/intake` request payload STILL includes `situation_type`. It is used
**only** to create or find the journey. It is **not** written to the
`intakes` row (the intakes table has no such column — by design).

**Corrected `/api/intake` transaction steps:**

```
BEGIN
  1. user_id = auth.uid()                       (never from payload)
  2. Find active journey for user_id (status = 'active')
       → if none: INSERT journeys {
           user_id,
           situation_type,          ← the ONLY place situation_type is written
           status: 'active'
         }
       → if one exists: reuse it; situation_type is already fixed for the
         episode and is NOT overwritten.
  3. INSERT intakes {
       journey_id, user_id, source: 'intake',
       employment_type, housing_type, province, dependents_count, job_target,
       confirmed_cash, essential_burn, debt_minimums,
       tax_obligation_status, tax_obligation_amount, tax_plan_monthly,
       ei_status, ei_monthly_amount,
       pending_invoice_amount, pending_invoice_confirmed, upside_notes
       -- NOTE: situation_type is intentionally absent here.
     } → intake_id
  4. INSERT burn_items[] each { intake_id, user_id, ...item }
COMMIT
```

Server validation must NOT reject a payload for containing
`situation_type`; it simply routes it to the journey and never to the
intake row.

---

## Fix 3 — Check-in burn carry-forward is append-only

In `/api/checkin`, when the request does NOT include a `burn_items` array,
the prior snapshot's burn items are carried forward by **inserting brand
new rows**. They are never reparented, updated, or reused.

**Corrected `/api/checkin` transaction steps:**

```
BEGIN
  1. user_id = auth.uid()
  2. Load most recent intake snapshot for journey_id (carry-forward base)
  3. merged = { ...lastSnapshot, ...changes }
  4. Re-validate merged as a FULL intake (same rules as /api/intake).
       tax_obligation_status === 'unsure' → ROLLBACK, 400 (block upstream).
       Fail validation → ROLLBACK, 400.
  5. INSERT intakes { ...merged, source: 'checkin', journey_id, user_id }
       → new_intake_id
  6. Burn items:
       IF request.burn_items provided:
         INSERT each as a NEW row { intake_id: new_intake_id, user_id, ...item }
       ELSE (carry forward):
         Read prior snapshot's burn_items, and for EACH one
         INSERT a NEW row {
           id: <new generated uuid>,        ← never reuse the old id
           intake_id: new_intake_id,        ← the NEW snapshot
           user_id,                         ← current user_id
           category, amount, skipped, is_estimate   ← copied values
         }
       NEVER: UPDATE old burn_items, NEVER set old rows' intake_id to the
       new snapshot, NEVER INSERT ... SELECT that reparents existing rows.
COMMIT
```

The principle: a check-in produces a complete, fresh, immutable snapshot.
Carried-forward burn items are *copies*, structurally indistinguishable
from freshly entered ones, tied to the new snapshot. The old snapshot and
its burn items remain untouched forever.

After COMMIT, the route calls `generateRoadmapForIntake({ intakeId:
new_intake_id, userId, changeSummary })`, which writes the new roadmap and
the transition check_in.

---

## Unchanged but reconfirmed

- AI call happens BEFORE the DB transaction in `generateRoadmapForIntake`.
  Only the roadmap + check_in inserts are inside the transaction.
- Blocked intakes write a real `roadmaps` row (blocked = true). The schema
  now permits null computed_mode/runway_weeks only when blocked = true.
- `user_id` is always `auth.uid()`, never from any payload, on every route.
- Idempotency: a roadmap already existing for an intake_id short-circuits
  generation and returns the existing roadmap; no duplicate roadmap, no
  duplicate check_in.
