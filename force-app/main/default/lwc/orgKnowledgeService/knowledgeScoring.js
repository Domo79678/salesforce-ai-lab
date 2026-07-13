/*
 * knowledgeScoring.js
 *
 * Scoring engine for the Salesforce Copilot
 * Org Knowledge Layer.
 *
 * This module converts knowledge findings into:
 * - category health scores
 * - an overall Org Health score
 * - deployment readiness
 * - risk summaries
 * - dashboard metrics
 * - prioritized score explanations
 *
 * Findings are created by knowledgeRules.js.
 * Standard result structures come from knowledgeModels.js.
 */

import {
    HEALTH_CATEGORIES,
    SEVERITY_LEVELS,
    RISK_LEVELS,
    READINESS_STATUSES,
    createHealthCategoryResult,
    createHealthSummary,
    createDeploymentReadinessResult
} from './knowledgeModels';

import {
    normalizeArray,
    safeString,
    safeBoolean,
    safeNumber,
    clampScore,
    calculateWeightedAverage,
    sortFindingsBySeverity,
    sortRecommendationsByPriority,
    summarizeFindings,
    summarizeRecommendations,
    groupFindingsByCategory,
    deduplicateBy
} from './knowledgeUtilities';

/*
 * Category weights used for the overall Org Health score.
 *
 * The weights total 100.
 *
 * Higher-weight categories have a greater effect on the final score.
 */
export const HEALTH_CATEGORY_WEIGHTS =
    Object.freeze({
        [HEALTH_CATEGORIES.AUTOMATION]: 20,
        [HEALTH_CATEGORIES.SECURITY]: 20,
        [HEALTH_CATEGORIES.DATA_MODEL]: 15,
        [HEALTH_CATEGORIES.METADATA]: 10,
        [HEALTH_CATEGORIES.DOCUMENTATION]: 10,
        [HEALTH_CATEGORIES.TESTING]: 10,
        [HEALTH_CATEGORIES.PERFORMANCE]: 5,
        [HEALTH_CATEGORIES.DEPLOYMENT]: 10
    });

/*
 * Default score deductions when a finding does not
 * already contain a scoreImpact value.
 */
export const DEFAULT_SEVERITY_DEDUCTIONS =
    Object.freeze({
        [SEVERITY_LEVELS.CRITICAL]: 15,
        [SEVERITY_LEVELS.HIGH]: 8,
        [SEVERITY_LEVELS.MEDIUM]: 4,
        [SEVERITY_LEVELS.LOW]: 1,
        [SEVERITY_LEVELS.INFORMATIONAL]: 0
    });

/*
 * Deployment-readiness category weights.
 *
 * Deployment readiness is calculated independently
 * from the overall Org Health score.
 */
export const DEPLOYMENT_CATEGORY_WEIGHTS =
    Object.freeze({
        [HEALTH_CATEGORIES.DEPLOYMENT]: 30,
        [HEALTH_CATEGORIES.TESTING]: 25,
        [HEALTH_CATEGORIES.AUTOMATION]: 15,
        [HEALTH_CATEGORIES.SECURITY]: 10,
        [HEALTH_CATEGORIES.PERFORMANCE]: 10,
        [HEALTH_CATEGORIES.DATA_MODEL]: 5,
        [HEALTH_CATEGORIES.METADATA]: 3,
        [HEALTH_CATEGORIES.DOCUMENTATION]: 2
    });

/*
 * Main scoring entry point.
 *
 * Expected input:
 *
 * {
 *     findings: [],
 *     recommendations: [],
 *     findingSummary: {},
 *     recommendationSummary: {}
 * }
 */
