
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
import { ClipboardSignature, Save } from 'lucide-react';

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
    if (!signatureSaved) {
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

  return (
    <div className="container max-w-md mx-auto p-4">
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
        </CardContent>
        
        <Separator />
        
        <CardFooter className="pt-4 flex flex-col md:flex-row md:justify-end gap-2">
          <Button 
            className="w-full md:w-auto" 
            onClick={handleComplete}
            disabled={!signatureSaved || !recipientName.trim()}
          >
            <Save className="mr-2 h-4 w-4" />
            Concluir Entrega
          </Button>
        </CardFooter>
      </Card>
      
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
