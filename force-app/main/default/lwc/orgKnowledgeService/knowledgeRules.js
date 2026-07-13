/*
 * knowledgeRules.js
 *
 * Rule engine for the Salesforce Copilot Org Knowledge Layer.
 *
 * This module interprets Salesforce metadata and identifies:
 * - org health risks
 * - automation risks
 * - object and field risks
 * - security concerns
 * - documentation gaps
 * - testing gaps
 * - deployment readiness concerns
 *
 * It converts raw metadata observations into standardized:
 * - findings
 * - recommendations
 *
 * Shared models come from knowledgeModels.js.
 * Shared helpers come from knowledgeUtilities.js.
 */

import {
    ENTITY_TYPES,
    HEALTH_CATEGORIES,
    SEVERITY_LEVELS,
    RISK_LEVELS,
    RECOMMENDATION_PRIORITIES,
    createFinding,
    createRecommendation
} from './knowledgeModels';

import {
    normalizeArray,
    normalizeText,
    safeString,
    safeBoolean,
    safeNumber,
    isCustomApiName,
    isRelationshipField,
    deduplicateBy,
    sortFindingsBySeverity,
    sortRecommendationsByPriority,
    summarizeFindings,
    summarizeRecommendations
} from './knowledgeUtilities';

/*
 * Central rule identifiers.
 *
 * Stable identifiers make the findings easier to:
 * - test
 * - filter
 * - reference in recommendations
 * - track across future scans
 */
export const KNOWLEDGE_RULE_IDS = Object.freeze({
    ORG_NO_OBJECTS: 'ORG_NO_OBJECTS',
    ORG_NO_CUSTOM_OBJECTS: 'ORG_NO_CUSTOM_OBJECTS',
    ORG_API_VERSION_MISSING: 'ORG_API_VERSION_MISSING',

    OBJECT_HIGH_FIELD_COUNT: 'OBJECT_HIGH_FIELD_COUNT',
    OBJECT_HIGH_RELATIONSHIP_COUNT:
        'OBJECT_HIGH_RELATIONSHIP_COUNT',
    OBJECT_HIGH_RECORD_TYPE_COUNT:
        'OBJECT_HIGH_RECORD_TYPE_COUNT',
    OBJECT_NOT_QUERYABLE: 'OBJECT_NOT_QUERYABLE',
    OBJECT_NOT_ACCESSIBLE: 'OBJECT_NOT_ACCESSIBLE',
    OBJECT_MISSING_DESCRIPTION:
        'OBJECT_MISSING_DESCRIPTION',

    FIELD_UNUSED: 'FIELD_UNUSED',
    FIELD_MISSING_HELP_TEXT:
        'FIELD_MISSING_HELP_TEXT',
    FIELD_MISSING_DESCRIPTION:
        'FIELD_MISSING_DESCRIPTION',
    FIELD_REQUIRED_AND_UNIQUE:
        'FIELD_REQUIRED_AND_UNIQUE',
    FIELD_ENCRYPTED: 'FIELD_ENCRYPTED',
    FIELD_RELATIONSHIP_WITHOUT_NAME:
        'FIELD_RELATIONSHIP_WITHOUT_NAME',
    FIELD_NOT_ACCESSIBLE:
        'FIELD_NOT_ACCESSIBLE',
    FIELD_NOT_UPDATEABLE:
        'FIELD_NOT_UPDATEABLE',

    FLOW_MISSING_FAULT_PATH:
        'FLOW_MISSING_FAULT_PATH',
    FLOW_INACTIVE: 'FLOW_INACTIVE',
    FLOW_MISSING_DESCRIPTION:
        'FLOW_MISSING_DESCRIPTION',
    FLOW_HIGH_COMPLEXITY:
        'FLOW_HIGH_COMPLEXITY',
    FLOW_LOOP_WITH_DML:
        'FLOW_LOOP_WITH_DML',
    FLOW_NO_ENTRY_CONDITIONS:
        'FLOW_NO_ENTRY_CONDITIONS',
    FLOW_OLD_API_VERSION:
        'FLOW_OLD_API_VERSION',

    VALIDATION_RULE_INACTIVE:
        'VALIDATION_RULE_INACTIVE',
    VALIDATION_RULE_MISSING_DESCRIPTION:
        'VALIDATION_RULE_MISSING_DESCRIPTION',

    DUPLICATE_RULE_DISABLED:
        'DUPLICATE_RULE_DISABLED',
    MATCHING_RULE_INACTIVE:
        'MATCHING_RULE_INACTIVE',

    PERMISSION_SET_UNASSIGNED:
        'PERMISSION_SET_UNASSIGNED',
    PERMISSION_SET_MISSING_DESCRIPTION:
        'PERMISSION_SET_MISSING_DESCRIPTION',
    PERMISSION_SET_BROAD_ACCESS:
        'PERMISSION_SET_BROAD_ACCESS',
    PROFILE_BROAD_ACCESS:
        'PROFILE_BROAD_ACCESS',

    APEX_NO_TEST_CLASS:
        'APEX_NO_TEST_CLASS',
    APEX_LOW_COVERAGE:
        'APEX_LOW_COVERAGE',
    APEX_MISSING_DESCRIPTION:
        'APEX_MISSING_DESCRIPTION',

    REPORT_UNUSED: 'REPORT_UNUSED',
    DASHBOARD_UNUSED: 'DASHBOARD_UNUSED',

    DEPLOYMENT_FAILED:
        'DEPLOYMENT_FAILED',
    DEPLOYMENT_NO_TEST_RESULTS:
        'DEPLOYMENT_NO_TEST_RESULTS',
    DEPLOYMENT_NO_ROLLBACK_PLAN:
        'DEPLOYMENT_NO_ROLLBACK_PLAN',
    DEPLOYMENT_BLOCKED:
        'DEPLOYMENT_BLOCKED',

    METADATA_MISSING_OWNER:
        'METADATA_MISSING_OWNER',
    METADATA_MISSING_DESCRIPTION:
        'METADATA_MISSING_DESCRIPTION'
});

/*
 * Default thresholds.
 *
 * These can later be moved into Custom Metadata,
 * Custom Settings, or an administrator configuration page.
 */
export const KNOWLEDGE_RULE_THRESHOLDS =
    Object.freeze({
        OBJECT_FIELD_COUNT_MEDIUM: 100,
        OBJECT_FIELD_COUNT_HIGH: 150,
        OBJECT_RELATIONSHIP_COUNT_HIGH: 20,
        OBJECT_RECORD_TYPE_COUNT_HIGH: 10,

        FLOW_ELEMENT_COUNT_MEDIUM: 25,
        FLOW_ELEMENT_COUNT_HIGH: 50,
        FLOW_DECISION_COUNT_HIGH: 8,
        FLOW_LOOP_COUNT_HIGH: 3,

        APEX_MINIMUM_COVERAGE: 75,
        APEX_WARNING_COVERAGE: 85,

        UNUSED_REPORT_DAYS: 180,
        UNUSED_DASHBOARD_DAYS: 180,

        OLD_API_VERSION_DIFFERENCE: 5
    });

/*
 * Main rule-engine entry point.
 *
 * Expected input:
 *
 * {
 *     organization: {},
 *     objects: [],
 *     flows: [],
 *     validationRules: [],
 *     duplicateRules: [],
 *     matchingRules: [],
 *     permissionSets: [],
 *     profiles: [],
 *     apexClasses: [],
 *     reports: [],
 *     dashboards: [],
 *     deployments: [],
 *     metadataItems: []
 * }
 */
export function evaluateKnowledgeRules(
    orgSnapshot = {},
    options = {}
) {
    const thresholds = {
        ...KNOWLEDGE_RULE_THRESHOLDS,
        ...(options.thresholds || {})
    };

    const findings = [
        ...evaluateOrganizationRules(
            orgSnapshot.organization || {},
            orgSnapshot,
            thresholds
        ),

        ...evaluateObjectRules(
            orgSnapshot.objects,
            thresholds
        ),

        ...evaluateFieldRules(
            orgSnapshot.objects,
            thresholds
        ),

        ...evaluateFlowRules(
            orgSnapshot.flows,
            thresholds,
            orgSnapshot.organization
        ),

        ...evaluateValidationRuleRules(
            orgSnapshot.validationRules
        ),

        ...evaluateDuplicateManagementRules({
            duplicateRules:
                orgSnapshot.duplicateRules,
            matchingRules:
                orgSnapshot.matchingRules
        }),

        ...evaluateSecurityRules({
            permissionSets:
                orgSnapshot.permissionSets,
            profiles:
                orgSnapshot.profiles
        }),

        ...evaluateApexRules(
            orgSnapshot.apexClasses,
            thresholds
        ),

        ...evaluateAnalyticsRules({
            reports:
                orgSnapshot.reports,
            dashboards:
                orgSnapshot.dashboards
        }, thresholds),

        ...evaluateMetadataDocumentationRules(
            orgSnapshot.metadataItems
        ),

        ...evaluateDeploymentRules(
            orgSnapshot.deployments,
            orgSnapshot
        )
    ];

    const uniqueFindings =
        deduplicateBy(
            findings,
            'id'
        );

    const sortedFindings =
        sortFindingsBySeverity(
            uniqueFindings
        );

    const recommendations =
        buildRecommendationsFromFindings(
            sortedFindings
        );

    const uniqueRecommendations =
        deduplicateBy(
            recommendations,
            'id'
        );

    const sortedRecommendations =
        sortRecommendationsByPriority(
            uniqueRecommendations
        );

    return {
        findings:
            sortedFindings,

        recommendations:
            sortedRecommendations,

        findingSummary:
            summarizeFindings(
                sortedFindings
            ),

        recommendationSummary:
            summarizeRecommendations(
                sortedRecommendations
            ),

        evaluatedAt:
            new Date().toISOString(),

        ruleCount:
            Object.keys(
                KNOWLEDGE_RULE_IDS
            ).length,

        serviceVersion:
            '1.0'
    };
}

