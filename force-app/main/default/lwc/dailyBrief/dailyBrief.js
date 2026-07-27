import { LightningElement } from "lwc";
import { getLiveModuleCount } from "c/copilotModuleRegistry";

const USER_NAME = "Domonique";

const DAILY_PRIORITIES = Object.freeze([
  Object.freeze({
    id: "priority-1",
    title: "Complete the Daily Brief workspace",
    description:
      "Finish the user interface, connect navigation, deploy, and verify the new workspace.",
    indicatorClass: "priority-indicator priority-high"
  }),
  Object.freeze({
    id: "priority-2",
    title: "Improve the Findings experience",
    description:
      "Prepare severity grouping, filtering, and expandable findings for a cleaner admin workflow.",
    indicatorClass: "priority-indicator priority-medium"
  }),
  Object.freeze({
    id: "priority-3",
    title: "Expand Explain This coverage",
    description:
      "Continue supporting additional Salesforce metadata types through the deterministic intelligence layer.",
    indicatorClass: "priority-indicator priority-standard"
  })
]);

const RECENT_PROGRESS = Object.freeze([
  Object.freeze({
    id: "progress-1",
    label: "Created the centralized Copilot Module Registry"
  }),
  Object.freeze({
    id: "progress-2",
    label: "Refactored the dashboard to consume shared module definitions"
  }),
  Object.freeze({
    id: "progress-3",
    label: "Added permanent project and AI context documentation"
  }),
  Object.freeze({
    id: "progress-4",
    label: "Successfully deployed and verified the registry architecture"
  }),
  Object.freeze({
    id: "progress-5",
    label: "Created and deployed the Daily Brief workspace"
  }),
  Object.freeze({
    id: "progress-6",
    label: "Introduced the reusable Copilot Workspace Router"
  })
]);

const QUICK_ACTIONS = Object.freeze([
  Object.freeze({
    id: "action-explain-this",
    label: "Explain This",
    description: "Understand Salesforce metadata and dependencies.",
    iconName: "utility:knowledge_base",
    moduleName: "explainThis"
  }),
  Object.freeze({
    id: "action-flow-intelligence",
    label: "Flow Intelligence",
    description: "Analyze automation purpose, risks, and testing needs.",
    iconName: "utility:flow",
    moduleName: "flowIntelligence"
  }),
  Object.freeze({
    id: "action-org-health",
    label: "Org Health",
    description: "Review health signals and prioritized findings.",
    iconName: "utility:summary",
    moduleName: "orgHealthDashboard"
  }),
  Object.freeze({
    id: "action-org-explorer",
    label: "Org Explorer",
    description: "Inspect Salesforce objects and configuration.",
    iconName: "utility:search",
    moduleName: "orgExplorer"
  })
]);

export default class DailyBrief extends LightningElement {
  userName = USER_NAME;

  orgHealthStatus = "Healthy";

  orgHealthMessage =
    "No critical architecture concerns are currently highlighted.";

  metadataCoverage = 84;

  currentPriority = "Findings Experience";

  recommendedActionTitle = "Improve the Findings experience";

  recommendedActionDescription =
    "Open Org Health and begin organizing findings by severity with clearer filtering and expandable sections.";

  recommendedModuleName = "orgHealthDashboard";

  get greeting() {
    const currentHour = new Date().getHours();

    if (currentHour < 12) {
      return "Good Morning";
    }

    if (currentHour < 17) {
      return "Good Afternoon";
    }

    return "Good Evening";
  }

  get formattedDate() {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    }).format(new Date());
  }

  get liveModuleCount() {
    return getLiveModuleCount();
  }

  get dailyPriorities() {
    return DAILY_PRIORITIES;
  }

  get recentProgress() {
    return RECENT_PROGRESS;
  }

  get quickActions() {
    return QUICK_ACTIONS;
  }

  handleRecommendedAction() {
    this.dispatchNavigationEvent(this.recommendedModuleName);
  }

  handleQuickAction(event) {
    const moduleName = event.currentTarget.dataset.module;

    this.dispatchNavigationEvent(moduleName);
  }

  dispatchNavigationEvent(moduleName) {
    if (!moduleName) {
      return;
    }

    this.dispatchEvent(
      new CustomEvent("workspacenavigate", {
        detail: {
          moduleName
        },
        bubbles: true,
        composed: true
      })
    );
  }
}
