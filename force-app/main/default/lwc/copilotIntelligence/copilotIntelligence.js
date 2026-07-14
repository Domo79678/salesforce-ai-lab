/*
 * copilotIntelligence.js
 *
 * Public API for the Salesforce Copilot
 * Intelligence Layer.
 *
 * Feature workspaces import reusable engines from:
 *
 * import {
 *     explainEntity,
 *     analyzeDependencies
 * } from 'c/copilotIntelligence';
 */

/*
 * Intelligence models
 */
export {
    INTELLIGENCE_ENGINE_VERSION,
    INTELLIGENCE_MODES,
    ENTITY_TYPES,
    EXPLANATION_SECTIONS,
    DEPENDENCY_TYPES,
    CONFIDENCE_LEVELS,
    CHANGE_SAFETY_STATUSES,
    TEST_TYPES,
    DOCUMENT_TYPES,
    createIntelligenceRequest,
    createExplanationResult,
    createDependency,
    createRisk,
    createTestCase,
    createDeploymentGuidance,
    createConfidenceResult,
    createChangeImpactResult,
    createInterviewInsight,
    createStarStory,
    getConfidenceLevel,
    clampPercentage,
    createStableId
} from './intelligenceModels';

/*
 * Explanation Engine
 */
export {
    EXPLANATION_ENGINE_VERSION,
    explainEntity,
    explainEntityFromSnapshot,
    searchExplainableEntities,
    getSupportedEntityTypes
} from './explanationEngine';

/*
 * Dependency Engine
 */
export {
    analyzeDependencies,
    analyzeObject,
    analyzeField,
    analyzeFlow,
    analyzeValidationRule,
    analyzePermissionSet,
    analyzeApexClass,
    analyzeDuplicateRule,
    analyzeRecordType,
    explain as explainDependencies,
    impact as analyzeChangeImpact,
    deployment as analyzeDeploymentDependencies,
    recommend as analyzeRecommendations
} from './dependencyEngine';

/*
 * Dependency graph
 */
export {
    buildDependencyGraph,
    mergeGraphs,
    inboundGraph,
    outboundGraph,
    relatedGraph,
    findNode,
    containsNode,
    graphDepth,
    graphSize,
    graphHealth,
    buildTree
} from './dependencyGraph';

/*
 * Dependency scoring
 */
export {
    RISK_LEVELS as DEPENDENCY_RISK_LEVELS,
    calculateDependencyScore,
    determineRisk,
    safeDelete,
    deploymentRisk,
    confidence as calculateDependencyConfidence,
    businessImpact,
    scoreGraph
} from './dependencyScoring';

/*
 * Dependency utilities
 */
export {
    createNode,
    createEdge,
    clone,
    deduplicate,
    sortAlphabetically,
    sortBySeverity,
    groupByType,
    groupByCategory,
    countBySeverity,
    countByType,
    inbound,
    outbound,
    related,
    buildSummary,
    buildStatistics,
    isCritical,
    isInbound,
    isOutbound,
    isRelated
} from './dependencyUtilities';

/*
 * Dependency resolvers
 */
export {
    resolveDependencies,
    resolveOrg
} from './dependencyResolvers';