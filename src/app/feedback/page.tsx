
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import withAuth from '@/firebase/auth/with-auth';
import { MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';

function FeedbackPage() {
  const { toast } = useToast();
  const [feedback, setFeedback] = useState('');

  const handleFeedbackSubmit = () => {
    if(!feedback.trim()) {
        toast({ variant: 'destructive', title: 'Please enter your feedback.'});
        return;
    }
    toast({
        title: 'Feedback Submitted!',
        description: 'Thank you for helping us improve Ryzor.'
    });
    setFeedback('');
  }

  return (
    <div className="relative min-h-screen w-full pt-16">
      <div className="bg-aurora"></div>
      <div className="relative container mx-auto py-12 px-4 md:px-6">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto space-y-12"
        >
            <div className="text-center">
                <h1 className="text-4xl font-bold font-headline">Submit Feedback</h1>
                <p className="text-muted-foreground mt-2">Have an idea or found a bug? We'd love to hear from you.</p>
            </div>

             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><MessageSquare /> Your Feedback</CardTitle>
                    <CardDescription>Your input is invaluable in making Ryzor better for everyone.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Textarea 
                        placeholder="Tell us what you think..."
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        className="min-h-[150px]"
                    />
                     <div className="flex justify-end">
                         <Button onClick={handleFeedbackSubmit}>Submit Feedback</Button>
                    </div>
                </CardContent>
             </Card>

        </motion.div>
      </div>
    </div>
  );
}

export default withAuth(FeedbackPage);
