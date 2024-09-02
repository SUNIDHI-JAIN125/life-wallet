import React, { useEffect, useState } from 'react';
import './ConnectWallet.css'; 

const ConnectWallet = ({ dappDetails }) => {
    const [pubkey, setPubkey] = useState('');

    useEffect(() => {
        
        const savedWallet = localStorage.getItem('wallet');
        if (savedWallet) {
            const parsedWallet = JSON.parse(savedWallet);
            const address = parsedWallet.address; 
            if (address) {
                setPubkey(address); 
            } else {
                console.error('Wallet address not found');
            }
        }
    }, []);

    const handleConnect = () => {
        if (pubkey) {
           
            if (window.opener) {
                window.opener.postMessage({ status: 'connected', address: pubkey }, '*');
                window.close();
            } else {
                console.error('No opener found');
            }
        } else {
            console.error('Public key is not available');
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
        <div className="connect-wallet-container">
            <div className="connect-wallet-modal">
                <header className="modal-header">
                    <h2>Connect to {dappDetails?.name || 'Unknown DApp'}</h2>
                </header>
                <div className="modal-body">
                    {dappDetails?.icon && <img src={dappDetails.icon} alt={`${dappDetails.name} icon`} className="dapp-icon" />}
                    {dappDetails?.description && <p className="dapp-description">{dappDetails.description}</p>}
                

                    <p className="warning-message">Make sure you trust this application before proceeding.</p>
                        <ul className="permission-list">
                            <li className="permission-title">This site will be able to view your public key and balance </li>
                         
                        </ul>
                </div>
                <footer className="modal-footer">
                    <button onClick={handleConnect} className="connect-button">Connect</button>
                    <button onClick={handleCancel} className="cancel-button">Cancel</button>
                </footer>
            </div>
        </div>
    );
};

export default ConnectWallet; 