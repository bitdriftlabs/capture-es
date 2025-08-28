import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Text } from 'react-native';
import { getSessionID } from '@bitdrift/react-native';
import { Colors } from '../lib/colors';
import { LogSection } from './LogSection';
import { ErrorSection } from './ErrorSection';
import { SessionSection } from './SessionSection';
import { DeviceCodeSection } from './DeviceCodeSection';
import { NetworkSection } from './NetworkSection';

export const HomeScreen = () => {
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    const fetchSessionInfo = async () => {
      try {
        const id = await getSessionID();
        setSessionId(id);
      } catch (error) {
        console.log('Session info not available yet:', error);
        setSessionId('Initializing...');
      }
    };
    fetchSessionInfo();
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Bitdrift Capture Expo Example</Text>
      <DeviceCodeSection />
      <SessionSection sessionId={sessionId} />
      <ErrorSection />
      <LogSection />
      <NetworkSection />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: Colors.primary,
  },
});
