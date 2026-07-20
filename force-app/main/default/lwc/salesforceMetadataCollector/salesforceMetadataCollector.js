/*
 * salesforceMetadataCollector.js
 *
 * Salesforce-specific metadata collection service for
 * the Salesforce Copilot CRM Intelligence Platform.
 *
 * Responsibilities:
 * - retrieve live Salesforce organization context
 * - retrieve the object inventory
 * - select objects according to collection mode
 * - retrieve detailed object metadata in controlled batches
 * - retrieve live Salesforce Flow metadata
 * - assemble a Salesforce-specific collection result
 * - adapt the result into a normalized CRM snapshot
 * - calculate truthful metadata coverage
 *
 * This is primarily a service module.
 * It does not require Agentforce or generative AI.
 */

import {
    getOrgSummary,
    getObjects,
    getObjectContext,
    getFlows
} from 'c/orgContextService';

import {
    COLLECTOR_SOURCE,
    COLLECTOR_VERSION,
    CRM_PROVIDERS,
    DEFAULT_COLLECTION_MODE,
    COLLECTION_MODES,
    COLLECTION_STATUSES,
    getCollectionBatchSize,
    normalizeCollectionMode
} from './collectorConstants';

import {
    getCollectionPlan,
    buildCollectionPlanSummary
} from './metadataCollectionPlan';

import {
    adaptSalesforceSnapshot
} from './salesforceSnapshotAdapter';

const OBJECT_LIMITS = Object.freeze({
    [COLLECTION_MODES.QUICK]: 12,
    [COLLECTION_MODES.STANDARD]: 25,
    [COLLECTION_MODES.EXTENDED]: 50,
    [COLLECTION_MODES.FULL]:
        Number.MAX_SAFE_INTEGER
});

const PRIORITY_OBJECTS = Object.freeze([
    'Account',
    'Contact',
    'Opportunity',
    'Lead',
    'Case',
    'Campaign',
    'Task',
    'User'
]);

