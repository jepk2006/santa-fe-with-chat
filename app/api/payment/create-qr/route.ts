import { bnbService } from '@/lib/services/bnb-service';
import { validateBNBConfig } from '@/lib/bnb-config';
import { setQRTransaction } from '@/lib/services/qr-transaction-store';

export async function POST(request: Request) {
  try {
    const { orderId, amount, currency = 'BOB' } = await request.json();

    if (!orderId || !amount) {
      return new Response(JSON.stringify({ error: 'Order ID and amount are required' }), { status: 400 });
    }

    if (amount <= 0) {
      return new Response(JSON.stringify({ error: 'Amount must be greater than 0' }), { status: 400 });
    }

    // Validate BNB configuration
    const configValidation = validateBNBConfig();
    if (!configValidation.isValid) {
      // Fallback to mock QR for development
      const transactionId = `mock_${orderId}_${Date.now()}`;
      return new Response(JSON.stringify({ 
        transactionId, 
        qrImageUrl: '/images/placeholder.jpg',
        isMock: true,
        message: 'Using mock QR due to missing BNB configuration'
      }), { status: 200 });
    }

    // Generate QR using BNB service
    const { qrId, qrImageBase64 } = await bnbService.generateQR(amount, orderId, currency);
    
    // Generate transaction ID for our internal tracking
    const transactionId = `bnb_${qrId}_${Date.now()}`;
    
    // Store the mapping for status checking
    setQRTransaction(transactionId, {
      qrId,
      orderId,
      amount,
      currency,
      createdAt: new Date()
    });

    // Convert base64 to data URL for display
    const qrImageUrl = `data:image/png;base64,${qrImageBase64}`;

    return new Response(JSON.stringify({
      transactionId,
      qrImageUrl,
      qrId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      isMock: false
    }), { status: 200 });

  } catch (error) {
    
    // Fallback to mock QR in case of error
    const { orderId } = await request.json();
    const transactionId = `fallback_${orderId}_${Date.now()}`;
    
    return new Response(JSON.stringify({ 
      transactionId, 
      qrImageUrl: '/images/placeholder.jpg',
      isMock: true,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), { status: 200 });
  }
}

 