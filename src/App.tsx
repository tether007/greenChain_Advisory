import React, { useState } from 'react';
import { Sprout, Shield, Sparkles } from 'lucide-react';
import { WalletConnection } from './components/WalletConnection';
import { ImageUpload } from './components/ImageUpload';
import { PaymentHandler } from './components/PaymentHandler';
import { AIAnalysis } from './components/AIAnalysis';
import { useNitrolite } from './hooks/useNitrolite';
import Web3 from 'web3';

// Marketplace imports
import MarketPlace from './components/MarketPlace';
import BuyPage from './components/BuyPage';
import SellPage from './components/SellPage';

// Page type
type Page = 'cropadvisor' | 'marketplace' | 'buy' | 'sell';

function App() {
  const [account, setAccount] = useState<string | null>(null);
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('cropadvisor');
  
  const nitrolite = useNitrolite(account ?? '');

  const handleWalletConnected = (connectedAccount: string, web3Instance: Web3) => {
    setAccount(connectedAccount);
    setWeb3(web3Instance);
  };

  const handleImageSelect = (file: File) => {
    setSelectedImage(file);
    setAnalysisId(null); // Reset analysis when new image is selected
  };

  const handlePaymentSuccess = (id: string) => {
    setAnalysisId(id);
  };

  // Navigation functions

  const handleNavigateHome = (): void => {
    setCurrentPage('cropadvisor');
  };

  const handleNavigateToMarketplace = (): void => {
    setCurrentPage('marketplace');
  };

  const handleDisconnect = () => {
    setAccount(null);
    setWeb3(null);
    setSelectedImage(null);
    setAnalysisId(null);
  };

  React.useEffect(() => {
    const onNavigateToBuy = () => {
      setCurrentPage('buy');
    };
    window.addEventListener('navigate_to_buy', onNavigateToBuy);
    return () => window.removeEventListener('navigate_to_buy', onNavigateToBuy);
  }, []);

  // Render current page
  const renderCurrentPage = () => {
    switch(currentPage) {
      case 'cropadvisor':
        return renderCropAdvisor();
      case 'marketplace':
        return <MarketPlace 
          onNavigate={(page: 'buy' | 'sell') => setCurrentPage(page)} 
          account={account}
          onWalletConnected={handleWalletConnected}
          onDisconnect={handleDisconnect}
        />;
      case 'buy':
        return <BuyPage onNavigateHome={handleNavigateHome} web3={web3 ?? undefined} account={account ?? undefined} />;
      case 'sell':
        return <SellPage onNavigateHome={handleNavigateHome} />;
      default:
        return renderCropAdvisor();
    }
  };

  // Original CropAdvisor content with enhanced branding
  const renderCropAdvisor = () => {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-800 via-emerald-700 to-teal-600">
        {/* Header */}
        <div className="bg-white bg-opacity-10 backdrop-blur-md border-b border-white border-opacity-20">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-green-500 bg-opacity-20 p-3 rounded-2xl">
                  <Sprout className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Greenchain-advisory</h1>
                  <p className="text-green-200">Web3-Powered Crop Disease Detection and advisory</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Back Button for Marketplace */}
                {currentPage !== 'cropadvisor' && (
                  <button
                    onClick={handleNavigateHome}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                  >
                    ← Back to CropAdvisor
                  </button>
                )}

                {/* Back to Home Button - only show when wallet is connected */}
                {account && currentPage === 'cropadvisor' && (
                  <button
                    onClick={() => {
                      handleDisconnect();
                      setCurrentPage('cropadvisor');
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                  >
                    ← Back to Home
                  </button>
                )}

                {nitrolite.isConnected && (
                  <div className="flex items-center gap-2 text-green-200">
                    <Shield className="w-4 h-4" />
                    <span className="text-sm">Gasless Ready Powered by Yellow Network</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-yellow-200">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm">AI Powered with Nitrolite SDK protocol</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          {!account ? (
            /* Two separate boxes when wallet not connected */
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left Box - Connect Wallet */}
              <div className="flex items-center justify-center min-h-[300px]">
                <WalletConnection 
                  onWalletConnected={handleWalletConnected}
                  account={account}
                  onDisconnect={handleDisconnect}
                />
              </div>

              {/* Right Box - Marketplace */}
              <div className="flex items-center justify-center min-h-[300px]">
                <div className="bg-white bg-opacity-10 backdrop-blur-lg border border-white border-opacity-20 rounded-3xl p-8 w-full max-w-md">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🌾</div>
                    <h2 className="text-2xl font-bold text-white mb-3">Farmer Marketplace</h2>
                    <p className="text-green-200 mb-6">
                      Connect farmers directly with buyers for fresh produce
                    </p>
                    <button
                      onClick={handleNavigateToMarketplace}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg transition-colors font-semibold"
                    >
                      Enter Marketplace
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Original layout when wallet connected */
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                <WalletConnection 
                  onWalletConnected={handleWalletConnected}
                  account={account}
                  onDisconnect={handleDisconnect}
                />
                
                <ImageUpload
                  onImageSelect={handleImageSelect}
                  selectedImage={selectedImage}
                  isProcessing={!!analysisId}
                />
                
                {selectedImage && web3 && !analysisId && (
                  <PaymentHandler
                    web3={web3}
                    account={account}
                    selectedImage={selectedImage}
                    onPaymentSuccess={handlePaymentSuccess}
                  />
                )}
              </div>

              {/* Right Column */}
              <div>
                {analysisId && (
                  <AIAnalysis
                    analysisId={analysisId}
                    selectedImage={selectedImage}
                  />
                )}
              </div>
            </div>
          )}

          {/* Instructions */}
          {!account && (
            <div className="mt-12 text-center">
              <div className="bg-white bg-opacity-10 backdrop-blur-lg border border-white border-opacity-20 rounded-3xl p-8 max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold text-white mb-4">
                  How It Works
                </h2>
                <div className="grid md:grid-cols-3 gap-6 text-center">
                  <div className="space-y-2">
                    <div className="bg-blue-500 bg-opacity-20 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                      <span className="text-white font-bold">1</span>
                    </div>
                    <p className="text-white font-medium">Connect Wallet</p>
                    <p className="text-gray-300 text-sm">Securely connect your MetaMask wallet</p>
                  </div>
                  <div className="space-y-2">
                    <div className="bg-green-500 bg-opacity-20 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                      <span className="text-white font-bold">2</span>
                    </div>
                    <p className="text-white font-medium">Upload & Pay</p>
                    <p className="text-gray-300 text-sm">Upload crop image and pay for analysis</p>
                  </div>
                  <div className="space-y-2">
                    <div className="bg-purple-500 bg-opacity-20 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                      <span className="text-white font-bold">3</span>
                    </div>
                    <p className="text-white font-medium">Get AI Advice</p>
                    <p className="text-gray-300 text-sm">Receive instant diagnosis and treatment</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return renderCurrentPage();
}

export default App;