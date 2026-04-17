import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Activity } from 'lucide-react';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Create user profile in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: userCredential.user.email,
        createdAt: Date.now()
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gb-surface px-4">
      <div className="w-full max-w-md space-y-8 p-8 bg-gb-bg border border-gb-line rounded-xl">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-gb-accent rounded-lg flex items-center justify-center mb-6">
            <Activity className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gb-text-primary">Create account</h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSignup}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gb-line placeholder-gb-text-secondary text-gb-text-primary bg-gb-surface focus:outline-none focus:ring-1 focus:ring-gb-accent focus:border-gb-accent sm:text-sm transition-colors"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gb-line placeholder-gb-text-secondary text-gb-text-primary bg-gb-surface focus:outline-none focus:ring-1 focus:ring-gb-accent focus:border-gb-accent sm:text-sm transition-colors"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-gb-danger text-sm">{error}</p>}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-gb-accent hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gb-accent disabled:opacity-50 transition-all"
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
          </div>
          <div className="text-sm text-center">
             <span className="text-gb-text-secondary">Already have an account? </span>
             <Link to="/login" className="font-semibold text-gb-accent hover:brightness-110">
               Sign in
             </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
