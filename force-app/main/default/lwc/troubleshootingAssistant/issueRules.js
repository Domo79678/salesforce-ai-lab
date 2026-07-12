/*
 * issueRules.js
 *
 * Deterministic intelligence layer for the Salesforce Copilot
 * Troubleshooting Assistant.
 *
 * The parser identifies what kind of problem the user described.
 * This rules engine decides which diagnostic path should be used.
 */

import { ISSUE_TYPES } from './issueKeywords';

import {
    calculateConfidence,
    confidenceLabel,
    priority,
    estimatedResolution
} from './issueConfidence';

export const DIAGNOSIS_TYPES = Object.freeze({
    CLARIFICATION: 'clarification',
    FLOW_NOT_STARTING: 'flowNotStarting',
    FLOW_RUNTIME_FAILURE: 'flowRuntimeFailure',
    RECORD_CREATION_FAILURE: 'recordCreationFailure',
    RECORD_UPDATE_FAILURE: 'recordUpdateFailure',
    SAVE_BLOCKED: 'saveBlocked',
    ACCESS_DENIED: 'accessDenied',
    DUPLICATE_BLOCK: 'duplicateBlock',
    APPROVAL_FAILURE: 'approvalFailure',
    EMAIL_DELIVERY_FAILURE: 'emailDeliveryFailure',
    APEX_FAILURE: 'apexFailure',
    GOVERNOR_LIMIT_FAILURE: 'governorLimitFailure',
    INTEGRATION_FAILURE: 'integrationFailure',
    DATA_OPERATION_FAILURE: 'dataOperationFailure',
    REPORTING_FAILURE: 'reportingFailure',
    GENERAL_SALESFORCE_ISSUE: 'generalSalesforceIssue'
});

