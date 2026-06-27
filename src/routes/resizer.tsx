import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { createFileRoute } from '@tanstack/react-router';
import {
  Archive,
  Crop,
  Download,
  ImageIcon,
  RefreshCw,
  Ruler,
  Upload,
} from 'lucide-react';

import { envConfigs } from '@/config';
import {
  createResizeDrawPlan,
  downloadBlob,
  formatBytes,
  loadImageAsset,
  PRESET_CATEGORIES,
  PRESETS,
  resizeImage,
  safeCrop,
  type CropRect,
  type FailedImage,
  type ImageAsset,
  type ResizeOutput,
  type ResizeSettings,
} from '@/lib/image-tools';
import {
  deleteResizeTransfer,
  loadResizeTransfer,
} from '@/lib/resize-transfer';
import { cn } from '@/lib/utils';
import { PublicFooter } from '@/components/public-footer';
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

const TITLE = 'Image Resizer - Resize Images Online';
const DESCRIPTION =
  'Image Resizer resizes, crops, and exports web, social, and print images locally with presets, custom dimensions, and ZIP downloads.';
const MIN_CROP_SOURCE_PX = 12;

type CropHandle = 'move' | 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

interface CropMetrics {
  left: number;
  top: number;
  width: number;
  height: number;
  scale: number;
}

interface DragSession {
  handle: CropHandle;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startCrop: CropRect;
  scale: number;
}

const CROP_HANDLES: {
  handle: Exclude<CropHandle, 'move'>;
  label: string;
  className: string;
}[] = [
  {
    handle: 'nw',
    label: 'Adjust crop from top left',
    className: 'left-1 top-1 cursor-nwse-resize',
  },
  {
    handle: 'n',
    label: 'Adjust crop from top edge',
    className: 'left-1/2 top-1 -translate-x-1/2 cursor-ns-resize',
  },
  {
    handle: 'ne',
    label: 'Adjust crop from top right',
    className: 'right-1 top-1 cursor-nesw-resize',
  },
  {
    handle: 'e',
    label: 'Adjust crop from right edge',
    className: 'right-1 top-1/2 -translate-y-1/2 cursor-ew-resize',
  },
  {
    handle: 'se',
    label: 'Adjust crop from bottom right',
    className: 'bottom-1 right-1 cursor-nwse-resize',
  },
  {
    handle: 's',
    label: 'Adjust crop from bottom edge',
    className: 'bottom-1 left-1/2 -translate-x-1/2 cursor-ns-resize',
  },
  {
    handle: 'sw',
    label: 'Adjust crop from bottom left',
    className: 'bottom-1 left-1 cursor-nesw-resize',
  },
  {
    handle: 'w',
    label: 'Adjust crop from left edge',
    className: 'left-1 top-1/2 -translate-y-1/2 cursor-ew-resize',
  },
];

