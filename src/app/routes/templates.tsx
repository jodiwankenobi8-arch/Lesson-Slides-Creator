/**
 * Templates Page
 * Placeholder for template management
 */

import { PageLayout } from '../components/page-layout';
import { PageHeader } from '../components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { FileText } from 'lucide-react';

export default function Templates() {
  return (
    <PageLayout maxWidth="4xl">
      <PageHeader 
        title="Templates"
        description="Manage your slide templates"
      />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Template Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Template management features coming soon.
          </p>
        </CardContent>
      </Card>
    </PageLayout>
  );
}