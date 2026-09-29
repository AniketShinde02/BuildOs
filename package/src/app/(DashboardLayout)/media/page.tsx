import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import MediaLibraryClient from './MediaLibraryClient';

export default function MediaLibraryPage() {
  return (
    <PageContainer title="Media Library" description="Your AI generated images and posts">
      <MediaLibraryClient />
    </PageContainer>
  );
}
