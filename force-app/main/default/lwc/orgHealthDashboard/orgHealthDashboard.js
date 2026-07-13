import { LightningElement } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import orgKnowledgeService from 'c/orgKnowledgeService';

export default class OrgHealthDashboard extends LightningElement {
    analysisResult = null;
    errorMessage = '';
    isLoading = false;
    lastRefreshedAt = '';
    dataSourceLabel = 'Starter Metadata Snapshot';

    connectedCallback() {
        this.runOrgHealthAnalysis(false);
    }

    get hasAnalysis() {
        return Boolean(
            this.analysisResult &&
            this.analysisResult.success
        );
    }

    get hasError() {
        return Boolean(this.errorMessage);
    }

    get healthScore() {
        return (
            this.analysisResult
                ?.dashboardMetrics
                ?.orgHealthScore ?? 0
        );
    }

    get healthScoreLabel() {
        return `${this.healthScore}/100`;
    }

    get healthStatus() {
        return (
            this.analysisResult
                ?.dashboardMetrics
                ?.orgHealthStatus ||
            'Unknown'
        );
    }

    get healthStatusClass() {
        return this.getStatusClass(
            this.healthStatus
        );
    }

    get deploymentScore() {
        return (
            this.analysisResult
                ?.dashboardMetrics
                ?.deploymentReadinessScore ?? 0
        );
    }

    get deploymentScoreLabel() {
        return `${this.deploymentScore}/100`;
    }

    get deploymentStatus() {
        return (
            this.analysisResult
                ?.dashboardMetrics
                ?.deploymentReadinessStatus ||
            'Unknown'
        );
    }

    get deploymentStatusClass() {
        return this.getStatusClass(
            this.deploymentStatus
        );
    }

    get deploymentRiskLevel() {
        return (
            this.analysisResult
                ?.deploymentReadiness
                ?.riskLevel ||
            'Unknown'
        );
    }

    get approvalRecommendation() {
        return (
            this.analysisResult
                ?.deploymentReadiness
                ?.approvalRecommendation ||
            'Deployment readiness has not been evaluated.'
        );
    }

    get rollbackRequiredLabel() {
        return this.analysisResult
            ?.deploymentReadiness
            ?.rollbackRequired
            ? 'Required'
            : 'Not required';
    }

    get summaryCards() {
        const metrics =
            this.analysisResult
                ?.dashboardMetrics || {};

        return [
            {
                id: 'critical',
                label: 'Critical',
                value: metrics.criticalFindings ?? 0,
                iconName: 'utility:error',
                cardClass:
                    'metric-card metric-card-critical'
            },
            {
                id: 'high',
                label: 'High Risk',
                value: metrics.highFindings ?? 0,
                iconName: 'utility:warning',
                cardClass:
                    'metric-card metric-card-high'
            },
            {
                id: 'blocking',
                label: 'Blockers',
                value: metrics.blockingFindings ?? 0,
                iconName: 'utility:block_visitor',
                cardClass:
                    'metric-card metric-card-blocking'
            },
            {
                id: 'recommendations',
                label: 'Actions',
                value:
                    metrics.totalRecommendations ?? 0,
                iconName: 'utility:light_bulb',
                cardClass:
                    'metric-card metric-card-recommendation'
            }
        ];
    }

    get categoryRows() {
        const categories =
            this.analysisResult
                ?.health
                ?.categories || [];

        return categories.map(
            (category) => ({
                ...category,

                id:
                    this.createStableId(
                        category.category
                    ),

                scoreLabel:
                    `${category.score}/100`,

                scoreStyle:
                    `width: ${category.score}%;`,

                progressClass:
                    this.getProgressClass(
                        category.score
                    ),

                statusClass:
                    this.getStatusClass(
                        category.status
                    ),

                findingLabel:
                    category.findingCount === 1
                        ? '1 finding'
                        : `${category.findingCount} findings`
            })
        );
    }

    get hasCategories() {
        return this.categoryRows.length > 0;
    }

    get topFindings() {
        const findings =
            this.analysisResult
                ?.dashboardMetrics
                ?.topFindings || [];

        return findings
            .slice(0, 4)
            .map(
                (finding) => ({
                    ...finding,

                    displayId:
                        this.createStableId(
                            finding.id ||
                            finding.title
                        ),

                    severityClass:
                        this.getSeverityClass(
                            finding.severity
                        ),

                    scoreImpactLabel:
                        finding.scoreImpact
                            ? `-${finding.scoreImpact} points`
                            : 'No deduction',

                    entityLabel:
                        finding.entityApiName ||
                        'Organization'
                })
            );
    }

