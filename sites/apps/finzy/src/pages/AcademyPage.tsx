import { useState, useEffect, useMemo } from 'react';
import { usePlan } from '@/hooks/usePlan';
import { SEO } from '@/components/SEO';
import { 
  Clock, Star, Lock, CheckCircle2, ChevronRight, BookOpen, Trophy, Filter,
  Lightbulb, HelpCircle, FileText, GraduationCap, Target, Zap, Award,
  ChevronDown, Book, ListChecks
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/contexts/AuthContext';
import { useXP } from '@/hooks/useXP';
import { useBadges } from '@/hooks/useBadges';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { allArticles, academyCategories, levelInfo, getArticles } from '@/data/academy';
import type { AcademyArticle } from '@/data/academy';

interface ProgressItem { 
  article_id: string; 
  quiz_passed: boolean; 
}

const levelColors: Record<number, string> = {
  1: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400',
  2: 'bg-blue-500/10 text-blue-600 border-blue-500/30 dark:text-blue-400',
  3: 'bg-violet-500/10 text-violet-600 border-violet-500/30 dark:text-violet-400',
};

const levelBgGradients: Record<number, string> = {
  1: 'from-emerald-500/5 to-emerald-500/0',
  2: 'from-blue-500/5 to-blue-500/0',
  3: 'from-violet-500/5 to-violet-500/0',
};

export default function AcademyPage() {
  const { user, profile } = useAuth();
  const { grantXP } = useXP();
  const { awardBadge } = useBadges();
  const { isPremium } = usePlan();
  const market = (profile?.market ?? 'FR') as 'FR' | 'CH';
  const userLevel = profile?.level ?? 1;

  const [progress, setProgress] = useState<ProgressItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<AcademyArticle | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterLevel, setFilterLevel] = useState('all');
  const [readingProgress, setReadingProgress] = useState(0);
  const [expandedDefinitions, setExpandedDefinitions] = useState(false);

  // Get articles for current market
  const articles = useMemo(() => getArticles(market), [market]);

  const fetchProgress = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    const { data: prog } = await supabase
      .from('user_academy_progress')
      .select('article_id, quiz_passed')
      .eq('user_id', user.id);
    setProgress((prog ?? []) as ProgressItem[]);
    setLoading(false);
  };

  useEffect(() => { fetchProgress(); }, [user]);

  const readIds = new Set(progress.map(p => p.article_id));
  const quizPassedIds = new Set(progress.filter(p => p.quiz_passed).map(p => p.article_id));
  const readCount = articles.filter(a => readIds.has(a.id)).length;
  const quizCount = articles.filter(a => quizPassedIds.has(a.id)).length;
  const progressPct = articles.length > 0 ? Math.round((readCount / articles.length) * 100) : 0;

  const categories = useMemo(() => {
    const cats = [...new Set(articles.map(a => a.category))];
    return academyCategories.filter(c => cats.includes(c.id));
  }, [articles]);

  const displayArticles = useMemo(() => {
    return articles.filter(a => {
      if (filterCategory !== 'all' && a.category !== filterCategory) return false;
      if (filterLevel !== 'all' && a.level !== parseInt(filterLevel)) return false;
      return true;
    });
  }, [articles, filterCategory, filterLevel]);

  // Level 2 & 3 require Premium; level 1 is free for everyone
  const isUnlocked = (article: AcademyArticle) => {
    if (article.level === 1) return article.level <= userLevel;
    return isPremium && article.level <= userLevel;
  };

  const handleReadArticle = (article: AcademyArticle) => {
    if (!isUnlocked(article)) { 
      toast.error(`Niveau ${article.level} requis pour débloquer cet article`); 
      return; 
    }
    setSelectedArticle(article);
    setShowQuiz(false);
    setQuizAnswer(null);
    setReadingProgress(0);
    setExpandedDefinitions(false);
  };

  const handleMarkAsRead = async () => {
    if (!user || !selectedArticle) return;
    if (!readIds.has(selectedArticle.id)) {
      const { error } = await supabase.from('user_academy_progress').upsert({ 
        user_id: user.id, 
        article_id: selectedArticle.id, 
        quiz_passed: false 
      }, { onConflict: 'user_id,article_id' });
      if (error) {
        toast.error('Erreur lors de l\'enregistrement');
        return;
      }
      await grantXP(selectedArticle.xpReward, `Article lu : ${selectedArticle.title}`);
      const { count } = await supabase
        .from('user_academy_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      if ((count ?? 0) >= 5) await awardBadge('reader');
      await fetchProgress();
    }
    setShowQuiz(true);
  };

  const handleQuizAnswer = async (idx: number) => {
    if (!user || !selectedArticle || quizAnswer !== null) return;
    setQuizAnswer(idx);
    const quiz = selectedArticle.quiz;
    const isCorrect = idx === quiz.correctIndex;
    if (isCorrect) {
      const { error } = await supabase.from('user_academy_progress')
        .upsert({ 
          user_id: user.id, 
          article_id: selectedArticle.id, 
          quiz_passed: true 
        }, { onConflict: 'user_id,article_id' });
      if (error) {
        toast.error('Erreur lors de l\'enregistrement');
      } else {
        await grantXP(15, 'Quiz réussi !');
        toast.success('Bonne réponse ! 🎉');
      }
    } else {
      // Enregistrer la tentative (en cours) même en cas d'échec
      const { error } = await supabase.from('user_academy_progress')
        .upsert({ 
          user_id: user.id, 
          article_id: selectedArticle.id, 
          quiz_passed: false 
        }, { onConflict: 'user_id,article_id' });
      if (!error) toast.error('Mauvaise réponse, réessaie plus tard !');
    }
    await fetchProgress();
  };

  const handleArticleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const scrollPct = Math.round((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100);
    setReadingProgress(Math.min(scrollPct, 100));
  };

  const closeDialog = () => { 
    setSelectedArticle(null); 
    setShowQuiz(false); 
    setQuizAnswer(null); 
    setReadingProgress(0); 
  };

  // Group articles by level
  const byLevel = useMemo(() => {
    return [1, 2, 3].map(lvl => ({
      level: lvl as 1 | 2 | 3,
      articles: displayArticles.filter(a => a.level === lvl),
    })).filter(g => g.articles.length > 0);
  }, [displayArticles]);

  // Calculate stats by category
  const categoryStats = useMemo(() => {
    return categories.map(cat => {
      const catArticles = articles.filter(a => a.category === cat.id);
      const catRead = catArticles.filter(a => readIds.has(a.id)).length;
      return { 
        ...cat, 
        total: catArticles.length, 
        read: catRead,
        pct: catArticles.length > 0 ? Math.round((catRead / catArticles.length) * 100) : 0
      };
    }).filter(c => c.total > 0);
  }, [categories, articles, readIds]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <SEO 
        title="Academy" 
        description="Apprenez la finance personnelle pas à pas avec des articles et quiz interactifs." 
        path="/academy" 
      />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-primary" />
            Academy
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {market === 'FR' ? '🇫🇷 France' : '🇨🇭 Suisse'} · Niveau {userLevel}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <BookOpen className="h-3 w-3" />
            {readCount}/{articles.length}
          </Badge>
          <Badge variant="outline" className="gap-1 text-amber-600">
            <Trophy className="h-3 w-3" />
            {quizCount} quiz
          </Badge>
        </div>
      </div>

      {/* Progress Card */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/0 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <span className="font-semibold">Progression globale</span>
            </div>
            <span className="text-lg font-bold text-primary">{progressPct}%</span>
          </div>
          <Progress value={progressPct} className="h-2" />
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>{readCount} articles lus</span>
            <span>{articles.length - readCount} restants</span>
          </div>
        </CardContent>
      </Card>

      {/* Categories Overview */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Book className="h-5 w-5" />
          Catégories
        </h2>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {categoryStats.map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(filterCategory === cat.id ? 'all' : cat.id)}
              className={`rounded-xl border p-3 text-left transition-all hover:shadow-md ${
                filterCategory === cat.id ? 'ring-2 ring-primary border-primary' : ''
              }`}
            >
              <div className="text-2xl mb-1">{cat.emoji}</div>
              <div className="font-medium text-sm">{cat.title}</div>
              <div className="text-xs text-muted-foreground">{cat.read}/{cat.total} articles</div>
              <Progress value={cat.pct} className="h-1 mt-2" />
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-44">
            <Filter className="h-3.5 w-3.5 mr-1" />
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes catégories</SelectItem>
            {categories.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.emoji} {c.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterLevel} onValueChange={setFilterLevel}>
          <SelectTrigger className="w-36">
            <Zap className="h-3.5 w-3.5 mr-1" />
            <SelectValue placeholder="Niveau" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous niveaux</SelectItem>
            <SelectItem value="1">🟢 Débutant</SelectItem>
            <SelectItem value="2">🔵 Intermédiaire</SelectItem>
            <SelectItem value="3">🟣 Avancé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Articles by Level */}
      {byLevel.map(({ level, articles: lvlArticles }) => (
        <section key={level} className={`rounded-xl bg-gradient-to-b ${levelBgGradients[level]} p-4`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`${levelColors[level]} text-sm px-3 py-1`}>
                {level === 1 ? '🟢' : level === 2 ? '🔵' : '🟣'} Niveau {level} - {levelInfo[level].name}
              </Badge>
              {level > userLevel && <Lock className="h-4 w-4 text-muted-foreground" />}
            </div>
            <span className="text-sm text-muted-foreground">
              {lvlArticles.filter(a => readIds.has(a.id)).length}/{lvlArticles.length}
            </span>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lvlArticles.map(a => {
              const unlocked = isUnlocked(a);
              const read = readIds.has(a.id);
              const quizDone = quizPassedIds.has(a.id);
              const category = academyCategories.find(c => c.id === a.category);
              
              return (
                <Card
                  key={a.id}
                  onClick={() => handleReadArticle(a)}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    unlocked ? 'hover:border-primary/50' : 'opacity-50 cursor-not-allowed'
                  } ${read ? 'border-emerald-500/40 bg-emerald-500/5' : ''}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{category?.emoji}</span>
                        <Badge variant="outline" className={`${levelColors[a.level]} text-[10px]`}>
                          Niv. {a.level}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        {read && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                        {quizDone && <Trophy className="h-4 w-4 text-amber-500" />}
                        {!unlocked && <Lock className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </div>
                    <CardTitle className="text-base mt-2">{a.title}</CardTitle>
                    <CardDescription className="line-clamp-2 text-xs">
                      {a.summary}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {a.readingTime} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        +{a.xpReward} XP
                      </span>
                    </div>
                    {read && (
                      <div className="mt-2">
                        <Progress value={quizDone ? 100 : 50} className="h-1" />
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {quizDone ? '✓ Complété' : 'Quiz en attente'}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      ))}

      {displayArticles.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Aucun article trouvé avec ces filtres.</p>
        </div>
      )}

      {/* Article Dialog */}
      <Dialog open={!!selectedArticle} onOpenChange={open => { if (!open) closeDialog(); }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col p-0">
          {selectedArticle && (
            <>
              <DialogHeader className="px-6 pt-6 pb-2 border-b">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">
                    {academyCategories.find(c => c.id === selectedArticle.category)?.emoji}
                  </span>
                  <Badge variant="outline" className={levelColors[selectedArticle.level]}>
                    Niveau {selectedArticle.level}
                  </Badge>
                  <Badge variant="outline">
                    <Clock className="h-3 w-3 mr-1" />
                    {selectedArticle.readingTime} min
                  </Badge>
                </div>
                <DialogTitle className="text-xl">{selectedArticle.title}</DialogTitle>
                {!showQuiz && <Progress value={readingProgress} className="h-1 mt-3" />}
              </DialogHeader>

              {!showQuiz ? (
                <div className="flex-1 overflow-y-auto p-6 space-y-6" onScroll={handleArticleScroll}>
                  {/* Article Sections */}
                  {selectedArticle.sections.map((section, i) => (
                    <div key={i} className="space-y-3">
                      <h2 className="text-lg font-bold flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center">
                          {i + 1}
                        </span>
                        {section.title}
                      </h2>
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        {section.content.split('\n').map((line, j) => {
                          if (line.startsWith('**') && line.endsWith('**')) {
                            return <p key={j} className="font-bold text-primary">{line.slice(2, -2)}</p>;
                          }
                          if (line.startsWith('**')) {
                            const match = line.match(/^\*\*(.+?)\*\*\s*(.*)/);
                            if (match) return <p key={j}><strong>{match[1]}</strong> {match[2]}</p>;
                          }
                          if (line.startsWith('• ') || line.startsWith('- ')) {
                            return <p key={j} className="ml-4 flex gap-2"><span>•</span>{line.slice(2)}</p>;
                          }
                          if (line.startsWith('✅') || line.startsWith('❌')) {
                            return <p key={j} className="ml-2">{line}</p>;
                          }
                          if (line.match(/^\d+[.️⃣]/)) {
                            return <p key={j} className="ml-4 font-medium">{line}</p>;
                          }
                          if (line.startsWith('|')) {
                            return null; // Tables handled separately
                          }
                          if (line.trim() === '') return <br key={j} />;
                          return <p key={j}>{line}</p>;
                        })}
                        
                        {/* Render tables */}
                        {section.content.includes('|') && (
                          <div className="overflow-x-auto my-4">
                            <table className="w-full text-sm border-collapse">
                              <tbody>
                                {section.content.split('\n')
                                  .filter(l => l.startsWith('|'))
                                  .filter(l => !l.includes('---'))
                                  .map((row, ri) => (
                                    <tr key={ri} className={ri === 0 ? 'bg-muted/50 font-semibold' : ''}>
                                      {row.split('|').filter(c => c.trim()).map((cell, ci) => (
                                        <td key={ci} className="border px-3 py-1.5">{cell.trim()}</td>
                                      ))}
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                      
                      {/* Diagram */}
                      {section.diagram && (
                        <pre className="bg-muted/50 rounded-lg p-4 text-xs font-mono overflow-x-auto border">
                          {section.diagram}
                        </pre>
                      )}
                    </div>
                  ))}

                  {/* Definitions */}
                  {selectedArticle.definitions && selectedArticle.definitions.length > 0 && (
                    <Collapsible open={expandedDefinitions} onOpenChange={setExpandedDefinitions}>
                      <CollapsibleTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                          <span className="flex items-center gap-2">
                            <Lightbulb className="h-4 w-4 text-amber-500" />
                            Définitions ({selectedArticle.definitions.length})
                          </span>
                          <ChevronDown className={`h-4 w-4 transition-transform ${expandedDefinitions ? 'rotate-180' : ''}`} />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2">
                        <div className="grid gap-2">
                          {selectedArticle.definitions.map((def, i) => (
                            <div key={i} className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
                              <span className="font-semibold text-amber-600 dark:text-amber-400">{def.term}</span>
                              <p className="text-sm text-muted-foreground mt-1">{def.definition}</p>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Examples */}
                  {selectedArticle.examples && selectedArticle.examples.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-semibold flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-500" />
                        Exemples pratiques
                      </h3>
                      {selectedArticle.examples.map((ex, i) => (
                        <div key={i} className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
                          <h4 className="font-medium text-blue-600 dark:text-blue-400">{ex.title}</h4>
                          <p className="text-sm mt-2 whitespace-pre-line">{ex.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Key Points */}
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <h3 className="font-semibold flex items-center gap-2 mb-3">
                      <ListChecks className="h-4 w-4 text-primary" />
                      Points clés à retenir
                    </h3>
                    <ul className="space-y-2">
                      {selectedArticle.keyPoints.map((point, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button onClick={handleMarkAsRead} className="w-full" size="lg">
                    {readIds.has(selectedArticle.id) ? 'Passer au quiz' : `Marquer comme lu (+${selectedArticle.xpReward} XP)`}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <HelpCircle className="h-5 w-5 text-primary" />
                    Quiz de validation
                    <Badge variant="outline" className="ml-auto">+15 XP</Badge>
                  </div>
                  
                  <p className="text-base">{selectedArticle.quiz.question}</p>
                  
                  <div className="grid gap-2">
                    {selectedArticle.quiz.options.map((opt, i) => {
                      const isCorrect = i === selectedArticle.quiz.correctIndex;
                      const isSelected = quizAnswer === i;
                      const showResult = quizAnswer !== null;
                      
                      return (
                        <Button
                          key={i}
                          variant={
                            showResult
                              ? isCorrect ? 'default' : isSelected ? 'destructive' : 'outline'
                              : 'outline'
                          }
                          className={`justify-start text-left h-auto py-3 px-4 ${
                            showResult && isCorrect ? 'bg-emerald-500 hover:bg-emerald-500' : ''
                          }`}
                          onClick={() => handleQuizAnswer(i)}
                          disabled={quizAnswer !== null}
                        >
                          <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs mr-3 shrink-0">
                            {String.fromCharCode(65 + i)}
                          </span>
                          {opt}
                        </Button>
                      );
                    })}
                  </div>
                  
                  {quizAnswer !== null && (
                    <div className={`rounded-lg p-4 ${
                      quizAnswer === selectedArticle.quiz.correctIndex 
                        ? 'bg-emerald-500/10 border border-emerald-500/30' 
                        : 'bg-red-500/10 border border-red-500/30'
                    }`}>
                      <p className="font-medium mb-1">
                        {quizAnswer === selectedArticle.quiz.correctIndex ? '✅ Correct !' : '❌ Incorrect'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedArticle.quiz.explanation}
                      </p>
                    </div>
                  )}
                  
                  {quizAnswer !== null && (
                    <Button variant="outline" onClick={closeDialog} className="w-full">
                      Fermer
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
