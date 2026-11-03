# Validation evidence

This file describes development checks, not a production security certification.

## Completed checks — 3 November 2026

| Check | Observed result |
| --- | --- |
| Full integration/browser suite | 15 passed, 0 failed, 0 skipped |
| TypeScript and optimized build | Passed |
| Optimized-build browser smoke | Student, Admin, inventory, issues, import preview, Faculty and Alumni pages rendered without browser errors |
| Mobile Student screenshot | 390 px viewport and 390 px document width |
| Accessibility | All six dashboard checks passed automated WCAG A/AA rules; mobile navigation passed |
| Runtime dependency audit | npm audit --omit=dev reported 0 known vulnerabilities |
| Setup refresh | npm ci, migration checks and typecheck passed; existing demonstration records preserved |
| Service restoration | Verified stale zombie lock recovery and subsequent database-backed application startup |
| Saved cloud configuration | install_script and start_skill saved as a draft; publication remains a user action |

Screenshots from the optimized build:

- [Student dashboard](screenshots/student-dashboard.png) and [mobile layout](screenshots/student-mobile.png)
- [Student clearance](screenshots/student-clearance.png)
- [Administration](screenshots/admin-dashboard.png)
- [Inventory](screenshots/inventory.png) and [breakage management](screenshots/breakage.png)
- [Import preview](screenshots/import-preview.png), [Faculty](screenshots/teacher-dashboard.png), and [Alumni](screenshots/alumni-dashboard.png)

The import screenshot uses a fictional one-row preview and does not commit records. Demonstration data remained separate from disposable test data.

The integration suite creates a new uniquely named local PostgreSQL database, migrates it, seeds fictional records, starts an isolated web server, and drops only that database after completion. The demonstration database is preserved. Test commands retain the underlying exit status.

Covered scenarios:

- Password sign-in, incorrect credentials, rate limiting, HttpOnly/SameSite cookies and logout.
- Unauthenticated access, hostile request origins, cross-student record/document attempts and privileged-action denial.
- Complete assessed clearance including an initial rejection, challan creation, PDF generation, receipt validation, rejected/resubmitted evidence and independently verified payment.
- Concurrent duplicate challan issuance, duplicate receipts, concurrent payment review and repeated final authorization.
- Approval blocked before payment or department completion; zero-dues clearance skips payment.
- Database rejection of premature approval, closed-request edits, audit deletion and certificate identity edits.
- Scoped department access, negative-stock prevention, stock movement records and CSV formula neutralization.
- Import preview, duplicate/invalid row rejection, atomic commit and source-row provenance.
- Account deactivation revokes existing sessions while preserving student history.
- All six role dashboards checked with automated WCAG A/AA rules and mobile viewport/navigation checks.
- Faculty collective observations submitted through the UI and read back.
- PDF text is preserved or unsupported scripts produce an explicit error.

Automated accessibility checks supplement, rather than replace, a manual keyboard/screen-reader review with staff and students. The suite does not test an actual bank integration: Accounts manually verifies an independent bank record, as requested.

Build/type checks, setup repeatability, functional screenshots and final test results are recorded in the task handover. A production-host deployment, actual institutional data migration, real payment, official signature, email/SMS delivery and backup restoration have not been claimed as tested.
