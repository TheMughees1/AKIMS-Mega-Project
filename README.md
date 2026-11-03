# AKIMS Campus

A working first release of the AKIMS clearance portal, built with Next.js, TypeScript and PostgreSQL. It completes the student application → departmental assessment → challan → receipt submission → Accounts verification → final authorization → downloadable certificate journey.

The development workspace uses explicitly fictional people and demonstration policies. Demonstration PDFs are marked **not valid for payment or official use**. The mark and campus illustration are branding placeholders.

## Run the development environment

Prerequisites: Node.js 24, npm, Linux x64 for the included local PostgreSQL launcher. A normal PostgreSQL 18 server can be supplied through DATABASE_URL on other platforms.

For ZIP download, Windows WSL/Ubuntu installation, Node.js setup and troubleshooting, follow the [step-by-step run guide](docs/QUICKSTART.md).

    npm run setup
    npm run local:start

The setup script preserves an existing .env.local, installs from the lockfile, verifies/starts the database, applies versioned migrations, and seeds fictional data only when DEMO_MODE=true and the database has no users. Start instructions use the existing checkout; no Git worktree is needed.

The web service uses the address in APP_ORIGIN, initially local port 3000. Open the sign-in screen and choose one of the six demonstration roles. Demonstration passwords are not seeded. Ordinary accounts use email/password authentication; authorized operators provision them with the server-only account script.

Files and data survive service restarts. Processes must restart after a restored cloud snapshot. The starter checks database-backed health and handles a positively identified stale PostgreSQL PID left by a dead/zombie process. It does not remove live server locks.

Useful commands:

| Command | Purpose |
| --- | --- |
| npm run local:start | Idempotently start/check local PostgreSQL and the web server |
| npm run dev | Foreground development server; use this when the helper-managed server is stopped |
| npm run db:migrate | Apply unapplied, checksum-verified migrations |
| npm run db:seed | Create demo data only in an empty, nonproduction demo database |
| npm run typecheck | Check TypeScript |
| npm run test | Run integration/browser tests against a new disposable local database |
| npm run build | Compile the optimized web application |
| npm start | Start the optimized build with the configured environment |

Builds and tests pause and restore only a development server previously started by the helper. This prevents competing Next.js servers from rewriting the shared generated type declarations. Stop manually started development servers before running these commands.

## What works

- Separate Student, Staff, Accounts, Administration, Faculty and Alumni navigation and dashboards.
- Database-backed sign-in, opaque server-side sessions, request-origin validation, login throttling, account deactivation and session revocation.
- Student and scoped staff initiation, program-based requirement snapshots, department verification and issue investigation/resolution.
- Confirmed lab/apparatus/store charges, immutable issued challan amounts and bank instructions, downloadable PDFs.
- Private PDF/PNG/JPEG receipt uploads; Accounts independently verifies the bank reference and full received amount. Upload alone never settles an obligation.
- Configurable final approver; unresolved checks, issues or unpaid challans block approval. Zero-dues applications do not require payment.
- Idempotent challan/certificate issuance, transactional review, database approval guards, immutable audit history and certificate identity snapshots.
- Certificate downloads, minimal public QR verification and audited revocation.
- Basic quantity inventory with stock movements, negative-stock prevention, issue records and scoped CSV reports.
- Student CSV import wizard: explicit column mapping, validation preview, duplicate/conflict rejection, atomic commit, error reports and batch/row provenance. No existing student is silently overwritten.
- Alumni profile/contact updates and access to their own available historical documents.
- Assigned faculty classes and persisted collective class observations.
- Responsive layouts, keyboard controls, reduced-motion support and automated accessibility checks.

## Scope of this release

This is the first operational feature set, not a complete university ERP or a public production deployment. The next work is recorded in [the decision register](docs/DECISIONS.md).

- Full LMS course delivery, assignments, quizzes, gradebooks and student surveys are not yet implemented. Faculty class observations are working; survey summaries are explicitly disabled until confidentiality rules are approved.
- Direct XLSX/Word/OCR ingestion, source-file ZIP reconciliation and used-record reversal need the actual source files and a reviewed migration. The current wizard accepts CSV exported from Excel.
- Clearance policy currently resolves departments by program. Approved semester/batch exceptions, formal appeals, replacements of revoked certificates, refunds/partial-payment allocation and a full accounting ledger remain future work.
- Academic configuration, staff department assignments and enrollment/alumni status require reviewed database configuration; a full administrative editor for these is not part of this release.
- Production identity controls still require the selected institutional MFA/SSO and account-recovery process. Receipt malware scanning, external notifications and production monitoring need deployment integration.
- The current PDF template supports ASCII text and normalizes common typographic punctuation. Unsupported scripts produce a clear error instead of silently changing a name. A Unicode/Urdu document template needs validation before importing records that require it.

## Project structure

| Path | Responsibility |
| --- | --- |
| app/portal | Authenticated route boundary and permitted portal navigation |
| components/portal.tsx | Role-specific dashboards, records and task forms |
| app/api | Authenticated commands, private documents, imports and exports |
| lib/auth.ts | Session identity, role checks, authentication and origin validation |
| lib/data.ts | Scoped server-side queries and safe data passed to each portal |
| lib/workflow.ts | Transactional clearance, payment, inventory and approval rules |
| db/migrations | Versioned relational schema and database safeguards |
| scripts | Repeatable local setup, services, migration and account provisioning |
| tests/portal.spec.ts | Real browser and HTTP integration/security scenarios |

See [deployment and recovery](docs/OPERATIONS.md) before connecting real institutional records or deploying publicly. See [validation evidence](docs/VALIDATION.md) for what was actually checked.

Review the [Student dashboard](docs/screenshots/student-dashboard.png), [Admin dashboard](docs/screenshots/admin-dashboard.png), and [mobile view](docs/screenshots/student-mobile.png). These are screenshots of the running application, using fictional records.
