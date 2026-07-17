/*
 * analysisRunner.js
 *
 * Shared analysis orchestration for the Salesforce Copilot
 * Org Knowledge Viewer.
 *
 * The runner is now CRM-collector driven.
 *
 * Responsibilities:
 * - call the Salesforce Metadata Collector
 * - receive a normalized CRM snapshot
 * - pass that snapshot into the Org Knowledge Service
 * - combine collection coverage with intelligence results
 * - return one stable result contract to the viewer
 *
 * This file no longer retrieves Salesforce metadata directly.
 */

import {
    collectSalesforceMetadata,
    getPrimaryCollectorError
} from 'c/salesforceMetadataCollector';

import {
    analyzeOrgKnowledge
} from 'c/orgKnowledgeService';

const DEFAULT_ANALYSIS_MODE = 'full';
const DEFAULT_SCAN_MODE = 'Standard';

export async function runOrgKnowledgeAnalysis(
    options = {}
) {
    const startedAt =
        new Date().toISOString();

    const startedAtMilliseconds =
        Date.now();

    const scanMode =
        normalizeScanMode(
            options.scanMode ||
            options.collectionMode ||
            DEFAULT_SCAN_MODE
        );

    const warnings = [];
    const errors = [];

    try {
        /*
         * Salesforce-specific retrieval now lives entirely
         * inside salesforceMetadataCollector.
         */
        const collectionResult =
            await collectSalesforceMetadata({
                collectionMode:
                    scanMode,

                objectLimit:
                    options.objectLimit,

                batchSize:
                    options.batchSize,

                priorityObjects:
                    options.priorityObjects,

                continueOnError:
                    options.continueOnError !==
                    false,

                additionalMetadata:
                    options.additionalMetadata ||
                    {},

                collectionFlags:
                    options.collectionFlags ||
                    {},

                onProgress:
                    options.onProgress
            });

        if (
            !collectionResult ||
            !collectionResult.success
        ) {
            throw new Error(
                getPrimaryCollectorError(
                    collectionResult
                )
            );
        }

        warnings.push(
            ...normalizeArray(
                collectionResult.warnings
            )
        );

        const snapshot =
            collectionResult.snapshot;

        if (!snapshot) {
            throw new Error(
                'The Salesforce Metadata Collector completed without returning a normalized CRM snapshot.'
            );
        }

        /*
         * The shared knowledge engine is CRM-neutral.
         * It analyzes the normalized snapshot rather than
         * retrieving Salesforce metadata itself.
         */
        const rawAnalysisResult =
            analyzeOrgKnowledge(
                snapshot,
                {
                    analysisMode:
                        options.analysisMode ||
                        DEFAULT_ANALYSIS_MODE,

                    ruleOptions:
                        options.ruleOptions ||
                        {},

                    scoringOptions:
                        options.scoringOptions ||
                        {}
                }
            );

        if (
            !rawAnalysisResult ||
            !rawAnalysisResult.success
        ) {
            throw new Error(
                extractKnowledgeServiceError(
                    rawAnalysisResult
                )
            );
        }

        /*
         * Preserve the Org Knowledge result contract while
         * adding collector coverage and portability context.
         */
        const analysisResult = {
            ...rawAnalysisResult,

            provider:
                collectionResult.provider ||
                snapshot.provider ||
                'Salesforce',

            collectorVersion:
                collectionResult
                    .collectorVersion ||
                snapshot
                    ?.collector
                    ?.version ||
                '',

            metadataCoverage:
                collectionResult
                    .metadataCoverage ||
                snapshot.metadataCoverage ||
                null,

            collectionCapabilities:
                collectionResult
                    .capabilities ||
                snapshot.capabilities ||
                {},

            collectionLimitations:
                collectionResult
                    .limitations ||
                snapshot.limitations ||
                [],

            collectionPlanSummary:
                collectionResult
                    .collectionPlanSummary ||
                null
        };

        const completedAt =
            new Date().toISOString();

        const durationMilliseconds =
            Math.max(
                0,
                Date.now() -
                startedAtMilliseconds
            );

        return {
            success: true,

            /*
             * Preserve the names expected by
             * orgKnowledgeViewer.js.
             */
            scanMode:
                collectionResult
                    .collectionMode ||
                scanMode,

            collectionMode:
                collectionResult
                    .collectionMode ||
                scanMode,

            scanLimit:
                collectionResult
                    ?.coverage
                    ?.selectedObjectCount ||
                collectionResult
                    ?.selectedObjects
                    ?.length ||
                0,

            batchSize:
                options.batchSize ||
                null,

            provider:
                collectionResult.provider ||
                'Salesforce',

            organization:
                collectionResult.organization,

            objectInventory:
                normalizeArray(
                    collectionResult
                        .objectInventory
                ),

            selectedObjects:
                normalizeArray(
                    collectionResult
                        .selectedObjects
                ),

            detailedObjects:
                normalizeArray(
                    collectionResult
                        .detailedObjects
                ),

            connectedObjectNames:
                normalizeArray(
                    collectionResult
                        .connectedObjectNames
                ),

            analysisResult,

            snapshot,

            metadataCoverage:
                collectionResult
                    .metadataCoverage ||
                snapshot.metadataCoverage ||
                null,

            capabilities:
                collectionResult
                    .capabilities ||
                snapshot.capabilities ||
                {},

            limitations:
                normalizeArray(
                    collectionResult
                        .limitations ||
                    snapshot.limitations
                ),

            collectionPlan:
                normalizeArray(
                    collectionResult
                        .collectionPlan
                ),

            collectionPlanSummary:
                collectionResult
                    .collectionPlanSummary ||
                null,

            collectionFlags:
                collectionResult
                    .collectionFlags ||
                {},

            coverage:
                normalizeCoverage(
                    collectionResult.coverage
                ),

            timing: {
                startedAt:
                    collectionResult
                        ?.timing
                        ?.startedAt ||
                    startedAt,

                completedAt:
                    collectionResult
                        ?.timing
                        ?.completedAt ||
                    completedAt,

                durationMilliseconds:
                    Number(
                        collectionResult
                            ?.timing
                            ?.durationMilliseconds
                    ) ||
                    durationMilliseconds
            },

            warnings,

            errors
        };
    } catch (error) {
        const completedAt =
            new Date().toISOString();

        const normalizedError =
            normalizeError(
                error
            );

        errors.push(
            normalizedError
        );

        return {
            success: false,

            scanMode,

            collectionMode:
                scanMode,

            scanLimit: 0,

            batchSize:
                options.batchSize ||
                null,

            provider:
                'Salesforce',

            organization: null,

            objectInventory: [],

            selectedObjects: [],

            detailedObjects: [],

            connectedObjectNames: [],

            analysisResult: null,

            snapshot: null,

            metadataCoverage: null,

            capabilities: {},

            limitations: [],

            collectionPlan: [],

            collectionPlanSummary: null,

            collectionFlags: {},

            coverage:
                normalizeCoverage(),

            timing: {
                startedAt,

                completedAt,

                durationMilliseconds:
                    Math.max(
                        0,
                        Date.now() -
                        startedAtMilliseconds
                    )
            },

            warnings,

            errors
        };
    }
}

