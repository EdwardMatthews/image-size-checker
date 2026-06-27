# Information Architecture

- Gate-ready: yes
- Pages: `/` Image Size Checker landing/tool page; `/resizer` Image Resizer tool page; existing legal pages retained for footer.
- Navigation: Header links to Checker, Resizer, How it works, FAQ. Footer links to Resizer, Privacy, Terms, and ShipAny attribution.
- Primary keyword: Image Size Checker
- Planned landing word count: 1200
- SEO landing modules: tool-first upload/checker, result explanations, Web/SEO use cases, Social image dimensions guide, Print size guide, batch workflow section, privacy/local processing section, checker-to-resizer workflow, FAQ.
- FAQ/schema opportunities: FAQ about how to check image size, whether files upload to a server, difference between image size and file size, best size for Open Graph/social, how print size is calculated, whether batch image checking is supported, and when to use Image Resizer.
- Internal links: checker page links to `/resizer` from result actions and content; resizer page links back to `/`; FAQ links anchor to upload/result sections.
- Empty/error states: empty upload state with accepted file guidance; unsupported file type message; image decode failure; oversized batch warning; no resized outputs yet; ZIP generation failure; crop values outside image bounds; mobile table overflow handled with horizontal scroll.

## Page Details

- `/`: primary landing route. Above the fold is the checker upload/result surface. SEO support content follows after the tool and stays visible to search engines.
- `/resizer`: secondary tool route. It does not need 1000 words, but must have title, description, canonical, H1, and concise explanatory content.
- No account, pricing, dashboard, admin, or database pages are part of the product navigation.
