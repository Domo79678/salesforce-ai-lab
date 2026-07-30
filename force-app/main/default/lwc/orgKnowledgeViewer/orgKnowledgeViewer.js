/*
 * orgKnowledgeViewer.js
 *
 * UI controller for the Salesforce Copilot
 * Org Knowledge Viewer.
 *
 * Delegates responsibilities to:
 * - analysisRunner.js
 * - trendService.js
 * - viewerSelectors.js
 * - viewerConstants.js
 *
 * Responsibilities retained here:
 * - Lightning component state
 * - button handlers
 * - loading and error states
 * - exposing display-ready values to the HTML template
 * - passing collector coverage into metadataCoveragePanel
 */

import { LightningElement, api } from "lwc";

import { DEFAULT_SCAN_MODE, normalizeScanMode } from "./viewerConstants";

import {
  runOrgKnowledgeAnalysis,
  getPrimaryErrorMessage
} from "./analysisRunner";

import {
  createTrendSnapshot,
  buildTrendComparison,
  loadTrendSnapshot,
  saveTrendSnapshot
} from "./trendService";

import {
  hasSuccessfulAnalysis,
  getHealth,
  getDeploymentReadiness,
  getDashboardMetrics,
  getMetadataCounts,
  getFindings,
  getRecommendations,
  getCategoryResults,
  normalizeCategoryResults,
  buildViewerMetrics,
  getTopFindings,
  getTopRecommendations,
  getGroupedFindings,
  getDeploymentBlockers,
  buildHealthScoreExplanation,
  buildDailyBriefView,
  buildSharedIntelligenceStatus
} from "./viewerSelectors";
import {
  createRecommendationContext,
  createWorkspaceNavigationEvent,
  enrichRecommendationWithWorkspace
} from "c/recommendationWorkspaceService";

export default class OrgKnowledgeViewer extends LightningElement {
  _scanMode = DEFAULT_SCAN_MODE;
  _normalizedScanMode = normalizeScanMode(DEFAULT_SCAN_MODE);

  @api
  get scanMode() {
    return this._scanMode;
  }

  set scanMode(value) {
    this._scanMode = value || DEFAULT_SCAN_MODE;
    this._normalizedScanMode = normalizeScanMode(this._scanMode);
  }

  isLoading = false;
  hasLoaded = false;

  errorMessage = "";
  successMessage = "";

  analysisResult = null;
  runnerResult = null;

  previousAnalysis = null;
  trendComparison = null;

  orgSummary = null;
  objectInventory = [];
  connectedObjectNames = [];

  detailedObjectCount = 0;

  analysisStartedAt = "";
  analysisCompletedAt = "";
  analysisDurationMilliseconds = 0;

  scanProgress = {
    processedObjectCount: 0,
    totalObjectCount: 0,
    successfulObjectCount: 0,
    failedObjectCount: 0,
    percentage: 0
  };

  connectedCallback() {
    this._normalizedScanMode = normalizeScanMode(this.scanMode);

    this.previousAnalysis = loadTrendSnapshot();

    this.runAnalysis();
  }

  /*
   * Core state
   */

  get hasAnalysis() {
    return hasSuccessfulAnalysis(this.analysisResult);
  }

  get hasError() {
    return Boolean(this.errorMessage);
  }

  get normalizedScanMode() {
    return this._normalizedScanMode;
  }

  get scanModeLabel() {
    return `${this.normalizedScanMode} scan`;
  }

  get sourceLabel() {
    return "Live Salesforce metadata";
  }

  /*
   * Shared analysis objects
   */

  get health() {
    return getHealth(this.analysisResult);
  }

  get deploymentReadiness() {
    return getDeploymentReadiness(this.analysisResult);
  }

  get dashboardMetrics() {
    return getDashboardMetrics(this.analysisResult);
  }

  get metadataCounts() {
    return getMetadataCounts(this.analysisResult);
  }

  get findings() {
    return getFindings(this.analysisResult);
  }

  get recommendations() {
    return getRecommendations(this.analysisResult);
  }

  get categoryResults() {
    return normalizeCategoryResults(getCategoryResults(this.analysisResult));
  }

  get dailyBrief() {
    if (!this.hasAnalysis) {
      return null;
    }

    return buildDailyBriefView(this.analysisResult);
  }

  get viewerMetrics() {
    return buildViewerMetrics(this.analysisResult, {
      inventoryCount: this.objectInventory.length,

      detailedObjectCount: this.detailedObjectCount
    });
  }