/*
 * Organization-level rules
 */
export function evaluateOrganizationRules(
    organization = {},
    orgSnapshot = {},
    thresholds = KNOWLEDGE_RULE_THRESHOLDS
) {
    const findings = [];

    const objects =
        normalizeArray(
            orgSnapshot.objects
        );

    const customObjects =
        objects.filter(
            (objectItem) =>
                safeBoolean(
                    objectItem.custom
                ) ||
                isCustomApiName(
                    getApiName(
                        objectItem
                    )
                )
        );

    if (!objects.length) {
        findings.push(
            createFinding({
                id:
                    KNOWLEDGE_RULE_IDS
                        .ORG_NO_OBJECTS,

                category:
                    HEALTH_CATEGORIES
                        .DATA_MODEL,

                title:
                    'No object metadata was available',

                summary:
                    'The Org Knowledge Layer did not receive any Salesforce object metadata to evaluate.',

                severity:
                    SEVERITY_LEVELS
                        .HIGH,

                riskLevel:
                    RISK_LEVELS.HIGH,

                scoreImpact:
                    10,

                evidence: [
                    'Object count returned: 0'
                ],

                recommendation:
                    'Confirm that the metadata service can retrieve accessible Salesforce objects.',

                entityType:
                    ENTITY_TYPES
                        .ORGANIZATION,

                entityApiName:
                    safeString(
                        organization.name
                    ),

                blocking:
                    true
            })
        );
    }

    if (
        objects.length > 0 &&
        !customObjects.length
    ) {
        findings.push(
            createFinding({
                id:
                    KNOWLEDGE_RULE_IDS
                        .ORG_NO_CUSTOM_OBJECTS,

                category:
                    HEALTH_CATEGORIES
                        .DATA_MODEL,

                title:
                    'No custom objects were detected',

                summary:
                    'The org currently appears to contain only standard objects or the current metadata source did not return custom objects.',

                severity:
                    SEVERITY_LEVELS
                        .INFORMATIONAL,

                riskLevel:
                    RISK_LEVELS.NONE,

                scoreImpact:
                    0,

                evidence: [
                    `Objects evaluated: ${objects.length}`,
                    'Custom objects detected: 0'
                ],

                recommendation:
                    'No action is required unless custom objects were expected. If they were expected, review metadata access.',

                entityType:
                    ENTITY_TYPES
                        .ORGANIZATION,

                entityApiName:
                    safeString(
                        organization.name
                    )
            })
        );
    }

    if (
        !safeString(
            organization.apiVersion
        )
    ) {
        findings.push(
            createFinding({
                id:
                    KNOWLEDGE_RULE_IDS
                        .ORG_API_VERSION_MISSING,

                category:
                    HEALTH_CATEGORIES
                        .METADATA,

                title:
                    'Organization API version is unavailable',

                summary:
                    'The current organization profile does not include an API version.',

                severity:
                    SEVERITY_LEVELS
                        .LOW,

                riskLevel:
                    RISK_LEVELS.LOW,

                scoreImpact:
                    1,

                evidence: [
                    'Organization API version was blank'
                ],

                recommendation:
                    'Capture the active Salesforce API version so metadata compatibility can be evaluated.',

                entityType:
                    ENTITY_TYPES
                        .ORGANIZATION,

                entityApiName:
                    safeString(
                        organization.name
                    )
            })
        );
    }

    return findings;
}

/*
 * Object-level rules
 */
export function evaluateObjectRules(
    objects = [],
    thresholds = KNOWLEDGE_RULE_THRESHOLDS
) {
    const findings = [];

    normalizeArray(objects)
        .forEach(
            (objectItem) => {
                const apiName =
                    getApiName(
                        objectItem
                    );

                const label =
                    getLabel(
                        objectItem
                    );

                const fields =
                    normalizeArray(
                        objectItem.fields
                    );

                const relationships =
                    normalizeArray(
                        objectItem.relationships
                    );

                const recordTypes =
                    normalizeArray(
                        objectItem.recordTypes
                    );

                if (
                    fields.length >=
                    thresholds
                        .OBJECT_FIELD_COUNT_HIGH
                ) {
                    findings.push(
                        createFinding({
                            id:
                                createRuleFindingId(
                                    KNOWLEDGE_RULE_IDS
                                        .OBJECT_HIGH_FIELD_COUNT,
                                    apiName
                                ),

                            category:
                                HEALTH_CATEGORIES
                                    .DATA_MODEL,

                            title:
                                `${label} has a very high field count`,

                            summary:
                                `${label} contains ${fields.length} fields. Large field counts can increase administrative complexity, page-layout maintenance, reporting confusion, and technical debt.`,

                            severity:
                                SEVERITY_LEVELS
                                    .HIGH,

                            riskLevel:
                                RISK_LEVELS.HIGH,

                            scoreImpact:
                                7,

                            evidence: [
                                `Field count: ${fields.length}`,
                                `High threshold: ${thresholds.OBJECT_FIELD_COUNT_HIGH}`
                            ],

                            recommendation:
                                'Review the object for unused, duplicate, obsolete, or poorly documented fields before adding additional fields.',

                            entityType:
                                ENTITY_TYPES.OBJECT,

                            entityApiName:
                                apiName
                        })
                    );
                } else if (
                    fields.length >=
                    thresholds
                        .OBJECT_FIELD_COUNT_MEDIUM
                ) {
                    findings.push(
                        createFinding({
                            id:
                                createRuleFindingId(
                                    KNOWLEDGE_RULE_IDS
                                        .OBJECT_HIGH_FIELD_COUNT,
                                    apiName
                                ),

                            category:
                                HEALTH_CATEGORIES
                                    .DATA_MODEL,

                            title:
                                `${label} has a large field count`,

                            summary:
                                `${label} contains ${fields.length} fields and should be monitored for unnecessary metadata growth.`,

                            severity:
                                SEVERITY_LEVELS
                                    .MEDIUM,

                            riskLevel:
                                RISK_LEVELS.MEDIUM,

                            scoreImpact:
                                4,

                            evidence: [
                                `Field count: ${fields.length}`,
                                `Review threshold: ${thresholds.OBJECT_FIELD_COUNT_MEDIUM}`
                            ],

                            recommendation:
                                'Perform a field-usage review and document which fields are active, obsolete, or candidates for retirement.',

                            entityType:
                                ENTITY_TYPES.OBJECT,

                            entityApiName:
                                apiName
                        })
                    );
                }

                if (
                    relationships.length >=
                    thresholds
                        .OBJECT_RELATIONSHIP_COUNT_HIGH
                ) {
                    findings.push(
                        createFinding({
                            id:
                                createRuleFindingId(
                                    KNOWLEDGE_RULE_IDS
                                        .OBJECT_HIGH_RELATIONSHIP_COUNT,
                                    apiName
                                ),

                            category:
                                HEALTH_CATEGORIES
                                    .DATA_MODEL,

                            title:
                                `${label} has many relationships`,

                            summary:
                                `${label} contains ${relationships.length} relationships. A highly connected object may have greater automation, reporting, sharing, and deletion dependencies.`,

                            severity:
                                SEVERITY_LEVELS
                                    .MEDIUM,

                            riskLevel:
                                RISK_LEVELS.MEDIUM,

                            scoreImpact:
                                4,

                            evidence: [
                                `Relationship count: ${relationships.length}`
                            ],

                            recommendation:
                                'Create a relationship map and perform dependency analysis before changing or deleting fields on this object.',

                            entityType:
                                ENTITY_TYPES.OBJECT,

                            entityApiName:
                                apiName
                        })
                    );
                }

                if (
                    recordTypes.length >=
                    thresholds
                        .OBJECT_RECORD_TYPE_COUNT_HIGH
                ) {
                    findings.push(
                        createFinding({
                            id:
                                createRuleFindingId(
                                    KNOWLEDGE_RULE_IDS
                                        .OBJECT_HIGH_RECORD_TYPE_COUNT,
                                    apiName
                                ),

                            category:
                                HEALTH_CATEGORIES
                                    .DATA_MODEL,

                            title:
                                `${label} has many record types`,

                            summary:
                                `${label} contains ${recordTypes.length} record types. Large numbers of record types can create complex page-layout, picklist, process, and security dependencies.`,

                            severity:
                                SEVERITY_LEVELS
                                    .MEDIUM,

                            riskLevel:
                                RISK_LEVELS.MEDIUM,

                            scoreImpact:
                                3,

                            evidence: [
                                `Record type count: ${recordTypes.length}`
                            ],

                            recommendation:
                                'Review record-type usage, assigned profiles, page layouts, picklist values, and automation dependencies.',

                            entityType:
                                ENTITY_TYPES.OBJECT,

                            entityApiName:
                                apiName
                        })
                    );
                }

                if (
                    objectItem.queryable ===
                    false ||
                    objectItem
                        ?.capabilities
                        ?.queryable === false
                ) {
                    findings.push(
                        createFinding({
                            id:
                                createRuleFindingId(
                                    KNOWLEDGE_RULE_IDS
                                        .OBJECT_NOT_QUERYABLE,
                                    apiName
                                ),

                            category:
                                HEALTH_CATEGORIES
                                    .METADATA,

                            title:
                                `${label} is not queryable`,

                            summary:
                                'The current user or metadata context cannot query this object.',

                            severity:
                                SEVERITY_LEVELS.LOW,

                            riskLevel:
                                RISK_LEVELS.LOW,

                            scoreImpact:
                                1,

                            evidence: [
                                'Queryable capability: false'
                            ],

                            recommendation:
                                'Confirm whether this behavior is expected and review object permissions or object capabilities.',

                            entityType:
                                ENTITY_TYPES.OBJECT,

                            entityApiName:
                                apiName
                        })
                    );
                }

                if (
                    objectItem.accessible ===
                    false ||
                    objectItem
                        ?.capabilities
                        ?.accessible === false
                ) {
                    findings.push(
                        createFinding({
                            id:
                                createRuleFindingId(
                                    KNOWLEDGE_RULE_IDS
                                        .OBJECT_NOT_ACCESSIBLE,
                                    apiName
                                ),

                            category:
                                HEALTH_CATEGORIES
                                    .SECURITY,

                            title:
                                `${label} is not accessible`,

                            summary:
                                'The running user does not currently have access to this object.',

                            severity:
                                SEVERITY_LEVELS
                                    .INFORMATIONAL,

                            riskLevel:
                                RISK_LEVELS.UNKNOWN,

                            scoreImpact:
                                0,

                            evidence: [
                                'Accessible capability: false'
                            ],

                            recommendation:
                                'Confirm that the running user is intended to access this object before changing permissions.',

                            entityType:
                                ENTITY_TYPES.OBJECT,

                            entityApiName:
                                apiName
                        })
                    );
                }

                const description =
                    getDescription(
                        objectItem
                    );

                if (
                    isCustomApiName(apiName) &&
                    !description
                ) {
                    findings.push(
                        createFinding({
                            id:
                                createRuleFindingId(
                                    KNOWLEDGE_RULE_IDS
                                        .OBJECT_MISSING_DESCRIPTION,
                                    apiName
                                ),

                            category:
                                HEALTH_CATEGORIES
                                    .DOCUMENTATION,

                            title:
                                `${label} is missing a description`,

                            summary:
                                'This custom object does not include a documented business purpose.',

                            severity:
                                SEVERITY_LEVELS.LOW,

                            riskLevel:
                                RISK_LEVELS.LOW,

                            scoreImpact:
                                1,

                            evidence: [
                                `Custom object: ${apiName}`,
                                'Description: blank'
                            ],

                            recommendation:
                                'Add a concise description explaining the object purpose, owner, primary users, and important dependencies.',

                            entityType:
                                ENTITY_TYPES.OBJECT,

                            entityApiName:
                                apiName
                        })
                    );
                }
            }
        );

    return findings;
}

