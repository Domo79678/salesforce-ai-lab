/*
 * metadataCoveragePanel.js
 *
 * Reusable Metadata Coverage presentation component.
 *
 * Displays:
 * - weighted metadata coverage score
 * - coverage confidence/status
 * - complete, partial, and missing categories
 * - known limitations
 * - next recommended collection target
 *
 * This component performs no metadata collection.
 * It receives the calculated coverage result from
 * the Salesforce Metadata Collector.
 */

import {
    LightningElement,
    api
} from 'lwc';

export default class MetadataCoveragePanel extends LightningElement {
    _coverage = null;

    @api
    get coverage() {
        return this._coverage;
    }

    set coverage(value) {
        this._coverage =
            value &&
            typeof value === 'object'
                ? value
                : null;
    }

    get hasCoverage() {
        return Boolean(
            this._coverage
        );
    }

    get score() {
        return this.clampScore(
            this._coverage?.score
        );
    }

    get scoreDisplay() {
        return `${this.score}/100`;
    }

    get status() {
        return (
            this._coverage?.status ||
            'Not Calculated'
        );
    }

    get summary() {
        return (
            this._coverage?.summary ||
            'Metadata coverage has not been calculated.'
        );
    }

    get totalCategories() {
        return this.toNumber(
            this._coverage
                ?.totalCategories
        );
    }

    get completeCategories() {
        return this.toNumber(
            this._coverage
                ?.completeCategories
        );
    }

    get partialCategories() {
        return this.toNumber(
            this._coverage
                ?.partialCategories
        );
    }

    get missingCategories() {
        return this.toNumber(
            this._coverage
                ?.missingCategories
        );
    }

    get coverageStyle() {
        return `width: ${this.score}%;`;
    }

    get coverageStatusClass() {
        const normalizedStatus =
            String(
                this.status || ''
            ).toLowerCase();

        if (
            normalizedStatus ===
            'complete'
        ) {
            return 'status-badge status-complete';
        }

        if (
            normalizedStatus ===
                'strong' ||
            normalizedStatus ===
                'moderate'
        ) {
            return 'status-badge status-moderate';
        }

        return 'status-badge status-partial';
    }

    get categoryCoverage() {
        const categories =
            Array.isArray(
                this._coverage
                    ?.categoryCoverage
            )
                ? this._coverage
                      .categoryCoverage
                : [];

        return categories.map(
            (
                category,
                index
            ) => ({
                ...category,

                id:
                    category.id ||
                    `coverage-category-${index}`,

                statusClass:
                    this.getCategoryStatusClass(
                        category.status
                    ),

                completionDisplay:
                    `${this.clampScore(
                        category
                            .completionPercentage
                    )}%`,

                weightDisplay:
                    `${this.toNumber(
                        category.weight
                    )}% weight`,

                itemCountDisplay:
                    this.buildItemCountDisplay(
                        category
                    )
            })
        );
    }

    get completedCategoryCoverage() {
        return this.categoryCoverage.filter(
            (category) =>
                category.status ===
                'Complete'
        );
    }

    get partialCategoryCoverage() {
        return this.categoryCoverage.filter(
            (category) =>
                category.status ===
                'Partial'
        );
    }

    get missingCategoryCoverage() {
        return this.categoryCoverage.filter(
            (category) =>
                [
                    'Not Started',
                    'Failed'
                ].includes(
                    category.status
                )
        );
    }

    get hasCompletedCategories() {
        return (
            this.completedCategoryCoverage
                .length > 0
        );
    }

    get hasPartialCategories() {
        return (
            this.partialCategoryCoverage
                .length > 0
        );
    }

    get hasMissingCategories() {
        return (
            this.missingCategoryCoverage
                .length > 0
        );
    }

    get limitations() {
        const limitations =
            Array.isArray(
                this._coverage
                    ?.limitations
            )
                ? this._coverage
                      .limitations
                : [];

        return limitations.map(
            (
                limitation,
                index
            ) => ({
                id:
                    `coverage-limitation-${index}`,

                text:
                    limitation
            })
        );
    }

    get hasLimitations() {
        return (
            this.limitations.length > 0
        );
    }

    get nextCollectionStep() {
        return (
            this._coverage
                ?.nextBestCollectionStep ||
            null
        );
    }

    get hasNextCollectionStep() {
        return Boolean(
            this.nextCollectionStep
                ?.label
        );
    }

    get nextCollectionLabel() {
        return (
            this.nextCollectionStep
                ?.label ||
            'No additional collection required'
        );
    }

    get nextCollectionPhase() {
        return (
            this.nextCollectionStep
                ?.phase ||
            ''
        );
    }

    get nextCollectionReason() {
        return (
            this.nextCollectionStep
                ?.reason ||
            ''
        );
    }

    get generatedAtLabel() {
        const generatedAt =
            this._coverage
                ?.generatedAt;

        if (!generatedAt) {
            return '';
        }

        const date =
            new Date(
                generatedAt
            );

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return generatedAt;
        }

        return date.toLocaleString();
    }

    getCategoryStatusClass(
        status = ''
    ) {
        switch (status) {
            case 'Complete':
                return 'category-status category-complete';

            case 'Partial':
                return 'category-status category-partial';

            case 'Failed':
                return 'category-status category-failed';

            default:
                return 'category-status category-missing';
        }
    }

    buildItemCountDisplay(
        category = {}
    ) {
        const itemCount =
            this.toNumber(
                category.itemCount
            );

        const expectedCount =
            category.expectedCount;

        if (
            expectedCount !== null &&
            expectedCount !== undefined
        ) {
            return `${itemCount} of ${this.toNumber(
                expectedCount
            )} expected items`;
        }

        return `${itemCount} items detected`;
    }

    clampScore(
        value = 0
    ) {
        const numericValue =
            Number(value);

        if (
            !Number.isFinite(
                numericValue
            )
        ) {
            return 0;
        }

        return Math.min(
            100,
            Math.max(
                0,
                Math.round(
                    numericValue
                )
            )
        );
    }

    toNumber(
        value,
        fallback = 0
    ) {
        const numericValue =
            Number(value);

        return Number.isFinite(
            numericValue
        )
            ? numericValue
            : fallback;
    }
}