/*
 * advisorRules.js
 *
 * Deterministic recommendation rules for Automation Advisor.
 *
 * Specific solutions are evaluated before the general
 * Record-Triggered Flow fallback.
 */

export const RECOMMENDATION_TYPES = Object.freeze({
    CLARIFICATION: 'clarification',
    DUPLICATE_MANAGEMENT: 'duplicateManagement',
    ROLLUP_SUMMARY: 'rollupSummary',
    FORMULA_FIELD: 'formulaField',
    PLATFORM_EVENT: 'platformEvent',
    APPROVAL_PROCESS: 'approvalProcess',
    VALIDATION_RULE: 'validationRule',
    QUICK_ACTION: 'quickAction',
    SCREEN_FLOW: 'screenFlow',
    SCHEDULE_TRIGGERED_FLOW: 'scheduleTriggeredFlow',
    BEFORE_SAVE_FLOW: 'beforeSaveFlow',
    SUBFLOW: 'subflow',
    INVOCABLE_APEX: 'invocableApex',
    RECORD_TRIGGERED_FLOW: 'recordTriggeredFlow'
});

export function selectRecommendationType(
    input = '',
    parsedRequirement = {},
    isTooVague = false
) {
    const normalizedInput = normalizeInput(input);

    if (isTooVague) {
        return buildRuleResult({
            type: RECOMMENDATION_TYPES.CLARIFICATION,
            matchedRule: 'Requirement clarification',
            confidence: 45,
            reasons: [
                'The requirement does not contain enough detail.',
                'The trigger, object, or expected outcome needs clarification.'
            ]
        });
    }

    if (matchesDuplicateScenario(normalizedInput)) {
        return buildRuleResult({
            type:
                RECOMMENDATION_TYPES
                    .DUPLICATE_MANAGEMENT,
            matchedRule:
                'Duplicate-management keywords',
            confidence: 95,
            reasons: [
                'The requirement references duplicates or matching behavior.',
                'Salesforce provides native Matching Rules and Duplicate Rules.'
            ]
        });
    }

    if (matchesRollupScenario(normalizedInput)) {
        return buildRuleResult({
            type:
                RECOMMENDATION_TYPES
                    .ROLLUP_SUMMARY,
            matchedRule:
                'Related-record aggregation keywords',
            confidence: 91,
            reasons: [
                'The requirement describes counting, summing, or aggregating related records.',
                'A Roll-Up Summary Field may provide a native declarative solution.'
            ]
        });
    }

    if (matchesFormulaScenario(normalizedInput)) {
        return buildRuleResult({
            type:
                RECOMMENDATION_TYPES
                    .FORMULA_FIELD,
            matchedRule:
                'Dynamic-calculation keywords',
            confidence: 94,
            reasons: [
                'The requirement describes a dynamically calculated value.',
                'The result appears intended for display rather than permanent storage.'
            ]
        });
    }

    if (
        matchesPlatformEventScenario(
            normalizedInput
        )
    ) {
        return buildRuleResult({
            type:
                RECOMMENDATION_TYPES
                    .PLATFORM_EVENT,
            matchedRule:
                'Event-driven architecture keywords',
            confidence: 87,
            reasons: [
                'The requirement describes asynchronous or loosely coupled communication.',
                'Multiple systems or subscribers may respond independently.'
            ]
        });
    }

    if (
        matchesApprovalScenario(normalizedInput) ||
        parsedRequirement.approvalRequired === true
    ) {
        return buildRuleResult({
            type:
                RECOMMENDATION_TYPES
                    .APPROVAL_PROCESS,
            matchedRule:
                'Formal approval keywords',
            confidence: 91,
            reasons: [
                'The requirement includes formal review or authorization.',
                'Approval history and approve/reject actions may be required.'
            ]
        });
    }

    if (matchesValidationScenario(normalizedInput)) {
        return buildRuleResult({
            type:
                RECOMMENDATION_TYPES
                    .VALIDATION_RULE,
            matchedRule:
                'Save-prevention keywords',
            confidence: 92,
            reasons: [
                'The requirement focuses on blocking invalid data.',
                'A Validation Rule provides immediate feedback during save.'
            ]
        });
    }

    /*
     * Reusable Subflow is checked before generic Flow,
     * notification, and record-triggered behavior.
     */
    if (matchesSubflowScenario(normalizedInput)) {
        return buildRuleResult({
            type:
                RECOMMENDATION_TYPES.SUBFLOW,
            matchedRule:
                'Reusable automation keywords',
            confidence: 90,
            reasons: [
                'The requirement describes logic shared by multiple Flows.',
                'A Subflow centralizes reusable declarative automation.'
            ]
        });
    }

    /*
     * Screen Flow must be evaluated before Quick Action
     * because guided processes may also be launched by buttons.
     */
    if (
        matchesScreenFlowScenario(
            normalizedInput
        ) ||
        parsedRequirement.interaction ===
            'Guided user interaction required'
    ) {
        return buildRuleResult({
            type:
                RECOMMENDATION_TYPES
                    .SCREEN_FLOW,
            matchedRule:
                'Guided-interaction keywords',
            confidence: 93,
            reasons: [
                'The requirement includes guided user interaction.',
                'Multiple screens, branching, or information collection may be required.'
            ]
        });
    }

    if (matchesQuickActionScenario(normalizedInput)) {
        return buildRuleResult({
            type:
                RECOMMENDATION_TYPES
                    .QUICK_ACTION,
            matchedRule:
                'Quick Action keywords',
            confidence: 89,
            reasons: [
                'The requirement is explicitly user initiated.',
                'The task should be available directly from the Salesforce interface.'
            ]
        });
    }

    if (
        matchesScheduledScenario(
            normalizedInput
        ) ||
        parsedRequirement.trigger ===
            'Scheduled execution'
    ) {
        return buildRuleResult({
            type:
                RECOMMENDATION_TYPES
                    .SCHEDULE_TRIGGERED_FLOW,
            matchedRule:
                'Scheduled-execution keywords',
            confidence: 90,
            reasons: [
                'The requirement describes recurring processing.',
                'The process does not depend on an immediate record change.'
            ]
        });
    }

    if (
        matchesBeforeSaveScenario(
            normalizedInput
        ) ||
        parsedRequirement.timing ===
            'Before Save'
    ) {
        return buildRuleResult({
            type:
                RECOMMENDATION_TYPES
                    .BEFORE_SAVE_FLOW,
            matchedRule:
                'Before-save field-update keywords',
            confidence: 95,
            reasons: [
                'The requirement updates fields on the triggering record.',
                'Before-save Flow is optimized for fast field updates.'
            ]
        });
    }

    if (
        matchesApexScenario(normalizedInput) ||
        parsedRequirement.integrationRequired ===
            true ||
        parsedRequirement.volume === 'High'
    ) {
        return buildRuleResult({
            type:
                RECOMMENDATION_TYPES
                    .INVOCABLE_APEX,
            matchedRule:
                'Advanced logic, integration, or scale keywords',
            confidence:
                calculateApexConfidence(
                    normalizedInput,
                    parsedRequirement
                ),
            reasons: [
                'The requirement suggests integration, scale, or complex transaction control.',
                'Invocable Apex can provide reusable logic while Flow handles orchestration.'
            ]
        });
    }

    return buildRuleResult({
        type:
            RECOMMENDATION_TYPES
                .RECORD_TRIGGERED_FLOW,
        matchedRule:
            'Default record-automation recommendation',
        confidence: 94,
        reasons: [
            'The requirement describes an automated response to a business event.',
            'No more specialized recommendation rule matched the requirement.'
        ]
    });
}