  /*
   * Findings and recommendations
   */

  get topFindings() {
    return getTopFindings(this.analysisResult, 10);
  }

  get topRecommendations() {
    return getTopRecommendations(this.analysisResult, 10).map(
      (recommendation) => enrichRecommendationWithWorkspace(recommendation)
    );
  }

  handleRecommendationNavigate(event) {
    const recommendation = this.topRecommendations.find(
      (item) => item.id === event.currentTarget.dataset.id
    );
    const navigationEvent = createWorkspaceNavigationEvent(
      event.currentTarget.dataset.module,
      createRecommendationContext(recommendation, {
        sourceWorkspace: "knowledgeCenter",
        sourceType: "recommendation",
        metadataSnapshot:
          this.runnerResult?.snapshot ||
          this.runnerResult?.salesforceSnapshot ||
          null
      })
    );

    if (navigationEvent) {
      this.dispatchEvent(navigationEvent);
    }
  }

  get groupedFindings() {
    return getGroupedFindings(this.analysisResult);
  }

  get deploymentBlockers() {
    return getDeploymentBlockers(this.analysisResult);
  }

  get hasFindings() {
    return this.findings.length > 0;
  }

  get hasRecommendations() {
    return this.recommendations.length > 0;
  }

  get hasGroupedFindings() {
    return this.groupedFindings.length > 0;
  }

  get hasCategories() {
    return this.categoryResults.length > 0;
  }

  get hasDeploymentBlockers() {
    return this.deploymentBlockers.length > 0;
  }

  get hasDailyPriorities() {
    return Boolean(
      this.dailyBrief &&
      Array.isArray(this.dailyBrief.priorities) &&
      this.dailyBrief.priorities.length
    );
  }

  /*
   * Explainable scoring
   */

  get healthScoreExplanation() {
    return buildHealthScoreExplanation(this.analysisResult);
  }

  get healthExplanationCategories() {
    return this.healthScoreExplanation?.categories || [];
  }

  get hasHealthExplanationCategories() {
    return this.healthExplanationCategories.length > 0;
  }

  /*
   * Score and KPI values
   */

  get orgHealthScore() {
    return this.viewerMetrics.orgHealthScore || 0;
  }

  get orgHealthDisplay() {
    return `${this.orgHealthScore}/100`;
  }

  get orgHealthStatus() {
    return this.viewerMetrics.orgHealthStatus || "Unknown";
  }

  get deploymentScore() {
    return this.viewerMetrics.deploymentScore || 0;
  }

  get deploymentScoreDisplay() {
    return `${this.deploymentScore}/100`;
  }

  get deploymentStatus() {
    return this.viewerMetrics.deploymentStatus || "Unknown";
  }

  get totalObjects() {
    return this.viewerMetrics.inventoryObjects || 0;
  }

  get totalFields() {
    return this.viewerMetrics.fields || 0;
  }

  get totalFindings() {
    return this.viewerMetrics.totalFindings || 0;
  }

  get criticalFindings() {
    return this.viewerMetrics.criticalFindings || 0;
  }

  get highFindings() {
    return this.viewerMetrics.highFindings || 0;
  }

  get blockingFindings() {
    return this.viewerMetrics.blockingFindings || 0;
  }

  get totalRecommendations() {
    return this.viewerMetrics.totalRecommendations || 0;
  }

  get lowestCategory() {
    return this.viewerMetrics.lowestCategory || "None";
  }

  get lowestCategoryScore() {
    return this.viewerMetrics.lowestCategoryScore ?? 100;
  }

  get highestRiskCategory() {
    return this.viewerMetrics.highestRiskCategory || "None";
  }

  get highestRiskLevel() {
    return this.viewerMetrics.highestRiskLevel || "None";
  }

  /*
   * Organization identity
   */

  get organizationName() {
    return (
      this.analysisResult?.organization?.name ||
      this.orgSummary?.name ||
      "Unknown Organization"
    );
  }

  /*
   * Object-level scan coverage
   *
   * This remains separate from metadataCoverage.
   *
   * objectCoverage explains how many object profiles
   * were scanned.
   *
   * metadataCoverage explains which Salesforce
   * metadata categories are connected.
   */

