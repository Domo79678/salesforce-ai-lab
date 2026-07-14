/*
 * explanationEngine.js
 *
 * Deterministic explanation engine for Salesforce Copilot.
 *
 * Version 1 responsibilities:
 * - retrieve or accept the shared metadata snapshot
 * - locate a requested Salesforce entity
 * - generate business and technical explanations
 * - identify known dependencies and usage
 * - reuse Org Knowledge findings and recommendations
 * - generate testing and deployment guidance
 * - generate interview-ready explanations
 * - calculate explanation confidence
 *
 * Initial live entity coverage:
 * - Organization
 * - Object
 * - Field
 * - Record Type
 *
 * Additional metadata types will become available as
 * Setup Metadata Service coverage is added:
 * - Flow
 * - Validation Rule
 * - Apex
 * - Permission Set
 * - Duplicate Rule
 * - Matching Rule
 * - Report
 * - Dashboard
 */

import {
    getMetadataSnapshot,
    DATA_SOURCE_TYPES
} from 'c/copilotCore';

import orgKnowledgeService
    from 'c/orgKnowledgeService';

import {
    ENTITY_TYPES,
    DEPENDENCY_TYPES,
    INTELLIGENCE_MODES,
    createIntelligenceRequest,
    createExplanationResult,
    createDependency,
    createRisk,
    createTestCase,
    createDeploymentGuidance,
    createConfidenceResult,
    createInterviewInsight,
    createStarStory,
    createStableId
} from './intelligenceModels';

export const EXPLANATION_ENGINE_VERSION =
    '1.0';

/*
 * Primary public method.
 *
 * Example:
 *
 * const result = await explainEntity({
 *     entityType: 'field',
 *     entityApiName: 'Opportunity.Amount'
 * });
 */
export async function explainEntity(
    requestInput = {},
    context = {}
) {
    const request =
        createIntelligenceRequest({
            mode:
                INTELLIGENCE_MODES.EXPLAIN,

            ...requestInput
        });

    try {
        const metadataSnapshot =
            context.metadataSnapshot ||
            await getMetadataSnapshot({
                forceRefresh:
                    Boolean(
                        request.options
                            ?.forceRefresh
                    )
            });

        validateSnapshot(
            metadataSnapshot
        );

        const knowledgeAnalysis =
            context.knowledgeAnalysis ||
            orgKnowledgeService.analyzeOrg(
                metadataSnapshot,
                {
                    analysisMode:
                        'explain'
                }
            );

        if (
            !knowledgeAnalysis ||
            !knowledgeAnalysis.success
        ) {
            throw new Error(
                knowledgeAnalysis
                    ?.errors?.[0]
                    ?.message ||
                'The Org Knowledge Service could not analyze the metadata snapshot.'
            );
        }

        const entityContext =
            resolveEntityContext({
                request,
                metadataSnapshot,
                knowledgeAnalysis
            });

        if (
            !entityContext.found
        ) {
            return createExplanationResult({
                success:
                    false,

                entityType:
                    request.entityType,

                entityApiName:
                    request.entityApiName,

                entityLabel:
                    request.entityLabel,

                executiveSummary:
                    entityContext.message,

                source:
                    'Salesforce Copilot Intelligence Engine',

                confidence:
                    createConfidenceResult({
                        score:
                            0,

                        reasons: [
                            entityContext.message
                        ],

                        liveMetadata:
                            isLiveSnapshot(
                                metadataSnapshot
                            ),

                        partialCoverage:
                            isPartialSnapshot(
                                metadataSnapshot
                            )
                    }),

                warnings: [
                    {
                        code:
                            'ENTITY_NOT_FOUND',

                        message:
                            entityContext.message
                    }
                ]
            });
        }

        return buildExplanationResult({
            request,
            metadataSnapshot,
            knowledgeAnalysis,
            entityContext
        });
    } catch (error) {
        return createExplanationResult({
            success:
                false,

            entityType:
                request.entityType,

            entityApiName:
                request.entityApiName,

            entityLabel:
                request.entityLabel,

            executiveSummary:
                extractErrorMessage(
                    error
                ),

            source:
                'Salesforce Copilot Intelligence Engine',

            confidence:
                createConfidenceResult({
                    score:
                        0,

                    reasons: [
                        'The explanation could not be completed.'
                    ]
                }),

            errors: [
                normalizeError(
                    error
                )
            ]
        });
    }
}

/*
 * Explain an entity using an already-built snapshot.
 *
 * This avoids retrieving metadata again when another
 * workspace already has the shared snapshot.
 */
export function explainEntityFromSnapshot(
    requestInput = {},
    {
        metadataSnapshot = null,
        knowledgeAnalysis = null
    } = {}
) {
    const request =
        createIntelligenceRequest({
            mode:
                INTELLIGENCE_MODES.EXPLAIN,

            ...requestInput
        });

    try {
        validateSnapshot(
            metadataSnapshot
        );

        const resolvedKnowledgeAnalysis =
            knowledgeAnalysis ||
            orgKnowledgeService.analyzeOrg(
                metadataSnapshot,
                {
                    analysisMode:
                        'explain'
                }
            );

        if (
            !resolvedKnowledgeAnalysis
                ?.success
        ) {
            throw new Error(
                resolvedKnowledgeAnalysis
                    ?.errors?.[0]
                    ?.message ||
                'The Org Knowledge Service could not analyze the supplied snapshot.'
            );
        }

        const entityContext =
            resolveEntityContext({
                request,
                metadataSnapshot,
                knowledgeAnalysis:
                    resolvedKnowledgeAnalysis
            });

        if (
            !entityContext.found
        ) {
            return createExplanationResult({
                success:
                    false,

                entityType:
                    request.entityType,

                entityApiName:
                    request.entityApiName,

                entityLabel:
                    request.entityLabel,

                executiveSummary:
                    entityContext.message,

                confidence:
                    createConfidenceResult({
                        score:
                            0,

                        reasons: [
                            entityContext.message
                        ]
                    }),

                warnings: [
                    {
                        code:
                            'ENTITY_NOT_FOUND',

                        message:
                            entityContext.message
                    }
                ]
            });
        }

        return buildExplanationResult({
            request,
            metadataSnapshot,
            knowledgeAnalysis:
                resolvedKnowledgeAnalysis,
            entityContext
        });
    } catch (error) {
        return createExplanationResult({
            success:
                false,

            entityType:
                request.entityType,

            entityApiName:
                request.entityApiName,

            entityLabel:
                request.entityLabel,

            executiveSummary:
                extractErrorMessage(
                    error
                ),

            errors: [
                normalizeError(
                    error
                )
            ]
        });
    }
}

/*
 * Search a live snapshot for explainable entities.
 *
 * This will power the Explain This search box.
 */
