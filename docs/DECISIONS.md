# AKIMS implementation decisions

Updated 3 November 2026, Asia/Karachi. The user authorized implementation after the initial requirements/design discussion. This register distinguishes their requirements from development defaults and unfinished institutional decisions.

| Decision | Status | Implementation |
| --- | --- | --- |
| Web first; integrated backend and relational database | User requirement | Next.js/TypeScript with a PostgreSQL modular backend |
| Separate Student, Staff, Teacher and Super Admin experiences | User requirement | Purpose-built layouts, navigation and tasks; Accounts is a specialized staff workspace |
| Student applies online; authorized staff may assist | User requirement | Both initiation paths enforce ownership/scope |
| Bank payment → receipt upload → Accounts verification | Explicitly confirmed by user | Full-amount reconciliation against an independently checked bank record; no gateway assumption |
| Initial challans cover confirmed lab/apparatus/store obligations | Explicitly confirmed by user | No tuition, transport, library or invented processing fee is added |
| Alumni Portal and LMS in the overall campus vision | User requirement | Basic Alumni Portal works; classes/observations provide a faculty foundation; full LMS is scheduled later |
| Class-level feedback rather than individual student evaluation | User requirement | Collective observations work; surveys remain disabled until confidentiality/aggregation rules are approved |
| Final clearance authority | Institutional decision pending | Configurable named approver; the seeded demo administrator is a demonstration assignment |
| Academic eligibility, applicable departments, valuation and waivers | Institutional decisions pending | Demo policies are illustrative. Program requirements are snapshotted; do not treat seeded programs/department rules as AKIMS policy |
| Alumni eligibility and post-graduation learning access | Institutional decisions pending | Stored academic/alumni status is separate from paid challans; no payment-triggered membership |
| Bank instructions and certificate/signature format | Institutional inputs pending | Private admin settings for bank details; no official signature is fabricated; demo documents remain visibly non-official |
| Hosting | Unconfirmed | Requires a supported Node runtime, PostgreSQL and persistent private storage; existing college shared hosting has not been verified |

## First completed workflow

Student application → requirement assignment → laboratory/store review → documented issues → confirmed charges → issued challan → uploaded receipt → independent Accounts reconciliation → department completion → final authorization → certificate and status verification.

Receipt submission is not payment verification. Payment verification is not final clearance. Approved history is preserved when a certificate is revoked.

## Next implementation milestones

1. Validate the demonstrated workflow against an AKIMS clearance case, real source records, approved valuation rules and the official document format. Configure final authority and actual bank instructions.
2. Add the academic/policy administration editor, semester/batch applicability, formal student correction/dispute workflow, and authorized certificate replacement. These require agreed rules, not invented college policy.
3. Complete production identity integration/MFA, account recovery, receipt scanning, notifications, least-privilege deployment, monitored backups and a restore rehearsal.
4. Inspect the original Excel/Word ZIP, develop explicit reviewed mappings, and extend import/reconciliation tooling. The current CSV importer never assumes the original file schema.
5. Choose a maintainable LMS route, including an established LMS integration if suitable. Add class surveys with approved confidentiality, minimum response thresholds and suppression of identifying small groups.
6. Scope attendance, timetabling, examinations/results, admissions and broader fee management individually. Native Windows/mobile clients remain optional.

The bank-payment choice and initial dues scope are already settled and should not be repeatedly requested. Changes to those decisions must be recorded explicitly.
