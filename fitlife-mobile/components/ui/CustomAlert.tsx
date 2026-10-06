import { ThemedText } from "@/components/ThemedText";
import React from "react";
import { Modal, StyleSheet, TouchableOpacity, View } from "react-native";

interface CustomAlertProps {
  visible: boolean;
  title?: string;
  message: string;
  onClose: () => void;
}

export function CustomAlert({ visible, title, message, onClose }: CustomAlertProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {title && <ThemedText style={styles.title}>{title}</ThemedText>}
          <ThemedText style={styles.message}>{message}</ThemedText>
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <ThemedText style={styles.buttonText}>OK</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 28,
    minWidth: 260,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F97316',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#222',
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#F97316',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 