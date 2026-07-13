/*
 * orgKnowledgeService.js
 *
 * Main orchestration service for the Salesforce Copilot
 * Org Knowledge Layer.
 *
 * This service connects:
 * - knowledgeModels.js
 * - knowledgeUtilities.js
 * - knowledgeRules.js
 * - knowledgeScoring.js
 *
 * Responsibilities:
 * - accept raw Salesforce metadata
 * - normalize metadata
 * - create reusable knowledge profiles
 * - evaluate org-health rules
 * - calculate Org Health scores
 * - calculate Deployment Readiness
 * - generate Explain This insights
 * - generate Change Impact summaries
 * - generate Daily Admin Brief content
 *
 * This service does not retrieve metadata directly.
 * Apex controllers and Salesforce Copilot modules
 * provide the raw metadata snapshot.
 */

import {
    ENTITY_TYPES,
    HEALTH_CATEGORIES,
    SEVERITY_LEVELS,
    RISK_LEVELS,
    READINESS_STATUSES,
    createOrgKnowledgeModel,
    createObjectKnowledgeProfile,
    createFieldKnowledgeProfile,
    createRelationshipKnowledgeProfile,
    createRecordTypeKnowledgeProfile
} from './knowledgeModels';

import {
    normalizeArray,
    safeString,
    safeBoolean,
    safeNumber,
    deepClone,
    mapObjectMetadata,
    mapFieldMetadata,
    mapRelationshipMetadata,
    mapRecordTypeMetadata,
    sortFindingsBySeverity,
    sortRecommendationsByPriority,
    summarizeFindings,
    summarizeRecommendations,
    buildObjectSummary,
    buildFieldSummary,
    createLookupMap,
    deduplicateBy,
    formatDateTime
} from './knowledgeUtilities';

import {
    evaluateKnowledgeRules,
    getFindingsByCategory,
    getBlockingFindings,
    getFindingsForEntity,
    buildRuleEvaluationSummary
} from './knowledgeRules';

import {
    evaluateKnowledgeScoring,
    getLowestScoringCategory,
    getHighestRiskCategory
} from './knowledgeScoring';

/*
 * Current Org Knowledge Layer version.
 */
export const ORG_KNOWLEDGE_SERVICE_VERSION =
    '1.0';

/*
 * Analysis modes supported by the service.
 */
export const KNOWLEDGE_ANALYSIS_MODES =
    Object.freeze({
        FULL: 'full',
        HEALTH: 'health',
        DEPLOYMENT: 'deployment',
        EXPLAIN: 'explain',
        CHANGE_IMPACT: 'changeImpact',
        DAILY_BRIEF: 'dailyBrief'
    });

/*
 * Main service entry point.
 *
 * Example:
 *
 * const result = analyzeOrgKnowledge({
 *     organization: {},
 *     objects: [],
 *     flows: [],
 *     validationRules: [],
 *     duplicateRules: [],
 *     permissionSets: [],
 *     apexClasses: [],
 *     deployments: []
 * });
 */
export function analyzeOrgKnowledge(
    rawSnapshot = {},
    options = {}
) {
    const startedAt =
        new Date().toISOString();

    try {
        const normalizedSnapshot =
            normalizeOrgSnapshot(
                rawSnapshot
            );

        const knowledgeProfiles =
            buildKnowledgeProfiles(
                normalizedSnapshot
            );

        const ruleEvaluation =
            evaluateKnowledgeRules(
                {
                    ...normalizedSnapshot,

                    organization:
                        knowledgeProfiles
                            .organization,

                    objects:
                        knowledgeProfiles
                            .objects
                },
                options.ruleOptions || {}
            );

        const scoringEvaluation =
            evaluateKnowledgeScoring(
                ruleEvaluation,
                options.scoringOptions || {}
            );

        const knowledgeModel =
            createOrgKnowledgeModel({
                organization:
                    knowledgeProfiles
                        .organization,

                objects:
                    knowledgeProfiles
                        .objects,

                findings:
                    scoringEvaluation
                        .findings,

                recommendations:
                    scoringEvaluation
                        .recommendations,

                health:
                    scoringEvaluation
                        .health,

                deploymentReadiness:
                    scoringEvaluation
                        .deploymentReadiness,

                generatedAt:
                    new Date().toISOString(),

                serviceVersion:
                    ORG_KNOWLEDGE_SERVICE_VERSION
            });

        const dailyBrief =
            buildDailyAdminBrief({
                snapshot:
                    normalizedSnapshot,

                knowledgeModel,

                scoringEvaluation
            });

        return {
            success: true,

            analysisMode:
                safeString(
                    options.analysisMode,
                    KNOWLEDGE_ANALYSIS_MODES
                        .FULL
                ),

            knowledgeModel,

            organization:
                knowledgeProfiles
                    .organization,

            objects:
                knowledgeProfiles
                    .objects,

            findings:
                scoringEvaluation
                    .findings,

            recommendations:
                scoringEvaluation
                    .recommendations,

            health:
                scoringEvaluation
                    .health,

            deploymentReadiness:
                scoringEvaluation
                    .deploymentReadiness,

            dashboardMetrics:
                scoringEvaluation
                    .dashboardMetrics,

            scoreExplanation:
                scoringEvaluation
                    .scoreExplanation,

            dailyBrief,

            summaries: {
                findings:
                    scoringEvaluation
                        .findingSummary,

                recommendations:
                    scoringEvaluation
                        .recommendationSummary,

                rules:
                    buildRuleEvaluationSummary(
                        ruleEvaluation
                    )
            },

            metadataCounts:
                buildMetadataCounts(
                    normalizedSnapshot
                ),

            generatedAt:
                new Date().toISOString(),

            startedAt,

            serviceVersion:
                ORG_KNOWLEDGE_SERVICE_VERSION,

            errors: []
        };
    } catch (error) {
        return buildServiceErrorResult(
            error,
            startedAt
        );
    }
}

