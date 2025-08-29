import React, { useState } from 'react';
import { View, Text, Button, TextInput, StyleSheet } from 'react-native';
import { Colors } from '../lib/colors';

export const LogSection = () => {
  const [logMessage, setLogMessage] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [selectedLogLevel, setSelectedLogLevel] = useState('info');

  const logMessageHandler = () => {
    if (!logMessage.trim()) {
      console.log('Please enter a log message');
      return;
    }

    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${selectedLogLevel.toUpperCase()}] ${logMessage}`;

    switch (selectedLogLevel) {
      case 'debug':
        console.debug(logMessage);
        break;
      case 'info':
        console.info(logMessage);
        break;
      case 'warn':
        console.warn(logMessage);
        break;
      case 'error':
        console.error(logMessage);
        break;
      default:
        console.log(logMessage);
    }

    setLogs((prevLogs) => [...prevLogs, logEntry]);
    setLogMessage('');
    console.log(`Logged: ${selectedLogLevel.toUpperCase()}`);
  };

  const clearLogs = () => {
    setLogs([]);
    console.log('Logs cleared');
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Logging</Text>
      <View style={styles.row}>
        <View style={styles.pickerContainer}>
          <Button
            title="Debug"
            onPress={() => setSelectedLogLevel('debug')}
            color={selectedLogLevel === 'debug' ? Colors.primary : Colors.secondary}
          />
          <Button
            title="Info"
            onPress={() => setSelectedLogLevel('info')}
            color={selectedLogLevel === 'info' ? Colors.primary : Colors.secondary}
          />
          <Button
            title="Warn"
            onPress={() => setSelectedLogLevel('warn')}
            color={selectedLogLevel === 'warn' ? Colors.primary : Colors.secondary}
          />
          <Button
            title="Error"
            onPress={() => setSelectedLogLevel('error')}
            color={selectedLogLevel === 'warn' ? Colors.primary : Colors.secondary}
          />
        </View>
      </View>
      
      <TextInput
        style={styles.input}
        placeholder="Enter log message"
        placeholderTextColor={Colors.secondary}
        value={logMessage}
        onChangeText={setLogMessage}
      />
      
      <View style={styles.buttonContainer}>
        <Button title="Log Message" onPress={logMessageHandler} color={Colors.primary} />
      </View>
      
      <View style={styles.buttonContainer}>
        <Button title="Clear Logs" onPress={clearLogs} color={Colors.secondary} />
      </View>
      
      {logs.length > 0 && (
        <View style={styles.logsContainer}>
          <Text style={styles.logsTitle}>Recent Logs:</Text>
          {logs.slice(-5).map((log, index) => (
            <Text key={index} style={styles.logEntry}>
              {log}
            </Text>
          ))}
        </View>
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
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
  logsContainer: {
    marginTop: 15,
    padding: 10,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  logsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: Colors.primary,
  },
  logEntry: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 5,
    fontFamily: 'monospace',
  },
});
