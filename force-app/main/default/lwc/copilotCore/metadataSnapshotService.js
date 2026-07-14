/*
 * metadataSnapshotService.js
 *
 * Central metadata snapshot orchestrator for
 * the Salesforce Copilot Platform.
 *
 * Responsibilities:
 * - build one shared live metadata snapshot
 * - reuse cached snapshots
 * - force refresh when requested
 * - normalize snapshot structure
 * - publish refresh lifecycle events
 * - provide one source of truth to every workspace
 */

import {
    buildLiveOrgSnapshot
} from 'c/orgContextService';

import {
    CACHE_DEFAULTS,
    CACHE_KEYS,
    DATA_SOURCE_LABELS,
    DATA_SOURCE_TYPES,
    DEFAULT_SNAPSHOT_OPTIONS,
    METADATA_CATEGORIES,
    SNAPSHOT_STATUSES
} from './copilotConstants';

import {
    getCache,
    setCache,
    removeCache,
    getCacheEntry
} from './cacheService';

import {
    requestRefresh,
    publish
} from './refreshService';

import {
    REFRESH_EVENTS
} from './copilotConstants';

export const METADATA_SNAPSHOT_SERVICE_VERSION =
    '1.0';

let activeSnapshotPromise =
    null;

export async function getMetadataSnapshot(
    options = {}
) {
    const normalizedOptions =
        normalizeSnapshotOptions(
            options
        );

    if (
        !normalizedOptions.forceRefresh
    ) {
        const cachedSnapshot =
            getCachedMetadataSnapshot();

        if (cachedSnapshot) {
            return markSnapshotAsCached(
                cachedSnapshot
            );
        }
    }

    return refreshMetadataSnapshot(
        normalizedOptions
    );
}

export async function refreshMetadataSnapshot(
    options = {}
) {
    const normalizedOptions =
        normalizeSnapshotOptions({
            ...options,
            forceRefresh:
                true
        });

    if (
        activeSnapshotPromise
    ) {
        return activeSnapshotPromise;
    }

    activeSnapshotPromise =
        requestRefresh(
            async () => {
                const rawSnapshot =
                    await buildLiveOrgSnapshot(
                        normalizedOptions
                    );

                const snapshot =
                    normalizeMetadataSnapshot(
                        rawSnapshot,
                        normalizedOptions
                    );

                setCache(
                    CACHE_KEYS
                        .METADATA_SNAPSHOT,
                    snapshot,
                    {
                        ttlMilliseconds:
                            normalizedOptions
                                .ttlMilliseconds,

                        source:
                            'Metadata Snapshot Service',

                        category:
                            'metadata',

                        version:
                            METADATA_SNAPSHOT_SERVICE_VERSION
                    }
                );

                setCache(
                    CACHE_KEYS
                        .LAST_REFRESH,
                    snapshot.retrievedAt,
                    {
                        ttlMilliseconds:
                            0,

                        source:
                            'Metadata Snapshot Service',

                        category:
                            'refresh'
                    }
                );

                setCache(
                    CACHE_KEYS
                        .COVERAGE,
                    snapshot.coverage,
                    {
                        ttlMilliseconds:
                            normalizedOptions
                                .ttlMilliseconds,

                        source:
                            'Metadata Snapshot Service',

                        category:
                            'coverage'
                    }
                );

                return snapshot;
            },
            {
                source:
                    'Metadata Snapshot Service',

                forceRefresh:
                    true
            }
        ).finally(
            () => {
                activeSnapshotPromise =
                    null;
            }
        );

    return activeSnapshotPromise;
}

export function getCachedMetadataSnapshot() {
    return getCache(
        CACHE_KEYS
            .METADATA_SNAPSHOT
    );
}

export function getMetadataSnapshotCacheEntry() {
    return getCacheEntry(
        CACHE_KEYS
            .METADATA_SNAPSHOT
    );
}

export function clearMetadataSnapshot() {
    const snapshotRemoved =
        removeCache(
            CACHE_KEYS
                .METADATA_SNAPSHOT
        );

    removeCache(
        CACHE_KEYS
            .LAST_REFRESH
    );

    removeCache(
        CACHE_KEYS
            .COVERAGE
    );

    publish(
        REFRESH_EVENTS
            .CACHE_CLEARED,
        {
            service:
                'Metadata Snapshot Service',

            snapshotRemoved
        }
    );

    return snapshotRemoved;
}

