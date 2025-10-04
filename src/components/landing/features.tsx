
'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadCloud, MessageCircleQuestion, Zap } from 'lucide-react';

const features = [
  {
    icon: <UploadCloud className="w-8 h-8 text-primary" />,
    title: 'Upload PDFs Instantly',
    description: 'Quickly upload your documents and let our AI process them in moments.',
  },
  {
    icon: <MessageCircleQuestion className="w-8 h-8 text-primary" />,
    title: 'Ask Questions Naturally',
    description: 'Interact with your documents using plain English, just like talking to a person.',
  },
  {
    icon: <Zap className="w-8 h-8 text-primary" />,
    title: 'Get AI-Powered Answers',
    description: 'Receive intelligent, context-aware answers extracted from your files in seconds.',
  },
];

export function Features() {
  return (
    <section className="container mx-auto py-12 px-4 md:px-6">
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-bold font-headline mb-4">
          Built for researchers, students, and professionals — <br /> your AI-native document assistant.
        </h2>
      </div>

      <div className="grid gap-8 md:grid-cols-3 mt-12">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true }}
          >
            <motion.div
              className="h-full"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="h-full text-center hover:border-primary/50 hover:shadow-xl transition-all bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="font-headline">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