/*
 * Alias for the main analysis method.
 *
 * Other Salesforce Copilot modules may use this
 * shorter function name.
 */
export function analyzeOrg(
    rawSnapshot = {},
    options = {}
) {
    return analyzeOrgKnowledge(
        rawSnapshot,
        options
    );
}

/*
 * Normalize the complete metadata snapshot.
 *
 * The service accepts missing arrays safely.
 */
export function normalizeOrgSnapshot(
    rawSnapshot = {}
) {
    const snapshot =
        deepClone(
            rawSnapshot || {}
        );

    return {
        organization:
            normalizeOrganizationMetadata(
                snapshot.organization ||
                snapshot.org ||
                {}
            ),

        objects:
            normalizeArray(
                snapshot.objects
            ),

        flows:
            normalizeArray(
                snapshot.flows
            ),

        validationRules:
            normalizeArray(
                snapshot.validationRules
            ),

        duplicateRules:
            normalizeArray(
                snapshot.duplicateRules
            ),

        matchingRules:
            normalizeArray(
                snapshot.matchingRules
            ),

        permissionSets:
            normalizeArray(
                snapshot.permissionSets
            ),

        profiles:
            normalizeArray(
                snapshot.profiles
            ),

        apexClasses:
            normalizeArray(
                snapshot.apexClasses
            ),

        apexTriggers:
            normalizeArray(
                snapshot.apexTriggers
            ),

        reports:
            normalizeArray(
                snapshot.reports
            ),

        dashboards:
            normalizeArray(
                snapshot.dashboards
            ),

        deployments:
            normalizeArray(
                snapshot.deployments
            ),

        metadataItems:
            normalizeArray(
                snapshot.metadataItems
            ),

        blockingFindings:
            normalizeArray(
                snapshot.blockingFindings
            ),

        deploymentBlockers:
            normalizeArray(
                snapshot.deploymentBlockers
            ),

        recentChanges:
            normalizeArray(
                snapshot.recentChanges
            ),

        failedDeployments:
            normalizeArray(
                snapshot.failedDeployments
            ),

        sourceMetadata: {
            retrievedAt:
                safeString(
                    snapshot.retrievedAt,
                    new Date().toISOString()
                ),

            source:
                safeString(
                    snapshot.source,
                    'Salesforce Copilot'
                ),

            requestId:
                safeString(
                    snapshot.requestId
                )
        }
    };
}

/*
 * Normalize organization-level information.
 */
export function normalizeOrganizationMetadata(
    organization = {}
) {
    return {
        id:
            safeString(
                organization.id ||
                organization.organizationId
            ),

        name:
            safeString(
                organization.name,
                'Unknown Organization'
            ),

        userName:
            safeString(
                organization.userName ||
                organization.username
            ),

        userEmail:
            safeString(
                organization.userEmail ||
                organization.email
            ),

        apiVersion:
            safeString(
                organization.apiVersion
            ),

        locale:
            safeString(
                organization.locale
            ),

        timeZone:
            safeString(
                organization.timeZone ||
                organization.timeZoneSidKey
            ),

        organizationType:
            safeString(
                organization
                    .organizationType ||
                organization.orgType
            ),

        instanceName:
            safeString(
                organization.instanceName
            ),

        namespacePrefix:
            safeString(
                organization.namespacePrefix
            ),

        isSandbox:
            safeBoolean(
                organization.isSandbox
            ),

        totalObjects:
            safeNumber(
                organization.totalObjects
            ),

        standardObjects:
            safeNumber(
                organization.standardObjects
            ),

        customObjects:
            safeNumber(
                organization.customObjects
            ),

        queryableObjects:
            safeNumber(
                organization.queryableObjects
            ),

        accessibleObjects:
            safeNumber(
                organization.accessibleObjects
            ),

        metadata: {
            ...organization
        }
    };
}

/*
 * Build organization and object knowledge profiles.
 */
export function buildKnowledgeProfiles(
    normalizedSnapshot = {}
) {
    const objectProfiles =
        buildObjectKnowledgeProfiles(
            normalizedSnapshot.objects
        );

    const organization =
        enrichOrganizationCounts(
            normalizedSnapshot
                .organization,
            objectProfiles
        );

    return {
        organization,

        objects:
            objectProfiles,

        objectLookup:
            createLookupMap(
                objectProfiles,
                'apiName'
            ),

        generatedAt:
            new Date().toISOString()
    };
}

/*
 * Convert raw Salesforce objects into shared
 * Object Knowledge Profiles.
 */
