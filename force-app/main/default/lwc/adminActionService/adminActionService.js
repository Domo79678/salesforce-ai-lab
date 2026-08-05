const STORAGE_KEY = "salesforceCopilot.adminActions.v1";

export const ACTION_STATUSES = Object.freeze([
  "Needs Review",
  "Planned",
  "In Progress",
  "Resolved",
  "Accepted Risk",
  "Deferred"
]);

export const RISK_DISPOSITIONS = Object.freeze([
  "Not Evaluated",
  "Mitigated",
  "Accepted",
  "Deferred"
]);

function storage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function read() {
  try {
    const value = storage()?.getItem(STORAGE_KEY);
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

function write(actions) {
  storage()?.setItem(STORAGE_KEY, JSON.stringify(actions));
  return actions;
}

function identifier() {
  return `action-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createAction(context = {}, now = new Date().toISOString()) {
  const action = {
    id: identifier(),
    title: context.title || context.sourceFinding || "Review admin finding",
    sourceWorkspace: context.sourceWorkspace || "Administration Workspace",
    sourceFinding: context.sourceFinding || context.reason || "",
    sourceRecommendation:
      context.sourceRecommendation || context.recommendedApproach || "",
    objectApiName: context.objectApiName || context.entityApiName || "",
    severity: context.severity || "",
    status: "Needs Review",
    priority: context.priority || context.severity || "Medium",
    selectedAction: context.selectedAction || context.nextStep || "",
    testPlan: context.testPlan || "",
    resolutionNotes: "",
    riskDisposition: "Not Evaluated",
    createdAt: now,
    updatedAt: now,
    completedAt: null
  };
  write([action, ...read()]);
  return { ...action };
}

export function getActions() {
  return read().map((action) => ({ ...action }));
}

export function updateAction(id, changes = {}, now = new Date().toISOString()) {
  let updated;
  const actions = read().map((action) => {
    if (action.id !== id) return action;
    const status = ACTION_STATUSES.includes(changes.status)
      ? changes.status
      : action.status;
    const riskDisposition = RISK_DISPOSITIONS.includes(changes.riskDisposition)
      ? changes.riskDisposition
      : action.riskDisposition;
    updated = {
      ...action,
      ...changes,
      status,
      riskDisposition,
      updatedAt: now,
      completedAt:
        status === "Resolved" || status === "Accepted Risk" ? now : null
    };
    return updated;
  });
  write(actions);
  return updated ? { ...updated } : null;
}

export function getActionSummary() {
  return getActions().reduce(
    (summary, action) => {
      summary.total += 1;
      summary[action.status] = (summary[action.status] || 0) + 1;
      if (!["Resolved", "Accepted Risk"].includes(action.status)) {
        summary.open += 1;
      }
      return summary;
    },
    { total: 0, open: 0 }
  );
}
