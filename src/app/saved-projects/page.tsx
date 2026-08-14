import React from 'react';
import AppLayout from '@/components/AppLayout';
import SavedProjectsContent from './components/SavedProjectsContent';

export default function SavedProjectsPage() {
  return (
    <AppLayout activeRoute="/saved-projects">
      <SavedProjectsContent />
    </AppLayout>
  );
}
