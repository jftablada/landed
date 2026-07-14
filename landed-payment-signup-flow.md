# Landed Payment + Signup Confirmation Flow

Status: Draft
Last updated: 2026-07-12

## Purpose

This document defines the manual operating flow for Landed's first paying users.

The goal is to make sure a buyer who pays through Stripe can be identified, welcomed, guided into the product, and supported without confusion.

This is intentionally manual for the first 3–5 customers.

Automation should not be added until the manual process is proven.

## Current Offer

Price:
- $5 CAD on the website
- $4.99 CAD charged through Stripe
- One-time payment
- No subscription
- No hidden renewal

Included:
- 90-Day Recovery Roadmap
- Check-ins that update the plan
- Canadian job-loss context
- Founder-led onboarding within one business day
- 15-minute walkthrough call
- Week-2 and Week-4 check-ins

Not included:
- Interview Prep Studio
- Contractor-to-Permanent Playbook
- AI job matching
- legal review
- resume writing
- job placement
- automated coaching

## Manual Buyer Flow

### Step 1: Buyer purchases through Stripe

Source:
- Website CTA sends buyer to Stripe checkout.

Founder action:
- Watch for Stripe payment notification.
- Confirm payment amount is $4.99 CAD.
- Record buyer email from Stripe receipt.

Status:
- Buyer paid.
- Buyer has not necessarily created a Landed account yet.

### Step 2: Buyer creates Landed account

Founder action:
- Ask buyer to create an account using the same email used at checkout when possible.
- If buyer uses a different email, manually record both:
  - Stripe payment email
  - Landed account email

System expectation:
- Supabase email confirmation is ON.
- User receives confirmation email through Resend SMTP.
- User confirms email.
- User lands in the app and completes intake.

### Step 3: Founder verifies buyer access

Founder action:
- Check Stripe for paid customer email.
- Check Supabase Authentication for matching user email.
- Confirm user has email confirmed.
- Confirm intake and roadmap row exist after completion.

Minimum verification:
- Stripe payment exists.
- Supabase user exists.
- Email is confirmed.
- Roadmap generated successfully.

### Step 4: Send welcome / next-steps email

Timing:
- Within one business day.

Email should include:
- Thank-you message
- What they bought
- How to access the app
- What to do first
- What founder onboarding means
- How to book or coordinate the 15-minute walkthrough
- Support contact: hello@getlanded.ca

### Step 5: Founder onboarding

Founder action:
- Review the user's roadmap before the walkthrough.
- Prepare 2–3 practical notes based on their situation.
- On walkthrough, help them understand:
  - their current mode
  - their first priority
  - what to avoid doing immediately
  - how to use check-ins

### Step 6: Week-2 check-in

Founder action:
- Check whether the user has completed a check-in.
- If not, send a gentle nudge.
- If yes, review whether the updated roadmap makes sense.

### Step 7: Week-4 check-in

Founder action:
- Ask what has changed.
- Ask what was useful.
- Ask what felt unclear.
- Ask whether they would recommend Landed to someone in a similar situation.

## Manual Tracking Fields

Track each founding customer in a simple sheet.

Fields:
- Customer name
- Stripe email
- Landed account email
- Payment date
- Payment amount
- Supabase user confirmed
- Intake completed
- Roadmap generated
- Roadmap mode
- Welcome email sent
- Walkthrough scheduled
- Walkthrough completed
- Week-2 check-in sent
- Week-2 check-in completed
- Week-4 check-in sent
- Week-4 check-in completed
- Feedback summary
- Testimonial permission
- Referral potential
- Support issues
- Notes

## Failure Cases

### Buyer pays but does not create account

Founder action:
- Send access reminder email.
- Include login/signup URL.
- Ask them to use the same email if possible.

### Buyer creates account but does not confirm email

Founder action:
- Ask them to check inbox/spam.
- If needed, resend confirmation through Supabase or manually confirm only after verifying payment.

### Buyer uses different Stripe and Landed emails

Founder action:
- Manually link both emails in tracker.
- Do not block access if payment is verified.

### Roadmap fails to generate

Founder action:
- Ask user not to resubmit repeatedly.
- Capture screenshot/error.
- Check Supabase roadmap/intake rows.
- Fix issue before continuing.
- Send manual apology and update.

### Buyer is confused about what is included

Founder action:
- Clarify that the current offer includes the 90-Day Recovery Roadmap, check-ins, and founder onboarding.
- Do not imply access to future tools.
- Capture confusion as messaging feedback.

## Automation Later

Do not automate before first 3–5 customers.

Future automation candidates:
- Stripe webhook records purchase
- Payment success email
- Account email matching
- Welcome email
- Check-in reminders
- Founder dashboard
- Feedback request
- Referral request

## Launch Readiness Standard

Before warm outreach:
- Stripe payment link works
- Supabase signup works
- Email confirmation works
- Roadmap generation works in all four modes
- Manual buyer verification flow is documented
- Welcome email draft exists
- Founder knows how to handle mismatched emails and failed roadmap generation

