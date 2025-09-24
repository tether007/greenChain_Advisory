import { useEffect, useMemo, useState } from "react";
import { NitroliteClient } from "@erc7824/nitrolite";

type Nullable<T> = T | null;

interface NitroliteState {
  isConnecting: boolean;
  isConnected: boolean;
  client: Nullable<NitroliteClient>;
  activeChannelId: Nullable<string>;
  error: Nullable<string>;
  unifiedBalance: Nullable<{ asset: string; amount: string }[]>;
  channels: any[];
}

const CLEAR_NODE_WS = "wss://clearnet-sandbox.yellow.com/ws";
const CLEAR_NODE_FAUCET = "https://clearnet-sandbox.yellow.com/faucet/requestTokens";

export const useNitrolite = (userAddress: string | null | undefined) => {
  const [state, setState] = useState<NitroliteState>({
    isConnecting: false,
    isConnected: false,
    client: null,
    activeChannelId: null,
    error: null,
    unifiedBalance: null,
    channels: [],
  });

  const canInit = useMemo(() => Boolean(userAddress), [userAddress]);

  useEffect(() => {
    if (canInit) {
      void init();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canInit]);

  const init = async () => {
    if (!userAddress) return;
    setState((s) => ({ ...s, isConnecting: true, error: null }));
    try {
      // Initialize Nitrolite client for Sandbox Clearnode
      const client = new (NitroliteClient as any)({
        clearNodeUrl: CLEAR_NODE_WS,
        address: userAddress,
      }) as NitroliteClient;

      if ((client as any).connect) {
        await (client as any).connect();
      }
      if ((client as any).authenticate) {
        await (client as any).authenticate();
      }

      setState((s) => ({
        ...s,
        isConnecting: false,
        isConnected: true,
        client,
        error: null,
      }));

      // Fetch initial info in background
      void refreshInfo(client, userAddress);
    } catch (err: any) {
      setState((s) => ({
        ...s,
        isConnecting: false,
        isConnected: false,
        client: null,
        error: err?.message || "Failed to connect to Clearnode",
      }));
    }
  };

  const refreshInfo = async (clientArg?: NitroliteClient, addressArg?: string) => {
    const client = clientArg || state.client;
    const address = addressArg || userAddress;
    if (!client || !address) return;

    try {
      // Channels
      let channels: any[] = [];
      if ((client as any).listChannels) {
        channels = await (client as any).listChannels({ participant: address });
      } else if ((client as any).getChannels) {
        channels = await (client as any).getChannels(address);
      }

      // Balance via Clearnode REST (best-effort; schema may differ)
      let unifiedBalance: { asset: string; amount: string }[] | null = null;
      try {
        const resp = await fetch(`https://clearnet-sandbox.yellow.com/users/${address}/balance`);
        if (resp.ok) {
          unifiedBalance = await resp.json();
        }
      } catch {}

      setState((s) => ({
        ...s,
        channels,
        unifiedBalance,
      }));
    } catch {
      // ignore
    }
  };

  const requestFaucet = async () => {
    if (!userAddress) throw new Error("Connect wallet first");
    const res = await fetch(CLEAR_NODE_FAUCET, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userAddress }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Faucet request failed");
    }
    await refreshInfo();
    return true;
  };

  const openChannel = async (participants: string[], opts?: { challengeDuration?: number; initialDeposit?: string; asset?: string }) => {
    if (!state.client) throw new Error("Nitrolite not connected");
    const client: any = state.client as any;
    const config: any = {
      participants,
      challengeDuration: opts?.challengeDuration ?? 3600,
    };
    if (opts?.initialDeposit) config.initialDeposit = opts.initialDeposit;
    if (opts?.asset) config.asset = opts.asset;
    const channelId: string = await client.createChannel(config);
    setState((s) => ({ ...s, activeChannelId: channelId }));
    await refreshInfo();
    return channelId;
  };

  const closeActiveChannel = async () => {
    if (!state.client || !state.activeChannelId) throw new Error("No active channel");
    const client: any = state.client as any;
    try {
      const info = (client.getChannelInfo ? await client.getChannelInfo(state.activeChannelId) : null) || {};
      await client.closeChannel(state.activeChannelId, (info as any).currentState);
      setState((s) => ({ ...s, activeChannelId: null }));
      await refreshInfo();
    } catch (e: any) {
      throw new Error(e?.message || "Failed to close channel");
    }
  };

  const sendGaslessTransaction = async (tx: { to: string; data: string; value?: string }) => {
    if (!state.client) throw new Error("Nitrolite not connected");
    const client: any = state.client as any;
    if (!client.sendGaslessTransaction) throw new Error("Gasless relay not supported by client version");
    return client.sendGaslessTransaction(tx);
  };

  return {
    ...state,
    connect: init,
    refreshInfo,
    requestFaucet,
    openChannel,
    closeActiveChannel,
    sendGaslessTransaction,
  };
};