export async function collectSalesforceMetadata(
    options = {}
) {
    const collectionMode =
        normalizeCollectionMode(
            options.collectionMode ||
            options.scanMode ||
            DEFAULT_COLLECTION_MODE
        );

    const startedAt =
        new Date().toISOString();

    const startedAtMilliseconds =
        Date.now();

    const warnings = [];
    const errors = [];

    const collectionFlags =
        buildCollectionFlags(
            options.collectionFlags
        );

    try {
        reportProgress(
            options.onProgress,
            createProgressState({
                stage:
                    'organization',

                label:
                    'Loading organization context',

                percentage: 5
            })
        );

        const {
            rawOrganization,
            rawObjectInventory
        } =
            await collectFoundationMetadata();

        const organization =
            normalizeOrganizationSummary(
                rawOrganization
            );

        const objectInventory =
            normalizeObjectInventory(
                rawObjectInventory
            );

        if (!objectInventory.length) {
            throw new Error(
                'The Salesforce Metadata Collector did not receive an object inventory.'
            );
        }

        const selectedObjects =
            selectObjectsForCollection(
                objectInventory,
                {
                    collectionMode,

                    objectLimit:
                        options.objectLimit,

                    priorityObjects:
                        options.priorityObjects ||
                        PRIORITY_OBJECTS
                }
            );

        reportProgress(
            options.onProgress,
            createProgressState({
                stage:
                    'objects',

                label:
                    `Collecting detailed metadata for ${selectedObjects.length} objects`,

                processed: 0,

                total:
                    selectedObjects.length,

                percentage: 10
            })
        );

        const detailResult =
            await collectDetailedObjectMetadata(
                selectedObjects,
                {
                    batchSize:
                        options.batchSize ||
                        getCollectionBatchSize(
                            collectionMode
                        ),

                    continueOnError:
                        options.continueOnError !==
                        false,

                    onProgress:
                        (progress) => {
                            reportProgress(
                                options.onProgress,
                                createProgressState({
                                    stage:
                                        'objectDetails',

                                    label:
                                        `Processing Salesforce objects: ${progress.processed} of ${progress.total}`,

                                    processed:
                                        progress.processed,

                                    total:
                                        progress.total,

                                    successful:
                                        progress.successful,

                                    failed:
                                        progress.failed,

                                    percentage:
                                        calculateStagePercentage(
                                            progress.percentage,
                                            10,
                                            68
                                        )
                                })
                            );
                        }
                }
            );

        warnings.push(
            ...detailResult.warnings
        );

        reportProgress(
            options.onProgress,
            createProgressState({
                stage:
                    'flows',

                label:
                    'Collecting live Salesforce Flow metadata',

                percentage: 72
            })
        );

        const flowResult =
            await collectFlowMetadata({
                continueOnError:
                    options.continueOnError !==
                    false
            });

        warnings.push(
            ...flowResult.warnings
        );

        /*
         * A successful live request counts as verified collection,
         * even when Salesforce returns zero visible Flows.
         */
        collectionFlags.flowsCollected =
            flowResult.collected ||
            collectionFlags.flowsCollected;

        reportProgress(
            options.onProgress,
            createProgressState({
                stage:
                    'additionalMetadata',

                label:
                    'Preparing additional metadata categories',

                percentage: 82
            })
        );

        const additionalMetadata =
            normalizeAdditionalMetadata(
                options.additionalMetadata
            );

        /*
         * Prefer live Flow results, while still allowing supplied
         * metadata to supplement the collection.
         */
        const flows =
            mergeMetadataCollections(
                flowResult.flows,
                additionalMetadata.flows
            );

        const collectedAt =
            new Date().toISOString();

        const rawCollectionResult = {
            success: true,

            provider:
                CRM_PROVIDERS.SALESFORCE,

            providerVersion:
                organization.apiVersion,

            collectorVersion:
                COLLECTOR_VERSION,

            collectionMode,

            source:
                COLLECTOR_SOURCE,

            organization,

            orgSummary:
                organization,

            objectInventory,

            selectedObjects,

            objects:
                detailResult.detailedObjects,

            detailedObjects:
                detailResult.detailedObjects,

            flows,

            validationRules:
                additionalMetadata
                    .validationRules,

            duplicateRules:
                additionalMetadata
                    .duplicateRules,

            matchingRules:
                additionalMetadata
                    .matchingRules,

            permissionSets:
                additionalMetadata
                    .permissionSets,

            permissionSetGroups:
                additionalMetadata
                    .permissionSetGroups,

            permissionAssignments:
                additionalMetadata
                    .permissionAssignments,

            profiles:
                additionalMetadata.profiles,

            apexClasses:
                additionalMetadata
                    .apexClasses,

            apexTriggers:
                additionalMetadata
                    .apexTriggers,

            reports:
                additionalMetadata.reports,

            dashboards:
                additionalMetadata
                    .dashboards,

            sharingRules:
                additionalMetadata
                    .sharingRules,

            roles:
                additionalMetadata.roles,

            queues:
                additionalMetadata.queues,

            namedCredentials:
                additionalMetadata
                    .namedCredentials,

            customMetadata:
                additionalMetadata
                    .customMetadata,

            deployments:
                additionalMetadata
                    .deployments,

            failedDeployments:
                additionalMetadata
                    .failedDeployments,

            recentChanges:
                additionalMetadata
                    .recentChanges,

            metadataItems:
                additionalMetadata
                    .metadataItems,

            blockingFindings:
                additionalMetadata
                    .blockingFindings,

            deploymentBlockers:
                additionalMetadata
                    .deploymentBlockers,

            collectionFlags,

            collectionEvidence:
                buildCollectionEvidence({
                    organization,

                    objectInventory,

                    selectedObjects,

                    detailedObjects:
                        detailResult
                            .detailedObjects,

                    successfulObjectCount:
                        detailResult
                            .successfulObjectCount,

                    failedObjectCount:
                        detailResult
                            .failedObjectCount,

                    flows,

                    flowsCollected:
                        collectionFlags
                            .flowsCollected,

                    additionalMetadata
                }),

            warnings,

            errors,

            collectedAt,

            retrievedAt:
                collectedAt
        };

        reportProgress(
            options.onProgress,
            createProgressState({
                stage:
                    'adapting',

                label:
                    'Adapting Salesforce metadata into the CRM snapshot',

                percentage: 90
            })
        );

        const snapshot =
            adaptSalesforceSnapshot(
                rawCollectionResult,
                {
                    collectionMode
                }
            );

        const completedAt =
            new Date().toISOString();

        const durationMilliseconds =
            Math.max(
                0,
                Date.now() -
                startedAtMilliseconds
            );

        reportProgress(
            options.onProgress,
            createProgressState({
                stage:
                    'complete',

                label:
                    'Salesforce metadata collection completed',

                processed:
                    detailResult
                        .processedObjectCount,

                total:
                    selectedObjects.length,

                successful:
                    detailResult
                        .successfulObjectCount,

                failed:
                    detailResult
                        .failedObjectCount,

                percentage: 100
            })
        );

        return {
            success: true,

            provider:
                CRM_PROVIDERS.SALESFORCE,

            collectorVersion:
                COLLECTOR_VERSION,

            collectionMode,

            organization,

            objectInventory,

            selectedObjects,

            detailedObjects:
                detailResult.detailedObjects,

            connectedObjectNames:
                detailResult
                    .detailedObjects
                    .map(
                        (objectItem) =>
                            objectItem.apiName ||
                            objectItem.name
                    ),

            flows,

            snapshot,

            metadataCoverage:
                snapshot.metadataCoverage,

            capabilities:
                snapshot.capabilities,

            limitations:
                snapshot.limitations,

            collectionPlan:
                getCollectionPlan(),

            collectionPlanSummary:
                buildCollectionPlanSummary(),

            collectionFlags,

            coverage: {
                inventoryObjectCount:
                    objectInventory.length,

                selectedObjectCount:
                    selectedObjects.length,

                detailedObjectCount:
                    detailResult
                        .detailedObjects
                        .length,

                successfulObjectCount:
                    detailResult
                        .successfulObjectCount,

                failedObjectCount:
                    detailResult
                        .failedObjectCount,

                fieldCount:
                    countNestedItems(
                        detailResult
                            .detailedObjects,
                        'fields'
                    ),

                relationshipCount:
                    countNestedItems(
                        detailResult
                            .detailedObjects,
                        'relationships'
                    ),

                recordTypeCount:
                    countNestedItems(
                        detailResult
                            .detailedObjects,
                        'recordTypes'
                    ),

                flowCount:
                    flows.length,

                completionPercentage:
                    calculateCompletionPercentage(
                        selectedObjects.length,
                        detailResult
                            .processedObjectCount
                    )
            },

            timing: {
                startedAt,
                completedAt,
                durationMilliseconds
            },

            warnings,

            errors
        };
    } catch (error) {
        const completedAt =
            new Date().toISOString();

        const normalizedError =
            normalizeCollectorError(
                error
            );

        errors.push(
            normalizedError
        );

        reportProgress(
            options.onProgress,
            createProgressState({
                stage:
                    'failed',

                label:
                    normalizedError.message,

                percentage: 100,

                status:
                    COLLECTION_STATUSES.FAILED
            })
        );

        return buildFailedCollectionResult({
            collectionMode,

            startedAt,

            completedAt,

            durationMilliseconds:
                Math.max(
                    0,
                    Date.now() -
                    startedAtMilliseconds
                ),

            warnings,

            errors,

            collectionFlags
        });
    }
}

