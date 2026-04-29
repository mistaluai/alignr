# Alignr: Multi-Agent Product Development System
## Architecture & System Documentation

### 1. Executive Summary
Alignr is an interactive, multi-agent system designed to streamline the software product development lifecycle. It guides a user from a raw idea through business analysis, software planning, UI prototyping, and project evaluation.

### 2. Core Infrastructure & Technology Stack

* **Framework:** Next.js (App Router) serves as the unified environment for both the client-facing UI and the API routes.
* **AI Orchestration:** The Vercel AI SDK handles streaming responses, native tool calling, and Generative UI components.
* **Data Validation:** Zod is used to define strict, centralized schemas that dictate the exact shape of the data passed between agents.
* **Database (State Checkpointer):** A PostgreSQL database (e.g., Supabase) acts as the persistent memory for the application, storing chat histories and structured project contexts between discrete API calls.

---

### 3. Memory Architecture & State Management

#### Local Memory (Per-Agent Ephemeral State)
* **Concept:** While a phase is active, all back-and-forth interactions live exclusively in the frontend React state.
* **Isolation:** Each agent has its own isolated message list. When the user moves from the Business Analyst to the Software Planner, the local chat history does not carry over.

#### Global Memory (The Shared Brain)
* **Concept:** The global memory only stores the **finalized outputs** of each completed stage. These artifacts act as the context for subsequent agents.
* **Database Strategy:** "Write-Once-Per-Stage." The database is not updated after every single message. A write occurs *only* when an agent finishes its job and the user approves the phase completion.

**The Global Artifacts:**
1.  **Business Brief:** An unstructured Markdown document.
2.  **Architecture Blueprint:** A strictly typed Zod object.
3.  **Execution Payload:** An ordered array of actionable prompts.

---

### 4. Multi-Agent Pipeline & Responsibilities

#### Phase 1: The Business Analyst (Discovery)
* **Role:** Acts as a sounding board to flesh out the raw idea without stifling creativity through forced schemas.
* **Mechanism:** Operates via a real-time chat interface. It analyzes the user's initial prompt and dynamically generates interview questions to uncover project requirements. these questions are rendered in the ui as forms to be filled by the user.
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