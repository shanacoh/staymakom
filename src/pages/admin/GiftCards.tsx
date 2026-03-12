import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { format, isPast, differenceInDays } from "date-fns";
import { Eye, Gift, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type GiftCard = {
  id: string;
  code: string;
  amount: number | null;
  currency: string | null;
  recipient_name: string | null;
  recipient_email: string;
  sender_name: string;
  sender_email: string;
  delivery_type: string | null;
  delivery_date: string;
  status: string;
  created_at: string;
  expires_at: string;
  sent_at: string | null;
  message: string | null;
  language: string | null;
};

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  scheduled: "bg-blue-100 text-blue-700",
  sent: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  redeemed: "bg-purple-100 text-purple-700",
  expired: "bg-orange-100 text-orange-700",
};

export default function GiftCards() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: giftCards, isLoading } = useQuery({
    queryKey: ["admin-gift-cards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gift_cards")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as GiftCard[];
    },
  });

  const filteredGiftCards = giftCards?.filter((gc) => {
    const matchesSearch =
      searchQuery === "" ||
      gc.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gc.recipient_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gc.sender_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gc.recipient_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || gc.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number | null, currency: string | null) => {
    if (amount === null) return "-";
    const symbol = currency === "USD" ? "$" : "₪";
    return `${symbol}${amount.toLocaleString()}`;
  };

  const getExpirationStatus = (expiresAt: string) => {
    const expirationDate = new Date(expiresAt);
    const isExpired = isPast(expirationDate);
    const daysRemaining = differenceInDays(expirationDate, new Date());

    if (isExpired) {
      return { text: "Expired", className: "text-red-600 font-medium" };
    }
    if (daysRemaining <= 30) {
      return { text: `${daysRemaining} days left`, className: "text-orange-600" };
    }
    return { text: format(expirationDate, "MMM d, yyyy"), className: "" };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Gift className="h-6 w-6" />
            Gift Cards
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage all gift cards and track their status
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by code, email, or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="redeemed">Redeemed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-x-auto">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Code</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Delivery</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Valid Until</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Loading gift cards...
                </TableCell>
              </TableRow>
            ) : filteredGiftCards?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No gift cards found
                </TableCell>
              </TableRow>
            ) : (
              filteredGiftCards?.map((gc) => {
                const expStatus = getExpirationStatus(gc.expires_at);
                return (
                  <TableRow key={gc.id}>
                    <TableCell className="font-mono text-sm">{gc.code}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        {gc.recipient_name && (
                          <span className="font-medium">{gc.recipient_name}</span>
                        )}
                        <span className="text-sm text-muted-foreground">
                          {gc.recipient_email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(gc.amount, gc.currency)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="capitalize text-sm">
                          {gc.delivery_type || "now"}
                        </span>
                        {gc.delivery_type === "scheduled" && (
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(gc.delivery_date), "MMM d, yyyy")}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn(statusColors[gc.status] || "bg-gray-100")}
                      >
                        {gc.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(gc.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className={cn("text-sm", expStatus.className)}>
                      {expStatus.text}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/admin/gift-cards/${gc.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary Stats */}
      {giftCards && giftCards.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="text-2xl font-bold">{giftCards.length}</div>
            <div className="text-sm text-muted-foreground">Total Gift Cards</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-700">
              {giftCards.filter((gc) => gc.status === "sent").length}
            </div>
            <div className="text-sm text-green-600">Sent</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-700">
              {giftCards.filter((gc) => gc.status === "scheduled").length}
            </div>
            <div className="text-sm text-blue-600">Scheduled</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-700">
              {giftCards.filter((gc) => gc.status === "redeemed").length}
            </div>
            <div className="text-sm text-purple-600">Redeemed</div>
          </div>
        </div>
      )}
    </div>
  );
}
