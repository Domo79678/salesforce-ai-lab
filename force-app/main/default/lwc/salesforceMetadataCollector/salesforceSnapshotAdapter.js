/*
 * salesforceSnapshotAdapter.js
 *
 * Converts Salesforce-specific collection results into a
 * normalized CRM snapshot that can be consumed by the
 * shared Org Knowledge Layer.
 *
 * Responsibilities:
 * - accept Salesforce metadata collection results
 * - normalize provider-specific field names
 * - preserve collection evidence and limitations
 * - calculate metadata coverage
 * - produce a CRM-neutral snapshot structure
 *
 * This adapter does not retrieve metadata directly.
 */

import {
    CRM_PROVIDERS,
    COLLECTOR_SOURCE,
    COLLECTOR_VERSION,
    DEFAULT_COLLECTION_MODE,
    normalizeCollectionMode
} from './collectorConstants';

import {
    calculateMetadataCoverage
} from './metadataCoverage';

export function adaptSalesforceSnapshot(
    collectionResult = {},
    options = {}
) {
    const collectedAt =
        firstValue(
            collectionResult.collectedAt,
            collectionResult.retrievedAt,
            new Date().toISOString()
        );

    const collectionMode =
        normalizeCollectionMode(
            options.collectionMode ||
            collectionResult.collectionMode ||
            DEFAULT_COLLECTION_MODE
        );

    const organization =
        normalizeOrganization(
            collectionResult.organization ||
            collectionResult.orgSummary ||
            {}
        );

    const objects =
        normalizeObjects(
            collectionResult.objects ||
            collectionResult.detailedObjects ||
            []
        );

    const snapshot = {
        provider:
            CRM_PROVIDERS.SALESFORCE,

        providerVersion:
            firstValue(
                collectionResult.providerVersion,
                organization.apiVersion
            ),

        collector: {
            name:
                COLLECTOR_SOURCE,

            version:
                COLLECTOR_VERSION,

            mode:
                collectionMode,

            source:
                firstValue(
                    collectionResult.source,
                    COLLECTOR_SOURCE
                ),

            collectedAt
        },

        organization,

        objects,

        flows:
            normalizeFlows(
                collectionResult.flows
            ),

        validationRules:
            normalizeValidationRules(
                collectionResult.validationRules
            ),

        duplicateRules:
            normalizeDuplicateRules(
                collectionResult.duplicateRules
            ),

        matchingRules:
            normalizeMatchingRules(
                collectionResult.matchingRules
            ),

        permissionSets:
            normalizePermissionSets(
                collectionResult.permissionSets
            ),

        permissionSetGroups:
            normalizePermissionSetGroups(
                collectionResult.permissionSetGroups
            ),

        permissionAssignments:
            normalizePermissionAssignments(
                collectionResult.permissionAssignments
            ),

        profiles:
            normalizeProfiles(
                collectionResult.profiles
            ),

        apexClasses:
            normalizeApexClasses(
                collectionResult.apexClasses
            ),

        apexTriggers:
            normalizeApexTriggers(
                collectionResult.apexTriggers
            ),

        reports:
            normalizeReports(
                collectionResult.reports
            ),

        dashboards:
            normalizeDashboards(
                collectionResult.dashboards
            ),

        sharingRules:
            normalizeSharingRules(
                collectionResult.sharingRules
            ),

        roles:
            normalizeRoles(
                collectionResult.roles
            ),

        queues:
            normalizeQueues(
                collectionResult.queues
            ),

        namedCredentials:
            normalizeNamedCredentials(
                collectionResult.namedCredentials
            ),

        customMetadata:
            normalizeCustomMetadata(
                collectionResult.customMetadata
            ),

        deployments:
            normalizeDeployments(
                collectionResult.deployments
            ),

        failedDeployments:
            normalizeDeployments(
                collectionResult.failedDeployments
            ),

        recentChanges:
            normalizeRecentChanges(
                collectionResult.recentChanges
            ),

        metadataItems:
            normalizeArray(
                collectionResult.metadataItems
            ),

        blockingFindings:
            normalizeArray(
                collectionResult.blockingFindings
            ),

        deploymentBlockers:
            normalizeArray(
                collectionResult.deploymentBlockers
            ),

        collectionEvidence:
            normalizeArray(
                collectionResult.collectionEvidence
            ),

        warnings:
            normalizeArray(
                collectionResult.warnings
            ),

        errors:
            normalizeArray(
                collectionResult.errors
            ),

        retrievedAt:
            collectedAt,

        source:
            firstValue(
                collectionResult.source,
                COLLECTOR_SOURCE
            )
    };

    const coverage =
        calculateMetadataCoverage(
            snapshot,
            {
                flowsCollected:
                    Boolean(
                        collectionResult
                            .collectionFlags
                            ?.flowsCollected
                    ),

                validationRulesCollected:
                    Boolean(
                        collectionResult
                            .collectionFlags
                            ?.validationRulesCollected
                    ),

                duplicateRulesCollected:
                    Boolean(
                        collectionResult
                            .collectionFlags
                            ?.duplicateRulesCollected
                    ),

                permissionsCollected:
                    Boolean(
                        collectionResult
                            .collectionFlags
                            ?.permissionsCollected
                    ),

                apexCollected:
                    Boolean(
                        collectionResult
                            .collectionFlags
                            ?.apexCollected
                    ),

                analyticsCollected:
                    Boolean(
                        collectionResult
                            .collectionFlags
                            ?.analyticsCollected
                    ),

                sharingCollected:
                    Boolean(
                        collectionResult
                            .collectionFlags
                            ?.sharingCollected
                    ),

                historyCollected:
                    Boolean(
                        collectionResult
                            .collectionFlags
                            ?.historyCollected
                    )
            }
        );

    return {
        ...snapshot,

        metadataCoverage:
            coverage,

        capabilities:
            buildSnapshotCapabilities(
                snapshot,
                coverage
            ),

        limitations:
            buildSnapshotLimitations(
                snapshot,
                coverage
            ),

        generatedAt:
            new Date().toISOString()
    };
}

