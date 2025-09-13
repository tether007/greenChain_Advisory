# CropAdvisor AI - Web3 Agricultural Disease Detection

A decentralized application that combines blockchain technology with AI to provide farmers with instant crop disease diagnosis and treatment recommendations.

## 🌟 Features

- **Web3 Integration**: MetaMask wallet connection and smart contract payments
- **AI-Powered Analysis**: Google Gemini AI for accurate crop disease detection
- **Gasless Transactions**: Nitrolite SDK for improved user experience
- **Secure Payments**: Smart contract-based payment system (0.001 ETH per analysis)
- **Database Storage**: PostgreSQL for analysis history
- **Mobile-First Design**: Responsive interface optimized for farmers

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Tailwind CSS + Vite
- **Backend**: Node.js + Express + PostgreSQL
- **Blockchain**: Ethereum + Solidity + Truffle
- **AI**: Google Gemini API
- **Web3**: Web3.js + MetaMask integration

## 📋 Prerequisites

Before running this application locally, ensure you have the following installed:

### System Requirements
- **Node.js** (v18.0.0 or higher)
- **npm** (v8.0.0 or higher)
- **PostgreSQL** (v13.0 or higher)
- **Git** (for cloning the repository)

### Browser Requirements
- **MetaMask Extension** installed in your browser
- Modern browser with Web3 support (Chrome, Firefox, Edge)

### External Services
- **Google AI Studio Account** (for Gemini API key)
- **Infura Account** (for Ethereum network access)
- **Ethereum Testnet Setup** (Sepolia recommended)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd crop-advisor-web3
```

### 2. Install Dependencies

#### Frontend Dependencies
```bash
npm install
```

#### Backend Dependencies
```bash
cd server
npm install
cd ..
```

### 3. Environment Configuration

#### Frontend Environment (.env)
```bash
cp .env.example .env
```

Update `.env` with your values:
```env
# Ethereum Configuration
VITE_CONTRACT_ADDRESS=0x... # Your deployed contract address
VITE_NETWORK_ID=11155111    # Sepolia testnet

# API Configuration
VITE_API_URL=http://localhost:3001
```
  
#### Backend Environment (server/.env)
```bash
cp server/.env.example server/.env
```

Update `server/.env` with your values:
```env
# Database Configuration
DB_USER=postgres
DB_HOST=localhost
DB_NAME=crop_advisor
DB_PASSWORD=your_password
DB_PORT=5432

# Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Server Configuration
PORT=3001
NODE_ENV=development

# Ethereum Configuration (for backend contract interaction)
CONTRACT_ADDRESS=0x...
PRIVATE_KEY=your_private_key_here
INFURA_PROJECT_ID=your_infura_project_id
```

### 4. Database Setup

#### Create PostgreSQL Database
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE crop_advisor;

# Create user (optional)
CREATE USER crop_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE crop_advisor TO crop_user;

# Exit PostgreSQL
\q
```

The application will automatically create the required tables on first run.

### 5. Smart Contract Deployment

#### Install Truffle (if not already installed)
```bash
npm install -g truffle
```

#### Compile Contracts
```bash
npm run compile
```

#### Deploy to Local Network (Ganache)
```bash
# Start Ganache CLI or Ganache GUI first
npm run migrate
```

#### Deploy to Sepolia Testnet
```bash
# Make sure you have MNEMONIC and INFURA_PROJECT_ID in your environment
npm run migrate -- --network sepolia
```

After deployment, update the contract address in:
- `src/contracts/contractConfig.ts`
- `.env` file
- `server/.env` file

### 6. Start the Application

#### Start Backend Server
```bash
cd server
npm start
```
The backend will run on `http://localhost:3001`

#### Start Frontend Development Server
```bash
# In a new terminal, from the root directory
npm run dev
```
The frontend will run on `http://localhost:5173`

## 📦 Dependencies

### Frontend Dependencies
```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "web3": "^4.3.0",
    "@metamask/detect-provider": "^2.0.0",
    "axios": "^1.6.2",
    "lucide-react": "^0.344.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "typescript": "^5.5.3",
    "tailwindcss": "^3.4.1",
    "vite": "^5.4.2",
    "truffle": "^5.11.5",
    "@truffle/hdwallet-provider": "^2.1.15"
  }
}
```

