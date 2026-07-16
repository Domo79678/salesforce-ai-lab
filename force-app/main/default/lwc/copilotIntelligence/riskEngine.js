/*
 * riskEngine.js
 *
 * Salesforce Copilot Risk Intelligence Engine
 *
 * Evaluates business, technical, security, data-quality,
 * dependency, maintenance, and deployment risk.
 *
 * This engine is deterministic. It does not retrieve metadata.
 */

import {
    ENTITY_TYPES,
    createRisk,
    createStableId
} from './intelligenceModels';

export const RISK_ENGINE_VERSION = '2.0';

export const RISK_CATEGORIES = Object.freeze({
    BUSINESS: 'Business',
    TECHNICAL: 'Technical',
    SECURITY: 'Security',
    DATA_QUALITY: 'Data Quality',
    AUTOMATION: 'Automation',
    DEPENDENCY: 'Dependency',
    DOCUMENTATION: 'Documentation',
    MAINTENANCE: 'Maintenance',
    DEPLOYMENT: 'Deployment'
});

export const RISK_LEVELS = Object.freeze({
    NONE: 'None',
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
    CRITICAL: 'Critical'
});

const SEVERITY_WEIGHTS = Object.freeze({
    None: 0,
    Low: 5,
    Medium: 12,
    High: 22,
    Critical: 35
});

export function analyzeEntityRisk({
    entityContext = {},
    knowledgeAnalysis = {},
    dependencies = [],
    metadataSnapshot = {}
} = {}) {
    if (!entityContext?.found) {
        return createRiskAnalysisFailure(
            'A resolved metadata entity is required for risk analysis.'
        );
    }

    const risks = [
        ...buildKnowledgeRisks(
            entityContext,
            knowledgeAnalysis
        ),
        ...buildEntityRisks(entityContext),
        ...buildDependencyRisks(
            entityContext,
            dependencies
        ),
        ...buildCoverageRisks(metadataSnapshot)
    ];

    const normalizedRisks =
        deduplicateRisks(risks);

    const categoryScores =
        calculateCategoryScores(
            normalizedRisks
        );

    const score =
        calculateOverallRiskScore(
            normalizedRisks
        );

    const level =
        getRiskLevel(score);

    const blockingRisks =
        normalizedRisks.filter(
            (risk) =>
                risk.blocking ||
                risk.severity ===
                    RISK_LEVELS.CRITICAL
        );

    return {
        success: true,

        version:
            RISK_ENGINE_VERSION,

        score,

        level,

        safeToChange:
            !blockingRisks.length &&
            score < 60,

        deploymentBlocked:
            blockingRisks.length > 0,

        riskCount:
            normalizedRisks.length,

        blockingCount:
            blockingRisks.length,

        risks:
            sortRisks(
                normalizedRisks
            ),

        categoryScores,

        summary:
            buildRiskSummary({
                entityContext,
                risks:
                    normalizedRisks,
                score,
                level,
                blockingRisks
            }),

        recommendations:
            buildRiskRecommendations(
                normalizedRisks
            ),

        generatedAt:
            new Date().toISOString()
    };
}

export function determineEntityCriticality(
    entityContext = {}
) {
    const entityType =
        entityContext.entityType;

    const entity =
        entityContext.entity || {};

    if (
        entityType ===
            ENTITY_TYPES.FIELD &&
        (
            entity.required ||
            entity.unique ||
            entity.externalId ||
            entity.calculated
        )
    ) {
        return RISK_LEVELS.HIGH;
    }

    if (
        entityType ===
            ENTITY_TYPES.FLOW &&
        entity.status === 'Active'
    ) {
        return RISK_LEVELS.HIGH;
    }

    if (
        entityType ===
            ENTITY_TYPES.APEX_TRIGGER
    ) {
        return RISK_LEVELS.HIGH;
    }

    if (
        entityType ===
            ENTITY_TYPES.VALIDATION_RULE &&
        entity.active !== false
    ) {
        return RISK_LEVELS.MEDIUM;
    }

    if (
        entityType ===
            ENTITY_TYPES.PERMISSION_SET
    ) {
        return RISK_LEVELS.MEDIUM;
    }

    return RISK_LEVELS.LOW;
}

