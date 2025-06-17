import { bnbService } from '@/lib/services/bnb-service';
import { getQRTransaction } from '@/lib/services/qr-transaction-store';

// Mock transaction store for fallback scenarios
const mockTransactionStore = new Map<string, { status: string; pollCount: number }>();

function getMockTransactionStore() {
    if (!(global as any).mockTransactionStore) {
        (global as any).mockTransactionStore = new Map<string, { status: string; pollCount: number }>();
    }
    return (global as any).mockTransactionStore;
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const transactionId = searchParams.get('transactionId');

        if (!transactionId) {
            return new Response(JSON.stringify({ error: 'Transaction ID is required' }), { status: 400 });
        }


        // Handle mock transactions (fallback or development mode)
        if (transactionId.startsWith('mock_') || transactionId.startsWith('fallback_')) {
            const mockStore = getMockTransactionStore();
            let transaction = mockStore.get(transactionId);

            if (!transaction) {
                transaction = { status: 'pending', pollCount: 0 };
                mockStore.set(transactionId, transaction);
            }
            
            // Simulate payment confirmation after a few polls for testing
            if (transaction.status === 'pending') {
                transaction.pollCount += 1;
                if (transaction.pollCount > 3) { // Mark as paid after 3 checks (9 seconds)
                    transaction.status = 'paid';
                }
            }
            
            return new Response(JSON.stringify({ 
                status: transaction.status, 
                isMock: true 
            }), { status: 200 });
        }

        // Handle real BNB transactions
        if (transactionId.startsWith('bnb_')) {
            const transactionData = getQRTransaction(transactionId);

            if (!transactionData) {
                return new Response(JSON.stringify({ 
                    error: 'Transaction not found',
                    status: 'error'
                }), { status: 404 });
            }

            // Check status with BNB service
            const statusResult = await bnbService.checkQRStatus(transactionData.qrId);
            
            return new Response(JSON.stringify({
                status: statusResult.status,
                message: statusResult.message,
                qrId: transactionData.qrId,
                orderId: transactionData.orderId,
                amount: transactionData.amount,
                currency: transactionData.currency,
                isMock: false
            }), { status: 200 });
        }

        // Fallback for unknown transaction format
        return new Response(JSON.stringify({ 
            error: 'Unknown transaction format',
            status: 'error'
        }), { status: 400 });

    } catch (error) {
        
        return new Response(JSON.stringify({ 
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            status: 'error'
        }), { status: 500 });
    }
} 