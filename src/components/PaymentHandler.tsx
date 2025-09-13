import React, { useState } from 'react';
import { CreditCard, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import Web3 from 'web3';
import axios from 'axios';
import { cropAdvisorABI, cropAdvisorAddress } from '../contracts/contractConfig';
import { useNitrolite } from '../hooks/useNitrolite';

interface PaymentHandlerProps {
  web3: Web3;
  account: string;
  selectedImage: File;
  onPaymentSuccess: (analysisId: string) => void;
}

export const PaymentHandler: React.FC<PaymentHandlerProps> = ({
  web3,
  account,
  selectedImage,
  onPaymentSuccess
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const nitrolite = useNitrolite();

  const handlePayment = async () => {
    setIsProcessing(true);
    setError(null);
    setTransactionHash(null);

    try {
      // Validate contract address
      if (!web3.utils.isAddress(cropAdvisorAddress)) {
        throw new Error('Invalid contract address. Set VITE_CONTRACT_ADDRESS to your deployed CropAdvisor address.');
      }

      const code = await web3.eth.getCode(cropAdvisorAddress);
      if (!code || code === '0x' || code === '0x0') {
        throw new Error('No contract found at the configured address on the current network. Check network and address.');
      }

      const contract = new web3.eth.Contract(cropAdvisorABI, cropAdvisorAddress);
      
      // Get analysis price from contract
      const analysisPrice = await contract.methods.analysisPrice().call();
      
      // Create image hash (simplified for MVP)
      const imageHash = `${selectedImage.name}-${Date.now()}`;
      
      // Send transaction
      let transaction: any;
      if (nitrolite.isConnected && nitrolite.client) {
        const relayResp = await nitrolite.client.sendGaslessTransaction({
          to: cropAdvisorAddress,
          data: contract.methods.requestAnalysis(imageHash).encodeABI(),
          value: String(analysisPrice)
        });

        // Poll for receipt and decode event
        const hash = relayResp.hash;
        const waitForReceipt = async () => {
          let receipt = null as any;
          for (let i = 0; i < 60; i++) {
            receipt = await web3.eth.getTransactionReceipt(hash);
            if (receipt) return receipt;
            await new Promise(r => setTimeout(r, 1000));
          }
          throw new Error('Timed out waiting for gasless transaction receipt');
        };
        const receipt = await waitForReceipt();
        setTransactionHash(hash);

        // Decode PaymentReceived(address,uint256,uint256)
        const eventSig = web3.utils.keccak256('PaymentReceived(address,uint256,uint256)');
        const log = receipt.logs.find((l: any) => l.topics && l.topics[0] === eventSig);
        if (!log) throw new Error('Payment event not found');
        const decoded = web3.eth.abi.decodeLog(
          [
            { type: 'address', name: 'farmer', indexed: true },
            { type: 'uint256', name: 'analysisId', indexed: true },
            { type: 'uint256', name: 'amount', indexed: false }
          ],
          log.data,
          log.topics.slice(1)
        ) as any;
        transaction = { events: { PaymentReceived: { returnValues: decoded } } };
      } else {
        transaction = await contract.methods.requestAnalysis(imageHash).send({
          from: account,
          value: String(analysisPrice),
          gas: '300000'
        });
      }
      
      setTransactionHash(transaction.transactionHash);
      
      // Get the analysis ID from the event
      const events = (transaction as any).events;
      const paymentEvent = events?.PaymentReceived;
      
      if (paymentEvent && paymentEvent.returnValues) {
        const analysisId = String(paymentEvent.returnValues.analysisId);
        await axios.post('/api/analyses', {
          analysisId,
          farmerAddress: account,
          imageHash,
        });
        onPaymentSuccess(analysisId);
      }
      
    } catch (err: any) {
      console.error('Payment failed:', err);
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white bg-opacity-20 backdrop-blur-lg border border-white border-opacity-30 rounded-2xl p-6 shadow-xl">
      <h3 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
        <CreditCard className="w-5 h-5" />
        Payment for AI Analysis
      </h3>
      
      <div className="space-y-4">
        <div className="bg-gray-800 bg-opacity-50 rounded-xl p-4">
          <div className="flex justify-between items-center text-white">
            <span>AI Crop Analysis</span>
            <span className="font-bold">0.001 ETH</span>
          </div>
          <p className="text-gray-300 text-sm mt-1">
            ~$2.50 USD • Instant AI diagnosis
          </p>
        </div>

        {error && (
          <div className="bg-red-500 bg-opacity-20 border border-red-400 rounded-lg p-3">
            <div className="flex items-center gap-2 text-red-200">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {transactionHash && (
          <div className="bg-green-500 bg-opacity-20 border border-green-400 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-200">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Payment successful!</span>
            </div>
            <p className="text-xs text-green-300 mt-1 break-all">
              TX: {transactionHash}
            </p>
          </div>
        )}

        <button
          onClick={handlePayment}
          disabled={isProcessing || !selectedImage}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isProcessing ? (
            <div className="flex items-center justify-center gap-2">
              <Loader className="w-4 h-4 animate-spin" />
              Processing Payment...
            </div>
          ) : (
            'Pay & Get AI Analysis'
          )}
        </button>
      </div>
    </div>
  );
};