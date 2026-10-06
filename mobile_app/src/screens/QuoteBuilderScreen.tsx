import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Theme } from '../theme';
import { LineItem, Quote } from '../types';
import { useQuoteStore } from '../store/useQuoteStore';
import { SignaturePad } from '../components/SignaturePad';
import { PDFService } from '../services/PDFService';
import { PaywallModal } from '../components/PaywallModal';

export const QuoteBuilderScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { presets, addQuote, profile, quotes, isPro } = useQuoteStore();

  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [items, setItems] = useState<LineItem[]>([]);
  const [isSigning, setIsSigning] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  // Take damage proof photo
  const handleCapturePhoto = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera Permission', 'Please allow camera access to take worksite damage photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handlePickFromGallery = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  // 1-Tap Preset Addition
  const handleAddPreset = (preset: (typeof presets)[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newItem: LineItem = {
      id: Math.random().toString(36).substring(7),
      description: preset.title,
      unitPriceCents: preset.priceCents,
      quantity: 1,
      totalCents: preset.priceCents,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Calculations
  const subtotalCents = items.reduce((sum, item) => sum + item.totalCents, 0);
  const taxBasisPoints = profile.defaultTaxBasisPoints || 825;
  const taxAmountCents = Math.round((subtotalCents * taxBasisPoints) / 10000);
  const totalAmountCents = subtotalCents + taxAmountCents;

  const totalFormatted = `$${(totalAmountCents / 100).toFixed(2)}`;

  const handleStartSignature = () => {
    // Check free tier limits (3 quotes/mo)
    const currentMonthQuotes = quotes.filter((q) => {
      const d = new Date(q.createdAt);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    if (!isPro && currentMonthQuotes.length >= 3) {
      setShowPaywall(true);
      return;
    }

    if (!clientName.trim()) {
      Alert.alert('Missing Client Name', 'Please enter client name before signing.');
      return;
    }
    if (items.length === 0) {
      Alert.alert('No Line Items', 'Please add at least one line item to the estimate.');
      return;
    }
    setIsSigning(true);
  };

  const handleSaveSignature = async (svgPath: string) => {
    const newQuote: Quote = {
      id: Math.random().toString(36).substring(7),
      quoteNumber: Math.floor(1000 + Math.random() * 9000),
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim() || undefined,
      jobDescription: jobDescription.trim() || undefined,
      photoUri: photoUri || undefined,
      status: 'SIGNED_LOCKED',
      subtotalCents,
      taxRateBasisPoints: taxBasisPoints,
      taxAmountCents,
      totalAmountCents,
      signatureSvg: svgPath,
      signatureTimestamp: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lineItems: items,
      changeOrders: [],
    };

    newQuote.pdfSha256Hash = await PDFService.computeHash(newQuote);
    await addQuote(newQuote);
    setIsSigning(false);

    Alert.alert(
      'Estimate Locked & Approved! 🔒',
      `Quote #${newQuote.quoteNumber} for ${newQuote.clientName} is legally sealed. Would you like to text or email the PDF to the client now?`,
      [
        { text: 'Later', style: 'cancel', onPress: onBack },
        {
          text: 'Send PDF Now',
          onPress: async () => {
            await PDFService.generateAndSharePDF(newQuote, profile);
            onBack();
          },
        },
      ]
    );
  };

  if (isSigning) {
    return (
      <SignaturePad
        clientName={clientName}
        totalFormatted={totalFormatted}
        onCancel={() => setIsSigning(false)}
        onSave={handleSaveSignature}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>⬅ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>New 60-Sec Estimate</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Client Input */}
        <View style={styles.card}>
          <Text style={styles.label}>CLIENT & WORKSITE DETAILS</Text>
          <TextInput
            style={styles.input}
            placeholder="Client Name (e.g. Sarah Jenkins)"
            placeholderTextColor={Theme.colors.textMuted}
            value={clientName}
            onChangeText={setClientName}
          />
          <TextInput
            style={[styles.input, { marginTop: 10 }]}
            placeholder="Phone Number (e.g. 512-555-0199)"
            placeholderTextColor={Theme.colors.textMuted}
            keyboardType="phone-pad"
            value={clientPhone}
            onChangeText={setClientPhone}
          />
          <TextInput
            style={[styles.input, { marginTop: 10 }]}
            placeholder="Short Scope Summary (e.g. Electrical Breaker Swap)"
            placeholderTextColor={Theme.colors.textMuted}
            value={jobDescription}
            onChangeText={setJobDescription}
          />
        </View>

        {/* Damage Proof Photo Attachment */}
        <View style={styles.card}>
          <Text style={styles.label}>WORKSITE DAMAGE PROOF PHOTO</Text>
          {photoUri ? (
            <View style={styles.photoPreviewBox}>
              <Image source={{ uri: photoUri }} style={styles.photoPreview} />
              <TouchableOpacity style={styles.removePhotoBtn} onPress={() => setPhotoUri(null)}>
                <Text style={styles.removePhotoText}>Remove Photo ✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.photoActionsRow}>
              <TouchableOpacity style={styles.cameraBtn} onPress={handleCapturePhoto}>
                <Text style={styles.cameraBtnText}>📷 Snap Worksite Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.galleryBtn} onPress={handlePickFromGallery}>
                <Text style={styles.galleryBtnText}>🖼 Gallery</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 1-Tap Item Presets Bar */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>1-TAP ITEM PRESETS</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetScroll}>
          {presets.map((preset) => (
            <TouchableOpacity
              key={preset.id}
              style={styles.presetChip}
              onPress={() => handleAddPreset(preset)}
            >
              <Text style={styles.presetTitle}>+ {preset.title}</Text>
              <Text style={styles.presetPrice}>${(preset.priceCents / 100).toFixed(0)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Selected Items */}
        <View style={styles.card}>
          <Text style={styles.label}>ESTIMATE LINE ITEMS ({items.length})</Text>
          {items.length === 0 ? (
            <Text style={styles.emptyText}>Tap a preset above to quickly add items.</Text>
          ) : (
            items.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{item.description}</Text>
                  <Text style={styles.itemSub}>Qty: {item.quantity} × ${(item.unitPriceCents / 100).toFixed(2)}</Text>
                </View>
                <Text style={styles.itemTotal}>${(item.totalCents / 100).toFixed(2)}</Text>
                <TouchableOpacity onPress={() => handleRemoveItem(item.id)} style={styles.removeBtn}>
                  <Text style={styles.removeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Financial Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryVal}>${(subtotalCents / 100).toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Sales Tax ({(taxBasisPoints / 100).toFixed(2)}%)</Text>
            <Text style={styles.summaryVal}>${(taxAmountCents / 100).toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>TOTAL</Text>
            <Text style={styles.totalVal}>{totalFormatted}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Action */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.signButton} onPress={handleStartSignature}>
          <Text style={styles.signButtonText}>✍️ HAND PHONE TO CLIENT TO SIGN</Text>
        </TouchableOpacity>
      </View>

      {/* Paywall Modal */}
      <PaywallModal visible={showPaywall} onClose={() => setShowPaywall(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 14,
    backgroundColor: '#111827',
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  backBtn: {
    padding: 8,
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Theme.colors.primary,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: Theme.colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: Theme.borderRadius.sm,
    padding: 12,
    fontSize: 15,
    color: Theme.colors.textPrimary,
  },
  photoPreviewBox: {
    alignItems: 'center',
  },
  photoPreview: {
    width: '100%',
    height: 180,
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: '#334155',
  },
  removePhotoBtn: {
    marginTop: 8,
    padding: 6,
  },
  removePhotoText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: 'bold',
  },
  photoActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cameraBtn: {
    flex: 2,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: Theme.colors.primary,
    paddingVertical: 12,
    borderRadius: Theme.borderRadius.sm,
    alignItems: 'center',
  },
  cameraBtnText: {
    color: Theme.colors.primary,
    fontWeight: '800',
    fontSize: 13,
  },
  galleryBtn: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 12,
    borderRadius: Theme.borderRadius.sm,
    alignItems: 'center',
  },
  galleryBtnText: {
    color: Theme.colors.textSecondary,
    fontWeight: '700',
    fontSize: 13,
  },
  sectionHeader: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Theme.colors.textSecondary,
    letterSpacing: 0.8,
  },
  presetScroll: {
    gap: 8,
    paddingBottom: 16,
  },
  presetChip: {
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: Theme.colors.primary,
    borderRadius: Theme.borderRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  presetTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  presetPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: Theme.colors.emerald,
  },
  emptyText: {
    color: Theme.colors.textMuted,
    fontStyle: 'italic',
    paddingVertical: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  itemSub: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  itemTotal: {
    fontSize: 15,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    marginRight: 12,
  },
  removeBtn: {
    padding: 6,
  },
  removeBtnText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: 'bold',
  },
  summaryCard: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
  },
  summaryVal: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
  },
  totalRow: {
    borderTopWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 8,
    paddingTop: 10,
  },
  totalLabel: {
    fontSize: 17,
    fontWeight: '900',
    color: Theme.colors.textPrimary,
  },
  totalVal: {
    fontSize: 20,
    fontWeight: '900',
    color: Theme.colors.emerald,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#111827',
    padding: 16,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  signButton: {
    backgroundColor: Theme.colors.emerald,
    minHeight: Theme.touchTarget.minHeight,
    borderRadius: Theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadows.glowSuccess,
  },
  signButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
