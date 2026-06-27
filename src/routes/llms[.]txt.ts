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
