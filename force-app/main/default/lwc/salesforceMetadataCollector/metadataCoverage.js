/*
 * metadataCoverage.js
 *
 * Calculates truthful metadata coverage for the
 * Salesforce Metadata Collector.
 *
 * Responsibilities:
 * - compare the collection plan with collected metadata
 * - calculate weighted coverage
 * - identify missing and partially collected metadata
 * - explain limitations
 * - recommend the next best collection step
 *
 * Important:
 * Org Health and Metadata Coverage are different.
 *
 * Org Health answers:
 * "How healthy does the metadata we analyzed appear?"
 *
 * Metadata Coverage answers:
 * "How much of the intended CRM metadata did we inspect?"
 */

import {
    COLLECTION_STATUSES,
    COVERAGE_STATUSES,
    METADATA_TYPES
} from './collectorConstants';

import {
    getCollectionPlan,
    getNextCollectionItem,
    getTotalCollectionWeight
} from './metadataCollectionPlan';

export function calculateMetadataCoverage(
    snapshot = {},
    options = {}
) {
    const plan =
        getCollectionPlan();

    const categoryCoverage =
        plan.map(
            (planItem) =>
                evaluateCollectionItem(
                    planItem,
                    snapshot,
                    options
                )
        );

    const totalWeight =
        getTotalCollectionWeight();

    const earnedWeight =
        categoryCoverage.reduce(
            (total, item) =>
                total +
                Number(
                    item.earnedWeight || 0
                ),
            0
        );

    const score =
        totalWeight > 0
            ? Math.round(
                  (
                      earnedWeight /
                      totalWeight
                  ) *
                      100
              )
            : 0;

    const collectedTypes =
        categoryCoverage
            .filter(
                (item) =>
                    item.status ===
                    COLLECTION_STATUSES.COMPLETE
            )
            .map(
                (item) =>
                    item.metadataType
            );

    const partialTypes =
        categoryCoverage
            .filter(
                (item) =>
                    item.status ===
                    COLLECTION_STATUSES.PARTIAL
            )
            .map(
                (item) =>
                    item.metadataType
            );

    const missingTypes =
        categoryCoverage
            .filter(
                (item) =>
                    [
                        COLLECTION_STATUSES.NOT_STARTED,
                        COLLECTION_STATUSES.FAILED
                    ].includes(
                        item.status
                    )
            )
            .map(
                (item) =>
                    item.metadataType
            );

    const limitations =
        buildCoverageLimitations(
            categoryCoverage,
            snapshot
        );

    const nextBestCollectionStep =
        determineNextBestCollectionStep(
            categoryCoverage
        );

    return {
        score,

        status:
            getCoverageStatus(
                score
            ),

        totalWeight,

        earnedWeight,

        totalCategories:
            categoryCoverage.length,

        completeCategories:
            categoryCoverage.filter(
                (item) =>
                    item.status ===
                    COLLECTION_STATUSES.COMPLETE
            ).length,

        partialCategories:
            categoryCoverage.filter(
                (item) =>
                    item.status ===
                    COLLECTION_STATUSES.PARTIAL
            ).length,

        missingCategories:
            categoryCoverage.filter(
                (item) =>
                    [
                        COLLECTION_STATUSES.NOT_STARTED,
                        COLLECTION_STATUSES.FAILED
                    ].includes(
                        item.status
                    )
            ).length,

        collectedTypes,

        partialTypes,

        missingTypes,

        categoryCoverage,

        limitations,

        nextBestCollectionStep,

        summary:
            buildCoverageSummary({
                score,
                categoryCoverage,
                nextBestCollectionStep
            }),

        generatedAt:
            new Date().toISOString()
    };
}

