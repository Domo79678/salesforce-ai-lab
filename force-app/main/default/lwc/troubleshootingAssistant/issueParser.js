/*
 * issueParser.js
 *
 * Converts a Salesforce problem description into structured
 * troubleshooting information.
 *
 * The parser identifies:
 * - Salesforce object
 * - Issue category
 * - Symptom
 * - Severity
 * - Timing
 * - Relevant features
 * - Whether clarification is required
 */

import {
    ISSUE_TYPES,
    OBJECT_KEYWORDS,
    FLOW_TRIGGER_KEYWORDS,
    FLOW_RUNTIME_KEYWORDS,
    VALIDATION_KEYWORDS,
    PERMISSION_KEYWORDS,
    DUPLICATE_KEYWORDS,
    APPROVAL_KEYWORDS,
    EMAIL_KEYWORDS,
    APEX_KEYWORDS,
    INTEGRATION_KEYWORDS,
    DATA_KEYWORDS,
    REPORTING_KEYWORDS,
    SYMPTOM_KEYWORDS,
    SEVERITY_KEYWORDS,
    TIMING_KEYWORDS,
    MEANINGFUL_ISSUE_KEYWORDS
} from './issueKeywords';

export function normalizeIssue(input = '') {
    return String(input)
        .trim()
        .toLowerCase()
        .replace(/[’‘]/g, "'")
        .replace(/\s+/g, ' ');
}

export function parseIssue(input = '') {
    const normalizedInput = normalizeIssue(input);

    const categoryScores =
        calculateIssueCategoryScores(normalizedInput);

    const issueType =
        selectHighestScoringIssueType(categoryScores);

    return {
        originalIssue: String(input).trim(),

        normalizedIssue: normalizedInput,

        issueType,

        issueTypeLabel:
            getIssueTypeLabel(issueType),

        object:
            detectObject(normalizedInput),

        symptom:
            detectSymptom(normalizedInput),

        severity:
            detectSeverity(normalizedInput),

        timing:
            detectTiming(normalizedInput),

        categoryScores,

        features:
            detectRelevantFeatures(normalizedInput),

        hasErrorMessage:
            detectErrorMessage(normalizedInput),

        affectsMultipleUsers:
            detectMultipleUserImpact(normalizedInput),

        productionImpact:
            detectProductionImpact(normalizedInput),

        requiresClarification:
            isIssueTooVague(normalizedInput)
    };
}

export function isIssueTooVague(input = '') {
    const normalizedInput = normalizeIssue(input);

    const words =
        normalizedInput
            .split(/\s+/)
            .filter(Boolean);

    if (words.length < 4) {
        return true;
    }

    const hasMeaningfulKeyword =
        MEANINGFUL_ISSUE_KEYWORDS.some(
            (keyword) =>
                normalizedInput.includes(keyword)
        );

    return !hasMeaningfulKeyword;
}

export function detectObject(input = '') {
    const normalizedInput =
        normalizeIssue(input);

    const match =
        OBJECT_KEYWORDS.find(
            ([keyword]) =>
                normalizedInput.includes(keyword)
        );

    return match
        ? match[1]
        : 'Not clearly identified';
}

export function calculateIssueCategoryScores(
    input = ''
) {
    const normalizedInput =
        normalizeIssue(input);

    return {
        [ISSUE_TYPES.FLOW_TRIGGER]:
            countKeywordMatches(
                normalizedInput,
                FLOW_TRIGGER_KEYWORDS
            ),

        [ISSUE_TYPES.FLOW_RUNTIME]:
            countKeywordMatches(
                normalizedInput,
                FLOW_RUNTIME_KEYWORDS
            ),

        [ISSUE_TYPES.VALIDATION]:
            countKeywordMatches(
                normalizedInput,
                VALIDATION_KEYWORDS
            ),

        [ISSUE_TYPES.PERMISSION]:
            countKeywordMatches(
                normalizedInput,
                PERMISSION_KEYWORDS
            ),

        [ISSUE_TYPES.DUPLICATE]:
            countKeywordMatches(
                normalizedInput,
                DUPLICATE_KEYWORDS
            ),

        [ISSUE_TYPES.APPROVAL]:
            countKeywordMatches(
                normalizedInput,
                APPROVAL_KEYWORDS
            ),

        [ISSUE_TYPES.EMAIL]:
            countKeywordMatches(
                normalizedInput,
                EMAIL_KEYWORDS
            ),

        [ISSUE_TYPES.APEX]:
            countKeywordMatches(
                normalizedInput,
                APEX_KEYWORDS
            ),

        [ISSUE_TYPES.INTEGRATION]:
            countKeywordMatches(
                normalizedInput,
                INTEGRATION_KEYWORDS
            ),

        [ISSUE_TYPES.DATA]:
            countKeywordMatches(
                normalizedInput,
                DATA_KEYWORDS
            ),

        [ISSUE_TYPES.REPORTING]:
            countKeywordMatches(
                normalizedInput,
                REPORTING_KEYWORDS
            )
    };
}

