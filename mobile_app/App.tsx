import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { HomeScreen } from './src/screens/HomeScreen';
import { QuoteBuilderScreen } from './src/screens/QuoteBuilderScreen';
import { QuoteDetailScreen } from './src/screens/QuoteDetailScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { Quote } from './src/types';

import { useQuoteStore } from './src/store/useQuoteStore';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'HOME' | 'BUILDER' | 'DETAIL' | 'SETTINGS'>('HOME');
  const [activeQuoteId, setActiveQuoteId] = useState<string | null>(null);
  const quotes = useQuoteStore((state) => state.quotes);
  const activeQuote = quotes.find((q) => q.id === activeQuoteId) || null;

  const handleSelectQuote = (quote: Quote) => {
    setActiveQuoteId(quote.id);
    setCurrentScreen('DETAIL');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
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
});
