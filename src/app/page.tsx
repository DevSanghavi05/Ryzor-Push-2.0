import { Header } from '@/components/layout/header';
import { UploadForm } from '@/components/upload/upload-form';

export default function Home() {
  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl text-center">
          <h1 className="text-4xl md:text-6xl font-bold font-headline bg-clip-text text-transparent bg-gradient-to-br from-foreground to-muted-foreground mb-4 animate-fade-in-down">
            Unlock Your Documents
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 animate-fade-in-up">
            Upload a PDF and let Ryzor AI answer your questions. Simple, fast, and intelligent.
          </p>
          <UploadForm />
        </div>
      </main>
    </div>
  );
}
