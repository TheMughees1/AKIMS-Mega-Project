# Validation — 4 November 2026

This is validation of a fictional, browser-local demonstration, not a production security assessment.

- 22 independent workflow/state checks passed: duplicate active requests, ownership and department checks, approval prerequisites, exact payment verification, immutable billing, inventory bounds, atomic imports, persistence and denied-storage fallback.
- 46 browser assertions passed across the charged clearance journey, receipt return/resubmission, mismatched reference/amount rejection, final authorization, certificate revocation, assigned staff actions, stock movements, teacher observations, alumni profile, CSV mapping/preview/duplicate rejection, downloads and reset cancellation.
- All six role dashboards passed automated axe checks for WCAG A/AA rules. Automated checks supplement manual keyboard and screen-reader review.
- All 32 role-specific mobile pages stayed within a 390 px viewport. Menu open/close, correction/resubmission, zero-dues final clearance, reset, escaped import text, scoped exports and denied-storage behavior also passed browser checks.
- Actual PDF files generated through the browser print layout for a challan and certificate; the document download button produces an accurately labelled standalone HTML copy.
- No JavaScript exceptions or external network requests occurred during the browser journeys. Fonts, images, scripts and styles are local.
- A copied folder containing spaces loaded its relative assets successfully through a local static test server.

The managed test browser blocks `file://` navigation with `ERR_BLOCKED_BY_ADMINISTRATOR`. Its policy was left intact, and browser tests used a local static HTTP server. The delivered app uses classic relative script/style/image paths and no fetch calls, JavaScript modules, build step or backend APIs; it is designed for direct `index.html` opening in ordinary desktop browsers. Direct file opening on the user's Windows browser has not been independently verified in this environment. Browser-local persistence can vary by browser and file location; the UI reports unavailable storage.

The testing tools and test server are development aids and are not required or included in the delivered app. No real bank payments, actual institutional records, official signatures, shared multi-user operation or production authentication were tested or implemented by this edition. See START-HERE.txt and README.md for the intended use.

## Design and accessibility revision — 5 November 2026

- Repeated the 46 browser assertions and checks of all 32 role-specific mobile pages after the design changes; all passed. The six dashboard axe scans reported no violations in the configured WCAG A/AA rules. No JavaScript errors or third-party requests occurred in these journeys.
- Passed 26 targeted checks covering actual department status, persistent action errors, mobile navigation keyboard containment, visible and clickable close control, Escape/backdrop closing, focus restoration, desktop resize behavior, field error associations, and destructive confirmation initially focusing Cancel.
- Checked student layouts at 320, 390, 768 and 1440 px without horizontal page overflow.
- Reviewed rendered role-picker, student desktop, student mobile and open-navigation screenshots. The visual review revealed a close button covered by the mobile sidebar; corrected its stacking and verified both pointer hit-testing and closing behavior in the targeted checks.
- The workflow/state module was unchanged; its earlier 22 checks were not repeated for this visual revision. Screen-reader testing with assistive technology and direct Windows file opening remain outstanding; these checks do not establish full accessibility conformance.

See DESIGN.md for the three fetched skills, design rationale and scope boundaries.

## Website branding revision — 5 November 2026

- Re-ran the 46 workflow browser assertions, all 32 mobile role pages and 26 focused interaction checks after applying the official website branding; all passed.
- Additional entry and Help page axe scans passed the configured WCAG A/AA rules. Verified local logo/photo/font loading without HTTP errors, the public address, mobile width and the embedded logo in the standalone HTML document.
- Reviewed entry, student desktop and mobile screenshots; adjusted photo positioning to keep the building sign in view. Original image files remain unchanged.
- Branding sources and limits are recorded in BRANDING.md. The previous direct-file and screen-reader testing limits still apply.
