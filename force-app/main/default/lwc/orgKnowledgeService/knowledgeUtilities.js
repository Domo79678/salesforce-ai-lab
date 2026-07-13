/*
 * knowledgeUtilities.js
 *
 * Shared utility functions for the Salesforce Copilot
 * Org Knowledge Layer.
 *
 * These helpers support:
 * - normalization
 * - sorting
 * - grouping
 * - filtering
 * - deduplication
 * - metadata conversion
 * - finding summaries
 * - recommendation summaries
 * - safe value handling
 */

export function normalizeText(value = '') {
    return String(value)
        .trim()
        .toLowerCase()
        .replace(/[’‘]/g, "'")
        .replace(/\s+/g, ' ');
}

export function normalizeApiName(value = '') {
    return String(value)
        .trim()
        .replace(/\s+/g, '');
}

export function normalizeArray(value) {
    return Array.isArray(value)
        ? [...value]
        : [];
}

export function safeString(
    value,
    fallback = ''
) {
    if (
        value === null ||
        value === undefined
    ) {
        return fallback;
    }

    const stringValue =
        String(value).trim();

    return stringValue || fallback;
}

export function safeBoolean(
    value,
    fallback = false
) {
    if (
        value === true ||
        value === false
    ) {
        return value;
    }

    if (
        typeof value === 'string'
    ) {
        const normalized =
            normalizeText(value);

        if (
            normalized === 'true' ||
            normalized === 'yes' ||
            normalized === '1'
        ) {
            return true;
        }

        if (
            normalized === 'false' ||
            normalized === 'no' ||
            normalized === '0'
        ) {
            return false;
        }
    }

    if (
        typeof value === 'number'
    ) {
        return value !== 0;
    }

    return fallback;
}

