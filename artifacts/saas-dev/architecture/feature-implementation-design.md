# Feature Implementation Design

- Gate-ready: yes
- Input feature spec: artifacts/saas-dev/design/feature-spec.md
- Selected technical direction: client-side File API + Canvas + custom crop state + JSZip for ZIP export.
- Client/server boundary rationale: All MVP features run in the browser. No server, database, authentication, payment, storage, queues, or AI calls are needed. This preserves privacy and keeps cost zero.
- Performance plan: decode files asynchronously, cap batch processing concurrency, revoke object URLs on removal/reset, use Canvas `toBlob`, avoid base64 strings for outputs, show processing states, and warn on very large batches.
- Cost plan: zero external API cost; one OSS dependency, JSZip, justified by Download all ZIP.
- Risk mitigation: validate MIME and decode failures, handle unsupported SVG rasterization gracefully, provide individual download fallback, keep manual crop numeric values within source bounds, avoid keeping stale blobs/object URLs.
- AI workflow implementation: not applicable; project is not AI-related.
- Buble integration implementation: not applicable.
- Prompt workflow implementation: not applicable.
- User review questions: none blocking for MVP.

## Feature Implementation Matrix

| Feature               | Boundary | Components/modules                                  | Data/API contract                                                | Algorithm/library/API choice                                         | Error handling                           | Performance/test strategy                       |
| --------------------- | -------- | --------------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------- | ----------------------------------------------- |
| Upload-first checker  | Client   | `ImageDropzone`, `useImageFiles`                    | `ImageAsset` with file metadata, objectUrl, dimensions           | `input[type=file]`, drag/drop, `createImageBitmap` or Image fallback | Unsupported file, decode failure         | Unit-check utility functions; browser upload QA |
| Result-only state     | Client   | `CheckerPage`, `ImageResultPanel`                   | state: empty vs results                                          | React state only                                                     | New check resets and revokes URLs        | Browser QA after upload                         |
| Image info panel      | Client   | `ImageInfoCard`                                     | name, type, size, dimensions, aspect ratio, pixels, lastModified | File API + decoded image dimensions                                  | Missing metadata falls back to `unknown` | Snapshot/browser visual check                   |
| All-preset fit report | Client   | `PresetFitTable`, `PresetCategorySection`           | preset list and computed fit rows                                | deterministic dimension/aspect comparisons                           | Never show Fail; show explanatory labels | Utility tests for fit classification            |
| Batch summary         | Client   | `BatchSummary`                                      | per-file readiness counts and selected asset id                  | memoized computed summaries                                          | Failed files stay visible with reason    | Multi-file browser QA                           |
| Print calculations    | Client   | `PrintSizeTable`                                    | PPI rows with inches/cm                                          | width/PPI, height/PPI, cm = inches\*2.54                             | None beyond missing dimensions           | Utility tests for conversions                   |
| Image Resizer page    | Client   | `ResizerPage`, `ResizeControls`, `ResizeOutputList` | resize settings and output blobs                                 | Canvas drawImage/toBlob                                              | invalid dimensions, decode errors        | Browser QA resize/download                      |
| Manual crop           | Client   | `ManualCropPanel`                                   | crop x/y/w/h normalized to source                                | Canvas source rectangle                                              | clamp to image bounds                    | Test crop math; browser visual QA               |
| Download all ZIP      | Client   | `downloadZip` utility                               | output blobs + names                                             | JSZip `generateAsync({ type: "blob" })`                              | ZIP failure -> individual downloads      | ZIP file presence/download QA                   |

## Dependency Decisions

| Dependency/API           | Decision       | Reason                                | Risk                                | Mitigation                                    |
| ------------------------ | -------------- | ------------------------------------- | ----------------------------------- | --------------------------------------------- |
| JSZip                    | Add            | Required for Download all ZIP         | Bundle/memory                       | Lazy import on ZIP click                      |
| Pica                     | Do not add MVP | Native Canvas is enough initially     | Lower resize quality for edge cases | Add later if QA/user feedback shows artifacts |
| react-easy-crop          | Do not add MVP | Custom numeric/overlay crop is enough | Less polished drag UX               | Revisit after MVP                             |
| Browser File/Canvas APIs | Use            | Standards-based, local, zero cost     | Memory limits                       | Object URL cleanup and batch limits           |