export function matchesDuplicateScenario(input = '') {
    return includesAny(normalizeInput(input), [
        'duplicate',
        'duplicates',
        'duplicate contact',
        'duplicate contacts',
        'duplicate account',
        'duplicate accounts',
        'duplicate lead',
        'duplicate leads',
        'duplicate record',
        'duplicate records',
        'duplicate rule',
        'duplicate rules',
        'matching rule',
        'matching rules',
        'same email address',
        'same phone number',
        'potential duplicate',
        'prevent duplicates',
        'detect duplicates',
        'merge duplicates'
    ]);
}

export function matchesRollupScenario(input = '') {
    return includesAny(normalizeInput(input), [
        'roll up',
        'roll-up',
        'rollup',
        'roll-up summary',
        'rollup summary',
        'sum child',
        'sum related',
        'sum related records',
        'count child',
        'count children',
        'count related',
        'count related records',
        'total related',
        'total child',
        'aggregate child',
        'aggregate related',
        'minimum child',
        'maximum child',
        'min child',
        'max child'
    ]);
}

export function matchesFormulaScenario(input = '') {
    const normalizedInput = normalizeInput(input);

    const containsFormulaLanguage =
        includesAny(normalizedInput, [
            'formula field',
            'calculated field',
            'calculate a value',
            'calculate and display',
            'display a calculated',
            'display calculated',
            'derive a value',
            'derived value',
            'number of days',
            'days until',
            'days remaining',
            'difference between dates',
            'date difference',
            'calculate percentage',
            'display percentage',
            'calculate age',
            'display age',
            'calculate duration',
            'display duration',
            'concatenate fields',
            'combine field values',
            'show a value based on',
            'display a value based on',
            'automatically calculate'
        ]);

    const requiresStoredAutomation =
        includesAny(normalizedInput, [
            'store the value',
            'save the value',
            'write the value',
            'persist the value',
            'update the field',
            'populate a stored field',
            'save the calculation',
            'store the calculation',
            'historical value',
            'snapshot value'
        ]);

    return (
        containsFormulaLanguage &&
        !requiresStoredAutomation
    );
}