export function safeNumber(
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

export function clampNumber(
    value,
    minimum = 0,
    maximum = 100
) {
    const numericValue =
        safeNumber(value);

    return Math.min(
        maximum,
        Math.max(
            minimum,
            numericValue
        )
    );
}

export function clampScore(
    score = 0
) {
    return Math.round(
        clampNumber(
            score,
            0,
            100
        )
    );
}

export function includesAny(
    input = '',
    keywords = []
) {
    const normalizedInput =
        normalizeText(input);

    return normalizeArray(keywords)
        .some(
            (keyword) =>
                normalizedInput.includes(
                    normalizeText(keyword)
                )
        );
}

export function includesAll(
    input = '',
    keywords = []
) {
    const normalizedInput =
        normalizeText(input);

    const normalizedKeywords =
        normalizeArray(keywords);

    if (!normalizedKeywords.length) {
        return false;
    }

    return normalizedKeywords.every(
        (keyword) =>
            normalizedInput.includes(
                normalizeText(keyword)
            )
    );
}

export function countKeywordMatches(
    input = '',
    keywords = []
) {
    const normalizedInput =
        normalizeText(input);

    return normalizeArray(keywords)
        .reduce(
            (score, keyword) =>
                normalizedInput.includes(
                    normalizeText(keyword)
                )
                    ? score + 1
                    : score,
            0
        );
}

export function sortByString(
    items = [],
    propertyName = '',
    direction = 'asc'
) {
    const multiplier =
        direction === 'desc'
            ? -1
            : 1;

    return normalizeArray(items)
        .sort(
            (first, second) => {
                const firstValue =
                    normalizeText(
                        getNestedValue(
                            first,
                            propertyName
                        )
                    );

                const secondValue =
                    normalizeText(
                        getNestedValue(
                            second,
                            propertyName
                        )
                    );

                return (
                    firstValue.localeCompare(
                        secondValue
                    ) * multiplier
                );
            }
        );
}

export function sortByNumber(
    items = [],
    propertyName = '',
    direction = 'desc'
) {
    const multiplier =
        direction === 'asc'
            ? 1
            : -1;

    return normalizeArray(items)
        .sort(
            (first, second) => {
                const firstValue =
                    safeNumber(
                        getNestedValue(
                            first,
                            propertyName
                        )
                    );

                const secondValue =
                    safeNumber(
                        getNestedValue(
                            second,
                            propertyName
                        )
                    );

                return (
                    firstValue -
                    secondValue
                ) * multiplier;
            }
        );
}

export function sortFindingsBySeverity(
    findings = []
) {
    const severityWeights = {
        Critical: 5,
        High: 4,
        Medium: 3,
        Low: 2,
        Informational: 1
    };

    return normalizeArray(findings)
        .sort(
            (first, second) => {
                const firstWeight =
                    severityWeights[
                        first?.severity
                    ] || 0;

                const secondWeight =
                    severityWeights[
                        second?.severity
                    ] || 0;

                if (
                    firstWeight !==
                    secondWeight
                ) {
                    return (
                        secondWeight -
                        firstWeight
                    );
                }

                return (
                    safeNumber(
                        second?.scoreImpact
                    ) -
                    safeNumber(
                        first?.scoreImpact
                    )
                );
            }
        );
}

export function sortRecommendationsByPriority(
    recommendations = []
) {
    const priorityWeights = {
        Immediate: 5,
        High: 4,
        Medium: 3,
        Low: 2,
        Optional: 1
    };

    return normalizeArray(
        recommendations
    ).sort(
        (first, second) => {
            const firstWeight =
                priorityWeights[
                    first?.priority
                ] || 0;

            const secondWeight =
                priorityWeights[
                    second?.priority
                ] || 0;

            return (
                secondWeight -
                firstWeight
            );
        }
    );
}

export function groupBy(
    items = [],
    propertyName = ''
) {
    return normalizeArray(items)
        .reduce(
            (groups, item) => {
                const rawKey =
                    getNestedValue(
                        item,
                        propertyName
                    );

                const key =
                    safeString(
                        rawKey,
                        'Uncategorized'
                    );

                if (!groups[key]) {
                    groups[key] = [];
                }

                groups[key].push(item);

                return groups;
            },
            {}
        );
}

export function groupFindingsByCategory(
    findings = []
) {
    return groupBy(
        findings,
        'category'
    );
}

export function groupRecommendationsByCategory(
    recommendations = []
) {
    return groupBy(
        recommendations,
        'category'
    );
}

export function filterBySearchTerm(
    items = [],
    searchTerm = '',
    propertyNames = []
) {
    const normalizedSearchTerm =
        normalizeText(searchTerm);

    if (!normalizedSearchTerm) {
        return normalizeArray(items);
    }

    const searchableProperties =
        normalizeArray(propertyNames);

    return normalizeArray(items)
        .filter(
            (item) =>
                searchableProperties.some(
                    (propertyName) => {
                        const value =
                            getNestedValue(
                                item,
                                propertyName
                            );

                        return normalizeText(
                            value
                        ).includes(
                            normalizedSearchTerm
                        );
                    }
                )
        );
}

export function filterFindingsBySeverity(
    findings = [],
    severity = ''
) {
    const normalizedSeverity =
        normalizeText(severity);

    if (!normalizedSeverity) {
        return normalizeArray(findings);
    }

    return normalizeArray(findings)
        .filter(
            (finding) =>
                normalizeText(
                    finding?.severity
                ) === normalizedSeverity
        );
}

export function filterFindingsByCategory(
    findings = [],
    category = ''
) {
    const normalizedCategory =
        normalizeText(category);

    if (!normalizedCategory) {
        return normalizeArray(findings);
    }

    return normalizeArray(findings)
        .filter(
            (finding) =>
                normalizeText(
                    finding?.category
                ) === normalizedCategory
        );
}

export function deduplicateBy(
    items = [],
    propertyName = ''
) {
    const seenValues =
        new Set();

    return normalizeArray(items)
        .filter(
            (item) => {
                const rawValue =
                    getNestedValue(
                        item,
                        propertyName
                    );

                const normalizedValue =
                    normalizeText(rawValue);

                if (
                    !normalizedValue ||
                    seenValues.has(
                        normalizedValue
                    )
                ) {
                    return false;
                }

                seenValues.add(
                    normalizedValue
                );

                return true;
            }
        );
}

export function deduplicateStrings(
    values = []
) {
    const seenValues =
        new Set();

    return normalizeArray(values)
        .map(
            (value) =>
                safeString(value)
        )
        .filter(
            (value) => {
                const normalizedValue =
                    normalizeText(value);

                if (
                    !normalizedValue ||
                    seenValues.has(
                        normalizedValue
                    )
                ) {
                    return false;
                }

                seenValues.add(
                    normalizedValue
                );

                return true;
            }
        );
}

export function flattenArrays(
    arrays = []
) {
    return normalizeArray(arrays)
        .reduce(
            (combined, current) => [
                ...combined,
                ...normalizeArray(current)
            ],
            []
        );
}

export function createLookupMap(
    items = [],
    propertyName = 'apiName'
) {
    return normalizeArray(items)
        .reduce(
            (lookup, item) => {
                const key =
                    safeString(
                        getNestedValue(
                            item,
                            propertyName
                        )
                    );

                if (key) {
                    lookup[key] = item;
                }

                return lookup;
            },
            {}
        );
}

export function getNestedValue(
    object,
    path = ''
) {
    if (
        !object ||
        !path
    ) {
        return undefined;
    }

    return String(path)
        .split('.')
        .reduce(
            (currentValue, key) => {
                if (
                    currentValue ===
                        null ||
                    currentValue ===
                        undefined
                ) {
                    return undefined;
                }

                return currentValue[key];
            },
            object
        );
}

export function setNestedValue(
    object = {},
    path = '',
    value
) {
    if (!path) {
        return {
            ...object
        };
    }

    const result =
        deepClone(object);

    const keys =
        String(path).split('.');

    let current =
        result;

    keys.forEach(
        (key, index) => {
            const isLastKey =
                index ===
                keys.length - 1;

            if (isLastKey) {
                current[key] = value;
                return;
            }

            if (
                !current[key] ||
                typeof current[key] !==
                    'object'
            ) {
                current[key] = {};
            }

            current =
                current[key];
        }
    );

    return result;
}

export function deepClone(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return value;
    }

    return JSON.parse(
        JSON.stringify(value)
    );
}

