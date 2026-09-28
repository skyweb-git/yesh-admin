import { useState, useEffect } from 'react';
import { Trash2, Mail, Phone, Clock } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

export const QueriesManagement = () => {
  const [queries, setQueries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQueries = () => {
    fetch(`${API_BASE_URL}/api/contact`)
      .then(res => res.json())
      .then(data => {
        setQueries(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching queries:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchQueries();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this query?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/contact/${id}`, { method: 'DELETE' });

      if (res.ok) fetchQueries();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Queries & Contacts Management</h2>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 font-medium text-gray-600">User Details</th>
                <th className="px-6 py-4 font-medium text-gray-600">Subject</th>
                <th className="px-6 py-4 font-medium text-gray-600">Message</th>
                <th className="px-6 py-4 font-medium text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={4} className="p-6 text-center text-gray-500">Loading queries...</td></tr>
              ) : queries.length > 0 ? (
                queries.map(query => (
                  <tr key={query._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{query.firstName} {query.lastName}</p>
                      <div className="flex flex-col gap-1 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3"/> {query.email}</span>
                        {query.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3"/> {query.phone}</span>}
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {new Date(query.createdAt).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800">
                      <span className="bg-red-50 text-[var(--color-primary)] px-2 py-1 rounded text-xs font-semibold">
                        {query.subject}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm max-w-xs truncate" title={query.message}>
                      {query.message}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => handleDelete(query._id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Delete Query">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={4} className="p-6 text-center text-gray-500">No queries found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
