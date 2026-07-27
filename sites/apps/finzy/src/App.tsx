import { lazy, Suspense } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { CookieConsent } from "@/components/CookieConsent";
import AppLayout from "./components/layout/AppLayout";

// Lazy-loaded pages
const LandingPage = lazy(() => import("./pages/LandingPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const OnboardingPage = lazy(() => import("./pages/OnboardingPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const BudgetPage = lazy(() => import("./pages/BudgetPage"));
const ProjetsPage = lazy(() => import("./pages/ProjetsPage"));
const PatrimoinePage = lazy(() => import("./pages/PatrimoinePage"));
const SimulateursPage = lazy(() => import("./pages/SimulateursPage"));
const SimulateurCreditPage = lazy(() => import("./pages/SimulateurCreditPage"));
const SimulateurEpargnePage = lazy(() => import("./pages/SimulateurEpargnePage"));
const SimulateurFirePage = lazy(() => import("./pages/SimulateurFirePage"));
const SimulateurIRPage = lazy(() => import("./pages/SimulateurIRPage"));
const SimulateurFlatTaxPage = lazy(() => import("./pages/SimulateurFlatTaxPage"));
const SimulateurFraisNotairePage = lazy(() => import("./pages/SimulateurFraisNotairePage"));
const SimulateurImpotCHPage = lazy(() => import("./pages/SimulateurImpotCHPage"));
const SimulateurTroisiemePilierPage = lazy(() => import("./pages/SimulateurTroisiemePilierPage"));
const SimulateurHypothequeCHPage = lazy(() => import("./pages/SimulateurHypothequeCHPage"));
const SimulateurComparateurPage = lazy(() => import("./pages/SimulateurComparateurPage"));
const SimulateurAmortissementPage = lazy(() => import("./pages/SimulateurAmortissementPage"));
const SimulateurCashflowPage = lazy(() => import("./pages/SimulateurCashflowPage"));
const SimulateurSalairePage = lazy(() => import("./pages/SimulateurSalairePage"));
const AcademyPage = lazy(() => import("./pages/AcademyPage"));
const ProfilPage = lazy(() => import("./pages/ProfilPage"));
const MarchesPage = lazy(() => import("./pages/MarchesPage"));
const InvestissementsPage = lazy(() => import("./pages/InvestissementsPage"));
const InvestissementsLocatifPage = lazy(() => import("./pages/InvestissementsLocatifPage"));
const MarchesFinanciersPage = lazy(() => import("./pages/MarchesFinanciersPage"));
const WatchlistPortefeuillePage = lazy(() => import("./pages/WatchlistPortefeuillePage"));
const QuittancesModulePage = lazy(() => import("./pages/QuittancesModulePage"));
const RessourcesPage = lazy(() => import("./pages/RessourcesPage"));
const ProjectionsPage = lazy(() => import("./pages/ProjectionsPage"));
const BonusPage = lazy(() => import("./pages/BonusPage"));
const BonusDetailPage = lazy(() => import("./pages/BonusDetailPage"));
const LeaderboardPage = lazy(() => import("./pages/LeaderboardPage"));
const PremiumPage = lazy(() => import("./pages/PremiumPage"));
const LegalPage = lazy(() => import("./pages/LegalPage"));
const SsoPage = lazy(() => import("./pages/SsoPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
    <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/sso" element={<SsoPage />} />
                  <Route path="/legal" element={<LegalPage />} />
                  <Route path="/onboarding" element={<OnboardingPage />} />
                  <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/budget" element={<BudgetPage />} />
                    <Route path="/projets" element={<ProjetsPage />} />
                    <Route path="/patrimoine" element={<PatrimoinePage />} />
                    <Route path="/simulateurs" element={<SimulateursPage />} />
                    <Route path="/simulateurs/credit" element={<SimulateurCreditPage />} />
                    <Route path="/simulateurs/epargne" element={<SimulateurEpargnePage />} />
                    <Route path="/simulateurs/fire" element={<SimulateurFirePage />} />
                    <Route path="/simulateurs/impot-revenu" element={<SimulateurIRPage />} />
                    <Route path="/simulateurs/flat-tax" element={<SimulateurFlatTaxPage />} />
                    <Route path="/simulateurs/frais-notaire" element={<SimulateurFraisNotairePage />} />
                    <Route path="/simulateurs/impot-suisse" element={<SimulateurImpotCHPage />} />
                    <Route path="/simulateurs/troisieme-pilier" element={<SimulateurTroisiemePilierPage />} />
                    <Route path="/simulateurs/hypotheque-suisse" element={<SimulateurHypothequeCHPage />} />
                    <Route path="/simulateurs/comparateur" element={<SimulateurComparateurPage />} />
                    <Route path="/simulateurs/amortissement" element={<SimulateurAmortissementPage />} />
                    <Route path="/simulateurs/cashflow" element={<SimulateurCashflowPage />} />
                    <Route path="/simulateurs/salaire" element={<SimulateurSalairePage />} />
                    <Route path="/marches" element={<MarchesPage />} />
                    <Route path="/investissements" element={<InvestissementsPage />} />
                    <Route path="/investissements/immobilier" element={<InvestissementsLocatifPage />} />
                    <Route path="/investissements/immobilier/cashflow" element={<SimulateurCashflowPage />} />
                    <Route path="/investissements/immobilier/quittances" element={<QuittancesModulePage />} />
                    <Route path="/investissements/marches" element={<MarchesFinanciersPage />} />
                    <Route path="/investissements/watchlist-portefeuille" element={<WatchlistPortefeuillePage />} />
                    <Route path="/ressources" element={<RessourcesPage />} />
                    <Route path="/projections" element={<ProjectionsPage />} />
                    <Route path="/bonus" element={<BonusPage />} />
                    <Route path="/bonus/:slug" element={<BonusDetailPage />} />
                    <Route path="/leaderboard" element={<LeaderboardPage />} />
                    <Route path="/premium" element={<PremiumPage />} />
                    <Route path="/academy" element={<AcademyPage />} />
                    <Route path="/profil" element={<ProfilPage />} />
                    <Route path="/admin" element={<AdminPage />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              <CookieConsent />
            </ErrorBoundary>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
  </ThemeProvider>
);

export default App;
