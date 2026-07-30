import { LightningElement } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";

import orgKnowledgeService from "c/orgKnowledgeService";

import {
  getMetadataSnapshot,
  refreshMetadataSnapshot,
  DATA_SOURCE_LABELS,
  DATA_SOURCE_TYPES,
  DEFAULT_BUSINESS_OBJECTS
} from "c/copilotCore";
import {
  createRecommendationContext,
  createWorkspaceNavigationEvent,
  enrichRecommendationWithWorkspace
} from "c/recommendationWorkspaceService";

export default class OrgHealthDashboard extends LightningElement {
  analysisResult = null;
  metadataSnapshot = null;
  errorMessage = "";
  isLoading = false;
  lastRefreshedAt = "";

  dataSourceLabel = DATA_SOURCE_LABELS[DATA_SOURCE_TYPES.UNAVAILABLE];

  dataSourceType = DATA_SOURCE_TYPES.UNAVAILABLE;

  coverageStatus = "unavailable";
  coverage = null;
  snapshotWarnings = [];
  servedFromCache = false;

  connectedCallback() {
    this.runOrgHealthAnalysis({
      forceRefresh: false,
      showToast: false
    });
  }

  get hasAnalysis() {
    return Boolean(this.analysisResult && this.analysisResult.success);
  }

  get hasError() {
    return Boolean(this.errorMessage);
  }

  get isLiveData() {
    return [
      DATA_SOURCE_TYPES.LIVE,
      DATA_SOURCE_TYPES.LIVE_PARTIAL,
      DATA_SOURCE_TYPES.CACHE
    ].includes(this.dataSourceType);
  }

  get isPartialCoverage() {
    return this.coverageStatus === "partial";
  }

  get isCachedData() {
    return (
      this.dataSourceType === DATA_SOURCE_TYPES.CACHE || this.servedFromCache
    );
  }

  get hasSnapshotWarnings() {
    return this.snapshotWarnings.length > 0;
  }

  get snapshotWarningRows() {
    return this.snapshotWarnings.map((warning, index) => ({
      id: `snapshot-warning-${index + 1}`,

      message:
        warning.message || "A live metadata category could not be retrieved."
    }));
  }

  get coverageSummaryLabel() {
    if (!this.coverage) {
      return "";
    }

    const selectedObjectCount = this.coverage.selectedObjectCount ?? 0;

    const inventoryObjectCount = this.coverage.inventoryObjectCount ?? 0;

    return `${selectedObjectCount} business objects analyzed from an inventory of ${inventoryObjectCount} accessible objects.`;
  }

  get healthScore() {
    return this.analysisResult?.dashboardMetrics?.orgHealthScore ?? 0;
  }

  get healthScoreLabel() {
    return `${this.healthScore}/100`;
  }

  get healthStatus() {
    return this.analysisResult?.dashboardMetrics?.orgHealthStatus || "Unknown";
  }

  get healthStatusClass() {
    return this.getStatusClass(this.healthStatus);
  }

  get deploymentScore() {
    return this.analysisResult?.dashboardMetrics?.deploymentReadinessScore ?? 0;
  }

  get deploymentScoreLabel() {
    return `${this.deploymentScore}/100`;
  }

  get deploymentStatus() {
    return (
      this.analysisResult?.dashboardMetrics?.deploymentReadinessStatus ||
      "Unknown"
    );
  }

  get deploymentStatusClass() {
    return this.getStatusClass(this.deploymentStatus);
  }

  get deploymentRiskLevel() {
    return this.analysisResult?.deploymentReadiness?.riskLevel || "Unknown";
  }

  get approvalRecommendation() {
    return (
      this.analysisResult?.deploymentReadiness?.approvalRecommendation ||
      "Deployment readiness has not been evaluated."
    );
  }

  get rollbackRequiredLabel() {
    return this.analysisResult?.deploymentReadiness?.rollbackRequired
      ? "Required"
      : "Not required";
  }

  get summaryCards() {
    const metrics = this.analysisResult?.dashboardMetrics || {};

    return [
      {
        id: "critical",
        label: "Critical",
        value: metrics.criticalFindings ?? 0,
        iconName: "utility:error",
        cardClass: "metric-card metric-card-critical"
      },
      {
        id: "high",
        label: "High Risk",
        value: metrics.highFindings ?? 0,
        iconName: "utility:warning",
        cardClass: "metric-card metric-card-high"
      },
      {
        id: "blocking",
        label: "Blockers",
        value: metrics.blockingFindings ?? 0,
        iconName: "utility:block_visitor",
        cardClass: "metric-card metric-card-blocking"
      },
      {
        id: "recommendations",
        label: "Actions",
        value: metrics.totalRecommendations ?? 0,
        iconName: "utility:light_bulb",
        cardClass: "metric-card metric-card-recommendation"
      }
    ];
  }

