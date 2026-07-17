/*
 * trendService.js
 *
 * Browser-local trend tracking for the Salesforce Copilot
 * Org Knowledge Viewer.
 *
 * Responsibilities:
 * - create compact trend snapshots
 * - save the latest successful analysis
 * - restore the previous analysis
 * - compare current and previous results
 * - format trend labels for the UI
 *
 * Current MVP storage:
 * - window.localStorage
 *
 * Future storage options:
 * - Salesforce custom object
 * - Platform Cache
 * - Custom Metadata or Custom Settings
 * - External analytics storage
 */

import {
    TREND_STORAGE_KEY
} from './viewerConstants';

export function createTrendSnapshot(
    analysis = {}
) {
    const metrics =
        normalizeObject(
            analysis.dashboardMetrics
        );

    const findings =
        normalizeArray(
            analysis.findings
        );

    const recommendations =
        normalizeArray(
            analysis.recommendations
        );

    const health =
        normalizeObject(
            analysis.health
        );

    const deploymentReadiness =
        normalizeObject(
            analysis.deploymentReadiness
        );

    return {
        orgHealthScore:
            firstFiniteNumber(
                metrics.orgHealthScore,
                health.overallScore,
                health.score,
                0
            ),

        orgHealthStatus:
            firstValue(
                metrics.orgHealthStatus,
                health.status,
                'Unknown'
            ),

        deploymentScore:
            firstFiniteNumber(
                metrics.deploymentReadinessScore,
                deploymentReadiness.score,
                deploymentReadiness.overallScore,
                0
            ),

        deploymentStatus:
            firstValue(
                metrics.deploymentReadinessStatus,
                deploymentReadiness.status,
                'Unknown'
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
                countBySeverity(
                    findings,
                    'Critical'
                ),
                0
            ),

        highFindings:
            firstFiniteNumber(
                metrics.highFindings,
                countBySeverity(
                    findings,
                    'High'
                ),
                0
            ),

        blockingFindings:
            firstFiniteNumber(
                metrics.blockingFindings,
                findings.filter(
                    (finding) =>
                        Boolean(
                            finding.blocking
                        )
                ).length,
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
                'None'
            ),

        lowestCategoryScore:
            firstFiniteNumber(
                metrics.lowestCategoryScore,
                100
            ),

        highestRiskCategory:
            firstValue(
                metrics.highestRiskCategory,
                'None'
            ),

        highestRiskLevel:
            firstValue(
                metrics.highestRiskLevel,
                'None'
            ),

        detailedObjectCount:
            firstFiniteNumber(
                analysis
                    ?.metadataCounts
                    ?.objects,
                analysis
                    ?.dailyBrief
                    ?.scanCoverage
                    ?.detailedObjectCount,
                0
            ),

        fieldCount:
            firstFiniteNumber(
                analysis
                    ?.metadataCounts
                    ?.fields,
                0
            ),

        generatedAt:
            firstValue(
                analysis.generatedAt,
                new Date().toISOString()
            ),

        serviceVersion:
            firstValue(
                analysis.serviceVersion
            )
    };
}