export function searchExplainableEntities(
    metadataSnapshot = {},
    searchTerm = '',
    limit = 25
) {
    const normalizedTerm =
        safeString(
            searchTerm
        ).toLowerCase();

    if (!normalizedTerm) {
        return [];
    }

    const maximumResults =
        Math.max(
            1,
            Math.min(
                100,
                safeNumber(
                    limit,
                    25
                )
            )
        );

    const results = [];

    normalizeArray(
        metadataSnapshot.objects
    ).forEach(
        (objectItem) => {
            const objectApiName =
                safeString(
                    objectItem.apiName
                );

            const objectLabel =
                safeString(
                    objectItem.label,
                    objectApiName
                );

            if (
                matchesSearch(
                    normalizedTerm,
                    objectApiName,
                    objectLabel
                )
            ) {
                results.push({
                    id:
                        createStableId(
                            `object-${objectApiName}`
                        ),

                    entityType:
                        ENTITY_TYPES.OBJECT,

                    entityApiName:
                        objectApiName,

                    entityLabel:
                        objectLabel,

                    parentApiName:
                        '',

                    subtitle:
                        'Salesforce Object',

                    live:
                        true
                });
            }

            normalizeArray(
                objectItem.fields
            ).forEach(
                (field) => {
                    const fieldApiName =
                        safeString(
                            field.apiName
                        );

                    const qualifiedApiName =
                        safeString(
                            field
                                .qualifiedApiName,
                            `${objectApiName}.${fieldApiName}`
                        );

                    const fieldLabel =
                        safeString(
                            field.label,
                            fieldApiName
                        );

                    if (
                        matchesSearch(
                            normalizedTerm,
                            qualifiedApiName,
                            fieldApiName,
                            fieldLabel,
                            objectLabel
                        )
                    ) {
                        results.push({
                            id:
                                createStableId(
                                    `field-${qualifiedApiName}`
                                ),

                            entityType:
                                ENTITY_TYPES.FIELD,

                            entityApiName:
                                qualifiedApiName,

                            entityLabel:
                                fieldLabel,

                            parentApiName:
                                objectApiName,

                            subtitle:
                                `${objectLabel} Field`,

                            live:
                                true
                        });
                    }
                }
            );

            normalizeArray(
                objectItem.recordTypes
            ).forEach(
                (recordType) => {
                    const developerName =
                        safeString(
                            recordType
                                .developerName
                        );

                    const recordTypeLabel =
                        safeString(
                            recordType.name,
                            developerName
                        );

                    const qualifiedApiName =
                        `${objectApiName}.${developerName}`;

                    if (
                        matchesSearch(
                            normalizedTerm,
                            qualifiedApiName,
                            developerName,
                            recordTypeLabel,
                            objectLabel
                        )
                    ) {
                        results.push({
                            id:
                                createStableId(
                                    `record-type-${qualifiedApiName}`
                                ),

                            entityType:
                                ENTITY_TYPES
                                    .RECORD_TYPE,

                            entityApiName:
                                qualifiedApiName,

                            entityLabel:
                                recordTypeLabel,

                            parentApiName:
                                objectApiName,

                            subtitle:
                                `${objectLabel} Record Type`,

                            live:
                                true
                        });
                    }
                }
            );
        }
    );

    appendSetupMetadataSearchResults(
        results,
        metadataSnapshot,
        normalizedTerm
    );

    return deduplicateResults(
        results
    ).slice(
        0,
        maximumResults
    );
}

/*
 * Return supported entity types based on snapshot coverage.
 */
export function getSupportedEntityTypes(
    metadataSnapshot = {}
) {
    const supported = [
        ENTITY_TYPES.ORGANIZATION
    ];

    if (
        normalizeArray(
            metadataSnapshot.objects
        ).length
    ) {
        supported.push(
            ENTITY_TYPES.OBJECT,
            ENTITY_TYPES.FIELD,
            ENTITY_TYPES.RECORD_TYPE
        );
    }

    if (
        normalizeArray(
            metadataSnapshot.flows
        ).length
    ) {
        supported.push(
            ENTITY_TYPES.FLOW
        );
    }

    if (
        normalizeArray(
            metadataSnapshot
                .validationRules
        ).length
    ) {
        supported.push(
            ENTITY_TYPES
                .VALIDATION_RULE
        );
    }

    if (
        normalizeArray(
            metadataSnapshot
                .apexClasses
        ).length
    ) {
        supported.push(
            ENTITY_TYPES.APEX_CLASS
        );
    }

    if (
        normalizeArray(
            metadataSnapshot
                .apexTriggers
        ).length
    ) {
        supported.push(
            ENTITY_TYPES.APEX_TRIGGER
        );
    }

    if (
        normalizeArray(
            metadataSnapshot
                .permissionSets
        ).length
    ) {
        supported.push(
            ENTITY_TYPES.PERMISSION_SET
        );
    }

    if (
        normalizeArray(
            metadataSnapshot
                .duplicateRules
        ).length
    ) {
        supported.push(
            ENTITY_TYPES.DUPLICATE_RULE
        );
    }

    if (
        normalizeArray(
            metadataSnapshot
                .matchingRules
        ).length
    ) {
        supported.push(
            ENTITY_TYPES.MATCHING_RULE
        );
    }

    return Array.from(
        new Set(
            supported
        )
    );
}

/*
 * Main result assembly.
 */
function buildExplanationResult({
    request,
    metadataSnapshot,
    knowledgeAnalysis,
    entityContext
}) {
    const dependencies =
        request.options
            .includeDependencies
            ? buildDependencies(
                  entityContext
              )
            : [];

    const usage =
        buildUsageSummary({
            entityContext,
            dependencies
        });

    const risks =
        request.options
            .includeRisks
            ? buildRisks({
                  entityContext,
                  knowledgeAnalysis
              })
            : [];

    const improvements =
        buildImprovements({
            entityContext,
            knowledgeAnalysis,
            risks
        });

    const testCases =
        request.options
            .includeTests
            ? buildTestCases({
                  entityContext,
                  risks
              })
            : [];

    const deployment =
        request.options
            .includeDeployment
            ? buildDeploymentGuidance({
                  entityContext,
                  dependencies,
                  risks,
                  testCases,
                  knowledgeAnalysis
              })
            : createDeploymentGuidance();

    const interviewInsight =
        request.options
            .includeInterview
            ? buildInterviewExplanation({
                  entityContext,
                  dependencies,
                  risks,
                  improvements
              })
            : createInterviewInsight();

    const starStory =
        request.options
            .includeStarStory
            ? buildStarStory({
                  entityContext,
                  risks,
                  improvements
              })
            : null;

    const confidence =
        buildConfidence({
            metadataSnapshot,
            entityContext,
            dependencies,
            risks
        });

    return createExplanationResult({
        success:
            true,

        entityType:
            entityContext.entityType,

        entityApiName:
            entityContext.entityApiName,

        entityLabel:
            entityContext.entityLabel,

        executiveSummary:
            buildExecutiveSummary(
                entityContext
            ),

        businessPurpose:
            buildBusinessPurpose(
                entityContext
            ),

        technicalExplanation:
            buildTechnicalExplanation(
                entityContext
            ),

        dependencies,

        usage,

        risks,

        improvements,

        testCases,

        deployment,

        interviewExplanation:
            interviewInsight.answer,

        starStory,

        confidence,

        source:
            metadataSnapshot
                .sourceLabel ||
            'Live Salesforce Metadata',

        warnings:
            buildExplanationWarnings({
                metadataSnapshot,
                entityContext
            })
    });
}

/*
 * Entity resolution
 */
