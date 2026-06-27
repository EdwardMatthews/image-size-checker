# UI Design Spec

- Gate-ready: yes
- Visual direction: mainstream upload checker, clean utility UI, light background, cyan/teal primary, green success accents, warm print accent, no decorative orbs, no one-note purple/dark-slate/beige theme.
- Layout system: max-width container, sticky simple header, tool-first top band, result cards in two-column desktop layout, stacked mobile layout, semantic tables for preset and print calculations, no nested cards.
- Components: upload dropzone, batch summary chips/cards, preview panel, image information table, print-size table, preset comparison tables, resizer preset selector, numeric inputs/sliders, format select, quality slider, manual crop controls, download buttons, ZIP button, FAQ accordion.
- Mobile behavior: upload/result cards stack; tables use horizontal overflow with visible labels; touch targets at least 44px; action buttons wrap cleanly; no text overlap.
- SEO content placement: the tool is first. SEO copy begins below the tool with useful sections, FAQs, examples, and internal link to Image Resizer. It must not push the upload interaction below the first viewport.
- 1000+ word landing content modules: intro/definition, how to use checker, Web/SEO requirements, Social requirements, Print/PPI explanation, batch workflow, privacy/local processing, checker-to-resizer workflow, FAQ.
- Keyword-density guardrails: primary keyword is `Image Size Checker`; target 12-16 exact occurrences across 1000-1300 visible words, density 3%-5%; write useful adjacent terms instead of stuffing.
- Accessibility notes: real buttons and labels, keyboard-accessible file input, visible focus ring, aria-live for processing/errors, color is not the only status indicator, semantic tables for tabular results, alt text for previews, reduced-motion safe transitions.
- UI mockup/screenshot evidence: artifacts/saas-dev/design/ui-artifacts/checker-resizer-wireframe.svg; research screenshots under artifacts/saas-dev/research/screenshots/.
- User-approved decisions: no Requirement selector; upload hidden after result; all Web/SEO/Social/Print preset dimensions listed in result; mainstream upload-checker tone; Image Resizer page included.
- ui-ux-pro-max evidence: `python3 /Users/user/.agents/skills/ui-ux-pro-max/scripts/search.py "image upload checker utility SaaS clean trustworthy responsive" --design-system -p "Image Size Checker" -f markdown` recommended a minimal single-column, flat-design, high-contrast utility direction; shadcn stack search recommended semantic Table/DataTable structure for result tables.

## Visual Notes

- Use lucide icons for upload, image, ruler, crop, download, archive, refresh, file, info, and check/warning states.
- Avoid emoji icons in UI labels.
- Keep cards at 8px radius or local design-system radius; avoid nested cards.
- Use stable dimensions for upload zone, preview, toolbar, preset rows, and action buttons.
