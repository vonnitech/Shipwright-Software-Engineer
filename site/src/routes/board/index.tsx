import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { type FeatureRequest, api } from '~/lib/api';
import { useAuth } from '~/components/AuthContext';

export const Route = createFileRoute('/board/')({
  component: BoardComponent,
});

function BoardComponent() {
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const data = await api.getFeatureRequests();
      setRequests(data.items);
    } catch (err: any) {
      setError(err.message || 'Failed to load feature requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleVote = async (id: string) => {
    if (!user) {
      alert('Please log in to vote');
      return;
    }
    try {
      const { vote_count, has_voted } = await api.toggleVote(id);
      setRequests(prev => prev.map(req => 
        req.id === id ? { ...req, vote_count, has_voted } : req
      ));
    } catch (err: any) {
      alert(err.message || 'Failed to vote');
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="min-w-0 flex-1">
          <h2 className="text-3xl font-bold leading-7 text-gray-900 sm:truncate sm:text-4xl dark:text-white tracking-tight">
            Feature Requests
          </h2>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            Vote on your favorite ideas or submit a new one.
          </p>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <Link
            to="/board/submit"
            className="inline-flex items-center rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-all"
          >
            Submit Request
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4 mb-8">
          <div className="text-sm text-red-700 dark:text-red-200">{error}</div>
        </div>
      )}

      <div className="grid gap-6">
        {requests.length === 0 ? (
          <div className="text-center py-24 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
            <p className="text-gray-500">No feature requests yet. Be the first to submit one!</p>
          </div>
        ) : (
          requests.map((request) => (
            <div key={request.id} className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex gap-6 items-start hover:border-indigo-200 dark:hover:border-indigo-900 transition-colors">
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={() => handleVote(request.id)}
                  className={`flex flex-col items-center justify-center h-16 w-14 rounded-xl border transition-all ${
                    request.has_voted
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-400'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-indigo-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'
                  }`}
                >
                  <span className="text-lg">▲</span>
                  <span className="font-bold">{request.vote_count}</span>
                </button>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Link to="/board/$id" params={{ id: request.id }} className="text-xl font-bold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    {request.title}
                  </Link>
                  <StatusBadge status={request.status} />
                </div>
                <p className="text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
                  {request.description}
                </p>
                <div className="text-sm text-gray-500">
                  Submitted on {new Date(request.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))
        )}
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
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles[status] || styles.open}`}>
      {status.replace('-', ' ')}
    </span>
  );
}
