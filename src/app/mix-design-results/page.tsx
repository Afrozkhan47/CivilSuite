import React from 'react';
import AppLayout from '@/components/AppLayout';
import MixDesignResultsContent from './components/MixDesignResultsContent';

export default function MixDesignResultsPage() {
  return (
    <AppLayout activeRoute="/mix-design-results">
      <MixDesignResultsContent />
    </AppLayout>
  );
}