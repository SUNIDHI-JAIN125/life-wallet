import React, { useState, useEffect } from 'react';
import './App.css'; 
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 
import { Keypair, PublicKey, Connection, clusterApiUrl } from '@solana/web3.js';
import { Buffer } from 'buffer';
import bs58 from 'bs58';
import { sendTransaction } from './components/transactionUtils'; 

window.Buffer = Buffer;
const TOKEN_REGISTRY_URL = 'https://raw.githubusercontent.com/SUNIDHI-JAIN125/MetaData-Token/main/metadata.json';


const generateWallet = () => {
  const keypair = Keypair.generate();
  const secretKey = bs58.encode(keypair.secretKey); 
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
    const savedWallet = localStorage.getItem('wallet');
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
    localStorage.removeItem('wallet'); 
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
        toast.success('Transaction sent successfully!');
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

  const toggleSecretKeyVisibility = () => {
    setIsSecretKeyVisible(!isSecretKeyVisible);
  };

  return (
    <div className="App">
      <h1>Initialize Your Solana Wallet</h1>

      {!wallet ? (
        <div className="wallet-setup">
          <button 
            onClick={createWallet} 
            disabled={loading} 
            className="create-wallet-button"
          >
            {loading ? 'Creating wallet...' : 'Create Wallet'}
          </button>
          {error && <p className="error">{error}</p>}
        </div>
      ) : (
        <div className="wallet-info">
          <h2>Wallet Created</h2>
          <hr />
          <div className="wallet-details">
            <p><strong>Address:</strong> {wallet.address}</p>
            <div className="secret-key-section">
              <p><strong>Secret Key:</strong></p>
              <textarea 
                readOnly
                value={isSecretKeyVisible ? wallet.secretKey : '*****************************************'} 
                rows={3}
                cols={30}
                className="secret-key-textarea"
              />
              <button 
                onClick={toggleSecretKeyVisibility}
                className="toggle-visibility-button"
              >
                {isSecretKeyVisible ? 'Hide Key' : 'Show Key'}
              </button>
              <button 
                onClick={() => copyToClipboard(wallet.secretKey)}
                className="copy-button"
              >
                Copy Key
              </button>
            </div>
          </div>

          <div className="transaction-form">
            <h3>Send Transaction</h3>
            <div className="form-group">
              <label htmlFor="recipientAddress">Recipient Address</label>
              <input
                id="recipientAddress"
                type="text"
                placeholder="Enter recipient address"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                className="transaction-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="amount">Amount (SOL)</label>
              <input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="transaction-input"
              />
            </div>
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
              className="fetch-button"
            >
              Fetch Balance
            </button>
            <button 
              onClick={fetchTokens}
              className="fetch-button"
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
              <h3>Tokens</h3>
              {tokens.map((token, index) => (
                <div key={index} className="token-item">
                  <img src={token.image} alt={token.name} className="token-image" />
                  <div className="token-details">
                    <p><strong>Name:</strong> {token.name} ({token.symbol})</p>
                    <p><strong>Amount:</strong> {token.amount}</p>
                    <a 
                      href={`https://explorer.solana.com/account/${token.mint}?cluster=devnet`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="token-link"
                    >
                      View on Explorer
                    </a>
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