export function evaluateKnowledgeScoring(
    ruleEvaluation = {},
    options = {}
) {
    const findings =
        sortFindingsBySeverity(
            deduplicateBy(
                normalizeArray(
                    ruleEvaluation.findings
                ),
                'id'
            )
        );

    const recommendations =
        sortRecommendationsByPriority(
            deduplicateBy(
                normalizeArray(
                    ruleEvaluation.recommendations
                ),
                'id'
            )
        );

    const categoryWeights = {
        ...HEALTH_CATEGORY_WEIGHTS,
        ...(options.categoryWeights || {})
    };

    const deploymentWeights = {
        ...DEPLOYMENT_CATEGORY_WEIGHTS,
        ...(options.deploymentWeights || {})
    };

    const categoryResults =
        calculateCategoryScores(
            findings,
            recommendations,
            categoryWeights
        );

    const overallScore =
        calculateOverallHealthScore(
            categoryResults,
            categoryWeights
        );

    const healthSummary =
        createHealthSummary({
            overallScore,
            categories:
                categoryResults,
            findings,
            recommendations
        });

    const deploymentReadiness =
        calculateDeploymentReadiness({
            findings,
            recommendations,
            categoryResults,
            deploymentWeights,
            options
        });

    const dashboardMetrics =
        buildHealthDashboardMetrics({
            findings,
            recommendations,
            categoryResults,
            overallScore,
            deploymentReadiness
        });

    const scoreExplanation =
        buildScoreExplanation({
            findings,
            categoryResults,
            overallScore,
            deploymentReadiness
        });

    return {
        health:
            healthSummary,

        deploymentReadiness,

        categoryResults,

        overallScore,

        overallStatus:
            healthSummary.status,

        dashboardMetrics,

        scoreExplanation,

        findings,

        recommendations,

        findingSummary:
            ruleEvaluation.findingSummary ||
            summarizeFindings(findings),

        recommendationSummary:
            ruleEvaluation
                .recommendationSummary ||
            summarizeRecommendations(
                recommendations
            ),

        scoredAt:
            new Date().toISOString(),

        scoringVersion:
            '1.0'
    };
}

/*
 * Calculate one score for each Org Health category.
 */
export function calculateCategoryScores(
    findings = [],
    recommendations = [],
    categoryWeights =
        HEALTH_CATEGORY_WEIGHTS
) {
    const groupedFindings =
        groupFindingsByCategory(
            findings
        );

    const categories =
        getConfiguredCategories(
            categoryWeights
        );

    return categories.map(
        (category) => {
            const categoryFindings =
                sortFindingsBySeverity(
                    normalizeArray(
                        groupedFindings[
                            category
                        ]
                    )
                );

            const categoryRecommendations =
                sortRecommendationsByPriority(
                    normalizeArray(
                        recommendations
                    ).filter(
                        (recommendation) =>
                            recommendation
                                ?.category ===
                            category
                    )
                );

            const score =
                calculateCategoryScore(
                    categoryFindings
                );

            return {
                ...createHealthCategoryResult({
                    category,
                    score,
                    status:
                        getCategoryHealthStatus(
                            score
                        ),
                    findings:
                        categoryFindings,
                    recommendations:
                        categoryRecommendations
                }),

                weight:
                    safeNumber(
                        categoryWeights[
                            category
                        ]
                    ),

                deduction:
                    calculateFindingDeductions(
                        categoryFindings
                    ),

                blockingFindingCount:
                    categoryFindings.filter(
                        (finding) =>
                            safeBoolean(
                                finding
                                    ?.blocking
                            )
                    ).length,

                criticalFindingCount:
                    countFindingsBySeverity(
                        categoryFindings,
                        SEVERITY_LEVELS
                            .CRITICAL
                    ),

                highFindingCount:
                    countFindingsBySeverity(
                        categoryFindings,
                        SEVERITY_LEVELS
                            .HIGH
                    ),

                riskLevel:
                    determineCategoryRiskLevel(
                        categoryFindings,
                        score
                    )
            };
        }
    );
}

/*
 * Calculate a single category score.
 *
 * Categories start at 100 and lose points
 * based on finding score impacts.
 */
export function calculateCategoryScore(
    findings = [],
    startingScore = 100
) {
    const totalDeduction =
        calculateFindingDeductions(
            findings
        );

    return clampScore(
        safeNumber(
            startingScore,
            100
        ) -
        totalDeduction
    );
}

/*
 * Calculate total deductions for a set of findings.
 */
export function calculateFindingDeductions(
    findings = []
) {
    return normalizeArray(findings)
        .reduce(
            (total, finding) => {
                return (
                    total +
                    getFindingScoreImpact(
                        finding
                    )
                );
            },
            0
        );
}

