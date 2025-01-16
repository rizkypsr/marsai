import { Alchemy, Network } from 'alchemy-sdk';

const RPC_TOKEN = process.env.RPC_TOKEN || '';

const settings = {
  apiKey: RPC_TOKEN,
  network: Network.ETH_MAINNET,
};

const alchemy = new Alchemy(settings);

export default alchemy;