export function selectDiagnosis(
    parsedIssue = {},
    originalInput = ''
) {
    const normalizedInput =
        normalizeInput(originalInput);

    if (
        parsedIssue.requiresClarification ||
        parsedIssue.issueType ===
            ISSUE_TYPES.UNKNOWN
    ) {
        return buildDiagnosisResult({
            diagnosisType:
                DIAGNOSIS_TYPES.CLARIFICATION,
            matchedRule:
                'Insufficient issue details',
            parsedIssue,
            reasons: [
                'The issue description does not contain enough diagnostic detail.',
                'The affected Salesforce feature, symptom, or error message needs clarification.'
            ],
            recommendedContext: [
                'Exact error message',
                'Affected object',
                'Affected users',
                'Steps that reproduce the issue',
                'Whether the issue occurs in production or a sandbox'
            ]
        });
    }

    if (
        parsedIssue.issueType ===
            ISSUE_TYPES.FLOW_TRIGGER
    ) {
        return buildDiagnosisResult({
            diagnosisType:
                DIAGNOSIS_TYPES.FLOW_NOT_STARTING,
            matchedRule:
                'Flow trigger failure',
            parsedIssue,
            reasons: [
                'The issue indicates that automation never starts.',
                'Flow activation, entry criteria, trigger timing, and record changes should be checked first.'
            ],
            recommendedContext: [
                'Flow API name',
                'Flow version',
                'Triggering object',
                'Entry criteria',
                'Record values used during testing'
            ]
        });
    }

    if (
        parsedIssue.issueType ===
            ISSUE_TYPES.FLOW_RUNTIME
    ) {
        if (
            parsedIssue.symptom ===
                'Record creation failed'
        ) {
            return buildDiagnosisResult({
                diagnosisType:
                    DIAGNOSIS_TYPES
                        .RECORD_CREATION_FAILURE,
                matchedRule:
                    'Flow record-creation failure',
                parsedIssue,
                reasons: [
                    'The Flow starts but fails while creating a record.',
                    'Required fields, permissions, Validation Rules, Duplicate Rules, and fault handling are common causes.'
                ],
                recommendedContext: [
                    'Create Records element name',
                    'Target object',
                    'Fields being populated',
                    'Exact Flow error message',
                    'Running user permissions'
                ]
            });
        }

        if (
            parsedIssue.symptom ===
                'Record update failed'
        ) {
            return buildDiagnosisResult({
                diagnosisType:
                    DIAGNOSIS_TYPES
                        .RECORD_UPDATE_FAILURE,
                matchedRule:
                    'Flow record-update failure',
                parsedIssue,
                reasons: [
                    'The Flow starts but fails during an update operation.',
                    'Record access, field-level security, Validation Rules, locking, and automation conflicts should be reviewed.'
                ],
                recommendedContext: [
                    'Update Records element name',
                    'Target object',
                    'Fields being changed',
                    'Exact Flow error message',
                    'Record ownership and sharing'
                ]
            });
        }

        return buildDiagnosisResult({
            diagnosisType:
                DIAGNOSIS_TYPES
                    .FLOW_RUNTIME_FAILURE,
            matchedRule:
                'General Flow runtime failure',
            parsedIssue,
            reasons: [
                'The Flow starts but encounters an error during execution.',
                'Fault paths, data operations, permissions, and downstream automation should be reviewed.'
            ],
            recommendedContext: [
                'Flow error email',
                'Failed element',
                'Flow interview details',
                'Debug output',
                'Affected record ID'
            ]
        });
    }

    if (
        parsedIssue.issueType ===
            ISSUE_TYPES.VALIDATION ||
        parsedIssue.symptom ===
            'Record save is blocked'
    ) {
        return buildDiagnosisResult({
            diagnosisType:
                DIAGNOSIS_TYPES.SAVE_BLOCKED,
            matchedRule:
                'Validation or save-blocking issue',
            parsedIssue,
            reasons: [
                'The record cannot be saved successfully.',
                'Validation Rules, required fields, restricted picklists, and automation errors are likely causes.'
            ],
            recommendedContext: [
                'Exact save error',
                'Object and record type',
                'Fields being changed',
                'Active Validation Rules',
                'User profile and permission sets'
            ]
        });
    }

    if (
        parsedIssue.issueType ===
            ISSUE_TYPES.PERMISSION ||
        parsedIssue.symptom ===
            'User access is denied'
    ) {
        return buildDiagnosisResult({
            diagnosisType:
                DIAGNOSIS_TYPES.ACCESS_DENIED,
            matchedRule:
                'Permission or record-access issue',
            parsedIssue,
            reasons: [
                'The user cannot view, create, edit, or delete the intended Salesforce record or field.',
                'Object permissions, field-level security, sharing, ownership, and role hierarchy should be evaluated.'
            ],
            recommendedContext: [
                'Affected user',
                'Object and record ID',
                'Requested action',
                'Profile',
                'Permission sets',
                'Record owner'
            ]
        });
    }

    if (
        parsedIssue.issueType ===
            ISSUE_TYPES.DUPLICATE
    ) {
        return buildDiagnosisResult({
            diagnosisType:
                DIAGNOSIS_TYPES.DUPLICATE_BLOCK,
            matchedRule:
                'Duplicate-management issue',
            parsedIssue,
            reasons: [
                'Salesforce detected or blocked a possible duplicate.',
                'Matching Rules, Duplicate Rules, and allow-versus-block behavior should be reviewed.'
            ],
            recommendedContext: [
                'Object',
                'Matching Rule',
                'Duplicate Rule',
                'Fields used for matching',
                'Exact duplicate warning'
            ]
        });
    }

    if (
        parsedIssue.issueType ===
            ISSUE_TYPES.APPROVAL
    ) {
        return buildDiagnosisResult({
            diagnosisType:
                DIAGNOSIS_TYPES.APPROVAL_FAILURE,
            matchedRule:
                'Approval Process issue',
            parsedIssue,
            reasons: [
                'The record cannot enter or progress through an Approval Process.',
                'Entry criteria, approver routing, user permissions, and record locking should be checked.'
            ],
            recommendedContext: [
                'Approval Process name',
                'Record status',
                'Submitter',
                'Expected approver',
                'Entry criteria',
                'Approval history'
            ]
        });
    }

    if (
        parsedIssue.issueType ===
            ISSUE_TYPES.EMAIL
    ) {
        return buildDiagnosisResult({
            diagnosisType:
                DIAGNOSIS_TYPES
                    .EMAIL_DELIVERY_FAILURE,
            matchedRule:
                'Email or notification delivery issue',
            parsedIssue,
            reasons: [
                'An expected Salesforce email or notification was not received.',
                'Deliverability, recipient values, templates, Org-Wide Email Addresses, and automation execution should be reviewed.'
            ],
            recommendedContext: [
                'Recipient email address',
                'Email template',
                'Automation source',
                'Org-Wide Email Address',
                'Email log',
                'Deliverability setting'
            ]
        });
    }

    if (
        parsedIssue.issueType ===
            ISSUE_TYPES.APEX
    ) {
        if (
            containsAny(normalizedInput, [
                'governor limit',
                'too many soql',
                'too many dml',
                'cpu time limit',
                'heap size',
                'limit exception'
            ])
        ) {
            return buildDiagnosisResult({
                diagnosisType:
                    DIAGNOSIS_TYPES
                        .GOVERNOR_LIMIT_FAILURE,
                matchedRule:
                    'Apex governor-limit failure',
                parsedIssue,
                reasons: [
                    'The transaction exceeded a Salesforce platform resource limit.',
                    'SOQL, DML, CPU, heap usage, recursion, and bulkification should be analyzed.'
                ],
                recommendedContext: [
                    'Full exception message',
                    'Debug log',
                    'Trigger or class name',
                    'Number of records processed',
                    'SOQL and DML usage',
                    'Execution context'
                ]
            });
        }

        return buildDiagnosisResult({
            diagnosisType:
                DIAGNOSIS_TYPES.APEX_FAILURE,
            matchedRule:
                'Apex execution failure',
            parsedIssue,
            reasons: [
                'Custom Apex code encountered an exception.',
                'The stack trace, failing line, null handling, query behavior, and DML behavior should be reviewed.'
            ],
            recommendedContext: [
                'Exception message',
                'Stack trace',
                'Class or trigger name',
                'Failing line number',
                'Debug log',
                'Affected record IDs'
            ]
        });
    }

    if (
        parsedIssue.issueType ===
            ISSUE_TYPES.INTEGRATION
    ) {
        return buildDiagnosisResult({
            diagnosisType:
                DIAGNOSIS_TYPES.INTEGRATION_FAILURE,
            matchedRule:
                'Integration or API failure',
            parsedIssue,
            reasons: [
                'Salesforce could not complete communication with another system.',
                'Authentication, Named Credentials, endpoints, payloads, timeouts, and response handling should be reviewed.'
            ],
            recommendedContext: [
                'Endpoint',
                'HTTP status code',
                'Request payload',
                'Response body',
                'Named Credential',
                'Authentication method'
            ]
        });
    }

    if (
        parsedIssue.issueType ===
            ISSUE_TYPES.DATA
    ) {
        return buildDiagnosisResult({
            diagnosisType:
                DIAGNOSIS_TYPES
                    .DATA_OPERATION_FAILURE,
            matchedRule:
                'Data-management issue',
            parsedIssue,
            reasons: [
                'A data import, update, or cleanup operation produced failed or incorrect results.',
                'Field mapping, required fields, record ownership, lookup values, and automation side effects should be reviewed.'
            ],
            recommendedContext: [
                'Import file',
                'Failed-results file',
                'Object',
                'Field mappings',
                'External IDs',
                'Automation active during import'
            ]
        });
    }

    if (
        parsedIssue.issueType ===
            ISSUE_TYPES.REPORTING
    ) {
        return buildDiagnosisResult({
            diagnosisType:
                DIAGNOSIS_TYPES.REPORTING_FAILURE,
            matchedRule:
                'Report or dashboard issue',
            parsedIssue,
            reasons: [
                'A report or dashboard is missing data, showing unexpected results, or failing to refresh.',
                'Report type, filters, folder access, field visibility, and source data should be reviewed.'
            ],
            recommendedContext: [
                'Report name',
                'Report type',
                'Filters',
                'Expected records',
                'Running user',
                'Dashboard refresh status'
            ]
        });
    }

    return buildDiagnosisResult({
        diagnosisType:
            DIAGNOSIS_TYPES
                .GENERAL_SALESFORCE_ISSUE,
        matchedRule:
            'General Salesforce troubleshooting',
        parsedIssue,
        reasons: [
            'The issue contains enough information to begin troubleshooting but does not match a specialized diagnostic rule.',
            'The investigation should begin with reproduction steps, permissions, automation, and recent configuration changes.'
        ],
        recommendedContext: [
            'Exact error message',
            'Affected object',
            'Affected user',
            'Reproduction steps',
            'Recent configuration changes'
        ]
    });
}