export function buildObjectKnowledgeProfiles(
    rawObjects = []
) {
    return normalizeArray(
        rawObjects
    )
        .map(
            (rawObject) =>
                buildObjectKnowledgeProfile(
                    rawObject
                )
        )
        .filter(
            (objectProfile) =>
                safeString(
                    objectProfile.apiName
                )
        );
}

/*
 * Build one Object Knowledge Profile.
 */
export function buildObjectKnowledgeProfile(
    rawObject = {}
) {
    const normalizedObject =
        mapObjectMetadata(
            rawObject
        );

    const objectApiName =
        safeString(
            normalizedObject.apiName
        );

    const fields =
        normalizeArray(
            normalizedObject.fields
        ).map(
            (rawField) =>
                buildFieldKnowledgeProfile(
                    rawField,
                    objectApiName
                )
        );

    const relationships =
        buildRelationshipProfiles(
            normalizedObject,
            fields
        );

    const recordTypes =
        normalizeArray(
            normalizedObject
                .recordTypes
        ).map(
            (rawRecordType) =>
                createRecordTypeKnowledgeProfile(
                    mapRecordTypeMetadata(
                        rawRecordType
                    )
                )
        );

    return createObjectKnowledgeProfile({
        apiName:
            objectApiName,

        label:
            normalizedObject.label,

        labelPlural:
            normalizedObject.labelPlural,

        keyPrefix:
            normalizedObject.keyPrefix,

        custom:
            normalizedObject.custom,

        accessible:
            normalizedObject.accessible,

        queryable:
            normalizedObject.queryable,

        searchable:
            normalizedObject.searchable,

        createable:
            normalizedObject.createable,

        updateable:
            normalizedObject.updateable,

        deletable:
            normalizedObject.deletable,

        fields,

        relationships,

        recordTypes,

        findings:
            normalizeArray(
                rawObject.findings
            ),

        recommendations:
            normalizeArray(
                rawObject
                    .recommendations
            ),

        metadata: {
            ...rawObject,

            description:
                safeString(
                    rawObject.description
                ),

            owner:
                safeString(
                    rawObject.owner ||
                    rawObject
                        .businessOwner
                )
        }
    });
}

/*
 * Build one Field Knowledge Profile.
 */
export function buildFieldKnowledgeProfile(
    rawField = {},
    objectApiName = ''
) {
    const normalizedField =
        mapFieldMetadata(
            rawField,
            objectApiName
        );

    return createFieldKnowledgeProfile({
        ...normalizedField,

        findings:
            normalizeArray(
                rawField.findings
            ),

        recommendations:
            normalizeArray(
                rawField
                    .recommendations
            ),

        metadata: {
            ...rawField,

            description:
                safeString(
                    rawField.description
                ),

            inlineHelpText:
                safeString(
                    rawField.inlineHelpText ||
                    rawField.helpText
                ),

            usageCount:
                getKnownMetadataNumber(
                    rawField.usageCount,
                    rawField.referenceCount,
                    rawField.dependencyCount
                ),

            referenceCount:
                getKnownMetadataNumber(
                    rawField.referenceCount
                ),

            dependencyCount:
                getKnownMetadataNumber(
                    rawField.dependencyCount
                )
        }
    });
}

/*
 * Build relationship profiles from both:
 * - the raw object's relationship collection
 * - fields that reference another object
 */
export function buildRelationshipProfiles(
    normalizedObject = {},
    fieldProfiles = []
) {
    const objectApiName =
        safeString(
            normalizedObject.apiName
        );

    const explicitRelationships =
        normalizeArray(
            normalizedObject
                .relationships
        ).map(
            (rawRelationship) =>
                createRelationshipKnowledgeProfile(
                    {
                        ...mapRelationshipMetadata(
                            rawRelationship,
                            objectApiName
                        ),

                        targetObjects:
                            normalizeArray(
                                rawRelationship
                                    .targetObjects ||
                                rawRelationship
                                    .referenceTo
                            )
                    }
                )
        );

    const fieldRelationships =
        normalizeArray(
            fieldProfiles
        )
            .filter(
                (field) =>
                    field
                        ?.relationship
                        ?.isRelationship
            )
            .map(
                (field) =>
                    createRelationshipKnowledgeProfile({
                        fieldApiName:
                            field.apiName,

                        fieldLabel:
                            field.label,

                        sourceObject:
                            objectApiName,

                        targetObjects:
                            normalizeArray(
                                field
                                    ?.relationship
                                    ?.referenceTo
                            ),

                        relationshipName:
                            safeString(
                                field
                                    ?.relationship
                                    ?.relationshipName
                            ),

                        required:
                            safeBoolean(
                                field.required
                            ),

                        custom:
                            safeBoolean(
                                field.custom
                            )
                    })
            );

    return deduplicateBy(
        [
            ...explicitRelationships,
            ...fieldRelationships
        ],
        'fieldApiName'
    );
}

/*
 * Update organization counts using the profiles
 * produced by this service.
 */