function resolveEntityContext({
    request,
    metadataSnapshot,
    knowledgeAnalysis
}) {
    switch (
        request.entityType
    ) {
        case ENTITY_TYPES
            .ORGANIZATION:
            return resolveOrganization(
                metadataSnapshot
            );

        case ENTITY_TYPES.OBJECT:
            return resolveObject({
                entityApiName:
                    request.entityApiName,
                metadataSnapshot,
                knowledgeAnalysis
            });

        case ENTITY_TYPES.FIELD:
            return resolveField({
                entityApiName:
                    request.entityApiName,
                metadataSnapshot,
                knowledgeAnalysis
            });

        case ENTITY_TYPES
            .RECORD_TYPE:
            return resolveRecordType({
                entityApiName:
                    request.entityApiName,
                metadataSnapshot
            });

        case ENTITY_TYPES.FLOW:
            return resolveCollectionEntity({
                entityType:
                    ENTITY_TYPES.FLOW,
                collection:
                    metadataSnapshot.flows,
                entityApiName:
                    request.entityApiName
            });

        case ENTITY_TYPES
            .VALIDATION_RULE:
            return resolveCollectionEntity({
                entityType:
                    ENTITY_TYPES
                        .VALIDATION_RULE,
                collection:
                    metadataSnapshot
                        .validationRules,
                entityApiName:
                    request.entityApiName
            });

        case ENTITY_TYPES.APEX_CLASS:
            return resolveCollectionEntity({
                entityType:
                    ENTITY_TYPES.APEX_CLASS,
                collection:
                    metadataSnapshot
                        .apexClasses,
                entityApiName:
                    request.entityApiName
            });

        case ENTITY_TYPES
            .APEX_TRIGGER:
            return resolveCollectionEntity({
                entityType:
                    ENTITY_TYPES
                        .APEX_TRIGGER,
                collection:
                    metadataSnapshot
                        .apexTriggers,
                entityApiName:
                    request.entityApiName
            });

        case ENTITY_TYPES
            .PERMISSION_SET:
            return resolveCollectionEntity({
                entityType:
                    ENTITY_TYPES
                        .PERMISSION_SET,
                collection:
                    metadataSnapshot
                        .permissionSets,
                entityApiName:
                    request.entityApiName
            });

        case ENTITY_TYPES
            .DUPLICATE_RULE:
            return resolveCollectionEntity({
                entityType:
                    ENTITY_TYPES
                        .DUPLICATE_RULE,
                collection:
                    metadataSnapshot
                        .duplicateRules,
                entityApiName:
                    request.entityApiName
            });

        case ENTITY_TYPES
            .MATCHING_RULE:
            return resolveCollectionEntity({
                entityType:
                    ENTITY_TYPES
                        .MATCHING_RULE,
                collection:
                    metadataSnapshot
                        .matchingRules,
                entityApiName:
                    request.entityApiName
            });

        default:
            return {
                found:
                    false,

                message:
                    `Entity type ${request.entityType} is not supported by the current explanation engine.`
            };
    }
}

function resolveOrganization(
    metadataSnapshot
) {
    const organization =
        metadataSnapshot
            .organization;

    if (
        !organization ||
        !Object.keys(
            organization
        ).length
    ) {
        return {
            found:
                false,

            message:
                'Organization metadata is not available.'
        };
    }

    return {
        found:
            true,

        entityType:
            ENTITY_TYPES.ORGANIZATION,

        entityApiName:
            safeString(
                organization.id,
                'Organization'
            ),

        entityLabel:
            safeString(
                organization.name,
                'Salesforce Organization'
            ),

        entity:
            organization,

        parent:
            null,

        knowledgeExplanation:
            null
    };
}

function resolveObject({
    entityApiName,
    metadataSnapshot,
    knowledgeAnalysis
}) {
    const objectProfile =
        normalizeArray(
            knowledgeAnalysis.objects
        ).find(
            (objectItem) =>
                equalsIgnoreCase(
                    objectItem.apiName,
                    entityApiName
                )
        ) ||
        normalizeArray(
            metadataSnapshot.objects
        ).find(
            (objectItem) =>
                equalsIgnoreCase(
                    objectItem.apiName,
                    entityApiName
                )
        );

    if (!objectProfile) {
        return {
            found:
                false,

            message:
                `Object ${entityApiName} was not found in the shared metadata snapshot.`
        };
    }

    const knowledgeExplanation =
        orgKnowledgeService
            .explainObject(
                knowledgeAnalysis,
                objectProfile.apiName
            );

    return {
        found:
            true,

        entityType:
            ENTITY_TYPES.OBJECT,

        entityApiName:
            objectProfile.apiName,

        entityLabel:
            safeString(
                objectProfile.label,
                objectProfile.apiName
            ),

        entity:
            objectProfile,

        parent:
            null,

        knowledgeExplanation
    };
}

function resolveField({
    entityApiName,
    metadataSnapshot,
    knowledgeAnalysis
}) {
    const parsed =
        parseQualifiedApiName(
            entityApiName
        );

    if (
        !parsed.objectApiName ||
        !parsed.childApiName
    ) {
        return {
            found:
                false,

            message:
                'Field explanations require a qualified API name such as Opportunity.Amount.'
        };
    }

    const objectProfile =
        normalizeArray(
            knowledgeAnalysis.objects
        ).find(
            (objectItem) =>
                equalsIgnoreCase(
                    objectItem.apiName,
                    parsed.objectApiName
                )
        ) ||
        normalizeArray(
            metadataSnapshot.objects
        ).find(
            (objectItem) =>
                equalsIgnoreCase(
                    objectItem.apiName,
                    parsed.objectApiName
                )
        );

    if (!objectProfile) {
        return {
            found:
                false,

            message:
                `Object ${parsed.objectApiName} was not found.`
        };
    }

    const fieldProfile =
        normalizeArray(
            objectProfile.fields
        ).find(
            (field) =>
                equalsIgnoreCase(
                    field.apiName,
                    parsed.childApiName
                ) ||
                equalsIgnoreCase(
                    field
                        .qualifiedApiName,
                    entityApiName
                )
        );

    if (!fieldProfile) {
        return {
            found:
                false,

            message:
                `Field ${entityApiName} was not found in the shared metadata snapshot.`
        };
    }

    const qualifiedApiName =
        safeString(
            fieldProfile
                .qualifiedApiName,
            `${objectProfile.apiName}.${fieldProfile.apiName}`
        );

    const knowledgeExplanation =
        orgKnowledgeService
            .explainField(
                knowledgeAnalysis,
                qualifiedApiName
            );

    return {
        found:
            true,

        entityType:
            ENTITY_TYPES.FIELD,

        entityApiName:
            qualifiedApiName,

        entityLabel:
            safeString(
                fieldProfile.label,
                fieldProfile.apiName
            ),

        entity:
            fieldProfile,

        parent:
            objectProfile,

        knowledgeExplanation
    };
}

function resolveRecordType({
    entityApiName,
    metadataSnapshot
}) {
    const parsed =
        parseQualifiedApiName(
            entityApiName
        );

    const objectItem =
        normalizeArray(
            metadataSnapshot.objects
        ).find(
            (candidate) =>
                equalsIgnoreCase(
                    candidate.apiName,
                    parsed.objectApiName
                )
        );

    if (!objectItem) {
        return {
            found:
                false,

            message:
                `Object ${parsed.objectApiName} was not found.`
        };
    }

    const recordType =
        normalizeArray(
            objectItem.recordTypes
        ).find(
            (candidate) =>
                equalsIgnoreCase(
                    candidate
                        .developerName,
                    parsed.childApiName
                ) ||
                equalsIgnoreCase(
                    candidate.name,
                    parsed.childApiName
                )
        );

    if (!recordType) {
        return {
            found:
                false,

            message:
                `Record Type ${entityApiName} was not found.`
        };
    }

    return {
        found:
            true,

        entityType:
            ENTITY_TYPES.RECORD_TYPE,

        entityApiName,

        entityLabel:
            safeString(
                recordType.name,
                recordType.developerName
            ),

        entity:
            recordType,

        parent:
            objectItem,

        knowledgeExplanation:
            null
    };
}

function resolveCollectionEntity({
    entityType,
    collection,
    entityApiName
}) {
    const entity =
        normalizeArray(
            collection
        ).find(
            (candidate) =>
                equalsIgnoreCase(
                    candidate.apiName,
                    entityApiName
                ) ||
                equalsIgnoreCase(
                    candidate.developerName,
                    entityApiName
                ) ||
                equalsIgnoreCase(
                    candidate.name,
                    entityApiName
                ) ||
                equalsIgnoreCase(
                    candidate.label,
                    entityApiName
                )
        );

    if (!entity) {
        return {
            found:
                false,

            message:
                `${getEntityTypeLabel(entityType)} ${entityApiName} is not available in the current metadata snapshot.`
        };
    }

    return {
        found:
            true,

        entityType,

        entityApiName:
            safeString(
                entity.apiName,
                safeString(
                    entity.developerName,
                    safeString(
                        entity.name,
                        entityApiName
                    )
                )
            ),

        entityLabel:
            safeString(
                entity.label,
                safeString(
                    entity.name,
                    entityApiName
                )
            ),

        entity,

        parent:
            null,

        knowledgeExplanation:
            null
    };
}

