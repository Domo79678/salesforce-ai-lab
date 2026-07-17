/*
 * metadataCollectionPlan.js
 *
 * Defines what Salesforce metadata the collector retrieves,
 * why it matters, and the order in which it should be collected.
 */

import {
    COLLECTION_PHASES,
    COLLECTION_PRIORITIES,
    COLLECTION_STATUSES,
    METADATA_TYPES
} from './collectorConstants';

export const METADATA_COLLECTION_PLAN = Object.freeze([
    {
        id: 'organization',
        metadataType:
            METADATA_TYPES.ORGANIZATION,
        label: 'Organization Context',
        phase:
            COLLECTION_PHASES.FOUNDATION,
        priority:
            COLLECTION_PRIORITIES.CRITICAL,
        weight: 5,
        status:
            COLLECTION_STATUSES.COMPLETE,
        currentlySupported: true,
        requiredForCoreMode: true,
        description:
            'Organization identity, edition, environment, user context, locale, and instance information.',
        enables: [
            'Org identification',
            'Environment awareness',
            'Cross-org portability',
            'Context-aware recommendations'
        ]
    },
    {
        id: 'objects',
        metadataType:
            METADATA_TYPES.OBJECTS,
        label: 'Objects',
        phase:
            COLLECTION_PHASES.FOUNDATION,
        priority:
            COLLECTION_PRIORITIES.CRITICAL,
        weight: 10,
        status:
            COLLECTION_STATUSES.COMPLETE,
        currentlySupported: true,
        requiredForCoreMode: true,
        description:
            'Standard and custom object inventory and capabilities.',
        enables: [
            'Org Explorer',
            'Object complexity analysis',
            'Basic Explain This',
            'Basic Change Impact'
        ]
    },
    {
        id: 'fields',
        metadataType:
            METADATA_TYPES.FIELDS,
        label: 'Fields',
        phase:
            COLLECTION_PHASES.FOUNDATION,
        priority:
            COLLECTION_PRIORITIES.CRITICAL,
        weight: 10,
        status:
            COLLECTION_STATUSES.COMPLETE,
        currentlySupported: true,
        requiredForCoreMode: true,
        description:
            'Field metadata, data types, security characteristics, requirements, formulas, and relationships.',
        enables: [
            'Field documentation findings',
            'Data model review',
            'Field risk analysis',
            'Field Explain This'
        ]
    },
    {
        id: 'relationships',
        metadataType:
            METADATA_TYPES.RELATIONSHIPS,
        label: 'Relationships',
        phase:
            COLLECTION_PHASES.FOUNDATION,
        priority:
            COLLECTION_PRIORITIES.HIGH,
        weight: 5,
        status:
            COLLECTION_STATUSES.COMPLETE,
        currentlySupported: true,
        requiredForCoreMode: true,
        description:
            'Lookup, master-detail, and polymorphic relationship information.',
        enables: [
            'Dependency awareness',
            'Data model complexity',
            'Relationship testing guidance'
        ]
    },
    {
        id: 'record-types',
        metadataType:
            METADATA_TYPES.RECORD_TYPES,
        label: 'Record Types',
        phase:
            COLLECTION_PHASES.FOUNDATION,
        priority:
            COLLECTION_PRIORITIES.HIGH,
        weight: 5,
        status:
            COLLECTION_STATUSES.COMPLETE,
        currentlySupported: true,
        requiredForCoreMode: true,
        description:
            'Record type inventory and object-level segmentation.',
        enables: [
            'Record type testing',
            'Configuration complexity analysis',
            'Deployment review'
        ]
    },
    {
        id: 'flows',
        metadataType:
            METADATA_TYPES.FLOWS,
        label: 'Flows',
        phase:
            COLLECTION_PHASES.AUTOMATION,
        priority:
            COLLECTION_PRIORITIES.CRITICAL,
        weight: 15,
        status:
            COLLECTION_STATUSES.NOT_STARTED,
        currentlySupported: false,
        requiredForCoreMode: true,
        description:
            'Flow inventory, versions, status, trigger type, fault handling, and key elements.',
        enables: [
            'Flow risk detection',
            'Fault-path findings',
            'Automation conflict analysis',
            'Flow Explain This',
            'Deployment readiness'
        ]
    },
    {
        id: 'validation-rules',
        metadataType:
            METADATA_TYPES.VALIDATION_RULES,
        label: 'Validation Rules',
        phase:
            COLLECTION_PHASES.AUTOMATION,
        priority:
            COLLECTION_PRIORITIES.CRITICAL,
        weight: 10,
        status:
            COLLECTION_STATUSES.NOT_STARTED,
        currentlySupported: false,
        requiredForCoreMode: true,
        description:
            'Validation Rule inventory, active state, formulas, descriptions, and error messages.',
        enables: [
            'Overlapping rule review',
            'Documentation findings',
            'Change impact',
            'Testing guidance'
        ]
    },
    {
        id: 'permission-sets',
        metadataType:
            METADATA_TYPES.PERMISSION_SETS,
        label: 'Permission Sets',
        phase:
            COLLECTION_PHASES.SECURITY,
        priority:
            COLLECTION_PRIORITIES.CRITICAL,
        weight: 10,
        status:
            COLLECTION_STATUSES.NOT_STARTED,
        currentlySupported: false,
        requiredForCoreMode: true,
        description:
            'Permission Set inventory, assignments, object permissions, field access, and system permissions.',
        enables: [
            'Least-privilege review',
            'Unassigned permission findings',
            'Access troubleshooting',
            'Deployment security review'
        ]
    },
    {
        id: 'apex',
        metadataType:
            METADATA_TYPES.APEX_CLASSES,
        label: 'Apex Classes and Triggers',
        phase:
            COLLECTION_PHASES.CODE,
        priority:
            COLLECTION_PRIORITIES.HIGH,
        weight: 10,
        status:
            COLLECTION_STATUSES.NOT_STARTED,
        currentlySupported: false,
        requiredForCoreMode: false,
        description:
            'Apex classes, triggers, test classes, coverage context, and code ownership.',
        enables: [
            'Code risk review',
            'Test readiness',
            'Governor-limit guidance',
            'Deployment blockers'
        ]
    },
    {
        id: 'duplicate-prevention',
        metadataType:
            METADATA_TYPES.DUPLICATE_RULES,
        label: 'Duplicate and Matching Rules',
        phase:
            COLLECTION_PHASES.DATA_QUALITY,
        priority:
            COLLECTION_PRIORITIES.HIGH,
        weight: 5,
        status:
            COLLECTION_STATUSES.NOT_STARTED,
        currentlySupported: false,
        requiredForCoreMode: false,
        description:
            'Duplicate Rules, Matching Rules, active state, and covered objects.',
        enables: [
            'Data-quality findings',
            'Disabled-rule alerts',
            'Duplicate-prevention review'
        ]
    },
    {
        id: 'analytics',
        metadataType:
            METADATA_TYPES.REPORTS,
        label: 'Reports and Dashboards',
        phase:
            COLLECTION_PHASES.ANALYTICS,
        priority:
            COLLECTION_PRIORITIES.MEDIUM,
        weight: 5,
        status:
            COLLECTION_STATUSES.NOT_STARTED,
        currentlySupported: false,
        requiredForCoreMode: false,
        description:
            'Reports, dashboards, folders, owners, and metadata references.',
        enables: [
            'Analytics dependency review',
            'Unused analytics findings',
            'Change impact'
        ]
    },
    {
        id: 'sharing-access',
        metadataType:
            METADATA_TYPES.SHARING_RULES,
        label: 'Sharing and Access Model',
        phase:
            COLLECTION_PHASES.ACCESS_MODEL,
        priority:
            COLLECTION_PRIORITIES.HIGH,
        weight: 5,
        status:
            COLLECTION_STATUSES.NOT_STARTED,
        currentlySupported: false,
        requiredForCoreMode: false,
        description:
            'Roles, queues, sharing rules, profiles, and access-model configuration.',
        enables: [
            'Security posture analysis',
            'Record-access troubleshooting',
            'Role and queue review'
        ]
    },
    {
        id: 'deployment-history',
        metadataType:
            METADATA_TYPES.DEPLOYMENTS,
        label: 'Deployment and Change History',
        phase:
            COLLECTION_PHASES.HISTORY,
        priority:
            COLLECTION_PRIORITIES.MEDIUM,
        weight: 5,
        status:
            COLLECTION_STATUSES.NOT_STARTED,
        currentlySupported: false,
        requiredForCoreMode: false,
        description:
            'Recent deployments, failed deployments, and verified metadata-change history.',
        enables: [
            'Yesterday vs. Today',
            'Daily Admin Brief activity',
            'Release trend analysis',
            'Deployment failure monitoring'
        ]
    }
]);

