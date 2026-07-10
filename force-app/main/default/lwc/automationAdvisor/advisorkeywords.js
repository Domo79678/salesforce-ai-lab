/*
 * advisorKeywords.js
 *
 * Shared keyword library for Automation Advisor and future
 * Salesforce Copilot modules.
 */

export const OBJECT_KEYWORDS = [
    // More specific business objects must appear before generic terms.
    {
        value: 'Opportunity',
        keywords: ['opportunity', 'opportunities']
    },
    {
        value: 'Account',
        keywords: ['account', 'accounts']
    },
    {
        value: 'Contact',
        keywords: ['contact', 'contacts']
    },
    {
        value: 'Lead',
        keywords: ['lead', 'leads']
    },
    {
        value: 'Case',
        keywords: ['case', 'cases']
    },
    {
        value: 'Campaign',
        keywords: ['campaign', 'campaigns']
    },
    {
        value: 'Order',
        keywords: ['order', 'orders']
    },
    {
        value: 'Contract',
        keywords: ['contract', 'contracts']
    },
    {
        value: 'Asset',
        keywords: ['asset', 'assets']
    },
    {
        value: 'Product',
        keywords: ['product', 'products']
    },
    {
        value: 'Quote',
        keywords: ['quote', 'quotes']
    },
    {
        value: 'Invoice',
        keywords: ['invoice', 'invoices']
    },
    {
        value: 'Task',
        keywords: ['task', 'tasks']
    },
    {
        value: 'User',
        keywords: ['user', 'users']
    },
    {
        value: 'Member or Contact',
        keywords: ['member', 'members']
    },
    {
        value: 'Certification',
        keywords: ['certification', 'certifications']
    },

    // Event remains last because the word "event" can describe
    // architecture rather than the Salesforce Event object.
    {
        value: 'Event',
        keywords: ['calendar event', 'salesforce event record']
    }
];

export const TRIGGER_KEYWORDS = {
    creation: [
        'when created',
        'when a record is created',
        'on creation',
        'new record',
        'record is created',
        'after creation'
    ],

    update: [
        'when updated',
        'when a record is updated',
        'record is updated',
        'is changed',
        'changes to',
        'status changes',
        'field changes',
        'when changed'
    ],

    scheduled: [
        'daily',
        'every day',
        'weekly',
        'every week',
        'nightly',
        'every night',
        'monthly',
        'every month',
        'hourly',
        'every hour',
        'scheduled',
        'schedule',
        'recurring',
        'overnight',
        'each morning',
        'every morning'
    ],

    userAction: [
        'button',
        'quick action',
        'user clicks',
        'users click',
        'one click',
        'single click',
        'launch from record',
        'record page action'
    ],

    platformEvent: [
        'publish event',
        'publish an event',
        'platform event',
        'event-driven',
        'event driven',
        'event bus',
        'subscriber',
        'subscribers'
    ]
};

export const TIMING_KEYWORDS = {
    beforeSave: [
        'before save',
        'before-save',
        'before the record saves',
        'fast field update',
        'fast field updates'
    ],

    afterSave: [
        'after save',
        'after-save',
        'after the record saves',
        'after the record is saved'
    ],

    scheduled: [
        'daily',
        'every day',
        'weekly',
        'every week',
        'nightly',
        'every night',
        'monthly',
        'every month',
        'hourly',
        'every hour',
        'scheduled',
        'recurring',
        'overnight'
    ],

    immediate: [
        'immediately',
        'real time',
        'real-time',
        'right away',
        'as soon as'
    ],

    userInitiated: [
        'button',
        'quick action',
        'user clicks',
        'users click',
        'one click',
        'single click',
        'guided process',
        'step by step',
        'step-by-step'
    ],

    asynchronous: [
        'publish event',
        'publish an event',
        'platform event',
        'asynchronously',
        'asynchronous',
        'event-driven',
        'event driven'
    ]
};

