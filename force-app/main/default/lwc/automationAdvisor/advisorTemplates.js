/*
 * advisorTemplates.js
 *
 * Central router for Automation Advisor recommendation templates.
 *
 * Primary recommendation templates are stored in:
 * advisorPrimaryTemplates.js
 *
 * Advanced recommendation templates are stored in:
 * advisorAdvancedTemplates.js
 */

import { RECOMMENDATION_TYPES } from './advisorRules';

import {
    buildRecommendation as buildPrimaryRecommendation
} from './advisorPrimaryTemplates';

import {
    buildAdvancedRecommendation
} from './advisorAdvancedTemplates';

const PRIMARY_TYPES = [
    RECOMMENDATION_TYPES.RECORD_TRIGGERED_FLOW,
    RECOMMENDATION_TYPES.BEFORE_SAVE_FLOW,
    RECOMMENDATION_TYPES.SCREEN_FLOW,
    RECOMMENDATION_TYPES.SCHEDULE_TRIGGERED_FLOW,
    RECOMMENDATION_TYPES.VALIDATION_RULE,
    RECOMMENDATION_TYPES.APPROVAL_PROCESS,
    RECOMMENDATION_TYPES.QUICK_ACTION,
    RECOMMENDATION_TYPES.SUBFLOW
];

const ADVANCED_TYPES = [
    RECOMMENDATION_TYPES.FORMULA_FIELD,
    RECOMMENDATION_TYPES.ROLLUP_SUMMARY,
    RECOMMENDATION_TYPES.DUPLICATE_MANAGEMENT,
    RECOMMENDATION_TYPES.PLATFORM_EVENT,
    RECOMMENDATION_TYPES.INVOCABLE_APEX,
    RECOMMENDATION_TYPES.CLARIFICATION
];

export function buildRecommendation(
    type,
    requirement,
    parsedRequirement,
    ruleResult = {}
) {
    if (PRIMARY_TYPES.includes(type)) {
        return buildPrimaryRecommendation(
            type,
            requirement,
            parsedRequirement,
            ruleResult
        );
    }

    if (ADVANCED_TYPES.includes(type)) {
        return buildAdvancedRecommendation(
            type,
            requirement,
            parsedRequirement,
            ruleResult
        );
    }

    return buildAdvancedRecommendation(
        RECOMMENDATION_TYPES.CLARIFICATION,
        requirement,
        parsedRequirement,
        {
            type: RECOMMENDATION_TYPES.CLARIFICATION,
            matchedRule: 'Unsupported recommendation type',
            confidence: 35,
            reasons: [
                'The selected recommendation type is not currently supported.',
                'Additional requirement details are needed.'
            ]
        }
    );
}