# Data Flow

- Gate-ready: yes
- Inputs: local image files selected by input or drag/drop; resize settings such as preset, custom width/height, fit mode, manual crop rectangle, output format, and quality.
- Transformations: validate file type; decode image locally; create object URL for preview; extract metadata; compute aspect ratio, pixel count, print sizes, preset fit deltas; resize/crop via Canvas; export output blobs; optionally package blobs with JSZip.
- External APIs: none for MVP. HasData/last30days were research-only and are not runtime dependencies.
- Failure handling: per-file unsupported type error; decode failure state; crop clamp; invalid target dimensions disabled; ZIP failure falls back to individual downloads; object URLs revoked on reset/removal.
- Outputs: on-screen preview, image information, batch summary, preset comparison rows, print-size table, individual resized image downloads, ZIP download blob.

## Privacy Data Flow

Files stay inside the browser runtime. No image bytes are uploaded, stored, logged, or sent to third-party APIs. The only persisted outputs are files the user explicitly downloads.
