# Landed Deploy Checklist

## Pre-deploy setup

### Environment variables (Vercel)

Make sure these are added:

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

Confirm they match local `.env.local`

Status:
[ ] Done

---

## Supabase auth

### Redirect URLs

Add production domain to:

Authentication → URL Configuration

Must include:

- https://your-vercel-url.vercel.app
- https://getlanded.ca (when ready)

Status:
[ ] Done

---

### Email confirmation decision

For private testers only:

Keep OFF

Before public launch:

Turn ON

Current decision:
[ ] Confirmed

---

## Database security

### Row Level Security (RLS)

Confirm enabled on:

- users
- journeys
- intakes
- roadmaps
- checkins

Status:
[ ] Done

---

### Ownership rules

Confirm:

Users can only access their own:

- journeys
- intakes
- roadmaps
- checkins

Status:
[ ] Done

---

## Production smoke test

After deploy:

Test:

[ ] Sign up
[ ] Login
[ ] Intake submission
[ ] Roadmap generation
[ ] Check-in
[ ] Updated roadmap
[ ] No-change recovery
[ ] Logout
[ ] Returning-user routing

---

## URL / domain

Current test URL:

_________________________

Production domain later:

getlanded.ca

Status:
[ ] Connected

---

## Visual QA

Confirm:

[ ] Fonts load correctly (Bebas Neue / DM Sans)
[ ] Brand green appears correctly (#1D9E75)
[ ] Dark theme consistent
[ ] Buttons render properly
[ ] Mobile readable

---

## Known temporary limitations

These are acceptable for V1:

- Roadmap text is template-based
- No real AI yet
- No job matching yet
- No analytics yet
- No payments yet

---

## Ready for testers?

Checklist:

[ ] Core flow stable
[ ] Security acceptable
[ ] Test URL live
[ ] Tester guide ready
[ ] Feedback collection ready

If all checked:

Send to first 3–5 testers only.