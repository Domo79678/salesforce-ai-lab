export function getRecommendationMetadata(type) {

    const metadata = {

        RECORD_TRIGGERED_FLOW: {
            confidence: '94%',
            complexity: 'Medium',
            estimatedBuildTime: '30–60 minutes',
            maintenanceLevel: 'Admin-friendly'
        },

        BEFORE_SAVE_FLOW: {
            confidence: '95%',
            complexity: 'Low',
            estimatedBuildTime: '20–45 minutes',
            maintenanceLevel: 'Admin-friendly'
        },

        VALIDATION_RULE: {
            confidence: '92%',
            complexity: 'Low',
            estimatedBuildTime: '15–30 minutes',
            maintenanceLevel: 'Admin-friendly'
        },

        SCREEN_FLOW: {
            confidence: '93%',
            complexity: 'Medium',
            estimatedBuildTime: '45–90 minutes',
            maintenanceLevel: 'Admin-friendly'
        },

        APPROVAL_PROCESS: {
            confidence: '91%',
            complexity: 'Medium',
            estimatedBuildTime: '45–90 minutes',
            maintenanceLevel: 'Moderate'
        },

        SCHEDULE_TRIGGERED_FLOW: {
            confidence: '90%',
            complexity: 'Medium',
            estimatedBuildTime: '30–75 minutes',
            maintenanceLevel: 'Admin-friendly'
        },

        QUICK_ACTION: {
            confidence: '89%',
            complexity: 'Low',
            estimatedBuildTime: '15–45 minutes',
            maintenanceLevel: 'Admin-friendly'
        },

        SUBFLOW: {
            confidence: '90%',
            complexity: 'Medium',
            estimatedBuildTime: '30–75 minutes',
            maintenanceLevel: 'Admin-friendly'
        }

    };

    return metadata[type] || {
        confidence: '90%',
        complexity: 'Medium',
        estimatedBuildTime: '1–2 hours',
        maintenanceLevel: 'Admin-friendly'
    };

}