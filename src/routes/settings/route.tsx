import { createFileRoute, Outlet } from '@tanstack/react-router';
import { Home, LayoutDashboard, Settings, User } from 'lucide-react';

import { envConfigs } from '@/config';
import { m } from '@/paraglide/messages.js';
import { AppLayout } from '@/components/app-layout';

export const Route = createFileRoute('/settings')({
  component: SettingsLayout,
});

function SettingsLayout() {
  const group = m['common.systems.settings']();
  const navItems = [
    {
      href: '/settings',
      label: m['settings.nav.overview'](),
      icon: LayoutDashboard,
      group,
    },
    {
      href: '/settings/profile',
      label: m['settings.nav.profile'](),
      icon: User,
      group,
    },
  ];

  const footerNavItems = [
    {
      href: '/admin/settings',
      label: m['admin.nav.settings'](),
      icon: Settings,
    },
    { href: '/', label: m['common.systems.home'](), icon: Home, newTab: true },
  ];

  return (
    <AppLayout
      navItems={navItems}
      footerNavItems={footerNavItems}
      brand={envConfigs.app_name}
      brandHref="/settings"
    >
      <Outlet />
    </AppLayout>
  );
}