export function normalizeOrganization(
    organization = {}
) {
    const source =
        normalizeObject(
            organization
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

        edition:
            firstValue(
                source.edition,
                source.organizationEdition
            ),

        metadata: {
            ...source
        }
    };
}

export function normalizeObjects(
    objects = []
) {
    return normalizeArray(
        objects
    )
        .map(
            normalizeObjectItem
        )
        .filter(
            (objectItem) =>
                Boolean(
                    objectItem.apiName
                )
        );
}

export function normalizeObjectItem(
    objectItem = {}
) {
    const source =
        normalizeObject(
            objectItem
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

        metadataLoadError:
            firstValue(
                source.metadataLoadError
            ),

        metadata: {
            ...source
        }
    };
}

export function normalizeFlows(
    flows = []
) {
    return normalizeArray(
        flows
    ).map(
        (flow, index) => {
            const source =
                normalizeObject(
                    flow
                );

            return {
                id:
                    firstValue(
                        source.id,
                        source.fullName,
                        `flow-${index}`
                    ),

                apiName:
                    firstValue(
                        source.apiName,
                        source.fullName,
                        source.developerName,
                        source.name
                    ),

                label:
                    firstValue(
                        source.label,
                        source.masterLabel,
                        source.name,
                        source.fullName
                    ),

                status:
                    firstValue(
                        source.status,
                        'Unknown'
                    ),

                processType:
                    firstValue(
                        source.processType,
                        source.flowType
                    ),

                triggerType:
                    firstValue(
                        source.triggerType
                    ),

                versionNumber:
                    toNumber(
                        source.versionNumber,
                        source.version
                    ),

                active:
                    toBoolean(
                        source.active ||
                        source.status === 'Active'
                    ),

                hasFaultPaths:
                    source.hasFaultPaths === true,

                faultPathCount:
                    toNumber(
                        source.faultPathCount
                    ),

                elementCount:
                    toNumber(
                        source.elementCount
                    ),

                description:
                    firstValue(
                        source.description
                    ),

                metadata: {
                    ...source
                }
            };
        }
    );
}

export function normalizeValidationRules(
    validationRules = []
) {
    return normalizeArray(
        validationRules
    ).map(
        (rule, index) => {
            const source =
                normalizeObject(
                    rule
                );

            return {
                id:
                    firstValue(
                        source.id,
                        source.fullName,
                        `validation-rule-${index}`
                    ),

                apiName:
                    firstValue(
                        source.apiName,
                        source.fullName,
                        source.developerName,
                        source.name
                    ),

                label:
                    firstValue(
                        source.label,
                        source.name,
                        source.fullName
                    ),

                objectApiName:
                    firstValue(
                        source.objectApiName,
                        source.entityDefinition,
                        source.sObjectType
                    ),

                active:
                    source.active !== false,

                formula:
                    firstValue(
                        source.formula,
                        source.errorConditionFormula
                    ),

                errorMessage:
                    firstValue(
                        source.errorMessage
                    ),

                errorDisplayField:
                    firstValue(
                        source.errorDisplayField
                    ),

                description:
                    firstValue(
                        source.description
                    ),

                metadata: {
                    ...source
                }
            };
        }
    );
}

