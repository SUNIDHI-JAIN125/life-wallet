import React, { useEffect, useState } from 'react';
import './ConnectWallet.css'; // Add your custom styles here

const ConnectWallet = () => {
    const [dappName, setDappName] = useState('');
    const [dappIcon, setDappIcon] = useState('');
    const [dappDescription, setDappDescription] = useState('');
    const [pubkey, setPubkey] = useState('');

    useEffect(() => {
        // Extract metadata from the window opener
        if (window.opener) {
            const { title, icon, description } = window.opener.document;
            setDappName(title || 'Unknown DApp');
            setDappIcon(icon?.href || '');
            setDappDescription(description?.content || '');
        } else {
            console.error('No opener found');
        }
    }, []);

    useEffect(() => {
        // Extract wallet public key from localStorage on mount
        const savedWallet = localStorage.getItem('wallet');
        if (savedWallet) {
            const parsedWallet = JSON.parse(savedWallet);
            const address = parsedWallet.address; // Assuming wallet is an object with address property
            if (address) {
                setPubkey(address); // Set the public key
            } else {
                console.error('Wallet address not found');
            }
        }
    }, []);

    const handleConnect = () => {
        if (pubkey) {
            // Post message with public key
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
            // Post message for canceled connection
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
                    <h2>Connect to {dappName}</h2>
                </header>
                <div className="modal-body">
                    {dappIcon && <img src={dappIcon} alt={`${dappName} icon`} className="dapp-icon" />}
                    {dappDescription && <p className="dapp-description">{dappDescription}</p>}
                
                    <ul className="permission-list">
                        <li className="permission-title">View wallet balance & activity</li>
                        <li className='permission-title'>Request approval for transactions</li>
                    </ul>

                    <p className="warning-message">Make sure you trust this application before proceeding.</p>
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