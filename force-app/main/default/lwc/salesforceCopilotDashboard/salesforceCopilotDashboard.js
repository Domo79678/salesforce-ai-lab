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
const METADATA_DIAGNOSTIC = "metadataDiagnostic";

export default class SalesforceCopilotDashboard extends LightningElement {
  currentView = DASHBOARD;

  capabilities = COPILOT_MODULES.map((moduleDefinition) => ({
    ...moduleDefinition
  }));

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

  get showDashboard() {
    return this.currentView === DASHBOARD;
  }

  get showWorkspaceRouter() {
    return this.currentView !== DASHBOARD;
  }

  handleLaunch(event) {
    this.navigate(event.currentTarget.dataset.name);
  }

  handleQuickAction(event) {
    this.navigate(event.currentTarget.dataset.destination);
  }

  handleWorkspaceNavigate(event) {
    this.navigate(event.detail?.destination);
  }

  navigate(destination) {
    if (!destination) {
      return;
    }

    if (destination === METADATA_DIAGNOSTIC) {
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
