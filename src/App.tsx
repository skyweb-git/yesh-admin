import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AdminLayout } from './layouts/AdminLayout';
import { Dashboard } from './pages/Dashboard';
import { UsersHub } from './pages/UsersHub';
import { AcademicsHub } from './pages/AcademicsHub';
import { CmsHub } from './pages/CmsHub';
import { FeesManagement } from './pages/FeesManagement';
import { Login } from './pages/Login';

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />
  },
  {
    path: "/",
    element: <AdminLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      
      // Standalone & Merged Hub Routes
      { path: "users", element: <UsersHub /> },
      { path: "academics", element: <AcademicsHub /> },
      { path: "fees", element: <FeesManagement /> },
      { path: "cms", element: <CmsHub /> },

      // Legacy Route Redirects
      { path: "students", element: <Navigate to="/users?tab=students" replace /> },
      { path: "parents", element: <Navigate to="/users?tab=parents" replace /> },
      
      { path: "attendance", element: <Navigate to="/academics?tab=attendance" replace /> },
      { path: "assignments", element: <Navigate to="/academics?tab=assignments" replace /> },
      { path: "practice-tests", element: <Navigate to="/academics?tab=tests" replace /> },
      { path: "messages", element: <Navigate to="/academics?tab=messages" replace /> },

      { path: "courses", element: <Navigate to="/cms?tab=courses" replace /> },
      { path: "trending-courses", element: <Navigate to="/cms?tab=trending" replace /> },
      { path: "home-learning", element: <Navigate to="/cms?tab=story" replace /> },
      { path: "blogs", element: <Navigate to="/cms?tab=blogs" replace /> },
      { path: "about-us", element: <Navigate to="/cms?tab=about" replace /> },
      { path: "queries", element: <Navigate to="/cms?tab=queries" replace /> },

      { path: "*", element: <Navigate to="/" replace /> }
    ]
  }
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
