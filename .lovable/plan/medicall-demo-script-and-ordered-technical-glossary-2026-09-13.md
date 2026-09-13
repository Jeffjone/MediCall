# MediCall demo script and ordered technical glossary

This is presentation material only; no website changes are proposed. The script follows a practical demonstration order, with technical terms defined afterward.

## Part 1 — Ready-to-read demo script

### 1. Homepage: introduce the problem and product
**Show:** MediCall homepage.

“This is MediCall: Know Sooner. Act Faster. It helps pharmacy staff connect medication recall information with patient prescriptions, review potentially affected patients, and initiate AI-assisted outreach.

“The website uses React and TypeScript, with TanStack Start connecting the interface to server-side operations. Tailwind CSS and reusable interface components give staff a consistent workspace.”

### 2. Sign in: enter the pharmacy workspace
**Show:** Sign-in page, then dashboard.

“Pharmacy staff sign in to an account protected by Lovable Cloud authentication. The application checks account approval before displaying the pharmacy workspace. Separate role records support administrator permissions.

“For this demonstration, patient records are fictional. We are not connected to a real pharmacy dispensing system.”

### 3. Recalls: explain where information comes from
**Show:** Recalls page and an FDA record link.

“MediCall retrieves recall records from the openFDA Drug Enforcement API. These are enforcement records, which are not identical to the FDA’s public recall-announcement pages.

“The app stores recall information, supports scheduled refreshes, and makes the source record available for verification. This is a periodically refreshed feed, not an instantaneous notification directly from the FDA. The website displays recalls in groups of 20.”

### 4. Patients: explain the matching engine
**Show:** Patients page and flagged-only filter.

“The core matching step uses the National Drug Code, or NDC. MediCall normalizes the recall’s NDC and compares it with prescription NDCs in the patient dataset. A matching code flags that patient for review.

“This comparison is deterministic software logic, not an AI guess. A flag means the product may be affected; pharmacy staff still need to verify the recall’s lot and other restrictions. No matching record does not prove that a medication is safe.

“Staff can search, sort, filter, and review patients in groups of 20. Refill tracking illustrates dispensing intervals and quantities above the prescribed amount using simulated history, not actual dispensing records.”

### 5. Simulate a recall: demonstrate the workflow
**Show:** Simulate New Recall, notification, then affected patients.

“To demonstrate a newly discovered recall without waiting for the FDA, we can create a clearly labeled fictional recall. The app uses that record in its matching process and updates the recall list, patient flags, and dashboard. The notification takes us back into the relevant workflow.”

### 6. Analysis: turn a flag into a reviewable case
**Show:** Analyse a flagged patient, review the result, then saved analyses.

“MediCall can generate a structured case analysis using the patient’s prescription and recall information. AI requests run server-side through the Lovable AI Gateway using the AI SDK. The analysis also uses RxNorm to help verify drug identity.

“The application uses more than one model: the current case-analysis implementation uses an OpenAI model, while Gemini supports other experiences we will show. We should not describe the entire app as Gemini-only.

“The output supports a pharmacist’s review; it does not replace clinical judgment or automatically approve a medication substitution. Saved analyses can be reopened from the Analyses page.”

### 7. Interaction graph: review the wider regimen
**Show:** Create interaction graph and select a connection.

“Recall risk and interaction risk are different. For interaction checking, MediCall examines medication-pair evidence from FDA drug labels and considers available allergy information. Gemini explains the evidence-backed findings, while the website renders an interactive graph.

“Selecting a connection shows its explanation and supporting evidence. Missing evidence or unknown allergies remain limitations—not a declaration that the regimen is safe. This is not a comprehensive clinical interaction database.”

### 8. Outreach: demonstrate the human approval boundary
**Show:** Patient-call confirmation, then doctor-call option and Outreach page.

“Once staff have reviewed the case, they can explicitly confirm an outreach call. ElevenLabs supplies the conversational voice agent, and an imported Twilio number supplies the phone connection. The application sends patient-specific medication and recall details with a controlled script.

“All demonstration calls go to one verified test number, including doctor outreach. The doctor-call option follows the patient-call step.

“The Outreach page shows the call attempt and its case details. An accepted call request is not proof that the patient answered or understood the message. The current browser call log is session-based, so we should not describe it as a permanent compliance audit record.”

### 9. Command Center: use conversation instead of navigation
**Show:** Enter a natural-language request.

“The Command Center uses Gemini to coordinate supported workflows through natural conversation. For example: ‘Check the recalls, find affected patients, and prepare their cases for review.’

“The model invokes defined application tools to retrieve data and perform supported steps; it does not simply invent an answer. Responses stream into the conversation as work progresses. Pharmacist decisions and call confirmations remain explicit human actions. The camera scanner still needs its dedicated screen.”

### 10. Mobile scanner: identify a label
**Show:** Mobile Scan page; take or upload a photo.

“On the mobile website, staff can photograph a medication label or upload an existing picture. Gemini vision extracts the visible medication information, and MediCall checks for possible recall matches.

“Image extraction can be imperfect, so the result is a starting point for verifying the product and recall scope—not a safety certification.”

### 11. Close: summarize the chain

“MediCall connects FDA recall data to patient prescriptions, turns possible matches into reviewable cases, and helps pharmacy staff communicate through controlled AI-assisted calls. Its value is the connected workflow: discover, match, review, and contact—with a person responsible for the clinical decisions.”

## Part 2 — Technical glossary in process order

