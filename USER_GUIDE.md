 Application URL
Access the live application from any web browser: 👉 http://scl-sandbox-alb-2027317152.ap-southeast-1.elb.amazonaws.com

🔑 Role-Based Access Control (RBAC) Credentials Matrix
The system features granular Role-Based Access Control across 7 departments. Use the pre-configured test accounts below to test different user permissions:

Department / Persona	Role Level	Email Address	Password	Permissions Scope
Executive / C-Level	Executive	noptrapk+executive@gmail.com	@John123	High-level Executive FinOps KPIs, Budgets, Reports, & Invoices across ALL departments
Finance Team	Finance	noptrapk+finance@gmail.com	@Finance123	Financial Overview, Invoices, Department Cost Allocations, & Budget Caps
FinOps & Governance	FinOps Lead	noptrapk+finops@gmail.com	@Optra123	Full Admin Control: Trigger Scan & Sweep, Modify Idle Limits, Launch/Terminate resources
Core Infrastructure	Lead	noptrapk+infra.lead@gmail.com	@Tata123	Manage & Launch resources scoped to Core Infrastructure Dept
Core Infrastructure	Developer	noptrapk+infra.dev@gmail.com	@Mama123	View & Extend leases for Core Infrastructure team resources
Product Engineering	Lead	noptrapk+prod.lead@gmail.com	@Nest123	Manage & Launch resources scoped to Product Engineering Dept
Product Engineering	Developer	noptrapk+prod.dev@gmail.com	@Jack123	View & Extend leases for Product Engineering team resources
Data Science & Analytics	Lead	noptrapk+data.lead@gmail.com	@Promp123	Manage & Launch resources scoped to Data Science Dept
Trust & Safety	Lead	noptrapk+trust.lead@gmail.com	@Trust123	Manage & Launch resources scoped to Trust & Safety Dept
🚀 Key Feature Walkthrough
1. 📊 Dashboard (/dashboard)
Real-Time Cost KPIs: Daily spending, potential daily savings, and actual realized savings.
Multicloud Vendor Breakdown: Interactive doughnut chart supporting 7 cloud providers (AWS, Azure, GCP, Salesforce, IBM Cloud, Oracle, Alibaba Cloud).
Recent Charges: Detailed breakdown of monthly provider charges.
2. ⚡ Resource Lifecycle Management (/manage)
Active Cloud Resources:
View running instances filtered by department access level.
Idle Limit Selector:
0 Days (Instant Demo Mode): Instant demo mode to view potential savings on newly created resources.
1 Day (Testing Mode) / 3 Days / 7 Days / 14 Days (Default) / 30 Days.
Trigger Scan & Sweep:
Scans resources against the selected threshold and opens an interactive dry-run preview modal.
Selectively sweep idle resources with automatic 7-day grace period tracking.
+ Launch Server:
Launch new EC2 instances on AWS with custom Name, Department, Team, Environment, and Lease Duration.
Inspect Resource Modal (🔍):
View detailed tags, cost per day, owner email, and extend resource leases (+7 days).
Terminated History:
Audit trail log of all instances swept or terminated by FinOps lifecycle policies.
3. 📈 Cloud Performance Metrics (/performance)
Live CloudWatch CPU and Memory usage per EC2 node.
Automatically excludes core system infrastructure nodes from performance degradation alarms.
4. 💰 Budgets & Cost Allocation (/budgets & /allocation)
Departmental monthly budget caps, actual spend, and utilization percentage indicators.
Multi-cloud cost attribution per department and team.
5. 📄 Invoices & Reports (/invoices & /reports)
Multi-cloud provider invoices (Paid, Pending, Overdue).
Executive PDF summaries and CSV data exports.
🧪 Interactive Testing Playbook
Scenario A: FinOps Instant Demo Scan & Sweep
Log in as FinOps Lead (noptrapk+finops@gmail.com / @Optra123).
Navigate to Manage (/manage).
Select 0 Days (Instant Demo Mode) in the Idle Limit dropdown.
Observe the green Potential Savings / Day KPI card update dynamically.
Click Trigger Scan & Sweep -> Preview idle instances -> Click Confirm Sweep.
Scenario B: Launching a Cloud Resource with Custom Lease
Log in as Product Engineering Lead (noptrapk+prod.lead@gmail.com / @Nest123).
Go to Manage -> Click + Launch Server.
Fill in Name: demo-microservice, Lease: 7 Days, Environment: development.
Click Launch Server.
Verify the new resource appears in the Active Cloud Resources table with 7 days left.
Scenario C: Extending a Resource Lease
Log in as any Developer persona.
Click the 🔍 Search/Inspect button next to your active resource.
Click Extend Lease (+7 days) -> Verify the expiration deadline updates automatically.
IMPORTANT

🧹 Important Cleanup Request: Once you have completed testing and exploring the system features, please kindly Terminate or Sweep any test EC2 instances created during your session via the Manage page (/manage). This helps us maintain optimal cloud hygiene and avoid unnecessary AWS cloud costs. Thank you for your cooperation! 🙏
