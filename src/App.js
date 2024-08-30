import React, { useState, useEffect } from 'react';
import './App.css'; 
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 
import { Keypair, PublicKey, Connection, clusterApiUrl } from '@solana/web3.js';
import { Buffer } from 'buffer';
import bs58 from 'bs58';
import { sendTransaction } from './components/transactionUtils'; // Import the sendTransaction function
window.Buffer  = Buffer;
const TOKEN_REGISTRY_URL = 'https://raw.githubusercontent.com/SUNIDHI-JAIN125/MetaData-Token/main/metadata.json';

// Function to generate wallet
const generateWallet = () => {
  const keypair = Keypair.generate();
  const secretKey = bs58.encode(keypair.secretKey); // Convert to base58
  const address = keypair.publicKey.toBase58();
  
  return {
    address,
    secretKey
  };
};

const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

const App = () => {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [balance, setBalance] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [tokenMetadata, setTokenMetadata] = useState({});
  const [isSecretKeyVisible, setIsSecretKeyVisible] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const response = await fetch(TOKEN_REGISTRY_URL);
        const data = await response.json();
        setTokenMetadata(data); 
      } catch (error) {
        toast.error('Failed to fetch token metadata');
      }
    };
    fetchMetadata();
  }, []);

  useEffect(() => {
    // Retrieve wallet from localStorage on component mount
    const savedWallet = localStorage.getItem('wallet');
    console.log(savedWallet)
    if (savedWallet) {
      setWallet(JSON.parse(savedWallet));
    }
  }, []);

  const createWallet = () => {
    setLoading(true);
    try {
      const data = generateWallet();
      setWallet(data);
      localStorage.setItem('wallet', JSON.stringify(data)); 
      setBalance(null);
      setTokens([]);
      setError('');
    } catch (error) {
      toast.error('Failed to create wallet');
    } finally {
      setLoading(false);
    }
  };

  const deleteWallet = () => {
    setWallet(null);
    localStorage.removeItem('wallet'); // Remove wallet from localStorage
    setBalance(null);
    setTokens([]);
    setError('');
  };

  const fetchBalance = async () => {
    if (!wallet) return;
    try {
      const publicKey = new PublicKey(wallet.address);
      const lamports = await connection.getBalance(publicKey);
      setBalance(lamports / 1e9); 
      setError('');
    } catch (error) {
      toast.error('Failed to fetch balance');
    }
  };

  const fetchTokens = async () => {
    if (!wallet) return;
    try {
      const publicKey = new PublicKey(wallet.address);
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, { programId: new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb") });
      if (tokenAccounts.value.length === 0) {
        setTokens([]);
        setError('No tokens found');
      } else {
        const tokensData = tokenAccounts.value.map(account => {
          const accountInfo = account.account.data.parsed.info;
          return {
            mint: accountInfo.mint,
            amount: accountInfo.tokenAmount.uiAmountString,
            symbol: tokenMetadata[accountInfo.mint]?.symbol || 'Unknown',
            name: tokenMetadata[accountInfo.mint]?.name || 'Unknown',
            image: tokenMetadata[accountInfo.mint]?.image || 'Unknown'
          };
        });
        setTokens(tokensData);
        setError('');
      }
    } catch (error) {
      toast.error('Failed to fetch tokens');
    }
  };

  const handleSendTransaction = async () => {
    if (!wallet) {
      toast.error('Wallet not found');
      return;
    }

    const { address, secretKey } = wallet;

    try {
      const transactionSignature = await sendTransaction(
        connection,
        { address, keypair: Keypair.fromSecretKey(bs58.decode(secretKey)) },
        recipientAddress,
        amount
      );
      if (transactionSignature) {
        setRecipientAddress('');
        setAmount('');
      }
    } catch (error) {
      toast.error(`Failed to send transaction: ${error.message}`);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(
      () => toast.success('Copied to clipboard'),
      () => toast.error('Failed to copy to clipboard')
    );
  };

  // const openConnectWalletPopup = () => {
  //   const width = 400;
  //   const height = 600;
  //   const screenWidth = window.innerWidth;
  //   const screenHeight = window.innerHeight;
  //   const left = Math.floor((screenWidth - width) / 2);
  //   const top = Math.floor((screenHeight - height) / 2);

  //   const popup = window.open(
  //       `http://localhost:3001/connect?dappName=${encodeURIComponent('Demo DApp')}&dappIcon=${encodeURIComponent('https://example.com/dapp-icon.png')}&permissions=${encodeURIComponent('signTransaction,signMessage')}`,
  //       'ConnectWalletPopup',
  //       `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=yes`
  //   );
    
  //   if (popup) {
  //       popup.focus();
  //   } else {
  //       toast.error('Failed to open popup');
  //   }
  // };

  const toggleSecretKeyVisibility = () => {
    setIsSecretKeyVisible(!isSecretKeyVisible);
  };

  return (
    <div className="App">
      <h1>Initialize Your Solana Wallet!</h1>

     {/* <button onClick={openConnectWalletPopup}>Open Connect Wallet</button> */}

      {!wallet ? (
        <div>
          <button 
            onClick={createWallet} 
            disabled={loading} 
            className="create-wallet-button"
          >
            {loading ? 'Creating wallet...' : 'Create Account'}
          </button>
          {error && <p className="error">{error}</p>}
        </div>
      ) : (
        <div className="wallet-details">
          <h2>Wallet Created</h2>
          <hr/>
          <p><strong>Address:</strong> {wallet.address}</p>
          <p><strong>Secret Key:</strong></p>
          <div className="secret-key">
            <div className="secret-key-container">
              <textarea 
                readOnly
                value={isSecretKeyVisible ? wallet.secretKey : '*****'} // Conditionally display the secret key
                rows={2} // Adjust the number of rows here
                cols={50} // Adjust the number of columns here if needed
                className="secret-key-textarea"
              />
              <button 
                onClick={toggleSecretKeyVisibility}
                className="toggle-visibility-button"
              >
                {isSecretKeyVisible ? 'Hide' : 'Show'} Key
              </button>
              <button 
                onClick={() => copyToClipboard(wallet.secretKey)}
                className="copy-button"
              >
                Copy
              </button>
            </div>
          </div>

          <div className="transaction-form">
            <h3>Send Transaction</h3>
            <input
              type="text"
              placeholder="Recipient Address"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              className="transaction-input"
            />
            <input
              type="number"
              placeholder="Amount (SOL)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="transaction-input"
            />
            <button
              onClick={handleSendTransaction}
              className="send-transaction-button"
            >
              Send
            </button>
          </div>

          <div className="fetch-buttons">
            <button 
              onClick={fetchBalance}
              className="fetch-balance-button"
            >
              Fetch Balance
            </button>
            <button 
              onClick={fetchTokens}
              className="fetch-tokens-button"
            >
              Fetch Tokens
            </button>
            <button 
              onClick={deleteWallet}
              className="delete-wallet-button"
            >
              Delete Wallet
            </button>
          </div>
          
          {balance !== null && (
            <div className="balance-info">
              <p><strong>Balance:</strong> {balance} SOL</p>
            </div>
          )}

          {tokens.length > 0 ? (
            <div className="tokens-list">
              <h3>Tokens:</h3>
              {tokens.map((token, index) => (
                <div key={index} className="token-item">
                  <div className="token-info">
                    <p>
                      <img src={token.image} alt={token.name} className="token-image" />
                      <br/>
                      <a 
                        href={`https://explorer.solana.com/account/${token.mint}?cluster=devnet`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="token-link"
                      >
                        {token.name} ({token.symbol})
                      </a>
                    </p>
                    <p><strong>Amount:</strong> {token.amount}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            error && <p className="no-tokens-found">{error}</p>
          )}
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default App;
