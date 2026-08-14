import React from 'react';
import AppLayout from '@/components/AppLayout';
import ReportsContent from './components/ReportsContent';

export const metadata = {
  title: 'Reports — CivilSuite',
  description: 'View and export concrete mix design reports',
};

export default function ReportsPage() {
  return (
    <AppLayout activeRoute="/reports">
      <ReportsContent />
    </AppLayout>
  );
}
