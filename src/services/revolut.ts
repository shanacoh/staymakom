import { supabase } from "@/integrations/supabase/client";

interface CreateOrderParams {
  amount: number;
  currency: string;
  description?: string;
  customerEmail: string;
  customerName: string;
  bookingRef?: string;
}

interface CreateOrderResult {
  orderId: string;
  publicId: string;
  state: string;
  checkoutUrl?: string;
  environment: 'production' | 'dev';
}

interface OrderStatus {
  orderId: string;
  state: string;
  completedAt?: string;
  payments?: Array<{ id: string; state: string; payment_method?: { type: string } }>;
}

export async function createRevolutOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
  const { data, error } = await supabase.functions.invoke("revolut-payment", {
    body: { action: "create-order", ...params },
  });
  if (error) throw new Error(error.message || "Failed to create payment order");
  if (!data?.success) throw new Error(data?.error || "Failed to create payment order");
  return { ...data.data, environment: data.environment };
}

export async function getRevolutOrderStatus(orderId: string): Promise<OrderStatus> {
  const { data, error } = await supabase.functions.invoke("revolut-payment", {
    body: { action: "get-order", orderId },
  });
  if (error) throw new Error(error.message || "Failed to get order status");
  if (!data?.success) throw new Error(data?.error || "Failed to get order status");
  return data.data;
}

export async function refundRevolutOrder(orderId: string, amount?: number, currency?: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke("revolut-payment", {
    body: { action: "refund-order", orderId, amount, currency, description: "Booking failed - automatic refund" },
  });
  if (error) throw new Error(error.message || "Failed to refund order");
  if (!data?.success) throw new Error(data?.error || "Failed to refund order");
}
