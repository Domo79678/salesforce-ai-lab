import { LightningElement } from "lwc";
import {
  COPILOT_MODULES,
  findModuleByName,
  getAverageModuleProgress,
  getLiveModuleCount,
  getLiveModules,
  getPlannedModuleCount
} from "c/copilotModuleRegistry";

const DASHBOARD = "dashboard";

export default class SalesforceCopilotDashboard extends LightningElement {
  currentView = DASHBOARD;

  capabilities = COPILOT_MODULES.map((moduleDefinition) => ({
    ...moduleDefinition
  }));

  /*
    -----------------------------------------
    Dashboard Metrics
    -----------------------------------------
    */

  get liveCapabilities() {
    return getLiveModules();
  }

  get liveModuleCount() {
    return getLiveModuleCount();
  }

  get liveModulesLabel() {
    return `${this.liveModuleCount} Live Modules`;
  }

  get plannedModuleCount() {
    return getPlannedModuleCount();
  }

  get averageProgress() {
    return getAverageModuleProgress();
  }

  get averageProgressLabel() {
    return `${this.averageProgress}%`;
  }

  /*
    -----------------------------------------
    Views
    -----------------------------------------
    */

  get showDashboard() {
    return this.currentView === DASHBOARD;
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

  /*
    -----------------------------------------
    Navigation
    -----------------------------------------
    */

  handleLaunch(event) {
    const destination = event.currentTarget.dataset.name;

    this.navigate(destination);
  }

  handleQuickAction(event) {
    const destination = event.currentTarget.dataset.destination;

    this.navigate(destination);
  }

  navigate(destination) {
    if (!destination) {
      return;
    }

    if (destination === "metadataDiagnostic") {
      this.currentView = destination;
      return;
    }

    const capability = findModuleByName(destination);

    if (!capability || capability.disabled) {
      return;
    }

    this.currentView = destination;
  }

  backToDashboard() {
    this.currentView = DASHBOARD;
  }
}
