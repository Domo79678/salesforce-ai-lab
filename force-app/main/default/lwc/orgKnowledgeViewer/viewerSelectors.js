/*
 * viewerSelectors.js
 *
 * Pure view-model selectors for the Salesforce Copilot
 * Org Knowledge Viewer.
 *
 * Responsibilities:
 * - safely read analysis results
 * - prepare dashboard metrics
 * - group findings by category
 * - explain Org Health score deductions
 * - sort findings and recommendations
 * - identify blockers and risk focus areas
 * - prepare Daily Admin Brief display data
 *
 * This file performs no Apex calls, browser storage,
 * or Lightning component state management.
 */

const DEFAULT_CATEGORY =
    'Uncategorized';

const DEFAULT_STATUS =
    'Unknown';

const DEFAULT_RISK =
    'None';

const SEVERITY_ORDER = Object.freeze({
    Critical: 1,
    High: 2,
    Medium: 3,
    Low: 4,
    Info: 5
});

const PRIORITY_ORDER = Object.freeze({
    P1: 1,
    Critical: 1,
    High: 2,
    P2: 2,
    Medium: 3,
    P3: 3,
    Low: 4,
    P4: 4
});

/*
 * Core result selectors
 */

export function getAnalysisResult(
    analysisResult = null
) {
    return isObject(analysisResult)
        ? analysisResult
        : {};
}

export function hasSuccessfulAnalysis(
    analysisResult = null
) {
    return Boolean(
        analysisResult &&
        analysisResult.success
    );
}

export function getOrganization(
    analysisResult = {}
) {
    return normalizeObject(
        analysisResult.organization
    );
}

export function getHealth(
    analysisResult = {}
) {
    return normalizeObject(
        analysisResult.health
    );
}

export function getDeploymentReadiness(
    analysisResult = {}
) {
    return normalizeObject(
        analysisResult.deploymentReadiness
    );
}

export function getDailyBrief(
    analysisResult = {}
) {
    return normalizeObject(
        analysisResult.dailyBrief
    );
}

export function getDashboardMetrics(
    analysisResult = {}
) {
    return normalizeObject(
        analysisResult.dashboardMetrics
    );
}

export function getMetadataCounts(
    analysisResult = {}
) {
    return normalizeObject(
        analysisResult.metadataCounts
    );
}

export function getFindings(
    analysisResult = {}
) {
    return normalizeArray(
        analysisResult.findings
    );
}

export function getRecommendations(
    analysisResult = {}
) {
    return normalizeArray(
        analysisResult.recommendations
    );
}

export function getCategoryResults(
    analysisResult = {}
) {
    return normalizeArray(
        analysisResult
            ?.health
            ?.categories
    );
}

/*
 * Dashboard metrics
 */