/*
 * Field-level rules
 */
export function evaluateFieldRules(
    objects = []
) {
    const findings = [];

    normalizeArray(objects)
        .forEach(
            (objectItem) => {
                const objectApiName =
                    getApiName(
                        objectItem
                    );

                normalizeArray(
                    objectItem.fields
                ).forEach(
                    (field) => {
                        findings.push(
                            ...evaluateSingleFieldRules(
                                field,
                                objectApiName
                            )
                        );
                    }
                );
            }
        );

    return findings;
}

export function evaluateSingleFieldRules(
    field = {},
    objectApiName = ''
) {
    const findings = [];

    const fieldApiName =
        getApiName(field);

    const label =
        getLabel(field);

    const qualifiedApiName =
        objectApiName &&
        fieldApiName
            ? `${objectApiName}.${fieldApiName}`
            : fieldApiName;

    const custom =
        safeBoolean(
            field.custom
        ) ||
        isCustomApiName(
            fieldApiName
        );

    const usageCount =
        getUsageCount(field);

    const usageKnown =
        hasKnownUsageCount(field);

    if (
        custom &&
        usageKnown &&
        usageCount === 0
    ) {
        findings.push(
            createFinding({
                id:
                    createRuleFindingId(
                        KNOWLEDGE_RULE_IDS
                            .FIELD_UNUSED,
                        qualifiedApiName
                    ),

                category:
                    HEALTH_CATEGORIES
                        .METADATA,

                title:
                    `${label} appears unused`,

                summary:
                    `${qualifiedApiName} has no recorded references in the metadata usage information provided to the Org Knowledge Layer.`,

                severity:
                    SEVERITY_LEVELS
                        .MEDIUM,

                riskLevel:
                    RISK_LEVELS.MEDIUM,

                scoreImpact:
                    3,

                evidence: [
                    `Usage count: ${usageCount}`,
                    `Field: ${qualifiedApiName}`
                ],

                recommendation:
                    'Confirm usage with dependency analysis, reports, integrations, data population, and business owners before retiring the field.',

                entityType:
                    ENTITY_TYPES.FIELD,

                entityApiName:
                    qualifiedApiName
            })
        );
    }

    const helpText =
        safeString(
            field.inlineHelpText ||
            field.helpText ||
            field?.metadata
                ?.inlineHelpText
        );

    if (
        custom &&
        !helpText
    ) {
        findings.push(
            createFinding({
                id:
                    createRuleFindingId(
                        KNOWLEDGE_RULE_IDS
                            .FIELD_MISSING_HELP_TEXT,
                        qualifiedApiName
                    ),

                category:
                    HEALTH_CATEGORIES
                        .DOCUMENTATION,

                title:
                    `${label} is missing help text`,

                summary:
                    'This custom field does not include user-facing guidance.',

                severity:
                    SEVERITY_LEVELS.LOW,

                riskLevel:
                    RISK_LEVELS.LOW,

                scoreImpact:
                    1,

                evidence: [
                    `Custom field: ${qualifiedApiName}`,
                    'Help text: blank'
                ],

                recommendation:
                    'Add concise help text explaining what users should enter, why the field matters, and any formatting expectations.',

                entityType:
                    ENTITY_TYPES.FIELD,

                entityApiName:
                    qualifiedApiName
            })
        );
    }

    const description =
        getDescription(field);

    if (
        custom &&
        !description
    ) {
        findings.push(
            createFinding({
                id:
                    createRuleFindingId(
                        KNOWLEDGE_RULE_IDS
                            .FIELD_MISSING_DESCRIPTION,
                        qualifiedApiName
                    ),

                category:
                    HEALTH_CATEGORIES
                        .DOCUMENTATION,

                title:
                    `${label} is missing an administrator description`,

                summary:
                    'This custom field does not include technical or business documentation for administrators.',

                severity:
                    SEVERITY_LEVELS.LOW,

                riskLevel:
                    RISK_LEVELS.LOW,

                scoreImpact:
                    1,

                evidence: [
                    `Field: ${qualifiedApiName}`,
                    'Description: blank'
                ],

                recommendation:
                    'Document the field purpose, source, automation dependencies, reporting use, and business owner.',

                entityType:
                    ENTITY_TYPES.FIELD,

                entityApiName:
                    qualifiedApiName
            })
        );
    }

    if (
        safeBoolean(field.required) &&
        safeBoolean(field.unique)
    ) {
        findings.push(
            createFinding({
                id:
                    createRuleFindingId(
                        KNOWLEDGE_RULE_IDS
                            .FIELD_REQUIRED_AND_UNIQUE,
                        qualifiedApiName
                    ),

                category:
                    HEALTH_CATEGORIES
                        .DATA_MODEL,

                title:
                    `${label} is both required and unique`,

                summary:
                    'This field enforces two strict data constraints. Imports, integrations, cloning, and record creation may fail when values are missing or duplicated.',

                severity:
                    SEVERITY_LEVELS
                        .MEDIUM,

                riskLevel:
                    RISK_LEVELS.MEDIUM,

                scoreImpact:
                    3,

                evidence: [
                    'Required: true',
                    'Unique: true'
                ],

                recommendation:
                    'Confirm that all entry channels can reliably provide unique values and include negative test cases for duplicates and blanks.',

                entityType:
                    ENTITY_TYPES.FIELD,

                entityApiName:
                    qualifiedApiName
            })
        );
    }

    if (
        safeBoolean(
            field.encrypted
        )
    ) {
        findings.push(
            createFinding({
                id:
                    createRuleFindingId(
                        KNOWLEDGE_RULE_IDS
                            .FIELD_ENCRYPTED,
                        qualifiedApiName
                    ),

                category:
                    HEALTH_CATEGORIES
                        .SECURITY,

                title:
                    `${label} is encrypted`,

                summary:
                    'Encrypted fields can affect searching, filtering, formulas, integrations, reporting, visibility, and key-management requirements.',

                severity:
                    SEVERITY_LEVELS
                        .INFORMATIONAL,

                riskLevel:
                    RISK_LEVELS.MEDIUM,

                scoreImpact:
                    0,

                evidence: [
                    'Encrypted: true'
                ],

                recommendation:
                    'Document the encryption purpose, authorized users, key ownership, integration behavior, and reporting limitations.',

                entityType:
                    ENTITY_TYPES.FIELD,

                entityApiName:
                    qualifiedApiName
            })
        );
    }

    if (
        isRelationshipField(field) &&
        !safeString(
            field.relationshipName ||
            field?.relationship
                ?.relationshipName
        )
    ) {
        findings.push(
            createFinding({
                id:
                    createRuleFindingId(
                        KNOWLEDGE_RULE_IDS
                            .FIELD_RELATIONSHIP_WITHOUT_NAME,
                        qualifiedApiName
                    ),

                category:
                    HEALTH_CATEGORIES
                        .DATA_MODEL,

                title:
                    `${label} has incomplete relationship metadata`,

                summary:
                    'The field references another object, but a relationship name was not available in the metadata supplied.',

                severity:
                    SEVERITY_LEVELS.LOW,

                riskLevel:
                    RISK_LEVELS.LOW,

                scoreImpact:
                    1,

                evidence: [
                    `Relationship field: ${qualifiedApiName}`,
                    'Relationship name: blank'
                ],

                recommendation:
                    'Verify the relationship configuration and confirm that the metadata service returns relationship names.',

                entityType:
                    ENTITY_TYPES.FIELD,

                entityApiName:
                    qualifiedApiName
            })
        );
    }

    if (
        field.accessible === false ||
        field
            ?.capabilities
            ?.accessible === false
    ) {
        findings.push(
            createFinding({
                id:
                    createRuleFindingId(
                        KNOWLEDGE_RULE_IDS
                            .FIELD_NOT_ACCESSIBLE,
                        qualifiedApiName
                    ),

                category:
                    HEALTH_CATEGORIES
                        .SECURITY,

                title:
                    `${label} is not accessible to the running user`,

                summary:
                    'Field-level security prevents the current context from reading this field.',

                severity:
                    SEVERITY_LEVELS
                        .INFORMATIONAL,

                riskLevel:
                    RISK_LEVELS.UNKNOWN,

                scoreImpact:
                    0,

                evidence: [
                    'Accessible: false'
                ],

                recommendation:
                    'Confirm whether this field should be visible to the running user before changing field-level security.',

                entityType:
                    ENTITY_TYPES.FIELD,

                entityApiName:
                    qualifiedApiName
            })
        );
    }

    return findings;
}

