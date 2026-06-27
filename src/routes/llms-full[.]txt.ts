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
          'The resizer page adds client-side resizing, manual crop values, output format controls, batch processing, individual downloads, and Download all ZIP export.'
        );

        lines.push('');

        return new Response(lines.join('\n'), {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      },
    },
  },
});