export function enrichOrganizationCounts(
    organization = {},
    objectProfiles = []
) {
    const objects =
        normalizeArray(
            objectProfiles
        );

    const customObjects =
        objects.filter(
            (objectItem) =>
                safeBoolean(
                    objectItem.custom
                )
        );

    const accessibleObjects =
        objects.filter(
            (objectItem) =>
                safeBoolean(
                    objectItem
                        ?.capabilities
                        ?.accessible
                )
        );

    const queryableObjects =
        objects.filter(
            (objectItem) =>
                safeBoolean(
                    objectItem
                        ?.capabilities
                        ?.queryable
                )
        );

    return {
        ...organization,

        totalObjects:
            objects.length,

        customObjects:
            customObjects.length,

        standardObjects:
            objects.length -
            customObjects.length,

        accessibleObjects:
            accessibleObjects.length,

        queryableObjects:
            queryableObjects.length
    };
}

/*
 * Analyze one object or field for Explain This.
 *
 * Example:
 *
 * explainEntity(result, {
 *     entityType: 'field',
 *     entityApiName: 'Opportunity.Amount'
 * });
 */
export function explainEntity(
    analysisResult = {},
    {
        entityType = '',
        entityApiName = ''
    } = {}
) {
    const normalizedType =
        safeString(
            entityType
        ).toLowerCase();

    const normalizedApiName =
        safeString(
            entityApiName
        );

    if (
        !normalizedApiName
    ) {
        return {
            success: false,

            message:
                'An entity API name is required.',

            entity: null,

            findings: [],

            recommendations: []
        };
    }

    if (
        normalizedType ===
        ENTITY_TYPES.OBJECT
    ) {
        return explainObject(
            analysisResult,
            normalizedApiName
        );
    }

    if (
        normalizedType ===
        ENTITY_TYPES.FIELD
    ) {
        return explainField(
            analysisResult,
            normalizedApiName
        );
    }

    const findings =
        getFindingsForEntity(
            analysisResult.findings,
            normalizedApiName
        );

    const recommendations =
        getRecommendationsForEntity(
            analysisResult
                .recommendations,
            normalizedApiName
        );

    return {
        success:
            findings.length > 0 ||
            recommendations.length > 0,

        entityType:
            normalizedType ||
            ENTITY_TYPES.UNKNOWN,

        entityApiName:
            normalizedApiName,

        summary:
            findings.length
                ? findings[0].summary
                : 'No detailed metadata profile was available for this entity.',

        findings,

        recommendations,

        risks:
            findings.map(
                (finding) =>
                    finding.summary
            ),

        improvements:
            recommendations.map(
                (recommendation) =>
                    recommendation.action ||
                    recommendation.description
            )
    };
}

/*
 * Explain one Salesforce object.
 */
export function explainObject(
    analysisResult = {},
    objectApiName = ''
) {
    const objectProfile =
        normalizeArray(
            analysisResult.objects
        ).find(
            (objectItem) =>
                objectItem.apiName ===
                objectApiName
        );

    if (!objectProfile) {
        return {
            success: false,

            entityType:
                ENTITY_TYPES.OBJECT,

            entityApiName:
                objectApiName,

            message:
                'The requested object was not found in the current Org Knowledge model.',

            entity: null,

            findings: [],

            recommendations: []
        };
    }

    const findings =
        getFindingsForEntity(
            analysisResult.findings,
            objectApiName
        );

    const recommendations =
        getRecommendationsForEntity(
            analysisResult
                .recommendations,
            objectApiName
        );

    return {
        success: true,

        entityType:
            ENTITY_TYPES.OBJECT,

        entityApiName:
            objectApiName,

        title:
            objectProfile.label,

        summary:
            buildObjectSummary(
                objectProfile
            ),

        businessPurpose:
            safeString(
                objectProfile
                    ?.metadata
                    ?.description,
                'A business-purpose description has not been documented.'
            ),

        capabilities:
            objectProfile
                .capabilities,

        counts:
            objectProfile.counts,

        complexity:
            objectProfile.complexity,

        riskLevel:
            determineEntityRiskLevel(
                findings,
                objectProfile.riskLevel
            ),

        findings,

        recommendations,

        risks:
            findings.map(
                (finding) =>
                    finding.summary
            ),

        improvements:
            recommendations.map(
                (recommendation) =>
                    recommendation.action ||
                    recommendation.description
            ),

        testCases:
            buildEntityTestCases({
                entityType:
                    ENTITY_TYPES.OBJECT,

                profile:
                    objectProfile,

                findings
            }),

        entity:
            objectProfile
    };
}

/*
 * Explain one Salesforce field.
 *
 * The qualified API name should use:
 *
 * ObjectApiName.FieldApiName
 */
