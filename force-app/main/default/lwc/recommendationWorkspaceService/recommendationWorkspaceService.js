import {
  findModuleByName,
  getQuickLaunchModules
} from "c/copilotModuleRegistry";

export const RECOMMENDATION_WORKSPACE_SERVICE_VERSION = "1.0.0";

const DEFAULT_DESTINATION = "orgHealthDashboard";

export function resolveRecommendationWorkspace(recommendation = {}) {
  const explicitDestination =
    recommendation.moduleName || recommendation.workspaceId;

  if (isAvailableDestination(explicitDestination)) {
    return explicitDestination;
  }

  const category = normalize(recommendation.category);
  const entityType = normalize(
    recommendation.entityType || recommendation.metadataType
  );

  const categoryMatch = getQuickLaunchModules().find((moduleDefinition) =>
    (moduleDefinition.recommendationCategories || []).some(
      (candidate) => normalize(candidate) === category
    )
  );

  if (categoryMatch) {
    return categoryMatch.name;
  }

  const entityMatch = getQuickLaunchModules().find((moduleDefinition) =>
    (moduleDefinition.entityTypes || []).some(
      (candidate) => normalize(candidate) === entityType
    )
  );

  return entityMatch?.name || DEFAULT_DESTINATION;
}

export function enrichRecommendationWithWorkspace(recommendation = {}) {
  const moduleName = resolveRecommendationWorkspace(recommendation);
  const moduleDefinition = findModuleByName(moduleName);

  return {
    ...recommendation,
    moduleName,
    workspaceLabel: moduleDefinition?.title || "Open Workspace"
  };
}

export function getRecommendationQuickLaunches() {
  return getQuickLaunchModules().map((moduleDefinition) => ({
    id: `quick-launch-${moduleDefinition.name}`,
    label: moduleDefinition.title,
    iconName: moduleDefinition.iconName,
    moduleName: moduleDefinition.name
  }));
}

export function createWorkspaceNavigationEvent(moduleName, context = null) {
  if (!isAvailableDestination(moduleName)) {
    return null;
  }

  return new CustomEvent("workspacenavigate", {
    detail: context ? { moduleName, context } : { moduleName },
    bubbles: true,
    composed: true
  });
}

export function createRecommendationContext(
  recommendation = {},
  {
    sourceWorkspace = "dashboard",
    sourceType = "recommendation",
    metadataSnapshot = null
  } = {}
) {
  const entityType =
    recommendation.entityType || recommendation.metadataType || "";
  const structuredQualifiedName =
    recommendation.qualifiedApiName ||
    (normalize(entityType) === "field" &&
    String(recommendation.entityApiName || "").includes(".")
      ? recommendation.entityApiName
      : "");
  const [qualifiedObjectName, ...qualifiedFieldParts] =
    structuredQualifiedName.split(".");

  return {
    sourceWorkspace,
    sourceType,
    recommendationId: recommendation.recommendationId || recommendation.id,
    findingId: recommendation.findingId,
    title: recommendation.title || "Selected issue",
    reason:
      recommendation.reason ||
      recommendation.action ||
      recommendation.description ||
      "",
    entityType,
    entityApiName:
      recommendation.objectApiName ||
      (structuredQualifiedName
        ? qualifiedObjectName
        : recommendation.entityApiName) ||
      "",
    fieldApiName:
      recommendation.fieldApiName || qualifiedFieldParts.join(".") || "",
    qualifiedApiName: structuredQualifiedName,
    evidence: Array.isArray(recommendation.evidence)
      ? [...recommendation.evidence]
      : [],
    metadataSnapshot
  };
}

function isAvailableDestination(moduleName) {
  const moduleDefinition = findModuleByName(moduleName);
  return Boolean(moduleDefinition && !moduleDefinition.disabled);
}

function normalize(value = "") {
  return String(value).trim().toLowerCase();
}