/*
 * Use a finding's configured scoreImpact.
 *
 * When scoreImpact is not provided, use the
 * default deduction for the finding's severity.
 */
export function getFindingScoreImpact(
    finding = {}
) {
    const scoreImpact =
        finding.scoreImpact;

    if (
        scoreImpact !== null &&
        scoreImpact !== undefined &&
        scoreImpact !== ''
    ) {
        return Math.max(
            0,
            safeNumber(scoreImpact)
        );
    }

    return safeNumber(
        DEFAULT_SEVERITY_DEDUCTIONS[
            finding.severity
        ]
    );
}

/*
 * Calculate the weighted overall Org Health score.
 */
export function calculateOverallHealthScore(
    categoryResults = [],
    categoryWeights =
        HEALTH_CATEGORY_WEIGHTS
) {
    const weightedCategories =
        normalizeArray(
            categoryResults
        ).map(
            (categoryResult) => {
                const category =
                    categoryResult.category;

                return {
                    score:
                        clampScore(
                            categoryResult.score
                        ),

                    weight:
                        safeNumber(
                            categoryWeights[
                                category
                            ],
                            1
                        )
                };
            }
        );

    if (!weightedCategories.length) {
        return 100;
    }

    return clampScore(
        calculateWeightedAverage(
            weightedCategories,
            'score',
            'weight'
        )
    );
}

/*
 * Calculate deployment readiness independently
 * from overall Org Health.
 */
export function calculateDeploymentReadiness({
    findings = [],
    recommendations = [],
    categoryResults = [],
    deploymentWeights =
        DEPLOYMENT_CATEGORY_WEIGHTS,
    options = {}
} = {}) {
    const normalizedFindings =
        sortFindingsBySeverity(
            findings
        );

    const blockingFindings =
        normalizedFindings.filter(
            (finding) =>
                safeBoolean(
                    finding.blocking
                )
        );

    const deploymentRelevantFindings =
        normalizedFindings.filter(
            (finding) =>
                isDeploymentRelevantFinding(
                    finding
                )
        );

    const warnings =
        deploymentRelevantFindings.filter(
            (finding) =>
                !safeBoolean(
                    finding.blocking
                ) &&
                finding.severity !==
                    SEVERITY_LEVELS
                        .INFORMATIONAL
        );

    const baseScore =
        calculateDeploymentWeightedScore(
            categoryResults,
            deploymentWeights
        );

    const blockingPenalty =
        calculateBlockingPenalty(
            blockingFindings,
            options
        );

    const finalScore =
        clampScore(
            baseScore -
            blockingPenalty
        );

    const requiredTests =
        buildRequiredTests(
            deploymentRelevantFindings
        );

    const readinessRecommendations =
        buildDeploymentRecommendations(
            recommendations,
            deploymentRelevantFindings
        );

    const status =
        determineDeploymentReadinessStatus({
            score:
                finalScore,
            blockingFindings,
            deploymentRelevantFindings
        });

    return {
        ...createDeploymentReadinessResult({
            score:
                finalScore,

            status,

            blockingFindings,

            warnings,

            requiredTests,

            recommendations:
                readinessRecommendations,

            rollbackRequired:
                determineRollbackRequirement(
                    deploymentRelevantFindings
                )
        }),

        baseScore,

        blockingPenalty,

        relevantFindingCount:
            deploymentRelevantFindings.length,

        criticalFindingCount:
            countFindingsBySeverity(
                deploymentRelevantFindings,
                SEVERITY_LEVELS
                    .CRITICAL
            ),

        highFindingCount:
            countFindingsBySeverity(
                deploymentRelevantFindings,
                SEVERITY_LEVELS
                    .HIGH
            ),

        riskLevel:
            determineDeploymentRiskLevel({
                status,
                score:
                    finalScore,
                blockingFindings,
                deploymentRelevantFindings
            }),

        approvalRecommendation:
            getDeploymentApprovalRecommendation(
                status
            )
    };
}

/*
 * Calculate a weighted score using only categories
 * that affect deployment readiness.
 */
