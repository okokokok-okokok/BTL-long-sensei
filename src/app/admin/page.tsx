import { redirect } from 'next/navigation';

export default function AdminPage({ searchParams }: { searchParams: { tab?: string } }) {
  const target = searchParams.tab === 'support' ? 'support' : searchParams.tab === 'ai' ? 'settings' : searchParams.tab === 'audit' ? 'audit' : 'accounts';
  redirect(`/admin/${target}`);
}
