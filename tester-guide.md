# Landed Tester Guide

## What Landed is

Landed is a recovery system for people dealing with a layoff, contract ending, non-renewal, or sudden career disruption.

It helps someone understand where they stand, how much runway they have, and what kind of next step makes sense based on their current situation.

## What is working right now

The current V1 includes:

- Account creation and login
- A first intake form
- Financial runway calculation
- Mode detection:
  - Critical
  - Survival
  - Balanced
  - Strategic
- A generated recovery roadmap
- Check-ins when something changes
- Updated roadmap after a check-in
- Returning-user routing to the latest roadmap
- Logout
- A “nothing changed” recovery path during check-in

## What is placeholder right now

The roadmap language is currently template-based.

It is not using full AI yet.

The financial math, mode detection, check-in flow, and roadmap updates are real. The written roadmap steps are deterministic templates based on the user’s mode and a few values like runway, province, EI status, and monthly gap.

## How to test

Please go through this flow:

1. Create an account.
2. Complete the intake form using realistic numbers.
3. Review your roadmap.
4. Check whether the runway and mode feel accurate based on the numbers you entered.
5. Click “Start a check-in.”
6. Change one value, such as cash on hand.
7. Submit the check-in.
8. Confirm that the new roadmap reflects the change.
9. Try another check-in without changing anything.
10. Confirm that the “nothing changed” message appears and that you can return to your plan.
11. Log out.
12. Log back in.
13. Confirm that you return to your latest roadmap, not a blank intake form.

## What feedback I want

Please pay attention to:

- Was anything confusing?
- Did any page feel emotionally cold, stressful, or unclear?
- Did the flow make sense from intake to roadmap to check-in?
- Did the roadmap feel connected to the numbers you entered?
- Did the mode label feel understandable?
- Did you know what to do next?
- Did anything break?
- Was anything missing that you expected?
- Would this have helped you during a real job loss or contract ending?

## What not to focus on yet

Please do not focus heavily on:

- Full AI personalization
- Payment features
- Mobile perfection
- Advanced job matching
- Dashboard features

Those are later.

Right now I’m testing whether the core recovery flow makes sense and feels useful.

## Suggested feedback format

Please send feedback in this format:

1. Overall clarity, 1–10:
2. Emotional usefulness, 1–10:
3. Did the runway/mode make sense?
4. What confused you?
5. What felt useful?
6. What felt missing?
7. Any bugs or weird behavior?
8. Would you use this after a layoff or contract ending?