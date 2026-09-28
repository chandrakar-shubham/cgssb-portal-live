import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppRemoteConfig, DEFAULT_REMOTE_CONFIG } from '../types';

interface RemoteConfigContextType {
  config: AppRemoteConfig;
  isLoading: boolean;
  isMaintenanceMode: boolean;
  refreshConfig: () => Promise<void>;
  updateConfig: (newConfig: Partial<AppRemoteConfig>) => Promise<boolean>;
  resetToDefaults: () => Promise<boolean>;
}

const RemoteConfigContext = createContext<RemoteConfigContextType | undefined>(undefined);

const LOCAL_STORAGE_REMOTE_CONFIG_KEY = 'cgssb_remote_config_v1';

export const RemoteConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<AppRemoteConfig>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(LOCAL_STORAGE_REMOTE_CONFIG_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          return {
            ...DEFAULT_REMOTE_CONFIG,
            ...parsed,
            featureFlags: { ...DEFAULT_REMOTE_CONFIG.featureFlags, ...(parsed.featureFlags || {}) },
            maintenanceMode: { ...DEFAULT_REMOTE_CONFIG.maintenanceMode, ...(parsed.maintenanceMode || {}) },
            globalAlertBanner: { ...DEFAULT_REMOTE_CONFIG.globalAlertBanner, ...(parsed.globalAlertBanner || {}) },
            examEngineRules: { ...DEFAULT_REMOTE_CONFIG.examEngineRules, ...(parsed.examEngineRules || {}) },
            pricingConfig: { ...DEFAULT_REMOTE_CONFIG.pricingConfig, ...(parsed.pricingConfig || {}) },
            brandingConfig: { ...DEFAULT_REMOTE_CONFIG.brandingConfig, ...(parsed.brandingConfig || {}) },
          };
        }
      } catch (err) {
        console.warn('Failed to parse local remote config cache:', err);
      }
    }
    return DEFAULT_REMOTE_CONFIG;
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/config/remote');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.config) {
          const merged: AppRemoteConfig = {
            ...DEFAULT_REMOTE_CONFIG,
            ...data.config,
            featureFlags: { ...DEFAULT_REMOTE_CONFIG.featureFlags, ...(data.config.featureFlags || {}) },
            maintenanceMode: { ...DEFAULT_REMOTE_CONFIG.maintenanceMode, ...(data.config.maintenanceMode || {}) },
            globalAlertBanner: { ...DEFAULT_REMOTE_CONFIG.globalAlertBanner, ...(data.config.globalAlertBanner || {}) },
            examEngineRules: { ...DEFAULT_REMOTE_CONFIG.examEngineRules, ...(data.config.examEngineRules || {}) },
            pricingConfig: { ...DEFAULT_REMOTE_CONFIG.pricingConfig, ...(data.config.pricingConfig || {}) },
            brandingConfig: { ...DEFAULT_REMOTE_CONFIG.brandingConfig, ...(data.config.brandingConfig || {}) },
          };
          setConfig(merged);
          if (typeof window !== 'undefined') {
            localStorage.setItem(LOCAL_STORAGE_REMOTE_CONFIG_KEY, JSON.stringify(merged));
          }
        }
      }
    } catch (err) {
      console.warn('Could not reach remote config endpoint, using cached state:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshConfig();
    // Re-check remote config every 60 seconds
    const interval = setInterval(refreshConfig, 60000);
    return () => clearInterval(interval);
  }, [refreshConfig]);

  const updateConfig = async (newConfig: Partial<AppRemoteConfig>): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin/config/remote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'cgssb_admin_2026',
        },
        body: JSON.stringify({ config: newConfig }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.config) {
          setConfig(data.config);
          if (typeof window !== 'undefined') {
            localStorage.setItem(LOCAL_STORAGE_REMOTE_CONFIG_KEY, JSON.stringify(data.config));
          }
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error('Failed to update remote config:', err);
      return false;
    }
  };

  const resetToDefaults = async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin/config/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'cgssb_admin_2026',
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.config) {
          setConfig(data.config);
          if (typeof window !== 'undefined') {
            localStorage.setItem(LOCAL_STORAGE_REMOTE_CONFIG_KEY, JSON.stringify(data.config));
          }
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error('Failed to reset remote config:', err);
      return false;
    }
  };

  const isMaintenanceMode = Boolean(config.maintenanceMode?.enabled);

  return (
    <RemoteConfigContext.Provider
      value={{
        config,
        isLoading,
        isMaintenanceMode,
        refreshConfig,
        updateConfig,
        resetToDefaults,
      }}
    >
      {children}
    </RemoteConfigContext.Provider>
  );
};

export const useRemoteConfig = () => {
  const context = useContext(RemoteConfigContext);
  if (!context) {
    throw new Error('useRemoteConfig must be used within a RemoteConfigProvider');
  }
  return context;
};
