# Stripe Integration Setup Guide

This guide will help you connect your Stripe account to the "Buy Me a Coffee" feature.

## Prerequisites

1. A Stripe account (sign up at https://stripe.com)
2. Access to your Vercel project dashboard

## Step 1: Get Your Stripe API Keys

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Go to **Developers** → **API keys**
3. You'll see two keys:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)

   ⚠️ **Important**: 
   - Use **test keys** (`pk_test_` and `sk_test_`) for development
   - Use **live keys** (`pk_live_` and `sk_live_`) for production
   - Never share your secret key publicly!

## Step 2: Add Environment Variables to Vercel

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (`theingredients`)
3. Go to **Settings** → **Environment Variables**
4. Add the following environment variable:

   **Name**: `STRIPE_SECRET_KEY`
   **Value**: Your Stripe Secret Key (e.g., `sk_test_...` or `sk_live_...`)
   **Environment**: 
   - ✅ Production
   - ✅ Preview
   - ✅ Development (optional, for local testing)

5. Click **Save**

## Step 3: Redeploy Your Application

After adding the environment variable:

1. Go to **Deployments** in your Vercel dashboard
2. Click the **⋯** menu on your latest deployment
3. Select **Redeploy**
4. Or push a new commit to trigger a new deployment

## Step 4: Test the Integration

### Testing with Test Mode

1. Use test mode keys (`sk_test_...`)
2. Visit your site's About page
3. Click one of the coffee buttons
4. Use Stripe's test card numbers:
   - **Card**: `4242 4242 4242 4242`
   - **Expiry**: Any future date (e.g., `12/34`)
   - **CVC**: Any 3 digits (e.g., `123`)
   - **ZIP**: Any 5 digits (e.g., `12345`)

### Testing with Live Mode

1. Switch to live keys (`sk_live_...`) in Vercel
2. Redeploy your application
3. Test with a real card (you can use a small amount like $0.50)

## How It Works

1. User clicks a coffee button on the About page
2. Frontend calls `/api/create-checkout-session` with the amount
3. Serverless function creates a Stripe Checkout session
4. User is redirected to Stripe's secure checkout page
5. After payment, user is redirected back to your site
6. Success message is displayed

## File Structure

```
api/
  └── create-checkout-session.ts  # Serverless function for creating checkout sessions

src/components/
  └── BuyMeACoffee.tsx            # React component with Stripe integration
```

## Troubleshooting

### "Stripe is not configured" Error

- Make sure `STRIPE_SECRET_KEY` is set in Vercel environment variables
- Ensure you've redeployed after adding the variable
- Check that the key starts with `sk_test_` or `sk_live_`

### Payment Not Processing

- Verify you're using the correct test/live keys
- Check Stripe Dashboard → **Payments** for transaction logs
- Review browser console for errors

### Checkout Page Not Loading

- Verify CSP headers allow Stripe domains (already configured in `vercel.json`)
- Check that `frame-src https://checkout.stripe.com` is in your CSP

## Security Notes

- ✅ Secret key is stored securely in Vercel environment variables
- ✅ Never commit secret keys to Git
- ✅ Use test keys for development
- ✅ All payments are processed securely by Stripe
- ✅ PCI compliance is handled by Stripe

## Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Checkout Guide](https://stripe.com/docs/payments/checkout)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

## Support

If you encounter issues:
1. Check the Stripe Dashboard for payment logs
2. Review Vercel function logs in the Vercel dashboard
3. Check browser console for client-side errors

