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
    anonKey: 'sb_publishable_ar9QuO_YNixX-wIosQYsJA_gQLMXxcE',
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
    // Test mode - set to false for production
    testing: true,
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
  // APP SETTINGS
  // ===========================================
  app: {
    name: 'Pathfindr',
    bundleId: 'com.pathfindr.app',
    version: '1.0.0',
  },

  // ===========================================
  // AD PLACEMENT SETTINGS
  // ===========================================
  ads: {
    showBannerOnMenu: true,
    showBannerBetweenRounds: true,
    interstitialAfterRounds: [2, 4],  // Show interstitial after these rounds
    bannerPosition: 'bottom',          // 'top' or 'bottom'
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