export function calculateDeploymentWeightedScore(
    categoryResults = [],
    deploymentWeights =
        DEPLOYMENT_CATEGORY_WEIGHTS
) {
    const weightedCategories =
        normalizeArray(
            categoryResults
        )
            .filter(
                (categoryResult) =>
                    Object.prototype
                        .hasOwnProperty.call(
                            deploymentWeights,
                            categoryResult
                                .category
                        )
            )
            .map(
                (categoryResult) => ({
                    score:
                        clampScore(
                            categoryResult
                                .score
                        ),

                    weight:
                        safeNumber(
                            deploymentWeights[
                                categoryResult
                                    .category
                            ],
                            1
                        )
                })
            );

    if (!weightedCategories.length) {
        return 100;
    }

    return clampScore(
        calculateWeightedAverage(
            weightedCategories,
            'score',
            'weight'
        )
    );
}

/*
 * Blocking findings receive an additional deployment
 * penalty beyond their normal category deduction.
 */
export function calculateBlockingPenalty(
    blockingFindings = [],
    options = {}
) {
    const penaltyPerBlocker =
        safeNumber(
            options
                .blockingPenaltyPerFinding,
            5
        );

    const maximumPenalty =
        safeNumber(
            options
                .maximumBlockingPenalty,
            30
        );

    const penalty =
        normalizeArray(
            blockingFindings
        ).reduce(
            (total, finding) => {
                const severityMultiplier =
                    getBlockingSeverityMultiplier(
                        finding.severity
                    );

                return (
                    total +
                    penaltyPerBlocker *
                        severityMultiplier
                );
            },
            0
        );

    return Math.min(
        maximumPenalty,
        penalty
    );
}

/*
 * Determine deployment-readiness status.
 */
export function determineDeploymentReadinessStatus({
    score = 0,
    blockingFindings = [],
    deploymentRelevantFindings = []
} = {}) {
    const blockers =
        normalizeArray(
            blockingFindings
        );

    const criticalFindings =
        normalizeArray(
            deploymentRelevantFindings
        ).filter(
            (finding) =>
                finding.severity ===
                SEVERITY_LEVELS
                    .CRITICAL
        );

    if (
        blockers.length > 0 ||
        criticalFindings.length > 0
    ) {
        return READINESS_STATUSES
            .NOT_READY;
    }

    if (
        clampScore(score) >= 90
    ) {
        return READINESS_STATUSES
            .READY;
    }

    if (
        clampScore(score) >= 70
    ) {
        return READINESS_STATUSES
            .READY_WITH_WARNINGS;
    }

    return READINESS_STATUSES
        .NOT_READY;
}

/*
 * Build dashboard-ready Org Health metrics.
 */
export function buildHealthDashboardMetrics({
    findings = [],
    recommendations = [],
    categoryResults = [],
    overallScore = 100,
    deploymentReadiness = {}
} = {}) {
    const findingSummary =
        summarizeFindings(
            findings
        );

    const recommendationSummary =
        summarizeRecommendations(
            recommendations
        );

    const lowestCategory =
        getLowestScoringCategory(
            categoryResults
        );

    const highestRiskCategory =
        getHighestRiskCategory(
            categoryResults
        );

    const healthyCategories =
        normalizeArray(
            categoryResults
        ).filter(
            (category) =>
                safeNumber(
                    category.score
                ) >= 90
        ).length;

    const attentionCategories =
        normalizeArray(
            categoryResults
        ).filter(
            (category) =>
                safeNumber(
                    category.score
                ) < 90
        ).length;

    return {
        orgHealthScore:
            clampScore(
                overallScore
            ),

        orgHealthStatus:
            getOverallHealthStatus(
                overallScore
            ),

        deploymentReadinessScore:
            clampScore(
                deploymentReadiness
                    .score
            ),

        deploymentReadinessStatus:
            safeString(
                deploymentReadiness
                    .status,
                READINESS_STATUSES
                    .UNKNOWN
            ),

        totalFindings:
            findingSummary.total,

        criticalFindings:
            findingSummary.critical,

        highFindings:
            findingSummary.high,

        mediumFindings:
            findingSummary.medium,

        lowFindings:
            findingSummary.low,

        informationalFindings:
            findingSummary
                .informational,

        blockingFindings:
            findingSummary.blocking,

        totalScoreImpact:
            findingSummary
                .scoreImpact,

        totalRecommendations:
            recommendationSummary.total,

        immediateRecommendations:
            recommendationSummary
                .immediate,

        highPriorityRecommendations:
            recommendationSummary.high,

        healthyCategories,

        attentionCategories,

        lowestCategory:
            lowestCategory
                ?.category ||
            'None',

        lowestCategoryScore:
            safeNumber(
                lowestCategory
                    ?.score,
                100
            ),

        highestRiskCategory:
            highestRiskCategory
                ?.category ||
            'None',

        highestRiskLevel:
            highestRiskCategory
                ?.riskLevel ||
            RISK_LEVELS.NONE,

        topFindings:
            sortFindingsBySeverity(
                findings
            ).slice(0, 5),

        topRecommendations:
            sortRecommendationsByPriority(
                recommendations
            ).slice(0, 5),

        generatedAt:
            new Date().toISOString()
    };
}

