/*
 * knowledgeModels.js
 *
 * Shared data models for the Salesforce Copilot
 * Org Knowledge Layer.
 *
 * These models provide consistent structures for:
 * - organizations
 * - objects
 * - fields
 * - relationships
 * - findings
 * - recommendations
 * - health scores
 * - deployment readiness
 */

export const ENTITY_TYPES = Object.freeze({
    ORGANIZATION: 'organization',
    OBJECT: 'object',
    FIELD: 'field',
    RELATIONSHIP: 'relationship',
    RECORD_TYPE: 'recordType',
    FLOW: 'flow',
    VALIDATION_RULE: 'validationRule',
    APEX: 'apex',
    PERMISSION_SET: 'permissionSet',
    REPORT: 'report',
    DASHBOARD: 'dashboard',
    DEPLOYMENT: 'deployment',
    UNKNOWN: 'unknown'
});

export const HEALTH_CATEGORIES = Object.freeze({
    AUTOMATION: 'Automation',
    SECURITY: 'Security',
    DATA_MODEL: 'Data Model',
    METADATA: 'Metadata',
    DOCUMENTATION: 'Documentation',
    TESTING: 'Testing',
    PERFORMANCE: 'Performance',
    DEPLOYMENT: 'Deployment Readiness'
});

export const SEVERITY_LEVELS = Object.freeze({
    CRITICAL: 'Critical',
    HIGH: 'High',
    MEDIUM: 'Medium',
    LOW: 'Low',
    INFORMATIONAL: 'Informational'
});

export const RISK_LEVELS = Object.freeze({
    CRITICAL: 'Critical',
    HIGH: 'High',
    MEDIUM: 'Medium',
    LOW: 'Low',
    NONE: 'None',
    UNKNOWN: 'Unknown'
});

export const READINESS_STATUSES = Object.freeze({
    READY: 'Ready',
    READY_WITH_WARNINGS: 'Ready with warnings',
    NOT_READY: 'Not ready',
    UNKNOWN: 'Unknown'
});

export const RECOMMENDATION_PRIORITIES = Object.freeze({
    IMMEDIATE: 'Immediate',
    HIGH: 'High',
    MEDIUM: 'Medium',
    LOW: 'Low',
    OPTIONAL: 'Optional'
});

export function createOrgKnowledgeModel({
    organization = {},
    objects = [],
    findings = [],
    recommendations = [],
    health = null,
    deploymentReadiness = null,
    generatedAt = null,
    serviceVersion = '1.0'
} = {}) {
    return {
        modelType: 'OrgKnowledgeModel',

        organization: {
            id: organization.id || '',
            name: organization.name || 'Unknown Organization',
            userName: organization.userName || '',
            userEmail: organization.userEmail || '',
            apiVersion: organization.apiVersion || '',
            locale: organization.locale || '',
            timeZone: organization.timeZone || '',
            totalObjects: toNumber(organization.totalObjects),
            standardObjects: toNumber(organization.standardObjects),
            customObjects: toNumber(organization.customObjects),
            queryableObjects: toNumber(organization.queryableObjects),
            accessibleObjects: toNumber(organization.accessibleObjects)
        },

        objects: normalizeArray(objects),

        findings: normalizeArray(findings),

        recommendations: normalizeArray(recommendations),

        health,

        deploymentReadiness,

        summary: {
            objectCount: normalizeArray(objects).length,
            findingCount: normalizeArray(findings).length,
            recommendationCount:
                normalizeArray(recommendations).length,
            criticalFindingCount:
                countFindingsBySeverity(
                    findings,
                    SEVERITY_LEVELS.CRITICAL
                ),
            highFindingCount:
                countFindingsBySeverity(
                    findings,
                    SEVERITY_LEVELS.HIGH
                )
        },

        generatedAt:
            generatedAt ||
            new Date().toISOString(),

        serviceVersion
    };
}

