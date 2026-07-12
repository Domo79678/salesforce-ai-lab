/*
 * issueKeywords.js
 *
 * Shared keyword library for the Salesforce Copilot
 * Troubleshooting Assistant.
 *
 * These keyword groups help classify a user's issue
 * without requiring generative AI.
 */

export const ISSUE_TYPES = {
    FLOW_TRIGGER: 'FLOW_TRIGGER',
    FLOW_RUNTIME: 'FLOW_RUNTIME',
    VALIDATION: 'VALIDATION',
    PERMISSION: 'PERMISSION',
    DUPLICATE: 'DUPLICATE',
    APPROVAL: 'APPROVAL',
    EMAIL: 'EMAIL',
    APEX: 'APEX',
    INTEGRATION: 'INTEGRATION',
    DATA: 'DATA',
    REPORTING: 'REPORTING',
    UNKNOWN: 'UNKNOWN'
};

export const OBJECT_KEYWORDS = [
    ['opportunity', 'Opportunity'],
    ['account', 'Account'],
    ['contact', 'Contact'],
    ['lead', 'Lead'],
    ['case', 'Case'],
    ['campaign', 'Campaign'],
    ['task', 'Task'],
    ['event', 'Event'],
    ['user', 'User'],
    ['order', 'Order'],
    ['contract', 'Contract'],
    ['asset', 'Asset'],
    ['product', 'Product'],
    ['quote', 'Quote'],
    ['invoice', 'Invoice'],
    ['member', 'Member or Contact'],
    ['certification', 'Certification']
];

export const FLOW_TRIGGER_KEYWORDS = [
    'flow did not fire',
    'flow does not fire',
    'flow never fired',
    'flow never starts',
    'flow did not start',
    'flow not triggering',
    'flow is not triggering',
    'flow will not trigger',
    'automation did not run',
    'automation not running',
    'record-triggered flow',
    'entry criteria',
    'trigger condition'
];

export const FLOW_RUNTIME_KEYWORDS = [
    'flow failed',
    'flow error',
    'flow fault',
    'unhandled fault',
    'failed to create',
    'failed to update',
    'failed when creating',
    'failed when updating',
    'cannot create record',
    'cannot update record',
    'error element',
    'fault path',
    'flow interview failed',
    'transaction rolled back'
];

export const VALIDATION_KEYWORDS = [
    'validation rule',
    'cannot save',
    "can't save",
    'cant save',
    'record will not save',
    'required field',
    'invalid value',
    'field is required',
    'picklist value',
    'restricted picklist',
    'cross-object validation',
    'error message when saving'
];

export const PERMISSION_KEYWORDS = [
    'permission',
    'profile',
    'permission set',
    'field-level security',
    'field level security',
    'object permission',
    'record access',
    'insufficient privileges',
    'insufficient access',
    'cannot edit',
    'cannot view',
    'cannot delete',
    'not visible',
    'sharing rule',
    'organization-wide default',
    'owd',
    'role hierarchy'
];

export const DUPLICATE_KEYWORDS = [
    'duplicate',
    'duplicate rule',
    'matching rule',
    'possible duplicate',
    'duplicate detected',
    'record already exists',
    'duplicate record',
    'blocked as duplicate'
];

export const APPROVAL_KEYWORDS = [
    'approval process',
    'approval',
    'submit for approval',
    'cannot submit',
    'approver',
    'approval request',
    'record locked',
    'rejection',
    'recall approval',
    'approval criteria'
];

export const EMAIL_KEYWORDS = [
    'email did not send',
    'email not sent',
    'email failed',
    'email alert',
    'email notification',
    'deliverability',
    'org-wide email',
    'org wide email',
    'email template',
    'recipient did not receive',
    'no email received'
];

export const APEX_KEYWORDS = [
    'apex',
    'trigger failed',
    'apex trigger',
    'null pointer',
    'nullpointerexception',
    'limit exception',
    'governor limit',
    'too many soql',
    'too many dml',
    'cpu time limit',
    'heap size',
    'maximum trigger depth',
    'recursion',
    'dml exception',
    'query exception'
];

export const INTEGRATION_KEYWORDS = [
    'api',
    'integration',
    'callout',
    'external system',
    'named credential',
    'remote site',
    'authentication failed',
    'unauthorized',
    'timeout',
    'endpoint',
    'json',
    'web service',
    'connected app',
    'oauth',
    'token expired'
];

export const DATA_KEYWORDS = [
    'data import',
    'data loader',
    'import failed',
    'missing records',
    'incorrect data',
    'data quality',
    'mass update',
    'bulk update',
    'csv',
    'mapping error',
    'lookup not found',
    'record ownership',
    'failed records'
];

export const REPORTING_KEYWORDS = [
    'report',
    'dashboard',
    'report missing records',
    'report is wrong',
    'dashboard not refreshing',
    'report filter',
    'row-level formula',
    'summary formula',
    'report type',
    'cannot see field in report',
    'report access'
];

export const SYMPTOM_KEYWORDS = {
    neverRuns: [
        'never runs',
        'never starts',
        'did not fire',
        'does not fire',
        'not triggering'
    ],

    saveBlocked: [
        'cannot save',
        "can't save",
        'cant save',
        'save failed',
        'record will not save'
    ],

    accessDenied: [
        'insufficient access',
        'insufficient privileges',
        'cannot edit',
        'cannot view',
        'not visible'
    ],

    recordCreationFailed: [
        'failed to create',
        'cannot create',
        'create record failed'
    ],

    recordUpdateFailed: [
        'failed to update',
        'cannot update',
        'update record failed'
    ],

    notificationFailed: [
        'email did not send',
        'email not sent',
        'notification not received'
    ],

    integrationFailure: [
        'api failed',
        'callout failed',
        'authentication failed',
        'timeout',
        'unauthorized'
    ]
};

export const SEVERITY_KEYWORDS = {
    critical: [
        'all users',
        'entire organization',
        'production down',
        'business stopped',
        'cannot work',
        'system unavailable',
        'data loss'
    ],

    high: [
        'multiple users',
        'many users',
        'major process',
        'blocking',
        'cannot complete'
    ],

    medium: [
        'some users',
        'intermittent',
        'sometimes',
        'specific records'
    ],

    low: [
        'one user',
        'minor',
        'cosmetic',
        'inconvenience'
    ]
};

export const TIMING_KEYWORDS = {
    afterCreate: [
        'after creation',
        'after create',
        'when created',
        'new record'
    ],

    afterUpdate: [
        'after update',
        'when updated',
        'record changed',
        'status changed'
    ],

    beforeSave: [
        'before save',
        'before the record saves',
        'fast field update'
    ],

    scheduled: [
        'daily',
        'weekly',
        'nightly',
        'monthly',
        'scheduled'
    ],

    userInitiated: [
        'button',
        'quick action',
        'user clicks',
        'screen flow'
    ]
};

export const MEANINGFUL_ISSUE_KEYWORDS = [
    'flow',
    'error',
    'failed',
    'failure',
    'cannot',
    "can't",
    'cant',
    'not working',
    'does not',
    'did not',
    'missing',
    'blocked',
    'permission',
    'validation',
    'duplicate',
    'approval',
    'email',
    'apex',
    'trigger',
    'api',
    'integration',
    'report',
    'dashboard',
    'record',
    'field',
    'user'
];