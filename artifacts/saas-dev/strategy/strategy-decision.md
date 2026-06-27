# Strategy Decision

- Gate-ready: yes
- Final positioning: Image Size Checker is a private, batch-capable, requirement-aware image checker that explains how uploaded images fit Web/SEO, Social, and Print presets, then helps users resize or crop them on a dedicated Image Resizer page.
- Target user: marketers, creators, designers, bloggers, sellers, web builders, and print-prep users who need quick answers about whether images match common publishing requirements.
- Core scenario: User uploads one or more images, sees preview and image information, gets all preset comparisons without choosing a Requirement, reviews batch summary, then optionally resizes/crops and downloads outputs as individual files or a ZIP.
- MVP scope: home checker page, batch upload, batch summary, preview and image info, Web/SEO/Social/Print preset comparison, print-size calculations, Image Resizer page, preset dimensions, manual crop controls, output format/quality, individual downloads, Download all ZIP, SEO landing content and metadata.
- Differentiators: no pre-upload requirement selector, no Fail-first language, all scenario deltas in one result, print-size calculations inline, checker-to-resizer flow, local-only client processing, batch summary for checker and resizer.
- User-approved decisions: requirement-aware checker positioning; include Image Resizer as second page; MVP includes batch upload and batch summary; first preset groups are Web/SEO, Social, Print; URL checking/import is later; UI should be a mainstream upload checker; after upload the checker hides the upload component and shows results directly.

## Decision Notes

- Use "Needs resize", "Crop recommended", "Large enough", "Too small for print", and similar guidance instead of binary Fail.
- Preserve SEO as a build requirement: landing content at least 1000 visible words, primary keyword density 3%-5%, correct title/description/canonical on important pages.
- The app is not AI-related. No Buble, prompt-images, or prompt-videos workflow is needed.
