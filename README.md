# AKIMS Campus · Simple edition

A plain **HTML, CSS and JavaScript** demonstration of the AKIMS clearance portal. Download, extract and double-click **index.html**. No build, Node.js, terminal, server or database installation is required to view this edition.

**[Download this edition](https://github.com/TheMughees1/AKIMS-Mega-Project/archive/refs/heads/akims-simple.zip)** · [Roman Urdu instructions](START-HERE.txt)

## Open it

1. Download the ZIP from the **akims-simple** branch.
2. Extract the complete ZIP into a folder.
3. Open **index.html** in a current Chrome, Edge or Firefox browser.
4. Choose a demonstration workspace. Switch roles in the same browser to follow a request from application to certificate.

In VS Code, use **File → Open Folder**, select the extracted folder and edit the files. Refresh the browser after saving. Live Server is optional; opening the file directly is supported.

## Understand the files

```text
AKIMS-Portal/
├── index.html            Page shell
├── style.css             Visual design, responsive layouts and printing
├── script.js             Screens, forms, imports and user interactions
├── assets/
│   ├── data.js           Fictional data, browser storage and workflow rules
│   ├── images/           Placeholder branding
│   └── fonts/            Local fonts and their licenses
├── START-HERE.txt        Beginner instructions in Roman Urdu
└── README.md             This guide
```

There are no network-loaded frameworks or fonts. Sample data is loaded with a regular script tag so the application works under `file://` without fetching a JSON file. To change the starting examples, edit the `seed` in `assets/data.js`, save and choose **Reset demo** in the portal. Reset replaces current demo changes.

## Demonstrate a complete clearance

- **Student:** submit a clearance application and see departmental progress.
- **Staff:** review the assigned Anatomy laboratory and manage its sample stock.
- **Administration:** assess departments; record an investigation or confirmed charge; resolve a return or authorized sample waiver; issue a challan after assessment.
- **Student:** preview the watermarked challan and submit sample receipt details.
- **Accounts:** return a sample receipt for correction or enter the exact sample reference and amount to verify it.
- **Administration:** complete remaining departmental clearance and authorize the certificate. Unresolved issues and unpaid dues block authorization.
- **Student:** view the certificate and use **Print / Save PDF**. Revoked certificates remain identifiable as revoked in the current demo data.

A no-dues request goes directly from departmental clearance to final authorization. Duplicate active requests and premature approvals are rejected. Issued challan amounts and issued certificate identity snapshots are preserved. Correction, resubmission and revocation remain part of the history.

Additional screens cover inventory movements, student search, previewed CSV import, reports, audit history, assigned class observations and alumni profile/documents. CSV import uses explicit column mapping and rejects conflicts rather than overwriting students. Full LMS and anonymous survey collection are future work.

## What is stored

This is a **single-browser demonstration**, with fictional people and illustrative policies. Browser storage retains changes when available. If storage is blocked, the app reports that changes only last in the current tab. Moving the folder, using another browser, clearing browser data or switching between a file and a hosted address can change which saved demo is available. Keep one working tab open to avoid competing edits.

**Export demo data** in Administration saves a readable JSON copy; an automatic restore feature is not included. Receipt selection records sample file metadata and a sample reference, not the file's contents. Print dialogs can save a PDF through the browser; the app does not send documents to a bank or issue official certificates.

Role switching and browser-side checks illustrate permissions; they are **not secure authentication**. This edition is not suitable for actual student records, passwords, bank information, payments or official approvals. Everything in a publicly hosted assets folder is downloadable by visitors. Do not place private institutional files there.

## Hosting later

Upload this folder's contents to a static website host, keeping all relative paths together. The `index.html` file is the entry point. The hosted demo still stores changes separately in each visitor's browser. A real multi-user college system needs a server, shared database, authenticated sessions, server-side authorization, private document storage and deployment controls. This interface can later connect to that backend.

The existing server-backed version remains on the separate **[akims-mvp branch](https://github.com/TheMughees1/AKIMS-Mega-Project/tree/akims-mvp)**. This branch is a standalone edition; none of that version's packages are needed here.

Fonts are bundled with their license notices in `assets/fonts`. The logo and illustration are placeholders pending official AKIMS assets.
