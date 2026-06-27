export type PresetCategory = 'Web/SEO' | 'Social' | 'Print';

export type FitStatus =
  | 'ready'
  | 'large-enough'
  | 'resize'
  | 'crop'
  | 'too-small';

export interface ImagePreset {
  id: string;
  category: PresetCategory;
  name: string;
  width: number;
  height: number;
  note: string;
}

export interface ImageAsset {
  id: string;
  file: File;
  objectUrl: string;
  name: string;
  type: string;
  size: number;
  lastModified: number;
  width: number;
  height: number;
}

export interface FailedImage {
  id: string;
  name: string;
  error: string;
}

export interface FitResult {
  preset: ImagePreset;
  status: FitStatus;
  label: string;
  widthDelta: number;
  heightDelta: number;
  aspectDelta: number;
  detail: string;
}

export interface ResizeSettings {
  width: number;
  height: number;
  fit: 'contain' | 'cover' | 'stretch' | 'manual';
  format: 'image/jpeg' | 'image/png' | 'image/webp';
  quality: number;
  background: string;
  crop?: CropRect;
}

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DrawRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ResizeDrawPlan {
  canvas: {
    width: number;
    height: number;
  };
  source: CropRect;
  destination: DrawRect;
}

export interface ResizeOutput {
  id: string;
  sourceId: string;
  name: string;
  blob: Blob;
  width: number;
  height: number;
  size: number;
}

export const PRESETS: ImagePreset[] = [
  {
    id: 'og-image',
    category: 'Web/SEO',
    name: 'Open Graph share image',
    width: 1200,
    height: 630,
    note: 'Common link preview size for articles and landing pages.',
  },
  {
    id: 'twitter-summary',
    category: 'Web/SEO',
    name: 'X / Twitter wide card',
    width: 1200,
    height: 675,
    note: 'Wide 16:9 social card for posts and previews.',
  },
  {
    id: 'hero',
    category: 'Web/SEO',
    name: 'Website hero',
    width: 1600,
    height: 900,
    note: 'A practical 16:9 hero image target.',
  },
  {
    id: 'blog-thumbnail',
    category: 'Web/SEO',
    name: 'Blog thumbnail',
    width: 1200,
    height: 800,
    note: 'Editorial thumbnail with a 3:2 ratio.',
  },
  {
    id: 'favicon-source',
    category: 'Web/SEO',
    name: 'Favicon source',
    width: 512,
    height: 512,
    note: 'Square source for app icons and favicons.',
  },
  {
    id: 'instagram-square',
    category: 'Social',
    name: 'Instagram square',
    width: 1080,
    height: 1080,
    note: 'Square feed image.',
  },
  {
    id: 'instagram-portrait',
    category: 'Social',
    name: 'Instagram portrait',
    width: 1080,
    height: 1350,
    note: 'Portrait feed image.',
  },
  {
    id: 'story',
    category: 'Social',
    name: 'Story / Reel cover',
    width: 1080,
    height: 1920,
    note: 'Vertical story format.',
  },
  {
    id: 'facebook-linkedin',
    category: 'Social',
    name: 'Facebook / LinkedIn share',
    width: 1200,
    height: 627,
    note: 'Common professional feed link preview.',
  },
  {
    id: 'pinterest-pin',
    category: 'Social',
    name: 'Pinterest pin',
    width: 1000,
    height: 1500,
    note: 'Tall pin format.',
  },
  {
    id: 'print-4x6',
    category: 'Print',
    name: '4 x 6 in at 300 PPI',
    width: 1200,
    height: 1800,
    note: 'Standard photo print.',
  },
  {
    id: 'print-5x7',
    category: 'Print',
    name: '5 x 7 in at 300 PPI',
    width: 1500,
    height: 2100,
    note: 'Common framed print.',
  },
  {
    id: 'print-8x10',
    category: 'Print',
    name: '8 x 10 in at 300 PPI',
    width: 2400,
    height: 3000,
    note: 'High-quality portrait print.',
  },
  {
    id: 'print-a4',
    category: 'Print',
    name: 'A4 at 300 PPI',
    width: 2480,
    height: 3508,
    note: 'International document print.',
  },
  {
    id: 'print-letter',
    category: 'Print',
    name: 'US Letter at 300 PPI',
    width: 2550,
    height: 3300,
    note: 'US document print.',
  },
];

