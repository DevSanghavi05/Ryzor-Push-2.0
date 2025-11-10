
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@/firebase';
import { Check, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { createCheckoutSession } from '../actions/stripe';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const tiers = [
  {
    name: 'Free',
    priceId: '',
    priceMonthly: 0,
    description: 'Get a feel for our platform.',
    features: [
      '5 document uploads',
      'Basic AI chat',
      'Google Drive sync (10 files)',
    ],
    cta: 'Get Started',
  },
  {
    name: 'Pro',
    priceId: 'price_1PgKqwB2Y3e4f5g6h7i8j9k0', // Replace with your actual Stripe Price ID
    priceMonthly: 15,
    description: 'For power users and professionals.',
    features: [
      'Unlimited document uploads',
      'Advanced AI chat & analysis',
      'Unlimited Google Drive sync',
      'Priority support',
      'Access to all integrations',
    ],
    cta: 'Upgrade to Pro',
  },
];

function PricingPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);

  const handleSubscribe = async (priceId: string) => {
    if (!user) {
      router.push('/login?redirect=/pricing');
      return;
    }
    if (!priceId) {
      router.push('/');
      return;
    }

    setLoadingPriceId(priceId);
    try {
      await createCheckoutSession(priceId, user.uid, user.email!);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Checkout Error',
        description: error.message,
      });
      setLoadingPriceId(null);
    }
  };

  return (
    <div className="relative min-h-screen w-full pt-16">
      <div className="bg-aurora"></div>
      <div className="relative container mx-auto py-12 px-4 md:px-6">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">Find the plan that's right for you</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Start for free and scale up as your needs grow. No hidden fees.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {tiers.map((tier) => (
            <Card key={tier.name} className={`flex flex-col ${tier.name === 'Pro' ? 'border-primary shadow-primary/20 shadow-lg' : ''}`}>
              <CardHeader>
                <CardTitle className="text-2xl font-bold font-headline">{tier.name}</CardTitle>
                <CardDescription>{tier.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="mb-6">
                  <span className="text-4xl font-extrabold">${tier.priceMonthly}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <ul className="space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => handleSubscribe(tier.priceId)}
                  className="w-full"
                  variant={tier.name === 'Pro' ? 'default' : 'outline'}
                  disabled={loadingPriceId === tier.priceId}
                >
                  {loadingPriceId === tier.priceId ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    tier.cta
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PricingPage;