  get categoryRows() {
    const categories = this.analysisResult?.health?.categories || [];

    return categories.map((category) => ({
      ...category,

      id: this.createStableId(category.category),

      scoreLabel: `${category.score}/100`,

      scoreStyle: `width: ${category.score}%;`,

      progressClass: this.getProgressClass(category.score),

      statusClass: this.getStatusClass(category.status),

      findingLabel:
        category.findingCount === 1
          ? "1 finding"
          : `${category.findingCount} findings`
    }));
  }

  get hasCategories() {
    return this.categoryRows.length > 0;
  }

  get topFindings() {
    const findings = this.analysisResult?.dashboardMetrics?.topFindings || [];

    return findings.slice(0, 4).map((finding) => ({
      ...finding,

      displayId: this.createStableId(finding.id || finding.title),

      severityClass: this.getSeverityClass(finding.severity),

      scoreImpactLabel: finding.scoreImpact
        ? `-${finding.scoreImpact} points`
        : "No deduction",

      entityLabel: finding.entityApiName || "Organization"
    }));
  }

  get hasTopFindings() {
    return this.topFindings.length > 0;
  }

  get topRecommendations() {
    const recommendations =
      this.analysisResult?.dashboardMetrics?.topRecommendations || [];

    return recommendations.slice(0, 4).map((recommendation, index) => ({
      ...enrichRecommendationWithWorkspace(recommendation),

      displayId: this.createStableId(recommendation.id || recommendation.title),

      rank: index + 1,

      priorityClass: this.getPriorityClass(recommendation.priority),

      actionText: recommendation.action || recommendation.description
    }));
  }

  get hasRecommendations() {
    return this.topRecommendations.length > 0;
  }

  get requiredTests() {
    const tests = this.analysisResult?.deploymentReadiness?.requiredTests || [];

    return tests.slice(0, 6).map((test, index) => ({
      id: `required-test-${index + 1}`,

      label: test
    }));
  }

  get metadataCountCards() {
    const counts = this.analysisResult?.metadataCounts || {};

    return [
      {
        id: "objects",
        label: "Objects Analyzed",
        value: counts.objects ?? 0
      },
      {
        id: "fields",
        label: "Fields Analyzed",
        value: counts.fields ?? 0
      },
      {
        id: "flows",
        label: "Flows",
        value: counts.flows ?? 0
      },
      {
        id: "validation-rules",
        label: "Validation Rules",
        value: counts.validationRules ?? 0
      },
      {
        id: "permission-sets",
        label: "Permission Sets",
        value: counts.permissionSets ?? 0
      },
      {
        id: "apex",
        label: "Apex Classes",
        value: counts.apexClasses ?? 0
      }
    ];
  }

  get lowestCategory() {
    return this.analysisResult?.dashboardMetrics?.lowestCategory || "None";
  }

  get lowestCategoryScore() {
    return this.analysisResult?.dashboardMetrics?.lowestCategoryScore ?? 100;
  }

  get highestRiskCategory() {
    return this.analysisResult?.dashboardMetrics?.highestRiskCategory || "None";
  }

  get highestRiskLevel() {
    return this.analysisResult?.dashboardMetrics?.highestRiskLevel || "None";
  }

  get dailyBriefHeadline() {
    return (
      this.analysisResult?.dailyBrief?.headline ||
      "No Daily Admin Brief is available."
    );
  }

  get dailyPriorities() {
    return (this.analysisResult?.dailyBrief?.priorities || [])
      .slice(0, 3)
      .map((priority) => ({
        ...priority,

        displayId: `daily-priority-${priority.rank}`
      }));
  }

  get refreshButtonLabel() {
    return this.isLoading ? "Refreshing" : "Refresh Analysis";
  }

  handleRefresh() {
    this.runOrgHealthAnalysis({
      forceRefresh: true,
      showToast: true
    });
  }

  handleRecommendationNavigate(event) {
    const recommendation = this.topRecommendations.find(
      (item) => item.displayId === event.currentTarget.dataset.id
    );
    const navigationEvent = createWorkspaceNavigationEvent(
      event.currentTarget.dataset.module,
      createRecommendationContext(recommendation, {
        sourceWorkspace: "orgHealthDashboard",
        sourceType: "recommendation",
        metadataSnapshot: this.metadataSnapshot
      })
    );

    if (navigationEvent) {
      this.dispatchEvent(navigationEvent);
    }
  }

