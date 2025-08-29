/* eslint-disable jsx-a11y/accessible-emoji */
import '../lib/bitdrift'; // Must be near the top
import React, { useEffect } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { Colors } from '../lib/colors';
import { HomeScreen } from '../sections/HomeScreen';

export default function App() {
  useEffect(() => {
    let message: string;
  
    if (process.env.EXPO_PUBLIC_BUGSNAG_API_KEY && process.env.EXPO_PUBLIC_BUGSNAG_API_KEY !== 'your_bugsnag_api_key_here') {
      message = 'Bugsnag configured successfully';
    } else {
      message = 'Bugsnag API key not configured';
    }
    
    console.log(message);
  }, []);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <HomeScreen />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});

