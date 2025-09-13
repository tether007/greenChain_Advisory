import { useState, useEffect } from 'react';

interface NitroliteState {
  isConnected: boolean;
  client: any | null;
  error: string | null;
}

export const useNitrolite = () => {
  const [state, setState] = useState<NitroliteState>({
    isConnected: false,
    client: null,
    error: null
  });

  useEffect(() => {
    initializeNitrolite();
  }, []);

  const initializeNitrolite = async () => {
    try {
      // Minimal relayer client: call our backend to send tx from relayer key
      const client = {
        sendGaslessTransaction: async (txData: any) => {
          console.log('Sending gasless transaction via backend relay:', txData);
          const response = await fetch('/api/relay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(txData)
          });
          if (!response.ok) {
            throw new Error('Relay failed');
          }
          const data = await response.json();
          return data; // { hash, status }
        }
      };

      setState({ isConnected: true, client, error: null });
    } catch (error: any) {
      setState({
        isConnected: false,
        client: null,
        error: error.message
      });
    }
  };

  return state;
};