import React, { useEffect, useState } from 'react';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import nacl from 'tweetnacl'; 
import './SignTransaction.css'; 

const SignTransaction = () => {
    const [transactionData, setTransactionData] = useState(null);

    useEffect(() => {
        const handleMessage = (event) => {
            // if (event.origin !== window.opener?.location.origin) return;

            const { type, data } = event;
            alert("useeffect data is " + data)
            alert("type is " + type)
            console.log('Received message:', { type, data });
            if (type === 'signTransaction') {
                setTransactionData(new Uint8Array(data));
                alert(JSON.stringify(transactionData))
            }
        };

        window.addEventListener('message', handleMessage);

        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, []);

    const signWithMyWallet = async (data) => {
        try {
            alert("sign with my wallet"  + data)
            // alert(data);

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

          
            const privateKey = bs58.decode(secretKey);
            const keypair = Keypair.fromSecretKey(privateKey);

           
            if (!(data instanceof Uint8Array)) {
                throw new Error('Transaction data must be a Uint8Array or Buffer');
            }

            const signature = nacl.sign.detached(data, keypair.secretKey);
            alert("signature" + {...signature})


            console.log('Data signed successfully');
            return signature; 
        } catch (error) {
            console.error('Error signing data:', error);
            throw new Error('Failed to sign data: ' + (error.message || 'Unknown error'));
        }
    };

    const handleSign = async () => {
        try {

            alert("handlesign data is " + transactionData)
           
            const signature = await signWithMyWallet(transactionData);

      
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
