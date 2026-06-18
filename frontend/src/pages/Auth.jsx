import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../api';
import { useAuthStore } from '../store';
import { Loader2 } from 'lucide-react';

export default function Auth() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const fn = mode === 'login' ? auth.login : auth.signup;
      const { data } = await fn(form);
      setAuth({ token: data.token, user: data.user, company: data.company });
      if (data.needs_onboarding) navigate('/onboarding');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:'#F26522'}}>
          <span className="text-white font-bold text-lg">M</span>
        </div>
        <span className="font-bold text-gray-900 text-xl">MONFLUX</span>
      </div>

      <div className="card w-full max-w-sm">
        <h1 className="text-lg font-semibold text-gray-900 mb-1">
          {mode === 'login' ? 'Connexion' : 'Créer un compte'}
        </h1>
        <p className="text-sm text-gray-500 mb-5">
          {mode === 'login' ? 'Bon retour.' : 'Commençons avec votre entreprise.'}
        </p>

        <form onSubmit={submit} className="space-y-3">
          {mode === 'signup' && (
            <div>
              <label className="label">Votre nom</label>
              <input className="input" placeholder="Jean Tremblay" value={form.name} onChange={set('name')} />
            </div>
          )}
          <div>
            <label className="label">Courriel</label>
            <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
          </div>
          <div>
            <label className="label">Mot de passe</label>
            <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} required minLength={8} />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
            {loading ? <Loader2 size={15} className="animate-spin" /> : null}
            {mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-gray-100 text-center">
          <button
            className="text-sm text-gray-500 hover:text-brand"
            onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setError(''); }}
          >
            {mode === 'login' ? "Pas de compte ? Créer un compte" : 'Déjà un compte ? Se connecter'}
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-6">Gestion de chantier propulsée par l'IA · Québec</p>
    </div>
  );
}