export function evaluateCollectionItem(
    planItem = {},
    snapshot = {},
    options = {}
) {
    const metadataType =
        planItem.metadataType;

    const weight =
        Number(
            planItem.weight || 0
        );

    const result =
        inspectMetadataType(
            metadataType,
            snapshot,
            options
        );

    const completionRatio =
        normalizeRatio(
            result.completionRatio
        );

    const earnedWeight =
        Number(
            (
                weight *
                completionRatio
            ).toFixed(2)
        );

    return {
        id:
            planItem.id,

        metadataType,

        label:
            planItem.label,

        phase:
            planItem.phase,

        priority:
            planItem.priority,

        weight,

        status:
            result.status,

        itemCount:
            result.itemCount,

        expectedCount:
            result.expectedCount,

        completionRatio,

        completionPercentage:
            Math.round(
                completionRatio *
                    100
            ),

        earnedWeight,

        currentlySupported:
            Boolean(
                planItem.currentlySupported
            ),

        requiredForCoreMode:
            Boolean(
                planItem.requiredForCoreMode
            ),

        description:
            planItem.description,

        enables:
            Array.isArray(
                planItem.enables
            )
                ? [...planItem.enables]
                : [],

        limitation:
            result.limitation,

        evidence:
            result.evidence
    };
}

export function inspectMetadataType(
    metadataType = '',
    snapshot = {},
    options = {}
) {
    switch (metadataType) {
        case METADATA_TYPES.ORGANIZATION:
            return inspectOrganization(
                snapshot.organization
            );

        case METADATA_TYPES.OBJECTS:
            return inspectArrayCollection(
                snapshot.objects,
                {
                    minimumCount: 1,
                    label: 'objects'
                }
            );

        case METADATA_TYPES.FIELDS:
            return inspectNestedCollection(
                snapshot.objects,
                'fields',
                {
                    minimumCount: 1,
                    label: 'fields'
                }
            );

        case METADATA_TYPES.RELATIONSHIPS:
            return inspectNestedCollection(
                snapshot.objects,
                'relationships',
                {
                    allowZeroAsComplete: true,
                    label: 'relationships'
                }
            );

        case METADATA_TYPES.RECORD_TYPES:
            return inspectNestedCollection(
                snapshot.objects,
                'recordTypes',
                {
                    allowZeroAsComplete: true,
                    label: 'record types'
                }
            );

        case METADATA_TYPES.FLOWS:
            return inspectArrayCollection(
                snapshot.flows,
                {
                    allowZeroAsComplete:
                        Boolean(
                            options.flowsCollected
                        ),
                    label: 'flows'
                }
            );

        case METADATA_TYPES.VALIDATION_RULES:
            return inspectArrayCollection(
                snapshot.validationRules,
                {
                    allowZeroAsComplete:
                        Boolean(
                            options.validationRulesCollected
                        ),
                    label: 'Validation Rules'
                }
            );

        case METADATA_TYPES.DUPLICATE_RULES:
            return inspectCombinedCollections(
                [
                    snapshot.duplicateRules,
                    snapshot.matchingRules
                ],
                {
                    collectionVerified:
                        Boolean(
                            options.duplicateRulesCollected
                        ),
                    label:
                        'Duplicate and Matching Rules'
                }
            );

        case METADATA_TYPES.PERMISSION_SETS:
            return inspectCombinedCollections(
                [
                    snapshot.permissionSets,
                    snapshot.permissionSetGroups,
                    snapshot.permissionAssignments
                ],
                {
                    collectionVerified:
                        Boolean(
                            options.permissionsCollected
                        ),
                    label:
                        'permission metadata'
                }
            );

        case METADATA_TYPES.APEX_CLASSES:
            return inspectCombinedCollections(
                [
                    snapshot.apexClasses,
                    snapshot.apexTriggers
                ],
                {
                    collectionVerified:
                        Boolean(
                            options.apexCollected
                        ),
                    label:
                        'Apex metadata'
                }
            );

        case METADATA_TYPES.REPORTS:
            return inspectCombinedCollections(
                [
                    snapshot.reports,
                    snapshot.dashboards
                ],
                {
                    collectionVerified:
                        Boolean(
                            options.analyticsCollected
                        ),
                    label:
                        'reports and dashboards'
                }
            );

        case METADATA_TYPES.SHARING_RULES:
            return inspectCombinedCollections(
                [
                    snapshot.sharingRules,
                    snapshot.roles,
                    snapshot.queues,
                    snapshot.profiles
                ],
                {
                    collectionVerified:
                        Boolean(
                            options.sharingCollected
                        ),
                    label:
                        'sharing and access metadata'
                }
            );

        case METADATA_TYPES.DEPLOYMENTS:
            return inspectCombinedCollections(
                [
                    snapshot.deployments,
                    snapshot.failedDeployments,
                    snapshot.recentChanges
                ],
                {
                    collectionVerified:
                        Boolean(
                            options.historyCollected
                        ),
                    label:
                        'deployment and change history'
                }
            );

        default:
            return {
                status:
                    COLLECTION_STATUSES.NOT_SUPPORTED,

                itemCount: 0,

                expectedCount: null,

                completionRatio: 0,

                limitation:
                    'This metadata type is not currently evaluated by the coverage engine.',

                evidence: []
            };
    }
}

