import { BNB_CONFIG, BNBAuthResponse, BNBQRResponse, BNBQRStatusResponse, validateBNBConfig } from '../bnb-config';

class BNBService {
  private static instance: BNBService;
  private token: string | null = null;
  private tokenExpiry: Date | null = null;

  private constructor() {}

  static getInstance(): BNBService {
    if (!BNBService.instance) {
      BNBService.instance = new BNBService();
    }
    return BNBService.instance;
  }

  /**
   * Step 1: Authenticate with BNB and get access token
   */
  async authenticate(): Promise<string> {

    
    // Validate configuration
    const configValidation = validateBNBConfig();
    if (!configValidation.isValid) {
      throw new Error(`Missing BNB configuration: ${configValidation.missingFields.join(', ')}`);
    }

    // Check if we have a valid token that hasn't expired
    if (this.token && this.tokenExpiry && new Date() < this.tokenExpiry) {

      return this.token;
    }

    try {
      const response = await fetch(`${BNB_CONFIG.AUTH_URL}/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId: BNB_CONFIG.ACCOUNT_ID,
          authorizationId: BNB_CONFIG.AUTHORIZATION_ID
        })
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
      }

      const data: BNBAuthResponse = await response.json();
      
      if (!data.success) {
        throw new Error(`Authentication failed: ${data.message}`);
      }

      // Store the token and set expiry (assuming 1 hour expiry)
      this.token = data.message; // The token is returned in the message field
      this.tokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      
  
      return this.token;

    } catch (error) {
      throw new Error(`Failed to authenticate with BNB: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Step 2: Generate QR code for payment
   */
  async generateQR(amount: number, orderId: string, currency: string = BNB_CONFIG.QR_CONFIG.DEFAULT_CURRENCY): Promise<{ qrId: string; qrImageBase64: string }> {

    
    const token = await this.authenticate();
    
    // Calculate expiration date
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + BNB_CONFIG.QR_CONFIG.EXPIRATION_DAYS);
    const formattedExpiration = expirationDate.toISOString().split('T')[0]; // YYYY-MM-DD format

    try {
      const response = await fetch(`${BNB_CONFIG.QR_SIMPLE_URL}/main/getQRWithImageAsync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Assuming Bearer token authentication
        },
        body: JSON.stringify({
          currency: currency,
          gloss: `Pago Santa Fe - Order #${orderId}`, // Payment description
          amount: amount.toString(),
          singleUse: BNB_CONFIG.QR_CONFIG.SINGLE_USE.toString(),
          expirationDate: formattedExpiration
        })
      });

      if (!response.ok) {
        throw new Error(`QR generation failed: ${response.status} ${response.statusText}`);
      }

      const data: BNBQRResponse = await response.json();
      
      if (!data.success || !data.qr) {
        throw new Error(`QR generation failed: ${data.message}`);
      }

  
      
      return {
        qrId: data.id || `qr_${Date.now()}`,
        qrImageBase64: data.qr
      };

    } catch (error) {
      throw new Error(`Failed to generate QR: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Step 3: Check QR payment status
   */
  async checkQRStatus(qrId: string): Promise<{ status: 'pending' | 'paid' | 'expired' | 'error'; message?: string }> {

    
    const token = await this.authenticate();

    try {
      const response = await fetch(`${BNB_CONFIG.QR_SIMPLE_URL}/main/getQRStatusAsync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          qrId: qrId
        })
      });

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status} ${response.statusText}`);
      }

      const data: BNBQRStatusResponse = await response.json();
      
      if (!data.success) {
        throw new Error(`Status check failed: ${data.message}`);
      }

      // Map BNB status codes to our status
      let status: 'pending' | 'paid' | 'expired' | 'error';
      switch (data.qrId) {
        case '1': // No Usado
          status = 'pending';
          break;
        case '2': // Usado
          status = 'paid';
          break;
        case '3': // Expirado
          status = 'expired';
          break;
        case '4': // Con error
          status = 'error';
          break;
        default:
          status = 'pending';
      }

  
      
      return {
        status,
        message: data.message
      };

    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get QR details by generation date (useful for reconciliation)
   */
  async getQRsByDate(date: string): Promise<any[]> {

    
    const token = await this.authenticate();

    try {
      const response = await fetch(`${BNB_CONFIG.QR_SIMPLE_URL}/main/getQRbyGenerationDateAsync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          generationDate: date // YYYY-MM-DD format
        })
      });

      if (!response.ok) {
        throw new Error(`QR history fetch failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(`QR history fetch failed: ${data.message}`);
      }

      return data.dTOqrDetails || [];

    } catch (error) {
      throw new Error(`Failed to fetch QR history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const bnbService = BNBService.getInstance(); 