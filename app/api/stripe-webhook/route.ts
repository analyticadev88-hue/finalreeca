// STRIPE DEPRECATED: This webhook is deprecated. Use DPO verification instead.
export async function POST() {
  return new Response('This endpoint is deprecated. Use DPO verification.', { status: 410 });
}
