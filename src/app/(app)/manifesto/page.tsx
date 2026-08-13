import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { ContentPage } from '@/components/ContentPage';

export const metadata = { title: 'Manifesto — Pulso' };

export default async function ManifestoPage() {
  await requireUser();
  const supabase = createClient();
  const { data } = await supabase
    .from('content_pages').select('title, body_md').eq('slug', 'manifesto').single();
  if (!data) notFound();
  return <ContentPage titulo={data.title} corpo={data.body_md} />;
}
