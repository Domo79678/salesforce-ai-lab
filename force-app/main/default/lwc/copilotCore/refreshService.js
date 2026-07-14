/*
 * refreshService.js
 *
 * Shared refresh and event service for Salesforce Copilot.
 *
 * Responsibilities:
 * - coordinate platform refresh requests
 * - notify independent workspaces
 * - prevent duplicate concurrent refreshes
 * - publish refresh lifecycle events
 * - track the most recent refresh state
 */

import {
    REFRESH_EVENTS,
    SNAPSHOT_STATUSES
} from './copilotConstants';

const listeners =
    new Map();

let refreshPromise = null;

let refreshState = {
    status:
        SNAPSHOT_STATUSES.IDLE,

    startedAt:
        null,

    completedAt:
        null,

    failedAt:
        null,

    source:
        '',

    error:
        null,

    result:
        null
};

export function subscribe(
    eventName,
    listener
) {
    validateEventName(
        eventName
    );

    if (
        typeof listener !==
        'function'
    ) {
        throw new Error(
            'A refresh listener function is required.'
        );
    }

    if (
        !listeners.has(
            eventName
        )
    ) {
        listeners.set(
            eventName,
            new Set()
        );
    }

    listeners
        .get(eventName)
        .add(listener);

    return () => {
        unsubscribe(
            eventName,
            listener
        );
    };
}

export function unsubscribe(
    eventName,
    listener
) {
    const eventListeners =
        listeners.get(
            eventName
        );

    if (!eventListeners) {
        return false;
    }

    const removed =
        eventListeners.delete(
            listener
        );

    if (
        eventListeners.size === 0
    ) {
        listeners.delete(
            eventName
        );
    }

    return removed;
}

export function publish(
    eventName,
    detail = {}
) {
    validateEventName(
        eventName
    );

    const eventListeners =
        listeners.get(
            eventName
        );

    if (
        !eventListeners ||
        !eventListeners.size
    ) {
        return 0;
    }

    let notificationCount =
        0;

    for (
        const listener of
        eventListeners
    ) {
        try {
            listener({
                type:
                    eventName,

                detail:
                    cloneValue(
                        detail
                    ),

                timestamp:
                    new Date()
                        .toISOString()
            });

            notificationCount +=
                1;
        } catch (error) {
            // One subscriber must not prevent
            // the remaining subscribers from updating.
        }
    }

    return notificationCount;
}

export async function requestRefresh(
    refreshFactory,
    options = {}
) {
    if (
        typeof refreshFactory !==
            'function'
    ) {
        throw new Error(
            'A refresh factory function is required.'
        );
    }

    if (
        refreshPromise &&
        !options.allowConcurrent
    ) {
        return refreshPromise;
    }

    const source =
        options.source ||
        'Salesforce Copilot';

    publish(
        REFRESH_EVENTS.REQUESTED,
        {
            source,
            forceRefresh:
                Boolean(
                    options.forceRefresh
                )
        }
    );

    refreshState = {
        status:
            SNAPSHOT_STATUSES.LOADING,

        startedAt:
            new Date()
                .toISOString(),

        completedAt:
            null,

        failedAt:
            null,

        source,

        error:
            null,

        result:
            null
    };

    publish(
        REFRESH_EVENTS.STARTED,
        getRefreshState()
    );

    refreshPromise =
        Promise.resolve()
            .then(
                () =>
                    refreshFactory()
            )
            .then(
                (result) => {
                    const status =
                        result
                            ?.coverageStatus ===
                            'partial'
                            ? SNAPSHOT_STATUSES
                                  .PARTIAL
                            : SNAPSHOT_STATUSES
                                  .READY;

                    refreshState = {
                        ...refreshState,

                        status,

                        completedAt:
                            new Date()
                                .toISOString(),

                        result:
                            cloneValue(
                                result
                            ),

                        error:
                            null
                    };

                    publish(
                        REFRESH_EVENTS
                            .COMPLETED,
                        getRefreshState()
                    );

                    publish(
                        REFRESH_EVENTS
                            .SNAPSHOT_UPDATED,
                        {
                            source,

                            snapshot:
                                cloneValue(
                                    result
                                )
                        }
                    );

                    return cloneValue(
                        result
                    );
                }
            )
            .catch(
                (error) => {
                    const normalizedError =
                        normalizeError(
                            error
                        );

                    refreshState = {
                        ...refreshState,

                        status:
                            SNAPSHOT_STATUSES
                                .ERROR,

                        failedAt:
                            new Date()
                                .toISOString(),

                        error:
                            normalizedError,

                        result:
                            null
                    };

                    publish(
                        REFRESH_EVENTS
                            .FAILED,
                        getRefreshState()
                    );

                    throw error;
                }
            )
            .finally(
                () => {
                    refreshPromise =
                        null;
                }
            );

    return refreshPromise;
}

export function getRefreshState() {
    return cloneValue(
        refreshState
    );
}

export function isRefreshInProgress() {
    return (
        refreshState.status ===
        SNAPSHOT_STATUSES.LOADING
    );
}

export function resetRefreshState() {
    refreshPromise = null;

    refreshState = {
        status:
            SNAPSHOT_STATUSES.IDLE,

        startedAt:
            null,

        completedAt:
            null,

        failedAt:
            null,

        source:
            '',

        error:
            null,

        result:
            null
    };

    return getRefreshState();
}

export function subscribeToSnapshotUpdates(
    listener
) {
    return subscribe(
        REFRESH_EVENTS
            .SNAPSHOT_UPDATED,
        listener
    );
}

export function subscribeToRefreshStarted(
    listener
) {
    return subscribe(
        REFRESH_EVENTS
            .STARTED,
        listener
    );
}

export function subscribeToRefreshCompleted(
    listener
) {
    return subscribe(
        REFRESH_EVENTS
            .COMPLETED,
        listener
    );
}

export function subscribeToRefreshFailed(
    listener
) {
    return subscribe(
        REFRESH_EVENTS
            .FAILED,
        listener
    );
}

export function clearRefreshListeners(
    eventName = ''
) {
    if (eventName) {
        const count =
            listeners
                .get(eventName)
                ?.size || 0;

        listeners.delete(
            eventName
        );

        return count;
    }

    const count =
        Array.from(
            listeners.values()
        ).reduce(
            (
                total,
                eventListeners
            ) =>
                total +
                eventListeners.size,
            0
        );

    listeners.clear();

    return count;
}

export function getRefreshDiagnostics() {
    const subscriptions = {};

    for (
        const [
            eventName,
            eventListeners
        ] of listeners.entries()
    ) {
        subscriptions[
            eventName
        ] =
            eventListeners.size;
    }

    return {
        state:
            getRefreshState(),

        inProgress:
            isRefreshInProgress(),

        subscriptions
    };
}

function validateEventName(
    eventName
) {
    if (
        typeof eventName !==
            'string' ||
        !eventName.trim()
    ) {
        throw new Error(
            'A non-empty event name is required.'
        );
    }
}

function normalizeError(
    error
) {
    return {
        name:
            error?.name ||
            'CopilotRefreshError',

        message:
            error?.body?.message ||
            error?.message ||
            'The Salesforce Copilot refresh failed.'
    };
}

function cloneValue(
    value
) {
    if (
        value === null ||
        value === undefined
    ) {
        return value;
    }

    try {
        return JSON.parse(
            JSON.stringify(
                value
            )
        );
    } catch (error) {
        return value;
    }
}