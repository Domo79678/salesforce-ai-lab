/*
 * dependencyGraph.js
 *
 * Builds a reusable dependency graph for Salesforce Copilot.
 *
 * This module knows nothing about Apex,
 * Flows, Validation Rules, etc.
 *
 * It only understands graph relationships.
 */

import {
    createNode,
    createEdge,
    deduplicate,
    buildSummary,
    buildStatistics
} from './dependencyUtilities';

/*
---------------------------------------
Public API
---------------------------------------
*/

/**
 * Creates a graph from a dependency list.
 */
export function buildDependencyGraph(
    entity,
    dependencies = []
) {

    const graph =
        createNode(entity);

    deduplicate(dependencies)
        .forEach(item => {

            switch (item.direction) {

                case 'inbound':

                    graph.inbound.push(item);

                    break;

                case 'outbound':

                    graph.outbound.push(item);

                    break;

                default:

                    graph.related.push(item);

            }

        });

    graph.summary =
        buildSummary(graph);

    graph.statistics =
        buildStatistics(graph);

    graph.edges =
        buildEdges(graph);

    return graph;

}

/**
 * Merge graphs together.
 */
export function mergeGraphs(
    ...graphs
) {

    if (!graphs.length) {

        return null;

    }

    const merged =
        createNode(
            graphs[0].entity
        );

    graphs.forEach(graph => {

        merged.inbound.push(
            ...graph.inbound
        );

        merged.outbound.push(
            ...graph.outbound
        );

        merged.related.push(
            ...graph.related
        );

    });

    merged.inbound =
        deduplicate(
            merged.inbound
        );

    merged.outbound =
        deduplicate(
            merged.outbound
        );

    merged.related =
        deduplicate(
            merged.related
        );

    merged.summary =
        buildSummary(merged);

    merged.statistics =
        buildStatistics(merged);

    merged.edges =
        buildEdges(merged);

    return merged;

}

/*
---------------------------------------
Filtering
---------------------------------------
*/

export function inboundGraph(
    graph
) {

    return graph.inbound;

}

export function outboundGraph(
    graph
) {

    return graph.outbound;

}

export function relatedGraph(
    graph
) {

    return graph.related;

}

/*
---------------------------------------
Searching
---------------------------------------
*/

export function findNode(
    graph,
    apiName
) {

    const all = [

        ...graph.inbound,

        ...graph.outbound,

        ...graph.related

    ];

    return all.find(

        item =>
            item.apiName ===
            apiName

    );

}

export function containsNode(
    graph,
    apiName
) {

    return Boolean(

        findNode(
            graph,
            apiName
        )

    );

}

/*
---------------------------------------
Graph Metrics
---------------------------------------
*/

export function graphDepth(
    graph
) {

    return graph.summary.total;

}

export function graphSize(
    graph
) {

    return graph.edges.length;

}

export function graphHealth(
    graph
) {

    const total =
        graph.summary.total;

    if (total === 0) {

        return 'Excellent';

    }

    if (total < 5) {

        return 'Good';

    }

    if (total < 15) {

        return 'Moderate';

    }

    return 'Complex';

}

/*
---------------------------------------
Edge Builder
---------------------------------------
*/

function buildEdges(
    graph
) {

    const edges = [];

    const entity =
        graph.entity;

    graph.inbound.forEach(item => {

        edges.push(

            createEdge(

                item.apiName,

                entity.apiName,

                item.relationship

            )

        );

    });

    graph.outbound.forEach(item => {

        edges.push(

            createEdge(

                entity.apiName,

                item.apiName,

                item.relationship

            )

        );

    });

    graph.related.forEach(item => {

        edges.push(

            createEdge(

                entity.apiName,

                item.apiName,

                item.relationship

            )

        );

    });

    return edges;

}

/*
---------------------------------------
Visualization
---------------------------------------
*/

export function buildTree(
    graph
) {

    return {

        entity:

            graph.entity,

        inbound:

            graph.inbound,

        outbound:

            graph.outbound,

        related:

            graph.related

    };

}

/*
---------------------------------------
Export
---------------------------------------
*/

export default {

    buildDependencyGraph,

    mergeGraphs,

    inboundGraph,

    outboundGraph,

    relatedGraph,

    containsNode,

    findNode,

    graphDepth,

    graphSize,

    graphHealth,

    buildTree

};