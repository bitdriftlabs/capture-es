import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { Colors } from '../lib/colors';

export const ErrorSection = () => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Error Testing</Text>
      <Text style={styles.errorDescription}>
        Test error reporting and crash handling by triggering different types of errors.
      </Text>
      
      <View style={styles.buttonContainer}>
        <Button 
          title="Trigger JavaScript Error" 
          onPress={() => {
            throw new Error('This is a test JavaScript error for error reporting');
          }} 
          color={Colors.errorLight} 
        />
      </View>
      
      <View style={styles.buttonContainer}>
        <Button 
          title="Trigger Memory Error" 
          onPress={() => {
            // This will crash the app with OOM
            const arr = [];
            while (true) {
              arr.push(new Array(1000000));
            }
          }} 
          color={Colors.errorDark} 
        />
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
  buttonContainer: {
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  errorDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 15,
    textAlign: 'center',
    lineHeight: 20,
  },
});