export function buildViewerMetrics(
    analysisResult = {},
    {
        inventoryCount = 0,
        detailedObjectCount = 0
    } = {}
) {
    const metrics =
        getDashboardMetrics(
            analysisResult
        );

    const metadataCounts =
        getMetadataCounts(
            analysisResult
        );

    const findings =
        getFindings(
            analysisResult
        );

    const recommendations =
        getRecommendations(
            analysisResult
        );

    const blockers =
        getDeploymentBlockers(
            analysisResult
        );

    return {
        orgHealthScore:
            firstFiniteNumber(
                metrics.orgHealthScore,
                analysisResult
                    ?.health
                    ?.overallScore,
                analysisResult
                    ?.health
                    ?.score,
                0
            ),

        orgHealthStatus:
            firstValue(
                metrics.orgHealthStatus,
                analysisResult
                    ?.health
                    ?.status,
                DEFAULT_STATUS
            ),

        deploymentScore:
            firstFiniteNumber(
                metrics
                    .deploymentReadinessScore,
                analysisResult
                    ?.deploymentReadiness
                    ?.score,
                analysisResult
                    ?.deploymentReadiness
                    ?.overallScore,
                0
            ),

        deploymentStatus:
            firstValue(
                metrics
                    .deploymentReadinessStatus,
                analysisResult
                    ?.deploymentReadiness
                    ?.status,
                DEFAULT_STATUS
            ),

        inventoryObjects:
            firstFiniteNumber(
                inventoryCount,
                0
            ),

        detailedObjects:
            firstFiniteNumber(
                detailedObjectCount,
                metadataCounts.objects,
                0
            ),

        fields:
            firstFiniteNumber(
                metadataCounts.fields,
                0
            ),

        totalFindings:
            firstFiniteNumber(
                metrics.totalFindings,
                findings.length,
                0
            ),

        criticalFindings:
            firstFiniteNumber(
                metrics.criticalFindings,
                countFindingsBySeverity(
                    findings,
                    'Critical'
                ),
                0
            ),

        highFindings:
            firstFiniteNumber(
                metrics.highFindings,
                countFindingsBySeverity(
                    findings,
                    'High'
                ),
                0
            ),

        blockingFindings:
            firstFiniteNumber(
                metrics.blockingFindings,
                blockers.length,
                0
            ),

        totalRecommendations:
            firstFiniteNumber(
                metrics.totalRecommendations,
                recommendations.length,
                0
            ),

        lowestCategory:
            firstValue(
                metrics.lowestCategory,
                findLowestCategory(
                    analysisResult
                )?.category,
                'None'
            ),

        lowestCategoryScore:
            firstFiniteNumber(
                metrics.lowestCategoryScore,
                findLowestCategory(
                    analysisResult
                )?.score,
                100
            ),

        highestRiskCategory:
            firstValue(
                metrics.highestRiskCategory,
                findHighestRiskCategory(
                    analysisResult
                )?.category,
                'None'
            ),

        highestRiskLevel:
            firstValue(
                metrics.highestRiskLevel,
                findHighestRiskCategory(
                    analysisResult
                )?.riskLevel,
                DEFAULT_RISK
            )
    };
}

/*
 * Finding selectors
 */

export function sortFindings(
    findings = []
) {
    return normalizeArray(findings)
        .map(
            (finding, index) =>
                normalizeFinding(
                    finding,
                    index
                )
        )
        .sort(
            (first, second) => {
                const severityDifference =
                    getSeverityRank(
                        first.severity
                    ) -
                    getSeverityRank(
                        second.severity
                    );

                if (
                    severityDifference !== 0
                ) {
                    return severityDifference;
                }

                const impactDifference =
                    second.scoreImpact -
                    first.scoreImpact;

                if (
                    impactDifference !== 0
                ) {
                    return impactDifference;
                }

                return first.title.localeCompare(
                    second.title
                );
            }
        );
}

export function getTopFindings(
    analysisResult = {},
    limit = 10
) {
    return sortFindings(
        getFindings(
            analysisResult
        )
    ).slice(
        0,
        normalizeLimit(
            limit,
            10
        )
    );
}

export function groupFindingsByCategory(
    findings = []
) {
    const grouped =
        new Map();

    sortFindings(findings)
        .forEach(
            (finding) => {
                const category =
                    firstValue(
                        finding.category,
                        DEFAULT_CATEGORY
                    );

                if (
                    !grouped.has(category)
                ) {
                    grouped.set(
                        category,
                        []
                    );
                }

                grouped
                    .get(category)
                    .push(finding);
            }
        );

    return Array.from(
        grouped.entries()
    )
        .map(
            ([category, categoryFindings]) => {
                const totalScoreImpact =
                    categoryFindings.reduce(
                        (total, finding) =>
                            total +
                            toNumber(
                                finding.scoreImpact
                            ),
                        0
                    );

                return {
                    id:
                        createSafeId(
                            `finding-group-${category}`
                        ),

                    category,

                    findings:
                        categoryFindings,

                    findingCount:
                        categoryFindings.length,

                    totalScoreImpact,

                    criticalCount:
                        countFindingsBySeverity(
                            categoryFindings,
                            'Critical'
                        ),

                    highCount:
                        countFindingsBySeverity(
                            categoryFindings,
                            'High'
                        ),

                    mediumCount:
                        countFindingsBySeverity(
                            categoryFindings,
                            'Medium'
                        ),

                    lowCount:
                        countFindingsBySeverity(
                            categoryFindings,
                            'Low'
                        ),

                    blockingCount:
                        categoryFindings.filter(
                            (finding) =>
                                Boolean(
                                    finding.blocking
                                )
                        ).length,

                    highestSeverity:
                        getHighestSeverity(
                            categoryFindings
                        ),

                    summary:
                        buildCategorySummary(
                            category,
                            categoryFindings,
                            totalScoreImpact
                        )
                };
            }
        )
        .sort(
            (first, second) => {
                const severityDifference =
                    getSeverityRank(
                        first.highestSeverity
                    ) -
                    getSeverityRank(
                        second.highestSeverity
                    );

                if (
                    severityDifference !== 0
                ) {
                    return severityDifference;
                }

                if (
                    second.totalScoreImpact !==
                    first.totalScoreImpact
                ) {
                    return (
                        second.totalScoreImpact -
                        first.totalScoreImpact
                    );
                }

                return (
                    second.findingCount -
                    first.findingCount
                );
            }
        );
}

