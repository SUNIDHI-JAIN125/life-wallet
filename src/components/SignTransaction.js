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
            // Retrieve the wallet object from LocalStorage
            const walletString = localStorage.getItem('wallet');
            if (!walletString) {
                throw new Error('No wallet found in LocalStorage');
            }
    
            // Parse the wallet object
            const wallet = JSON.parse(walletString);
            const { secretKey } = wallet;
    
            // Convert the private key string back to a Uint8Array
            const privateKey = Uint8Array.from(JSON.parse(secretKey));
    
            // Create a Keypair from the secret key
            const keypair = Keypair.fromSecretKey(privateKey);
    
        
            const transaction = Transaction.from(data);
    
            transaction.sign(keypair);
    
            // Return the signed transaction serialized
            return transaction.serialize();
        } catch (error) {
            console.error('Error signing transaction:', error);
            throw new Error('Failed to sign transaction');
        }
    };

    const handleSign = async () => {
        if (!transactionData) return;

        try {
            // Sign the transaction using your wallet's signing logic
            const signedTransactionData = await signWithMyWallet(transactionData);
            alert(transactionData)
            // Send the signed transaction back to the opener
            if (window.opener) {
                window.opener.postMessage({ status: 'signed', signedTransactionData }, '*');
                window.close();
            }
        } catch (error) {
            console.error('Error signing transaction:', error);
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
                    <p>Do you want to sign this transaction?</p>
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