export function matchesPlatformEventScenario(
    input = ''
) {
    return includesAny(normalizeInput(input), [
        'platform event',
        'platform events',
        'event-driven',
        'event driven',
        'publish event',
        'publish an event',
        'subscribe to event',
        'subscriber',
        'subscribers',
        'event subscriber',
        'decoupled integration',
        'loosely coupled',
        'asynchronous event',
        'respond asynchronously',
        'multiple systems can respond',
        'multiple subscribers',
        'event bus',
        'replay event'
    ]);
}

export function matchesApprovalScenario(input = '') {
    return includesAny(normalizeInput(input), [
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
        'executive approval',
        'formal review',
        'submit for approval',
        'reject',
        'rejection',
        'approval history',
        'approval routing'
    ]);
}

export function matchesValidationScenario(
    input = ''
) {
    return includesAny(normalizeInput(input), [
        'prevent',
        'block',
        'stop users from',
        'cannot save',
        "can't save",
        'can’t save',
        'must enter',
        'must provide',
        'required before save',
        'require before save',
        'do not allow',
        'should not save',
        'prevent save',
        'block save',
        'invalid data',
        'validation rule',
        'display an error',
        'show an error',
        'error message when'
    ]);
}

export function matchesSubflowScenario(input = '') {
    return includesAny(normalizeInput(input), [
        'subflow',
        'sub-flow',
        'reuse flow logic',
        'reuse the same logic',
        'reuse the same notification logic',
        'reuse notification logic',
        'reuse logic across multiple flows',
        'reuse the same logic across multiple flows',
        'shared flow logic',
        'shared automation logic',
        'shared notification logic',
        'common flow logic',
        'common automation logic',
        'common notification logic',
        'multiple flows need',
        'multiple flows use',
        'multiple flows share',
        'across multiple flows',
        'used across multiple flows',
        'reusable automation',
        'reusable flow',
        'reusable logic',
        'centralize flow logic',
        'centralize automation logic',
        'avoid duplicate flow logic',
        'notification logic across multiple flows'
    ]);
}

