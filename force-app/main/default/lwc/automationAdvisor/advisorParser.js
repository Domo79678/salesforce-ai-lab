/*
 * advisorParser.js
 *
 * Shared requirement parsing engine for Salesforce Copilot.
 */

import {
    OBJECT_KEYWORDS,
    TRIGGER_KEYWORDS,
    TIMING_KEYWORDS,
    OUTCOME_KEYWORDS,
    INTERACTION_KEYWORDS,
    VOLUME_KEYWORDS,
    APPROVAL_KEYWORDS,
    INTEGRATION_KEYWORDS,
    MEANINGFUL_REQUIREMENT_KEYWORDS
} from './advisorkeywords';

export function normalizeRequirement(input = '') {
    return String(input)
        .trim()
        .toLowerCase()
        .replace(/[’]/g, "'")
        .replace(/\s+/g, ' ');
}

export function parseRequirement(input = '') {
    const normalizedInput = normalizeRequirement(input);

    return {
        object: detectObject(normalizedInput),
        trigger: detectTrigger(normalizedInput),
        timing: detectTiming(normalizedInput),
        outcome: detectOutcome(normalizedInput),
        volume: detectVolume(normalizedInput),
        interaction: detectInteraction(normalizedInput),
        approvalRequired: detectApproval(normalizedInput),
        integrationRequired: detectIntegration(normalizedInput)
    };
}

export function isRequirementTooVague(input = '') {
    const normalizedInput = normalizeRequirement(input);
    const words = normalizedInput
        .split(/\s+/)
        .filter(Boolean);

    if (!normalizedInput) {
        return true;
    }

    if (words.length < 4) {
        return true;
    }

    const hasMeaningfulKeyword = matchesAny(
        normalizedInput,
        MEANINGFUL_REQUIREMENT_KEYWORDS
    );

    const hasDetectedObject =
        detectObject(normalizedInput) !==
        'Not clearly identified';

    const hasGuidedInteraction =
        matchesAny(
            normalizedInput,
            INTERACTION_KEYWORDS.guided
        );

    const hasReusableLogic =
        matchesAny(normalizedInput, [
            'reuse',
            'reusable',
            'shared logic',
            'common logic',
            'multiple flows',
            'across multiple flows',
            'notification logic'
        ]);

    return !(
        hasMeaningfulKeyword ||
        hasDetectedObject ||
        hasGuidedInteraction ||
        hasReusableLogic
    );
}

export function detectObject(input = '') {
    const normalizedInput = normalizeRequirement(input);

    for (const objectRule of OBJECT_KEYWORDS) {
        if (
            matchesAny(
                normalizedInput,
                objectRule.keywords
            )
        ) {
            return objectRule.value;
        }
    }

    return 'Not clearly identified';
}

export function detectTrigger(input = '') {
    const normalizedInput = normalizeRequirement(input);

    if (
        matchesAny(
            normalizedInput,
            TRIGGER_KEYWORDS.platformEvent
        )
    ) {
        return 'Event-driven execution';
    }

    if (
        matchesAny(
            normalizedInput,
            TRIGGER_KEYWORDS.scheduled
        )
    ) {
        return 'Scheduled execution';
    }

    if (
        matchesAny(
            normalizedInput,
            TRIGGER_KEYWORDS.userAction
        )
    ) {
        return 'User-initiated action';
    }

    if (
        matchesAny(
            normalizedInput,
            TRIGGER_KEYWORDS.creation
        )
    ) {
        return 'Record creation';
    }

    if (
        matchesAny(
            normalizedInput,
            TRIGGER_KEYWORDS.update
        )
    ) {
        return 'Record update';
    }

    return 'Record or user event';
}

export function detectTiming(input = '') {
    const normalizedInput = normalizeRequirement(input);

    if (
        matchesAny(
            normalizedInput,
            TIMING_KEYWORDS.beforeSave
        )
    ) {
        return 'Before Save';
    }

    if (
        matchesAny(
            normalizedInput,
            TIMING_KEYWORDS.afterSave
        )
    ) {
        return 'After Save';
    }

    if (
        matchesAny(
            normalizedInput,
            TIMING_KEYWORDS.asynchronous
        )
    ) {
        return 'Asynchronous';
    }

    if (
        matchesAny(
            normalizedInput,
            TIMING_KEYWORDS.scheduled
        )
    ) {
        return 'Scheduled';
    }

    if (
        matchesAny(
            normalizedInput,
            TIMING_KEYWORDS.userInitiated
        )
    ) {
        return 'User initiated';
    }

    if (
        matchesAny(
            normalizedInput,
            TIMING_KEYWORDS.immediate
        )
    ) {
        return 'Immediate';
    }

    return 'To be confirmed';
}

