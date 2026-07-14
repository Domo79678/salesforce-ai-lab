/*
 * orgContextService.js
 *
 * Shared live-metadata service for Salesforce Copilot.
 *
 * This service wraps OrgContextController Apex methods and
 * builds a reusable live Org Knowledge snapshot.
 *
 * Live coverage in Version 1.2:
 * - organization information
 * - current user information
 * - object inventory
 * - selected object capabilities
 * - fields
 * - relationships
 * - record types
 *
 * Planned setup-metadata coverage:
 * - Flows
 * - Validation Rules
 * - Duplicate Rules
 * - Matching Rules
 * - Permission Sets
 * - Apex classes
 * - Apex coverage
 */

import getOrgSummaryApex
    from '@salesforce/apex/OrgContextController.getOrgSummary';

import getObjectsApex
    from '@salesforce/apex/OrgContextController.getObjects';

import getObjectContextApex
    from '@salesforce/apex/OrgContextController.getObjectContext';

import getObjectFieldsApex
    from '@salesforce/apex/OrgContextController.getObjectFields';

import getRecordTypesApex
    from '@salesforce/apex/OrgContextController.getRecordTypes';

const DEFAULT_OBJECT_LIMIT = 100;
const MAXIMUM_OBJECT_LIMIT = 200;

const DEFAULT_HEALTH_OBJECTS = Object.freeze([
    'Account',
    'Contact',
    'Lead',
    'Opportunity',
    'Case',
    'User'
]);

const DEFAULT_ERROR_MESSAGE =
    'The Org Context Service could not retrieve Salesforce metadata.';

export const ORG_CONTEXT_SERVICE_VERSION =
    '1.2';

export const LIVE_COVERAGE_STATUS =
    Object.freeze({
        COMPLETE:
            'Live Salesforce Metadata',

        PARTIAL:
            'Live Salesforce Metadata — Partial Coverage',

        UNAVAILABLE:
            'Live Salesforce Metadata Unavailable'
    });

export async function getOrgSummary() {
    try {
        const summary =
            await getOrgSummaryApex();

        return normalizeOrgSummary(
            summary
        );
    } catch (error) {
        throw createServiceError(
            'Unable to retrieve the Salesforce org summary.',
            error
        );
    }
}

export async function getObjects(
    searchTerm = '',
    maxResults = DEFAULT_OBJECT_LIMIT
) {
    const normalizedLimit =
        normalizeObjectLimit(
            maxResults
        );

    try {
        const objects =
            await getObjectsApex({
                searchTerm:
                    typeof searchTerm ===
                    'string'
                        ? searchTerm.trim()
                        : '',

                maxResults:
                    normalizedLimit
            });

        return Array.isArray(objects)
            ? objects.map(
                  normalizeObjectInfo
              )
            : [];
    } catch (error) {
        throw createServiceError(
            'Unable to retrieve Salesforce objects.',
            error
        );
    }
}

export async function searchObjects(
    searchTerm,
    maxResults = 50
) {
    if (
        typeof searchTerm !==
            'string' ||
        !searchTerm.trim()
    ) {
        return [];
    }

    return getObjects(
        searchTerm.trim(),
        maxResults
    );
}

export async function getObjectContext(
    objectApiName
) {
    validateObjectApiName(
        objectApiName
    );

    try {
        const context =
            await getObjectContextApex({
                objectApiName:
                    objectApiName.trim()
            });

        return normalizeObjectContext(
            context
        );
    } catch (error) {
        throw createServiceError(
            `Unable to retrieve metadata for ${objectApiName}.`,
            error
        );
    }
}

export async function getObjectFields(
    objectApiName
) {
    validateObjectApiName(
        objectApiName
    );

    try {
        const fields =
            await getObjectFieldsApex({
                objectApiName:
                    objectApiName.trim()
            });

        return Array.isArray(fields)
            ? fields.map(
                  normalizeFieldInfo
              )
            : [];
    } catch (error) {
        throw createServiceError(
            `Unable to retrieve fields for ${objectApiName}.`,
            error
        );
    }
}