export function selectHighestScoringIssueType(
    categoryScores = {}
) {
    const rankedCategories =
        Object.entries(categoryScores)
            .sort(
                (first, second) =>
                    second[1] - first[1]
            );

    if (
        !rankedCategories.length ||
        rankedCategories[0][1] === 0
    ) {
        return ISSUE_TYPES.UNKNOWN;
    }

    return rankedCategories[0][0];
}

export function detectSymptom(input = '') {
    const normalizedInput =
        normalizeIssue(input);

    if (
        containsAny(
            normalizedInput,
            SYMPTOM_KEYWORDS.neverRuns
        )
    ) {
        return 'Automation never starts';
    }

    if (
        containsAny(
            normalizedInput,
            SYMPTOM_KEYWORDS.saveBlocked
        )
    ) {
        return 'Record save is blocked';
    }

    if (
        containsAny(
            normalizedInput,
            SYMPTOM_KEYWORDS.accessDenied
        )
    ) {
        return 'User access is denied';
    }

    if (
        containsAny(
            normalizedInput,
            SYMPTOM_KEYWORDS.recordCreationFailed
        )
    ) {
        return 'Record creation failed';
    }

    if (
        containsAny(
            normalizedInput,
            SYMPTOM_KEYWORDS.recordUpdateFailed
        )
    ) {
        return 'Record update failed';
    }

    if (
        containsAny(
            normalizedInput,
            SYMPTOM_KEYWORDS.notificationFailed
        )
    ) {
        return 'Notification was not delivered';
    }

    if (
        containsAny(
            normalizedInput,
            SYMPTOM_KEYWORDS.integrationFailure
        )
    ) {
        return 'Integration request failed';
    }

    if (
        normalizedInput.includes('wrong data') ||
        normalizedInput.includes('incorrect data')
    ) {
        return 'Unexpected data result';
    }

    if (
        normalizedInput.includes('report') ||
        normalizedInput.includes('dashboard')
    ) {
        return 'Reporting result is incorrect or incomplete';
    }

    return 'General Salesforce issue';
}

export function detectSeverity(input = '') {
    const normalizedInput =
        normalizeIssue(input);

    if (
        containsAny(
            normalizedInput,
            SEVERITY_KEYWORDS.critical
        )
    ) {
        return 'Critical';
    }

    if (
        containsAny(
            normalizedInput,
            SEVERITY_KEYWORDS.high
        )
    ) {
        return 'High';
    }

    if (
        containsAny(
            normalizedInput,
            SEVERITY_KEYWORDS.medium
        )
    ) {
        return 'Medium';
    }

    if (
        containsAny(
            normalizedInput,
            SEVERITY_KEYWORDS.low
        )
    ) {
        return 'Low';
    }

    return 'Medium';
}

export function detectTiming(input = '') {
    const normalizedInput =
        normalizeIssue(input);

    if (
        containsAny(
            normalizedInput,
            TIMING_KEYWORDS.beforeSave
        )
    ) {
        return 'Before Save';
    }

    if (
        containsAny(
            normalizedInput,
            TIMING_KEYWORDS.afterCreate
        )
    ) {
        return 'After Record Creation';
    }

    if (
        containsAny(
            normalizedInput,
            TIMING_KEYWORDS.afterUpdate
        )
    ) {
        return 'After Record Update';
    }

    if (
        containsAny(
            normalizedInput,
            TIMING_KEYWORDS.scheduled
        )
    ) {
        return 'Scheduled';
    }

    if (
        containsAny(
            normalizedInput,
            TIMING_KEYWORDS.userInitiated
        )
    ) {
        return 'User Initiated';
    }

    return 'Not clearly identified';
}

