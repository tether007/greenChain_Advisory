import React, { useEffect, useState } from 'react';
import { Star, MapPin, User, Send, X } from 'lucide-react';
import { BuyConfirmationModal } from './BuyConfirmationModal';
import Web3 from 'web3';

interface Product {
  id: number;
  name: string;
  price: number;
  quantity: string;
  image: string;
  farmer: string;
  farmerAddress: string;
  location: string;
  rating: number;
  description: string;
}

interface BuyPageProps {
  onNavigateHome: () => void;
  web3?: Web3;
  account?: string;
}

interface ContactFarmerModalProps {
  farmer: string;
  productName: string;
  onClose: () => void;
}

interface ProductDetailsProps {
  product: Product;
  onBack: () => void;
  onHome: () => void;
  web3?: Web3;
  account?: string;
}

interface ChatMessage {
  id: number;
  sender: 'farmer' | 'buyer';
  text: string;
  timestamp: string;
}

// Sample products data
const sampleProducts: Product[] = [
  {
    id: 1,
    name: "Fresh Tomatoes",
    price: 50,
    quantity: "100 kg",
    image: "/api/placeholder/300/200",
    farmer: "John Doe",
    farmerAddress: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    location: "Karnataka, India",
    rating: 4.5,
    description: "Fresh organic tomatoes grown without pesticides"
  },
  {
    id: 2,
    name: "Basmati Rice",
    price: 80,
    quantity: "50 kg",
    image: "/api/placeholder/300/200",
    farmer: "Priya Singh",
    farmerAddress: "0x8ba1f109551bD432803012645Hac136c4c8e4d8b7",
    location: "Punjab, India",
    rating: 4.8,
    description: "Premium quality basmati rice, aged for 2 years"
  },
  {
    id: 3,
    name: "Fresh Onions",
    price: 30,
    quantity: "200 kg",
    image: "/api/placeholder/300/200",
    farmer: "Ravi Kumar",
    farmerAddress: "0x9ca2f209661cE543904123756Ibd247d5d9e5e9c8",
    location: "Maharashtra, India",
    rating: 4.2,
    description: "Red onions, freshly harvested"
  },
  {
    id: 4,
    name: "Organic Wheat",
    price: 25,
    quantity: "150 kg",
    image: "/api/placeholder/300/200",
    farmer: "Amit Sharma",
    farmerAddress: "0x0db3f309771dF654015234867Jce358e6e0f6f0d9",
    location: "Haryana, India",
    rating: 4.6,
    description: "Organic wheat flour, stone ground"
  },
  {
    id: 5,
    name: "Fresh Potatoes",
    price: 20,
    quantity: "300 kg",
    image: "/api/placeholder/300/200",
    farmer: "Sunita Devi",
    farmerAddress: "0x1ec4f409881eG765126345978Kdf469f7f1g7g1ea",
    location: "Uttar Pradesh, India",
    rating: 4.3,
    description: "Fresh potatoes, perfect for cooking"
  },
  {
    id: 6,
    name: "Green Chilies",
    price: 40,
    quantity: "25 kg",
    image: "/api/placeholder/300/200",
    farmer: "Rajesh Patel",
    farmerAddress: "0x2fd5f509991fH876237456089Leg570g8g2h8h2fb",
    location: "Gujarat, India",
    rating: 4.7,
    description: "Spicy green chilies, organically grown"
  }
];

