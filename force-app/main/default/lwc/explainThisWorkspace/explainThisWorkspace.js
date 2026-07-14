/*
 * explainThisWorkspace.js
 *
 * Salesforce Copilot
 * Explain This Workspace
 *
 * Thin UI orchestration layer for:
 * - shared live metadata snapshot
 * - Explanation Engine
 * - Dependency Engine
 *
 * Current supported input:
 * - Object: Opportunity
 * - Field: Opportunity.Amount
 */

import { LightningElement } from 'lwc';

import {
    getMetadataSnapshot
} from 'c/copilotCore';

import {
    explainEntity,
    analyzeDependencies
} from 'c/copilotIntelligence';

export default class ExplainThisWorkspace extends LightningElement {
    searchValue = '';

    isLoading = false;
    errorMessage = '';

    explanation = null;
    dependencyAnalysis = null;
    metadataSnapshot = null;

    get hasExplanation() {
        return Boolean(
            this.explanation?.success
        );
    }

    get hasError() {
        return Boolean(
            this.errorMessage
        );
    }

    get explainButtonDisabled() {
        return (
            this.isLoading ||
            !this.searchValue.trim()
        );
    }

    get entityLabel() {
        return (
            this.explanation
                ?.entity
                ?.label ||
            this.explanation
                ?.entity
                ?.apiName ||
            this.searchValue.trim()
        );
    }

    get entityTypeLabel() {
        const entityType =
            this.explanation
                ?.entity
                ?.type ||
            '';

        const labels = {
            object:
                'Salesforce Object',

            field:
                'Salesforce Field',

            recordType:
                'Record Type',

            flow:
                'Salesforce Flow',

            validationRule:
                'Validation Rule',

            apexClass:
                'Apex Class',

            apexTrigger:
                'Apex Trigger',

            permissionSet:
                'Permission Set',

            duplicateRule:
                'Duplicate Rule',

            matchingRule:
                'Matching Rule'
        };

        return (
            labels[entityType] ||
            'Salesforce Metadata'
        );
    }

    get executiveSummary() {
        return (
            this.explanation
                ?.executiveSummary ||
            'No executive summary is available.'
        );
    }

    get businessPurpose() {
        return (
            this.explanation
                ?.businessPurpose ||
            'A formal business purpose was not found in the connected metadata.'
        );
    }

    get technicalExplanation() {
        return (
            this.explanation
                ?.technicalExplanation ||
            'Technical metadata is not available for this component.'
        );
    }

    get dependencySummary() {
        const dependencies =
            this.explanation
                ?.dependencies || [];

        if (!dependencies.length) {
            return (
                'No dependencies were confirmed ' +
                'within the metadata currently connected.'
            );
        }

        return dependencies
            .map(
                (dependency) => {
                    const type =
                        dependency.type ||
                        'Metadata';

                    const label =
                        dependency.label ||
                        dependency.apiName ||
                        'Unnamed component';

                    const relationship =
                        dependency.relationship
                            ? ` — ${dependency.relationship}`
                            : '';

                    return (
                        `• ${type}: ${label}${relationship}`
                    );
                }
            )
            .join('\n');
    }

    get riskSummary() {
        const risks =
            this.explanation
                ?.risks || [];

        if (!risks.length) {
            return (
                'No entity-specific risks were detected ' +
                'within the currently connected metadata. ' +
                'Partial metadata coverage may limit this conclusion.'
            );
        }

        return risks
            .map(
                (risk) => {
                    const severity =
                        risk.severity ||
                        'Unknown';

                    const title =
                        risk.title ||
                        'Metadata risk';

                    const description =
                        risk.description
                            ? ` — ${risk.description}`
                            : '';

                    return (
                        `• ${severity}: ${title}${description}`
                    );
                }
            )
            .join('\n');
    }

    get recommendations() {
        const improvements =
            this.explanation
                ?.improvements || [];

        if (!improvements.length) {
            return (
                'No improvement recommendations ' +
                'were generated.'
            );
        }

        return improvements
            .map(
                (improvement) => {
                    const priority =
                        improvement.priority ||
                        'Review';

                    const title =
                        improvement.title ||
                        'Recommended improvement';

                    const description =
                        improvement.description
                            ? ` — ${improvement.description}`
                            : '';

                    return (
                        `• ${priority}: ${title}${description}`
                    );
                }
            )
            .join('\n');
    }

    get testingGuidance() {
        const testCases =
            this.explanation
                ?.testCases || [];

        if (!testCases.length) {
            return (
                'No targeted test cases were generated.'
            );
        }

        return testCases
            .map(
                (testCase) => {
                    const type =
                        testCase.type ||
                        'Test';

                    const title =
                        testCase.title ||
                        'Validation scenario';

                    const expectedResult =
                        testCase.expectedResult
                            ? ` Expected: ${testCase.expectedResult}`
                            : '';

                    return (
                        `• ${type}: ${title}.${expectedResult}`
                    );
                }
            )
            .join('\n');
    }

