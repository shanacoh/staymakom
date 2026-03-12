import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Loader2, ArrowRight, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/hooks/useLanguage';
import { t } from '@/lib/translations';
import { useToast } from '@/hooks/use-toast';
import { 
  getSessionId, 
  setLastSearchId, 
  trackExperienceClick, 
  trackNewSearch,
  trackBounce 
} from '@/lib/aiTracking';

interface Recommendation {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  hotel: string;
  location: string;
  price: number;
  currency: string;
  hero_image: string;
  reason: string;
}

interface AIResponse {
  intro: string;
  recommendations: Recommendation[];
  search_id?: string;
  session_id?: string;
  error?: string;
}

const AIExperienceAssistant = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [currentSearchId, setCurrentSearchId] = useState<string | null>(null);
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isRTL = lang === 'he';

  // Track bounce on unmount if user had results but didn't click
  useEffect(() => {
    return () => {
      if (response && response.recommendations.length > 0) {
        trackBounce();
      }
    };
  }, [response]);

  const placeholders = {
    en: [
      "A romantic weekend with spa for two...",
      "A family adventure with kids in the desert...",
      "A quiet retreat in the Galilee with wine tasting...",
      "Something adventurous near the Dead Sea..."
    ],
    he: [
      "סופשבוע רומנטי עם ספא לזוג...",
      "הרפתקה משפחתית עם ילדים במדבר...",
      "נסיגה שקטה בגליל עם טעימות יין...",
      "משהו הרפתקני ליד ים המלח..."
    ]
  };

  const getRandomPlaceholder = () => {
    const langPlaceholders = placeholders[lang] || placeholders.en;
    return langPlaceholders[Math.floor(Math.random() * langPlaceholders.length)];
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    
    // Track new search if we already have results
    const previousSearchId = currentSearchId;

    try {
      const sessionId = getSessionId();
      
      const { data, error } = await supabase.functions.invoke('recommend-experiences', {
        body: { query: query.trim(), lang },
        headers: { 'x-session-id': sessionId }
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        toast({
          title: lang === 'he' ? 'שגיאה' : 'Error',
          description: data.error,
          variant: 'destructive'
        });
        return;
      }

      // Track that user made a new search
      if (data.search_id) {
        if (previousSearchId) {
          trackNewSearch(data.search_id);
        } else {
          setLastSearchId(data.search_id);
        }
        setCurrentSearchId(data.search_id);
      }

      setResponse(data);
    } catch (error) {
      
      toast({
        title: lang === 'he' ? 'שגיאה' : 'Error',
        description: lang === 'he' 
          ? 'לא הצלחנו למצוא המלצות. נסו שוב.' 
          : 'Failed to get recommendations. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleExperienceClick = (rec: Recommendation, index: number) => {
    // Track the click with position
    trackExperienceClick(rec.id, index + 1, currentSearchId);
    navigate(`/${lang}/experience/${rec.slug}`);
  };

  const handleReset = () => {
    setQuery('');
    setResponse(null);
    setCurrentSearchId(null);
  };

  return (
    <section id="ai-assistant" className="container py-12 sm:py-16 px-4 scroll-mt-24" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            <span>{t(lang, 'aiAssistantBadge')}</span>
          </div>
          <h2 className="font-sans text-xl sm:text-2xl md:text-3xl font-bold tracking-tight mb-2">
            {t(lang, 'aiAssistantTitle')}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t(lang, 'aiAssistantSubtitle')}
          </p>
        </div>

        {/* Input Area */}
        <div className="relative mb-6">
          <Textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={getRandomPlaceholder()}
            className="min-h-[80px] pr-24 resize-none text-base"
            disabled={isLoading}
          />
          <Button
            onClick={handleSearch}
            disabled={isLoading || !query.trim()}
            className="absolute bottom-3 right-3 gap-2"
            size="sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">{t(lang, 'aiAssistantSearching')}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">{t(lang, 'aiAssistantSearch')}</span>
              </>
            )}
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-3 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{t(lang, 'aiAssistantThinking')}</span>
            </div>
          </div>
        )}

        {/* Results */}
        {response && !isLoading && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* AI Intro Message */}
            <div className="bg-muted/50 rounded-lg p-4 border border-border/50">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-primary/10 text-primary flex-shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <p className="text-sm sm:text-base leading-relaxed">{response.intro}</p>
              </div>
            </div>

            {/* Recommendation Cards */}
            {response.recommendations && response.recommendations.length > 0 && (
              <div className="grid gap-4">
                {response.recommendations.map((rec, index) => (
                  <div
                    key={rec.id}
                    onClick={() => handleExperienceClick(rec, index)}
                    className="group flex gap-4 p-3 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-muted/30 cursor-pointer transition-all duration-200"
                  >
                    {/* Image */}
                    <div className="w-24 h-24 sm:w-32 sm:h-24 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                      {rec.hero_image ? (
                        <img
                          src={rec.hero_image}
                          alt={rec.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <MapPin className="w-8 h-8" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-sm sm:text-base line-clamp-1 group-hover:text-primary transition-colors">
                            {rec.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                            {rec.hotel} • {rec.location}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-semibold text-sm sm:text-base">
                            ${rec.price}
                          </p>
                        </div>
                      </div>
                      
                      {/* AI Reason */}
                      <p className="mt-2 text-xs sm:text-sm text-muted-foreground line-clamp-2 italic">
                        "{rec.reason}"
                      </p>

                      {/* CTA Arrow */}
                      <div className={`mt-2 flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <span>{t(lang, 'aiAssistantViewExperience')}</span>
                        <ArrowRight className={`w-3 h-3 ${isRTL ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Try Again Button */}
            <div className="text-center">
              <Button variant="ghost" size="sm" onClick={handleReset}>
                {t(lang, 'aiAssistantTryAgain')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default AIExperienceAssistant;
