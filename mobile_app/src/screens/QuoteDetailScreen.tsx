import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Theme, getThemeColors, ThemeColors } from '../theme';
import { Quote } from '../types';
import { PDFService } from '../services/PDFService';
import { AlertService } from '../services/AlertService';
import { RegionPaymentService } from '../services/RegionPaymentService';
import { ChangeOrderModal } from '../components/ChangeOrderModal';
import { PaymentQRModal } from '../components/PaymentQRModal';
import { CompanyNamePromptModal } from '../components/CompanyNamePromptModal';
import * as ImagePicker from 'expo-image-picker';
import { useQuoteStore } from '../store/useQuoteStore';
import { useAppSafeArea } from '../utils/safeArea';
import { ChevronLeft, Trash2, FileText, Phone, MessageSquare, Plus, Check, Eye, Share2, Camera, Image as ImageIcon, MessageCircle, FileCheck } from 'lucide-react-native';
import { formatAmountInWords } from '../utils/numberToIndianWords';

interface QuoteDetailScreenProps {
  quote: Quote;
  onBack: () => void;
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 54,
      paddingBottom: 14,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    backBtn: {
      padding: 6,
    },
    headerTitle: {
      color: colors.textPrimary,
      fontSize: 17,
      fontWeight: '800',
    },
    headerRightActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    viewBtn: {
      backgroundColor: colors.primary + '18',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: Theme.borderRadius.full,
      borderWidth: 1,
      borderColor: colors.primary + '35',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    viewText: {
      color: colors.primary,
      fontWeight: 'bold',
      fontSize: 12,
    },
    shareBtn: {
      backgroundColor: colors.backgroundSecondary,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: Theme.borderRadius.full,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    shareText: {
      color: colors.textPrimary,
      fontWeight: 'bold',
      fontSize: 12,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 120,
    },
    securityCard: {
      padding: 16,
      borderRadius: Theme.borderRadius.md,
      marginBottom: 16,
      borderWidth: 1.5,
    },
    secLocked: {
      backgroundColor: colors.primaryLight,
      borderColor: colors.primary,
    },
    secPaid: {
      backgroundColor: colors.successLight,
      borderColor: colors.emerald,
    },
    secShield: {
      fontSize: 13,
      fontWeight: '900',
      color: colors.textPrimary,
      letterSpacing: 0.5,
    },
    secDesc: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
      lineHeight: 16,
    },
    hashBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 10,
      backgroundColor: colors.backgroundSecondary,
      padding: 8,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    hashLabel: {
      fontSize: 10,
      fontWeight: 'bold',
      color: colors.textMuted,
    },
    hashVal: {
      fontSize: 10,
      fontFamily: 'monospace',
      color: colors.textHighlight,
      flex: 1,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: Theme.borderRadius.md,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      marginBottom: 14,
      shadowColor: '#0F172A',
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    coCard: {
      borderColor: colors.purple + '66',
      backgroundColor: colors.purpleLight,
    },
    cardLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.textSecondary,
      letterSpacing: 0.8,
      marginBottom: 10,
    },
    clientName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.textPrimary,
    },
    clientDetail: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 4,
    },
    clientDate: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 8,
    },
    itemRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderColor: colors.borderSubtle,
    },
    itemTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    itemSub: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    itemAmount: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    coRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderColor: colors.purple + '33',
    },
    coTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    coDate: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 2,
    },
    coAmount: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.amber,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 4,
    },
    sumLabel: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    sumVal: {
      fontSize: 13,
      color: colors.textPrimary,
      fontWeight: '600',
    },
    totalRow: {
      borderTopWidth: 1.5,
      borderColor: colors.border,
      marginTop: 8,
      paddingTop: 10,
    },
    totalLabel: {
      fontSize: 14,
      fontWeight: '900',
      color: colors.textPrimary,
    },
    totalVal: {
      fontSize: 22,
      fontWeight: '900',
      color: colors.emerald,
    },
    bottomBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.surface,
      padding: 16,
      paddingBottom: 28,
      borderTopWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      gap: 12,
    },
    coBtn: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
      minHeight: Theme.touchTarget.minHeight,
      borderRadius: Theme.borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      gap: 6,
    },
    coBtnText: {
      color: colors.textPrimary,
      fontWeight: '800',
      fontSize: 14,
    },
    payBtn: {
      flex: 2,
      backgroundColor: colors.emerald,
      minHeight: Theme.touchTarget.minHeight,
      borderRadius: Theme.borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#0F172A',
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 3,
    },
    payBtnText: {
      color: '#FFFFFF',
      fontWeight: '900',
      fontSize: 15,
    },
    receiptBtn: {
      flex: 1,
      backgroundColor: colors.primary,
      minHeight: Theme.touchTarget.minHeight,
      borderRadius: Theme.borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      gap: 6,
    },
    receiptBtnText: {
      color: '#FFFFFF',
      fontWeight: '900',
      fontSize: 15,
    },
    clientHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    contactActionsRow: {
      flexDirection: 'row',
      gap: 8,
    },
    contactBtn: {
      backgroundColor: colors.backgroundSecondary,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: Theme.borderRadius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    contactBtnSms: {
      backgroundColor: colors.primaryLight,
      borderColor: colors.primary,
    },
    contactBtnText: {
      color: colors.textPrimary,
      fontSize: 12,
      fontWeight: 'bold',
    },
    photoPreview: {
      width: '100%',
      height: 180,
      borderRadius: Theme.borderRadius.sm,
      backgroundColor: colors.backgroundSecondary,
      marginBottom: 8,
    },
    photoCaption: {
      fontSize: 11,
      color: colors.textMuted,
      fontStyle: 'italic',
    },
    trashBtn: {
      padding: 8,
      borderRadius: Theme.borderRadius.full,
      backgroundColor: colors.roseLight,
      borderWidth: 1,
      borderColor: colors.rose + '40',
    },
    notesText: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    auditRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 5,
      borderBottomWidth: 1,
      borderColor: colors.borderSubtle,
    },
    auditLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    auditVal: {
      fontSize: 12,
      color: colors.textPrimary,
      fontWeight: '500',
    },
  });

