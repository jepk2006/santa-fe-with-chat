import { bnbService } from '@/lib/services/bnb-service';
import { validateBNBConfig } from '@/lib/bnb-config';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]; // Default to today

    // Validate BNB configuration
    const configValidation = validateBNBConfig();
    if (!configValidation.isValid) {
      return NextResponse.json({ 
        error: 'BNB configuration invalid',
        missingFields: configValidation.missingFields
      }, { status: 400 });
    }


    // Get QR details for the specified date
    const qrDetails = await bnbService.getQRsByDate(date);

    const reconciliationData = {
      date,
      totalQRs: qrDetails.length,
      qrDetails: qrDetails.map((qr: any) => ({
        id: qr.id,
        amount: qr.amount,
        currency: qr.currency,
        gloss: qr.gloss,
        status: qr.status,
        creationDate: qr.creationDate,
        expirationDate: qr.expirationDate,
        paymentDate: qr.paymentDate,
        singleUse: qr.singleUse
      })),
      summary: {
        totalAmount: qrDetails.reduce((sum: number, qr: any) => sum + (qr.amount || 0), 0),
        paidQRs: qrDetails.filter((qr: any) => qr.status === '2').length, // Status 2 = Usado
        pendingQRs: qrDetails.filter((qr: any) => qr.status === '1').length, // Status 1 = No Usado
        expiredQRs: qrDetails.filter((qr: any) => qr.status === '3').length, // Status 3 = Expirado
        errorQRs: qrDetails.filter((qr: any) => qr.status === '4').length // Status 4 = Con error
      }
    };

    return NextResponse.json(reconciliationData);

  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

// POST endpoint to manually check status of specific QRs
export async function POST(request: Request) {
  try {
    const { qrIds } = await request.json();

    if (!Array.isArray(qrIds) || qrIds.length === 0) {
      return NextResponse.json({ 
        error: 'qrIds array is required'
      }, { status: 400 });
    }


    const results = await Promise.allSettled(
      qrIds.map(async (qrId: string) => {
        const status = await bnbService.checkQRStatus(qrId);
        return { qrId, ...status };
      })
    );

    const statusResults = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          qrId: qrIds[index],
          status: 'error',
          message: result.reason.message || 'Failed to check status'
        };
      }
    });

    return NextResponse.json({ results: statusResults });

  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
} 