export function createStableId(
    prefix = 'item',
    value = ''
) {
    const normalizedValue =
        normalizeText(value)
            .replace(
                /[^a-z0-9]+/g,
                '-'
            )
            .replace(
                /^-|-$/g,
                ''
            );

    return `${prefix}-${
        normalizedValue ||
        Date.now()
    }`;
}

export function calculateAverage(
    values = []
) {
    const numericValues =
        normalizeArray(values)
            .map(
                (value) =>
                    Number(value)
            )
            .filter(
                (value) =>
                    Number.isFinite(value)
            );

    if (!numericValues.length) {
        return 0;
    }

    const total =
        numericValues.reduce(
            (sum, value) =>
                sum + value,
            0
        );

    return (
        total /
        numericValues.length
    );
}

export function calculateWeightedAverage(
    items = [],
    scoreProperty = 'score',
    weightProperty = 'weight'
) {
    const normalizedItems =
        normalizeArray(items);

    let weightedTotal = 0;
    let totalWeight = 0;

    normalizedItems.forEach(
        (item) => {
            const score =
                safeNumber(
                    getNestedValue(
                        item,
                        scoreProperty
                    )
                );

            const weight =
                safeNumber(
                    getNestedValue(
                        item,
                        weightProperty
                    ),
                    1
                );

            weightedTotal +=
                score * weight;

            totalWeight +=
                weight;
        }
    );

    if (!totalWeight) {
        return 0;
    }

    return (
        weightedTotal /
        totalWeight
    );
}

export function calculateScoreAfterFindings(
    startingScore = 100,
    findings = []
) {
    const totalImpact =
        normalizeArray(findings)
            .reduce(
                (total, finding) =>
                    total +
                    safeNumber(
                        finding?.scoreImpact
                    ),
                0
            );

    return clampScore(
        startingScore -
        totalImpact
    );
}

export function summarizeFindings(
    findings = []
) {
    const normalizedFindings =
        normalizeArray(findings);

    return {
        total:
            normalizedFindings.length,

        critical:
            countByValue(
                normalizedFindings,
                'severity',
                'Critical'
            ),

        high:
            countByValue(
                normalizedFindings,
                'severity',
                'High'
            ),

        medium:
            countByValue(
                normalizedFindings,
                'severity',
                'Medium'
            ),

        low:
            countByValue(
                normalizedFindings,
                'severity',
                'Low'
            ),

        informational:
            countByValue(
                normalizedFindings,
                'severity',
                'Informational'
            ),

        blocking:
            normalizedFindings.filter(
                (finding) =>
                    Boolean(
                        finding?.blocking
                    )
            ).length,

        scoreImpact:
            normalizedFindings.reduce(
                (total, finding) =>
                    total +
                    safeNumber(
                        finding?.scoreImpact
                    ),
                0
            )
    };
}

