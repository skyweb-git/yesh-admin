import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

export const HomeworkManagement = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/users?role=student`)

      .then(res => res.json())
      .then(data => {
        setStudents(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Homework & Assignment Tracking</h2>
          <p className="text-sm text-gray-500">View and assign homework tasks for enrolled students</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-900">Assigned Homework Status</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-6 py-4 font-bold">Student Name</th>
                <th className="px-6 py-4 font-bold">Student ID</th>
                <th className="px-6 py-4 font-bold">Pending Tasks</th>
                <th className="px-6 py-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={4} className="p-6 text-center text-gray-500">Loading homework assignments...</td></tr>
              ) : students.length > 0 ? (
                students.map((st) => (
                  <tr key={st._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-bold text-gray-900">{st.fullName}</td>
                    <td className="px-6 py-4 font-mono text-red-600 font-bold">{st.studentId || 'N/A'}</td>
                    <td className="px-6 py-4 text-xs font-medium text-gray-700">Mathematics & Physics Exercises</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full font-bold text-xs">2 Due Soon</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={4} className="p-6 text-center text-gray-500">No student homework data found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
