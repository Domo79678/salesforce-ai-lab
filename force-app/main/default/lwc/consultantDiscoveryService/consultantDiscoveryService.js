export const CONSULTANT_DISCOVERY_VERSION = "1.0.0";

export const DISCOVERY_READINESS = Object.freeze({
  DISCOVERY_NEEDED: "Discovery Needed",
  NEARLY_READY: "Nearly Ready",
  READY_TO_DESIGN: "Ready to Design"
});

const FIELD_DEFINITIONS = Object.freeze([
  {
    name: "businessProblem",
    label: "business problem",
    critical: true,
    question: "What business problem must be solved, without naming a tool?"
  },
  {
    name: "desiredOutcome",
    label: "desired outcome",
    critical: true,
    question: "What should be different when this problem is solved?"
  },
  {
    name: "affectedUsers",
    label: "affected users",
    critical: true,
    question: "Which user groups perform or experience this process?"
  },
  {
    name: "stakeholders",
    label: "stakeholders and decision owners",
    critical: true,
    question: "Who owns the process and who must approve the outcome?"
  },
  {
    name: "currentProcess",
    label: "current process",
    critical: true,
    question:
      "How does the process work today, including exceptions and handoffs?"
  },
  {
    name: "successMetrics",
    label: "success measures",
    critical: true,
    question: "How will the team measure whether the change worked?"
  },
  {
    name: "painPoints",
    label: "pain points",
    critical: false,
    question:
      "Where does the current process create delay, rework, or confusion?"
  },
  {
    name: "businessRules",
    label: "business rules",
    critical: false,
    question: "Which rules, thresholds, exceptions, and escalation paths apply?"
  },
  {
    name: "constraints",
    label: "constraints",
    critical: false,
    question:
      "What timing, policy, data, integration, or compliance constraints apply?"
  }
]);

const SCENARIOS = Object.freeze([
  {
    id: "salesLeadFollowUp",
    terms: [
      "lead",
      "sales rep",
      "salesperson",
      "follow up",
      "follow-up",
      "contacted"
    ],
    questions: [
      "Who owns the lead?",
      "What qualifies as contact?",
      "What is the required response time?",
      "What happens when the response time is missed?",
      "Should managers be notified?",
      "Are all lead sources treated the same?",
      "How will success be measured?"
    ],
    risks: [
      "Lead ownership, contact definitions, and response-time rules may differ across teams or lead sources.",
      "A reminder could create noise if exceptions and escalation paths are not defined."
    ]
  },
  {
    id: "approvalBusinessProcess",
    terms: ["approval", "approve", "business process", "sign off", "sign-off"],
    questions: [
      "What event starts the process?",
      "Who can submit, approve, reject, or reassign the request?",
      "Which thresholds or exceptions change the approval path?",
      "What is the expected response time at each step?",
      "What must happen after approval or rejection?"
    ],
    risks: [
      "Undefined exceptions or authority limits can make an approval process block valid work.",
      "Reassignment, delegation, and rejected-request behavior may be overlooked."
    ]
  },
  {
    id: "dataQuality",
    terms: [
      "data quality",
      "required field",
      "required information",
      "missing data",
      "invalid data"
    ],
    questions: [
      "Which information is required and at what stage?",
      "Who creates and maintains the information?",
      "What valid exceptions exist?",
      "How do integrations and imports provide the information?",
      "How should existing incomplete records be handled?"
    ],
    risks: [
      "A universal requirement may block valid exceptions, integrations, or historical records.",
      "The proposed rule may address a symptom instead of the source of poor data."
    ]
  },
  {
    id: "userAccess",
    terms: ["permission", "access", "visibility", "least privilege", "profile"],
    questions: [
      "Which job responsibilities require the access?",
      "Which records and fields should each user population see or change?",
      "Is the access permanent, temporary, or conditional?",
      "Who approves and reviews access assignments?",
      "What sensitive actions must remain restricted?"
    ],
    risks: [
      "Broad access may expose data or actions beyond the stated job requirement.",
      "Removing access without persona testing may interrupt legitimate work."
    ]
  },
  {
    id: "reportingVisibility",
    terms: ["report", "dashboard", "metric", "visibility", "kpi", "analytics"],
    questions: [
      "What decision should the information support?",
      "Who is the audience and what level of detail do they need?",
      "How are the measures defined and who owns each definition?",
      "What filters, time periods, and refresh expectations apply?",
      "Which records or fields must be restricted?"
    ],
    risks: [
      "Undefined measures can produce conflicting reports that appear authoritative.",
      "Visibility requirements may conflict with record or field access rules."
    ]
  }
]);

