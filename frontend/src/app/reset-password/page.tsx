import ResetPasswordForm from './ResetPasswordForm';

export const dynamic = 'force-dynamic';

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params?.token ?? '';

  return <ResetPasswordForm token={token} />;
}