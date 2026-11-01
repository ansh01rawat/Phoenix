# Phoenix design system

## Current visual enhancement

The current presentation layer is `src/styles/enhancements.css`, imported after the foundation. Geist typography uses 40px desktop page headings, 32px workspace titles, 22px section headings, 15px body, 14px controls/navigation, and 12px supporting metadata, with responsive phone sizing. Earlier size tables below retain the original foundation history.

Primary and secondary buttons use small-area violet and charcoal glass, reflective borders, inner highlights and a legible dark fallback. Hover and press effects use short CSS transitions; no blur is animated. Cards, tabs, focus states and navigation follow the same restrained interaction rhythm. OS and saved reduced-motion preferences remain authoritative. No verification state is promoted to genuine success through styling.

This enhancement preserves service boundaries. Authenticated profile and workspace presentation awaits the teammate's backend integration; no local identity replacement was added. See `docs/visual-enhancement.md` for changes and validation.

## Implemented MVP extension

Phases 2–6 retain the foundation below and extend it with working dashboard, project, import, diagnosis, comparison, preview, verification, and decision views. The original phase-boundary notes below are a historical design plan; those frontend phases are now implemented.

Feature surfaces use the existing neutral and violet palette. Simulated passing checks use violet icons and explicit “Demo passed” labels, never real-verification success colors. Source diffs use violet for additions and rose for removals, with textual plus/minus indicators.

The preview provides intentional visual contrast: a warm cream and olive static furniture storefront in a browser frame, clearly separated from Phoenix chrome. Original and Repaired states, exact target viewport dimensions, and display scale are visible. The iframe has no script or same-origin privileges.

New components include overview statistics, project cards, repair rows, ZIP dropzone and progress, issue cards, evidence and plan, simulated activity, file explorer, local Monaco comparison, readable mobile diff, viewport controls, test summary and rows, final review, and separate decision confirmations. New styles are in `features.css` and `verification.css`; primitives and base tokens remain shared.

The persistent session state separates repair readiness, simulated verification evidence, decision, application, and discarded-copy state. Only an actual future backend could report successful file application. All frontend approvals keep application at `not_applied`.

## Phase 4–5 completion and Phase 6 follow-up

The final reliability pass adds a restrained storage-status notice using existing surface, foreground, warning, and border tokens. Unavailable persistence is explicit and does not block the current demo. An unavailable rich editor retains the readable comparison inside the existing workbench, without replacing the application shell. Each Monaco pane has a distinct filename-specific accessible name. Reliability fixes took priority over cosmetic changes; see `docs/phase-6-audit.md`.

The preview keeps the existing browser frame and violet chrome through loading, ready, unavailable, and timeout states. A centered loading indicator names the operation; failures use restrained rose, a concise explanation, and a clear retry action. Version and viewport controls expose their selected state. An explicit demo-scenario menu makes the unavailable state inspectable without a backend. Async document requests are cancellable and ignore stale responses.

Review retains the existing summary, metrics, and protection notice. Every proposed file has an expandable explanation and a link to its exact diff. Required-check completeness is shared by the report, review, and service guard; optional skipped checks are clearly counted. Separate approval and rejection confirmations record simulated decisions only. Pending operations disable competing actions, and interrupted approval requires confirmation again.

Phase 6 preserved the visual foundation and removed Fast Refresh warnings by keeping navigation helpers and toast hooks outside component exports. The workflow strip keeps the current stage visible through viewport changes without moving the document. Responsive screenshots and interaction tests cover desktop through phone layouts. Historical Phase 1 boundaries below describe the original foundation, not current feature availability.

Phase 1 · 1 November 2026

## Product intent

Phoenix is a considered developer workspace for website repair. The visual system expresses trust, transparency, and human control. It takes cues from the clarity and density of professional developer tools, with an original Phoenix identity and an explanatory repair diagram.

The first-run overview introduces the workflow. A separate, persistent workspace organizes Diagnosis → Changes → Preview → Tests → Review. Phase 1 contains layout previews only; no import, investigation, repair, verification, approval, or file application is performed.

## Color tokens

Canonical values live in `src/styles/tokens.css`. `src/index.css` maps the relevant tokens into Tailwind's theme. Dark is the only theme in this phase.

| Token              | Value     | Role                            |
| ------------------ | --------- | ------------------------------- |
| `--background`     | `#111214` | Application canvas              |
| `--sidebar`        | `#151619` | Quiet navigation background     |
| `--surface`        | `#191B20` | Primary panels                  |
| `--surface-raised` | `#20232A` | Elevated panels and controls    |
| `--surface-hover`  | `#23252C` | Hover feedback                  |
| `--border`         | `#292C34` | Panel separation                |
| `--border-subtle`  | `#23252C` | Low-emphasis dividers           |
| `--foreground`     | `#F1F2F4` | Primary text                    |
| `--muted-strong`   | `#B4B7C2` | Secondary controls              |
| `--muted`          | `#969BA7` | Supporting text                 |
| `--primary`        | `#8B83F6` | Main actions and focus          |
| `--primary-hover`  | `#A39BFF` | Primary hover                   |
| `--accent-text`    | `#B8B1FF` | Readable violet text            |
| `--success`        | `#40C98A` | Actual verified success only    |
| `--warning`        | `#EAB66A` | Attention and pending decisions |
| `--error`          | `#E36B75` | Failure and errors              |

The primary button uses dark text (`#161322`) on violet for contrast. Violet badges and navigation use a pale violet foreground over a restrained tint. Illustrative and context surfaces use a small family of neutral violet shades; they do not introduce extra status meanings. Status always includes text, with an icon where useful.

