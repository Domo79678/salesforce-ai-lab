/*
 * dependencyEngine.js
 *
 * Salesforce Copilot
 * Dependency Intelligence Engine
 *
 * This is the orchestration layer.
 *
 * Responsibilities:
 *  - Resolve metadata
 *  - Build dependency graph
 *  - Score graph
 *  - Return normalized analysis
 */

import {
    resolveDependencies
} from './dependencyResolvers';

import {
    buildDependencyGraph
} from './dependencyGraph';

import {
    scoreGraph
} from './dependencyScoring';

const ENGINE_VERSION = '1.0.0';

/*
--------------------------------------------------
Public API
--------------------------------------------------
*/

/**
 * Performs a complete dependency analysis.
 */
export async function analyzeDependencies(request = {}) {

    validateRequest(request);

    const resolvedDependencies =
        await resolveDependencies(request);

    const graph =
        buildDependencyGraph(
            request,
            resolvedDependencies
        );

    const scores =
        scoreGraph(graph);

    return {

        success: true,

        engineVersion:
            ENGINE_VERSION,

        timestamp:
            new Date().toISOString(),

        request,

        dependencyCount:
            graph.summary.total,

        graph,

        scores

    };

}

/*
--------------------------------------------------
Convenience Methods
--------------------------------------------------
*/

export async function analyzeObject(
    apiName
) {

    return analyzeDependencies({

        entityType: 'object',

        apiName

    });

}

export async function analyzeField(
    apiName
) {

    return analyzeDependencies({

        entityType: 'field',

        apiName

    });

}

export async function analyzeFlow(
    apiName
) {

    return analyzeDependencies({

        entityType: 'flow',

        apiName

    });

}

export async function analyzeValidationRule(
    apiName
) {

    return analyzeDependencies({

        entityType:
            'validationRule',

        apiName

    });

}

export async function analyzePermissionSet(
    apiName
) {

    return analyzeDependencies({

        entityType:
            'permissionSet',

        apiName

    });

}

export async function analyzeApexClass(
    apiName
) {

    return analyzeDependencies({

        entityType:
            'apexClass',

        apiName

    });

}

export async function analyzeDuplicateRule(
    apiName
) {

    return analyzeDependencies({

        entityType:
            'duplicateRule',

        apiName

    });

}

export async function analyzeRecordType(
    apiName
) {

    return analyzeDependencies({

        entityType:
            'recordType',

        apiName

    });

}

/*
--------------------------------------------------
Future API
--------------------------------------------------
*/

/**
 * Used by Explain This
 */
export async function explain(request) {

    return analyzeDependencies(request);

}

/**
 * Used by Change Impact
 */
export async function impact(request) {

    return analyzeDependencies(request);

}

/**
 * Used by Deployment Readiness
 */
export async function deployment(request) {

    return analyzeDependencies(request);

}

/**
 * Used by AI Recommendations
 */
export async function recommend(request) {

    return analyzeDependencies(request);

}

/*
--------------------------------------------------
Validation
--------------------------------------------------
*/

function validateRequest(
    request
) {

    if (!request) {

        throw new Error(
            'Dependency request is required.'
        );

    }

    if (!request.entityType) {

        throw new Error(
            'entityType is required.'
        );

    }

    if (!request.apiName) {

        throw new Error(
            'apiName is required.'
        );

    }

}

/*
--------------------------------------------------
Export
--------------------------------------------------
*/

export default {

    analyzeDependencies,

    analyzeObject,

    analyzeField,

    analyzeFlow,

    analyzeValidationRule,

    analyzePermissionSet,

    analyzeApexClass,

    analyzeDuplicateRule,

    analyzeRecordType,

    explain,

    impact,

    deployment,

    recommend

};