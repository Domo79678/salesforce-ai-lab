/*
 * orgContextService.js
 *
 * Shared JavaScript service for Salesforce Copilot.
 *
 * Wraps OrgContextController Apex methods so every Copilot
 * module can retrieve live Salesforce org metadata through
 * one consistent interface.
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

const DEFAULT_ERROR_MESSAGE =
    'The Org Context Service could not retrieve Salesforce metadata.';

export async function getOrgSummary() {
    try {
        const summary = await getOrgSummaryApex();

        return normalizeOrgSummary(summary);
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
        normalizeObjectLimit(maxResults);

    try {
        const objects = await getObjectsApex({
            searchTerm:
                typeof searchTerm === 'string'
                    ? searchTerm.trim()
                    : '',
            maxResults: normalizedLimit
        });

        return Array.isArray(objects)
            ? objects.map(normalizeObjectInfo)
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
        typeof searchTerm !== 'string' ||
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
    validateObjectApiName(objectApiName);

    try {
        const context =
            await getObjectContextApex({
                objectApiName:
                    objectApiName.trim()
            });

        return normalizeObjectContext(context);
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
    validateObjectApiName(objectApiName);

    try {
        const fields =
            await getObjectFieldsApex({
                objectApiName:
                    objectApiName.trim()
            });

        return Array.isArray(fields)
            ? fields.map(normalizeFieldInfo)
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
    validateObjectApiName(objectApiName);

    try {
        const recordTypes =
            await getRecordTypesApex({
                objectApiName:
                    objectApiName.trim()
            });

        return Array.isArray(recordTypes)
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
        typeof objectApiName !== 'string' ||
        !objectApiName.trim()
    ) {
        return false;
    }

    const objectMatch =
        await findObject(objectApiName);

    return Boolean(objectMatch);
}

export async function findObject(
    objectName
) {
    if (
        typeof objectName !== 'string' ||
        !objectName.trim()
    ) {
        return null;
    }

    const requestedName =
        objectName.trim().toLowerCase();

    const objects = await getObjects(
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

function normalizeObjectLimit(maxResults) {
    const numericLimit = Number(maxResults);

    if (
        !Number.isFinite(numericLimit) ||
        numericLimit <= 0
    ) {
        return DEFAULT_OBJECT_LIMIT;
    }

    return Math.min(
        Math.floor(numericLimit),
        MAXIMUM_OBJECT_LIMIT
    );
}

function validateObjectApiName(
    objectApiName
) {
    if (
        typeof objectApiName !== 'string' ||
        !objectApiName.trim()
    ) {
        throw new Error(
            'A Salesforce object API name is required.'
        );
    }
}

function normalizeOrgSummary(summary = {}) {
    return {
        serviceVersion:
            summary.serviceVersion || '',
        apiVersion:
            summary.apiVersion || '',
        organizationId:
            summary.organizationId || '',
        organizationName:
            summary.organizationName || '',
        userId:
            summary.userId || '',
        userName:
            summary.userName || '',
        userEmail:
            summary.userEmail || '',
        profileId:
            summary.profileId || '',
        locale:
            summary.locale || '',
        timeZone:
            summary.timeZone || '',
        totalObjects:
            Number(summary.totalObjects || 0),
        standardObjects:
            Number(summary.standardObjects || 0),
        customObjects:
            Number(summary.customObjects || 0),
        queryableObjects:
            Number(summary.queryableObjects || 0),
        accessibleObjects:
            Number(summary.accessibleObjects || 0)
    };
}

function normalizeObjectInfo(
    objectInfo = {}
) {
    return {
        apiName:
            objectInfo.apiName || '',
        label:
            objectInfo.label || '',
        pluralLabel:
            objectInfo.pluralLabel || '',
        keyPrefix:
            objectInfo.keyPrefix || '',
        custom:
            Boolean(objectInfo.custom),
        queryable:
            Boolean(objectInfo.queryable),
        searchable:
            Boolean(objectInfo.searchable),
        createable:
            Boolean(objectInfo.createable),
        updateable:
            Boolean(objectInfo.updateable),
        deletable:
            Boolean(objectInfo.deletable),
        accessible:
            Boolean(objectInfo.accessible),
        hasRecordTypes:
            Boolean(objectInfo.hasRecordTypes)
    };
}

function normalizeObjectContext(
    context = {}
) {
    return {
        apiName:
            context.apiName || '',
        label:
            context.label || '',
        pluralLabel:
            context.pluralLabel || '',
        keyPrefix:
            context.keyPrefix || '',
        custom:
            Boolean(context.custom),
        queryable:
            Boolean(context.queryable),
        searchable:
            Boolean(context.searchable),
        createable:
            Boolean(context.createable),
        updateable:
            Boolean(context.updateable),
        deletable:
            Boolean(context.deletable),
        accessible:
            Boolean(context.accessible),
        fieldCount:
            Number(context.fieldCount || 0),
        relationshipCount:
            Number(
                context.relationshipCount || 0
            ),
        recordTypeCount:
            Number(
                context.recordTypeCount || 0
            ),
        fields:
            Array.isArray(context.fields)
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

function normalizeFieldInfo(field = {}) {
    return {
        apiName:
            field.apiName || '',
        label:
            field.label || '',
        dataType:
            field.dataType || '',
        length:
            Number(field.length || 0),
        precision:
            Number(field.precision || 0),
        scale:
            Number(field.scale || 0),
        accessible:
            Boolean(field.accessible),
        createable:
            Boolean(field.createable),
        updateable:
            Boolean(field.updateable),
        required:
            Boolean(field.required),
        custom:
            Boolean(field.custom),
        calculated:
            Boolean(field.calculated),
        unique:
            Boolean(field.unique),
        externalId:
            Boolean(field.externalId),
        autoNumber:
            Boolean(field.autoNumber),
        relationshipName:
            field.relationshipName || '',
        referenceTo:
            Array.isArray(field.referenceTo)
                ? [...field.referenceTo]
                : []
    };
}

function normalizeRecordType(
    recordType = {}
) {
    return {
        recordTypeId:
            recordType.recordTypeId || '',
        name:
            recordType.name || '',
        developerName:
            recordType.developerName || '',
        available:
            Boolean(recordType.available),
        master:
            Boolean(recordType.master),
        defaultRecordType:
            Boolean(
                recordType.defaultRecordType
            )
    };
}

function createServiceError(
    message,
    error
) {
    const details =
        extractErrorMessage(error);

    const serviceError = new Error(
        details
            ? `${message} ${details}`
            : message
    );

    serviceError.originalError = error;

    return serviceError;
}

function extractErrorMessage(error) {
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
        Array.isArray(error.body) &&
        error.body.length
    ) {
        return error.body
            .map((item) => item.message)
            .filter(Boolean)
            .join(' ');
    }

    if (
        typeof error.message === 'string'
    ) {
        return error.message;
    }

    return DEFAULT_ERROR_MESSAGE;
}