### A. Build and serve the website
| Term | Meaning and role |
|---|---|
| **Lovable** | Development environment used to build and maintain MediCall. |
| **TypeScript** | JavaScript with type checking to catch incompatible data and code usage. |
| **React 19** | Builds the interactive pages from reusable components. |
| **TanStack Start v1** | Full-stack framework connecting React pages with server-side functions. |
| **TanStack Router** | Maps URLs to pages and handles navigation and route loading. |
| **SSR — server-side rendering** | Produces initial HTML on the server where enabled; not every protected page uses SSR. |
| **Vite** | Development server and bundler; the current package declares Vite 8. |
| **Nitro / edge runtime** | Server packaging and deployment infrastructure; distinct from the user-facing workflow. |
| **Bun** | Package-management and command-running tool used in development. |
| **ESLint / Prettier** | Code-quality checks and consistent source formatting. |

### B. Render the interface
| Term | Meaning and role |
|---|---|
| **Tailwind CSS v4** | Utility-based styling for layout, spacing, and appearance. |
| **Design tokens** | Shared values for colors, borders, and other visual rules. |
| **shadcn/ui / Radix UI** | Reusable controls and underlying interaction primitives. |
| **Lucide React** | Interface icons. |
| **Sonner** | Temporary toast notifications. |
| **HTML Canvas** | Draws the homepage’s moving geometric background. |
| **SVG** | Vector graphics used to render the interaction graph. |
| **Responsive design** | Layout adapts to the available screen size, including the mobile scanner experience. |

### C. Identify users and load records
| Term | Meaning and role |
|---|---|
| **Lovable Cloud** | Managed authentication and database services used by the app. |
| **PostgreSQL** | Relational database technology for stored application records. |
| **Authentication / authorization** | Establishing identity versus deciding which actions that identity may perform. |
| **OAuth** | Delegated access/sign-in protocol; configuration determines which flows are available. |
| **RLS — row-level security** | Database rules restricting access to particular records. |
| **TanStack Query** | Shared query-cache and recovery infrastructure; not every app request uses it. |
| **Server function** | Application operation executed on the server rather than exposing secrets in the browser. |
| **SQL migration** | Versioned database schema change; Drizzle tooling is included in the project. |

### D. Retrieve and match recall information
| Term | Meaning and role |
|---|---|
| **API** | Defined interface through which software requests data or actions. |
| **openFDA Drug Enforcement API** | Source of FDA recall enforcement records. |
| **JSON** | Structured data format used for API responses and the fictional patient fixtures. |
| **Polling / scheduled synchronization** | Checking a source periodically and updating stored records, rather than receiving instant push alerts. |
| **NDC — National Drug Code** | Product identifier used to connect recall records with prescriptions. |
| **Normalization** | Converting differently formatted codes into a comparable representation. |
| **Deterministic matching** | Rule-based comparison whose result does not depend on AI judgment. |
| **Lot verification** | Checking the physical product’s batch against the recall’s exact scope. |
| **Pagination** | Dividing a result list into pages; Patients and Recalls use 20 per page. |
| **Fixture / simulated data** | Demonstration records rather than live pharmacy records. |

### E. Generate and review AI results
| Term | Meaning and role |
|---|---|
| **Lovable AI Gateway** | Server-side access point for the application’s AI requests. |
| **AI SDK** | Library supporting model calls, streaming, structured output, and tool execution. |
| **Gemini** | Model family used for Command Center, vision scanning, interaction explanations, and briefings. |
| **OpenAI Responses API** | Model interface used by the current case-analysis implementation. |
| **Zod / structured output** | Schemas and validation for predictable result shapes rather than unrestricted prose. |
| **RxNorm / RxCUI** | Standardized drug terminology and identifiers used to support drug-identity verification. |
| **openFDA label data** | Drug-label evidence used in interaction checks; distinct from enforcement recall data. |
| **Polypharmacy** | Use of multiple medications; relevant to medication-pair review. |
| **Tool calling** | Model requests a defined application function instead of fabricating its result. |
| **Streaming** | Progress and response content arrive incrementally. |
| **Human-in-the-loop** | Staff retain review, approval, and call-confirmation decisions. |

### F. Contact and integrate
| Term | Meaning and role |
|---|---|
| **ElevenLabs Conversational AI** | Voice-agent service used for outbound conversations. |
| **Twilio** | Telephone service behind the imported calling number. |
| **Dynamic variables / per-call overrides** | Patient-specific details and instructions supplied for each call. |
| **Call-attempt log** | Current session’s call status and case details; not proof of successful notification. |
| **MCP — Model Context Protocol** | Standard interface exposing read-only MediCall tools to external agents; separate from Command Center’s internal tools. |
| **CSRF protection** | Helps prevent another website from causing unintended authenticated requests. |
| **HTTP status codes** | Failure categories such as 401 unauthorized, 429 rate limited, and 502/503/504 service failures. |
| **Backoff / bounded retries** | Waiting and limiting repeat requests rather than looping or duplicating consequential actions. |

## Presenter accuracy notes
- The demo contains 40 fictional patients; affected counts can change with the feed and simulated recalls.
- Refill history and financial estimates are simulations, not verified pharmacy records.
- Source links are enforcement-record links, not necessarily FDA announcement pages.
- Do not promise instantaneous FDA updates, comprehensive recall coverage, guaranteed clinical safety, successful phone delivery, or regulatory compliance.
- Installed dependencies are not automatically visible features: avoid naming unused template libraries as part of the demonstration.
- This document describes the implementation, not a fresh end-to-end certification of every external service.