/*
 * Build a detailed explanation of why each score
 * received its current value.
 */
export function buildScoreExplanation({
    findings = [],
    categoryResults = [],
    overallScore = 100,
    deploymentReadiness = {}
} = {}) {
    const sortedCategories =
        [...normalizeArray(
            categoryResults
        )].sort(
            (first, second) =>
                safeNumber(
                    first.score
                ) -
                safeNumber(
                    second.score
                )
        );

    const largestDeductions =
        sortFindingsByScoreImpact(
            findings
        ).slice(0, 10);

    return {
        overall:
            buildOverallScoreMessage(
                overallScore,
                findings
            ),

        deployment:
            buildDeploymentScoreMessage(
                deploymentReadiness
            ),

        categories:
            sortedCategories.map(
                (category) => ({
                    category:
                        category.category,

                    score:
                        category.score,

                    status:
                        category.status,

                    deduction:
                        category.deduction,

                    findingCount:
                        category
                            .findingCount,

                    blockingFindingCount:
                        category
                            .blockingFindingCount,

                    message:
                        buildCategoryScoreMessage(
                            category
                        )
                })
            ),

        largestDeductions:
            largestDeductions.map(
                (finding) => ({
                    id:
                        finding.id,

                    title:
                        finding.title,

                    category:
                        finding.category,

                    severity:
                        finding.severity,

                    scoreImpact:
                        getFindingScoreImpact(
                            finding
                        ),

                    entityApiName:
                        finding
                            .entityApiName
                })
            )
    };
}

/*
 * Generate test recommendations based on findings.
 */