export function inspectOrganization(
    organization = {}
) {
    if (
        !organization ||
        typeof organization !==
            'object'
    ) {
        return {
            status:
                COLLECTION_STATUSES.NOT_STARTED,

            itemCount: 0,

            expectedCount: 1,

            completionRatio: 0,

            limitation:
                'Organization context was not collected.',

            evidence: []
        };
    }

    const keyFields = [
        organization.id,
        organization.name,
        organization.organizationType,
        organization.instanceName,
        organization.apiVersion
    ];

    const populatedCount =
        keyFields.filter(
            (value) =>
                value !== null &&
                value !== undefined &&
                value !== ''
        ).length;

    const completionRatio =
        populatedCount /
        keyFields.length;

    return {
        status:
            completionRatio >= 0.8
                ? COLLECTION_STATUSES.COMPLETE
                : completionRatio > 0
                  ? COLLECTION_STATUSES.PARTIAL
                  : COLLECTION_STATUSES.NOT_STARTED,

        itemCount:
            populatedCount,

        expectedCount:
            keyFields.length,

        completionRatio,

        limitation:
            completionRatio >= 0.8
                ? ''
                : 'Some organization context fields were unavailable.',

        evidence: [
            {
                label:
                    'Organization name',

                available:
                    Boolean(
                        organization.name
                    )
            },
            {
                label:
                    'Organization ID',

                available:
                    Boolean(
                        organization.id
                    )
            },
            {
                label:
                    'Organization type',

                available:
                    Boolean(
                        organization.organizationType
                    )
            },
            {
                label:
                    'Instance name',

                available:
                    Boolean(
                        organization.instanceName
                    )
            },
            {
                label:
                    'API version',

                available:
                    Boolean(
                        organization.apiVersion
                    )
            }
        ]
    };
}

export function inspectArrayCollection(
    value,
    {
        minimumCount = 0,
        allowZeroAsComplete = false,
        label = 'items'
    } = {}
) {
    const items =
        Array.isArray(value)
            ? value
            : [];

    if (
        items.length >=
        Math.max(
            1,
            minimumCount
        )
    ) {
        return {
            status:
                COLLECTION_STATUSES.COMPLETE,

            itemCount:
                items.length,

            expectedCount:
                minimumCount || null,

            completionRatio: 1,

            limitation: '',

            evidence: [
                {
                    label,
                    count:
                        items.length
                }
            ]
        };
    }

    if (
        allowZeroAsComplete &&
        Array.isArray(value)
    ) {
        return {
            status:
                COLLECTION_STATUSES.COMPLETE,

            itemCount: 0,

            expectedCount: null,

            completionRatio: 1,

            limitation:
                `The collector verified that no ${label} were returned.`,

            evidence: [
                {
                    label,
                    count: 0
                }
            ]
        };
    }

    return {
        status:
            COLLECTION_STATUSES.NOT_STARTED,

        itemCount: 0,

        expectedCount:
            minimumCount || null,

        completionRatio: 0,

        limitation:
            `${label} have not been collected.`,

        evidence: []
    };
}