export function explainField(
    analysisResult = {},
    qualifiedApiName = ''
) {
    const fieldMatch =
        findFieldProfile(
            analysisResult.objects,
            qualifiedApiName
        );

    if (!fieldMatch) {
        return {
            success: false,

            entityType:
                ENTITY_TYPES.FIELD,

            entityApiName:
                qualifiedApiName,

            message:
                'The requested field was not found in the current Org Knowledge model.',

            entity: null,

            findings: [],

            recommendations: []
        };
    }

    const {
        objectProfile,
        fieldProfile
    } = fieldMatch;

    const findings =
        getFindingsForEntity(
            analysisResult.findings,
            fieldProfile
                .qualifiedApiName
        );

    const recommendations =
        getRecommendationsForEntity(
            analysisResult
                .recommendations,
            fieldProfile
                .qualifiedApiName
        );

    return {
        success: true,

        entityType:
            ENTITY_TYPES.FIELD,

        entityApiName:
            fieldProfile
                .qualifiedApiName,

        title:
            fieldProfile.label,

        objectApiName:
            objectProfile.apiName,

        objectLabel:
            objectProfile.label,

        summary:
            buildFieldSummary(
                fieldProfile
            ),

        businessPurpose:
            safeString(
                fieldProfile
                    ?.metadata
                    ?.description,
                'A business-purpose description has not been documented.'
            ),

        helpText:
            safeString(
                fieldProfile
                    ?.metadata
                    ?.inlineHelpText,
                'No help text is currently available.'
            ),

        dataType:
            fieldProfile.dataType,

        required:
            fieldProfile.required,

        unique:
            fieldProfile.unique,

        externalId:
            fieldProfile.externalId,

        calculated:
            fieldProfile.calculated,

        relationship:
            fieldProfile
                .relationship,

        riskLevel:
            determineEntityRiskLevel(
                findings,
                fieldProfile.riskLevel
            ),

        findings,

        recommendations,

        risks:
            findings.map(
                (finding) =>
                    finding.summary
            ),

        improvements:
            recommendations.map(
                (recommendation) =>
                    recommendation.action ||
                    recommendation.description
            ),

        testCases:
            buildEntityTestCases({
                entityType:
                    ENTITY_TYPES.FIELD,

                profile:
                    fieldProfile,

                findings
            }),

        entity:
            fieldProfile
    };
}

/*
 * Analyze the potential impact of changing an object
 * or field.
 */
export function analyzeChangeImpact(
    analysisResult = {},
    {
        entityType = '',
        entityApiName = '',
        proposedChange = ''
    } = {}
) {
    const explanation =
        explainEntity(
            analysisResult,
            {
                entityType,
                entityApiName
            }
        );

    if (
        !explanation.success
    ) {
        return {
            success: false,

            message:
                explanation.message,

            entityApiName,

            proposedChange,

            impactAreas: [],

            risks: [],

            requiredTests: []
        };
    }

    const impactAreas =
        buildImpactAreas(
            explanation
        );

    const riskLevel =
        determineChangeRiskLevel(
            explanation,
            proposedChange
        );

    return {
        success: true,

        entityType:
            explanation.entityType,

        entityApiName:
            explanation.entityApiName,

        proposedChange:
            safeString(
                proposedChange,
                'No proposed change was supplied.'
            ),

        riskLevel,

        summary:
            buildChangeImpactSummary({
                explanation,
                proposedChange,
                riskLevel,
                impactAreas
            }),

        impactAreas,

        findings:
            explanation.findings,

        recommendations:
            explanation
                .recommendations,

        risks:
            explanation.risks,

        requiredTests:
            explanation.testCases,

        deploymentRecommendation:
            buildChangeDeploymentRecommendation(
                riskLevel
            ),

        generatedAt:
            new Date().toISOString()
    };
}

/*
 * Generate the Daily Admin Brief.
 */
export function buildDailyAdminBrief({
    snapshot = {},
    knowledgeModel = {},
    scoringEvaluation = {}
} = {}) {
    const findings =
        sortFindingsBySeverity(
            scoringEvaluation
                .findings ||
            knowledgeModel.findings
        );

    const recommendations =
        sortRecommendationsByPriority(
            scoringEvaluation
                .recommendations ||
            knowledgeModel
                .recommendations
        );

    const metrics =
        scoringEvaluation
            .dashboardMetrics ||
        {};

    const recentChanges =
        normalizeArray(
            snapshot.recentChanges
        );

    const failedDeployments =
        normalizeArray(
            snapshot.failedDeployments
        );

    const priorities =
        recommendations
            .slice(0, 3)
            .map(
                (
                    recommendation,
                    index
                ) => ({
                    rank:
                        index + 1,

                    title:
                        recommendation.title,

                    action:
                        recommendation.action ||
                        recommendation.description,

                    priority:
                        recommendation.priority,

                    category:
                        recommendation.category,

                    entityApiName:
                        recommendation
                            .entityApiName
                })
            );

    return {
        greeting:
            'Good morning.',

        headline:
            buildDailyBriefHeadline(
                metrics
            ),

        orgHealth: {
            score:
                safeNumber(
                    metrics.orgHealthScore,
                    100
                ),

            status:
                safeString(
                    metrics.orgHealthStatus,
                    'Unknown'
                )
        },

        deploymentReadiness: {
            score:
                safeNumber(
                    metrics
                        .deploymentReadinessScore,
                    100
                ),

            status:
                safeString(
                    metrics
                        .deploymentReadinessStatus,
                    READINESS_STATUSES
                        .UNKNOWN
                )
        },

        yesterday: {
            newChanges:
                recentChanges.length,

            failedDeployments:
                failedDeployments.length,

            changes:
                recentChanges.slice(
                    0,
                    5
                )
        },

        findings: {
            total:
                safeNumber(
                    metrics.totalFindings
                ),

            critical:
                safeNumber(
                    metrics.criticalFindings
                ),

            high:
                safeNumber(
                    metrics.highFindings
                ),

            blocking:
                safeNumber(
                    metrics.blockingFindings
                ),

            top:
                findings.slice(
                    0,
                    5
                )
        },

        priorities,

        lowestCategory:
            safeString(
                metrics.lowestCategory,
                'None'
            ),

        highestRiskCategory:
            safeString(
                metrics
                    .highestRiskCategory,
                'None'
            ),

        generatedAt:
            new Date().toISOString(),

        generatedAtLabel:
            formatDateTime(
                new Date().toISOString()
            )
    };
}