export function hasMetadataSnapshot() {
    return Boolean(
        getCachedMetadataSnapshot()
    );
}

export function getSnapshotCoverage() {
    const snapshot =
        getCachedMetadataSnapshot();

    return (
        snapshot?.coverage ||
        getCache(
            CACHE_KEYS.COVERAGE
        ) ||
        createEmptyCoverage()
    );
}

export function getSnapshotCategory(
    category
) {
    const snapshot =
        getCachedMetadataSnapshot();

    if (!snapshot) {
        return null;
    }

    const categoryProperty =
        getCategoryProperty(
            category
        );

    if (!categoryProperty) {
        return null;
    }

    return cloneValue(
        snapshot[
            categoryProperty
        ]
    );
}

export function getSnapshotStatus() {
    const snapshot =
        getCachedMetadataSnapshot();

    if (!snapshot) {
        return {
            status:
                SNAPSHOT_STATUSES.IDLE,

            sourceType:
                DATA_SOURCE_TYPES
                    .UNAVAILABLE,

            sourceLabel:
                DATA_SOURCE_LABELS[
                    DATA_SOURCE_TYPES
                        .UNAVAILABLE
                ],

            retrievedAt:
                null
        };
    }

    return {
        status:
            snapshot.status,

        sourceType:
            snapshot.sourceType,

        sourceLabel:
            snapshot.sourceLabel,

        retrievedAt:
            snapshot.retrievedAt,

        coverageStatus:
            snapshot.coverageStatus
    };
}

export function normalizeMetadataSnapshot(
    rawSnapshot = {},
    options = {}
) {
    const coverageStatus =
        rawSnapshot
            .coverageStatus ||
        rawSnapshot
            ?.coverage
            ?.status ||
        'unavailable';

    const sourceType =
        coverageStatus ===
            'complete'
            ? DATA_SOURCE_TYPES.LIVE
            : coverageStatus ===
                'partial'
              ? DATA_SOURCE_TYPES
                    .LIVE_PARTIAL
              : DATA_SOURCE_TYPES
                    .UNAVAILABLE;

    const status =
        sourceType ===
            DATA_SOURCE_TYPES.LIVE
            ? SNAPSHOT_STATUSES.READY
            : sourceType ===
                DATA_SOURCE_TYPES
                    .LIVE_PARTIAL
              ? SNAPSHOT_STATUSES
                    .PARTIAL
              : SNAPSHOT_STATUSES
                    .ERROR;

    return {
        success:
            Boolean(
                rawSnapshot.success
            ),

        status,

        source:
            rawSnapshot.source ||
            'Org Context Service',

        sourceType,

        sourceLabel:
            rawSnapshot
                .coverageLabel ||
            DATA_SOURCE_LABELS[
                sourceType
            ],

        serviceVersion:
            METADATA_SNAPSHOT_SERVICE_VERSION,

        providerVersion:
            rawSnapshot
                .serviceVersion ||
            '',

        organization:
            normalizeObject(
                rawSnapshot
                    .organization
            ),

        objects:
            normalizeArray(
                rawSnapshot.objects
            ),

        objectInventory:
            normalizeArray(
                rawSnapshot
                    .objectInventory
            ),

        flows:
            normalizeArray(
                rawSnapshot.flows
            ),

        validationRules:
            normalizeArray(
                rawSnapshot
                    .validationRules
            ),

        duplicateRules:
            normalizeArray(
                rawSnapshot
                    .duplicateRules
            ),

        matchingRules:
            normalizeArray(
                rawSnapshot
                    .matchingRules
            ),

        permissionSets:
            normalizeArray(
                rawSnapshot
                    .permissionSets
            ),

        profiles:
            normalizeArray(
                rawSnapshot.profiles
            ),

        queues:
            normalizeArray(
                rawSnapshot.queues
            ),

        roles:
            normalizeArray(
                rawSnapshot.roles
            ),

        sharingRules:
            normalizeArray(
                rawSnapshot
                    .sharingRules
            ),

        approvalProcesses:
            normalizeArray(
                rawSnapshot
                    .approvalProcesses
            ),

        apexClasses:
            normalizeArray(
                rawSnapshot
                    .apexClasses
            ),

        apexTriggers:
            normalizeArray(
                rawSnapshot
                    .apexTriggers
            ),

        apexCoverage:
            normalizeArray(
                rawSnapshot
                    .apexCoverage
            ),

        reports:
            normalizeArray(
                rawSnapshot.reports
            ),

        dashboards:
            normalizeArray(
                rawSnapshot
                    .dashboards
            ),

        deployments:
            normalizeArray(
                rawSnapshot
                    .deployments
            ),

        metadataItems:
            normalizeArray(
                rawSnapshot
                    .metadataItems
            ),

        recentChanges:
            normalizeArray(
                rawSnapshot
                    .recentChanges
            ),

        failedDeployments:
            normalizeArray(
                rawSnapshot
                    .failedDeployments
            ),

        setupMetadataCoverage:
            normalizeObject(
                rawSnapshot
                    .setupMetadataCoverage
            ),

        coverage:
            normalizeCoverage(
                rawSnapshot.coverage
            ),

        warnings:
            normalizeArray(
                rawSnapshot.warnings
            ),

        errors:
            normalizeArray(
                rawSnapshot.errors
            ),

        requestOptions: {
            objectApiNames:
                normalizeArray(
                    options
                        .objectApiNames
                ),

            inventoryLimit:
                Number(
                    options
                        .inventoryLimit ||
                    0
                ),

            includeInventory:
                Boolean(
                    options
                        .includeInventory
                ),

            includeSetupMetadata:
                Boolean(
                    options
                        .includeSetupMetadata
                )
        },

        retrievedAt:
            rawSnapshot
                .retrievedAt ||
            new Date()
                .toISOString(),

        cachedAt:
            new Date()
                .toISOString()
    };
}

