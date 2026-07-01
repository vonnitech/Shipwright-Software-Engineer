import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { type FeatureRequest, api, type FeatureRequestStatus } from '~/lib/api';
import { useAuth } from '~/components/AuthContext';

export const Route = createFileRoute('/admin')({
  component: AdminComponent,
});

function AdminComponent() {
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthLoading && (!user || user.role !== 'admin')) {
      navigate({ to: '/' });
    }
  }, [user, isAuthLoading, navigate]);

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
    if (user?.role === 'admin') {
      fetchRequests();
    }
  }, [user]);

  const handleStatusChange = async (id: string, status: FeatureRequestStatus) => {
    try {
      await api.updateFeatureRequest(id, { status });
      setRequests(prev => prev.map(req => 
        req.id === id ? { ...req, status } : req
      ));
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  if (isAuthLoading || isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="sm:flex sm:items-center mb-8">
        <div className="sm:flex-auto">
          <h1 className="text-3xl font-bold leading-6 text-gray-900 dark:text-white tracking-tight">Admin Dashboard</h1>
          <p className="mt-4 text-sm text-gray-700 dark:text-gray-400">
            Manage feature requests, review submissions, and update implementation status.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4 mb-8 text-sm text-red-700 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
              <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-800">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">Title</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Votes</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {requests.map((request) => (
                    <tr key={request.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                        <div className="font-medium text-gray-900 dark:text-white">{request.title}</div>
                        <div className="text-gray-500 dark:text-gray-400 truncate max-w-xs">{request.description}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {request.vote_count}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <StatusBadge status={request.status} />
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <select
                          value={request.status}
                          onChange={(e) => handleStatusChange(request.id, e.target.value as FeatureRequestStatus)}
                          className="rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white text-xs"
                        >
                          <option value="open">Open</option>
                          <option value="under-review">Under Review</option>
                          <option value="planned">Planned</option>
                          <option value="in-progress">In Progress</option>
                          <option value="done">Done</option>
                          <option value="declined">Declined</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${styles[status] || styles.open}`}>
      {status.replace('-', ' ')}
    </span>
  );
}