export function createObjectKnowledgeProfile({
    apiName = '',
    label = '',
    labelPlural = '',
    keyPrefix = '',
    custom = false,
    accessible = false,
    queryable = false,
    searchable = false,
    createable = false,
    updateable = false,
    deletable = false,
    fields = [],
    relationships = [],
    recordTypes = [],
    findings = [],
    recommendations = [],
    metadata = {}
} = {}) {
    const normalizedFields =
        normalizeArray(fields);

    const normalizedRelationships =
        normalizeArray(relationships);

    const normalizedRecordTypes =
        normalizeArray(recordTypes);

    return {
        entityType: ENTITY_TYPES.OBJECT,

        apiName,

        label:
            label ||
            apiName ||
            'Unknown Object',

        labelPlural:
            labelPlural ||
            label ||
            apiName ||
            'Unknown Objects',

        keyPrefix,

        custom: Boolean(custom),

        capabilities: {
            accessible: Boolean(accessible),
            queryable: Boolean(queryable),
            searchable: Boolean(searchable),
            createable: Boolean(createable),
            updateable: Boolean(updateable),
            deletable: Boolean(deletable)
        },

        counts: {
            fields: normalizedFields.length,
            relationships:
                normalizedRelationships.length,
            recordTypes:
                normalizedRecordTypes.length,
            customFields:
                normalizedFields.filter(
                    (field) => field.custom
                ).length,
            requiredFields:
                normalizedFields.filter(
                    (field) => field.required
                ).length,
            calculatedFields:
                normalizedFields.filter(
                    (field) => field.calculated
                ).length
        },

        complexity:
            determineObjectComplexity({
                fieldCount:
                    normalizedFields.length,
                relationshipCount:
                    normalizedRelationships.length,
                recordTypeCount:
                    normalizedRecordTypes.length
            }),

        riskLevel: RISK_LEVELS.UNKNOWN,

        fields: normalizedFields,

        relationships:
            normalizedRelationships,

        recordTypes:
            normalizedRecordTypes,

        findings:
            normalizeArray(findings),

        recommendations:
            normalizeArray(recommendations),

        metadata: {
            ...metadata
        }
    };
}

export function createFieldKnowledgeProfile({
    apiName = '',
    label = '',
    objectApiName = '',
    dataType = '',
    custom = false,
    required = false,
    unique = false,
    externalId = false,
    calculated = false,
    encrypted = false,
    accessible = false,
    createable = false,
    updateable = false,
    relationshipName = '',
    referenceTo = [],
    length = null,
    precision = null,
    scale = null,
    findings = [],
    recommendations = [],
    metadata = {}
} = {}) {
    const references =
        normalizeArray(referenceTo);

    return {
        entityType: ENTITY_TYPES.FIELD,

        apiName,

        label:
            label ||
            apiName ||
            'Unknown Field',

        objectApiName,

        qualifiedApiName:
            objectApiName && apiName
                ? `${objectApiName}.${apiName}`
                : apiName,

        dataType:
            dataType ||
            'Unknown',

        custom: Boolean(custom),

        required: Boolean(required),

        unique: Boolean(unique),

        externalId: Boolean(externalId),

        calculated: Boolean(calculated),

        encrypted: Boolean(encrypted),

        capabilities: {
            accessible: Boolean(accessible),
            createable: Boolean(createable),
            updateable: Boolean(updateable)
        },

        relationship: {
            isRelationship:
                references.length > 0 ||
                Boolean(relationshipName),
            relationshipName:
                relationshipName || '',
            referenceTo:
                references
        },

        constraints: {
            length:
                length === null
                    ? null
                    : toNumber(length),

            precision:
                precision === null
                    ? null
                    : toNumber(precision),

            scale:
                scale === null
                    ? null
                    : toNumber(scale)
        },

        riskLevel:
            determineFieldRisk({
                required,
                unique,
                externalId,
                calculated,
                encrypted,
                referenceTo: references
            }),

        findings:
            normalizeArray(findings),

        recommendations:
            normalizeArray(recommendations),

        metadata: {
            ...metadata
        }
    };
}

