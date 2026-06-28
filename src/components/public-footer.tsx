import { SiteFooter, type FooterColumn } from '@/components/site-footer';

const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: 'Tools',
    links: [
      { label: 'Image Size Checker', href: '/' },
      { label: 'Image Resizer', href: '/resizer' },
      { label: '300x300 Image Converter', href: '/300x300-image-converter' },
      { label: '512x512 Image Converter', href: '/512x512-image-converter' },
      { label: '64x64 Image Converter', href: '/64x64-image-converter' },
    ],
  },
  {
    title: 'Workflows',
    links: [
      { label: 'Web and SEO images', href: '/#scenarios' },
      { label: 'Social image sizes', href: '/#scenarios' },
      { label: 'Print readiness', href: '/#decisions' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy-policy' },
      { label: 'Terms of Service', href: '/terms-of-service' },
    ],
  },
];

export function PublicFooter() {
  return (
    <SiteFooter
      tagline="Check, resize, and prepare images locally before you publish."
      columns={FOOTER_COLUMNS}
      copyright="ImageSizeChecker. All rights reserved."
    />
  );
}