export async function collectFoundationMetadata() {
    const [
        rawOrganization,
        rawObjectInventory
    ] = await Promise.all([
        getOrgSummary(),
        getObjects()
    ]);

    return {
        rawOrganization,
        rawObjectInventory
    };
}

/*
 * Retrieves live Flow definitions and versions.
 *
 * A successful request that returns an empty array still
 * counts as verified collection.
 */
export async function collectFlowMetadata(
    options = {}
) {
    const continueOnError =
        options.continueOnError !==
        false;

    try {
        const flowRecords =
            await getFlows();

        return {
            collected: true,

            flows:
                normalizeArray(
                    flowRecords
                ),

            warnings: []
        };
    } catch (error) {
        if (!continueOnError) {
            throw error;
        }

        return {
            collected: false,

            flows: [],

            warnings: [
                {
                    type:
                        'FlowMetadataWarning',

                    apiName:
                        'Flow',

                    message:
                        getErrorMessage(
                            error
                        )
                }
            ]
        };
    }
}

export async function collectDetailedObjectMetadata(
    selectedObjects = [],
    options = {}
) {
    const objects =
        Array.isArray(
            selectedObjects
        )
            ? [...selectedObjects]
            : [];

    const batchSize =
        normalizePositiveInteger(
            options.batchSize,
            getCollectionBatchSize(
                DEFAULT_COLLECTION_MODE
            )
        );

    const continueOnError =
        options.continueOnError !==
        false;

    const detailedObjects = [];
    const warnings = [];

    let processedObjectCount = 0;
    let successfulObjectCount = 0;
    let failedObjectCount = 0;

    for (
        let index = 0;
        index < objects.length;
        index += batchSize
    ) {
        const batch =
            objects.slice(
                index,
                index + batchSize
            );

        const batchResults =
            await Promise.all(
                batch.map(
                    async (objectItem) => {
                        const apiName =
                            objectItem.apiName ||
                            objectItem.name;

                        if (!apiName) {
                            const message =
                                'An object in the inventory did not include an API name.';

                            if (!continueOnError) {
                                throw new Error(
                                    message
                                );
                            }

                            return {
                                success: false,

                                object:
                                    buildFailedObjectResult(
                                        objectItem,
                                        message
                                    ),

                                warning:
                                    buildObjectWarning(
                                        'Unknown Object',
                                        message
                                    )
                            };
                        }

                        try {
                            const rawContext =
                                await getObjectContext(
                                    apiName
                                );

                            return {
                                success: true,

                                object:
                                    mergeObjectContext(
                                        objectItem,
                                        rawContext
                                    ),

                                warning: null
                            };
                        } catch (error) {
                            const message =
                                getErrorMessage(
                                    error
                                );

                            if (!continueOnError) {
                                throw error;
                            }

                            return {
                                success: false,

                                object:
                                    buildFailedObjectResult(
                                        objectItem,
                                        message
                                    ),

                                warning:
                                    buildObjectWarning(
                                        apiName,
                                        message
                                    )
                            };
                        }
                    }
                )
            );

        batchResults.forEach(
            (result) => {
                detailedObjects.push(
                    result.object
                );

                processedObjectCount += 1;

                if (result.success) {
                    successfulObjectCount += 1;
                } else {
                    failedObjectCount += 1;

                    if (result.warning) {
                        warnings.push(
                            result.warning
                        );
                    }
                }
            }
        );

        reportProgress(
            options.onProgress,
            {
                processed:
                    processedObjectCount,

                total:
                    objects.length,

                successful:
                    successfulObjectCount,

                failed:
                    failedObjectCount,

                percentage:
                    calculateCompletionPercentage(
                        objects.length,
                        processedObjectCount
                    )
            }
        );
    }

    return {
        detailedObjects,

        processedObjectCount,

        successfulObjectCount,

        failedObjectCount,

        warnings
    };
}

