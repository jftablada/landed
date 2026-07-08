cat > landed-active-todo.md <<'EOF'
# Landed Active To-Do / Risk Log

Last updated: 2026-07-05  
Owner: Justin  
Purpose: Living checklist for active Landed work, risks, deferred items, and Phase 1 execution.

---

## Current Phase

**Phase 1 — First Money**

Goal: Get 3–5 paid customers by the end of Week 5.

Primary motion:
- LinkedIn content
- Warm/professional direct outreach
- Manual founder-led onboarding and delivery

Current status:
- Phase 0 sell-ready foundation is complete.
- Live homepage is deployed.
- Stripe payment link is live.
- Concierge onboarding runbook is locked.
- Funnel tracker exists.
- Product QA is mostly complete but still has a few pending checks.

---

## Immediate Homepage / Sales Page QA

- [ ] Live homepage desktop QA  
  Confirm `https://www.getlanded.ca` looks good enough to send to a stranger.

- [ ] Live homepage mobile QA  
  Confirm the layout does not feel cramped, broken, or weird on phone.

- [ ] Stripe CTA QA  
  Confirm “Start my 90-day recovery” opeive Stripe link.

- [ ] Stripe checkout QA  
  Confirm checkout shows:
  - Landed — 90-Day Career Recovery Sprint
  - $79 CAD
  - one-time payment
  - not test mode
  - not subscription

- [ ] Sign in QA  
  Confirm top-right “Sign in” goes to `/login`.

- [ ] Scope QA  
  Confirm Interview Prep Studio and Contractor-to-Permanent Playbook are clearly:
  - in development
  - not included today

- [ ] Trust copy QA  
Confirm low-cost / no subscription / Stripe security copy is visible.

---

## Product QA Still Pending

- [ ] Balanced roadmap render QA  
  Test inputs:
  - Cash: 1600
  - Monthly costs: 1000
  - Debt minimums: 700
  - Taxes: none
  - EI: Haven’t applied yet

- [ ] Strategic roadmap render QA  
  Test inputs:
  - Cash: 3500
  - Monthly costs: 1000
  - Debt minimums: 700
  - Taxes: none
  - EI: Haven’t applied yet

- [ ] Debt card in Balanced  
  Confirm $700/month debt-minimums card appears.

- [ ] Debt card in Strategic  
  Confirm $700/month debt-minimums card appears.

- [ ] Changeeck-in test  
  Confirm changing a value generates a new roadmap.

- [ ] Returning-user routing  
  Confirm signed-in user lands in the right place.

- [ ] Logout / protected-route behavior  
  Confirm logged-out users cannot access protected roadmap/check-in pages.

---

## Future Security / Access Tasks

- [ ] Close the open `/login` loop before broader public launch

Current state:
- Direct `/login` access is acceptable for closed QA.
- Testers can sign up without going through Stripe.

Risk:
- Once public traffic starts, unpaid users could create accounts and access the product flow.

Future fix options:
- Payment-gated signup after Stripe purchase
- Invite-only/manual account creation
- Access code after payment
- Admin-created accounts only until payment automation ships

Priority:
- Not urgent for closed testing
- Required before broader/public launch

---

## Phase 1 — First Money

- [ ] Build first 10–15 prospect rows

Columns:
- Name
- Situation
- Connection path
- Personalization note
- StatuDate of last touch
- Follow-up due date

- [ ] Draft outreach template variants

Variants:
- Warm reconnect
- Value-first
- Direct offer

- [ ] Draft first 3 LinkedIn posts

Pillars:
- Layoff / contract-ending recovery
- Canadian job-search practical steps
- Founder-in-the-arena story

- [ ] Start outreach

Weekly target:
- 10 personalized DMs per week

---

## Buyer Operations

- [ ] Confirm first-buyer workflow is ready before outreach

Checklist:
- Stripe payment notification visible
- Buyer added to funnel tracker
- Supabase account manually created
- Temporary password created
- Welcome email sent within one business day
- 15-minute walkthrough offered
- Week-2 and Week-4 check-ins scheduled

---

## Deferred — Do Not Touch Yet

These are intentionally deferred. Do not build or suggest unless the roadmap says otherwise.

- [ ] SEO landing page
- [ ] B2B / per-seat / white-label
- [ ] Subscriptions
- [ ] Stripe integration
- [ ] API automation
- [ ] Password reset
- [ ] Interview Prep Studio
- [ ] Contractor--Permanent Playbook
- [ ] `debt_note` refactor
- [ ] Public roadmap sharing
- [ ] New product features

---

## Notes / Decisions

- Recovery Roadmap is the only available product today.
- Interview Prep Studio is in development and not included today.
- Contractor-to-Permanent Playbook is in development and not included today.
- $79 CAD one-time price is locked for Phase 1.
- Money-back copy removed because the founding customer price is intentionally low.
- Buyer-facing copy should emphasize one-time payment, no subscription, and no hidden renewal.
- Founder onboarding within one business day is a public promise and must be honored.

