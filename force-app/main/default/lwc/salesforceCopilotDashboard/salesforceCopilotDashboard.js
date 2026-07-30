import { LightningElement } from "lwc";
import { findModuleByName } from "c/copilotModuleRegistry";

const DASHBOARD = "dashboard";
const PRIMARY_ACTIONS = Object.freeze([
  { moduleName: "orgExplorer", label: "Explore Org" },
  {
    moduleName: "troubleshootingAssistant",
    label: "Troubleshoot an Issue"
  }
]);
const EXPLORE_MORE_MODULES = Object.freeze([
  "knowledgeCenter",
  "explainThis",
  "automationAdvisor",
  "flowIntelligence"
]);

export default class SalesforceCopilotDashboard extends LightningElement {
  currentView = DASHBOARD;
  workspaceContext = null;
  healthScore;
  healthStatus = "Checking";
  highPriorityCount = 0;
  recommendedActionCount = 0;
  analysisTimestamp;
  riskLevel = "Unknown";
  riskNotice = "Risk guidance is being prepared.";

  get highPriorityLabel() {
    return `${this.highPriorityCount}`;
  }

  get recommendedActionsLabel() {
    return `${this.recommendedActionCount}`;
  }

  get lastAnalysisLabel() {
    if (!this.analysisTimestamp) {
      return "Not available";
    }

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }).format(new Date(this.analysisTimestamp));
  }

  get primaryActions() {
    return PRIMARY_ACTIONS.map(({ moduleName, label }, index) => {
      const moduleDefinition = findModuleByName(moduleName);
      return {
        ...moduleDefinition,
        label,
        moduleName,
        description: this.getPrimaryActionDescription(moduleName),
        variant: index === 0 ? "brand" : "neutral"
      };
    }).filter((action) => action.status === "Available" && !action.disabled);
  }

  get featuredAskBeforeYouBuild() {
    return findModuleByName("askBeforeYouBuild");
  }

  get healthScoreLabel() {
    return Number.isFinite(Number(this.healthScore))
      ? `${this.healthScore}/100`
      : "Not available";
  }

  get workspacePreview() {
    return EXPLORE_MORE_MODULES.map(findModuleByName).filter(
      (moduleDefinition) =>
        moduleDefinition?.status === "Available" && !moduleDefinition.disabled
    );
  }

  get showDashboard() {
    return this.currentView === DASHBOARD;
  }

  get showWorkspaceRouter() {
    return !this.showDashboard;
  }

  handlePrimaryAction(event) {
    this.navigate(event.currentTarget.dataset.module);
  }

  handleFeaturedAsk() {
    this.navigate("askBeforeYouBuild");
  }

  handleWorkspaceLaunch(event) {
    this.navigate(event.currentTarget.dataset.module);
  }

  handleViewAllTools() {
    this.navigate("allTools");
  }

  handleDeveloperTools() {
    this.navigate("developerTools");
  }

  handleBriefStatus(event) {
    this.healthScore = event.detail?.healthScore;
    this.healthStatus = event.detail?.healthStatus || "Not evaluated";
    this.highPriorityCount = event.detail?.highPriorityCount || 0;
    this.recommendedActionCount = event.detail?.recommendedActionCount || 0;
    this.analysisTimestamp = event.detail?.analysisTimestamp;
    this.riskLevel = event.detail?.riskLevel || "Unknown";
    this.riskNotice =
      event.detail?.riskNotice || "Risk guidance is unavailable.";
  }

  handleWorkspaceNavigate(event) {
    this.navigate(
      event.detail?.destination || event.detail?.moduleName,
      event.detail?.context || null
    );
  }

  navigate(destination, context = null) {
    if (destination === DASHBOARD) {
      this.backToDashboard();
      return;
    }

    const moduleDefinition = findModuleByName(destination);
    if (!moduleDefinition || moduleDefinition.disabled) {
      return;
    }

    this.workspaceContext = context;
    this.currentView = destination;
  }

  backToDashboard() {
    this.workspaceContext = null;
    this.currentView = DASHBOARD;
  }

  getPrimaryActionDescription(moduleName) {
    const descriptions = {
      askBeforeYouBuild:
        "Frame the problem and testing plan before configuring.",
      orgExplorer: "Inspect objects, fields, relationships, and access.",
      troubleshootingAssistant:
        "Follow deterministic investigation steps for a Salesforce issue."
    };
    return descriptions[moduleName];
  }
}
