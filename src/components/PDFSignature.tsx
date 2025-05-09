
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { SignatureService } from '@/services/signatureService';
import SignaturePad from './SignaturePad';
import download from 'downloadjs';
import { File, Save, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Set up pdfjs worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFSignatureProps {
  onClose: () => void;
}

const PDFSignature: React.FC<PDFSignatureProps> = ({ onClose }) => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showSignaturePad, setShowSignaturePad] = useState<boolean>(false);
  const [isPositioningSignature, setIsPositioningSignature] = useState<boolean>(false);
  const [signaturePosition, setSignaturePosition] = useState<{ x: number; y: number; pageIndex: number } | null>(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [docId, setDocId] = useState<string>('');
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  
  const pageCanvasRef = useRef<HTMLDivElement>(null);
  const signaturePreviewRef = useRef<HTMLImageElement>(null);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      
      if (file.type !== 'application/pdf') {
        toast.error('Por favor, selecione um arquivo PDF válido.');
        return;
      }
      
      setPdfFile(file);
      setDocId(file.name.replace(/\.pdf$/i, '').substring(0, 20));
      
      // Read the file as ArrayBuffer
      const reader = new FileReader();
      reader.onload = async (e) => {
        if (e.target?.result) {
          const arrayBuffer = e.target.result as ArrayBuffer;
          setPdfBytes(new Uint8Array(arrayBuffer));
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };
  
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };
  
  const handleStartSignature = () => {
    if (!docId.trim()) {
      toast.error('Por favor, informe um ID para o documento');
      return;
    }
    
    setShowSignaturePad(true);
  };
  
  const handleSaveSignature = (dataUrl: string) => {
    setSignatureDataUrl(dataUrl);
    setShowSignaturePad(false);
    setIsPositioningSignature(true);
    setSignaturePreview(dataUrl);
    
    toast.info('Toque na posição do documento onde deseja adicionar a assinatura');
  };
  
  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPositioningSignature || !pageCanvasRef.current || !signaturePreview) return;
    
    const rect = pageCanvasRef.current.getBoundingClientRect();
    
    // Calculate position relative to the page
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setSignaturePosition({
      x,
      y,
      pageIndex: currentPage - 1
    });
    
    // Show preview at this position
    if (signaturePreviewRef.current) {
      signaturePreviewRef.current.style.left = `${x}px`;
      signaturePreviewRef.current.style.top = `${y}px`;
    }
  };
  
  const handleConfirmPosition = async () => {
    if (!pdfBytes || !signatureDataUrl || !signaturePosition || !docId) {
      toast.error('Não foi possível salvar o documento. Faltam informações necessárias.');
      return;
    }
    
    try {
      const result = await SignatureService.savePDFSignature(
        docId,
        pdfBytes,
        signatureDataUrl,
        signaturePosition
      );
      
      // Save signed PDF
      download(
        new Blob([result.signedPdfBytes as Uint8Array]),
        `${docId}_assinado.pdf`,
        'application/pdf'
      );
      
      toast.success('Documento assinado com sucesso e salvo localmente!');
      
      // Show offline status message if not online
      if (!navigator.onLine) {
        toast.info('Você está offline. O documento assinado será sincronizado quando você estiver online novamente.');
      }
      
      // Reset state
      setIsPositioningSignature(false);
      setSignaturePosition(null);
      setSignaturePreview(null);
      setPdfFile(null);
      setPdfBytes(null);
      setDocId('');
      setNumPages(null);
      setCurrentPage(1);
      
      // Close the component
      onClose();
    } catch (error) {
      console.error('Erro ao salvar documento:', error);
      toast.error('Ocorreu um erro ao salvar o documento assinado.');
    }
  };
  
  const handleCancelPositioning = () => {
    setIsPositioningSignature(false);
    setSignaturePosition(null);
    setSignaturePreview(null);
  };
  
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && (numPages === null || newPage <= numPages)) {
      setCurrentPage(newPage);
      // Reset signature positioning when changing pages
      if (isPositioningSignature) {
        setSignaturePosition(null);
      }
    }
  };
  
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-medium flex items-center gap-2">
          <File className="h-5 w-5" />
          Assinatura de Documento PDF
        </h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      {showSignaturePad ? (
        <div className="p-4">
          <SignaturePad 
            onSave={handleSaveSignature}
            documentId={docId}
            documentType="invoice"
          />
          <Button 
            variant="outline" 
            className="w-full mt-4"
            onClick={() => setShowSignaturePad(false)}
          >
            Cancelar
          </Button>
        </div>
      ) : (
        <>
          <div className="p-4 space-y-4">
            {!pdfFile ? (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    id="pdf-upload"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label 
                    htmlFor="pdf-upload" 
                    className="flex flex-col items-center cursor-pointer"
                  >
                    <File className="h-10 w-10 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">
                      Clique para selecionar um documento PDF
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Ou arraste e solte o arquivo aqui
                    </p>
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">
                    Documento: {pdfFile.name}
                  </p>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={docId} 
                      onChange={(e) => setDocId(e.target.value)} 
                      placeholder="ID do Documento"
                      className="px-3 py-1 text-sm border rounded"
                    />
                    
                    {!isPositioningSignature && !signatureDataUrl ? (
                      <Button onClick={handleStartSignature}>
                        Assinar
                      </Button>
                    ) : null}
                    
                    {isPositioningSignature ? (
                      <>
                        <Button variant="outline" onClick={handleCancelPositioning}>
                          Cancelar
                        </Button>
                        <Button 
                          onClick={handleConfirmPosition}
                          disabled={!signaturePosition}
                        >
                          <Save className="mr-1 h-4 w-4" /> Salvar
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
                
                <Separator />
                
                <div className="relative" ref={pageCanvasRef} onClick={handlePageClick}>
                  <ScrollArea className="h-[60vh]">
                    <Document
                      file={pdfFile}
                      onLoadSuccess={onDocumentLoadSuccess}
                      className="mx-auto"
                      error={<p className="text-center text-red-500 py-10">Erro ao carregar o documento. Verifique se é um PDF válido.</p>}
                      loading={<p className="text-center py-10">Carregando documento...</p>}
                    >
                      <Page 
                        pageNumber={currentPage} 
                        renderAnnotationLayer={false}
                        renderTextLayer={false}
                        className="mx-auto"
                      />
                    </Document>
                  </ScrollArea>
                  
                  {signaturePreview && isPositioningSignature && (
                    <img
                      ref={signaturePreviewRef}
                      src={signaturePreview}
                      alt="Preview da assinatura"
                      className="absolute pointer-events-none"
                      style={{ 
                        width: '200px', 
                        height: 'auto',
                        left: signaturePosition ? signaturePosition.x : 0,
                        top: signaturePosition ? signaturePosition.y : 0
                      }}
                    />
                  )}
                </div>
                
                <div className="flex justify-between items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    Anterior
                  </Button>
                  
                  <span className="text-sm">
                    Página {currentPage} de {numPages || '?'}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={numPages === null || currentPage >= numPages}
                  >
                    Próxima
                  </Button>
                </div>
                
                {isPositioningSignature && (
                  <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                    <p className="text-sm text-blue-700">
                      Toque no local do documento onde deseja posicionar a assinatura.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </Card>
  );
};

export default PDFSignature;
