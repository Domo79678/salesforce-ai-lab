import { LightningElement } from 'lwc';

export default class SalesforceCopilotDashboard extends LightningElement {
    currentView = 'dashboard';
    flowInput = '';
    orgInput = '';
    analysis = null;
    orgAnalysis = null;
    exportMessage = '';
    isAnalyzing = false;

    capabilities = [
        { name: 'flowIntelligence', title: '🧠 Flow Intelligence', description: 'Analyze Salesforce Flows, identify risks, generate testing plans, documentation, and interview insights.', status: 'Available' },
        { name: 'orgExplorer', title: '🗺️ Org Explorer', description: 'Explore objects, fields, relationships, page layouts, and metadata throughout your Salesforce org.', status: 'Available' },
        { name: 'automationAdvisor', title: '⚙️ Automation Advisor', description: 'Recommend the best automation solution using Flows, Approval Processes, Validation Rules, or Apex.', status: 'Coming Soon' },
        { name: 'documentationGenerator', title: '📄 Documentation Generator', description: 'Generate admin guides, release notes, and testing documentation.', status: 'Coming Soon' },
        { name: 'aiLearningCoach', title: '🎓 AI Learning Coach', description: 'Interactive Salesforce learning, certification preparation, quizzes, and interview coaching.', status: 'Coming Soon' },
        { name: 'troubleshootingAssistant', title: '🛠️ Troubleshooting Assistant', description: 'Diagnose Flow failures, validation rules, permission issues, and configuration problems.', status: 'Coming Soon' }
    ];

    get showDashboard() {
        return this.currentView === 'dashboard';
    }

    get showFlowIntelligence() {
        return this.currentView === 'flowIntelligence';
    }

    get showOrgExplorer() {
        return this.currentView === 'orgExplorer';
    }

    get showAnalysis() {
        return this.analysis !== null;
    }

    get showOrgAnalysis() {
        return this.orgAnalysis !== null;
    }

    get scoreLabel() {
        return this.analysis ? `${this.analysis.overallScore}/100` : '';
    }

    handleLaunch(event) {
        const capabilityName = event.target.dataset.name;

        if (capabilityName === 'flowIntelligence') {
            this.currentView = 'flowIntelligence';
        }

        if (capabilityName === 'orgExplorer') {
            this.currentView = 'orgExplorer';
        }
    }

    backToDashboard() {
        this.currentView = 'dashboard';
        this.flowInput = '';
        this.orgInput = '';
        this.analysis = null;
        this.orgAnalysis = null;
        this.exportMessage = '';
        this.isAnalyzing = false;
    }

    handleFlowInputChange(event) {
        this.flowInput = event.target.value;
    }

    handleOrgInputChange(event) {
        this.orgInput = event.target.value;
    }

    analyzeFlow() {
        this.isAnalyzing = true;
        this.analysis = null;

        window.setTimeout(() => {
            const input = this.flowInput || 'Opportunity Health Monitor';

            this.analysis = {
                flowName: input,
                flowType: 'Record-Triggered Flow',
                primaryObject: input.toLowerCase().includes('case') ? 'Case' : 'Opportunity',
                trigger: 'After Save',
                overallScore: '92',
                healthStatus: '🟢 Excellent',
                complexity: '🟡 Medium',
                riskLevel: '🟢 Low',
                maintainability: '⭐⭐⭐⭐⭐ Excellent',
                documentationStatus: '🟡 Needs Update',
                bestPracticeScore: '89%',
                confidence: '96%',
                executiveSummary: `The ${input} Flow appears to automate a repeatable Salesforce business process and reduce manual effort.`,
                businessPurpose: 'This Flow improves consistency, accountability, and data quality by automating manual steps.',
                technicalWalkthrough: 'The Flow likely begins when a record is created or updated, checks criteria, and performs actions such as creating a Task or updating a field.',
                risks: 'Primary risks include missing fault paths, duplicate creation, unclear criteria, hardcoded values, and repeated execution.',
                documentationNotes: 'Document the Flow name, object, trigger timing, business purpose, criteria, actions, testing steps, and known risks.',
                interviewInsight: 'Interview Question: How would you explain this Flow to a business user? Strong Answer: I would explain that it automates repeatable work, reduces manual effort, and improves consistency.',
                checklist: ['Test record creation', 'Test record update', 'Test negative criteria', 'Test duplicate prevention', 'Test permissions', 'Test bulk updates'],
                aiSuggestions: [
                    { title: 'Add Fault Paths', severity: 'Medium', impact: 'Prevents unhandled automation errors.', scoreGain: '+4' },
                    { title: 'Document Entry Criteria', severity: 'Low', impact: 'Helps future admins maintain the Flow safely.', scoreGain: '+2' },
                    { title: 'Test Duplicate Prevention', severity: 'Medium', impact: 'Reduces risk of duplicate Tasks or updates.', scoreGain: '+3' }
                ]
            };

            this.isAnalyzing = false;
        }, 900);
    }

    exploreObject() {
        const objectName = this.orgInput || 'Opportunity';

        this.orgAnalysis = {
            objectName,
            objectType: 'Standard Object',
            fieldCount: 42,
            relationships: 8,
            validationRules: 3,
            recordTypes: 2,
            flows: 5,
            pageLayouts: 3,
            permissions: 'Needs Review',
            summary: `${objectName} is a core Salesforce object used to manage business data, automation, reporting, and user processes.`,
            risks: [
                'Too many unused fields may reduce usability.',
                'Validation Rules may block users if not documented.',
                'Multiple Flows on one object can create automation complexity.'
            ],
            recommendations: [
                'Review unused fields.',
                'Document key validation rules.',
                'Map all Flows connected to this object.',
                'Review permission access for key profiles and permission sets.'
            ]
        };
    }

    handleExport(event) {
        this.exportMessage = `${event.target.label} is planned for the next version.`;
    }
}