function ResizerPage() {
  const transferHydrated = useRef(false);
  const [assets, setAssets] = useState<ImageAsset[]>([]);
  const [failed, setFailed] = useState<FailedImage[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [presetId, setPresetId] = useState(PRESETS[0].id);
  const [settings, setSettings] = useState<ResizeSettings>({
    width: PRESETS[0].width,
    height: PRESETS[0].height,
    fit: 'stretch',
    format: 'image/jpeg',
    quality: 0.9,
    background: '#ffffff',
  });
  const [crop, setCrop] = useState<CropRect>({
    x: 0,
    y: 0,
    width: 1,
    height: 1,
  });
  const [outputs, setOutputs] = useState<ResizeOutput[]>([]);
  const [transferNotice, setTransferNotice] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const selected = assets.find((asset) => asset.id === selectedId) ?? assets[0];
  const groupedPresets = useMemo(
    () =>
      PRESET_CATEGORIES.map((category) => ({
        category,
        presets: PRESETS.filter((preset) => preset.category === category),
      })),
    []
  );

  useEffect(() => {
    if (transferHydrated.current) return;
    const transferId = new URLSearchParams(window.location.search).get(
      'transfer'
    );
    if (!transferId) return;
    const confirmedTransferId = transferId;
    transferHydrated.current = true;

    async function hydrateTransfer() {
      try {
        const transfer = await loadResizeTransfer(confirmedTransferId);
        if (!transfer) {
          setTransferNotice(
            'The transferred image expired. Upload the image here to continue resizing.'
          );
          return;
        }

        const preset = PRESETS.find((item) => item.id === transfer.presetId);
        const targetWidth = preset?.width ?? transfer.width;
        const targetHeight = preset?.height ?? transfer.height;
        const loadedAsset = await loadImageAsset(transfer.file);

        setAssets((current) => {
          current.forEach((asset) => URL.revokeObjectURL(asset.objectUrl));
          return [loadedAsset];
        });
        setFailed([]);
        setOutputs([]);
        setSelectedId(loadedAsset.id);
        if (preset) setPresetId(preset.id);
        setSettings((current) => ({
          ...current,
          width: targetWidth,
          height: targetHeight,
          fit: transfer.fit,
        }));
        setCrop(centerCrop(loadedAsset, targetWidth, targetHeight));
        setTransferNotice(
          `Loaded ${loadedAsset.name} for ${preset?.name ?? 'the selected target'} (${targetWidth} x ${targetHeight}px).`
        );
        await deleteResizeTransfer(confirmedTransferId);
        window.history.replaceState(null, '', '/resizer');
      } catch (error) {
        console.error(error);
        setTransferNotice(
          'Could not load the transferred image. Upload the image here to continue resizing.'
        );
      }
    }

    void hydrateTransfer();
  }, []);

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
      const first = next[0];
      if (!selectedId && first) {
        setSelectedId(first.id);
        setCrop(centerCrop(first, settings.width, settings.height));
      }
      return next;
    });
    setFailed((current) => [...current, ...failures]);
  }

  function choosePreset(id: string) {
    const preset = PRESETS.find((item) => item.id === id);
    if (!preset) return;
    setPresetId(id);
    setSettings((current) => ({
      ...current,
      width: preset.width,
      height: preset.height,
    }));
    if (selected) setCrop(centerCrop(selected, preset.width, preset.height));
  }

  function chooseAsset(id: string) {
    const asset = assets.find((item) => item.id === id);
    setSelectedId(id);
    if (asset) setCrop(centerCrop(asset, settings.width, settings.height));
  }

  function enableManualCrop() {
    setSettings((current) => ({ ...current, fit: 'manual' }));
  }

  async function resizeSelected() {
    if (!selected) return;
    setIsProcessing(true);
    try {
      const output = await resizeImage(selected, {
        ...settings,
        crop: settings.fit === 'manual' ? safeCrop(selected, crop) : undefined,
      });
      setOutputs((current) => [
        output,
        ...current.filter((item) => item.id !== output.id),
      ]);
    } finally {
      setIsProcessing(false);
    }
  }

  async function resizeAll() {
    if (!assets.length) return;
    setIsProcessing(true);
    try {
      const next: ResizeOutput[] = [];
      for (const asset of assets) {
        const manualCrop =
          selected && asset.id === selected.id
            ? safeCrop(asset, crop)
            : centerCrop(asset, settings.width, settings.height);
        next.push(
          await resizeImage(asset, {
            ...settings,
            crop: settings.fit === 'manual' ? manualCrop : undefined,
          })
        );
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
    downloadBlob(blob, 'image-size-checker-resized-images.zip');
  }

  function reset() {
    assets.forEach((asset) => URL.revokeObjectURL(asset.objectUrl));
    setAssets([]);
    setFailed([]);
    setOutputs([]);
    setSelectedId('');
    setTransferNotice('');
  }

  return (
    <div className="premium-bg min-h-screen text-slate-950">
      <ResizerHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="premium-eyebrow">Preset-driven resizing</p>
          <h1 className="mt-3 text-4xl font-black tracking-normal text-slate-950 sm:text-5xl">
            Image Resizer
          </h1>
          <p className="mt-4 text-lg leading-8 text-slate-700">
            Use this Image Resizer to change the dimensions of the whole image
            for Web/SEO, Social, and Print presets. Optional crop modes are
            available when you intentionally need to reframe an image. Files
            stay in your browser, and batch outputs can be downloaded one by one
            or as a ZIP.
          </p>
        </div>

        {transferNotice ? (
          <div className="premium-panel border-emerald-200 bg-emerald-50/80 p-4 text-sm font-medium text-emerald-900">
            {transferNotice}
          </div>
        ) : null}

        {!assets.length ? (
          <UploadCard onFiles={handleFiles} />
        ) : (
          <>
            <ImageStrip
              assets={assets}
              failed={failed}
              selectedId={selected?.id ?? ''}
              onSelect={chooseAsset}
              onFiles={handleFiles}
              onReset={reset}
            />

            <div className="grid min-w-0 gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
              <aside className="min-w-0 space-y-6">
                <PresetControls
                  groupedPresets={groupedPresets}
                  presetId={presetId}
                  settings={settings}
                  onPreset={choosePreset}
                  onSettings={setSettings}
                />
              </aside>

              <section className="min-w-0 space-y-6">
                {selected ? (
                  <Card className="premium-card min-w-0">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ImageIcon
                          className="size-5 text-indigo-700"
                          aria-hidden="true"
                        />
                        Preview
                      </CardTitle>
                      <CardDescription>
                        {selected.name} · {selected.width} x {selected.height}px
                        · {resizeModeLabel(settings.fit)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent
                      className={cn(
                        'grid gap-6',
                        settings.fit === 'manual'
                          ? 'xl:grid-cols-[minmax(0,1fr)_320px]'
                          : ''
                      )}
                    >
                      {settings.fit === 'manual' ? (
                        <>
                          <div className="space-y-4">
                            <CropEditor
                              asset={selected}
                              crop={crop}
                              isManual={settings.fit === 'manual'}
                              onCrop={setCrop}
                              onEnableManual={enableManualCrop}
                            />
                            <ResizePreview
                              asset={selected}
                              settings={{
                                ...settings,
                                crop: safeCrop(selected, crop),
                              }}
                              label="Live output preview"
                            />
                          </div>
                          <ManualCropControls
                            asset={selected}
                            crop={crop}
                            isManual={settings.fit === 'manual'}
                            onCrop={setCrop}
                            onEnableManual={enableManualCrop}
                            onCenter={() =>
                              setCrop(
                                centerCrop(
                                  selected,
                                  settings.width,
                                  settings.height
                                )
                              )
                            }
                          />
                        </>
                      ) : (
                        <ResizePreview
                          asset={selected}
                          settings={settings}
                          label="Live output preview"
                        />
                      )}
                    </CardContent>
                  </Card>
                ) : null}

                <Card className="premium-card min-w-0">
                  <CardHeader>
                    <CardTitle>Generate resized images</CardTitle>
                    <CardDescription>
                      Current target: {settings.width} x {settings.height}px,{' '}
                      {resizeModeLabel(settings.fit)}.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-3">
                    <Button
                      onClick={resizeSelected}
                      disabled={!selected || isProcessing}
                      className="gap-2 !bg-emerald-400 font-bold !text-emerald-950 hover:!bg-emerald-300"
                    >
                      <Ruler className="size-4" aria-hidden="true" />
                      {isProcessing ? 'Processing...' : 'Resize selected'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={resizeAll}
                      disabled={!assets.length || isProcessing}
                      className="gap-2"
                    >
                      <Archive className="size-4" aria-hidden="true" />
                      Resize all
                    </Button>
                    <Button
                      variant="outline"
                      onClick={downloadZip}
                      disabled={!outputs.length}
                      className="gap-2"
                    >
                      <Download className="size-4" aria-hidden="true" />
                      Download all ZIP
                    </Button>
                  </CardContent>
                </Card>

                <OutputTable outputs={outputs} />
              </section>
            </div>
          </>
        )}

        <ResizerSeoContent />
      </main>
      <PublicFooter />
    </div>
  );
}

function ResizerHeader() {
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
          <span>Image Size Checker</span>
        </a>
        <nav className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 p-1 text-sm font-semibold text-slate-600">
          <a
            className="rounded-full px-3 py-1.5 transition-colors hover:bg-indigo-50 hover:text-indigo-700"
            href="/"
          >
            Checker
          </a>
          <a
            className="rounded-full bg-slate-950 px-3 py-1.5 text-white transition-colors hover:bg-slate-800"
            href="/resizer"
          >
            Resizer
          </a>
        </nav>
      </div>
    </header>
  );
}

function UploadCard({
  onFiles,
}: {
  onFiles: (files: FileList | File[]) => void;
}) {
  return (
    <div className="premium-card p-2">
      <div className="rounded-md border border-dashed border-slate-300 bg-white/60 p-10 text-center">
        <div className="mx-auto flex max-w-2xl flex-col items-center">
          <div className="flex size-16 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 shadow-inner">
            <Upload className="size-8" aria-hidden="true" />
          </div>
          <h2 className="mt-6 text-2xl font-black">Upload images to resize</h2>
          <p className="mt-3 text-slate-600">
            Batch resize whole images locally for presets, custom dimensions,
            optional crop-to-fill modes, and ZIP export.
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
        </div>
      </div>
    </div>
  );
}

function ImageStrip({
  assets,
  failed,
  selectedId,
  onSelect,
  onFiles,
  onReset,
}: {
  assets: ImageAsset[];
  failed: FailedImage[];
  selectedId: string;
  onSelect: (id: string) => void;
  onFiles: (files: FileList | File[]) => void;
  onReset: () => void;
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
          <label className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-indigo-200 bg-white px-3 text-sm font-semibold text-indigo-800 transition-colors hover:bg-indigo-50">
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
                  ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm'
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

function PresetControls({
  groupedPresets,
  presetId,
  settings,
  onPreset,
  onSettings,
}: {
  groupedPresets: { category: string; presets: typeof PRESETS }[];
  presetId: string;
  settings: ResizeSettings;
  onPreset: (id: string) => void;
  onSettings: (settings: ResizeSettings) => void;
}) {
  return (
    <Card className="premium-card min-w-0">
      <CardHeader>
        <CardTitle>Resize settings</CardTitle>
        <CardDescription>
          Choose a preset or enter a custom target.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="preset">Preset</Label>
          <select
            id="preset"
            value={presetId}
            onChange={(event) => onPreset(event.target.value)}
            className="border-input bg-background min-h-11 w-full rounded-md border px-3 text-sm"
          >
            {groupedPresets.map((group) => (
              <optgroup key={group.category} label={group.category}>
                {group.presets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name} - {preset.width} x {preset.height}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="width">Width</Label>
            <Input
              id="width"
              type="number"
              min={1}
              value={settings.width}
              onChange={(event) =>
                onSettings({
                  ...settings,
                  width: Number(event.target.value) || 1,
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="height">Height</Label>
            <Input
              id="height"
              type="number"
              min={1}
              value={settings.height}
              onChange={(event) =>
                onSettings({
                  ...settings,
                  height: Number(event.target.value) || 1,
                })
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fit">Resize mode</Label>
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
            <option value="stretch">Resize whole image</option>
            <option value="contain">Fit whole image with padding</option>
            <option value="cover">Crop center to fill</option>
            <option value="manual">Manual crop to fill</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
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
              <option value="image/jpeg">JPG</option>
              <option value="image/png">PNG</option>
              <option value="image/webp">WebP</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="background">Background</Label>
            <Input
              id="background"
              type="color"
              value={settings.background}
              onChange={(event) =>
                onSettings({ ...settings, background: event.target.value })
              }
            />
          </div>
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
        </div>
      </CardContent>
    </Card>
  );
}

function ResizePreview({
  asset,
  settings,
  label,
}: {
  asset: ImageAsset;
  settings: ResizeSettings;
  label: string;
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
  const cropX = settings.crop?.x ?? 0;
  const cropY = settings.crop?.y ?? 0;
  const cropWidth = settings.crop?.width ?? asset.width;
  const cropHeight = settings.crop?.height ?? asset.height;

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
    cropX,
    cropY,
    cropWidth,
    cropHeight,
  ]);

  return (
    <div className="min-w-0 space-y-3">
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">
          {label}
        </span>
        <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">
          {settings.width} x {settings.height}px
        </span>
        <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">
          {resizeModeLabel(settings.fit)}
        </span>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
          Fit to view
        </span>
      </div>
      <div className="relative h-96 min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-950/[0.03] p-5">
        <div
          ref={viewportRef}
          className="flex h-full w-full min-w-0 items-center justify-center"
        >
          <canvas
            ref={canvasRef}
            aria-label={`${label} for ${asset.name}`}
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

function CropEditor({
  asset,
  crop,
  isManual,
  onCrop,
  onEnableManual,
}: {
  asset: ImageAsset;
  crop: CropRect;
  isManual: boolean;
  onCrop: (crop: CropRect) => void;
  onEnableManual: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragSession | null>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const current = safeCrop(asset, crop);
  const metrics = useMemo(
    () => containedImageMetrics(asset, viewport.width, viewport.height),
    [asset, viewport.height, viewport.width]
  );

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateViewport = () => {
      const box = element.getBoundingClientRect();
      setViewport({
        width: Math.round(box.width),
        height: Math.round(box.height),
      });
    };

    updateViewport();
    const observer = new ResizeObserver(updateViewport);
    observer.observe(element);
    window.addEventListener('resize', updateViewport);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateViewport);
    };
  }, [asset.id]);

  const cropBox = cropToDisplayRect(current, metrics);
  const hasMetrics = metrics.scale > 0;

  function startDrag(
    event: ReactPointerEvent<HTMLElement>,
    handle: CropHandle
  ) {
    if (!hasMetrics || (event.pointerType === 'mouse' && event.button !== 0)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    onEnableManual();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      handle,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startCrop: current,
      scale: metrics.scale,
    };
  }

  function updateDrag(event: ReactPointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag) return;

    event.preventDefault();
    const deltaX = (event.clientX - drag.startClientX) / drag.scale;
    const deltaY = (event.clientY - drag.startClientY) / drag.scale;
    const next =
      drag.handle === 'move'
        ? moveCrop(asset, drag.startCrop, deltaX, deltaY)
        : resizeCropFromHandle(
            asset,
            drag.startCrop,
            drag.handle,
            deltaX,
            deltaY
          );
    onCrop(next);
  }

  function endDrag(event: ReactPointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag) return;

    if (event.currentTarget.hasPointerCapture(drag.pointerId)) {
      event.currentTarget.releasePointerCapture(drag.pointerId);
    }
    dragRef.current = null;
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? 10 : 1;
    const movements: Partial<Record<string, [number, number]>> = {
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
    };
    const movement = movements[event.key];
    if (!movement) return;

    event.preventDefault();
    onEnableManual();
    onCrop(moveCrop(asset, current, movement[0], movement[1]));
  }

  return (
    <div
      ref={containerRef}
      className="relative h-96 min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-950/[0.03] select-none"
    >
      {hasMetrics ? (
        <>
          <img
            src={asset.objectUrl}
            alt={`Preview of ${asset.name}`}
            draggable={false}
            className="absolute max-w-none"
            style={{
              left: metrics.left,
              top: metrics.top,
              width: metrics.width,
              height: metrics.height,
            }}
          />
          <div
            className="absolute touch-none"
            style={{
              left: metrics.left,
              top: metrics.top,
              width: metrics.width,
              height: metrics.height,
            }}
          >
            <CropMask metrics={metrics} cropBox={cropBox} />
            <div
              role="group"
              tabIndex={0}
              aria-label="Manual crop frame. Drag to move, drag handles to resize, or use arrow keys to move by pixels."
              data-crop-box="true"
              className={cn(
                'absolute cursor-move rounded-sm border-2 border-white shadow-[0_0_0_1px_rgba(16,185,129,0.95),0_16px_45px_rgba(15,23,42,0.28)] transition-shadow outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950/10',
                isManual
                  ? 'bg-emerald-300/5'
                  : 'bg-white/5 ring-2 ring-emerald-300/70'
              )}
              style={{
                left: cropBox.left,
                top: cropBox.top,
                width: cropBox.width,
                height: cropBox.height,
                touchAction: 'none',
              }}
              onPointerDown={(event) => startDrag(event, 'move')}
              onPointerMove={updateDrag}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onKeyDown={handleKeyDown}
            >
              <div className="pointer-events-none absolute inset-1 grid grid-cols-3 grid-rows-3">
                {Array.from({ length: 9 }).map((_, index) => (
                  <div
                    key={index}
                    className="border border-white/35 first:border-l-0 [&:nth-child(-n+3)]:border-t-0 [&:nth-child(3n)]:border-r-0 [&:nth-child(n+7)]:border-b-0"
                  />
                ))}
              </div>
              {CROP_HANDLES.map((item) => (
                <button
                  key={item.handle}
                  type="button"
                  aria-label={item.label}
                  data-crop-handle={item.handle}
                  className={cn(
                    'absolute z-10 size-4 rounded-full border-2 border-white bg-emerald-400 shadow-[0_4px_14px_rgba(15,23,42,0.35)] transition-transform outline-none hover:scale-110 focus-visible:ring-2 focus-visible:ring-emerald-200',
                    item.className
                  )}
                  style={{ touchAction: 'none' }}
                  onPointerDown={(event) => startDrag(event, item.handle)}
                  onPointerMove={updateDrag}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                />
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function CropMask({
  metrics,
  cropBox,
}: {
  metrics: CropMetrics;
  cropBox: { left: number; top: number; width: number; height: number };
}) {
  const right = cropBox.left + cropBox.width;
  const bottom = cropBox.top + cropBox.height;
  const maskClass = 'pointer-events-none absolute bg-slate-950/55';

  return (
    <>
      <div
        className={maskClass}
        style={{ left: 0, top: 0, width: metrics.width, height: cropBox.top }}
      />
      <div
        className={maskClass}
        style={{
          left: 0,
          top: cropBox.top,
          width: cropBox.left,
          height: cropBox.height,
        }}
      />
      <div
        className={maskClass}
        style={{
          left: right,
          top: cropBox.top,
          width: metrics.width - right,
          height: cropBox.height,
        }}
      />
      <div
        className={maskClass}
        style={{
          left: 0,
          top: bottom,
          width: metrics.width,
          height: metrics.height - bottom,
        }}
      />
    </>
  );
}

function ManualCropControls({
  asset,
  crop,
  isManual,
  onCrop,
  onEnableManual,
  onCenter,
}: {
  asset: ImageAsset;
  crop: CropRect;
  isManual: boolean;
  onCrop: (crop: CropRect) => void;
  onEnableManual: () => void;
  onCenter: () => void;
}) {
  const current = safeCrop(asset, crop);
  const fields: { key: keyof CropRect; label: string; max: number }[] = [
    { key: 'x', label: 'X', max: asset.width - 1 },
    { key: 'y', label: 'Y', max: asset.height - 1 },
    { key: 'width', label: 'Crop width', max: asset.width },
    { key: 'height', label: 'Crop height', max: asset.height },
  ];

  function activateManualCrop() {
    if (!isManual) onEnableManual();
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="flex items-center gap-2 font-semibold">
          <Crop className="size-4 text-indigo-700" aria-hidden="true" />
          Manual crop
        </h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Adjust the source rectangle in pixels. Editing these values switches
          the fit mode to Manual crop.
        </p>
      </div>
      {!isManual ? (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={activateManualCrop}
        >
          Use manual crop
        </Button>
      ) : null}
      <div className="grid gap-3">
        {fields.map((field) => (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={`crop-${field.key}`}>{field.label}</Label>
            <Input
              id={`crop-${field.key}`}
              type="number"
              min={field.key === 'width' || field.key === 'height' ? 1 : 0}
              max={field.max}
              value={current[field.key]}
              onFocus={activateManualCrop}
              onChange={(event) => {
                activateManualCrop();
                onCrop(
                  safeCrop(asset, {
                    ...current,
                    [field.key]: Number(event.target.value) || 0,
                  })
                );
              }}
            />
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          activateManualCrop();
          onCenter();
        }}
      >
        Center crop
      </Button>
    </div>
  );
}

function OutputTable({ outputs }: { outputs: ResizeOutput[] }) {
  return (
    <Card className="premium-card">
      <CardHeader>
        <CardTitle>Outputs</CardTitle>
        <CardDescription>
          {outputs.length
            ? 'Download resized files individually or as a ZIP.'
            : 'No outputs yet.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File</TableHead>
              <TableHead>Dimensions</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Download</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {outputs.length ? (
              outputs.map((output) => (
                <TableRow key={output.id}>
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
                <TableCell colSpan={4} className="text-slate-500">
                  Upload images and run a resize action to create outputs.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ResizerSeoContent() {
  return (
    <section className="space-y-10 border-t border-slate-200/70 pt-12">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <p className="premium-eyebrow">Resize with context</p>
          <h2 className="mt-3 text-3xl font-black tracking-normal text-slate-950">
            An Image Resizer should help you choose the right output, not only
            change pixels
          </h2>
        </div>
        <div className="space-y-4 text-base leading-8 text-slate-700">
          <p>
            An Image Resizer is a tool that changes the pixel dimensions of a
            picture so the same source file can fit a website, social post,
            product listing, email, document, or print layout. A useful Image
            Resizer does more than ask for width and height. It helps you decide
            whether the whole image should be resized exactly, fitted with
            padding to preserve the full source, converted to another format,
            compressed for a smaller file, or exported in several sizes at once.
            Cropping is available only when the publishing target requires
            reframing.
          </p>
          <p>
            People usually need an Image Resizer after they already know the
            file is close but not ready. A hero image may be too tall for a
            landing page, a link preview may need 1200 x 630 pixels, a story
            cover may need a vertical crop, or a product photo may need a square
            output. The default path resizes the whole file; crop-to-fill modes
            are separate choices for the moments when resizing alone would not
            create the required composition.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: 'Exact target sizes',
            text: 'Choose Web/SEO, Social, and Print presets when the output must match a known placement.',
          },
          {
            title: 'Batch work',
            text: 'Resize several images from the same folder, then download individual outputs or one ZIP.',
          },
          {
            title: 'Optional crop control',
            text: 'Resize the whole image by default, then switch to center crop or manual crop only when framing matters.',
          },
          {
            title: 'Local privacy',
            text: 'The Image Resizer reads image files in the browser, so draft assets and client visuals do not need a server upload.',
          },
        ].map((item) => (
          <div key={item.title} className="premium-panel p-5">
            <h3 className="font-semibold text-slate-950">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg bg-slate-950 p-6 text-white shadow-xl shadow-slate-950/10">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-sm font-semibold tracking-[0.18em] text-emerald-300 uppercase">
              Why it matters
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-normal">
              Resizing is a publishing decision
            </h2>
          </div>
          <div className="space-y-4 text-sm leading-7 text-slate-300">
            <p>
              A poor resize can make a sharp image look soft, distort a
              portrait, create padding where none was expected, or leave a file
              too heavy for a page. The Image Resizer is built around that
              practical risk. It shows the target dimensions, keeps the original
              preview visible, and makes crop-to-fill an explicit choice instead
              of the default resize behavior.
            </p>
            <p>
              That workflow matters for repeatable production. A marketer can
              make link previews and vertical story crops from one campaign
              visual when needed, but can also resize a whole image without
              reframing it. A store owner can create catalog images, a writer
              can prepare blog thumbnails and hero images, and a print buyer can
              export a size that matches a common print target before sending
              the file onward.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="premium-eyebrow">Common use cases</p>
          <h2 className="mt-3 text-3xl font-black tracking-normal text-slate-950">
            Where an Image Resizer saves time
          </h2>
          <p className="mt-4 text-base leading-8 text-slate-700">
            The most valuable resize jobs are not random. They come from places
            where a platform, layout, or printer expects a specific shape. This
            Image Resizer groups those needs into presets so you can move from
            diagnosis to output without searching a separate size chart.
          </p>
        </div>
        <div className="grid gap-3">
          {[
            [
              'Web and SEO images',
              'Prepare Open Graph cards, X cards, website heroes, blog thumbnails, and app icon sources with predictable dimensions.',
            ],
            [
              'Social campaigns',
              'Create square, portrait, vertical story, LinkedIn, and Pinterest outputs while keeping crop decisions separate from basic resizing.',
            ],
            [
              'Ecommerce and marketplaces',
              'Turn mixed supplier photos into consistent catalog images, clean product squares, and lighter upload-ready files.',
            ],
            [
              'Print and documents',
              'Export practical print targets such as 4 x 6, 8 x 10, A4, or US Letter when pixel dimensions must match a physical use.',
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
        <p className="premium-eyebrow">How to use it</p>
        <h2 className="mt-3 text-3xl font-black tracking-normal text-slate-950">
          A simple Image Resizer workflow
        </h2>
        <ol className="mt-6 grid gap-4 lg:grid-cols-4">
          {[
            {
              title: 'Upload images',
              text: 'Add one file or a batch. The original image preview, dimensions, file size, and selected target stay visible.',
            },
            {
              title: 'Choose the target',
              text: 'Pick a preset or type custom width and height. The Image Resizer uses the same preset language as the checker.',
            },
            {
              title: 'Select the resize mode',
              text: 'Resize the whole image for a direct dimension change, fit the whole image with padding, or choose a crop-to-fill mode only when reframing is intentional.',
            },
            {
              title: 'Export outputs',
              text: 'Resize the selected image or the whole batch, then download files individually or collect them in a ZIP.',
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
            What this Image Resizer provides
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            This Image Resizer provides preset resizing, custom dimensions,
            whole-image resize output, optional browser-side crop modes, format
            selection, quality control, batch processing, individual downloads,
            and ZIP export. It also supports checker-to-resizer handoff: when an
            image fails or nearly fits a target on the checker page, the
            original file and target dimensions can open here automatically.
            That makes the fix path explicit instead of forcing you to upload
            again and re-enter the size.
          </p>
        </div>
        <div className="premium-card p-6">
          <h2 className="text-2xl font-bold tracking-normal text-slate-950">
            What to decide before resizing
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Before using any Image Resizer, decide whether the final asset must
            match exact dimensions, preserve the whole source, protect a subject
            near the edge, reduce file weight, or keep transparency. Those goals
            lead to different settings. Resize whole image changes the full
            source to the target dimensions. Fit whole image keeps every pixel
            visible with padding. Crop center and manual crop intentionally take
            only part of the source when the final frame matters more than full
            preservation.
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="premium-eyebrow">FAQ</p>
          <h2 className="mt-3 text-3xl font-black tracking-normal text-slate-950">
            Image Resizer questions users actually ask
          </h2>
        </div>
        <div className="grid gap-3">
          {[
            [
              'Does this Image Resizer upload my files?',
              'No. The resizing workflow reads files in your browser and creates outputs locally. That is useful for drafts, private photos, client files, and product launches that should not be sent to a remote tool.',
            ],
            [
              'What is the difference between resize and crop?',
              'Resize changes the output dimensions of the whole image. Crop chooses only part of the original image. This Image Resizer keeps those choices separate so basic resizing does not silently crop the source.',
            ],
            [
              'When should I use contain instead of cover?',
              'Use contain when the whole image must remain visible, such as diagrams, screenshots, certificates, or product photos with important edges. Use cover when the target canvas must be filled exactly.',
            ],
            [
              'Can this Image Resizer handle batches?',
              'Yes. Add multiple images, choose the same target and settings, then resize the selected image or the full batch. ZIP download keeps folder cleanup faster.',
            ],
            [
              'Will resizing improve a small image?',
              'An Image Resizer can enlarge dimensions, but it cannot invent real detail. For sharp output, start with a source that has enough pixels for the destination.',
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

function containedImageMetrics(
  asset: Pick<ImageAsset, 'width' | 'height'>,
  containerWidth: number,
  containerHeight: number
): CropMetrics {
  if (!containerWidth || !containerHeight || !asset.width || !asset.height) {
    return { left: 0, top: 0, width: 0, height: 0, scale: 0 };
  }

  const scale = Math.min(
    containerWidth / asset.width,
    containerHeight / asset.height
  );
  const width = asset.width * scale;
  const height = asset.height * scale;
  return {
    left: (containerWidth - width) / 2,
    top: (containerHeight - height) / 2,
    width,
    height,
    scale,
  };
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

function cropToDisplayRect(crop: CropRect, metrics: CropMetrics) {
  return {
    left: crop.x * metrics.scale,
    top: crop.y * metrics.scale,
    width: crop.width * metrics.scale,
    height: crop.height * metrics.scale,
  };
}

function moveCrop(
  asset: Pick<ImageAsset, 'width' | 'height'>,
  crop: CropRect,
  deltaX: number,
  deltaY: number
): CropRect {
  const current = safeCrop(asset, crop);
  return {
    ...current,
    x: clampValue(
      Math.round(current.x + deltaX),
      0,
      asset.width - current.width
    ),
    y: clampValue(
      Math.round(current.y + deltaY),
      0,
      asset.height - current.height
    ),
  };
}

function resizeCropFromHandle(
  asset: Pick<ImageAsset, 'width' | 'height'>,
  crop: CropRect,
  handle: CropHandle,
  deltaX: number,
  deltaY: number
): CropRect {
  const current = safeCrop(asset, crop);
  const minSize = minCropSize(asset);
  let left = current.x;
  let top = current.y;
  let right = current.x + current.width;
  let bottom = current.y + current.height;

  if (handle.includes('w')) {
    left = clampValue(Math.round(left + deltaX), 0, right - minSize);
  }
  if (handle.includes('e')) {
    right = clampValue(Math.round(right + deltaX), left + minSize, asset.width);
  }
  if (handle.includes('n')) {
    top = clampValue(Math.round(top + deltaY), 0, bottom - minSize);
  }
  if (handle.includes('s')) {
    bottom = clampValue(
      Math.round(bottom + deltaY),
      top + minSize,
      asset.height
    );
  }

  return safeCrop(asset, {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  });
}

function minCropSize(asset: Pick<ImageAsset, 'width' | 'height'>) {
  return Math.max(1, Math.min(MIN_CROP_SOURCE_PX, asset.width, asset.height));
}

function resizeModeLabel(fit: ResizeSettings['fit']) {
  switch (fit) {
    case 'stretch':
      return 'Resize whole image';
    case 'contain':
      return 'Fit whole image with padding';
    case 'cover':
      return 'Crop center to fill';
    case 'manual':
      return 'Manual crop to fill';
  }
}

function centerCrop(
  asset: Pick<ImageAsset, 'width' | 'height'>,
  targetWidth: number,
  targetHeight: number
): CropRect {
  const targetRatio = targetWidth / targetHeight;
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

function clampValue(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export const Route = createFileRoute('/resizer')({
  head: () => ({
    meta: [{ title: TITLE }, { name: 'description', content: DESCRIPTION }],
    links: [{ rel: 'canonical', href: `${envConfigs.app_url}/resizer` }],
  }),
  component: ResizerPage,
});