export function inspectNestedCollection(
    parentItems,
    propertyName = '',
    {
        minimumCount = 0,
        allowZeroAsComplete = false,
        label = 'nested items'
    } = {}
) {
    const parents =
        Array.isArray(parentItems)
            ? parentItems
            : [];

    if (!parents.length) {
        return {
            status:
                COLLECTION_STATUSES.NOT_STARTED,

            itemCount: 0,

            expectedCount: null,

            completionRatio: 0,

            limitation:
                `${label} cannot be evaluated because no parent objects were collected.`,

            evidence: []
        };
    }

    const successfulParents =
        parents.filter(
            (item) =>
                !item?.metadataLoadError
        );

    const failedParentCount =
        parents.length -
        successfulParents.length;

    const parentCountWithProperty =
        successfulParents.filter(
            (item) =>
                Array.isArray(
                    item?.[propertyName]
                )
        ).length;

    const itemCount =
        successfulParents.reduce(
            (total, item) =>
                total +
                (
                    Array.isArray(
                        item?.[propertyName]
                    )
                        ? item[propertyName]
                              .length
                        : 0
                ),
            0
        );

    const completionRatio =
        parentCountWithProperty /
        parents.length;

    const allSuccessfulParentsHaveProperty =
        successfulParents.length > 0 &&
        parentCountWithProperty ===
            successfulParents.length;

    const hasRequiredItems =
        itemCount >=
        minimumCount;

    if (
        failedParentCount === 0 &&
        allSuccessfulParentsHaveProperty &&
        (
            hasRequiredItems ||
            allowZeroAsComplete
        )
    ) {
        return {
            status:
                COLLECTION_STATUSES.COMPLETE,

            itemCount,

            expectedCount: null,

            completionRatio: 1,

            limitation:
                itemCount === 0
                    ? `No ${label} were returned for the analyzed objects.`
                    : '',

            evidence: [
                {
                    label:
                        'Parent objects inspected',

                    count:
                        parents.length
                },
                {
                    label,

                    count:
                        itemCount
                }
            ]
        };
    }

    if (
        parentCountWithProperty > 0
    ) {
        return {
            status:
                COLLECTION_STATUSES.PARTIAL,

            itemCount,

            expectedCount: null,

            completionRatio,

            limitation:
                failedParentCount > 0
                    ? `${label} were collected successfully for ${parentCountWithProperty} of ${parents.length} analyzed objects. ${failedParentCount} object-detail requests failed.`
                    : `${label} were collected for only ${parentCountWithProperty} of ${parents.length} analyzed objects.`,

            evidence: [
                {
                    label:
                        'Parent objects inspected',

                    count:
                        parents.length
                },
                {
                    label:
                        'Successful parent objects',

                    count:
                        successfulParents.length
                },
                {
                    label:
                        'Failed parent objects',

                    count:
                        failedParentCount
                },
                {
                    label,

                    count:
                        itemCount
                }
            ]
        };
    }

    return {
        status:
            COLLECTION_STATUSES.NOT_STARTED,

        itemCount: 0,

        expectedCount: null,

        completionRatio: 0,

        limitation:
            failedParentCount > 0
                ? `${label} could not be verified because the related object-detail requests failed.`
                : `${label} have not been collected.`,

        evidence: []
    };
}

export function inspectCombinedCollections(
    values = [],
    {
        collectionVerified = false,
        label = 'metadata'
    } = {}
) {
    const arrays =
        Array.isArray(values)
            ? values
            : [];

    const validArrays =
        arrays.filter(
            (value) =>
                Array.isArray(value)
        );

    const itemCount =
        validArrays.reduce(
            (total, value) =>
                total +
                value.length,
            0
        );

    if (itemCount > 0) {
        return {
            status:
                COLLECTION_STATUSES.COMPLETE,

            itemCount,

            expectedCount: null,

            completionRatio: 1,

            limitation: '',

            evidence: [
                {
                    label,

                    count:
                        itemCount
                },
                {
                    label:
                        'Collection groups available',

                    count:
                        validArrays.length
                }
            ]
        };
    }

    if (
        collectionVerified
    ) {
        return {
            status:
                COLLECTION_STATUSES.COMPLETE,

            itemCount: 0,

            expectedCount: null,

            completionRatio: 1,

            limitation:
                `The collector verified that no ${label} were returned.`,

            evidence: [
                {
                    label,

                    count: 0
                },
                {
                    label:
                        'Collection verified',

                    available: true
                }
            ]
        };
    }

    /*
     * Empty normalized arrays do not prove that collection
     * occurred. Without a positive collection flag, this
     * category must receive no coverage credit.
     */
    return {
        status:
            COLLECTION_STATUSES.NOT_STARTED,

        itemCount: 0,

        expectedCount: null,

        completionRatio: 0,

        limitation:
            `${label} have not been collected.`,

        evidence: []
    };
}

