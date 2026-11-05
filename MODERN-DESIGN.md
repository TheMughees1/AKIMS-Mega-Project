# Modern typography and motion — 5 November 2026

## Requested skill

Fetched and read [modern-web-design](https://github.com/freshtechbro/claudedesignskills/blob/main/plugins/bundles/meta-skills/skills/modern-web-design/SKILL.md). Consulted its performance checklist and button interaction guidance. This is design guidance, not a runtime dependency. No upstream installer/scripts were executed.

## Plan before implementation

Use the college's emerald identity with a bold condensed display face; give the access page a recognisable typographic composition, while forms and records remain steady. User explicitly requested kinetic bold typography, superseding the earlier website-serif heading direction. Inter continues to match the college's practical UI type.

Tokens: emerald #064e3b, deep green #022c22, paper #f3f6f3, white #ffffff, ink #16392d, gold #d4af37. Barlow Condensed 800 for entry display; 700 for large workspace titles; Inter 400–700 for forms, data, navigation. Gold is a decorative accent; no small gold text on white. Fluid sizes, 44px controls, strong focus and native dialog behavior.

Considered:
A. Oversized moving text across every dashboard: rejected, would interrupt record processing.
B. One composed access headline with a brief reveal, followed by stable bold workspace typography: selected.

    [crest / college identity]                     [college website]
    [bold clearance/documents statement]           [working sign-in form]
    [campus photograph + location caption]         [local data notice]
    [photography gallery with deliberate caption hierarchy]
    [secondary demonstration workspaces]

Motion: three entry lines reveal once on initial entry rendering; transform/opacity only, finite duration under one second. Changing sign-in tabs does not replay it. Small press feedback and directional icon movement answer deliberate actions. No scroll hijacking, custom cursor, autoplay gallery, parallax, 3D dependency or animated financial figures. Reduced-motion mode shows all content immediately.

## Scope and verification

Keep existing local accounts, IndexedDB documents, clearance, payment, inventory and six role workflows intact. Keep classic local scripts for direct file opening. Retain the original college photography. Add local WOFF2 display fonts and licenses, remove superseded serif font, reserve image space, and provide useful static content when scripting is unavailable.

Validate rendered access/student/admin/documents screens, 320–1440px widths, motion completion and system reduced-motion behavior, keyboard and contrast, no external runtime resources, account/upload journey and existing workflows. Local preview measurements are not real-device Core Web Vitals certification. The supplied original photographs remain the largest transfer cost.

## Verified result

20 focused browser checks passed: display font loading, finite reveal completion, no replay on access-tab changes, immediate content under reduced-motion, six viewport widths (320, 390, 768, 900, 1024 and 1440), no headline clipping, accessibility scan and no external runtime requests. The initial two-column layout clipped the display heading at tablet width; it now stacks below 961px. Reviewed access desktop/mobile and the admin dashboard screenshots.

Existing 27 account/document checks, 46 workflow assertions, 26 keyboard/error checks and all 32 mobile role pages also passed. No real-device performance or full screen-reader conformance claim is made. Original college photographs and local demo behavior are preserved.
