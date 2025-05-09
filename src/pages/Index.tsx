
import React from 'react';
import DeliveryConfirmation from '@/components/DeliveryConfirmation';

// Import additional styling for react-pdf
import 'react-pdf/dist/esm/Page/TextLayer.css';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-delivery-primary text-white p-4 shadow-md">
        <div className="container mx-auto">
          <h1 className="text-xl font-bold">Sistema de Entrega</h1>
          <p className="text-sm opacity-80">Coleta de Assinaturas</p>
        </div>
      </header>
      
      <main className="container mx-auto py-6">
        <DeliveryConfirmation />
      </main>
      
      <footer className="mt-8 py-4 border-t border-gray-200 text-center text-gray-500 text-sm">
        <div className="container mx-auto">
          <p>© 2024 Sistema de Entrega | v1.0.0</p>
          <div className="mt-2 flex justify-center items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-xs">Status: {navigator.onLine ? 'Online' : 'Offline'}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
