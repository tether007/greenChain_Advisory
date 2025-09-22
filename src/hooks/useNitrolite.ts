import { useEffect, useState } from "react";
import { NitroliteClient, ChannelState } from "@erc7824/nitrolite";

interface NitroliteState {
  isConnected: boolean;
  client: NitroliteClient | null;
  channel: ChannelState | null;
  error: string | null;
}

export const useNitrolite = (userAddress: string) => {
  const [state, setState] = useState<NitroliteState>({
    isConnected: false,
    client: null,
    channel: null,
    error: null,
  });

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    try {
      // 1. Connect to Sandbox Clearnode
      const client = new NitroliteClient({
        rpcUrl: "wss://clearnet-sandbox.yellow.com/ws",
        address: userAddress,
      });

      await client.connect();

      // 2. (Optional) create a new payment channel for MVP
      const channel = await client.createChannel({
        participants: [userAddress, "0xSellerAddress"], // dynamically set
        challengeDuration: 60,
      });

      setState({
        isConnected: true,
        client,
        channel,
        error: null,
      });
    } catch (err: any) {
      setState({
        isConnected: false,
        client: null,
        channel: null,
        error: err.message,
      });
    }
  };

  const sendPayment = async (amount: number, to: string) => {
    if (!state.client || !state.channel) throw new Error("No channel active");

    // 3. Make a transfer
    const transfer = await state.client.createTransfer({
      channelId: state.channel.id,
      to,
      amount,
      asset: "YellowUSD", // sandbox token
    });

    console.log("Transfer proof:", transfer);

    // 4. Update local state
    const updatedChannel = await state.client.getChannel(state.channel.id);

    setState({ ...state, channel: updatedChannel });
    return transfer;
  };

  return {
    ...state,
    sendPayment,
  };
};
