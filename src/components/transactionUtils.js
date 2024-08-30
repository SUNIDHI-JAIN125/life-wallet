// src/transactionUtils.js
import { PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction } from '@solana/web3.js';
import { toast } from 'react-toastify';

export const sendTransaction = async (connection, wallet, recipientAddress, amount) => {
  if (!wallet || !recipientAddress || !amount) {
    toast.error('Please provide all transaction details');
    return;
  }

  try {
    // Convert amount to lamports
    const lamports = Number(amount) * 1e9; // Convert SOL to lamports
    if (lamports <= 0) {
      toast.error('Amount must be greater than zero');
      return;
    }

    // Fetch wallet balance
    const publicKey = new PublicKey(wallet.address);
    const balance = await connection.getBalance(publicKey);

    // Rent-exempt minimum balance for a Solana account
    const rentExemptBalance = await connection.getMinimumBalanceForRentExemption(0);

    // Check if wallet balance is sufficient
    if (balance < lamports + rentExemptBalance) {
      toast.error('Insufficient funds. Please add more SOL to cover the transaction and rent fees.');
      return;
    }

    // Create and send transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: new PublicKey(recipientAddress),
        lamports
      })
    );

    // Sign and send the transaction
    const { signature } = await sendAndConfirmTransaction(connection, transaction, [wallet.keypair]);
    toast.success(`Transaction successful! Signature: ${signature}`);
    return signature;
  } catch (error) {
    console.error('Transaction Error:', error);
    toast.error(`Failed to send transaction: ${error.message}`);
  }
};