/*
 * Flow rules
 */
export function evaluateFlowRules(
    flows = [],
    thresholds = KNOWLEDGE_RULE_THRESHOLDS,
    organization = {}
) {
    const findings = [];

    normalizeArray(flows)
        .forEach(
            (flow) => {
                const apiName =
                    getApiName(flow);

                const label =
                    getLabel(flow);

                const status =
                    normalizeText(
                        flow.status
                    );

                const dmlCount =
                    firstKnownNumber(
                        flow.dmlCount,
                        flow.recordOperationCount,
                        flow.dataElementCount,
                        flow?.metrics?.dmlCount
                    );

                const hasFaultPaths =
                    firstKnownBoolean(
                        flow.hasFaultPaths,
                        flow.hasFaultPath,
                        flow.faultPathsConfigured,
                        flow?.metrics
                            ?.hasFaultPaths
                    );

                const elementCount =
                    firstKnownNumber(
                        flow.elementCount,
                        flow.totalElements,
                        flow?.metrics
                            ?.elementCount
                    );

                const decisionCount =
                    firstKnownNumber(
                        flow.decisionCount,
                        flow?.metrics
                            ?.decisionCount
                    );

                const loopCount =
                    firstKnownNumber(
                        flow.loopCount,
                        flow?.metrics
                            ?.loopCount
                    );

                const hasEntryConditions =
                    firstKnownBoolean(
                        flow.hasEntryConditions,
                        flow.entryConditionsConfigured,
                        flow?.metrics
                            ?.hasEntryConditions
                    );

                const flowType =
                    normalizeText(
                        flow.processType ||
                        flow.flowType ||
                        flow.type
                    );

                if (
                    dmlCount > 0 &&
                    hasFaultPaths === false
                ) {
                    findings.push(
                        createFinding({
                            id:
                                createRuleFindingId(
                                    KNOWLEDGE_RULE_IDS
                                        .FLOW_MISSING_FAULT_PATH,
                                    apiName
                                ),

                            category:
                                HEALTH_CATEGORIES
                                    .AUTOMATION,

                            title:
                                `${label} is missing fault paths`,

                            summary:
                                'The Flow performs record operations but does not have confirmed fault handling. Unhandled failures may create poor user experiences and make troubleshooting more difficult.',

                            severity:
                                SEVERITY_LEVELS.HIGH,

                            riskLevel:
                                RISK_LEVELS.HIGH,

                            scoreImpact:
                                8,

                            evidence: [
                                `Record or DML operations: ${dmlCount}`,
                                'Fault paths configured: false'
                            ],

                            recommendation:
                                'Add fault connectors to record operations, subflows, and actions. Log the error and provide an appropriate user or administrator notification.',

                            entityType:
                                ENTITY_TYPES.FLOW,

                            entityApiName:
                                apiName,

                            blocking:
                                true
                        })
                    );
                }

                if (
                    status &&
                    status !== 'active'
                ) {
                    findings.push(
                        createFinding({
                            id:
                                createRuleFindingId(
                                    KNOWLEDGE_RULE_IDS
                                        .FLOW_INACTIVE,
                                    apiName
                                ),

                            category:
                                HEALTH_CATEGORIES
                                    .AUTOMATION,

                            title:
                                `${label} is not active`,

                            summary:
                                `The Flow status is ${safeString(flow.status, 'unknown')}. Inactive or draft versions may represent unfinished work, obsolete automation, or deployment dependencies.`,

                            severity:
                                SEVERITY_LEVELS.LOW,

                            riskLevel:
                                RISK_LEVELS.LOW,

                            scoreImpact:
                                1,

                            evidence: [
                                `Status: ${safeString(flow.status, 'Unknown')}`
                            ],

                            recommendation:
                                'Confirm whether the Flow should be activated, retained as a draft, archived, or removed.',

                            entityType:
                                ENTITY_TYPES.FLOW,

                            entityApiName:
                                apiName
                        })
                    );
                }

                if (
                    !getDescription(flow)
                ) {
                    findings.push(
                        createFinding({
                            id:
                                createRuleFindingId(
                                    KNOWLEDGE_RULE_IDS
                                        .FLOW_MISSING_DESCRIPTION,
                                    apiName
                                ),

                            category:
                                HEALTH_CATEGORIES
                                    .DOCUMENTATION,

                            title:
                                `${label} is missing a description`,

                            summary:
                                'The Flow does not include a clear business or technical description.',

                            severity:
                                SEVERITY_LEVELS.LOW,

                            riskLevel:
                                RISK_LEVELS.LOW,

                            scoreImpact:
                                1,

                            evidence: [
                                'Description: blank'
                            ],

                            recommendation:
                                'Document the business purpose, trigger, entry criteria, major actions, fault handling, owner, and testing expectations.',

                            entityType:
                                ENTITY_TYPES.FLOW,

                            entityApiName:
                                apiName
                        })
                    );
                }

                if (
                    elementCount >=
                    thresholds
                        .FLOW_ELEMENT_COUNT_HIGH ||
                    decisionCount >=
                    thresholds
                        .FLOW_DECISION_COUNT_HIGH ||
                    loopCount >=
                    thresholds
                        .FLOW_LOOP_COUNT_HIGH
                ) {
                    findings.push(
                        createFinding({
                            id:
                                createRuleFindingId(
                                    KNOWLEDGE_RULE_IDS
                                        .FLOW_HIGH_COMPLEXITY,
                                    apiName
                                ),

                            category:
                                HEALTH_CATEGORIES
                                    .AUTOMATION,

                            title:
                                `${label} has high automation complexity`,

                            summary:
                                'The Flow contains enough elements, decisions, or loops to increase maintenance and regression-testing risk.',

                            severity:
                                SEVERITY_LEVELS.MEDIUM,

                            riskLevel:
                                RISK_LEVELS.MEDIUM,

                            scoreImpact:
                                4,

                            evidence: [
                                `Elements: ${elementCount}`,
                                `Decisions: ${decisionCount}`,
                                `Loops: ${loopCount}`
                            ],

                            recommendation:
                                'Review whether reusable subflows, simplified decision logic, clearer naming, or smaller responsibility-based Flows would improve maintainability.',

                            entityType:
                                ENTITY_TYPES.FLOW,

                            entityApiName:
                                apiName
                        })
                    );
                }

                if (
                    loopCount > 0 &&
                    dmlCount > 0 &&
                    firstKnownBoolean(
                        flow.hasDmlInsideLoop,
                        flow.dmlInsideLoop,
                        flow?.metrics
                            ?.hasDmlInsideLoop
                    ) === true
                ) {
                    findings.push(
                        createFinding({
                            id:
                                createRuleFindingId(
                                    KNOWLEDGE_RULE_IDS
                                        .FLOW_LOOP_WITH_DML,
                                    apiName
                                ),

                            category:
                                HEALTH_CATEGORIES
                                    .PERFORMANCE,

                            title:
                                `${label} may perform record operations inside a loop`,

                            summary:
                                'Record operations inside loops can cause governor-limit failures and poor performance when processing multiple records.',

                            severity:
                                SEVERITY_LEVELS
                                    .CRITICAL,

                            riskLevel:
                                RISK_LEVELS.CRITICAL,

                            scoreImpact:
                                12,

                            evidence: [
                                `Loops: ${loopCount}`,
                                `Record operations: ${dmlCount}`,
                                'DML inside loop: true'
                            ],

                            recommendation:
                                'Collect records inside the loop and perform a single Create, Update, or Delete Records operation after the loop.',

                            entityType:
                                ENTITY_TYPES.FLOW,

                            entityApiName:
                                apiName,

                            blocking:
                                true
                        })
                    );
                }

                if (
                    isRecordTriggeredFlow(
                        flowType
                    ) &&
                    hasEntryConditions ===
                        false
                ) {
                    findings.push(
                        createFinding({
                            id:
                                createRuleFindingId(
                                    KNOWLEDGE_RULE_IDS
                                        .FLOW_NO_ENTRY_CONDITIONS,
                                    apiName
                                ),

                            category:
                                HEALTH_CATEGORIES
                                    .PERFORMANCE,

                            title:
                                `${label} has no confirmed entry conditions`,

                            summary:
                                'A record-triggered Flow without selective entry criteria may run more often than necessary.',

                            severity:
                                SEVERITY_LEVELS.MEDIUM,

                            riskLevel:
                                RISK_LEVELS.MEDIUM,

                            scoreImpact:
                                3,

                            evidence: [
                                `Flow type: ${safeString(flow.flowType || flow.processType || flow.type)}`,
                                'Entry conditions configured: false'
                            ],

                            recommendation:
                                'Add selective entry criteria or confirm that the Flow intentionally runs for every relevant record.',

                            entityType:
                                ENTITY_TYPES.FLOW,

                            entityApiName:
                                apiName
                        })
                    );
                }

                const orgApiVersion =
                    safeNumber(
                        organization.apiVersion
                    );

                const flowApiVersion =
                    safeNumber(
                        flow.apiVersion
                    );

                if (
                    orgApiVersion > 0 &&
                    flowApiVersion > 0 &&
                    orgApiVersion -
                        flowApiVersion >=
                        thresholds
                            .OLD_API_VERSION_DIFFERENCE
                ) {
                    findings.push(
                        createFinding({
                            id:
                                createRuleFindingId(
                                    KNOWLEDGE_RULE_IDS
                                        .FLOW_OLD_API_VERSION,
                                    apiName
                                ),

                            category:
                                HEALTH_CATEGORIES
                                    .METADATA,

                            title:
                                `${label} uses an older API version`,

                            summary:
                                `The Flow uses API version ${flowApiVersion}, while the organization context reports version ${orgApiVersion}.`,

                            severity:
                                SEVERITY_LEVELS.LOW,

                            riskLevel:
                                RISK_LEVELS.LOW,

                            scoreImpact:
                                1,

                            evidence: [
                                `Flow API version: ${flowApiVersion}`,
                                `Organization API version: ${orgApiVersion}`
                            ],

                            recommendation:
                                'Review release notes and regression-test the Flow before updating its API version.',

                            entityType:
                                ENTITY_TYPES.FLOW,

                            entityApiName:
                                apiName
                        })
                    );
                }
            }
        );

    return findings;
}