export function normalizeDuplicateRules(
    rules = []
) {
    return normalizeArray(
        rules
    ).map(
        (rule, index) =>
            normalizeRuleLikeMetadata(
                rule,
                `duplicate-rule-${index}`
            )
    );
}

export function normalizeMatchingRules(
    rules = []
) {
    return normalizeArray(
        rules
    ).map(
        (rule, index) =>
            normalizeRuleLikeMetadata(
                rule,
                `matching-rule-${index}`
            )
    );
}

export function normalizePermissionSets(
    permissionSets = []
) {
    return normalizeArray(
        permissionSets
    ).map(
        (permissionSet, index) => {
            const source =
                normalizeObject(
                    permissionSet
                );

            return {
                id:
                    firstValue(
                        source.id,
                        `permission-set-${index}`
                    ),

                apiName:
                    firstValue(
                        source.apiName,
                        source.name,
                        source.developerName
                    ),

                label:
                    firstValue(
                        source.label,
                        source.name
                    ),

                assignedCount:
                    toNumber(
                        source.assignedCount,
                        source.assignmentCount
                    ),

                license:
                    firstValue(
                        source.license,
                        source.licenseName
                    ),

                description:
                    firstValue(
                        source.description
                    ),

                metadata: {
                    ...source
                }
            };
        }
    );
}

export function normalizePermissionSetGroups(
    groups = []
) {
    return normalizeArray(
        groups
    ).map(
        (group, index) => {
            const source =
                normalizeObject(
                    group
                );

            return {
                id:
                    firstValue(
                        source.id,
                        `permission-set-group-${index}`
                    ),

                apiName:
                    firstValue(
                        source.apiName,
                        source.developerName,
                        source.name
                    ),

                label:
                    firstValue(
                        source.label,
                        source.name
                    ),

                status:
                    firstValue(
                        source.status
                    ),

                assignedCount:
                    toNumber(
                        source.assignedCount,
                        source.assignmentCount
                    ),

                metadata: {
                    ...source
                }
            };
        }
    );
}

export function normalizePermissionAssignments(
    assignments = []
) {
    return normalizeArray(
        assignments
    ).map(
        (assignment, index) => {
            const source =
                normalizeObject(
                    assignment
                );

            return {
                id:
                    firstValue(
                        source.id,
                        `permission-assignment-${index}`
                    ),

                assigneeId:
                    firstValue(
                        source.assigneeId
                    ),

                assigneeName:
                    firstValue(
                        source.assigneeName
                    ),

                permissionSetId:
                    firstValue(
                        source.permissionSetId
                    ),

                permissionSetName:
                    firstValue(
                        source.permissionSetName
                    ),

                metadata: {
                    ...source
                }
            };
        }
    );
}

export function normalizeProfiles(
    profiles = []
) {
    return normalizeNamedMetadata(
        profiles,
        'profile'
    );
}

export function normalizeApexClasses(
    apexClasses = []
) {
    return normalizeArray(
        apexClasses
    ).map(
        (apexClass, index) => {
            const source =
                normalizeObject(
                    apexClass
                );

            return {
                id:
                    firstValue(
                        source.id,
                        `apex-class-${index}`
                    ),

                apiName:
                    firstValue(
                        source.apiName,
                        source.name
                    ),

                label:
                    firstValue(
                        source.label,
                        source.name
                    ),

                testCoverage:
                    toNumber(
                        source.testCoverage,
                        source.coveragePercent
                    ),

                isTest:
                    toBoolean(
                        source.isTest
                    ),

                namespacePrefix:
                    firstValue(
                        source.namespacePrefix
                    ),

                status:
                    firstValue(
                        source.status
                    ),

                metadata: {
                    ...source
                }
            };
        }
    );
}