/*
 * Explanation builders
 */
function buildExecutiveSummary(
    entityContext
) {
    const typeLabel =
        getEntityTypeLabel(
            entityContext.entityType
        );

    switch (
        entityContext.entityType
    ) {
        case ENTITY_TYPES.OBJECT:
            return `${entityContext.entityLabel} is a Salesforce object containing ${safeNumber(
                entityContext.entity
                    ?.counts
                    ?.fields,
                normalizeArray(
                    entityContext.entity
                        ?.fields
                ).length
            )} fields and ${safeNumber(
                entityContext.entity
                    ?.counts
                    ?.recordTypes,
                normalizeArray(
                    entityContext.entity
                        ?.recordTypes
                ).length
            )} record types.`;

        case ENTITY_TYPES.FIELD:
            return `${entityContext.entityLabel} is a ${safeString(
                entityContext.entity
                    ?.dataType,
                'Salesforce'
            )} field on ${safeString(
                entityContext.parent
                    ?.label,
                entityContext.parent
                    ?.apiName
            )}.`;

        case ENTITY_TYPES
            .RECORD_TYPE:
            return `${entityContext.entityLabel} is a record type on ${safeString(
                entityContext.parent
                    ?.label,
                entityContext.parent
                    ?.apiName
            )}.`;

        case ENTITY_TYPES
            .ORGANIZATION:
            return `${entityContext.entityLabel} is the connected Salesforce organization currently being analyzed by Salesforce Copilot.`;

        default:
            return `${entityContext.entityLabel} is a Salesforce ${typeLabel.toLowerCase()} included in the shared metadata snapshot.`;
    }
}

function buildBusinessPurpose(
    entityContext
) {
    const documentedPurpose =
        safeString(
            entityContext
                ?.knowledgeExplanation
                ?.businessPurpose,
            safeString(
                entityContext.entity
                    ?.metadata
                    ?.description,
                safeString(
                    entityContext.entity
                        ?.description
                )
            )
        );

    if (documentedPurpose) {
        return documentedPurpose;
    }

    switch (
        entityContext.entityType
    ) {
        case ENTITY_TYPES.OBJECT:
            return `${entityContext.entityLabel} stores and organizes business records used by Salesforce processes, users, reporting, security, and automation.`;

        case ENTITY_TYPES.FIELD:
            return `${entityContext.entityLabel} captures a business value used on ${safeString(
                entityContext.parent
                    ?.label,
                entityContext.parent
                    ?.apiName
            )} records. A formal business-purpose description has not been documented.`;

        case ENTITY_TYPES
            .RECORD_TYPE:
            return `${entityContext.entityLabel} separates a distinct business process, user experience, or classification of ${safeString(
                entityContext.parent
                    ?.label,
                entityContext.parent
                    ?.apiName
            )} records.`;

        case ENTITY_TYPES.FLOW:
            return 'This Flow automates a Salesforce business process. Its detailed business purpose depends on its trigger, conditions, elements, and affected records.';

        case ENTITY_TYPES
            .VALIDATION_RULE:
            return 'This Validation Rule protects a business or data-quality requirement by preventing invalid records from being saved.';

        case ENTITY_TYPES
            .PERMISSION_SET:
            return 'This Permission Set grants additional Salesforce capabilities to assigned users without changing their base Profile.';

        case ENTITY_TYPES.APEX_CLASS:
            return 'This Apex class implements custom Salesforce application logic that cannot be handled entirely through declarative configuration.';

        case ENTITY_TYPES
            .DUPLICATE_RULE:
            return 'This Duplicate Rule helps protect data quality by identifying or blocking records that match configured duplicate criteria.';

        default:
            return 'A formal business-purpose description has not been documented for this metadata component.';
    }
}

function buildTechnicalExplanation(
    entityContext
) {
    const entity =
        entityContext.entity ||
        {};

    switch (
        entityContext.entityType
    ) {
        case ENTITY_TYPES.OBJECT:
            return buildObjectTechnicalExplanation(
                entity
            );

        case ENTITY_TYPES.FIELD:
            return buildFieldTechnicalExplanation({
                field:
                    entity,
                objectItem:
                    entityContext.parent
            });

        case ENTITY_TYPES
            .RECORD_TYPE:
            return buildRecordTypeTechnicalExplanation({
                recordType:
                    entity,
                objectItem:
                    entityContext.parent
            });

        case ENTITY_TYPES.FLOW:
            return buildFlowTechnicalExplanation(
                entity
            );

        case ENTITY_TYPES
            .VALIDATION_RULE:
            return buildValidationRuleTechnicalExplanation(
                entity
            );

        case ENTITY_TYPES
            .APEX_CLASS:
            return buildApexTechnicalExplanation(
                entity,
                'class'
            );

        case ENTITY_TYPES
            .APEX_TRIGGER:
            return buildApexTechnicalExplanation(
                entity,
                'trigger'
            );

        case ENTITY_TYPES
            .PERMISSION_SET:
            return buildPermissionSetTechnicalExplanation(
                entity
            );

        case ENTITY_TYPES
            .DUPLICATE_RULE:
            return buildDuplicateRuleTechnicalExplanation(
                entity
            );

        default:
            return `Technical metadata is available for ${entityContext.entityLabel}, but a specialized explainer for this entity type has not yet been completed.`;
    }
}

function buildObjectTechnicalExplanation(
    objectItem
) {
    const capabilities =
        objectItem.capabilities ||
        objectItem;

    const fieldCount =
        safeNumber(
            objectItem
                ?.counts
                ?.fields,
            normalizeArray(
                objectItem.fields
            ).length
        );

    const relationshipCount =
        safeNumber(
            objectItem
                ?.counts
                ?.relationships,
            normalizeArray(
                objectItem.relationships
            ).length
        );

    const recordTypeCount =
        safeNumber(
            objectItem
                ?.counts
                ?.recordTypes,
            normalizeArray(
                objectItem.recordTypes
            ).length
        );

    const permissions = [
        capabilities.createable
            ? 'create'
            : null,

        capabilities.queryable
            ? 'query'
            : null,

        capabilities.updateable
            ? 'update'
            : null,

        capabilities.deletable
            ? 'delete'
            : null
    ].filter(Boolean);

    return `${safeString(
        objectItem.label,
        objectItem.apiName
    )} is a ${objectItem.custom
        ? 'custom'
        : 'standard'} Salesforce object with ${fieldCount} fields, ${relationshipCount} known relationships, and ${recordTypeCount} record types. The running user can ${permissions.length
        ? permissions.join(', ')
        : 'access limited metadata for'} this object.`;
}

function buildFieldTechnicalExplanation({
    field,
    objectItem
}) {
    const characteristics = [];

    if (field.required) {
        characteristics.push(
            'required'
        );
    }

    if (field.unique) {
        characteristics.push(
            'unique'
        );
    }

    if (field.externalId) {
        characteristics.push(
            'an External ID'
        );
    }

    if (field.calculated) {
        characteristics.push(
            'calculated'
        );
    }

    if (
        field
            ?.relationship
            ?.isRelationship ||
        normalizeArray(
            field.referenceTo ||
            field
                ?.relationship
                ?.referenceTo
        ).length
    ) {
        characteristics.push(
            'a relationship field'
        );
    }

    const characteristicText =
        characteristics.length
            ? ` It is ${characteristics.join(
                  ', '
              )}.`
            : '';

    return `${safeString(
        field.label,
        field.apiName
    )} is a ${safeString(
        field.dataType,
        'Salesforce'
    )} field on ${safeString(
        objectItem?.label,
        objectItem?.apiName
    )}.${characteristicText}`;
}