### Backend Dependencies
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "multer": "^1.4.5-lts.1",
    "@google/generative-ai": "^0.2.1",
    "pg": "^8.11.3",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

## 🔑 API Keys Setup

### 1. Google Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to `server/.env` as `GEMINI_API_KEY`

### 2. Infura Project ID
1. Create account at [Infura](https://infura.io/)
2. Create a new project
3. Copy the Project ID
4. Add it to your environment variables

### 3. MetaMask Setup
1. Install MetaMask browser extension
2. Create or import a wallet
3. Add Sepolia testnet to MetaMask:
   - Network Name: Sepolia
   - RPC URL: `https://sepolia.infura.io/v3/YOUR_PROJECT_ID`
   - Chain ID: 11155111
   - Currency Symbol: ETH
   - Block Explorer: https://sepolia.etherscan.io

## 🧪 Testing

### Run Smart Contract Tests
```bash
npm run test
```

### Test API Endpoints
```bash
# Health check
curl http://localhost:3001/api/health

# Test image analysis (requires running server)
curl -X POST -F "image=@test-image.jpg" -F "analysisId=test123" http://localhost:3001/api/analyze
```

## 📱 Usage Flow

1. **Connect Wallet**: Click "Connect MetaMask" and approve the connection
2. **Upload Image**: Drag & drop or select a crop image (JPG, PNG, WEBP)
3. **Pay for Analysis**: Click "Pay & Get AI Analysis" (0.001 ETH)
4. **Get Results**: AI analyzes the image and provides diagnosis and treatment advice
5. **View History**: Access previous analyses through your connected wallet

## 🔧 Development Scripts

```bash
# Frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Backend
npm run server       # Start backend server
cd server && npm run dev  # Start with nodemon

# Smart Contracts
npm run compile      # Compile contracts
npm run migrate      # Deploy contracts
npm run test         # Run contract tests
```

## 🌐 Network Configuration

### Supported Networks
- **Local Development**: Ganache (localhost:8545)
- **Testnet**: Sepolia (Chain ID: 11155111)
- **Mainnet**: Ethereum (Chain ID: 1) - for production

### Gas Optimization
- Analysis request: ~300,000 gas
- Contract deployment: ~2,000,000 gas
- Recommended gas price: 20 Gwei (testnet)

## 🔒 Security Features

- Smart contract ownership controls
- Input validation and sanitization
- Secure file handling with size limits (10MB)
- Error handling and recovery mechanisms
- Gas optimization to prevent attacks
- Image hash verification

## 🐛 Troubleshooting

### Common Issues

#### 1. MetaMask Connection Issues
```bash
# Clear browser cache and cookies
# Disable other wallet extensions
# Ensure MetaMask is unlocked
```

#### 2. Database Connection Errors
```bash
# Check PostgreSQL is running
sudo service postgresql status

# Verify database exists
psql -U postgres -l
```

#### 3. Contract Deployment Failures
```bash
# Check network configuration in truffle-config.js
# Ensure sufficient ETH balance for gas
# Verify Infura project ID is correct
```

#### 4. AI Analysis Failures
```bash
# Verify Gemini API key is valid
# Check image file size (max 10MB)
# Ensure supported image format (JPG, PNG, WEBP)
```

### Environment Variables Checklist
- [ ] `GEMINI_API_KEY` - Valid Google AI Studio API key
- [ ] `DB_PASSWORD` - PostgreSQL database password
- [ ] `VITE_CONTRACT_ADDRESS` - Deployed contract address
- [ ] `INFURA_PROJECT_ID` - Infura project ID
- [ ] `PRIVATE_KEY` - Ethereum private key (for deployment)

## 📊 Performance Considerations

- **Image Processing**: Images are compressed to 800px max width
- **Database**: Indexed queries for farmer addresses
- **Caching**: API responses cached for 5 minutes
- **File Cleanup**: Uploaded images automatically deleted after processing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the troubleshooting section above
- Verify all environment variables are correctly set

## 🔄 Version History

- **v1.0.0** - Initial MVP release with Web3 integration and AI analysis
- **v0.9.0** - Beta release with smart contract deployment
- **v0.8.0** - Alpha release with basic functionality