    get hasTopFindings() {
        return this.topFindings.length > 0;
    }

    get topRecommendations() {
        const recommendations =
            this.analysisResult
                ?.dashboardMetrics
                ?.topRecommendations || [];

        return recommendations
            .slice(0, 4)
            .map(
                (recommendation, index) => ({
                    ...recommendation,

                    displayId:
                        this.createStableId(
                            recommendation.id ||
                            recommendation.title
                        ),

                    rank:
                        index + 1,

                    priorityClass:
                        this.getPriorityClass(
                            recommendation.priority
                        ),

                    actionText:
                        recommendation.action ||
                        recommendation.description
                })
            );
    }

    get hasRecommendations() {
        return this.topRecommendations.length > 0;
    }

    get requiredTests() {
        const tests =
            this.analysisResult
                ?.deploymentReadiness
                ?.requiredTests || [];

        return tests
            .slice(0, 6)
            .map(
                (test, index) => ({
                    id:
                        `required-test-${index + 1}`,
                    label:
                        test
                })
            );
    }

    get metadataCountCards() {
        const counts =
            this.analysisResult
                ?.metadataCounts || {};

        return [
            {
                id: 'objects',
                label: 'Objects',
                value: counts.objects ?? 0
            },
            {
                id: 'fields',
                label: 'Fields',
                value: counts.fields ?? 0
            },
            {
                id: 'flows',
                label: 'Flows',
                value: counts.flows ?? 0
            },
            {
                id: 'validation-rules',
                label: 'Validation Rules',
                value:
                    counts.validationRules ?? 0
            },
            {
                id: 'permission-sets',
                label: 'Permission Sets',
                value:
                    counts.permissionSets ?? 0
            },
            {
                id: 'apex',
                label: 'Apex Classes',
                value:
                    counts.apexClasses ?? 0
            }
        ];
    }

    get lowestCategory() {
        return (
            this.analysisResult
                ?.dashboardMetrics
                ?.lowestCategory ||
            'None'
        );
    }

    get lowestCategoryScore() {
        return (
            this.analysisResult
                ?.dashboardMetrics
                ?.lowestCategoryScore ?? 100
        );
    }

    get highestRiskCategory() {
        return (
            this.analysisResult
                ?.dashboardMetrics
                ?.highestRiskCategory ||
            'None'
        );
    }

    get highestRiskLevel() {
        return (
            this.analysisResult
                ?.dashboardMetrics
                ?.highestRiskLevel ||
            'None'
        );
    }

    get dailyBriefHeadline() {
        return (
            this.analysisResult
                ?.dailyBrief
                ?.headline ||
            'No Daily Admin Brief is available.'
        );
    }

    get dailyPriorities() {
        return (
            this.analysisResult
                ?.dailyBrief
                ?.priorities || []
        )
            .slice(0, 3)
            .map(
                (priority) => ({
                    ...priority,
                    displayId:
                        `daily-priority-${priority.rank}`
                })
            );
    }

    get refreshButtonLabel() {
        return this.isLoading
            ? 'Refreshing'
            : 'Refresh Analysis';
    }

    handleRefresh() {
        this.runOrgHealthAnalysis(true);
    }