export function detectOutcome(input = '') {
    const normalizedInput = normalizeRequirement(input);
    const outcomes = [];

    addOutcomeIfMatched(
        outcomes,
        normalizedInput,
        OUTCOME_KEYWORDS.create,
        'Create records'
    );

    addOutcomeIfMatched(
        outcomes,
        normalizedInput,
        OUTCOME_KEYWORDS.update,
        'Update records'
    );

    addOutcomeIfMatched(
        outcomes,
        normalizedInput,
        OUTCOME_KEYWORDS.notify,
        'Send notifications'
    );

    addOutcomeIfMatched(
        outcomes,
        normalizedInput,
        OUTCOME_KEYWORDS.prevent,
        'Prevent invalid save'
    );

    addOutcomeIfMatched(
        outcomes,
        normalizedInput,
        OUTCOME_KEYWORDS.approval,
        'Obtain formal approval'
    );

    addOutcomeIfMatched(
        outcomes,
        normalizedInput,
        OUTCOME_KEYWORDS.calculate,
        'Calculate or display information'
    );

    addOutcomeIfMatched(
        outcomes,
        normalizedInput,
        OUTCOME_KEYWORDS.duplicate,
        'Detect or prevent duplicates'
    );

    addOutcomeIfMatched(
        outcomes,
        normalizedInput,
        OUTCOME_KEYWORDS.rollup,
        'Aggregate related records'
    );

    addOutcomeIfMatched(
        outcomes,
        normalizedInput,
        OUTCOME_KEYWORDS.publishEvent,
        'Publish a business event'
    );

    addOutcomeIfMatched(
        outcomes,
        normalizedInput,
        OUTCOME_KEYWORDS.collectInformation,
        'Collect user information'
    );

    addOutcomeIfMatched(
        outcomes,
        normalizedInput,
        OUTCOME_KEYWORDS.guideUser,
        'Guide users through a process'
    );

    addOutcomeIfMatched(
        outcomes,
        normalizedInput,
        OUTCOME_KEYWORDS.reuseLogic,
        'Reuse automation logic'
    );

    addOutcomeIfMatched(
        outcomes,
        normalizedInput,
        OUTCOME_KEYWORDS.integration,
        'Exchange data with another system'
    );

    return outcomes.length
        ? [...new Set(outcomes)].join(', ')
        : 'Business outcome requires clarification';
}

export function detectVolume(input = '') {
    const normalizedInput = normalizeRequirement(input);

    if (
        matchesAny(
            normalizedInput,
            VOLUME_KEYWORDS.high
        )
    ) {
        return 'High';
    }

    if (
        matchesAny(
            normalizedInput,
            VOLUME_KEYWORDS.medium
        )
    ) {
        return 'Medium to high';
    }

    if (
        matchesAny(
            normalizedInput,
            VOLUME_KEYWORDS.low
        )
    ) {
        return 'Low';
    }

    return 'Normal or unspecified';
}

export function detectInteraction(input = '') {
    const normalizedInput = normalizeRequirement(input);

    if (
        matchesAny(
            normalizedInput,
            INTERACTION_KEYWORDS.guided
        )
    ) {
        return 'Guided user interaction required';
    }

    if (
        matchesAny(
            normalizedInput,
            INTERACTION_KEYWORDS.userInitiated
        )
    ) {
        return 'User initiated';
    }

    return 'Background or unspecified';
}

export function detectApproval(input = '') {
    return matchesAny(
        normalizeRequirement(input),
        APPROVAL_KEYWORDS
    );
}

export function detectIntegration(input = '') {
    return matchesAny(
        normalizeRequirement(input),
        INTEGRATION_KEYWORDS
    );
}

function addOutcomeIfMatched(
    outcomes,
    input,
    keywords,
    outcome
) {
    if (matchesAny(input, keywords)) {
        outcomes.push(outcome);
    }
}

function matchesAny(input, keywords = []) {
    return keywords.some((keyword) =>
        input.includes(keyword)
    );
}