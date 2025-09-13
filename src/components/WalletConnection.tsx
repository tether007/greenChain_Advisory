import React, { useState } from 'react';
import { Wallet, CheckCircle, AlertCircle } from 'lucide-react';
import detectEthereumProvider from '@metamask/detect-provider';
import Web3 from 'web3';

interface WalletConnectionProps {
  onWalletConnected: (account: string, web3: Web3) => void;
  account: string | null;
  onDisconnect?: () => void;
}

export const WalletConnection: React.FC<WalletConnectionProps> = ({ 
  onWalletConnected, 
  account,
  onDisconnect
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  

  const connectWallet = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const provider = await detectEthereumProvider();
      
      if (!provider) {
        throw new Error('Please install MetaMask to use this application');
      }

      // Ensure MetaMask is on local chain (default chainId 1337 -> 0x539)
      const targetChainId = (import.meta as any).env?.VITE_CHAIN_ID_HEX || '0x539'; // 1337
      const targetRpcUrl = (import.meta as any).env?.VITE_RPC_URL || 'http://127.0.0.1:7545';

      try {
        const currentChainId = await (provider as any).request({ method: 'eth_chainId' });
        if (currentChainId !== targetChainId) {
          try {
            await (provider as any).request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: targetChainId }]
            });
          } catch (switchError: any) {
            if (switchError?.code === 4902) {
              await (provider as any).request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: targetChainId,
                  chainName: 'Ganache Local',
                  rpcUrls: [targetRpcUrl],
                  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }
                }]
              });
            } else {
              throw switchError;
            }
          }
        }
      } catch (netErr: any) {
        // Surface but don't crash provider creation
        console.warn('Network switch failed:', netErr);
      }

      const web3Instance = new Web3(provider as any);

      const accounts = await web3Instance.eth.requestAccounts();
      
      if (accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask');
      }

      onWalletConnected(accounts[0], web3Instance);
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (account) {
    return (
      <div className="bg-white bg-opacity-20 backdrop-blur-lg border border-white border-opacity-30 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between gap-3">
          <CheckCircle className="w-6 h-6 text-green-400" />
          <div className="flex-1">
            <p className="text-white font-medium">Wallet Connected</p>
            <p className="text-green-200 text-sm">{shortenAddress(account)}</p>
          </div>
          <button
            onClick={() => {
              try {
                onDisconnect && onDisconnect();
              } catch {}
            }}
            className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors"
          >
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white bg-opacity-20 backdrop-blur-lg border border-white border-opacity-30 rounded-2xl p-6 shadow-xl">
      <div className="text-center">
        <Wallet className="w-12 h-12 text-white mx-auto mb-4" />
        <h3 className="text-white text-lg font-semibold mb-2">Connect Your Wallet</h3>
        <p className="text-gray-200 mb-4 text-sm">
          Connect your MetaMask wallet to start getting AI-powered crop advice
        </p>
        
        {error && (
          <div className="bg-red-500 bg-opacity-20 border border-red-400 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 text-red-200">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}
        
        <button
          onClick={connectWallet}
          disabled={isConnecting}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isConnecting ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Connecting...
            </div>
          ) : (
            'Connect MetaMask'
          )}
        </button>
      </div>
    </div>
  );
};