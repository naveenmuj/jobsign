import * as Location from 'expo-location';

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
}

export const POPULAR_CURRENCIES: CurrencyInfo[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee (INR)' },
  { code: 'USD', symbol: '$', name: 'US Dollar (USD)' },
  { code: 'GBP', symbol: '£', name: 'British Pound (GBP)' },
  { code: 'EUR', symbol: '€', name: 'Euro (EUR)' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar (CAD)' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar (AUD)' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen (JPY)' },
  { code: 'AED', symbol: 'AED ', name: 'UAE Dirham (AED)' },
  { code: 'SAR', symbol: 'SAR ', name: 'Saudi Riyal (SAR)' },
  { code: 'SGD', symbol: 'SG$', name: 'Singapore Dollar (SGD)' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar (NZD)' },
  { code: 'ZAR', symbol: 'R ', name: 'South African Rand (ZAR)' },
];

export class CurrencyService {
  /**
   * Synchronously detect the best matching currency from device timezone and locale.
   */
  public static detectDeviceCurrency(): CurrencyInfo {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      const locale = Intl.NumberFormat().resolvedOptions().locale || '';

      // India check (Kolkata/Calcutta timezone, or en-IN/hi-IN locale)
      if (
        tz.includes('Calcutta') ||
        tz.includes('Kolkata') ||
        locale.endsWith('-IN') ||
        locale.startsWith('hi') ||
        locale.startsWith('ta') ||
        locale.startsWith('te') ||
        locale.startsWith('kn') ||
        locale.startsWith('mr') ||
        locale.startsWith('bn') ||
        locale.startsWith('gu')
      ) {
        return POPULAR_CURRENCIES[0]; // INR ₹
      }

      // United Kingdom
      if (tz.includes('London') || locale.endsWith('-GB')) {
        return POPULAR_CURRENCIES[2]; // GBP £
      }

      // Eurozone
      if (
        tz.includes('Europe') ||
        locale.endsWith('-DE') ||
        locale.endsWith('-FR') ||
        locale.endsWith('-ES') ||
        locale.endsWith('-IT') ||
        locale.endsWith('-NL') ||
        locale.endsWith('-IE') ||
        locale.endsWith('-PT')
      ) {
        return POPULAR_CURRENCIES[3]; // EUR €
      }

      // Canada
      if (
        tz.includes('Toronto') ||
        tz.includes('Vancouver') ||
        tz.includes('Montreal') ||
        tz.includes('Edmonton') ||
        tz.includes('Winnipeg') ||
        locale.endsWith('-CA')
      ) {
        return POPULAR_CURRENCIES[4]; // CAD CA$
      }

      // Australia
      if (
        tz.includes('Australia') ||
        tz.includes('Sydney') ||
        tz.includes('Melbourne') ||
        tz.includes('Brisbane') ||
        tz.includes('Perth') ||
        tz.includes('Adelaide') ||
        locale.endsWith('-AU')
      ) {
        return POPULAR_CURRENCIES[5]; // AUD A$
      }

      // Japan
      if (tz.includes('Tokyo') || locale.endsWith('-JP') || locale.startsWith('ja')) {
        return POPULAR_CURRENCIES[6]; // JPY ¥
      }

      // UAE
      if (tz.includes('Dubai') || locale.endsWith('-AE')) {
        return POPULAR_CURRENCIES[7]; // AED
      }

      // Saudi Arabia
      if (tz.includes('Riyadh') || locale.endsWith('-SA')) {
        return POPULAR_CURRENCIES[8]; // SAR
      }

      // Default to USD
      return POPULAR_CURRENCIES[1]; // USD $
    } catch {
      return POPULAR_CURRENCIES[1]; // Fallback USD
    }
  }

  /**
   * Asynchronously detect country from GPS location (if permission granted),
   * falling back to device timezone/locale.
   */
  public static async detectFromLocationOrDevice(): Promise<CurrencyInfo> {
    try {
      let { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const req = await Location.requestForegroundPermissionsAsync();
        status = req.status;
      }
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
        const geo = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });

        if (geo && geo[0] && geo[0].isoCountryCode) {
          const code = geo[0].isoCountryCode.toUpperCase();
          switch (code) {
            case 'IN': return POPULAR_CURRENCIES[0]; // ₹
            case 'US': return POPULAR_CURRENCIES[1]; // $
            case 'GB': return POPULAR_CURRENCIES[2]; // £
            case 'DE':
            case 'FR':
            case 'IT':
            case 'ES':
            case 'NL':
            case 'IE':
            case 'PT':
            case 'AT':
            case 'BE':
            case 'FI':
            case 'GR': return POPULAR_CURRENCIES[3]; // €
            case 'CA': return POPULAR_CURRENCIES[4]; // CA$
            case 'AU': return POPULAR_CURRENCIES[5]; // A$
            case 'JP': return POPULAR_CURRENCIES[6]; // ¥
            case 'AE': return POPULAR_CURRENCIES[7]; // AED
            case 'SA': return POPULAR_CURRENCIES[8]; // SAR
          }
        }
      }
    } catch (e) {
      // Fallback silently to timezone
    }

    return this.detectDeviceCurrency();
  }

  /**
   * Synchronously detect whether the device is in the US or India based on timezone/locale.
   */
  public static detectMarketRegion(): 'US' | 'IN' {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      const locale = Intl.NumberFormat().resolvedOptions().locale || '';

      if (
        tz.includes('Calcutta') ||
        tz.includes('Kolkata') ||
        locale.endsWith('-IN') ||
        locale.startsWith('hi') ||
        locale.startsWith('ta') ||
        locale.startsWith('te') ||
        locale.startsWith('kn') ||
        locale.startsWith('mr') ||
        locale.startsWith('bn') ||
        locale.startsWith('gu')
      ) {
        return 'IN';
      }

      if (
        tz.startsWith('America/') ||
        tz.startsWith('US/') ||
        locale.endsWith('-US') ||
        locale === 'en-US'
      ) {
        return 'US';
      }

      return 'US';
    } catch {
      return 'US';
    }
  }

  /**
   * Asynchronously detect US vs India from GPS reverse-geocoding, falling back to timezone.
   */
  public static async detectMarketFromLocationOrDevice(): Promise<'US' | 'IN'> {
    try {
      let { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const req = await Location.requestForegroundPermissionsAsync();
        status = req.status;
      }
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
        const geo = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });

        if (geo && geo[0] && geo[0].isoCountryCode) {
          const code = geo[0].isoCountryCode.toUpperCase();
          if (code === 'IN') return 'IN';
          if (code === 'US') return 'US';
        }
      }
    } catch {}
    return this.detectMarketRegion();
  }

  private static inrFormatter = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  private static usFormatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  /**
   * Universal currency formatter with active symbol and regional number grouping.
   * Supports Indian number formatting (e.g. ₹1,50,000.00) and Western formatting (e.g. $150,000.00).
   * Uses cached Intl.NumberFormat instances for zero-allocation, sub-microsecond speed.
   */
  public static format(cents: number, symbol?: string, currencyCode?: string): string {
    const activeSymbol = symbol !== undefined && symbol !== null ? symbol : (currencyCode === 'INR' ? '₹' : '$');
    const safeCents = typeof cents === 'number' && !isNaN(cents) ? cents : 0;
    const value = safeCents / 100;
    const isIndia = activeSymbol === '₹' || currencyCode === 'INR';

    try {
      const formattedNumber = (isIndia ? this.inrFormatter : this.usFormatter).format(value);
      return `${activeSymbol}${formattedNumber}`;
    } catch {
      return `${activeSymbol}${value.toFixed(2)}`;
    }
  }
}
