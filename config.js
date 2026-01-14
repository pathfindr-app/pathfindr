/**
 * Pathfindr Configuration
 *
 * IMPORTANT: Replace placeholder values with your actual API keys before deploying.
 * Never commit real API keys to version control.
 */

const PathfindrConfig = {
  // ===========================================
  // SUPABASE - Authentication & Database
  // Get these from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
  // ===========================================
  supabase: {
    url: 'https://wxlglepsypmpnupxexoc.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4bGdsZXBzeXBtcG51cHhleG9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2ODgwMDIsImV4cCI6MjA4MzI2NDAwMn0.f_X3NWT6Gck2m4UDCqkvScJ-CwBH8oO22pELTflFxJ8',
  },

  // ===========================================
  // GOOGLE ADMOB - Ads (iOS & Android)
  // Get these from: https://admob.google.com/home/
  // ===========================================
  admob: {
    // App IDs (one per platform)
    appId: {
      ios: 'ca-app-pub-9697527729469740~7875900172',
      android: 'ca-app-pub-9697527729469740~6163363259',
    },
    // Ad Unit IDs
    banner: {
      ios: 'ca-app-pub-9697527729469740/9112960222',
      android: 'ca-app-pub-9697527729469740/9983188767',
    },
    interstitial: {
      ios: 'ca-app-pub-9697527729469740/6750698376',
      android: 'ca-app-pub-9697527729469740/8615617845',
    },
    rewarded: {
      ios: '',  // Add later if needed
      android: '',  // Add later if needed
    },
    // Test mode - IMPORTANT: Set to false before releasing to production!
    // When true: Uses test ad units, won't earn real revenue
    // When false: Uses production ad units, earns real revenue
    testing: true,  // TODO: Set to false for production release
  },

  // ===========================================
  // STRIPE - Web Payments
  // Get these from: https://dashboard.stripe.com/apikeys
  // ===========================================
  stripe: {
    publishableKey: 'pk_live_51SmYlPF241gDG9XDTe2tTZ11giUqHTLBgS5nAF27M3eWCM8CyzoMVfCDhAWrlurQ39VK1T0l76UmmtTDOk7bA4Tj00vJHJ2htU',
    priceId: 'price_1Smgc6F241gDG9XDTt9aK3Io',
  },

  // ===========================================
  // REVENUECAT - In-App Purchases (iOS & Android)
  // Get these from: https://app.revenuecat.com/
  // ===========================================
  revenuecat: {
    // API Keys (one per platform)
    apiKey: {
      ios: 'YOUR_REVENUECAT_IOS_API_KEY',      // Get from RevenueCat dashboard
      android: 'goog_YtSHMcSsmTibhXcGCPvHccYJIwB', // RevenueCat public API key for Android
    },
    // Product IDs (must match App Store Connect / Google Play Console)
    products: {
      premium: 'pathfindr_premium',  // One-time purchase: removes ads + unlocks modes
    },
    // Entitlement ID (configured in RevenueCat)
    entitlements: {
      premium: 'premium',
    },
  },

  // ===========================================
  // APP SETTINGS
  // ===========================================
  app: {
    name: 'Pathfindr',
    bundleId: 'world.pathfindr.app',
    version: '1.0.0',
  },

  // ===========================================
  // GOOGLE ADSENSE - Web Ads
  // Get these from: https://www.google.com/adsense/
  // ===========================================
  adsense: {
    // Your AdSense publisher ID (ca-pub-XXXXXXXXXXXXXXXX)
    publisherId: 'ca-pub-9697527729469740',
    // Ad slot IDs - will be created after site verification
    slots: {
      banner: 'YOUR_BANNER_SLOT_ID',        // 320x50 or responsive
      interstitial: 'YOUR_INTERSTITIAL_SLOT_ID', // Full page ad
    },
  },

  // ===========================================
  // AD PLACEMENT SETTINGS
  // ===========================================
  ads: {
    showBannerOnMenu: false,           // No banner on main menu
    showBannerBetweenRounds: true,     // Show banner during round recaps
    interstitialAfterRounds: [3],      // First ad after round 3
    bannerPosition: 'top',             // Top of screen during round recaps
  },

  // ===========================================
  // FEATURE FLAGS
  // ===========================================
  features: {
    leaderboards: true,
    playerJourney: true,
    rewardedAds: true,
  },

  // ===========================================
  // ADMIN CONFIGURATION
  // ===========================================
  admin: {
    // Emails that have admin privileges (ad-free, all features, etc.)
    emails: [
      'pathfindr.game@gmail.com',
      'pathfinder.game@gmail.com',
    ],
  },
};

// Detect platform
PathfindrConfig.platform = (() => {
  if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform()) {
    return window.Capacitor.getPlatform(); // 'ios' or 'android'
  }
  return 'web';
})();

// Helper to check if user has purchased ad-free
PathfindrConfig.isAdFree = () => {
  // Admins are always ad-free
  if (PathfindrConfig.isAdmin()) return true;
  // This will be set by auth.js when user data loads
  return window.pathfindrUser?.has_purchased === true;
};

// Helper to check if current user is an admin
PathfindrConfig.isAdmin = () => {
  const userEmail = window.pathfindrUser?.email ||
                    (typeof PathfindrAuth !== 'undefined' && PathfindrAuth.currentUser?.email);
  if (!userEmail) return false;
  return PathfindrConfig.admin.emails.includes(userEmail.toLowerCase());
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PathfindrConfig;
}