export function buildRequiredTests(
    findings = []
) {
    const tests =
        new Set();

    normalizeArray(findings)
        .forEach(
            (finding) => {
                const category =
                    finding.category;

                const title =
                    safeString(
                        finding.title
                    ).toLowerCase();

                if (
                    category ===
                        HEALTH_CATEGORIES
                            .AUTOMATION ||
                    title.includes('flow')
                ) {
                    tests.add(
                        'Test positive and negative Flow entry conditions.'
                    );

                    tests.add(
                        'Test Flow fault paths and administrator error handling.'
                    );

                    tests.add(
                        'Test bulk record processing and recursion behavior.'
                    );
                }

                if (
                    category ===
                        HEALTH_CATEGORIES
                            .TESTING ||
                    title.includes('apex')
                ) {
                    tests.add(
                        'Run required Apex tests and verify meaningful assertions.'
                    );

                    tests.add(
                        'Test bulk, exception, permission, and edge-case behavior.'
                    );
                }

                if (
                    category ===
                    HEALTH_CATEGORIES
                        .SECURITY
                ) {
                    tests.add(
                        'Test object permissions and field-level security using intended user personas.'
                    );

                    tests.add(
                        'Test restricted users to confirm access is denied appropriately.'
                    );
                }

                if (
                    category ===
                    HEALTH_CATEGORIES
                        .DATA_MODEL
                ) {
                    tests.add(
                        'Test required fields, unique constraints, relationships, and record types.'
                    );
                }

                if (
                    category ===
                    HEALTH_CATEGORIES
                        .PERFORMANCE
                ) {
                    tests.add(
                        'Test expected record volumes and verify governor-limit safety.'
                    );
                }

                if (
                    category ===
                    HEALTH_CATEGORIES
                        .DEPLOYMENT
                ) {
                    tests.add(
                        'Run deployment validation in a representative environment.'
                    );

                    tests.add(
                        'Complete post-deployment smoke testing.'
                    );
                }

                if (
                    title.includes(
                        'duplicate'
                    ) ||
                    title.includes(
                        'matching rule'
                    )
                ) {
                    tests.add(
                        'Test duplicate detection using exact, partial, and blank values.'
                    );
                }

                if (
                    title.includes(
                        'validation rule'
                    )
                ) {
                    tests.add(
                        'Test Validation Rule positive, negative, exception, and bypass scenarios.'
                    );
                }

                if (
                    title.includes(
                        'permission set'
                    ) ||
                    title.includes(
                        'profile'
                    )
                ) {
                    tests.add(
                        'Test Permission Set and Profile assignments using least-privilege personas.'
                    );
                }
            }
        );

    if (!tests.size) {
        tests.add(
            'Complete standard regression testing for affected business processes.'
        );

        tests.add(
            'Complete post-deployment smoke testing.'
        );
    }

    return Array.from(tests);
}

/*
 * Return only recommendations related to
 * deployment-relevant findings.
 */
export function buildDeploymentRecommendations(
    recommendations = [],
    findings = []
) {
    const relevantFindingIds =
        new Set(
            normalizeArray(findings)
                .map(
                    (finding) =>
                        finding.id
                )
                .filter(Boolean)
        );

    const relevantRecommendations =
        normalizeArray(
            recommendations
        ).filter(
            (recommendation) => {
                const relatedFindingIds =
                    normalizeArray(
                        recommendation
                            .relatedFindingIds
                    );

                return (
                    isDeploymentRelevantCategory(
                        recommendation.category
                    ) ||
                    relatedFindingIds.some(
                        (findingId) =>
                            relevantFindingIds.has(
                                findingId
                            )
                    )
                );
            }
        );

    return sortRecommendationsByPriority(
        deduplicateBy(
            relevantRecommendations,
            'id'
        )
    );
}

/*
 * Determine whether rollback planning is needed.
 */
export function determineRollbackRequirement(
    findings = []
) {
    return normalizeArray(findings)
        .some(
            (finding) =>
                safeBoolean(
                    finding.blocking
                ) ||
                finding.severity ===
                    SEVERITY_LEVELS
                        .CRITICAL ||
                finding.severity ===
                    SEVERITY_LEVELS
                        .HIGH ||
                finding.category ===
                    HEALTH_CATEGORIES
                        .DEPLOYMENT ||
                finding.category ===
                    HEALTH_CATEGORIES
                        .AUTOMATION ||
                finding.category ===
                    HEALTH_CATEGORIES
                        .DATA_MODEL
        );
}

/*
 * Find the lowest-scoring category.
 */
export function getLowestScoringCategory(
    categoryResults = []
) {
    const normalizedCategories =
        normalizeArray(
            categoryResults
        );

    if (!normalizedCategories.length) {
        return null;
    }

    return normalizedCategories.reduce(
        (lowest, current) => {
            if (!lowest) {
                return current;
            }

            return (
                safeNumber(
                    current.score
                ) <
                safeNumber(
                    lowest.score
                )
                    ? current
                    : lowest
            );
        },
        null
    );
}

/*
 * Find the category with the highest calculated risk.
 */
