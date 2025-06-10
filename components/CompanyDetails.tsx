import { CompanyDetails as CompanyDetailsType } from '@/services/GameAPI';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CompanyDetailsProps {
  company: CompanyDetailsType | null;
  visible: boolean;
  onClose: () => void;
}

export default function CompanyDetails({ company, visible, onClose }: CompanyDetailsProps) {
  if (!company) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <ScrollView>
            <TouchableOpacity style={styles.backButton} onPress={onClose}>
              <Ionicons name="arrow-back" size={24} color="#FF0000" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>

            <Image
              source={{ uri: company.image_background }}
              style={styles.image}
              resizeMode="cover"
            />
            
            <View style={styles.detailsContainer}>
              <Text style={styles.title}>{company.name}</Text>
              
              <View style={styles.infoRow}>
                <Text style={styles.label}>Games Count:</Text>
                <Text style={styles.value}>{company.games_count}</Text>
              </View>

              {company.description && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>About</Text>
                  <Text style={styles.description}>{company.description}</Text>
                </View>
              )}              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Popular Games</Text>
                {company.games && company.games.length > 0 ? (
                  company.games.map(game => (
                    <View key={game.id} style={styles.gameItem}>
                      <Text style={styles.gameName}>{game.name}</Text>
                      <Text style={styles.gameAdded}>Added by {game.added} players</Text>
                    </View>
                  ))
                ) : (
                  <Text style={[styles.description, { textAlign: 'center' }]}>
                    No games information available
                  </Text>
                )}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    minWidth: '100%',
    minHeight: '100%',
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButtonText: {
    color: '#FF0000',
    fontSize: 16,
    marginLeft: 8,
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 15,
  },
  detailsContainer: {
    padding: 15,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: '#252525',
    padding: 10,
    borderRadius: 8,
  },
  label: {
    fontWeight: 'bold',
    width: 100,
    color: '#3B82F6',
  },
  value: {
    flex: 1,
    color: '#FFFFFF',
  },
  section: {
    marginTop: 20,
    backgroundColor: '#252525',
    padding: 15,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#3B82F6',
  },
  description: {
    color: '#CCCCCC',
    lineHeight: 22,
  },
  gameItem: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
  },
  gameName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  gameAdded: {
    fontSize: 14,
    color: '#CCCCCC',
  },
});