export async function getRecordTypes(
    objectApiName
) {
    validateObjectApiName(
        objectApiName
    );

    try {
        const recordTypes =
            await getRecordTypesApex({
                objectApiName:
                    objectApiName.trim()
            });

        return Array.isArray(
            recordTypes
        )
            ? recordTypes.map(
                  normalizeRecordType
              )
            : [];
    } catch (error) {
        throw createServiceError(
            `Unable to retrieve record types for ${objectApiName}.`,
            error
        );
    }
}

export async function objectExists(
    objectApiName
) {
    if (
        typeof objectApiName !==
            'string' ||
        !objectApiName.trim()
    ) {
        return false;
    }

    const objectMatch =
        await findObject(
            objectApiName
        );

    return Boolean(
        objectMatch
    );
}

export async function findObject(
    objectName
) {
    if (
        typeof objectName !==
            'string' ||
        !objectName.trim()
    ) {
        return null;
    }

    const requestedName =
        objectName
            .trim()
            .toLowerCase();

    const objects =
        await getObjects(
            objectName.trim(),
            50
        );

    return (
        objects.find(
            (objectInfo) =>
                objectInfo.apiName
                    .toLowerCase() ===
                    requestedName ||
                objectInfo.label
                    .toLowerCase() ===
                    requestedName ||
                objectInfo.pluralLabel
                    .toLowerCase() ===
                    requestedName
        ) || null
    );
}

/*
 * Builds the shared live metadata snapshot used by:
 * - Org Health
 * - Explain This
 * - Change Impact Analyzer
 * - Deployment Readiness
 * - Daily Admin Brief
 *
 * This method never inserts demo metadata.
 */
export async function buildLiveOrgSnapshot(
    options = {}
) {
    const startedAt =
        new Date().toISOString();

    const requestedObjects =
        normalizeRequestedObjects(
            options.objectApiNames
        );

    const inventoryLimit =
        normalizeObjectLimit(
            options.inventoryLimit ||
            MAXIMUM_OBJECT_LIMIT
        );

    const includeInventory =
        options.includeInventory !==
        false;

    const errors = [];
    const warnings = [];

    let organization = null;
    let objectInventory = [];
    let objects = [];

    try {
        organization =
            await getOrgSummary();
    } catch (error) {
        errors.push(
            createSnapshotError(
                'organization',
                error
            )
        );
    }

    if (includeInventory) {
        try {
            objectInventory =
                await getObjects(
                    '',
                    inventoryLimit
                );

            if (
                organization &&
                organization.totalObjects >
                    objectInventory.length
            ) {
                warnings.push({
                    code:
                        'OBJECT_INVENTORY_LIMITED',

                    category:
                        'objects',

                    message:
                        `The org reports ${organization.totalObjects} objects, while the live inventory request returned ${objectInventory.length}. Detailed Org Health analysis is intentionally limited to selected business objects.`
                });
            }
        } catch (error) {
            warnings.push(
                createSnapshotError(
                    'objectInventory',
                    error
                )
            );
        }
    }

    const objectResults =
        await Promise.allSettled(
            requestedObjects.map(
                (objectApiName) =>
                    getObjectContext(
                        objectApiName
                    )
            )
        );

    objects =
        objectResults
            .map(
                (result, index) => {
                    const objectApiName =
                        requestedObjects[
                            index
                        ];

                    if (
                        result.status ===
                        'fulfilled'
                    ) {
                        return result.value;
                    }

                    warnings.push(
                        createSnapshotError(
                            objectApiName,
                            result.reason
                        )
                    );

                    return null;
                }
            )
            .filter(Boolean);

    const coverage =
        buildCoverageSummary({
            organization,
            objectInventory,
            objects,
            errors,
            warnings
        });

    return {
        success:
            Boolean(
                organization
            ),

        source:
            'Org Context Service',

        sourceType:
            'live',

        serviceVersion:
            ORG_CONTEXT_SERVICE_VERSION,

        coverageStatus:
            coverage.status,

        coverageLabel:
            coverage.label,

        organization:
            organization
                ? mapSummaryToOrganization(
                      organization
                  )
                : {},

        objects:
            objects.map(
                mapContextToSnapshotObject
            ),

        objectInventory,

        flows: [],

        validationRules: [],

        duplicateRules: [],

        matchingRules: [],

        permissionSets: [],

        profiles: [],

        apexClasses: [],

        apexTriggers: [],

        reports: [],

        dashboards: [],

        deployments: [],

        metadataItems: [],

        recentChanges: [],

        failedDeployments: [],

        setupMetadataCoverage: {
            flows:
                false,

            validationRules:
                false,

            duplicateRules:
                false,

            matchingRules:
                false,

            permissionSets:
                false,

            apexClasses:
                false,

            apexCoverage:
                false
        },

        coverage,

        errors,

        warnings,

        startedAt,

        retrievedAt:
            new Date().toISOString()
    };
}

