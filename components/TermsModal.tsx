import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { X } from 'lucide-react-native';

interface TermsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function TermsModal({ visible, onClose }: TermsModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Terms and Conditions</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#64748b" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Copyright Notice</Text>
          <Text style={styles.text}>
            This application and all its contents are protected by copyright law. 
            Copyright (©) 2024 robotiyee@gmail.com. All rights reserved.
          </Text>
          
          <Text style={styles.sectionTitle}>Terms of Use</Text>
          <Text style={styles.text}>
            By using this application, you agree to the following terms:
          </Text>
          
          <Text style={styles.bulletPoint}>• You may not copy, reproduce, distribute, or create derivative works from any part of this application without explicit written permission from the copyright owner.</Text>
          
          <Text style={styles.bulletPoint}>• You may not reverse engineer, decompile, or disassemble the application.</Text>
          
          <Text style={styles.bulletPoint}>• You may not use this application for any commercial purposes without prior authorization.</Text>
          
          <Text style={styles.bulletPoint}>• All intellectual property rights in the application remain with the copyright owner.</Text>
          
          <Text style={styles.bulletPoint}>• Any unauthorized use of this application may result in legal action.</Text>
          
          <Text style={styles.sectionTitle}>Prohibited Activities</Text>
          <Text style={styles.text}>
            Users are strictly prohibited from:
          </Text>
          
          <Text style={styles.bulletPoint}>• Copying any source code, design elements, or functionality</Text>
          
          <Text style={styles.bulletPoint}>• Distributing the application or any part thereof</Text>
          
          <Text style={styles.bulletPoint}>• Creating similar applications based on this work</Text>
          
          <Text style={styles.bulletPoint}>• Removing or modifying copyright notices</Text>
          
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <Text style={styles.text}>
            For permissions, licensing inquiries, or any questions regarding these terms, please contact: robotiyee@gmail.com
          </Text>
          
          <Text style={styles.sectionTitle}>Acceptance</Text>
          <Text style={styles.text}>
            By checking the &ldquo;I Accept the Terms and Conditions&rdquo; checkbox and using this application, you acknowledge that you have read, understood, and agree to be bound by these terms and conditions.
          </Text>
          
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
  },
  closeButton: {
    padding: 8,
    borderRadius: 15,
    borderTopLeftRadius: 4,
    borderBottomRightRadius: 4,
    backgroundColor: '#000000',
    transform: [{ rotate: '3deg' }],
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 24,
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: '#ffffff',
    marginBottom: 16,
  },
  bulletPoint: {
    fontSize: 16,
    lineHeight: 24,
    color: '#ffffff',
    marginBottom: 8,
    paddingLeft: 8,
  },
  bottomSpacing: {
    height: 40,
  },
});