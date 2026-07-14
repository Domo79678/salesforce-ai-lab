/*
 * intelligenceModels.js
 *
 * Shared models and constants for the Salesforce Copilot
 * Intelligence Engine.
 *
 * These models standardize the output used by:
 * - Explain This
 * - Change Impact Analyzer
 * - Deployment Readiness
 * - Documentation Generator
 * - AI Learning Coach
 * - Troubleshooting Assistant
 */

export const INTELLIGENCE_ENGINE_VERSION =
    '1.0';

export const INTELLIGENCE_MODES =
    Object.freeze({
        EXPLAIN:
            'explain',

        CHANGE_IMPACT:
            'changeImpact',

        DEPLOYMENT:
            'deployment',

        DOCUMENTATION:
            'documentation',

        LEARNING:
            'learning',

        TROUBLESHOOTING:
            'troubleshooting',

        FULL:
            'full'
    });

export const ENTITY_TYPES =
    Object.freeze({
        ORGANIZATION:
            'organization',

        OBJECT:
            'object',

        FIELD:
            'field',

        FLOW:
            'flow',

        VALIDATION_RULE:
            'validationRule',

        FORMULA:
            'formula',

        APEX_CLASS:
            'apexClass',

        APEX_TRIGGER:
            'apexTrigger',

        PERMISSION_SET:
            'permissionSet',

        PROFILE:
            'profile',

        DUPLICATE_RULE:
            'duplicateRule',

        MATCHING_RULE:
            'matchingRule',

        RECORD_TYPE:
            'recordType',

        REPORT:
            'report',

        DASHBOARD:
            'dashboard',

        QUEUE:
            'queue',

        ROLE:
            'role',

        SHARING_RULE:
            'sharingRule',

        APPROVAL_PROCESS:
            'approvalProcess',

        UNKNOWN:
            'unknown'
    });

export const EXPLANATION_SECTIONS =
    Object.freeze({
        EXECUTIVE_SUMMARY:
            'executiveSummary',

        BUSINESS_PURPOSE:
            'businessPurpose',

        TECHNICAL_EXPLANATION:
            'technicalExplanation',

        DEPENDENCIES:
            'dependencies',

        USAGE:
            'usage',

        RISKS:
            'risks',

        IMPROVEMENTS:
            'improvements',

        TESTING:
            'testing',

        DEPLOYMENT:
            'deployment',

        INTERVIEW:
            'interview',

        STAR_STORY:
            'starStory'
    });

export const DEPENDENCY_TYPES =
    Object.freeze({
        OBJECT:
            'Object',

        FIELD:
            'Field',

        FLOW:
            'Flow',

        VALIDATION_RULE:
            'Validation Rule',

        FORMULA:
            'Formula',

        APEX_CLASS:
            'Apex Class',

        APEX_TRIGGER:
            'Apex Trigger',

        PERMISSION_SET:
            'Permission Set',

        PROFILE:
            'Profile',

        REPORT:
            'Report',

        DASHBOARD:
            'Dashboard',

        EMAIL_ALERT:
            'Email Alert',

        RECORD_TYPE:
            'Record Type',

        QUEUE:
            'Queue',

        ROLE:
            'Role',

        SHARING_RULE:
            'Sharing Rule',

        APPROVAL_PROCESS:
            'Approval Process',

        UNKNOWN:
            'Unknown'
    });

export const CONFIDENCE_LEVELS =
    Object.freeze({
        VERY_HIGH:
            'Very high',

        HIGH:
            'High',

        MEDIUM:
            'Medium',

        LOW:
            'Low',

        UNKNOWN:
            'Unknown'
    });

export const CHANGE_SAFETY_STATUSES =
    Object.freeze({
        SAFE:
            'Safe',

        REVIEW_REQUIRED:
            'Review required',

        UNSAFE:
            'Unsafe',

        UNKNOWN:
            'Unknown'
    });

export const TEST_TYPES =
    Object.freeze({
        POSITIVE:
            'Positive',

        NEGATIVE:
            'Negative',

        BULK:
            'Bulk',

        SECURITY:
            'Security',

        PERMISSION:
            'Permission',

        EDGE_CASE:
            'Edge case',

        ERROR_HANDLING:
            'Error handling',

        REGRESSION:
            'Regression',

        INTEGRATION:
            'Integration',

        DEPLOYMENT:
            'Deployment',

        ROLLBACK:
            'Rollback'
    });

export const DOCUMENT_TYPES =
    Object.freeze({
        ADMIN_GUIDE:
            'Administrator Guide',

        TECHNICAL_DESIGN:
            'Technical Design',

        BUSINESS_SUMMARY:
            'Business Summary',

        TESTING_GUIDE:
            'Testing Guide',

        DEPLOYMENT_GUIDE:
            'Deployment Guide',

        RELEASE_NOTES:
            'Release Notes',

        TROUBLESHOOTING_GUIDE:
            'Troubleshooting Guide'
    });