export function createRelationshipKnowledgeProfile({
    fieldApiName = '',
    fieldLabel = '',
    sourceObject = '',
    targetObjects = [],
    relationshipName = '',
    required = false,
    custom = false
} = {}) {
    return {
        entityType:
            ENTITY_TYPES.RELATIONSHIP,

        fieldApiName,

        fieldLabel:
            fieldLabel ||
            fieldApiName,

        sourceObject,

        targetObjects:
            normalizeArray(targetObjects),

        relationshipName,

        required: Boolean(required),

        custom: Boolean(custom),

        riskLevel:
            required
                ? RISK_LEVELS.MEDIUM
                : RISK_LEVELS.LOW
    };
}

export function createRecordTypeKnowledgeProfile({
    id = '',
    developerName = '',
    name = '',
    active = false,
    defaultRecordTypeMapping = false,
    available = false,
    master = false
} = {}) {
    return {
        entityType:
            ENTITY_TYPES.RECORD_TYPE,

        id,

        developerName,

        name:
            name ||
            developerName ||
            'Unknown Record Type',

        active: Boolean(active),

        defaultRecordTypeMapping:
            Boolean(defaultRecordTypeMapping),

        available: Boolean(available),

        master: Boolean(master),

        riskLevel:
            active && !available
                ? RISK_LEVELS.MEDIUM
                : RISK_LEVELS.LOW
    };
}

export function createFinding({
    id = '',
    category = HEALTH_CATEGORIES.METADATA,
    title = '',
    summary = '',
    severity = SEVERITY_LEVELS.INFORMATIONAL,
    riskLevel = RISK_LEVELS.UNKNOWN,
    scoreImpact = 0,
    evidence = [],
    recommendation = '',
    entityType = ENTITY_TYPES.UNKNOWN,
    entityApiName = '',
    blocking = false,
    source = 'Org Knowledge Layer'
} = {}) {
    return {
        id:
            id ||
            createModelId(
                'finding',
                title
            ),

        category,

        title:
            title ||
            'Knowledge Finding',

        summary,

        severity,

        riskLevel,

        scoreImpact:
            Math.max(
                0,
                toNumber(scoreImpact)
            ),

        evidence:
            normalizeArray(evidence),

        recommendation,

        entityType,

        entityApiName,

        blocking:
            Boolean(blocking),

        source
    };
}

export function createRecommendation({
    id = '',
    title = '',
    description = '',
    priority = RECOMMENDATION_PRIORITIES.MEDIUM,
    category = HEALTH_CATEGORIES.METADATA,
    action = '',
    rationale = '',
    relatedFindingIds = [],
    entityType = ENTITY_TYPES.UNKNOWN,
    entityApiName = ''
} = {}) {
    return {
        id:
            id ||
            createModelId(
                'recommendation',
                title
            ),

        title:
            title ||
            'Recommended Action',

        description,

        priority,

        category,

        action,

        rationale,

        relatedFindingIds:
            normalizeArray(
                relatedFindingIds
            ),

        entityType,

        entityApiName
    };
}

export function createHealthCategoryResult({
    category = HEALTH_CATEGORIES.METADATA,
    score = 100,
    status = 'Healthy',
    findings = [],
    recommendations = []
} = {}) {
    const normalizedScore =
        clampScore(score);

    return {
        category,

        score:
            normalizedScore,

        status:
            status ||
            getHealthStatus(
                normalizedScore
            ),

        findings:
            normalizeArray(findings),

        recommendations:
            normalizeArray(
                recommendations
            ),

        findingCount:
            normalizeArray(findings).length
    };
}

