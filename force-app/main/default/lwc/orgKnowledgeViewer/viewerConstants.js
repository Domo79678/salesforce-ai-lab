/*
 * viewerConstants.js
 *
 * Shared configuration for the Org Knowledge Viewer.
 */

export const SCAN_MODES = Object.freeze({
    QUICK: 'Quick',
    STANDARD: 'Standard',
    EXTENDED: 'Extended'
});

export const SCAN_LIMITS = Object.freeze({
    [SCAN_MODES.QUICK]: 12,
    [SCAN_MODES.STANDARD]: 25,
    [SCAN_MODES.EXTENDED]: 50
});

export const DEFAULT_SCAN_MODE =
    SCAN_MODES.STANDARD;

export const PRIORITY_OBJECTS = Object.freeze([
    'Account',
    'Contact',
    'Opportunity',
    'Lead',
    'Case',
    'Campaign',
    'Task',
    'User'
]);

export const DETAILED_OBJECT_BATCH_SIZE = 10;

export const MINIMUM_LOADING_TIME_MS = 700;

export const TREND_STORAGE_KEY =
    'salesforceCopilot.orgKnowledgeViewer.previousAnalysis';

export const ANALYSIS_SOURCE =
    'Org Context Service';

export const ANALYSIS_MODE =
    'full';

export function getScanLimit(
    scanMode = DEFAULT_SCAN_MODE
) {
    return (
        SCAN_LIMITS[scanMode] ||
        SCAN_LIMITS[DEFAULT_SCAN_MODE]
    );
}

export function normalizeScanMode(
    scanMode = DEFAULT_SCAN_MODE
) {
    const supportedModes =
        Object.values(SCAN_MODES);

    return supportedModes.includes(scanMode)
        ? scanMode
        : DEFAULT_SCAN_MODE;
}

const viewerConstants = {
    scanModes: SCAN_MODES,
    scanLimits: SCAN_LIMITS,
    defaultScanMode: DEFAULT_SCAN_MODE,
    priorityObjects: PRIORITY_OBJECTS,
    batchSize: DETAILED_OBJECT_BATCH_SIZE,
    minimumLoadingTime:
        MINIMUM_LOADING_TIME_MS,
    trendStorageKey:
        TREND_STORAGE_KEY,
    analysisSource:
        ANALYSIS_SOURCE,
    analysisMode:
        ANALYSIS_MODE,
    getScanLimit,
    normalizeScanMode
};

export default viewerConstants;