function buildRecordTypeTechnicalExplanation({
    recordType,
    objectItem
}) {
    return `${safeString(
        recordType.name,
        recordType.developerName
    )} is ${recordType.active === false
        ? 'an inactive'
        : 'an active'} record type on ${safeString(
        objectItem?.label,
        objectItem?.apiName
    )}. It can influence available business processes, page layouts, picklist values, and user record-creation experiences.`;
}

function buildFlowTechnicalExplanation(
    flow
) {
    return `${safeString(
        flow.label,
        flow.apiName
    )} is a ${safeString(
        flow.flowType,
        'Salesforce Flow'
    )} with status ${safeString(
        flow.status,
        'Unknown'
    )}. It contains ${safeNumber(
        flow.elementCount
    )} known elements, ${safeNumber(
        flow.decisionCount
    )} decisions, and ${safeNumber(
        flow.loopCount
    )} loops. Fault paths are ${flow.hasFaultPaths
        ? 'present'
        : 'not confirmed'}.`;
}

function buildValidationRuleTechnicalExplanation(
    rule
) {
    return `${safeString(
        rule.label,
        rule.apiName
    )} is ${rule.active === false
        ? 'inactive'
        : 'active'} and prevents a record from being saved when its configured formula evaluates to true.`;
}

function buildApexTechnicalExplanation(
    apexItem,
    type
) {
    return `${safeString(
        apexItem.label,
        apexItem.apiName
    )} is an Apex ${type}. Confirmed test coverage is ${apexItem.hasTestClass
        ? 'available'
        : 'not currently available in the snapshot'}.`;
}

function buildPermissionSetTechnicalExplanation(
    permissionSet
) {
    return `${safeString(
        permissionSet.label,
        permissionSet.apiName
    )} is a Permission Set with ${safeNumber(
        permissionSet.assignmentCount
    )} known assignments. It extends user access beyond the permissions granted by a base Profile.`;
}

function buildDuplicateRuleTechnicalExplanation(
    rule
) {
    return `${safeString(
        rule.label,
        rule.apiName
    )} is ${rule.active === false
        ? 'inactive'
        : 'active'} and uses matching criteria to identify potential duplicate records.`;
}

/*
 * Dependency and usage builders
 */
function buildDependencies(
    entityContext
) {
    const dependencies = [];

    if (
        entityContext.entityType ===
        ENTITY_TYPES.FIELD
    ) {
        dependencies.push(
            createDependency({
                type:
                    DEPENDENCY_TYPES.OBJECT,

                apiName:
                    entityContext.parent
                        ?.apiName,

                label:
                    entityContext.parent
                        ?.label,

                relationship:
                    'Field belongs to object',

                direction:
                    'parent',

                required:
                    true,

                source:
                    'Live Schema Describe'
            })
        );

        const referenceTargets =
            normalizeArray(
                entityContext.entity
                    ?.referenceTo ||
                entityContext.entity
                    ?.relationship
                    ?.referenceTo
            );

        referenceTargets.forEach(
            (targetObject) => {
                dependencies.push(
                    createDependency({
                        type:
                            DEPENDENCY_TYPES
                                .OBJECT,

                        apiName:
                            targetObject,

                        label:
                            targetObject,

                        relationship:
                            'Relationship target',

                        direction:
                            'outbound',

                        required:
                            Boolean(
                                entityContext
                                    .entity
                                    ?.required
                            ),

                        source:
                            'Live Schema Describe'
                    })
                );
            }
        );
    }

    if (
        entityContext.entityType ===
        ENTITY_TYPES.OBJECT
    ) {
        normalizeArray(
            entityContext.entity
                ?.relationships
        ).forEach(
            (relationship) => {
                normalizeArray(
                    relationship
                        .targetObjects
                ).forEach(
                    (targetObject) => {
                        dependencies.push(
                            createDependency({
                                type:
                                    DEPENDENCY_TYPES
                                        .OBJECT,

                                apiName:
                                    targetObject,

                                label:
                                    targetObject,

                                relationship:
                                    safeString(
                                        relationship
                                            .relationshipName,
                                        'Object relationship'
                                    ),

                                direction:
                                    'outbound',

                                required:
                                    Boolean(
                                        relationship.required
                                    ),

                                source:
                                    'Live Schema Describe'
                            })
                        );
                    }
                );
            }
        );

        normalizeArray(
            entityContext.entity
                ?.recordTypes
        ).forEach(
            (recordType) => {
                dependencies.push(
                    createDependency({
                        type:
                            DEPENDENCY_TYPES
                                .RECORD_TYPE,

                        apiName:
                            `${entityContext.entityApiName}.${safeString(
                                recordType
                                    .developerName
                            )}`,

                        label:
                            safeString(
                                recordType.name,
                                recordType
                                    .developerName
                            ),

                        relationship:
                            'Record type belongs to object',

                        direction:
                            'child',

                        active:
                            recordType.active !==
                            false,

                        source:
                            'Live Schema Describe'
                    })
                );
            }
        );
    }

    return deduplicateDependencies(
        dependencies
    );
}

function buildUsageSummary({
    entityContext,
    dependencies
}) {
    const usage = [];

    if (
        entityContext.entityType ===
        ENTITY_TYPES.FIELD
    ) {
        usage.push({
            id:
                createStableId(
                    `${entityContext.entityApiName}-object-usage`
                ),

            category:
                'Object',

            label:
                safeString(
                    entityContext.parent
                        ?.label,
                    entityContext.parent
                        ?.apiName
                ),

            detail:
                'The field is stored on this object.',

            count:
                1,

            confirmed:
                true
        });

        const knownUsageCount =
            entityContext.entity
                ?.metadata
                ?.usageCount;

        if (
            knownUsageCount !==
                null &&
            knownUsageCount !==
                undefined
        ) {
            usage.push({
                id:
                    createStableId(
                        `${entityContext.entityApiName}-known-usage`
                    ),

                category:
                    'Known References',

                label:
                    'Metadata references',

                detail:
                    'Known reference count provided by the metadata snapshot.',

                count:
                    safeNumber(
                        knownUsageCount
                    ),

                confirmed:
                    true
            });
        }
    }

    if (
        entityContext.entityType ===
        ENTITY_TYPES.OBJECT
    ) {
        usage.push({
            id:
                createStableId(
                    `${entityContext.entityApiName}-fields`
                ),

            category:
                'Fields',

            label:
                'Object fields',

            detail:
                'Fields currently included in the shared snapshot.',

            count:
                normalizeArray(
                    entityContext.entity
                        ?.fields
                ).length,

            confirmed:
                true
        });

        usage.push({
            id:
                createStableId(
                    `${entityContext.entityApiName}-record-types`
                ),

            category:
                'Record Types',

            label:
                'Record types',

            detail:
                'Record types currently available to the running user.',

            count:
                normalizeArray(
                    entityContext.entity
                        ?.recordTypes
                ).length,

            confirmed:
                true
        });
    }

    if (
        dependencies.length
    ) {
        usage.push({
            id:
                createStableId(
                    `${entityContext.entityApiName}-dependencies`
                ),

            category:
                'Dependencies',

            label:
                'Known dependencies',

            detail:
                'Dependencies confirmed from currently connected metadata.',

            count:
                dependencies.length,

            confirmed:
                true
        });
    }

    return usage;
}

/*
 * Risk, improvement, testing and deployment builders
 */