export function createHealthSummary({
    overallScore = 100,
    categories = [],
    findings = [],
    recommendations = []
} = {}) {
    const normalizedScore =
        clampScore(overallScore);

    return {
        overallScore:
            normalizedScore,

        status:
            getHealthStatus(
                normalizedScore
            ),

        categories:
            normalizeArray(categories),

        findings:
            normalizeArray(findings),

        recommendations:
            normalizeArray(
                recommendations
            ),

        criticalFindings:
            countFindingsBySeverity(
                findings,
                SEVERITY_LEVELS.CRITICAL
            ),

        highFindings:
            countFindingsBySeverity(
                findings,
                SEVERITY_LEVELS.HIGH
            )
    };
}

export function createDeploymentReadinessResult({
    score = 100,
    status = READINESS_STATUSES.UNKNOWN,
    blockingFindings = [],
    warnings = [],
    requiredTests = [],
    recommendations = [],
    rollbackRequired = true
} = {}) {
    const normalizedScore =
        clampScore(score);

    return {
        score:
            normalizedScore,

        status:
            status ===
            READINESS_STATUSES.UNKNOWN
                ? determineReadinessStatus({
                      score:
                          normalizedScore,
                      blockingCount:
                          normalizeArray(
                              blockingFindings
                          ).length
                  })
                : status,

        blockingFindings:
            normalizeArray(
                blockingFindings
            ),

        warnings:
            normalizeArray(warnings),

        requiredTests:
            normalizeArray(
                requiredTests
            ),

        recommendations:
            normalizeArray(
                recommendations
            ),

        rollbackRequired:
            Boolean(rollbackRequired),

        generatedAt:
            new Date().toISOString()
    };
}

export function determineObjectComplexity({
    fieldCount = 0,
    relationshipCount = 0,
    recordTypeCount = 0
} = {}) {
    const complexityScore =
        toNumber(fieldCount) +
        toNumber(relationshipCount) * 3 +
        toNumber(recordTypeCount) * 5;

    if (complexityScore >= 150) {
        return 'Very High';
    }

    if (complexityScore >= 90) {
        return 'High';
    }

    if (complexityScore >= 40) {
        return 'Medium';
    }

    return 'Low';
}

export function determineFieldRisk({
    required = false,
    unique = false,
    externalId = false,
    calculated = false,
    encrypted = false,
    referenceTo = []
} = {}) {
    let riskScore = 0;

    if (required) {
        riskScore += 2;
    }

    if (unique) {
        riskScore += 2;
    }

    if (externalId) {
        riskScore += 2;
    }

    if (calculated) {
        riskScore += 1;
    }

    if (encrypted) {
        riskScore += 3;
    }

    if (
        normalizeArray(referenceTo).length
    ) {
        riskScore += 2;
    }

    if (riskScore >= 6) {
        return RISK_LEVELS.HIGH;
    }

    if (riskScore >= 3) {
        return RISK_LEVELS.MEDIUM;
    }

    return RISK_LEVELS.LOW;
}

export function getHealthStatus(score = 0) {
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

export function determineReadinessStatus({
    score = 0,
    blockingCount = 0
} = {}) {
    if (toNumber(blockingCount) > 0) {
        return READINESS_STATUSES.NOT_READY;
    }

    if (clampScore(score) >= 90) {
        return READINESS_STATUSES.READY;
    }

    if (clampScore(score) >= 70) {
        return READINESS_STATUSES.READY_WITH_WARNINGS;
    }

    return READINESS_STATUSES.NOT_READY;
}

function countFindingsBySeverity(
    findings = [],
    severity
) {
    return normalizeArray(findings)
        .filter(
            (finding) =>
                finding?.severity === severity
        )
        .length;
}

function createModelId(
    prefix = 'model',
    value = ''
) {
    const normalizedValue =
        String(value)
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

    return `${prefix}-${normalizedValue || Date.now()}`;
}

function normalizeArray(value) {
    return Array.isArray(value)
        ? [...value]
        : [];
}

function toNumber(value) {
    const numericValue =
        Number(value);

    return Number.isFinite(
        numericValue
    )
        ? numericValue
        : 0;
}

function clampScore(score) {
    return Math.min(
        100,
        Math.max(
            0,
            Math.round(
                toNumber(score)
            )
        )
    );
}