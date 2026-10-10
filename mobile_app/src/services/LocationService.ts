import * as Location from 'expo-location';

export interface DetectedLocation {
  latitude: number;
  longitude: number;
  street?: string;
  city?: string;
  district?: string;
  region?: string;        // State (e.g., Karnataka, California)
  country?: string;
  postalCode?: string;    // Pincode / Zipcode
  formattedAddress: string;
  gstStateCode?: string;  // e.g., "29 - Karnataka"
  usStateCode?: string;   // e.g., "CA"
}

// Indian GST 2-digit State Codes (Rule 46 & CBIC standard)
export const GST_STATE_MAP: { code: string; name: string; aliases: string[] }[] = [
  { code: '01', name: 'Jammu and Kashmir', aliases: ['jammu & kashmir', 'j&k', 'jammu'] },
  { code: '02', name: 'Himachal Pradesh', aliases: ['himachal'] },
  { code: '03', name: 'Punjab', aliases: [] },
  { code: '04', name: 'Chandigarh', aliases: [] },
  { code: '05', name: 'Uttarakhand', aliases: ['uttaranchal'] },
  { code: '06', name: 'Haryana', aliases: ['gurugram', 'gurgaon', 'faridabad'] },
  { code: '07', name: 'Delhi', aliases: ['nct of delhi', 'new delhi', 'national capital territory of delhi', 'delhi'] },
  { code: '08', name: 'Rajasthan', aliases: ['jaipur', 'udaipur', 'jodhpur'] },
  { code: '09', name: 'Uttar Pradesh', aliases: ['up', 'u.p.', 'noida', 'lucknow', 'kanpur', 'ghaziabad'] },
  { code: '10', name: 'Bihar', aliases: ['patna'] },
  { code: '11', name: 'Sikkim', aliases: [] },
  { code: '12', name: 'Arunachal Pradesh', aliases: ['arunachal'] },
  { code: '13', name: 'Nagaland', aliases: [] },
  { code: '14', name: 'Manipur', aliases: [] },
  { code: '15', name: 'Mizoram', aliases: [] },
  { code: '16', name: 'Tripura', aliases: [] },
  { code: '17', name: 'Meghalaya', aliases: [] },
  { code: '18', name: 'Assam', aliases: ['guwahati'] },
  { code: '19', name: 'West Bengal', aliases: ['wb', 'w.b.', 'bengal', 'kolkata', 'calcutta'] },
  { code: '20', name: 'Jharkhand', aliases: ['ranchi'] },
  { code: '21', name: 'Odisha', aliases: ['orissa', 'bhubaneswar'] },
  { code: '22', name: 'Chhattisgarh', aliases: ['chhatisgarh', 'raipur'] },
  { code: '23', name: 'Madhya Pradesh', aliases: ['mp', 'm.p.', 'bhopal', 'indore'] },
  { code: '24', name: 'Gujarat', aliases: ['ahmedabad', 'surat', 'vadodara'] },
  { code: '26', name: 'Dadra and Nagar Haveli and Daman and Diu', aliases: ['daman', 'diu', 'dadra'] },
  { code: '27', name: 'Maharashtra', aliases: ['mumbai', 'pune', 'mh', 'nagpur', 'thane', 'navi mumbai'] },
  { code: '29', name: 'Karnataka', aliases: ['bengaluru', 'bangalore', 'mysuru', 'mysore', 'karnataka', 'hubli', 'mangalore'] },
  { code: '30', name: 'Goa', aliases: ['panaji'] },
  { code: '31', name: 'Lakshadweep', aliases: [] },
  { code: '32', name: 'Kerala', aliases: ['cochin', 'kochi', 'thiruvananthapuram', 'kerala'] },
  { code: '33', name: 'Tamil Nadu', aliases: ['tamilnadu', 'chennai', 'tn', 'coimbatore', 'madurai'] },
  { code: '34', name: 'Puducherry', aliases: ['pondicherry'] },
  { code: '35', name: 'Andaman and Nicobar Islands', aliases: ['andaman'] },
  { code: '36', name: 'Telangana', aliases: ['hyderabad', 'secunderabad'] },
  { code: '37', name: 'Andhra Pradesh', aliases: ['andhra', 'ap', 'a.p.', 'visakhapatnam', 'vijayawada'] },
  { code: '38', name: 'Ladakh', aliases: ['leh'] },
];

