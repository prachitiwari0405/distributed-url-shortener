import React, { useState, useEffect, useRef } from 'react';
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
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
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
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    fetchUrls();
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
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
      Alert.alert('Oops! 🤔', 'Please enter a URL to shorten');
      return;
    }

    if (!originalUrl.match(/^https?:\/\/.+/)) {
      Alert.alert('Invalid URL 🔗', 'Please enter a valid URL (must start with http:// or https://)');
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
      Alert.alert('Success! 🎉', 'Your URL has been shortened!');
    } catch (error: any) {
      console.error('Error shortening URL:', error);
      const message = error.response?.data?.detail || 'Failed to shorten URL';
      Alert.alert('Error 😕', message);
    } finally {
      setLoading(false);
    }
  };

  const deleteUrl = async (shortCode: string) => {
    Alert.alert(
      'Delete URL? 🗑️',
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
              Alert.alert('Deleted! ✅', 'URL removed successfully');
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
    Alert.alert('Copied! 📋', 'Short URL copied to clipboard');
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <Animated.View 
              style={[
                styles.header,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  style={styles.iconGradient}
                >
                  <Ionicons name="link" size={32} color="#ffffff" />
                </LinearGradient>
              </View>
              <Text style={styles.title}>URL Shortener</Text>
              <Text style={styles.subtitle}>Transform long URLs into short, shareable links ✨</Text>
            </Animated.View>

            {/* Input Section */}
            <View style={styles.inputSection}>
              <View style={styles.card}>
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIconContainer}>
                    <Ionicons name="globe" size={22} color="#667eea" />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Paste your long URL here..."
                    placeholderTextColor="rgba(255, 255, 255, 0.6)"
                    value={originalUrl}
                    onChangeText={setOriginalUrl}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                {showCustomCode && (
                  <View style={[styles.inputWrapper, styles.customInputWrapper]}>
                    <View style={styles.inputIconContainer}>
                      <Ionicons name="create" size={22} color="#667eea" />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Custom code (optional)"
                      placeholderTextColor="rgba(255, 255, 255, 0.6)"
                      value={customCode}
                      onChangeText={setCustomCode}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                )}

                <TouchableOpacity
                  style={styles.customToggle}
                  onPress={() => setShowCustomCode(!showCustomCode)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showCustomCode ? 'remove-circle' : 'add-circle'}
                    size={18}
                    color="#ffffff"
                  />
                  <Text style={styles.customToggleText}>
                    {showCustomCode ? 'Remove custom code' : 'Add custom code'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={shortenUrl}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={loading ? ['#9ca3af', '#6b7280'] : ['#10b981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.shortenButton}
                  >
                    {loading ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <>
                        <Ionicons name="rocket" size={22} color="#ffffff" />
                        <Text style={styles.shortenButtonText}>Shorten Now</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            {/* URLs List */}
            <View style={styles.urlsSection}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <Ionicons name="albums" size={24} color="#ffffff" />
                  <Text style={styles.sectionTitle}>Your Links</Text>
                </View>
                <TouchableOpacity 
                  onPress={fetchUrls}
                  style={styles.refreshButton}
                  activeOpacity={0.7}
                >
                  <Ionicons name="refresh-circle" size={28} color="#ffffff" />
                </TouchableOpacity>
              </View>

              {fetchingUrls ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#ffffff" />
                  <Text style={styles.loadingText}>Loading your links...</Text>
                </View>
              ) : urls.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconContainer}>
                    <Ionicons name="link-outline" size={80} color="rgba(255, 255, 255, 0.3)" />
                  </View>
                  <Text style={styles.emptyStateText}>No links yet</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Create your first shortened URL above! 🚀
                  </Text>
                </View>
              ) : (
                urls.map((url, index) => (
                  <Pressable key={index} style={styles.urlCard}>
                    <LinearGradient
                      colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
                      style={styles.urlCardGradient}
                    >
                      {/* Header with original URL */}
                      <View style={styles.urlHeader}>
                        <View style={styles.urlHeaderLeft}>
                          <View style={styles.linkIconContainer}>
                            <Ionicons name="link" size={18} color="#667eea" />
                          </View>
                          <Text style={styles.originalUrl} numberOfLines={1}>
                            {truncateUrl(url.original_url, 32)}
                          </Text>
                        </View>
                        {url.custom && (
                          <View style={styles.customBadge}>
                            <Ionicons name="star" size={10} color="#f59e0b" />
                            <Text style={styles.customBadgeText}>Custom</Text>
                          </View>
                        )}
                      </View>

                      {/* Short URL Display */}
                      <View style={styles.shortUrlContainer}>
                        <LinearGradient
                          colors={['#667eea', '#764ba2']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.shortUrlGradient}
                        >
                          <Ionicons name="flash" size={16} color="#FFD700" />
                          <Text style={styles.shortUrl} numberOfLines={1}>
                            {BACKEND_URL}/api/{url.short_code}
                          </Text>
                        </LinearGradient>
                      </View>

                      {/* Stats */}
                      <View style={styles.statsContainer}>
                        <View style={styles.stat}>
                          <View style={styles.statIconContainer}>
                            <Ionicons name="eye" size={16} color="#8b5cf6" />
                          </View>
                          <Text style={styles.statText}>{url.clicks}</Text>
                          <Text style={styles.statLabel}>clicks</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.stat}>
                          <View style={styles.statIconContainer}>
                            <Ionicons name="calendar" size={16} color="#ec4899" />
                          </View>
                          <Text style={styles.statText}>{formatDate(url.created_at)}</Text>
                        </View>
                      </View>

                      {/* Actions */}
                      <View style={styles.actionsContainer}>
                        <TouchableOpacity
                          style={styles.actionBtn}
                          onPress={() => copyToClipboard(getShortUrl(url.short_code))}
                          activeOpacity={0.7}
                        >
                          <LinearGradient
                            colors={['#3b82f6', '#2563eb']}
                            style={styles.actionBtnGradient}
                          >
                            <Ionicons name="copy" size={18} color="#ffffff" />
                            <Text style={styles.actionBtnText}>Copy</Text>
                          </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.actionBtn}
                          onPress={() => setSelectedQR(url.qr_code)}
                          activeOpacity={0.7}
                        >
                          <LinearGradient
                            colors={['#8b5cf6', '#7c3aed']}
                            style={styles.actionBtnGradient}
                          >
                            <Ionicons name="qr-code" size={18} color="#ffffff" />
                            <Text style={styles.actionBtnText}>QR</Text>
                          </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.actionBtn}
                          onPress={() => deleteUrl(url.short_code)}
                          activeOpacity={0.7}
                        >
                          <LinearGradient
                            colors={['#ef4444', '#dc2626']}
                            style={styles.actionBtnGradient}
                          >
                            <Ionicons name="trash" size={18} color="#ffffff" />
                            <Text style={styles.actionBtnText}>Delete</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    </LinearGradient>
                  </Pressable>
                ))
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>

      {/* QR Code Modal */}
      <Modal
        visible={selectedQR !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedQR(null)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setSelectedQR(null)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <LinearGradient
              colors={['#ffffff', '#f3f4f6']}
              style={styles.modalGradient}
            >
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleContainer}>
                  <Ionicons name="qr-code" size={28} color="#667eea" />
                  <Text style={styles.modalTitle}>QR Code</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => setSelectedQR(null)}
                  style={styles.closeButton}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle" size={32} color="#9ca3af" />
                </TouchableOpacity>
              </View>
              {selectedQR && (
                <View style={styles.qrContainer}>
                  <Image
                    source={{ uri: selectedQR }}
                    style={styles.qrCode}
                    resizeMode="contain"
                  />
                </View>
              )}
              <View style={styles.qrFooter}>
                <Ionicons name="scan" size={20} color="#667eea" />
                <Text style={styles.qrDescription}>
                  Scan this code to open the link instantly
                </Text>
              </View>
            </LinearGradient>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#667eea',
  },
  gradientBackground: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  inputSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 24,
    padding: 20,
    backdropFilter: 'blur(10px)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  customInputWrapper: {
    marginTop: 0,
  },
  inputIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    paddingVertical: 16,
    fontWeight: '500',
  },
  customToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginBottom: 12,
  },
  customToggleText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  shortenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  shortenButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  urlsSection: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 12,
  },
  refreshButton: {
    padding: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 16,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyIconContainer: {
    marginBottom: 24,
  },
  emptyStateText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  urlCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  urlCardGradient: {
    padding: 16,
  },
  urlHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  urlHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  linkIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  originalUrl: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
    flex: 1,
  },
  customBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  customBadgeText: {
    fontSize: 11,
    color: '#f59e0b',
    fontWeight: '700',
    marginLeft: 4,
  },
  shortUrlContainer: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  shortUrlGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  shortUrl: {
    flex: 1,
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '700',
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  stat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIconContainer: {
    marginRight: 6,
  },
  statText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '700',
    marginRight: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#d1d5db',
    marginHorizontal: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width - 48,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  modalGradient: {
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 12,
  },
  closeButton: {
    padding: 4,
  },
  qrContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  qrCode: {
    width: width - 136,
    height: width - 136,
  },
  qrFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
  },
  qrDescription: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
    marginLeft: 8,
  },
});
