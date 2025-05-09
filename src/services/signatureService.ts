
interface SignatureData {
  id: string;
  documentId: string;
  documentType: 'invoice' | 'receipt';
  signatureDataUrl: string;
  timestamp: number;
  synced: boolean;
}

export class SignatureService {
  private static STORAGE_KEY = 'delivery_signatures';
  
  // Save signature to local storage
  static saveSignature(documentId: string, documentType: 'invoice' | 'receipt', signatureDataUrl: string): SignatureData {
    const signatures = this.getStoredSignatures();
    
    const signatureData: SignatureData = {
      id: crypto.randomUUID(),
      documentId,
      documentType,
      signatureDataUrl,
      timestamp: Date.now(),
      synced: false
    };
    
    signatures.push(signatureData);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(signatures));
    
    this.attemptSync();
    
    return signatureData;
  }
  
  // Get all stored signatures
  static getStoredSignatures(): SignatureData[] {
    const signaturesJson = localStorage.getItem(this.STORAGE_KEY);
    return signaturesJson ? JSON.parse(signaturesJson) : [];
  }
  
  // Get unsynced signatures
  static getUnsyncedSignatures(): SignatureData[] {
    return this.getStoredSignatures().filter(sig => !sig.synced);
  }
  
  // Mark a signature as synced
  static markAsSynced(id: string): void {
    const signatures = this.getStoredSignatures();
    const updatedSignatures = signatures.map(sig => 
      sig.id === id ? { ...sig, synced: true } : sig
    );
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedSignatures));
  }
  
  // Attempt to sync signatures with server when online
  static attemptSync(): void {
    if (!navigator.onLine) return;
    
    const unsyncedSignatures = this.getUnsyncedSignatures();
    
    if (unsyncedSignatures.length === 0) return;
    
    // In a real app, this would be an API call to your server
    // For now, we'll simulate a successful sync after a delay
    setTimeout(() => {
      unsyncedSignatures.forEach(sig => {
        this.markAsSynced(sig.id);
        console.log(`Synced signature ${sig.id} for document ${sig.documentId}`);
      });
    }, 1000);
  }
  
  // Listen for online status to attempt sync
  static initSyncListener(): void {
    window.addEventListener('online', () => {
      this.attemptSync();
    });
  }
}

// Initialize the sync listener when the service is imported
SignatureService.initSyncListener();