  handleFindingExplain(event) {
    const finding = this.topFindings.find(
      (item) => item.displayId === event.currentTarget.dataset.id
    );
    const navigationEvent = createWorkspaceNavigationEvent(
      "explainThis",
      createRecommendationContext(finding, {
        sourceWorkspace: "orgHealthDashboard",
        sourceType: "finding",
        metadataSnapshot: this.metadataSnapshot
      })
    );

    if (navigationEvent) {
      this.dispatchEvent(navigationEvent);
    }
  }

  async runOrgHealthAnalysis({ forceRefresh = false, showToast = false } = {}) {
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = "";
    this.snapshotWarnings = [];

    try {
      const snapshotOptions = {
        objectApiNames: [...DEFAULT_BUSINESS_OBJECTS],

        inventoryLimit: 200,

        includeInventory: true,

        includeSetupMetadata: true,

        forceRefresh
      };

      const metadataSnapshot = forceRefresh
        ? await refreshMetadataSnapshot(snapshotOptions)
        : await getMetadataSnapshot(snapshotOptions);

      if (!metadataSnapshot || !metadataSnapshot.success) {
        throw new Error(
          metadataSnapshot?.errors?.[0]?.message ||
            "Live Salesforce metadata could not be retrieved."
        );
      }

      const result = orgKnowledgeService.analyzeOrg(metadataSnapshot, {
        analysisMode: "health"
      });

      if (!result.success) {
        throw new Error(
          result.errors?.[0]?.message ||
            "The Knowledge Center service could not complete the live analysis."
        );
      }

      this.analysisResult = result;
      this.metadataSnapshot = metadataSnapshot;

      this.coverage = metadataSnapshot.coverage;

      this.coverageStatus =
        metadataSnapshot.coverageStatus ||
        metadataSnapshot?.coverage?.status ||
        "unavailable";

      this.dataSourceType =
        metadataSnapshot.sourceType || DATA_SOURCE_TYPES.UNAVAILABLE;

      this.dataSourceLabel =
        metadataSnapshot.sourceLabel ||
        DATA_SOURCE_LABELS[this.dataSourceType] ||
        DATA_SOURCE_LABELS[DATA_SOURCE_TYPES.UNAVAILABLE];

      this.snapshotWarnings = [...(metadataSnapshot.warnings || [])];

      this.servedFromCache = Boolean(metadataSnapshot.servedFromCache);

      const refreshDate =
        metadataSnapshot.retrievedAt || new Date().toISOString();

      this.lastRefreshedAt = new Intl.DateTimeFormat("en-US", {
        month: "short",

        day: "numeric",

        year: "numeric",

        hour: "numeric",

        minute: "2-digit",

        second: "2-digit"
      }).format(new Date(refreshDate));

      if (showToast) {
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Live analysis refreshed",

            message:
              "The shared Salesforce metadata snapshot and Org Health analysis were refreshed successfully.",

            variant: "success"
          })
        );
      }
    } catch (error) {
      this.analysisResult = null;

      this.coverage = null;

      this.coverageStatus = "unavailable";

      this.dataSourceType = DATA_SOURCE_TYPES.UNAVAILABLE;

      this.dataSourceLabel = DATA_SOURCE_LABELS[DATA_SOURCE_TYPES.UNAVAILABLE];

      this.servedFromCache = false;

      this.errorMessage =
        error?.body?.message ||
        error?.message ||
        "An unexpected live Org Health error occurred.";

      this.dispatchEvent(
        new ShowToastEvent({
          title: "Live analysis failed",

          message: this.errorMessage,

          variant: "error"
        })
      );
    } finally {
      this.isLoading = false;
    }
  }

  getStatusClass(status = "") {
    const normalized = String(status).trim().toLowerCase();

    if (
      normalized === "healthy" ||
      normalized === "excellent" ||
      normalized === "ready"
    ) {
      return "status-badge status-success";
    }

    if (normalized.includes("warning") || normalized.includes("attention")) {
      return "status-badge status-warning";
    }

    if (
      normalized.includes("risk") ||
      normalized.includes("not ready") ||
      normalized.includes("critical")
    ) {
      return "status-badge status-danger";
    }

    return "status-badge status-neutral";
  }

  getSeverityClass(severity = "") {
    return `severity-badge severity-${String(severity).trim().toLowerCase()}`;
  }

  getPriorityClass(priority = "") {
    return `priority-badge priority-${String(priority).trim().toLowerCase()}`;
  }

  getProgressClass(score = 0) {
    if (score >= 90) {
      return "progress-fill progress-success";
    }

    if (score >= 75) {
      return "progress-fill progress-warning";
    }

    return "progress-fill progress-danger";
  }

  createStableId(value = "") {
    return String(value)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }
}
