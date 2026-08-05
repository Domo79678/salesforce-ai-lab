export const RESOLUTION_GUIDANCE_VERSION = "1.0.0";

const SCENARIOS = Object.freeze([
  {
    id: "metadataCoverage",
    matches: ({ searchableText, coverageIncomplete }) =>
      coverageIncomplete ||
      includesAny(searchableText, [
        "metadatacoverage",
        "metadata coverage",
        "coverage incomplete"
      ]),
    guidance: {
      recommendedApproach: [
        "Identify which metadata sources are unavailable, unsupported, or only partially collected.",
        "Verify the relevant configuration manually before making a change.",
        "Repeat the deterministic analysis after the required metadata becomes available."
      ],
      reviewFirst: [
        "The current metadata coverage status and collection notes.",
        "Unavailable and unsupported metadata categories relevant to the proposed change."
      ],
      doNotDo: [
        "Do not treat missing metadata coverage as proof that a component or dependency is absent."
      ],
      dependenciesToCheck: [
        "Sources outside the current metadata snapshot",
        "Manually maintained configuration and integration documentation"
      ],
      testPlan: [
        "Confirm the missing source directly in a safe environment.",
        "Refresh metadata coverage and verify the analysis reflects the newly available source."
      ],
      deploymentConsiderations: [
        "Delay an irreversible change until relevant metadata gaps are resolved or manually verified.",
        "Record any manual verification used to support the deployment decision."
      ]
    }
  },
  {
    id: "fieldSprawl",
    matches: ({ searchableText }) =>
      includesAny(searchableText, [
        "fieldsprawl",
        "field count",
        "field sprawl",
        "unused field",
        "too many fields"
      ]),
    guidance: {
      recommendedApproach: [
        "Inventory the fields in scope and identify candidates that appear unused or deprecated.",
        "Review dependencies and confirm business ownership for each retirement candidate.",
        "Retire confirmed candidates carefully through a documented, reversible process."
      ],
      reviewFirst: [
        "Field purpose, usage evidence, ownership, and retention requirements.",
        "Existing deprecation conventions and downstream consumers."
      ],
      doNotDo: ["Do not delete fields simply because the field count is high."],
      dependenciesToCheck: [
        "Flow",
        "Validation Rules",
        "Formula Fields",
        "Reports",
        "Apex",
        "Page Layouts"
      ],
      testPlan: [
        "Test affected create, update, reporting, and automation paths with representative records.",
        "Confirm intended user personas can complete their work after the proposed retirement."
      ],
      deploymentConsiderations: [
        "Prefer staged deprecation before deletion.",
        "Define recovery steps and preserve data required for rollback or audit."
      ]
    }
  },
  {
    id: "flowAutomation",
    matches: ({ searchableText, entityType }) =>
      entityType === "flow" ||
      includesAny(searchableText, [
        "flowautomation",
        "flow",
        "automation",
        "recursion"
      ]),
    guidance: {
      recommendedApproach: [
        "Identify the triggering conditions and the records the automation can update.",
        "Review overlapping automations and validate the expected execution order.",
        "Confirm recursion, repeated-update, fault, and bulk behavior."
      ],
      reviewFirst: [
        "Entry criteria, update paths, fault handling, and active versions.",
        "Other automation that runs for the same object and transaction."
      ],
      doNotDo: [
        "Do not add another automation path before checking overlap and execution order."
      ],
      dependenciesToCheck: [
        "Other Flows",
        "Validation Rules",
        "Apex Triggers",
        "Invocable Apex",
        "Subflows",
        "Approval Processes"
      ],
      testPlan: [
        "Test qualifying and non-qualifying records.",
        "Test bulk updates, recursion guards, fault paths, and repeated updates.",
        "Verify results with the permissions of each affected user persona."
      ],
      deploymentConsiderations: [
        "Validate the target-org active version and required subflows or Apex dependencies.",
        "Define how to deactivate or restore the prior automation version."
      ]
    }
  },
  {
    id: "permissionAccess",
    matches: ({ searchableText, entityType }) =>
      ["permissionset", "profile"].includes(entityType) ||
      includesAny(searchableText, [
        "permissionaccess",
        "permission",
        "access concern",
        "least privilege",
        "profile"
      ]),
    guidance: {
      recommendedApproach: [
        "Identify the intended user population and the tasks they must perform.",
        "Inspect the current access model and prefer the least privilege needed.",
        "Validate permission-set and profile implications together."
      ],
      reviewFirst: [
        "Object, field, Apex, app, tab, sharing, and system permissions in scope.",
        "Existing permission-set groups, profiles, and assignment processes."
      ],
      doNotDo: [
        "Do not clone broad access or grant elevated permissions without validating the job requirement."
      ],
      dependenciesToCheck: [
        "Permission Sets",
        "Permission Set Groups",
        "Profiles",
        "Sharing Model",
        "Apex Class Access",
        "Field-Level Security"
      ],
      testPlan: [
        "Verify intended users can complete the required task.",
        "Verify restricted users cannot view or change protected data.",
        "Test assignment, removal, and muting behavior where applicable."
      ],
      deploymentConsiderations: [
        "Deploy access changes with the components they authorize.",
        "Document assignment and recovery steps before enabling access broadly."
      ]
    }
  },
  {
    id: "deploymentReadiness",
    matches: ({ searchableText, blocking }) =>
      blocking ||
      includesAny(searchableText, [
        "deploymentreadiness",
        "deployment readiness",
        "deployment blocker",
        "not ready"
      ]),
    guidance: {
      recommendedApproach: [
        "Resolve blocking findings first and confirm all required dependencies.",
        "Test the change in a safe environment using production-representative scenarios.",
        "Define rollback or recovery steps before requesting deployment approval."
      ],
      reviewFirst: [
        "Blocking and high-severity findings.",
        "Required components, deployment order, validation results, and ownership."
      ],
      doNotDo: [
        "Do not approve deployment while unresolved blockers or unverified dependencies remain."
      ],
      dependenciesToCheck: [
        "Required Metadata Components",
        "Automated Tests",
        "Data Migration Steps",
        "Integration Dependencies",
        "Release Sequence"
      ],
      testPlan: [
        "Run targeted positive, negative, permission, bulk, and regression tests.",
        "Validate deployment in a safe environment and rehearse recovery steps."
      ],
      deploymentConsiderations: [
        "Define release ownership, monitoring, and approval criteria.",
        "Prepare a rollback or forward-fix path and verify required backups."
      ]
    }
  }
]);