export function explainDiagnosis(
    parsedIssue = {},
    originalInput = ''
) {
    const diagnosis =
        selectDiagnosis(
            parsedIssue,
            originalInput
        );

    return {
        diagnosisType:
            diagnosis.diagnosisType,

        matchedRule:
            diagnosis.matchedRule,

        confidence:
            diagnosis.confidence,

        confidenceLabel:
            diagnosis.confidenceLabel,

        priority:
            diagnosis.priority,

        estimatedResolution:
            diagnosis.estimatedResolution,

        reasons:
            [...diagnosis.reasons]
    };
}

function buildDiagnosisResult({
    diagnosisType,
    matchedRule,
    parsedIssue,
    reasons = [],
    recommendedContext = []
}) {
    const confidence =
        calculateConfidence(parsedIssue);

    const priorityLevel =
        priority(parsedIssue);

    return {
        diagnosisType,

        matchedRule,

        confidence,

        confidenceLabel:
            confidenceLabel(confidence),

        priority:
            priorityLevel,

        estimatedResolution:
            estimatedResolution(
                priorityLevel
            ),

        reasons,

        recommendedContext,

        parsedIssue
    };
}

function containsAny(
    input,
    keywords = []
) {
    return keywords.some(
        (keyword) =>
            input.includes(keyword)
    );
}

function normalizeInput(input = '') {
    return String(input)
        .trim()
        .toLowerCase()
        .replace(/[’‘]/g, "'")
        .replace(/\s+/g, ' ');
}