export function selectObjectsForCollection(
    objectInventory = [],
    options = {}
) {
    const inventory =
        Array.isArray(
            objectInventory
        )
            ? [...objectInventory]
            : [];

    const collectionMode =
        normalizeCollectionMode(
            options.collectionMode ||
            DEFAULT_COLLECTION_MODE
        );

    const configuredLimit =
        Number(
            options.objectLimit
        );

    const modeLimit =
        OBJECT_LIMITS[
            collectionMode
        ] ||
        OBJECT_LIMITS[
            DEFAULT_COLLECTION_MODE
        ];

    const maximumObjects =
        Number.isFinite(
            configuredLimit
        ) &&
        configuredLimit > 0
            ? Math.floor(
                  configuredLimit
              )
            : modeLimit;

    const selected = [];

    const selectedNames =
        new Set();

    const addObject =
        (objectItem) => {
            if (!objectItem) {
                return;
            }

            if (
                selected.length >=
                maximumObjects
            ) {
                return;
            }

            const apiName =
                objectItem.apiName ||
                objectItem.name;

            if (
                !apiName ||
                selectedNames.has(
                    apiName
                )
            ) {
                return;
            }

            selected.push(
                objectItem
            );

            selectedNames.add(
                apiName
            );
        };

    Array.from(
        options.priorityObjects ||
        PRIORITY_OBJECTS
    ).forEach(
        (priorityApiName) => {
            const match =
                inventory.find(
                    (objectItem) =>
                        (
                            objectItem.apiName ||
                            objectItem.name
                        ) ===
                        priorityApiName
                );

            addObject(
                match
            );
        }
    );

    inventory
        .filter(
            (objectItem) =>
                Boolean(
                    objectItem.custom
                )
        )
        .sort(
            compareObjects
        )
        .forEach(
            addObject
        );

    inventory
        .filter(
            (objectItem) =>
                objectItem.accessible !==
                    false &&
                objectItem.queryable !==
                    false
        )
        .sort(
            compareObjects
        )
        .forEach(
            addObject
        );

    inventory
        .sort(
            compareObjects
        )
        .forEach(
            addObject
        );

    return selected;
}

export function normalizeOrganizationSummary(
    rawOrganization = {}
) {
    const source =
        normalizeObject(
            rawOrganization
        );

    return {
        id:
            firstValue(
                source.id,
                source.organizationId
            ),

        name:
            firstValue(
                source.name,
                source.organizationName,
                'Unknown Organization'
            ),

        userName:
            firstValue(
                source.userName,
                source.username
            ),

        userEmail:
            firstValue(
                source.userEmail,
                source.email
            ),

        apiVersion:
            firstValue(
                source.apiVersion
            ),

        locale:
            firstValue(
                source.locale
            ),

        timeZone:
            firstValue(
                source.timeZone,
                source.timeZoneSidKey
            ),

        organizationType:
            firstValue(
                source.organizationType,
                source.orgType
            ),

        instanceName:
            firstValue(
                source.instanceName
            ),

        namespacePrefix:
            firstValue(
                source.namespacePrefix
            ),

        edition:
            firstValue(
                source.edition,
                source.organizationEdition
            ),

        isSandbox:
            toBoolean(
                source.isSandbox
            ),

        totalObjects:
            toNumber(
                source.totalObjects
            ),

        standardObjects:
            toNumber(
                source.standardObjects
            ),

        customObjects:
            toNumber(
                source.customObjects
            ),

        queryableObjects:
            toNumber(
                source.queryableObjects
            ),

        accessibleObjects:
            toNumber(
                source.accessibleObjects
            ),

        metadata: {
            ...source
        }
    };
}