export function getHighestRiskCategory(
    categoryResults = []
) {
    const riskWeights = {
        [RISK_LEVELS.CRITICAL]: 5,
        [RISK_LEVELS.HIGH]: 4,
        [RISK_LEVELS.MEDIUM]: 3,
        [RISK_LEVELS.LOW]: 2,
        [RISK_LEVELS.NONE]: 1,
        [RISK_LEVELS.UNKNOWN]: 0
    };

    const normalizedCategories =
        normalizeArray(
            categoryResults
        );

    if (!normalizedCategories.length) {
        return null;
    }

    return normalizedCategories.reduce(
        (highest, current) => {
            if (!highest) {
                return current;
            }

            const currentWeight =
                safeNumber(
                    riskWeights[
                        current.riskLevel
                    ]
                );

            const highestWeight =
                safeNumber(
                    riskWeights[
                        highest.riskLevel
                    ]
                );

            if (
                currentWeight >
                highestWeight
            ) {
                return current;
            }

            if (
                currentWeight ===
                    highestWeight &&
                safeNumber(
                    current.score
                ) <
                    safeNumber(
                        highest.score
                    )
            ) {
                return current;
            }

            return highest;
        },
        null
    );
}

/*
 * Health and risk helpers
 */

export function getOverallHealthStatus(
    score = 0
) {
    const normalizedScore =
        clampScore(score);

    if (normalizedScore >= 90) {
        return 'Healthy';
    }

    if (normalizedScore >= 75) {
        return 'Needs attention';
    }

    if (normalizedScore >= 60) {
        return 'At risk';
    }

    return 'Critical';
}

export function getCategoryHealthStatus(
    score = 0
) {
    const normalizedScore =
        clampScore(score);

    if (normalizedScore >= 95) {
        return 'Excellent';
    }

    if (normalizedScore >= 90) {
        return 'Healthy';
    }

    if (normalizedScore >= 75) {
        return 'Needs attention';
    }

    if (normalizedScore >= 60) {
        return 'At risk';
    }

    return 'Critical';
}

export function determineCategoryRiskLevel(
    findings = [],
    score = 100
) {
    const normalizedFindings =
        normalizeArray(findings);

    if (
        normalizedFindings.some(
            (finding) =>
                safeBoolean(
                    finding.blocking
                ) ||
                finding.severity ===
                    SEVERITY_LEVELS
                        .CRITICAL
        )
    ) {
        return RISK_LEVELS
            .CRITICAL;
    }

    if (
        normalizedFindings.some(
            (finding) =>
                finding.severity ===
                SEVERITY_LEVELS.HIGH
        ) ||
        clampScore(score) < 60
    ) {
        return RISK_LEVELS.HIGH;
    }

    if (
        normalizedFindings.some(
            (finding) =>
                finding.severity ===
                SEVERITY_LEVELS
                    .MEDIUM
        ) ||
        clampScore(score) < 75
    ) {
        return RISK_LEVELS.MEDIUM;
    }

    if (
        normalizedFindings.length ||
        clampScore(score) < 90
    ) {
        return RISK_LEVELS.LOW;
    }

    return RISK_LEVELS.NONE;
}

export function determineDeploymentRiskLevel({
    status = READINESS_STATUSES.UNKNOWN,
    score = 0,
    blockingFindings = [],
    deploymentRelevantFindings = []
} = {}) {
    if (
        normalizeArray(
            blockingFindings
        ).length ||
        normalizeArray(
            deploymentRelevantFindings
        ).some(
            (finding) =>
                finding.severity ===
                    SEVERITY_LEVELS
                        .CRITICAL
        )
    ) {
        return RISK_LEVELS
            .CRITICAL;
    }

    if (
        status ===
            READINESS_STATUSES
                .NOT_READY ||
        clampScore(score) < 60
    ) {
        return RISK_LEVELS.HIGH;
    }

    if (
        status ===
            READINESS_STATUSES
                .READY_WITH_WARNINGS ||
        clampScore(score) < 90
    ) {
        return RISK_LEVELS.MEDIUM;
    }

    if (
        status ===
        READINESS_STATUSES.READY
    ) {
        return RISK_LEVELS.LOW;
    }

    return RISK_LEVELS.UNKNOWN;
}

/*
 * Internal helpers
 */

function getConfiguredCategories(
    categoryWeights = {}
) {
    const modelCategories =
        Object.values(
            HEALTH_CATEGORIES
        );

    const configuredCategories =
        Object.keys(
            categoryWeights
        );

    return Array.from(
        new Set([
            ...modelCategories,
            ...configuredCategories
        ])
    );
}

