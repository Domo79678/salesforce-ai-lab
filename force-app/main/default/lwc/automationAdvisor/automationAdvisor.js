import { LightningElement } from 'lwc';

import {
    parseRequirement,
    isRequirementTooVague
} from './advisorParser';

import {
    selectRecommendationType
} from './advisorRules';

import {
    buildRecommendation
} from './advisorTemplates';

export default class AutomationAdvisor extends LightningElement {
    requirementInput = '';
    recommendation = null;
    isAnalyzing = false;
    errorMessage = '';
    copyMessage = '';

    get showRecommendation() {
        return this.recommendation !== null;
    }

    get hasError() {
        return Boolean(this.errorMessage);
    }

    get hasCopyMessage() {
        return Boolean(this.copyMessage);
    }

    handleRequirementChange(event) {
        this.requirementInput = event.target.value;
        this.errorMessage = '';
        this.copyMessage = '';
    }

    analyzeRequirement() {
        const input = this.requirementInput.trim();

        if (!input) {
            this.errorMessage =
                'Describe the business requirement before requesting a recommendation.';

            this.recommendation = null;
            return;
        }

        this.isAnalyzing = true;
        this.errorMessage = '';
        this.copyMessage = '';
        this.recommendation = null;

        window.setTimeout(() => {
            try {
                const parsedRequirement =
                    parseRequirement(input);

                const requirementIsTooVague =
                    isRequirementTooVague(input);

                const ruleResult =
                    selectRecommendationType(
                        input,
                        parsedRequirement,
                        requirementIsTooVague
                    );

                this.recommendation =
                    buildRecommendation(
                        ruleResult.type,
                        input,
                        parsedRequirement,
                        ruleResult
                    );
            } catch (error) {
                this.recommendation = null;

                this.errorMessage =
                    this.getErrorMessage(error);
            } finally {
                this.isAnalyzing = false;
            }
        }, 900);
    }

    buildExportText() {
        if (!this.recommendation) {
            return '';
        }

        const recommendation = this.recommendation;

        return [
            'SALESFORCE COPILOT — AUTOMATION ADVISOR',
            '',
            'REQUIREMENT',
            recommendation.requirement,
            '',
            'RECOMMENDATION',
            `Solution: ${recommendation.solution}`,
            `Confidence: ${recommendation.confidence}`,
            `Status: ${recommendation.status}`,
            `Complexity: ${recommendation.complexity}`,
            `Estimated Build Time: ${recommendation.estimatedBuildTime}`,
            `Maintenance: ${recommendation.maintenanceLevel}`,
            `Recommended Timing: ${recommendation.recommendedTiming}`,
            '',
            'REQUIREMENT ANALYSIS',
            `Object: ${recommendation.parsedRequirement?.object || 'Not identified'}`,
            `Trigger: ${recommendation.parsedRequirement?.trigger || 'Not identified'}`,
            `Timing: ${recommendation.parsedRequirement?.timing || 'Not identified'}`,
            `Outcome: ${recommendation.parsedRequirement?.outcome || 'Not identified'}`,
            `Volume: ${recommendation.parsedRequirement?.volume || 'Not identified'}`,
            '',
            'SUMMARY',
            recommendation.summary,
            '',
            'USER STORY',
            recommendation.userStory,
            '',
            'WHY THIS FITS',
            ...this.formatBulletList(
                recommendation.whyThisFits
            ),
            '',
            'ARCHITECTURE STEPS',
            ...this.formatNumberedList(
                recommendation.architectureSteps
            ),
            '',
            'ACCEPTANCE CRITERIA',
            ...this.formatCheckboxList(
                recommendation.acceptanceCriteria
            ),
            '',
            'BUILD CHECKLIST',
            ...this.formatCheckboxList(
                recommendation.buildChecklist
            ),
            '',
            'RISKS AND WATCHOUTS',
            ...this.formatBulletList(
                recommendation.risks
            ),
            '',
            'TESTING CHECKLIST',
            ...this.formatCheckboxList(
                recommendation.testCases
            ),
            '',
            'DEPLOYMENT CHECKLIST',
            ...this.formatCheckboxList(
                recommendation.deploymentChecklist
            ),
            '',
            'ROLLBACK PLAN',
            ...this.formatCheckboxList(
                recommendation.rollbackPlan
            ),
            '',
            'ALTERNATIVE OPTIONS',
            ...this.formatAlternatives(
                recommendation.alternatives
            ),
            '',
            'INTERVIEW-READY EXPLANATION',
            recommendation.interviewAnswer
        ].join('\n');
    }

    async copyRecommendation() {
        const exportText = this.buildExportText();

        if (!exportText) {
            this.copyMessage =
                'Generate a recommendation before copying.';

            return;
        }

        try {
            await navigator.clipboard.writeText(
                exportText
            );

            this.copyMessage =
                'Automation recommendation copied to the clipboard.';
        } catch (error) {
            this.copyMessage =
                'Copy was unavailable. Select and copy the displayed recommendation manually.';
        }
    }

    formatBulletList(items = []) {
        if (!Array.isArray(items)) {
            return [];
        }

        return items.map((item) => `- ${item}`);
    }

    formatNumberedList(items = []) {
        if (!Array.isArray(items)) {
            return [];
        }

        return items.map(
            (item, index) => `${index + 1}. ${item}`
        );
    }

    formatCheckboxList(items = []) {
        if (!Array.isArray(items)) {
            return [];
        }

        return items.map((item) => `☐ ${item}`);
    }

    formatAlternatives(alternatives = []) {
        if (!Array.isArray(alternatives)) {
            return [];
        }

        return alternatives.flatMap((alternative) => [
            `- ${alternative.name}`,
            `  Recommendation: ${alternative.recommendation}`,
            `  Reason: ${alternative.reason}`
        ]);
    }

    getErrorMessage(error) {
        if (error?.body?.message) {
            return error.body.message;
        }

        if (error?.message) {
            return error.message;
        }

        return 'Automation Advisor could not analyze the requirement. Review the component files and try again.';
    }

    clearAdvisor() {
        this.requirementInput = '';
        this.recommendation = null;
        this.errorMessage = '';
        this.copyMessage = '';
        this.isAnalyzing = false;
    }
}