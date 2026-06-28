import { createFileRoute } from '@tanstack/react-router';
import { BarChart3, Settings, User } from 'lucide-react';

import { useSession } from '@/core/auth/client';
import { Link } from '@/core/i18n/navigation';
import { m } from '@/paraglide/messages.js';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

function DashboardPage() {
  const { data: session } = useSession();

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {m['settings.title']()}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {m['settings.welcome']({
            name: session?.user?.name || session?.user?.email || '',
          })}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="text-muted-foreground size-5" />
              <CardTitle>{m['settings.profile.title']()}</CardTitle>
            </div>
            <CardDescription>
              {m['settings.profile.description']()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Manage the signed-in administrator name and account email.
            </p>
            <Button render={<Link href="/settings/profile" />}>
              {m['settings.nav.profile']()}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="text-muted-foreground size-5" />
              <CardTitle>Analytics settings</CardTitle>
            </div>
            <CardDescription>
              Configure Google Analytics and other site settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Open Admin Settings, switch to the Analytics tab, and set
              `google_analytics_id`.
            </p>
            <Button render={<Link href="/admin/settings" />}>
              <Settings className="size-4" />
              {m['admin.nav.settings']()}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {m['settings.overview.getting_started']()}
          </CardTitle>
          <CardDescription>
            {m['settings.overview.getting_started_description']()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-border text-muted-foreground rounded-lg border border-dashed p-8 text-center">
            <p className="text-sm">
              The public Image Size Checker and Image Resizer pages remain
              unchanged. This settings area exists only for signed-in
              administration.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export const Route = createFileRoute('/settings/')({
  component: DashboardPage,
});