export function calculateOverallRiskScore(
    risks = []
) {
    const rawScore =
        normalizeArray(risks).reduce(
            (total, risk) => {
                const severityWeight =
                    SEVERITY_WEIGHTS[
                        normalizeSeverity(
                            risk.severity
                        )
                    ] || 0;

                const blockingWeight =
                    risk.blocking
                        ? 20
                        : 0;

                const impactWeight =
                    Math.max(
                        0,
                        safeNumber(
                            risk.scoreImpact
                        )
                    );

                return (
                    total +
                    severityWeight +
                    blockingWeight +
                    impactWeight
                );
            },
            0
        );

    return Math.min(
        100,
        Math.round(rawScore)
    );
}

export function getRiskLevel(
    score = 0
) {
    const normalizedScore =
        Math.max(
            0,
            Math.min(
                100,
                safeNumber(score)
            )
        );

    if (normalizedScore >= 80) {
        return RISK_LEVELS.CRITICAL;
    }

    if (normalizedScore >= 55) {
        return RISK_LEVELS.HIGH;
    }

    if (normalizedScore >= 30) {
        return RISK_LEVELS.MEDIUM;
    }

    if (normalizedScore > 0) {
        return RISK_LEVELS.LOW;
    }

    return RISK_LEVELS.NONE;
}

export function calculateCategoryScores(
    risks = []
) {
    const scores = {};

    normalizeArray(risks).forEach(
        (risk) => {
            const category =
                safeString(
                    risk.category,
                    RISK_CATEGORIES.TECHNICAL
                );

            const severityWeight =
                SEVERITY_WEIGHTS[
                    normalizeSeverity(
                        risk.severity
                    )
                ] || 0;

            scores[category] =
                Math.min(
                    100,
                    (
                        scores[category] ||
                        0
                    ) +
                    severityWeight +
                    (
                        risk.blocking
                            ? 15
                            : 0
                    )
                );
        }
    );

    return Object.keys(scores)
        .sort()
        .map(
            (category) => ({
                category,

                score:
                    scores[category],

                level:
                    getRiskLevel(
                        scores[category]
                    )
            })
        );
}

function buildKnowledgeRisks(
    entityContext,
    knowledgeAnalysis
) {
    const risks = [];

    normalizeArray(
        entityContext
            ?.knowledgeExplanation
            ?.findings
    ).forEach(
        (finding) => {
            risks.push(
                mapFindingToRisk(
                    finding,
                    entityContext
                        .entityApiName
                )
            );
        }
    );

    normalizeArray(
        knowledgeAnalysis
            ?.findings
    )
        .filter(
            (finding) =>
                equalsIgnoreCase(
                    finding
                        .entityApiName,
                    entityContext
                        .entityApiName
                )
        )
        .forEach(
            (finding) => {
                risks.push(
                    mapFindingToRisk(
                        finding,
                        entityContext
                            .entityApiName
                    )
                );
            }
        );

    return risks;
}