const DEFAULT_GUIDANCE = Object.freeze({
  recommendedApproach: [
    "Confirm the finding or recommendation against the available metadata and business requirement.",
    "Review known dependencies, ownership, and user impact before selecting a change.",
    "Make the smallest supported change and validate the result in a safe environment."
  ],
  reviewFirst: [
    "The finding evidence, severity, affected metadata, and current business owner.",
    "Known dependencies and any gaps in metadata coverage."
  ],
  doNotDo: [
    "Do not make an irreversible change based only on a summary or incomplete metadata."
  ],
  dependenciesToCheck: [],
  testPlan: [
    "Test expected, negative, permission, and regression scenarios for affected users."
  ],
  deploymentConsiderations: [
    "Validate in a safe environment and document recovery steps before deployment."
  ]
});

export function buildResolutionGuidance(context = {}) {
  const normalizedContext = normalizeContext(context);
  const matchingScenarios = SCENARIOS.filter((candidate) =>
    candidate.matches(normalizedContext)
  );
  const scenario =
    matchingScenarios.find(
      (candidate) => candidate.id !== "metadataCoverage"
    ) || matchingScenarios[0];
  const guidance = scenario?.guidance || DEFAULT_GUIDANCE;

  return {
    scenarioId: scenario?.id || "general",
    recommendedApproach: copy(guidance.recommendedApproach),
    reviewFirst: copy(guidance.reviewFirst),
    doNotDo: copy(guidance.doNotDo),
    dependenciesToCheck: unique([
      ...copy(guidance.dependenciesToCheck),
      ...normalizedContext.knownDependencies
    ]),
    testPlan: unique([
      ...copy(guidance.testPlan),
      ...normalizedContext.knownTests
    ]),
    deploymentConsiderations: unique([
      ...copy(guidance.deploymentConsiderations),
      ...normalizedContext.knownDeploymentConsiderations
    ]),
    source: "Deterministic resolution guidance rules",
    rulesVersion: RESOLUTION_GUIDANCE_VERSION
  };
}

export function getSupportedResolutionScenarios() {
  return SCENARIOS.map((scenario) => scenario.id);
}

function normalizeContext(context) {
  const finding = context.finding || {};
  const recommendation = context.recommendation || {};
  const explanation = context.explanation || {};
  const launchContext = context.launchContext || {};
  const coverage = context.metadataCoverage || {};
  const entityType = normalize(
    context.entityType ||
      launchContext.entityType ||
      explanation.entity?.type ||
      finding.entityType ||
      recommendation.entityType
  );
  const searchableText = [
    context.findingType,
    context.severity,
    finding.type,
    finding.category,
    finding.title,
    finding.description,
    recommendation.category,
    recommendation.title,
    recommendation.reason,
    recommendation.action,
    launchContext.sourceType,
    launchContext.category,
    launchContext.title,
    launchContext.reason,
    explanation.entity?.apiName,
    ...(explanation.risks || []).flatMap((risk) => [
      risk.title,
      risk.description,
      risk.category
    ]),
    ...(explanation.improvements || []).flatMap((item) => [
      item.title,
      item.description
    ])
  ]
    .map(normalize)
    .filter(Boolean)
    .join(" ");

  return {
    entityType,
    searchableText,
    blocking: Boolean(
      context.blocking || finding.blocking || launchContext.blocking
    ),
    coverageIncomplete: isCoverageIncomplete(coverage),
    knownDependencies: (explanation.dependencies || [])
      .map(
        (dependency) =>
          dependency.label || dependency.apiName || dependency.type
      )
      .filter(Boolean),
    knownTests: (explanation.testCases || [])
      .map((testCase) => formatTestCase(testCase))
      .filter(Boolean),
    knownDeploymentConsiderations: buildDeploymentConsiderations(
      explanation.deployment
    )
  };
}

function isCoverageIncomplete(coverage) {
  const status = normalize(coverage.status || coverage.coverageStatus);
  return (
    ["partial", "incomplete", "unavailable", "failed"].includes(status) ||
    (coverage.unavailableCategories || []).length > 0 ||
    (coverage.unsupportedCategories || []).length > 0
  );
}

function buildDeploymentConsiderations(deployment = {}) {
  return unique([
    deployment.recommendation,
    ...(deployment.prerequisites || []),
    ...(deployment.rollbackSteps || [])
  ]).filter(Boolean);
}

function formatTestCase(testCase = {}) {
  if (!testCase.title) {
    return "";
  }
  return testCase.expectedResult
    ? `${testCase.title} Expected: ${testCase.expectedResult}`
    : testCase.title;
}

function includesAny(value, candidates) {
  return candidates.some((candidate) => value.includes(candidate));
}

function normalize(value = "") {
  return String(value).trim().toLowerCase();
}

function copy(values = []) {
  return [...values];
}

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}
