/**
 * Deterministic registry of the modules presented by Salesforce Copilot.
 *
 * This service is the source of truth for dashboard module configuration. It
 * contains no generative AI behavior and does not depend on an AI provider.
 */
export const COPILOT_MODULES = Object.freeze([
  Object.freeze({
    name: "dashboard",
    title: "Dashboard",
    iconName: "utility:home",
    description: "Return to the Administration Workspace overview.",
    status: "Available",
    statusClass: "status-badge status-available",
    progress: 100,
    progressLabel: "100% complete",
    phase: "Application Shell",
    disabled: false,
    hidden: true,
    recommendationCategories: []
  }),
  Object.freeze({
    name: "dailyBrief",
    title: "Daily Brief",
    iconName: "utility:dayview",
    description:
      "Review org health, metadata coverage, development priorities, recent progress, and recommended administrative actions.",
    status: "Available",
    statusClass: "status-badge status-available",
    progress: 70,
    progressLabel: "70% complete",
    phase: "Executive Experience MVP",
    disabled: false,
    featured: true,
    recommendationCategories: ["Daily Brief"]
  }),
  Object.freeze({
    name: "explainThis",
    title: "Explain This",
    iconName: "utility:knowledge_base",
    description:
      "Instantly explain Salesforce metadata using business context, technical analysis, dependency mapping, deployment guidance, testing recommendations, and interview coaching.",
    status: "Available",
    statusClass: "status-badge status-available",
    progress: 100,
    progressLabel: "100% complete",
    phase: "Copilot Intelligence Engine",
    disabled: false,
    featured: true,
    recommendationCategories: ["Data Model", "Documentation"],
    entityTypes: ["Object", "Field"]
  }),
  Object.freeze({
    name: "flowIntelligence",
    title: "Flow Intelligence",
    iconName: "utility:flow",
    description:
      "Analyze Salesforce Flows, identify risks, documentation, testing strategies, and interview insights.",
    status: "Available",
    statusClass: "status-badge status-available",
    progress: 85,
    progressLabel: "85% complete",
    phase: "Live Module",
    disabled: false,
    recommendationCategories: ["Automation"],
    entityTypes: ["Flow"]
  }),
  Object.freeze({
    name: "orgExplorer",
    title: "Org Explorer",
    iconName: "utility:connected_apps",
    description:
      "Explore Salesforce objects, fields, permissions, relationships, and metadata.",
    status: "Available",
    statusClass: "status-badge status-available",
    progress: 80,
    progressLabel: "80% complete",
    phase: "Metadata Explorer",
    disabled: false,
    recommendationCategories: ["Metadata Coverage"],
    entityTypes: ["Object", "Field"]
  }),
  Object.freeze({
    name: "orgHealthDashboard",
    title: "Org Health",
    iconName: "utility:shield",
    description:
      "Evaluate organization health, metadata quality, deployment readiness, and improvement opportunities.",
    status: "Available",
    statusClass: "status-badge status-available",
    progress: 90,
    progressLabel: "90% complete",
    phase: "Live Metadata",
    disabled: false,
    recommendationCategories: [
      "Org Health",
      "Security",
      "Data Quality",
      "Release Readiness"
    ]
  }),
  Object.freeze({
    name: "askBeforeYouBuild",
    title: "Ask Before You Build",
    iconName: "utility:choice",
    description:
      "Frame a Salesforce change, review consultant considerations, and prepare a deterministic testing checklist before implementation.",
    status: "Available",
    statusClass: "status-badge status-available",
    progress: 100,
    progressLabel: "100% complete",
    phase: "Guided Planning",
    disabled: false,
    featured: true,
    recommendationCategories: ["Solution Design"]
  }),
  Object.freeze({
    name: "knowledgeCenter",
    title: "Knowledge Center",
    iconName: "utility:knowledge_base",
    description:
      "Understand organization metadata, findings, coverage, and explainable health analysis.",
    status: "Available",
    statusClass: "status-badge status-available",
    progress: 100,
    progressLabel: "100% complete",
    phase: "Organization Understanding",
    disabled: false
  }),
  Object.freeze({
    name: "automationAdvisor",
    title: "Automation Advisor",
    iconName: "utility:settings",
    description:
      "Recommend the best Salesforce automation solution using Flow, Validation Rules, Approval Processes, configuration, or Apex.",
    status: "Available",
    statusClass: "status-badge status-available",
    progress: 100,
    progressLabel: "100% complete",
    phase: "Rules-Based Advisor",
    disabled: false
  }),
  Object.freeze({
    name: "troubleshootingAssistant",
    title: "Troubleshooting Assistant",
    iconName: "utility:warning",
    description:
      "Diagnose Flow failures, save errors, permissions, duplicate rules, Apex issues, and configuration problems.",
    status: "Available",
    statusClass: "status-badge status-available",
    progress: 90,
    progressLabel: "90% complete",
    phase: "Rules-Based Assistant",
    disabled: false
  }),
  Object.freeze({
    name: "metadataDiagnostic",
    title: "Metadata Diagnostic",
    iconName: "utility:database",
    description: "Inspect the shared live metadata context and coverage.",
    status: "Available",
    statusClass: "status-badge status-available",
    progress: 100,
    progressLabel: "100% complete",
    phase: "Developer Tool",
    disabled: false,
    hidden: true
  }),
  Object.freeze({
    name: "allTools",
    title: "All Tools",
    iconName: "utility:apps",
    description: "Browse every available and planned workspace.",
    status: "Available",
    statusClass: "status-badge status-available",
    progress: 100,
    progressLabel: "100% complete",
    phase: "Application Shell",
    disabled: false,
    hidden: true
  }),
  Object.freeze({
    name: "developerTools",
    title: "Developer Tools",
    iconName: "utility:setup",
    description:
      "Inspect metadata, coverage, cache, services, registry, and routing diagnostics.",
    status: "Available",
    statusClass: "status-badge status-available",
    progress: 100,
    progressLabel: "100% complete",
    phase: "Technical Diagnostics",
    disabled: false,
    hidden: true
  }),
  Object.freeze({
    name: "documentationGenerator",
    title: "Documentation Generator",
    iconName: "utility:knowledge_base",
    description:
      "Generate administrator documentation, release notes, deployment guides, and testing plans.",
    status: "Planned",
    statusClass: "status-badge status-planned",
    progress: 5,
    progressLabel: "5% complete",
    phase: "Coming Soon",
    disabled: true
  }),
  Object.freeze({
    name: "aiLearningCoach",
    title: "AI Learning Coach",
    iconName: "utility:education",
    description:
      "Practice Salesforce concepts, certification questions, interview scenarios, and administrator skills.",
    status: "Planned",
    statusClass: "status-badge status-planned",
    progress: 5,
    progressLabel: "5% complete",
    phase: "Coming Soon",
    disabled: true
  })
]);