export function normalizeObjectInventory(
    rawObjectInventory
) {
    const source =
        extractObjectInventory(
            rawObjectInventory
        );

    return source
        .map(
            normalizeInventoryObject
        )
        .filter(
            (objectItem) =>
                Boolean(
                    objectItem.apiName
                )
        );
}

export function normalizeInventoryObject(
    rawObject = {}
) {
    const source =
        normalizeObject(
            rawObject
        );

    const apiName =
        firstValue(
            source.apiName,
            source.name
        );

    const label =
        firstValue(
            source.label,
            apiName
        );

    return {
        apiName,

        name:
            firstValue(
                source.name,
                apiName
            ),

        label,

        labelPlural:
            firstValue(
                source.labelPlural,
                source.pluralLabel,
                label
            ),

        keyPrefix:
            firstValue(
                source.keyPrefix
            ),

        custom:
            toBoolean(
                source.custom
            ),

        accessible:
            source.accessible !==
            false,

        queryable:
            source.queryable !==
            false,

        searchable:
            toBoolean(
                source.searchable
            ),

        createable:
            toBoolean(
                source.createable
            ),

        updateable:
            toBoolean(
                source.updateable
            ),

        deletable:
            toBoolean(
                source.deletable
            ),

        metadata: {
            ...source
        }
    };
}

export function mergeObjectContext(
    inventoryObject = {},
    rawContext = {}
) {
    const context =
        extractObjectContext(
            rawContext
        );

    return {
        ...inventoryObject,
        ...context,

        apiName:
            firstValue(
                context.apiName,
                context.name,
                inventoryObject.apiName,
                inventoryObject.name
            ),

        name:
            firstValue(
                context.name,
                context.apiName,
                inventoryObject.name,
                inventoryObject.apiName
            ),

        label:
            firstValue(
                context.label,
                inventoryObject.label,
                context.apiName,
                context.name
            ),

        labelPlural:
            firstValue(
                context.labelPlural,
                context.pluralLabel,
                inventoryObject.labelPlural,
                inventoryObject.pluralLabel,
                context.label
            ),

        custom:
            firstBoolean(
                context.custom,
                inventoryObject.custom
            ),

        accessible:
            firstBoolean(
                context.accessible,
                inventoryObject.accessible,
                true
            ),

        queryable:
            firstBoolean(
                context.queryable,
                inventoryObject.queryable,
                true
            ),

        searchable:
            firstBoolean(
                context.searchable,
                inventoryObject.searchable,
                false
            ),

        createable:
            firstBoolean(
                context.createable,
                inventoryObject.createable,
                false
            ),

        updateable:
            firstBoolean(
                context.updateable,
                inventoryObject.updateable,
                false
            ),

        deletable:
            firstBoolean(
                context.deletable,
                inventoryObject.deletable,
                false
            ),

        fields:
            normalizeArray(
                context.fields
            ),

        relationships:
            normalizeArray(
                context.relationships
            ),

        recordTypes:
            normalizeArray(
                context.recordTypes
            ),

        metadataLoadError:
            firstValue(
                context.metadataLoadError,
                inventoryObject
                    .metadataLoadError
            ),

        metadata: {
            ...normalizeObject(
                inventoryObject.metadata
            ),
            ...context
        }
    };
}