export function getGroupedFindings(
    analysisResult = {}
) {
    return groupFindingsByCategory(
        getFindings(
            analysisResult
        )
    );
}

export function getDeploymentBlockers(
    analysisResult = {}
) {
    const directBlockers =
        normalizeArray(
            analysisResult
                ?.deploymentReadiness
                ?.blockingFindings
        );

    if (directBlockers.length) {
        return sortFindings(
            directBlockers
        );
    }

    return sortFindings(
        getFindings(
            analysisResult
        ).filter(
            (finding) =>
                Boolean(
                    finding.blocking
                )
        )
    );
}

export function getFindingsByCategory(
    analysisResult = {},
    category = ''
) {
    const normalizedCategory =
        String(
            category || ''
        ).toLowerCase();

    return sortFindings(
        getFindings(
            analysisResult
        ).filter(
            (finding) =>
                String(
                    finding.category || ''
                ).toLowerCase() ===
                normalizedCategory
        )
    );
}

/*
 * Health score explanation
 */

export function buildHealthScoreExplanation(
    analysisResult = {}
) {
    const metrics =
        buildViewerMetrics(
            analysisResult
        );

    const groupedFindings =
        getGroupedFindings(
            analysisResult
        );

    const affectedCategories =
        groupedFindings.filter(
            (group) =>
                group.totalScoreImpact > 0 ||
                group.findingCount > 0
        );

    const score =
        metrics.orgHealthScore;

    const deduction =
        Math.max(
            0,
            100 - score
        );

    if (
        !metrics.totalFindings
    ) {
        return {
            score,

            deduction: 0,

            title:
                `Why the score is ${score}/100`,

            summary:
                'No findings were detected in the metadata analyzed. This does not confirm that every metadata type in the organization has been fully verified.',

            categories: [],

            findingCount: 0,

            categoryCount: 0,

            blockingCount: 0,

            criticalCount: 0,

            highCount: 0
        };
    }

    return {
        score,

        deduction,

        title:
            `Why the score is ${score}/100`,

        summary:
            buildHealthExplanationSummary({
                score,
                deduction,
                findingCount:
                    metrics.totalFindings,
                categoryCount:
                    affectedCategories.length,
                criticalCount:
                    metrics.criticalFindings,
                highCount:
                    metrics.highFindings,
                blockingCount:
                    metrics.blockingFindings
            }),

        categories:
            affectedCategories,

        findingCount:
            metrics.totalFindings,

        categoryCount:
            affectedCategories.length,

        blockingCount:
            metrics.blockingFindings,

        criticalCount:
            metrics.criticalFindings,

        highCount:
            metrics.highFindings
    };
}

/*
 * Recommendation selectors
 */

export function sortRecommendations(
    recommendations = []
) {
    return normalizeArray(
        recommendations
    )
        .map(
            (
                recommendation,
                index
            ) =>
                normalizeRecommendation(
                    recommendation,
                    index
                )
        )
        .sort(
            (first, second) => {
                const priorityDifference =
                    getPriorityRank(
                        first.priority
                    ) -
                    getPriorityRank(
                        second.priority
                    );

                if (
                    priorityDifference !== 0
                ) {
                    return priorityDifference;
                }

                return first.title.localeCompare(
                    second.title
                );
            }
        );
}

export function getTopRecommendations(
    analysisResult = {},
    limit = 10
) {
    return sortRecommendations(
        getRecommendations(
            analysisResult
        )
    ).slice(
        0,
        normalizeLimit(
            limit,
            10
        )
    );
}