/**
 * Creates a defensive copy of a module configuration.
 *
 * @param {object} moduleDefinition Module configuration from the registry.
 * @returns {object} A new module configuration object.
 */
function copyModule(moduleDefinition) {
  return { ...moduleDefinition };
}

/**
 * Returns all available, enabled modules.
 *
 * @returns {Array<object>} A new array containing copies of live modules.
 */
export function getLiveModules() {
  return COPILOT_MODULES.filter(
    (moduleDefinition) =>
      moduleDefinition.status === "Available" &&
      !moduleDefinition.disabled &&
      !moduleDefinition.hidden
  ).map(copyModule);
}

/**
 * Returns the number of available, enabled modules.
 *
 * @returns {number} Live module count.
 */
export function getLiveModuleCount() {
  return getLiveModules().length;
}

/**
 * Returns all modules with a planned status.
 *
 * @returns {Array<object>} A new array containing copies of planned modules.
 */
export function getPlannedModules() {
  return COPILOT_MODULES.filter(
    (moduleDefinition) => moduleDefinition.status === "Planned"
  ).map(copyModule);
}

/**
 * Returns the number of planned modules.
 *
 * @returns {number} Planned module count.
 */
export function getPlannedModuleCount() {
  return getPlannedModules().length;
}

/**
 * Calculates rounded average progress across every registered module.
 *
 * @returns {number} Average module progress from 0 to 100.
 */
export function getAverageModuleProgress() {
  if (!COPILOT_MODULES.length) {
    return 0;
  }

  const totalProgress = COPILOT_MODULES.reduce(
    (total, moduleDefinition) => total + Number(moduleDefinition.progress || 0),
    0
  );

  return Math.round(totalProgress / COPILOT_MODULES.length);
}

/**
 * Finds a registered module by its exact name.
 *
 * @param {string} name Exact module name.
 * @returns {object|undefined} A copy of the matching module, when found.
 */
export function findModuleByName(name) {
  const moduleDefinition = COPILOT_MODULES.find((item) => item.name === name);

  return moduleDefinition ? copyModule(moduleDefinition) : undefined;
}

export function getQuickLaunchModules() {
  const quickLaunchNames = [
    "dailyBrief",
    "explainThis",
    "flowIntelligence",
    "orgHealthDashboard",
    "orgExplorer",
    "automationAdvisor",
    "troubleshootingAssistant",
    "askBeforeYouBuild"
  ];

  return quickLaunchNames
    .map(findModuleByName)
    .filter(
      (moduleDefinition) => moduleDefinition && !moduleDefinition.disabled
    );
}
