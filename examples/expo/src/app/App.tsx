/* eslint-disable jsx-a11y/accessible-emoji */
import '../lib/bitdrift'; // Must be near the top

import React, { useRef, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  Linking,
  Button,
  TextInput,
  Switch,
  Pressable,
} from 'react-native';
import Svg, { G, Path } from 'react-native-svg';
import { generateDeviceCode, debug, error } from '@bitdrift/react-native';
import axios from 'axios';

const sendRandomRequest = async () => {
  const endpoints = [
    'https://jsonplaceholder.typicode.com/posts',
    'https://jsonplaceholder.typicode.com/users',
  ];
  const randomEndpoint =
    endpoints[Math.floor(Math.random() * endpoints.length)];
  try {
    const response = await axios.get(randomEndpoint);
    debug('Random Request Response:', response.data);
  } catch (err: any) {
    error('Error making random request:', err);
  }
};

const HomeScreen = () => {
  const [temporaryDeviceCode, setTemporaryDeviceCode] = useState<string | null>(
    null,
  );
  const [selectedSeverity, setSelectedSeverity] = useState('info');
  const [logMessage, setLogMessage] = useState('');

  const logMessageHandler = () => {
    console.log(
      `[${selectedSeverity.toUpperCase()}]: ${logMessage || 'Default log message'}`,
    );
    alert(
      `Logged: ${selectedSeverity.toUpperCase()} - ${logMessage || 'Default log message'}`,
    );
  };

  const handleGenerateTemporaryDeviceCode = async () => {
    const deviceCode = await generateDeviceCode();
    setTemporaryDeviceCode(deviceCode);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        @bitdrift/react-native Expo Integration Example
      </Text>

      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonActive]}
        onPress={handleGenerateTemporaryDeviceCode}
      >
        <Text style={styles.buttonText}>Generate Temporary Device Code</Text>
      </Pressable>
      {temporaryDeviceCode && (
        <Text selectable style={{ marginVertical: 10 }}>
          {temporaryDeviceCode}
        </Text>
      )}

      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonActive]}
        onPress={sendRandomRequest}
      >
        <Text style={styles.buttonText}>Send Random REST Request</Text>
      </Pressable>
    </View>
  );
};

export const App = () => {
  const [whatsNextYCoord, setWhatsNextYCoord] = useState<number>(0);
  const scrollViewRef = useRef<null | ScrollView>(null);

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView
        style={{
          flex: 1,
        }}
      >
        <HomeScreen />
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#00A76F',
    padding: 10,
    borderRadius: 5,
    marginVertical: 10,
  },
  buttonActive: {
    backgroundColor: '#007867',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  picker: {
    height: 50,
    width: 200,
    marginVertical: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    width: '80%',
    marginVertical: 10,
  },
});

export default App;