export function groupRecommendationsByCategory(
    recommendations = []
) {
    const grouped =
        new Map();

    sortRecommendations(
        recommendations
    ).forEach(
        (recommendation) => {
            const category =
                firstValue(
                    recommendation.category,
                    DEFAULT_CATEGORY
                );

            if (
                !grouped.has(category)
            ) {
                grouped.set(
                    category,
                    []
                );
            }

            grouped
                .get(category)
                .push(
                    recommendation
                );
        }
    );

    return Array.from(
        grouped.entries()
    ).map(
        ([category, items]) => ({
            id:
                createSafeId(
                    `recommendation-group-${category}`
                ),

            category,

            recommendations:
                items,

            recommendationCount:
                items.length,

            highestPriority:
                items[0]?.priority ||
                'None'
        })
    );
}

/*
 * Category selectors
 */

export function normalizeCategoryResults(
    categories = []
) {
    return normalizeArray(
        categories
    )
        .map(
            (
                category,
                index
            ) => ({
                id:
                    firstValue(
                        category.id,
                        createSafeId(
                            `health-category-${
                                category.category ||
                                index
                            }`
                        )
                    ),

                category:
                    firstValue(
                        category.category,
                        category.name,
                        DEFAULT_CATEGORY
                    ),

                score:
                    firstFiniteNumber(
                        category.score,
                        100
                    ),

                status:
                    firstValue(
                        category.status,
                        DEFAULT_STATUS
                    ),

                riskLevel:
                    firstValue(
                        category.riskLevel,
                        DEFAULT_RISK
                    ),

                findingCount:
                    firstFiniteNumber(
                        category.findingCount,
                        normalizeArray(
                            category.findings
                        ).length,
                        0
                    ),

                scoreImpact:
                    firstFiniteNumber(
                        category.scoreImpact,
                        Math.max(
                            0,
                            100 -
                            firstFiniteNumber(
                                category.score,
                                100
                            )
                        ),
                        0
                    ),

                findings:
                    normalizeArray(
                        category.findings
                    )
            })
        )
        .sort(
            (first, second) =>
                first.score -
                second.score
        );
}

export function findLowestCategory(
    analysisResult = {}
) {
    const categories =
        normalizeCategoryResults(
            getCategoryResults(
                analysisResult
            )
        );

    return categories.length
        ? categories[0]
        : null;
}

export function findHighestRiskCategory(
    analysisResult = {}
) {
    const categories =
        normalizeCategoryResults(
            getCategoryResults(
                analysisResult
            )
        );

    if (!categories.length) {
        return null;
    }

    return [...categories]
        .sort(
            (first, second) => {
                const riskDifference =
                    getSeverityRank(
                        first.riskLevel
                    ) -
                    getSeverityRank(
                        second.riskLevel
                    );

                if (
                    riskDifference !== 0
                ) {
                    return riskDifference;
                }

                return (
                    first.score -
                    second.score
                );
            }
        )[0];
}

/*
 * Daily Admin Brief selectors
 */

