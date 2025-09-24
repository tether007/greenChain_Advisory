import React, { useMemo, useState } from 'react';
import { Coins, PlugZap, GitBranch, Loader2, ListOrdered, Network } from 'lucide-react';
import Web3 from 'web3';
import axios from 'axios';
import { useNitrolite } from '../hooks/useNitrolite';
import { cropAdvisorABI, cropAdvisorAddress } from '../contracts/contractConfig';

interface NitrolitePanelProps {
  account: string | null;
  web3: Web3 | null;
  selectedImage?: File | null;
}

export const NitrolitePanel: React.FC<NitrolitePanelProps> = ({ account, web3, selectedImage }) => {
  const nitro = useNitrolite(account || undefined);
  const [timeline, setTimeline] = useState<string[]>([]);
  const [isBusy, setIsBusy] = useState(false);

  const addStep = (msg: string) => setTimeline((t) => [...t, `${new Date().toLocaleTimeString()} — ${msg}`]);

  const faucet = async () => {
    if (!account) return;
    setIsBusy(true);
    try {
      addStep('Requesting Yellow Test USD from Faucet...');
      await nitro.requestFaucet();
      addStep('Faucet success. Updated unified balance.');
    } catch (e: any) {
      addStep(`Faucet failed: ${e?.message || e}`);
    } finally {
      setIsBusy(false);
    }
  };

  const openChannel = async () => {
    if (!account) return;
    setIsBusy(true);
    try {
      addStep('Opening channel...');
      const channelId = await nitro.openChannel([account, '0x000000000000000000000000000000000000dEaD'], {
        challengeDuration: 600,
      });
      addStep(`Channel opened: ${channelId.slice(0, 10)}...`);
    } catch (e: any) {
      addStep(`Open channel failed: ${e?.message || e}`);
    } finally {
      setIsBusy(false);
    }
  };

  const simulateFlow = async () => {
    if (!account || !web3) return;
    setIsBusy(true);
    setTimeline([]);
    try {
      // Ensure connected
      if (!nitro.isConnected) {
        addStep('Connecting to ClearNode...');
        await nitro.connect();
        addStep('Connected and authenticated.');
      }

      // Wait until hook state has client available
      const waitForConnected = async () => {
        for (let i = 0; i < 25; i++) { // ~5s max
          if (nitro.isConnected && (nitro as any).client) return;
          await new Promise((r) => setTimeout(r, 200));
          try { await nitro.refreshInfo(); } catch {}
        }
        throw new Error('Nitrolite not connected');
      };
      await waitForConnected();

      // Ensure channel
      if (!nitro.activeChannelId) {
        addStep('Opening channel...');
        const channelId = await nitro.openChannel([account, '0x000000000000000000000000000000000000dEaD'], {
          challengeDuration: 600,
        });
        addStep(`Channel opened: ${channelId.slice(0, 10)}...`);
      } else {
        addStep(`Using active channel: ${nitro.activeChannelId.slice(0, 10)}...`);
      }

      // Off-chain AI prep (no on-chain action)
      addStep('Off-chain: preparing AI analysis (no gas)...');
      await new Promise((r) => setTimeout(r, 800));
      addStep('Off-chain: AI analysis logic ready.');

      // Gasless payment to request analysis on contract
      const contract = new web3.eth.Contract(cropAdvisorABI as any, cropAdvisorAddress);
      const imageHash = selectedImage ? `${selectedImage.name}-${Date.now()}` : `sim-${Date.now()}`;
      const analysisPrice = await contract.methods.analysisPrice().call();
      addStep('Submitting gasless transaction to request analysis...');
      const relayResp = await nitro.sendGaslessTransaction({
        to: cropAdvisorAddress,
        data: contract.methods.requestAnalysis(imageHash).encodeABI(),
        value: String(analysisPrice),
      });

      const txHash: string = relayResp.hash || relayResp.transactionHash;
      addStep(`Relay accepted. Tx hash: ${txHash?.slice(0, 12)}...`);

      const waitForReceipt = async () => {
        let receipt: any = null;
        for (let i = 0; i < 60; i++) {
          receipt = await web3.eth.getTransactionReceipt(txHash);
          if (receipt) return receipt;
          await new Promise((r) => setTimeout(r, 1000));
        }
        throw new Error('Timed out waiting for gasless transaction receipt');
      };
      const receipt = await waitForReceipt();
      addStep('On-chain: Payment executed via gasless relay.');

      // Decode analysisId from event
      const eventSig = web3.utils.keccak256('PaymentReceived(address,uint256,uint256)');
      const log = (receipt.logs || []).find((l: any) => l.topics && l.topics[0] === eventSig);
      if (!log) throw new Error('Payment event not found');
      const decoded: any = web3.eth.abi.decodeLog(
        [
          { type: 'address', name: 'farmer', indexed: true },
          { type: 'uint256', name: 'analysisId', indexed: true },
          { type: 'uint256', name: 'amount', indexed: false },
        ],
        log.data,
        log.topics.slice(1)
      );
      const analysisId: string = String(decoded.analysisId);
      addStep(`Analysis ID emitted: ${analysisId}`);

      // Register analysis off-chain and run AI
      addStep('Off-chain: registering analysis and running AI...');
      await axios.post('/api/analyses', { analysisId, farmerAddress: account, imageHash });
      if (selectedImage) {
        const formData = new FormData();
        formData.append('image', selectedImage);
        formData.append('analysisId', analysisId);
        await axios.post('/api/analyze', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      addStep('Off-chain: AI analysis completed (no gas).');

      // Close channel to settle final state
      addStep('Closing channel to settle (on-chain finalize)...');
      await nitro.closeActiveChannel();
      addStep('Channel close initiated. Settlement after challenge window.');
    } catch (e: any) {
      addStep(`Simulation failed: ${e?.message || e}`);
    } finally {
      setIsBusy(false);
    }
  };

  const balanceText = useMemo(() => {
    if (!nitro.unifiedBalance || nitro.unifiedBalance.length === 0) return '—';
    return nitro.unifiedBalance.map((b) => `${b.asset}: ${b.amount}`).join(', ');
  }, [nitro.unifiedBalance]);

  return (
    <div className="bg-white bg-opacity-20 backdrop-blur-lg border border-white border-opacity-30 rounded-2xl p-6 shadow-xl space-y-4">
      <div className="flex items-center gap-2 text-white">
        <Network className="w-5 h-5" />
        <h3 className="text-lg font-semibold">Nitrolite / Yellow Sandbox</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => faucet()}
          disabled={!account || isBusy}
          className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white font-medium py-2 px-3 rounded-lg disabled:opacity-50"
        >
          <div className="flex items-center justify-center gap-2">
            <Coins className="w-4 h-4" /> Request YellowUSD (Faucet)
          </div>
        </button>

        <button
          onClick={() => openChannel()}
          disabled={!account || isBusy}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-medium py-2 px-3 rounded-lg disabled:opacity-50"
        >
          <div className="flex items-center justify-center gap-2">
            <PlugZap className="w-4 h-4" /> Open Channel
          </div>
        </button>
      </div>

      <button
        onClick={() => simulateFlow()}
        disabled={!account || !web3 || isBusy}
        className="w-full bg-gradient-to-r from-purple-500 to-fuchsia-600 hover:from-purple-600 hover:to-fuchsia-700 text-white font-medium py-2 px-3 rounded-lg disabled:opacity-50"
      >
        <div className="flex items-center justify-center gap-2">
          {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitBranch className="w-4 h-4" />}
          Run Full Flow Simulation
        </div>
      </button>

      <div className="bg-gray-800 bg-opacity-50 rounded-xl p-4 text-white space-y-2">
        <div className="text-sm opacity-80">Unified Balance</div>
        <div className="text-green-200 text-sm">{balanceText}</div>
        <div className="text-sm opacity-80 mt-3">Channels</div>
        <ul className="list-disc list-inside text-gray-200 text-sm space-y-1 max-h-28 overflow-y-auto">
          {(nitro.channels || []).map((ch: any, i: number) => (
            <li key={i}>{typeof ch === 'string' ? ch : (ch?.id || JSON.stringify(ch)).toString().slice(0, 18)}...</li>
          ))}
          {(!nitro.channels || nitro.channels.length === 0) && <li>—</li>}
        </ul>
      </div>

      <div className="bg-gray-800 bg-opacity-50 rounded-xl p-4 text-white">
        <div className="flex items-center gap-2 mb-2">
          <ListOrdered className="w-4 h-4" />
          <div className="font-semibold">Timeline</div>
        </div>
        <ul className="list-disc list-inside text-gray-200 text-sm space-y-1 max-h-40 overflow-y-auto">
          {timeline.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
          {timeline.length === 0 && <li>Click "Run Full Flow Simulation" to see steps here.</li>}
        </ul>
      </div>
    </div>
  );
};