export const PRESET_CATEGORIES: PresetCategory[] = [
  'Web/SEO',
  'Social',
  'Print',
];

export const PRINT_ROWS = [
  { label: 'Excellent', ppi: 300 },
  { label: 'Good', ppi: 150 },
  { label: 'Fair', ppi: 100 },
  { label: 'Web/Screen', ppi: 72 },
];

const ACCEPTED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/bmp',
]);

export function isAcceptedImage(file: File) {
  return (
    ACCEPTED_TYPES.has(file.type) ||
    /\.(jpe?g|png|webp|gif|svg|bmp)$/i.test(file.name)
  );
}

export async function loadImageAsset(file: File): Promise<ImageAsset> {
  if (!isAcceptedImage(file)) {
    throw new Error(
      'Unsupported file type. Use JPG, PNG, WebP, GIF, SVG, or BMP.'
    );
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const { width, height } = await readImageDimensions(objectUrl);
    return {
      id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
      file,
      objectUrl,
      name: file.name,
      type: file.type || 'unknown',
      size: file.size,
      lastModified: file.lastModified,
      width,
      height,
    };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

export function readImageDimensions(src: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
      });
    };
    img.onerror = () => reject(new Error('Could not decode this image.'));
    img.src = src;
  });
}

export function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const idx = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const value = bytes / 1024 ** idx;
  return `${value >= 10 || idx === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[idx]}`;
}

export function formatDate(value: number) {
  if (!value) return 'Unknown';
  return new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(value);
}

export function aspectRatio(width: number, height: number) {
  const divisor = gcd(width, height);
  return `${Math.round(width / divisor)}:${Math.round(height / divisor)}`;
}

export function comparePreset(
  asset: Pick<ImageAsset, 'width' | 'height'>,
  preset: ImagePreset
): FitResult {
  const widthDelta = asset.width - preset.width;
  const heightDelta = asset.height - preset.height;
  const assetRatio = asset.width / asset.height;
  const targetRatio = preset.width / preset.height;
  const aspectDelta = Math.abs(assetRatio - targetRatio) / targetRatio;
  const exact = widthDelta === 0 && heightDelta === 0;
  const largeEnough = widthDelta >= 0 && heightDelta >= 0;

  if (exact) {
    return {
      preset,
      status: 'ready',
      label: 'Ready',
      widthDelta,
      heightDelta,
      aspectDelta,
      detail: 'Exact pixel match.',
    };
  }

  if (!largeEnough && preset.category === 'Print') {
    return {
      preset,
      status: 'too-small',
      label: 'Too small for sharp print',
      widthDelta,
      heightDelta,
      aspectDelta,
      detail: `Needs ${Math.max(0, -widthDelta)} more px wide and ${Math.max(0, -heightDelta)} more px tall for this print preset.`,
    };
  }

  if (aspectDelta > 0.035) {
    return {
      preset,
      status: 'crop',
      label: largeEnough ? 'Crop recommended' : 'Resize and crop',
      widthDelta,
      heightDelta,
      aspectDelta,
      detail: `Aspect ratio differs from ${aspectRatio(preset.width, preset.height)}.`,
    };
  }

  if (largeEnough) {
    return {
      preset,
      status: 'large-enough',
      label: 'Large enough',
      widthDelta,
      heightDelta,
      aspectDelta,
      detail: 'Can be resized down with minimal framing changes.',
    };
  }

  return {
    preset,
    status: 'resize',
    label: 'Needs resize',
    widthDelta,
    heightDelta,
    aspectDelta,
    detail: `Needs ${Math.max(0, -widthDelta)} more px wide and ${Math.max(0, -heightDelta)} more px tall.`,
  };
}

export function printSizeRows(asset: Pick<ImageAsset, 'width' | 'height'>) {
  return PRINT_ROWS.map((row) => {
    const inchesW = asset.width / row.ppi;
    const inchesH = asset.height / row.ppi;
    return {
      ...row,
      inches: `${inchesW.toFixed(1)}" x ${inchesH.toFixed(1)}"`,
      centimeters: `${(inchesW * 2.54).toFixed(1)} cm x ${(inchesH * 2.54).toFixed(1)} cm`,
    };
  });
}