export const US_STATE_MAP: Record<string, string> = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA',
  colorado: 'CO', connecticut: 'CT', delaware: 'DE', florida: 'FL', georgia: 'GA',
  hawaii: 'HI', idaho: 'ID', illinois: 'IL', indiana: 'IN', iowa: 'IA',
  kansas: 'KS', kentucky: 'KY', louisiana: 'LA', maine: 'ME', maryland: 'MD',
  massachusetts: 'MA', michigan: 'MI', minnesota: 'MN', mississippi: 'MS', missouri: 'MO',
  montana: 'MT', nebraska: 'NE', nevada: 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
  'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', ohio: 'OH',
  oklahoma: 'OK', oregon: 'OR', pennsylvania: 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', tennessee: 'TN', texas: 'TX', utah: 'UT', vermont: 'VT',
  virginia: 'VA', washington: 'WA', 'west virginia': 'WV', wisconsin: 'WI', wyoming: 'WY',
};

export class LocationService {
  private static cachedLocation: DetectedLocation | null = null;
  private static isDetecting = false;

  /**
   * Matches any raw region string (e.g., "Karnataka" or "Bengaluru") to GST State Code format "29 - Karnataka".
   */
  public static matchGstStateCode(regionOrCityName?: string | null): string | null {
    if (!regionOrCityName) return null;
    const clean = regionOrCityName.trim().toLowerCase();

    // Check direct code match like "29" or "29 - Karnataka"
    const directCode = clean.match(/^(\d{2})/);
    if (directCode) {
      const found = GST_STATE_MAP.find((s) => s.code === directCode[1]);
      if (found) return `${found.code} - ${found.name}`;
    }

    // Match by name or alias
    for (const item of GST_STATE_MAP) {
      if (item.name.toLowerCase() === clean || clean.includes(item.name.toLowerCase())) {
        return `${item.code} - ${item.name}`;
      }
      for (const alias of item.aliases) {
        if (clean.includes(alias)) {
          return `${item.code} - ${item.name}`;
        }
      }
    }
    return null;
  }

  /**
   * Matches US State full name to 2-letter abbreviation (e.g. "California" -> "CA").
   */
  public static matchUsStateCode(stateName?: string | null): string | null {
    if (!stateName) return null;
    const clean = stateName.trim().toLowerCase();
    if (clean.length === 2) return clean.toUpperCase();
    return US_STATE_MAP[clean] || null;
  }

  /**
   * Resolves Indian State from Latitude / Longitude coordinates if reverse geocoding is unavailable.
   */
  public static resolveIndianStateFromCoords(lat: number, lng: number): { stateCode: string; city: string } | null {
    // Karnataka Bounding Box
    if (lat >= 11.5 && lat <= 18.5 && lng >= 74.0 && lng <= 78.6) {
      return { stateCode: '29 - Karnataka', city: 'Bengaluru, Karnataka' };
    }
    // Maharashtra
    if (lat >= 15.6 && lat <= 22.1 && lng >= 72.6 && lng <= 80.9) {
      return { stateCode: '27 - Maharashtra', city: 'Mumbai, Maharashtra' };
    }
    // Delhi NCR
    if (lat >= 28.3 && lat <= 28.95 && lng >= 76.7 && lng <= 77.45) {
      return { stateCode: '07 - Delhi', city: 'New Delhi, Delhi' };
    }
    // Tamil Nadu
    if (lat >= 8.0 && lat <= 13.6 && lng >= 76.2 && lng <= 80.4) {
      return { stateCode: '33 - Tamil Nadu', city: 'Chennai, Tamil Nadu' };
    }
    // Telangana
    if (lat >= 15.8 && lat <= 19.9 && lng >= 77.2 && lng <= 81.8) {
      return { stateCode: '36 - Telangana', city: 'Hyderabad, Telangana' };
    }
    // West Bengal
    if (lat >= 21.5 && lat <= 27.3 && lng >= 85.8 && lng <= 89.9) {
      return { stateCode: '19 - West Bengal', city: 'Kolkata, West Bengal' };
    }
    // Gujarat
    if (lat >= 20.1 && lat <= 24.7 && lng >= 68.1 && lng <= 74.5) {
      return { stateCode: '24 - Gujarat', city: 'Ahmedabad, Gujarat' };
    }
    return null;
  }

  /**
   * Returns cached location if already detected.
   */
  public static getCachedLocation(): DetectedLocation | null {
    return this.cachedLocation;
  }

