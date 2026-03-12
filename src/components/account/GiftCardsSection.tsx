import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Gift, Calendar, Check, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/hooks/useLanguage";
import { format, isAfter, parseISO } from "date-fns";

interface GiftCardsSectionProps {
  userId: string;
  userEmail?: string;
}

const getCopy = (lang: string) => {
  if (lang === "he") {
    return {
      title: "כרטיסי המתנה שלי",
      subtitle: "כרטיסים שקיבלת או שלחת",
      noGiftCards: "אין לך עדיין כרטיסי מתנה",
      noGiftCardsDesc: "כשתרכוש או תקבל כרטיס מתנה, הוא יופיע כאן.",
      buyGiftCard: "קנה כרטיס מתנה",
      sent: "נשלח",
      received: "התקבל",
      redeemed: "מומש",
      expired: "פג תוקף",
      pending: "ממתין",
      scheduled: "מתוזמן",
      validUntil: "בתוקף עד",
      from: "מאת",
      to: "אל",
      code: "קוד",
    };
  }
  return {
    title: "My Gift Cards",
    subtitle: "Cards you've received or sent",
    noGiftCards: "No gift cards yet",
    noGiftCardsDesc: "When you purchase or receive a gift card, it will appear here.",
    buyGiftCard: "Buy a Gift Card",
    sent: "Sent",
    received: "Received",
    redeemed: "Redeemed",
    expired: "Expired",
    pending: "Pending",
    scheduled: "Scheduled",
    validUntil: "Valid until",
    from: "From",
    to: "To",
    code: "Code",
  };
};

const getStatusBadge = (
  status: string,
  expiresAt: string,
  copy: ReturnType<typeof getCopy>
) => {
  const isExpired = isAfter(new Date(), parseISO(expiresAt));

  if (status === "redeemed") {
    return (
      <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">
        <Check className="h-3 w-3 mr-1" />
        {copy.redeemed}
      </Badge>
    );
  }
  if (isExpired) {
    return (
      <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100">
        <AlertCircle className="h-3 w-3 mr-1" />
        {copy.expired}
      </Badge>
    );
  }
  if (status === "scheduled") {
    return (
      <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100">
        <Clock className="h-3 w-3 mr-1" />
        {copy.scheduled}
      </Badge>
    );
  }
  if (status === "sent") {
    return (
      <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/10">
        <Gift className="h-3 w-3 mr-1" />
        {copy.sent}
      </Badge>
    );
  }
  return (
    <Badge variant="outline">
      <Clock className="h-3 w-3 mr-1" />
      {copy.pending}
    </Badge>
  );
};

const GiftCardsSection = ({ userId, userEmail }: GiftCardsSectionProps) => {
  const { lang } = useLanguage();
  const copy = getCopy(lang);

  // Fetch gift cards where user is sender or recipient
  const { data: giftCards, isLoading } = useQuery({
    queryKey: ["user-gift-cards", userEmail],
    queryFn: async () => {
      if (!userEmail) return [];
      const { data, error } = await supabase
        .from("gift_cards")
        .select("*")
        .or(`sender_email.eq.${userEmail},recipient_email.eq.${userEmail}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userEmail,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-40 mb-1" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const sentCards = giftCards?.filter((gc) => gc.sender_email === userEmail) || [];
  const receivedCards = giftCards?.filter((gc) => gc.recipient_email === userEmail) || [];

  if (!giftCards || giftCards.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Gift className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">{copy.noGiftCards}</h3>
        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">{copy.noGiftCardsDesc}</p>
        <a
          href="/gift-card"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          <Gift className="h-4 w-4" />
          {copy.buyGiftCard}
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Received Cards */}
      {receivedCards.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs">
              {receivedCards.length}
            </span>
            {copy.received}
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {receivedCards.map((card) => (
              <Card key={card.id} className="overflow-hidden rounded-2xl border-border/50">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                        <Gift className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">
                          {card.currency === "ILS" ? "₪" : "$"}
                          {card.amount}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {copy.from} {card.sender_name}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(card.status, card.expires_at, copy)}
                  </div>
                  {card.message && (
                    <p className="text-sm text-muted-foreground italic mb-3 line-clamp-2">
                      "{card.message}"
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/30">
                    <span className="font-mono bg-muted/50 px-2 py-1 rounded">
                      {copy.code}: {card.code}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {copy.validUntil} {format(parseISO(card.expires_at), "dd/MM/yy")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Sent Cards */}
      {sentCards.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs">
              {sentCards.length}
            </span>
            {copy.sent}
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {sentCards.map((card) => (
              <Card key={card.id} className="overflow-hidden rounded-2xl border-border/50 bg-muted/20">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <Gift className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold">
                          {card.currency === "ILS" ? "₪" : "$"}
                          {card.amount}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {copy.to} {card.recipient_name || card.recipient_email}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(card.status, card.expires_at, copy)}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/30">
                    <span className="font-mono bg-muted/50 px-2 py-1 rounded">
                      {copy.code}: {card.code}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(parseISO(card.created_at), "dd/MM/yy")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GiftCardsSection;