export async function resizeImage(
  asset: ImageAsset,
  settings: ResizeSettings
): Promise<ResizeOutput> {
  const image = await loadImage(asset.objectUrl);
  const plan = createResizeDrawPlan(asset, settings);
  const canvas = document.createElement('canvas');
  canvas.width = plan.canvas.width;
  canvas.height = plan.canvas.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available in this browser.');

  ctx.fillStyle = settings.background || '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(
    image,
    plan.source.x,
    plan.source.y,
    plan.source.width,
    plan.source.height,
    plan.destination.x,
    plan.destination.y,
    plan.destination.width,
    plan.destination.height
  );

  const blob = await canvasToBlob(canvas, settings.format, settings.quality);
  const extension = extensionForType(settings.format);
  return {
    id: `${asset.id}-${settings.width}x${settings.height}-${settings.fit}`,
    sourceId: asset.id,
    name: replaceExtension(asset.name, extension),
    blob,
    width: plan.canvas.width,
    height: plan.canvas.height,
    size: blob.size,
  };
}

export function createResizeDrawPlan(
  asset: Pick<ImageAsset, 'width' | 'height'>,
  settings: ResizeSettings,
  outputWidth = settings.width,
  outputHeight = settings.height
): ResizeDrawPlan {
  const canvasWidth = Math.max(1, Math.round(outputWidth));
  const canvasHeight = Math.max(1, Math.round(outputHeight));
  const source = resolveSourceRect(asset, settings);
  const destination =
    settings.fit === 'contain'
      ? containRect(source.width, source.height, canvasWidth, canvasHeight)
      : { x: 0, y: 0, width: canvasWidth, height: canvasHeight };

  return {
    canvas: { width: canvasWidth, height: canvasHeight },
    source,
    destination,
  };
}

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function safeCrop(
  asset: Pick<ImageAsset, 'width' | 'height'>,
  crop: CropRect
): CropRect {
  const x = clamp(Math.round(crop.x), 0, asset.width - 1);
  const y = clamp(Math.round(crop.y), 0, asset.height - 1);
  const width = clamp(Math.round(crop.width), 1, asset.width - x);
  const height = clamp(Math.round(crop.height), 1, asset.height - y);
  return { x, y, width, height };
}

function resolveSourceRect(
  asset: Pick<ImageAsset, 'width' | 'height'>,
  settings: ResizeSettings
): CropRect {
  if (settings.fit === 'stretch' || settings.fit === 'contain') {
    return { x: 0, y: 0, width: asset.width, height: asset.height };
  }
  if (settings.fit === 'manual' && settings.crop) {
    return safeCrop(asset, settings.crop);
  }

  const targetRatio = settings.width / settings.height;
  const sourceRatio = asset.width / asset.height;
  if (sourceRatio > targetRatio) {
    const width = Math.round(asset.height * targetRatio);
    return {
      x: Math.round((asset.width - width) / 2),
      y: 0,
      width,
      height: asset.height,
    };
  }

  const height = Math.round(asset.width / targetRatio);
  return {
    x: 0,
    y: Math.round((asset.height - height) / 2),
    width: asset.width,
    height,
  };
}

function containRect(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number
) {
  const scale = Math.min(
    targetWidth / sourceWidth,
    targetHeight / sourceHeight
  );
  const width = Math.round(sourceWidth * scale);
  const height = Math.round(sourceHeight * scale);
  return {
    x: Math.round((targetWidth - width) / 2),
    y: Math.round((targetHeight - height) / 2),
    width,
    height,
  };
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error('Could not load image for resizing.'));
    image.src = src;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: ResizeSettings['format'],
  quality: number
) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Could not export resized image.'));
      },
      type,
      type === 'image/png' ? undefined : quality
    );
  });
}

function gcd(a: number, b: number): number {
  return b === 0 ? Math.abs(a) || 1 : gcd(b, a % b);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function extensionForType(type: ResizeSettings['format']) {
  if (type === 'image/png') return 'png';
  if (type === 'image/webp') return 'webp';
  return 'jpg';
}

function replaceExtension(name: string, extension: string) {
  const base = name.replace(/\.[^.]+$/, '');
  return `${base}-${Date.now()}.${extension}`;
}