export function matchesScreenFlowScenario(
    input = ''
) {
    return includesAny(normalizeInput(input), [
        'screen flow',
        'wizard',
        'guided process',
        'guided experience',
        'guided form',
        'guide a user',
        'guide users',
        'guide a service agent',
        'guide an agent',
        'step-by-step',
        'step by step',
        'walk through',
        'collect information',
        'collect details',
        'collect customer details',
        'collect user input',
        'gather information',
        'gather details',
        'user enters',
        'users enter',
        'multiple screens',
        'conditional questions',
        'interactive form',
        'guided case creation',
        'guided record creation',
        'service agent through'
    ]);
}

export function matchesQuickActionScenario(
    input = ''
) {
    return includesAny(normalizeInput(input), [
        'quick action',
        'quick actions',
        'button',
        'one click',
        'single click',
        'user clicks',
        'users click',
        'click a button',
        'launch from record',
        'record page action',
        'global action',
        'object-specific action',
        'contextual action',
        'action button'
    ]);
}

export function matchesScheduledScenario(
    input = ''
) {
    return includesAny(normalizeInput(input), [
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
        'on a recurring basis',
        'at midnight',
        'overnight',
        'each morning',
        'every morning'
    ]);
}

export function matchesBeforeSaveScenario(
    input = ''
) {
    const normalizedInput = normalizeInput(input);

    const hasBeforeSaveLanguage =
        includesAny(normalizedInput, [
            'before save',
            'before-save',
            'before the record saves',
            'fast field update',
            'fast field updates',
            'populate field before save',
            'populate a field before save',
            'normalize field',
            'normalize a field',
            'normalize the',
            'standardize field',
            'standardize a field',
            'set field before save',
            'update same record before save',
            'update the triggering record',
            'update fields on the same record'
        ]);

    const requiresAfterSaveAction =
        includesAny(normalizedInput, [
            'create related record',
            'create a related record',
            'send email',
            'send notification',
            'post to chatter',
            'submit for approval',
            'call apex',
            'callout',
            'external system'
        ]);

    return (
        hasBeforeSaveLanguage &&
        !requiresAfterSaveAction
    );
}

export function matchesApexScenario(input = '') {
    return includesAny(normalizeInput(input), [
        'external system',
        'external service',
        'api callout',
        'api integration',
        'callout',
        'web service',
        'rest api',
        'soap api',
        'complex calculation',
        'advanced calculation',
        'advanced transaction',
        'transaction control',
        'custom code',
        'apex',
        'invocable apex',
        'millions of records',
        'large volume',
        'high volume',
        'high-volume',
        'governor limits',
        'complex integration',
        'multiple transactions',
        'custom retry logic',
        'advanced error handling'
    ]);
}

export function explainRuleMatch(
    input = '',
    parsedRequirement = {},
    isTooVague = false
) {
    const result = selectRecommendationType(
        input,
        parsedRequirement,
        isTooVague
    );

    return {
        recommendationType: result.type,
        matchedRule: result.matchedRule,
        confidence: result.confidence,
        reasons: [...result.reasons]
    };
}

function calculateApexConfidence(
    input,
    parsedRequirement
) {
    let confidence = 82;

    if (
        parsedRequirement.integrationRequired ===
            true ||
        includesAny(input, [
            'external system',
            'api callout',
            'callout',
            'web service'
        ])
    ) {
        confidence += 4;
    }

    if (
        parsedRequirement.volume === 'High' ||
        includesAny(input, [
            'millions of records',
            'large volume',
            'high volume',
            'high-volume'
        ])
    ) {
        confidence += 4;
    }

    if (
        includesAny(input, [
            'advanced transaction',
            'transaction control',
            'complex calculation',
            'custom retry logic'
        ])
    ) {
        confidence += 3;
    }

    return Math.min(confidence, 95);
}

function buildRuleResult({
    type,
    matchedRule,
    confidence,
    reasons = []
}) {
    return {
        type,
        matchedRule,
        confidence,
        reasons
    };
}

function includesAny(input, phrases = []) {
    return phrases.some((phrase) =>
        input.includes(phrase)
    );
}

function normalizeInput(input = '') {
    return String(input)
        .trim()
        .toLowerCase()
        .replace(/[’]/g, "'")
        .replace(/\s+/g, ' ');
}