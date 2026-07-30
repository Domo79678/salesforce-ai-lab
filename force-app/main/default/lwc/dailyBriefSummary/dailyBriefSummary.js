import { api, LightningElement } from "lwc";
import { loadDailyBriefOperations } from "c/dailyBriefService";
import {
  createRecommendationContext,
  createWorkspaceNavigationEvent,
  enrichRecommendationWithWorkspace
} from "c/recommendationWorkspaceService";

export default class DailyBriefSummary extends LightningElement {
  @api operationsResult;
  analysisResult;
  metadataSnapshot;
  errorMessage = "";
  isLoading = false;

  connectedCallback() {
    if (this.operationsResult) {
      this.applyOperations(this.operationsResult);
      this.publishStatus();
    } else {
      this.loadSummary();
    }
  }

  get brief() {
    return this.analysisResult?.dailyBrief || {};
  }

  get highPriorityCount() {
    return (this.analysisResult?.recommendations || []).filter((item) =>
      ["critical", "high"].includes(String(item.priority).toLowerCase())
    ).length;
  }

  get highPriorityLabel() {
    return `${this.highPriorityCount} High Priority`;
  }

  get recommendedActionCount() {
    return Math.min((this.brief.priorities || []).length, 3);
  }

  get recommendedActionsLabel() {
    return `${this.recommendedActionCount} Recommended Actions`;
  }

  get recommendations() {
    return (this.analysisResult?.recommendations || []).map(
      (recommendation, index) => {
        const enriched = enrichRecommendationWithWorkspace(recommendation);
        return {
          ...enriched,
          displayId: enriched.id || `home-brief-${index + 1}`,
          title: enriched.title || "Review recommendation",
          actionText:
            enriched.action ||
            enriched.description ||
            "Review this deterministic recommendation."
        };
      }
    );
  }

  get topPriority() {
    return this.recommendations[0] || null;
  }

  get hasTopPriority() {
    return Boolean(this.topPriority);
  }

  get recommendedActions() {
    return this.recommendations.slice(1, 4);
  }

  get hasRecommendedActions() {
    return this.recommendedActions.length > 0;
  }

  get operationsSummaryLabel() {
    const readiness = this.analysisResult?.deploymentReadiness || {};
    if (readiness.approvalRecommendation) {
      return readiness.approvalRecommendation;
    }
    if (readiness.riskLevel) {
      return `Deployment risk: ${readiness.riskLevel}.`;
    }

    const metrics = this.analysisResult?.dashboardMetrics || {};
    const score = metrics.orgHealthScore;
    const status = metrics.orgHealthStatus || "Not evaluated";
    return Number.isFinite(Number(score))
      ? `Org health: ${status} · ${score}/100`
      : `Org health: ${status}`;
  }

  get hasError() {
    return Boolean(this.errorMessage);
  }

  async loadSummary() {
    this.isLoading = true;
    this.errorMessage = "";
    try {
      const { metadataSnapshot, analysisResult } =
        await loadDailyBriefOperations();
      this.applyOperations({ metadataSnapshot, analysisResult });
      this.publishStatus();
    } catch (error) {
      this.errorMessage =
        error?.body?.message ||
        error?.message ||
        "Today’s Brief is temporarily unavailable.";
      this.publishStatus();
    } finally {
      this.isLoading = false;
    }
  }

  applyOperations({ metadataSnapshot, analysisResult } = {}) {
    this.metadataSnapshot = metadataSnapshot;
    this.analysisResult = analysisResult;
  }

  handleOpenBrief() {
    const event = createWorkspaceNavigationEvent("dailyBrief");
    if (event) {
      this.dispatchEvent(event);
    }
  }

  handleRecommendation(event) {
    const recommendation = this.recommendations.find(
      (item) => item.displayId === event.currentTarget.dataset.id
    );
    const navigationEvent = createWorkspaceNavigationEvent(
      event.currentTarget.dataset.module,
      createRecommendationContext(recommendation, {
        sourceWorkspace: "dashboard",
        sourceType:
          recommendation?.displayId === this.topPriority?.displayId
            ? "priority"
            : "recommendation",
        metadataSnapshot: this.metadataSnapshot
      })
    );
    if (navigationEvent) {
      this.dispatchEvent(navigationEvent);
    }
  }

  publishStatus() {
    const metrics = this.analysisResult?.dashboardMetrics || {};
    const readiness = this.analysisResult?.deploymentReadiness || {};
    this.dispatchEvent(
      new CustomEvent("briefstatus", {
        detail: {
          metadataStatus:
            this.metadataSnapshot?.sourceLabel ||
            this.metadataSnapshot?.coverageStatus ||
            "Metadata unavailable",
          analysisStatus: this.analysisResult
            ? "Deterministic analysis ready"
            : "Analysis unavailable",
          healthScore: metrics.orgHealthScore,
          healthStatus: metrics.orgHealthStatus || "Not evaluated",
          highPriorityCount: this.highPriorityCount,
          recommendedActionCount: this.recommendedActionCount,
          analysisTimestamp:
            this.analysisResult?.generatedAt ||
            this.metadataSnapshot?.retrievedAt,
          riskLevel: readiness.riskLevel || "Unknown",
          riskNotice:
            readiness.approvalRecommendation ||
            "Risk guidance is unavailable for the current coverage."
        },
        bubbles: true,
        composed: true
      })
    );
  }
}
