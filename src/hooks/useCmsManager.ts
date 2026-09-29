import { useState, useEffect, useCallback } from 'react';
import {
  CMSPage,
  CMSPost,
  CMSTestSeriesPack,
  CMSSiteSettings
} from '../types/cms';
import {
  INITIAL_CMS_PAGES,
  INITIAL_CMS_POSTS,
  INITIAL_CMS_SERIES_PACKS,
  INITIAL_CMS_SETTINGS
} from '../defaultCmsData';
import { isDemoDataPurged } from '../utils/bundleStore';
import {
  fetchCmsPagesFromFirestore,
  saveCmsPageToFirestore,
  deleteCmsPageFromFirestore,
  subscribeToCmsPages,
  fetchCmsPostsFromFirestore,
  saveCmsPostToFirestore,
  deleteCmsPostFromFirestore,
  subscribeToCmsPosts,
  fetchCmsSeriesPacksFromFirestore,
  saveCmsSeriesPackToFirestore,
  deleteCmsSeriesPackFromFirestore,
  subscribeToCmsSeriesPacks,
  fetchCmsSettingsFromFirestore,
  saveCmsSettingsToFirestore,
  subscribeToCmsSettings
} from '../firebase/firestoreService';

export function useCmsManager() {
  const [cmsPages, setCmsPages] = useState<CMSPage[]>(() => {
    try {
      const saved = localStorage.getItem('cgssb_cms_pages');
      if (saved) {
        const parsed: CMSPage[] = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const [cmsPosts, setCmsPosts] = useState<CMSPost[]>(() => {
    try {
      const saved = localStorage.getItem('cgssb_cms_posts');
      if (saved) {
        const parsed: CMSPost[] = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const [cmsSeriesPacks, setCmsSeriesPacks] = useState<CMSTestSeriesPack[]>(() => {
    try {
      const saved = localStorage.getItem('cgssb_cms_series');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const [cmsSettings, setCmsSettings] = useState<CMSSiteSettings>(() => {
    try {
      const saved = localStorage.getItem('cgssb_cms_settings');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_CMS_SETTINGS;
  });

  // Real-time Cloud Firestore synchronization across all devices
  useEffect(() => {
    const unsubPages = subscribeToCmsPages((remotePages) => {
      if (remotePages.length > 0) {
        const pageMap = new Map<string, CMSPage>();
        INITIAL_CMS_PAGES.forEach(p => pageMap.set(p.id, p));
        remotePages.forEach(p => pageMap.set(p.id, p));
        const merged = Array.from(pageMap.values());
        setCmsPages(merged);
        try { localStorage.setItem('cgssb_cms_pages', JSON.stringify(merged)); } catch {}
      }
    });

    const unsubPosts = subscribeToCmsPosts((remotePosts) => {
      if (remotePosts.length > 0) {
        setCmsPosts(remotePosts);
        try { localStorage.setItem('cgssb_cms_posts', JSON.stringify(remotePosts)); } catch {}
      }
    });

    const unsubSeries = subscribeToCmsSeriesPacks((remoteSeries) => {
      if (remoteSeries.length > 0) {
        setCmsSeriesPacks(remoteSeries);
        try { localStorage.setItem('cgssb_cms_series', JSON.stringify(remoteSeries)); } catch {}
      }
    });

    const unsubSettings = subscribeToCmsSettings((remoteSettings) => {
      if (remoteSettings) {
        setCmsSettings(remoteSettings);
        try { localStorage.setItem('cgssb_cms_settings', JSON.stringify(remoteSettings)); } catch {}
      }
    });

    // Initial fetch fallbacks
    fetchCmsPagesFromFirestore().then(p => {
      if (p.length > 0) {
        const pageMap = new Map<string, CMSPage>();
        INITIAL_CMS_PAGES.forEach(x => pageMap.set(x.id, x));
        p.forEach(x => pageMap.set(x.id, x));
        setCmsPages(Array.from(pageMap.values()));
      }
    }).catch(() => {});

    fetchCmsPostsFromFirestore().then(p => {
      if (p.length > 0) setCmsPosts(p);
    }).catch(() => {});

    fetchCmsSeriesPacksFromFirestore().then(s => {
      if (s.length > 0) setCmsSeriesPacks(s);
    }).catch(() => {});

    fetchCmsSettingsFromFirestore().then(s => {
      if (s) setCmsSettings(s);
    }).catch(() => {});

    return () => {
      unsubPages();
      unsubPosts();
      unsubSeries();
      unsubSettings();
    };
  }, []);

  useEffect(() => {
    try { localStorage.setItem('cgssb_cms_pages', JSON.stringify(cmsPages)); } catch {}
  }, [cmsPages]);

  useEffect(() => {
    try { localStorage.setItem('cgssb_cms_posts', JSON.stringify(cmsPosts)); } catch {}
  }, [cmsPosts]);

  useEffect(() => {
    try { localStorage.setItem('cgssb_cms_series', JSON.stringify(cmsSeriesPacks)); } catch {}
  }, [cmsSeriesPacks]);

  useEffect(() => {
    try { localStorage.setItem('cgssb_cms_settings', JSON.stringify(cmsSettings)); } catch {}
  }, [cmsSettings]);

  const handleSaveCmsPage = useCallback(async (page: CMSPage) => {
    setCmsPages(prev => {
      const idx = prev.findIndex(p => p.id === page.id);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = page;
        return updated;
      }
      return [page, ...prev];
    });
    saveCmsPageToFirestore(page).catch(err => console.warn('Cloud save CMS page warning:', err));
  }, []);

  const handleDeleteCmsPage = useCallback(async (id: string) => {
    setCmsPages(prev => prev.filter(p => p.id !== id));
    deleteCmsPageFromFirestore(id).catch(err => console.warn('Cloud delete CMS page warning:', err));
  }, []);

  const handleSaveCmsPost = useCallback(async (post: CMSPost) => {
    setCmsPosts(prev => {
      const idx = prev.findIndex(p => p.id === post.id);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = post;
        return updated;
      }
      return [post, ...prev];
    });
    saveCmsPostToFirestore(post).catch(err => console.warn('Cloud save CMS post warning:', err));
  }, []);

  const handleDeleteCmsPost = useCallback(async (id: string) => {
    setCmsPosts(prev => prev.filter(p => p.id !== id));
    deleteCmsPostFromFirestore(id).catch(err => console.warn('Cloud delete CMS post warning:', err));
  }, []);

  const handleSaveCmsSeriesPack = useCallback(async (pack: CMSTestSeriesPack) => {
    setCmsSeriesPacks(prev => {
      const idx = prev.findIndex(p => p.id === pack.id);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = pack;
        return updated;
      }
      return [pack, ...prev];
    });
    saveCmsSeriesPackToFirestore(pack).catch(err => console.warn('Cloud save CMS series pack warning:', err));
  }, []);

  const handleDeleteCmsSeriesPack = useCallback(async (id: string) => {
    setCmsSeriesPacks(prev => prev.filter(p => p.id !== id));
    deleteCmsSeriesPackFromFirestore(id).catch(err => console.warn('Cloud delete CMS series pack warning:', err));
  }, []);

  const handleSaveCmsSettings = useCallback(async (settings: CMSSiteSettings) => {
    setCmsSettings(settings);
    saveCmsSettingsToFirestore(settings).catch(err => console.warn('Cloud save CMS settings warning:', err));
  }, []);

  return {
    cmsPages,
    cmsPosts,
    cmsSeriesPacks,
    cmsSettings,
    handleSaveCmsPage,
    handleDeleteCmsPage,
    handleSaveCmsPost,
    handleDeleteCmsPost,
    handleSaveCmsSeriesPack,
    handleDeleteCmsSeriesPack,
    handleSaveCmsSettings,
  };
}
