import React, { useState } from 'react';
import { View, Text, Button, TextInput, StyleSheet } from 'react-native';
import axios from 'axios';
import { Colors } from '../lib/colors';

export const NetworkSection = () => {
  const [randomEndpoint, setRandomEndpoint] = useState('https://httpbin.org/get');

  const sendRandomRequest = async () => {
    if (!randomEndpoint.trim()) {
      console.log('Please enter an endpoint');
      return;
    }

    try {
      const response = await axios.get(randomEndpoint);
      console.log('Random Request Response:', response.data);
      console.log(`Request successful: ${response.status}`);
    } catch (err: any) {
      console.log('Error making random request:', err);
      const error = err instanceof Error ? err : new Error('Failed to make random request');
      console.log(`Request failed: ${err.message || 'Unknown error'}`);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Network Testing</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter endpoint URL"
        placeholderTextColor={Colors.secondary}
        value={randomEndpoint}
        onChangeText={setRandomEndpoint}
      />
      <View style={styles.buttonContainer}>
        <Button title="Send Random Request" onPress={sendRandomRequest} color={Colors.primary} />
      </View>
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
  input: {
    borderWidth: 1,
    borderColor: Colors.secondary,
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: Colors.surfaceLight,
    color: Colors.textPrimary,
    fontSize: 16,
  },
  buttonContainer: {
    marginBottom: 10,
    paddingHorizontal: 5,
  },
});
