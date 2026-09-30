import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import { LanguageProvider } from './context/LanguageContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Pages
import { HomePage } from './pages/HomePage';
import { ReportPage } from './pages/ReportPage';
import { ReportsListPage } from './pages/ReportsListPage';
import { ReportDetailPage } from './pages/ReportDetailPage';
import { PublicMapPage } from './pages/PublicMapPage';
import { UserDashboardPage } from './pages/UserDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminReportsPage } from './pages/AdminReportsPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

function parseCurrentRoute(): { path: string; param?: string } {
  // Check hash first (e.g. #/reports/REP-2026-00101) or pathname
  const hash = window.location.hash.replace(/^#/, '');
  const raw = hash || window.location.pathname || '/';

  // Extract path and possible sub-path param
  const clean = raw.split('?')[0];

  if (clean.startsWith('/reports/')) {
    const id = clean.replace('/reports/', '');
    return { path: '/reports/:id', param: id };
  }

  return { path: clean || '/' };
}

export function AppContent() {
  const [route, setRoute] = useState(parseCurrentRoute());

  useEffect(() => {
    const handleLocationChange = () => {
      setRoute(parseCurrentRoute());
      window.scrollTo(0, 0);
    };

    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);

    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  const navigate = (newPath: string) => {
    window.location.hash = newPath;
  };

  const renderPage = () => {
    switch (route.path) {
      case '/':
        return <HomePage navigate={navigate} />;
      case '/report':
        return <ReportPage navigate={navigate} />;
      case '/reports':
        return <ReportsListPage navigate={navigate} />;
      case '/reports/:id':
        return <ReportDetailPage id={route.param || ''} navigate={navigate} />;
      case '/map':
        return <PublicMapPage navigate={navigate} />;
      case '/dashboard':
        return <UserDashboardPage navigate={navigate} />;
      case '/admin':
        return <AdminDashboardPage navigate={navigate} />;
      case '/admin/reports':
        return <AdminReportsPage navigate={navigate} />;
      case '/login':
        return <LoginPage navigate={navigate} />;
      case '/register':
        return <RegisterPage navigate={navigate} />;
      default:
        return <HomePage navigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar currentPath={route.path} navigate={navigate} />
      <main className="flex-1">{renderPage()}</main>
      <Footer navigate={navigate} />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
