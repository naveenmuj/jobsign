import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, BackHandler, LogBox } from 'react-native';
import * as Notifications from 'expo-notifications';

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
import { AppAlertModal } from './src/components/AppAlertModal';
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
  const [builderInitialQuote, setBuilderInitialQuote] = useState<Quote | null>(null);
  const profile = useQuoteStore((state) => state.profile);
  const [showOnboarding, setShowOnboarding] = useState(!profile.isOnboardingCompleted);
  const quotes = useQuoteStore((state) => state.quotes);
  const isDarkMode = useQuoteStore((state) => state.isDarkMode);
  const setProStatus = useQuoteStore((state) => state.setProStatus);
  const activeQuote = quotes.find((q) => q.id === activeQuoteId) || null;

  // Keep a stable ref to quotes so the notification listener can always access the latest list
  const quotesRef = useRef(quotes);
  useEffect(() => {
    quotesRef.current = quotes;
  }, [quotes]);

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

  // Notification deep-link: tapping any notification opens the relevant invoice
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as {
        quoteId?: string;
        quoteNumber?: number;
        type?: string;
      };

      const allQuotes = quotesRef.current;
      let target: Quote | undefined;

      // Prefer exact UUID match (payment reminders carry quoteId)
      if (data?.quoteId) {
        target = allQuotes.find((q) => q.id === data.quoteId);
      }
      // Fallback: match by quote number (seal confirmations carry quoteNumber)
      if (!target && data?.quoteNumber != null) {
        target = allQuotes.find((q) => q.quoteNumber === data.quoteNumber);
      }

      if (target) {
        setActiveQuoteId(target.id);
        setCurrentScreen('DETAIL');
      }
    });

    return () => subscription.remove();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
          onNewQuote={() => {
            setBuilderInitialQuote(null);
            setCurrentScreen('BUILDER');
          }}
          onSelectQuote={handleSelectQuote}
          onOpenSettings={() => setCurrentScreen('SETTINGS')}
        />
      )}
      {currentScreen === 'BUILDER' && (
        <QuoteBuilderScreen
          initialQuote={builderInitialQuote}
          onBack={() => {
            setBuilderInitialQuote(null);
            setCurrentScreen('HOME');
          }}
        />
      )}
      {currentScreen === 'DETAIL' && activeQuote && (
        <QuoteDetailScreen
          quote={activeQuote}
          onBack={() => setCurrentScreen('HOME')}
          onDuplicate={(q) => {
            setBuilderInitialQuote(q);
            setCurrentScreen('BUILDER');
          }}
        />
      )}
      {currentScreen === 'SETTINGS' && (
        <SettingsScreen onBack={() => setCurrentScreen('HOME')} />
      )}
      <OnboardingModal
        visible={showOnboarding}
        onFinish={() => setShowOnboarding(false)}
      />
      <AppAlertModal />
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
