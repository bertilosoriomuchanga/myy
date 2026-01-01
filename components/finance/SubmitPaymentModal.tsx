
import React, { useState } from 'react';
import Modal from '../common/Modal';
import { useData } from '../../hooks/useData';
import { useToast } from '../../hooks/useToast';
import { User, Payment } from '../../types';

interface SubmitPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  monthsToPay: { month: number, year: number, amount: number }[];
}

const MPESA_NUMBER = '+258 852735182';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

const SubmitPaymentModal: React.FC<SubmitPaymentModalProps> = ({ isOpen, onClose, user, monthsToPay }) => {
  const [view, setView] = useState<'selection' | 'upload' | 'mpesa'>('selection');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { submitPaymentProof } = useData();
  const { addToast } = useToast();

  const totalAmount = monthsToPay.reduce((sum, item) => sum + item.amount, 0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async () => {
    if (!file) {
      addToast('Por favor, anexe um comprovativo.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
        const fileContent = await fileToBase64(file);
        const proofData = {
            fileName: file.name,
            fileContent: fileContent,
            fileType: file.type
        };
        await submitPayments('Comprovativo Manual', proofData);
    } catch (error) {
        addToast('Erro ao processar o ficheiro.', 'error');
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleMpesaSubmit = async () => {
    setIsSubmitting(true);
    await submitPayments('M-Pesa (Simulado)');
    setIsSubmitting(false);
  };

  const submitPayments = async (method: Payment['method'], proofData?: { fileName?: string; fileContent?: string; fileType?: string; }) => {
    try {
      for (const item of monthsToPay) {
        await submitPaymentProof(user.id, item.month, item.year, item.amount, method, proofData);
      }
      addToast('Pagamento submetido com sucesso! Aguarde a confirmação.', 'success');
      handleClose();
    } catch (error) {
      addToast('Ocorreu um erro ao submeter o pagamento.', 'error');
    }
  };

  const handleClose = () => {
    setView('selection');
    setFile(null);
    onClose();
  };

  const renderSelectionView = () => (
    <div className="text-center">
        <p className="text-lg mb-2">Total a Pagar: <span className="font-bold text-mycese-blue">MZN {totalAmount.toFixed(2)}</span></p>
        <p className="mb-6 text-gray-600">Escolha o seu método de pagamento.</p>
        <div className="flex flex-col sm:flex-row gap-4">
            <button onClick={() => setView('mpesa')} className="flex-1 p-4 border rounded-lg hover:bg-gray-100 transition">
                <i className="fas fa-mobile-alt text-3xl text-red-500 mb-2"></i>
                <p className="font-semibold">Pagar com M-Pesa</p>
            </button>
            <button onClick={() => setView('upload')} className="flex-1 p-4 border rounded-lg hover:bg-gray-100 transition">
                <i className="fas fa-file-upload text-3xl text-mycese-blue mb-2"></i>
                <p className="font-semibold">Enviar Comprovativo</p>
            </button>
        </div>
    </div>
  );

  const renderUploadView = () => (
    <div className="space-y-4">
      <button onClick={() => setView('selection')} className="text-sm text-mycese-blue hover:underline"><i className="fas fa-arrow-left mr-2"></i>Voltar</button>
      <p className="text-sm text-gray-600">
        Se pagou por numerário ou outra via, anexe o comprovativo (PDF ou Imagem) abaixo.
      </p>
      <div>
        <label className="block mb-1 font-semibold">Anexar Comprovativo</label>
        <input 
          type="file" 
          accept="image/*,.pdf" 
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-mycese-blue hover:file:bg-blue-100"
          required
        />
        {file && <p className="text-xs text-gray-500 mt-1">Ficheiro selecionado: {file.name}</p>}
      </div>
      <div className="text-right pt-4">
        <button onClick={handleUploadSubmit} disabled={isSubmitting} className="bg-mycese-orange text-white font-bold py-2 px-6 rounded-lg hover:bg-opacity-90 transition disabled:bg-gray-400">
            {isSubmitting ? 'Enviando...' : 'Enviar'}
        </button>
      </div>
    </div>
  );
  
  const renderMpesaView = () => (
    <div className="space-y-4 text-center">
        <button onClick={() => setView('selection')} className="float-left text-sm text-mycese-blue hover:underline"><i className="fas fa-arrow-left mr-2"></i>Voltar</button>
        <h4 className="text-xl font-semibold pt-4">Pagar com M-Pesa</h4>
        <p className="text-gray-600">Siga as instruções abaixo para completar o pagamento no seu telemóvel.</p>
        <div className="bg-gray-100 p-4 rounded-lg">
            <p className="text-sm">Número de Pagamento:</p>
            <p className="text-2xl font-bold tracking-wider text-mycese-text-dark">{MPESA_NUMBER}</p>
        </div>
        <div className="text-left text-sm text-gray-500 px-4">
            <p>1. Abra o M-Pesa no seu telemóvel.</p>
            <p>2. Selecione a opção para pagar serviços/comerciante.</p>
            <p>3. Insira o número acima e o valor de <span className="font-bold">MZN {totalAmount.toFixed(2)}</span>.</p>
            <p>4. Confirme o pagamento com o seu PIN.</p>
        </div>
        <div className="pt-4">
            <button onClick={handleMpesaSubmit} disabled={isSubmitting} className="w-full bg-green-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-600 transition disabled:bg-gray-400">
                {isSubmitting ? 'Processando...' : 'Já efetuei o pagamento'}
            </button>
        </div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Submeter Pagamento de Quota">
      <div>
        {view === 'selection' && renderSelectionView()}
        {view === 'upload' && renderUploadView()}
        {view === 'mpesa' && renderMpesaView()}
      </div>
    </Modal>
  );
};

export default SubmitPaymentModal;
