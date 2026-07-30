import { LightningElement } from "lwc";
import { getLiveModules, getPlannedModules } from "c/copilotModuleRegistry";
import { createWorkspaceNavigationEvent } from "c/recommendationWorkspaceService";

export default class AllToolsWorkspace extends LightningElement {
  get availableTools() {
    return getLiveModules();
  }

  get plannedTools() {
    return getPlannedModules();
  }

  handleOpen(event) {
    const navigationEvent = createWorkspaceNavigationEvent(
      event.currentTarget.dataset.module
    );
    if (navigationEvent) {
      this.dispatchEvent(navigationEvent);
    }
  }
}
