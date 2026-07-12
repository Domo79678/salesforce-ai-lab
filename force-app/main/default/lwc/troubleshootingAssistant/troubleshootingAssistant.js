/*
 * troubleshootingAssistant.js
 *
 * Main controller for the Salesforce Copilot
 * Troubleshooting Assistant.
 *
 * Responsibilities:
 * - Capture the user's issue description
 * - Parse the issue
 * - Select the appropriate diagnostic path
 * - Build a complete troubleshooting guide
 * - Support clear, sample, and copy actions
 *
 * Version: 1.0 MVP
 */

import { LightningElement } from 'lwc';

import {
    parseIssue,
    isIssueTooVague
} from './issueParser';

import {
    selectDiagnosis
} from './issueRules';

import {
    buildTroubleshootingGuide
} from './issueTemplates';

const DEFAULT_SAMPLE_ISSUE =
    'My record-triggered Flow fails when it tries to create a Task.';

const MINIMUM_ISSUE_LENGTH = 4;

export default class TroubleshootingAssistant
    extends LightningElement {

    issueInput = '';
    parsedIssue = null;
    diagnosis = null;
    guide = null;

    isAnalyzing = false;
    errorMessage = '';
    successMessage = '';
    copyMessage = '';

    get hasGuide() {
        return Boolean(this.guide);
    }

    get hasParsedIssue() {
        return Boolean(this.parsedIssue);
    }

    get hasDiagnosis() {
        return Boolean(this.diagnosis);
    }

    get analyzeButtonDisabled() {
        return (
            this.isAnalyzing ||
            !this.issueInput.trim()
        );
    }

    get clearButtonDisabled() {
        return (
            this.isAnalyzing ||
            (
                !this.issueInput &&
                !this.guide &&
                !this.errorMessage
            )
        );
    }

    get copyButtonDisabled() {
        return (
            this.isAnalyzing ||
            !this.guide
        );
    }

    get confidenceDisplay() {
        if (!this.guide) {
            return '0%';
        }

        return `${this.guide.confidence}%`;
    }

    get featureLabel() {
        if (
            !this.parsedIssue ||
            !Array.isArray(
                this.parsedIssue.features
            ) ||
            !this.parsedIssue.features.length
        ) {
            return 'Not clearly identified';
        }

        return this.parsedIssue.features.join(', ');
    }

    get clarificationRequiredLabel() {
        if (!this.parsedIssue) {
            return 'No';
        }

        return this.parsedIssue
            .requiresClarification
            ? 'Yes'
            : 'No';
    }

    get productionImpactLabel() {
        if (!this.parsedIssue) {
            return 'No';
        }

        return this.parsedIssue
            .productionImpact
            ? 'Yes'
            : 'No';
    }

    get multipleUsersLabel() {
        if (!this.parsedIssue) {
            return 'No';
        }

        return this.parsedIssue
            .affectsMultipleUsers
            ? 'Yes'
            : 'No';
    }

    get hasLikelyCauses() {
        return (
            this.guide &&
            Array.isArray(
                this.guide.likelyCauses
            ) &&
            this.guide.likelyCauses.length > 0
        );
    }

    get hasInvestigationSteps() {
        return (
            this.guide &&
            Array.isArray(
                this.guide.investigationSteps
            ) &&
            this.guide
                .investigationSteps.length > 0
        );
    }

    get hasFixChecklist() {
        return (
            this.guide &&
            Array.isArray(
                this.guide.fixChecklist
            ) &&
            this.guide.fixChecklist.length > 0
        );
    }

    get hasTestCases() {
        return (
            this.guide &&
            Array.isArray(
                this.guide.testCases
            ) &&
            this.guide.testCases.length > 0
        );
    }

    get hasPreventionRecommendations() {
        return (
            this.guide &&
            Array.isArray(
                this.guide
                    .preventionRecommendations
            ) &&
            this.guide
                .preventionRecommendations
                .length > 0
        );
    }

    get hasEscalationCriteria() {
        return (
            this.guide &&
            Array.isArray(
                this.guide.escalationCriteria
            ) &&
            this.guide
                .escalationCriteria.length > 0
        );
    }

    get hasRecommendedContext() {
        return (
            this.guide &&
            Array.isArray(
                this.guide.recommendedContext
            ) &&
            this.guide
                .recommendedContext.length > 0
        );
    }

    get hasRuleReasons() {
        return (
            this.guide &&
            Array.isArray(
                this.guide.ruleReasons
            ) &&
            this.guide.ruleReasons.length > 0
        );
    }

    handleIssueChange(event) {
        this.issueInput =
            event.target.value || '';

        this.clearMessages();
    }

    handleUseSample() {
        this.issueInput =
            DEFAULT_SAMPLE_ISSUE;

        this.clearResults();
        this.clearMessages();

        this.successMessage =
            'Sample Salesforce issue loaded.';
    }

    async handleAnalyze() {
        this.clearMessages();
        this.clearResults();

        const trimmedIssue =
            this.issueInput.trim();

        if (!trimmedIssue) {
            this.errorMessage =
                'Describe the Salesforce issue before running the analysis.';
            return;
        }

        if (
            trimmedIssue.length <
            MINIMUM_ISSUE_LENGTH
        ) {
            this.errorMessage =
                'Add more detail about the Salesforce issue.';
            return;
        }

        this.isAnalyzing = true;

        try {
            await this.createAnalysisDelay();

            this.parsedIssue =
                parseIssue(trimmedIssue);

            const vagueIssue =
                isIssueTooVague(
                    trimmedIssue
                );

            /*
             * Preserve parser evidence while ensuring
             * vague issues route to clarification.
             */
            this.parsedIssue = {
                ...this.parsedIssue,
                requiresClarification:
                    vagueIssue ||
                    this.parsedIssue
                        .requiresClarification
            };

            this.diagnosis =
                selectDiagnosis(
                    this.parsedIssue,
                    trimmedIssue
                );

            this.guide =
                buildTroubleshootingGuide(
                    this.diagnosis,
                    trimmedIssue
                );

            if (
                this.parsedIssue
                    .requiresClarification
            ) {
                this.successMessage =
                    'The issue needs more information before a reliable diagnosis can be made.';
            } else {
                this.successMessage =
                    `${this.guide.title} generated successfully.`;
            }
        } catch (error) {
            this.clearResults();

            this.errorMessage =
                this.getErrorMessage(error);
        } finally {
            this.isAnalyzing = false;
        }
    }

    handleClear() {
        this.issueInput = '';
        this.clearResults();
        this.clearMessages();
    }

    async handleCopyGuide() {
        this.copyMessage = '';
        this.errorMessage = '';

        if (!this.guide) {
            this.errorMessage =
                'Generate a troubleshooting guide before copying it.';
            return;
        }

        const guideText =
            this.buildGuideText();

        try {
            await navigator.clipboard.writeText(
                guideText
            );

            this.copyMessage =
                'Troubleshooting guide copied to the clipboard.';
        } catch (error) {
            this.copyMessage =
                'The browser could not copy the guide automatically. Select and copy the results manually.';
        }
    }

    clearResults() {
        this.parsedIssue = null;
        this.diagnosis = null;
        this.guide = null;
        this.copyMessage = '';
    }

    clearMessages() {
        this.errorMessage = '';
        this.successMessage = '';
        this.copyMessage = '';
    }

    createAnalysisDelay() {
        return new Promise((resolve) => {
            window.setTimeout(resolve, 350);
        });
    }

    buildGuideText() {
        const guide = this.guide;

        return [
            'SALESFORCE COPILOT — TROUBLESHOOTING ASSISTANT',
            '',
            'ISSUE',
            guide.originalIssue,
            '',
            'DIAGNOSIS',
            `Title: ${guide.title}`,
            `Issue Type: ${guide.issueType}`,
            `Object: ${guide.object}`,
            `Symptom: ${guide.symptom}`,
            `Severity: ${guide.severity}`,
            `Priority: ${guide.priority}`,
            `Confidence: ${guide.confidence}% (${guide.confidenceLabel})`,
            `Estimated Resolution: ${guide.estimatedResolution}`,
            `Timing: ${guide.timing}`,
            `Matched Rule: ${guide.matchedRule}`,
            '',
            'SUMMARY',
            guide.summary,
            '',
            'WHY THIS DIAGNOSIS WAS SELECTED',
            this.formatBulletList(
                guide.ruleReasons
            ),
            '',
            'MOST LIKELY CAUSES',
            this.formatNumberedList(
                guide.likelyCauses
            ),
            '',
            'RECOMMENDED INVESTIGATION ORDER',
            this.formatNumberedList(
                guide.investigationSteps
            ),
            '',
            'FIX CHECKLIST',
            this.formatChecklist(
                guide.fixChecklist
            ),
            '',
            'TESTING CHECKLIST',
            this.formatChecklist(
                guide.testCases
            ),
            '',
            'INFORMATION TO GATHER',
            this.formatChecklist(
                guide.recommendedContext
            ),
            '',
            'PREVENTION RECOMMENDATIONS',
            this.formatBulletList(
                guide
                    .preventionRecommendations
            ),
            '',
            'ESCALATION CRITERIA',
            this.formatBulletList(
                guide.escalationCriteria
            ),
            '',
            'ADMIN NOTES',
            guide.adminNotes,
            '',
            'INTERVIEW-READY EXPLANATION',
            guide.interviewAnswer
        ].join('\n');
    }

    formatBulletList(items = []) {
        if (
            !Array.isArray(items) ||
            !items.length
        ) {
            return '- None identified';
        }

        return items
            .map((item) => `- ${item}`)
            .join('\n');
    }

    formatNumberedList(items = []) {
        if (
            !Array.isArray(items) ||
            !items.length
        ) {
            return '1. None identified';
        }

        return items
            .map(
                (item, index) =>
                    `${index + 1}. ${item}`
            )
            .join('\n');
    }

    formatChecklist(items = []) {
        if (
            !Array.isArray(items) ||
            !items.length
        ) {
            return '☐ None identified';
        }

        return items
            .map((item) => `☐ ${item}`)
            .join('\n');
    }

    getErrorMessage(error) {
        if (!error) {
            return 'An unknown troubleshooting error occurred.';
        }

        if (
            typeof error.message === 'string'
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

        return 'The Troubleshooting Assistant could not analyze the issue.';
    }
}