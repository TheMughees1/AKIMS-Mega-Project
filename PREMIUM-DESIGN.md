# Premium campus experience — completed 10 November 2026

The user rejected the prior result as insufficiently premium. This revision changes composition and hierarchy rather than just increasing type size. Confirmed constraints remain: plain HTML/CSS/JS, offline accounts/uploads, official AKIMS identity and photos, kinetic bold type, usable separate role workspaces.

## Direction before implementation

Use a photography-led college entrance paired with a quiet working sign-in panel. The memorable element is the large framed campus scene with a tightly composed two-line headline; supporting elements stay restrained. Within the app, use a light navigation rail and a deep-pine clearance surface so the student's primary task has a clear anchor.

Palette: pine #123e32, emerald #065441, paper #f5f7f4, white #ffffff, muted ink #52645b, gold #d4af37. Local Inter supplies readable body/UI and compact workspace headings. Barlow Condensed 800 stays on hero/display headlines. No added libraries, remote fonts, invented official notices, statistics, rankings, signatures or endorsements.

Considered and rejected: adding more oversized text, decorative glass shapes or gradients to the previous card layout. Selected: real imagery, precise scale/spacing, quieter chrome, meaningful interaction and clear task hierarchy.

    [college identity]                      [campus link / college website]
    [full-height campus photo]              [student access]
    [two-line kinetic headline]             [sign-in / create account]
    [photo scene selector]                  [labelled form / local disclosure]
    [three concise service descriptions]
    [large campus gallery / click to inspect real photos]
    [secondary demo workspaces / institutional contact]

    Student workspace:
    [light navigation] [greeting / account action]
                       [clearance next action] [actual completion ring + checklist]
                       [academic record]       [document/history services]
                       [notices]               [campus community photo]

## Interaction and accessibility

Manual scene buttons on the entry photo change only that photo and its caption; no autoplay or duplicate account forms. Gallery buttons open a native dialog with the original photograph. Escape closes it and focus returns to the initiating button. The clearance ring is derived from actual cleared requirements; its text and checklist remain visible. The existing finite kinetic reveal and reduced-motion behavior are preserved. New image overlays provide text contrast, not decorative gradients. No auto-rotating text, mouse-following effects, blocking animations or scroll hijacking.

## Verification plan

Review desktop access and student screens before finalizing, then mobile, admin and documents. Test scene changes and gallery keyboard/focus behavior. Recheck reduced motion, contrast, 320–1440px widths and existing accounts/upload/clearance journeys. Preserve the honest single-browser demo disclosure. Publish a screenshot preview with the source ZIP so the user can judge the visible result before opening it.

Apply the previously read Frontend Design, Baseline UI, Fixing Accessibility and requested modern-web-design guidance selectively to this concrete college workflow. No third-party skill code is installed or executed.

## Final design review

The entry now combines the real campus building, a two-line Barlow Condensed headline and an Inter sign-in form. A short reveal finishes once; manually changing photographs preserves the typed account details. Four additional gallery photographs open in a native keyboard-accessible dialog. Within the portal, a light navigation rail and dark clearance area distinguish navigation from the student's next action. The completion ring uses approved departments in the current request; no illustrative progress is substituted for actual demo state.

Screenshots were inspected at desktop and mobile sizes for access, student home, Administration, documents and inventory. This review led to larger support text and controls, darker secondary text and avatar initials, a narrower-screen headline adjustment, a one-column departmental section on tablets, and extra search-field padding to separate the icon from its text. Existing local accounts, document bytes and workflow data remain compatible. The source images have not been edited.

The mobile entrance puts the campus scene before sign-in, with a visible “Student access” jump link in the header. This favors a distinctive first visit while allowing returning students to skip to the form. For a future live service, evaluate a dedicated direct sign-in route with actual returning students. Administrative empty states show the real absence of applications instead of decorative charts. Original large college images are the main download cost; prepare optimized derivatives before production hosting. The current edition deliberately retains the supplied originals.

## Completed validation

- 47 targeted checks passed for scene switching without lost form input, all four gallery dialogs and focus return, accessibility scans across all three hero scenes and a photograph dialog, eight entry widths from 320 to 1440 px, and completion-ring consistency before and after a real demo approval. Submitted-request dashboards also fit 320, 390, 768, 900 and 1024 px.
- 27 local account/document checks, 46 end-to-end workflow assertions, 26 keyboard/error checks and all 32 mobile role pages passed. The six dashboard, access-form and document-page automated accessibility scans reported no violations in the configured WCAG A/AA rules.
- 20 typography/motion checks passed, including local font loading, finite animation, no replay on form-tab changes and reduced-motion behavior. Browser journeys reported no JavaScript exceptions or remote runtime resources.
- A visual check and a browser search interaction confirmed that the inventory search icon no longer covers the placeholder or typed text.

Automated checks do not establish complete accessibility conformance. Real assistive-technology testing, ordinary Windows direct-file opening and real-device performance measurements remain outstanding. This continues to be a browser-local demo, not production authentication or shared institutional storage. See VALIDATION.md.

## Applied references

- [Modern Web Design](https://github.com/freshtechbro/claudedesignskills/blob/main/plugins/bundles/meta-skills/skills/modern-web-design/SKILL.md): bold hierarchy, intentional interaction, finite motion and reduced-motion support.
- [Frontend Design](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md): a deliberate visual direction and distinct compositions for access and institutional work.
- [Baseline UI](https://github.com/ibelick/ui-skills/blob/main/skills/baseline-ui/SKILL.md) and [Fixing Accessibility](https://github.com/ibelick/ui-skills/blob/main/skills/fixing-accessibility/SKILL.md): native controls/dialogs, labels, keyboard focus, contrast and actionable feedback.