function buildEntityRisks(
    entityContext
) {
    const entity =
        entityContext.entity || {};

    const risks = [];

    if (
        entityContext.entityType ===
            ENTITY_TYPES.FIELD
    ) {
        if (
            !safeString(
                entity
                    ?.metadata
                    ?.description,
                entity.description
            )
        ) {
            risks.push(
                createRisk({
                    id:
                        createStableId(
                            `${entityContext.entityApiName}-missing-description`
                        ),

                    title:
                        `${entityContext.entityLabel} has no confirmed business description`,

                    description:
                        'The connected metadata does not contain a formal administrator description for this field.',

                    severity:
                        RISK_LEVELS.LOW,

                    category:
                        RISK_CATEGORIES.DOCUMENTATION,

                    entityApiName:
                        entityContext.entityApiName,

                    scoreImpact:
                        2,

                    recommendation:
                        'Document the business purpose, data owner, expected values, reporting use, and downstream dependencies.'
                })
            );
        }

        if (entity.required) {
            risks.push(
                createRisk({
                    title:
                        `${entityContext.entityLabel} is required`,

                    description:
                        'Changes to required-field behavior may prevent record creation, integrations, imports, or automation from completing.',

                    severity:
                        RISK_LEVELS.HIGH,

                    category:
                        RISK_CATEGORIES.BUSINESS,

                    entityApiName:
                        entityContext.entityApiName,

                    scoreImpact:
                        8,

                    recommendation:
                        'Test UI entry, API integrations, imports, automation, and existing records before changing required-field behavior.'
                })
            );
        }

        if (entity.unique) {
            risks.push(
                createRisk({
                    title:
                        `${entityContext.entityLabel} enforces uniqueness`,

                    description:
                        'Changing uniqueness may introduce duplicate values or prevent valid data loads.',

                    severity:
                        RISK_LEVELS.HIGH,

                    category:
                        RISK_CATEGORIES.DATA_QUALITY,

                    entityApiName:
                        entityContext.entityApiName,

                    scoreImpact:
                        8,

                    recommendation:
                        'Profile existing values, test imports, and confirm the approved duplicate-prevention requirement.'
                })
            );
        }

        if (entity.externalId) {
            risks.push(
                createRisk({
                    title:
                        `${entityContext.entityLabel} is an External ID`,

                    description:
                        'External ID fields may be used by integrations, upsert operations, migration scripts, and middleware.',

                    severity:
                        RISK_LEVELS.HIGH,

                    category:
                        RISK_CATEGORIES.DEPENDENCY,

                    entityApiName:
                        entityContext.entityApiName,

                    scoreImpact:
                        10,

                    recommendation:
                        'Confirm every integration and data-migration process that uses this field before making changes.'
                })
            );
        }

        if (entity.calculated) {
            risks.push(
                createRisk({
                    title:
                        `${entityContext.entityLabel} is calculated`,

                    description:
                        'Formula or calculated logic can affect reports, automation, filters, integrations, and dependent formulas.',

                    severity:
                        RISK_LEVELS.MEDIUM,

                    category:
                        RISK_CATEGORIES.TECHNICAL,

                    entityApiName:
                        entityContext.entityApiName,

                    scoreImpact:
                        5,

                    recommendation:
                        'Review the calculation logic and test downstream reporting, automation, and integrations.'
                })
            );
        }
    }

    if (
        entityContext.entityType ===
            ENTITY_TYPES.FLOW
    ) {
        if (
            entity.status ===
                'Active' &&
            !entity.hasFaultPaths
        ) {
            risks.push(
                createRisk({
                    title:
                        `${entityContext.entityLabel} has no confirmed fault paths`,

                    description:
                        'Unhandled Flow failures may create poor user experiences and incomplete business transactions.',

                    severity:
                        RISK_LEVELS.HIGH,

                    category:
                        RISK_CATEGORIES.AUTOMATION,

                    entityApiName:
                        entityContext.entityApiName,

                    scoreImpact:
                        10,

                    recommendation:
                        'Add fault connectors, log meaningful errors, notify support users, and test failure conditions.'
                })
            );
        }

        if (
            safeNumber(
                entity.loopCount
            ) > 0
        ) {
            risks.push(
                createRisk({
                    title:
                        `${entityContext.entityLabel} contains loops`,

                    description:
                        'Loops can increase transaction cost and create governor-limit risk when database operations occur inside the loop.',

                    severity:
                        RISK_LEVELS.MEDIUM,

                    category:
                        RISK_CATEGORIES.AUTOMATION,

                    entityApiName:
                        entityContext.entityApiName,

                    scoreImpact:
                        5,

                    recommendation:
                        'Confirm the Flow is bulk-safe and that database operations occur outside loops.'
                })
            );
        }
    }

    if (
        entityContext.entityType ===
            ENTITY_TYPES.VALIDATION_RULE &&
        entity.active === false
    ) {
        risks.push(
            createRisk({
                title:
                    `${entityContext.entityLabel} is inactive`,

                description:
                    'The intended data-quality or business requirement is not currently being enforced.',

                severity:
                    RISK_LEVELS.MEDIUM,

                category:
                    RISK_CATEGORIES.DATA_QUALITY,

                entityApiName:
                    entityContext.entityApiName,

                scoreImpact:
                    6,

                recommendation:
                    'Confirm whether the rule is intentionally disabled, obsolete, or waiting for remediation.'
            })
        );
    }

    if (
        entityContext.entityType ===
            ENTITY_TYPES.DUPLICATE_RULE &&
        entity.active === false
    ) {
        risks.push(
            createRisk({
                title:
                    `${entityContext.entityLabel} is inactive`,

                description:
                    'Potential duplicate records may no longer be blocked or surfaced to users.',

                severity:
                    RISK_LEVELS.HIGH,

                category:
                    RISK_CATEGORIES.DATA_QUALITY,

                entityApiName:
                    entityContext.entityApiName,

                scoreImpact:
                    8,

                recommendation:
                    'Review matching behavior, duplicate volume, user impact, and the approved data-governance policy.'
            })
        );
    }

    if (
        entityContext.entityType ===
            ENTITY_TYPES.APEX_CLASS &&
        entity.hasTestClass === false
    ) {
        risks.push(
            createRisk({
                title:
                    `${entityContext.entityLabel} has no confirmed test class`,

                description:
                    'Unverified Apex logic increases deployment, regression, and maintenance risk.',

                severity:
                    RISK_LEVELS.HIGH,

                category:
                    RISK_CATEGORIES.DEPLOYMENT,

                entityApiName:
                    entityContext.entityApiName,

                scoreImpact:
                    10,

                recommendation:
                    'Add focused Apex tests covering positive, negative, bulk, permission, and failure scenarios.'
            })
        );
    }

    return risks;
}

