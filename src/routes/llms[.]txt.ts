import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';

const STATIC_PAGES: { path: string; title: string; description: string }[] = [
  {
    path: '',
    title: 'Image Size Checker',
    description:
      'Upload images, inspect dimensions, and compare Web/SEO, Social, and Print presets.',
  },
  {
    path: '/resizer',
    title: 'Image Size Checker Resizer',
    description: 'Resize, crop, and export batches of images in the browser.',
  },
  {
    path: '/300x300-image-converter',
    title: '300x300 Image Converter',
    description:
      'Convert images to exact 300 x 300 pixel squares locally with preview, fit modes, batch export, and ZIP download.',
  },
  {
    path: '/512x512-image-converter',
    title: '512x512 Image Converter',
    description:
      'Convert images to exact 512 x 512 pixel squares locally for app icons, avatars, AI inputs, and thumbnails.',
  },
  {
    path: '/64x64-image-converter',
    title: '64x64 Image Converter',
    description:
      'Convert images to exact 64 x 64 pixel squares locally for favicons, small icons, sprites, and compact avatars.',
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

export const Route = createFileRoute('/llms.txt')({
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

        lines.push('');

        return new Response(lines.join('\n'), {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      },
    },
  },
});
