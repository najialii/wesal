    // Environment Configuration
// This file centralizes all environment-specific settings

export interface EnvironmentConfig {
  apiUrl: string;
  environment: 'local' | 'production';
  debug: boolean;
  appName: string;
}

// Local Development Configuration
export const localConfig: EnvironmentConfig = {
  apiUrl: 'http://localhost:8000/api',
  environment: 'local',
  debug: true,
  appName: 'WesalTech Local'
};

// Production Configuration
export const productionConfig: EnvironmentConfig = {
  apiUrl: 'https://wesaaltech.com/api',
  environment: 'production',
  debug: false,
  appName: 'WesalTech'
};

// Current Configuration - Change this to switch environments
// For Local: export const config = localConfig;
// For Production: export const config = productionConfig;

export const config = localConfig; // Currently using LOCAL

// Helper function to get environment variables with fallback
export const getEnvVar = (key: string, fallback: string = ''): string => {
  return import.meta.env[key] || fallback;
};

// Export individual config values for easy access
export const API_URL = config.apiUrl;
export const IS_PRODUCTION = config.environment === 'production';
export const IS_LOCAL = config.environment === 'local';
export const DEBUG_MODE = config.debug;
export const APP_NAME = config.appName;