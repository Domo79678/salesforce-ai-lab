/*
 * dependencyResolvers.js
 *
 * Resolves Salesforce metadata into dependency candidates.
 *
 * This layer knows HOW to find metadata.
 * It does NOT calculate risk or build graphs.
 */

import {
    ENTITY_TYPES
} from './intelligenceModels';

import {
    createDependency
} from './dependencyUtilities';

import {
    getObjectContext,
    getOrgSummary
} from 'c/orgContextService';

/**
 * Entry point.
 */
export async function resolveDependencies(request = {}) {

    switch (request.entityType) {

        case ENTITY_TYPES.OBJECT:
            return resolveObject(request);

        case ENTITY_TYPES.FIELD:
            return resolveField(request);

        case ENTITY_TYPES.FLOW:
            return resolveFlow(request);

        case ENTITY_TYPES.APEX_CLASS:
            return resolveApexClass(request);

        case ENTITY_TYPES.VALIDATION_RULE:
            return resolveValidationRule(request);

        case ENTITY_TYPES.PERMISSION_SET:
            return resolvePermissionSet(request);

        case ENTITY_TYPES.DUPLICATE_RULE:
            return resolveDuplicateRule(request);

        case ENTITY_TYPES.RECORD_TYPE:
            return resolveRecordType(request);

        default:
            return [];
    }

}

/*
--------------------------------------------------
OBJECT
--------------------------------------------------
*/

async function resolveObject(request) {

    const context =
        await getObjectContext(
            request.apiName
        );

    const dependencies = [];

    dependencies.push(

        createDependency({

            id: request.apiName,

            label: context.label,

            apiName: context.apiName,

            type: ENTITY_TYPES.OBJECT,

            category: 'Metadata',

            relationship: 'Selected Object'

        })

    );

    if (context.fields) {

        context.fields.forEach(field => {

            dependencies.push(

                createDependency({

                    id:
                        `${context.apiName}.${field.apiName}`,

                    label: field.label,

                    apiName:
                        `${context.apiName}.${field.apiName}`,

                    type: ENTITY_TYPES.FIELD,

                    category: 'Field',

                    relationship:
                        'Contains'

                })

            );

        });

    }

    return dependencies;

}

/*
--------------------------------------------------
FIELD
--------------------------------------------------
*/

async function resolveField(request) {

    const pieces =
        request.apiName.split('.');

    if (pieces.length !== 2) {

        return [];

    }

    const context =
        await getObjectContext(
            pieces[0]
        );

    const field =
        context.fields.find(

            item =>
                item.apiName ===
                pieces[1]

        );

    if (!field) {

        return [];

    }

    return [

        createDependency({

            id: request.apiName,

            label: field.label,

            apiName: request.apiName,

            type: ENTITY_TYPES.FIELD,

            category: 'Field',

            relationship:
                'Selected Field'

        })

    ];

}

/*
--------------------------------------------------
FLOW
--------------------------------------------------
*/

async function resolveFlow(request) {

    return [

        createDependency({

            id: request.apiName,

            label:
                request.label ||
                request.apiName,

            apiName: request.apiName,

            type: ENTITY_TYPES.FLOW,

            category: 'Automation',

            relationship:
                'Selected Flow'

        })

    ];

}

/*
--------------------------------------------------
VALIDATION RULE
--------------------------------------------------
*/

async function resolveValidationRule(request) {

    return [

        createDependency({

            id: request.apiName,

            label:
                request.label ||
                request.apiName,

            apiName: request.apiName,

            type:
                ENTITY_TYPES.VALIDATION_RULE,

            category: 'Automation',

            relationship:
                'Selected Validation Rule'

        })

    ];

}

/*
--------------------------------------------------
APEX
--------------------------------------------------
*/

async function resolveApexClass(request) {

    return [

        createDependency({

            id: request.apiName,

            label:
                request.label ||
                request.apiName,

            apiName: request.apiName,

            type:
                ENTITY_TYPES.APEX_CLASS,

            category: 'Code',

            relationship:
                'Selected Apex Class'

        })

    ];

}

/*
--------------------------------------------------
PERMISSION SET
--------------------------------------------------
*/

async function resolvePermissionSet(request) {

    return [

        createDependency({

            id: request.apiName,

            label:
                request.label ||
                request.apiName,

            apiName: request.apiName,

            type:
                ENTITY_TYPES.PERMISSION_SET,

            category: 'Security',

            relationship:
                'Selected Permission Set'

        })

    ];

}

/*
--------------------------------------------------
DUPLICATE RULE
--------------------------------------------------
*/

async function resolveDuplicateRule(request) {

    return [

        createDependency({

            id: request.apiName,

            label:
                request.label ||
                request.apiName,

            apiName: request.apiName,

            type:
                ENTITY_TYPES.DUPLICATE_RULE,

            category: 'Data Quality',

            relationship:
                'Selected Duplicate Rule'

        })

    ];

}

/*
--------------------------------------------------
RECORD TYPE
--------------------------------------------------
*/

async function resolveRecordType(request) {

    return [

        createDependency({

            id: request.apiName,

            label:
                request.label ||
                request.apiName,

            apiName: request.apiName,

            type:
                ENTITY_TYPES.RECORD_TYPE,

            category: 'Configuration',

            relationship:
                'Selected Record Type'

        })

    ];

}

/*
--------------------------------------------------
ORG
--------------------------------------------------
*/

export async function resolveOrg() {

    return getOrgSummary();

}