const GENERAL_SCENARIO = Object.freeze({
  id: "general",
  questions: [
    "Who owns the current process and desired outcome?",
    "Which users, handoffs, exceptions, and business rules are in scope?",
    "What is explicitly out of scope?",
    "What evidence will show that the outcome improved?",
    "Which risks or constraints could change the design?"
  ],
  risks: [
    "The proposed solution may be premature until the current process, ownership, and measurable outcome are clear."
  ]
});

export function buildConsultantDiscovery(input = {}) {
  const model = normalizeModel(input);
  const scenario = resolveScenario(model);
  const missingFields = FIELD_DEFINITIONS.filter(
    (definition) => !hasValue(model[definition.name])
  );
  const missingCritical = missingFields.filter(
    (definition) => definition.critical
  );
  const readinessAssessment = assessReadiness(missingCritical, missingFields);

  return {
    ...model,
    scenarioId: scenario.id,
    discoveryQuestions: unique([
      ...missingFields.map((definition) => definition.question),
      ...scenario.questions,
      ...model.openQuestions
    ]),
    risks: unique([...model.risks, ...scenario.risks]),
    openQuestions: [...model.openQuestions],
    readinessAssessment,
    source: "Deterministic consultant discovery rules",
    rulesVersion: CONSULTANT_DISCOVERY_VERSION
  };
}

export function getSupportedDiscoveryScenarios() {
  return [...SCENARIOS.map((scenario) => scenario.id), GENERAL_SCENARIO.id];
}

function assessReadiness(missingCritical, missingFields) {
  const missingCriticalLabels = missingCritical.map((item) => item.label);
  const missingSupportingLabels = missingFields
    .filter((item) => !item.critical)
    .map((item) => item.label);
  let status = DISCOVERY_READINESS.READY_TO_DESIGN;

  if (missingCritical.length >= 3) {
    status = DISCOVERY_READINESS.DISCOVERY_NEEDED;
  } else if (missingCritical.length > 0) {
    status = DISCOVERY_READINESS.NEARLY_READY;
  }

  const completedCritical =
    FIELD_DEFINITIONS.filter((item) => item.critical).length -
    missingCritical.length;
  const score = Math.round(
    (completedCritical /
      FIELD_DEFINITIONS.filter((item) => item.critical).length) *
      100
  );

  return {
    status,
    score,
    readyToDesign: status === DISCOVERY_READINESS.READY_TO_DESIGN,
    missingCritical: missingCriticalLabels,
    missingSupporting: missingSupportingLabels,
    reasons: missingCriticalLabels.length
      ? [
          `Critical discovery still needed: ${missingCriticalLabels.join(", ")}.`
        ]
      : [
          "The business problem, desired outcome, users, stakeholders, current process, and success measures are defined."
        ]
  };
}

function resolveScenario(model) {
  const searchableText = [
    model.businessProblem,
    model.desiredOutcome,
    model.currentProcess,
    ...model.painPoints,
    ...model.businessRules
  ]
    .join(" ")
    .toLowerCase();

  const rankedScenarios = SCENARIOS.map((scenario, index) => ({
    scenario,
    index,
    matchCount: scenario.terms.filter((term) => searchableText.includes(term))
      .length
  }))
    .filter((candidate) => candidate.matchCount > 0)
    .sort(
      (left, right) =>
        right.matchCount - left.matchCount || left.index - right.index
    );

  return rankedScenarios[0]?.scenario || GENERAL_SCENARIO;
}

function normalizeModel(input) {
  return {
    businessProblem: normalizeText(input.businessProblem),
    desiredOutcome: normalizeText(input.desiredOutcome),
    affectedUsers: normalizeList(input.affectedUsers),
    stakeholders: normalizeList(input.stakeholders),
    currentProcess: normalizeText(input.currentProcess),
    painPoints: normalizeList(input.painPoints),
    businessRules: normalizeList(input.businessRules),
    constraints: normalizeList(input.constraints),
    successMetrics: normalizeList(input.successMetrics),
    risks: normalizeList(input.risks),
    openQuestions: normalizeList(input.openQuestions)
  };
}

function normalizeText(value = "") {
  return String(value).trim();
}

function normalizeList(value) {
  if (Array.isArray(value)) {
    return unique(value.map(normalizeText).filter(Boolean));
  }

  return unique(
    String(value || "")
      .split(/[,;\n]/)
      .map(normalizeText)
      .filter(Boolean)
  );
}

function hasValue(value) {
  return Array.isArray(value) ? value.length > 0 : Boolean(value);
}

function unique(values) {
  return [...new Set(values)];
}
