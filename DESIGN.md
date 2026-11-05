# AKIMS design direction and skill review

## Brief and constraints

AKIMS needs understandable college administration screens, particularly student clearance, departmental reviews and payment verification. The user has confirmed a plain HTML/CSS/JavaScript demonstration that opens from a folder. Keep the existing fictional data, role-specific workspaces, local assets and workflow. Official branding is still unavailable.

## Skills fetched and applied — 4 November 2026

Open Design's [catalog](https://open-design.ai/skills/) links to upstream skills; it is not a single installable skill. The following actual files were fetched and read:

- [Frontend Design](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md): ground the interface in its subject; deliberate type and layout; useful copy; plan before building and review screenshots.
- [Baseline UI](https://github.com/ibelick/ui-skills/blob/main/skills/baseline-ui/SKILL.md): clear hierarchy, purposeful empty states, safe areas, native/accessible interaction primitives and restrained motion.
- [Fixing Accessibility](https://github.com/ibelick/ui-skills/blob/main/skills/fixing-accessibility/SKILL.md): keyboard behavior, dialog focus, accessible error associations and persistent critical feedback.

These are design guidance, not runtime dependencies. Their React/Tailwind-specific directions do not override the user's explicit plain-file requirement. Existing custom CSS tokens and native HTML dialog primitives are retained. No external skill installer, design service, API key or tracking is added. Upstream skill text is not redistributed in the app.

## Plan before implementation

Use an academic services desk as the organizing idea. Keep the established forest palette and serif headings: they distinguish institutional records from action controls. The memorable surface is the student's actual departmental clearance checklist, rather than a marketing slogan.

| Token | Value | Purpose |
| --- | --- | --- |
| Forest | #173f35 | Navigation and primary actions |
| Paper | #f7f8f5 | Workspace background |
| White | #ffffff | Records and forms |
| Ink | #203d36 | Headings and record values |
| Sage | #dce9a6 | Selected navigation |
| Error | #a33435 | Invalid fields and destructive actions |

DM Serif Display carries page titles; DM Sans carries forms, tables and body copy. Fonts remain local. Headings use balanced wrapping; body copy stays readable and left aligned. Numbers use tabular figures. Labels use sentence case, without decorative tracking. Radius varies by purpose: records 12px, controls 8px, small status labels 6px. Status always has text, not color alone.

Two layout options considered:

```text
A. Marketing hero + generic Apply / Review / Complete strip
   [ slogan and illustration         ][ generic status ]
   [ several equal summary cards                          ]

B. Student clearance workspace (selected)
   [ Student name + practical next steps                   ]
   [ clearance action + explanation  ][ Anatomy   status   ]
   [                                ][ Clinical  status   ]
   [                                ][ Store     status   ]
   [ summary strip                                        ]
   [ next required action            ][ student record     ]
```

Option B makes the institution's actual workflow visible. Keep the role selector's equivalent choices together; remove promotional copy and non-sequential class numbering. Admin retains its operational queue, Accounts its payment review, Staff its department scope and Faculty its class journal. Do not impose the student's layout on every role.

## Review against the brief

| Existing snippet / behavior | Why it needs attention | Change |
| --- | --- | --- |
| `Your campus. Your next chapter.` | It describes any university site rather than available services. | Name college services and clearance directly. |
| `['Apply', 'Review', 'Complete']` | The middle stage never became current and hid the real department checks. | Render all three departments from the current request, including assessed/cleared status. |
| `.eyebrow` with uppercase and wide tracking | Repeated ornamental labels compete with meaningful information. | Remove redundant page eyebrows; use sentence case for retained context labels. |
| `Assigned class 01` | Classes are parallel assignments, not numbered steps. | Use the class name directly. |
| Mobile sidebar focus moved manually | Keyboard focus could leave the open overlay. | Move the same navigation into a native modal dialog on small screens; restore it on close. |
| `node.textContent = error.message; node.focus()` | Errors were announced but not associated with affected inputs. | Add persistent form summaries, field descriptions and invalid-state indicators. |
| `else notice(error.message)` | A critical error disappeared after the toast timeout. | Keep action failures visible until dismissed or the page changes. |

## Verification

Review rendered desktop and mobile screenshots. Exercise the mobile drawer by keyboard, Escape, backdrop and viewport resizing. Check field error associations and destructive-dialog initial focus. Run the existing charged clearance, import, stock and document journeys to catch regressions; keep checking all six dashboards for automated accessibility and all role pages at mobile width. Record results in VALIDATION.md.

The demo remains a single-browser prototype. Visual and keyboard improvements do not create production authentication, shared storage or institutional policy approval.

### Completed review — 5 November 2026

Desktop and mobile screenshots retain a clear action hierarchy, readable department rows and distinct role navigation. The mobile menu's close control was initially covered by its sidebar; the review caught this and the final version puts the control above that surface. The department checklist now reports actual request state, including before an application exists. Critical errors remain visible, field errors identify their inputs, and destructive confirmations initially focus Cancel.

The 46 existing browser assertions, 32 mobile pages and 26 focused interaction checks passed. Real users should still review the terminology and sample department list before live implementation, and assistive-technology testing is still needed. Official branding, institutional policy and a secure shared backend remain separate work.