/*
 * Validation-rule rules
 */
export function evaluateValidationRuleRules(
    validationRules = []
) {
    const findings = [];

    normalizeArray(validationRules)
        .forEach(
            (rule) => {
                const apiName =
                    getApiName(rule);

                const label =
                    getLabel(rule);

                if (
                    firstKnownBoolean(
                        rule.active,
                        rule.isActive
                    ) === false
                ) {
                    findings.push(
                        createFinding({
                            id:
                                createRuleFindingId(
                                    KNOWLEDGE_RULE_IDS
                                        .VALIDATION_RULE_INACTIVE,
                                    apiName
                                ),

                            category:
                                HEALTH_CATEGORIES
                                    .AUTOMATION,

                            title:
                                `${label} is inactive`,

                            summary:
                                'This Validation Rule is disabled and is not currently enforcing its business requirement.',

                            severity:
                                SEVERITY_LEVELS.LOW,

                            riskLevel:
                                RISK_LEVELS.LOW,

                            scoreImpact:
                                1,

                            evidence: [
                                'Active: false'
                            ],

                            recommendation:
                                'Confirm whether the rule should be reactivated, documented as intentionally disabled, or removed.',

                            entityType:
                                ENTITY_TYPES
                                    .VALIDATION_RULE,

                            entityApiName:
                                apiName
                        })
                    );
                }

                if (
                    !getDescription(rule)
                ) {
                    findings.push(
                        createFinding({
                            id:
                                createRuleFindingId(
                                    KNOWLEDGE_RULE_IDS
                                        .VALIDATION_RULE_MISSING_DESCRIPTION,
                                    apiName
                                ),

                            category:
                                HEALTH_CATEGORIES
                                    .DOCUMENTATION,

                            title:
                                `${label} is missing a description`,

                            summary:
                                'The Validation Rule does not explain the business condition it protects.',

                            severity:
                                SEVERITY_LEVELS.LOW,

                            riskLevel:
                                RISK_LEVELS.LOW,

                            scoreImpact:
                                1,

                            evidence: [
                                'Description: blank'
                            ],

                            recommendation:
                                'Document the business requirement, affected users, exceptions, error message behavior, and test scenarios.',

                            entityType:
                                ENTITY_TYPES
                                    .VALIDATION_RULE,

                            entityApiName:
                                apiName
                        })
                    );
                }
            }
        );

    return findings;
}

/*
 * Duplicate-management rules
 */
export function evaluateDuplicateManagementRules({
    duplicateRules = [],
    matchingRules = []
} = {}) {
    const findings = [];

    normalizeArray(duplicateRules)
        .forEach(
            (rule) => {
                const apiName =
                    getApiName(rule);

                const label =
                    getLabel(rule);

                if (
                    firstKnownBoolean(
                        rule.active,
                        rule.isActive
                    ) === false
                ) {
                    findings.push(
                        createFinding({
                            id:
                                createRuleFindingId(
                                    KNOWLEDGE_RULE_IDS
                                        .DUPLICATE_RULE_DISABLED,
                                    apiName
                                ),

                            category:
                                HEALTH_CATEGORIES
                                    .METADATA,

                            title:
                                `${label} is disabled`,

                            summary:
                                'This Duplicate Rule is not currently detecting or preventing duplicate records.',

                            severity:
                                SEVERITY_LEVELS.MEDIUM,

                            riskLevel:
                                RISK_LEVELS.MEDIUM,

                            scoreImpact:
                                4,

                            evidence: [
                                'Duplicate Rule active: false'
                            ],

                            recommendation:
                                'Confirm the intended duplicate-management strategy and activate, replace, or retire the rule.',

                            entityType:
                                ENTITY_TYPES.UNKNOWN,

                            entityApiName:
                                apiName
                        })
                    );
                }
            }
        );

    normalizeArray(matchingRules)
        .forEach(
            (rule) => {
                const apiName =
                    getApiName(rule);

                const label =
                    getLabel(rule);

                if (
                    firstKnownBoolean(
                        rule.active,
                        rule.isActive
                    ) === false
                ) {
                    findings.push(
                        createFinding({
                            id:
                                createRuleFindingId(
                                    KNOWLEDGE_RULE_IDS
                                        .MATCHING_RULE_INACTIVE,
                                    apiName
                                ),

                            category:
                                HEALTH_CATEGORIES
                                    .METADATA,

                            title:
                                `${label} is inactive`,

                            summary:
                                'This Matching Rule is not currently available to support active duplicate detection.',

                            severity:
                                SEVERITY_LEVELS.MEDIUM,

                            riskLevel:
                                RISK_LEVELS.MEDIUM,

                            scoreImpact:
                                3,

                            evidence: [
                                'Matching Rule active: false'
                            ],

                            recommendation:
                                'Review dependent Duplicate Rules before activating, replacing, or removing this Matching Rule.',

                            entityType:
                                ENTITY_TYPES.UNKNOWN,

                            entityApiName:
                                apiName
                        })
                    );
                }
            }
        );

    return findings;
}

/*
 * Security rules
 */
export function evaluateSecurityRules({
    permissionSets = [],
    profiles = []
} = {}) {
    const findings = [];

    normalizeArray(permissionSets)
        .forEach(
            (permissionSet) => {
                const apiName =
                    getApiName(
                        permissionSet
                    );

                const label =
                    getLabel(
                        permissionSet
                    );

                const assignmentCount =
                    firstKnownNumber(
                        permissionSet.assignmentCount,
                        permissionSet.assignedUserCount,
                        permissionSet.userCount
                    );

                const assignmentKnown =
                    hasAnyDefinedValue(
                        permissionSet.assignmentCount,
                        permissionSet.assignedUserCount,
                        permissionSet.userCount
                    );

                if (
                    assignmentKnown &&
                    assignmentCount === 0 &&
                    !safeBoolean(
                        permissionSet
                            .isOwnedByProfile
                    )
                ) {
                    findings.push(
                        createFinding({
                            id:
                                createRuleFindingId(
                                    KNOWLEDGE_RULE_IDS
                                        .PERMISSION_SET_UNASSIGNED,
                                    apiName
                                ),

                            category:
                                HEALTH_CATEGORIES
                                    .SECURITY,

                            title:
                                `${label} is not assigned`,

                            summary:
                                'This Permission Set currently has no assigned users.',

                            severity:
                                SEVERITY_LEVELS.MEDIUM,

                            riskLevel:
                                RISK_LEVELS.MEDIUM,

                            scoreImpact:
                                3,

                            evidence: [
                                'Assignment count: 0'
                            ],

                            recommendation:
                                'Confirm whether the Permission Set is awaiting use, obsolete, duplicated, or missing intended assignments.',

                            entityType:
                                ENTITY_TYPES
                                    .PERMISSION_SET,

                            entityApiName:
                                apiName
                        })
                    );
                }

                if (
                    !getDescription(
                        permissionSet
                    )
                ) {
                    findings.push(
                        createFinding({
                            id:
                                createRuleFindingId(
                                    KNOWLEDGE_RULE_IDS
                                        .PERMISSION_SET_MISSING_DESCRIPTION,
                                    apiName
                                ),

                            category:
                                HEALTH_CATEGORIES
                                    .DOCUMENTATION,

                            title:
                                `${label} is missing a description`,

                            summary:
                                'The Permission Set does not clearly document who should receive it or what access it grants.',

                            severity:
                                SEVERITY_LEVELS.LOW,

                            riskLevel:
                                RISK_LEVELS.LOW,

                            scoreImpact:
                                1,

                            evidence: [
                                'Description: blank'
                            ],

                            recommendation:
                                'Document the business purpose, intended audience, owner, approval process, and access granted.',

                            entityType:
                                ENTITY_TYPES
                                    .PERMISSION_SET,

                            entityApiName:
                                apiName
                        })
                    );
                }

                if (
                    hasBroadSystemAccess(
                        permissionSet
                    )
                ) {
                    findings.push(
                        createFinding({
                            id:
                                createRuleFindingId(
                                    KNOWLEDGE_RULE_IDS
                                        .PERMISSION_SET_BROAD_ACCESS,
                                    apiName
                                ),

                            category:
                                HEALTH_CATEGORIES
                                    .SECURITY,

                            title:
                                `${label} grants broad access`,

                            summary:
                                'This Permission Set appears to grant high-impact system or data access.',

                            severity:
                                SEVERITY_LEVELS.HIGH,

                            riskLevel:
                                RISK_LEVELS.HIGH,

                            scoreImpact:
                                7,

                            evidence:
                                getBroadAccessEvidence(
                                    permissionSet
                                ),

                            recommendation:
                                'Apply least privilege, document the justification, restrict assignments, and periodically review assigned users.',

                            entityType:
                                ENTITY_TYPES
                                    .PERMISSION_SET,

                            entityApiName:
                                apiName
                        })
                    );
                }
            }
        );

    normalizeArray(profiles)
        .forEach(
            (profile) => {
                const apiName =
                    getApiName(profile);

                const label =
                    getLabel(profile);

                if (
                    hasBroadSystemAccess(
                        profile
                    )
                ) {
                    findings.push(
                        createFinding({
                            id:
                                createRuleFindingId(
                                    KNOWLEDGE_RULE_IDS
                                        .PROFILE_BROAD_ACCESS,
                                    apiName
                                ),

                            category:
                                HEALTH_CATEGORIES
                                    .SECURITY,

                            title:
                                `${label} grants broad access`,

                            summary:
                                'This profile appears to grant high-impact system or data permissions.',

                            severity:
                                SEVERITY_LEVELS.HIGH,

                            riskLevel:
                                RISK_LEVELS.HIGH,

                            scoreImpact:
                                7,

                            evidence:
                                getBroadAccessEvidence(
                                    profile
                                ),

                            recommendation:
                                'Reduce profile-level access where practical and move incremental permissions into permission sets or permission set groups.',

                            entityType:
                                ENTITY_TYPES.UNKNOWN,

                            entityApiName:
                                apiName
                        })
                    );
                }
            }
        );

    return findings;
}