export function detectRelevantFeatures(
    input = ''
) {
    const normalizedInput =
        normalizeIssue(input);

    const features = [];

    addFeatureWhenMatched(
        features,
        normalizedInput,
        ['flow', 'automation'],
        'Flow'
    );

    addFeatureWhenMatched(
        features,
        normalizedInput,
        ['validation rule', 'cannot save'],
        'Validation Rule'
    );

    addFeatureWhenMatched(
        features,
        normalizedInput,
        ['duplicate', 'matching rule'],
        'Duplicate Management'
    );

    addFeatureWhenMatched(
        features,
        normalizedInput,
        ['approval', 'approver'],
        'Approval Process'
    );

    addFeatureWhenMatched(
        features,
        normalizedInput,
        ['email', 'notification'],
        'Email'
    );

    addFeatureWhenMatched(
        features,
        normalizedInput,
        ['apex', 'trigger'],
        'Apex'
    );

    addFeatureWhenMatched(
        features,
        normalizedInput,
        [
            'api',
            'integration',
            'callout',
            'external system'
        ],
        'Integration'
    );

    addFeatureWhenMatched(
        features,
        normalizedInput,
        [
            'permission',
            'profile',
            'sharing',
            'owd'
        ],
        'Security and Access'
    );

    addFeatureWhenMatched(
        features,
        normalizedInput,
        [
            'report',
            'dashboard',
            'report type'
        ],
        'Reports and Dashboards'
    );

    addFeatureWhenMatched(
        features,
        normalizedInput,
        [
            'import',
            'data loader',
            'csv',
            'mass update'
        ],
        'Data Management'
    );

    return features;
}

export function detectErrorMessage(
    input = ''
) {
    const normalizedInput =
        normalizeIssue(input);

    return (
        normalizedInput.includes('error message') ||
        normalizedInput.includes('exception') ||
        normalizedInput.includes('error id') ||
        normalizedInput.includes('fault message') ||
        normalizedInput.includes('failed with')
    );
}

export function detectMultipleUserImpact(
    input = ''
) {
    const normalizedInput =
        normalizeIssue(input);

    return (
        normalizedInput.includes('all users') ||
        normalizedInput.includes('multiple users') ||
        normalizedInput.includes('many users') ||
        normalizedInput.includes('entire organization')
    );
}

export function detectProductionImpact(
    input = ''
) {
    const normalizedInput =
        normalizeIssue(input);

    return (
        normalizedInput.includes('production') ||
        normalizedInput.includes('business stopped') ||
        normalizedInput.includes('system unavailable') ||
        normalizedInput.includes('cannot work') ||
        normalizedInput.includes('data loss')
    );
}

export function getIssueTypeLabel(
    issueType
) {
    const labels = {
        [ISSUE_TYPES.FLOW_TRIGGER]:
            'Flow Trigger Failure',

        [ISSUE_TYPES.FLOW_RUNTIME]:
            'Flow Runtime Failure',

        [ISSUE_TYPES.VALIDATION]:
            'Validation or Save Failure',

        [ISSUE_TYPES.PERMISSION]:
            'Permission or Record Access Issue',

        [ISSUE_TYPES.DUPLICATE]:
            'Duplicate Management Issue',

        [ISSUE_TYPES.APPROVAL]:
            'Approval Process Issue',

        [ISSUE_TYPES.EMAIL]:
            'Email or Notification Issue',

        [ISSUE_TYPES.APEX]:
            'Apex or Governor Limit Issue',

        [ISSUE_TYPES.INTEGRATION]:
            'Integration or API Issue',

        [ISSUE_TYPES.DATA]:
            'Data Management Issue',

        [ISSUE_TYPES.REPORTING]:
            'Reporting or Dashboard Issue',

        [ISSUE_TYPES.UNKNOWN]:
            'More Information Required'
    };

    return (
        labels[issueType] ||
        labels[ISSUE_TYPES.UNKNOWN]
    );
}

function countKeywordMatches(
    input,
    keywords = []
) {
    return keywords.reduce(
        (score, keyword) =>
            input.includes(keyword)
                ? score + 1
                : score,
        0
    );
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

function addFeatureWhenMatched(
    features,
    input,
    keywords,
    featureName
) {
    if (
        containsAny(input, keywords) &&
        !features.includes(featureName)
    ) {
        features.push(featureName);
    }
}