# CodeSentra AI — AI-Based Code Change Impact Analysis & Regression Test Selection System

> **CodeSentra AI** — Intelligent code change analysis, dependency blast radius mapping, machine learning risk estimation, and precision regression test selection.

---

## 📌 Executive Overview

Modern software engineering teams face a growing regression dilemma: as repositories expand, running thousands of regression tests on every commit creates continuous integration bottlenecks, burns cloud compute budgets, and slows down release cycles.

**CodeSentra AI** solves this problem through semantic code intelligence:
- **AST Semantic Diffing**: Analyzes syntax trees to identify exact functions, methods, and classes altered—ignoring non-functional whitespace and comments.
- **Deep Dependency Call Graphs**: Traces call chains and module imports to map the complete blast radius of modified components.
- **ML Risk Estimation Engine**: Evaluates code churn, author ownership, complexity delta, and historical failure frequency to score change risk (Low, Medium, High, Critical).
- **Precision Regression Test Selection (RTS)**: Intelligently selects and prioritizes only the tests impacted by the changeset, reducing test execution time by up to **85–92%** while maintaining deterministic test coverage confidence.

---

## 🎨 Design Philosophy & Architecture

Inspired by leading modern developer products (such as Ramotion's Upstream SaaS design), CodeSentra AI is built upon the **Minimal Obsidian** design system:

### 1. Minimal Obsidian Palette
- **Main Background**: `#050505`
- **Elevated Section Background**: `#0B0B0C`
- **Card Surface**: `#111113`
- **Hover Surface**: `#18181B`
- **Neutral Border**: `#27272A`
- **Primary Headings**: `#F5F5F5`
- **Body Text**: `#B5B5BD`
- **Muted Text**: `#85858F`
- **Restrained Interactive Accent**: `#4169E1` (Royal Blue)
- **Semantic Indicators**: `#22A06B` (Success / Additions), `#DC5555` (Error / Deletions)

### 2. Precise Typography Standard
- **Primary UI Font**: `Roboto` (`font-sans`) — 400, 500, 600, 700
- **Technical / Code Font**: `Roboto Mono` (`font-mono`) — 400, 500, 600, 700 for code diffs, AST graphs, and terminal outputs.

### 3. Vertical SaaS Website Structure
The public website features a continuous, full-width vertical scrolling narrative across 9 distinct sections:
1. **Section 01 — Navigation & Hero**: Dual-column layout with value proposition, CTAs (*Get Started*, *Explore Platform*), and a live workflow preview.
2. **Section 02 — The Engineering Problem**: 2-column breakdown of testing bottlenecks, hidden blast radius, and pipeline delays.
3. **Section 03 — The Platform**: Core capabilities (AST Semantic Diffing, Deep Call Graph, ML Risk Engine, Precision RTS).
4. **Section 04 — How It Works**: 6-step interactive connected workflow stepper.
5. **Section 05 — Interactive Product Showcase**: Tabbed interactive live preview (Code Comparison, Dependency Graph, Risk Assessment, Test Selection).
6. **Section 06 — Developer Experience**: Git PR integration bot, local CLI agent, and universal test runner compatibility.
7. **Section 07 — Why CodeSentra AI**: Engineering-first benefits and deterministic verification.
8. **Section 08 — Final Call to Action**: Direct sign-in / registration prompt.
9. **Section 09 — Footer**: Navigation, legal links, and status indicator.

---

## 🛠️ Technology Stack

- **Frontend Core**: [React 19](https://react.dev/) + [TypeScript 5.7](https://www.typescriptlang.org/)
- **Build System**: [Vite 8](https://vitejs.dev/) with `@vitejs/plugin-react`
- **CSS Architecture**: [Tailwind CSS v4](https://tailwindcss.com/) with `@tailwindcss/vite`
- **Icons**: [Lucide React](https://lucide.dev/)
- **Auth Pattern**: Architectural Hirael Login 01 specification with session persistence (`localStorage`/`sessionStorage`).

---

## 💻 Steps to Run the Project Locally

### Prerequisites
- **Node.js**: `v18.0.0` or higher (Node 20+ recommended)
- **Package Manager**: [pnpm](https://pnpm.io/) (recommended), `npm`, or `yarn`

### 1. Navigate to the Project Directory
```powershell
cd "c:\Users\Admin\Desktop\all projects\AI BASED CODE CHANGED REGRESSION TESTING\AI_CODE_CHANGE_REGRESSION"
```

### 2. Install Dependencies
```powershell
pnpm install
```

### 3. Launch Development Server
```powershell
pnpm dev --port 8443 --host
```
Open your browser and navigate to:
👉 **`http://localhost:8443/`**

### 4. Build for Production & Type Check
```powershell
# Verify TypeScript types
pnpm exec tsc --noEmit

# Production build
pnpm build
```

---

## 🔐 Authentication & Demo Access

The platform includes a complete authentication system:
- **Email / Password Authentication**: Sign-in and sign-up with client validation, password reveal toggle, and session persistence.
- **One-Click Demo Access**: Click **"Sign In with Demo Account"** or click **"Explore Platform"** directly from the landing page to enter the full engineering workspace instantly.
- **OAuth Mock Connectors**: Fast sign-in with GitHub or Google developer profiles.

---

## 🖥️ Platform Modules (Engineering Workspace)

Once signed in, access the 8 engineering modules via the left sidebar:
1. **Executive Dashboard**: Key metrics on test reduction, compute hours saved, pipeline execution velocity, and risk distribution.
2. **Code Comparison**: Side-by-side and unified git diff viewer showing semantic syntax changes with line-by-line impact tags.
3. **Impact Analysis**: Deep blast-radius calculation tracing downstream functions, API endpoints, and database models.
4. **Dependency Graph**: Interactive service and module architecture visualization showing ripple effects.
5. **AI Risk Assessment**: Machine-learning risk categorization with explainable feature importance signals.
6. **Smart Test Selection**: Dynamic test case selection with confidence sliders and test execution estimators.
7. **Live Execution Results**: Real-time test runner progress, parallel worker telemetry, and raw terminal log output.
8. **Audit & ROI Reports**: Engineering audit ledger, developer productivity metrics, and one-click Markdown/CSV export.

---

## 📄 License
CodeSentra AI — Proprietary & Confidential. All rights reserved.