function buildRisks({
    entityContext,
    knowledgeAnalysis
}) {
    const risks = [];

    normalizeArray(
        entityContext
            ?.knowledgeExplanation
            ?.findings
    ).forEach(
        (finding) => {
            risks.push(
                createRisk({
                    id:
                        finding.id,

                    title:
                        finding.title,

                    description:
                        finding.summary ||
                        finding.description,

                    severity:
                        finding.severity,

                    category:
                        finding.category,

                    entityApiName:
                        finding
                            .entityApiName ||
                        entityContext
                            .entityApiName,

                    blocking:
                        finding.blocking,

                    scoreImpact:
                        finding.scoreImpact,

                    recommendation:
                        finding
                            .recommendation,

                    evidence:
                        finding.evidence
                })
            );
        }
    );

    const relatedFindings =
        normalizeArray(
            knowledgeAnalysis.findings
        ).filter(
            (finding) =>
                equalsIgnoreCase(
                    finding
                        .entityApiName,
                    entityContext
                        .entityApiName
                )
        );

    relatedFindings.forEach(
        (finding) => {
            risks.push(
                createRisk({
                    id:
                        finding.id,

                    title:
                        finding.title,

                    description:
                        finding.summary ||
                        finding.description,

                    severity:
                        finding.severity,

                    category:
                        finding.category,

                    entityApiName:
                        finding
                            .entityApiName,

                    blocking:
                        finding.blocking,

                    scoreImpact:
                        finding.scoreImpact,

                    recommendation:
                        finding
                            .recommendation,

                    evidence:
                        finding.evidence
                })
            );
        }
    );

    if (
        entityContext.entityType ===
            ENTITY_TYPES.FIELD &&
        !safeString(
            entityContext.entity
                ?.metadata
                ?.description
        )
    ) {
        risks.push(
            createRisk({
                title:
                    `${entityContext.entityLabel} has no confirmed business description`,

                description:
                    'The field does not have a confirmed administrator description in the connected metadata.',

                severity:
                    'Low',

                category:
                    'Documentation',

                entityApiName:
                    entityContext
                        .entityApiName,

                scoreImpact:
                    1,

                recommendation:
                    'Document the business purpose, data owner, expected values, and downstream dependencies.'
            })
        );
    }

    return deduplicateRisks(
        risks
    );
}

function buildImprovements({
    entityContext,
    knowledgeAnalysis,
    risks
}) {
    const improvements = [];

    normalizeArray(
        entityContext
            ?.knowledgeExplanation
            ?.recommendations
    ).forEach(
        (recommendation) => {
            improvements.push({
                id:
                    recommendation.id ||
                    createStableId(
                        recommendation.title
                    ),

                title:
                    recommendation.title,

                description:
                    recommendation.action ||
                    recommendation
                        .description,

                priority:
                    recommendation.priority,

                category:
                    recommendation.category,

                entityApiName:
                    recommendation
                        .entityApiName ||
                    entityContext
                        .entityApiName
            });
        }
    );

    normalizeArray(
        knowledgeAnalysis
            .recommendations
    )
        .filter(
            (recommendation) =>
                equalsIgnoreCase(
                    recommendation
                        .entityApiName,
                    entityContext
                        .entityApiName
                )
        )
        .forEach(
            (recommendation) => {
                improvements.push({
                    id:
                        recommendation.id ||
                        createStableId(
                            recommendation.title
                        ),

                    title:
                        recommendation.title,

                    description:
                        recommendation.action ||
                        recommendation
                            .description,

                    priority:
                        recommendation.priority,

                    category:
                        recommendation.category,

                    entityApiName:
                        recommendation
                            .entityApiName
                });
            }
        );

    risks.forEach(
        (risk) => {
            if (
                risk.recommendation
            ) {
                improvements.push({
                    id:
                        createStableId(
                            `${risk.id}-improvement`
                        ),

                    title:
                        `Resolve ${risk.title}`,

                    description:
                        risk.recommendation,

                    priority:
                        risk.blocking ||
                        risk.severity ===
                            'Critical'
                            ? 'Immediate'
                            : risk.severity,

                    category:
                        risk.category,

                    entityApiName:
                        entityContext
                            .entityApiName
                });
            }
        }
    );

    if (
        !improvements.length
    ) {
        improvements.push({
            id:
                createStableId(
                    `${entityContext.entityApiName}-documentation-review`
                ),

            title:
                'Confirm business documentation',

            description:
                'Verify the business purpose, owner, dependencies, security model, testing expectations, and deployment notes.',

            priority:
                'Low',

            category:
                'Documentation',

            entityApiName:
                entityContext
                    .entityApiName
        });
    }

    return deduplicateById(
        improvements
    );
}

function buildTestCases({
    entityContext,
    risks
}) {
    const tests = [];

    normalizeArray(
        entityContext
            ?.knowledgeExplanation
            ?.testCases
    ).forEach(
        (testCase, index) => {
            tests.push(
                createTestCase({
                    id:
                        createStableId(
                            `${entityContext.entityApiName}-knowledge-test-${index + 1}`
                        ),

                    title:
                        typeof testCase ===
                        'string'
                            ? testCase
                            : testCase.title,

                    type:
                        inferTestType(
                            typeof testCase ===
                            'string'
                                ? testCase
                                : testCase.title
                        ),

                    objective:
                        typeof testCase ===
                        'string'
                            ? testCase
                            : testCase
                                  .objective,

                    expectedResult:
                        'The metadata component behaves as documented without introducing regressions.',

                    priority:
                        'Medium'
                })
            );
        }
    );

    if (
        entityContext.entityType ===
        ENTITY_TYPES.FIELD
    ) {
        tests.push(
            createTestCase({
                title:
                    `Validate ${entityContext.entityLabel} with an expected value`,

                type:
                    'Positive',

                objective:
                    'Confirm the field accepts and stores a valid value.',

                steps: [
                    `Open a ${safeString(
                        entityContext.parent
                            ?.label,
                        entityContext.parent
                            ?.apiName
                    )} record.`,
                    `Enter a valid value in ${entityContext.entityLabel}.`,
                    'Save the record.'
                ],

                expectedResult:
                    'The record saves and the value is retained.',

                priority:
                    'High'
            })
        );

        if (
            entityContext.entity
                ?.required
        ) {
            tests.push(
                createTestCase({
                    title:
                        `Prevent blank ${entityContext.entityLabel}`,

                    type:
                        'Negative',

                    objective:
                        'Confirm the required-field behavior is enforced.',

                    steps: [
                        `Leave ${entityContext.entityLabel} blank.`,
                        'Attempt to save the record.'
                    ],

                    expectedResult:
                        'The record cannot be saved without the required value.',

                    priority:
                        'High'
                })
            );
        }

        tests.push(
            createTestCase({
                title:
                    `Verify security for ${entityContext.entityLabel}`,

                type:
                    'Security',

                objective:
                    'Confirm intended users can access the field and restricted users cannot.',

                expectedResult:
                    'Field visibility and editability match the approved security model.',

                priority:
                    'High'
            })
        );
    }

    if (
        entityContext.entityType ===
        ENTITY_TYPES.OBJECT
    ) {
        tests.push(
            createTestCase({
                title:
                    `Validate CRUD access for ${entityContext.entityLabel}`,

                type:
                    'Permission',

                objective:
                    'Confirm create, read, update, and delete permissions for intended user personas.',

                expectedResult:
                    'Each persona receives only the approved object access.',

                priority:
                    'High'
            })
        );

        tests.push(
            createTestCase({
                title:
                    `Run regression testing for ${entityContext.entityLabel}`,

                type:
                    'Regression',

                objective:
                    'Confirm related automation, validation, reports, layouts, and integrations continue to work.',

                expectedResult:
                    'All affected business processes operate without regression.',

                priority:
                    'High'
            })
        );
    }

    if (
        risks.some(
            (risk) =>
                risk.category ===
                'Automation'
        )
    ) {
        tests.push(
            createTestCase({
                title:
                    'Test automation success and failure paths',

                type:
                    'Error handling',

                objective:
                    'Confirm related automation handles successful, failed, and bulk transactions safely.',

                expectedResult:
                    'Automation succeeds for valid records and produces controlled error handling for failures.',

                priority:
                    'High'
            })
        );
    }

    return deduplicateById(
        tests
    );
}

