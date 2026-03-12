import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, isPast, differenceInDays } from "date-fns";
import { ArrowLeft, Gift, Calendar, Mail, User, Clock, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type GiftCard = {
  id: string;
  code: string;
  amount: number | null;
  currency: string | null;
  type: string;
  recipient_name: string | null;
  recipient_email: string;
  sender_name: string;
  sender_email: string;
  message: string | null;
  delivery_type: string | null;
  delivery_date: string;
  status: string;
  language: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string;
  sent_at: string | null;
  redeemed_at: string | null;
};

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  scheduled: "bg-blue-100 text-blue-700",
  sent: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  redeemed: "bg-purple-100 text-purple-700",
  expired: "bg-orange-100 text-orange-700",
};

export default function GiftCardDetails() {
  const { id } = useParams<{ id: string }>();

  const { data: giftCard, isLoading } = useQuery({
    queryKey: ["admin-gift-card", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gift_cards")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as GiftCard;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading gift card details...</div>
      </div>
    );
  }

  if (!giftCard) {
    return (
      <div className="space-y-6">
        <Link to="/admin/gift-cards" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Gift Cards
        </Link>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Gift card not found</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number | null, currency: string | null) => {
    if (amount === null) return "-";
    const symbol = currency === "USD" ? "$" : "₪";
    return `${symbol}${amount.toLocaleString()}`;
  };

  const expirationDate = new Date(giftCard.expires_at);
  const isExpired = isPast(expirationDate);
  const daysRemaining = differenceInDays(expirationDate, new Date());

  const getExpirationDisplay = () => {
    if (isExpired) {
      return { text: "Expired", className: "text-red-600", subtext: `on ${format(expirationDate, "MMMM d, yyyy")}` };
    }
    if (daysRemaining <= 30) {
      return { text: `${daysRemaining} days remaining`, className: "text-orange-600", subtext: `Expires ${format(expirationDate, "MMMM d, yyyy")}` };
    }
    return { text: `${daysRemaining} days remaining`, className: "text-green-600", subtext: `Expires ${format(expirationDate, "MMMM d, yyyy")}` };
  };

  const expDisplay = getExpirationDisplay();

  return (
    <div className="space-y-6">
      <Link to="/admin/gift-cards" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Gift Cards
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Gift className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-mono">{giftCard.code}</h1>
            <p className="text-muted-foreground text-sm">
              Created {format(new Date(giftCard.created_at), "MMMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
        </div>
        <Badge
          variant="secondary"
          className={cn("text-sm px-3 py-1", statusColors[giftCard.status] || "bg-gray-100")}
        >
          {giftCard.status}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Amount & Validity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Gift Card Value
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-4xl font-bold">
              {formatCurrency(giftCard.amount, giftCard.currency)}
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Type</span>
                <span className="capitalize">{giftCard.type}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Currency</span>
                <span>{giftCard.currency || "ILS"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Language</span>
                <span className="uppercase">{giftCard.language || "en"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expiration */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Validity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className={cn("text-2xl font-bold", expDisplay.className)}>
                {expDisplay.text}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {expDisplay.subtext}
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Created</span>
                <span>{format(new Date(giftCard.created_at), "MMM d, yyyy")}</span>
              </div>
              {giftCard.sent_at && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sent</span>
                  <span>{format(new Date(giftCard.sent_at), "MMM d, yyyy")}</span>
                </div>
              )}
              {giftCard.redeemed_at && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Redeemed</span>
                  <span>{format(new Date(giftCard.redeemed_at), "MMM d, yyyy")}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recipient */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Recipient
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {giftCard.recipient_name && (
              <div>
                <div className="text-sm text-muted-foreground">Name</div>
                <div className="font-medium">{giftCard.recipient_name}</div>
              </div>
            )}
            <div>
              <div className="text-sm text-muted-foreground">Email</div>
              <div className="font-medium">{giftCard.recipient_email}</div>
            </div>
          </CardContent>
        </Card>

        {/* Sender */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Sender
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm text-muted-foreground">Name</div>
              <div className="font-medium">{giftCard.sender_name}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Email</div>
              <div className="font-medium">{giftCard.sender_email}</div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Delivery
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm text-muted-foreground">Type</div>
              <div className="font-medium capitalize">{giftCard.delivery_type || "Immediate"}</div>
            </div>
            {giftCard.delivery_type === "scheduled" && (
              <div>
                <div className="text-sm text-muted-foreground">Scheduled Date</div>
                <div className="font-medium">
                  {format(new Date(giftCard.delivery_date), "MMMM d, yyyy")}
                </div>
              </div>
            )}
            {giftCard.sent_at && (
              <div>
                <div className="text-sm text-muted-foreground">Sent At</div>
                <div className="font-medium">
                  {format(new Date(giftCard.sent_at), "MMMM d, yyyy 'at' h:mm a")}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message */}
        {giftCard.message && (
          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Personal Message</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 rounded-lg p-4 italic text-muted-foreground">
                "{giftCard.message}"
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