export function summarizeRecommendations(
    recommendations = []
) {
    const normalizedRecommendations =
        normalizeArray(
            recommendations
        );

    return {
        total:
            normalizedRecommendations.length,

        immediate:
            countByValue(
                normalizedRecommendations,
                'priority',
                'Immediate'
            ),

        high:
            countByValue(
                normalizedRecommendations,
                'priority',
                'High'
            ),

        medium:
            countByValue(
                normalizedRecommendations,
                'priority',
                'Medium'
            ),

        low:
            countByValue(
                normalizedRecommendations,
                'priority',
                'Low'
            ),

        optional:
            countByValue(
                normalizedRecommendations,
                'priority',
                'Optional'
            )
    };
}

export function buildObjectSummary(
    objectProfile = {}
) {
    const label =
        safeString(
            objectProfile.label,
            objectProfile.apiName ||
                'Unknown Object'
        );

    const fieldCount =
        safeNumber(
            objectProfile?.counts?.fields
        );

    const relationshipCount =
        safeNumber(
            objectProfile
                ?.counts
                ?.relationships
        );

    const recordTypeCount =
        safeNumber(
            objectProfile
                ?.counts
                ?.recordTypes
        );

    const complexity =
        safeString(
            objectProfile.complexity,
            'Unknown'
        );

    return `${label} has ${fieldCount} fields, ${relationshipCount} relationships, ${recordTypeCount} record types, and ${complexity.toLowerCase()} complexity.`;
}

export function buildFieldSummary(
    fieldProfile = {}
) {
    const label =
        safeString(
            fieldProfile.label,
            fieldProfile.apiName ||
                'Unknown Field'
        );

    const dataType =
        safeString(
            fieldProfile.dataType,
            'Unknown'
        );

    const characteristics = [];

    if (fieldProfile.required) {
        characteristics.push(
            'required'
        );
    }

    if (fieldProfile.unique) {
        characteristics.push(
            'unique'
        );
    }

    if (fieldProfile.externalId) {
        characteristics.push(
            'an external ID'
        );
    }

    if (fieldProfile.calculated) {
        characteristics.push(
            'calculated'
        );
    }

    if (
        fieldProfile?.relationship
            ?.isRelationship
    ) {
        characteristics.push(
            'a relationship field'
        );
    }

    const characteristicText =
        characteristics.length
            ? ` It is ${characteristics.join(
                  ', '
              )}.`
            : '';

    return `${label} is a ${dataType} field.${characteristicText}`;
}

export function formatDateTime(
    value,
    locale = 'en-US'
) {
    if (!value) {
        return '';
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return '';
    }

    return new Intl.DateTimeFormat(
        locale,
        {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        }
    ).format(date);
}

export function formatPercent(
    value = 0
) {
    return `${clampScore(value)}%`;
}

export function formatCount(
    value = 0
) {
    return new Intl.NumberFormat(
        'en-US'
    ).format(
        safeNumber(value)
    );
}

export function mapObjectMetadata(
    rawObject = {}
) {
    return {
        apiName:
            safeString(
                rawObject.apiName ||
                    rawObject.name
            ),

        label:
            safeString(
                rawObject.label
            ),

        labelPlural:
            safeString(
                rawObject.labelPlural
            ),

        keyPrefix:
            safeString(
                rawObject.keyPrefix
            ),

        custom:
            safeBoolean(
                rawObject.custom
            ),

        accessible:
            safeBoolean(
                rawObject.accessible
            ),

        queryable:
            safeBoolean(
                rawObject.queryable
            ),

        searchable:
            safeBoolean(
                rawObject.searchable
            ),

        createable:
            safeBoolean(
                rawObject.createable
            ),

        updateable:
            safeBoolean(
                rawObject.updateable
            ),

        deletable:
            safeBoolean(
                rawObject.deletable
            ),

        fields:
            normalizeArray(
                rawObject.fields
            ),

        relationships:
            normalizeArray(
                rawObject.relationships
            ),

        recordTypes:
            normalizeArray(
                rawObject.recordTypes
            ),

        metadata: {
            ...rawObject
        }
    };
}

