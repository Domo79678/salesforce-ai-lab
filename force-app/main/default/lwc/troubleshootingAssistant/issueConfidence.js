/*
 * issueConfidence.js
 *
 * Calculates diagnostic confidence for the
 * Troubleshooting Assistant.
 */

export function calculateConfidence(parsedIssue) {

    let confidence = 40;

    if (parsedIssue.object !== 'Not clearly identified') {
        confidence += 10;
    }

    if (parsedIssue.issueType !== 'unknown') {
        confidence += 20;
    }

    if (parsedIssue.symptom !== 'General Salesforce issue') {
        confidence += 10;
    }

    if (parsedIssue.features.length) {
        confidence += parsedIssue.features.length * 3;
    }

    if (parsedIssue.hasErrorMessage) {
        confidence += 8;
    }

    if (parsedIssue.productionImpact) {
        confidence += 5;
    }

    if (parsedIssue.affectsMultipleUsers) {
        confidence += 4;
    }

    if (parsedIssue.requiresClarification) {
        confidence -= 25;
    }

    confidence = Math.max(25, confidence);
    confidence = Math.min(99, confidence);

    return confidence;
}

export function confidenceLabel(score) {

    if (score >= 90) {
        return 'Very High';
    }

    if (score >= 80) {
        return 'High';
    }

    if (score >= 65) {
        return 'Medium';
    }

    return 'Low';
}

export function priority(parsedIssue) {

    if (parsedIssue.productionImpact) {
        return 'P1';
    }

    if (parsedIssue.affectsMultipleUsers) {
        return 'P1';
    }

    if (parsedIssue.severity === 'Critical') {
        return 'P1';
    }

    if (parsedIssue.severity === 'High') {
        return 'P2';
    }

    if (parsedIssue.severity === 'Medium') {
        return 'P3';
    }

    return 'P4';
}

export function estimatedResolution(priorityLevel) {

    switch (priorityLevel) {

        case 'P1':
            return 'Immediate';

        case 'P2':
            return 'Same business day';

        case 'P3':
            return '1–3 business days';

        default:
            return 'As capacity allows';
    }
}