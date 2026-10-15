import { useEffect, useState } from 'react';
import { getStudentPageTitle, getStudentTabPath, parseAppRoute } from './studentRoutes';

type AppNavigationOptions = {
  userSlug?: string;
  setActivePageSlug: (slug: string | null) => void;
  setActivePostSlug: (slug: string | null) => void;
};

/** Owns browser route state, history integration, and page-title updates. */
export function useAppNavigation({
  userSlug,
  setActivePageSlug,
  setActivePostSlug,
}: AppNavigationOptions) {
  const initialRoute = parseAppRoute();
  const [currentRoute, setCurrentRoute] = useState<'student' | 'admin'>(initialRoute.route);
  const [studentActiveTab, setStudentActiveTabState] = useState<string>(initialRoute.tab);

  const setStudentActiveTab = (tab: string) => {
    setActivePageSlug(null);
    setStudentActiveTabState(tab);
    setCurrentRoute('student');
    const targetPath = getStudentTabPath(tab, userSlug);
    if (window.location.pathname !== targetPath) {
      try {
        window.history.pushState({}, '', targetPath);
      } catch {
        window.location.hash = `#${targetPath}`;
      }
    }
    document.title = getStudentPageTitle(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleLocationChange = () => {
      const { route, tab, pageSlug, postSlug } = parseAppRoute();
      setCurrentRoute(route);
      setStudentActiveTabState(tab);
      if (pageSlug) setActivePageSlug(pageSlug);
      if (postSlug) setActivePostSlug(postSlug);
      document.title = route === 'admin'
        ? 'Admin Portal & CMS | cgtest.in'
        : tab === 'student-tests'
          ? 'My Tests | cgtest.in'
          : getStudentPageTitle(tab);
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, [setActivePageSlug, setActivePostSlug]);

  const navigateToAdmin = () => {
    if (window.location.pathname !== '/admin') {
      try {
        window.history.pushState({}, '', '/admin');
      } catch {
        window.location.hash = '#/admin';
      }
    }
    document.title = 'Admin Portal & CMS | CGSSB Test';
    setCurrentRoute('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToStudent = () => setStudentActiveTab('tests');

  return {
    currentRoute,
    setCurrentRoute,
    studentActiveTab,
    setStudentActiveTab,
    navigateToAdmin,
    navigateToStudent,
  };
}
