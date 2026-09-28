import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, BarChart, Users, LogOut, BookOpen, GraduationCap, CreditCard, LayoutDashboard, Menu, X } from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, to, onClick }: { icon: any, label: string, to: string, onClick?: () => void }) => {
  const location = useLocation();
  const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
  
  return (
    <Link 
      to={to}
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        active 
          ? 'bg-red-600 text-white shadow-md font-bold' 
          : 'text-gray-400 hover:bg-gray-800 hover:text-red-400 font-medium'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="text-sm">{label}</span>
    </Link>
  );
};

export const AdminLayout = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isLoggedIn = localStorage.getItem('isAdminLoggedIn') === 'true' || !!localStorage.getItem('adminToken');

  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  if (!isLoggedIn) {
    return null;
  }

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };
  
  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Mobile Slide-over Drawer Backdrop */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Mobile Slide-over Navigation Drawer */}
      <aside className={`fixed inset-y-0 left-0 w-72 bg-gray-950 text-white z-50 flex flex-col transition-transform duration-300 ease-in-out lg:hidden ${
        mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      }`}>
        <div className="p-5 flex items-center justify-between border-b border-gray-800/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              Yash<span className="text-red-500">Edu</span>
              <span className="text-[10px] ml-1 text-gray-500 font-normal border border-gray-700 px-1.5 py-0.5 rounded">Admin</span>
            </span>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <nav className="flex flex-col gap-1.5">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 px-3">Dashboard</p>
            <SidebarItem icon={BarChart} label="Analytics Overview" to="/" onClick={() => setMobileMenuOpen(false)} />
            
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 mt-4 px-3">Management Hubs</p>
            <SidebarItem icon={Users} label="User Management" to="/users" onClick={() => setMobileMenuOpen(false)} />
            <SidebarItem icon={GraduationCap} label="Academic Modules" to="/academics" onClick={() => setMobileMenuOpen(false)} />
            <SidebarItem icon={CreditCard} label="Fee Payments" to="/fees" onClick={() => setMobileMenuOpen(false)} />
            <SidebarItem icon={BookOpen} label="Content & CMS" to="/cms" onClick={() => setMobileMenuOpen(false)} />
          </nav>
        </div>

        <div className="p-4 border-t border-gray-800/80 mt-auto">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-colors cursor-pointer text-sm font-semibold"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside className="w-64 bg-gray-950 text-white hidden lg:flex flex-col h-screen sticky top-0 overflow-y-auto pb-4">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Yash<span className="text-red-500">Edu</span>
              <span className="text-xs ml-1 text-gray-500 font-normal border border-gray-700 px-1.5 py-0.5 rounded">Admin</span>
            </span>
          </div>
          
          <div className="h-[calc(100vh-200px)] overflow-y-auto pr-2 custom-scrollbar">
            <nav className="flex flex-col gap-1.5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 mt-2 px-4">Dashboard</p>
              <SidebarItem icon={BarChart} label="Analytics Overview" to="/" />
              
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 mt-5 px-4">Management Hubs</p>
              <SidebarItem icon={Users} label="User Management" to="/users" />
              <SidebarItem icon={GraduationCap} label="Academic Modules" to="/academics" />
              <SidebarItem icon={CreditCard} label="Fee Payments" to="/fees" />
              <SidebarItem icon={BookOpen} label="Content & CMS" to="/cms" />
            </nav>
          </div>
        </div>
        
        <div className="mt-auto p-4">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-xs sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-base sm:text-xl font-bold text-gray-800 truncate">YashEdu Control Center</h1>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold text-gray-500 bg-gray-100 px-2.5 sm:px-3 py-1.5 rounded-full border border-gray-200 shrink-0">
            <LayoutDashboard className="w-3.5 h-3.5 text-red-600" />
            <span>Admin Console</span>
          </div>
        </header>

        <div className="p-3.5 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
