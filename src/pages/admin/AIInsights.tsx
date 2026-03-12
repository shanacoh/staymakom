import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Brain, Search, Globe, TrendingUp, Trash2, MousePointer, ShoppingCart, ArrowRight, RotateCcw, Flame, Tag, Cloud, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format, subDays, startOfDay, isAfter } from "date-fns";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface AIQuery {
  id: string;
  query: string;
  lang: string | null;
  recommendation_count: number | null;
  created_at: string | null;
  user_agent: string | null;
  session_id: string | null;
  converted: boolean | null;
  conversion_experience_id: string | null;
}

interface AIEvent {
  id: string;
  search_id: string | null;
  session_id: string;
  event_type: string;
  experience_id: string | null;
  booking_id: string | null;
  position: number | null;
  created_at: string | null;
}

// Stop words for keyword extraction (EN + FR + HE common words)
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'in', 'for', 'to', 'with', 'and', 'or', 'of', 'is', 'it', 'on', 'at', 'be', 'this', 'that', 'by', 'from', 'as', 'are', 'was', 'were', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'i', 'me', 'my', 'we', 'you', 'your', 'he', 'she', 'they', 'their', 'what', 'which', 'who', 'whom', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'some', 'any', 'no', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'also', 'now', 'here', 'there', 'then',
  'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles', 'un', 'une', 'le', 'la', 'les', 'de', 'du', 'des', 'en', 'pour', 'avec', 'sur', 'dans', 'par', 'au', 'aux', 'ce', 'cette', 'ces', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses', 'notre', 'nos', 'votre', 'vos', 'leur', 'leurs', 'qui', 'que', 'quoi', 'dont', 'où', 'et', 'ou', 'mais', 'donc', 'car', 'ni', 'ne', 'pas', 'plus', 'moins', 'très', 'bien', 'aussi', 'comme', 'si', 'quand', 'comment', 'pourquoi', 'quel', 'quelle', 'quels', 'quelles', 'tout', 'tous', 'toute', 'toutes', 'autre', 'autres', 'même', 'mêmes', 'chaque', 'peu', 'beaucoup', 'trop', 'assez', 'encore', 'déjà', 'toujours', 'jamais', 'ici', 'là', 'y', 'est', 'sont', 'été', 'être', 'avoir', 'fait', 'faire', 'dit', 'dire', 'va', 'vont', 'aller', 'peut', 'peuvent', 'pouvoir', 'veut', 'vouloir', 'doit', 'devoir', 'faut', 'falloir',
  'אני', 'אתה', 'את', 'הוא', 'היא', 'אנחנו', 'אתם', 'אתן', 'הם', 'הן', 'של', 'על', 'עם', 'אל', 'מה', 'מי', 'איפה', 'מתי', 'איך', 'למה', 'כי', 'אבל', 'או', 'גם', 'רק', 'כל', 'הרבה', 'קצת', 'מאוד', 'טוב', 'יפה', 'חדש', 'גדול', 'קטן', 'יש', 'אין', 'היה', 'היתה', 'היו', 'יהיה', 'להיות', 'לעשות', 'ללכת', 'לבוא', 'לראות', 'לדעת', 'לתת', 'לקחת', 'ב', 'ל', 'כ', 'ו', 'ה', 'זה', 'זאת', 'אלה', 'אלו',
  'looking', 'want', 'need', 'search', 'find', 'cherche', 'veux', 'besoin', 'recherche', 'trouver', 'experience', 'expérience', 'trip', 'voyage', 'stay', 'séjour', 'hotel', 'hôtel'
]);

