/**
 * JobSign Central Feature Flags Configuration
 * 
 * Controls monetization visibility and telemetry behavior.
 */

export interface FeatureFlagsConfig {
  /**
   * Flag to toggle all payment, subscription, pricing, and paywall features.
   * When FALSE:
   *  - All paywalls, upgrade buttons, pricing text, and subscription cards are completely hidden.
   *  - In-app purchases and RevenueCat network queries are skipped.
   */
  PAYMENT_ENABLED: boolean;

  /**
   * When TRUE:
   *  - All Pro capabilities (unlimited quotes, 4 PDF templates, tamper-proof audit seals, custom branding)
   *    are 100% unlocked for every user for free without limits or prompts.
   */
  FREE_ALL_FEATURES: boolean;

  /**
   * Whether to record user actions, screen views, PDF generations, and system events.
   */
  TELEMETRY_ENABLED: boolean;

  /**
   * Whether to store every telemetry event persistently into local SQLite database.
   * Ensures zero data loss even when operating completely offline.
   */
  OFFLINE_LOGGING_ENABLED: boolean;

  /**
   * Optional remote HTTP endpoint (e.g., webhook, PostHog, Supabase, custom server)
   * to stream/flush telemetry logs when online.
   * Can also be overridden by the user in Settings.
   */
  DEFAULT_TELEMETRY_ENDPOINT: string;

  /**
   * Whether to output structured telemetry events to the developer console.
   */
  CONSOLE_LOGS_ENABLED: boolean;
}

export const FEATURE_FLAGS: FeatureFlagsConfig = {
  // USER REQUEST: Make everything free and hide all payment related things on flag basis
  PAYMENT_ENABLED: false,
  FREE_ALL_FEATURES: true,

  // USER REQUEST: Make sure we get all the logs and user behaviors
  TELEMETRY_ENABLED: true,
  OFFLINE_LOGGING_ENABLED: true,
  DEFAULT_TELEMETRY_ENDPOINT: process.env.EXPO_PUBLIC_TELEMETRY_ENDPOINT || '',
  CONSOLE_LOGS_ENABLED: true,
};