export function getCoverageStatus(
    score = 0
) {
    const normalizedScore =
        clampScore(
            score
        );

    if (normalizedScore >= 95) {
        return COVERAGE_STATUSES.COMPLETE;
    }

    if (normalizedScore >= 75) {
        return COVERAGE_STATUSES.STRONG;
    }

    if (normalizedScore >= 50) {
        return COVERAGE_STATUSES.MODERATE;
    }

    if (normalizedScore >= 25) {
        return COVERAGE_STATUSES.PARTIAL;
    }

    return COVERAGE_STATUSES.MINIMAL;
}

export function buildCoverageLimitations(
    categoryCoverage = [],
    snapshot = {}
) {
    const limitations =
        categoryCoverage
            .filter(
                (item) =>
                    item.status !==
                    COLLECTION_STATUSES.COMPLETE
            )
            .map(
                (item) =>
                    item.limitation ||
                    `${item.label} coverage is incomplete.`
            );

    const detailedObjects =
        Array.isArray(
            snapshot.objects
        )
            ? snapshot.objects.length
            : 0;

    const inventoryCount =
        Number(
            snapshot
                ?.organization
                ?.totalObjects || 0
        );

    if (
        inventoryCount > 0 &&
        detailedObjects <
            inventoryCount
    ) {
        limitations.unshift(
            `Detailed metadata was analyzed for ${detailedObjects} of ${inventoryCount} inventory objects.`
        );
    }

    return Array.from(
        new Set(
            limitations.filter(
                Boolean
            )
        )
    );
}

export function determineNextBestCollectionStep(
    categoryCoverage = []
) {
    const incompleteItems =
        categoryCoverage
            .filter(
                (item) =>
                    item.status !==
                        COLLECTION_STATUSES.COMPLETE &&
                    item.status !==
                        COLLECTION_STATUSES.NOT_SUPPORTED
            )
            .sort(
                (
                    first,
                    second
                ) => {
                    const priorityDifference =
                        first.priority -
                        second.priority;

                    if (
                        priorityDifference !==
                        0
                    ) {
                        return priorityDifference;
                    }

                    return (
                        second.weight -
                        first.weight
                    );
                }
            );

    const nextItem =
        incompleteItems[0] ||
        getNextCollectionItem();

    if (!nextItem) {
        return {
            metadataType: '',

            label:
                'No additional collection required',

            phase: '',

            reason:
                'All planned metadata categories are complete.'
        };
    }

    return {
        metadataType:
            nextItem.metadataType,

        label:
            nextItem.label,

        phase:
            nextItem.phase,

        reason:
            `${nextItem.label} has priority ${nextItem.priority} and contributes ${nextItem.weight}% to metadata coverage.`
    };
}

export function buildCoverageSummary({
    score = 0,
    categoryCoverage = [],
    nextBestCollectionStep = null
} = {}) {
    const completeCount =
        categoryCoverage.filter(
            (item) =>
                item.status ===
                COLLECTION_STATUSES.COMPLETE
        ).length;

    const totalCount =
        categoryCoverage.length;

    const nextLabel =
        nextBestCollectionStep
            ?.label ||
        'additional metadata';

    return `Metadata Coverage is ${clampScore(
        score
    )}/100. ${completeCount} of ${totalCount} planned metadata categories are complete. The next recommended collection target is ${nextLabel}.`;
}

export function clampScore(
    value = 0
) {
    const numberValue =
        Number(value);

    if (
        !Number.isFinite(
            numberValue
        )
    ) {
        return 0;
    }

    return Math.min(
        100,
        Math.max(
            0,
            Math.round(
                numberValue
            )
        )
    );
}

export function normalizeRatio(
    value = 0
) {
    const numberValue =
        Number(value);

    if (
        !Number.isFinite(
            numberValue
        )
    ) {
        return 0;
    }

    return Math.min(
        1,
        Math.max(
            0,
            numberValue
        )
    );
}

const metadataCoverage = {
    calculateMetadataCoverage,
    evaluateCollectionItem,
    inspectMetadataType,
    inspectOrganization,
    inspectArrayCollection,
    inspectNestedCollection,
    inspectCombinedCollections,
    getCoverageStatus,
    buildCoverageLimitations,
    determineNextBestCollectionStep,
    buildCoverageSummary,
    clampScore,
    normalizeRatio
};

export default metadataCoverage;