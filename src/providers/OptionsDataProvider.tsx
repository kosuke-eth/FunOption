import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { OptionData, callOptions as mockCallOptions, putOptions as mockPutOptions, expirations as mockExpirations, currentPrice as mockCurrentPrice } from '../mockData/optionsMock';

interface OptionsDataContextType {
  callOptions: OptionData[];
  putOptions: OptionData[];
  expirations: string[];
  currentPrice: number;
  selectedExpiry: string;
  isLoading: boolean;
  error: string | null;
  setSelectedExpiry: (expiry: string) => void;
  refreshData: () => Promise<void>;
}

const OptionsDataContext = createContext<OptionsDataContextType | null>(null);

export const useOptionsData = () => {
  const context = useContext(OptionsDataContext);
  if (!context) {
    throw new Error('useOptionsData must be used within an OptionsDataProvider');
  }
  return context;
};

interface OptionsDataProviderProps {
  children: ReactNode;
}

export const OptionsDataProvider: React.FC<OptionsDataProviderProps> = ({ children }) => {
  const [callOptions, setCallOptions] = useState<OptionData[]>(mockCallOptions);
  const [putOptions, setPutOptions] = useState<OptionData[]>(mockPutOptions);
  const [expirations, setExpirations] = useState<string[]>(mockExpirations);
  const [currentPrice, setCurrentPrice] = useState<number>(mockCurrentPrice);
  const [selectedExpiry, setSelectedExpiry] = useState<string>(mockExpirations[0] || 'all');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = () => {
    if (selectedExpiry && selectedExpiry !== 'all') {
      // 選択した満期日に基づいてフィルタリング
      const filteredCalls = mockCallOptions.filter(option => option.expiry === selectedExpiry);
      const filteredPuts = mockPutOptions.filter(option => option.expiry === selectedExpiry);
      setCallOptions(filteredCalls);
      setPutOptions(filteredPuts);
    } else {
      // すべてのデータを表示
      setCallOptions(mockCallOptions);
      setPutOptions(mockPutOptions);
    }
  };

  // 初回ロード
  useEffect(() => {
    // 初期化時にデータを読み込み
    loadData();
    
    // デフォルトで最初の満期日を選択する
    if (!selectedExpiry && mockExpirations.length > 0) {
      setSelectedExpiry(mockExpirations[0]);
    }
  }, []);

  // 満期日が変更されたときにデータを再フィルタリング
  useEffect(() => {
    if (selectedExpiry) {
      loadData();
    }
  }, [selectedExpiry]);

  // データを手動で更新するための関数
  const refreshData = async () => {
    await loadData();
  };

  return (
    <OptionsDataContext.Provider
      value={{
        callOptions,
        putOptions,
        expirations,
        currentPrice,
        selectedExpiry,
        isLoading,
        error,
        setSelectedExpiry,
        refreshData
      }}
    >
      {children}
    </OptionsDataContext.Provider>
  );
};
