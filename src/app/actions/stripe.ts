
'use server';

import { stripe } from '@/lib/stripe';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export async function createCheckoutSession(priceId: string, userId: string, userEmail: string) {
  if (!userId) {
    throw new Error('User must be signed in to subscribe.');
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  try {
    // Check if customer exists in Stripe, if not, create one
    const customerList = await stripe.customers.list({ email: userEmail, limit: 1 });
    let customer;

    if (customerList.data.length > 0) {
      customer = customerList.data[0];
    } else {
      customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          firebaseUID: userId,
        },
      });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer: customer.id,
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      success_url: `${appUrl}/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing`,
    });

    if (checkoutSession.url) {
      redirect(checkoutSession.url);
    } else {
      throw new Error('Could not create Stripe checkout session.');
    }
  } catch (error) {
    console.error('Stripe Error:', error);
    throw new Error('Failed to create checkout session.');
  }
}
