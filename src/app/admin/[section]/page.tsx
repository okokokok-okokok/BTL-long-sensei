import { notFound } from 'next/navigation';
import { AdminWorkspace, type AdminSection } from '@/components/AdminWorkspace';

export default function AdminSectionPage({ params }: { params: { section: string } }) {
  if (!['accounts', 'support', 'audit'].includes(params.section)) notFound();
  return <AdminWorkspace key={params.section} section={params.section as AdminSection} />;
}
