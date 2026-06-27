# Implementation Plan

- Gate-ready: yes
- Approved feature spec: artifacts/saas-dev/design/feature-spec.md
- Technical solution research: artifacts/saas-dev/architecture/technical-solution-research.md
- Feature implementation design: artifacts/saas-dev/architecture/feature-implementation-design.md
- Data flow: artifacts/saas-dev/architecture/data-flow.md
- Control flow: artifacts/saas-dev/architecture/control-flow.md
- Database decision/schema: artifacts/saas-dev/architecture/schema.md
- UI design spec: artifacts/saas-dev/design/ui-design-spec.md
- quick-start skill invocation plan: use project-local `.claude/skills/quick-start/SKILL.md` Mode C discipline, but choose database `None` for product runtime and avoid auth/payment/dashboard changes.
- `uipro init --ai codex` plan: run in `/Users/user/Games/image-size-checker` before UI implementation and record output in `verification/build-tooling.md`.
- ui-ux-pro-max invocation plan: already ran design-system and shadcn stack searches; apply accessibility, no emoji icons, semantic table, responsive checks during implementation.
- Cohesion/coupling/SRP checks: keep image math in `src/lib/image-tools.ts`, checker page owns checker state, resizer page owns resize state, shared UI helpers stay presentational.
- KISS/YAGNI checks: no auth, database, payments, admin/dashboard product flows, URL import, cloud import, compression suite, AI, or server processing in MVP.
- Primary keyword: Image Size Checker
- Title <= 60 chars and includes primary keyword: `Image Size Checker - Resize Images Fast` (41 characters)
- Description <= 160 chars and includes primary keyword: `Image Size Checker checks dimensions, compares presets, and resizes images for web, social, and print in your browser.` (124 characters)
- Canonical: `/` -> `${app_url}/`; `/resizer` -> `${app_url}/resizer`
- H1: Homepage `Image Size Checker`; Resizer page `Image Size Checker and Resizer`
- Landing content modules: tool intro, how to use, Web/SEO dimensions, Social dimensions, Print/PPI, batch checking, privacy, resizing workflow, FAQ.
- Visible word count target: 1150
- FAQ/schema/internal links: FAQ section on homepage with internal links to `/resizer`; JSON-LD FAQ can be added if low-risk after build.
- Verification method: `pnpm build`, TypeScript build output, agent-browser desktop/mobile upload/resizer QA, and `python3 ~/.codex/skills/saas-dev/scripts/validate_seo.py --url http://localhost:3000/ --url http://localhost:3000/resizer --keyword "Image Size Checker"`.

| Task                                                         | Scope/files                                                                      | Why                                                                              | Verification                         |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------ |
| Configure app identity and dependencies                      | package.json, env defaults/messages, public logo/favicon, install JSZip          | Set product name and enable ZIP                                                  | build/typecheck                      |
| Add image utility module                                     | `src/lib/image-tools.ts`                                                         | Centralize presets, decode, fit math, print math, resize/crop/export             | targeted TypeScript and browser QA   |
| Build checker page                                           | `src/routes/index.tsx`, maybe helper components                                  | Implement upload-first/result-only state, batch summary, preset report, SEO copy | agent-browser upload and screenshots |
| Build resizer page                                           | `src/routes/resizer.tsx`                                                         | Implement preset resize, manual crop controls, output downloads, ZIP             | agent-browser resize/download QA     |
| Update navigation/footer/metadata                            | header/footer/root/meta/routes                                                   | Correct product IA and SEO metadata                                              | SEO checker                          |
| Update styling                                               | globals.css and route classes                                                    | Remove beige/orb look; clean cyan/green utility style                            | desktop/mobile screenshots           |
| Remove or hide irrelevant template surfaces from product nav | header/footer route composition                                                  | YAGNI: avoid pricing/blog/admin/settings links in product nav                    | visual/browser nav check             |
| Verify                                                       | pnpm build, targeted tsc if available, SEO checker, agent-browser desktop/mobile | Confirm functionality and SEO requirements                                       | final QA artifacts                   |

## Expected Outcomes

- Homepage title includes `Image Size Checker`, <=60 characters.
- Homepage description includes `Image Size Checker`, <=160 characters.
- Homepage visible copy >=1000 words and keyword density 3%-5%.
- `/resizer` has title, description, canonical, and H1.
- No runtime server/database dependency for the checker/resizer.
- Download all ZIP works for generated outputs.
