import React, { useState } from 'react';
import { X, CreditCard, Loader, CheckCircle, AlertCircle, User, MapPin } from 'lucide-react';
import Web3 from 'web3';
import { cropAdvisorABI, cropAdvisorAddress } from '../contracts/contractConfig';

interface Product {
  id: number;
  name: string;
  price: number;
  quantity: string;
  image: string;
  farmer: string;
  farmerAddress: string; // Add farmer wallet address
  location: string;
  rating: number;
  description: string;
}

interface BuyConfirmationModalProps {
  product: Product;
  quantity: number;
  onClose: () => void;
  onPurchaseSuccess: (transactionHash: string) => void;
  web3: Web3;
  account: string;
}

export const BuyConfirmationModal: React.FC<BuyConfirmationModalProps> = ({
  product,
  quantity,
  onClose,
  onPurchaseSuccess,
  web3,
  account
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  const totalPrice = product.price * quantity;
  const totalPriceWei = web3.utils.toWei(totalPrice.toString(), 'ether');

  const handlePurchase = async () => {
    setIsProcessing(true);
    setError(null);
    setTransactionHash(null);

    try {
      // Validate contract address
      if (!web3.utils.isAddress(cropAdvisorAddress)) {
        throw new Error('Invalid contract address. Please check configuration.');
      }

      const code = await web3.eth.getCode(cropAdvisorAddress);
      if (!code || code === '0x' || code === '0x0') {
        throw new Error('No contract found at the configured address on the current network.');
      }

      const contract = new web3.eth.Contract(cropAdvisorABI, cropAdvisorAddress);
      
      // Use the smart contract purchaseProduct function
      const transaction = await contract.methods.purchaseProduct(
        product.farmerAddress,
        product.name
      ).send({
        from: account,
        value: totalPriceWei,
        gas: '100000'
      });

      setTransactionHash(transaction.transactionHash);
      onPurchaseSuccess(transaction.transactionHash);
      
    } catch (err: any) {
      console.error('Purchase failed:', err);
      setError(err.message || 'Purchase failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Confirm Purchase</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isProcessing}
          >
            <X size={24} />
          </button>
        </div>

        {/* Product Details */}
        <div className="p-6 space-y-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center text-2xl">
              🌾
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800">{product.name}</h3>
              <p className="text-sm text-gray-600">{product.description}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <User size={16} />
              <span>Farmer: {product.farmer}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <MapPin size={16} />
              <span>{product.location}</span>
            </div>
          </div>

          {/* Purchase Summary */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span>Price per kg:</span>
              <span>₹{product.price}</span>
            </div>
            <div className="flex justify-between">
              <span>Quantity:</span>
              <span>{quantity} kg</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between font-semibold text-lg">
                <span>Total:</span>
                <span>₹{totalPrice}</span>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Success Display */}
          {transactionHash && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Purchase successful!</span>
              </div>
              <p className="text-xs text-green-500 mt-1 break-all">
                TX: {transactionHash}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handlePurchase}
              disabled={isProcessing}
              className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Confirm Purchase
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