Green must never communicate an unverified result. A demonstration can show a simulated result later, but must retain its execution-mode label and must not become real verification evidence.

## Typography

Geist Variable and Geist Mono Variable are installed through Fontsource and served locally. There is no Google Fonts or other remote font request.

| Role                  | Size                 | Weight  | Treatment                                 |
| --------------------- | -------------------- | ------- | ----------------------------------------- |
| Overview introduction | 27 px / 25 px mobile | 520     | Tight, readable hierarchy                 |
| Welcome statement     | 36 px / 34 px mobile | 510     | The only editorial emphasis               |
| Workspace title       | 24 px / 23 px mobile | 520     | Compact technical context                 |
| Empty-state title     | 22–23 px             | 480     | Calm, concise guidance                    |
| Section heading       | 14–17 px             | 500     | Clear grouping                            |
| Controls and body     | 11–13 px             | 400–550 | Dense developer-tool presentation         |
| Supporting labels     | 9–11 px              | 400–500 | Secondary information                     |
| Technical metadata    | 8–10 px              | 400–450 | Geist Mono; identifiers and stage numbers |

The workflow illustration has smaller, nonessential captions and is hidden from assistive technology; its meaning is expressed in the surrounding text and workflow links. Filenames, code, logs, and identifiers in future phases use Geist Mono.

## Spacing and geometry

- Base spacing rhythm: 4, 8, 12, 16, 20, 24, 28, 32, 40, 48 px.
- Sidebar: 232 px expanded; 68 px collapsed. Collapsed items keep accessible names and tooltips.
- Header: 60 px desktop; 58 px phone.
- Main content: centered, maximum 1200 px including gutters; 40 px gutters desktop, 20 px phone.
- Controls: 6 px radius; panels: 8–10 px; dialogs: 11 px.
- Borders are normally 1 px. Shadows are reserved for elevation and a small amount of control depth.
- The welcome panel uses one low-intensity radial tint; status surfaces do not glow.

## Shared components

`components/ui` owns source-level primitives: Button, Badge, Dialog/Sheet, DropdownMenu, Tooltip, and Switch. They use the shadcn composition model, Radix accessibility behavior, class-variance-authority, and the shared `cn` utility. `components.json` and the `@/` alias support subsequent shadcn additions without replacing the Phoenix theme.

`components/shared` owns PhoenixMark, StatusBadge, PageHeading, PageTransition, EmptyState, LoadingState, ToastProvider, ErrorBoundary, and the introductory guide. Lucide is the interface icon family; the Phoenix mark is a small original SVG.

Navigation and workflow labels are centralized in `src/config/navigation.ts`. Layouts own navigation context; feature pages own their contents. Source, status, and future service types remain separate from presentation.

## Interaction and motion

- Hover: 140 ms background or foreground change.
- Sidebar: 200 ms width transition with `cubic-bezier(.2,.8,.2,1)`.
- Page entry: 220 ms, 6 px vertical displacement, no decorative loops.
- Dialog: 140–180 ms, restrained fade and movement.
- Ctrl/Cmd+K opens page navigation; arrows choose a page; Enter navigates; Escape dismisses.
- Ctrl/Cmd+Backslash toggles the desktop sidebar.
- Clipboard actions report their actual success or failure through an accessible toast.
- The only loading animation represents a real lazy module load.
- System reduced-motion preferences are respected. The local Reduce motion setting can additionally turn motion off, and persists with the sidebar preference.

## Responsive hierarchy

| Width             | Behavior                                                                       |
| ----------------- | ------------------------------------------------------------------------------ |
| 1351 px and above | Full sidebar and three workspace panels                                        |
| 1024–1350 px      | Full/collapsible sidebar, reduced secondary workspace panel                    |
| 801–1023 px       | Drawer navigation; two workspace panels where space allows                     |
| 601–800 px        | Drawer navigation and a single workspace canvas                                |
| 600 px and below  | Stacked welcome panel, vertical journey, compact header and workspace controls |

Workflow tabs may scroll inside their own navigation strip on phones. The document itself must never overflow horizontally. Keyboard focus must be able to reveal every stage. Narrow secondary context remains available through compact session details.

QA targets: 1440 × 900, 1280 × 800, 768 × 1024, and 390 × 844. The future mobile diff must use a separate readable presentation rather than shrinking Monaco.

## Accessibility

- Semantic header, navigation, main, aside, section, and footer landmarks.
- One page-level heading, structured supporting headings, and descriptive link names.
- Visible violet focus ring and a skip-to-content link.
- Accessible names on icon controls; collapsed labels remain available to screen readers.
- Radix dialogs and menus provide focus trapping, Escape handling, and keyboard interaction.
- Switches expose state and explanatory labels; toasts use a polite live region.
- Automated axe checks complement keyboard and screenshot inspection; they do not replace a full assistive-technology audit.

## Trust and state rules

1. `executionMode`, `status`, `verification`, `decision`, and `application` are separate concepts in the domain model.
2. Demo mode is visible in the application header and repair shell.
3. The shell preview has no imported project, connected sandbox, or running repair.
4. Selecting a navigation stage cannot manufacture completed workflow activity.
5. Approval will require explicit confirmation and must remain distinct from successful backend application.
6. Uploaded source must never execute within the Phoenix origin. A future real preview requires an isolated origin and restrictive iframe policy.
7. No API key belongs in frontend source, public environment variables, or browser requests.

## Phase boundaries

Phase 2 adds dashboard data and ZIP import states. Phase 3 adds diagnosis and actual code comparison. Phase 4 adds safe demonstration preview and simulated test adapters. Phase 5 adds explicit simulated decisions. This foundation must stay visually consistent as those features arrive.
