import React, { useEffect, useState } from 'react';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import nacl from 'tweetnacl'; 
import './SignTransaction.css'; 

const SignTransaction = () => {
    const [transactionData, setTransactionData] = useState(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const transaction = params.get('transaction');
        

        if (transaction) {
           
            try {
                alert(transaction)
                const decodedTransaction = Buffer.from(decodeURIComponent(transaction), 'base64');
                setTransactionData(new Uint8Array(decodedTransaction));
                alert("txn "  + transactionData)
            } catch (error) {
                console.error('Error decoding transaction:', error);
                alert('Failed to decode transaction data');
            }
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
            alert('Failed to sign data: ' + (error.message || 'Unknown error'));
            throw error;
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
            alert("signed 0 0" + signature)

            const signedTransactionData = Buffer.from(signature).toString('base64');

            // Post the signed transaction back to the opener (wallet adapter)
            if (window.opener) {
                window.opener.postMessage({ status: 'signed', signedTransactionData }, '*');
                window.close();
            }
        } catch (error) {
            console.error('Error during handleSign:', error);
            alert('Error during signing process: ' + (error.message || 'Unknown error'));
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
                    <pre className="transaction-data">Transaction data <br/> {transactionData && transactionData.toString()}</pre>
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