export function normalizeApexTriggers(
    apexTriggers = []
) {
    return normalizeArray(
        apexTriggers
    ).map(
        (triggerItem, index) => {
            const source =
                normalizeObject(
                    triggerItem
                );

            return {
                id:
                    firstValue(
                        source.id,
                        `apex-trigger-${index}`
                    ),

                apiName:
                    firstValue(
                        source.apiName,
                        source.name
                    ),

                label:
                    firstValue(
                        source.label,
                        source.name
                    ),

                objectApiName:
                    firstValue(
                        source.objectApiName,
                        source.tableEnumOrId
                    ),

                status:
                    firstValue(
                        source.status
                    ),

                testCoverage:
                    toNumber(
                        source.testCoverage,
                        source.coveragePercent
                    ),

                metadata: {
                    ...source
                }
            };
        }
    );
}

export function normalizeReports(
    reports = []
) {
    return normalizeNamedMetadata(
        reports,
        'report'
    );
}

export function normalizeDashboards(
    dashboards = []
) {
    return normalizeNamedMetadata(
        dashboards,
        'dashboard'
    );
}

export function normalizeSharingRules(
    rules = []
) {
    return normalizeNamedMetadata(
        rules,
        'sharing-rule'
    );
}

export function normalizeRoles(
    roles = []
) {
    return normalizeNamedMetadata(
        roles,
        'role'
    );
}

export function normalizeQueues(
    queues = []
) {
    return normalizeNamedMetadata(
        queues,
        'queue'
    );
}

export function normalizeNamedCredentials(
    credentials = []
) {
    return normalizeNamedMetadata(
        credentials,
        'named-credential'
    );
}

export function normalizeCustomMetadata(
    records = []
) {
    return normalizeNamedMetadata(
        records,
        'custom-metadata'
    );
}

export function normalizeDeployments(
    deployments = []
) {
    return normalizeArray(
        deployments
    ).map(
        (deployment, index) => {
            const source =
                normalizeObject(
                    deployment
                );

            return {
                id:
                    firstValue(
                        source.id,
                        source.deployId,
                        `deployment-${index}`
                    ),

                status:
                    firstValue(
                        source.status,
                        'Unknown'
                    ),

                startedAt:
                    firstValue(
                        source.startedAt,
                        source.createdDate
                    ),

                completedAt:
                    firstValue(
                        source.completedAt,
                        source.completedDate
                    ),

                createdBy:
                    firstValue(
                        source.createdBy,
                        source.createdByName
                    ),

                componentCount:
                    toNumber(
                        source.componentCount
                    ),

                testCount:
                    toNumber(
                        source.testCount
                    ),

                errorCount:
                    toNumber(
                        source.errorCount,
                        source.numberComponentErrors
                    ),

                metadata: {
                    ...source
                }
            };
        }
    );
}

export function normalizeRecentChanges(
    changes = []
) {
    return normalizeArray(
        changes
    ).map(
        (change, index) => {
            const source =
                normalizeObject(
                    change
                );

            return {
                id:
                    firstValue(
                        source.id,
                        `recent-change-${index}`
                    ),

                metadataType:
                    firstValue(
                        source.metadataType,
                        source.type
                    ),

                apiName:
                    firstValue(
                        source.apiName,
                        source.name,
                        source.fullName
                    ),

                action:
                    firstValue(
                        source.action,
                        source.changeType
                    ),

                changedBy:
                    firstValue(
                        source.changedBy,
                        source.userName
                    ),

                changedAt:
                    firstValue(
                        source.changedAt,
                        source.modifiedDate
                    ),

                metadata: {
                    ...source
                }
            };
        }
    );
}

export function buildSnapshotCapabilities(
    snapshot = {},
    coverage = {}
) {
    return {
        supportsOrgHealth:
            normalizeArray(
                snapshot.objects
            ).length > 0,

        supportsExplainThis:
            normalizeArray(
                snapshot.objects
            ).length > 0,

        supportsChangeImpact:
            normalizeArray(
                snapshot.objects
            ).length > 0,

        supportsDeploymentReadiness:
            Boolean(
                normalizeArray(
                    snapshot.flows
                ).length ||
                normalizeArray(
                    snapshot.validationRules
                ).length ||
                normalizeArray(
                    snapshot.apexClasses
                ).length ||
                normalizeArray(
                    snapshot.permissionSets
                ).length
            ),

        supportsDailyAdminBrief:
            Boolean(
                normalizeArray(
                    snapshot.recentChanges
                ).length ||
                normalizeArray(
                    snapshot.deployments
                ).length ||
                normalizeArray(
                    snapshot.objects
                ).length
            ),

        supportsSecurityAnalysis:
            Boolean(
                normalizeArray(
                    snapshot.permissionSets
                ).length ||
                normalizeArray(
                    snapshot.profiles
                ).length ||
                normalizeArray(
                    snapshot.sharingRules
                ).length
            ),

        supportsAutomationAnalysis:
            Boolean(
                normalizeArray(
                    snapshot.flows
                ).length ||
                normalizeArray(
                    snapshot.validationRules
                ).length
            ),

        metadataCoverageScore:
            toNumber(
                coverage.score
            ),

        metadataCoverageStatus:
            firstValue(
                coverage.status
            )
    };
}

