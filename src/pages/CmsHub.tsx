import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CoursesManagement } from './CoursesManagement';
import { TrendingCoursesManagement } from './TrendingCoursesManagement';
import { MangaLearningManagement } from './MangaLearningManagement';
import { BlogsManagement } from './BlogsManagement';
import { AboutUsManagement } from './AboutUsManagement';
import { QueriesManagement } from './QueriesManagement';
import { BookOpen, Star, Sparkles, FileText, Info, MessageSquare } from 'lucide-react';

export const CmsHub = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') || 'courses';
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
    { id: 'courses', label: 'All Courses', icon: BookOpen, component: CoursesManagement },
    { id: 'trending', label: 'Trending Courses', icon: Star, component: TrendingCoursesManagement },
    { id: 'story', label: 'Home Learning Story', icon: Sparkles, component: MangaLearningManagement },
    { id: 'blogs', label: 'Blogs & Articles', icon: FileText, component: BlogsManagement },
    { id: 'about', label: 'About Us Content', icon: Info, component: AboutUsManagement },
    { id: 'queries', label: 'Queries & Inquiries', icon: MessageSquare, component: QueriesManagement },
  ];

  const ActiveComponent = tabs.find(t => t.id === activeTab)?.component || CoursesManagement;

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Content & Website CMS</h2>
          <p className="text-gray-500 text-sm mt-0.5">Manage website content, course catalog, homepage sections, articles & student inquiries</p>
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