export function mapFieldMetadata(
    rawField = {},
    objectApiName = ''
) {
    const referenceTo =
        normalizeArray(
            rawField.referenceTo
        );

    return {
        apiName:
            safeString(
                rawField.apiName ||
                    rawField.name
            ),

        label:
            safeString(
                rawField.label
            ),

        objectApiName:
            safeString(
                objectApiName ||
                    rawField.objectApiName
            ),

        dataType:
            safeString(
                rawField.dataType ||
                    rawField.type
            ),

        custom:
            safeBoolean(
                rawField.custom
            ),

        required:
            deriveRequiredStatus(
                rawField
            ),

        unique:
            safeBoolean(
                rawField.unique
            ),

        externalId:
            safeBoolean(
                rawField.externalId
            ),

        calculated:
            safeBoolean(
                rawField.calculated
            ),

        encrypted:
            safeBoolean(
                rawField.encrypted
            ),

        accessible:
            safeBoolean(
                rawField.accessible
            ),

        createable:
            safeBoolean(
                rawField.createable
            ),

        updateable:
            safeBoolean(
                rawField.updateable
            ),

        relationshipName:
            safeString(
                rawField.relationshipName
            ),

        referenceTo,

        length:
            normalizeNullableNumber(
                rawField.length
            ),

        precision:
            normalizeNullableNumber(
                rawField.precision
            ),

        scale:
            normalizeNullableNumber(
                rawField.scale
            ),

        metadata: {
            ...rawField
        }
    };
}

export function mapRelationshipMetadata(
    rawField = {},
    sourceObject = ''
) {
    return {
        fieldApiName:
            safeString(
                rawField.apiName ||
                    rawField.name
            ),

        fieldLabel:
            safeString(
                rawField.label
            ),

        sourceObject:
            safeString(
                sourceObject
            ),

        targetObjects:
            normalizeArray(
                rawField.referenceTo
            ),

        relationshipName:
            safeString(
                rawField.relationshipName
            ),

        required:
            deriveRequiredStatus(
                rawField
            ),

        custom:
            safeBoolean(
                rawField.custom
            )
    };
}

export function mapRecordTypeMetadata(
    rawRecordType = {}
) {
    return {
        id:
            safeString(
                rawRecordType.id ||
                    rawRecordType.recordTypeId
            ),

        developerName:
            safeString(
                rawRecordType
                    .developerName
            ),

        name:
            safeString(
                rawRecordType.name
            ),

        active:
            safeBoolean(
                rawRecordType.active
            ),

        defaultRecordTypeMapping:
            safeBoolean(
                rawRecordType
                    .defaultRecordTypeMapping
            ),

        available:
            safeBoolean(
                rawRecordType.available
            ),

        master:
            safeBoolean(
                rawRecordType.master
            )
    };
}

export function isCustomApiName(
    apiName = ''
) {
    const normalizedApiName =
        safeString(apiName);

    return (
        normalizedApiName.endsWith(
            '__c'
        ) ||
        normalizedApiName.endsWith(
            '__mdt'
        ) ||
        normalizedApiName.endsWith(
            '__e'
        ) ||
        normalizedApiName.endsWith(
            '__b'
        )
    );
}

export function isRelationshipField(
    field = {}
) {
    return (
        normalizeArray(
            field.referenceTo
        ).length > 0 ||
        Boolean(
            field.relationshipName
        )
    );
}

export function deriveRequiredStatus(
    field = {}
) {
    if (
        field.required !==
            undefined &&
        field.required !== null
    ) {
        return safeBoolean(
            field.required
        );
    }

    const nillable =
        safeBoolean(
            field.nillable,
            true
        );

    const defaultedOnCreate =
        safeBoolean(
            field.defaultedOnCreate,
            false
        );

    return (
        !nillable &&
        !defaultedOnCreate
    );
}

export function countByValue(
    items = [],
    propertyName = '',
    expectedValue = ''
) {
    const normalizedExpectedValue =
        normalizeText(
            expectedValue
        );

    return normalizeArray(items)
        .filter(
            (item) =>
                normalizeText(
                    getNestedValue(
                        item,
                        propertyName
                    )
                ) ===
                normalizedExpectedValue
        )
        .length;
}

function normalizeNullableNumber(
    value
) {
    if (
        value === null ||
        value === undefined ||
        value === ''
    ) {
        return null;
    }

    return safeNumber(value);
}