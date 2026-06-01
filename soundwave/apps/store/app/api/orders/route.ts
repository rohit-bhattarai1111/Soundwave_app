// This file previously exported POST /api/orders which created an order directly
// without real payment processing.
//
// It has been superseded by POST /api/checkout which:
//   - Runs a Prisma transaction (order + items + stock decrement + cart clear)
//   - Creates a Stripe PaymentIntent
//   - Returns a clientSecret for the browser to complete the payment
//
// The GET /api/orders/mine endpoint remains in app/api/orders/mine/route.ts.
// The webhook that marks orders PAID is at app/api/webhooks/stripe/route.ts.
