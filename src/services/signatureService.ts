
import { PDFDocument } from 'pdf-lib';

interface SignatureData {
  id: string;
  documentId: string;
  documentType: 'invoice' | 'receipt';
  signatureDataUrl: string;
  timestamp: number;
  synced: boolean;
}

interface PDFSignatureData extends SignatureData {
  originalPdfBytes?: Uint8Array;
  signedPdfBytes?: Uint8Array;
  signaturePosition?: { x: number; y: number; pageIndex: number };
}

export class SignatureService {
  private static STORAGE_KEY = 'delivery_signatures';
  private static PDF_STORAGE_KEY = 'delivery_pdf_signatures';
  
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
  
  // Save PDF with signature to local storage
  static async savePDFSignature(
    documentId: string, 
    originalPdfBytes: Uint8Array,
    signatureDataUrl: string,
    signaturePosition: { x: number; y: number; pageIndex: number }
  ): Promise<PDFSignatureData> {
    const pdfSignatures = this.getStoredPDFSignatures();
    
    // Apply signature to PDF
    const signedPdfBytes = await this.applySignatureToPdf(
      originalPdfBytes,
      signatureDataUrl,
      signaturePosition
    );
    
    const pdfSignatureData: PDFSignatureData = {
      id: crypto.randomUUID(),
      documentId,
      documentType: 'invoice', // Default type
      signatureDataUrl,
      originalPdfBytes,
      signedPdfBytes,
      signaturePosition,
      timestamp: Date.now(),
      synced: false
    };
    
    pdfSignatures.push(pdfSignatureData);
    localStorage.setItem(this.PDF_STORAGE_KEY, JSON.stringify(pdfSignatures.map(sig => ({
      ...sig,
      // Convert Uint8Array to base64 string for storage
      originalPdfBytes: sig.originalPdfBytes ? Array.from(sig.originalPdfBytes) : undefined,
      signedPdfBytes: sig.signedPdfBytes ? Array.from(sig.signedPdfBytes) : undefined
    }))));
    
    this.attemptSyncPDF();
    
    return pdfSignatureData;
  }
  
  // Apply signature to PDF document
  private static async applySignatureToPdf(
    pdfBytes: Uint8Array,
    signatureDataUrl: string,
    position: { x: number; y: number; pageIndex: number }
  ): Promise<Uint8Array> {
    try {
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();
      const page = pages[position.pageIndex];
      
      if (!page) {
        throw new Error(`Page index ${position.pageIndex} out of bounds`);
      }
      
      // Convert base64 data URL to ImageData
      const signatureImage = await pdfDoc.embedPng(signatureDataUrl);
      
      // Calculate dimensions based on signature image
      const signatureWidth = 200; // Fixed width for now
      const signatureDimensions = signatureImage.scale(signatureWidth / signatureImage.width);
      
      // Draw the signature on the page
      page.drawImage(signatureImage, {
        x: position.x,
        y: position.y,
        width: signatureDimensions.width,
        height: signatureDimensions.height,
      });
      
      // Save the modified PDF
      return await pdfDoc.save();
    } catch (error) {
      console.error('Error applying signature to PDF:', error);
      throw error;
    }
  }
  
  // Get all stored PDF signatures
  static getStoredPDFSignatures(): PDFSignatureData[] {
    const signaturesJson = localStorage.getItem(this.PDF_STORAGE_KEY);
    if (!signaturesJson) return [];
    
    try {
      const parsedSignatures = JSON.parse(signaturesJson);
      
      // Convert stored base64 arrays back to Uint8Array
      return parsedSignatures.map((sig: any) => ({
        ...sig,
        originalPdfBytes: sig.originalPdfBytes ? new Uint8Array(sig.originalPdfBytes) : undefined,
        signedPdfBytes: sig.signedPdfBytes ? new Uint8Array(sig.signedPdfBytes) : undefined
      }));
    } catch (error) {
      console.error('Error parsing PDF signatures from localStorage:', error);
      return [];
    }
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
  
  // Get unsynced PDF signatures
  static getUnsyncedPDFSignatures(): PDFSignatureData[] {
    return this.getStoredPDFSignatures().filter(sig => !sig.synced);
  }
  
  // Mark a signature as synced
  static markAsSynced(id: string): void {
    const signatures = this.getStoredSignatures();
    const updatedSignatures = signatures.map(sig => 
      sig.id === id ? { ...sig, synced: true } : sig
    );
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedSignatures));
  }
  
  // Mark a PDF signature as synced
  static markPDFAsSynced(id: string): void {
    const signatures = this.getStoredPDFSignatures();
    const updatedSignatures = signatures.map(sig => 
      sig.id === id ? { ...sig, synced: true } : sig
    );
    
    // Convert Uint8Array to array for storage
    localStorage.setItem(this.PDF_STORAGE_KEY, JSON.stringify(updatedSignatures.map(sig => ({
      ...sig,
      originalPdfBytes: sig.originalPdfBytes ? Array.from(sig.originalPdfBytes) : undefined,
      signedPdfBytes: sig.signedPdfBytes ? Array.from(sig.signedPdfBytes) : undefined
    }))));
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
  
  // Attempt to sync PDF signatures with server when online
  static attemptSyncPDF(): void {
    if (!navigator.onLine) return;
    
    const unsyncedSignatures = this.getUnsyncedPDFSignatures();
    
    if (unsyncedSignatures.length === 0) return;
    
    // In a real app, this would be an API call to your server
    // For now, we'll simulate a successful sync after a delay
    setTimeout(() => {
      unsyncedSignatures.forEach(sig => {
        this.markPDFAsSynced(sig.id);
        console.log(`Synced PDF signature ${sig.id} for document ${sig.documentId}`);
      });
    }, 1000);
  }
  
  // Listen for online status to attempt sync
  static initSyncListener(): void {
    window.addEventListener('online', () => {
      this.attemptSync();
      this.attemptSyncPDF();
    });
  }
}

// Initialize the sync listener when the service is imported
SignatureService.initSyncListener();
