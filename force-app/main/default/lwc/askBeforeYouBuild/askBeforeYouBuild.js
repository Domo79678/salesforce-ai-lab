import { LightningElement } from "lwc";
import { findModuleByName } from "c/copilotModuleRegistry";
import {
  buildPreBuildGuidance,
  getSupportedChangeTypes
} from "c/preBuildGuidanceService";
import { createWorkspaceNavigationEvent } from "c/recommendationWorkspaceService";
import { buildConsultantDiscovery } from "c/consultantDiscoveryService";

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
  desiredOutcome = "";
  stakeholders = "";
  currentProcess = "";
  painPoints = "";
  businessRules = "";
  constraints = "";
  successMetrics = "";
  risks = "";
  openQuestions = "";
  discovery = null;
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

  get hasDiscovery() {
    return Boolean(this.discovery);
  }

  get businessOutcome() {
    return this.discovery?.desiredOutcome || "Not yet defined.";
  }

  get readinessStatus() {
    return this.discovery?.readinessAssessment?.status || "Discovery Needed";
  }

  get readinessScore() {
    return this.discovery?.readinessAssessment?.score || 0;
  }

  get readinessExplanation() {
    return (this.discovery?.readinessAssessment?.reasons || []).join(" ");
  }

  get whatWeKnowRows() {
    if (!this.discovery) {
      return [];
    }

    return this.toRows(
      [
        ["Business problem", this.discovery.businessProblem],
        ["Affected users", this.discovery.affectedUsers.join(", ")],
        ["Stakeholders", this.discovery.stakeholders.join(", ")],
        ["Current process", this.discovery.currentProcess],
        ["Pain points", this.discovery.painPoints.join(", ")],
        ["Business rules", this.discovery.businessRules.join(", ")],
        ["Constraints", this.discovery.constraints.join(", ")]
      ]
        .filter(([, value]) => Boolean(value))
        .map(([label, value]) => `${label}: ${value}`),
      "known"
    );
  }

  get missingDiscoveryRows() {
    const assessment = this.discovery?.readinessAssessment;
    return this.toRows(
      [
        ...(assessment?.missingCritical || []).map(
          (label) => `Required: ${label}`
        ),
        ...(assessment?.missingSupporting || []).map(
          (label) => `Helpful: ${label}`
        )
      ],
      "missing"
    );
  }

  get discoveryQuestionRows() {
    return this.toRows(this.discovery?.discoveryQuestions, "question");
  }

  get discoveryRiskRows() {
    return this.toRows(this.discovery?.risks, "risk");
  }

  get successMeasureRows() {
    const measures = this.discovery?.successMetrics || [];
    return this.toRows(
      measures.length
        ? measures
        : ["Define a measurable outcome before selecting a solution."],
      "measure"
    );
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

  handleDiscoveryField(event) {
    const fieldName = event.target.dataset.field;

    if (fieldName) {
      this[fieldName] = event.target.value || "";
      this.resetResult();
    }
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
    this.discovery = buildConsultantDiscovery({
      businessProblem: this.businessProblem,
      desiredOutcome: this.desiredOutcome,
      affectedUsers: this.affectedUsers,
      stakeholders: this.stakeholders,
      currentProcess: this.currentProcess,
      painPoints: this.painPoints,
      businessRules: this.businessRules,
      constraints: this.constraints,
      successMetrics: this.successMetrics,
      risks: this.risks,
      openQuestions: this.openQuestions
    });

    this.guidance = this.discovery.readinessAssessment.readyToDesign
      ? buildPreBuildGuidance({
          changeType: this.changeType,
          businessProblem: this.businessProblem,
          affectedUsers: this.affectedUsers
        })
      : null;
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
    this.discovery = null;
    this.guidance = null;
    this.errorMessage = "";
  }

  toRows(values = [], prefix) {
    return (values || []).map((label, index) => ({
      id: `${prefix}-${index + 1}`,
      label
    }));
  }
}