export const OUTCOME_KEYWORDS = {
    create: [
        'create',
        'creates',
        'creating',
        'generate a record'
    ],

    update: [
        'update',
        'updates',
        'updating',
        'populate',
        'populates',
        'set field',
        'set a field',
        'change field'
    ],

    notify: [
        'email',
        'send email',
        'notify',
        'notifies',
        'notification',
        'notifications',
        'alert'
    ],

    prevent: [
        'prevent',
        'block',
        'stop users from',
        'cannot save',
        "can't save",
        'can’t save',
        'do not allow',
        'prevent save',
        'block save'
    ],

    approval: [
        'approve',
        'approval',
        'authorization',
        'authorize',
        'sign off',
        'sign-off',
        'manager review'
    ],

    calculate: [
        'calculate',
        'calculated',
        'display',
        'derive',
        'derived',
        'number of days',
        'days until'
    ],

    duplicate: [
        'duplicate',
        'duplicates',
        'matching rule',
        'same email address',
        'same phone number'
    ],

    rollup: [
        'count related',
        'count child',
        'sum child',
        'sum related',
        'aggregate related',
        'roll up',
        'roll-up',
        'rollup'
    ],

    publishEvent: [
        'publish event',
        'publish an event',
        'platform event',
        'event bus'
    ],

    collectInformation: [
        'collect information',
        'collect details',
        'collect customer details',
        'collect user input',
        'gather information',
        'gather details'
    ],

    guideUser: [
        'guide a user',
        'guide users',
        'guide a service agent',
        'guided process',
        'guided experience',
        'step by step',
        'step-by-step',
        'walk through'
    ],

    reuseLogic: [
        'reuse',
        'reusable',
        'shared logic',
        'common logic',
        'multiple flows',
        'across multiple flows',
        'notification logic'
    ],

    integration: [
        'external system',
        'api',
        'callout',
        'integration',
        'web service'
    ]
};

export const INTERACTION_KEYWORDS = {
    guided: [
        'screen flow',
        'screen',
        'wizard',
        'guide',
        'guided',
        'guided process',
        'guided experience',
        'guided form',
        'step by step',
        'step-by-step',
        'walk through',
        'collect information',
        'collect details',
        'collect customer details',
        'collect user input',
        'user enters',
        'users enter',
        'multiple screens',
        'conditional questions',
        'interactive form',
        'service agent'
    ],

    userInitiated: [
        'button',
        'quick action',
        'user clicks',
        'users click',
        'one click',
        'single click',
        'record page action'
    ]
};

export const VOLUME_KEYWORDS = {
    high: [
        'millions',
        'millions of records',
        'high volume',
        'high-volume',
        'large volume',
        'large-volume'
    ],

    medium: [
        'bulk',
        'thousands',
        'thousands of records'
    ],

    low: [
        'single record',
        'one record'
    ]
};

export const APPROVAL_KEYWORDS = [
    'approval',
    'approve',
    'approved',
    'approver',
    'authorization',
    'authorize',
    'sign off',
    'sign-off',
    'manager review',
    'manager approval',
    'supervisor approval',
    'director approval',
    'formal review',
    'submit for approval',
    'reject',
    'rejection'
];

export const INTEGRATION_KEYWORDS = [
    'external system',
    'external service',
    'api',
    'api callout',
    'api integration',
    'callout',
    'integration',
    'web service',
    'rest api',
    'soap api'
];

export const MEANINGFUL_REQUIREMENT_KEYWORDS = [
    'when',
    'create',
    'update',
    'change',
    'populate',
    'prevent',
    'block',
    'approve',
    'approval',
    'notify',
    'email',
    'alert',
    'daily',
    'weekly',
    'nightly',
    'monthly',
    'every',
    'calculate',
    'display',
    'duplicate',
    'screen',
    'guide',
    'guided',
    'wizard',
    'step by step',
    'step-by-step',
    'collect',
    'button',
    'quick action',
    'api',
    'callout',
    'flow',
    'count',
    'sum',
    'publish',
    'schedule',
    'before save',
    'after save',
    'reuse',
    'reusable',
    'shared logic',
    'multiple flows',
    'external system',
    'platform event',
    'roll-up',
    'rollup',
    'formula'
];