export function getMetadataSnapshotDiagnostics() {
    const cacheEntry =
        getMetadataSnapshotCacheEntry();

    const snapshot =
        cacheEntry?.value ||
        null;

    return {
        serviceVersion:
            METADATA_SNAPSHOT_SERVICE_VERSION,

        cached:
            Boolean(
                snapshot
            ),

        cache:
            cacheEntry,

        status:
            getSnapshotStatus(),

        coverage:
            snapshot
                ?.coverage ||
            createEmptyCoverage(),

        counts:
            snapshot
                ? buildSnapshotCounts(
                      snapshot
                  )
                : buildSnapshotCounts(
                      {}
                  )
    };
}

export function buildSnapshotCounts(
    snapshot = {}
) {
    return {
        objects:
            normalizeArray(
                snapshot.objects
            ).length,

        inventoryObjects:
            normalizeArray(
                snapshot
                    .objectInventory
            ).length,

        fields:
            normalizeArray(
                snapshot.objects
            ).reduce(
                (
                    total,
                    objectItem
                ) =>
                    total +
                    normalizeArray(
                        objectItem.fields
                    ).length,
                0
            ),

        flows:
            normalizeArray(
                snapshot.flows
            ).length,

        validationRules:
            normalizeArray(
                snapshot
                    .validationRules
            ).length,

        duplicateRules:
            normalizeArray(
                snapshot
                    .duplicateRules
            ).length,

        matchingRules:
            normalizeArray(
                snapshot
                    .matchingRules
            ).length,

        permissionSets:
            normalizeArray(
                snapshot
                    .permissionSets
            ).length,

        profiles:
            normalizeArray(
                snapshot.profiles
            ).length,

        apexClasses:
            normalizeArray(
                snapshot
                    .apexClasses
            ).length,

        apexTriggers:
            normalizeArray(
                snapshot
                    .apexTriggers
            ).length,

        reports:
            normalizeArray(
                snapshot.reports
            ).length,

        dashboards:
            normalizeArray(
                snapshot.dashboards
            ).length
    };
}

function normalizeSnapshotOptions(
    options = {}
) {
    return {
        ...DEFAULT_SNAPSHOT_OPTIONS,
        ...options,

        objectApiNames:
            normalizeArray(
                options.objectApiNames ||
                DEFAULT_SNAPSHOT_OPTIONS
                    .objectApiNames
            ),

        inventoryLimit:
            normalizePositiveNumber(
                options.inventoryLimit,
                DEFAULT_SNAPSHOT_OPTIONS
                    .inventoryLimit
            ),

        includeInventory:
            options.includeInventory !==
            false,

        includeSetupMetadata:
            options
                .includeSetupMetadata !==
            false,

        forceRefresh:
            Boolean(
                options.forceRefresh
            ),

        ttlMilliseconds:
            normalizePositiveNumber(
                options.ttlMilliseconds,
                CACHE_DEFAULTS
                    .SNAPSHOT_TTL_MILLISECONDS
            )
    };
}

