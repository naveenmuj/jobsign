import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Haptics from 'expo-haptics';
import { X, ExternalLink, Share2, Printer } from 'lucide-react-native';
import { Quote, ContractorProfile } from '../types';
import { PDFService } from '../services/PDFService';
import { AlertService } from '../services/AlertService';
import { getThemeColors, Theme } from '../theme';
import { useQuoteStore } from '../store/useQuoteStore';
import { useAppSafeArea } from '../utils/safeArea';

interface PDFPreviewModalProps {
  visible: boolean;
  quote: Quote | null;
  profile?: ContractorProfile;
  onClose: () => void;
}

export const PDFPreviewModal: React.FC<PDFPreviewModalProps> = ({
  visible,
  quote,
  profile,
  onClose,
}) => {
  const isDarkMode = useQuoteStore((state) => state.isDarkMode);
  const colors = getThemeColors(isDarkMode);
  const insets = useAppSafeArea();

  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    if (visible && quote) {
      setIsLoading(true);
      PDFService.generateInvoiceHTML(quote, profile)
        .then((html) => {
          if (isMounted) {
            setHtmlContent(html);
            setIsLoading(false);
          }
        })
        .catch((err) => {
          if (isMounted) {
            console.error('[PDFPreviewModal] Error generating HTML preview:', err);
            setIsLoading(false);
            AlertService.alert({
              title: 'Preview Error',
              message: 'Could not render invoice preview. Please try again.',
              type: 'WARNING',
            });
          }
        });
    }
    return () => {
      isMounted = false;
    };
  }, [visible, quote, profile]);

  if (!visible || !quote) return null;

  const isPaid = quote.status === 'PAID';
  const docTypeLabel =
    quote.documentType === 'TAX_INVOICE' || quote.status === 'INVOICED'
      ? 'Tax Invoice'
      : quote.documentType === 'BILL_OF_SUPPLY'
      ? 'Bill of Supply'
      : quote.documentType === 'DELIVERY_CHALLAN'
      ? 'Delivery Challan'
      : 'Estimate';

  const handleOpenExternal = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsActionLoading(true);
    try {
      await PDFService.openInExternalPDFViewer(quote, profile);
    } catch (err: any) {
      AlertService.alert({
        title: 'Could Not Open PDF',
        message: err?.message || 'Could not launch device PDF reader application.',
        type: 'WARNING',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsActionLoading(true);
    try {
      await PDFService.generateAndSharePDF(quote, profile);
    } catch (err: any) {
      AlertService.alert({
        title: 'Share Error',
        message: err?.message || 'Could not export PDF document.',
        type: 'WARNING',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handlePrint = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsActionLoading(true);
    try {
      await PDFService.printToPhysicalPrinter(quote, profile);
    } catch (err: any) {
      AlertService.alert({
        title: 'Printer Error',
        message: err?.message || 'Could not connect to printer.',
        type: 'WARNING',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Top Navigation Bar with Ergonomic Touch Targets */}
        <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <X size={22} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
              {docTypeLabel} #{quote.quoteNumber}
            </Text>
            <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
              {quote.clientName} · {isPaid ? 'Paid Receipt' : 'Live Document'}
            </Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.backgroundSecondary }]}
              onPress={handleOpenExternal}
              disabled={isActionLoading || isLoading}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ExternalLink size={18} color={colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.backgroundSecondary }]}
              onPress={handleShare}
              disabled={isActionLoading || isLoading}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Share2 size={18} color={colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.backgroundSecondary }]}
              onPress={handlePrint}
              disabled={isActionLoading || isLoading}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Printer size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* In-App Interactive PDF Document View */}
        <View style={styles.webviewContainer}>
          {isLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Rendering PDF Document...
              </Text>
            </View>
          ) : (
            <WebView
              originWhitelist={['*']}
              source={{ html: htmlContent }}
              scalesPageToFit={Platform.OS === 'android'}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              style={[styles.webview, { backgroundColor: '#FFFFFF' }]}
            />
          )}
        </View>

        {/* Bottom Floating Quick Actions */}
        <View style={[styles.bottomBar, { paddingBottom: Math.max(16, insets.bottom + 8), backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.openAppBtn, { backgroundColor: colors.primary }]}
            onPress={handleOpenExternal}
            disabled={isActionLoading || isLoading}
            activeOpacity={0.85}
          >
            <ExternalLink size={18} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.openAppText}>Open in Device PDF App</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sharePillBtn, { backgroundColor: colors.emerald }]}
            onPress={handleShare}
            disabled={isActionLoading || isLoading}
            activeOpacity={0.85}
          >
            <Share2 size={18} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.sharePillText}>Share PDF</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  closeBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  titleContainer: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  headerSub: {
    fontSize: 12,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webviewContainer: {
    flex: 1,
    backgroundColor: '#E2E8F0',
  },
  webview: {
    flex: 1,
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  bottomBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  openAppBtn: {
    flex: 1.2,
    flexDirection: 'row',
    minHeight: Theme.touchTarget.minHeight,
    borderRadius: Theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  openAppText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  sharePillBtn: {
    flex: 1,
    flexDirection: 'row',
    minHeight: Theme.touchTarget.minHeight,
    borderRadius: Theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  sharePillText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