/*
 * Apex and testing rules
 */
export function evaluateApexRules(
    apexClasses = [],
    thresholds = KNOWLEDGE_RULE_THRESHOLDS
) {
    const findings = [];

    normalizeArray(apexClasses)
        .forEach(
            (apexClass) => {
                const apiName =
                    getApiName(apexClass);

                const label =
                    getLabel(apexClass);

                const isTest =
                    firstKnownBoolean(
                        apexClass.isTest,
                        apexClass.testClass
                    ) === true ||
                    normalizeText(
                        apexClass.body
                    ).includes(
                        '@istest'
                    );

                if (isTest) {
                    return;
                }

                const hasTestClass =
                    firstKnownBoolean(
                        apexClass.hasTestClass,
                        apexClass.hasTests,
                        apexClass.testCoverageAvailable
                    );

                const coverage =
                    firstKnownNumber(
                        apexClass.coverage,
                        apexClass.codeCoverage,
                        apexClass.coveragePercent
                    );

                const coverageKnown =
                    hasAnyDefinedValue(
                        apexClass.coverage,
                        apexClass.codeCoverage,
                        apexClass.coveragePercent
                    );

                if (
                    hasTestClass === false ||
                    (
                        !coverageKnown &&
                        hasTestClass === false
                    )
                ) {
                    findings.push(
                        createFinding({
                            id:
                                createRuleFindingId(
                                    KNOWLEDGE_RULE_IDS
                                        .APEX_NO_TEST_CLASS,
                                    apiName
                                ),

                            category:
                                HEALTH_CATEGORIES
                                    .TESTING,

                            title:
                                `${label} has no confirmed test coverage`,

                            summary:
                                'The Apex class does not have a confirmed supporting test class or test coverage result.',

                            severity:
                                SEVERITY_LEVELS.HIGH,

                            riskLevel:
                                RISK_LEVELS.HIGH,

                            scoreImpact:
                                9,

                            evidence: [
                                'Confirmed test class: false'
                            ],

                            recommendation:
                                'Create focused Apex tests covering positive, negative, bulk, permission, exception, and edge-case scenarios.',

                            entityType:
                                ENTITY_TYPES.APEX,

                            entityApiName:
                                apiName,

                            blocking:
                                true
                        })
                    );
                }

                if (
                    coverageKnown &&
                    coverage <
                        thresholds
                            .APEX_MINIMUM_COVERAGE
                ) {
                    findings.push(
                        createFinding({
                            id:
                                createRuleFindingId(
                                    KNOWLEDGE_RULE_IDS
                                        .APEX_LOW_COVERAGE,
                                    apiName
                                ),

                            category:
                                HEALTH_CATEGORIES
                                    .TESTING,

                            title:
                                `${label} is below minimum coverage`,

                            summary:
                                `The Apex class has ${coverage}% test coverage, below the configured minimum of ${thresholds.APEX_MINIMUM_COVERAGE}%.`,

                            severity:
                                SEVERITY_LEVELS
                                    .CRITICAL,

                            riskLevel:
                                RISK_LEVELS.CRITICAL,

                            scoreImpact:
                                12,

                            evidence: [
                                `Coverage: ${coverage}%`,
                                `Minimum: ${thresholds.APEX_MINIMUM_COVERAGE}%`
                            ],

                            recommendation:
                                'Add meaningful tests until the class meets deployment requirements and important business paths are protected.',

                            entityType:
                                ENTITY_TYPES.APEX,

                            entityApiName:
                                apiName,

                            blocking:
                                true
                        })
                    );
                } else if (
                    coverageKnown &&
                    coverage <
                        thresholds
                            .APEX_WARNING_COVERAGE
                ) {
                    findings.push(
                        createFinding({
                            id:
                                createRuleFindingId(
                                    KNOWLEDGE_RULE_IDS
                                        .APEX_LOW_COVERAGE,
                                    apiName
                                ),

                            category:
                                HEALTH_CATEGORIES
                                    .TESTING,

                            title:
                                `${label} has limited test coverage`,

                            summary:
                                `The Apex class has ${coverage}% coverage. It passes the minimum threshold but leaves limited protection for future changes.`,

                            severity:
                                SEVERITY_LEVELS.MEDIUM,

                            riskLevel:
                                RISK_LEVELS.MEDIUM,

                            scoreImpact:
                                4,

                            evidence: [
                                `Coverage: ${coverage}%`,
                                `Recommended warning threshold: ${thresholds.APEX_WARNING_COVERAGE}%`
                            ],

                            recommendation:
                                'Add assertions and tests for edge cases, bulk behavior, permissions, exceptions, and integration failures.',

                            entityType:
                                ENTITY_TYPES.APEX,

                            entityApiName:
                                apiName
                        })
                    );
                }

                if (
                    !getDescription(
                        apexClass
                    )
                ) {
                    findings.push(
                        createFinding({
                            id:
                                createRuleFindingId(
                                    KNOWLEDGE_RULE_IDS
                                        .APEX_MISSING_DESCRIPTION,
                                    apiName
                                ),

                            category:
                                HEALTH_CATEGORIES
                                    .DOCUMENTATION,

                            title:
                                `${label} is missing documentation`,

                            summary:
                                'The Apex class does not include a supplied description or documentation summary.',

                            severity:
                                SEVERITY_LEVELS.LOW,

                            riskLevel:
                                RISK_LEVELS.LOW,

                            scoreImpact:
                                1,

                            evidence: [
                                'Description: blank'
                            ],

                            recommendation:
                                'Document the class responsibility, business owner, entry points, dependencies, security behavior, and test class.',

                            entityType:
                                ENTITY_TYPES.APEX,

                            entityApiName:
                                apiName
                        })
                    );
                }
            }
        );

    return findings;
}

/*
 * Report and dashboard rules
 */
export function evaluateAnalyticsRules(
    {
        reports = [],
        dashboards = []
    } = {},
    thresholds = KNOWLEDGE_RULE_THRESHOLDS
) {
    const findings = [];

    normalizeArray(reports)
        .forEach(
            (report) => {
                const daysSinceLastRun =
                    getDaysSinceActivity(
                        report.lastRunDate ||
                        report.lastViewedDate ||
                        report.lastModifiedDate
                    );

                if (
                    daysSinceLastRun !== null &&
                    daysSinceLastRun >=
                        thresholds
                            .UNUSED_REPORT_DAYS
                ) {
                    const apiName =
                        getApiName(report);

                    findings.push(
                        createFinding({
                            id:
                                createRuleFindingId(
                                    KNOWLEDGE_RULE_IDS
                                        .REPORT_UNUSED,
                                    apiName
                                ),

                            category:
                                HEALTH_CATEGORIES
                                    .METADATA,

                            title:
                                `${getLabel(report)} may be unused`,

                            summary:
                                `This report has no recorded activity within approximately ${daysSinceLastRun} days.`,

                            severity:
                                SEVERITY_LEVELS.LOW,

                            riskLevel:
                                RISK_LEVELS.LOW,

                            scoreImpact:
                                1,

                            evidence: [
                                `Days since recorded activity: ${daysSinceLastRun}`
                            ],

                            recommendation:
                                'Confirm ownership and business use before archiving or deleting the report.',

                            entityType:
                                ENTITY_TYPES.REPORT,

                            entityApiName:
                                apiName
                        })
                    );
                }
            }
        );

    normalizeArray(dashboards)
        .forEach(
            (dashboard) => {
                const daysSinceActivity =
                    getDaysSinceActivity(
                        dashboard.lastViewedDate ||
                        dashboard.lastRefreshDate ||
                        dashboard.lastModifiedDate
                    );

                if (
                    daysSinceActivity !== null &&
                    daysSinceActivity >=
                        thresholds
                            .UNUSED_DASHBOARD_DAYS
                ) {
                    const apiName =
                        getApiName(
                            dashboard
                        );

                    findings.push(
                        createFinding({
                            id:
                                createRuleFindingId(
                                    KNOWLEDGE_RULE_IDS
                                        .DASHBOARD_UNUSED,
                                    apiName
                                ),

                            category:
                                HEALTH_CATEGORIES
                                    .METADATA,

                            title:
                                `${getLabel(dashboard)} may be unused`,

                            summary:
                                `This dashboard has no recorded activity within approximately ${daysSinceActivity} days.`,

                            severity:
                                SEVERITY_LEVELS.LOW,

                            riskLevel:
                                RISK_LEVELS.LOW,

                            scoreImpact:
                                1,

                            evidence: [
                                `Days since recorded activity: ${daysSinceActivity}`
                            ],

                            recommendation:
                                'Confirm ownership, audience, subscriptions, and business value before archiving or deleting the dashboard.',

                            entityType:
                                ENTITY_TYPES
                                    .DASHBOARD,

                            entityApiName:
                                apiName
                        })
                    );
                }
            }
        );

    return findings;
}

