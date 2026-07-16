/*
 * orgKnowledgeViewer.js
 *
 * Diagnostic viewer for the Salesforce Copilot Org Knowledge Layer.
 *
 * Provides:
 * - live metadata scanning
 * - configurable scan depth
 * - Org Health and Deployment Readiness
 * - explainable score deductions
 * - grouped findings
 * - browser-based trend comparison
 * - Daily Admin Brief priorities
 */

import { LightningElement, api } from 'lwc';

import {
    getOrgSummary,
    getObjects,
    getObjectContext
} from 'c/orgContextService';

import {
    analyzeOrgKnowledge,
    getOrgHealthSummary,
    getTopPriorities,
    getDeploymentBlockers
} from 'c/orgKnowledgeService';

const SCAN_LIMITS = Object.freeze({
    Quick: 12,
    Standard: 25,
    Extended: 50
});

const PRIORITY_OBJECTS = [
    'Account',
    'Contact',
    'Opportunity',
    'Lead',
    'Case',
    'Campaign',
    'Task',
    'User'
];

const TREND_STORAGE_KEY =
    'salesforceCopilot.orgKnowledgeViewer.previousAnalysis';

export default class OrgKnowledgeViewer extends LightningElement {
    @api scanMode = 'Standard';

    isLoading = false;
    hasLoaded = false;

    errorMessage = '';
    successMessage = '';

    analysisResult = null;
    previousAnalysis = null;

    orgSummary = null;
    objectInventory = [];

    detailedObjectCount = 0;
    analysisStartedAt = '';
    analysisCompletedAt = '';
    lastRefreshId = 0;

    connectedObjectNames = [];

