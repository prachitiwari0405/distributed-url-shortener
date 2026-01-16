import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const { width } = Dimensions.get('window');

interface URL {
  original_url: string;
  short_code: string;
  clicks: number;
  created_at: string;
  qr_code: string;
  custom: boolean;
}

export default function Index() {
  const [originalUrl, setOriginalUrl] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [urls, setUrls] = useState<URL[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingUrls, setFetchingUrls] = useState(true);
  const [selectedQR, setSelectedQR] = useState<string | null>(null);
  const [showCustomCode, setShowCustomCode] = useState(false);

  useEffect(() => {
    fetchUrls();
  }, []);

  const fetchUrls = async () => {
    try {
      setFetchingUrls(true);
      const response = await axios.get(`${BACKEND_URL}/api/urls`);
      setUrls(response.data);
    } catch (error) {
      console.error('Error fetching URLs:', error);
      Alert.alert('Error', 'Failed to fetch URLs');
    } finally {
      setFetchingUrls(false);
    }
  };

  const shortenUrl = async () => {
    if (!originalUrl.trim()) {
      Alert.alert('Error', 'Please enter a URL');
      return;
    }

    // Basic URL validation
    if (!originalUrl.match(/^https?:\/\/.+/)) {
      Alert.alert('Error', 'Please enter a valid URL (must start with http:// or https://)');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${BACKEND_URL}/api/shorten`, {
        original_url: originalUrl,
        custom_code: customCode.trim() || null,
      });

      setUrls([response.data, ...urls]);
      setOriginalUrl('');
      setCustomCode('');
      setShowCustomCode(false);
      Alert.alert('Success', 'URL shortened successfully!');
    } catch (error: any) {
      console.error('Error shortening URL:', error);
      const message = error.response?.data?.detail || 'Failed to shorten URL';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const deleteUrl = async (shortCode: string) => {
    Alert.alert(
      'Delete URL',
      'Are you sure you want to delete this shortened URL?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${BACKEND_URL}/api/urls/${shortCode}`);
              setUrls(urls.filter((url) => url.short_code !== shortCode));
              Alert.alert('Success', 'URL deleted successfully');
            } catch (error) {
              console.error('Error deleting URL:', error);
              Alert.alert('Error', 'Failed to delete URL');
            }
          },
        },
      ]
    );
  };

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied!', 'Short URL copied to clipboard');
  };

  const getShortUrl = (shortCode: string) => {
    return `${BACKEND_URL}/api/${shortCode}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const truncateUrl = (url: string, maxLength: number = 40) => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="link" size={40} color="#6366f1" />
            <Text style={styles.title}>URL Shortener</Text>
            <Text style={styles.subtitle}>Shorten your long URLs instantly</Text>
          </View>

          {/* Input Section */}
          <View style={styles.inputSection}>
            <View style={styles.inputContainer}>
              <Ionicons name="globe-outline" size={20} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your long URL here"
                placeholderTextColor="#9ca3af"
                value={originalUrl}
                onChangeText={setOriginalUrl}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {showCustomCode && (
              <View style={styles.inputContainer}>
                <Ionicons name="pencil-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Custom code (optional)"
                  placeholderTextColor="#9ca3af"
                  value={customCode}
                  onChangeText={setCustomCode}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            )}

            <TouchableOpacity
              style={styles.customCodeToggle}
              onPress={() => setShowCustomCode(!showCustomCode)}
            >
              <Ionicons
                name={showCustomCode ? 'chevron-up' : 'chevron-down'}
                size={16}
                color="#6366f1"
              />
              <Text style={styles.customCodeToggleText}>
                {showCustomCode ? 'Hide' : 'Add'} custom code
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.shortenButton, loading && styles.shortenButtonDisabled]}
              onPress={shortenUrl}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="flash" size={20} color="#ffffff" />
                  <Text style={styles.shortenButtonText}>Shorten URL</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* URLs List */}
          <View style={styles.urlsSection}>
            <View style={styles.urlsHeader}>
              <Text style={styles.urlsTitle}>Your Shortened URLs</Text>
              <TouchableOpacity onPress={fetchUrls}>
                <Ionicons name="refresh" size={20} color="#6366f1" />
              </TouchableOpacity>
            </View>

            {fetchingUrls ? (
              <ActivityIndicator size="large" color="#6366f1" style={styles.loader} />
            ) : urls.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="link-outline" size={64} color="#d1d5db" />
                <Text style={styles.emptyStateText}>No shortened URLs yet</Text>
                <Text style={styles.emptyStateSubtext}>Create your first short link above</Text>
              </View>
            ) : (
              urls.map((url, index) => (
                <View key={index} style={styles.urlCard}>
                  <View style={styles.urlCardHeader}>
                    <View style={styles.urlCardHeaderLeft}>
                      <Ionicons name="link" size={16} color="#6366f1" />
                      <Text style={styles.urlCardTitle}>
                        {truncateUrl(url.original_url, 35)}
                      </Text>
                    </View>
                    {url.custom && (
                      <View style={styles.customBadge}>
                        <Text style={styles.customBadgeText}>Custom</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.shortCodeContainer}>
                    <Text style={styles.shortCodeLabel}>Short URL:</Text>
                    <Text style={styles.shortCode}>
                      {BACKEND_URL}/api/{url.short_code}
                    </Text>
                  </View>

                  <View style={styles.urlCardStats}>
                    <View style={styles.stat}>
                      <Ionicons name="eye-outline" size={16} color="#6b7280" />
                      <Text style={styles.statText}>{url.clicks} clicks</Text>
                    </View>
                    <View style={styles.stat}>
                      <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                      <Text style={styles.statText}>{formatDate(url.created_at)}</Text>
                    </View>
                  </View>

                  <View style={styles.urlCardActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => copyToClipboard(getShortUrl(url.short_code))}
                    >
                      <Ionicons name="copy-outline" size={18} color="#6366f1" />
                      <Text style={styles.actionButtonText}>Copy</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => setSelectedQR(url.qr_code)}
                    >
                      <Ionicons name="qr-code-outline" size={18} color="#6366f1" />
                      <Text style={styles.actionButtonText}>QR Code</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => deleteUrl(url.short_code)}
                    >
                      <Ionicons name="trash-outline" size={18} color="#ef4444" />
                      <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* QR Code Modal */}
      <Modal
        visible={selectedQR !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedQR(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>QR Code</Text>
              <TouchableOpacity onPress={() => setSelectedQR(null)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            {selectedQR && (
              <Image
                source={{ uri: selectedQR }}
                style={styles.qrCode}
                resizeMode="contain"
              />
            )}
            <Text style={styles.qrCodeDescription}>
              Scan this QR code to access the shortened URL
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
  },
  inputSection: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 12,
  },
  customCodeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  customCodeToggleText: {
    fontSize: 14,
    color: '#6366f1',
    marginLeft: 4,
    fontWeight: '500',
  },
  shortenButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  shortenButtonDisabled: {
    opacity: 0.6,
  },
  shortenButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  urlsSection: {
    paddingHorizontal: 16,
  },
  urlsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  urlsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  loader: {
    marginTop: 32,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
  urlCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  urlCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  urlCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  urlCardTitle: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  customBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  customBadgeText: {
    fontSize: 10,
    color: '#1e40af',
    fontWeight: '600',
  },
  shortCodeContainer: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  shortCodeLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  shortCode: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  urlCardStats: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  urlCardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '600',
    marginLeft: 4,
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
  },
  deleteButtonText: {
    color: '#ef4444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  qrCode: {
    width: width - 112,
    height: width - 112,
    alignSelf: 'center',
    marginBottom: 16,
  },
  qrCodeDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});
