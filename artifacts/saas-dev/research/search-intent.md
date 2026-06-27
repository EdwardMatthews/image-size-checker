# Search Intent

- Gate-ready: yes
- Keyword: Image Size Checker
- Market: United States
- Language: en
- HasData SERP file: artifacts/saas-dev/research/serp/hasdata-serp-image-size-checker.json
- Secondary SERP file for second page: artifacts/saas-dev/research/serp/hasdata-serp-image-resizer.json
- Search intent summary: Users want a fast online tool to inspect an image's pixel dimensions, file size, format, aspect ratio, and practical fitness for web, social, or print requirements. The SERP is mixed tool plus SEO/informational content, but the highest-value job is tool-first.
- Primary user job: Upload one or more images and understand whether the image dimensions are usable for a target context without reading multiple guides or manually comparing dimensions.
- Secondary intents: learn the difference between pixel size, file size, aspect ratio, PPI/DPI, and print size; resize images to required dimensions; batch process many assets; keep images private; download processed files together.
- Query classification: mixed tool/product plus informational. The landing page should put the usable checker first, then provide useful SEO content below the tool.
- Relevant result types: direct product/tool pages, image-size finder/checker tools, image resizer tools, print-size calculators, SEO/content explainers, social-image requirement guides.
- Irrelevant result types: generic "image size" compression articles without dimensions workflow, printing product pages with no checker, image search/image datasets, forum noise unrelated to dimensions.
- Evidence: HasData returned 10 normalized Image Size Checker results and 10 normalized Image Resizer results; browser walkthroughs covered imagesizefinder.org, PosterBurner, iLoveIMG, Bulk Resize Photos, and ImageResizer.com; last30days found active in-browser bulk image processing and platform image-size pain signals.

## Evidence

- HasData normalized 10 Google results for Image Size Checker. Direct tools include PosterBurner Image Size Finder, Imagy Image Size Finder, imagesizefinder.org, OnlineTools image dimensions, KnowledgeWalls Image Size Finder, Bug0, imagesizefinder.com, and imagesizechecker.com.
- HasData normalized 10 Google results for Image Resizer. Direct competitors include imageresizer.com, Adobe Express resize image, Simple Image Resizer, Jam.dev utilities, Shutterstock Image Resizer, iLoveIMG, Canva, Bulk Resize Photos, and Resizer.AI.
- Browser walkthroughs show checker competitors emphasize width/height/file info and privacy, while resizer competitors emphasize upload, target dimension controls, format/quality controls, batch processing, and download.
- last30days evidence was thin but supported three adjacent needs: in-browser bulk image/file processing, image payload too large failures, and link-preview image dimension/caching issues.
- Inference: The product should not ask users to choose one requirement before checking. Upload should generate a diagnostic report for all Web/SEO, Social, and Print presets, then offer resizing as a follow-up path.

## Product Scope Implications

- Build the first viewport around upload, not a marketing-only hero.
- On upload, hide the upload component and show results directly.
- Replace "pass/fail requirement" with explanatory fit labels such as Ready, Close, Resize, Crop, Too small for print, or Different aspect.
- Include a second Image Resizer page because the SERP and user workflow naturally continue from "what size is this?" to "make it the right size."
- Keep URL input/import as later scope because the user's clarified MVP excludes it.