function markSnapshotAsCached(
    snapshot
) {
    return {
        ...cloneValue(
            snapshot
        ),

        sourceType:
            DATA_SOURCE_TYPES.CACHE,

        sourceLabel:
            DATA_SOURCE_LABELS[
                DATA_SOURCE_TYPES.CACHE
            ],

        servedFromCache:
            true,

        servedAt:
            new Date()
                .toISOString()
    };
}

function normalizeCoverage(
    coverage = {}
) {
    return {
        status:
            coverage.status ||
            'unavailable',

        label:
            coverage.label ||
            '',

        liveCategories:
            normalizeArray(
                coverage
                    .liveCategories
            ),

        unavailableCategories:
            normalizeArray(
                coverage
                    .unavailableCategories
            ),

        selectedObjectCount:
            Number(
                coverage
                    .selectedObjectCount ||
                0
            ),

        inventoryObjectCount:
            Number(
                coverage
                    .inventoryObjectCount ||
                0
            ),

        errorCount:
            Number(
                coverage.errorCount ||
                0
            ),

        warningCount:
            Number(
                coverage.warningCount ||
                0
            )
    };
}

function createEmptyCoverage() {
    return {
        status:
            'unavailable',

        label:
            DATA_SOURCE_LABELS[
                DATA_SOURCE_TYPES
                    .UNAVAILABLE
            ],

        liveCategories:
            [],

        unavailableCategories:
            Object.values(
                METADATA_CATEGORIES
            ),

        selectedObjectCount:
            0,

        inventoryObjectCount:
            0,

        errorCount:
            0,

        warningCount:
            0
    };
}

function getCategoryProperty(
    category
) {
    const categoryMap = {
        [METADATA_CATEGORIES
            .ORGANIZATION]:
            'organization',

        [METADATA_CATEGORIES
            .OBJECTS]:
            'objects',

        [METADATA_CATEGORIES
            .FIELDS]:
            'objects',

        [METADATA_CATEGORIES
            .FLOWS]:
            'flows',

        [METADATA_CATEGORIES
            .VALIDATION_RULES]:
            'validationRules',

        [METADATA_CATEGORIES
            .DUPLICATE_RULES]:
            'duplicateRules',

        [METADATA_CATEGORIES
            .MATCHING_RULES]:
            'matchingRules',

        [METADATA_CATEGORIES
            .PERMISSION_SETS]:
            'permissionSets',

        [METADATA_CATEGORIES
            .PROFILES]:
            'profiles',

        [METADATA_CATEGORIES
            .APEX_CLASSES]:
            'apexClasses',

        [METADATA_CATEGORIES
            .APEX_TRIGGERS]:
            'apexTriggers',

        [METADATA_CATEGORIES
            .APEX_COVERAGE]:
            'apexCoverage',

        [METADATA_CATEGORIES
            .REPORTS]:
            'reports',

        [METADATA_CATEGORIES
            .DASHBOARDS]:
            'dashboards'
    };

    return (
        categoryMap[
            category
        ] ||
        ''
    );
}

function normalizeArray(
    value
) {
    return Array.isArray(
        value
    )
        ? cloneValue(value)
        : [];
}

function normalizeObject(
    value
) {
    if (
        !value ||
        typeof value !==
            'object' ||
        Array.isArray(value)
    ) {
        return {};
    }

    return cloneValue(value);
}

function normalizePositiveNumber(
    value,
    fallback
) {
    const numericValue =
        Number(value);

    if (
        Number.isFinite(
            numericValue
        ) &&
        numericValue > 0
    ) {
        return numericValue;
    }

    return Number(
        fallback
    ) || 0;
}

function cloneValue(
    value
) {
    if (
        value === null ||
        value === undefined
    ) {
        return value;
    }

    try {
        return JSON.parse(
            JSON.stringify(
                value
            )
        );
    } catch (error) {
        return value;
    }
}