function countFindingsBySeverity(
    findings = [],
    severity = ''
) {
    return normalizeArray(findings)
        .filter(
            (finding) =>
                finding?.severity ===
                severity
        )
        .length;
}

function isDeploymentRelevantFinding(
    finding = {}
) {
    return (
        safeBoolean(
            finding.blocking
        ) ||
        finding.severity ===
            SEVERITY_LEVELS
                .CRITICAL ||
        finding.severity ===
            SEVERITY_LEVELS.HIGH ||
        isDeploymentRelevantCategory(
            finding.category
        )
    );
}

function isDeploymentRelevantCategory(
    category = ''
) {
    return [
        HEALTH_CATEGORIES
            .DEPLOYMENT,
        HEALTH_CATEGORIES
            .TESTING,
        HEALTH_CATEGORIES
            .AUTOMATION,
        HEALTH_CATEGORIES
            .SECURITY,
        HEALTH_CATEGORIES
            .PERFORMANCE,
        HEALTH_CATEGORIES
            .DATA_MODEL
    ].includes(category);
}

function getBlockingSeverityMultiplier(
    severity = ''
) {
    switch (severity) {
        case SEVERITY_LEVELS
            .CRITICAL:
            return 2;

        case SEVERITY_LEVELS.HIGH:
            return 1.5;

        case SEVERITY_LEVELS
            .MEDIUM:
            return 1;

        case SEVERITY_LEVELS.LOW:
            return 0.5;

        default:
            return 0.25;
    }
}

function sortFindingsByScoreImpact(
    findings = []
) {
    return [...normalizeArray(
        findings
    )].sort(
        (first, second) =>
            getFindingScoreImpact(
                second
            ) -
            getFindingScoreImpact(
                first
            )
    );
}

function buildOverallScoreMessage(
    score = 100,
    findings = []
) {
    const normalizedScore =
        clampScore(score);

    const findingSummary =
        summarizeFindings(
            findings
        );

    if (
        findingSummary.total === 0
    ) {
        return `The organization received an Org Health score of ${normalizedScore}/100 because no health findings were detected in the metadata provided.`;
    }

    return `The organization received an Org Health score of ${normalizedScore}/100 after evaluating ${findingSummary.total} findings, including ${findingSummary.critical} critical, ${findingSummary.high} high, and ${findingSummary.blocking} blocking findings.`;
}

function buildDeploymentScoreMessage(
    deploymentReadiness = {}
) {
    const score =
        clampScore(
            deploymentReadiness
                .score
        );

    const status =
        safeString(
            deploymentReadiness
                .status,
            READINESS_STATUSES
                .UNKNOWN
        );

    const blockingCount =
        normalizeArray(
            deploymentReadiness
                .blockingFindings
        ).length;

    if (blockingCount) {
        return `Deployment readiness is ${status} with a score of ${score}/100 because ${blockingCount} blocking finding or findings must be resolved.`;
    }

    return `Deployment readiness is ${status} with a score of ${score}/100.`;
}

function buildCategoryScoreMessage(
    category = {}
) {
    const score =
        clampScore(
            category.score
        );

    const findingCount =
        safeNumber(
            category.findingCount
        );

    const deduction =
        safeNumber(
            category.deduction
        );

    if (!findingCount) {
        return `${category.category} received ${score}/100 because no findings were detected in this category.`;
    }

    return `${category.category} received ${score}/100 after ${findingCount} finding or findings deducted ${deduction} points.`;
}

function getDeploymentApprovalRecommendation(
    status = ''
) {
    switch (status) {
        case READINESS_STATUSES.READY:
            return 'Deployment may proceed after final stakeholder approval and standard smoke-test preparation.';

        case READINESS_STATUSES
            .READY_WITH_WARNINGS:
            return 'Deployment may proceed only after warnings are reviewed, accepted, and documented by the appropriate owner.';

        case READINESS_STATUSES
            .NOT_READY:
            return 'Do not approve deployment until blocking and critical findings are resolved and validation is repeated.';

        default:
            return 'Complete deployment-readiness analysis before approving the release.';
    }
}