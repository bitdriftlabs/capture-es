import React, { useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { Colors } from '../lib/colors';

export const DeviceCodeSection = () => {
  const [temporaryDeviceCode, setTemporaryDeviceCode] = useState<string | null>(null);

  const generateDeviceCode = async (): Promise<string> => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return `DEV_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  };

  const handleGenerateTemporaryDeviceCode = async () => {
    try {
      const deviceCode = await generateDeviceCode();
      setTemporaryDeviceCode(deviceCode);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to generate device code');
      console.log('Failed to generate device code');
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Device Code</Text>
      <View style={styles.buttonContainer}>
        <Button
          title="Generate Temporary Device Code"
          onPress={handleGenerateTemporaryDeviceCode}
          color={Colors.primary}
        />
      </View>
      {temporaryDeviceCode && (
        <Text style={styles.deviceCode}>
          Device Code: {temporaryDeviceCode}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    backgroundColor: Colors.surface,
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: Colors.primary,
  },
  buttonContainer: {
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  deviceCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
    marginTop: 10,
    textAlign: 'center',
    padding: 10,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
});