export function buildDailyBriefView(
    analysisResult = {}
) {
    const sourceBrief =
        getDailyBrief(
            analysisResult
        );

    const metrics =
        buildViewerMetrics(
            analysisResult
        );

    const groupedFindings =
        getGroupedFindings(
            analysisResult
        );

    const recommendations =
        getTopRecommendations(
            analysisResult,
            3
        );

    return {
        greeting:
            firstValue(
                sourceBrief.greeting,
                'Good morning.'
            ),

        headline:
            firstValue(
                sourceBrief.headline,
                buildDailyBriefHeadline(
                    metrics
                )
            ),

        orgHealth: {
            score:
                firstFiniteNumber(
                    sourceBrief
                        ?.orgHealth
                        ?.score,
                    metrics.orgHealthScore,
                    0
                ),

            status:
                firstValue(
                    sourceBrief
                        ?.orgHealth
                        ?.status,
                    metrics.orgHealthStatus,
                    DEFAULT_STATUS
                )
        },

        deploymentReadiness: {
            score:
                firstFiniteNumber(
                    sourceBrief
                        ?.deploymentReadiness
                        ?.score,
                    metrics.deploymentScore,
                    0
                ),

            status:
                firstValue(
                    sourceBrief
                        ?.deploymentReadiness
                        ?.status,
                    metrics.deploymentStatus,
                    DEFAULT_STATUS
                )
        },

        findings: {
            total:
                firstFiniteNumber(
                    sourceBrief
                        ?.findings
                        ?.total,
                    metrics.totalFindings,
                    0
                ),

            critical:
                firstFiniteNumber(
                    sourceBrief
                        ?.findings
                        ?.critical,
                    metrics.criticalFindings,
                    0
                ),

            high:
                firstFiniteNumber(
                    sourceBrief
                        ?.findings
                        ?.high,
                    metrics.highFindings,
                    0
                ),

            blocking:
                firstFiniteNumber(
                    sourceBrief
                        ?.findings
                        ?.blocking,
                    metrics.blockingFindings,
                    0
                ),

            top:
                getTopFindings(
                    analysisResult,
                    5
                )
        },

        priorities:
            normalizeArray(
                sourceBrief.priorities
            ).length
                ? normalizeArray(
                      sourceBrief.priorities
                  )
                : recommendations.map(
                      (
                          recommendation,
                          index
                      ) => ({
                          rank:
                              index + 1,

                          title:
                              recommendation.title,

                          action:
                              recommendation.action,

                          priority:
                              recommendation.priority,

                          category:
                              recommendation.category,

                          entityApiName:
                              recommendation.entityApiName
                      })
                  ),

        categorySummary:
            groupedFindings.map(
                (group) => ({
                    id:
                        group.id,

                    category:
                        group.category,

                    findingCount:
                        group.findingCount,

                    scoreImpact:
                        group.totalScoreImpact,

                    criticalCount:
                        group.criticalCount,

                    highCount:
                        group.highCount,

                    blockingCount:
                        group.blockingCount
                })
            ),

        lowestCategory:
            metrics.lowestCategory,

        highestRiskCategory:
            metrics.highestRiskCategory,

        generatedAt:
            firstValue(
                sourceBrief.generatedAt,
                analysisResult.generatedAt,
                new Date().toISOString()
            ),

        generatedAtLabel:
            firstValue(
                sourceBrief.generatedAtLabel,
                formatDateTime(
                    analysisResult.generatedAt
                )
            )
    };
}

/*
 * Shared-intelligence readiness
 */

export function buildSharedIntelligenceStatus(
    analysisResult = {}
) {
    const hasAnalysis =
        hasSuccessfulAnalysis(
            analysisResult
        );

    const findings =
        getFindings(
            analysisResult
        );

    const objects =
        normalizeArray(
            analysisResult.objects
        );

    const hasEntityProfiles =
        objects.length > 0;

    const hasFindings =
        findings.length > 0;

    const hasReadiness =
        Boolean(
            analysisResult
                .deploymentReadiness
        );

    return [
        {
            id:
                'shared-explain-this',

            name:
                'Explain This',

            status:
                hasAnalysis &&
                hasEntityProfiles
                    ? 'Knowledge Ready'
                    : 'Not Ready',

            ready:
                hasAnalysis &&
                hasEntityProfiles,

            detail:
                'Uses object and field profiles, findings, risks, recommendations, and tests.'
        },

        {
            id:
                'shared-change-impact',

            name:
                'Change Impact',

            status:
                hasAnalysis &&
                hasEntityProfiles
                    ? 'Knowledge Ready'
                    : 'Not Ready',

            ready:
                hasAnalysis &&
                hasEntityProfiles,

            detail:
                'Uses entity structure, risk context, findings, and testing guidance.'
        },

        {
            id:
                'shared-deployment-readiness',

            name:
                'Deployment Readiness',

            status:
                hasAnalysis &&
                hasReadiness
                    ? 'Live'
                    : 'Not Ready',

            ready:
                hasAnalysis &&
                hasReadiness,

            detail:
                'Uses blockers, warnings, findings, recommendations, and readiness scoring.'
        },

        {
            id:
                'shared-daily-admin-brief',

            name:
                'Daily Admin Brief',

            status:
                hasAnalysis
                    ? 'Live'
                    : 'Not Ready',

            ready:
                hasAnalysis,

            detail:
                hasFindings
                    ? 'Uses current findings, category summaries, and prioritized recommendations.'
                    : 'Uses current metadata analysis and will surface findings when detected.'
        }
    ];
}