function buildCoverageSummary({
    organization = null,
    objectInventory = [],
    objects = [],
    errors = [],
    warnings = []
} = {}) {
    const liveCategories = [];

    if (organization) {
        liveCategories.push(
            'Organization'
        );
    }

    if (
        Array.isArray(
            objectInventory
        ) &&
        objectInventory.length
    ) {
        liveCategories.push(
            'Object Inventory'
        );
    }

    if (
        Array.isArray(objects) &&
        objects.length
    ) {
        liveCategories.push(
            'Objects',
            'Fields',
            'Relationships',
            'Record Types',
            'Object Access'
        );
    }

    const unavailableCategories = [
        'Flows',
        'Validation Rules',
        'Duplicate Rules',
        'Matching Rules',
        'Permission Sets',
        'Apex Classes',
        'Apex Coverage'
    ];

    const hasOrganization =
        Boolean(
            organization
        );

    const status =
        hasOrganization
            ? 'partial'
            : 'unavailable';

    return {
        status,

        label:
            status === 'partial'
                ? LIVE_COVERAGE_STATUS
                      .PARTIAL
                : LIVE_COVERAGE_STATUS
                      .UNAVAILABLE,

        liveCategories:
            uniqueStrings(
                liveCategories
            ),

        unavailableCategories,

        selectedObjectCount:
            objects.length,

        inventoryObjectCount:
            objectInventory.length,

        errorCount:
            errors.length,

        warningCount:
            warnings.length
    };
}

function normalizeRequestedObjects(
    objectApiNames
) {
    if (
        !Array.isArray(
            objectApiNames
        ) ||
        !objectApiNames.length
    ) {
        return [
            ...DEFAULT_HEALTH_OBJECTS
        ];
    }

    return uniqueStrings(
        objectApiNames
            .map(
                (value) =>
                    typeof value ===
                    'string'
                        ? value.trim()
                        : ''
            )
            .filter(Boolean)
    );
}

function mapSummaryToOrganization(
    summary = {}
) {
    return {
        id:
            summary.organizationId,

        name:
            summary.organizationName,

        userName:
            summary.userName,

        userEmail:
            summary.userEmail,

        apiVersion:
            summary.apiVersion,

        locale:
            summary.locale,

        timeZone:
            summary.timeZone,

        totalObjects:
            summary.totalObjects,

        standardObjects:
            summary.standardObjects,

        customObjects:
            summary.customObjects,

        queryableObjects:
            summary.queryableObjects,

        accessibleObjects:
            summary.accessibleObjects,

        metadata: {
            userId:
                summary.userId,

            profileId:
                summary.profileId,

            serviceVersion:
                summary.serviceVersion
        }
    };
}

function mapContextToSnapshotObject(
    context = {}
) {
    return {
        apiName:
            context.apiName,

        label:
            context.label,

        labelPlural:
            context.pluralLabel,

        keyPrefix:
            context.keyPrefix,

        custom:
            context.custom,

        accessible:
            context.accessible,

        queryable:
            context.queryable,

        searchable:
            context.searchable,

        createable:
            context.createable,

        updateable:
            context.updateable,

        deletable:
            context.deletable,

        fields:
            Array.isArray(
                context.fields
            )
                ? context.fields.map(
                      mapFieldToSnapshotField
                  )
                : [],

        relationships:
            buildRelationshipsFromFields(
                context.fields,
                context.apiName
            ),

        recordTypes:
            Array.isArray(
                context.recordTypes
            )
                ? context.recordTypes.map(
                      mapRecordTypeToSnapshot
                  )
                : [],

        metadata: {
            source:
                'Live Schema Describe',

            fieldCount:
                context.fieldCount,

            relationshipCount:
                context.relationshipCount,

            recordTypeCount:
                context.recordTypeCount
        }
    };
}

