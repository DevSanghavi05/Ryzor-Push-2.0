
'use client';

import { ImageGlowGrid } from './image-glow-grid';

export function Features() {
  return (
    <section className="container mx-auto py-12 px-4 md:px-6">
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-bold font-headline mb-12">
          The World's First AI-Powered File Storage Platform
        </h2>
      </div>

      <ImageGlowGrid />
      
    </section>
  );
}