export function normalizeAdditionalMetadata(
    additionalMetadata = {}
) {
    const source =
        normalizeObject(
            additionalMetadata
        );

    return {
        flows:
            normalizeArray(
                source.flows
            ),

        validationRules:
            normalizeArray(
                source.validationRules
            ),

        duplicateRules:
            normalizeArray(
                source.duplicateRules
            ),

        matchingRules:
            normalizeArray(
                source.matchingRules
            ),

        permissionSets:
            normalizeArray(
                source.permissionSets
            ),

        permissionSetGroups:
            normalizeArray(
                source.permissionSetGroups
            ),

        permissionAssignments:
            normalizeArray(
                source.permissionAssignments
            ),

        profiles:
            normalizeArray(
                source.profiles
            ),

        apexClasses:
            normalizeArray(
                source.apexClasses
            ),

        apexTriggers:
            normalizeArray(
                source.apexTriggers
            ),

        reports:
            normalizeArray(
                source.reports
            ),

        dashboards:
            normalizeArray(
                source.dashboards
            ),

        sharingRules:
            normalizeArray(
                source.sharingRules
            ),

        roles:
            normalizeArray(
                source.roles
            ),

        queues:
            normalizeArray(
                source.queues
            ),

        namedCredentials:
            normalizeArray(
                source.namedCredentials
            ),

        customMetadata:
            normalizeArray(
                source.customMetadata
            ),

        deployments:
            normalizeArray(
                source.deployments
            ),

        failedDeployments:
            normalizeArray(
                source.failedDeployments
            ),

        recentChanges:
            normalizeArray(
                source.recentChanges
            ),

        metadataItems:
            normalizeArray(
                source.metadataItems
            ),

        blockingFindings:
            normalizeArray(
                source.blockingFindings
            ),

        deploymentBlockers:
            normalizeArray(
                source.deploymentBlockers
            )
    };
}

export function buildCollectionFlags(
    flags = {}
) {
    const source =
        normalizeObject(
            flags
        );

    return {
        foundationCollected: true,

        objectsCollected: true,

        fieldsCollected: true,

        relationshipsCollected: true,

        recordTypesCollected: true,

        flowsCollected:
            Boolean(
                source.flowsCollected
            ),

        validationRulesCollected:
            Boolean(
                source.validationRulesCollected
            ),

        duplicateRulesCollected:
            Boolean(
                source.duplicateRulesCollected
            ),

        permissionsCollected:
            Boolean(
                source.permissionsCollected
            ),

        apexCollected:
            Boolean(
                source.apexCollected
            ),

        analyticsCollected:
            Boolean(
                source.analyticsCollected
            ),

        sharingCollected:
            Boolean(
                source.sharingCollected
            ),

        historyCollected:
            Boolean(
                source.historyCollected
            )
    };
}

export function buildCollectionEvidence({
    organization = {},
    objectInventory = [],
    selectedObjects = [],
    detailedObjects = [],
    successfulObjectCount = 0,
    failedObjectCount = 0,
    flows = [],
    flowsCollected = false,
    additionalMetadata = {}
} = {}) {
    return [
        {
            metadataType:
                'organization',

            status:
                organization.name
                    ? COLLECTION_STATUSES.COMPLETE
                    : COLLECTION_STATUSES.PARTIAL,

            count:
                organization.name
                    ? 1
                    : 0,

            detail:
                organization.name ||
                'Organization context unavailable'
        },
        {
            metadataType:
                'objects',

            status:
                objectInventory.length
                    ? COLLECTION_STATUSES.COMPLETE
                    : COLLECTION_STATUSES.NOT_STARTED,

            count:
                objectInventory.length,

            detail:
                `${objectInventory.length} inventory objects discovered`
        },
        {
            metadataType:
                'objectDetails',

            status:
                failedObjectCount === 0
                    ? COLLECTION_STATUSES.COMPLETE
                    : successfulObjectCount > 0
                      ? COLLECTION_STATUSES.PARTIAL
                      : COLLECTION_STATUSES.FAILED,

            count:
                detailedObjects.length,

            detail:
                `${successfulObjectCount} successful and ${failedObjectCount} failed object-detail requests`
        },
        {
            metadataType:
                'selectedObjects',

            status:
                selectedObjects.length
                    ? COLLECTION_STATUSES.COMPLETE
                    : COLLECTION_STATUSES.NOT_STARTED,

            count:
                selectedObjects.length,

            detail:
                `${selectedObjects.length} objects selected for detailed analysis`
        },
        {
            metadataType:
                'flows',

            status:
                flowsCollected
                    ? COLLECTION_STATUSES.COMPLETE
                    : COLLECTION_STATUSES.NOT_STARTED,

            count:
                normalizeArray(
                    flows
                ).length,

            detail:
                flowsCollected
                    ? `${normalizeArray(flows).length} Flow definitions verified through live Salesforce metadata.`
                    : 'Flow metadata was not collected.'
        },
        {
            metadataType:
                'validationRules',

            status:
                additionalMetadata
                    .validationRules
                    .length
                    ? COLLECTION_STATUSES.COMPLETE
                    : COLLECTION_STATUSES.NOT_STARTED,

            count:
                additionalMetadata
                    .validationRules
                    .length,

            detail:
                `${additionalMetadata.validationRules.length} Validation Rules supplied`
        }
    ];
}