/*
 * Build counts used by dashboard and reporting
 * components.
 */
export function buildMetadataCounts(
    snapshot = {}
) {
    const objects =
        normalizeArray(
            snapshot.objects
        );

    const fields =
        objects.reduce(
            (total, objectItem) =>
                total +
                normalizeArray(
                    objectItem.fields
                ).length,
            0
        );

    return {
        objects:
            objects.length,

        fields,

        flows:
            normalizeArray(
                snapshot.flows
            ).length,

        validationRules:
            normalizeArray(
                snapshot.validationRules
            ).length,

        duplicateRules:
            normalizeArray(
                snapshot.duplicateRules
            ).length,

        matchingRules:
            normalizeArray(
                snapshot.matchingRules
            ).length,

        permissionSets:
            normalizeArray(
                snapshot.permissionSets
            ).length,

        profiles:
            normalizeArray(
                snapshot.profiles
            ).length,

        apexClasses:
            normalizeArray(
                snapshot.apexClasses
            ).length,

        apexTriggers:
            normalizeArray(
                snapshot.apexTriggers
            ).length,

        reports:
            normalizeArray(
                snapshot.reports
            ).length,

        dashboards:
            normalizeArray(
                snapshot.dashboards
            ).length,

        deployments:
            normalizeArray(
                snapshot.deployments
            ).length
    };
}

/*
 * Return health findings for one category.
 */
export function getHealthCategory(
    analysisResult = {},
    category = ''
) {
    const findings =
        getFindingsByCategory(
            analysisResult.findings,
            category
        );

    const categoryResult =
        normalizeArray(
            analysisResult
                ?.health
                ?.categories
        ).find(
            (item) =>
                item.category ===
                category
        );

    return {
        category,

        score:
            safeNumber(
                categoryResult?.score,
                100
            ),

        status:
            safeString(
                categoryResult?.status,
                'Healthy'
            ),

        riskLevel:
            safeString(
                categoryResult?.riskLevel,
                RISK_LEVELS.NONE
            ),

        findings,

        recommendations:
            normalizeArray(
                analysisResult
                    .recommendations
            ).filter(
                (recommendation) =>
                    recommendation
                        .category ===
                    category
            )
    };
}

/*
 * Return deployment blockers.
 */
export function getDeploymentBlockers(
    analysisResult = {}
) {
    return getBlockingFindings(
        analysisResult.findings ||
        analysisResult
            ?.deploymentReadiness
            ?.blockingFindings
    );
}

/*
 * Return the highest-priority current issues.
 */
export function getTopPriorities(
    analysisResult = {},
    limit = 5
) {
    return sortRecommendationsByPriority(
        analysisResult
            .recommendations
    ).slice(
        0,
        Math.max(
            1,
            safeNumber(
                limit,
                5
            )
        )
    );
}

/*
 * Return a compact dashboard summary.
 */
export function getOrgHealthSummary(
    analysisResult = {}
) {
    const health =
        analysisResult.health || {};

    const categoryResults =
        normalizeArray(
            health.categories
        );

    const lowestCategory =
        getLowestScoringCategory(
            categoryResults
        );

    const highestRiskCategory =
        getHighestRiskCategory(
            categoryResults
        );

    const findingSummary =
        summarizeFindings(
            analysisResult.findings
        );

    const recommendationSummary =
        summarizeRecommendations(
            analysisResult
                .recommendations
        );

    return {
        score:
            safeNumber(
                health.overallScore,
                100
            ),

        status:
            safeString(
                health.status,
                'Healthy'
            ),

        findings:
            findingSummary,

        recommendations:
            recommendationSummary,

        lowestCategory:
            lowestCategory || null,

        highestRiskCategory:
            highestRiskCategory || null,

        deploymentReadiness:
            analysisResult
                .deploymentReadiness ||
            null
    };
}

/*
 * Helper functions
 */

function getRecommendationsForEntity(
    recommendations = [],
    entityApiName = ''
) {
    return normalizeArray(
        recommendations
    ).filter(
        (recommendation) =>
            recommendation
                .entityApiName ===
            entityApiName
    );
}

function findFieldProfile(
    objects = [],
    qualifiedApiName = ''
) {
    const normalizedName =
        safeString(
            qualifiedApiName
        );

    for (
        const objectProfile of normalizeArray(
            objects
        )
    ) {
        const fieldProfile =
            normalizeArray(
                objectProfile.fields
            ).find(
                (field) =>
                    field
                        .qualifiedApiName ===
                        normalizedName ||
                    (
                        `${objectProfile.apiName}.${field.apiName}` ===
                        normalizedName
                    )
            );

        if (fieldProfile) {
            return {
                objectProfile,
                fieldProfile
            };
        }
    }

    return null;
}

