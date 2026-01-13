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
      // Use web interstitial (placeholder ad for now)
      return await this.showWebInterstitial();
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

  adsenseLoaded: false,

  /**
   * Load AdSense script if not already loaded
   */
  async loadAdSense() {
    if (this.adsenseLoaded) return;

    const publisherId = PathfindrConfig.adsense?.publisherId;
    if (!publisherId || publisherId.startsWith('YOUR_')) {
      console.log('[Ads] AdSense not configured');
      return;
    }

    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.onload = () => {
        this.adsenseLoaded = true;
        console.log('[Ads] AdSense loaded');
        resolve();
      };
      script.onerror = () => {
        console.warn('[Ads] AdSense failed to load (blocked?)');
        resolve();
      };
      document.head.appendChild(script);
    });
  },

  /**
   * Show web banner ad
   */
  async showWebBanner() {
    const banner = document.getElementById('adsense-banner');
    if (!banner) return;

    // Load AdSense if needed
    await this.loadAdSense();

    // Show the container
    banner.style.display = 'block';
    document.body.classList.add('ad-visible');

    // Initialize ad slot if AdSense loaded and configured
    const slotId = PathfindrConfig.adsense?.slots?.banner;
    if (this.adsenseLoaded && slotId && !slotId.startsWith('YOUR_')) {
      // Check if ad already initialized
      if (!banner.querySelector('.adsbygoogle')) {
        banner.innerHTML = `
          <ins class="adsbygoogle"
               style="display:block"
               data-ad-client="${PathfindrConfig.adsense.publisherId}"
               data-ad-slot="${slotId}"
               data-ad-format="auto"
               data-full-width-responsive="true"></ins>
        `;
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
          console.warn('[Ads] AdSense push failed:', e);
        }
      }
    } else {
      // Show placeholder when AdSense not configured
      banner.innerHTML = `
        <div class="ad-placeholder" style="
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border: 1px solid #00f0ff33;
          padding: 10px 20px;
          text-align: center;
          font-size: 12px;
          color: #666;
        ">
          <span style="color: #00f0ff;">Pathfindr Premium</span> - Remove ads & unlock all features
        </div>
      `;
    }
  },

  /**
   * Hide web banner ad
   */
  hideWebBanner() {
    const banner = document.getElementById('adsense-banner');
    if (banner) {
      banner.style.display = 'none';
    }
    document.body.classList.remove('ad-visible');
  },

  /**
   * Show web interstitial (overlay ad)
   * Note: AdSense doesn't have true interstitials like AdMob,
   * so this uses a full-page ad unit in a modal
   */
  async showWebInterstitial() {
    // Don't show if user is ad-free
    if (PathfindrConfig.isAdFree()) {
      return false;
    }

    // For now, use the placeholder ad
    // True AdSense interstitials require specific implementation
    await this.showPlaceholderAd();
    return true;
  },

  // ===========================================
  // PLACEHOLDER AD (for development/testing)
  // ===========================================

  /**
   * Show a placeholder interstitial ad
   * Returns a promise that resolves when user closes the ad
   * @returns {Promise<void>}
   */
  showPlaceholderAd() {
    return new Promise((resolve) => {
      // Don't show if user purchased ad-free
      if (typeof PathfindrConfig !== 'undefined' && PathfindrConfig.isAdFree()) {
        console.log('[Ads] User is ad-free, skipping placeholder ad');
        resolve();
        return;
      }

      // Create overlay
      const overlay = document.createElement('div');
      overlay.id = 'placeholder-ad-overlay';
      overlay.innerHTML = `
        <div class="placeholder-ad-container">
          <div class="placeholder-ad-label">ADVERTISEMENT</div>
          <div class="placeholder-ad-content">
            <div class="placeholder-ad-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="2" y="3" width="20" height="14" rx="2"/>
                <path d="M8 21h8"/>
                <path d="M12 17v4"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <div class="placeholder-ad-text">
              <span class="ad-title">Pathfindr Premium</span>
              <span class="ad-subtitle">Remove ads & support development</span>
            </div>
          </div>
          <div class="placeholder-ad-timer">
            <span id="ad-countdown">5</span>s
          </div>
          <button id="close-placeholder-ad" class="placeholder-ad-close" disabled>
            Skip
          </button>
        </div>
      `;

      // Add styles if not already present
      if (!document.getElementById('placeholder-ad-styles')) {
        const styles = document.createElement('style');
        styles.id = 'placeholder-ad-styles';
        styles.textContent = `
          #placeholder-ad-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .placeholder-ad-container {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border: 1px solid #00f0ff33;
            border-radius: 12px;
            padding: 32px;
            max-width: 400px;
            width: 90%;
            text-align: center;
            position: relative;
            box-shadow: 0 0 40px rgba(0, 240, 255, 0.15);
          }
          .placeholder-ad-label {
            font-size: 10px;
            letter-spacing: 2px;
            color: #666;
            margin-bottom: 24px;
          }
          .placeholder-ad-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
            margin-bottom: 24px;
          }
          .placeholder-ad-icon svg {
            width: 64px;
            height: 64px;
            stroke: #00f0ff;
          }
          .placeholder-ad-text {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          .ad-title {
            font-size: 20px;
            font-weight: 600;
            color: #fff;
          }
          .ad-subtitle {
            font-size: 14px;
            color: #888;
          }
          .placeholder-ad-timer {
            font-size: 14px;
            color: #00f0ff;
            margin-bottom: 16px;
          }
          .placeholder-ad-close {
            background: transparent;
            border: 1px solid #444;
            color: #666;
            padding: 10px 32px;
            border-radius: 6px;
            cursor: not-allowed;
            font-size: 14px;
            transition: all 0.3s ease;
          }
          .placeholder-ad-close:not(:disabled) {
            border-color: #00f0ff;
            color: #00f0ff;
            cursor: pointer;
          }
          .placeholder-ad-close:not(:disabled):hover {
            background: #00f0ff22;
          }
        `;
        document.head.appendChild(styles);
      }

      document.body.appendChild(overlay);

      // Countdown timer
      let countdown = 5;
      const countdownEl = document.getElementById('ad-countdown');
      const closeBtn = document.getElementById('close-placeholder-ad');

      const timer = setInterval(() => {
        countdown--;
        if (countdownEl) countdownEl.textContent = countdown;

        if (countdown <= 0) {
          clearInterval(timer);
          if (closeBtn) {
            closeBtn.disabled = false;
            closeBtn.textContent = 'Continue';
          }
        }
      }, 1000);

      // Close handler
      closeBtn.addEventListener('click', () => {
        if (closeBtn.disabled) return;
        overlay.remove();
        resolve();
      });

      console.log('[Ads] Showing placeholder ad');
    });
  },
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PathfindrAds;
}
