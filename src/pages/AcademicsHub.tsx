import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AcademicsManagement } from './AcademicsManagement';
import { AttendanceManagement } from './AttendanceManagement';
import { AssignmentsManagement } from './AssignmentsManagement';
import { PracticeTestsManagement } from './PracticeTestsManagement';
import { TeacherMessagesManagement } from './TeacherMessagesManagement';
import { FileText, Calendar, CheckSquare, MessageSquare, Award } from 'lucide-react';

export const AcademicsHub = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') || 'reports';
  const [activeTab, setActiveTab] = useState(tabFromUrl);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const tabs = [
    { id: 'reports', label: 'Academics & Reports', icon: FileText, component: AcademicsManagement },
    { id: 'attendance', label: 'Attendance', icon: Calendar, component: AttendanceManagement },
    { id: 'assignments', label: 'Assignments', icon: Award, component: AssignmentsManagement },
    { id: 'tests', label: 'Practice Tests', icon: CheckSquare, component: PracticeTestsManagement },
    { id: 'messages', label: 'Message Parent', icon: MessageSquare, component: TeacherMessagesManagement },
  ];

  const ActiveComponent = tabs.find(t => t.id === activeTab)?.component || AcademicsManagement;

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Academic Modules</h2>
          <p className="text-gray-500 text-sm mt-0.5">Manage student performance, attendance tracking, test series, fees & parent communications</p>
        </div>

        {/* Tab Navigation Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 bg-gray-100 rounded-xl border border-gray-200 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-xs transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Tab View */}
      <ActiveComponent />
    </div>
  );
};
