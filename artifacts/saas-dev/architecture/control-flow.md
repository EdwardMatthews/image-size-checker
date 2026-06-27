# Control Flow

- Gate-ready: yes
- Core request flow: route renders client tool -> user selects files -> file validation and decode run -> checker state changes from empty to result -> user reviews selected image and batch summary -> user optionally navigates to `/resizer` -> resize settings produce output blobs -> user downloads individual files or ZIP.
- Retry/rate-limit behavior: no external API rate limits. Retry means remove/re-upload a failed file or click resize/download again. Batch processing should avoid unbounded parallel Canvas work.
- Logging: no image contents or filenames sent externally. Runtime console errors only during development. UI shows human-readable errors.
- Security and abuse controls: accepted file filters, decode error isolation, no remote image URL import in MVP, no server upload, no auth surface, no database, no payments, no arbitrary script execution, object URL cleanup.

## Result State Control

The checker has two top-level states:

1. Empty: upload surface plus SEO content below.
2. Results: upload surface hidden; batch summary and selected result visible; "New check" resets state and revokes object URLs.

This directly implements the user's request that uploading an image should not leave the upload component at the top.
