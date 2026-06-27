# User Flows

- Gate-ready: yes

## Primary Checker Flow

1. User lands on `/` and sees an upload-first Image Size Checker.
2. User uploads one or more images by clicking or dragging files.
3. Client validates file type and decodes each image locally.
4. Upload component disappears.
5. User sees batch summary and selected-image result.
6. Result shows preview, image information, print-size calculations, and preset fit sections for Web/SEO, Social, and Print.
7. User can switch selected image, copy values, start a new check, or open Image Resizer with the relevant preset in mind.

## Resizer Flow

1. User opens `/resizer` directly or from checker.
2. User uploads one or more images.
3. User chooses a preset category and preset, or enters custom width/height.
4. User chooses fit mode: contain, cover/crop, stretch, or manual crop.
5. User sets output format and quality where applicable.
6. Client renders resized outputs with Canvas.
7. User downloads individual images or Download all ZIP.

## Failure And Edge Flows

- Unsupported file: show inline error with accepted formats.
- Decode failure: mark the file failed and continue processing other batch files.
- Image too small for print preset: explain "too small for sharp print" and show the required pixel delta instead of Fail.
- Aspect mismatch: mark "crop recommended" or "padding needed" depending on mode.
- ZIP failure or memory pressure: show retry guidance and allow individual downloads.
- Mobile: preset tables scroll horizontally while summary cards and controls stack.
