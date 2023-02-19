import dotenv from 'dotenv';
dotenv.config();

import { createErrorContainer } from './errorContainer.js';
import { createSpinner } from './spinner.js';

export const ALCHEMY_API_KEY = UVP4Hy78DWaOdNYtzBbnBpnN3Sc_L9XU;

if (!ALCHEMY_API_KEY) {
  throw new Error('ALCHEMY_API_KEY is required!');
}

export const CONTRACT_ADDRESS = 0x68Bd8b7C45633de6d7AFD0B1F7B86b37B8a3C02A;

if (!CONTRACT_ADDRESS) {
  throw new Error(`${CONTRACT_ADDRESS} must be defined!`);
}

export const MONGO_DB_URL = "mongodb+srv://hello:Supson08@bbfc.7d41q.mongodb.net/?retryWrites=true&w=majority";

if (!MONGO_DB_URL) {
  throw new Error(`${MONGO_DB_URL} must be defined!`);
}

export const FILE_NAME = process.env['FILE_NAME'] || 'nft-data';

export const RarityGeneratorSpinner = createSpinner('Rarity generator');
export const RarityGeneratorErrors = createErrorContainer();