export function createIntelligenceRequest({
    mode =
        INTELLIGENCE_MODES.FULL,

    entityType =
        ENTITY_TYPES.UNKNOWN,

    entityApiName = '',

    entityLabel = '',

    proposedChange = '',

    question = '',

    options = {}
} = {}) {
    return {
        mode,

        entityType,

        entityApiName:
            safeString(
                entityApiName
            ),

        entityLabel:
            safeString(
                entityLabel
            ),

        proposedChange:
            safeString(
                proposedChange
            ),

        question:
            safeString(
                question
            ),

        options: {
            includeDependencies:
                options.includeDependencies !==
                false,

            includeRisks:
                options.includeRisks !==
                false,

            includeTests:
                options.includeTests !==
                false,

            includeDeployment:
                options.includeDeployment !==
                false,

            includeInterview:
                options.includeInterview !==
                false,

            includeStarStory:
                Boolean(
                    options.includeStarStory
                )
        },

        requestedAt:
            new Date().toISOString()
    };
}

export function createExplanationResult({
    success = true,

    entityType =
        ENTITY_TYPES.UNKNOWN,

    entityApiName = '',

    entityLabel = '',

    executiveSummary = '',

    businessPurpose = '',

    technicalExplanation = '',

    dependencies = [],

    usage = [],

    risks = [],

    improvements = [],

    testCases = [],

    deployment = null,

    interviewExplanation = '',

    starStory = null,

    confidence = null,

    source = '',

    warnings = [],

    errors = []
} = {}) {
    return {
        success,

        entity: {
            type:
                entityType,

            apiName:
                safeString(
                    entityApiName
                ),

            label:
                safeString(
                    entityLabel
                )
        },

        executiveSummary:
            safeString(
                executiveSummary
            ),

        businessPurpose:
            safeString(
                businessPurpose
            ),

        technicalExplanation:
            safeString(
                technicalExplanation
            ),

        dependencies:
            normalizeArray(
                dependencies
            ),

        usage:
            normalizeArray(
                usage
            ),

        risks:
            normalizeArray(
                risks
            ),

        improvements:
            normalizeArray(
                improvements
            ),

        testCases:
            normalizeArray(
                testCases
            ),

        deployment:
            deployment ||
            createDeploymentGuidance(),

        interviewExplanation:
            safeString(
                interviewExplanation
            ),

        starStory,

        confidence:
            confidence ||
            createConfidenceResult(),

        source:
            safeString(
                source,
                'Salesforce Copilot Intelligence Engine'
            ),

        warnings:
            normalizeArray(
                warnings
            ),

        errors:
            normalizeArray(
                errors
            ),

        generatedAt:
            new Date().toISOString(),

        engineVersion:
            INTELLIGENCE_ENGINE_VERSION
    };
}

export function createDependency({
    id = '',

    type =
        DEPENDENCY_TYPES.UNKNOWN,

    apiName = '',

    label = '',

    relationship = '',

    direction =
        'outbound',

    required = false,

    active = true,

    source = '',

    metadata = {}
} = {}) {
    return {
        id:
            safeString(
                id,
                createStableId(
                    `${type}-${apiName}`
                )
            ),

        type,

        apiName:
            safeString(
                apiName
            ),

        label:
            safeString(
                label,
                apiName
            ),

        relationship:
            safeString(
                relationship
            ),

        direction:
            safeString(
                direction,
                'outbound'
            ),

        required:
            Boolean(
                required
            ),

        active:
            Boolean(
                active
            ),

        source:
            safeString(
                source
            ),

        metadata: {
            ...metadata
        }
    };
}

export function createRisk({
    id = '',

    title = '',

    description = '',

    severity =
        'Medium',

    category =
        'Metadata',

    entityApiName = '',

    blocking = false,

    scoreImpact = 0,

    recommendation = '',

    evidence = []
} = {}) {
    return {
        id:
            safeString(
                id,
                createStableId(
                    `${entityApiName}-${title}`
                )
            ),

        title:
            safeString(
                title
            ),

        description:
            safeString(
                description
            ),

        severity:
            safeString(
                severity,
                'Medium'
            ),

        category:
            safeString(
                category,
                'Metadata'
            ),

        entityApiName:
            safeString(
                entityApiName
            ),

        blocking:
            Boolean(
                blocking
            ),

        scoreImpact:
            Math.max(
                0,
                safeNumber(
                    scoreImpact
                )
            ),

        recommendation:
            safeString(
                recommendation
            ),

        evidence:
            normalizeArray(
                evidence
            )
    };
}

export function createTestCase({
    id = '',

    title = '',

    type =
        TEST_TYPES.POSITIVE,

    objective = '',

    preconditions = [],

    steps = [],

    expectedResult = '',

    priority =
        'Medium',

    automated = false
} = {}) {
    return {
        id:
            safeString(
                id,
                createStableId(
                    `${type}-${title}`
                )
            ),

        title:
            safeString(
                title
            ),

        type,

        objective:
            safeString(
                objective
            ),

        preconditions:
            normalizeArray(
                preconditions
            ),

        steps:
            normalizeArray(
                steps
            ),

        expectedResult:
            safeString(
                expectedResult
            ),

        priority:
            safeString(
                priority,
                'Medium'
            ),

        automated:
            Boolean(
                automated
            )
    };
}

