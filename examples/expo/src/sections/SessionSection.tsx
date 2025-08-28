import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { Clipboard } from 'react-native';
import { getSessionID } from '@bitdrift/react-native';
import { Colors } from '../lib/colors';

interface SessionSectionProps {
  sessionId: string;
}

export const SessionSection = ({ sessionId }: SessionSectionProps) => {
  const copyTimelineUrl = async () => {
    try {
      const currentSessionId = await getSessionID();
      const timelineUrl = `https://timeline.bitdrift.dev/session/${currentSessionId}`;
      await Clipboard.setString(timelineUrl);
      console.log('Timeline URL copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy timeline URL:', error);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Session Timeline</Text>
      <Text style={styles.sessionInfo}>
        Current Session ID: <Text style={styles.sessionId}>{sessionId}</Text>
      </Text>
      <Text style={styles.timelineDescription}>
        Copy the timeline URL to share this session or view it in your browser.
      </Text>
      <View style={styles.buttonContainer}>
        <Button 
          title="Copy Timeline URL" 
          onPress={copyTimelineUrl} 
          color={Colors.primary} 
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
  sessionInfo: {
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 10,
    textAlign: 'center',
  },
  sessionId: {
    fontFamily: 'monospace',
    color: Colors.primary,
    fontWeight: 'bold',
  },
  timelineDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 15,
    textAlign: 'center',
    lineHeight: 20,
  },
});
