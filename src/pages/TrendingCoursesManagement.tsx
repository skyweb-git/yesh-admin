import { useState, useEffect } from 'react';
import { Trash2, Edit, Plus, X } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

export const TrendingCoursesManagement = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddExisting, setShowAddExisting] = useState(false);
  const [selectedCourseToAdd, setSelectedCourseToAdd] = useState('');

  const fetchCourses = () => {
    fetch(`${API_BASE_URL}/api/courses`)
      .then(res => res.json())
      .then(data => {
        setCourses(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching courses:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const trendingCourses = courses.filter(c => c.isTrending);
  const nonTrendingCourses = courses.filter(c => !c.isTrending);

  const handleToggleTrending = async (course: any, isTrending: boolean) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/courses/${course._id}`, {

        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...course, isTrending })
      });
      
      if (res.ok) {
        setShowAddExisting(false);
        setSelectedCourseToAdd('');
        fetchCourses();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddExisting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseToAdd) return;
    const course = courses.find(c => c._id === selectedCourseToAdd);
    if (course) {
      handleToggleTrending(course, true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Trending Courses</h2>
        <button 
          onClick={() => setShowAddExisting(!showAddExisting)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          {showAddExisting ? <><X className="w-4 h-4"/> Cancel</> : <><Plus className="w-4 h-4"/> Add Existing Course</>}
        </button>
      </div>

      {showAddExisting && (
        <form onSubmit={handleAddExisting} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4 flex flex-col md:flex-row items-end gap-4">
          <div className="flex flex-col gap-1 flex-1 w-full">
            <label className="text-sm text-gray-600 font-medium">Select a Course to mark as Trending</label>
            <select
              required
              className="border p-2 rounded-lg outline-none focus:ring-2 focus:ring-red-500 text-gray-900 bg-white w-full"
              value={selectedCourseToAdd}
              onChange={e => setSelectedCourseToAdd(e.target.value)}
            >
              <option value="" disabled>Select a Course</option>
              {nonTrendingCourses.length > 0 ? (
                nonTrendingCourses.map(c => (
                  <option key={c._id} value={c._id}>{c.title} ({c.subject})</option>
                ))
              ) : (
                <option value="" disabled>No more courses available to add.</option>
              )}
            </select>
          </div>
          <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors whitespace-nowrap">
            Add to Trending
          </button>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 font-medium text-gray-600">Course</th>
                <th className="px-6 py-4 font-medium text-gray-600">Subject</th>
                <th className="px-6 py-4 font-medium text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={3} className="p-6 text-center text-gray-500">Loading courses...</td></tr>
              ) : trendingCourses.length > 0 ? (
                trendingCourses.map(course => (
                  <tr key={course._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <img src={course.image} alt="" style={{ width: '48px', height: '48px', minWidth: '48px' }} className="rounded-lg object-cover" />
                        <div>
                          <p className="font-medium text-gray-900">{course.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{course.location || course.duration} • {course.students} students</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-red-50 text-red-700 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
                        {course.subject || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => handleToggleTrending(course, false)} className="text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors font-medium text-sm border border-red-100" title="Remove from Trending">
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={3} className="p-6 text-center text-gray-500">No trending courses found. Add one above!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
