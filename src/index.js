import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';   
 // Your main application component
import ConnectWallet from './components/ConnectWallet'; // Your component for connecting the wallet
import SignTransaction from './components/SignTransaction.js';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'; // Import routing components

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Router>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/connect" element={<ConnectWallet />} />
      <Route path="/sign" element={<SignTransaction />} />
    </Routes>
  </Router>
);