# Student access and document desk — design plan

Confirmed: complete the simple offline demonstration first (user, 5 November 2026). Sign in, create student account, store actual sample document bytes locally, preview/download/delete, and a more distinctive design. No server deployment or official admission/account verification.

Apply all three previously fetched relevant Open Design skills: Frontend Design, Baseline UI, Fixing Accessibility. Their framework preferences do not supersede the explicit plain HTML/CSS/JS requirement.

Palette: college emerald #064e3b, deep green #022c22, white #ffffff, cool paper #f5f7f6, muted ink #596963, gold #d4af37 (small institutional accents). Keep official Inter for utility and Playfair Display for the welcoming headline. Left-align forms, 44px controls, readable labels and persistent inline errors. Native dialogs, visible focus, no autoplay/animation.

Considered:
A. Six equal role cards below a generic hero: rejected; the existing interface makes the demonstration controls the primary experience.
B. College entrance + dedicated access desk: selected. Recognizable campus photos give the page a location; the working form is its main task. Staff previews stay secondary.

    [college crest + full name]           [college website]
    [Campus image + welcome]             [Sign in / Create account]
    [caption and campus photo strip]     [labelled form + honest local notice]
    [secondary expandable demonstration workspaces]

Student workspace: compact identity heading; one clearance record with department status, a practical services list and document desk. Photography belongs in the entry and campus strip, not behind every administrative table. Remove repeated welcome cards and repeated large summary cards from Student home. Keep administrative data tables and workflows intact.

Local accounts use salted PBKDF2 password verifiers, never plaintext passwords; this remains bypassable client-side demonstration logic. New accounts always become students, never privileged roles. Academic data is self-declared and unverified. Sessions end with sign out; no pretend email verification/reset service. Registered student IDs must scope their requests and files.

Files: IndexedDB stores actual sample PDF/JPEG/PNG bytes, 5 MB each, 10 documents/25 MB per student. Extension, MIME and signatures checked. Preview images in native dialog; PDFs download for local viewing. Delete requires confirmation. Storage failures must explain recovery and must not silently report saved files. No real identity records should be entered. Reset removes local accounts and all demo uploads explicitly.

Verify: register → sign out → sign in → submit clearance → add/view/download/remove document; duplicate accounts, wrong passwords, owner isolation, reload, unsupported/oversized files, failed storage, keyboard/forms, 320–1440px layout and existing clearance regression tests. Review rendered screenshots before upload.

## Completed critique

The role-card grid was replaced with an access form and a captioned campus photograph; the staff previews are subordinate links under an expandable section. Four additional source-site photographs describe teaching, anatomy, practical learning and computing. The Student dashboard now has one clearance desk, real department statuses, a plain academic record and two direct service actions. The document library separates personal files from issued certificates/challans.

Reviewed desktop and mobile screenshots. On small screens the form comes before the large campus photograph. An automated check found 4.4:1 contrast on upload guidance; the final panel uses darker text. Forms have labelled controls, busy states and persistent associated errors; file deletion focuses Cancel initially.

Limitations: institutional account verification, password-reset delivery, staff provisioning, document review and secure cross-device access are intentionally outside this authorized offline edition. The photo originals are preserved, making the ZIP larger than the earlier illustrated version. Real staff/student usability interviews and assistive-technology testing remain future validation.
