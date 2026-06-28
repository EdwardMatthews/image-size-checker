import { useEffect, useMemo, useRef, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import {
  Archive,
  Download,
  ImageIcon,
  RefreshCw,
  Ruler,
  Sparkles,
  Upload,
} from 'lucide-react';

import { envConfigs } from '@/config';
import {
  createResizeDrawPlan,
  downloadBlob,
  formatBytes,
  loadImageAsset,
  resizeImage,
  type FailedImage,
  type ImageAsset,
  type ResizeOutput,
  type ResizeSettings,
} from '@/lib/image-tools';
import { cn } from '@/lib/utils';
import { PublicFooter } from '@/components/public-footer';
import { SizeToolsMenu } from '@/components/size-tools-menu';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const TITLE = '300x300 Image Converter - Resize Images';
const DESCRIPTION =
  '300x300 image converter for local JPG, PNG, and WebP resizing. Create square images for avatars, listings, icons, and thumbnails.';
const TARGET_SIZE = 300;

type ConverterOutput = ResizeOutput & {
  sourceName: string;
};

const DEFAULT_SETTINGS: ResizeSettings = {
  width: TARGET_SIZE,
  height: TARGET_SIZE,
  fit: 'stretch',
  format: 'image/png',
  quality: 0.92,
  background: '#ffffff',
};

function ConverterPage() {
  const assetsRef = useRef<ImageAsset[]>([]);
  const [assets, setAssets] = useState<ImageAsset[]>([]);
  const [failed, setFailed] = useState<FailedImage[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [settings, setSettings] = useState<ResizeSettings>(DEFAULT_SETTINGS);
  const [outputs, setOutputs] = useState<ConverterOutput[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const selected = assets.find((asset) => asset.id === selectedId) ?? assets[0];

  useEffect(() => {
    assetsRef.current = assets;
  }, [assets]);

  useEffect(
    () => () => {
      assetsRef.current.forEach((asset) =>
        URL.revokeObjectURL(asset.objectUrl)
      );
    },
    []
  );

  async function handleFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (!files.length) return;

    const loaded: ImageAsset[] = [];
    const failures: FailedImage[] = [];

    for (const file of files) {
      try {
        loaded.push(await loadImageAsset(file));
      } catch (error) {
        failures.push({
          id: `${file.name}-${file.size}-${file.lastModified}`,
          name: file.name,
          error:
            error instanceof Error
              ? error.message
              : 'Could not read this image.',
        });
      }
    }

    setAssets((current) => {
      const next = [...current, ...loaded];
      if (!selectedId && next[0]) setSelectedId(next[0].id);
      return next;
    });
    setFailed((current) => [...current, ...failures]);
  }

  function chooseAsset(id: string) {
    setSelectedId(id);
  }

  function reset() {
    assets.forEach((asset) => URL.revokeObjectURL(asset.objectUrl));
    setAssets([]);
    setFailed([]);
    setSelectedId('');
    setOutputs([]);
  }

  async function convertAsset(asset: ImageAsset) {
    const output = await resizeImage(asset, settings);
    return {
      ...output,
      id: `${output.id}-${settings.format}-${asset.id}`,
      name: outputName(asset.name, settings.format),
      sourceName: asset.name,
    };
  }

  async function convertSelected() {
    if (!selected) return;
    setIsProcessing(true);
    try {
      const output = await convertAsset(selected);
      setOutputs((current) => [
        output,
        ...current.filter((item) => item.id !== output.id),
      ]);
    } finally {
      setIsProcessing(false);
    }
  }

  async function convertAll() {
    if (!assets.length) return;
    setIsProcessing(true);
    try {
      const next: ConverterOutput[] = [];
      for (const asset of assets) {
        next.push(await convertAsset(asset));
      }
      setOutputs(next);
    } finally {
      setIsProcessing(false);
    }
  }

  async function downloadZip() {
    if (!outputs.length) return;
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    outputs.forEach((output) => zip.file(output.name, output.blob));
    const blob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(blob, '300x300-image-converter-outputs.zip');
  }

  return (
    <div className="premium-bg min-h-screen text-slate-950">
      <ConverterHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-8 sm:px-6 lg:px-8">
        <section className="space-y-8">
          <div className="mx-auto flex max-w-4xl flex-col items-center pt-4 text-center">
            <p className="premium-eyebrow">Exact square output</p>
            <h1 className="mt-3 text-center text-4xl font-black tracking-normal text-slate-950 sm:text-5xl lg:text-6xl">
              300x300 image converter
            </h1>
            <p className="mx-auto mt-5 max-w-4xl text-center text-lg leading-8 text-slate-700">
              Use this 300x300 image converter when a profile, marketplace,
              document, thumbnail, or app workflow asks for an exact 300 x 300
              pixel file. The converter keeps the work local in your browser,
              and the 300x300 image converter gives you a live square preview
              while you choose whether the whole image should be preserved with
              padding, filled by a center crop, or resized exactly.
            </p>
            <div className="mx-auto mt-6 grid w-full max-w-4xl gap-3 sm:grid-cols-3">
              {[
                ['300 x 300', 'Locked pixel canvas'],
                ['Local', '300x300 image converter stays local'],
                ['Batch', 'ZIP-ready outputs'],
              ].map(([value, label]) => (
                <div key={value} className="premium-panel p-4">
                  <div className="text-2xl font-black text-slate-950">
                    {value}
                  </div>
                  <div className="mt-1 text-sm leading-5 text-slate-600">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {!assets.length ? (
            <SquareUploadCard failed={failed} onFiles={handleFiles} />
          ) : (
            <ConverterWorkspace
              assets={assets}
              failed={failed}
              selected={selected}
              selectedId={selected?.id ?? ''}
              settings={settings}
              outputs={outputs}
              isProcessing={isProcessing}
              onFiles={handleFiles}
              onReset={reset}
              onSelect={chooseAsset}
              onSettings={setSettings}
              onConvertSelected={convertSelected}
              onConvertAll={convertAll}
              onDownloadZip={downloadZip}
            />
          )}
        </section>

        <ConverterSeoContent />
      </main>
      <PublicFooter />
    </div>
  );
}

function ConverterHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/82 shadow-[0_10px_35px_rgba(15,23,42,0.05)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a
          href="/"
          className="flex items-center gap-2 font-semibold text-slate-950"
        >
          <span className="flex size-9 items-center justify-center rounded-lg bg-slate-950 text-white shadow-lg shadow-indigo-900/15">
            <Ruler className="size-5" aria-hidden="true" />
          </span>
          <span className="hidden sm:inline">Image Size Checker</span>
        </a>
        <nav className="flex items-center gap-1 rounded-full border border-slate-200 bg-white/70 p-1 text-xs font-semibold text-slate-600 sm:gap-2 sm:text-sm">
          <a
            className="rounded-full px-2 py-1.5 transition-colors hover:bg-indigo-50 hover:text-indigo-700 sm:px-3"
            href="/"
          >
            Checker
          </a>
          <a
            className="rounded-full px-2 py-1.5 transition-colors hover:bg-indigo-50 hover:text-indigo-700 sm:px-3"
            href="/resizer"
          >
            Resizer
          </a>
          <SizeToolsMenu active compact />
        </nav>
      </div>
    </header>
  );
}

function SquareUploadCard({
  failed,
  onFiles,
}: {
  failed: FailedImage[];
  onFiles: (files: FileList | File[]) => void;
}) {
  const [dragging, setDragging] = useState(false);

  return (
    <div
      className={cn(
        'premium-card p-2 transition-colors',
        dragging ? 'ring-2 ring-emerald-300' : ''
      )}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (event.dataTransfer.files) onFiles(event.dataTransfer.files);
      }}
    >
      <div className="rounded-md border border-dashed border-slate-300 bg-white/70 p-10 text-center">
        <div className="mx-auto flex max-w-2xl flex-col items-center">
          <div className="flex size-16 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 shadow-inner">
            <Upload className="size-8" aria-hidden="true" />
          </div>
          <h2 className="mt-6 text-2xl font-black">
            Upload images for 300 x 300 output
          </h2>
          <p className="mt-3 text-slate-600">
            Add JPG, PNG, WebP, GIF, SVG, or BMP files. This 300x300 image
            converter reads dimensions locally, creates a square preview, and
            exports exact 300 x 300 files without sending source images away.
            The 300x300 image converter is designed for quick square outputs,
            not a long manual setup.
          </p>
          <label className="premium-action mt-7 inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md px-5 text-sm font-bold transition-colors">
            <input
              className="sr-only"
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => {
                if (event.target.files) onFiles(event.target.files);
                event.currentTarget.value = '';
              }}
            />
            <Upload className="size-4" aria-hidden="true" />
            Choose images
          </label>
          {failed.length ? (
            <div className="mt-5 w-full rounded-md border border-rose-200 bg-rose-50 p-3 text-left text-sm text-rose-800">
              {failed.map((item) => (
                <p key={item.id}>
                  <span className="font-semibold">{item.name}</span>:{' '}
                  {item.error}
                </p>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ConverterWorkspace({
  assets,
  failed,
  selected,
  selectedId,
  settings,
  outputs,
  isProcessing,
  onFiles,
  onReset,
  onSelect,
  onSettings,
  onConvertSelected,
  onConvertAll,
  onDownloadZip,
}: {
  assets: ImageAsset[];
  failed: FailedImage[];
  selected: ImageAsset | undefined;
  selectedId: string;
  settings: ResizeSettings;
  outputs: ConverterOutput[];
  isProcessing: boolean;
  onFiles: (files: FileList | File[]) => void;
  onReset: () => void;
  onSelect: (id: string) => void;
  onSettings: (settings: ResizeSettings) => void;
  onConvertSelected: () => void;
  onConvertAll: () => void;
  onDownloadZip: () => void;
}) {
  return (
    <div className="min-w-0 space-y-6">
      <ImageStrip
        assets={assets}
        failed={failed}
        selectedId={selectedId}
        onFiles={onFiles}
        onReset={onReset}
        onSelect={onSelect}
      />

      <div className="grid min-w-0 gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <ConverterSettings settings={settings} onSettings={onSettings} />
        <Card className="premium-card min-w-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon
                className="size-5 text-emerald-700"
                aria-hidden="true"
              />
              300 x 300 preview
            </CardTitle>
            <CardDescription>
              {selected
                ? `${selected.name} -> ${resizeModeLabel(settings.fit)}`
                : 'Select an image to preview.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selected ? (
              <SquarePreview asset={selected} settings={settings} />
            ) : (
              <div className="flex h-80 items-center justify-center rounded-lg border border-dashed border-slate-300 text-sm text-slate-500">
                No image selected.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="premium-card min-w-0">
        <CardHeader>
          <CardTitle>Generate 300 x 300 files</CardTitle>
          <CardDescription>
            The 300x300 image converter output is locked to 300 x 300 px.
            Current mode: {resizeModeLabel(settings.fit)}.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button
            onClick={onConvertSelected}
            disabled={!selected || isProcessing}
            className="gap-2 !bg-emerald-400 font-bold !text-emerald-950 hover:!bg-emerald-300"
          >
            <Sparkles className="size-4" aria-hidden="true" />
            {isProcessing ? 'Processing...' : 'Convert selected'}
          </Button>
          <Button
            variant="outline"
            onClick={onConvertAll}
            disabled={!assets.length || isProcessing}
            className="gap-2"
          >
            <Archive className="size-4" aria-hidden="true" />
            Convert all
          </Button>
          <Button
            variant="outline"
            onClick={onDownloadZip}
            disabled={!outputs.length}
            className="gap-2"
          >
            <Download className="size-4" aria-hidden="true" />
            Download all ZIP
          </Button>
        </CardContent>
      </Card>

      <OutputTable outputs={outputs} />
    </div>
  );
}

function ImageStrip({
  assets,
  failed,
  selectedId,
  onFiles,
  onReset,
  onSelect,
}: {
  assets: ImageAsset[];
  failed: FailedImage[];
  selectedId: string;
  onFiles: (files: FileList | File[]) => void;
  onReset: () => void;
  onSelect: (id: string) => void;
}) {
  return (
    <Card className="premium-card min-w-0">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Images</CardTitle>
          <CardDescription>
            {assets.length} ready, {failed.length} skipped
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-emerald-200 bg-white px-3 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-50">
            <input
              className="sr-only"
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => {
                if (event.target.files) onFiles(event.target.files);
                event.currentTarget.value = '';
              }}
            />
            <Upload className="size-4" aria-hidden="true" />
            Add
          </label>
          <Button
            type="button"
            variant="outline"
            className="min-h-10 gap-2"
            onClick={onReset}
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
          {assets.map((asset) => (
            <button
              type="button"
              key={asset.id}
              onClick={() => onSelect(asset.id)}
              className={cn(
                'grid w-44 shrink-0 cursor-pointer grid-cols-[4rem_minmax(0,1fr)] items-center gap-3 rounded-md border p-2 text-left transition-colors',
                selectedId === asset.id
                  ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-emerald-300 hover:shadow-sm'
              )}
              aria-pressed={selectedId === asset.id}
            >
              <span className="flex size-16 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-950/[0.03]">
                <img
                  src={asset.objectUrl}
                  alt=""
                  className="max-h-full max-w-full object-contain"
                  draggable={false}
                />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-slate-950">
                  {asset.name}
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  {asset.width} x {asset.height}
                </span>
                <span className="block text-xs text-slate-400">
                  {formatBytes(asset.size)}
                </span>
              </span>
            </button>
          ))}
        </div>
        {failed.length ? (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {failed.map((item) => (
              <div
                key={item.id}
                className="w-56 shrink-0 rounded-md border border-rose-200 bg-rose-50 p-3"
              >
                <span className="block truncate text-sm font-medium text-rose-950">
                  {item.name}
                </span>
                <span className="mt-1 block text-xs text-rose-700">
                  {item.error}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ConverterSettings({
  settings,
  onSettings,
}: {
  settings: ResizeSettings;
  onSettings: (settings: ResizeSettings) => void;
}) {
  return (
    <Card className="premium-card min-w-0">
      <CardHeader>
        <CardTitle>Converter settings</CardTitle>
        <CardDescription>
          The 300x300 image converter canvas is fixed at 300 x 300 px. Choose
          how the source should fit the square.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="target-width">Width</Label>
            <Input id="target-width" value={TARGET_SIZE} readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="target-height">Height</Label>
            <Input id="target-height" value={TARGET_SIZE} readOnly />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fit">Square mode</Label>
          <select
            id="fit"
            value={settings.fit}
            onChange={(event) =>
              onSettings({
                ...settings,
                fit: event.target.value as ResizeSettings['fit'],
              })
            }
            className="border-input bg-background min-h-11 w-full rounded-md border px-3 text-sm"
          >
            <option value="stretch">Resize whole image exactly</option>
            <option value="contain">Fit whole image with padding</option>
            <option value="cover">Fill square by center crop</option>
          </select>
        </div>

        <div
          className={cn(
            'grid gap-3',
            settings.fit === 'contain' ? 'grid-cols-2' : 'grid-cols-1'
          )}
        >
          <div className="space-y-2">
            <Label htmlFor="format">Format</Label>
            <select
              id="format"
              value={settings.format}
              onChange={(event) =>
                onSettings({
                  ...settings,
                  format: event.target.value as ResizeSettings['format'],
                })
              }
              className="border-input bg-background min-h-11 w-full rounded-md border px-3 text-sm"
            >
              <option value="image/png">PNG</option>
              <option value="image/jpeg">JPG</option>
              <option value="image/webp">WebP</option>
            </select>
          </div>
          {settings.fit === 'contain' ? (
            <div className="space-y-2">
              <Label htmlFor="background">Padding color</Label>
              <Input
                id="background"
                type="color"
                value={settings.background}
                onChange={(event) =>
                  onSettings({ ...settings, background: event.target.value })
                }
              />
            </div>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="quality">
            Quality {Math.round(settings.quality * 100)}%
          </Label>
          <Input
            id="quality"
            type="range"
            min={40}
            max={100}
            value={Math.round(settings.quality * 100)}
            onChange={(event) =>
              onSettings({
                ...settings,
                quality: Number(event.target.value) / 100,
              })
            }
          />
          <p className="text-xs leading-5 text-slate-500">
            PNG ignores lossy quality. JPG and WebP use this value for smaller
            300 x 300 exports.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function SquarePreview({
  asset,
  settings,
}: {
  asset: ImageAsset;
  settings: ResizeSettings;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const previewSize = useMemo(
    () =>
      fitPreviewSize(
        settings.width,
        settings.height,
        viewport.width,
        viewport.height
      ),
    [settings.height, settings.width, viewport.height, viewport.width]
  );
  const hasPreviewSize = previewSize.width > 0 && previewSize.height > 0;

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;

    const updateViewport = () => {
      const box = element.getBoundingClientRect();
      const next = {
        width: Math.max(0, Math.floor(box.width)),
        height: Math.max(0, Math.floor(box.height)),
      };
      setViewport((current) =>
        current.width === next.width && current.height === next.height
          ? current
          : next
      );
    };

    updateViewport();
    const observer = new ResizeObserver(updateViewport);
    observer.observe(element);
    window.addEventListener('resize', updateViewport);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateViewport);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hasPreviewSize) return;

    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      if (cancelled) return;

      const pixelRatio = Math.max(1, window.devicePixelRatio || 1);
      const renderWidth = Math.max(
        1,
        Math.round(previewSize.width * pixelRatio)
      );
      const renderHeight = Math.max(
        1,
        Math.round(previewSize.height * pixelRatio)
      );
      canvas.width = renderWidth;
      canvas.height = renderHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, renderWidth, renderHeight);
      ctx.fillStyle = settings.background || '#ffffff';
      ctx.fillRect(0, 0, renderWidth, renderHeight);

      const plan = createResizeDrawPlan(
        asset,
        settings,
        renderWidth,
        renderHeight
      );
      ctx.imageSmoothingQuality = 'high';
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
    };
    image.src = asset.objectUrl;

    return () => {
      cancelled = true;
    };
  }, [
    asset,
    asset.objectUrl,
    hasPreviewSize,
    previewSize.height,
    previewSize.width,
    settings,
  ]);

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">
          Output: 300 x 300 px
        </span>
        <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">
          {resizeModeLabel(settings.fit)}
        </span>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
          Full preview
        </span>
      </div>
      <div className="relative h-80 min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-950/[0.03] p-5">
        <div
          ref={viewportRef}
          className="flex h-full w-full min-w-0 items-center justify-center"
        >
          <canvas
            ref={canvasRef}
            aria-label={`300 x 300 preview for ${asset.name}`}
            className={cn(
              'block shrink-0 rounded-sm shadow-[0_12px_40px_rgba(15,23,42,0.18)] ring-1 ring-slate-950/10',
              hasPreviewSize ? 'opacity-100' : 'opacity-0'
            )}
            style={{
              width: hasPreviewSize ? previewSize.width : 1,
              height: hasPreviewSize ? previewSize.height : 1,
              backgroundColor: settings.background,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function OutputTable({ outputs }: { outputs: ConverterOutput[] }) {
  return (
    <Card className="premium-card">
      <CardHeader>
        <CardTitle>Converted outputs</CardTitle>
        <CardDescription>
          {outputs.length
            ? 'Download exact 300 x 300 files individually or as one ZIP.'
            : 'No converted files yet.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source</TableHead>
              <TableHead>Output</TableHead>
              <TableHead>Dimensions</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Download</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {outputs.length ? (
              outputs.map((output) => (
                <TableRow key={output.id}>
                  <TableCell className="max-w-48 truncate">
                    {output.sourceName}
                  </TableCell>
                  <TableCell className="font-medium">{output.name}</TableCell>
                  <TableCell className="font-mono">
                    {output.width} x {output.height}
                  </TableCell>
                  <TableCell>{formatBytes(output.size)}</TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => downloadBlob(output.blob, output.name)}
                    >
                      <Download className="size-4" aria-hidden="true" />
                      Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-slate-500">
                  Upload images, choose a square mode, and let the 300x300 image
                  converter process the selected file or the whole batch.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ConverterSeoContent() {
  return (
    <section className="space-y-12 border-t border-slate-200/70 pt-12">
      <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div>
          <p className="premium-eyebrow">Purpose-built square resizing</p>
          <h2 className="mt-3 text-3xl font-black tracking-normal text-slate-950">
            A 300x300 image converter solves a specific publishing problem
          </h2>
        </div>
        <div className="space-y-4 text-base leading-8 text-slate-700">
          <p>
            A 300x300 image converter changes a source image into an exact 300 x
            300 pixel file. That sounds simple, but the useful part is the
            decision it forces: should the whole source stay visible, should the
            square be filled by cropping the center, or should the full image be
            stretched to the requested size? A practical 300x300 image converter
            should make those options clear before export, because the wrong
            mode can distort a logo, cut off a face, hide a product edge, or add
            padding where a platform expected a filled square. The 300x300 image
            converter makes that tradeoff visible before the file is saved.
          </p>
          <p>
            This 300x300 image converter is built for the exact cases where a
            general resizer feels slower than it should. Instead of entering
            width and height every time, the 300x300 image converter locks the
            canvas, keeps the preview square, and lets you focus on format,
            quality, background, and fit mode. The result is a repeatable
            300x300 image converter workflow for avatars, thumbnails, catalog
            images, profile photos, document inserts, app artwork, and any small
            square image that needs predictable pixel dimensions.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: 'Exact square canvas',
            text: 'Every output from this 300x300 image converter is locked to 300 x 300 pixels, so there is no accidental 299 px or 301 px export.',
          },
          {
            title: 'Whole-image option',
            text: 'The 300x300 image converter uses padding when diagrams, certificates, screenshots, product packs, or logos must remain fully visible inside the square.',
          },
          {
            title: 'Fill-square option',
            text: 'The 300x300 image converter can use center crop when a profile photo, channel avatar, listing thumbnail, or social image needs a clean edge-to-edge square.',
          },
          {
            title: 'Local batch export',
            text: 'The 300x300 image converter reads files in the browser, supports multiple images, and prepares individual downloads or a ZIP.',
          },
        ].map((item) => (
          <div key={item.title} className="premium-panel p-5">
            <h3 className="font-semibold text-slate-950">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg bg-slate-950 p-6 text-white shadow-xl shadow-slate-950/10">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold tracking-[0.18em] text-emerald-300 uppercase">
              Why exact 300 x 300 matters
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-normal">
              Small square images fail in surprisingly visible ways
            </h2>
          </div>
          <div className="space-y-4 text-sm leading-7 text-slate-300">
            <p>
              Many platforms accept images that are near the requested size,
              then quietly process them again. That extra processing can make a
              sharp source look soft, create unexpected cropping, or compress
              text until it becomes hard to read. A 300x300 image converter
              helps you deliver the final size yourself, so the uploaded file is
              already aligned with the placement and less likely to be changed
              by an automated platform pipeline. A 300x300 image converter
              reduces that risk by making the final square the file you export,
              not a surprise created after upload.
            </p>
            <p>
              Exact square output also matters when images are used in a grid.
              Mixed dimensions can make product cards uneven, profile lists
              jump, thumbnails appear inconsistent, or exported documents look
              unplanned. With a 300x300 image converter, each image starts from
              the same canvas size. You still control the visual treatment, but
              the final files share a dependable shape that works in repeated
              layouts.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="premium-eyebrow">Common scenarios</p>
          <h2 className="mt-3 text-3xl font-black tracking-normal text-slate-950">
            Where a 300x300 image converter is useful
          </h2>
          <p className="mt-4 text-base leading-8 text-slate-700">
            A 300x300 image converter is most valuable when the size is not a
            creative guess but a requirement from a platform, template, CMS,
            marketplace, admin panel, form, or internal workflow. The goal is
            not only to shrink or enlarge the source. The goal is to make a file
            that passes upload checks, looks intentional, and can be repeated
            across many assets without manual cleanup after every export.
          </p>
        </div>
        <div className="grid gap-3">
          {[
            [
              'Profile and account images',
              'Use the 300x300 image converter for team directories, creator profiles, support avatars, community accounts, or admin users where square images keep the interface aligned.',
            ],
            [
              'Marketplace and catalog thumbnails',
              'Convert supplier photos into consistent listing images, then choose padding for full product visibility or center crop for a tighter thumbnail.',
            ],
            [
              'Document and presentation assets',
              'Prepare small square images for reports, slides, PDF templates, certificates, and internal knowledge bases without guessing the final pixel size.',
            ],
            [
              'Icons, badges, and lightweight artwork',
              'The 300x300 image converter can create source squares for simple icons, app placeholders, course badges, email modules, and small web graphics.',
            ],
          ].map(([title, text]) => (
            <div
              key={title}
              className="grid gap-2 rounded-lg border border-slate-200 bg-white/80 p-4 sm:grid-cols-[12rem_1fr]"
            >
              <h3 className="font-semibold text-slate-950">{title}</h3>
              <p className="text-sm leading-6 text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white/75 p-6 ring-1 ring-slate-200">
        <p className="premium-eyebrow">How to use it well</p>
        <h2 className="mt-3 text-3xl font-black tracking-normal text-slate-950">
          The best 300x300 image converter workflow is deliberate
        </h2>
        <ol className="mt-6 grid gap-4 lg:grid-cols-4">
          {[
            {
              title: 'Upload once',
              text: 'Add one image or a batch. The 300x300 image converter keeps thumbnails visible so you can move between files without returning to the upload screen.',
            },
            {
              title: 'Choose the square mode',
              text: 'Use the 300x300 image converter to fit with padding for preservation, fill by center crop for a full thumbnail, or resize exactly when distortion is acceptable.',
            },
            {
              title: 'Check the preview',
              text: 'The 300x300 image converter shows the real output frame, so you can see padding, cropping, and background color before export.',
            },
            {
              title: 'Export the batch',
              text: 'The 300x300 image converter can process one selected image or the entire queue, then download each 300 x 300 file or collect every result in a ZIP archive.',
            },
          ].map((step, index) => (
            <li key={step.title} className="premium-panel p-5">
              <span className="flex size-9 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">
                {index + 1}
              </span>
              <h3 className="mt-4 font-semibold text-slate-950">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {step.text}
              </p>
            </li>
          ))}
        </ol>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="premium-card p-6">
          <h2 className="text-2xl font-bold tracking-normal text-slate-950">
            What ImageSizeChecker provides
          </h2>
          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600">
            <p>
              ImageSizeChecker connects checking and conversion. The home page
              helps you understand dimensions, aspect ratio, file size, and
              preset fit. The general resizer handles many Web/SEO, Social, and
              Print targets. This 300x300 image converter is the focused page
              for one common square requirement, using the same browser-based
              canvas resizing engine but removing unnecessary width and height
              decisions.
            </p>
            <p>
              The 300x300 image converter value is practical: it gives users a
              fast path from image inspection to a usable output. You can
              compare an original file, decide whether to preserve or fill the
              square, choose PNG, JPG, or WebP, adjust quality when it matters,
              and download clean files without creating an account. A 300x300
              image converter that works this way is especially helpful for
              teams that prepare many small assets and need consistent results.
            </p>
          </div>
        </div>
        <div className="premium-card p-6">
          <h2 className="text-2xl font-bold tracking-normal text-slate-950">
            How to choose between fit, crop, and stretch
          </h2>
          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600">
            <p>
              Fit whole image with padding is safest when every part of the
              source matters. It is the best default for screenshots, charts,
              documents, packaged products, and logos. Fill square by center
              crop is better when the square must be full, such as a portrait
              avatar or visual thumbnail. Resize whole image exactly should be
              used carefully because a non-square source can become visibly
              stretched. The 300x300 image converter still offers preservation
              with padding when missing edges would be worse than a stretched
              square.
            </p>
            <p>
              A 300x300 image converter should not hide that tradeoff. This
              300x300 image converter labels each mode plainly, updates the
              preview as settings change, and keeps the final canvas fixed. That
              makes the 300x300 image converter a real converter rather than a
              guessing step. You can see whether the output is acceptable before
              any download is created.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="premium-eyebrow">FAQ</p>
          <h2 className="mt-3 text-3xl font-black tracking-normal text-slate-950">
            300x300 image converter questions
          </h2>
        </div>
        <div className="grid gap-3">
          {[
            [
              'Does the 300x300 image converter upload my images?',
              'No. The 300x300 image converter reads the files in your browser and creates outputs locally. That is useful for private photos, unreleased products, client images, internal documents, and any file that should not be sent to a remote image service.',
            ],
            [
              'Will the output always be exactly 300 x 300 pixels?',
              'Yes. The 300x300 image converter canvas is locked, and every converted file is exported at 300 x 300 pixels. The mode only changes how the source image is placed inside that square.',
            ],
            [
              'Should I use padding or center crop?',
              'Use padding when the entire source must stay visible. Use center crop when the subject is central and the square should be filled edge to edge. The 300x300 image converter preview makes this decision visible before download.',
            ],
            [
              'Can I convert many images at once?',
              'Yes. The 300x300 image converter can process a batch with the same settings, convert all images, and download the results individually or in one ZIP. Batch export is helpful for catalogs, directories, staff profiles, and CMS media cleanup.',
            ],
            [
              'Will a 300x300 image converter improve a tiny source image?',
              'It can enlarge a small file to 300 x 300 pixels, but it cannot create detail that was not present in the original. For sharper output, start with a source image that is at least 300 pixels wide and 300 pixels tall.',
            ],
            [
              'When should I use the general Image Resizer instead?',
              'Use the general Image Resizer when you need other targets such as Open Graph images, story creatives, print sizes, or custom dimensions. Use this 300x300 image converter when the exact square size is the requirement.',
            ],
          ].map(([question, answer]) => (
            <div key={question} className="premium-panel p-5">
              <h3 className="font-semibold text-slate-950">{question}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function fitPreviewSize(
  width: number,
  height: number,
  viewportWidth: number,
  viewportHeight: number
) {
  const targetWidth = Math.max(1, Math.round(width));
  const targetHeight = Math.max(1, Math.round(height));
  const availableWidth = Math.max(0, viewportWidth);
  const availableHeight = Math.max(0, viewportHeight);
  if (availableWidth === 0 || availableHeight === 0) {
    return { width: 0, height: 0 };
  }

  const scale = Math.min(
    availableWidth / targetWidth,
    availableHeight / targetHeight
  );

  return {
    width: Math.max(1, targetWidth * scale),
    height: Math.max(1, targetHeight * scale),
  };
}

function resizeModeLabel(fit: ResizeSettings['fit']) {
  switch (fit) {
    case 'stretch':
      return 'Resize whole image exactly';
    case 'contain':
      return 'Fit whole image with padding';
    case 'cover':
      return 'Fill square by center crop';
    case 'manual':
      return 'Manual crop to fill';
  }
}

function outputName(sourceName: string, format: ResizeSettings['format']) {
  const base = sourceName.replace(/\.[^.]+$/, '') || 'image';
  return `${base}-300x300.${extensionForType(format)}`;
}

function extensionForType(format: ResizeSettings['format']) {
  switch (format) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/webp':
      return 'webp';
    case 'image/png':
      return 'png';
  }
}

export const Route = createFileRoute('/300x300-image-converter')({
  head: () => ({
    meta: [{ title: TITLE }, { name: 'description', content: DESCRIPTION }],
    links: [
      {
        rel: 'canonical',
        href: `${envConfigs.app_url}/300x300-image-converter`,
      },
    ],
  }),
  component: ConverterPage,
});