  get objectCoverage() {
    return (
      this.runnerResult?.coverage || {
        inventoryObjectCount: 0,
        selectedObjectCount: 0,
        detailedObjectCount: 0,
        successfulObjectCount: 0,
        failedObjectCount: 0,
        fieldCount: 0,
        relationshipCount: 0,
        recordTypeCount: 0,
        completionPercentage: 0
      }
    );
  }

  get coverageLabel() {
    const inventoryCount =
      this.objectCoverage.inventoryObjectCount || this.objectInventory.length;

    const detailedCount =
      this.objectCoverage.detailedObjectCount || this.detailedObjectCount;

    const failedCount = this.objectCoverage.failedObjectCount || 0;

    const failureText =
      failedCount > 0 ? `; ${failedCount} object metadata requests failed` : "";

    return `${detailedCount} detailed objects analyzed from ${inventoryCount} inventory objects${failureText}`;
  }

  /*
   * Metadata-category coverage
   *
   * The collector and snapshot adapter may expose
   * metadataCoverage at slightly different levels while
   * the architecture continues to evolve.
   *
   * This getter checks each supported location and returns
   * one normalized object for metadataCoveragePanel.
   */

  get metadataCoverage() {
    const rawCoverage = this.findMetadataCoverage();

    if (!rawCoverage) {
      return null;
    }

    const categories = this.normalizeMetadataCoverageCategories(rawCoverage);

    const totalCategories = this.getNumericValue(
      rawCoverage.totalCategories,
      categories.length
    );

    const completeCategories = this.getNumericValue(
      rawCoverage.completeCategories,
      categories.filter((category) => category.status === "Complete").length
    );

    const partialCategories = this.getNumericValue(
      rawCoverage.partialCategories,
      categories.filter((category) => category.status === "Partial").length
    );

    const missingCategories = this.getNumericValue(
      rawCoverage.missingCategories,
      categories.filter((category) =>
        ["Not Started", "Failed"].includes(category.status)
      ).length
    );

    const score = this.clampPercentage(
      rawCoverage.score ??
        rawCoverage.coverageScore ??
        rawCoverage.completionPercentage ??
        rawCoverage.percentage
    );

    return {
      ...rawCoverage,

      score,

      status: rawCoverage.status || this.getCoverageStatus(score),

      summary:
        rawCoverage.summary ||
        this.buildCoverageSummary({
          score,
          completeCategories,
          partialCategories,
          missingCategories,
          totalCategories
        }),

      totalCategories,

      completeCategories,

      partialCategories,

      missingCategories,

      categoryCoverage: categories,

      limitations: this.normalizeStringArray(
        rawCoverage.limitations || rawCoverage.collectionLimitations
      ),

      nextBestCollectionStep:
        rawCoverage.nextBestCollectionStep ||
        rawCoverage.nextCollectionStep ||
        rawCoverage.recommendedNextStep ||
        null,

      generatedAt:
        rawCoverage.generatedAt ||
        this.runnerResult?.timing?.completedAt ||
        this.analysisResult?.generatedAt ||
        ""
    };
  }

  get hasMetadataCoverage() {
    return Boolean(this.metadataCoverage);
  }

  findMetadataCoverage() {
    const candidates = [
      this.runnerResult?.metadataCoverage,

      this.runnerResult?.snapshot?.metadataCoverage,

      this.runnerResult?.salesforceSnapshot?.metadataCoverage,

      this.runnerResult?.collectorResult?.metadataCoverage,

      this.runnerResult?.collectionResult?.metadataCoverage,

      this.runnerResult?.coverage?.metadataCoverage,

      this.analysisResult?.metadataCoverage,

      this.analysisResult?.snapshot?.metadataCoverage
    ];

    return (
      candidates.find((candidate) =>
        this.isMetadataCoverageObject(candidate)
      ) || null
    );
  }

  isMetadataCoverageObject(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return false;
    }

