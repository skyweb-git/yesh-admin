import { useState, useEffect } from 'react';
import { BookOpen, X, Check } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

interface ChangeCourseModalProps {
  userEmail: string;
  userName: string;
  currentCourse: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const ChangeCourseModal = ({ userEmail, userName, currentCourse, onClose, onSuccess }: ChangeCourseModalProps) => {
  const [courseName, setCourseName] = useState(currentCourse || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/courses`)
      .then(res => res.json())
      .then(data => setCourses(data))
      .catch(err => console.error('Error fetching courses:', err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${encodeURIComponent(userEmail)}?role=student`, {

        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseName })
      });

      if (!response.ok) {
        throw new Error('Failed to update course name');
      }

      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while updating the course name.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Change Course</h3>
              <p className="text-xs text-gray-500">For {userName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">New Course Name</label>
            <select 
              required
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-500 text-gray-900 bg-white"
            >
              <option value="" disabled>Select a course...</option>
              {courses.map(course => (
                <option key={course._id} value={course.title}>{course.title}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors shadow-md disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? 'Saving...' : <><Check className="w-4 h-4" /> Save Course</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