// Category detection keywords
const CATEGORY_KEYWORDS: Record<string, { label: string; keywords: string[] }> = {
  romantic: {
    label: 'Romantic',
    keywords: ['romantic', 'romantique', 'couple', 'love', 'amour', 'amoureux', 'honeymoon', 'lune de miel', 'valentine', 'saint-valentin', 'anniversary', 'anniversaire', 'רומנטי', 'זוג', 'אהבה']
  },
  nature: {
    label: 'Nature & Desert',
    keywords: ['nature', 'desert', 'désert', 'outdoor', 'calme', 'calm', 'quiet', 'tranquille', 'landscape', 'paysage', 'star', 'étoile', 'stargazing', 'מדבר', 'טבע', 'שקט', 'כוכבים']
  },
  active: {
    label: 'Active & Adventure',
    keywords: ['active', 'sport', 'adventure', 'aventure', 'hiking', 'randonnée', 'trek', 'climbing', 'escalade', 'bike', 'vélo', 'אקטיבי', 'ספורט', 'הרפתקה', 'טיול']
  },
  family: {
    label: 'Family',
    keywords: ['family', 'famille', 'kids', 'enfants', 'children', 'child', 'enfant', 'משפחה', 'ילדים', 'kid']
  },
  relaxation: {
    label: 'Spa & Wellness',
    keywords: ['spa', 'relax', 'relaxation', 'wellness', 'détente', 'massage', 'zen', 'retreat', 'retraite', 'ספא', 'מנוחה', 'רוגע']
  },
  luxury: {
    label: 'Luxury',
    keywords: ['luxury', 'luxe', 'premium', 'exclusive', 'exclusif', 'high-end', 'haut de gamme', 'פאר', 'יוקרה', 'vip']
  },
  gastronomy: {
    label: 'Food & Wine',
    keywords: ['food', 'cuisine', 'gastronomie', 'gastronomy', 'wine', 'vin', 'diner', 'dinner', 'restaurant', 'chef', 'taste', 'goût', 'אוכל', 'יין', 'מסעדה']
  }
};