function determineEntityRiskLevel(
    findings = [],
    fallbackRisk =
        RISK_LEVELS.UNKNOWN
) {
    const normalizedFindings =
        normalizeArray(
            findings
        );

    if (
        normalizedFindings.some(
            (finding) =>
                finding.severity ===
                    SEVERITY_LEVELS
                        .CRITICAL ||
                safeBoolean(
                    finding.blocking
                )
        )
    ) {
        return RISK_LEVELS.CRITICAL;
    }

    if (
        normalizedFindings.some(
            (finding) =>
                finding.severity ===
                SEVERITY_LEVELS.HIGH
        )
    ) {
        return RISK_LEVELS.HIGH;
    }

    if (
        normalizedFindings.some(
            (finding) =>
                finding.severity ===
                SEVERITY_LEVELS
                    .MEDIUM
        )
    ) {
        return RISK_LEVELS.MEDIUM;
    }

    if (
        normalizedFindings.length
    ) {
        return RISK_LEVELS.LOW;
    }

    return fallbackRisk;
}

function buildEntityTestCases({
    entityType = '',
    profile = {},
    findings = []
} = {}) {
    const tests =
        new Set();

    if (
        entityType ===
        ENTITY_TYPES.FIELD
    ) {
        tests.add(
            'Verify the field is visible to intended users.'
        );

        tests.add(
            'Verify restricted users cannot access the field.'
        );

        if (
            safeBoolean(
                profile.required
            )
        ) {
            tests.add(
                'Verify records cannot be saved without the required field.'
            );
        }

        if (
            safeBoolean(
                profile.unique
            )
        ) {
            tests.add(
                'Verify duplicate values are rejected.'
            );
        }

        if (
            safeBoolean(
                profile.calculated
            )
        ) {
            tests.add(
                'Verify the calculated result for positive, negative, blank, and edge-case inputs.'
            );
        }

        if (
            profile
                ?.relationship
                ?.isRelationship
        ) {
            tests.add(
                'Verify valid and invalid related records.'
            );

            tests.add(
                'Verify relationship deletion and reassignment behavior.'
            );
        }
    }

    if (
        entityType ===
        ENTITY_TYPES.OBJECT
    ) {
        tests.add(
            'Verify create, read, update, and delete access for intended personas.'
        );

        tests.add(
            'Verify record-type and page-layout assignments.'
        );

        tests.add(
            'Verify required fields and Validation Rules.'
        );

        tests.add(
            'Verify related automation executes correctly.'
        );

        tests.add(
            'Verify reports and sharing behavior.'
        );
    }

    normalizeArray(findings)
        .forEach(
            (finding) => {
                if (
                    finding.category ===
                    HEALTH_CATEGORIES
                        .SECURITY
                ) {
                    tests.add(
                        'Test least-privilege security using multiple user personas.'
                    );
                }

                if (
                    finding.category ===
                    HEALTH_CATEGORIES
                        .AUTOMATION
                ) {
                    tests.add(
                        'Test automation success, failure, and bulk-processing scenarios.'
                    );
                }

                if (
                    finding.category ===
                    HEALTH_CATEGORIES
                        .DATA_MODEL
                ) {
                    tests.add(
                        'Test relationships, required values, uniqueness, and record-type behavior.'
                    );
                }
            }
        );

    return Array.from(tests);
}

function buildImpactAreas(
    explanation = {}
) {
    const impactAreas =
        new Set();

    if (
        explanation.entityType ===
        ENTITY_TYPES.FIELD
    ) {
        impactAreas.add(
            'Page layouts and Lightning pages'
        );

        impactAreas.add(
            'Flows and automation'
        );

        impactAreas.add(
            'Validation Rules and formulas'
        );

        impactAreas.add(
            'Reports and dashboards'
        );

        impactAreas.add(
            'Permission Sets and field-level security'
        );

        impactAreas.add(
            'Integrations and data imports'
        );

        if (
            explanation
                ?.relationship
                ?.isRelationship
        ) {
            impactAreas.add(
                'Object relationships and related records'
            );
        }
    }

    if (
        explanation.entityType ===
        ENTITY_TYPES.OBJECT
    ) {
        impactAreas.add(
            'Fields and relationships'
        );

        impactAreas.add(
            'Flows and Apex'
        );

        impactAreas.add(
            'Profiles, Permission Sets, and sharing'
        );

        impactAreas.add(
            'Reports, dashboards, and list views'
        );

        impactAreas.add(
            'Integrations and data migration'
        );

        impactAreas.add(
            'Record types and page layouts'
        );
    }

    normalizeArray(
        explanation.findings
    ).forEach(
        (finding) => {
            impactAreas.add(
                finding.category
            );
        }
    );

    return Array.from(
        impactAreas
    );
}

