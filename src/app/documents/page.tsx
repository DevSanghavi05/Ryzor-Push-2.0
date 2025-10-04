import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import Link from 'next/link';

// Placeholder data for documents
const documents = [
  { id: '1', name: 'Q1_Financial_Report.pdf', uploaded: '2024-05-20' },
  { id: '2', name: 'Project_Alpha_Specification.pdf', uploaded: '2024-05-18' },
  { id: '3', name: 'Marketing_Strategy_2024.pdf', uploaded: '2024-05-15' },
  { id: '4', name: 'Employee_Handbook_v2.pdf', uploaded: '2024-05-10' },
];

export default function DocumentsPage() {
  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <Header />
      <main className="flex-1 p-4 pt-20 md:p-6 md:pt-24">
        <div className="container mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold font-headline mb-8">
            My Documents
          </h1>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {documents.map((doc) => (
              <Card key={doc.id} className="hover:border-primary hover:shadow-lg transition-all">
                <Link href={`/documents/${doc.id}`} className="block h-full">
                  <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                    <FileText className="w-8 h-8 text-primary" />
                    <CardTitle className="text-lg truncate">{doc.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Uploaded: {new Date(doc.uploaded).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
