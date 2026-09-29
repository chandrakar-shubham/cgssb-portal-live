import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppRemoteConfig, DEFAULT_REMOTE_CONFIG } from '../types';
import {
  fetchRemoteConfigFromFirestore,
  saveRemoteConfigToFirestore,
  subscribeToRemoteConfig
} from '../firebase/firestoreService';

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
      const remote = await fetchRemoteConfigFromFirestore();
      if (remote) {
        const merged: AppRemoteConfig = {
          ...DEFAULT_REMOTE_CONFIG,
          ...remote,
          featureFlags: { ...DEFAULT_REMOTE_CONFIG.featureFlags, ...(remote.featureFlags || {}) },
          maintenanceMode: { ...DEFAULT_REMOTE_CONFIG.maintenanceMode, ...(remote.maintenanceMode || {}) },
          globalAlertBanner: { ...DEFAULT_REMOTE_CONFIG.globalAlertBanner, ...(remote.globalAlertBanner || {}) },
          examEngineRules: { ...DEFAULT_REMOTE_CONFIG.examEngineRules, ...(remote.examEngineRules || {}) },
          pricingConfig: { ...DEFAULT_REMOTE_CONFIG.pricingConfig, ...(remote.pricingConfig || {}) },
          brandingConfig: { ...DEFAULT_REMOTE_CONFIG.brandingConfig, ...(remote.brandingConfig || {}) },
        };
        setConfig(merged);
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_REMOTE_CONFIG_KEY, JSON.stringify(merged));
        }
      }
    } catch (err) {
      console.warn('Could not reach remote config Firestore, using cached state:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Real-time Cloud Firestore subscription
  useEffect(() => {
    const unsubscribe = subscribeToRemoteConfig((remote) => {
      const merged: AppRemoteConfig = {
        ...DEFAULT_REMOTE_CONFIG,
        ...remote,
        featureFlags: { ...DEFAULT_REMOTE_CONFIG.featureFlags, ...(remote.featureFlags || {}) },
        maintenanceMode: { ...DEFAULT_REMOTE_CONFIG.maintenanceMode, ...(remote.maintenanceMode || {}) },
        globalAlertBanner: { ...DEFAULT_REMOTE_CONFIG.globalAlertBanner, ...(remote.globalAlertBanner || {}) },
        examEngineRules: { ...DEFAULT_REMOTE_CONFIG.examEngineRules, ...(remote.examEngineRules || {}) },
        pricingConfig: { ...DEFAULT_REMOTE_CONFIG.pricingConfig, ...(remote.pricingConfig || {}) },
        brandingConfig: { ...DEFAULT_REMOTE_CONFIG.brandingConfig, ...(remote.brandingConfig || {}) },
      };
      setConfig(merged);
      setIsLoading(false);
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_REMOTE_CONFIG_KEY, JSON.stringify(merged));
      }
    });

    refreshConfig();
    return () => unsubscribe();
  }, [refreshConfig]);

  const updateConfig = async (newConfig: Partial<AppRemoteConfig>): Promise<boolean> => {
    try {
      const merged: AppRemoteConfig = {
        ...config,
        ...newConfig,
        featureFlags: { ...config.featureFlags, ...(newConfig.featureFlags || {}) },
        maintenanceMode: { ...config.maintenanceMode, ...(newConfig.maintenanceMode || {}) },
        globalAlertBanner: { ...config.globalAlertBanner, ...(newConfig.globalAlertBanner || {}) },
        examEngineRules: { ...config.examEngineRules, ...(newConfig.examEngineRules || {}) },
        pricingConfig: { ...config.pricingConfig, ...(newConfig.pricingConfig || {}) },
        brandingConfig: { ...config.brandingConfig, ...(newConfig.brandingConfig || {}) },
        updatedAt: new Date().toISOString(),
      };
      setConfig(merged);
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_REMOTE_CONFIG_KEY, JSON.stringify(merged));
      }
      await saveRemoteConfigToFirestore(merged);
      return true;
    } catch (err) {
      console.error('Failed to update remote config:', err);
      return false;
    }
  };

  const resetToDefaults = async (): Promise<boolean> => {
    try {
      setConfig(DEFAULT_REMOTE_CONFIG);
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_REMOTE_CONFIG_KEY, JSON.stringify(DEFAULT_REMOTE_CONFIG));
      }
      await saveRemoteConfigToFirestore(DEFAULT_REMOTE_CONFIG);
      return true;
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
