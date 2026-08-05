/*
 * explainThisWorkspace.js
 *
 * Salesforce Copilot
 * Explain This Workspace
 *
 * Thin UI orchestration layer for:
 * - shared live metadata snapshot
 * - Explanation Engine
 * - Dependency Engine
 *
 * Current supported input:
 * - Object: Opportunity
 * - Field: Opportunity.Amount
 */

import { api, LightningElement } from "lwc";

import { getMetadataSnapshot } from "c/copilotCore";

import { explainEntity, analyzeDependencies } from "c/copilotIntelligence";
import { buildResolutionGuidance } from "c/resolutionGuidanceService";

export default class ExplainThisWorkspace extends LightningElement {
  _launchContext = null;
  _isConnected = false;
  _contextAutoRunStarted = false;
  searchValue = "";

  isLoading = false;
  errorMessage = "";

  explanation = null;
  dependencyAnalysis = null;
  resolutionGuidance = null;
  metadataSnapshot = null;

  @api
  get launchContext() {
    return this._launchContext;
  }

  set launchContext(value) {
    this._launchContext = value || null;
    if (this._isConnected) {
      this.applyLaunchContext();
    }
  }

  connectedCallback() {
    this._isConnected = true;
    this.applyLaunchContext();
  }

  get hasLaunchContext() {
    return Boolean(this._launchContext);
  }

  get selectedIssueTitle() {
    return this._launchContext?.title || "Selected issue";
  }

  get selectedIssueReason() {
    return this._launchContext?.reason || "No additional reason was provided.";
  }

  get selectedIssueSource() {
    const labels = {
      dashboard: "Mission Control",
      dailyBrief: "Daily Brief",
      orgHealthDashboard: "Org Health",
      knowledgeCenter: "Knowledge Center"
    };
    return (
      labels[this._launchContext?.sourceWorkspace] || "Administration Workspace"
    );
  }

  get hasExplanation() {
    return Boolean(this.explanation?.success);
  }

  get hasError() {
    return Boolean(this.errorMessage);
  }

  get explainButtonDisabled() {
    return this.isLoading || !this.searchValue.trim();
  }

  get entityLabel() {
    return (
      this.explanation?.entity?.label ||
      this.explanation?.entity?.apiName ||
      this.searchValue.trim()
    );
  }

  get entityTypeLabel() {
    const entityType = this.explanation?.entity?.type || "";

    const labels = {
      object: "Salesforce Object",

      field: "Salesforce Field",

      recordType: "Record Type",

      flow: "Salesforce Flow",

      validationRule: "Validation Rule",

      apexClass: "Apex Class",

      apexTrigger: "Apex Trigger",

      permissionSet: "Permission Set",

      duplicateRule: "Duplicate Rule",

      matchingRule: "Matching Rule"
    };

    return labels[entityType] || "Salesforce Metadata";
  }

  get executiveSummary() {
    return (
      this.explanation?.executiveSummary || "No executive summary is available."
    );
  }

  get businessPurpose() {
    return (
      this.explanation?.businessPurpose ||
      "A formal business purpose was not found in the connected metadata."
    );
  }

  get technicalExplanation() {
    return (
      this.explanation?.technicalExplanation ||
      "Technical metadata is not available for this component."
    );
  }

  get dependencySummary() {
    const dependencies = this.explanation?.dependencies || [];

    if (!dependencies.length) {
      return (
        "No dependencies were confirmed " +
        "within the metadata currently connected."
      );
    }

    return dependencies
      .map((dependency) => {
        const type = dependency.type || "Metadata";

        const label =
          dependency.label || dependency.apiName || "Unnamed component";

        const relationship = dependency.relationship
          ? ` — ${dependency.relationship}`
          : "";

        return `• ${type}: ${label}${relationship}`;
      })
      .join("\n");
  }

  get riskSummary() {
    const risks = this.explanation?.risks || [];

    if (!risks.length) {
      return (
        "No entity-specific risks were detected " +
        "within the currently connected metadata. " +
        "Partial metadata coverage may limit this conclusion."
      );
    }

    return risks
      .map((risk) => {
        const severity = risk.severity || "Unknown";

        const title = risk.title || "Metadata risk";

        const description = risk.description ? ` — ${risk.description}` : "";

        return `• ${severity}: ${title}${description}`;
      })
      .join("\n");
  }

  get recommendations() {
    const improvements = this.explanation?.improvements || [];

    if (!improvements.length) {
      return "No improvement recommendations were generated.";
    }

    return improvements
      .map((improvement) => {
        const priority = improvement.priority || "Review";

        const title = improvement.title || "Recommended improvement";

        const description = improvement.description
          ? ` — ${improvement.description}`
          : "";

        return `• ${priority}: ${title}${description}`;
      })
      .join("\n");
  }

