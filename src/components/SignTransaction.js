import React, { useEffect, useState } from 'react';
import { Keypair, Transaction } from '@solana/web3.js';
import './ConnectWallet.css'; // Add your custom styles here

const SignTransaction = () => {
    const [transactionData, setTransactionData] = useState(null);

    useEffect(() => {
        // Listen for incoming transaction data from the parent window
        const handleMessage = (event) => {
            if (event.origin !== window.opener?.location.origin) return;

            const { type, data } = event.data;
            if (type === 'signTransaction') {
                setTransactionData(new Uint8Array(data)); // Ensure data is correctly handled
            }
        };  

        window.addEventListener('message', handleMessage);

        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, []);

    const signWithMyWallet = async (data) => {
        try {
            const walletString = localStorage.getItem('wallet');
            if (!walletString) {
                throw new Error('No wallet found in LocalStorage');
            }
    
            const wallet = JSON.parse(walletString);
            const { secretKey } = wallet;
            const privateKey = Uint8Array.from(JSON.parse(secretKey));
            const keypair = Keypair.fromSecretKey(privateKey);
    
            const transaction = Transaction.from(data);
            transaction.sign(keypair);
    
            return transaction; // Return the signed transaction
        } catch (error) {
            console.error('Error signing transaction:', error);
            throw new Error('Failed to sign transaction: ' + (error.message || 'Unknown error'));
        }
    };


    const handleSign = async () => {
        if (!transactionData) {
            console.error('No transaction data');
            return;
        }
    
        try {
            // Sign the transaction using your wallet's signing logic
            const signedTransaction = await signWithMyWallet(transactionData);
    
            // Send the signed transaction back to the opener
            if (window.opener) {
                window.opener.postMessage({ status: 'signed', signedTransaction }, '*');
                window.close();
            }
        } catch (error) {
            console.error('Error signing transaction in handle sign:', error);
        }
    };

    const handleCancel = () => {
        if (window.opener) {
            window.opener.postMessage({ status: 'cancelled' }, '*');
            window.close();
        } else {
            console.error('No opener found');
        }
    };

    return (
        <div className="sign-transaction-container">
            <div className="sign-transaction-modal">
                <header className="modal-header">
                    <h2>Sign Transaction</h2>
                </header>
                <div className="modal-body">
                    <p>Do you want to sign this transaction? {transactionData}</p>
                </div>
                <footer className="modal-footer">
                    <button onClick={handleSign} className="sign-button">Sign</button>
                    <button onClick={handleCancel} className="cancel-button">Cancel</button>
                </footer>
            </div>
        </div>
    );
};

export default SignTransaction;
