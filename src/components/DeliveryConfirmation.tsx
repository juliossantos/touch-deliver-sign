import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import SignaturePad from './SignaturePad';
import { SignatureService } from '@/services/signatureService';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { useIsMobile } from '@/hooks/use-mobile';
import { ClipboardSignature, File, Save } from 'lucide-react';
import PDFSignature from './PDFSignature';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DeliveryConfirmationProps {
  documentId?: string;
  documentType?: 'invoice' | 'receipt';
  onComplete?: () => void;
}

const DeliveryConfirmation: React.FC<DeliveryConfirmationProps> = ({ 
  documentId = '', 
  documentType = 'invoice',
  onComplete 
}) => {
  const [docId, setDocId] = useState<string>(documentId);
  const [docType, setDocType] = useState<'invoice' | 'receipt'>(documentType);
  const [showSignaturePad, setShowSignaturePad] = useState<boolean>(false);
  const [signatureSaved, setSignatureSaved] = useState<boolean>(false);
  const [recipientName, setRecipientName] = useState<string>('');
  const [recipientDocument, setRecipientDocument] = useState<string>('');
  
  const isMobile = useIsMobile();

  // New state for PDF signature mode
  const [showPDFSignature, setShowPDFSignature] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"simple" | "pdf">("simple");
  
  const handleDocIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDocId(e.target.value);
  };

  const handleCollectSignature = () => {
    if (!docId.trim()) {
      toast.error('Por favor, insira o número do documento.');
      return;
    }
    
    setShowSignaturePad(true);
  };

  const handleSaveSignature = (signatureDataUrl: string) => {
    if (!docId.trim()) {
      toast.error('Número do documento é obrigatório.');
      return;
    }

    try {
      SignatureService.saveSignature(docId, docType, signatureDataUrl);
      setSignatureSaved(true);
      setShowSignaturePad(false);
      
      toast.success('Assinatura salva com sucesso!');

      // Show offline status message if not online
      if (!navigator.onLine) {
        toast.info('Você está offline. A assinatura será sincronizada quando você estiver online novamente.');
      }
    } catch (error) {
      console.error('Error saving signature:', error);
      toast.error('Ocorreu um erro ao salvar a assinatura.');
    }
  };

  const handleComplete = () => {
    if (!signatureSaved && activeTab === "simple") {
      toast.warning('É necessário coletar a assinatura antes de concluir.');
      return;
    }
    
    if (!recipientName.trim()) {
      toast.warning('Por favor, informe o nome de quem recebeu.');
      return;
    }
    
    toast.success(`Entrega do documento ${docId} confirmada com sucesso!`);
    
    if (onComplete) {
      onComplete();
    }
    
    // Reset the form
    setDocId('');
    setRecipientName('');
    setRecipientDocument('');
    setSignatureSaved(false);
  };

  // New handlers for PDF signature
  const handleShowPDFSignature = () => {
    setShowPDFSignature(true);
  };

  const handleClosePDFSignature = () => {
    setShowPDFSignature(false);
  };

  return (
    <div className="container max-w-md mx-auto p-4">
      {showPDFSignature ? (
        <PDFSignature onClose={handleClosePDFSignature} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardSignature className="h-5 w-5" />
              Confirmação de Entrega
            </CardTitle>
            <CardDescription>
              Colete a assinatura do cliente ao entregar o documento.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Tabs 
              defaultValue="simple" 
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as "simple" | "pdf")}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="simple">Assinatura Simples</TabsTrigger>
                <TabsTrigger value="pdf">Assinatura em PDF</TabsTrigger>
              </TabsList>
              
              <TabsContent value="simple" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="documentId">Número do Documento</Label>
                  <Input
                    id="documentId"
                    placeholder="Digite o número do documento"
                    value={docId}
                    onChange={handleDocIdChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="docType">Tipo de Documento</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="docType"
                      checked={docType === 'receipt'}
                      onCheckedChange={(checked) => setDocType(checked ? 'receipt' : 'invoice')}
                    />
                    <span>{docType === 'invoice' ? 'Nota Fiscal' : 'Recibo/Boleto'}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="recipientName">Nome do Recebedor</Label>
                  <Input
                    id="recipientName"
                    placeholder="Nome de quem está recebendo"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="recipientDocument">Documento do Recebedor (opcional)</Label>
                  <Input
                    id="recipientDocument"
                    placeholder="CPF ou RG"
                    value={recipientDocument}
                    onChange={(e) => setRecipientDocument(e.target.value)}
                  />
                </div>
                
                {signatureSaved ? (
                  <div className="bg-green-50 p-3 rounded-md border border-green-200 text-center">
                    <p className="text-green-700">Assinatura coletada com sucesso!</p>
                  </div>
                ) : (
                  <Button 
                    onClick={handleCollectSignature}
                    className="w-full"
                    disabled={!docId.trim()}
                  >
                    Coletar Assinatura
                  </Button>
                )}
              </TabsContent>
              
              <TabsContent value="pdf" className="space-y-4 pt-4">
                <div className="text-center p-6 border-2 border-dashed border-gray-200 rounded-lg">
                  <File className="h-10 w-10 mx-auto text-gray-400 mb-3" />
                  <h3 className="text-lg font-medium mb-2">Assinatura em Documento PDF</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Carregue um documento PDF para coletar assinatura diretamente nele
                  </p>
                  <Button onClick={handleShowPDFSignature} className="w-full">
                    Selecionar Documento PDF
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="recipientName">Nome do Recebedor</Label>
                  <Input
                    id="recipientName"
                    placeholder="Nome de quem está recebendo"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="recipientDocument">Documento do Recebedor (opcional)</Label>
                  <Input
                    id="recipientDocument"
                    placeholder="CPF ou RG"
                    value={recipientDocument}
                    onChange={(e) => setRecipientDocument(e.target.value)}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          
          <Separator />
          
          <CardFooter className="pt-4 flex flex-col md:flex-row md:justify-end gap-2">
            <Button 
              className="w-full md:w-auto" 
              onClick={handleComplete}
              disabled={(activeTab === "simple" && !signatureSaved) || !recipientName.trim()}
            >
              <Save className="mr-2 h-4 w-4" />
              Concluir Entrega
            </Button>
          </CardFooter>
        </Card>
      )}
      
      {showSignaturePad && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md">
            <SignaturePad 
              onSave={handleSaveSignature}
              documentId={docId}
              documentType={docType}
            />
            <Button 
              variant="outline" 
              className="w-full mt-2 bg-white"
              onClick={() => setShowSignaturePad(false)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryConfirmation;