export function getCollectionPlan() {
    return METADATA_COLLECTION_PLAN.map(
        (item) => ({
            ...item,
            enables: [
                ...item.enables
            ]
        })
    );
}

export function getSupportedCollectionItems() {
    return getCollectionPlan().filter(
        (item) =>
            item.currentlySupported
    );
}

export function getMissingCollectionItems() {
    return getCollectionPlan().filter(
        (item) =>
            !item.currentlySupported
    );
}

export function getCollectionItemsByPhase(
    phase = ''
) {
    return getCollectionPlan().filter(
        (item) =>
            item.phase === phase
    );
}

export function getNextCollectionItem() {
    return getMissingCollectionItems()
        .sort(
            (first, second) =>
                first.priority -
                second.priority
        )[0] || null;
}

export function getTotalCollectionWeight() {
    return getCollectionPlan().reduce(
        (total, item) =>
            total +
            Number(
                item.weight || 0
            ),
        0
    );
}

export function getSupportedCollectionWeight() {
    return getSupportedCollectionItems()
        .reduce(
            (total, item) =>
                total +
                Number(
                    item.weight || 0
                ),
            0
        );
}

export function buildCollectionPlanSummary() {
    const allItems =
        getCollectionPlan();

    const supportedItems =
        getSupportedCollectionItems();

    const missingItems =
        getMissingCollectionItems();

    const nextItem =
        getNextCollectionItem();

    return {
        totalItems:
            allItems.length,

        supportedItems:
            supportedItems.length,

        missingItems:
            missingItems.length,

        totalWeight:
            getTotalCollectionWeight(),

        supportedWeight:
            getSupportedCollectionWeight(),

        nextMetadataType:
            nextItem
                ?.metadataType ||
            '',

        nextLabel:
            nextItem
                ?.label ||
            'None',

        nextPhase:
            nextItem
                ?.phase ||
            'None'
    };
}

const metadataCollectionPlan = {
    plan:
        METADATA_COLLECTION_PLAN,
    getCollectionPlan,
    getSupportedCollectionItems,
    getMissingCollectionItems,
    getCollectionItemsByPhase,
    getNextCollectionItem,
    getTotalCollectionWeight,
    getSupportedCollectionWeight,
    buildCollectionPlanSummary
};

export default metadataCollectionPlan;