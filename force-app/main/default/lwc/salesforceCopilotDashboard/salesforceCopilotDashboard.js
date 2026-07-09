import { LightningElement } from 'lwc';

export default class SalesforceCopilotDashboard extends LightningElement {
    currentView = 'dashboard';
    flowInput = '';
    analysis = null;
    exportMessage = '';
    isAnalyzing = false;

    capabilities = [
        {
            name: 'flowIntelligence',
            title: '🧠 Flow Intelligence',
            description: 'Analyze Salesforce Flows, identify risks, generate testing plans, documentation, and interview insights.',
            status: 'Available'
        },
        {
            name: 'orgExplorer',
            title: '🗺️ Org Explorer',
            description: 'Explore objects, fields, relationships, page layouts, and metadata throughout your Salesforce org.',
            status: 'Coming Soon'
        },
        {
            name: 'automationAdvisor',
            title: '⚙️ Automation Advisor',
            description: 'Recommend the best automation solution using Flows, Approval Processes, Validation Rules, or Apex.',
            status: 'Coming Soon'
        },
        {
            name: 'documentationGenerator',
            title: '📄 Documentation Generator',
            description: 'Generate admin guides, release notes, and testing documentation.',
            status: 'Coming Soon'
        },
        {
            name: 'aiLearningCoach',
            title: '🎓 AI Learning Coach',
            description: 'Interactive Salesforce learning, certification preparation, quizzes, and interview coaching.',
            status: 'Coming Soon'
        },
        {
            name: 'troubleshootingAssistant',
            title: '🛠️ Troubleshooting Assistant',
            description: 'Diagnose Flow failures, validation rules, permission issues, and configuration problems.',
            status: 'Coming Soon'
        }
    ];

    get showDashboard() {
        return this.currentView === 'dashboard';
    }

    get showFlowIntelligence() {
        return this.currentView === 'flowIntelligence';
    }

    get showAnalysis() {
        return this.analysis !== null;
    }

    get scoreLabel() {
        return this.analysis ? `${this.analysis.overallScore}/100` : '';
    }

    handleLaunch(event) {
        if (event.target.dataset.name === 'flowIntelligence') {
            this.currentView = 'flowIntelligence';
        }
    }

    backToDashboard() {
        this.currentView = 'dashboard';
        this.flowInput = '';
        this.analysis = null;
        this.exportMessage = '';
        this.isAnalyzing = false;
    }

    handleFlowInputChange(event) {
        this.flowInput = event.target.value;
    }

    analyzeFlow() {
        this.isAnalyzing = true;
        this.analysis = null;
        this.exportMessage = '';

        window.setTimeout(() => {
            const input = this.flowInput || 'Opportunity Health Monitor';
            const loweredInput = input.toLowerCase();

            let primaryObject = 'Opportunity';

            if (loweredInput.includes('case')) {
                primaryObject = 'Case';
            } else if (loweredInput.includes('lead')) {
                primaryObject = 'Lead';
            } else if (loweredInput.includes('account')) {
                primaryObject = 'Account';
            } else if (loweredInput.includes('contact')) {
                primaryObject = 'Contact';
            }

            this.analysis = {
                flowName: input,
                flowType: 'Record-Triggered Flow',
                primaryObject,
                trigger: 'After Save',
                overallScore: '92',
                healthStatus: '🟢 Excellent',
                complexity: '🟡 Medium',
                riskLevel: '🟢 Low',
                maintainability: '⭐⭐⭐⭐⭐ Excellent',
                documentationStatus: '🟡 Needs Update',
                bestPracticeScore: '89%',
                confidence: '96%',

                executiveSummary:
                    `The ${input} Flow appears to automate a repeatable Salesforce business process for the ${primaryObject} object. It improves consistency, reduces manual work, and helps users complete follow-up actions more reliably.`,

                businessPurpose:
                    `This Flow supports operational consistency by reducing the need for users to remember manual steps. For ${primaryObject} records, automation can improve speed, accountability, and data quality.`,

                technicalWalkthrough:
                    `The Flow likely begins when a ${primaryObject} record is created or updated. It evaluates record conditions, checks whether criteria are met, and performs an action such as creating a related Task, updating a field, or triggering a notification.`,

                risks:
                    'Primary risks include missing fault paths, duplicate record creation, unclear entry criteria, hardcoded values, and unexpected repeated execution if the record is edited multiple times.',

                documentationNotes:
                    'Documentation should include the Flow name, object, trigger timing, business purpose, entry conditions, actions performed, owner, testing steps, known risks, and change history.',

                interviewInsight:
                    'Interview Question: How would you explain a record-triggered Flow to a business user? Strong Answer: I would explain that it automates actions when records are created or updated, reducing manual work and improving process consistency while keeping users focused on higher-value activities.',

                checklist: [
                    'Test record creation',
                    'Test record update',
                    'Test negative criteria',
                    'Test duplicate prevention',
                    'Test user permissions',
                    'Test fault path behavior',
                    'Test bulk record updates'
                ],

                aiSuggestions: [
                    {
                        title: 'Add Fault Paths',
                        severity: 'Medium',
                        impact: 'Prevents unhandled automation errors.',
                        scoreGain: '+4'
                    },
                    {
                        title: 'Document Entry Criteria',
                        severity: 'Low',
                        impact: 'Helps future admins understand when this Flow runs.',
                        scoreGain: '+2'
                    },
                    {
                        title: 'Test Duplicate Prevention',
                        severity: 'Medium',
                        impact: 'Reduces risk of duplicate Tasks or updates.',
                        scoreGain: '+3'
                    }
                ]
            };

            this.isAnalyzing = false;
        }, 900);
    }

    handleExport(event) {
        this.exportMessage = `${event.target.label} is planned for the next version.`;
    }
}