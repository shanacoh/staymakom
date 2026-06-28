import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { identifyUser } from "@/lib/analytics";
import { useNavigate } from "react-router-dom";

type AppRole = "admin" | "hotel_admin" | "customer";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  roles: AppRole[];
  loading: boolean;
  isPasswordRecovery: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: any; data: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Detect password recovery flow
        if (event === "PASSWORD_RECOVERY") {
          setIsPasswordRecovery(true);
        }

        setSession(session);
        setUser(session?.user ?? null);
        
        // Provision and fetch user role after state is set (deferred)
        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id, session.user.email || "", session.user.user_metadata);
          }, 0);
        } else {
          setRole(null);
          setRoles([]);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session — onAuthStateChange handles role fetching
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const extractNames = (metadata: Record<string, unknown> | null | undefined) => {
    const fullName = ([metadata?.display_name, metadata?.full_name, metadata?.name]
      .map(v => (typeof v === "string" ? v.trim() : ""))
      .find(v => v !== "") ?? "");
    const spaceIdx = fullName.indexOf(" ");
    return {
      displayName: fullName,
      firstName: spaceIdx === -1 ? fullName : fullName.slice(0, spaceIdx),
      lastName: spaceIdx === -1 ? "" : fullName.slice(spaceIdx + 1),
    };
  };

  const provisionUser = async (userId: string, userEmail: string, userMetadata?: Record<string, unknown>) => {
    try {
      const { displayName, firstName, lastName } = extractNames(userMetadata);

      // 1. Ensure user_profiles exists
      const { data: existingProfile } = await supabase
        .from("user_profiles")
        .select("user_id, display_name")
        .eq("user_id", userId)
        .maybeSingle();

      if (!existingProfile) {
        await supabase.from("user_profiles").insert({
          user_id: userId,
          display_name: displayName || userEmail,
          phone: null,
          locale: "en",
          marketing_opt_in: false,
          gdpr_consent_at: null,
          tos_accepted_at: new Date().toISOString(),
        });
      } else if (displayName && !existingProfile.display_name?.trim()) {
        await supabase.from("user_profiles")
          .update({ display_name: displayName })
          .eq("user_id", userId);
      }

      // 2. Ensure user_roles exists
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      let userRole: AppRole = "customer";

      if (!existingRole) {
        // Create default customer role
        await supabase.from("user_roles").insert({
          user_id: userId,
          role: "customer",
        });
      } else {
        userRole = existingRole.role as AppRole;
      }

      // 3. Ensure customers exists (only for customer role)
      if (userRole === "customer") {
        const { data: existingCustomer } = await supabase
          .from("customers")
          .select("user_id")
          .eq("user_id", userId)
          .maybeSingle();

        if (!existingCustomer) {
          await supabase.from("customers").insert({
            user_id: userId,
            first_name: firstName,
            last_name: lastName,
            default_party_size: 2,
            address_country: null,
            notes: null,
          });
        }
      }

      return userRole;
    } catch (error) {
      // Error handled silently
      return "customer";
    }
  };

  const fetchUserRole = async (userId: string, userEmail: string, userMetadata?: Record<string, unknown>) => {
    // Fast path: check if role already exists (true for all returning users)
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (data) {
      const userRole = data.role as AppRole;
      setRole(userRole);
      setRoles([userRole]);

      if (userRole === "customer") {
        const { displayName, firstName, lastName } = extractNames(userMetadata);

        // Mettre à jour le display_name si vide (cas Google OAuth)
        if (displayName) {
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("display_name")
            .eq("user_id", userId)
            .maybeSingle();
          if (profile && !profile.display_name?.trim()) {
            await supabase.from("user_profiles")
              .update({ display_name: displayName })
              .eq("user_id", userId);
          }
        }

        // S'assurer que la fiche customers existe (le trigger DB ne la crée pas)
        const { data: existingCustomer } = await supabase
          .from("customers")
          .select("user_id")
          .eq("user_id", userId)
          .maybeSingle();

        if (!existingCustomer) {
          await supabase.from("customers").insert({
            user_id: userId,
            first_name: firstName,
            last_name: lastName,
            default_party_size: 2,
            address_country: null,
            notes: null,
          });
        }
      }

      const isMobile = window.innerWidth < 768;
      const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      identifyUser(userId, {
        language: navigator.language?.split("-")[0] || "en",
        deviceType: isMobile ? "mobile" : isTablet ? "tablet" : "desktop",
        isReturningUser: true,
      });
    } else {
      // Slow path: first-time user — provision all tables
      const provisionedRole = await provisionUser(userId, userEmail, userMetadata);
      setRole(provisionedRole);
      setRoles([provisionedRole]);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName || '',
          locale: 'en',
          role: 'customer', // Trigger will create user_role with customer role
        },
      },
    });
    return { error, data };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setRoles([]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        roles,
        loading,
        isPasswordRecovery,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
