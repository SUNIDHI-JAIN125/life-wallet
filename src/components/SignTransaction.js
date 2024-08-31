import React, { useEffect, useState } from 'react';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import nacl from 'tweetnacl'; // Import nacl for signing
import './ConnectWallet.css';

const SignTransaction = () => {
    const [transactionData, setTransactionData] = useState(null);

    useEffect(() => {
        const handleMessage = (event) => {
            if (event.origin !== window.opener?.location.origin) return;

            const { type, data } = event.data;
            console.log('Received message:', { type, data });
            if (type === 'signTransaction') {
                setTransactionData(new Uint8Array(data));
            }
        };

        window.addEventListener('message', handleMessage);

        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, []);

    const signWithMyWallet = async (data) => {
        try {
            console.log('Received transaction data:', data);

            const walletString = localStorage.getItem('wallet');
            if (!walletString) {
                console.error('No wallet found in local storage');
                throw new Error('No wallet found in LocalStorage');
            }

            const wallet = JSON.parse(walletString);
            const { secretKey } = wallet;

            if (!secretKey) {
                console.error('No secret key found in wallet');
                throw new Error('No secret key found in wallet');
            }

            // Decode the secret key from base58
            const privateKey = bs58.decode(secretKey);
            const keypair = Keypair.fromSecretKey(privateKey);

            // Ensure data is a Uint8Array
            if (!(data instanceof Uint8Array)) {
                throw new Error('Transaction data must be a Uint8Array or Buffer');
            }

            // Sign the data using nacl
            const signature = nacl.sign.detached(data, keypair.secretKey);

            console.log('Data signed successfully');
            return signature; // Return the signature
        } catch (error) {
            console.error('Error signing data:', error);
            throw new Error('Failed to sign data: ' + (error.message || 'Unknown error'));
        }
    };

    const handleSign = async () => {
        try {
            // Sign the transaction using your wallet's signing logic
            const signature = await signWithMyWallet(transactionData);

            // Send the signed data back to the opener
            if (window.opener) {
                window.opener.postMessage({ status: 'signed', signature }, '*');
                window.close();
            }
        } catch (error) {
            console.error('Error signing data in handle sign:', error);
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
                    <h2>Sign Data</h2>
                </header>
                <div className="modal-body">
                    <p>Do you want to sign this data? {transactionData && transactionData.toString()}</p>
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