    return Boolean(
      Array.isArray(value.categoryCoverage) ||
      Array.isArray(value.categories) ||
      value.totalCategories !== undefined ||
      value.coverageScore !== undefined ||
      value.nextBestCollectionStep ||
      value.collectionLimitations
    );
  }

  normalizeMetadataCoverageCategories(rawCoverage = {}) {
    const rawCategories = Array.isArray(rawCoverage.categoryCoverage)
      ? rawCoverage.categoryCoverage
      : Array.isArray(rawCoverage.categories)
        ? rawCoverage.categories
        : [];

    return rawCategories.map((category, index) => {
      const completionPercentage = this.clampPercentage(
        category?.completionPercentage ??
          category?.percentage ??
          category?.score
      );

      const status =
        category?.status ||
        this.getCategoryCoverageStatus(completionPercentage, category);

      return {
        ...category,

        id:
          category?.id ||
          category?.key ||
          category?.apiName ||
          `metadata-category-${index}`,

        label:
          category?.label ||
          category?.name ||
          category?.apiName ||
          `Metadata Category ${index + 1}`,

        description:
          category?.description ||
          category?.summary ||
          "No category description was supplied.",

        status,

        completionPercentage,

        weight: this.getNumericValue(category?.weight, 0),

        itemCount: this.getNumericValue(
          category?.itemCount ?? category?.count ?? category?.collectedCount,
          0
        ),

        expectedCount:
          category?.expectedCount ?? category?.plannedCount ?? null,

        phase: category?.phase || category?.collectionPhase || "",

        limitation: category?.limitation || category?.limitationMessage || "",

        enables: this.normalizeStringArray(
          category?.enables || category?.enabledCapabilities
        )
      };
    });
  }

  getCategoryCoverageStatus(percentage, category = {}) {
    if (category?.failed === true) {
      return "Failed";
    }

    if (percentage >= 100) {
      return "Complete";
    }

    if (percentage > 0) {
      return "Partial";
    }

    return "Not Started";
  }

  getCoverageStatus(score) {
    if (score >= 90) {
      return "Complete";
    }

    if (score >= 70) {
      return "Strong";
    }

    if (score >= 40) {
      return "Moderate";
    }

    return "Partial";
  }

  buildCoverageSummary({
    score = 0,
    completeCategories = 0,
    partialCategories = 0,
    missingCategories = 0,
    totalCategories = 0
  } = {}) {
    return `${score}% of the planned metadata coverage is currently available. ${completeCategories} of ${totalCategories} categories are complete, ${partialCategories} are partial, and ${missingCategories} are not yet connected.`;
  }

  normalizeStringArray(value) {
    if (Array.isArray(value)) {
      return value
        .map((item) => {
          if (typeof item === "string") {
            return item;
          }

          return item?.label || item?.name || item?.message || "";
        })
        .filter(Boolean);
    }

    if (typeof value === "string" && value.trim()) {
      return [value.trim()];
    }

    return [];
  }

  clampPercentage(value) {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
      return 0;
    }

    return Math.min(100, Math.max(0, Math.round(numericValue)));
  }

  getNumericValue(value, fallback = 0) {
    const numericValue = Number(value);

    return Number.isFinite(numericValue) ? numericValue : fallback;
  }

  get generatedAtLabel() {
    return (
      this.dailyBrief?.generatedAtLabel ||
      this.analysisResult?.generatedAt ||
      ""
    );
  }

  get analysisDurationLabel() {
    const duration = Number(this.analysisDurationMilliseconds);

    if (!Number.isFinite(duration)) {
      return "";
    }

    if (duration < 1000) {
      return `${duration} ms`;
    }

    return `${(duration / 1000).toFixed(2)} seconds`;
  }

  /*
   * Scan progress
   */

  get scanProgressLabel() {
    if (!this.scanProgress.totalObjectCount) {
      return "Preparing metadata scan";
    }

    return `${this.scanProgress.processedObjectCount} of ${this.scanProgress.totalObjectCount} objects processed`;
  }

  get scanProgressPercentage() {
    return this.scanProgress.percentage || 0;
  }

  /*
   * Trend tracking
   */

  get hasTrendData() {
    return Boolean(this.trendComparison?.hasPrevious);
  }

  get healthTrendLabel() {
    return this.trendComparison?.labels?.health || "First tracked analysis";
  }

  get deploymentTrendLabel() {
    return this.trendComparison?.labels?.deployment || "First tracked analysis";
  }

  get findingTrendLabel() {
    return this.trendComparison?.labels?.findings || "First tracked analysis";
  }

  get recommendationTrendLabel() {
    return (
      this.trendComparison?.labels?.recommendations || "First tracked analysis"
    );
  }

  get blockerTrendLabel() {
    return this.trendComparison?.labels?.blockers || "First tracked analysis";
  }

  get previousAnalysisLabel() {
    return (
      this.trendComparison?.previous?.generatedAt ||
      this.previousAnalysis?.generatedAt ||
      "No previous scan"
    );
  }

  /*
   * Shared intelligence readiness
   */

  get sharedIntelligenceStatus() {
    return buildSharedIntelligenceStatus(this.analysisResult);
  }

  /*
   * Unified analysis pipeline
   */

  async runAnalysis() {
    if (this.isLoading) {
      return;
    }

    const priorSuccessfulResult = this.analysisResult;

    const priorRunnerResult = this.runnerResult;

    const previousSnapshot = priorSuccessfulResult?.success
      ? createTrendSnapshot(priorSuccessfulResult)
      : this.previousAnalysis;

    this.clearMessages();

    this.isLoading = true;
    this.hasLoaded = false;

    /*
     * Hide the current result while the new analysis runs.
     * This makes both buttons visibly responsive.
     */
    this.analysisResult = null;
    this.runnerResult = null;

    this.scanProgress = {
      processedObjectCount: 0,
      totalObjectCount: 0,
      successfulObjectCount: 0,
      failedObjectCount: 0,
      percentage: 0
    };

    this.analysisStartedAt = new Date().toISOString();

    try {
      const result = await runOrgKnowledgeAnalysis({
        scanMode: this.normalizedScanMode,

        onProgress: (progress) => {
          this.scanProgress = {
            ...progress
          };
        }
      });

      if (!result.success) {
        throw new Error(getPrimaryErrorMessage(result));
      }

      this.runnerResult = result;

      this.analysisResult = result.analysisResult;

      this.orgSummary = result.organization;

      this.objectInventory = Array.isArray(result.objectInventory)
        ? result.objectInventory
        : [];

      this.connectedObjectNames = Array.isArray(result.connectedObjectNames)
        ? result.connectedObjectNames
        : [];

      this.detailedObjectCount = result.coverage?.detailedObjectCount || 0;

      this.analysisStartedAt =
        result.timing?.startedAt || this.analysisStartedAt;

      this.analysisCompletedAt =
        result.timing?.completedAt || new Date().toISOString();

      this.analysisDurationMilliseconds =
        result.timing?.durationMilliseconds || 0;

      this.previousAnalysis = previousSnapshot;

      this.trendComparison = buildTrendComparison(
        this.analysisResult,
        previousSnapshot
      );

      saveTrendSnapshot(this.analysisResult);

      this.hasLoaded = true;

      const warningCount = Array.isArray(result.warnings)
        ? result.warnings.length
        : 0;

      const warningText =
        warningCount > 0
          ? ` ${warningCount} object metadata warnings were recorded.`
          : "";

      this.successMessage = `Knowledge Center analysis completed for ${this.organizationName} using the ${this.scanModeLabel}.${warningText}`;
    } catch (error) {
      /*
       * Restore the last successful analysis and
       * collector result when a refresh fails.
       */
      this.analysisResult = priorSuccessfulResult;

      this.runnerResult = priorRunnerResult;

      this.hasLoaded = Boolean(priorSuccessfulResult);

      this.errorMessage = this.getErrorMessage(error);
    } finally {
      this.isLoading = false;
    }
  }

  /*
   * Button handlers
   */

  async handleRefresh() {
    await this.runAnalysis();
  }

  async handleRunAgain() {
    await this.runAnalysis();
  }

  handleClear() {
    this.analysisResult = null;
    this.runnerResult = null;

    this.orgSummary = null;
    this.objectInventory = [];
    this.connectedObjectNames = [];

    this.detailedObjectCount = 0;

    this.analysisStartedAt = "";
    this.analysisCompletedAt = "";
    this.analysisDurationMilliseconds = 0;

    this.scanProgress = {
      processedObjectCount: 0,
      totalObjectCount: 0,
      successfulObjectCount: 0,
      failedObjectCount: 0,
      percentage: 0
    };

    this.hasLoaded = false;

    this.clearMessages();
  }

  clearMessages() {
    this.errorMessage = "";
    this.successMessage = "";
  }

  getErrorMessage(error) {
    if (!error) {
      return "An unknown Knowledge Center error occurred.";
    }

    if (typeof error === "string") {
      return error;
    }

    if (typeof error.message === "string" && error.message) {
      return error.message;
    }

    if (error.body && typeof error.body.message === "string") {
      return error.body.message;
    }

    if (error.detail && typeof error.detail === "string") {
      return error.detail;
    }

    return "The Knowledge Center could not complete the analysis.";
  }
}