  get testingGuidance() {
    const testCases = this.explanation?.testCases || [];

    if (!testCases.length) {
      return "No targeted test cases were generated.";
    }

    return testCases
      .map((testCase) => {
        const type = testCase.type || "Test";

        const title = testCase.title || "Validation scenario";

        const expectedResult = testCase.expectedResult
          ? ` Expected: ${testCase.expectedResult}`
          : "";

        return `• ${type}: ${title}.${expectedResult}`;
      })
      .join("\n");
  }

  get deploymentNotes() {
    const deployment = this.explanation?.deployment;

    if (!deployment) {
      return "Deployment guidance is not available.";
    }

    const lines = [
      `Readiness: ${deployment.readinessStatus || "Unknown"}`,

      `Risk: ${deployment.riskLevel || "Unknown"}`
    ];

    if (deployment.recommendation) {
      lines.push(`Recommendation: ${deployment.recommendation}`);
    }

    const prerequisites = deployment.prerequisites || [];

    if (prerequisites.length) {
      lines.push(
        "",
        "Prerequisites:",
        ...prerequisites.map((item) => `• ${item}`)
      );
    }

    const rollbackSteps = deployment.rollbackSteps || [];

    if (rollbackSteps.length) {
      lines.push(
        "",
        "Rollback considerations:",
        ...rollbackSteps.map((item) => `• ${item}`)
      );
    }

    return lines.join("\n");
  }

  get interviewGuidance() {
    return (
      this.explanation?.interviewExplanation ||
      "Interview guidance is not available."
    );
  }

  get confidence() {
    return (
      this.explanation?.confidence?.score ??
      this.dependencyAnalysis?.scores?.confidence ??
      0
    );
  }

  get confidenceLabel() {
    return `${this.confidence}%`;
  }

  get dependencyCount() {
    const explanationCount = this.explanation?.dependencies?.length;

    if (explanationCount !== undefined) {
      return explanationCount;
    }

    return this.dependencyAnalysis?.dependencyCount ?? 0;
  }

  get riskLevel() {
    return (
      this.dependencyAnalysis?.scores?.risk ||
      this.explanation?.deployment?.riskLevel ||
      "Unknown"
    );
  }

  get metadataSource() {
    return (
      this.explanation?.source ||
      this.metadataSnapshot?.sourceLabel ||
      this.metadataSnapshot?.source ||
      "Live Salesforce Metadata"
    );
  }

  get coverageLabel() {
    return (
      this.metadataSnapshot?.coverage?.label ||
      this.metadataSnapshot?.sourceLabel ||
      "Metadata coverage unavailable"
    );
  }

  get explanationWarnings() {
    return (this.explanation?.warnings || [])
      .map((warning) => warning.message)
      .filter(Boolean)
      .join("\n");
  }

  get hasExplanationWarnings() {
    return Boolean(this.explanationWarnings);
  }

  get hasResolutionGuidance() {
    return Boolean(this.resolutionGuidance);
  }

  get recommendedApproach() {
    return this.formatGuidanceItems(
      this.resolutionGuidance?.recommendedApproach
    );
  }

  get reviewFirst() {
    return this.formatGuidanceItems(this.resolutionGuidance?.reviewFirst);
  }

  get doNotDo() {
    return this.formatGuidanceItems(this.resolutionGuidance?.doNotDo);
  }

  get dependenciesToCheck() {
    return this.formatGuidanceItems(
      this.resolutionGuidance?.dependenciesToCheck
    );
  }

  get resolutionTestPlan() {
    return this.formatGuidanceItems(this.resolutionGuidance?.testPlan);
  }

  get resolutionDeploymentConsiderations() {
    return this.formatGuidanceItems(
      this.resolutionGuidance?.deploymentConsiderations
    );
  }

  handleSearchChange(event) {
    this.searchValue = event.target.value || "";

    this.errorMessage = "";
  }

  handleSearchKeyDown(event) {
    if (event.key === "Enter" && !this.explainButtonDisabled) {
      this.handleExplain();
    }
  }

