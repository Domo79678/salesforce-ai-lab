/*
 * dependencyUtilities.js
 *
 * Shared helper methods used throughout the Salesforce Copilot
 * Dependency Intelligence layer.
 *
 * This file contains NO Salesforce-specific logic.
 */

import { ENTITY_TYPES } from './intelligenceModels';

/**
 * Creates a normalized dependency object.
 */
export function createDependency({
    id = '',
    label = '',
    apiName = '',
    type = ENTITY_TYPES.UNKNOWN,
    category = '',
    direction = 'related',
    relationship = '',
    severity = 'Low',
    confidence = 100,
    source = '',
    live = true
} = {}) {
    return {
        id,
        label,
        apiName,
        type,
        category,
        direction,
        relationship,
        severity,
        confidence,
        source,
        live
    };
}

/**
 * Creates an empty dependency graph node.
 */
export function createNode(entity) {
    return {
        entity,
        inbound: [],
        outbound: [],
        related: []
    };
}

/**
 * Creates a relationship edge.
 */
export function createEdge(from, to, relationship) {
    return {
        from,
        to,
        relationship
    };
}

/**
 * Clone an object safely.
 */
export function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

/**
 * Remove duplicate dependencies.
 */
export function deduplicate(list = []) {

    const seen = new Set();

    return list.filter(item => {

        const key =
            `${item.type}|${item.apiName}|${item.direction}`;

        if (seen.has(key)) {
            return false;
        }

        seen.add(key);

        return true;
    });

}

/**
 * Alphabetical sort.
 */
export function sortAlphabetically(list = []) {

    return [...list].sort((a, b) =>
        a.label.localeCompare(b.label)
    );

}

/**
 * Sort by severity.
 */
export function sortBySeverity(list = []) {

    const order = {
        Critical: 1,
        High: 2,
        Medium: 3,
        Low: 4
    };

    return [...list].sort(
        (a, b) =>
            order[a.severity] -
            order[b.severity]
    );

}

/**
 * Group by type.
 */
export function groupByType(list = []) {

    return list.reduce((groups, item) => {

        if (!groups[item.type]) {
            groups[item.type] = [];
        }

        groups[item.type].push(item);

        return groups;

    }, {});

}

/**
 * Group by category.
 */
export function groupByCategory(list = []) {

    return list.reduce((groups, item) => {

        if (!groups[item.category]) {
            groups[item.category] = [];
        }

        groups[item.category].push(item);

        return groups;

    }, {});

}

/**
 * Count by severity.
 */
export function countBySeverity(list = []) {

    return {

        Critical:
            list.filter(
                x => x.severity === 'Critical'
            ).length,

        High:
            list.filter(
                x => x.severity === 'High'
            ).length,

        Medium:
            list.filter(
                x => x.severity === 'Medium'
            ).length,

        Low:
            list.filter(
                x => x.severity === 'Low'
            ).length

    };

}

/**
 * Count by metadata type.
 */
export function countByType(list = []) {

    const counts = {};

    list.forEach(item => {

        counts[item.type] =
            (counts[item.type] || 0) + 1;

    });

    return counts;

}

/**
 * Returns inbound dependencies.
 */
export function inbound(graph) {

    return graph.inbound || [];

}

/**
 * Returns outbound dependencies.
 */
export function outbound(graph) {

    return graph.outbound || [];

}

/**
 * Returns related dependencies.
 */
export function related(graph) {

    return graph.related || [];

}

/**
 * Builds a dependency summary.
 */
export function buildSummary(graph) {

    return {

        inbound:
            inbound(graph).length,

        outbound:
            outbound(graph).length,

        related:
            related(graph).length,

        total:
            inbound(graph).length +
            outbound(graph).length +
            related(graph).length

    };

}

/**
 * Build dependency statistics.
 */
export function buildStatistics(graph) {

    const all = [

        ...inbound(graph),

        ...outbound(graph),

        ...related(graph)

    ];

    return {

        total: all.length,

        byType:
            countByType(all),

        bySeverity:
            countBySeverity(all)

    };

}

/**
 * Checks if dependency is critical.
 */
export function isCritical(item) {

    return item.severity === 'Critical';

}

/**
 * Checks direction.
 */
export function isInbound(item) {

    return item.direction === 'inbound';

}

export function isOutbound(item) {

    return item.direction === 'outbound';

}

export function isRelated(item) {

    return item.direction === 'related';

}