function determineChangeRiskLevel(
    explanation = {},
    proposedChange = ''
) {
    const normalizedChange =
        safeString(
            proposedChange
        ).toLowerCase();

    const destructiveKeywords = [
        'delete',
        'remove',
        'rename',
        'change data type',
        'make required',
        'disable',
        'deactivate',
        'replace'
    ];

    const destructiveChange =
        destructiveKeywords.some(
            (keyword) =>
                normalizedChange.includes(
                    keyword
                )
        );

    if (
        destructiveChange &&
        [
            RISK_LEVELS.CRITICAL,
            RISK_LEVELS.HIGH
        ].includes(
            explanation.riskLevel
        )
    ) {
        return RISK_LEVELS.CRITICAL;
    }

    if (
        destructiveChange
    ) {
        return RISK_LEVELS.HIGH;
    }

    if (
        explanation.riskLevel ===
        RISK_LEVELS.CRITICAL
    ) {
        return RISK_LEVELS.CRITICAL;
    }

    if (
        explanation.riskLevel ===
        RISK_LEVELS.HIGH
    ) {
        return RISK_LEVELS.HIGH;
    }

    if (
        normalizeArray(
            explanation.findings
        ).length
    ) {
        return RISK_LEVELS.MEDIUM;
    }

    return RISK_LEVELS.LOW;
}

function buildChangeImpactSummary({
    explanation = {},
    proposedChange = '',
    riskLevel = '',
    impactAreas = []
} = {}) {
    return `${safeString(
        proposedChange,
        'The proposed change'
    )} affects ${explanation.entityApiName}. The estimated change risk is ${riskLevel}. Review ${impactAreas.length} impact areas before deployment.`;
}

function buildChangeDeploymentRecommendation(
    riskLevel = ''
) {
    switch (riskLevel) {
        case RISK_LEVELS.CRITICAL:
            return 'Do not deploy until dependencies, data impact, testing, stakeholder approval, and rollback planning are complete.';

        case RISK_LEVELS.HIGH:
            return 'Validate in a sandbox, complete regression testing, document dependencies, and prepare a rollback plan before deployment.';

        case RISK_LEVELS.MEDIUM:
            return 'Complete targeted testing and verify permissions, automation, reports, and integrations before deployment.';

        default:
            return 'Complete standard validation and smoke testing before deployment.';
    }
}

function buildDailyBriefHeadline(
    metrics = {}
) {
    const critical =
        safeNumber(
            metrics.criticalFindings
        );

    const blocking =
        safeNumber(
            metrics.blockingFindings
        );

    const total =
        safeNumber(
            metrics.totalFindings
        );

    if (
        critical > 0 ||
        blocking > 0
    ) {
        return `${critical} critical and ${blocking} blocking findings require immediate review.`;
    }

    if (total > 0) {
        return `${total} Org Health findings are available for review.`;
    }

    return 'No new Org Health findings require attention.';
}

function getKnownMetadataNumber(
    ...values
) {
    const knownValue =
        values.find(
            (value) =>
                value !== null &&
                value !== undefined &&
                value !== '' &&
                Number.isFinite(
                    Number(value)
                )
        );

    if (
        knownValue === undefined
    ) {
        return null;
    }

    return safeNumber(
        knownValue
    );
}

function buildServiceErrorResult(
    error,
    startedAt = ''
) {
    const message =
        safeString(
            error?.body?.message ||
            error?.message,
            'An unexpected Org Knowledge Service error occurred.'
        );

    return {
        success: false,

        analysisMode:
            KNOWLEDGE_ANALYSIS_MODES
                .FULL,

        knowledgeModel:
            null,

        organization:
            null,

        objects: [],

        findings: [],

        recommendations: [],

        health: null,

        deploymentReadiness: null,

        dashboardMetrics: null,

        scoreExplanation: null,

        dailyBrief: null,

        summaries: {
            findings:
                summarizeFindings([]),

            recommendations:
                summarizeRecommendations(
                    []
                ),

            rules: null
        },

        metadataCounts:
            buildMetadataCounts({}),

        generatedAt:
            new Date().toISOString(),

        startedAt,

        serviceVersion:
            ORG_KNOWLEDGE_SERVICE_VERSION,

        errors: [
            {
                message,

                name:
                    safeString(
                        error?.name,
                        'OrgKnowledgeServiceError'
                    ),

                stack:
                    safeString(
                        error?.stack
                    )
            }
        ]
    };
}

/*
 * Default service export.
 *
 * Other modules may import the entire service:
 *
 * import orgKnowledgeService
 *     from 'c/orgKnowledgeService';
 *
 * const result =
 *     orgKnowledgeService.analyzeOrg(snapshot);
 */
const orgKnowledgeService = {
    version:
        ORG_KNOWLEDGE_SERVICE_VERSION,

    analysisModes:
        KNOWLEDGE_ANALYSIS_MODES,

    analyzeOrgKnowledge,

    analyzeOrg,

    normalizeOrgSnapshot,

    buildKnowledgeProfiles,

    buildObjectKnowledgeProfiles,

    buildObjectKnowledgeProfile,

    buildFieldKnowledgeProfile,

    explainEntity,

    explainObject,

    explainField,

    analyzeChangeImpact,

    buildDailyAdminBrief,

    buildMetadataCounts,

    getHealthCategory,

    getDeploymentBlockers,

    getTopPriorities,

    getOrgHealthSummary
};

export default orgKnowledgeService;