  async handleExplain() {
    const normalizedSearchValue = this.searchValue.trim();

    if (!normalizedSearchValue || this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = "";
    this.explanation = null;
    this.dependencyAnalysis = null;
    this.resolutionGuidance = null;

    try {
      const request = this.buildRequest(normalizedSearchValue);

      if (!this.metadataSnapshot) {
        this.metadataSnapshot = await getMetadataSnapshot({
          forceRefresh: false
        });
      }

      if (!this.metadataSnapshot || !this.metadataSnapshot.success) {
        throw new Error(
          this.metadataSnapshot?.errors?.[0]?.message ||
            "The shared Salesforce metadata snapshot could not be loaded."
        );
      }

      const [dependencyResult, explanationResult] = await Promise.all([
        analyzeDependencies({
          entityType: request.entityType,

          apiName: request.entityApiName,

          label: request.entityLabel
        }),

        explainEntity(request, {
          metadataSnapshot: this.metadataSnapshot
        })
      ]);

      this.dependencyAnalysis = dependencyResult;

      this.explanation = explanationResult;

      if (!this.explanation?.success) {
        throw new Error(
          this.explanation?.errors?.[0]?.message ||
            this.explanation?.warnings?.[0]?.message ||
            this.explanation?.executiveSummary ||
            `Salesforce Copilot could not explain ${normalizedSearchValue}.`
        );
      }

      this.resolutionGuidance = buildResolutionGuidance({
        findingType: this._launchContext?.findingType,
        severity: this._launchContext?.severity,
        blocking: this._launchContext?.blocking,
        entityType: request.entityType,
        launchContext: this._launchContext,
        explanation: this.explanation,
        metadataCoverage: this.metadataSnapshot?.coverage || {
          coverageStatus: this.metadataSnapshot?.coverageStatus
        }
      });
    } catch (error) {
      this.explanation = null;
      this.dependencyAnalysis = null;
      this.resolutionGuidance = null;

      this.errorMessage = this.extractErrorMessage(error);
    } finally {
      this.isLoading = false;
    }
  }

  buildRequest(searchValue) {
    const normalizedValue = searchValue.trim();

    const isField =
      this._launchContext?.entityType === "field" ||
      normalizedValue.includes(".");

    const contextualApiName = isField
      ? this._launchContext?.qualifiedApiName ||
        [this._launchContext?.entityApiName, this._launchContext?.fieldApiName]
          .filter(Boolean)
          .join(".")
      : this._launchContext?.entityApiName;

    return {
      entityType: isField ? "field" : "object",

      entityApiName: contextualApiName || normalizedValue,

      entityLabel: normalizedValue,

      options: {
        includeDependencies: true,

        includeRisks: true,

        includeTests: true,

        includeDeployment: true,

        includeInterview: true,

        includeStarStory: false
      }
    };
  }

  resetWorkspace() {
    this._launchContext = null;
    this._contextAutoRunStarted = false;
    this.searchValue = "";
    this.errorMessage = "";
    this.explanation = null;
    this.dependencyAnalysis = null;
    this.resolutionGuidance = null;
    this.metadataSnapshot = null;
  }

  handleStartNewExplanation() {
    this.resetWorkspace();
  }

  applyLaunchContext() {
    this.resetExplanationResults();

    if (!this._launchContext) {
      this.searchValue = "";
      this.metadataSnapshot = null;
      this._contextAutoRunStarted = false;
      return;
    }

    this.metadataSnapshot = this._launchContext.metadataSnapshot || null;
    this.searchValue = this.getContextSearchValue(this._launchContext);

    if (!this._contextAutoRunStarted && this.isStructuredContextAvailable()) {
      this._contextAutoRunStarted = true;
      Promise.resolve().then(() => this.handleExplain());
    }
  }

  resetExplanationResults() {
    this.errorMessage = "";
    this.explanation = null;
    this.dependencyAnalysis = null;
    this.resolutionGuidance = null;
  }

  formatGuidanceItems(items = []) {
    return items.length
      ? items.map((item) => `• ${item}`).join("\n")
      : "No additional deterministic guidance was generated.";
  }

  getContextSearchValue(context = {}) {
    if (String(context.entityType).toLowerCase() === "field") {
      return (
        context.qualifiedApiName ||
        [context.entityApiName, context.fieldApiName].filter(Boolean).join(".")
      );
    }
    return context.entityApiName || "";
  }

  isStructuredContextAvailable() {
    const context = this._launchContext || {};
    const snapshot = this.metadataSnapshot;
    const entityType = String(context.entityType).toLowerCase();

    if (!snapshot?.success || !context.entityApiName) {
      return false;
    }

    const objects = snapshot.objects || [];
    const objectMetadata = objects.find(
      (item) =>
        String(item.apiName).toLowerCase() ===
        String(context.entityApiName).toLowerCase()
    );

    if (entityType === "object") {
      return Boolean(objectMetadata);
    }

    if (entityType !== "field" || !context.fieldApiName || !objectMetadata) {
      return false;
    }

    return (objectMetadata.fields || []).some(
      (field) =>
        String(field.apiName).toLowerCase() ===
        String(context.fieldApiName).toLowerCase()
    );
  }

  extractErrorMessage(error) {
    return (
      error?.body?.message ||
      error?.message ||
      "Salesforce Copilot could not complete the explanation."
    );
  }
}