export function mergeMetadataCollections(
    primaryItems = [],
    supplementalItems = []
) {
    const combined = [
        ...normalizeArray(
            primaryItems
        ),
        ...normalizeArray(
            supplementalItems
        )
    ];

    const results = [];

    const seenKeys =
        new Set();

    combined.forEach(
        (item, index) => {
            const source =
                normalizeObject(
                    item
                );

            const key =
                firstValue(
                    source.id,
                    source.apiName,
                    source.fullName,
                    source.developerName,
                    source.name,
                    `metadata-${index}`
                );

            if (
                seenKeys.has(
                    key
                )
            ) {
                return;
            }

            seenKeys.add(
                key
            );

            results.push(
                item
            );
        }
    );

    return results;
}

export function buildFailedObjectResult(
    objectItem = {},
    message = ''
) {
    return {
        ...objectItem,

        fields: [],

        relationships: [],

        recordTypes: [],

        metadataLoadError:
            message ||
            'Detailed object metadata could not be collected.'
    };
}

export function buildObjectWarning(
    apiName = '',
    message = ''
) {
    return {
        type:
            'ObjectMetadataWarning',

        apiName:
            apiName ||
            'Unknown Object',

        message:
            message ||
            'Detailed object metadata could not be collected.'
    };
}

export function buildFailedCollectionResult({
    collectionMode =
        DEFAULT_COLLECTION_MODE,
    startedAt = '',
    completedAt = '',
    durationMilliseconds = 0,
    warnings = [],
    errors = [],
    collectionFlags = {}
} = {}) {
    return {
        success: false,

        provider:
            CRM_PROVIDERS.SALESFORCE,

        collectorVersion:
            COLLECTOR_VERSION,

        collectionMode,

        organization: null,

        objectInventory: [],

        selectedObjects: [],

        detailedObjects: [],

        connectedObjectNames: [],

        flows: [],

        snapshot: null,

        metadataCoverage: null,

        capabilities: {},

        limitations: [],

        collectionPlan:
            getCollectionPlan(),

        collectionPlanSummary:
            buildCollectionPlanSummary(),

        collectionFlags,

        coverage: {
            inventoryObjectCount: 0,
            selectedObjectCount: 0,
            detailedObjectCount: 0,
            successfulObjectCount: 0,
            failedObjectCount: 0,
            fieldCount: 0,
            relationshipCount: 0,
            recordTypeCount: 0,
            flowCount: 0,
            completionPercentage: 0
        },

        timing: {
            startedAt,
            completedAt,
            durationMilliseconds
        },

        warnings:
            normalizeArray(
                warnings
            ),

        errors:
            normalizeArray(
                errors
            )
    };
}

export function normalizeCollectorError(
    error
) {
    return {
        name:
            firstValue(
                error?.name,
                'SalesforceMetadataCollectorError'
            ),

        message:
            getErrorMessage(
                error
            ),

        status:
            firstValue(
                error?.status,
                error?.body?.statusCode
            ),

        stack:
            firstValue(
                error?.stack
            )
    };
}

export function getPrimaryCollectorError(
    collectionResult = {}
) {
    const errors =
        normalizeArray(
            collectionResult.errors
        );

    if (errors.length) {
        return (
            errors[0].message ||
            'The Salesforce Metadata Collector failed.'
        );
    }

    return 'The Salesforce Metadata Collector failed.';
}

export function createProgressState({
    stage = '',
    label = '',
    processed = 0,
    total = 0,
    successful = 0,
    failed = 0,
    percentage = 0,
    status =
        COLLECTION_STATUSES.IN_PROGRESS
} = {}) {
    return {
        stage,
        label,
        processed,
        total,
        successful,
        failed,

        percentage:
            clampPercentage(
                percentage
            ),

        status
    };
}

export function reportProgress(
    callback,
    progress = {}
) {
    if (
        typeof callback !==
        'function'
    ) {
        return;
    }

    try {
        callback({
            ...progress
        });
    } catch (error) {
        /*
         * Progress updates must never stop collection.
         */
    }
}

export function calculateCompletionPercentage(
    total = 0,
    completed = 0
) {
    const normalizedTotal =
        Number(total);

    const normalizedCompleted =
        Number(completed);

    if (
        !Number.isFinite(
            normalizedTotal
        ) ||
        normalizedTotal <= 0
    ) {
        return 0;
    }

    if (
        !Number.isFinite(
            normalizedCompleted
        )
    ) {
        return 0;
    }

    return clampPercentage(
        (
            normalizedCompleted /
            normalizedTotal
        ) *
            100
    );
}