const AIInsights = () => {
  const { data: queries, isLoading: queriesLoading, refetch: refetchQueries } = useQuery({
    queryKey: ["ai-search-queries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_search_queries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;
      return data as AIQuery[];
    },
  });

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ["ai-search-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_search_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) throw error;
      return data as AIEvent[];
    },
  });

  const handleClearOldQueries = async () => {
    const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
    const { error } = await supabase
      .from("ai_search_queries")
      .delete()
      .lt("created_at", thirtyDaysAgo);

    if (error) {
      toast.error("Failed to delete old queries");
    } else {
      toast.success("Old queries deleted");
      refetchQueries();
    }
  };

  const handleExportCSV = () => {
    if (!queries?.length) {
      toast.error("Aucune donnée à exporter");
      return;
    }

    // Build CSV data with all queries and their events
    const csvRows: string[] = [];
    
    // Header row
    const headers = [
      "ID",
      "Requête",
      "Langue",
      "Nb Résultats",
      "Session ID",
      "Appareil",
      "A cliqué",
      "Position clic",
      "Converti",
      "Rebond",
      "Date"
    ];
    csvRows.push(headers.join(";"));

    // Data rows
    queries.forEach(q => {
      const queryEvents = events?.filter(e => e.search_id === q.id) || [];
      const clickEvent = queryEvents.find(e => e.event_type === 'click');
      const hasBooking = queryEvents.some(e => e.event_type === 'booking') || q.converted;
      const hasBounce = queryEvents.some(e => e.event_type === 'bounce');
      const deviceType = isMobile(q.user_agent) ? "Mobile" : "Desktop";
      
      const row = [
        `"${q.id}"`,
        `"${(q.query || '').replace(/"/g, '""')}"`,
        `"${q.lang || 'unknown'}"`,
        q.recommendation_count ?? 0,
        `"${q.session_id || ''}"`,
        `"${deviceType}"`,
        `"${clickEvent ? 'Oui' : 'Non'}"`,
        clickEvent?.position ?? "",
        `"${hasBooking ? 'Oui' : 'Non'}"`,
        `"${hasBounce ? 'Oui' : 'Non'}"`,
        `"${q.created_at ? format(new Date(q.created_at), 'yyyy-MM-dd HH:mm:ss') : ''}"`
      ];
      csvRows.push(row.join(";"));
    });

    // Create and download CSV file
    const csvContent = csvRows.join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" }); // BOM for Excel UTF-8
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ai-insights-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`${queries.length} requêtes exportées`);
  };

  const isMobile = (userAgent: string | null) => {
    if (!userAgent) return false;
    return /Mobile|Android|iPhone|iPad/i.test(userAgent);
  };

  // Extract keywords from queries
  const topKeywords = useMemo(() => {
    if (!queries?.length) return [];
    
    const wordCounts: Record<string, number> = {};
    
    queries.forEach(q => {
      const words = q.query.toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2 && !STOP_WORDS.has(w));
      
      words.forEach(word => {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      });
    });
    
    return Object.entries(wordCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15);
  }, [queries]);

  // Detect categories from queries
  const categoryStats = useMemo(() => {
    if (!queries?.length) return [];
    
    const counts: Record<string, number> = {};
    
    queries.forEach(q => {
      const queryLower = q.query.toLowerCase();
      Object.entries(CATEGORY_KEYWORDS).forEach(([key, { keywords }]) => {
        if (keywords.some(kw => queryLower.includes(kw))) {
          counts[key] = (counts[key] || 0) + 1;
        }
      });
    });
    
    return Object.entries(counts)
      .map(([key, count]) => ({
        key,
        label: CATEGORY_KEYWORDS[key].label,
        count,
        percentage: ((count / queries.length) * 100).toFixed(0)
      }))
      .sort((a, b) => b.count - a.count);
  }, [queries]);

  // Trend data for last 7 days
  const trendData = useMemo(() => {
    if (!queries?.length) return [];
    
    return Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      return {
        date: format(date, 'dd/MM'),
        count: queries.filter(q => 
          q.created_at && format(new Date(q.created_at), 'yyyy-MM-dd') === dateStr
        ).length
      };
    });
  }, [queries]);

  // Calculate stats
  const totalQueries = queries?.length || 0;
  const todayQueries = queries?.filter((q) => {
    if (!q.created_at) return false;
    return isAfter(new Date(q.created_at), startOfDay(new Date()));
  }).length || 0;
  
  const avgRecommendations = queries?.length
    ? (queries.reduce((sum, q) => sum + (q.recommendation_count || 0), 0) / queries.length).toFixed(1)
    : "0";

  // Event-based metrics
  const clickEvents = events?.filter(e => e.event_type === 'click') || [];
  const bookingEvents = events?.filter(e => e.event_type === 'booking') || [];
  const newSearchEvents = events?.filter(e => e.event_type === 'new_search') || [];
  const bounceEvents = events?.filter(e => e.event_type === 'bounce') || [];

  // Calculate rates
  const clickRate = totalQueries > 0 ? ((clickEvents.length / totalQueries) * 100).toFixed(1) : "0";
  const conversionRate = totalQueries > 0 ? ((bookingEvents.length / totalQueries) * 100).toFixed(1) : "0";
  const bounceRate = totalQueries > 0 ? ((bounceEvents.length / totalQueries) * 100).toFixed(1) : "0";
  const multiSearchRate = totalQueries > 0 ? ((newSearchEvents.length / totalQueries) * 100).toFixed(1) : "0";

  // Top clicked experiences
  const clicksByExperience = clickEvents.reduce((acc, e) => {
    if (e.experience_id) {
      acc[e.experience_id] = (acc[e.experience_id] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const topClickedExperiences = Object.entries(clicksByExperience)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Click position distribution
  const positionCounts = clickEvents.reduce((acc, e) => {
    if (e.position) {
      acc[e.position] = (acc[e.position] || 0) + 1;
    }
    return acc;
  }, {} as Record<number, number>);

  // Language distribution
  const langCounts = queries?.reduce((acc, q) => {
    const lang = q.lang || "unknown";
    acc[lang] = (acc[lang] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const isLoading = queriesLoading || eventsLoading;
  const maxKeywordCount = topKeywords[0]?.[1] || 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Brain className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">AI Insights</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Analyse complète du funnel IA
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={!queries?.length}>
            <Download className="h-4 w-4 mr-1.5" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={handleClearOldQueries}>
            <Trash2 className="h-4 w-4 mr-1.5" />
            +30j
          </Button>
        </div>
      </div>

      {/* Funnel Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Search className="h-4 w-4" />
              Recherches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalQueries}</div>
            <p className="text-xs text-muted-foreground">{todayQueries} aujourd'hui</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MousePointer className="h-4 w-4" />
              Taux de Clic
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{clickRate}%</div>
            <p className="text-xs text-muted-foreground">{clickEvents.length} clics</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Conversions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{conversionRate}%</div>
            <p className="text-xs text-muted-foreground">{bookingEvents.length} réservations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Multi-recherches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{multiSearchRate}%</div>
            <p className="text-xs text-muted-foreground">Rebond: {bounceRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Funnel Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Funnel de Conversion
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Recherches</span>
              <span className="font-medium">{totalQueries}</span>
            </div>
            <Progress value={100} className="h-3" />
          </div>
          
          <div className="flex justify-center">
            <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Clics sur expériences</span>
              <span className="font-medium">{clickEvents.length} ({clickRate}%)</span>
            </div>
            <Progress value={parseFloat(clickRate)} className="h-3 bg-blue-100" />
          </div>
          
          <div className="flex justify-center">
            <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Réservations</span>
              <span className="font-medium">{bookingEvents.length} ({conversionRate}%)</span>
            </div>
            <Progress value={parseFloat(conversionRate)} className="h-3 bg-green-100" />
          </div>
        </CardContent>
      </Card>

      {/* Keywords & Categories Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Keywords */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              Top Termes Recherchés
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topKeywords.length === 0 ? (
              <p className="text-sm text-muted-foreground">Pas encore de données</p>
            ) : (
              <div className="space-y-2">
                {topKeywords.slice(0, 10).map(([word, count], index) => (
                  <div key={word} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-4">{index + 1}.</span>
                    <span className="font-medium text-sm flex-shrink-0 w-24 truncate">{word}</span>
                    <Progress 
                      value={(count / maxKeywordCount) * 100} 
                      className="flex-1 h-2"
                    />
                    <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" />
              Catégories Détectées
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryStats.length === 0 ? (
              <p className="text-sm text-muted-foreground">Pas encore de données</p>
            ) : (
              <div className="space-y-3">
                {categoryStats.map(({ key, label, count, percentage }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{label}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={parseInt(percentage)} className="w-20 h-2" />
                      <span className="text-sm font-medium w-12 text-right">{percentage}%</span>
                      <span className="text-xs text-muted-foreground">({count})</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Word Cloud & Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Word Cloud */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Cloud className="h-4 w-4 text-blue-500" />
              Nuage de Mots
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topKeywords.length === 0 ? (
              <p className="text-sm text-muted-foreground">Pas encore de données</p>
            ) : (
              <div className="flex flex-wrap gap-2 justify-center items-center min-h-[120px]">
                {topKeywords.map(([word, count]) => {
                  const size = Math.max(0.7, Math.min(2, (count / maxKeywordCount) * 1.5 + 0.5));
                  const opacity = Math.max(0.5, count / maxKeywordCount);
                  return (
                    <span 
                      key={word}
                      className="text-primary transition-all hover:scale-110 cursor-default"
                      style={{ 
                        fontSize: `${size}rem`,
                        opacity
                      }}
                    >
                      {word}
                    </span>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Tendances (7 derniers jours)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trendData.every(d => d.count === 0) ? (
              <p className="text-sm text-muted-foreground">Pas encore de données</p>
            ) : (
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={trendData}>
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }} 
                    tickLine={false}
                    axisLine={false}
                    width={30}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ fontWeight: 'bold' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Click Position Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Position des Clics</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(positionCounts).length === 0 ? (
              <p className="text-sm text-muted-foreground">Pas encore de données</p>
            ) : (
              <div className="space-y-3">
                {[1, 2, 3].map((pos) => (
                  <div key={pos} className="flex items-center gap-3">
                    <Badge variant="outline" className="w-8 justify-center">
                      #{pos}
                    </Badge>
                    <Progress 
                      value={clickEvents.length > 0 ? ((positionCounts[pos] || 0) / clickEvents.length) * 100 : 0} 
                      className="flex-1 h-2"
                    />
                    <span className="text-sm font-medium w-12 text-right">
                      {positionCounts[pos] || 0}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Language & Device Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Langues & Appareils
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Par langue</p>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(langCounts).map(([lang, count]) => (
                    <Badge key={lang} variant="secondary">
                      {lang.toUpperCase()}: {count}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Par appareil</p>
                <div className="flex gap-2">
                  <Badge variant="outline">
                    Mobile: {queries?.filter(q => isMobile(q.user_agent)).length || 0}
                  </Badge>
                  <Badge variant="outline">
                    Desktop: {queries?.filter(q => !isMobile(q.user_agent)).length || 0}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Queries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recherches Récentes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Chargement...</p>
          ) : !queries?.length ? (
            <p className="text-muted-foreground">Aucune recherche enregistrée</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Requête</TableHead>
                  <TableHead>Langue</TableHead>
                  <TableHead>Résultats</TableHead>
                  <TableHead>Actions</TableHead>
                  <TableHead>Converti</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queries.slice(0, 30).map((q) => {
                  const queryEvents = events?.filter(e => e.search_id === q.id) || [];
                  const hasClick = queryEvents.some(e => e.event_type === 'click');
                  const hasBooking = queryEvents.some(e => e.event_type === 'booking');
                  const hasBounce = queryEvents.some(e => e.event_type === 'bounce');
                  
                  return (
                    <TableRow key={q.id}>
                      <TableCell className="font-medium max-w-xs truncate">
                        {q.query}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {q.lang?.toUpperCase() || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell>{q.recommendation_count ?? 0}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {hasClick && <Badge variant="default" className="bg-blue-500">Clic</Badge>}
                          {hasBounce && <Badge variant="secondary">Rebond</Badge>}
                          {!hasClick && !hasBounce && queryEvents.length === 0 && (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {hasBooking || q.converted ? (
                          <Badge variant="default" className="bg-green-500">Oui</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Non</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {q.created_at
                          ? format(new Date(q.created_at), "dd/MM HH:mm")
                          : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AIInsights;