/*
 * Normalization helpers
 */

export function normalizeFinding(
    finding = {},
    index = 0
) {
    return {
        ...finding,

        id:
            firstValue(
                finding.id,
                createSafeId(
                    `finding-${
                        finding.entityApiName ||
                        finding.title ||
                        index
                    }-${index}`
                )
            ),

        title:
            firstValue(
                finding.title,
                finding.name,
                'Untitled Finding'
            ),

        summary:
            firstValue(
                finding.summary,
                finding.description,
                'No finding summary was provided.'
            ),

        category:
            firstValue(
                finding.category,
                DEFAULT_CATEGORY
            ),

        severity:
            normalizeSeverity(
                finding.severity
            ),

        riskLevel:
            firstValue(
                finding.riskLevel,
                DEFAULT_RISK
            ),

        scoreImpact:
            Math.abs(
                firstFiniteNumber(
                    finding.scoreImpact,
                    finding.impact,
                    0
                )
            ),

        blocking:
            Boolean(
                finding.blocking
            ),

        entityApiName:
            firstValue(
                finding.entityApiName,
                finding.apiName,
                'Organization'
            )
    };
}

export function normalizeRecommendation(
    recommendation = {},
    index = 0
) {
    return {
        ...recommendation,

        id:
            firstValue(
                recommendation.id,
                createSafeId(
                    `recommendation-${
                        recommendation.entityApiName ||
                        recommendation.title ||
                        index
                    }-${index}`
                )
            ),

        title:
            firstValue(
                recommendation.title,
                recommendation.name,
                'Recommended Action'
            ),

        action:
            firstValue(
                recommendation.action,
                recommendation.description,
                recommendation.summary,
                'Review this recommendation.'
            ),

        category:
            firstValue(
                recommendation.category,
                DEFAULT_CATEGORY
            ),

        priority:
            firstValue(
                recommendation.priority,
                'Medium'
            ),

        entityApiName:
            firstValue(
                recommendation.entityApiName,
                recommendation.apiName,
                'Organization'
            )
    };
}

export function normalizeSeverity(
    severity = ''
) {
    const normalized =
        String(
            severity || ''
        ).trim().toLowerCase();

    switch (normalized) {
        case 'critical':
            return 'Critical';

        case 'high':
            return 'High';

        case 'medium':
            return 'Medium';

        case 'low':
            return 'Low';

        case 'info':
        case 'informational':
            return 'Info';

        default:
            return 'Low';
    }
}

export function getSeverityRank(
    severity = ''
) {
    const normalizedSeverity =
        normalizeSeverity(
            severity
        );

    return (
        SEVERITY_ORDER[
            normalizedSeverity
        ] ||
        999
    );
}

export function getPriorityRank(
    priority = ''
) {
    const normalizedPriority =
        String(
            priority || ''
        ).trim();

    return (
        PRIORITY_ORDER[
            normalizedPriority
        ] ||
        999
    );
}

export function countFindingsBySeverity(
    findings = [],
    severity = ''
) {
    const normalizedSeverity =
        normalizeSeverity(
            severity
        );

    return normalizeArray(
        findings
    ).filter(
        (finding) =>
            normalizeSeverity(
                finding.severity
            ) ===
            normalizedSeverity
    ).length;
}

export function getHighestSeverity(
    findings = []
) {
    const sorted =
        sortFindings(
            findings
        );

    return sorted.length
        ? sorted[0].severity
        : 'Low';
}

/*
 * Text helpers
 */

function buildHealthExplanationSummary({
    score = 0,
    deduction = 0,
    findingCount = 0,
    categoryCount = 0,
    criticalCount = 0,
    highCount = 0,
    blockingCount = 0
} = {}) {
    const severityParts = [];

    if (criticalCount > 0) {
        severityParts.push(
            `${criticalCount} critical`
        );
    }

    if (highCount > 0) {
        severityParts.push(
            `${highCount} high`
        );
    }

    if (blockingCount > 0) {
        severityParts.push(
            `${blockingCount} blocking`
        );
    }

    const severitySummary =
        severityParts.length
            ? ` This includes ${severityParts.join(
                  ', '
              )} findings.`
            : '';

    return `${deduction} health points were deducted from a possible 100 based on ${findingCount} explainable findings across ${categoryCount} categories.${severitySummary} Current score: ${score}/100.`;
}

