import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { api } from '~/lib/api';
import { useAuth } from '~/components/AuthContext';

export const Route = createFileRoute('/board/submit')({
  component: SubmitComponent,
});

function SubmitComponent() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthLoading && !user) {
      navigate({ to: '/login' });
    }
  }, [user, isAuthLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await api.createFeatureRequest(title, description);
      navigate({ to: '/board/$id', params: { id: res.id } });
    } catch (err: any) {
      setError(err.message || 'Failed to submit request');
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthLoading) {
    return null;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-12">
      <nav className="mb-8">
        <Link to="/board" className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
          &larr; Back to board
        </Link>
      </nav>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
            Submit a Feature Request
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Tell us what you'd like to see in Shipwright. We review every submission.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-semibold text-gray-900 dark:text-white">
                Title
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  name="title"
                  id="title"
                  required
                  maxLength={120}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Add dark mode support"
                  className="block w-full rounded-xl border-0 py-3 text-gray-900 dark:bg-gray-800 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">Maximum 120 characters.</p>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-gray-900 dark:text-white">
                Description
              </label>
              <div className="mt-2">
                <textarea
                  id="description"
                  name="description"
                  rows={6}
                  required
                  maxLength={2000}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the feature and how it would benefit users..."
                  className="block w-full rounded-xl border-0 py-3 text-gray-900 dark:bg-gray-800 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">Maximum 2000 characters.</p>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4 text-sm text-red-700 dark:text-red-200">
                {error}
              </div>
            )}

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-indigo-600 px-6 py-4 text-center text-base font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
