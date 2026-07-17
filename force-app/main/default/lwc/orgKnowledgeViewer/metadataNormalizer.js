/*
 * metadataNormalizer.js
 *
 * Pure metadata transformation utilities for the
 * Salesforce Copilot Org Knowledge Viewer.
 *
 * Responsibilities:
 * - normalize organization metadata
 * - normalize the object inventory
 * - merge detailed object-context responses
 * - build the standardized Org Knowledge snapshot
 *
 * This file performs no Apex calls and contains no UI state.
 */

import {
    ANALYSIS_SOURCE,
    DEFAULT_SCAN_MODE,
    normalizeScanMode
} from './viewerConstants';

export function normalizeOrgSummary(
    rawOrgSummary = {}
) {
    const source =
        rawOrgSummary || {};

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

        accessibleObjects:
            toNumber(
                source.accessibleObjects
            ),

        queryableObjects:
            toNumber(
                source.queryableObjects
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
        .map(normalizeInventoryObject)
        .filter(
            (objectItem) =>
                Boolean(objectItem.apiName)
        );
}

export function normalizeInventoryObject(
    rawObject = {}
) {
    const source =
        rawObject || {};

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
            source.accessible !== false,

        queryable:
            source.queryable !== false,

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

        fields:
            normalizeArray(
                source.fields
            ),

        relationships:
            normalizeArray(
                source.relationships
            ),

        recordTypes:
            normalizeArray(
                source.recordTypes
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

    const apiName =
        firstValue(
            context.apiName,
            context.name,
            inventoryObject.apiName,
            inventoryObject.name
        );

    const label =
        firstValue(
            context.label,
            inventoryObject.label,
            apiName
        );

    return {
        ...inventoryObject,
        ...context,

        apiName,

        name:
            firstValue(
                context.name,
                context.apiName,
                inventoryObject.name,
                inventoryObject.apiName,
                apiName
            ),

        label,

        labelPlural:
            firstValue(
                context.labelPlural,
                inventoryObject.labelPlural,
                label
            ),

        keyPrefix:
            firstValue(
                context.keyPrefix,
                inventoryObject.keyPrefix
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
                inventoryObject.metadataLoadError
            ),

        metadata: {
            ...normalizeObject(
                inventoryObject.metadata
            ),
            ...context
        }
    };
}

export function buildOrgSnapshot({
    organization = {},
    inventory = [],
    detailedObjects = [],
    scanMode = DEFAULT_SCAN_MODE,
    retrievedAt = '',
    source = ANALYSIS_SOURCE,
    additionalMetadata = {}
} = {}) {
    const normalizedInventory =
        normalizeArray(
            inventory
        );

    const normalizedDetailedObjects =
        normalizeArray(
            detailedObjects
        );

    const normalizedScanMode =
        normalizeScanMode(
            scanMode
        );

    const inventoryCounts =
        calculateInventoryCounts(
            normalizedInventory
        );

    const fieldCount =
        normalizedDetailedObjects.reduce(
            (total, objectItem) =>
                total +
                normalizeArray(
                    objectItem.fields
                ).length,
            0
        );

    const relationshipCount =
        normalizedDetailedObjects.reduce(
            (total, objectItem) =>
                total +
                normalizeArray(
                    objectItem.relationships
                ).length,
            0
        );

    const recordTypeCount =
        normalizedDetailedObjects.reduce(
            (total, objectItem) =>
                total +
                normalizeArray(
                    objectItem.recordTypes
                ).length,
            0
        );

    const failedObjectLoads =
        normalizedDetailedObjects.filter(
            (objectItem) =>
                Boolean(
                    objectItem.metadataLoadError
                )
        );

    return {
        organization: {
            ...normalizeOrgSummary(
                organization
            ),

            totalObjects:
                inventoryCounts.totalObjects,

            standardObjects:
                inventoryCounts.standardObjects,

            customObjects:
                inventoryCounts.customObjects,

            accessibleObjects:
                inventoryCounts.accessibleObjects,

            queryableObjects:
                inventoryCounts.queryableObjects
        },

        objects:
            normalizedDetailedObjects,

        flows:
            normalizeArray(
                additionalMetadata.flows
            ),

        validationRules:
            normalizeArray(
                additionalMetadata.validationRules
            ),

        duplicateRules:
            normalizeArray(
                additionalMetadata.duplicateRules
            ),

        matchingRules:
            normalizeArray(
                additionalMetadata.matchingRules
            ),

        permissionSets:
            normalizeArray(
                additionalMetadata.permissionSets
            ),

        profiles:
            normalizeArray(
                additionalMetadata.profiles
            ),

        apexClasses:
            normalizeArray(
                additionalMetadata.apexClasses
            ),

        apexTriggers:
            normalizeArray(
                additionalMetadata.apexTriggers
            ),

        reports:
            normalizeArray(
                additionalMetadata.reports
            ),

        dashboards:
            normalizeArray(
                additionalMetadata.dashboards
            ),

        deployments:
            normalizeArray(
                additionalMetadata.deployments
            ),

        metadataItems:
            normalizeArray(
                additionalMetadata.metadataItems
            ),

        recentChanges:
            normalizeArray(
                additionalMetadata.recentChanges
            ),

        failedDeployments:
            normalizeArray(
                additionalMetadata.failedDeployments
            ),

        scanCoverage: {
            mode:
                normalizedScanMode,

            inventoryCount:
                inventoryCounts.totalObjects,

            detailedObjectCount:
                normalizedDetailedObjects.length,

            fieldCount,

            relationshipCount,

            recordTypeCount,

            failedObjectCount:
                failedObjectLoads.length,

            failedObjects:
                failedObjectLoads.map(
                    (objectItem) => ({
                        apiName:
                            objectItem.apiName,

                        error:
                            objectItem.metadataLoadError
                    })
                )
        },

        retrievedAt:
            firstValue(
                retrievedAt,
                new Date().toISOString()
            ),

        source:
            firstValue(
                source,
                ANALYSIS_SOURCE
            )
    };
}

export function calculateInventoryCounts(
    inventory = []
) {
    const normalizedInventory =
        normalizeArray(
            inventory
        );

    const customObjects =
        normalizedInventory.filter(
            (objectItem) =>
                Boolean(
                    objectItem.custom
                )
        );

    const accessibleObjects =
        normalizedInventory.filter(
            (objectItem) =>
                objectItem.accessible !==
                false
        );

    const queryableObjects =
        normalizedInventory.filter(
            (objectItem) =>
                objectItem.queryable !==
                false
        );

    return {
        totalObjects:
            normalizedInventory.length,

        standardObjects:
            normalizedInventory.length -
            customObjects.length,

        customObjects:
            customObjects.length,

        accessibleObjects:
            accessibleObjects.length,

        queryableObjects:
            queryableObjects.length
    };
}

export function extractObjectInventory(
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

export function extractObjectContext(
    rawContext = {}
) {
    if (
        !rawContext ||
        typeof rawContext !== 'object'
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

export function normalizeArray(
    value
) {
    return Array.isArray(value)
        ? [...value]
        : [];
}

export function normalizeObject(
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

export function firstValue(
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

export function firstBoolean(
    ...values
) {
    const value =
        values.find(
            (candidate) =>
                typeof candidate ===
                'boolean'
        );

    if (
        typeof value ===
        'boolean'
    ) {
        return value;
    }

    return false;
}

export function toBoolean(
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
            value.trim().toLowerCase() ===
            'true'
        );
    }

    return Boolean(value);
}

export function toNumber(
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

const metadataNormalizer = {
    normalizeOrgSummary,
    normalizeObjectInventory,
    normalizeInventoryObject,
    mergeObjectContext,
    buildOrgSnapshot,
    calculateInventoryCounts,
    extractObjectInventory,
    extractObjectContext,
    normalizeArray,
    normalizeObject,
    firstValue,
    firstBoolean,
    toBoolean,
    toNumber
};

export default metadataNormalizer;