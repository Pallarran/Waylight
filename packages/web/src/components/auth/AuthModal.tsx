import { useState } from 'react';
import { X, Mail, Lock, User, Loader2 } from 'lucide-react';
import { authService } from '@waylight/shared';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMode = 'signin' | 'signup';

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    confirmPassword: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'signup') {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }
        if (formData.password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        await authService.signUp(formData.email, formData.password, formData.fullName);
        // Note: User will need to confirm email before they can sign in
        setError('Please check your email to confirm your account');
      } else {
        await authService.signIn(formData.email, formData.password);
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-dark">
          <h2 className="text-xl font-display font-bold text-ink">
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-ink-light hover:text-ink transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-ink-light mb-6">
            {mode === 'signin' 
              ? 'Sign in to sync your trips across devices' 
              : 'Create an account to save your trips to the cloud'
            }
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-ink mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-ink-light" />
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={handleInputChange('fullName')}
                    className="w-full pl-10 pr-4 py-2 border border-surface-dark rounded-lg focus:ring-2 focus:ring-sea focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-ink-light" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-surface-dark rounded-lg focus:ring-2 focus:ring-sea focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-ink-light" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-2 border border-surface-dark rounded-lg focus:ring-2 focus:ring-sea focus:border-transparent"
                  placeholder={mode === 'signin' ? 'Enter your password' : 'At least 6 characters'}
                />
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-ink mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-ink-light" />
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange('confirmPassword')}
                    required
                    minLength={6}
                    className="w-full pl-10 pr-4 py-2 border border-surface-dark rounded-lg focus:ring-2 focus:ring-sea focus:border-transparent"
                    placeholder="Confirm your password"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sea text-white py-2 px-4 rounded-lg font-medium hover:bg-sea-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Switch mode */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setError(null);
                setFormData({ email: '', password: '', fullName: '', confirmPassword: '' });
              }}
              className="text-sea hover:text-sea-dark transition-colors text-sm"
            >
              {mode === 'signin' 
                ? "Don't have an account? Create one" 
                : 'Already have an account? Sign in'
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}