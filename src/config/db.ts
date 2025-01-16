import mongoose from "mongoose";
import { Wallet } from "../schemas/wallet-schema.js";

const url = 'mongodb://mongo:27017/marsaidb';

export const connectDB = async (): Promise<void> => {
    console.log('Connecting to MongoDB...');

    try {
        await mongoose.connect(url, {
            dbName: 'marsaidb',
        });
        console.log('Connected to MongoDB 7.0');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1); // Exit the process if the database connection fails
    }
};

export const disconnectDB = async (): Promise<void> => {
    try {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error disconnecting from MongoDB:', error);
    }
};

export const addWallet = async (walletId: string) => {
    try {
        // Update the document and push the new wallet
        const result = await Wallet.findOneAndUpdate(
            { $push: { wallets: walletId } },
            { new: true }
        );

        if (result) {
            console.log('Updated Wallet:', result);
        } else {
            console.log('No matching document found.');
        }
    } catch (error) {
        console.error('Error adding wallet:', error);
    }
};