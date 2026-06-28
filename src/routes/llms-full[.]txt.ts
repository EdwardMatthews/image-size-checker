import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';

const STATIC_PAGES: { path: string; title: string; description: string }[] = [
  {
    path: '',
    title: 'Image Size Checker',
    description:
      'Browser-based image dimension checks, preset comparison, print calculations, and batch upload summaries.',
  },
  {
    path: '/resizer',
    title: 'Image Size Checker Resizer',
    description:
      'Client-side batch image resizing, manual crop controls, preset exports, and ZIP downloads.',
  },
  {
    path: '/300x300-image-converter',
    title: '300x300 Image Converter',
    description:
      'Dedicated 300 x 300 image conversion with local processing, fit or crop modes, batch output, and ZIP download.',
  },
  {
    path: '/512x512-image-converter',
    title: '512x512 Image Converter',
    description:
      'Dedicated 512 x 512 image conversion with local processing for app icons, avatars, AI inputs, and square thumbnails.',
  },
  {
    path: '/64x64-image-converter',
    title: '64x64 Image Converter',
    description:
      'Dedicated 64 x 64 image conversion with local processing for favicons, small icons, sprites, and compact avatars.',
  },
  {
    path: '/privacy-policy',
    title: 'Privacy Policy',
    description: 'Privacy details for the browser-based image tools.',
  },
  {
    path: '/terms-of-service',
    title: 'Terms of Service',
    description: 'Terms for using the Image Size Checker tools.',
  },
];

export const Route = createFileRoute('/llms-full.txt')({
  server: {
    handlers: {
      GET: async () => {
        const { app_url, app_name, app_description } = envConfigs;

        const lines: string[] = [
          `# ${app_name}`,
          '',
          `> ${app_description}`,
          '',
          '## Pages',
          '',
          ...STATIC_PAGES.map(
            (p) => `- [${p.title}](${app_url}${p.path}): ${p.description}`
          ),
        ];

        lines.push(
          '',
          '## Tool Summary',
          '',
          'The home page is the primary Image Size Checker experience. It accepts local image files, reads width, height, file size, type, aspect ratio, and total pixels, then compares each uploaded image against Web/SEO, Social, and Print presets without requiring a preselected requirement.',
          '',
          'The resizer page adds client-side resizing, manual crop values, output format controls, batch processing, individual downloads, and Download all ZIP export.',
          '',
          'The 300x300 image converter page uses the same local canvas resize technology for a fixed 300 x 300 output, with preview, square fit modes, batch conversion, and ZIP download.',
          '',
          'The 512x512 image converter page uses the same local canvas resize technology for a fixed 512 x 512 output, with app icon, avatar, AI input, and thumbnail-focused copy.',
          '',
          'The 64x64 image converter page uses the same local canvas resize technology for a fixed 64 x 64 output, with favicon, small icon, sprite, and compact avatar-focused copy.'
        );

        lines.push('');

        return new Response(lines.join('\n'), {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      },
    },
  },
});
