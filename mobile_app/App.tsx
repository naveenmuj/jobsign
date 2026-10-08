import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, BackHandler, LogBox } from 'react-native';

LogBox.ignoreLogs([
  'Error configuring Purchases',
  'RevenueCat initialization skipped',
  '[RevenueCatUI]',
  'Error presenting paywall',
]);

import { HomeScreen } from './src/screens/HomeScreen';
import { QuoteBuilderScreen } from './src/screens/QuoteBuilderScreen';
import { QuoteDetailScreen } from './src/screens/QuoteDetailScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { OnboardingModal } from './src/components/OnboardingModal';
import { Quote } from './src/types';
import { useQuoteStore } from './src/store/useQuoteStore';
import { BillingService } from './src/services/BillingService';
import { TelemetryService } from './src/services/TelemetryService';
import { NotificationService } from './src/services/NotificationService';
import { FEATURE_FLAGS } from './src/config/featureFlags';

console.log('[JobSign] App.tsx module loaded');

export default function App() {
  console.log('[JobSign] App() component rendering...');
  const [currentScreen, setCurrentScreen] = useState<'HOME' | 'BUILDER' | 'DETAIL' | 'SETTINGS'>('HOME');
  const [activeQuoteId, setActiveQuoteId] = useState<string | null>(null);
  const profile = useQuoteStore((state) => state.profile);
  const [showOnboarding, setShowOnboarding] = useState(!profile.isOnboardingCompleted);
  const quotes = useQuoteStore((state) => state.quotes);
  const isDarkMode = useQuoteStore((state) => state.isDarkMode);
  const setProStatus = useQuoteStore((state) => state.setProStatus);
  const activeQuote = quotes.find((q) => q.id === activeQuoteId) || null;

  // Initialize Telemetry and Notifications on startup
  useEffect(() => {
    TelemetryService.init();
    NotificationService.init();
  }, []);

  // Track screen transitions in telemetry
  useEffect(() => {
    TelemetryService.logScreenView(currentScreen);
  }, [currentScreen]);

  useEffect(() => {
    if (!profile.isOnboardingCompleted) {
      setShowOnboarding(true);
    }
  }, [profile.isOnboardingCompleted]);

  // Initialize BillingService on startup if payment is enabled, else grant free Pro
  useEffect(() => {
    if (FEATURE_FLAGS.PAYMENT_ENABLED) {
      BillingService.init()
        .then(() => BillingService.checkProStatus())
        .then((active) => {
          if (active) setProStatus(true);
        })
        .catch((e) => console.log('Billing init handled gracefully:', e));
    } else {
      if (FEATURE_FLAGS.FREE_ALL_FEATURES) {
        setProStatus(true);
      }
    }
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
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
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
      <OnboardingModal
        visible={showOnboarding}
        onFinish={() => setShowOnboarding(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  containerDark: {
    backgroundColor: '#0B0F19',
  },
});