function mapFieldToSnapshotField(
    field = {}
) {
    return {
        apiName:
            field.apiName,

        label:
            field.label,

        dataType:
            field.dataType,

        custom:
            field.custom,

        required:
            field.required,

        unique:
            field.unique,

        externalId:
            field.externalId,

        calculated:
            field.calculated,

        encrypted:
            false,

        accessible:
            field.accessible,

        createable:
            field.createable,

        updateable:
            field.updateable,

        relationshipName:
            field.relationshipName,

        referenceTo:
            Array.isArray(
                field.referenceTo
            )
                ? [
                      ...field.referenceTo
                  ]
                : [],

        length:
            field.length,

        precision:
            field.precision,

        scale:
            field.scale,

        metadata: {
            autoNumber:
                field.autoNumber,

            source:
                'Live Schema Describe'
        }
    };
}

function buildRelationshipsFromFields(
    fields = [],
    sourceObject = ''
) {
    if (!Array.isArray(fields)) {
        return [];
    }

    return fields
        .filter(
            (field) =>
                Array.isArray(
                    field.referenceTo
                ) &&
                field.referenceTo.length
        )
        .map(
            (field) => ({
                fieldApiName:
                    field.apiName,

                fieldLabel:
                    field.label,

                sourceObject,

                targetObjects: [
                    ...field.referenceTo
                ],

                relationshipName:
                    field.relationshipName,

                required:
                    field.required,

                custom:
                    field.custom
            })
        );
}

function mapRecordTypeToSnapshot(
    recordType = {}
) {
    return {
        id:
            recordType.recordTypeId,

        developerName:
            recordType.developerName,

        name:
            recordType.name,

        active:
            recordType.available,

        defaultRecordTypeMapping:
            recordType.defaultRecordType,

        available:
            recordType.available,

        master:
            recordType.master
    };
}

function normalizeObjectLimit(
    maxResults
) {
    const numericLimit =
        Number(
            maxResults
        );

    if (
        !Number.isFinite(
            numericLimit
        ) ||
        numericLimit <= 0
    ) {
        return DEFAULT_OBJECT_LIMIT;
    }

    return Math.min(
        Math.floor(
            numericLimit
        ),
        MAXIMUM_OBJECT_LIMIT
    );
}

function validateObjectApiName(
    objectApiName
) {
    if (
        typeof objectApiName !==
            'string' ||
        !objectApiName.trim()
    ) {
        throw new Error(
            'A Salesforce object API name is required.'
        );
    }
}

function normalizeOrgSummary(
    summary = {}
) {
    return {
        serviceVersion:
            summary.serviceVersion ||
            '',

        apiVersion:
            summary.apiVersion ||
            '',

        organizationId:
            summary.organizationId ||
            '',

        organizationName:
            summary.organizationName ||
            '',

        userId:
            summary.userId ||
            '',

        userName:
            summary.userName ||
            '',

        userEmail:
            summary.userEmail ||
            '',

        profileId:
            summary.profileId ||
            '',

        locale:
            summary.locale ||
            '',

        timeZone:
            summary.timeZone ||
            '',

        totalObjects:
            Number(
                summary.totalObjects ||
                0
            ),

        standardObjects:
            Number(
                summary.standardObjects ||
                0
            ),

        customObjects:
            Number(
                summary.customObjects ||
                0
            ),

        queryableObjects:
            Number(
                summary.queryableObjects ||
                0
            ),

        accessibleObjects:
            Number(
                summary.accessibleObjects ||
                0
            )
    };
}

function normalizeObjectInfo(
    objectInfo = {}
) {
    return {
        apiName:
            objectInfo.apiName ||
            '',

        label:
            objectInfo.label ||
            '',

        pluralLabel:
            objectInfo.pluralLabel ||
            '',

        keyPrefix:
            objectInfo.keyPrefix ||
            '',

        custom:
            Boolean(
                objectInfo.custom
            ),

        queryable:
            Boolean(
                objectInfo.queryable
            ),

        searchable:
            Boolean(
                objectInfo.searchable
            ),

        createable:
            Boolean(
                objectInfo.createable
            ),

        updateable:
            Boolean(
                objectInfo.updateable
            ),

        deletable:
            Boolean(
                objectInfo.deletable
            ),

        accessible:
            Boolean(
                objectInfo.accessible
            ),

        hasRecordTypes:
            Boolean(
                objectInfo.hasRecordTypes
            )
    };
}