export function calculateStagePercentage(
    stagePercentage = 0,
    minimum = 0,
    maximum = 100
) {
    const normalizedMinimum =
        Number(minimum);

    const normalizedMaximum =
        Number(maximum);

    const range =
        normalizedMaximum -
        normalizedMinimum;

    return clampPercentage(
        normalizedMinimum +
        (
            clampPercentage(
                stagePercentage
            ) /
            100
        ) *
            range
    );
}

export function countNestedItems(
    objects = [],
    propertyName = ''
) {
    if (!propertyName) {
        return 0;
    }

    return normalizeArray(
        objects
    ).reduce(
        (total, objectItem) =>
            total +
            (
                Array.isArray(
                    objectItem?.[
                        propertyName
                    ]
                )
                    ? objectItem[
                          propertyName
                      ].length
                    : 0
            ),
        0
    );
}

function extractObjectInventory(
    rawObjectInventory
) {
    if (
        Array.isArray(
            rawObjectInventory
        )
    ) {
        return rawObjectInventory;
    }

    if (
        Array.isArray(
            rawObjectInventory?.objects
        )
    ) {
        return rawObjectInventory.objects;
    }

    if (
        Array.isArray(
            rawObjectInventory?.items
        )
    ) {
        return rawObjectInventory.items;
    }

    if (
        Array.isArray(
            rawObjectInventory?.results
        )
    ) {
        return rawObjectInventory.results;
    }

    return [];
}

function extractObjectContext(
    rawContext = {}
) {
    if (
        !rawContext ||
        typeof rawContext !==
            'object'
    ) {
        return {};
    }

    return (
        rawContext.objectContext ||
        rawContext.object ||
        rawContext.result ||
        rawContext
    );
}

function compareObjects(
    first = {},
    second = {}
) {
    const firstLabel =
        first.label ||
        first.apiName ||
        first.name ||
        '';

    const secondLabel =
        second.label ||
        second.apiName ||
        second.name ||
        '';

    return firstLabel.localeCompare(
        secondLabel
    );
}

function normalizePositiveInteger(
    value,
    fallback = 10
) {
    const numberValue =
        Number(value);

    if (
        Number.isFinite(
            numberValue
        ) &&
        numberValue > 0
    ) {
        return Math.floor(
            numberValue
        );
    }

    return Math.max(
        1,
        Number(fallback) || 10
    );
}

function clampPercentage(
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
        typeof value ===
            'object' &&
        !Array.isArray(value)
    )
        ? { ...value }
        : {};
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

function firstBoolean(
    ...values
) {
    const value =
        values.find(
            (candidate) =>
                typeof candidate ===
                'boolean'
        );

    return (
        typeof value ===
        'boolean'
    )
        ? value
        : false;
}

function toBoolean(
    value
) {
    if (
        typeof value ===
        'boolean'
    ) {
        return value;
    }

    if (
        typeof value ===
        'string'
    ) {
        return (
            value
                .trim()
                .toLowerCase() ===
            'true'
        );
    }

    return Boolean(value);
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

function getErrorMessage(
    error
) {
    if (!error) {
        return 'An unknown Salesforce metadata collection error occurred.';
    }

    if (
        typeof error ===
        'string'
    ) {
        return error;
    }

    if (
        typeof error.message ===
        'string' &&
        error.message
    ) {
        return error.message;
    }

    if (
        error.body &&
        typeof error.body.message ===
            'string'
    ) {
        return error.body.message;
    }

    if (
        error.detail &&
        typeof error.detail ===
            'string'
    ) {
        return error.detail;
    }

    return 'The Salesforce Metadata Collector could not complete the request.';
}

const salesforceMetadataCollector = {
    collectSalesforceMetadata,
    collectFoundationMetadata,
    collectFlowMetadata,
    collectDetailedObjectMetadata,
    selectObjectsForCollection,
    normalizeOrganizationSummary,
    normalizeObjectInventory,
    normalizeInventoryObject,
    mergeObjectContext,
    normalizeAdditionalMetadata,
    buildCollectionFlags,
    buildCollectionEvidence,
    mergeMetadataCollections,
    buildFailedObjectResult,
    buildObjectWarning,
    buildFailedCollectionResult,
    normalizeCollectorError,
    getPrimaryCollectorError,
    createProgressState,
    reportProgress,
    calculateCompletionPercentage,
    calculateStagePercentage,
    countNestedItems
};

export default salesforceMetadataCollector;