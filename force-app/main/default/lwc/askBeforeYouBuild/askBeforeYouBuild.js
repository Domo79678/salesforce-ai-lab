import { LightningElement } from "lwc";
import { findModuleByName } from "c/copilotModuleRegistry";
import {
  buildPreBuildGuidance,
  getSupportedChangeTypes
} from "c/preBuildGuidanceService";
import { createWorkspaceNavigationEvent } from "c/recommendationWorkspaceService";

const USER_OPTIONS = Object.freeze([
  { label: "Sales users", value: "Sales users" },
  { label: "Service users", value: "Service users" },
  { label: "Operations users", value: "Operations users" },
  { label: "Managers", value: "Managers" },
  { label: "System administrators", value: "System administrators" },
  { label: "Integration users", value: "Integration users" },
  { label: "External users", value: "External users" }
]);

export default class AskBeforeYouBuild extends LightningElement {
  changeType = "";
  businessProblem = "";
  affectedUsers = [];
  guidance = null;
  errorMessage = "";

  get changeTypeOptions() {
    return getSupportedChangeTypes().map((value) => ({
      label: value,
      value
    }));
  }

  get userOptions() {
    return USER_OPTIONS;
  }

  get hasGuidance() {
    return Boolean(this.guidance);
  }

  get hasError() {
    return Boolean(this.errorMessage);
  }

  get considerationRows() {
    return (this.guidance?.consultantConsiderations || []).map(
      (label, index) => ({ id: `consideration-${index + 1}`, label })
    );
  }

  get testRows() {
    return (this.guidance?.testingChecklist || []).map((label, index) => ({
      id: `test-${index + 1}`,
      label
    }));
  }

  get relatedWorkspaceRows() {
    return (this.guidance?.relatedWorkspaces || [])
      .map((moduleName) => {
        const moduleDefinition = findModuleByName(moduleName);
        return moduleDefinition
          ? {
              moduleName,
              label: moduleDefinition.title,
              iconName: moduleDefinition.iconName
            }
          : null;
      })
      .filter(Boolean);
  }

  handleChangeType(event) {
    this.changeType = event.detail.value;
    this.resetResult();
  }

  handleBusinessProblem(event) {
    this.businessProblem = event.target.value;
    this.resetResult();
  }

  handleAffectedUsers(event) {
    this.affectedUsers = [...event.detail.value];
    this.resetResult();
  }

  buildGuidance() {
    if (!this.changeType || !this.businessProblem.trim()) {
      this.guidance = null;
      this.errorMessage =
        "Select a change type and describe the business problem.";
      return;
    }

    if (!this.affectedUsers.length) {
      this.guidance = null;
      this.errorMessage = "Select at least one affected user group.";
      return;
    }

    this.errorMessage = "";
    this.guidance = buildPreBuildGuidance({
      changeType: this.changeType,
      businessProblem: this.businessProblem,
      affectedUsers: this.affectedUsers
    });
  }

  handleWorkspaceNavigate(event) {
    const navigationEvent = createWorkspaceNavigationEvent(
      event.currentTarget.dataset.module
    );

    if (navigationEvent) {
      this.dispatchEvent(navigationEvent);
    }
  }

  resetResult() {
    this.guidance = null;
    this.errorMessage = "";
  }
}