    connectedCallback() {
        this.restorePreviousAnalysis();
        this.loadOrgKnowledge();
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

    get scanLimit() {
        return (
            SCAN_LIMITS[this.scanMode] ||
            SCAN_LIMITS.Standard
        );
    }

    get scanModeLabel() {
        return `${this.scanMode} scan`;
    }

    get health() {
        return this.analysisResult?.health || null;
    }

    get deploymentReadiness() {
        return (
            this.analysisResult?.deploymentReadiness ||
            null
        );
    }

    get dailyBrief() {
        return (
            this.analysisResult?.dailyBrief ||
            null
        );
    }

    get dashboardMetrics() {
        return (
            this.analysisResult?.dashboardMetrics ||
            {}
        );
    }

    get metadataCounts() {
        return (
            this.analysisResult?.metadataCounts ||
            {}
        );
    }

    get findings() {
        return this.analysisResult?.findings || [];
    }

    get recommendations() {
        return (
            this.analysisResult?.recommendations ||
            []
        );
    }

    get categoryResults() {
        return (
            this.analysisResult?.health?.categories ||
            []
        );
    }

    get topFindings() {
        return this.findings.slice(0, 10);
    }

    get topRecommendations() {
        if (!this.analysisResult) {
            return [];
        }

        return getTopPriorities(
            this.analysisResult,
            10
        );
    }

    get deploymentBlockers() {
        if (!this.analysisResult) {
            return [];
        }

        return getDeploymentBlockers(
            this.analysisResult
        );
    }

    get hasFindings() {
        return this.findings.length > 0;
    }

    get hasRecommendations() {
        return this.recommendations.length > 0;
    }

    get hasCategories() {
        return this.categoryResults.length > 0;
    }

    get hasDeploymentBlockers() {
        return this.deploymentBlockers.length > 0;
    }

    get hasDailyPriorities() {
        return Boolean(
            this.dailyBrief &&
            Array.isArray(
                this.dailyBrief.priorities
            ) &&
            this.dailyBrief.priorities.length
        );
    }

    /*
     * Grouped findings power:
     * - categorized UI sections
     * - Daily Admin Brief summaries
     * - explainable health score content
     */
    get groupedFindings() {
        const grouped = new Map();

        this.findings.forEach((finding) => {
            const category =
                finding.category ||
                'Uncategorized';

            if (!grouped.has(category)) {
                grouped.set(category, []);
            }

            grouped.get(category).push(finding);
        });

        return Array.from(grouped.entries())
            .map(([category, findings]) => ({
                category,
                findings,
                findingCount: findings.length,
                totalScoreImpact: findings.reduce(
                    (total, finding) =>
                        total +
                        Number(
                            finding.scoreImpact || 0
                        ),
                    0
                ),
                criticalCount: findings.filter(
                    (finding) =>
                        finding.severity ===
                        'Critical'
                ).length,
                highCount: findings.filter(
                    (finding) =>
                        finding.severity ===
                        'High'
                ).length
            }))
            .sort(
                (first, second) =>
                    second.totalScoreImpact -
                    first.totalScoreImpact
            );
    }

    get hasGroupedFindings() {
        return this.groupedFindings.length > 0;
    }

    /*
     * Explain exactly why the score is not 100.
     */
    get healthScoreExplanation() {
        const deduction =
            Math.max(
                0,
                100 - this.orgHealthScore
            );

        if (!this.findings.length) {
            return {
                title:
                    'No deductions were generated',
                summary:
                    'No findings were detected in the metadata analyzed. This does not mean every metadata type in the org was verified.',
                deduction: 0,
                categories: []
            };
        }

        const affectedCategories =
            this.groupedFindings.filter(
                (group) =>
                    group.totalScoreImpact > 0
            );

        return {
            title:
                `Why the score is ${this.orgHealthScore}/100`,

            summary:
                `${deduction} total health points were deducted based on ${this.totalFindings} explainable findings across ${affectedCategories.length} categories.`,

            deduction,

            categories:
                affectedCategories
        };
    }

    get healthExplanationCategories() {
        return (
            this.healthScoreExplanation.categories ||
            []
        );
    }

    get hasHealthExplanationCategories() {
        return (
            this.healthExplanationCategories.length >
            0
        );
    }

    get orgHealthScore() {
        return (
            this.dashboardMetrics.orgHealthScore ??
            0
        );
    }

    get orgHealthDisplay() {
        return `${this.orgHealthScore}/100`;
    }

    get orgHealthStatus() {
        return (
            this.dashboardMetrics.orgHealthStatus ||
            'Unknown'
        );
    }

    get deploymentScore() {
        return (
            this.dashboardMetrics
                .deploymentReadinessScore ??
            0
        );
    }

    get deploymentScoreDisplay() {
        return `${this.deploymentScore}/100`;
    }

    get deploymentStatus() {
        return (
            this.dashboardMetrics
                .deploymentReadinessStatus ||
            'Unknown'
        );
    }

    get organizationName() {
        return (
            this.analysisResult?.organization?.name ||
            this.orgSummary?.name ||
            'Unknown Organization'
        );
    }

    /*
     * Use the complete inventory, not only the detailed
     * object profiles passed to the knowledge engine.
     */
    get totalObjects() {
        return this.objectInventory.length;
    }

    get totalFields() {
        return this.metadataCounts.fields ?? 0;
    }

    get totalFindings() {
        return (
            this.dashboardMetrics.totalFindings ??
            this.findings.length
        );
    }

    get criticalFindings() {
        return (
            this.dashboardMetrics
                .criticalFindings ??
            0
        );
    }

    get highFindings() {
        return (
            this.dashboardMetrics.highFindings ??
            0
        );
    }

    get blockingFindings() {
        return (
            this.dashboardMetrics
                .blockingFindings ??
            0
        );
    }

    get totalRecommendations() {
        return (
            this.dashboardMetrics
                .totalRecommendations ??
            this.recommendations.length
        );
    }

    get lowestCategory() {
        return (
            this.dashboardMetrics.lowestCategory ||
            'None'
        );
    }

    get lowestCategoryScore() {
        return (
            this.dashboardMetrics
                .lowestCategoryScore ??
            100
        );
    }

    get highestRiskCategory() {
        return (
            this.dashboardMetrics
                .highestRiskCategory ||
            'None'
        );
    }

    get highestRiskLevel() {
        return (
            this.dashboardMetrics
                .highestRiskLevel ||
            'None'
        );
    }

    get coverageLabel() {
        return `${this.detailedObjectCount} detailed objects analyzed from ${this.objectInventory.length} inventory objects`;
    }

    get sourceLabel() {
        return 'Live Salesforce metadata';
    }

    get generatedAtLabel() {
        return (
            this.dailyBrief?.generatedAtLabel ||
            this.analysisResult?.generatedAt ||
            ''
        );
    }

    get analysisDurationLabel() {
        if (
            !this.analysisStartedAt ||
            !this.analysisCompletedAt
        ) {
            return '';
        }

        const started =
            new Date(
                this.analysisStartedAt
            ).getTime();

        const completed =
            new Date(
                this.analysisCompletedAt
            ).getTime();

        if (
            Number.isNaN(started) ||
            Number.isNaN(completed)
        ) {
            return '';
        }

        return `${Math.max(
            0,
            completed - started
        )} ms`;
    }

    get healthSummary() {
        if (!this.hasAnalysis) {
            return null;
        }

        return getOrgHealthSummary(
            this.analysisResult
        );
    }

    /*
     * Browser-local trend comparison.
     *
     * This is an MVP trend feature. It compares the current
     * scan to the previous scan stored in this browser.
     * It is not yet shared across users or devices.
     */
    get hasTrendData() {
        return Boolean(this.previousAnalysis);
    }

    get healthTrendDifference() {
        if (!this.hasTrendData) {
            return 0;
        }

        return (
            this.orgHealthScore -
            Number(
                this.previousAnalysis
                    .orgHealthScore || 0
            )
        );
    }

    get deploymentTrendDifference() {
        if (!this.hasTrendData) {
            return 0;
        }

        return (
            this.deploymentScore -
            Number(
                this.previousAnalysis
                    .deploymentScore || 0
            )
        );
    }

    get findingTrendDifference() {
        if (!this.hasTrendData) {
            return 0;
        }

        return (
            this.totalFindings -
            Number(
                this.previousAnalysis
                    .totalFindings || 0
            )
        );
    }

    get healthTrendLabel() {
        return this.formatTrend(
            this.healthTrendDifference,
            'points'
        );
    }

    get deploymentTrendLabel() {
        return this.formatTrend(
            this.deploymentTrendDifference,
            'points'
        );
    }

    get findingTrendLabel() {
        const difference =
            this.findingTrendDifference;

        if (difference === 0) {
            return 'No change';
        }

        if (difference > 0) {
            return `+${difference} findings`;
        }

        return `${difference} findings`;
    }

    get previousAnalysisLabel() {
        return (
            this.previousAnalysis?.generatedAt ||
            'No previous scan'
        );
    }

    async loadOrgKnowledge() {
        if (this.isLoading) {
            return;
        }

        this.clearMessages();
        this.isLoading = true;
        this.hasLoaded = false;

        /*
         * Forces a visible refresh lifecycle even when
         * Salesforce returns identical metadata.
         */
        this.lastRefreshId += 1;
        this.analysisStartedAt =
            new Date().toISOString();

        try {
            const [
                rawOrgSummary,
                rawObjectInventory
            ] = await Promise.all([
                getOrgSummary(),
                getObjects()
            ]);

            this.orgSummary =
                this.normalizeOrgSummary(
                    rawOrgSummary
                );

            this.objectInventory =
                this.normalizeObjectInventory(
                    rawObjectInventory
                );

            const selectedObjects =
                this.selectObjectsForDetailedScan(
                    this.objectInventory
                );

            const detailedObjects =
                await this.loadDetailedObjects(
                    selectedObjects
                );

            this.detailedObjectCount =
                detailedObjects.length;

            this.connectedObjectNames =
                detailedObjects.map(
                    (objectItem) =>
                        objectItem.apiName ||
                        objectItem.name
                );

            const snapshot =
                this.buildOrgSnapshot({
                    organization:
                        this.orgSummary,
                    inventory:
                        this.objectInventory,
                    detailedObjects
                });

            const analysis =
                analyzeOrgKnowledge(
                    snapshot,
                    {
                        analysisMode: 'full'
                    }
                );

            if (!analysis?.success) {
                throw new Error(
                    this.extractAnalysisError(
                        analysis
                    )
                );
            }

            /*
             * Store the old result before replacing it,
             * allowing immediate current-vs-previous display.
             */
            if (this.analysisResult?.success) {
                this.previousAnalysis =
                    this.createTrendSnapshot(
                        this.analysisResult
                    );
            }

            this.analysisResult = analysis;
            this.hasLoaded = true;

            this.analysisCompletedAt =
                new Date().toISOString();

            this.persistCurrentAnalysis();

            this.successMessage =
                `Org Knowledge analysis refreshed for ${this.organizationName} using the ${this.scanModeLabel}.`;
        } catch (error) {
            this.analysisCompletedAt =
                new Date().toISOString();

            this.errorMessage =
                this.getErrorMessage(error);
        } finally {
            this.isLoading = false;
        }
    }

    async loadDetailedObjects(
        selectedObjects = []
    ) {
        if (!selectedObjects.length) {
            return [];
        }

        /*
         * Process in controlled groups rather than issuing
         * every request simultaneously.
         */
        const batchSize = 10;
        const detailedObjects = [];

        for (
            let index = 0;
            index < selectedObjects.length;
            index += batchSize
        ) {
            const batch =
                selectedObjects.slice(
                    index,
                    index + batchSize
                );

            const batchResults =
                await Promise.all(
                    batch.map(
                        async (objectItem) => {
                            const apiName =
                                objectItem.apiName ||
                                objectItem.name;

                            try {
                                const context =
                                    await getObjectContext(
                                        apiName
                                    );

                                return this.mergeObjectContext(
                                    objectItem,
                                    context
                                );
                            } catch (error) {
                                return {
                                    ...objectItem,

                                    fields: [],
                                    relationships: [],
                                    recordTypes: [],

                                    metadataLoadError:
                                        this.getErrorMessage(
                                            error
                                        )
                                };
                            }
                        }
                    )
                );

            detailedObjects.push(
                ...batchResults
            );
        }

        return detailedObjects;
    }

    selectObjectsForDetailedScan(
        objectInventory = []
    ) {
        const objects =
            Array.isArray(objectInventory)
                ? [...objectInventory]
                : [];

        const selected = [];
        const selectedNames = new Set();
        const maximumObjects =
            this.scanLimit;

        const addObject = (objectItem) => {
            const apiName =
                objectItem.apiName ||
                objectItem.name;

            if (
                !apiName ||
                selectedNames.has(apiName) ||
                selected.length >= maximumObjects
            ) {
                return;
            }

            selected.push(objectItem);
            selectedNames.add(apiName);
        };

        PRIORITY_OBJECTS.forEach(
            (priorityApiName) => {
                const objectItem =
                    objects.find(
                        (candidate) =>
                            (
                                candidate.apiName ||
                                candidate.name
                            ) === priorityApiName
                    );

                if (objectItem) {
                    addObject(objectItem);
                }
            }
        );

        objects
            .filter(
                (objectItem) =>
                    Boolean(objectItem.custom)
            )
            .forEach(addObject);

        objects.forEach(addObject);

        return selected;
    }

    buildOrgSnapshot({
        organization = {},
        inventory = [],
        detailedObjects = []
    } = {}) {
        return {
            organization: {
                ...organization,

                /*
                 * Preserve complete inventory counts.
                 * The service analyzes only detailedObjects,
                 * but the organization summary still knows
                 * the complete accessible inventory.
                 */
                totalObjects: inventory.length,

                standardObjects:
                    inventory.filter(
                        (objectItem) =>
                            !objectItem.custom
                    ).length,

                customObjects:
                    inventory.filter(
                        (objectItem) =>
                            objectItem.custom
                    ).length,

                accessibleObjects:
                    inventory.filter(
                        (objectItem) =>
                            objectItem.accessible !==
                            false
                    ).length,

                queryableObjects:
                    inventory.filter(
                        (objectItem) =>
                            objectItem.queryable !==
                            false
                    ).length
            },

            objects: detailedObjects,

            flows: [],
            validationRules: [],
            duplicateRules: [],
            matchingRules: [],
            permissionSets: [],
            profiles: [],
            apexClasses: [],
            apexTriggers: [],
            reports: [],
            dashboards: [],
            deployments: [],
            metadataItems: [],
            recentChanges: [],
            failedDeployments: [],

            scanCoverage: {
                mode: this.scanMode,
                inventoryCount:
                    inventory.length,
                detailedObjectCount:
                    detailedObjects.length
            },

            retrievedAt:
                new Date().toISOString(),

            source:
                'Org Context Service'
        };
    }

    normalizeOrgSummary(
        rawOrgSummary = {}
    ) {
        return {
            id:
                rawOrgSummary.id ||
                rawOrgSummary.organizationId ||
                '',

            name:
                rawOrgSummary.name ||
                rawOrgSummary.organizationName ||
                'Unknown Organization',

            userName:
                rawOrgSummary.userName ||
                rawOrgSummary.username ||
                '',

            userEmail:
                rawOrgSummary.userEmail ||
                rawOrgSummary.email ||
                '',

            apiVersion:
                rawOrgSummary.apiVersion ||
                '',

            locale:
                rawOrgSummary.locale ||
                '',

            timeZone:
                rawOrgSummary.timeZone ||
                rawOrgSummary.timeZoneSidKey ||
                '',

            organizationType:
                rawOrgSummary.organizationType ||
                rawOrgSummary.orgType ||
                '',

            instanceName:
                rawOrgSummary.instanceName ||
                '',

            namespacePrefix:
                rawOrgSummary.namespacePrefix ||
                '',

            isSandbox:
                Boolean(
                    rawOrgSummary.isSandbox
                ),

            metadata: {
                ...rawOrgSummary
            }
        };
    }

    normalizeObjectInventory(
        rawObjectInventory
    ) {
        const source =
            Array.isArray(rawObjectInventory)
                ? rawObjectInventory
                : rawObjectInventory?.objects ||
                  rawObjectInventory?.items ||
                  [];

        return source.map(
            (objectItem) => ({
                apiName:
                    objectItem.apiName ||
                    objectItem.name ||
                    '',

                name:
                    objectItem.name ||
                    objectItem.apiName ||
                    '',

                label:
                    objectItem.label ||
                    objectItem.apiName ||
                    objectItem.name ||
                    '',

                labelPlural:
                    objectItem.labelPlural ||
                    objectItem.label ||
                    '',

                keyPrefix:
                    objectItem.keyPrefix ||
                    '',

                custom:
                    Boolean(
                        objectItem.custom
                    ),

                accessible:
                    objectItem.accessible !==
                    false,

                queryable:
                    objectItem.queryable !==
                    false,

                searchable:
                    Boolean(
                        objectItem.searchable
                    ),

                createable:
                    Boolean(
                        objectItem.createable
                    ),

                updateable:
                    Boolean(
                        objectItem.updateable
                    ),

                deletable:
                    Boolean(
                        objectItem.deletable
                    ),

                metadata: {
                    ...objectItem
                }
            })
        );
    }

    mergeObjectContext(
        inventoryObject = {},
        rawContext = {}
    ) {
        const context =
            rawContext?.objectContext ||
            rawContext?.object ||
            rawContext ||
            {};

        return {
            ...inventoryObject,
            ...context,

            apiName:
                context.apiName ||
                context.name ||
                inventoryObject.apiName ||
                inventoryObject.name,

            name:
                context.name ||
                context.apiName ||
                inventoryObject.name ||
                inventoryObject.apiName,

            label:
                context.label ||
                inventoryObject.label,

            labelPlural:
                context.labelPlural ||
                inventoryObject.labelPlural,

            custom:
                context.custom ??
                inventoryObject.custom,

            accessible:
                context.accessible ??
                inventoryObject.accessible,

            queryable:
                context.queryable ??
                inventoryObject.queryable,

            searchable:
                context.searchable ??
                inventoryObject.searchable,

            createable:
                context.createable ??
                inventoryObject.createable,

            updateable:
                context.updateable ??
                inventoryObject.updateable,

            deletable:
                context.deletable ??
                inventoryObject.deletable,

            fields:
                Array.isArray(context.fields)
                    ? context.fields
                    : [],

            relationships:
                Array.isArray(
                    context.relationships
                )
                    ? context.relationships
                    : [],

            recordTypes:
                Array.isArray(
                    context.recordTypes
                )
                    ? context.recordTypes
                    : [],

            metadata: {
                ...inventoryObject.metadata,
                ...context
            }
        };
    }

    handleRefresh() {
        this.loadOrgKnowledge();
    }

    handleRunAgain() {
        this.loadOrgKnowledge();
    }

    handleClear() {
        this.resetResults();
        this.clearMessages();
    }

    resetResults() {
        this.analysisResult = null;
        this.orgSummary = null;
        this.objectInventory = [];
        this.detailedObjectCount = 0;
        this.connectedObjectNames = [];
        this.hasLoaded = false;
        this.analysisStartedAt = '';
        this.analysisCompletedAt = '';
    }

    clearMessages() {
        this.errorMessage = '';
        this.successMessage = '';
    }

    createTrendSnapshot(
        analysis = {}
    ) {
        const metrics =
            analysis.dashboardMetrics || {};

        return {
            orgHealthScore:
                Number(
                    metrics.orgHealthScore || 0
                ),

            deploymentScore:
                Number(
                    metrics
                        .deploymentReadinessScore ||
                    0
                ),

            totalFindings:
                Number(
                    metrics.totalFindings ||
                    analysis.findings?.length ||
                    0
                ),

            totalRecommendations:
                Number(
                    metrics.totalRecommendations ||
                    analysis.recommendations
                        ?.length ||
                    0
                ),

            generatedAt:
                analysis.generatedAt ||
                new Date().toISOString()
        };
    }

    restorePreviousAnalysis() {
        try {
            const storedValue =
                window.localStorage.getItem(
                    TREND_STORAGE_KEY
                );

            if (storedValue) {
                this.previousAnalysis =
                    JSON.parse(storedValue);
            }
        } catch (error) {
            this.previousAnalysis = null;
        }
    }

    persistCurrentAnalysis() {
        if (!this.analysisResult) {
            return;
        }

        try {
            const trendSnapshot =
                this.createTrendSnapshot(
                    this.analysisResult
                );

            /*
             * Save the current run for comparison during
             * the next page load or next browser session.
             */
            window.localStorage.setItem(
                TREND_STORAGE_KEY,
                JSON.stringify(
                    trendSnapshot
                )
            );
        } catch (error) {
            /*
             * Trend storage is optional and should not
             * block the core analysis.
             */
        }
    }

    formatTrend(
        difference = 0,
        unit = ''
    ) {
        if (difference === 0) {
            return 'No change';
        }

        if (difference > 0) {
            return `+${difference} ${unit}`;
        }

        return `${difference} ${unit}`;
    }

    extractAnalysisError(
        analysis = {}
    ) {
        if (
            Array.isArray(analysis.errors) &&
            analysis.errors.length
        ) {
            return (
                analysis.errors[0]?.message ||
                'The Org Knowledge analysis failed.'
            );
        }

        return 'The Org Knowledge analysis failed.';
    }

    getErrorMessage(error) {
        if (!error) {
            return 'An unknown Org Knowledge error occurred.';
        }

        if (
            typeof error.message ===
            'string'
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

        if (
            error.detail &&
            typeof error.detail ===
                'string'
        ) {
            return error.detail;
        }

        return 'The Org Knowledge Viewer could not complete the analysis.';
    }
}