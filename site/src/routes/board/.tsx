import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { type FeatureRequest, api } from '~/lib/api';
import { useAuth } from '~/components/AuthContext';

export const Route = createFileRoute('/board/$id')({
  component: RequestDetailComponent,
});

function RequestDetailComponent() {
  const { id } = Route.useParams();
  const [request, setRequest] = useState<FeatureRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        setIsLoading(true);
        const data = await api.getFeatureRequest(id);
        setRequest(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load feature request');
      } finally {
        setIsLoading(false);
      }
    };
    fetchRequest();
  }, [id]);

  const handleVote = async () => {
    if (!user) {
      alert('Please log in to vote');
      return;
    }
    if (!request) return;
    try {
      const { vote_count, has_voted } = await api.toggleVote(request.id);
      setRequest(prev => prev ? { ...prev, vote_count, has_voted } : null);
    } catch (err: any) {
      alert(err.message || 'Failed to vote');
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4">
          <div className="text-sm text-red-700 dark:text-red-200">{error || 'Request not found'}</div>
        </div>
        <div className="mt-4">
          <Link to="/board" className="text-indigo-600 hover:text-indigo-500 font-medium">
            &larr; Back to board
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
      <nav className="mb-8">
        <Link to="/board" className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
          &larr; Back to board
        </Link>
      </nav>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <StatusBadge status={request.status} />
                <span className="text-sm text-gray-500">
                  ID: {request.id.slice(0, 8)}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                {request.title}
              </h1>
            </div>
            <button
              onClick={handleVote}
              className={`flex flex-col items-center justify-center h-20 w-16 rounded-2xl border transition-all ${
                request.has_voted
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-400'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-indigo-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'
              }`}
            >
              <span className="text-xl">▲</span>
              <span className="text-lg font-bold">{request.vote_count}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider">Vote</span>
            </button>
          </div>

          <div className="prose dark:prose-invert max-w-none mb-8">
            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
              {request.description}
            </p>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 pt-6 mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm text-gray-500">
            <div>
              Submitted on {new Date(request.created_at).toLocaleDateString()} at {new Date(request.created_at).toLocaleTimeString()}
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500"></span>
              Updated {new Date(request.updated_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    open: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'under-review': 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    planned: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    'in-progress': 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    done: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    declined: 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  };

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${styles[status] || styles.open}`}>
      {status.replace('-', ' ')}
    </span>
  );
}
