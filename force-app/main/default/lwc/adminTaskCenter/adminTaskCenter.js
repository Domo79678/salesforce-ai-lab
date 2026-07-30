import { api, LightningElement } from "lwc";
import { DEFAULT_SNAPSHOT_OPTIONS, getMetadataSnapshot } from "c/copilotCore";
import orgKnowledgeService from "c/orgKnowledgeService";
import {
  createRecommendationContext,
  createWorkspaceNavigationEvent,
  enrichRecommendationWithWorkspace
} from "c/recommendationWorkspaceService";

export default class AdminTaskCenter extends LightningElement {
  @api sourceWorkspace = "dailyBrief";
  _analysisResult;
  errorMessage = "";
  isLoading = false;

  @api
  get analysisResult() {
    return this._analysisResult;
  }

  set analysisResult(value) {
    this._analysisResult = value;
  }

  connectedCallback() {
    if (this.analysisResult) {
      this.publishStatus("Shared metadata", "Deterministic analysis ready");
    } else {
      this.loadAnalysis();
    }
  }

  get recommendations() {
    return (this.analysisResult?.recommendations || []).map(
      (recommendation, index) => {
        const enriched = enrichRecommendationWithWorkspace(recommendation);
        return {
          ...enriched,
          displayId: enriched.id || `admin-task-${index + 1}`,
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

  get hasError() {
    return Boolean(this.errorMessage);
  }

  get orgHealthLabel() {
    const metrics = this.analysisResult?.dashboardMetrics;
    const score = metrics?.orgHealthScore;
    const status = metrics?.orgHealthStatus || "Not evaluated";
    return Number.isFinite(Number(score)) ? `${status} · ${score}/100` : status;
  }

  get riskNotice() {
    const readiness = this.analysisResult?.deploymentReadiness;
    return (
      readiness?.approvalRecommendation ||
      (readiness?.riskLevel
        ? `Current deployment risk: ${readiness.riskLevel}.`
        : "Deployment and risk guidance is unavailable for the current coverage.")
    );
  }

  async loadAnalysis() {
    this.isLoading = true;
    this.errorMessage = "";

    try {
      const snapshot = await getMetadataSnapshot({
        ...DEFAULT_SNAPSHOT_OPTIONS,
        objectApiNames: [...DEFAULT_SNAPSHOT_OPTIONS.objectApiNames]
      });

      if (!snapshot?.success) {
        throw new Error(
          snapshot?.errors?.[0]?.message ||
            "Shared Salesforce metadata is unavailable."
        );
      }

      const result = orgKnowledgeService.analyzeOrg(snapshot, {
        analysisMode: "full"
      });

      if (!result?.success) {
        throw new Error(
          result?.errors?.[0]?.message ||
            "Deterministic task analysis could not be completed."
        );
      }

      this._analysisResult = result;
      this.publishStatus(
        snapshot.sourceLabel || snapshot.coverageStatus || "Metadata available",
        "Deterministic analysis ready"
      );
    } catch (error) {
      this._analysisResult = null;
      this.errorMessage =
        error?.body?.message ||
        error?.message ||
        "Admin tasks are temporarily unavailable.";
      this.publishStatus("Metadata unavailable", "Analysis unavailable");
    } finally {
      this.isLoading = false;
    }
  }

  handleNavigate(event) {
    const recommendation = this.recommendations.find(
      (item) => item.displayId === event.currentTarget.dataset.id
    );
    const navigationEvent = createWorkspaceNavigationEvent(
      event.currentTarget.dataset.module,
      createRecommendationContext(recommendation, {
        sourceWorkspace: this.sourceWorkspace,
        sourceType:
          recommendation?.displayId === this.topPriority?.displayId
            ? "priority"
            : "recommendation"
      })
    );
    if (navigationEvent) {
      this.dispatchEvent(navigationEvent);
    }
  }

  publishStatus(metadataStatus, analysisStatus) {
    const metrics = this.analysisResult?.dashboardMetrics || {};
    const readiness = this.analysisResult?.deploymentReadiness || {};
    this.dispatchEvent(
      new CustomEvent("adminbriefstatus", {
        detail: {
          metadataStatus,
          analysisStatus,
          healthScore: metrics.orgHealthScore,
          healthStatus: metrics.orgHealthStatus || "Not evaluated",
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