export function buildSnapshotLimitations(
    snapshot = {},
    coverage = {}
) {
    const limitations =
        normalizeArray(
            coverage.limitations
        );

    if (
        !normalizeArray(
            snapshot.flows
        ).length
    ) {
        limitations.push(
            'Flow metadata has not yet been collected, so automation analysis is limited.'
        );
    }

    if (
        !normalizeArray(
            snapshot.validationRules
        ).length
    ) {
        limitations.push(
            'Validation Rule metadata has not yet been collected.'
        );
    }

    if (
        !normalizeArray(
            snapshot.permissionSets
        ).length
    ) {
        limitations.push(
            'Permission Set metadata has not yet been collected, so security findings are incomplete.'
        );
    }

    if (
        !normalizeArray(
            snapshot.apexClasses
        ).length
    ) {
        limitations.push(
            'Apex metadata has not yet been collected, so code and test-readiness analysis is incomplete.'
        );
    }

    if (
        !normalizeArray(
            snapshot.deployments
        ).length &&
        !normalizeArray(
            snapshot.recentChanges
        ).length
    ) {
        limitations.push(
            'Deployment and change history are unavailable, so Yesterday vs. Today insights are limited.'
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

function normalizeRuleLikeMetadata(
    rule = {},
    fallbackId = ''
) {
    const source =
        normalizeObject(
            rule
        );

    return {
        id:
            firstValue(
                source.id,
                source.fullName,
                fallbackId
            ),

        apiName:
            firstValue(
                source.apiName,
                source.fullName,
                source.developerName,
                source.name
            ),

        label:
            firstValue(
                source.label,
                source.name,
                source.fullName
            ),

        objectApiName:
            firstValue(
                source.objectApiName,
                source.sObjectType
            ),

        active:
            source.active !== false,

        description:
            firstValue(
                source.description
            ),

        metadata: {
            ...source
        }
    };
}

function normalizeNamedMetadata(
    items = [],
    prefix = 'metadata'
) {
    return normalizeArray(
        items
    ).map(
        (item, index) => {
            const source =
                normalizeObject(
                    item
                );

            return {
                id:
                    firstValue(
                        source.id,
                        source.fullName,
                        `${prefix}-${index}`
                    ),

                apiName:
                    firstValue(
                        source.apiName,
                        source.fullName,
                        source.developerName,
                        source.name
                    ),

                label:
                    firstValue(
                        source.label,
                        source.name,
                        source.fullName
                    ),

                description:
                    firstValue(
                        source.description
                    ),

                metadata: {
                    ...source
                }
            };
        }
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
        typeof value === 'object' &&
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
    ...values
) {
    for (
        const value of values
    ) {
        const numberValue =
            Number(value);

        if (
            Number.isFinite(
                numberValue
            )
        ) {
            return numberValue;
        }
    }

    return 0;
}

const salesforceSnapshotAdapter = {
    adaptSalesforceSnapshot,
    normalizeOrganization,
    normalizeObjects,
    normalizeObjectItem,
    normalizeFlows,
    normalizeValidationRules,
    normalizeDuplicateRules,
    normalizeMatchingRules,
    normalizePermissionSets,
    normalizePermissionSetGroups,
    normalizePermissionAssignments,
    normalizeProfiles,
    normalizeApexClasses,
    normalizeApexTriggers,
    normalizeReports,
    normalizeDashboards,
    normalizeSharingRules,
    normalizeRoles,
    normalizeQueues,
    normalizeNamedCredentials,
    normalizeCustomMetadata,
    normalizeDeployments,
    normalizeRecentChanges,
    buildSnapshotCapabilities,
    buildSnapshotLimitations
};

export default salesforceSnapshotAdapter;