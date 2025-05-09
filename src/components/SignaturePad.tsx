
import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { FileSignature } from 'lucide-react';

interface SignaturePadProps {
  onSave: (signatureDataUrl: string) => void;
  documentId: string;
  documentType: 'invoice' | 'receipt';
}

const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, documentId, documentType }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Make the canvas responsive
    const parent = canvas.parentElement;
    if (parent) {
      const resize = () => {
        canvas.width = parent.clientWidth - 4; // Subtract padding
        canvas.height = 200;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Set drawing styles
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.strokeStyle = '#000000';
          setContext(ctx);
        }
      };

      // Initial setup
      resize();

      // Set up resize listener
      window.addEventListener('resize', resize);

      // Clean up
      return () => {
        window.removeEventListener('resize', resize);
      };
    }
  }, []);

  const getCoordinates = (event: React.TouchEvent | React.MouseEvent): { x: number; y: number } | null => {
    if (!canvasRef.current) return null;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Check if it's a touch event
    if ('touches' in event) {
      return {
        x: event.touches[0].clientX - rect.left,
        y: event.touches[0].clientY - rect.top
      };
    } 
    // Or a mouse event
    else {
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
    }
  };

  const startDrawing = (event: React.TouchEvent | React.MouseEvent) => {
    const coords = getCoordinates(event);
    if (!context || !coords) return;

    context.beginPath();
    context.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (event: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing || !context) return;
    
    event.preventDefault(); // Prevent scrolling on touch devices while drawing
    
    const coords = getCoordinates(event);
    if (!coords) return;

    context.lineTo(coords.x, coords.y);
    context.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    if (context) {
      context.closePath();
    }
    setIsDrawing(false);
  };

  const clearSignature = () => {
    if (!context || !canvasRef.current) return;
    
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHasSignature(false);
  };

  const saveSignature = () => {
    if (!canvasRef.current || !hasSignature) {
      toast.error("Por favor, assine antes de confirmar.");
      return;
    }

    const signatureDataUrl = canvasRef.current.toDataURL('image/png');
    onSave(signatureDataUrl);
    toast.success("Assinatura salva com sucesso!");
  };

  return (
    <Card className="p-4 w-full max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <FileSignature className="h-5 w-5 text-delivery-primary" />
          <h3 className="text-lg font-medium">
            {documentType === 'invoice' ? 'Assinatura de Nota Fiscal' : 'Assinatura de Recibo'}
          </h3>
        </div>
        <span className="text-sm text-muted-foreground">Doc: #{documentId}</span>
      </div>
      
      <div className="relative border border-gray-300 rounded-md mb-4">
        <canvas
          ref={canvasRef}
          className="touch-none bg-white w-full cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-muted-foreground">
            Assine aqui
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={clearSignature}>
          Limpar
        </Button>
        <Button 
          onClick={saveSignature} 
          className="bg-delivery-success hover:bg-delivery-success/90 text-white"
          disabled={!hasSignature}
        >
          Confirmar
        </Button>
      </div>
    </Card>
  );
};

export default SignaturePad;
