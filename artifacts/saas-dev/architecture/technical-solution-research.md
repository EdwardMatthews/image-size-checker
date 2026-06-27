# Technical Solution Research

- Gate-ready: yes
- Feature spec reviewed: artifacts/saas-dev/design/feature-spec.md
- Research date: 2026-06-26
- Search queries: browser image dimensions File API Canvas resize crop; JSZip download all ZIP browser; react-easy-crop canvas crop GitHub; pica browser image resize; W3C File API; WHATWG canvas.
- GitHub open-source projects reviewed: Stuk/jszip, nodeca/pica, ValentinH/react-easy-crop, Donaldcwl/browser-image-compression, arumes31/image-resizer.
- Technical blogs/docs reviewed: MDN File API, MDN Canvas drawImage, MDN HTMLCanvasElement.toBlob, JSZip generateAsync docs, web.dev image guidance.
- Papers/standards reviewed: W3C File API, WHATWG HTML Canvas section.
- Sources: https://github.com/Stuk/jszip, https://stuk.github.io/jszip/documentation/api_jszip/generate_async.html, https://github.com/nodeca/pica, https://github.com/ValentinH/react-easy-crop, https://github.com/Donaldcwl/browser-image-compression, https://developer.mozilla.org/en-US/docs/Web/API/File, https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage, https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob, https://www.w3.org/TR/FileAPI/, https://html.spec.whatwg.org/multipage/canvas.html
- AI-related project: no
- AI relevance rationale: The app checks image metadata and performs deterministic browser-side resizing/cropping/export. No AI model call, image generation, video generation, prompt workflow, or semantic reasoning is needed.
- Recommended technical direction: Client-side File/Blob APIs plus image decoding and Canvas for dimensions, preview, resize, crop, and export; add JSZip only for Download all ZIP; implement manual crop with lightweight in-house state and Canvas to avoid an extra cropper dependency for MVP.
- Cost/performance/security feasibility summary: All core work runs locally in the browser, so API cost is zero and privacy is strong. Canvas resizing is feasible for typical web/social/print images; batch operations need concurrency limits and object URL cleanup to reduce memory pressure. JSZip adds dependency weight but is targeted and mature. Security risk is mainly untrusted files and memory pressure, mitigated by type checks, decode errors, no server upload, and URL revocation.
- Major tradeoffs: Native Canvas is lower dependency and enough for MVP, but Pica can improve resize quality for demanding outputs; custom manual crop is lighter but less polished than react-easy-crop; ZIP generation is convenient but can be memory-heavy for very large batches.
- Open unknowns or POC needed: Browser memory behavior for very large batches; exact SVG rasterization support across browsers; whether to add Pica later if users notice quality artifacts.
- User review questions: none blocking for MVP because user already chose crop and ZIP feasibility direction; revisit Pica/react-easy-crop only if QA shows quality or crop UX gaps.

## Evidence Matrix

| Source type        | Source                       | URL                                                                                 | Applicability                                     | Feasibility | Performance                              | Cost     | Security/privacy                                                | Decision impact                                                                    |
| ------------------ | ---------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------- | ----------- | ---------------------------------------- | -------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Standard           | W3C File API                 | https://www.w3.org/TR/FileAPI/                                                      | File, Blob, name/type/size/lastModified semantics | High        | Native browser API                       | Free     | Browser-local; no upload required                               | Use File metadata as source for file info panel                                    |
| Official docs      | MDN File API                 | https://developer.mozilla.org/en-US/docs/Web/API/File                               | File objects from input/drop                      | High        | Native                                   | Free     | Local object URLs must be revoked                               | Use file input/drop plus object URLs                                               |
| Official docs      | MDN Canvas drawImage         | https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage | Resize and crop source rectangles                 | High        | Good for moderate batches                | Free     | Avoid drawing cross-origin remote images in MVP                 | Core resize/crop algorithm                                                         |
| Official docs      | MDN HTMLCanvasElement.toBlob | https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob           | Export resized image as Blob with format/quality  | High        | Async; avoids base64 overhead            | Free     | Output remains local until download                             | Use `toBlob` for downloads and ZIP entries                                         |
| Standard           | WHATWG HTML Canvas           | https://html.spec.whatwg.org/multipage/canvas.html                                  | Canvas behavior and image serialization standard  | High        | Browser-implemented                      | Free     | Same-origin/canvas-taint concerns mostly avoided by local files | Supports deterministic browser-only approach                                       |
| GitHub/open-source | JSZip                        | https://github.com/Stuk/jszip                                                       | Client-side ZIP generation                        | High        | Memory grows with output set             | Free OSS | Local files only; no server                                     | Add dependency for Download all ZIP                                                |
| Official docs      | JSZip generateAsync          | https://stuk.github.io/jszip/documentation/api_jszip/generate_async.html            | Generate Blob ZIP in browser                      | High        | Async progress possible                  | Free     | ZIP Blob can be object-URL downloaded                           | Implementation pattern for ZIP button                                              |
| GitHub/open-source | Pica                         | https://github.com/nodeca/pica                                                      | High-quality browser image resizing               | Medium-high | Better quality, extra dependency/workers | Free OSS | Local                                                           | Later if native Canvas quality is insufficient                                     |
| GitHub/open-source | react-easy-crop              | https://github.com/ValentinH/react-easy-crop                                        | Interactive crop UI                               | High        | UI dependency, state mapping             | Free OSS | Local                                                           | Reject for MVP to keep dependency count low; revisit if crop UX needs drag handles |
| GitHub/open-source | browser-image-compression    | https://github.com/Donaldcwl/browser-image-compression                              | Compress/resize in browser                        | Medium      | Useful but broader than needed           | Free OSS | Local                                                           | Reject for MVP because compression is not core scope                               |

## Option Matrix

| Option | Description                                         | Feasibility      | Performance                            | Cost                          | Security/privacy        | Complexity   | Maintenance | Fit                            |
| ------ | --------------------------------------------------- | ---------------- | -------------------------------------- | ----------------------------- | ----------------------- | ------------ | ----------- | ------------------------------ |
| A      | Pure client File API + Canvas + custom crop + JSZip | High             | Good for MVP; needs concurrency limits | Zero API cost; one dependency | Best privacy; no upload | Moderate     | Low-medium  | Recommended                    |
| B      | Canvas + Pica + react-easy-crop + JSZip             | High             | Better resize/crop UX, larger bundle   | Zero API cost; more deps      | Local                   | Higher       | Medium      | Later if quality/UX demands it |
| C      | Server-side image processing API                    | High technically | Strong for huge files                  | Hosting/API cost              | Images leave browser    | Higher infra | Higher      | Reject for privacy/YAGNI       |

## AI Workflow Assessment

- AI capabilities: not applicable.
- AI workflow design: not applicable because resizing/checking is deterministic.
- Model/API provider decision: not applicable.
- Buble API priority decision: not applicable because no AI model calls are needed.
- buble-sdk skill usage: not applicable.
- Image generation needed: no.
- Video generation needed: no.
- Server-side credential plan: no AI credentials or server-side secrets required for MVP.
- Async task/status workflow: local async decode/resize/ZIP progress only; no remote job polling.
- Cost/rate-limit/fallback plan: no model/API cost or rate limits; fallback is per-file error state and individual downloads if ZIP fails.
- Safety/privacy/moderation plan: validate file types, process locally, do not upload files, revoke object URLs, avoid logging image contents.