function buildDependencyRisks(
    entityContext,
    dependencies
) {
    const normalizedDependencies =
        normalizeArray(
            dependencies
        );

    if (!normalizedDependencies.length) {
        return [];
    }

    const count =
        normalizedDependencies.length;

    const severity =
        count >= 15
            ? RISK_LEVELS.HIGH
            : count >= 5
              ? RISK_LEVELS.MEDIUM
              : RISK_LEVELS.LOW;

    return [
        createRisk({
            title:
                `${entityContext.entityLabel} has ${count} confirmed dependencies`,

            description:
                'Changes may affect related metadata components, user access, automation, reporting, integrations, or business processes.',

            severity,

            category:
                RISK_CATEGORIES.DEPENDENCY,

            entityApiName:
                entityContext.entityApiName,

            scoreImpact:
                Math.min(
                    10,
                    count
                ),

            recommendation:
                'Review every confirmed dependency and complete targeted regression testing before deployment.'
        })
    ];
}

function buildCoverageRisks(
    metadataSnapshot
) {
    const partialCoverage =
        metadataSnapshot
            ?.coverageStatus ===
            'partial' ||
        metadataSnapshot
            ?.coverage
            ?.status ===
            'partial';

    if (!partialCoverage) {
        return [];
    }

    return [
        createRisk({
            title:
                'Metadata coverage is partial',

            description:
                'Some setup metadata categories are unavailable, so additional dependencies or risks may exist outside the current analysis.',

            severity:
                RISK_LEVELS.LOW,

            category:
                RISK_CATEGORIES.MAINTENANCE,

            entityApiName:
                'Organization',

            scoreImpact:
                3,

            recommendation:
                'Treat the analysis as directional until Flow, Validation Rule, Apex, Permission Set, report, and dashboard coverage is complete.'
        })
    ];
}

function buildRiskSummary({
    entityContext,
    risks,
    score,
    level,
    blockingRisks
}) {
    if (!risks.length) {
        return (
            `${entityContext.entityLabel} has no confirmed ` +
            'entity-specific risks in the metadata currently available.'
        );
    }

    return (
        `${entityContext.entityLabel} has ${risks.length} confirmed ` +
        `risk${risks.length === 1 ? '' : 's'}, an overall risk score ` +
        `of ${score}/100, and a ${level.toLowerCase()} risk level. ` +
        `${blockingRisks.length} blocking risk` +
        `${blockingRisks.length === 1 ? '' : 's'} were identified.`
    );
}

