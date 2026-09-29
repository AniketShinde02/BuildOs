import React from 'react';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import DraftsClient from './DraftsClient';

export default function Dashboard() {
  return (
    <PageContainer title="BuildOS Content Queue" description="Manage AI drafts">
      <DraftsClient />
    </PageContainer>
  );
}
