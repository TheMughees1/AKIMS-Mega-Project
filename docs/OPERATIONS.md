# Running, deploying and recovering AKIMS

## Runtime and storage

Use Node.js 24, a supported PostgreSQL server, a persistent web process, TLS, and persistent private file storage. The development launcher includes PostgreSQL 18 for loopback use without system administrator privileges. Production should use an institution-approved managed or independently operated PostgreSQL service.

Runtime settings:

| Variable | Meaning |
| --- | --- |
| DATABASE_URL | Server-side database connection; never expose it to client code |
| APP_ENV | development/test locally; explicitly production for live use |
| DEMO_MODE | true only with fictional development data; production startup rejects true |
| APP_ORIGIN | Exact trusted web origin used for mutation-origin checks and certificate verification |
| STORAGE_DIR | Private receipt directory on persistent storage; outside public web roots |
| PLAYWRIGHT_CHROMIUM_PATH | Optional browser executable override for integration tests |

Retained local state: .env.local, .local/postgres, .local/uploads and the ignored runtime logs. Start with npm run local:start after a cloud snapshot restores. Dependencies and files can persist; running processes must not be assumed to persist. Use the existing checkout rather than creating a Git worktree.

Local logs are .local/database.log and .local/web.log. Avoid dumping logs containing institutional data into shared conversations. A restored Linux zombie PID is handled only after the launcher validates the recorded cluster directory and confirms the old process is dead. An active process or mismatched lock is never removed automatically.

The setup script is suitable for an initial environment or a refresh with the web server stopped. It preserves existing environment files and existing database records. Run npm run local:start afterwards. Concurrent setup/build/test commands are not supported.

## Production preparation

Use a fresh production database and approved records. Do not promote the seeded demonstration database as the institutional source of truth.

1. Confirm the host supports a persistent Node.js process, PostgreSQL, private file storage, HTTPS, scheduled backups and a process supervisor. Ordinary PHP-only shared hosting is not sufficient evidence of support.
2. Configure server-side secrets in the hosting platform. Set APP_ENV=production and DEMO_MODE=false. Use an HTTPS APP_ORIGIN and database TLS verification appropriate to the provider; never disable certificate verification.
3. Apply migrations with a migration-owner connection. Run the application with a separate non-owner, non-superuser database login. Grant only required table/sequence privileges; audit history and issued document snapshots must not be editable by general administration utilities.
4. Provision an initial administrator using npm run account:provision. Supply AKIMS_ACCOUNT_EMAIL, AKIMS_ACCOUNT_NAME, AKIMS_ACCOUNT_ROLE=admin and a unique AKIMS_ACCOUNT_PASSWORD through the trusted server environment. The script never logs passwords, preserves existing roles on password reset, and revokes existing sessions.
5. Configure approved programs, enrollments, departments, user roles/department assignments and clearance policy in reviewed migrations/data configuration. The current release does not provide a full academic configuration editor.
6. In the administrative Settings screen, save verified beneficiary instructions and assign the named final approver. Review charge valuations, waivers, eligibility, signature/document wording, retention and alumni rules with the institution.
7. Integrate the selected MFA/SSO and account-recovery mechanism, receipt malware scanning, monitored external logs and notifications. Review storage quotas and request limits before accepting real uploads.
8. Build with npm run build and run npm start under the chosen service supervisor. Do not run the development server in production. The database-backed /api/health response must identify application akims-campus and status ok.

The application performs server-side role, ownership and department checks. PostgreSQL foreign keys, uniqueness, transaction locks, approval triggers and immutable-history triggers provide additional safeguards. Fine-grained database RLS is not implemented in this release; do not represent the current setup as a completed independent security audit.

## Network and files

Mutation requests require the configured origin; cookies are HttpOnly and SameSite=Lax, and Secure in production. Configure the reverse proxy to preserve the intended scheme/host and limit request sizes (receipt uploads are capped at 5 MB in the application).

Receipts use randomized storage names, private filesystem permissions, content-signature checks and authenticated download routes. They are served as attachments with no-store headers. The current filesystem adapter requires a single persistent application filesystem; multiple app instances require shared private storage or an object-storage adapter first.

Database records store storage-relative identifiers. Preserve those identifiers when migrating to an object store; verify file counts and hashes before switching the adapter. Keep public certificate verification separate from private PDFs/receipts. Public verification reveals document status, reference and issue date only.

## Backup and recovery procedure

A production backup/restore drill has not been performed in this cloud development task. Complete one on the selected hosting before launch. Agree the recovery point, recovery time, retention and backup ownership with AKIMS.

Use PostgreSQL 18-compatible client tools. Configure libpq authentication through the platform's secure environment/service files; do not place credential values in shell command arguments or logs. With the backup destination configured:

    umask 077
    pg_dump --format=custom --file="$AKIMS_BACKUP_DIR/database.dump"
    tar -C "$STORAGE_DIR" -czf "$AKIMS_BACKUP_DIR/receipts.tar.gz" .
    sha256sum "$AKIMS_BACKUP_DIR/database.dump" "$AKIMS_BACKUP_DIR/receipts.tar.gz" > "$AKIMS_BACKUP_DIR/SHA256SUMS"

The libpq connection variables must select the intended database. Quiesce application writes during the coordinated backup or use a reviewed database/object-storage consistency strategy. Encrypt off-host backups and restrict access. Include deployed application version, migration checksums and required non-secret configuration metadata; protect secret backups through the platform's secret-management process.

For a restore rehearsal:

1. Create an isolated empty restore database and an isolated private receipt directory.
2. Verify backup checksums and decrypt through the approved mechanism.
3. Restore with pg_restore --exit-on-error --single-transaction --no-owner --no-acl into the isolated target. Reapply the intended role grants.
4. Extract receipts into the isolated storage target. Never overwrite the active production database or storage during a rehearsal.
5. Start the matching application version with the isolated settings. Verify migration history, representative student/enrollment counts, issued challan totals, verified payments, certificate statuses and receipt hashes.
6. Exercise a private receipt download and public certificate verification. Record elapsed recovery time and reconcile against the source backup.
7. Switch production only through the institution's approved recovery procedure. Preserve the failed instance for investigation where appropriate.

Imported batches commit atomically and retain source hashes/mappings plus per-student batch/row provenance. A failed import adds no records. Reversing a committed import after subsequent operational use requires an explicit compensating-data review; the application does not silently delete students or their financial history.

## Known production boundaries

Only full-challan payment verification is supported. Partial payments, overpayments, refunds and verified-payment reversals require an approved institutional process and additional implementation. Staff can cancel an unpaid challan only when no pending/verified payment exists.

Certificates can be revoked, and their original identity snapshot remains intact. A formal replacement/correction workflow is not yet implemented. The English PDF template rejects unsupported scripts rather than silently stripping names; validate a Unicode/Urdu template before issuing affected documents.

Official email/SMS, malware scanning, distributed session/cache infrastructure, full LMS delivery, survey aggregation and backup automation are deployment or subsequent-development work, not verified capabilities of this first release.
