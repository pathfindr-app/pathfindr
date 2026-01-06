/**
 * Pathfindr Ads Module
 *
 * Handles ad display across platforms:
 * - iOS/Android: Google AdMob via Capacitor plugin
 * - Web: Google AdSense (separate integration)
 */

const PathfindrAds = {
  initialized: false,
  bannerVisible: false,
  interstitialReady: false,
  rewardedReady: false,

  /**
   * Initialize the ads system
   * Call this once on app startup, after user interaction (for audio policy compliance)
   */
  async init() {
    if (this.initialized) return;

    const platform = PathfindrConfig.platform;

    if (platform === 'web') {
      // Web uses AdSense - handled separately via script tags
      console.log('[Ads] Web platform detected - AdSense will be used');
      this.initialized = true;
      return;
    }

    // Native platforms use AdMob
    try {
      const { AdMob } = await import('@capacitor-community/admob');

      await AdMob.initialize({
        testingDevices: PathfindrConfig.admob.testing ? ['DEVICE_ID'] : [],
        initializeForTesting: PathfindrConfig.admob.testing,
      });

      // Set up event listeners
      AdMob.addListener('bannerAdLoaded', () => {
        console.log('[Ads] Banner loaded');
      });

      AdMob.addListener('bannerAdFailedToLoad', (error) => {
        console.warn('[Ads] Banner failed to load:', error);
      });

      AdMob.addListener('interstitialAdLoaded', () => {
        console.log('[Ads] Interstitial loaded');
        this.interstitialReady = true;
      });

      AdMob.addListener('interstitialAdFailedToLoad', (error) => {
        console.warn('[Ads] Interstitial failed to load:', error);
        this.interstitialReady = false;
      });

      AdMob.addListener('interstitialAdDismissed', () => {
        console.log('[Ads] Interstitial dismissed');
        this.interstitialReady = false;
        // Preload next interstitial
        this.prepareInterstitial();
      });

      AdMob.addListener('rewardedAdLoaded', () => {
        console.log('[Ads] Rewarded ad loaded');
        this.rewardedReady = true;
      });

      AdMob.addListener('rewardedAdDismissed', () => {
        this.rewardedReady = false;
        this.prepareRewarded();
      });

      this.AdMob = AdMob;
      this.initialized = true;

      // Preload interstitial and rewarded ads
      await this.prepareInterstitial();
      await this.prepareRewarded();

      console.log('[Ads] AdMob initialized successfully');
    } catch (error) {
      console.error('[Ads] Failed to initialize AdMob:', error);
    }
  },

  /**
   * Show banner ad
   * @param {string} position - 'top' or 'bottom'
   */
  async showBanner(position = 'bottom') {
    // Don't show if user purchased ad-free
    if (PathfindrConfig.isAdFree()) {
      console.log('[Ads] User is ad-free, skipping banner');
      return;
    }

    if (PathfindrConfig.platform === 'web') {
      this.showWebBanner();
      return;
    }

    if (!this.initialized || !this.AdMob) return;

    try {
      const platform = PathfindrConfig.platform;
      const adId = PathfindrConfig.admob.banner[platform];

      const { BannerAdSize, BannerAdPosition } = await import('@capacitor-community/admob');

      await this.AdMob.showBanner({
        adId: adId,
        adSize: BannerAdSize.BANNER,
        position: position === 'top' ? BannerAdPosition.TOP_CENTER : BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
      });

      this.bannerVisible = true;
    } catch (error) {
      console.error('[Ads] Failed to show banner:', error);
    }
  },

  /**
   * Hide banner ad
   */
  async hideBanner() {
    if (PathfindrConfig.platform === 'web') {
      this.hideWebBanner();
      return;
    }

    if (!this.initialized || !this.AdMob || !this.bannerVisible) return;

    try {
      await this.AdMob.hideBanner();
      this.bannerVisible = false;
    } catch (error) {
      console.error('[Ads] Failed to hide banner:', error);
    }
  },

  /**
   * Prepare interstitial ad (preload)
   */
  async prepareInterstitial() {
    if (PathfindrConfig.platform === 'web') return;
    if (!this.initialized || !this.AdMob) return;

    try {
      const platform = PathfindrConfig.platform;
      const adId = PathfindrConfig.admob.interstitial[platform];

      await this.AdMob.prepareInterstitial({
        adId: adId,
      });
    } catch (error) {
      console.error('[Ads] Failed to prepare interstitial:', error);
    }
  },

  /**
   * Show interstitial ad
   * @returns {Promise<boolean>} - true if ad was shown
   */
  async showInterstitial() {
    // Don't show if user purchased ad-free
    if (PathfindrConfig.isAdFree()) {
      console.log('[Ads] User is ad-free, skipping interstitial');
      return false;
    }

    if (PathfindrConfig.platform === 'web') {
      // Web interstitials would be a modal/overlay ad from AdSense
      return false;
    }

    if (!this.initialized || !this.AdMob || !this.interstitialReady) {
      console.log('[Ads] Interstitial not ready');
      return false;
    }

    try {
      await this.AdMob.showInterstitial();
      return true;
    } catch (error) {
      console.error('[Ads] Failed to show interstitial:', error);
      return false;
    }
  },

  /**
   * Prepare rewarded ad (preload)
   */
  async prepareRewarded() {
    if (!PathfindrConfig.features.rewardedAds) return;
    if (PathfindrConfig.platform === 'web') return;
    if (!this.initialized || !this.AdMob) return;

    try {
      const platform = PathfindrConfig.platform;
      const adId = PathfindrConfig.admob.rewarded[platform];

      await this.AdMob.prepareRewardedAd({
        adId: adId,
      });
    } catch (error) {
      console.error('[Ads] Failed to prepare rewarded ad:', error);
    }
  },

  /**
   * Show rewarded ad
   * @returns {Promise<boolean>} - true if user earned reward
   */
  async showRewarded() {
    if (PathfindrConfig.platform === 'web') {
      return false;
    }

    if (!this.initialized || !this.AdMob || !this.rewardedReady) {
      console.log('[Ads] Rewarded ad not ready');
      return false;
    }

    return new Promise(async (resolve) => {
      const rewardListener = this.AdMob.addListener('rewardedAdRewarded', (reward) => {
        console.log('[Ads] User earned reward:', reward);
        rewardListener.remove();
        resolve(true);
      });

      const dismissListener = this.AdMob.addListener('rewardedAdDismissed', () => {
        dismissListener.remove();
        // Reward is handled by rewardedAdRewarded event
      });

      try {
        await this.AdMob.showRewardedAd();
      } catch (error) {
        console.error('[Ads] Failed to show rewarded ad:', error);
        rewardListener.remove();
        dismissListener.remove();
        resolve(false);
      }
    });
  },

  /**
   * Check if interstitial should show after this round
   * @param {number} roundNumber - Current round (1-5)
   * @returns {boolean}
   */
  shouldShowInterstitialAfterRound(roundNumber) {
    return PathfindrConfig.ads.interstitialAfterRounds.includes(roundNumber);
  },

  /**
   * Remove all ads (called when user purchases ad-free)
   */
  async removeAllAds() {
    await this.hideBanner();
    console.log('[Ads] All ads removed - user purchased ad-free');
  },

  // ===========================================
  // WEB-SPECIFIC AD HANDLING (AdSense)
  // ===========================================

  showWebBanner() {
    const banner = document.getElementById('adsense-banner');
    if (banner) {
      banner.style.display = 'block';
    }
  },

  hideWebBanner() {
    const banner = document.getElementById('adsense-banner');
    if (banner) {
      banner.style.display = 'none';
    }
  },
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PathfindrAds;
}
