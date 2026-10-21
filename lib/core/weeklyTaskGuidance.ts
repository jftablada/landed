export interface WeeklyTaskGuidance {
  topic: string;
  introduction: string;
  steps: readonly string[];
  starter?: { label: string; text: string };
  finishLine: string;
  workspace?: 'companies';
}

const companyList: WeeklyTaskGuidance = {
  workspace: 'companies',
  topic: 'A shortlist with a reason',
  introduction:
    'Start with places you would want to explore, not a wall of open tabs.',
  steps: [
    'Write down three organizations to start. Add more until you have your target list.',
    'Beside each one, note a specific reason it interests you and a role you could contribute in.',
    'Choose one organization to research next. Look for its careers page or someone who knows the team.',
  ],
  starter: {
    label: 'A simple shortlist format',
    text: 'Organization | Why it interests me | Role I could contribute in | Next step',
  },
  finishLine:
    'You have a usable shortlist and know which organization you will explore first.',
};

const personalPitch: WeeklyTaskGuidance = {
  topic: 'Make your value easy to picture',
  introduction:
    'You do not need a perfect personal brand. Start with one clear sentence and something real behind it.',
  steps: [
    'Name the kind of team or customer you help and the problem you help solve.',
    'Pick one example from your actual work that supports that statement. Use a result you can explain honestly.',
    'Say it out loud. Replace any phrase you would not use in a normal conversation.',
  ],
  starter: {
    label: 'A starting shape, not a finished answer',
    text: 'I help [team or customer] with [problem] through [skill or approach]. One example from my work is [real example or result].',
  },
  finishLine:
    'You can explain what you bring in a few natural sentences, with one real example.',
};

const interview: WeeklyTaskGuidance = {
  topic: 'Bring evidence, not a script',
  introduction:
    'Prepare a few things you can comfortably talk through. Keep the application activity already in your plan moving too.',
  steps: [
    'Read the role description and choose two requirements you can connect to your own experience.',
    'For each, prepare a short story: the situation, what you did, and what happened. Practise saying it out loud.',
    'Write two questions that would help you understand the work, team, or expectations.',
  ],
  starter: {
    label: 'A story outline to practise with',
    text: 'Situation: [what was happening]\nMy action: [what I personally did]\nResult: [what happened]\nConnection: [why this example matters for this role]',
  },
  finishLine:
    'You have two examples you can talk through and two questions you genuinely want answered.',
};

const targetRoles: WeeklyTaskGuidance = {
  topic: 'Give your search a shape',
  introduction:
    'Use real job descriptions to turn a broad search into a few plausible directions.',
  steps: [
    'Write down up to three role titles you would seriously consider.',
    'Read a current description for each. Note where your experience matches and what you would need to learn.',
    'Write your own must-haves, such as location, work arrangement, or compensation needs. Use them to screen opportunities.',
  ],
  starter: {
    label: 'A quick role filter',
    text: 'Role title | Evidence from my experience | What I need to learn | My must-haves',
  },
  finishLine:
    'You can name the roles you are pursuing and explain why each belongs on your list.',
};

const application: WeeklyTaskGuidance = {
  topic: 'Make the match visible',
  introduction:
    'Work through one application first. Use it to establish an approach you can repeat.',
  steps: [
    'Choose a role that fits your target and identify its main requirements.',
    'Connect those requirements to concrete examples already in your experience. Make the relevant evidence easy to find.',
    'Check names, links, and instructions before submitting. Record the application so you can track what comes back.',
  ],
  finishLine:
    'One suitable application is ready or submitted, and you have a match-check you can repeat. Never invent experience to fit a posting.',
};

const outreach: WeeklyTaskGuidance = {
  topic: 'Start a conversation, not a pitch',
  introduction:
    'Choose someone you have a genuine reason to contact. Keep the first ask small.',
  steps: [
    'Pick a person who knows your work or has a connection to a team you want to understand.',
    'Mention your real connection or a specific reason for reaching out. Ask one question they could reasonably answer.',
    'Make the message sound like you before sending it. Keep a note of who you contacted and any agreed next step.',
  ],
  starter: {
    label: 'Adapt this before sending',
    text: 'Hi [name] — [our connection or specific reason for reaching out]. I’m exploring [kind of work or team] and would value your perspective on [one specific question]. Would you be open to a brief chat? No pressure if now is not a good time.',
  },
  finishLine:
    'You have sent a thoughtful message and noted any follow-up. A reply is not required to count the outreach you did.',
};

