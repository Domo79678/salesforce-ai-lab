import { api, LightningElement } from "lwc";
import { findModuleByName } from "c/copilotModuleRegistry";

const DASHBOARD = "dashboard";
const COMPONENT_LOADERS = Object.freeze({
  dailyBrief: () => import("c/dailyBrief"),
  explainThis: () => import("c/explainThisWorkspace"),
  flowIntelligence: () => import("c/flowIntelligence"),
  orgExplorer: () => import("c/orgExplorer"),
  orgHealthDashboard: () => import("c/orgHealthDashboard"),
  askBeforeYouBuild: () => import("c/askBeforeYouBuild"),
  knowledgeCenter: () => import("c/orgKnowledgeViewer"),
  automationAdvisor: () => import("c/automationAdvisor"),
  troubleshootingAssistant: () => import("c/troubleshootingAssistant"),
  metadataDiagnostic: () => import("c/orgContextViewer"),
  allTools: () => import("c/allToolsWorkspace"),
  developerTools: () => import("c/developerToolsWorkspace")
});

export default class CopilotWorkspaceRouter extends LightningElement {
  _currentView = DASHBOARD;
  @api workspaceContext;
  componentConstructor;
  routeError = "";

  @api
  get currentView() {
    return this._currentView;
  }

  set currentView(value) {
    this._currentView = value || DASHBOARD;
    this.loadCurrentWorkspace();
  }

  connectedCallback() {
    this.loadCurrentWorkspace();
  }

  get hasRouteError() {
    return Boolean(this.routeError);
  }

  get workspaceProperties() {
    return this._currentView === "explainThis"
      ? { launchContext: this.workspaceContext }
      : {};
  }

  async loadCurrentWorkspace() {
    if (!this._currentView || this._currentView === DASHBOARD) {
      this.componentConstructor = null;
      return;
    }

    const moduleDefinition = findModuleByName(this._currentView);
    const componentLoader = COMPONENT_LOADERS[this._currentView];

    if (!moduleDefinition || moduleDefinition.disabled || !componentLoader) {
      this.componentConstructor = null;
      this.routeError = "This workspace is not available.";
      return;
    }

    try {
      this.routeError = "";
      const componentModule = await componentLoader();
      this.componentConstructor = componentModule.default;
    } catch (error) {
      this.componentConstructor = null;
      this.routeError =
        error?.message || "The selected workspace could not be loaded.";
    }
  }

  handleWorkspaceNavigate(event) {
    const destination = event.detail?.moduleName || event.detail?.destination;

    if (!destination) {
      return;
    }

    this.dispatchEvent(
      new CustomEvent("workspacenavigate", {
        detail: {
          destination,
          context: event.detail?.context || null
        },
        bubbles: true,
        composed: true
      })
    );
  }

  handleBackToDashboard() {
    const origin = this.workspaceContext?.sourceWorkspace;
    if (origin && origin !== DASHBOARD && findModuleByName(origin)) {
      this.dispatchEvent(
        new CustomEvent("workspacenavigate", {
          detail: { destination: origin, context: null },
          bubbles: true,
          composed: true
        })
      );
      return;
    }

    this.dispatchEvent(
      new CustomEvent("backtodashboard", {
        bubbles: true,
        composed: true
      })
    );
  }
}