export function buildTrendComparison(
    currentAnalysis = {},
    previousAnalysis = null
) {
    const current =
        createTrendSnapshot(
            currentAnalysis
        );

    const previous =
        previousAnalysis
            ? normalizeTrendSnapshot(
                  previousAnalysis
              )
            : null;

    if (!previous) {
        return {
            hasPrevious: false,

            current,

            previous: null,

            differences:
                createEmptyDifferences(),

            labels: {
                health:
                    'First tracked analysis',

                deployment:
                    'First tracked analysis',

                findings:
                    'First tracked analysis',

                recommendations:
                    'First tracked analysis',

                blockers:
                    'First tracked analysis'
            },

            direction: {
                health:
                    'neutral',

                deployment:
                    'neutral',

                findings:
                    'neutral',

                recommendations:
                    'neutral',

                blockers:
                    'neutral'
            },

            generatedAt:
                current.generatedAt
        };
    }

    const differences = {
        health:
            current.orgHealthScore -
            previous.orgHealthScore,

        deployment:
            current.deploymentScore -
            previous.deploymentScore,

        findings:
            current.totalFindings -
            previous.totalFindings,

        criticalFindings:
            current.criticalFindings -
            previous.criticalFindings,

        highFindings:
            current.highFindings -
            previous.highFindings,

        blockers:
            current.blockingFindings -
            previous.blockingFindings,

        recommendations:
            current.totalRecommendations -
            previous.totalRecommendations,

        detailedObjects:
            current.detailedObjectCount -
            previous.detailedObjectCount,

        fields:
            current.fieldCount -
            previous.fieldCount
    };

    return {
        hasPrevious: true,

        current,

        previous,

        differences,

        labels: {
            health:
                formatScoreTrend(
                    differences.health
                ),

            deployment:
                formatScoreTrend(
                    differences.deployment
                ),

            findings:
                formatCountTrend(
                    differences.findings,
                    'finding',
                    'findings',
                    {
                        lowerIsBetter: true
                    }
                ),

            recommendations:
                formatCountTrend(
                    differences.recommendations,
                    'recommendation',
                    'recommendations'
                ),

            blockers:
                formatCountTrend(
                    differences.blockers,
                    'blocker',
                    'blockers',
                    {
                        lowerIsBetter: true
                    }
                ),

            criticalFindings:
                formatCountTrend(
                    differences.criticalFindings,
                    'critical finding',
                    'critical findings',
                    {
                        lowerIsBetter: true
                    }
                ),

            highFindings:
                formatCountTrend(
                    differences.highFindings,
                    'high finding',
                    'high findings',
                    {
                        lowerIsBetter: true
                    }
                ),

            detailedObjects:
                formatCountTrend(
                    differences.detailedObjects,
                    'object',
                    'objects'
                ),

            fields:
                formatCountTrend(
                    differences.fields,
                    'field',
                    'fields'
                )
        },

        direction: {
            health:
                getDirection(
                    differences.health
                ),

            deployment:
                getDirection(
                    differences.deployment
                ),

            findings:
                getDirection(
                    differences.findings,
                    true
                ),

            recommendations:
                getDirection(
                    differences.recommendations
                ),

            blockers:
                getDirection(
                    differences.blockers,
                    true
                ),

            criticalFindings:
                getDirection(
                    differences.criticalFindings,
                    true
                ),

            highFindings:
                getDirection(
                    differences.highFindings,
                    true
                )
        },

        generatedAt:
            current.generatedAt
    };
}

export function saveTrendSnapshot(
    analysis = {},
    storageKey = TREND_STORAGE_KEY
) {
    const snapshot =
        createTrendSnapshot(
            analysis
        );

    const storage =
        getStorage();

    if (!storage) {
        return {
            success: false,

            snapshot,

            message:
                'Browser storage is unavailable.'
        };
    }

    try {
        storage.setItem(
            storageKey,
            JSON.stringify(snapshot)
        );

        return {
            success: true,

            snapshot,

            message:
                'Trend snapshot saved.'
        };
    } catch (error) {
        return {
            success: false,

            snapshot,

            message:
                getErrorMessage(error)
        };
    }
}

export function loadTrendSnapshot(
    storageKey = TREND_STORAGE_KEY
) {
    const storage =
        getStorage();

    if (!storage) {
        return null;
    }

    try {
        const storedValue =
            storage.getItem(
                storageKey
            );

        if (!storedValue) {
            return null;
        }

        return normalizeTrendSnapshot(
            JSON.parse(storedValue)
        );
    } catch (error) {
        return null;
    }
}

export function clearTrendSnapshot(
    storageKey = TREND_STORAGE_KEY
) {
    const storage =
        getStorage();

    if (!storage) {
        return false;
    }

    try {
        storage.removeItem(
            storageKey
        );

        return true;
    } catch (error) {
        return false;
    }
}

export function rotateTrendSnapshot({
    currentAnalysis = {},
    previousSnapshot = null,
    storageKey = TREND_STORAGE_KEY
} = {}) {
    const currentSnapshot =
        createTrendSnapshot(
            currentAnalysis
        );

    const comparison =
        buildTrendComparison(
            currentAnalysis,
            previousSnapshot
        );

    const saveResult =
        saveTrendSnapshot(
            currentAnalysis,
            storageKey
        );

    return {
        currentSnapshot,

        previousSnapshot:
            previousSnapshot
                ? normalizeTrendSnapshot(
                      previousSnapshot
                  )
                : null,

        comparison,

        saved:
            saveResult.success,

        saveMessage:
            saveResult.message
    };
}

