# Alignr: Multi-Agent Product Development System
## Architecture & System Documentation

### 1. Executive Summary
Alignr is an interactive, multi-agent system designed to streamline the software product development lifecycle. It guides a user from a raw idea through business analysis, software planning, UI prototyping, and project evaluation. To ensure high performance, real-time interactivity, and seamless deployment on serverless infrastructure, the system utilizes a frontend-orchestrated, stateless HTTP architecture.

### 2. Core Infrastructure & Technology Stack
The architecture prioritizes real-time user feedback and strict data structuring, bypassing the limitations of traditional long-running server processes.

* **Framework:** Next.js (App Router) serves as the unified environment for both the client-facing UI and the agent-driven API routes.
* **AI Orchestration:** The Vercel AI SDK handles streaming responses, native tool calling, and Generative UI components.
* **Data Validation:** Zod is used to define strict, centralized schemas that dictate the exact shape of the data passed between agents.
* **Database (State Checkpointer):** A PostgreSQL database (e.g., Supabase) acts as the persistent memory for the application, storing chat histories and structured project contexts between discrete API calls.

---

### 3. State Management & Data Flow
Because serverless functions have strict execution timeouts, agents do not run continuously in the background. Instead, the React frontend acts as the **conductor**, triggering distinct API endpoints sequentially based on the project's current state. 

The global state is anchored by a centralized data schema stored in the database. This schema acts as the "shared brain" for all agents and includes:
* **State Machine Metadata:** Tracks the current phase, iteration loops (`revisionCount`), turn limits (`turnCount` to manage API costs), and rejection feedback (`lastCritiqueFeedback`).
* **Chat History:** The ongoing dialogue between the user and the interactive agents.
* **Business Brief:** An unstructured, highly flexible markdown summary of the idea, target audience, and business goals generated during the discovery phase.
* **Architecture Blueprint:** A strict, Zod-validated outline of the proposed tech stack, feature list, and system design.
* **Execution Package:** The final, rigorously structured prompt payload intended for external coding agents.

---

### 4. Multi-Agent Pipeline & Responsibilities

#### Phase 1: The Business Analyst (Discovery)
* **Role:** Acts as a sounding board to flesh out the raw idea without stifling creativity through forced schemas.
* **Mechanism:** Operates via a real-time chat interface. It analyzes the user's initial prompt and dynamically generates interview questions to uncover project requirements. To control costs, this phase includes a strict turn-count limit.
* **Output:** Utilizes a **User-Driven Gate**. When the agent believes it has enough context, it triggers a `suggestTransition` tool to output an unstructured markdown "Business Brief." The user acts as the ultimate gatekeeper, choosing to either approve the brief (advancing the state) or continue chatting to refine it. 

#### Phase 2: The Software Planner (Architectural Design)
* **Role:** Translates the flexible business brief into a tangible, strictly typed software blueprint.
* **Mechanism:** Ingests the unstructured data gathered by the Analyst. It enforces structural compliance using the AI SDK's `streamObject` to map the LLM's output directly to the strict `architecturePlan` Zod schema.
* **Output:** A structured outline of the required tech stack, backend requirements, and specific frontend screen descriptions. The user has the option to proceed or iteratively refine the plan via conversational feedback.

#### Phase 3: The UI Coder (Visual Prototyping)
* **Role:** Provides the user with a visual representation of the Software Planner's blueprint.
* **Mechanism:** Utilizes Generative UI (React Server Components) via the AI SDK. It takes the screen descriptions from the Planner and streams functional frontend code directly to the client. To ensure system resilience against AI hallucinations, all generated code is sandboxed within React Error Boundaries.
* **Output:** Live, interactive, low-fidelity UI mockups rendered instantly in the user's browser for review. If the generated component crashes, a graceful degradation protocol displays a raw markdown code block instead.

#### Phase 4: Critique & Parser (Evaluation & Handoff)
* **Role:** Acts as the reality check and final compiler for the project.
* **Mechanism:** The Critique agent reviews the aggregate data (business plan, architecture, UI) against internal heuristics for feasibility, cost, and deployment complexity. 
* **Output:** * *If flagged as unfeasible:* The system halts, warns the user, and asks if they want to proceed or return to the Business Analyst. If the user loops back, the rejection reasoning is injected into the state memory (`lastCritiqueFeedback`) so the Analyst agent learns from the failure.
    * *If approved:* The Parser agent takes over, breaking the finalized blueprint into a highly specific, actionable `ExecutionPackageSchema` designed to be fed seamlessly into external coding execution agents.