/*
 * Generic metadata documentation rules
 */
export function evaluateMetadataDocumentationRules(
    metadataItems = []
) {
    const findings = [];

    normalizeArray(metadataItems)
        .forEach(
            (item) => {
                const apiName =
                    getApiName(item);

                const label =
                    getLabel(item);

                const owner =
                    safeString(
                        item.owner ||
                        item.ownerName ||
                        item.businessOwner ||
                        item.technicalOwner
                    );

                if (
                    firstKnownBoolean(
                        item.requiresOwner,
                        item.ownerRequired
                    ) === true &&
                    !owner
                ) {
                    findings.push(
                        createFinding({
                            id:
                                createRuleFindingId(
                                    KNOWLEDGE_RULE_IDS
                                        .METADATA_MISSING_OWNER,
                                    apiName
                                ),

                            category:
                                HEALTH_CATEGORIES
                                    .DOCUMENTATION,

                            title:
                                `${label} is missing an owner`,

                            summary:
                                'This metadata item requires ownership, but no business or technical owner was supplied.',

                            severity:
                                SEVERITY_LEVELS.MEDIUM,

                            riskLevel:
                                RISK_LEVELS.MEDIUM,

                            scoreImpact:
                                3,

                            evidence: [
                                'Owner required: true',
                                'Owner: blank'
                            ],

                            recommendation:
                                'Assign a business owner and technical owner responsible for requirements, testing, approvals, and ongoing maintenance.',

                            entityType:
                                mapEntityType(
                                    item.entityType ||
                                    item.metadataType
                                ),

                            entityApiName:
                                apiName
                        })
                    );
                }

                if (
                    firstKnownBoolean(
                        item.requiresDescription,
                        item.descriptionRequired
                    ) === true &&
                    !getDescription(item)
                ) {
                    findings.push(
                        createFinding({
                            id:
                                createRuleFindingId(
                                    KNOWLEDGE_RULE_IDS
                                        .METADATA_MISSING_DESCRIPTION,
                                    apiName
                                ),

                            category:
                                HEALTH_CATEGORIES
                                    .DOCUMENTATION,

                            title:
                                `${label} is missing documentation`,

                            summary:
                                'This metadata item requires a description, but no description was supplied.',

                            severity:
                                SEVERITY_LEVELS.LOW,

                            riskLevel:
                                RISK_LEVELS.LOW,

                            scoreImpact:
                                1,

                            evidence: [
                                'Description required: true',
                                'Description: blank'
                            ],

                            recommendation:
                                'Add a description covering business purpose, owner, dependencies, risks, and testing expectations.',

                            entityType:
                                mapEntityType(
                                    item.entityType ||
                                    item.metadataType
                                ),

                            entityApiName:
                                apiName
                        })
                    );
                }
            }
        );

    return findings;
}

/*
 * Deployment rules
 */
export function evaluateDeploymentRules(
    deployments = [],
    orgSnapshot = {}
) {
    const findings = [];

    normalizeArray(deployments)
        .forEach(
            (deployment) => {
                const deploymentName =
                    getApiName(
                        deployment
                    ) ||
                    safeString(
                        deployment.id,
                        'deployment'
                    );

                const label =
                    getLabel(
                        deployment
                    );

                const status =
                    normalizeText(
                        deployment.status
                    );

                if (
                    status === 'failed' ||
                    status === 'error' ||
                    safeBoolean(
                        deployment.success,
                        true
                    ) === false
                ) {
                    findings.push(
                        createFinding({
                            id:
                                createRuleFindingId(
                                    KNOWLEDGE_RULE_IDS
                                        .DEPLOYMENT_FAILED,
                                    deploymentName
                                ),

                            category:
                                HEALTH_CATEGORIES
                                    .DEPLOYMENT,

                            title:
                                `${label} failed`,

                            summary:
                                'The deployment did not complete successfully and requires investigation before release readiness can be confirmed.',

                            severity:
                                SEVERITY_LEVELS
                                    .CRITICAL,

                            riskLevel:
                                RISK_LEVELS.CRITICAL,

                            scoreImpact:
                                15,

                            evidence: [
                                `Status: ${safeString(deployment.status, 'Failed')}`,
                                ...normalizeArray(
                                    deployment.errors
                                )
                            ],

                            recommendation:
                                'Review component errors, test failures, dependencies, permissions, API compatibility, and target-org configuration.',

                            entityType:
                                ENTITY_TYPES
                                    .DEPLOYMENT,

                            entityApiName:
                                deploymentName,

                            blocking:
                                true
                        })
                    );
                }

                const testsRequired =
                    firstKnownBoolean(
                        deployment.testsRequired,
                        deployment.requiresTests
                    );

                const testsRun =
                    firstKnownBoolean(
                        deployment.testsRun,
                        deployment.hasTestResults
                    );

                if (
                    testsRequired === true &&
                    testsRun === false
                ) {
                    findings.push(
                        createFinding({
                            id:
                                createRuleFindingId(
                                    KNOWLEDGE_RULE_IDS
                                        .DEPLOYMENT_NO_TEST_RESULTS,
                                    deploymentName
                                ),

                            category:
                                HEALTH_CATEGORIES
                                    .TESTING,

                            title:
                                `${label} has no confirmed test results`,

                            summary:
                                'Testing is required for this deployment, but no completed test results were supplied.',

                            severity:
                                SEVERITY_LEVELS.HIGH,

                            riskLevel:
                                RISK_LEVELS.HIGH,

                            scoreImpact:
                                10,

                            evidence: [
                                'Tests required: true',
                                'Tests run: false'
                            ],

                            recommendation:
                                'Run the required Apex, Flow, regression, permission, integration, and smoke tests before deployment approval.',

                            entityType:
                                ENTITY_TYPES
                                    .DEPLOYMENT,

                            entityApiName:
                                deploymentName,

                            blocking:
                                true
                        })
                    );
                }

                const rollbackRequired =
                    firstKnownBoolean(
                        deployment.rollbackRequired,
                        deployment.requiresRollbackPlan
                    );

                const hasRollbackPlan =
                    firstKnownBoolean(
                        deployment.hasRollbackPlan,
                        deployment.rollbackPlanAvailable
                    );

                if (
                    rollbackRequired ===
                        true &&
                    hasRollbackPlan ===
                        false
                ) {
                    findings.push(
                        createFinding({
                            id:
                                createRuleFindingId(
                                    KNOWLEDGE_RULE_IDS
                                        .DEPLOYMENT_NO_ROLLBACK_PLAN,
                                    deploymentName
                                ),

                            category:
                                HEALTH_CATEGORIES
                                    .DEPLOYMENT,

                            title:
                                `${label} is missing a rollback plan`,

                            summary:
                                'The deployment requires rollback planning, but no rollback plan was confirmed.',

                            severity:
                                SEVERITY_LEVELS.HIGH,

                            riskLevel:
                                RISK_LEVELS.HIGH,

                            scoreImpact:
                                8,

                            evidence: [
                                'Rollback required: true',
                                'Rollback plan available: false'
                            ],

                            recommendation:
                                'Document deactivation, metadata reversion, data correction, owner communication, monitoring, and rollback decision criteria.',

                            entityType:
                                ENTITY_TYPES
                                    .DEPLOYMENT,

                            entityApiName:
                                deploymentName,

                            blocking:
                                true
                        })
                    );
                }
            }
        );

    const blockingSourceItems = [
        ...normalizeArray(
            orgSnapshot.blockingFindings
        ),
        ...normalizeArray(
            orgSnapshot.deploymentBlockers
        )
    ];

    if (
        blockingSourceItems.length
    ) {
        findings.push(
            createFinding({
                id:
                    KNOWLEDGE_RULE_IDS
                        .DEPLOYMENT_BLOCKED,

                category:
                    HEALTH_CATEGORIES
                        .DEPLOYMENT,

                title:
                    'Deployment readiness is blocked',

                summary:
                    `${blockingSourceItems.length} blocking issue or issues were supplied to the Org Knowledge Layer.`,

                severity:
                    SEVERITY_LEVELS
                        .CRITICAL,

                riskLevel:
                    RISK_LEVELS.CRITICAL,

                scoreImpact:
                    15,

                evidence:
                    blockingSourceItems.map(
                        (item) =>
                            safeString(
                                item.title ||
                                item.summary ||
                                item,
                                'Unspecified blocker'
                            )
                    ),

                recommendation:
                    'Resolve all blocking findings and repeat deployment validation before approving the release.',

                entityType:
                    ENTITY_TYPES
                        .DEPLOYMENT,

                entityApiName:
                    'Deployment Readiness',

                blocking:
                    true
            })
        );
    }

    return findings;
}

