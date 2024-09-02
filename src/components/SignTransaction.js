import React, { useEffect, useState } from 'react';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import nacl from 'tweetnacl'; 
import './SignTransaction.css'; 
import { Buffer } from 'buffer';
window.Buffer = Buffer;

const SignTransaction = () => {
    const [transactionData, setTransactionData] = useState(null);

    useEffect(() => {
       
        const transaction = localStorage.getItem('transactionData');
       

        if (transaction) {
         
            const decodedTransaction = Buffer.from(transaction, 'base64');
            setTransactionData(new Uint8Array(decodedTransaction));
           
        } else {
            console.error('No transaction data found in localStorage');
        }
    }, []);

    const signWithMyWallet = async (data) => {
        try {
            const walletString = localStorage.getItem('wallet');
            if (!walletString) {
                throw new Error('No wallet found in LocalStorage');
            }

            const wallet = JSON.parse(walletString);
            const { secretKey } = wallet;

            if (!secretKey) {
                throw new Error('No secret key found in wallet');
            }

            const privateKey = bs58.decode(secretKey);
            const keypair = Keypair.fromSecretKey(privateKey);

            if (!(data instanceof Uint8Array)) {
                throw new Error('Transaction data must be a Uint8Array or Buffer');
            }

            const signature = nacl.sign.detached(data, keypair.secretKey);

            return signature; 
        } catch (error) {
            console.error('Error signing data:', error);
            throw new Error('Failed to sign data: ' + (error.message || 'Unknown error'));
        }
    };

    const handleSign = async () => {
        try {
            if (!transactionData) {
                throw new Error('No transaction data to sign');
            }

            console.log('Starting transaction signing...');
            const signature = await signWithMyWallet(transactionData);
            console.log('Transaction signed:', signature);

            const signedTransactionData = Buffer.from(signature).toString('base64');

            // Post the signed transaction back to the opener (wallet adapter)
            if (window.opener) {
                window.opener.postMessage({ status: 'signed', signedTransactionData }, '*');
                window.close();
            }
        } catch (error) {
            console.error('Error signing data in handleSign:', error);
        }
    };
    
    const handleCancel = () => {
        if (window.opener) {
            window.opener.postMessage({ status: 'cancelled' }, '*');
            window.close();
        }
    };

    return (
        <div className="sign-transaction-container">
            <div className="sign-transaction-modal">
                <header className="modal-header">
                    <h2>Confirm Transaction</h2>
                </header>
                <div className="modal-body">
                    <p>Are you sure you want to sign this transaction?</p>
                    <pre className="transaction-data">Transaction data <br/> {transactionData && new TextDecoder().decode(transactionData)}</pre>
                </div>
                <footer className="modal-footer">
                    <button onClick={handleSign} className="confirm-button">Confirm</button>
                    <button onClick={handleCancel} className="cancel-button">Cancel</button>
                </footer>
            </div>
        </div>
    );
};

export default SignTransaction;
