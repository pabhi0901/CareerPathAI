import React, { createContext, useContext, useState, useCallback } from 'react';

const LoadingContext = createContext({
  isOperating: false,
  operatingMessage: '',
  startOperation: () => {},
  endOperation: () => {},
});

export const LoadingProvider = ({ children }) => {
  const [isOperating, setIsOperating] = useState(false);
  const [operatingMessage, setOperatingMessage] = useState('');

  const startOperation = useCallback((message = 'Processing request...') => {
    setIsOperating(true);
    setOperatingMessage(message);
  }, []);

  const endOperation = useCallback(() => {
    setIsOperating(false);
    setOperatingMessage('');
  }, []);

  return (
    <LoadingContext.Provider
      value={{
        isOperating,
        operatingMessage,
        startOperation,
        endOperation,
      }}
    >
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};