export const QuoteDetailScreen: React.FC<QuoteDetailScreenProps> = ({ quote: initialQuote, onBack }) => {
  const { quotes, profile, deleteQuote, addQuote } = useQuoteStore();
  const isDarkMode = useQuoteStore((state) => state.isDarkMode);
  const colors = getThemeColors(isDarkMode);
  const quote = quotes.find((q) => q.id === initialQuote.id) || initialQuote;

  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const insets = useAppSafeArea();
  const curSymbol = quote.currencySymbol || profile?.currencySymbol || '$';
  const regionConfig = RegionPaymentService.getConfig(profile?.currencyCode, curSymbol);
  const depositCents = quote.depositAmountCents || 0;
  const balanceDueCents = Math.max(0, quote.totalAmountCents - depositCents);

  const [showChangeOrder, setShowChangeOrder] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const updateProfile = useQuoteStore((state) => state.updateProfile);

  const isPaid = quote.status === 'PAID';
  const isInvoiced = quote.status === 'INVOICED';
  const isLocked = quote.status === 'SIGNED_LOCKED';
  const docTypeLabel =
    quote.documentType === 'TAX_INVOICE'
      ? 'Tax Invoice'
      : quote.documentType === 'BILL_OF_SUPPLY'
      ? 'Bill of Supply'
      : quote.documentType === 'DELIVERY_CHALLAN'
      ? 'Delivery Challan'
      : isInvoiced
      ? 'Tax Invoice'
      : 'Quotation';

  const [pendingPdfAction, setPendingPdfAction] = useState<'VIEW' | 'SHARE'>('VIEW');
  const [includePhoto, setIncludePhoto] = useState<boolean>(quote.includePhotoInPdf !== false);

  useEffect(() => {
    setIncludePhoto(quote.includePhotoInPdf !== false);
  }, [quote.includePhotoInPdf]);

  const handleToggleIncludePhoto = async () => {
    const nextVal = !includePhoto;
    setIncludePhoto(nextVal);
    Haptics.selectionAsync();
    const updatedQuote: Quote = {
      ...quote,
      includePhotoInPdf: nextVal,
    };
    await addQuote(updatedQuote);
  };

  const getQuoteForPdf = () => ({
    ...quote,
    includePhotoInPdf: includePhoto,
  });

  const handleSharePDF = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const quoteForPdf = getQuoteForPdf();
    const needsCompanyName =
      !profile.hasCustomBusinessName &&
      (!profile.businessName || profile.businessName.trim() === '');
    if (needsCompanyName) {
      setPendingPdfAction('SHARE');
      setShowCompanyModal(true);
    } else {
      await PDFService.generateAndSharePDF(quoteForPdf, profile);
    }
  };

  const handleViewPDF = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const quoteForPdf = getQuoteForPdf();
    const needsCompanyName =
      !profile.hasCustomBusinessName &&
      (!profile.businessName || profile.businessName.trim() === '');
    if (needsCompanyName) {
      setPendingPdfAction('VIEW');
      setShowCompanyModal(true);
    } else {
      await PDFService.viewPDF(quoteForPdf, profile);
    }
  };

  const handleCompanySave = async (enteredName: string, enteredAddress: string) => {
    setShowCompanyModal(false);
    const quoteForPdf = getQuoteForPdf();
    const updated = {
      ...profile,
      businessName: enteredName || profile.businessName,
      address: enteredAddress || profile.address,
      hasCustomBusinessName: true,
    };
    updateProfile(updated);
    if (pendingPdfAction === 'VIEW') {
      await PDFService.viewPDF(quoteForPdf, updated);
    } else {
      await PDFService.generateAndSharePDF(quoteForPdf, updated);
    }
  };

  const handleCompanySkip = async () => {
    setShowCompanyModal(false);
    const quoteForPdf = getQuoteForPdf();
    if (pendingPdfAction === 'VIEW') {
      await PDFService.viewPDF(quoteForPdf, profile);
    } else {
      await PDFService.generateAndSharePDF(quoteForPdf, profile);
    }
  };

  const handleShareWhatsApp = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const docTypeLabel = quote.documentType === 'TAX_INVOICE' ? 'Tax Invoice'
      : quote.documentType === 'BILL_OF_SUPPLY' ? 'Bill of Supply'
      : quote.documentType === 'DELIVERY_CHALLAN' ? 'Delivery Challan'
      : isInvoiced ? 'Tax Invoice'
      : 'Quotation / Estimate';
    const amountStr = `${curSymbol}${(quote.totalAmountCents / 100).toFixed(2)}`;
    const balStr = `${curSymbol}${(balanceDueCents / 100).toFixed(2)}`;
    const dueText = quote.dueDateTimestamp ? `\n📅 Due Date: ${new Date(quote.dueDateTimestamp).toLocaleDateString()}` : '';
    const upiDetails = profile.upiId ? `\n💳 Pay via UPI: ${profile.upiId}` : '';
    const bankDetails = profile.bankAccountNumber ? `\n🏦 Bank: ${profile.bankName || ''} A/C: ${profile.bankAccountNumber} (IFSC: ${profile.bankIfsc || ''})` : '';

    const msg = `Dear ${quote.clientName},\n\nPlease find your ${docTypeLabel} #${quote.quoteNumber} for ${amountStr} from ${profile.businessName || 'our business'}.\nBalance Due: ${balStr}${dueText}${upiDetails}${bankDetails}\n\nThank you for choosing our services!`;
    const cleanPhone = (quote.clientPhone || '').replace(/[^0-9]/g, '');
    const waUrl = cleanPhone
      ? `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`
      : `whatsapp://send?text=${encodeURIComponent(msg)}`;
    const canOpen = await Linking.canOpenURL(waUrl).catch(() => false);
    if (canOpen) {
      await Linking.openURL(waUrl);
    } else if (cleanPhone) {
      await Linking.openURL(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`);
    } else {
      await handleSharePDF();
    }
  };

  const handleConvertToInvoice = () => {
    AlertService.alert({
      title: 'Issue Formal Invoice?',
      message: `Convert Agreement #${quote.quoteNumber} into a Formal Tax Invoice for ${quote.clientName}? The document will be updated with invoice headers and payment instructions.`,
      type: 'INFO',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Issue Invoice',
          onPress: async () => {
            const updated: Quote = {
              ...quote,
              status: 'INVOICED',
              invoiceIssuedTimestamp: Date.now(),
            };
            await addQuote(updated);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            AlertService.alert(
              'Invoice Issued',
              `Agreement #${quote.quoteNumber} is now marked as an active Tax Invoice. You can share it with ${quote.clientName} or collect payment.`,
              undefined,
              'SUCCESS'
            );
          },
        },
      ],
    });
  };

  const handleCaptureCompletedPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      AlertService.alert('Camera Permission Required', 'Please enable camera access to take a completed work photo.', undefined, 'WARNING');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      const updated: Quote = {
        ...quote,
        completedPhotoUri: result.assets[0].uri,
      };
      await addQuote(updated);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handlePickCompletedPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      const updated: Quote = {
        ...quote,
        completedPhotoUri: result.assets[0].uri,
      };
      await addQuote(updated);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleRemoveCompletedPhoto = async () => {
    const updated: Quote = {
      ...quote,
      completedPhotoUri: undefined,
    };
    await addQuote(updated);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleCaptureInitialPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      AlertService.alert('Camera Permission Required', 'Please enable camera access to take a worksite photo.', undefined, 'WARNING');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      const updated: Quote = {
        ...quote,
        photoUri: result.assets[0].uri,
      };
      await addQuote(updated);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handlePickInitialPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      const updated: Quote = {
        ...quote,
        photoUri: result.assets[0].uri,
      };
      await addQuote(updated);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleRemoveInitialPhoto = async () => {
    const updated: Quote = {
      ...quote,
      photoUri: undefined,
    };
    await addQuote(updated);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleDelete = () => {
    AlertService.alert({
      title: 'Delete Agreement?',
      message: `Are you sure you want to permanently delete Agreement #${quote.quoteNumber} for ${quote.clientName}? This action cannot be undone.`,
      type: 'DANGER',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteQuote(quote.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onBack();
          },
        },
      ],
    });
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
        >
          <ChevronLeft size={20} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{docTypeLabel} #{quote.quoteNumber}</Text>
        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.viewBtn}
            onPress={handleViewPDF}
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
          >
            <Eye size={13} color={colors.primary} />
            <Text style={styles.viewText}>View PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shareBtn}
            onPress={handleSharePDF}
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
          >
            <Share2 size={13} color={colors.textPrimary} />
            <Text style={styles.shareText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.trashBtn}
            onPress={handleDelete}
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
          >
            <Trash2 size={18} color={colors.rose} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 + insets.bottom }]}>
        {/* Status Security Banner */}
        <View style={[styles.securityCard, isPaid ? styles.secPaid : isInvoiced ? styles.secPaid : styles.secLocked]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.secShield}>
              {isPaid ? '✓ Paid in Full' : isInvoiced ? '📄 Tax Invoice Active' : '🔒 Digitally Sealed'}
            </Text>
            {!isPaid && !isInvoiced && (
              <TouchableOpacity
                style={{
                  backgroundColor: colors.primary,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 6,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                }}
                onPress={handleConvertToInvoice}
              >
                <FileCheck size={12} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '800' }}>Issue Invoice</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.secDesc}>
            {isPaid
              ? 'This job has been paid in full and released.'
              : isInvoiced
              ? `Formal Tax Invoice issued for ${quote.clientName}. Ready for settlement.`
              : 'Affirmative client consent captured on glass. Tamper-evident SHA-256 seal active.'}
          </Text>
          {quote.pdfSha256Hash && (
            <View style={styles.hashBox}>
              <Text style={styles.hashLabel}>HASH:</Text>
              <Text style={styles.hashVal}>{quote.pdfSha256Hash}</Text>
            </View>
          )}

          {/* Document Type & Payment Terms Metadata Badges */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            <View style={{ backgroundColor: colors.backgroundSecondary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: colors.borderSubtle }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textPrimary }}>
                📋 {docTypeLabel}
              </Text>
            </View>
            {quote.placeOfSupply && (
              <View style={{ backgroundColor: colors.backgroundSecondary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: colors.borderSubtle }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textSecondary }}>
                  🏛️ {quote.placeOfSupply}
                </Text>
              </View>
            )}
            {quote.paymentTerms && (
              <View style={{ backgroundColor: colors.backgroundSecondary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: colors.borderSubtle }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textSecondary }}>
                  ⏱️ {quote.paymentTerms.replace(/_/g, ' ')}
                </Text>
              </View>
            )}
            {quote.dueDateTimestamp && !isPaid && (
              <View style={{ backgroundColor: colors.primaryLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: colors.primary + '40' }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>
                  📅 Due: {new Date(quote.dueDateTimestamp).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>

          {/* Quick PDF Document Actions */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                backgroundColor: colors.primary + '18',
                borderWidth: 1,
                borderColor: colors.primary + '35',
                paddingVertical: 10,
                borderRadius: 8,
              }}
              onPress={handleViewPDF}
            >
              <Eye size={15} color={colors.primary} />
              <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>
                View PDF Contract
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                backgroundColor: colors.backgroundSecondary,
                borderWidth: 1,
                borderColor: colors.border,
                paddingVertical: 10,
                borderRadius: 8,
              }}
              onPress={handleSharePDF}
            >
              <Share2 size={15} color={colors.textPrimary} />
              <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 13 }}>
                Share Document
              </Text>
            </TouchableOpacity>
          </View>

          {/* WhatsApp Direct Share Action */}
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: '#25D366' + '18',
              borderWidth: 1.5,
              borderColor: '#25D366',
              paddingVertical: 10,
              borderRadius: 8,
              marginTop: 10,
            }}
            onPress={handleShareWhatsApp}
          >
            <MessageCircle size={16} color="#25D366" />
            <Text style={{ color: '#25D366', fontWeight: '800', fontSize: 13 }}>
              Share via WhatsApp {quote.clientPhone ? `(${quote.clientPhone})` : ''}
            </Text>
          </TouchableOpacity>

          {(quote.photoUri || quote.completedPhotoUri) && (
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 8,
                backgroundColor: includePhoto ? colors.primaryLight : colors.backgroundSecondary,
                borderWidth: 1,
                borderColor: includePhoto ? colors.primary : colors.border,
              }}
              activeOpacity={0.7}
              onPress={handleToggleIncludePhoto}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 5,
                  borderWidth: 1.5,
                  borderColor: includePhoto ? colors.primary : colors.textMuted,
                  backgroundColor: includePhoto ? colors.primary : colors.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {includePhoto && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textPrimary }}>
                  Exhibit A: Worksite Photo Proof {quote.photoUri && quote.completedPhotoUri ? '(Before & After)' : ''}
                </Text>
                <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                  {includePhoto ? 'Attached to PDF invoice' : 'Excluded from PDF (internal record only)'}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '800',
                  color: includePhoto ? colors.primary : colors.textMuted,
                  textTransform: 'uppercase',
                }}
              >
                {includePhoto ? 'Included' : 'Excluded'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Client & Scope Card */}
        <View style={styles.card}>
          <View style={styles.clientHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardLabel}>Client</Text>
              <Text style={styles.clientName}>{quote.clientName}</Text>
            </View>
            {quote.clientPhone && (
              <View style={styles.contactActionsRow}>
                <TouchableOpacity
                  style={styles.contactBtn}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    Linking.openURL(`tel:${quote.clientPhone}`);
                  }}
                >
                  <Phone size={12} color={colors.textPrimary} />
                  <Text style={styles.contactBtnText}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.contactBtn, styles.contactBtnSms]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    Linking.openURL(`sms:${quote.clientPhone}?body=Hi ${quote.clientName}, regarding agreement #${quote.quoteNumber}...`);
                  }}
                >
                  <MessageSquare size={12} color={colors.primary} />
                  <Text style={[styles.contactBtnText, { color: colors.primary }]}>Text</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          {quote.clientPhone && <Text style={styles.clientDetail}>{quote.clientPhone}</Text>}
          {quote.jobDescription && (
            <Text style={styles.clientDetail}>{quote.jobDescription}</Text>
          )}
          <Text style={styles.clientDate}>Created: {new Date(quote.createdAt).toLocaleString()}</Text>
        </View>

        {/* Worksite Evidence Photos (Before & After) */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <View>
              <Text style={styles.cardLabel}>Worksite Photo Evidence (Exhibit A)</Text>
              <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                {quote.photoUri && quote.completedPhotoUri
                  ? 'Dual Before & After proof active'
                  : quote.photoUri || quote.completedPhotoUri
                  ? 'Physical record attached'
                  : 'No photos captured yet'}
              </Text>
            </View>
            {(quote.photoUri || quote.completedPhotoUri) && (
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 6,
                  backgroundColor: includePhoto ? colors.primaryLight : colors.backgroundSecondary,
                  borderWidth: 1,
                  borderColor: includePhoto ? colors.primary : colors.border,
                }}
                activeOpacity={0.7}
                onPress={handleToggleIncludePhoto}
              >
                <View
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    borderWidth: 1.5,
                    borderColor: includePhoto ? colors.primary : colors.textMuted,
                    backgroundColor: includePhoto ? colors.primary : colors.surface,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {includePhoto && <Check size={11} color="#FFFFFF" strokeWidth={3} />}
                </View>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: includePhoto ? colors.primary : colors.textSecondary,
                  }}
                >
                  {includePhoto ? 'Attached in PDF' : 'Excluded from PDF'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Initial / Before Work Photo */}
          {quote.photoUri ? (
            <View style={{ marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: colors.amber, textTransform: 'uppercase' }}>
                  • Initial Condition (Before Work)
                </Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity onPress={handleCaptureInitialPhoto}>
                    <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '700' }}>Retake</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handlePickInitialPhoto}>
                    <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '700' }}>Gallery</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleRemoveInitialPhoto}>
                    <Text style={{ fontSize: 11, color: colors.rose, fontWeight: '700' }}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Image source={{ uri: quote.photoUri }} style={styles.photoPreview} resizeMode="cover" />
            </View>
          ) : (
            <TouchableOpacity
              style={{
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: colors.border,
                borderRadius: 8,
                padding: 12,
                alignItems: 'center',
                backgroundColor: colors.backgroundSecondary,
                marginBottom: 12,
              }}
              onPress={handleCaptureInitialPhoto}
            >
              <Camera size={18} color={colors.primary} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textPrimary, marginTop: 4 }}>
                + Add "Before Work" Initial Photo
              </Text>
              <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                Documents pre-existing damage prior to starting work
              </Text>
            </TouchableOpacity>
          )}

          {/* Completed / After Work Photo */}
          {quote.completedPhotoUri ? (
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: colors.emerald, textTransform: 'uppercase' }}>
                  • Completed Scope (After Work)
                </Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity onPress={handleCaptureCompletedPhoto}>
                    <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '700' }}>Retake</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handlePickCompletedPhoto}>
                    <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '700' }}>Gallery</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleRemoveCompletedPhoto}>
                    <Text style={{ fontSize: 11, color: colors.rose, fontWeight: '700' }}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Image source={{ uri: quote.completedPhotoUri }} style={styles.photoPreview} resizeMode="cover" />
            </View>
          ) : (
            <TouchableOpacity
              style={{
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: colors.emerald + '80',
                borderRadius: 8,
                padding: 12,
                alignItems: 'center',
                backgroundColor: colors.emerald + '0C',
              }}
              onPress={handleCaptureCompletedPhoto}
            >
              <Camera size={18} color={colors.emerald} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textPrimary, marginTop: 4 }}>
                + Add "After Work" Completion Photo
              </Text>
              <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                Generates a side-by-side Before & After comparison on Exhibit A
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Line Items Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Approved Line Items ({quote.lineItems.length})</Text>
          {quote.lineItems.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{item.description}</Text>
                <Text style={styles.itemSub}>Qty: {item.quantity}</Text>
              </View>
              <Text style={styles.itemAmount}>{curSymbol}{(item.totalCents / 100).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Change Orders Card (If any exist) */}
        {quote.changeOrders && quote.changeOrders.length > 0 && (
          <View style={[styles.card, styles.coCard]}>
            <Text style={[styles.cardLabel, { color: colors.purple }]}>
              Change Orders ({quote.changeOrders.length})
            </Text>
            {quote.changeOrders.map((co) => (
              <View key={co.id} style={styles.coRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.coTitle}>Add-On #{co.orderNumber}: {co.reason}</Text>
                  <Text style={styles.coDate}>{new Date(co.signatureTimestamp).toLocaleTimeString()}</Text>
                </View>
                <Text style={styles.coAmount}>+{curSymbol}{(co.addedTotalCents / 100).toFixed(2)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Totals Summary */}
        <View style={styles.card}>
          <View style={styles.summaryRow}>
            <Text style={styles.sumLabel}>Original Scope</Text>
            <Text style={styles.sumVal}>{curSymbol}{(quote.subtotalCents / 100).toFixed(2)}</Text>
          </View>

          {regionConfig.region === 'IN' && quote.isGstSplit !== false && quote.taxAmountCents > 0 ? (
            <>
              <View style={styles.summaryRow}>
                <Text style={styles.sumLabel}>CGST ({(quote.taxRateBasisPoints / 200).toFixed(2)}%)</Text>
                <Text style={styles.sumVal}>{curSymbol}{((quote.taxAmountCents / 2) / 100).toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.sumLabel}>SGST ({(quote.taxRateBasisPoints / 200).toFixed(2)}%)</Text>
                <Text style={styles.sumVal}>{curSymbol}{((quote.taxAmountCents / 2) / 100).toFixed(2)}</Text>
              </View>
            </>
          ) : (
            <View style={styles.summaryRow}>
              <Text style={styles.sumLabel}>
                {quote.taxLabel || regionConfig.defaultTaxLabel} ({((quote.taxRateBasisPoints ?? 825) / 100).toFixed(2)}%)
              </Text>
              <Text style={styles.sumVal}>{curSymbol}{(quote.taxAmountCents / 100).toFixed(2)}</Text>
            </View>
          )}

          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>TOTAL CONTRACT</Text>
            <Text style={styles.totalVal}>{curSymbol}{(quote.totalAmountCents / 100).toFixed(2)}</Text>
          </View>

          {depositCents > 0 && (
            <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderColor: colors.border, borderStyle: 'dashed' }}>
              <View style={styles.summaryRow}>
                <Text style={[styles.sumLabel, { color: colors.emerald, fontWeight: '700' }]}>
                  Less: {regionConfig.depositLabel}
                </Text>
                <Text style={[styles.sumVal, { color: colors.emerald, fontWeight: '700' }]}>
                  -{curSymbol}{(depositCents / 100).toFixed(2)}
                </Text>
              </View>
              <View style={[styles.summaryRow, { marginTop: 4 }]}>
                <Text style={[styles.totalLabel, { color: isPaid ? colors.emerald : colors.amber, fontSize: 14 }]}>
                  {isPaid ? 'PAID IN FULL (0.00 DUE)' : `${regionConfig.balanceDueLabel.toUpperCase()}:`}
                </Text>
                <Text style={[styles.totalVal, { color: isPaid ? colors.emerald : colors.amber, fontSize: 17 }]}>
                  {isPaid ? `${curSymbol}0.00` : `${curSymbol}${(balanceDueCents / 100).toFixed(2)}`}
                </Text>
              </View>
            </View>
          )}

          {/* Amount in Words */}
          <View style={{ marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderColor: colors.borderSubtle }}>
            <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '700' }}>Amount in Words:</Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textPrimary, marginTop: 1 }}>
              {formatAmountInWords(quote.totalAmountCents, profile?.currencyCode, curSymbol)}
            </Text>
          </View>

          {(quote.dueDateTimestamp || quote.paymentTerms) && (
            <View style={{ marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderColor: colors.borderSubtle, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>Payment Terms / Due Date:</Text>
              <Text style={{ fontSize: 12, fontWeight: '800', color: quote.dueDateTimestamp && !isPaid ? colors.rose : colors.textPrimary }}>
                {quote.dueDateTimestamp
                  ? new Date(quote.dueDateTimestamp).toLocaleDateString()
                  : quote.paymentTerms === 'DUE_ON_RECEIPT'
                  ? 'Due on Receipt'
                  : quote.paymentTerms}
              </Text>
            </View>
          )}
        </View>

        {/* Legal Terms & Work Conditions (If specified) */}
        {quote.notes ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Terms & Warranty</Text>
            <Text style={styles.notesText}>{quote.notes}</Text>
          </View>
        ) : null}

        {/* Courtroom Audit Attribution */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Digital Audit Certificate</Text>
          <View style={styles.auditRow}>
            <Text style={styles.auditLabel}>Signing Timestamp:</Text>
            <Text style={styles.auditVal}>
              {quote.signatureTimestamp ? new Date(quote.signatureTimestamp).toLocaleString() : 'N/A'}
            </Text>
          </View>
          <View style={styles.auditRow}>
            <Text style={styles.auditLabel}>GPS Verification:</Text>
            <Text style={styles.auditVal}>
              {quote.signatureGpsLat && quote.signatureGpsLng
                ? `${quote.signatureGpsLat.toFixed(5)}°, ${quote.signatureGpsLng.toFixed(5)}° (On-Site)`
                : 'Offline Field Stamped'}
            </Text>
          </View>
          <View style={styles.auditRow}>
            <Text style={styles.auditLabel}>Integrity Seal:</Text>
            <Text style={[styles.auditVal, { color: colors.emerald, fontWeight: 'bold' }]}>
              LOCKED_IMMUTABLE (SHA-256)
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Floating Bar */}
      <View style={[styles.bottomBar, { paddingBottom: 16 + insets.bottom }]}>
        {!isPaid && (
          <TouchableOpacity
            style={styles.coBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setShowChangeOrder(true);
            }}
          >
            <Plus size={16} color={colors.textPrimary} />
            <Text style={styles.coBtnText}>Add Change Order</Text>
          </TouchableOpacity>
        )}

        {!isPaid ? (
          <TouchableOpacity
            style={styles.payBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              setShowPayment(true);
            }}
          >
            <Text style={styles.payBtnText}>Collect Payment</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flex: 1, flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              style={[
                styles.receiptBtn,
                {
                  flex: 1,
                  backgroundColor: colors.backgroundSecondary,
                  borderWidth: 1,
                  borderColor: colors.border,
                },
              ]}
              onPress={handleViewPDF}
            >
              <Eye size={16} color={colors.primary} />
              <Text style={[styles.receiptBtnText, { color: colors.textPrimary }]}>View Receipt</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.receiptBtn, { flex: 1 }]} onPress={handleSharePDF}>
              <Share2 size={16} color="#FFFFFF" />
              <Text style={styles.receiptBtnText}>Share Receipt</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Modals */}
      {showChangeOrder && (
        <ChangeOrderModal
          quote={quote}
          visible={showChangeOrder}
          onClose={() => setShowChangeOrder(false)}
        />
      )}

      {showPayment && (
        <PaymentQRModal
          quote={quote}
          onClose={() => setShowPayment(false)}
        />
      )}

      {/* Company Name Prompt Modal before PDF Generation */}
      <CompanyNamePromptModal
        visible={showCompanyModal}
        initialName={profile.hasCustomBusinessName ? profile.businessName : ''}
        initialAddress={profile.address || ''}
        onSave={handleCompanySave}
        onSkip={handleCompanySkip}
        onClose={() => setShowCompanyModal(false)}
      />
    </View>
  );
};