function buildDeploymentGuidance({
    entityContext,
    dependencies,
    risks,
    testCases,
    knowledgeAnalysis
}) {
    const blockers =
        risks.filter(
            (risk) =>
                risk.blocking ||
                risk.severity ===
                    'Critical'
        );

    const highRisks =
        risks.filter(
            (risk) =>
                risk.severity ===
                'High'
        );

    const readinessStatus =
        blockers.length
            ? 'Not ready'
            : highRisks.length
              ? 'Ready with warnings'
              : 'Ready';

    const riskLevel =
        blockers.length
            ? 'Critical'
            : highRisks.length
              ? 'High'
              : risks.length
                ? 'Medium'
                : 'Low';

    return createDeploymentGuidance({
        readinessStatus,

        riskLevel,

        recommendation:
            blockers.length
                ? 'Do not deploy until blocking and critical risks are resolved and validation is repeated.'
                : highRisks.length
                  ? 'Complete targeted testing, document accepted risks, and obtain stakeholder approval before deployment.'
                  : 'Complete standard validation and post-deployment smoke testing.',

        prerequisites: [
            'Confirm the approved business requirement.',
            'Confirm metadata dependencies are included.',
            'Verify intended user permissions.',
            'Complete required testing.'
        ],

        validationSteps:
            testCases.map(
                (testCase) =>
                    testCase.title
            ),

        rollbackSteps: [
            'Document the current configuration before deployment.',
            'Prepare the previous metadata version for restoration.',
            'Identify records or integrations that may require remediation.',
            'Define the decision point for rollback.'
        ],

        requiredComponents:
            dependencies.map(
                (dependency) => ({
                    type:
                        dependency.type,

                    apiName:
                        dependency.apiName,

                    label:
                        dependency.label
                })
            ),

        blockers
    });
}

function buildInterviewExplanation({
    entityContext,
    dependencies,
    risks,
    improvements
}) {
    const typeLabel =
        getEntityTypeLabel(
            entityContext.entityType
        );

    const answer =
        `I reviewed ${entityContext.entityLabel}, a Salesforce ${typeLabel.toLowerCase()}, using live metadata and the shared Org Knowledge Layer. I evaluated its business purpose, technical configuration, ${dependencies.length} known dependencies, and ${risks.length} current risks. I would validate the requirement, confirm security and downstream usage, complete positive, negative, bulk, and regression testing, and resolve the highest-priority recommendation before deployment.`;

    return createInterviewInsight({
        question:
            `How would you explain or safely change ${entityContext.entityLabel}?`,

        answer,

        talkingPoints: [
            'Start with the business requirement.',
            'Explain the technical configuration.',
            'Identify dependencies and affected users.',
            'Describe risk and testing strategy.',
            'Explain deployment and rollback planning.'
        ],

        technicalTerms: [
            typeLabel,
            'Metadata',
            'Dependencies',
            'Regression Testing',
            'Deployment Readiness'
        ],

        followUpQuestions: [
            'How would you test this component?',
            'What could break if it changes?',
            'How would you confirm user access?',
            'What would require a rollback?'
        ]
    });
}

function buildStarStory({
    entityContext,
    risks,
    improvements
}) {
    const primaryRisk =
        risks[0];

    const primaryImprovement =
        improvements[0];

    return createStarStory({
        situation:
            `A Salesforce administrator needed to understand and safely evaluate ${entityContext.entityLabel}.`,

        task:
            'Analyze the component, identify dependencies and risks, and create an actionable testing and deployment plan.',

        action:
            `Used Salesforce Copilot to inspect live metadata, evaluate the Org Knowledge findings, identify ${risks.length} risks, and recommend ${improvements.length} improvements. The highest-priority action was ${safeString(
                primaryImprovement
                    ?.title,
                'confirming documentation and dependencies'
            )}.`,

        result:
            primaryRisk
                ? `The analysis surfaced ${primaryRisk.title} before deployment and produced a structured remediation and testing plan.`
                : 'The analysis confirmed no immediate blocking risk and produced a reusable explanation and validation plan.',

        skills: [
            'Salesforce Administration',
            'Metadata Analysis',
            'Risk Assessment',
            'Testing',
            'Deployment Planning',
            'Documentation'
        ],

        interviewQuestion:
            'Tell me about a time you evaluated or improved a Salesforce configuration.'
    });
}

function buildConfidence({
    metadataSnapshot,
    entityContext,
    dependencies,
    risks
}) {
    let score = 40;
    const reasons = [];

    if (
        isLiveSnapshot(
            metadataSnapshot
        )
    ) {
        score += 25;

        reasons.push(
            'The explanation uses live Salesforce metadata.'
        );
    }

    if (
        entityContext
            .knowledgeExplanation
            ?.success
    ) {
        score += 15;

        reasons.push(
            'The Org Knowledge Layer provided an entity-specific analysis.'
        );
    }

    if (
        dependencies.length
    ) {
        score += 10;

        reasons.push(
            `${dependencies.length} dependencies were confirmed.`
        );
    }

    if (
        safeString(
            entityContext.entity
                ?.metadata
                ?.description
        ) ||
        safeString(
            entityContext
                ?.knowledgeExplanation
                ?.businessPurpose
        )
    ) {
        score += 10;

        reasons.push(
            'A business description is available.'
        );
    }

    if (
        isPartialSnapshot(
            metadataSnapshot
        )
    ) {
        score -= 15;

        reasons.push(
            'The metadata snapshot has partial setup-metadata coverage.'
        );
    }

    if (
        !risks.length
    ) {
        reasons.push(
            'No entity-specific risks were detected in the currently connected metadata.'
        );
    }

    return createConfidenceResult({
        score,

        reasons,

        liveMetadata:
            isLiveSnapshot(
                metadataSnapshot
            ),

        partialCoverage:
            isPartialSnapshot(
                metadataSnapshot
            )
    });
}

function buildExplanationWarnings({
    metadataSnapshot,
    entityContext
}) {
    const warnings = [];

    if (
        isPartialSnapshot(
            metadataSnapshot
        )
    ) {
        warnings.push({
            code:
                'PARTIAL_METADATA_COVERAGE',

            message:
                'The explanation is based on partial live metadata coverage. Setup metadata dependencies may not yet be included.'
        });
    }

    if (
        !entityContext
            .knowledgeExplanation
            ?.success &&
        [
            ENTITY_TYPES.OBJECT,
            ENTITY_TYPES.FIELD
        ].includes(
            entityContext.entityType
        )
    ) {
        warnings.push({
            code:
                'KNOWLEDGE_EXPLANATION_LIMITED',

            message:
                'The entity was found, but the Org Knowledge Layer did not return a complete entity-specific explanation.'
        });
    }

    return warnings;
}

/*
 * Search helpers
 */