function normalizeObjectContext(
    context = {}
) {
    return {
        apiName:
            context.apiName ||
            '',

        label:
            context.label ||
            '',

        pluralLabel:
            context.pluralLabel ||
            '',

        keyPrefix:
            context.keyPrefix ||
            '',

        custom:
            Boolean(
                context.custom
            ),

        queryable:
            Boolean(
                context.queryable
            ),

        searchable:
            Boolean(
                context.searchable
            ),

        createable:
            Boolean(
                context.createable
            ),

        updateable:
            Boolean(
                context.updateable
            ),

        deletable:
            Boolean(
                context.deletable
            ),

        accessible:
            Boolean(
                context.accessible
            ),

        fieldCount:
            Number(
                context.fieldCount ||
                0
            ),

        relationshipCount:
            Number(
                context.relationshipCount ||
                0
            ),

        recordTypeCount:
            Number(
                context.recordTypeCount ||
                0
            ),

        fields:
            Array.isArray(
                context.fields
            )
                ? context.fields.map(
                      normalizeFieldInfo
                  )
                : [],

        recordTypes:
            Array.isArray(
                context.recordTypes
            )
                ? context.recordTypes.map(
                      normalizeRecordType
                  )
                : []
    };
}

function normalizeFieldInfo(
    field = {}
) {
    return {
        apiName:
            field.apiName ||
            '',

        label:
            field.label ||
            '',

        dataType:
            field.dataType ||
            '',

        length:
            Number(
                field.length ||
                0
            ),

        precision:
            Number(
                field.precision ||
                0
            ),

        scale:
            Number(
                field.scale ||
                0
            ),

        accessible:
            Boolean(
                field.accessible
            ),

        createable:
            Boolean(
                field.createable
            ),

        updateable:
            Boolean(
                field.updateable
            ),

        required:
            Boolean(
                field.required
            ),

        custom:
            Boolean(
                field.custom
            ),

        calculated:
            Boolean(
                field.calculated
            ),

        unique:
            Boolean(
                field.unique
            ),

        externalId:
            Boolean(
                field.externalId
            ),

        autoNumber:
            Boolean(
                field.autoNumber
            ),

        relationshipName:
            field.relationshipName ||
            '',

        referenceTo:
            Array.isArray(
                field.referenceTo
            )
                ? [
                      ...field.referenceTo
                  ]
                : []
    };
}

function normalizeRecordType(
    recordType = {}
) {
    return {
        recordTypeId:
            recordType.recordTypeId ||
            '',

        name:
            recordType.name ||
            '',

        developerName:
            recordType.developerName ||
            '',

        available:
            Boolean(
                recordType.available
            ),

        master:
            Boolean(
                recordType.master
            ),

        defaultRecordType:
            Boolean(
                recordType.defaultRecordType
            )
    };
}

function createSnapshotError(
    category,
    error
) {
    return {
        category,

        message:
            extractErrorMessage(
                error
            )
    };
}

function uniqueStrings(
    values = []
) {
    return Array.from(
        new Set(
            values.filter(
                Boolean
            )
        )
    );
}

function createServiceError(
    message,
    error
) {
    const details =
        extractErrorMessage(
            error
        );

    const serviceError =
        new Error(
            details
                ? `${message} ${details}`
                : message
        );

    serviceError.originalError =
        error;

    return serviceError;
}

function extractErrorMessage(
    error
) {
    if (!error) {
        return DEFAULT_ERROR_MESSAGE;
    }

    if (
        error.body &&
        typeof error.body.message ===
            'string'
    ) {
        return error.body.message;
    }

    if (
        error.body &&
        Array.isArray(
            error.body
        ) &&
        error.body.length
    ) {
        return error.body
            .map(
                (item) =>
                    item.message
            )
            .filter(Boolean)
            .join(' ');
    }

    if (
        typeof error.message ===
        'string'
    ) {
        return error.message;
    }

    return DEFAULT_ERROR_MESSAGE;
}