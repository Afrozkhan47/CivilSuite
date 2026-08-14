import React from 'react';
import AppLayout from '@/components/AppLayout';
import ComingSoonContent from './ComingSoonContent';

interface PageProps {
  params: Promise<{ module: string }>;
}

export default async function ComingSoonPage({ params }: PageProps) {
  const { module } = await params;
  return (
    <AppLayout activeRoute={`/coming-soon/${module}`}>
      <ComingSoonContent moduleSlug={module} />
    </AppLayout>
  );
}

