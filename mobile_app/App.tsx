import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, BackHandler } from 'react-native';
import { HomeScreen } from './src/screens/HomeScreen';
import { QuoteBuilderScreen } from './src/screens/QuoteBuilderScreen';
import { QuoteDetailScreen } from './src/screens/QuoteDetailScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { Quote } from './src/types';
import { useQuoteStore } from './src/store/useQuoteStore';
import { BillingService } from './src/services/BillingService';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'HOME' | 'BUILDER' | 'DETAIL' | 'SETTINGS'>('HOME');
  const [activeQuoteId, setActiveQuoteId] = useState<string | null>(null);
  const quotes = useQuoteStore((state) => state.quotes);
  const isSunlightMode = useQuoteStore((state) => state.isSunlightMode);
  const setProStatus = useQuoteStore((state) => state.setProStatus);
  const activeQuote = quotes.find((q) => q.id === activeQuoteId) || null;

  // Initialize BillingService on startup
  useEffect(() => {
    BillingService.init()
      .then(() => BillingService.checkProStatus())
      .then((active) => {
        if (active) setProStatus(true);
      })
      .catch((e) => console.log('Billing init handled gracefully:', e));
  }, []);

  // Handle Android hardware back button
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (currentScreen === 'BUILDER') {
        // Intercepted by QuoteBuilderScreen's own unsaved-changes guard
        return false;
      }
      if (currentScreen !== 'HOME') {
        setCurrentScreen('HOME');
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [currentScreen]);

  const handleSelectQuote = (quote: Quote) => {
    setActiveQuoteId(quote.id);
    setCurrentScreen('DETAIL');
  };

  return (
    <View style={[styles.container, isSunlightMode && styles.containerSunlight]}>
      <StatusBar style={isSunlightMode ? 'dark' : 'light'} />
      {currentScreen === 'HOME' && (
        <HomeScreen
          onNewQuote={() => setCurrentScreen('BUILDER')}
          onSelectQuote={handleSelectQuote}
          onOpenSettings={() => setCurrentScreen('SETTINGS')}
        />
      )}
      {currentScreen === 'BUILDER' && (
        <QuoteBuilderScreen onBack={() => setCurrentScreen('HOME')} />
      )}
      {currentScreen === 'DETAIL' && activeQuote && (
        <QuoteDetailScreen
          quote={activeQuote}
          onBack={() => setCurrentScreen('HOME')}
        />
      )}
      {currentScreen === 'SETTINGS' && (
        <SettingsScreen onBack={() => setCurrentScreen('HOME')} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  containerSunlight: {
    backgroundColor: '#F8FAFC',
  },
});
