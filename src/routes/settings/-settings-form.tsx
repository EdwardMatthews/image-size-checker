import { useForm } from '@tanstack/react-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { z } from 'zod';

import { apiPatch } from '@/lib/api-client';
import { m } from '@/paraglide/messages.js';
import { TextField } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const profileSchema = z.object({
  name: z.string().min(1),
});

export function SettingsForm({
  name: initialName,
  email,
}: {
  name: string;
  email: string;
}) {
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (values: { name: string }) =>
      apiPatch('/api/user/profile', values),
    onSuccess: () => {
      toast.success(m['settings.profile.saved']());
      queryClient.invalidateQueries({ queryKey: ['user-info'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || m['settings.profile.save_failed']());
    },
  });

  const form = useForm({
    defaultValues: { name: initialName },
    validators: { onSubmit: profileSchema },
    onSubmit: async ({ value }) => {
      await saveMutation.mutateAsync({ name: value.name }).catch(() => {});
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-6 p-6"
    >
      <div>
        <h1 className="text-2xl font-bold">{m['settings.profile.title']()}</h1>
        <p className="text-muted-foreground">
          {m['settings.profile.description']()}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{m['settings.profile.profile']()}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pb-2">
          <div className="space-y-2">
            <form.Field name="name">
              {(field) => (
                <TextField
                  field={field}
                  label={m['settings.profile.name']()}
                  required
                />
              )}
            </form.Field>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{m['settings.profile.email']()}</Label>
            <Input id="email" value={email} disabled className="opacity-60" />
          </div>
        </CardContent>
        <CardFooter>
          <form.Subscribe selector={(s) => s.isSubmitting}>
            {(isSubmitting) => (
              <Button
                type="submit"
                disabled={isSubmitting || saveMutation.isPending}
              >
                {isSubmitting || saveMutation.isPending
                  ? m['settings.profile.saving']()
                  : m['settings.profile.save']()}
              </Button>
            )}
          </form.Subscribe>
        </CardFooter>
      </Card>
    </form>
  );
}
