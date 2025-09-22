import React from 'react';
import Web3 from 'web3';
import { WalletConnection } from './WalletConnection';

interface MarketPlaceProps {
  onNavigate: (page: 'buy' | 'sell') => void;
  account?: string | null;
  onWalletConnected: (connectedAccount: string, web3Instance: Web3) => void;
  onDisconnect: () => void;
}

const MarketPlace: React.FC<MarketPlaceProps> = ({
  onNavigate,
  account,
  onWalletConnected,
  onDisconnect
}) => {
  return (
    <div className="marketplace-page">
      <div className="marketplace-container">
        <div className="marketplace-wallet">
          <WalletConnection
            onWalletConnected={onWalletConnected}
            account={account ?? null}
            onDisconnect={onDisconnect}
          />
        </div>

        <div className="marketplace-hero">
          <h1 className="marketplace-title">🌾 Farmer Marketplace</h1>
          <p className="marketplace-subtitle">Direct connection between farmers and buyers</p>
          <p className="marketplace-tagline">Fresh produce, fair prices, sustainable farming</p>
        </div>

        <div className="marketplace-grid">
          <div className="marketplace-card" onClick={() => onNavigate('buy')}>
            <div className="marketplace-card-icon">🛒</div>
            <h2 className="marketplace-card-title">BUY</h2>
            <p className="marketplace-card-desc">Browse fresh produce directly from farmers</p>
            <div className="marketplace-card-cta">
              <span>Start Shopping</span>
            </div>
          </div>

          <div className="marketplace-card" onClick={() => onNavigate('sell')}>
            <div className="marketplace-card-icon">🌱</div>
            <h2 className="marketplace-card-title">SELL</h2>
            <p className="marketplace-card-desc">List your farm products and reach more customers</p>
            <div className="marketplace-card-cta">
              <span>List Products</span>
            </div>
          </div>
        </div>

        <div className="marketplace-why">
          <h3 className="marketplace-why-title">Why Choose Our Marketplace?</h3>
          <div className="marketplace-why-grid">
            <div>
              <div className="marketplace-why-item-icon">🚚</div>
              <p>Direct from Farm</p>
            </div>
            <div>
              <div className="marketplace-why-item-icon">💰</div>
              <p>Fair Pricing</p>
            </div>
            <div>
              <div className="marketplace-why-item-icon">🌿</div>
              <p>Fresh & Organic</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketPlace;

