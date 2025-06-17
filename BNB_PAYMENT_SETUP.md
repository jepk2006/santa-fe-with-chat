# BNB Open Banking Payment Integration - Setup Guide

## Overview

This guide walks you through implementing BNB Open Banking QR payment processing in your Santa Fe e-commerce platform.

## 🚀 Quick Start

### Step 1: Environment Configuration

Add these variables to your `.env.local` file:

```bash
# BNB Open Banking Credentials (obtain from BNB)
BNB_ACCOUNT_ID=your_account_id_from_bnb
BNB_AUTHORIZATION_ID=your_authorization_id_from_bnb

# BNB API URLs (Sandbox)
BNB_AUTH_URL=https://clientauthenticationapiv2.azurewebsites.net/api/v1
BNB_QR_SIMPLE_URL=https://qrsimpleapiv2.azurewebsites.net/api/v1

# For Production (uncomment when ready)
# BNB_AUTH_URL=https://your-production-auth-url
# BNB_QR_SIMPLE_URL=https://your-production-qr-url
```

### Step 2: Contact BNB to Get Credentials

1. **Contact BNB Business Support**
   - Request access to Open Banking APIs
   - Specify you need QR Simple payment integration
   - Provide your business details

2. **Credentials You'll Receive:**
   - `accountId`: Your unique account identifier
   - `authorizationId`: Your authorization token

3. **Documentation:**
   - BNB will provide API documentation
   - Test environment access
   - Production environment details

## 📋 Implementation Details

### Files Created/Modified

1. **Configuration Files:**
   - `lib/bnb-config.ts` - BNB API configuration
   - `lib/services/bnb-service.ts` - BNB service layer

2. **API Routes:**
   - `app/api/payment/create-qr/route.ts` - Create QR payments
   - `app/api/payment/status/route.ts` - Check payment status
   - `app/api/payment/reconciliation/route.ts` - Payment reconciliation

3. **Client Components:**
   - Updated `app/(root)/payment/[orderId]/payment-client-page.tsx`

### Key Features Implemented

✅ **Authentication with BNB APIs**
- Automatic token management
- Token caching and renewal
- Error handling and fallbacks

✅ **QR Code Generation**
- Real-time QR creation using BNB APIs
- Configurable expiration (24 hours)
- Single-use QR codes
- Currency support (BOB/USD)

✅ **Payment Status Monitoring**
- Real-time payment verification
- Automatic polling every 3 seconds
- Status mapping (pending/paid/expired/error)

✅ **Fallback System**
- Mock QR codes for development
- Graceful degradation if BNB is unavailable
- Clear error messaging

✅ **Payment Reconciliation**
- Daily payment reports
- QR status checking
- Transaction tracking

## 🔄 Payment Flow

1. **User initiates checkout** → Order created
2. **Payment page loads** → QR generation requested
3. **BNB authentication** → Token obtained
4. **QR creation** → Real QR code generated
5. **User scans QR** → Payment processed by bank
6. **Status polling** → Every 3 seconds check status
7. **Payment confirmed** → Order marked as paid
8. **Redirect** → User sent to success page

## 🧪 Testing

### Development Mode (Without BNB Credentials)

The system automatically falls back to mock payments:

```javascript
// Will create mock transaction if BNB not configured
const payment = await fetch('/api/payment/create-qr', {
  method: 'POST',
  body: JSON.stringify({ orderId: 'test', amount: 100 })
});
// Returns: { isMock: true, transactionId: 'mock_test_...' }
```

### With BNB Sandbox

1. Set up BNB credentials in `.env.local`
2. Test with small amounts (e.g., 1 BOB)
3. Use BNB's test banking app to scan QRs
4. Verify payment status updates

### Testing Checklist

- [ ] QR generation works
- [ ] QR displays correctly
- [ ] Payment status polling works
- [ ] Mock fallback works without credentials
- [ ] Real payments work with BNB sandbox
- [ ] Error handling works
- [ ] Reconciliation API works

## 🛡️ Security Considerations

### API Security
- All BNB credentials stored as environment variables
- Tokens cached securely with expiration
- HTTPS required for production

### Transaction Security
- QR codes expire after 24 hours
- Single-use QR codes prevent double payment
- Transaction IDs are unique and trackable

### Error Handling
- Failed payments don't create orders
- Clear error messages for users
- Fallback to mock mode in development

## 📊 Monitoring & Reconciliation

### Daily Reconciliation
```bash
# Get payment report for today
GET /api/payment/reconciliation?date=2024-01-15

# Check specific QR statuses
POST /api/payment/reconciliation
{ "qrIds": ["QR123", "QR456"] }
```

### Payment Analytics
- Track QR generation vs payment completion
- Monitor payment failure rates
- Analyze payment timing patterns

## 🚀 Production Deployment

### Pre-Production Checklist
- [ ] BNB production credentials obtained
- [ ] Production API URLs configured
- [ ] SSL certificate installed
- [ ] Payment reconciliation process tested
- [ ] Error monitoring setup
- [ ] Backup payment method available

### Production Environment Variables
```bash
BNB_ACCOUNT_ID=prod_account_id
BNB_AUTHORIZATION_ID=prod_authorization_id
BNB_AUTH_URL=https://prod-auth.bnb.com.bo/api/v1
BNB_QR_SIMPLE_URL=https://prod-qr.bnb.com.bo/api/v1
```

## 🔧 Troubleshooting

### Common Issues

**1. "Missing BNB configuration" Error**
- Verify `.env.local` has correct credentials
- Restart Next.js server after adding variables

**2. QR Generation Fails**
- Check BNB credentials are valid
- Verify network connectivity to BNB APIs
- Check BNB service status

**3. Payment Status Not Updating**
- Ensure QR was scanned and paid
- Check BNB transaction logs
- Verify polling is working (check console)

**4. Mock Mode Stuck**
- Real payments require valid BNB credentials
- Check console for configuration validation errors

### Debug Mode
Enable detailed logging by checking browser console for:
- `🔐 Authenticating with BNB...`
- `💳 Generating QR for amount...`
- `🔍 Checking QR status...`
- `✅ Payment confirmed!`

## 📞 Support

### BNB Support
- Contact BNB business development
- Technical support for API issues
- Production credentials requests

### Implementation Support
- Check this documentation first
- Review console logs for error details
- Test with mock mode to isolate issues

## 🔄 Updates & Maintenance

### Regular Tasks
1. **Monthly:** Review payment reconciliation
2. **Quarterly:** Update BNB credentials if needed
3. **As needed:** Update API endpoints per BNB notifications

### Version Updates
- Monitor BNB API version updates
- Test new versions in sandbox first
- Update configuration as needed

---

## Next Steps

1. **Set up BNB credentials** in your environment
2. **Test in sandbox** with small amounts
3. **Deploy to production** with real credentials
4. **Monitor payments** using reconciliation APIs
5. **Scale as needed** based on transaction volume 