export function getPrimaryErrorMessage(
    runnerResult = {}
) {
    const errors =
        normalizeArray(
            runnerResult.errors
        );

    if (errors.length) {
        return (
            errors[0].message ||
            'The Org Knowledge analysis failed.'
        );
    }

    return 'The Org Knowledge analysis failed.';
}

export function extractKnowledgeServiceError(
    analysisResult = {}
) {
    const errors =
        normalizeArray(
            analysisResult?.errors
        );

    if (errors.length) {
        return (
            errors[0]?.message ||
            'The Org Knowledge Service returned an error.'
        );
    }

    return (
        analysisResult?.message ||
        'The Org Knowledge Service could not complete the analysis.'
    );
}

export function normalizeError(
    error
) {
    return {
        name:
            firstValue(
                error?.name,
                'OrgKnowledgeAnalysisError'
            ),

        message:
            getErrorMessage(
                error
            ),

        status:
            firstValue(
                error?.status,
                error?.body?.statusCode
            ),

        stack:
            firstValue(
                error?.stack
            )
    };
}

export function normalizeCoverage(
    coverage = {}
) {
    const source =
        coverage &&
        typeof coverage === 'object'
            ? coverage
            : {};

    return {
        inventoryObjectCount:
            toNumber(
                source.inventoryObjectCount
            ),

        selectedObjectCount:
            toNumber(
                source.selectedObjectCount
            ),

        detailedObjectCount:
            toNumber(
                source.detailedObjectCount
            ),

        successfulObjectCount:
            toNumber(
                source.successfulObjectCount
            ),

        failedObjectCount:
            toNumber(
                source.failedObjectCount
            ),

        fieldCount:
            toNumber(
                source.fieldCount
            ),

        relationshipCount:
            toNumber(
                source.relationshipCount
            ),

        recordTypeCount:
            toNumber(
                source.recordTypeCount
            ),

        completionPercentage:
            toNumber(
                source.completionPercentage
            )
    };
}

export function normalizeScanMode(
    value = DEFAULT_SCAN_MODE
) {
    const supportedModes = [
        'Quick',
        'Standard',
        'Extended',
        'Full'
    ];

    return supportedModes.includes(
        value
    )
        ? value
        : DEFAULT_SCAN_MODE;
}

function getErrorMessage(
    error
) {
    if (!error) {
        return 'An unknown Org Knowledge analysis error occurred.';
    }

    if (
        typeof error ===
        'string'
    ) {
        return error;
    }

    if (
        typeof error.message ===
        'string' &&
        error.message
    ) {
        return error.message;
    }

    if (
        error.body &&
        typeof error.body.message ===
            'string'
    ) {
        return error.body.message;
    }

    if (
        error.detail &&
        typeof error.detail ===
            'string'
    ) {
        return error.detail;
    }

    return 'The CRM metadata analysis could not be completed.';
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

function toNumber(
    value,
    fallback = 0
) {
    const numberValue =
        Number(value);

    return Number.isFinite(
        numberValue
    )
        ? numberValue
        : fallback;
}

function normalizeArray(
    value
) {
    return Array.isArray(value)
        ? [...value]
        : [];
}

const analysisRunner = {
    runOrgKnowledgeAnalysis,
    getPrimaryErrorMessage,
    extractKnowledgeServiceError,
    normalizeError,
    normalizeCoverage,
    normalizeScanMode
};

export default analysisRunner;