import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { getConfig } from '@/modules/config/service';
import { getUserPlan } from '@/modules/invite-codes/service';
import { hasPermission } from '@/modules/rbac/service';
import { respData, respErr } from '@/lib/resp';

async function GET({ request }: { request: Request }) {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return respErr('Unauthorized');
    }

    const { plan, trialEndsAt } = await getUserPlan(session.user.id);

    // Preserve the restored template's membership metadata for admin/profile
    // consumers. Public registration routes are not restored in this project.
    const inviteRequired = (await getConfig('invite_code_required')) === 'true';
    const isAdmin = inviteRequired
      ? await hasPermission(session.user.id, 'admin.*')
      : false;
    const needsInvite = inviteRequired && plan === 'none' && !isAdmin;

    return respData({
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
      plan,
      trialEndsAt: trialEndsAt?.toISOString() || null,
      authorized: plan === 'trial' || plan === 'member',
      needsInvite,
    });
  } catch (error: any) {
    return respErr(error.message || 'Internal error');
  }
}

export const Route = createFileRoute('/api/user/info')({
  server: {
    handlers: { GET },
  },
});