  /**
   * Requests foreground permission if not already granted and reverse-geocodes current position.
   * Caches result so it is available before the user enters the estimate / invoice form.
   */
  public static async requestAndDetectLocation(): Promise<DetectedLocation | null> {
    if (this.isDetecting && this.cachedLocation) return this.cachedLocation;
    this.isDetecting = true;

    try {
      let { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const req = await Location.requestForegroundPermissionsAsync();
        status = req.status;
      }

      if (status !== 'granted') {
        this.isDetecting = false;
        return null;
      }

      let position: Location.LocationObject | null = null;

      // 1. First check last known position (instant, zero delay)
      try {
        position = await Location.getLastKnownPositionAsync();
      } catch (e) {
        // continue
      }

      // 2. If not found, fetch current position with timeout
      if (!position) {
        try {
          position = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
        } catch (e) {
          try {
            position = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Lowest,
            });
          } catch (e2) {
            console.log('[LocationService] getCurrentPositionAsync fallback:', e2);
          }
        }
      }

      // 3. If position is still null (e.g. inside emulator without GPS satellite lock)
      // fallback to device locale / timezone
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      const isIndiaTimezone = tz.includes('Calcutta') || tz.includes('Kolkata');

      if (!position?.coords) {
        if (isIndiaTimezone) {
          this.cachedLocation = {
            latitude: 12.9716,
            longitude: 77.5946,
            city: 'Bengaluru',
            region: 'Karnataka',
            country: 'India',
            formattedAddress: 'Bengaluru, Karnataka',
            gstStateCode: '29 - Karnataka',
          };
          this.isDetecting = false;
          return this.cachedLocation;
        }
        this.isDetecting = false;
        return null;
      }

      const { latitude, longitude } = position.coords;
      let geocoded: Location.LocationGeocodedAddress[] = [];

      try {
        geocoded = await Location.reverseGeocodeAsync({ latitude, longitude });
      } catch (geoErr) {
        console.log('[LocationService] reverseGeocodeAsync offline/fallback:', geoErr);
      }

      if (!geocoded || geocoded.length === 0) {
        // Resolve state from coordinates
        const coordState = this.resolveIndianStateFromCoords(latitude, longitude);
        this.cachedLocation = {
          latitude,
          longitude,
          city: coordState?.city || undefined,
          region: coordState ? coordState.stateCode.split(' - ')[1] : undefined,
          formattedAddress: coordState ? coordState.city : `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`,
          gstStateCode: coordState ? coordState.stateCode : isIndiaTimezone ? '29 - Karnataka' : undefined,
        };
        this.isDetecting = false;
        return this.cachedLocation;
      }

      const g = geocoded[0];
      const streetPart = g.streetNumber ? `${g.streetNumber} ${g.street || ''}`.trim() : (g.street || '');
      const districtPart = g.district || g.subregion || '';
      const cityPart = g.city || '';
      const regionPart = g.region || '';
      const postalPart = g.postalCode || '';
      const countryPart = g.country || '';

      // Build clean readable address line (e.g. "12 MG Road, Indiranagar, Bengaluru, Karnataka 560038")
      const addressParts = [
        streetPart,
        districtPart && districtPart !== cityPart ? districtPart : '',
        cityPart,
        regionPart && regionPart !== cityPart ? regionPart : '',
        postalPart,
      ].filter(Boolean);

      const formattedAddress = addressParts.join(', ');

      // Determine GST or US state code
      let gstStateCode = this.matchGstStateCode(regionPart) || this.matchGstStateCode(cityPart) || this.matchGstStateCode(districtPart) || undefined;
      if (!gstStateCode) {
        const fallbackState = this.resolveIndianStateFromCoords(latitude, longitude);
        if (fallbackState) {
          gstStateCode = fallbackState.stateCode;
        } else if (isIndiaTimezone) {
          gstStateCode = '29 - Karnataka';
        }
      }

      const usStateCode = this.matchUsStateCode(regionPart) || undefined;

      this.cachedLocation = {
        latitude,
        longitude,
        street: streetPart || undefined,
        city: cityPart || undefined,
        district: districtPart || undefined,
        region: regionPart || undefined,
        country: countryPart || undefined,
        postalCode: postalPart || undefined,
        formattedAddress: formattedAddress || (gstStateCode ? gstStateCode.split(' - ')[1] : `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`),
        gstStateCode,
        usStateCode,
      };

      return this.cachedLocation;
    } catch (e) {
      console.log('[LocationService] Location detection fallback:', e);
      return null;
    } finally {
      this.isDetecting = false;
    }
  }
}