/*
 * Convert findings into standardized recommendations.
 */
export function buildRecommendationsFromFindings(
    findings = []
) {
    return normalizeArray(findings)
        .filter(
            (finding) =>
                safeString(
                    finding.recommendation
                )
        )
        .map(
            (finding) =>
                createRecommendation({
                    id:
                        `recommendation-${finding.id}`,

                    title:
                        buildRecommendationTitle(
                            finding
                        ),

                    description:
                        finding.recommendation,

                    priority:
                        mapSeverityToPriority(
                            finding.severity,
                            finding.blocking
                        ),

                    category:
                        finding.category,

                    action:
                        finding.recommendation,

                    rationale:
                        finding.summary,

                    relatedFindingIds: [
                        finding.id
                    ],

                    entityType:
                        finding.entityType,

                    entityApiName:
                        finding.entityApiName
                })
        );
}

/*
 * Return only findings from a requested category.
 */
export function getFindingsByCategory(
    findings = [],
    category = ''
) {
    const normalizedCategory =
        normalizeText(category);

    if (!normalizedCategory) {
        return normalizeArray(
            findings
        );
    }

    return normalizeArray(findings)
        .filter(
            (finding) =>
                normalizeText(
                    finding.category
                ) ===
                normalizedCategory
        );
}

/*
 * Return only blocking findings.
 */
export function getBlockingFindings(
    findings = []
) {
    return normalizeArray(findings)
        .filter(
            (finding) =>
                safeBoolean(
                    finding.blocking
                )
        );
}

/*
 * Return findings related to a particular metadata item.
 */
export function getFindingsForEntity(
    findings = [],
    entityApiName = ''
) {
    const normalizedEntityApiName =
        normalizeText(
            entityApiName
        );

    if (!normalizedEntityApiName) {
        return [];
    }

    return normalizeArray(findings)
        .filter(
            (finding) =>
                normalizeText(
                    finding.entityApiName
                ) ===
                normalizedEntityApiName
        );
}

/*
 * Creates a human-readable summary for the Daily Admin Brief.
 */
export function buildRuleEvaluationSummary(
    evaluation = {}
) {
    const findingSummary =
        evaluation.findingSummary ||
        summarizeFindings(
            evaluation.findings
        );

    const recommendationSummary =
        evaluation
            .recommendationSummary ||
        summarizeRecommendations(
            evaluation.recommendations
        );

    return {
        headline:
            findingSummary.total
                ? `${findingSummary.total} org-health findings require review.`
                : 'No org-health findings were detected.',

        criticalMessage:
            findingSummary.critical
                ? `${findingSummary.critical} critical finding or findings require immediate action.`
                : 'No critical findings were detected.',

        blockingMessage:
            findingSummary.blocking
                ? `${findingSummary.blocking} blocking finding or findings may prevent deployment readiness.`
                : 'No blocking findings were detected.',

        recommendationMessage:
            recommendationSummary.total
                ? `${recommendationSummary.total} recommended actions were generated.`
                : 'No recommendations were generated.',

        findingSummary,

        recommendationSummary
    };
}

/*
 * Helper functions
 */

function getApiName(
    item = {}
) {
    return safeString(
        item.apiName ||
        item.name ||
        item.developerName ||
        item.fullName ||
        item.id,
        'unknown'
    );
}

function getLabel(
    item = {}
) {
    return safeString(
        item.label ||
        item.name ||
        item.masterLabel ||
        item.developerName ||
        item.apiName ||
        item.fullName,
        'Unknown Metadata Item'
    );
}

function getDescription(
    item = {}
) {
    return safeString(
        item.description ||
        item.businessDescription ||
        item.documentation ||
        item.summary ||
        item?.metadata
            ?.description
    );
}

function createRuleFindingId(
    ruleId = 'RULE',
    entityApiName = ''
) {
    const normalizedEntity =
        normalizeText(
            entityApiName
        )
            .replace(
                /[^a-z0-9]+/g,
                '-'
            )
            .replace(
                /^-|-$/g,
                ''
            );

    return `${ruleId.toLowerCase()}-${
        normalizedEntity ||
        'organization'
    }`;
}

function buildRecommendationTitle(
    finding = {}
) {
    const entityName =
        safeString(
            finding.entityApiName
        );

    if (entityName) {
        return `Resolve ${finding.title} — ${entityName}`;
    }

    return `Resolve ${finding.title}`;
}

function mapSeverityToPriority(
    severity = '',
    blocking = false
) {
    if (blocking) {
        return RECOMMENDATION_PRIORITIES
            .IMMEDIATE;
    }

    switch (
        normalizeText(severity)
    ) {
        case 'critical':
            return RECOMMENDATION_PRIORITIES
                .IMMEDIATE;

        case 'high':
            return RECOMMENDATION_PRIORITIES
                .HIGH;

        case 'medium':
            return RECOMMENDATION_PRIORITIES
                .MEDIUM;

        case 'low':
            return RECOMMENDATION_PRIORITIES
                .LOW;

        default:
            return RECOMMENDATION_PRIORITIES
                .OPTIONAL;
    }
}

function mapEntityType(
    value = ''
) {
    const normalizedValue =
        normalizeText(value);

    const matchingType =
        Object.values(
            ENTITY_TYPES
        ).find(
            (entityType) =>
                normalizeText(
                    entityType
                ) ===
                normalizedValue
        );

    return (
        matchingType ||
        ENTITY_TYPES.UNKNOWN
    );
}

function hasKnownUsageCount(
    field = {}
) {
    return hasAnyDefinedValue(
        field.usageCount,
        field.referenceCount,
        field.dependencyCount,
        field?.metadata
            ?.usageCount
    );
}

function getUsageCount(
    field = {}
) {
    return firstKnownNumber(
        field.usageCount,
        field.referenceCount,
        field.dependencyCount,
        field?.metadata
            ?.usageCount
    );
}

function firstKnownNumber(
    ...values
) {
    const matchingValue =
        values.find(
            (value) =>
                value !== null &&
                value !== undefined &&
                value !== '' &&
                Number.isFinite(
                    Number(value)
                )
        );

    return matchingValue ===
        undefined
        ? 0
        : safeNumber(
              matchingValue
          );
}

function firstKnownBoolean(
    ...values
) {
    const matchingValue =
        values.find(
            (value) =>
                value === true ||
                value === false ||
                normalizeText(value) ===
                    'true' ||
                normalizeText(value) ===
                    'false'
        );

    if (
        matchingValue === undefined
    ) {
        return null;
    }

    return safeBoolean(
        matchingValue
    );
}

function hasAnyDefinedValue(
    ...values
) {
    return values.some(
        (value) =>
            value !== null &&
            value !== undefined &&
            value !== ''
    );
}

function isRecordTriggeredFlow(
    normalizedFlowType = ''
) {
    return (
        normalizedFlowType.includes(
            'record'
        ) ||
        normalizedFlowType.includes(
            'autolaunchedflow'
        )
    );
}

function hasBroadSystemAccess(
    securityItem = {}
) {
    return [
        securityItem.modifyAllData,
        securityItem.viewAllData,
        securityItem.manageUsers,
        securityItem.authorApex,
        securityItem.customizeApplication,
        securityItem.manageProfilesPermissionsets,
        securityItem
            ?.systemPermissions
            ?.modifyAllData,
        securityItem
            ?.systemPermissions
            ?.viewAllData,
        securityItem
            ?.systemPermissions
            ?.manageUsers,
        securityItem
            ?.systemPermissions
            ?.authorApex,
        securityItem
            ?.systemPermissions
            ?.customizeApplication
    ].some(
        (value) =>
            safeBoolean(value)
    );
}

function getBroadAccessEvidence(
    securityItem = {}
) {
    const permissionMap = [
        [
            'Modify All Data',
            securityItem.modifyAllData ||
                securityItem
                    ?.systemPermissions
                    ?.modifyAllData
        ],
        [
            'View All Data',
            securityItem.viewAllData ||
                securityItem
                    ?.systemPermissions
                    ?.viewAllData
        ],
        [
            'Manage Users',
            securityItem.manageUsers ||
                securityItem
                    ?.systemPermissions
                    ?.manageUsers
        ],
        [
            'Author Apex',
            securityItem.authorApex ||
                securityItem
                    ?.systemPermissions
                    ?.authorApex
        ],
        [
            'Customize Application',
            securityItem
                .customizeApplication ||
                securityItem
                    ?.systemPermissions
                    ?.customizeApplication
        ],
        [
            'Manage Profiles and Permission Sets',
            securityItem
                .manageProfilesPermissionsets ||
                securityItem
                    ?.systemPermissions
                    ?.manageProfilesPermissionsets
        ]
    ];

    const evidence =
        permissionMap
            .filter(
                ([, enabled]) =>
                    safeBoolean(enabled)
            )
            .map(
                ([label]) =>
                    `${label}: true`
            );

    return evidence.length
        ? evidence
        : [
              'One or more high-impact permissions were detected'
          ];
}

function getDaysSinceActivity(
    dateValue
) {
    if (!dateValue) {
        return null;
    }

    const activityDate =
        new Date(dateValue);

    if (
        Number.isNaN(
            activityDate.getTime()
        )
    ) {
        return null;
    }

    const millisecondsPerDay =
        1000 *
        60 *
        60 *
        24;

    return Math.floor(
        (
            Date.now() -
            activityDate.getTime()
        ) /
            millisecondsPerDay
    );
}