function buildRiskRecommendations(
    risks
) {
    return deduplicateStrings(
        normalizeArray(risks)
            .map(
                (risk) =>
                    safeString(
                        risk.recommendation
                    )
            )
            .filter(Boolean)
    );
}

function mapFindingToRisk(
    finding,
    fallbackEntityApiName
) {
    return createRisk({
        id:
            finding.id,

        title:
            finding.title,

        description:
            finding.summary ||
            finding.description,

        severity:
            normalizeSeverity(
                finding.severity
            ),

        category:
            finding.category,

        entityApiName:
            finding.entityApiName ||
            fallbackEntityApiName,

        blocking:
            Boolean(
                finding.blocking
            ),

        scoreImpact:
            finding.scoreImpact,

        recommendation:
            finding.recommendation,

        evidence:
            finding.evidence
    });
}

function createRiskAnalysisFailure(
    message
) {
    return {
        success: false,

        version:
            RISK_ENGINE_VERSION,

        score: 0,

        level:
            RISK_LEVELS.NONE,

        safeToChange: false,

        deploymentBlocked: false,

        riskCount: 0,

        blockingCount: 0,

        risks: [],

        categoryScores: [],

        summary: message,

        recommendations: [],

        errors: [
            {
                name:
                    'RiskEngineError',

                message
            }
        ],

        generatedAt:
            new Date().toISOString()
    };
}

function sortRisks(
    risks
) {
    const order = {
        Critical: 1,
        High: 2,
        Medium: 3,
        Low: 4,
        None: 5
    };

    return [...risks].sort(
        (first, second) => {
            const severityDifference =
                (
                    order[
                        normalizeSeverity(
                            first.severity
                        )
                    ] || 99
                ) -
                (
                    order[
                        normalizeSeverity(
                            second.severity
                        )
                    ] || 99
                );

            if (severityDifference) {
                return severityDifference;
            }

            return safeString(
                first.title
            ).localeCompare(
                safeString(
                    second.title
                )
            );
        }
    );
}

function deduplicateRisks(
    risks
) {
    const seen =
        new Set();

    return normalizeArray(risks)
        .filter(Boolean)
        .filter(
            (risk) => {
                const key =
                    risk.id ||
                    createStableId(
                        `${risk.entityApiName}-${risk.category}-${risk.title}`
                    );

                if (seen.has(key)) {
                    return false;
                }

                seen.add(key);

                return true;
            }
        );
}

function deduplicateStrings(
    values
) {
    return Array.from(
        new Set(
            normalizeArray(values)
                .map(
                    (value) =>
                        safeString(value)
                )
                .filter(Boolean)
        )
    );
}

function normalizeSeverity(
    severity
) {
    const normalized =
        safeString(
            severity
        ).toLowerCase();

    if (normalized === 'critical') {
        return RISK_LEVELS.CRITICAL;
    }

    if (normalized === 'high') {
        return RISK_LEVELS.HIGH;
    }

    if (normalized === 'medium') {
        return RISK_LEVELS.MEDIUM;
    }

    if (normalized === 'low') {
        return RISK_LEVELS.LOW;
    }

    return RISK_LEVELS.NONE;
}

function equalsIgnoreCase(
    first,
    second
) {
    return (
        safeString(first)
            .toLowerCase() ===
        safeString(second)
            .toLowerCase()
    );
}

function safeString(
    value,
    fallback = ''
) {
    if (
        value === null ||
        value === undefined
    ) {
        return fallback;
    }

    const normalized =
        String(value).trim();

    return normalized || fallback;
}

function safeNumber(
    value,
    fallback = 0
) {
    const normalized =
        Number(value);

    return Number.isFinite(
        normalized
    )
        ? normalized
        : fallback;
}

function normalizeArray(
    value
) {
    return Array.isArray(value)
        ? value
        : [];
}

export default {
    analyzeEntityRisk,
    determineEntityCriticality,
    calculateOverallRiskScore,
    calculateCategoryScores,
    getRiskLevel
};