export function normalizeTrendSnapshot(
    snapshot = {}
) {
    if (
        !snapshot ||
        typeof snapshot !== 'object'
    ) {
        return null;
    }

    return {
        orgHealthScore:
            firstFiniteNumber(
                snapshot.orgHealthScore,
                0
            ),

        orgHealthStatus:
            firstValue(
                snapshot.orgHealthStatus,
                'Unknown'
            ),

        deploymentScore:
            firstFiniteNumber(
                snapshot.deploymentScore,
                0
            ),

        deploymentStatus:
            firstValue(
                snapshot.deploymentStatus,
                'Unknown'
            ),

        totalFindings:
            firstFiniteNumber(
                snapshot.totalFindings,
                0
            ),

        criticalFindings:
            firstFiniteNumber(
                snapshot.criticalFindings,
                0
            ),

        highFindings:
            firstFiniteNumber(
                snapshot.highFindings,
                0
            ),

        blockingFindings:
            firstFiniteNumber(
                snapshot.blockingFindings,
                0
            ),

        totalRecommendations:
            firstFiniteNumber(
                snapshot.totalRecommendations,
                0
            ),

        lowestCategory:
            firstValue(
                snapshot.lowestCategory,
                'None'
            ),

        lowestCategoryScore:
            firstFiniteNumber(
                snapshot.lowestCategoryScore,
                100
            ),

        highestRiskCategory:
            firstValue(
                snapshot.highestRiskCategory,
                'None'
            ),

        highestRiskLevel:
            firstValue(
                snapshot.highestRiskLevel,
                'None'
            ),

        detailedObjectCount:
            firstFiniteNumber(
                snapshot.detailedObjectCount,
                0
            ),

        fieldCount:
            firstFiniteNumber(
                snapshot.fieldCount,
                0
            ),

        generatedAt:
            firstValue(
                snapshot.generatedAt
            ),

        serviceVersion:
            firstValue(
                snapshot.serviceVersion
            )
    };
}

export function formatScoreTrend(
    difference = 0
) {
    const normalizedDifference =
        toNumber(
            difference
        );

    if (normalizedDifference === 0) {
        return 'No change';
    }

    if (normalizedDifference > 0) {
        return `+${normalizedDifference} points`;
    }

    return `${normalizedDifference} points`;
}

export function formatCountTrend(
    difference = 0,
    singularLabel = 'item',
    pluralLabel = 'items',
    {
        lowerIsBetter = false
    } = {}
) {
    const normalizedDifference =
        toNumber(
            difference
        );

    if (normalizedDifference === 0) {
        return 'No change';
    }

    const absoluteDifference =
        Math.abs(
            normalizedDifference
        );

    const label =
        absoluteDifference === 1
            ? singularLabel
            : pluralLabel;

    const prefix =
        normalizedDifference > 0
            ? '+'
            : '-';

    const directionLabel =
        lowerIsBetter
            ? normalizedDifference < 0
                ? ' improved'
                : ' increased'
            : '';

    return `${prefix}${absoluteDifference} ${label}${directionLabel}`;
}

export function getDirection(
    difference = 0,
    lowerIsBetter = false
) {
    const normalizedDifference =
        toNumber(
            difference
        );

    if (normalizedDifference === 0) {
        return 'neutral';
    }

    if (lowerIsBetter) {
        return normalizedDifference < 0
            ? 'positive'
            : 'negative';
    }

    return normalizedDifference > 0
        ? 'positive'
        : 'negative';
}

export function isTrendImprovement(
    difference = 0,
    lowerIsBetter = false
) {
    return (
        getDirection(
            difference,
            lowerIsBetter
        ) === 'positive'
    );
}

export function isTrendDecline(
    difference = 0,
    lowerIsBetter = false
) {
    return (
        getDirection(
            difference,
            lowerIsBetter
        ) === 'negative'
    );
}

function createEmptyDifferences() {
    return {
        health: 0,
        deployment: 0,
        findings: 0,
        criticalFindings: 0,
        highFindings: 0,
        blockers: 0,
        recommendations: 0,
        detailedObjects: 0,
        fields: 0
    };
}

function countBySeverity(
    findings = [],
    severity = ''
) {
    return normalizeArray(
        findings
    ).filter(
        (finding) =>
            String(
                finding.severity || ''
            ).toLowerCase() ===
            String(
                severity || ''
            ).toLowerCase()
    ).length;
}

function getStorage() {
    try {
        if (
            typeof window === 'undefined' ||
            !window.localStorage
        ) {
            return null;
        }

        return window.localStorage;
    } catch (error) {
        return null;
    }
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
    return (
        value &&
        typeof value === 'object' &&
        !Array.isArray(value)
    )
        ? { ...value }
        : {};
}

function getErrorMessage(
    error
) {
    if (!error) {
        return 'An unknown trend-storage error occurred.';
    }

    if (
        typeof error.message ===
        'string'
    ) {
        return error.message;
    }

    return 'The trend snapshot could not be saved.';
}

const trendService = {
    createTrendSnapshot,
    buildTrendComparison,
    saveTrendSnapshot,
    loadTrendSnapshot,
    clearTrendSnapshot,
    rotateTrendSnapshot,
    normalizeTrendSnapshot,
    formatScoreTrend,
    formatCountTrend,
    getDirection,
    isTrendImprovement,
    isTrendDecline
};

export default trendService;