# ☁️ Simple Cloud Lifecycle (FinOps Dashboard)

> 🚧 **Status:** Active Development (Work in Progress)

## 📌 About the Project
A centralized Cloud Financial Management (FinOps) dashboard designed to analyze and optimize cloud infrastructure costs. This system provides visibility into cloud expenditures, applying FinOps principles to ensure cost-effectiveness and resource efficiency.

### ✨ Key Features (ทำอะไรได้บ้าง)
* **Multi-Cloud Simulation:** Architected a scalable database schema to aggregate and simulate expenditure data across major cloud providers (AWS, Azure, GCP).
* **Real-Time MTD Tracking:** Monitors Month-to-Date (MTD) usage and expenditures to prevent budget overruns.
* **Automated Resource Sweeper:** Identifies and simulates the termination of idle or orphaned cloud resources to maximize infrastructure ROI.

## 🎨 UI/UX Design & Prototyping
The frontend interface was designed with a focus on data visualization and user experience prior to development.
[View Full Figma Prototype Here]
👉 **https://www.figma.com/board/reJUucSIeGKLBuZNdmREmB/Welcome-to-FigJam?node-id=0-1&t=ZqvBqA2dZLLGiYWH-1**

## 🚀 Tech Stack
* **Frontend:** Next.js (TypeScript), Tailwind CSS
* **Backend:** Go (Golang), RESTful APIs
* **Database:** PostgreSQL
* **Infrastructure:** Docker, Multi-tenant Architecture Design

## 📂 Project Structure (โครงสร้างโปรเจกต์)
```text
simple-cloud-lifecycle/
├── frontend/             # Next.js web application (UI & Dashboards)
│   ├── app/              # Next.js App Router (Pages)
│   └── components/       # Reusable React components (Charts, Tables)
├── backend/              # Go RESTful API
│   ├── cmd/              # Main application entry point
│   ├── internal/         # Business logic & resource sweeper algorithms
│   └── models/           # Database schema and structs
└── database/             # PostgreSQL migration scripts


Getting Started (วิธีติดตั้งและใช้งาน)
Prerequisites
Make sure you have the following installed:

Node.js (v18+)

Go (1.20+)

PostgreSQL

Docker (Optional for containerized setup)

Clone the repository:

git clone https://github.com/optravc/simple-cloud-lifecycle.git
cd simple-cloud-lifecycle


Setup Frontend:
cd frontend
npm install
npm run dev

Setup Backend:
cd ../backend
go mod download
go run cmd/main.go
