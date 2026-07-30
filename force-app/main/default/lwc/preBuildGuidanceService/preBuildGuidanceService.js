export const PRE_BUILD_GUIDANCE_VERSION = "1.0.0";

const COMMON_TESTS = Object.freeze([
  "Test with each affected user persona.",
  "Test expected, negative, blank, and boundary scenarios.",
  "Confirm existing automation and reporting still behave as expected.",
  "Validate in a sandbox and document the rollback approach."
]);

const GUIDANCE = Object.freeze({
  Object: {
    feature: "Salesforce custom object or an extension of an existing object",
    considerations: [
      "Confirm an existing standard or custom object cannot meet the need.",
      "Define ownership, sharing, record lifecycle, reporting, and data retention.",
      "Document relationships and the system of record before creating fields."
    ],
    tests: [
      "Verify create, read, update, and delete access by persona.",
      "Verify sharing, ownership, relationships, and reporting."
    ],
    related: ["orgExplorer", "explainThis", "orgHealthDashboard"]
  },
  Field: {
    feature: "Salesforce field on the appropriate existing object",
    considerations: [
      "Confirm the value is not already available or derivable.",
      "Choose a data type that supports reporting, integration, and future use.",
      "Plan field-level security, layouts, requiredness, and data migration."
    ],
    tests: [
      "Verify field visibility and edit access by persona.",
      "Verify validation, defaulting, formulas, automation, and integrations."
    ],
    related: ["orgExplorer", "explainThis", "orgHealthDashboard"]
  },
  Flow: {
    feature: "Salesforce Flow, after validating the automation pattern",
    considerations: [
      "Confirm declarative automation is appropriate and reusable logic is separated.",
      "Define entry criteria, bulk behavior, fault handling, and observability.",
      "Review existing automation before adding another execution path."
    ],
    tests: [
      "Test qualifying and non-qualifying records in bulk.",
      "Test success, fault, permission, recursion, and rollback scenarios."
    ],
    related: ["automationAdvisor", "flowIntelligence", "orgHealthDashboard"]
  },
  "Validation Rule": {
    feature:
      "Salesforce Validation Rule when the requirement is a save-time data constraint",
    considerations: [
      "Confirm the rule represents a business constraint rather than automation.",
      "Define exceptions, bypass governance, error placement, and integration impact.",
      "Check existing validation and automation for overlapping enforcement."
    ],
    tests: [
      "Test valid, invalid, blank, imported, and integration-driven records.",
      "Test authorized exceptions without weakening the rule for other users."
    ],
    related: ["automationAdvisor", "orgExplorer", "explainThis"]
  },
  "Permission Set": {
    feature: "Salesforce Permission Set using least-privilege access",
    considerations: [
      "Start with the user job and required access, not a clone of another user.",
      "Separate baseline access from temporary or elevated responsibilities.",
      "Review object, field, Apex, app, tab, and system permissions together."
    ],
    tests: [
      "Verify intended users can complete the job.",
      "Verify restricted users cannot view or change protected data."
    ],
    related: ["orgExplorer", "orgHealthDashboard", "explainThis"]
  },
  Report: {
    feature: "Salesforce Report with the simplest suitable report type",
    considerations: [
      "Define the decision, audience, filters, grain, and refresh expectation.",
      "Confirm the report type exposes the correct relationship and record population.",
      "Validate folder access and sensitive-field exposure."
    ],
    tests: [
      "Reconcile totals against known records and edge cases.",
      "Verify filters, subscriptions, exports, and folder access by persona."
    ],
    related: ["orgExplorer", "explainThis", "dashboard"]
  },
  Dashboard: {
    feature: "Salesforce Dashboard backed by validated source reports",
    considerations: [
      "Define the decisions each metric supports and its owner.",
      "Use consistent filters, date windows, units, and running-user behavior.",
      "Keep the dashboard focused on actions rather than decorative metrics."
    ],
    tests: [
      "Reconcile every component to its source report.",
      "Verify filters, refresh behavior, subscriptions, and viewer access."
    ],
    related: ["orgHealthDashboard", "orgExplorer", "dashboard"]
  }
});

export function buildPreBuildGuidance({
  changeType = "",
  businessProblem = "",
  affectedUsers = []
} = {}) {
  const selectedGuidance = GUIDANCE[changeType];

  if (!selectedGuidance || !String(businessProblem).trim()) {
    return null;
  }

  const users = Array.isArray(affectedUsers) ? affectedUsers : [];

  return {
    changeType,
    businessProblem: String(businessProblem).trim(),
    affectedUsers: [...users],
    recommendedFeature: selectedGuidance.feature,
    consultantConsiderations: [...selectedGuidance.considerations],
    testingChecklist: [
      ...selectedGuidance.tests,
      ...COMMON_TESTS,
      `Confirm acceptance criteria with ${
        users.length ? users.join(", ") : "the affected users"
      }.`
    ],
    relatedWorkspaces: [...selectedGuidance.related]
  };
}

export function getSupportedChangeTypes() {
  return Object.keys(GUIDANCE);
}
