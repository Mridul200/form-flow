/**
 * Payment abstraction.
 *
 * Everything in the app talks to `PaymentService` only. Swapping the mock for a
 * real Razorpay integration means adding a `RazorpayPaymentService` that
 * implements this interface and changing `getPaymentService()` — no other file
 * in the app needs to change.
 */

export interface PaymentIntent {
  amount: number;
  currency: "INR";
  description: string;
  customerName: string;
  customerEmail?: string;
}

export interface PaymentResult {
  paymentStatus: "paid" | "failed";
  paymentMethod: "mock" | "razorpay";
  transactionId: string;
  amount: number;
  paidAt: string;
}

export interface PaymentService {
  readonly providerName: string;
  readonly isMock: boolean;
  pay(intent: PaymentIntent): Promise<PaymentResult>;
}

class MockPaymentService implements PaymentService {
  readonly providerName = "Mock Gateway (test mode)";
  readonly isMock = true;

  async pay(intent: PaymentIntent): Promise<PaymentResult> {
    // Simulate gateway round-trip latency.
    await new Promise((resolve) => setTimeout(resolve, 1600));
    return {
      paymentStatus: "paid",
      paymentMethod: "mock",
      transactionId: `mock_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
      amount: intent.amount,
      paidAt: new Date().toISOString(),
    };
  }
}

const mockService = new MockPaymentService();

export function getPaymentService(): PaymentService {
  // Future scope: return a RazorpayPaymentService when live keys are configured.
  return mockService;
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
