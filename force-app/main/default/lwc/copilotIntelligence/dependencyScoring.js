/*
 * dependencyScoring.js
 *
 * Calculates dependency risk, confidence,
 * deployment readiness and business impact.
 */

export const RISK_LEVELS = Object.freeze({

    NONE: 'None',

    LOW: 'Low',

    MEDIUM: 'Medium',

    HIGH: 'High',

    CRITICAL: 'Critical'

});

export function calculateDependencyScore(graph) {

    const stats =
        graph.statistics;

    const summary =
        graph.summary;

    const total =
        summary.total;

    let score = 100;

    score -=
        total * 2;

    score -=
        stats.bySeverity.High * 5;

    score -=
        stats.bySeverity.Critical * 10;

    score =
        Math.max(
            score,
            0
        );

    return score;

}

export function determineRisk(graph) {

    const stats =
        graph.statistics;

    if (
        stats.bySeverity.Critical
    ) {

        return RISK_LEVELS.CRITICAL;

    }

    if (
        stats.bySeverity.High >= 3
    ) {

        return RISK_LEVELS.HIGH;

    }

    if (
        graph.summary.total > 10
    ) {

        return RISK_LEVELS.HIGH;

    }

    if (
        graph.summary.total > 5
    ) {

        return RISK_LEVELS.MEDIUM;

    }

    if (
        graph.summary.total
    ) {

        return RISK_LEVELS.LOW;

    }

    return RISK_LEVELS.NONE;

}

export function safeDelete(graph) {

    const total =
        graph.summary.total;

    if (
        total === 0
    ) {

        return true;

    }

    if (
        determineRisk(graph) ===
        RISK_LEVELS.LOW
    ) {

        return true;

    }

    return false;

}

export function deploymentRisk(graph) {

    if (
        graph.statistics.bySeverity.Critical
    ) {

        return 'Block Deployment';

    }

    if (
        determineRisk(graph) ===
        RISK_LEVELS.HIGH
    ) {

        return 'Review Required';

    }

    return 'Safe';

}

export function confidence(graph) {

    let value = 60;

    value +=
        graph.summary.total;

    if (
        graph.statistics.bySeverity.Critical
    ) {

        value += 20;

    }

    if (
        graph.statistics.bySeverity.High
    ) {

        value += 10;

    }

    return Math.min(
        value,
        99
    );

}

export function businessImpact(graph) {

    const total =
        graph.summary.total;

    if (
        total > 15
    ) {

        return 'Enterprise';

    }

    if (
        total > 8
    ) {

        return 'High';

    }

    if (
        total > 3
    ) {

        return 'Medium';

    }

    return 'Low';

}

export function scoreGraph(graph) {

    return {

        dependencyScore:
            calculateDependencyScore(
                graph
            ),

        risk:
            determineRisk(
                graph
            ),

        safeDelete:
            safeDelete(
                graph
            ),

        deploymentRisk:
            deploymentRisk(
                graph
            ),

        confidence:
            confidence(
                graph
            ),

        businessImpact:
            businessImpact(
                graph
            )

    };

}

export default {

    scoreGraph,

    determineRisk,

    confidence,

    deploymentRisk,

    businessImpact,

    safeDelete,

    calculateDependencyScore

};