function appendSetupMetadataSearchResults(
    results,
    metadataSnapshot,
    normalizedTerm
) {
    const collections = [
        {
            entityType:
                ENTITY_TYPES.FLOW,
            subtitle:
                'Salesforce Flow',
            values:
                metadataSnapshot.flows
        },
        {
            entityType:
                ENTITY_TYPES
                    .VALIDATION_RULE,
            subtitle:
                'Validation Rule',
            values:
                metadataSnapshot
                    .validationRules
        },
        {
            entityType:
                ENTITY_TYPES.APEX_CLASS,
            subtitle:
                'Apex Class',
            values:
                metadataSnapshot
                    .apexClasses
        },
        {
            entityType:
                ENTITY_TYPES
                    .APEX_TRIGGER,
            subtitle:
                'Apex Trigger',
            values:
                metadataSnapshot
                    .apexTriggers
        },
        {
            entityType:
                ENTITY_TYPES
                    .PERMISSION_SET,
            subtitle:
                'Permission Set',
            values:
                metadataSnapshot
                    .permissionSets
        },
        {
            entityType:
                ENTITY_TYPES
                    .DUPLICATE_RULE,
            subtitle:
                'Duplicate Rule',
            values:
                metadataSnapshot
                    .duplicateRules
        },
        {
            entityType:
                ENTITY_TYPES
                    .MATCHING_RULE,
            subtitle:
                'Matching Rule',
            values:
                metadataSnapshot
                    .matchingRules
        }
    ];

    collections.forEach(
        (collection) => {
            normalizeArray(
                collection.values
            ).forEach(
                (item) => {
                    const apiName =
                        safeString(
                            item.apiName,
                            safeString(
                                item
                                    .developerName,
                                item.name
                            )
                        );

                    const label =
                        safeString(
                            item.label,
                            safeString(
                                item.name,
                                apiName
                            )
                        );

                    if (
                        matchesSearch(
                            normalizedTerm,
                            apiName,
                            label
                        )
                    ) {
                        results.push({
                            id:
                                createStableId(
                                    `${collection.entityType}-${apiName}`
                                ),

                            entityType:
                                collection.entityType,

                            entityApiName:
                                apiName,

                            entityLabel:
                                label,

                            parentApiName:
                                safeString(
                                    item
                                        .objectApiName
                                ),

                            subtitle:
                                collection.subtitle,

                            live:
                                true
                        });
                    }
                }
            );
        }
    );
}

/*
 * General helpers
 */
function validateSnapshot(
    metadataSnapshot
) {
    if (
        !metadataSnapshot ||
        !metadataSnapshot.success
    ) {
        throw new Error(
            metadataSnapshot
                ?.errors?.[0]
                ?.message ||
            'A valid Salesforce metadata snapshot is required.'
        );
    }
}

function parseQualifiedApiName(
    value
) {
    const normalized =
        safeString(
            value
        );

    const separatorIndex =
        normalized.indexOf(
            '.'
        );

    if (
        separatorIndex < 1
    ) {
        return {
            objectApiName:
                '',

            childApiName:
                normalized
        };
    }

    return {
        objectApiName:
            normalized.slice(
                0,
                separatorIndex
            ),

        childApiName:
            normalized.slice(
                separatorIndex + 1
            )
    };
}

function getEntityTypeLabel(
    entityType
) {
    const labels = {
        [ENTITY_TYPES.ORGANIZATION]:
            'Organization',

        [ENTITY_TYPES.OBJECT]:
            'Object',

        [ENTITY_TYPES.FIELD]:
            'Field',

        [ENTITY_TYPES.FLOW]:
            'Flow',

        [ENTITY_TYPES
            .VALIDATION_RULE]:
            'Validation Rule',

        [ENTITY_TYPES.FORMULA]:
            'Formula',

        [ENTITY_TYPES.APEX_CLASS]:
            'Apex Class',

        [ENTITY_TYPES
            .APEX_TRIGGER]:
            'Apex Trigger',

        [ENTITY_TYPES
            .PERMISSION_SET]:
            'Permission Set',

        [ENTITY_TYPES.PROFILE]:
            'Profile',

        [ENTITY_TYPES
            .DUPLICATE_RULE]:
            'Duplicate Rule',

        [ENTITY_TYPES
            .MATCHING_RULE]:
            'Matching Rule',

        [ENTITY_TYPES
            .RECORD_TYPE]:
            'Record Type',

        [ENTITY_TYPES.REPORT]:
            'Report',

        [ENTITY_TYPES.DASHBOARD]:
            'Dashboard'
    };

    return (
        labels[entityType] ||
        'Metadata Component'
    );
}

function inferTestType(
    value
) {
    const normalized =
        safeString(
            value
        ).toLowerCase();

    if (
        normalized.includes(
            'security'
        ) ||
        normalized.includes(
            'permission'
        )
    ) {
        return 'Security';
    }

    if (
        normalized.includes(
            'bulk'
        )
    ) {
        return 'Bulk';
    }

    if (
        normalized.includes(
            'failure'
        ) ||
        normalized.includes(
            'fault'
        ) ||
        normalized.includes(
            'error'
        )
    ) {
        return 'Error handling';
    }

    if (
        normalized.includes(
            'negative'
        ) ||
        normalized.includes(
            'invalid'
        )
    ) {
        return 'Negative';
    }

    if (
        normalized.includes(
            'regression'
        )
    ) {
        return 'Regression';
    }

    return 'Positive';
}

function isLiveSnapshot(
    metadataSnapshot
) {
    return [
        DATA_SOURCE_TYPES.LIVE,
        DATA_SOURCE_TYPES
            .LIVE_PARTIAL,
        DATA_SOURCE_TYPES.CACHE
    ].includes(
        metadataSnapshot
            ?.sourceType
    );
}

function isPartialSnapshot(
    metadataSnapshot
) {
    return (
        metadataSnapshot
            ?.coverageStatus ===
            'partial' ||
        metadataSnapshot
            ?.coverage
            ?.status ===
            'partial' ||
        metadataSnapshot
            ?.sourceType ===
            DATA_SOURCE_TYPES
                .LIVE_PARTIAL
    );
}

function matchesSearch(
    normalizedTerm,
    ...values
) {
    return values.some(
        (value) =>
            safeString(
                value
            )
                .toLowerCase()
                .includes(
                    normalizedTerm
                )
    );
}

function equalsIgnoreCase(
    first,
    second
) {
    return (
        safeString(
            first
        ).toLowerCase() ===
        safeString(
            second
        ).toLowerCase()
    );
}

function deduplicateDependencies(
    dependencies
) {
    const seen =
        new Set();

    return dependencies.filter(
        (dependency) => {
            const key =
                `${dependency.type}:${dependency.apiName}:${dependency.relationship}`;

            if (
                seen.has(key)
            ) {
                return false;
            }

            seen.add(key);

            return true;
        }
    );
}

function deduplicateRisks(
    risks
) {
    const seen =
        new Set();

    return risks.filter(
        (risk) => {
            const key =
                risk.id ||
                `${risk.title}:${risk.entityApiName}`;

            if (
                seen.has(key)
            ) {
                return false;
            }

            seen.add(key);

            return true;
        }
    );
}

function deduplicateById(
    items
) {
    const seen =
        new Set();

    return items.filter(
        (item) => {
            const key =
                item.id ||
                createStableId(
                    `${item.title}-${item.description}`
                );

            if (
                seen.has(key)
            ) {
                return false;
            }

            seen.add(key);

            return true;
        }
    );
}

function deduplicateResults(
    results
) {
    const seen =
        new Set();

    return results.filter(
        (result) => {
            const key =
                `${result.entityType}:${result.entityApiName}`;

            if (
                seen.has(key)
            ) {
                return false;
            }

            seen.add(key);

            return true;
        }
    );
}

function normalizeError(
    error
) {
    return {
        name:
            safeString(
                error?.name,
                'ExplanationEngineError'
            ),

        message:
            extractErrorMessage(
                error
            )
    };
}

function extractErrorMessage(
    error
) {
    return (
        error?.body?.message ||
        error?.message ||
        'The Salesforce Copilot explanation could not be generated.'
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
    return Array.isArray(
        value
    )
        ? value
        : [];
}