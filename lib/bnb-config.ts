// BNB Open Banking Configuration
export const BNB_CONFIG = {
  // Authentication credentials - these should be in your .env.local file
  ACCOUNT_ID: process.env.BNB_ACCOUNT_ID || '',
  AUTHORIZATION_ID: process.env.BNB_AUTHORIZATION_ID || '',
  
  // API URLs for Sandbox environment
  AUTH_URL: process.env.BNB_AUTH_URL || 'https://clientauthenticationapiv2.azurewebsites.net/api/v1',
  QR_SIMPLE_URL: process.env.BNB_QR_SIMPLE_URL || 'https://qrsimpleapiv2.azurewebsites.net/api/v1',
  
  // Currency codes
  CURRENCY: {
    BOB: 'BOB', // Bolivianos
    USD: 'USD'  // Dollars
  },
  
  // QR Configuration
  QR_CONFIG: {
    SINGLE_USE: true,           // QR can only be used once
    EXPIRATION_DAYS: 1,         // QR expires in 1 day
    DEFAULT_CURRENCY: 'BOB'     // Default currency
  }
} as const;

// Validation function to check if all required credentials are present
export function validateBNBConfig(): { isValid: boolean; missingFields: string[] } {
  const missingFields: string[] = [];
  
  if (!BNB_CONFIG.ACCOUNT_ID) missingFields.push('BNB_ACCOUNT_ID');
  if (!BNB_CONFIG.AUTHORIZATION_ID) missingFields.push('BNB_AUTHORIZATION_ID');
  
  return {
    isValid: missingFields.length === 0,
    missingFields
  };
}

// Type definitions for BNB API responses
export interface BNBAuthResponse {
  success: boolean;
  message: string; // Contains the token if successful
}

export interface BNBQRResponse {
  id?: string;
  qr?: string; // Base64 image
  success: boolean;
  message: string;
}

export interface BNBQRStatusResponse {
  id: string;
  qrId: string; // 1=No Usado; 2=Usado; 3=Expirado; 4=Con error
  expirationDate: string;
  success: boolean;
  message: string;
} 