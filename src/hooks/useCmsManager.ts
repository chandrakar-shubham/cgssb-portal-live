import { useState, useEffect } from 'react';
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

export function useCmsManager() {
  const [cmsPages, setCmsPages] = useState<CMSPage[]>(() => {
    try {
      const saved = localStorage.getItem('cgssb_cms_pages');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return isDemoDataPurged() ? [] : INITIAL_CMS_PAGES;
  });

  const [cmsPosts, setCmsPosts] = useState<CMSPost[]>(() => {
    try {
      const saved = localStorage.getItem('cgssb_cms_posts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return isDemoDataPurged() ? [] : INITIAL_CMS_POSTS;
  });

  const [cmsSeriesPacks, setCmsSeriesPacks] = useState<CMSTestSeriesPack[]>(() => {
    try {
      const saved = localStorage.getItem('cgssb_cms_series');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return isDemoDataPurged() ? [] : INITIAL_CMS_SERIES_PACKS;
  });

  const [cmsSettings, setCmsSettings] = useState<CMSSiteSettings>(() => {
    try {
      const saved = localStorage.getItem('cgssb_cms_settings');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_CMS_SETTINGS;
  });

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

  const handleSaveCmsPage = async (page: CMSPage) => {
    setCmsPages(prev => {
      const idx = prev.findIndex(p => p.id === page.id);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = page;
        return updated;
      }
      return [page, ...prev];
    });
  };

  const handleDeleteCmsPage = async (id: string) => {
    setCmsPages(prev => prev.filter(p => p.id !== id));
  };

  const handleSaveCmsPost = async (post: CMSPost) => {
    setCmsPosts(prev => {
      const idx = prev.findIndex(p => p.id === post.id);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = post;
        return updated;
      }
      return [post, ...prev];
    });
  };

  const handleDeleteCmsPost = async (id: string) => {
    setCmsPosts(prev => prev.filter(p => p.id !== id));
  };

  const handleSaveCmsSeriesPack = async (pack: CMSTestSeriesPack) => {
    setCmsSeriesPacks(prev => {
      const idx = prev.findIndex(p => p.id === pack.id);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = pack;
        return updated;
      }
      return [pack, ...prev];
    });
  };

  const handleDeleteCmsSeriesPack = async (id: string) => {
    setCmsSeriesPacks(prev => prev.filter(p => p.id !== id));
  };

  const handleSaveCmsSettings = async (settings: CMSSiteSettings) => {
    setCmsSettings(settings);
  };

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