// Contact Farmer Modal Component
const ContactFarmerModal: React.FC<ContactFarmerModalProps> = ({ farmer, productName, onClose }) => {
  const [message, setMessage] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      sender: 'farmer',
      text: `Hello! Thank you for your interest in my ${productName}. How can I help you?`,
      timestamp: new Date().toLocaleTimeString()
    }
  ]);

  const sendMessage = (): void => {
    if (message.trim()) {
      const newMessage: ChatMessage = {
        id: chatMessages.length + 1,
        sender: 'buyer',
        text: message,
        timestamp: new Date().toLocaleTimeString()
      };
      
      setChatMessages([...chatMessages, newMessage]);
      setMessage('');
      
      // Simulate farmer response after 2 seconds
      setTimeout(() => {
        const farmerResponse: ChatMessage = {
          id: chatMessages.length + 2,
          sender: 'farmer',
          text: "Thank you for your message! I'll get back to you shortly with more details.",
          timestamp: new Date().toLocaleTimeString()
        };
        setChatMessages(prev => [...prev, farmerResponse]);
      }, 2000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg h-96 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <User className="text-green-600" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">{farmer}</h3>
              <p className="text-sm text-gray-600">Farmer</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'buyer' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.sender === 'buyer'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p className="text-sm">{msg.text}</p>
                <p className={`text-xs mt-1 ${
                  msg.sender === 'buyer' ? 'text-green-100' : 'text-gray-500'
                }`}>
                  {msg.timestamp}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="p-4 border-t">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={message}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <button
              onClick={sendMessage}
              className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Send size={20} />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            You can also contact via phone: +91-9876543210
          </p>
        </div>
      </div>
    </div>
  );
};

// Product Details Component
const ProductDetails: React.FC<ProductDetailsProps> = ({ product, onBack, onHome, web3, account }) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [showContactModal, setShowContactModal] = useState<boolean>(false);
  const [showBuyModal, setShowBuyModal] = useState<boolean>(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <button onClick={onBack} className="text-green-600 hover:text-green-700">
              ← Back to Products
            </button>
            <button onClick={onHome} className="text-gray-600 hover:text-gray-700">
              Home
            </button>
          </div>
        </div>
      </div>

      {/* Product Details */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            {/* Left Side - Image */}
            <div className="lg:w-1/2">
              <div className="h-96 lg:h-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center text-8xl">
                🌾
              </div>
            </div>
            
            {/* Right Side - Details */}
            <div className="lg:w-1/2 p-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-4">{product.name}</h1>
              <p className="text-gray-600 mb-6">{product.description}</p>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center space-x-3">
                  <User className="text-gray-400" size={20} />
                  <div>
                    <p className="font-semibold">{product.farmer}</p>
                    <p className="text-sm text-gray-600">Farmer</p>
                    <p className="text-xs text-gray-500">
                      Wallet: {product.farmerAddress.slice(0, 6)}...{product.farmerAddress.slice(-4)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <MapPin className="text-gray-400" size={20} />
                  <span>{product.location}</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Star className="text-yellow-400 fill-current" size={20} />
                  <span>{product.rating} Rating</span>
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl font-bold text-green-600">₹{product.price}/kg</span>
                  <span className="text-gray-600">{product.quantity} available</span>
                </div>
                
                <div className="flex items-center space-x-4 mb-6">
                  <label className="font-semibold">Quantity (kg):</label>
                  <input 
                    type="number" 
                    value={quantity} 
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuantity(Number(e.target.value))}
                    className="border rounded-lg px-3 py-2 w-20"
                    min="1"
                  />
                  <span className="text-gray-600">Total: ₹{product.price * quantity}</span>
                </div>
                
                <div className="space-y-3">
                  {purchaseSuccess ? (
                    <div className="w-full bg-green-100 text-green-800 py-3 px-6 rounded-lg text-center font-semibold">
                      ✅ Purchase Successful! TX: {purchaseSuccess.slice(0, 10)}...
                    </div>
                  ) : (
                    <button 
                      onClick={() => setShowBuyModal(true)}
                      disabled={!web3 || !account}
                      className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {!web3 || !account ? 'Connect Wallet to Buy' : 'Buy Now'}
                    </button>
                  )}
                  <button 
                    onClick={() => setShowContactModal(true)}
                    className="w-full border border-green-600 text-green-600 py-3 px-6 rounded-lg hover:bg-green-50 transition-colors"
                  >
                    Contact Farmer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Farmer Modal */}
      {showContactModal && (
        <ContactFarmerModal 
          farmer={product.farmer} 
          productName={product.name}
          onClose={() => setShowContactModal(false)} 
        />
      )}

      {/* Buy Confirmation Modal */}
      {showBuyModal && web3 && account && (
        <BuyConfirmationModal
          product={product}
          quantity={quantity}
          onClose={() => setShowBuyModal(false)}
          onPurchaseSuccess={(txHash) => {
            setPurchaseSuccess(txHash);
            setShowBuyModal(false);
          }}
          web3={web3}
          account={account}
        />
      )}
    </div>
  );
};

// Main BuyPage Component
const BuyPage: React.FC<BuyPageProps> = ({ onNavigateHome, web3, account }) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>(sampleProducts);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('marketplace_listings');
      const parsed: any[] = stored ? JSON.parse(stored) : [];
      if (Array.isArray(parsed) && parsed.length > 0) {
        const mapped: Product[] = parsed.map((p: any, idx: number) => ({
          id: p.id ?? Date.now() + idx,
          name: p.name,
          price: Number(p.price),
          quantity: p.quantity,
          image: p.image,
          farmer: p.farmer,
          farmerAddress: p.farmerAddress || '0x0000000000000000000000000000000000000000',
          location: p.location,
          rating: Number(p.rating || 4.5),
          description: p.description
        }));
        setProducts(prev => [...mapped, ...prev]);
      }
    } catch (e) {
      console.error('Failed to load listings', e);
    }
  }, []);

  if (selectedProduct) {
    return (
      <ProductDetails 
        product={selectedProduct} 
        onBack={() => setSelectedProduct(null)}
        onHome={onNavigateHome}
        web3={web3}
        account={account}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={onNavigateHome}
                className="text-green-600 hover:text-green-700 font-semibold"
              >
                ← Back to Home
              </button>
              <h1 className="text-2xl font-bold text-gray-800">Browse Products</h1>
            </div>
            <div className="text-sm text-gray-600">
              {products.length} products available
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div 
              key={product.id}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden cursor-pointer"
              onClick={() => setSelectedProduct(product)}
            >
              <div className="h-48 bg-gray-200 relative">
                <div className="absolute inset-0 flex items-center justify-center text-4xl">
                  🌾
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{product.name}</h3>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl font-bold text-green-600">₹{product.price}/kg</span>
                  <span className="text-sm text-gray-500">{product.quantity} available</span>
                </div>
                
                <div className="flex items-center space-x-2 mb-3">
                  <User size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-600">{product.farmer}</span>
                </div>
                
                <div className="flex items-center space-x-2 mb-3">
                  <MapPin size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-600">{product.location}</span>
                </div>
                
                <div className="flex items-center space-x-1 mb-4">
                  <Star size={16} className="text-yellow-400 fill-current" />
                  <span className="text-sm text-gray-600">{product.rating}</span>
                </div>
                
                <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BuyPage;