export function createDeploymentGuidance({
    readinessStatus =
        'Unknown',

    riskLevel =
        'Unknown',

    recommendation = '',

    prerequisites = [],

    validationSteps = [],

    rollbackSteps = [],

    requiredComponents = [],

    blockers = []
} = {}) {
    return {
        readinessStatus:
            safeString(
                readinessStatus,
                'Unknown'
            ),

        riskLevel:
            safeString(
                riskLevel,
                'Unknown'
            ),

        recommendation:
            safeString(
                recommendation
            ),

        prerequisites:
            normalizeArray(
                prerequisites
            ),

        validationSteps:
            normalizeArray(
                validationSteps
            ),

        rollbackSteps:
            normalizeArray(
                rollbackSteps
            ),

        requiredComponents:
            normalizeArray(
                requiredComponents
            ),

        blockers:
            normalizeArray(
                blockers
            )
    };
}

export function createConfidenceResult({
    score = 0,

    level = '',

    reasons = [],

    liveMetadata = false,

    partialCoverage = false
} = {}) {
    const normalizedScore =
        clampPercentage(
            score
        );

    return {
        score:
            normalizedScore,

        level:
            level ||
            getConfidenceLevel(
                normalizedScore
            ),

        reasons:
            normalizeArray(
                reasons
            ),

        liveMetadata:
            Boolean(
                liveMetadata
            ),

        partialCoverage:
            Boolean(
                partialCoverage
            )
    };
}

export function createChangeImpactResult({
    success = true,

    entityType =
        ENTITY_TYPES.UNKNOWN,

    entityApiName = '',

    proposedChange = '',

    safetyStatus =
        CHANGE_SAFETY_STATUSES.UNKNOWN,

    riskLevel =
        'Unknown',

    confidence = null,

    dependencies = [],

    affectedComponents = [],

    risks = [],

    recommendations = [],

    requiredTests = [],

    deploymentGuidance = null,

    warnings = [],

    errors = []
} = {}) {
    return {
        success,

        entityType,

        entityApiName:
            safeString(
                entityApiName
            ),

        proposedChange:
            safeString(
                proposedChange
            ),

        safetyStatus,

        riskLevel,

        confidence:
            confidence ||
            createConfidenceResult(),

        dependencies:
            normalizeArray(
                dependencies
            ),

        affectedComponents:
            normalizeArray(
                affectedComponents
            ),

        risks:
            normalizeArray(
                risks
            ),

        recommendations:
            normalizeArray(
                recommendations
            ),

        requiredTests:
            normalizeArray(
                requiredTests
            ),

        deploymentGuidance:
            deploymentGuidance ||
            createDeploymentGuidance(),

        warnings:
            normalizeArray(
                warnings
            ),

        errors:
            normalizeArray(
                errors
            ),

        generatedAt:
            new Date().toISOString(),

        engineVersion:
            INTELLIGENCE_ENGINE_VERSION
    };
}

export function createInterviewInsight({
    question = '',

    answer = '',

    talkingPoints = [],

    technicalTerms = [],

    followUpQuestions = []
} = {}) {
    return {
        question:
            safeString(
                question
            ),

        answer:
            safeString(
                answer
            ),

        talkingPoints:
            normalizeArray(
                talkingPoints
            ),

        technicalTerms:
            normalizeArray(
                technicalTerms
            ),

        followUpQuestions:
            normalizeArray(
                followUpQuestions
            )
    };
}

export function createStarStory({
    situation = '',

    task = '',

    action = '',

    result = '',

    skills = [],

    interviewQuestion = ''
} = {}) {
    return {
        situation:
            safeString(
                situation
            ),

        task:
            safeString(
                task
            ),

        action:
            safeString(
                action
            ),

        result:
            safeString(
                result
            ),

        skills:
            normalizeArray(
                skills
            ),

        interviewQuestion:
            safeString(
                interviewQuestion
            )
    };
}

export function getConfidenceLevel(
    score = 0
) {
    const normalizedScore =
        clampPercentage(
            score
        );

    if (normalizedScore >= 90) {
        return CONFIDENCE_LEVELS
            .VERY_HIGH;
    }

    if (normalizedScore >= 75) {
        return CONFIDENCE_LEVELS
            .HIGH;
    }

    if (normalizedScore >= 50) {
        return CONFIDENCE_LEVELS
            .MEDIUM;
    }

    if (normalizedScore > 0) {
        return CONFIDENCE_LEVELS
            .LOW;
    }

    return CONFIDENCE_LEVELS
        .UNKNOWN;
}

export function clampPercentage(
    value
) {
    return Math.max(
        0,
        Math.min(
            100,
            safeNumber(
                value
            )
        )
    );
}

export function createStableId(
    value = ''
) {
    return safeString(
        value
    )
        .trim()
        .toLowerCase()
        .replace(
            /[^a-z0-9]+/g,
            '-'
        )
        .replace(
            /^-|-$/g,
            ''
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

    return normalized ||
        fallback;
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
        ? [...value]
        : [];
}