import { LightningElement } from "lwc";
import { DATA_SOURCE_LABELS, DATA_SOURCE_TYPES } from "c/copilotCore";
import { loadDailyBriefOperations } from "c/dailyBriefService";
import {
  createRecommendationContext,
  createWorkspaceNavigationEvent,
  enrichRecommendationWithWorkspace
} from "c/recommendationWorkspaceService";

const UNKNOWN_USER = "Salesforce Administrator";

export default class DailyBrief extends LightningElement {
  analysisResult = null;
  errorMessage = "";
  isLoading = false;
  metadataSnapshot = null;

  connectedCallback() {
    this.loadBrief();
  }

  get brief() {
    return this.analysisResult?.dailyBrief || {};
  }

  get hasAnalysis() {
    return Boolean(this.analysisResult?.success);
  }

  get hasError() {
    return Boolean(this.errorMessage);
  }

  get userName() {
    return this.metadataSnapshot?.organization?.userName || UNKNOWN_USER;
  }

  get orgHealthStatus() {
    return this.brief.orgHealth?.status || "Unknown";
  }

  get orgHealthMessage() {
    return this.brief.headline || "Org Health analysis is unavailable.";
  }

  get metadataCoverageLabel() {
    return (
      this.metadataSnapshot?.coverage?.label ||
      DATA_SOURCE_LABELS[DATA_SOURCE_TYPES.UNAVAILABLE]
    );
  }

  get metadataCoverageDetail() {
    const coverage = this.metadataSnapshot?.coverage;

    if (!coverage) {
      return "Metadata coverage is unavailable.";
    }

    const selectedObjectCount = coverage.selectedObjectCount ?? 0;
    const inventoryObjectCount = coverage.inventoryObjectCount ?? 0;

    return `${selectedObjectCount} business objects analyzed from ${inventoryObjectCount} accessible objects`;
  }

  get dataSourceLabel() {
    return (
      this.metadataSnapshot?.sourceLabel ||
      DATA_SOURCE_LABELS[DATA_SOURCE_TYPES.UNAVAILABLE]
    );
  }

  get greeting() {
    const currentHour = new Date().getHours();

    if (currentHour < 12) {
      return "Good Morning";
    }

    if (currentHour < 17) {
      return "Good Afternoon";
    }

    return "Good Evening";
  }

  get formattedDate() {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    }).format(new Date());
  }

  get lastUpdatedLabel() {
    const retrievedAt = this.metadataSnapshot?.retrievedAt;

    if (!retrievedAt) {
      return "";
    }

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }).format(new Date(retrievedAt));
  }

  get dailyPriorities() {
    return (this.brief.priorities || []).slice(0, 3).map((priority, index) => {
      const enriched = enrichRecommendationWithWorkspace(priority);
      return {
        ...enriched,
        id: `priority-${priority.rank || index + 1}`,
        title: priority.title || "Review recommendation",
        description:
          priority.action || "Review the associated Org Health finding.",
        indicatorClass: this.getPriorityIndicatorClass(priority.priority)
      };
    });
  }

  get hasPriorities() {
    return this.dailyPriorities.length > 0;
  }

  get topFindings() {
    return (this.brief.findings?.top || [])
      .slice(0, 3)
      .map((finding, index) => ({
        ...finding,
        id: finding.id || `finding-${index + 1}`,
        label: finding.title || finding.message || "Org Health finding",
        reason: finding.summary || finding.message || ""
      }));
  }

  get hasTopFindings() {
    return this.topFindings.length > 0;
  }

  get executiveSummary() {
    return this.brief.headline || "No findings require attention this morning.";
  }

  get documentationGaps() {
    return (this.analysisResult?.findings || [])
      .filter((finding) =>
        String(finding.category).toLowerCase().includes("documentation")
      )
      .slice(0, 3)
      .map((finding, index) => ({
        id: finding.id || `documentation-gap-${index + 1}`,
        label: finding.title || finding.summary || finding.message
      }));
  }

  get hasDocumentationGaps() {
    return this.documentationGaps.length > 0;
  }

  get deploymentReadinessStatus() {
    return (
      this.analysisResult?.deploymentReadiness?.status ||
      this.analysisResult?.dashboardMetrics?.deploymentReadinessStatus ||
      "Not evaluated"
    );
  }

  get deploymentReadinessNotice() {
    return (
      this.analysisResult?.deploymentReadiness?.approvalRecommendation ||
      "Deployment guidance is unavailable for the current metadata coverage."
    );
  }

  get endOfDayChecklist() {
    return (this.analysisResult?.deploymentReadiness?.requiredTests || [])
      .slice(0, 5)
      .map((label, index) => ({
        id: `end-of-day-${index + 1}`,
        label
      }));
  }

  get hasEndOfDayChecklist() {
    return this.endOfDayChecklist.length > 0;
  }

  get recommendedActionTitle() {
    return this.dailyPriorities[0]?.title || "Review Org Health";
  }

  get recommendedActionDescription() {
    return (
      this.dailyPriorities[0]?.description ||
      "Open Org Health to review the current analysis and metadata coverage."
    );
  }

  get recommendedModuleName() {
    return this.dailyPriorities[0]?.moduleName || "orgHealthDashboard";
  }

  async loadBrief() {
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = "";

    try {
      const { metadataSnapshot, analysisResult } =
        await loadDailyBriefOperations();

      this.metadataSnapshot = metadataSnapshot;
      this.analysisResult = analysisResult;
    } catch (error) {
      this.metadataSnapshot = null;
      this.analysisResult = null;
      this.errorMessage =
        error?.body?.message ||
        error?.message ||
        "An unexpected Daily Brief error occurred.";
    } finally {
      this.isLoading = false;
    }
  }

  handleRetry() {
    this.loadBrief();
  }

  handleRecommendedAction() {
    this.dispatchNavigationEvent(
      this.recommendedModuleName,
      createRecommendationContext(this.dailyPriorities[0], {
        sourceWorkspace: "dailyBrief",
        sourceType: "priority",
        metadataSnapshot: this.metadataSnapshot
      })
    );
  }

  handleFindingExplain(event) {
    const finding = this.topFindings.find(
      (item) => item.id === event.currentTarget.dataset.id
    );
    this.dispatchNavigationEvent(
      "explainThis",
      createRecommendationContext(finding, {
        sourceWorkspace: "dailyBrief",
        sourceType: "finding",
        metadataSnapshot: this.metadataSnapshot
      })
    );
  }

  handleQuickAction(event) {
    const moduleName = event.currentTarget.dataset.module;

    this.dispatchNavigationEvent(moduleName);
  }

  handleWorkspaceNavigate(event) {
    this.dispatchNavigationEvent(
      event.detail?.moduleName || event.detail?.destination,
      event.detail?.context
    );
  }

  dispatchNavigationEvent(moduleName, context = null) {
    if (!moduleName) {
      return;
    }

    const navigationEvent = createWorkspaceNavigationEvent(
      moduleName,
      context
        ? {
            ...context,
            sourceWorkspace: "dailyBrief",
            metadataSnapshot: this.metadataSnapshot
          }
        : null
    );

    if (navigationEvent) {
      this.dispatchEvent(navigationEvent);
    }
  }

  getPriorityIndicatorClass(priority = "") {
    switch (String(priority).toLowerCase()) {
      case "critical":
      case "high":
        return "priority-indicator priority-high";
      case "medium":
        return "priority-indicator priority-medium";
      default:
        return "priority-indicator priority-standard";
    }
  }
}
