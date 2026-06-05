// This file previously exported POST /api/orders.
// It has been superseded by POST /api/checkout which runs a Prisma transaction
// (order + items + stock decrement + cart clear) and marks the order PAID immediately.
//
// The GET /api/orders/mine endpoint is in app/api/orders/mine/route.ts.
