import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_NATIONALITY = "FR";

export function useCustomerNationality(): string {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ["customer-nationality", user?.id ?? "anonymous"],
    queryFn: async () => {
      if (!user) return DEFAULT_NATIONALITY;
      const { data: customer } = await supabase
        .from("customers")
        .select("address_country")
        .eq("user_id", user.id)
        .maybeSingle();
      const country = customer?.address_country?.trim().toUpperCase();
      return country && /^[A-Z]{2}$/.test(country) ? country : DEFAULT_NATIONALITY;
    },
    staleTime: 1000 * 60 * 10,
    enabled: true,
  });

  return data ?? DEFAULT_NATIONALITY;
}
