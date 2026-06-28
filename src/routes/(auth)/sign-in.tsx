import { useEffect, useRef, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { signIn, useSession } from '@/core/auth/client';
import { Link, useRouter } from '@/core/i18n/navigation';
import { envConfigs } from '@/config';
import { m } from '@/paraglide/messages.js';
import { localizeHref } from '@/paraglide/runtime.js';
import { TextField } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

const signInSchema = z.object({
  email: z.string().email(m['common.sign.email_placeholder']()),
  password: z.string().min(1),
});

function SignInPage() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();
  // Set right before we navigate so the already-signed-in effect doesn't also fire.
  const navigatingRef = useRef(false);
  const [error, setError] = useState('');

  // redirect: client protocol, goes through auth-callback
  // callbackUrl: web page URL, goes directly after login
  const [redirectParam, setRedirectParam] = useState<string | null>(null);
  const [callbackUrl, setCallbackUrl] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setRedirectParam(params.get('redirect'));
    setCallbackUrl(params.get('callbackUrl'));
  }, []);

  // Already signed in (visited /sign-in directly, or a stale callbackUrl looped
  // back here) → go home. The auth pages never gate themselves, so this can't loop.
  useEffect(() => {
    if (sessionPending || navigatingRef.current) return;
    if (session?.user) {
      navigatingRef.current = true;
      router.push('/');
    }
  }, [sessionPending, session?.user, router]);

  // Allow only same-site relative paths, and never an auth page (would loop).
  const safeCallbackUrl =
    callbackUrl &&
    callbackUrl.startsWith('/') &&
    !callbackUrl.startsWith('//') &&
    !/^\/(sign-in|sign-up|verify-email)(\/|\?|$)/.test(callbackUrl)
      ? callbackUrl
      : null;

  const afterLoginUrl = redirectParam
    ? `/auth-callback?redirect=${encodeURIComponent(redirectParam)}`
    : safeCallbackUrl || '/settings';

  const form = useForm({
    defaultValues: { email: '', password: '' },
    validators: { onSubmit: signInSchema },
    onSubmit: async ({ value }) => {
      setError('');
      try {
        const result: any = await signIn.email({
          email: value.email,
          password: value.password,
        });
        if (result.error) {
          const status = result.error.status;
          const code = result.error.code;
          const msg = result.error.message || '';
          if (
            code === 'EMAIL_NOT_VERIFIED' ||
            (status === 403 && /not verified/i.test(msg))
          ) {
            setError('This admin account email is not verified.');
            return;
          }
          setError(msg || 'Sign in failed');
        } else {
          // Hard navigation so the destination reloads with a fresh session
          // cookie — a client push would let the guard read a stale (logged-out)
          // session store and bounce straight back to /sign-in.
          navigatingRef.current = true;
          window.location.assign(localizeHref(afterLoginUrl));
        }
      } catch (err: any) {
        setError(err.message || 'Sign in failed');
      }
    },
  });

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link href="/" className="self-center font-serif text-lg italic">
          {envConfigs.app_name}
        </Link>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">
              {m['common.sign.sign_in_title']()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                form.handleSubmit();
              }}
            >
              <FieldGroup>
                {error && (
                  <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
                    {error}
                  </div>
                )}
                <form.Field name="email">
                  {(field) => (
                    <TextField
                      field={field}
                      label={m['common.sign.email_title']()}
                      type="email"
                      required
                      placeholder={m['common.sign.email_placeholder']()}
                    />
                  )}
                </form.Field>
                <form.Field name="password">
                  {(field) => {
                    const err = field.state.meta.isTouched
                      ? (field.state.meta.errors?.[0] as any)
                      : null;
                    const errMsg =
                      err == null
                        ? null
                        : typeof err === 'string'
                          ? err
                          : err.message
                            ? String(err.message)
                            : String(err);
                    return (
                      <Field>
                        <FieldLabel htmlFor={field.name}>
                          {m['common.sign.password_title']()}
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="password"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          required
                          placeholder={m['common.sign.password_placeholder']()}
                          aria-invalid={errMsg ? true : undefined}
                        />
                        {errMsg && (
                          <p className="text-destructive text-sm">{errMsg}</p>
                        )}
                      </Field>
                    );
                  }}
                </form.Field>
                <Field>
                  <form.Subscribe selector={(s) => s.isSubmitting}>
                    {(isSubmitting) => (
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting
                          ? '...'
                          : m['common.sign.sign_in_title']()}
                      </Button>
                    )}
                  </form.Subscribe>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export const Route = createFileRoute('/(auth)/sign-in')({
  component: SignInPage,
});
