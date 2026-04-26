import React, { createContext, useState, useContext, useEffect } from 'react';
import { digify } from '@/api/digifyClient';
import { DEFAULT_SITE_SETTINGS, mergeSiteSettingsWithDefaults } from '@/lib/siteSettings';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState({
    id: 'digify-local',
    public_settings: DEFAULT_SITE_SETTINGS,
  });

  useEffect(() => {
    checkAppState();
    loadPublicSettings();
  }, []);

  const loadPublicSettings = async () => {
    setIsLoadingPublicSettings(true);
    try {
      const settings = await digify.entities.SiteSetting.filter({ id: 'site_settings' }, '-updated_date', 1);
      const publicSettings = settings[0] || {};
      setAppPublicSettings({
        id: publicSettings.id || 'digify-local',
        public_settings: mergeSiteSettingsWithDefaults(publicSettings),
      });
    } catch {
      setAppPublicSettings({ id: 'digify-local', public_settings: DEFAULT_SITE_SETTINGS });
    } finally {
      setIsLoadingPublicSettings(false);
    }
  };

  const checkAppState = async () => {
    setAuthError(null);
    setIsLoadingAuth(true);
    try {
      const authed = await digify.auth.isAuthenticated();
      if (!authed) {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
        return;
      }
      const currentUser = await digify.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      setAuthError({ type: 'auth_required', message: error.message || 'Authentication required' });
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    if (shouldRedirect) {
      digify.auth.logout('/');
    } else {
      digify.auth.logout('');
    }
  };

  const navigateToLogin = () => {
    digify.auth.redirectToLogin(window.location.href);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
      navigateToLogin,
      checkAppState,
      loadPublicSettings,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
