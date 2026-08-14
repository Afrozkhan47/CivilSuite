import React from 'react';
import AppLayout from '@/components/AppLayout';
import ConcreteMixDesignContent from './components/ConcreteMixDesignContent';

export default function ConcreteMixDesignPage() {
  return (
    <AppLayout activeRoute="/concrete-mix-design">
      <ConcreteMixDesignContent />
    </AppLayout>
  );
}