    runOrgHealthAnalysis(showToast = false) {
        if (this.isLoading) {
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';

        window.setTimeout(() => {
            try {
                const result =
                    orgKnowledgeService.analyzeOrg(
                        this.buildStarterSnapshot(),
                        {
                            analysisMode:
                                'health'
                        }
                    );

                if (!result.success) {
                    throw new Error(
                        result.errors?.[0]?.message ||
                        'The Org Knowledge Service could not complete the analysis.'
                    );
                }

                this.analysisResult =
                    result;

                this.lastRefreshedAt =
                    new Intl.DateTimeFormat(
                        'en-US',
                        {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            second: '2-digit'
                        }
                    ).format(
                        new Date()
                    );

                if (showToast) {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title:
                                'Analysis refreshed',
                            message:
                                'The starter metadata snapshot was analyzed successfully.',
                            variant:
                                'success'
                        })
                    );
                }
            } catch (error) {
                this.analysisResult = null;

                this.errorMessage =
                    error?.body?.message ||
                    error?.message ||
                    'An unexpected Org Health error occurred.';

                this.dispatchEvent(
                    new ShowToastEvent({
                        title:
                            'Analysis failed',
                        message:
                            this.errorMessage,
                        variant:
                            'error'
                    })
                );
            } finally {
                this.isLoading = false;
            }
        }, 350);
    }

    buildStarterSnapshot() {
        return {
            organization: {
                id:
                    'starter-org',
                name:
                    'Salesforce AI Lab',
                userName:
                    'Salesforce Copilot Administrator',
                apiVersion:
                    '66.0',
                locale:
                    'en_US',
                timeZone:
                    'America/Chicago',
                isSandbox:
                    false
            },

            objects: [
                {
                    apiName:
                        'Account',
                    label:
                        'Account',
                    labelPlural:
                        'Accounts',
                    custom:
                        false,
                    accessible:
                        true,
                    queryable:
                        true,
                    searchable:
                        true,
                    createable:
                        true,
                    updateable:
                        true,
                    deletable:
                        true,
                    description:
                        'Stores organizations and business relationships.',

                    fields: [
                        {
                            apiName:
                                'Name',
                            label:
                                'Account Name',
                            dataType:
                                'String',
                            required:
                                true,
                            accessible:
                                true,
                            createable:
                                true,
                            updateable:
                                true,
                            description:
                                'The official account name.',
                            inlineHelpText:
                                'Enter the organization name.'
                        },
                        {
                            apiName:
                                'Customer_Health__c',
                            label:
                                'Customer Health',
                            dataType:
                                'Picklist',
                            custom:
                                true,
                            accessible:
                                true,
                            createable:
                                true,
                            updateable:
                                true,
                            usageCount:
                                4,
                            description:
                                'Tracks customer health.',
                            inlineHelpText:
                                'Select the current status.'
                        },
                        {
                            apiName:
                                'Legacy_Status__c',
                            label:
                                'Legacy Status',
                            dataType:
                                'Picklist',
                            custom:
                                true,
                            accessible:
                                true,
                            createable:
                                true,
                            updateable:
                                true,
                            usageCount:
                                0,
                            description:
                                'Legacy historical status.',
                            inlineHelpText:
                                'Do not use for new processes.'
                        }
                    ],

                    relationships: [],
                    recordTypes: []
                },

                {
                    apiName:
                        'Opportunity',
                    label:
                        'Opportunity',
                    labelPlural:
                        'Opportunities',
                    custom:
                        false,
                    accessible:
                        true,
                    queryable:
                        true,
                    searchable:
                        true,
                    createable:
                        true,
                    updateable:
                        true,
                    deletable:
                        true,
                    description:
                        'Tracks potential revenue.',

                    fields: [
                        {
                            apiName:
                                'Name',
                            label:
                                'Opportunity Name',
                            dataType:
                                'String',
                            required:
                                true,
                            accessible:
                                true,
                            createable:
                                true,
                            updateable:
                                true,
                            description:
                                'The opportunity name.',
                            inlineHelpText:
                                'Enter an opportunity name.'
                        },
                        {
                            apiName:
                                'Amount',
                            label:
                                'Amount',
                            dataType:
                                'Currency',
                            accessible:
                                true,
                            createable:
                                true,
                            updateable:
                                true,
                            description:
                                'Expected opportunity value.',
                            inlineHelpText:
                                'Enter expected revenue.'
                        }
                    ],

                    relationships: [],
                    recordTypes: []
                }
            ],

            flows: [
                {
                    apiName:
                        'Opportunity_Health_Monitor',
                    label:
                        'Opportunity Health Monitor',
                    status:
                        'Active',
                    flowType:
                        'Record-Triggered Flow',
                    apiVersion:
                        66,
                    description:
                        'Updates opportunity health.',
                    dmlCount:
                        2,
                    hasFaultPaths:
                        false,
                    elementCount:
                        18,
                    decisionCount:
                        3,
                    loopCount:
                        0,
                    hasEntryConditions:
                        true,
                    hasDmlInsideLoop:
                        false
                },
                {
                    apiName:
                        'Account_Risk_Notification',
                    label:
                        'Account Risk Notification',
                    status:
                        'Active',
                    flowType:
                        'Record-Triggered Flow',
                    apiVersion:
                        66,
                    description:
                        'Notifies account owners.',
                    dmlCount:
                        1,
                    hasFaultPaths:
                        false,
                    elementCount:
                        12,
                    decisionCount:
                        2,
                    loopCount:
                        0,
                    hasEntryConditions:
                        true,
                    hasDmlInsideLoop:
                        false
                },
                {
                    apiName:
                        'Weekly_Pipeline_Review',
                    label:
                        'Weekly Pipeline Review',
                    status:
                        'Active',
                    flowType:
                        'Scheduled Flow',
                    apiVersion:
                        66,
                    description:
                        'Creates weekly review tasks.',
                    dmlCount:
                        1,
                    hasFaultPaths:
                        true,
                    elementCount:
                        10,
                    decisionCount:
                        1,
                    loopCount:
                        1,
                    hasEntryConditions:
                        true,
                    hasDmlInsideLoop:
                        false
                }
            ],

            validationRules:
                Array.from(
                    {
                        length: 14
                    },
                    (
                        unusedValue,
                        index
                    ) => ({
                        apiName:
                            `Validation_Rule_${index + 1}`,
                        label:
                            `Validation Rule ${index + 1}`,
                        active:
                            true,
                        description:
                            `Protects business requirement ${index + 1}.`
                    })
                ),

            duplicateRules: [
                {
                    apiName:
                        'Account_Duplicate_Rule',
                    label:
                        'Account Duplicate Rule',
                    active:
                        false
                },
                {
                    apiName:
                        'Contact_Duplicate_Rule',
                    label:
                        'Contact Duplicate Rule',
                    active:
                        false
                },
                {
                    apiName:
                        'Lead_Duplicate_Rule',
                    label:
                        'Lead Duplicate Rule',
                    active:
                        false
                }
            ],

            matchingRules: [
                {
                    apiName:
                        'Account_Matching_Rule',
                    label:
                        'Account Matching Rule',
                    active:
                        true
                }
            ],

            permissionSets: [
                {
                    apiName:
                        'Salesforce_Copilot_Admin',
                    label:
                        'Salesforce Copilot Admin',
                    assignmentCount:
                        0,
                    description:
                        'Grants Copilot administration access.',
                    modifyAllData:
                        false,
                    viewAllData:
                        false,
                    manageUsers:
                        false
                }
            ],

            profiles: [],

            apexClasses: [
                {
                    apiName:
                        'OrgExplorerController',
                    label:
                        'Org Explorer Controller',
                    hasTestClass:
                        false,
                    description:
                        'Retrieves metadata for Org Explorer.'
                }
            ],

            reports: [],
            dashboards: [],

            deployments: [
                {
                    id:
                        'starter-deployment',
                    apiName:
                        'Org Knowledge Layer Deployment',
                    label:
                        'Org Knowledge Layer Deployment',
                    status:
                        'Succeeded',
                    success:
                        true,
                    testsRequired:
                        false,
                    testsRun:
                        false,
                    rollbackRequired:
                        false,
                    hasRollbackPlan:
                        false
                }
            ],

            metadataItems: [],

            recentChanges: [
                {
                    id:
                        'change-1',
                    title:
                        'Org Knowledge Layer deployed'
                },
                {
                    id:
                        'change-2',
                    title:
                        'Org Health rules created'
                }
            ],

            failedDeployments: []
        };
    }

    getStatusClass(status = '') {
        const normalized =
            String(status)
                .trim()
                .toLowerCase();

        if (
            normalized === 'healthy' ||
            normalized === 'excellent' ||
            normalized === 'ready'
        ) {
            return 'status-badge status-success';
        }

        if (
            normalized.includes('warning') ||
            normalized.includes('attention')
        ) {
            return 'status-badge status-warning';
        }

        if (
            normalized.includes('risk') ||
            normalized.includes('not ready') ||
            normalized.includes('critical')
        ) {
            return 'status-badge status-danger';
        }

        return 'status-badge status-neutral';
    }

    getSeverityClass(severity = '') {
        return `severity-badge severity-${String(
            severity
        )
            .trim()
            .toLowerCase()}`;
    }

    getPriorityClass(priority = '') {
        return `priority-badge priority-${String(
            priority
        )
            .trim()
            .toLowerCase()}`;
    }

    getProgressClass(score = 0) {
        if (score >= 90) {
            return 'progress-fill progress-success';
        }

        if (score >= 75) {
            return 'progress-fill progress-warning';
        }

        return 'progress-fill progress-danger';
    }

    createStableId(value = '') {
        return String(value)
            .trim()
            .toLowerCase()
            .replace(
                /[^a-z0-9]+/g,
                '-'
            )
            .replace(
                /^-|-$/g,
                ''
            );
    }
}