const steadySearch: WeeklyTaskGuidance = {
  topic: 'Make the next check-in easier',
  introduction:
    'Keep a small record of what you actually do. It does not need to become another project.',
  steps: [
    'Choose the next suitable opportunity or conversation already in your search.',
    'Record the organization, role, date, and what you did in a note or tracker you already use.',
    'Add responses, interviews, and offers as they happen. Bring those counts to your next Landed check-in.',
  ],
  starter: {
    label: 'Keep the record lightweight',
    text: 'Date | Organization / role | Action taken | Response / next step',
  },
  finishLine:
    'Your recent activity is recorded well enough to report at your next check-in.',
};

const manageableSearch: WeeklyTaskGuidance = {
  topic: 'Choose a small enough start',
  introduction:
    'Make room for one useful action within the capacity you have today.',
  steps: [
    'Choose one part of the search you can control, such as reviewing a role or drafting a message.',
    'Decide what a small completed version looks like before you start. Use your own available time and energy.',
    'Do that part, then reassess. You can report a changed capacity at your next check-in.',
  ],
  finishLine:
    'You have a realistic next action and have completed the small version you chose.',
};

const officialSupport: WeeklyTaskGuidance = {
  topic: 'Get the right information first',
  introduction:
    'This guide helps you prepare for the action in your plan. It does not assess benefits eligibility or recommend a financial arrangement.',
  steps: [
    'Use the official resource or provider contact already named in your plan.',
    'Write down the question you need answered and gather the information that source requests. Keep private details in your own records, not a public message.',
    'Record the answer, any stated next step, and who to contact if you need clarification. The relevant organization decides what applies.',
  ],
  finishLine:
    'You have taken the stated action or confirmed the next required step with the appropriate source.',
};

const general: WeeklyTaskGuidance = {
  topic: 'Turn the action into a first step',
  introduction:
    'Keep the action in your plan as the goal. This is a starting point, not an extra assignment.',
  steps: [
    'Identify the first concrete thing the action asks you to do.',
    'Put the information or materials you need in one place. If the action names a service, use the official resource in your plan.',
    'Do that first part and note what is still needed. Mark the task complete when the action itself is done.',
  ],
  finishLine:
    'You know what you have completed and what, if anything, still needs a follow-up.',
};

/** Curated help for recognized actions; unfamiliar or sensitive actions stay neutral. */
export function getWeeklyTaskGuidance(label: string): WeeklyTaskGuidance {
  const action = label.toLowerCase().replace(/[’‘]/g, "'").trim();

  // Check sensitive topics first so a career keyword cannot select the wrong guide.
  if (
    /\b(ei|roe|tax|cra|debt|mortgage|landlord|hardship|deferral|runway|income|finances|monthly costs|emergency support|211)\b/.test(
      action,
    )
  )
    return officialSupport;
  if (/\b(offer|severance|dismissal|fired|eligibility)\b/.test(action))
    return general;
  if (
    /smaller, sustainable|protect the time|capacity|available energy/.test(
      action,
    )
  )
    return manageableSearch;
  if (/interview|recruiter.*conversation/.test(action)) return interview;
  if (/value you bring|describe.*value|personal pitch/.test(action))
    return personalPitch;
  if (
    /company.*list|list.*companies|choose (?:ten|10) companies|list of 10 organizations|10-company|target list/.test(
      action,
    )
  )
    return companyList;
  if (/reconnect|reach out|network|contact.*people|call a peer/.test(action))
    return outreach;
  if (
    /focused sample|record what comes back|tracking what happens|current approach steady/.test(
      action,
    )
  )
    return steadySearch;
  if (
    /application.*matches|targeted applications|review.*application|application alignment/.test(
      action,
    )
  )
    return application;
  if (
    /target roles|roles.*target|three roles|roles you are targeting|realistic salary floor/.test(
      action,
    )
  )
    return targetRoles;
  return general;
}
