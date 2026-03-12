import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, X, Loader2, MapPin, ArrowRight, Send, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/hooks/useLanguage';
import { t } from '@/lib/translations';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  getSessionId,
  setLastSearchId,
  trackExperienceClick,
  trackNewSearch,
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

interface Category {
  id: string;
  name: string;
  name_he: string;
  slug: string;
}

const CATEGORIES: Category[] = [
  { id: 'romantic', name: 'Romantic', name_he: 'רומנטי', slug: 'romantic' },
  { id: 'family', name: 'Family', name_he: 'משפחתי', slug: 'family' },
  { id: 'nature', name: 'Nature', name_he: 'טבע', slug: 'nature' },
  { id: 'taste', name: 'Culinary', name_he: 'קולינרי', slug: 'taste' },
  { id: 'active', name: 'Active', name_he: 'אקטיבי', slug: 'active' },
  { id: 'mindful', name: 'Wellness', name_he: 'וולנס', slug: 'mindful-reset' },
];

const StickyAIButton = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [currentSearchId, setCurrentSearchId] = useState<string | null>(null);
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isRTL = lang === 'he';

  // Show button after scrolling 50%
  useEffect(() => {
    const handleScroll = () => {
      const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      setIsVisible(scrollPercent > 30);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCategoryClick = (category: Category) => {
    const categoryPrompt = lang === 'he' 
      ? `אני מחפש/ת חוויה ${category.name_he}`
      : `I'm looking for a ${category.name.toLowerCase()} experience`;
    setQuery(categoryPrompt);
    handleSearch(categoryPrompt);
  };

  const handleSearch = async (searchQuery?: string) => {
    const queryToUse = searchQuery || query;
    if (!queryToUse.trim()) return;

    setIsLoading(true);
    const previousSearchId = currentSearchId;

    try {
      const sessionId = getSessionId();
      
      const { data, error } = await supabase.functions.invoke('recommend-experiences', {
        body: { query: queryToUse.trim(), lang },
        headers: { 'x-session-id': sessionId }
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: lang === 'he' ? 'שגיאה' : 'Error',
          description: data.error,
          variant: 'destructive'
        });
        return;
      }

      if (data.search_id) {
        if (previousSearchId) {
          trackNewSearch(data.search_id);
        } else {
          setLastSearchId(data.search_id);
        }
        setCurrentSearchId(data.search_id);
      }

      setResponse(data);
      setShowEmailPrompt(false);
    } catch (error: any) {
      // Distinguish between network/CORS errors and function errors
      const isNetworkError = error?.name === 'FunctionsFetchError' || 
                            error?.message?.includes('Failed to fetch') ||
                            error?.message?.includes('NetworkError');
      
      toast({
        title: lang === 'he' ? 'שגיאה' : 'Error',
        description: isNetworkError
          ? (lang === 'he' ? 'בעיית חיבור. נסו שוב.' : 'Connection issue. Please try again.')
          : (lang === 'he' ? 'לא הצלחנו למצוא המלצות. נסו שוב.' : 'Failed to get recommendations. Please try again.'),
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExperienceClick = (rec: Recommendation, index: number) => {
    trackExperienceClick(rec.id, index + 1, currentSearchId);
    setIsPanelOpen(false);
    navigate(`/${lang}/experience/${rec.slug}`);
  };

  const handleSaveEmail = async () => {
    if (!email.trim() || !email.includes('@')) {
      toast({
        title: lang === 'he' ? 'אנא הזינו אימייל תקין' : 'Please enter a valid email',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmittingEmail(true);
    try {
      await supabase.functions.invoke('collect-lead', {
        body: {
          email: email.trim(),
          source: 'ai_assistant_save',
          metadata: {
            search_id: currentSearchId,
            query: query,
            recommendations: response?.recommendations.map(r => r.id)
          }
        }
      });

      toast({
        title: lang === 'he' ? 'נשמר!' : 'Saved!',
        description: lang === 'he' 
          ? 'ההמלצות נשלחו לאימייל שלך' 
          : 'Recommendations sent to your email'
      });
      setShowEmailPrompt(false);
      setEmail('');
    } catch (error) {
      // Error handled silently
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  const handleReset = () => {
    setQuery('');
    setResponse(null);
    setCurrentSearchId(null);
    setShowEmailPrompt(false);
  };

  const handleClose = () => {
    setIsPanelOpen(false);
    handleReset();
  };

  if (!isVisible && !isPanelOpen) return null;

  return (
    <>
      {/* Sticky Button */}
      {!isPanelOpen && (
        <button
          onClick={() => setIsPanelOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-in slide-in-from-bottom-4 fade-in"
        >
          <Sparkles className="w-5 h-5" />
          <span className="font-medium">{t(lang, 'stickyAIButton')}</span>
        </button>
      )}

      {/* Panel Overlay */}
      {isPanelOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className={`fixed bottom-0 ${isRTL ? 'left-0' : 'right-0'} w-full sm:w-[420px] h-[85vh] bg-background rounded-t-2xl sm:rounded-t-none sm:rounded-l-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom sm:slide-in-from-right duration-300`}
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{t(lang, 'stickyAIPanelTitle')}</h3>
                  <p className="text-xs text-muted-foreground">{t(lang, 'stickyAIPanelSubtitle')}</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {!response && !isLoading && (
                <>
                  {/* Category Chips */}
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-3">{t(lang, 'stickyAIQuickStart')}</p>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => handleCategoryClick(cat)}
                          className="px-3 py-1.5 text-sm bg-muted hover:bg-primary/10 hover:text-primary rounded-full transition-colors"
                        >
                          {lang === 'he' ? cat.name_he : cat.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground">{t(lang, 'stickyAIOr')}</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  {/* Free Text Input */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">{t(lang, 'stickyAIDescribe')}</p>
                    <Textarea
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSearch();
                        }
                      }}
                      placeholder={lang === 'he' 
                        ? 'למשל: סופשבוע רומנטי עם ספא בצפון...' 
                        : 'e.g., A romantic weekend with spa in the north...'}
                      className="min-h-[80px] resize-none"
                    />
                    <Button
                      onClick={() => handleSearch()}
                      disabled={!query.trim()}
                      className="w-full mt-3 gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      {t(lang, 'stickyAIFind')}
                    </Button>
                  </div>
                </>
              )}

              {/* Loading */}
              {isLoading && (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-muted-foreground">{t(lang, 'aiAssistantThinking')}</p>
                </div>
              )}

              {/* Results */}
              {response && !isLoading && (
                <div className="space-y-4">
                  {/* AI Intro */}
                  <div className="bg-muted/50 rounded-lg p-3 border border-border/50">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <p className="text-sm leading-relaxed">{response.intro}</p>
                    </div>
                  </div>

                  {/* Recommendations */}
                  {response.recommendations?.map((rec, index) => (
                    <div
                      key={rec.id}
                      onClick={() => handleExperienceClick(rec, index)}
                      className="group flex gap-3 p-3 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-muted/30 cursor-pointer transition-all"
                    >
                      <div className="w-20 h-20 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                        {rec.hero_image ? (
                          <img
                            src={rec.hero_image}
                            alt={rec.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <MapPin className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
                          {rec.title}
                        </h4>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {rec.hotel}
                        </p>
                        <p className="text-xs text-muted-foreground/80 italic line-clamp-2 mt-1">
                          "{rec.reason}"
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="font-semibold text-sm">
                            {rec.currency === 'ILS' ? '₪' : rec.currency}{rec.price}
                          </span>
                          <ArrowRight className={`w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity ${isRTL ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Email Save Prompt */}
                  {!showEmailPrompt ? (
                    <button
                      onClick={() => setShowEmailPrompt(true)}
                      className="w-full flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      {t(lang, 'stickyAISaveEmail')}
                    </button>
                  ) : (
                    <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                      <p className="text-sm text-muted-foreground">{t(lang, 'stickyAIEmailPrompt')}</p>
                      <div className="flex gap-2">
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder={lang === 'he' ? 'האימייל שלך' : 'Your email'}
                          className="flex-1"
                        />
                        <Button
                          onClick={handleSaveEmail}
                          disabled={isSubmittingEmail}
                          size="icon"
                        >
                          {isSubmittingEmail ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Try Again */}
                  <Button variant="ghost" size="sm" onClick={handleReset} className="w-full">
                    {t(lang, 'aiAssistantTryAgain')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StickyAIButton;