function buildCategorySummary(
    category = DEFAULT_CATEGORY,
    findings = [],
    totalScoreImpact = 0
) {
    const count =
        normalizeArray(
            findings
        ).length;

    const criticalCount =
        countFindingsBySeverity(
            findings,
            'Critical'
        );

    const highCount =
        countFindingsBySeverity(
            findings,
            'High'
        );

    const severityParts = [];

    if (criticalCount) {
        severityParts.push(
            `${criticalCount} critical`
        );
    }

    if (highCount) {
        severityParts.push(
            `${highCount} high`
        );
    }

    const severityText =
        severityParts.length
            ? `, including ${severityParts.join(
                  ' and '
              )}`
            : '';

    return `${category} contains ${count} findings${severityText} with a combined score impact of ${totalScoreImpact} points.`;
}

function buildDailyBriefHeadline(
    metrics = {}
) {
    if (
        metrics.criticalFindings > 0 ||
        metrics.blockingFindings > 0
    ) {
        return `${metrics.criticalFindings} critical and ${metrics.blockingFindings} blocking findings require immediate review.`;
    }

    if (
        metrics.highFindings > 0
    ) {
        return `${metrics.highFindings} high-severity findings should be reviewed today.`;
    }

    if (
        metrics.totalFindings > 0
    ) {
        return `${metrics.totalFindings} Org Health findings are available for review.`;
    }

    return 'No Org Health findings currently require attention.';
}

function formatDateTime(
    value
) {
    if (!value) {
        return '';
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return String(value);
    }

    return date.toLocaleString();
}

function createSafeId(
    value = ''
) {
    return String(value)
        .trim()
        .toLowerCase()
        .replace(
            /[^a-z0-9]+/g,
            '-'
        )
        .replace(
            /^-+|-+$/g,
            ''
        );
}

function normalizeLimit(
    value,
    fallback = 10
) {
    return Math.max(
        1,
        firstFiniteNumber(
            value,
            fallback
        )
    );
}

function firstValue(
    ...values
) {
    const value =
        values.find(
            (candidate) =>
                candidate !== null &&
                candidate !== undefined &&
                candidate !== ''
        );

    return value ?? '';
}

function firstFiniteNumber(
    ...values
) {
    for (
        const value of values
    ) {
        const numberValue =
            Number(value);

        if (
            Number.isFinite(
                numberValue
            )
        ) {
            return numberValue;
        }
    }

    return 0;
}

function toNumber(
    value,
    fallback = 0
) {
    const numberValue =
        Number(value);

    return Number.isFinite(
        numberValue
    )
        ? numberValue
        : fallback;
}

function normalizeArray(
    value
) {
    return Array.isArray(value)
        ? [...value]
        : [];
}

function normalizeObject(
    value
) {
    return isObject(value)
        ? { ...value }
        : {};
}

function isObject(
    value
) {
    return Boolean(
        value &&
        typeof value === 'object' &&
        !Array.isArray(value)
    );
}

const viewerSelectors = {
    getAnalysisResult,
    hasSuccessfulAnalysis,
    getOrganization,
    getHealth,
    getDeploymentReadiness,
    getDailyBrief,
    getDashboardMetrics,
    getMetadataCounts,
    getFindings,
    getRecommendations,
    getCategoryResults,
    buildViewerMetrics,
    sortFindings,
    getTopFindings,
    groupFindingsByCategory,
    getGroupedFindings,
    getDeploymentBlockers,
    getFindingsByCategory,
    buildHealthScoreExplanation,
    sortRecommendations,
    getTopRecommendations,
    groupRecommendationsByCategory,
    normalizeCategoryResults,
    findLowestCategory,
    findHighestRiskCategory,
    buildDailyBriefView,
    buildSharedIntelligenceStatus,
    normalizeFinding,
    normalizeRecommendation,
    normalizeSeverity,
    getSeverityRank,
    getPriorityRank,
    countFindingsBySeverity,
    getHighestSeverity
};

export default viewerSelectors;