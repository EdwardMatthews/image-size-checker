# Database Schema Decision

- Gate-ready: yes
- Database needed: no
- Reason: The MVP performs local image analysis and resizing in the browser. It has no accounts, saved projects, payments, cloud import, analytics requirement, or server-side processing.
- Data lifecycle: Files are loaded into browser memory, object URLs are created for previews, computed metadata and output blobs live in React state, and everything is discarded on reset/page close except files the user downloads.
- Tables: not applicable.
- Migrations: not applicable.

## Future Schema Triggers

A database may become necessary only if later scope adds saved presets, user accounts, history, cloud imports, or server-side image processing jobs.
