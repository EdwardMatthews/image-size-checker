import { useMemo, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import {
  Archive,
  ArrowRight,
  CheckCircle2,
  FileImage,
  ImageIcon,
  Info,
  Layers3,
  Printer,
  RefreshCw,
  Ruler,
  ShieldCheck,
  Upload,
} from 'lucide-react';

import { envConfigs } from '@/config';
import {
  aspectRatio,
  comparePreset,
  formatBytes,
  formatDate,
  loadImageAsset,
  PRESET_CATEGORIES,
  PRESETS,
  printSizeRows,
  type FailedImage,
  type FitResult,
  type ImageAsset,
  type PresetCategory,
} from '@/lib/image-tools';
import { saveResizeTransfer } from '@/lib/resize-transfer';
import { cn } from '@/lib/utils';
import { PublicFooter } from '@/components/public-footer';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const TITLE = 'Image Size Checker - Resize Images Fast';
const DESCRIPTION =
  'Image Size Checker checks dimensions, compares presets, and resizes images for web, social, and print in your browser.';

function HomePage() {
  const [assets, setAssets] = useState<ImageAsset[]>([]);
  const [failed, setFailed] = useState<FailedImage[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const selected = assets.find((asset) => asset.id === selectedId) ?? assets[0];
  const hasResults = assets.length > 0;

  async function handleFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (!files.length) return;
    setIsLoading(true);
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
    setIsLoading(false);
  }

  function reset() {
    assets.forEach((asset) => URL.revokeObjectURL(asset.objectUrl));
    setAssets([]);
    setFailed([]);
    setSelectedId('');
  }

  return (
    <div className="premium-bg min-h-screen text-slate-950">
      <SiteHeader />
      <main>
        <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
            <div className="max-w-3xl">
              <p className="premium-eyebrow">Private browser tool</p>
              <h1 className="mt-4 text-4xl font-black tracking-normal text-slate-950 sm:text-5xl lg:text-6xl">
                Image Size Checker
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700">
                Upload images, inspect their dimensions, and see how each file
                fits Web/SEO, Social, and Print presets without choosing a
                confusing requirement first.
              </p>
              <div className="mt-7 flex flex-wrap gap-3 text-sm font-semibold">
                <span className="premium-kicker px-4 py-2">Batch upload</span>
                <span className="premium-kicker px-4 py-2">
                  Local processing
                </span>
                <span className="premium-kicker px-4 py-2">
                  Checker + resizer
                </span>
              </div>
              <div className="mt-8 grid max-w-xl grid-cols-3 divide-x divide-slate-200 rounded-lg border border-slate-200 bg-white/80 text-center shadow-sm">
                {[
                  ['15', 'Presets'],
                  ['4', 'PPI rows'],
                  ['0', 'Server uploads'],
                ].map(([value, label]) => (
                  <div key={label} className="px-4 py-4">
                    <div className="text-2xl font-black text-slate-950">
                      {value}
                    </div>
                    <div className="mt-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {!hasResults ? (
              <UploadPanel isLoading={isLoading} onFiles={handleFiles} />
            ) : (
              <div className="premium-card p-6">
                <p className="premium-eyebrow">Result mode</p>
                <h2 className="mt-3 text-2xl font-bold text-slate-950">
                  Your upload is ready to inspect
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  The upload surface is hidden now, so the selected image,
                  metadata, preset deltas, and next actions stay in focus.
                </p>
                <div className="mt-5 flex flex-wrap gap-3 text-sm">
                  <span className="rounded-md bg-indigo-50 px-3 py-2 font-semibold text-indigo-700">
                    {assets.length} checked
                  </span>
                  <span className="rounded-md bg-emerald-50 px-3 py-2 font-semibold text-emerald-700">
                    Private local read
                  </span>
                  <span className="rounded-md bg-amber-50 px-3 py-2 font-semibold text-amber-700">
                    All preset groups
                  </span>
                </div>
              </div>
            )}
          </div>

          {selected ? (
            <ResultsPanel
              assets={assets}
              failed={failed}
              selected={selected}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onReset={reset}
            />
          ) : null}
        </section>

        <SeoContent />
      </main>
      <PublicFooter />
    </div>
  );
}

function SiteHeader() {
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
        <nav className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white/70 p-1 text-sm font-semibold text-slate-600 sm:flex">
          <a
            className="rounded-full px-3 py-1.5 transition-colors hover:bg-indigo-50 hover:text-indigo-700"
            href="#results"
          >
            Results
          </a>
          <a
            className="rounded-full px-3 py-1.5 transition-colors hover:bg-indigo-50 hover:text-indigo-700"
            href="/resizer"
          >
            Image Resizer
          </a>
          <a
            className="rounded-full px-3 py-1.5 transition-colors hover:bg-indigo-50 hover:text-indigo-700"
            href="#scenarios"
          >
            Scenarios
          </a>
        </nav>
      </div>
    </header>
  );
}

function UploadPanel({
  isLoading,
  onFiles,
}: {
  isLoading: boolean;
  onFiles: (files: FileList | File[]) => void;
}) {
  const [dragging, setDragging] = useState(false);

  return (
    <div
      className={cn(
        'premium-card p-2 transition-colors',
        dragging && 'border-indigo-400'
      )}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        onFiles(event.dataTransfer.files);
      }}
    >
      <div
        className={cn(
          'rounded-md border border-dashed p-8 text-center transition-colors sm:p-12',
          dragging
            ? 'border-indigo-400 bg-indigo-50/70'
            : 'border-slate-300 bg-white/60'
        )}
      >
        <div className="mx-auto flex max-w-3xl flex-col items-center">
          <div className="flex size-16 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 shadow-inner">
            <Upload className="size-8" aria-hidden="true" />
          </div>
          <h2 className="mt-6 text-2xl font-black text-slate-950">
            Drop images here for an instant fit report
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Read JPG, PNG, WebP, GIF, SVG, or BMP files locally. The report
            compares each image against Web/SEO, Social, and Print presets
            without uploading image bytes to a server.
          </p>
          <label className="premium-action mt-7 inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md px-5 text-sm font-bold transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-emerald-500">
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
            {isLoading ? 'Reading images...' : 'Choose images'}
          </label>
          <div className="mt-6 grid gap-3 text-sm font-semibold text-slate-600 sm:grid-cols-3">
            <span className="rounded-md bg-white px-3 py-2 shadow-sm">
              Batch upload
            </span>
            <span className="rounded-md bg-white px-3 py-2 shadow-sm">
              Web/SEO, Social, Print
            </span>
            <span className="rounded-md bg-white px-3 py-2 shadow-sm">
              Private local analysis
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultsPanel({
  assets,
  failed,
  selected,
  selectedId,
  onSelect,
  onReset,
}: {
  assets: ImageAsset[];
  failed: FailedImage[];
  selected: ImageAsset;
  selectedId: string;
  onSelect: (id: string) => void;
  onReset: () => void;
}) {
  const fits = useMemo(
    () => PRESETS.map((preset) => comparePreset(selected, preset)),
    [selected]
  );
  const readyCount = fits.filter(
    (fit) => fit.status === 'ready' || fit.status === 'large-enough'
  ).length;
  const cropCount = fits.filter((fit) => fit.status === 'crop').length;
  const resizeCount = fits.filter(
    (fit) => fit.status === 'resize' || fit.status === 'too-small'
  ).length;

  return (
    <div id="results" className="space-y-6">
      <div className="premium-card flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="premium-eyebrow">Fit report</p>
          <h2 className="mt-2 text-3xl font-black text-slate-950">Results</h2>
          <p className="mt-1 text-sm text-slate-600">
            {assets.length} image{assets.length === 1 ? '' : 's'} checked,{' '}
            {failed.length} skipped, {readyCount} ready or large enough for the
            selected image.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          {[
            ['Ready', readyCount, 'text-emerald-700 bg-emerald-50'],
            ['Resize', resizeCount, 'text-amber-700 bg-amber-50'],
            ['Crop', cropCount, 'text-indigo-700 bg-indigo-50'],
          ].map(([label, value, tone]) => (
            <div
              key={label}
              className={cn('rounded-lg px-4 py-3 font-semibold', tone)}
            >
              <div className="text-xl font-black">{value}</div>
              <div className="text-xs tracking-wide uppercase">{label}</div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 gap-2 border-slate-300 bg-white/80"
            onClick={onReset}
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            New check
          </Button>
        </div>
      </div>

      <BatchSummary
        assets={assets}
        failed={failed}
        selectedId={selectedId || selected.id}
        onSelect={onSelect}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card className="premium-card">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>{selected.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-80 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-950/[0.03]">
              <img
                src={selected.objectUrl}
                alt={`Preview of ${selected.name}`}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          </CardContent>
        </Card>

        <ImageInfoCard asset={selected} />
      </div>

      <PrintTable asset={selected} />

      <div className="grid gap-4">
        {PRESET_CATEGORIES.map((category) => (
          <PresetSection
            key={category}
            category={category}
            asset={selected}
            fits={fits.filter((fit) => fit.preset.category === category)}
          />
        ))}
      </div>

      <div className="rounded-lg border border-indigo-200 bg-slate-950 p-5 text-white shadow-xl shadow-slate-950/10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold">Need to fix a preset gap?</h3>
            <p className="mt-1 text-sm leading-6 text-slate-300">
              Open the Image Resizer page to resize, crop, and download outputs
              individually or as a ZIP.
            </p>
          </div>
          <a
            href="/resizer"
            className={cn(
              buttonVariants(),
              'min-h-11 !bg-emerald-400 px-4 font-bold !text-emerald-950 hover:!bg-emerald-300'
            )}
          >
            Open Image Resizer
          </a>
        </div>
      </div>

      {resizeCount || cropCount ? (
        <p className="text-sm text-slate-600">
          Guidance summary: {resizeCount} presets need more pixels or resizing,
          and {cropCount} presets need framing or crop decisions.
        </p>
      ) : null}
    </div>
  );
}

function BatchSummary({
  assets,
  failed,
  selectedId,
  onSelect,
}: {
  assets: ImageAsset[];
  failed: FailedImage[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <Card className="premium-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Archive className="size-5 text-indigo-700" aria-hidden="true" />
          Batch summary
        </CardTitle>
        <CardDescription>
          Select an image to inspect its detailed fit report.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {assets.map((asset) => (
            <button
              type="button"
              key={asset.id}
              onClick={() => onSelect(asset.id)}
              className={cn(
                'cursor-pointer rounded-md border p-4 text-left transition-all duration-200',
                selectedId === asset.id
                  ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm'
              )}
            >
              <span className="block truncate font-medium text-slate-950">
                {asset.name}
              </span>
              <span className="mt-1 block text-sm text-slate-600">
                {asset.width} x {asset.height} px · {formatBytes(asset.size)}
              </span>
            </button>
          ))}
          {failed.map((item) => (
            <div
              key={item.id}
              className="rounded-md border border-rose-200 bg-rose-50 p-4"
            >
              <span className="block truncate font-medium text-rose-950">
                {item.name}
              </span>
              <span className="mt-1 block text-sm text-rose-700">
                {item.error}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ImageInfoCard({ asset }: { asset: ImageAsset }) {
  const rows = [
    ['File name', asset.name],
    ['Dimensions', `${asset.width} x ${asset.height} px`],
    ['File size', formatBytes(asset.size)],
    ['Format', asset.type],
    ['Aspect ratio', aspectRatio(asset.width, asset.height)],
    ['Total pixels', (asset.width * asset.height).toLocaleString()],
    ['Last modified', formatDate(asset.lastModified)],
  ];

  return (
    <Card className="premium-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="size-5 text-indigo-700" aria-hidden="true" />
          Image information
        </CardTitle>
        <CardDescription>
          Core metadata read locally from the selected file.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3">
          {rows.map(([label, value]) => (
            <div
              key={label}
              className="grid grid-cols-[130px_1fr] gap-4 text-sm"
            >
              <dt className="text-slate-500">{label}</dt>
              <dd className="font-mono break-words text-slate-900">{value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

function PrintTable({ asset }: { asset: ImageAsset }) {
  return (
    <Card className="premium-card">
      <CardHeader>
        <CardTitle>Print size calculations</CardTitle>
        <CardDescription>
          Convert pixels into practical print sizes at common PPI levels.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quality</TableHead>
              <TableHead>PPI</TableHead>
              <TableHead>Inches</TableHead>
              <TableHead>Centimeters</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {printSizeRows(asset).map((row) => (
              <TableRow
                key={row.ppi}
                className={row.ppi === 300 ? 'bg-emerald-50' : undefined}
              >
                <TableCell className="font-medium">{row.label}</TableCell>
                <TableCell>{row.ppi}</TableCell>
                <TableCell className="font-mono">{row.inches}</TableCell>
                <TableCell className="font-mono">{row.centimeters}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function PresetSection({
  category,
  asset,
  fits,
}: {
  category: PresetCategory;
  asset: ImageAsset;
  fits: FitResult[];
}) {
  const [pendingPresetId, setPendingPresetId] = useState('');

  async function openResize(fit: FitResult) {
    setPendingPresetId(fit.preset.id);
    try {
      const transferId = await saveResizeTransfer(asset, fit.preset);
      window.location.href = `/resizer?transfer=${encodeURIComponent(transferId)}`;
    } catch (error) {
      setPendingPresetId('');
      console.error(error);
      window.alert(
        'Could not prepare this image for the resizer. Please try again or upload it on the resizer page.'
      );
    }
  }

  return (
    <Card className="premium-card">
      <CardHeader>
        <CardTitle>{category}</CardTitle>
        <CardDescription>
          Actual image dimensions compared with common {category.toLowerCase()}{' '}
          targets.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Preset</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Delta</TableHead>
              <TableHead>Guidance</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fits.map((fit) => (
              <TableRow key={fit.preset.id}>
                <TableCell>
                  <div className="font-medium">{fit.preset.name}</div>
                  <div className="text-xs text-slate-500">
                    {fit.preset.note}
                  </div>
                </TableCell>
                <TableCell className="font-mono">
                  {fit.preset.width} x {fit.preset.height}
                </TableCell>
                <TableCell>
                  <StatusBadge fit={fit} />
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {fit.widthDelta >= 0 ? '+' : ''}
                  {fit.widthDelta}w / {fit.heightDelta >= 0 ? '+' : ''}
                  {fit.heightDelta}h
                </TableCell>
                <TableCell className="min-w-64 text-sm text-slate-600">
                  {fit.detail}
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2 whitespace-nowrap"
                    disabled={pendingPresetId === fit.preset.id}
                    onClick={() => void openResize(fit)}
                  >
                    <ArrowRight className="size-4" aria-hidden="true" />
                    {pendingPresetId === fit.preset.id
                      ? 'Opening...'
                      : 'Resize'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ fit }: { fit: FitResult }) {
  const styles: Record<FitResult['status'], string> = {
    ready: 'bg-emerald-100 text-emerald-800',
    'large-enough': 'bg-indigo-100 text-indigo-800',
    resize: 'bg-amber-100 text-amber-800',
    crop: 'bg-blue-100 text-blue-800',
    'too-small': 'bg-rose-100 text-rose-800',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
        styles[fit.status]
      )}
    >
      {fit.status === 'ready' || fit.status === 'large-enough' ? (
        <CheckCircle2 className="size-3.5" aria-hidden="true" />
      ) : (
        <ImageIcon className="size-3.5" aria-hidden="true" />
      )}
      {fit.label}
    </span>
  );
}

function SeoContent() {
  return (
    <section className="border-t border-slate-200/70 bg-white/85 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="max-w-xl">
            <p className="text-sm font-semibold tracking-[0.18em] text-cyan-700 uppercase">
              The problem behind the pixels
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-normal text-slate-950">
              A raw dimension number rarely tells you what to do next
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-700">
              People search for an Image Size Checker when the image is already
              in their hand and the deadline is close. A blog post needs a share
              card. A marketplace listing rejects a product photo. A designer
              needs to know if a banner can be cropped safely. A print file
              looks large on screen, but nobody is sure whether it has enough
              pixels for a clean 8 by 10 inch output.
            </p>
            <p className="mt-4 text-base leading-8 text-slate-700">
              The job is not just "show me 1600 x 900." The job is "tell me
              whether this file will work where I plan to use it." This Image
              Size Checker turns width, height, file size, format, aspect ratio,
              and total pixels into a publishing decision. It shows where the
              image already fits, where it can be resized down, where framing
              must change, and where the source file is simply too small.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                title: 'Ready to publish',
                text: 'The dimensions match the target and the image can move forward.',
              },
              {
                title: 'Resize down',
                text: 'The file has enough pixels, so export a smaller version without losing sharpness.',
              },
              {
                title: 'Crop needed',
                text: 'The aspect ratio does not match the preset, so framing matters before export.',
              },
              {
                title: 'Too small',
                text: 'The image does not contain enough pixels for a sharp print or large placement.',
              },
            ].map((item) => (
              <div key={item.title} className="premium-panel p-5">
                <h3 className="text-base font-semibold text-slate-950">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        id="scenarios"
        className="border-y border-slate-200/70 bg-slate-950 text-white"
      >
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-3 lg:px-8">
          {[
            {
              icon: FileImage,
              title: 'Organic traffic and link previews',
              illustration: '/illustrations/web-seo-preview.webp',
              alt: 'Image preview cards compared across website and search placements',
              text: 'Search traffic often meets your content through a preview image before anyone reads the page. Open Graph cards, X/Twitter previews, blog thumbnails, website heroes, and favicon sources all have different expectations. The Image Size Checker shows whether one file can cover those placements or whether a separate crop is safer.',
              examples: '1200 x 630, 1200 x 675, 1600 x 900, 512 x 512',
            },
            {
              icon: Layers3,
              title: 'Campaign assets across social channels',
              illustration: '/illustrations/social-crop-framing.webp',
              alt: 'One source image adapted into square portrait story and tall social crops',
              text: 'The same image may need to become a square post, a portrait feed creative, a vertical story, a LinkedIn share, and a tall pin. Social work fails when a subject is cut off or stretched to fit the wrong canvas. The Image Size Checker makes those conflicts visible early, before the file is uploaded to every platform.',
              examples: '1080 x 1080, 1080 x 1350, 1080 x 1920, 1000 x 1500',
            },
            {
              icon: Printer,
              title: 'Print decisions before money is spent',
              illustration: '/illustrations/print-ppi-output.webp',
              alt: 'Image file converted into print sizes and pixel quality checks',
              text: 'Print mistakes are expensive because they are noticed after export, upload, or order placement. A file that looks large on screen can still be too small for a sharp flyer, label, photo card, or poster. The Image Size Checker converts pixels into real-world print sizes at common PPI levels so the quality tradeoff is clear.',
              examples: '4 x 6 in, 5 x 7 in, 8 x 10 in, A4, US Letter',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-lg border border-white/12 bg-white/[0.06] p-6 shadow-2xl shadow-slate-950/20"
            >
              <div className="aspect-[16/10] overflow-hidden rounded-md border border-white/10 bg-white/90 shadow-xl shadow-slate-950/25">
                <img
                  src={item.illustration}
                  alt={item.alt}
                  className="h-full w-full object-contain"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="mt-5 flex size-10 items-center justify-center rounded-lg bg-emerald-400/15 text-emerald-300">
                <item.icon className="size-5" aria-hidden="true" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-white">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                {item.text}
              </p>
              <p className="mt-4 border-t border-white/10 pt-4 text-xs font-semibold tracking-wide text-emerald-200 uppercase">
                {item.examples}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="text-sm font-semibold tracking-[0.18em] text-cyan-700 uppercase">
              What the report gives you
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-normal text-slate-950">
              The answer is organized around publishing decisions
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-700">
              The Image Size Checker starts with upload because users often do
              not know the exact target yet. Instead of asking you to pick one
              requirement and then judging the image against that single choice,
              the report lays out the common Web/SEO, Social, and Print outcomes
              together. That makes the tool useful for exploration, cleanup,
              handoff, and final pre-publish checks.
            </p>
          </div>

          <ol className="grid gap-4">
            {[
              {
                title: 'See the facts first',
                text: 'Preview the selected file, then confirm dimensions, file size, format, aspect ratio, total pixels, and last modified date.',
              },
              {
                title: 'Compare against real destinations',
                text: 'Scan Web/SEO, Social, and Print presets side by side instead of keeping a separate size guide open.',
              },
              {
                title: 'Understand the gap',
                text: 'Each row explains the target, pixel delta, aspect-ratio issue, and whether resize, crop, or a better source is needed.',
              },
              {
                title: 'Move from diagnosis to correction',
                text: 'When a file needs adjustment, the resizer uses the same preset language for crop, format, quality, and ZIP export.',
              },
            ].map((step, index) => (
              <li
                key={step.title}
                className="premium-panel grid grid-cols-[3rem_1fr] gap-4 p-5"
              >
                <span className="flex size-10 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white shadow-lg shadow-slate-950/15">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-semibold text-slate-950">{step.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {step.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="bg-[#f7fbff]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold tracking-[0.18em] text-cyan-700 uppercase">
              Pain relief by design
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-normal text-slate-950">
              A valid image should not look broken because one requirement was
              chosen too early
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-700">
              A common checker pattern is to ask for a requirement before
              upload, then show a red failure state when the image does not
              match. That makes users wonder whether the image is bad or the
              requirement was wrong. This Image Size Checker avoids that trap by
              showing every preset after upload. A mismatch becomes a next
              action, not a verdict.
            </p>
          </div>

          <div className="premium-card mt-8 overflow-hidden">
            {[
              ['Ready', 'The image already matches the target dimensions.'],
              [
                'Large enough',
                'The image can be resized down to the target without inventing pixels.',
              ],
              [
                'Resize',
                'The image needs a new export size before it fits the target.',
              ],
              [
                'Crop',
                'The source ratio differs from the preset ratio, so framing should be adjusted.',
              ],
              [
                'Too small for sharp print',
                'The file needs more pixels for the selected print size and expected quality.',
              ],
            ].map(([label, text]) => (
              <div
                key={label}
                className="grid gap-2 border-b border-slate-200 p-5 last:border-b-0 sm:grid-cols-[14rem_1fr]"
              >
                <div className="font-semibold text-slate-950">{label}</div>
                <div className="text-sm leading-6 text-slate-600">{text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="premium-card p-6">
            <div className="flex items-center gap-3">
              <Archive className="size-5 text-indigo-700" aria-hidden="true" />
              <h2 className="text-xl font-semibold text-slate-950">
                Built for folders, not one-off curiosity
              </h2>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              A practical Image Size Checker needs batch support because real
              projects rarely involve one file. Campaigns, ecommerce uploads,
              editorial libraries, and print folders often contain dozens of
              images. Batch upload lets you compare several assets quickly while
              still viewing one detailed result at a time, so a messy folder can
              become a short list of publish-ready files and fix-needed files.
            </p>
          </div>

          <div className="premium-card p-6">
            <div className="flex items-center gap-3">
              <ShieldCheck
                className="size-5 text-emerald-700"
                aria-hidden="true"
              />
              <h2 className="text-xl font-semibold text-slate-950">
                Privacy belongs next to the upload button
              </h2>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              The Image Size Checker reads local files in your browser. It
              creates temporary preview URLs and computed measurements, then
              discards them when you reset the page or close the tab. No account
              is required, and image bytes are not sent to a remote API for the
              checking workflow. That matters for client creative, personal
              photos, product launches, internal decks, and drafts that should
              not leave the machine.
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-lg border border-slate-800 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-950/15">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="text-2xl font-semibold">
                The checker should lead naturally to the fix
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
                When an uploaded image needs adjustment, use the linked Image
                Resizer page. It shares the same preset language, so the target
                discovered in the Image Size Checker can become the target you
                resize toward. The resizer supports preset dimensions, custom
                dimensions, fit modes, manual crop controls, format selection,
                quality selection, individual downloads, and Download all ZIP
                for batches.
              </p>
            </div>
            <a
              className={cn(
                buttonVariants({ variant: 'secondary' }),
                'min-h-11 gap-2 !bg-emerald-400 font-bold !text-emerald-950 hover:!bg-emerald-300'
              )}
              href="/resizer"
            >
              Open Image Resizer
              <ArrowRight className="size-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>

      <div id="decisions" className="border-t border-slate-200/70 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold tracking-[0.18em] text-cyan-700 uppercase">
              Decisions users are trying to make
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-normal text-slate-950">
              The Image Size Checker is useful when the answer changes the next
              action
            </h2>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {[
              {
                q: 'Can this image become the page preview?',
                a: 'The Web/SEO rows show whether the file fits common preview and hero placements, or whether a crop will produce a cleaner first impression.',
              },
              {
                q: 'Will this social crop cut off the subject?',
                a: 'The Social rows expose ratio conflicts before upload, which is where story, portrait, square, and pin formats usually cause frustration.',
              },
              {
                q: 'Is this file large enough for print?',
                a: 'The print table translates pixels into inches and centimeters at multiple PPI levels, so the decision is based on output quality, not guesswork.',
              },
              {
                q: 'Which files in this batch need work?',
                a: 'The batch summary keeps multiple images in one run, while each detail report separates ready files from assets that need resize, crop, or a better source.',
              },
            ].map((item) => (
              <div key={item.q} className="premium-panel p-5">
                <h3 className="font-semibold text-slate-950">{item.q}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export const Route = createFileRoute('/')({
  head: () => {
    const canonical = `${envConfigs.app_url}/`;
    return {
      meta: [{ title: TITLE }, { name: 'description', content: DESCRIPTION }],
      links: [{ rel: 'canonical', href: canonical }],
    };
  },
  component: HomePage,
});
