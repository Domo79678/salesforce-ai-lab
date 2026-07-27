import { api, LightningElement } from "lwc";

const DASHBOARD = "dashboard";

export default class CopilotWorkspaceRouter extends LightningElement {
  @api currentView = DASHBOARD;

  get showDailyBrief() {
    return this.currentView === "dailyBrief";
  }

  get showExplainThis() {
    return this.currentView === "explainThis";
  }

  get showFlowIntelligence() {
    return this.currentView === "flowIntelligence";
  }

  get showOrgExplorer() {
    return this.currentView === "orgExplorer";
  }

  get showOrgHealthDashboard() {
    return this.currentView === "orgHealthDashboard";
  }

  get showAutomationAdvisor() {
    return this.currentView === "automationAdvisor";
  }

  get showTroubleshootingAssistant() {
    return this.currentView === "troubleshootingAssistant";
  }

  get showMetadataDiagnostic() {
    return this.currentView === "metadataDiagnostic";
  }

  handleWorkspaceNavigate(event) {
    const destination = event.detail?.moduleName;

    if (!destination) {
      return;
    }

    this.dispatchEvent(
      new CustomEvent("workspacenavigate", {
        detail: {
          destination
        },
        bubbles: true,
        composed: true
      })
    );
  }

  handleBackToDashboard() {
    this.dispatchEvent(
      new CustomEvent("backtodashboard", {
        bubbles: true,
        composed: true
      })
    );
  }
}
