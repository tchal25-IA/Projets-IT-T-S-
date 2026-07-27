import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { lovable } from '@/integrations/lovable';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signUp, signIn } = useAuth();
  const [isLogin, setIsLogin] = useState(searchParams.get('mode') === 'login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const validRegister = /^[a-zA-Z0-9_]{3,20}$/.test(username) && password.length >= 8 && password === confirm && acceptedTerms;
  const validLogin = username.length >= 3 && password.length >= 6;
  const valid = isLogin ? validLogin : validRegister;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setLoading(true);

    if (isLogin) {
      const { error } = await signIn(username, password);
      setLoading(false);
      if (error) {
        toast.error('Identifiants incorrects');
        return;
      }
      navigate('/dashboard');
    } else {
      const { error } = await signUp(username, password);
      setLoading(false);
      if (error) {
        if (error.includes('already registered')) {
          toast.error('Ce nom d\'utilisateur est déjà pris');
        } else {
          toast.error(error);
        }
        return;
      }
      toast.success('Compte créé ! 🎉');
      navigate('/onboarding');
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setLoading(false);
      toast.error("Connexion Google impossible");
      return;
    }
    if (result.redirected) return;
    navigate('/dashboard');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Link to="/" className="text-2xl font-bold gradient-text">Finzy</Link>
          <h1 className="mt-4 text-xl font-bold">{isLogin ? 'Se connecter' : 'Créer mon compte'}</h1>
        </div>

        <div className="space-y-3">
          <Button type="button" variant="outline" className="w-full gap-2" onClick={handleGoogle} disabled={loading}>
            <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continuer avec Google
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">ou</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="username">Nom d'utilisateur</Label>
            <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ex: thomas_42" />
            {!isLogin && <p className="mt-1 text-xs text-muted-foreground">3-20 caractères, lettres, chiffres et _</p>}
          </div>
          <div>
            <Label htmlFor="password">Mot de passe</Label>
            <div className="relative">
              <Input id="password" type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2 top-2.5 text-muted-foreground">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {!isLogin && <p className="mt-1 text-xs text-muted-foreground">Au moins 8 caractères.</p>}
          </div>
          {!isLogin && (
            <div>
              <Label htmlFor="confirm">Confirmer le mot de passe</Label>
              <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
          )}

          {!isLogin && (
            <div className="rounded-lg border bg-muted/50 p-3 text-xs text-muted-foreground">
              💡 Pas besoin d'email pour commencer ! Tu pourras en ajouter un dans ton profil.
            </div>
          )}

          {!isLogin && (
            <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-input accent-primary"
              />
              <span>
                J'ai lu et j'accepte les{' '}
                <Link to="/legal" target="_blank" className="text-primary underline">CGU</Link> et la{' '}
                <Link to="/legal" target="_blank" className="text-primary underline">politique de confidentialité</Link>.
              </span>
            </label>
          )}

          <Button type="submit" className="w-full" disabled={!valid || loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLogin ? 'Se connecter' : 'Créer mon compte'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? 'Pas de compte ? ' : 'Déjà un compte ? '}
            <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-primary hover:underline">
              {isLogin ? 'Créer un compte' : 'Se connecter'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
