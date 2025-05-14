import React, { useState, useEffect } from 'react';
import Header from 'components/layout/Header';
import AIChat from 'components/AIChat/AIChat';
import CryptoSelector from 'components/CryptoSelector/CryptoSelector';
import OptionTypeSelector, { OptionType } from 'components/controls/OptionTypeSelector';
import ExpiryDateSelector from 'components/controls/ExpiryDateSelector';
import { bybitClient } from '../api/bybit';

const AIChatPage: React.FC = () => {
  // UI state management
  const [selectedCrypto, setSelectedCrypto] = useState<'BTC' | 'ETH' | 'SOL'>('BTC');
  const [selectedOptionType, setSelectedOptionType] = useState<OptionType>('call');
  const [expirations, setExpirations] = useState<string[]>([]);
  const [selectedExpiry, setSelectedExpiry] = useState<string>('all');

  // Price data management
  const [cryptoPrices, setCryptoPrices] = useState<{
    BTC: number;
    ETH: number;
    SOL: number;
  }>({
    BTC: 0,
    ETH: 0,
    SOL: 0
  });
  const [cryptoDataLoading, setCryptoDataLoading] = useState<boolean>(false);

  // Fetch realtime price data for multiple cryptocurrencies
  useEffect(() => {
    const fetchRealtimePrices = async () => {
      setCryptoDataLoading(true);
      try {
        // Get cryptocurrency prices in USDC (more accurate market prices)
        const priceData = await bybitClient.getRealtimePrices(['BTCUSDC', 'ETHUSDC', 'SOLUSDC']);

        // Set the latest price for each cryptocurrency
        setCryptoPrices({
          BTC: priceData['BTCUSDC'] || 0,
          ETH: priceData['ETHUSDC'] || 0,
          SOL: priceData['SOLUSDC'] || 0
        });
      } catch (error) {
        console.error('Failed to fetch realtime price data:', error);
      } finally {
        setCryptoDataLoading(false);
      }
    };

    fetchRealtimePrices();

    // Update price data periodically (every 30 seconds)
    const intervalId = setInterval(fetchRealtimePrices, 30000);
    return () => clearInterval(intervalId);
  }, []);

  // Fetch options expiration dates for selected cryptocurrency
  useEffect(() => {
    const fetchExpiryDates = async () => {
      try {
        // Generate some sample expiry dates (in a real app, fetch from API)
        const currentDate = new Date();
        const expiryDates = [];
        
        // Generate expiry dates for next 4 Fridays
        for (let i = 0; i < 4; i++) {
          const date = new Date(currentDate);
          // Find the next Friday (5 = Friday)
          date.setDate(date.getDate() + ((5 + 7 - date.getDay()) % 7) + (i * 7));
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          expiryDates.push(`${year}-${month}-${day}`);
        }
        
        setExpirations(expiryDates);
        if (expiryDates.length > 0 && selectedExpiry === 'all') {
          setSelectedExpiry(expiryDates[0]); // Select first date by default
        }
      } catch (error) {
        console.error('Failed to fetch expiry dates:', error);
      }
    };

    fetchExpiryDates();
  }, [selectedCrypto]);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-funoption-bg to-funoption-bg-dark">
      <Header />
      <div className="container mx-auto px-4 py-6 flex-grow">
        {/* Controls section */}
        <div className="w-full animate-fadeIn">
          <div className="mb-8 space-y-5">
            {/* Option type selector */}
            <OptionTypeSelector 
              selectedType={selectedOptionType} 
              onChange={setSelectedOptionType} 
            />

            {/* Cryptocurrency selector */}
            <div className="w-full bg-funoption-card-bg rounded-xl p-3 backdrop-blur-sm">
              <CryptoSelector
                selectedCrypto={selectedCrypto}
                cryptoPrices={cryptoPrices}
                onChange={setSelectedCrypto}
                loading={cryptoDataLoading}
              />
            </div>

            {/* Expiry date selector */}
            <ExpiryDateSelector 
              expirations={expirations}
              selectedExpiry={selectedExpiry}
              onChange={setSelectedExpiry}
              className="border-b border-funoption-border pb-4"
              showAllOption={true}
            />
          </div>
        </div>
        
        {/* AI Chat component with context from selected parameters */}
        <AIChat 
          selectedCrypto={selectedCrypto} 
          /* In a real app, pass these props to AIChat and use them to customize the experience */
          /* optionType={selectedOptionType} */
          /* expiryDate={selectedExpiry} */
        />
      </div>
    </div>
  );
};

export default AIChatPage;
