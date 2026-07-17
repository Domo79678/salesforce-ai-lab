/*
 * collectorConstants.js
 *
 * Shared configuration for the Salesforce Metadata Collector.
 */

export const CRM_PROVIDERS = Object.freeze({
    SALESFORCE: 'Salesforce',
    HUBSPOT: 'HubSpot',
    DYNAMICS: 'Microsoft Dynamics',
    GENERIC: 'Generic CRM'
});

export const DEFAULT_CRM_PROVIDER =
    CRM_PROVIDERS.SALESFORCE;

export const COLLECTION_STATUSES = Object.freeze({
    NOT_STARTED: 'Not Started',
    IN_PROGRESS: 'In Progress',
    COMPLETE: 'Complete',
    PARTIAL: 'Partial',
    FAILED: 'Failed',
    NOT_SUPPORTED: 'Not Supported'
});

export const COLLECTION_PRIORITIES = Object.freeze({
    CRITICAL: 1,
    HIGH: 2,
    MEDIUM: 3,
    LOW: 4
});

export const METADATA_TYPES = Object.freeze({
    ORGANIZATION: 'organization',
    OBJECTS: 'objects',
    FIELDS: 'fields',
    RELATIONSHIPS: 'relationships',
    RECORD_TYPES: 'recordTypes',
    FLOWS: 'flows',
    VALIDATION_RULES: 'validationRules',
    DUPLICATE_RULES: 'duplicateRules',
    MATCHING_RULES: 'matchingRules',
    PERMISSION_SETS: 'permissionSets',
    PERMISSION_SET_GROUPS: 'permissionSetGroups',
    PERMISSION_ASSIGNMENTS: 'permissionAssignments',
    PROFILES: 'profiles',
    APEX_CLASSES: 'apexClasses',
    APEX_TRIGGERS: 'apexTriggers',
    REPORTS: 'reports',
    DASHBOARDS: 'dashboards',
    SHARING_RULES: 'sharingRules',
    ROLES: 'roles',
    QUEUES: 'queues',
    NAMED_CREDENTIALS: 'namedCredentials',
    CUSTOM_METADATA: 'customMetadata',
    DEPLOYMENTS: 'deployments',
    FAILED_DEPLOYMENTS: 'failedDeployments',
    RECENT_CHANGES: 'recentChanges'
});

export const COLLECTION_PHASES = Object.freeze({
    FOUNDATION: 'Foundation',
    AUTOMATION: 'Automation',
    SECURITY: 'Security',
    CODE: 'Code',
    DATA_QUALITY: 'Data Quality',
    ANALYTICS: 'Analytics',
    ACCESS_MODEL: 'Access Model',
    HISTORY: 'History'
});

export const COLLECTION_MODES = Object.freeze({
    QUICK: 'Quick',
    STANDARD: 'Standard',
    EXTENDED: 'Extended',
    FULL: 'Full'
});

export const DEFAULT_COLLECTION_MODE =
    COLLECTION_MODES.STANDARD;

export const COLLECTION_BATCH_SIZES = Object.freeze({
    [COLLECTION_MODES.QUICK]: 8,
    [COLLECTION_MODES.STANDARD]: 12,
    [COLLECTION_MODES.EXTENDED]: 20,
    [COLLECTION_MODES.FULL]: 25
});

export const COLLECTION_TIMEOUTS_MS = Object.freeze({
    BASE_METADATA: 15000,
    DETAILED_METADATA: 30000,
    HISTORY_METADATA: 45000
});

export const COVERAGE_STATUSES = Object.freeze({
    MINIMAL: 'Minimal',
    PARTIAL: 'Partial',
    MODERATE: 'Moderate',
    STRONG: 'Strong',
    COMPLETE: 'Complete'
});

export const CORE_MODE_LABEL =
    'Core Mode';

export const AI_MODE_LABEL =
    'AI-Enhanced Mode';

export const COLLECTOR_SOURCE =
    'Salesforce Metadata Collector';

export const COLLECTOR_VERSION =
    '0.1.0';

export function normalizeCollectionMode(
    collectionMode = DEFAULT_COLLECTION_MODE
) {
    const supportedModes =
        Object.values(COLLECTION_MODES);

    return supportedModes.includes(collectionMode)
        ? collectionMode
        : DEFAULT_COLLECTION_MODE;
}

export function getCollectionBatchSize(
    collectionMode = DEFAULT_COLLECTION_MODE
) {
    const normalizedMode =
        normalizeCollectionMode(
            collectionMode
        );

    return (
        COLLECTION_BATCH_SIZES[
            normalizedMode
        ] ||
        COLLECTION_BATCH_SIZES[
            DEFAULT_COLLECTION_MODE
        ]
    );
}

export function normalizeMetadataType(
    metadataType = ''
) {
    const supportedTypes =
        Object.values(METADATA_TYPES);

    return supportedTypes.includes(metadataType)
        ? metadataType
        : '';
}

const collectorConstants = {
    crmProviders: CRM_PROVIDERS,
    defaultCrmProvider:
        DEFAULT_CRM_PROVIDER,
    collectionStatuses:
        COLLECTION_STATUSES,
    collectionPriorities:
        COLLECTION_PRIORITIES,
    metadataTypes:
        METADATA_TYPES,
    collectionPhases:
        COLLECTION_PHASES,
    collectionModes:
        COLLECTION_MODES,
    defaultCollectionMode:
        DEFAULT_COLLECTION_MODE,
    collectionBatchSizes:
        COLLECTION_BATCH_SIZES,
    collectionTimeouts:
        COLLECTION_TIMEOUTS_MS,
    coverageStatuses:
        COVERAGE_STATUSES,
    coreModeLabel:
        CORE_MODE_LABEL,
    aiModeLabel:
        AI_MODE_LABEL,
    collectorSource:
        COLLECTOR_SOURCE,
    collectorVersion:
        COLLECTOR_VERSION,
    normalizeCollectionMode,
    getCollectionBatchSize,
    normalizeMetadataType
};

export default collectorConstants;