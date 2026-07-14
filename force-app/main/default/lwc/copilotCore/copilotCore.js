/*
 * copilotCore.js
 *
 * Public API for Salesforce Copilot shared infrastructure.
 */

export {
    COPILOT_PLATFORM_VERSION,
    COPILOT_CORE_VERSION,
    WORKSPACE_IDS,
    WORKSPACE_LABELS,
    MODULE_STATUSES,
    DATA_SOURCE_TYPES,
    DATA_SOURCE_LABELS,
    METADATA_CATEGORIES,
    HEALTH_CATEGORIES,
    SEVERITY_LEVELS,
    RISK_LEVELS,
    READINESS_STATUSES,
    SCORE_THRESHOLDS,
    CACHE_KEYS,
    CACHE_DEFAULTS,
    REFRESH_EVENTS,
    SNAPSHOT_STATUSES,
    DEFAULT_BUSINESS_OBJECTS,
    DEFAULT_SNAPSHOT_OPTIONS,
    PLATFORM_MESSAGES,
    getScoreStatus,
    getWorkspaceLabel,
    isLiveDataSource
} from './copilotConstants';

export {
    DESIGN_SYSTEM_VERSION,
    COLORS,
    SPACING,
    BORDER_RADIUS,
    SHADOWS,
    TYPOGRAPHY,
    ICON_SIZES,
    CARD,
    HEADER,
    BADGES,
    STATUS_COLORS,
    PROGRESS,
    LAYOUT,
    TABLE,
    ANIMATION,
    EMPTY_STATE,
    LOADING_MESSAGES,
    statusColor,
    badgeVariant
} from './designTokens';

export {
    setCache,
    getCache,
    getCacheEntry,
    hasCache,
    removeCache,
    clearCache,
    clearExpiredCache,
    getOrCreateCache,
    touchCache,
    getCacheDiagnostics,
    getMetadataSnapshotCache,
    setMetadataSnapshotCache
} from './cacheService';

export {
    subscribe,
    unsubscribe,
    publish,
    requestRefresh,
    getRefreshState,
    isRefreshInProgress,
    resetRefreshState,
    subscribeToSnapshotUpdates,
    subscribeToRefreshStarted,
    subscribeToRefreshCompleted,
    subscribeToRefreshFailed,
    clearRefreshListeners,
    getRefreshDiagnostics
} from './refreshService';

export {
    METADATA_SNAPSHOT_SERVICE_VERSION,
    getMetadataSnapshot,
    refreshMetadataSnapshot,
    getCachedMetadataSnapshot,
    getMetadataSnapshotCacheEntry,
    clearMetadataSnapshot,
    hasMetadataSnapshot,
    getSnapshotCoverage,
    getSnapshotCategory,
    getSnapshotStatus,
    normalizeMetadataSnapshot,
    getMetadataSnapshotDiagnostics,
    buildSnapshotCounts
} from './metadataSnapshotService';