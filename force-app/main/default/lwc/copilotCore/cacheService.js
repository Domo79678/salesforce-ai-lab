/*
 * cacheService.js
 *
 * Shared in-memory cache for Salesforce Copilot.
 *
 * Responsibilities:
 * - store reusable platform data
 * - apply expiration times
 * - prevent duplicate metadata requests
 * - support manual invalidation
 * - expose cache diagnostics
 */

import {
    CACHE_DEFAULTS,
    CACHE_KEYS
} from './copilotConstants';

const cacheEntries = new Map();

export function setCache(
    key,
    value,
    options = {}
) {
    validateCacheKey(key);

    const ttlMilliseconds =
        normalizeTtl(
            options.ttlMilliseconds,
            CACHE_DEFAULTS
                .SNAPSHOT_TTL_MILLISECONDS
        );

    enforceMaximumEntries();

    const createdAt = Date.now();

    const entry = {
        key,
        value,
        createdAt,

        expiresAt:
            ttlMilliseconds > 0
                ? createdAt +
                  ttlMilliseconds
                : null,

        ttlMilliseconds,

        metadata: {
            source:
                options.source ||
                'Salesforce Copilot',

            category:
                options.category ||
                '',

            version:
                options.version ||
                ''
        }
    };

    cacheEntries.set(
        key,
        entry
    );

    return cloneValue(value);
}

export function getCache(
    key,
    options = {}
) {
    validateCacheKey(key);

    const entry =
        cacheEntries.get(key);

    if (!entry) {
        return null;
    }

    if (
        !options.allowExpired &&
        isEntryExpired(entry)
    ) {
        cacheEntries.delete(key);

        return null;
    }

    return cloneValue(
        entry.value
    );
}

export function getCacheEntry(
    key,
    options = {}
) {
    validateCacheKey(key);

    const entry =
        cacheEntries.get(key);

    if (!entry) {
        return null;
    }

    const expired =
        isEntryExpired(entry);

    if (
        expired &&
        !options.allowExpired
    ) {
        cacheEntries.delete(key);

        return null;
    }

    return {
        ...entry,

        value:
            cloneValue(
                entry.value
            ),

        expired,

        ageMilliseconds:
            Date.now() -
            entry.createdAt,

        remainingMilliseconds:
            entry.expiresAt
                ? Math.max(
                      0,
                      entry.expiresAt -
                          Date.now()
                  )
                : null
    };
}

export function hasCache(
    key,
    options = {}
) {
    return Boolean(
        getCacheEntry(
            key,
            options
        )
    );
}

export function removeCache(
    key
) {
    validateCacheKey(key);

    return cacheEntries.delete(
        key
    );
}

export function clearCache() {
    const clearedCount =
        cacheEntries.size;

    cacheEntries.clear();

    return clearedCount;
}

export function clearExpiredCache() {
    let clearedCount = 0;

    for (
        const [
            key,
            entry
        ] of cacheEntries.entries()
    ) {
        if (
            isEntryExpired(entry)
        ) {
            cacheEntries.delete(
                key
            );

            clearedCount += 1;
        }
    }

    return clearedCount;
}

export function getOrCreateCache(
    key,
    factory,
    options = {}
) {
    const cachedValue =
        getCache(key);

    if (
        cachedValue !== null
    ) {
        return Promise.resolve(
            cachedValue
        );
    }

    if (
        typeof factory !==
        'function'
    ) {
        return Promise.reject(
            new Error(
                'A cache factory function is required.'
            )
        );
    }

    return Promise.resolve(
        factory()
    ).then(
        (value) => {
            setCache(
                key,
                value,
                options
            );

            return cloneValue(
                value
            );
        }
    );
}

export function touchCache(
    key,
    ttlMilliseconds
) {
    const entry =
        cacheEntries.get(key);

    if (!entry) {
        return false;
    }

    const normalizedTtl =
        normalizeTtl(
            ttlMilliseconds,
            entry.ttlMilliseconds
        );

    const now = Date.now();

    entry.createdAt =
        now;

    entry.ttlMilliseconds =
        normalizedTtl;

    entry.expiresAt =
        normalizedTtl > 0
            ? now +
              normalizedTtl
            : null;

    cacheEntries.set(
        key,
        entry
    );

    return true;
}

export function getCacheDiagnostics() {
    clearExpiredCache();

    const entries =
        Array.from(
            cacheEntries.values()
        ).map(
            (entry) => ({
                key:
                    entry.key,

                createdAt:
                    new Date(
                        entry.createdAt
                    ).toISOString(),

                expiresAt:
                    entry.expiresAt
                        ? new Date(
                              entry.expiresAt
                          ).toISOString()
                        : null,

                ttlMilliseconds:
                    entry.ttlMilliseconds,

                source:
                    entry.metadata
                        ?.source ||
                    '',

                category:
                    entry.metadata
                        ?.category ||
                    '',

                version:
                    entry.metadata
                        ?.version ||
                    '',

                expired:
                    isEntryExpired(
                        entry
                    )
            })
        );

    return {
        size:
            entries.length,

        maximumEntries:
            CACHE_DEFAULTS
                .MAXIMUM_ENTRIES,

        entries
    };
}

export function getMetadataSnapshotCache() {
    return getCache(
        CACHE_KEYS
            .METADATA_SNAPSHOT
    );
}

export function setMetadataSnapshotCache(
    snapshot,
    options = {}
) {
    return setCache(
        CACHE_KEYS
            .METADATA_SNAPSHOT,
        snapshot,
        {
            ttlMilliseconds:
                options
                    .ttlMilliseconds ||
                CACHE_DEFAULTS
                    .SNAPSHOT_TTL_MILLISECONDS,

            source:
                options.source ||
                'Metadata Snapshot Service',

            category:
                'metadata',

            version:
                options.version ||
                ''
        }
    );
}

function isEntryExpired(
    entry
) {
    return Boolean(
        entry?.expiresAt &&
        Date.now() >=
            entry.expiresAt
    );
}

function enforceMaximumEntries() {
    clearExpiredCache();

    const maximumEntries =
        Number(
            CACHE_DEFAULTS
                .MAXIMUM_ENTRIES
        ) || 25;

    if (
        cacheEntries.size <
        maximumEntries
    ) {
        return;
    }

    const oldestEntry =
        Array.from(
            cacheEntries.values()
        ).sort(
            (
                first,
                second
            ) =>
                first.createdAt -
                second.createdAt
        )[0];

    if (oldestEntry) {
        cacheEntries.delete(
            oldestEntry.key
        );
    }
}

function normalizeTtl(
    value,
    fallback
) {
    const numericValue =
        Number(value);

    if (
        Number.isFinite(
            numericValue
        ) &&
        numericValue >= 0
    ) {
        return numericValue;
    }

    return Number(
        fallback
    ) || 0;
}

function validateCacheKey(
    key
) {
    if (
        typeof key !==
            'string' ||
        !key.trim()
    ) {
        throw new Error(
            'A non-empty cache key is required.'
        );
    }
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