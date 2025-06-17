// Store QR transaction mappings
const qrTransactionStore = new Map<string, { 
  qrId: string; 
  orderId: string; 
  amount: number; 
  currency: string; 
  createdAt: Date; 
}>();

export function getQRTransactionStore() {
  return qrTransactionStore;
}

export function setQRTransaction(transactionId: string, data: {
  qrId: string;
  orderId: string;
  amount: number;
  currency: string;
  createdAt: Date;
}) {
  qrTransactionStore.set(transactionId, data);
}

export function getQRTransaction(transactionId: string) {
  return qrTransactionStore.get(transactionId);
}

export function deleteQRTransaction(transactionId: string) {
  return qrTransactionStore.delete(transactionId);
} 