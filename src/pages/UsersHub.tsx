import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { StudentsManagement } from './StudentsManagement';
import { ParentsManagement } from './ParentsManagement';
import { GraduationCap, Users } from 'lucide-react';

export const UsersHub = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') || 'students';
  const [activeTab, setActiveTab] = useState<'students' | 'parents'>(
    tabFromUrl === 'parents' ? 'parents' : 'students'
  );

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'parents' || tab === 'students') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tab: 'students' | 'parents') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header & Tab Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5">Manage student enrollments, parent profiles, and account linking</p>
        </div>

        <div className="grid grid-cols-2 sm:flex items-center gap-1.5 sm:gap-2 bg-gray-100 p-1.5 rounded-xl border border-gray-200 w-full sm:w-auto">
          <button
            onClick={() => handleTabChange('students')}
            className={`flex items-center justify-center gap-2 px-3 sm:px-5 py-2.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
              activeTab === 'students'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Students</span>
          </button>

          <button
            onClick={() => handleTabChange('parents')}
            className={`flex items-center justify-center gap-2 px-3 sm:px-5 py-2.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
              activeTab === 'parents'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Parents</span>
          </button>
        </div>
      </div>

      {/* Active Tab View */}
      {activeTab === 'students' ? <StudentsManagement /> : <ParentsManagement />}
    </div>
  );
};