    get deploymentNotes() {
        const deployment =
            this.explanation
                ?.deployment;

        if (!deployment) {
            return (
                'Deployment guidance is not available.'
            );
        }

        const lines = [
            `Readiness: ${
                deployment.readinessStatus ||
                'Unknown'
            }`,

            `Risk: ${
                deployment.riskLevel ||
                'Unknown'
            }`
        ];

        if (deployment.recommendation) {
            lines.push(
                `Recommendation: ${deployment.recommendation}`
            );
        }

        const prerequisites =
            deployment.prerequisites || [];

        if (prerequisites.length) {
            lines.push(
                '',
                'Prerequisites:',
                ...prerequisites.map(
                    (item) =>
                        `• ${item}`
                )
            );
        }

        const rollbackSteps =
            deployment.rollbackSteps || [];

        if (rollbackSteps.length) {
            lines.push(
                '',
                'Rollback considerations:',
                ...rollbackSteps.map(
                    (item) =>
                        `• ${item}`
                )
            );
        }

        return lines.join('\n');
    }

    get interviewGuidance() {
        return (
            this.explanation
                ?.interviewExplanation ||
            'Interview guidance is not available.'
        );
    }

    get confidence() {
        return (
            this.explanation
                ?.confidence
                ?.score ??
            this.dependencyAnalysis
                ?.scores
                ?.confidence ??
            0
        );
    }

    get confidenceLabel() {
        return `${this.confidence}%`;
    }

    get dependencyCount() {
        const explanationCount =
            this.explanation
                ?.dependencies
                ?.length;

        if (
            explanationCount !==
            undefined
        ) {
            return explanationCount;
        }

        return (
            this.dependencyAnalysis
                ?.dependencyCount ??
            0
        );
    }

    get riskLevel() {
        return (
            this.dependencyAnalysis
                ?.scores
                ?.risk ||
            this.explanation
                ?.deployment
                ?.riskLevel ||
            'Unknown'
        );
    }

    get metadataSource() {
        return (
            this.explanation
                ?.source ||
            this.metadataSnapshot
                ?.sourceLabel ||
            this.metadataSnapshot
                ?.source ||
            'Live Salesforce Metadata'
        );
    }

    get coverageLabel() {
        return (
            this.metadataSnapshot
                ?.coverage
                ?.label ||
            this.metadataSnapshot
                ?.sourceLabel ||
            'Metadata coverage unavailable'
        );
    }

    get explanationWarnings() {
        return (
            this.explanation
                ?.warnings || []
        )
            .map(
                (warning) =>
                    warning.message
            )
            .filter(Boolean)
            .join('\n');
    }

    get hasExplanationWarnings() {
        return Boolean(
            this.explanationWarnings
        );
    }

    handleSearchChange(event) {
        this.searchValue =
            event.target.value || '';

        this.errorMessage = '';
    }

    handleSearchKeyDown(event) {
        if (
            event.key === 'Enter' &&
            !this.explainButtonDisabled
        ) {
            this.handleExplain();
        }
    }

    async handleExplain() {
        const normalizedSearchValue =
            this.searchValue.trim();

        if (
            !normalizedSearchValue ||
            this.isLoading
        ) {
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';
        this.explanation = null;
        this.dependencyAnalysis = null;

        try {
            const request =
                this.buildRequest(
                    normalizedSearchValue
                );

            this.metadataSnapshot =
                await getMetadataSnapshot({
                    forceRefresh:
                        false
                });

            if (
                !this.metadataSnapshot ||
                !this.metadataSnapshot.success
            ) {
                throw new Error(
                    this.metadataSnapshot
                        ?.errors?.[0]
                        ?.message ||
                    'The shared Salesforce metadata snapshot could not be loaded.'
                );
            }

            const [
                dependencyResult,
                explanationResult
            ] =
                await Promise.all([
                    analyzeDependencies({
                        entityType:
                            request.entityType,

                        apiName:
                            request.entityApiName,

                        label:
                            request.entityLabel
                    }),

                    explainEntity(
                        request,
                        {
                            metadataSnapshot:
                                this.metadataSnapshot
                        }
                    )
                ]);

            this.dependencyAnalysis =
                dependencyResult;

            this.explanation =
                explanationResult;

            if (
                !this.explanation?.success
            ) {
                throw new Error(
                    this.explanation
                        ?.errors?.[0]
                        ?.message ||
                    this.explanation
                        ?.warnings?.[0]
                        ?.message ||
                    this.explanation
                        ?.executiveSummary ||
                    `Salesforce Copilot could not explain ${normalizedSearchValue}.`
                );
            }
        } catch (error) {
            this.explanation = null;
            this.dependencyAnalysis =
                null;

            this.errorMessage =
                this.extractErrorMessage(
                    error
                );
        } finally {
            this.isLoading = false;
        }
    }

    buildRequest(searchValue) {
        const normalizedValue =
            searchValue.trim();

        const isField =
            normalizedValue.includes(
                '.'
            );

        return {
            entityType:
                isField
                    ? 'field'
                    : 'object',

            entityApiName:
                normalizedValue,

            entityLabel:
                normalizedValue,

            options: {
                includeDependencies:
                    true,

                includeRisks:
                    true,

                includeTests:
                    true,

                includeDeployment:
                    true,

                includeInterview:
                    true,

                includeStarStory:
                    false
            }
        };
    }

    resetWorkspace() {
        this.searchValue = '';
        this.errorMessage = '';
        this.explanation = null;
        this.dependencyAnalysis =
            null;
        this.metadataSnapshot = null;
    }

    extractErrorMessage(error) {
        return (
            error?.body?.message ||
            error?.message ||
            'Salesforce Copilot could not complete the explanation.'
        );
    }
}