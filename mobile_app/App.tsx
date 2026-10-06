import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { HomeScreen } from './src/screens/HomeScreen';
import { QuoteBuilderScreen } from './src/screens/QuoteBuilderScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'HOME' | 'BUILDER'>('HOME');

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      {currentScreen === 'HOME' ? (
        <HomeScreen onNewQuote={() => setCurrentScreen('BUILDER')} />
      ) : (
        <QuoteBuilderScreen onBack={() => setCurrentScreen('HOME')} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});
