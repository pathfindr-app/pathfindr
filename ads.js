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
  bannerRotationIndex: 0,  // Track rotation between Go Pro and AdSense

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
   * Show web banner ad - rotates between Go Pro promo and AdSense
   */
  async showWebBanner() {
    const banner = document.getElementById('adsense-banner');
    if (!banner) return;

    // Show the container
    banner.style.display = 'block';
    document.body.classList.add('ad-visible');

    // Rotate between Go Pro (index 0) and AdSense (index 1, 2, 3...)
    // Show Go Pro every 3rd impression
    const showGoPro = this.bannerRotationIndex % 3 === 0;
    this.bannerRotationIndex++;

    if (showGoPro) {
      console.log('[Ads] Showing Go Pro banner (rotation)');
      this.showBannerFallback(banner);
      return;
    }

    // Try to show AdSense
    await this.loadAdSense();

    const slotId = PathfindrConfig.adsense?.slots?.banner;
    if (this.adsenseLoaded && slotId && !slotId.startsWith('YOUR_')) {
      console.log('[Ads] Showing AdSense banner (rotation)');
      // Clear previous content and create fresh ad slot
      banner.innerHTML = `
        <ins class="adsbygoogle"
             style="display:block; height:90px; max-height:90px;"
             data-ad-client="${PathfindrConfig.adsense.publisherId}"
             data-ad-slot="${slotId}"
             data-ad-format="horizontal"></ins>
      `;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});

        // Check if ad loaded after a delay, show fallback if not
        setTimeout(() => {
          this.checkAdLoadedOrFallback(banner);
        }, 2000);
      } catch (e) {
        console.warn('[Ads] AdSense push failed:', e);
        this.showBannerFallback(banner);
      }
    } else {
      // AdSense not configured, show Go Pro
      this.showBannerFallback(banner);
    }
  },

  /**
   * Check if AdSense ad loaded, show fallback if not
   */
  checkAdLoadedOrFallback(banner) {
    const adElement = banner.querySelector('.adsbygoogle');
    if (!adElement) {
      this.showBannerFallback(banner);
      return;
    }

    // Check if ad has actual content
    const hasIframe = adElement.querySelector('iframe');
    const isFilled = adElement.dataset.adStatus === 'filled';
    const isUnfilled = adElement.dataset.adStatus === 'unfilled';

    // If explicitly unfilled or no iframe after timeout, show fallback
    if (isUnfilled || (!hasIframe && !isFilled)) {
      console.log('[Ads] Ad did not fill, showing fallback');
      this.showBannerFallback(banner);
    }
  },

  /**
   * Show Go Pro fallback banner - Premium glassmorphism design
   */
  showBannerFallback(banner) {
    // Inject styles if not present
    if (!document.getElementById('pro-banner-styles')) {
      const style = document.createElement('style');
      style.id = 'pro-banner-styles';
      style.textContent = `
        .pro-banner {
          position: relative;
          overflow: hidden;
          cursor: pointer;
          border-radius: 0;
        }

        .pro-banner-bg {
          position: absolute;
          inset: 0;
          background-image: url('https://tile.openstreetmap.org/12/2048/1360.png');
          background-size: cover;
          background-position: center;
          filter: blur(8px) saturate(0.3) brightness(0.4);
          transform: scale(1.1);
        }

        .pro-banner-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            135deg,
            rgba(13, 10, 20, 0.85) 0%,
            rgba(20, 15, 35, 0.75) 50%,
            rgba(13, 10, 20, 0.85) 100%
          );
        }

        .pro-banner-glow {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(65, 217, 217, 0.08) 25%,
            rgba(255, 107, 157, 0.08) 75%,
            transparent 100%
          );
          animation: bannerShimmer 3s ease-in-out infinite;
        }

        @keyframes bannerShimmer {
          0%, 100% { opacity: 0.5; transform: translateX(-10%); }
          50% { opacity: 1; transform: translateX(10%); }
        }

        .pro-banner-content {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;
          padding: 12px 24px;
        }

        .pro-banner-text {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-family: 'Segoe UI', system-ui, sans-serif;
        }

        .pro-banner-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(254, 248, 244, 0.5);
        }

        .pro-banner-title {
          font-size: 14px;
          font-weight: 500;
          color: #fef8f4;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .pro-banner-title svg {
          width: 14px;
          height: 14px;
          color: #ff6b9d;
          filter: drop-shadow(0 0 4px rgba(255, 107, 157, 0.5));
        }

        .pro-banner-price {
          display: flex;
          align-items: baseline;
          gap: 2px;
          padding: 6px 14px;
          background: linear-gradient(135deg, rgba(65, 217, 217, 0.2), rgba(255, 107, 157, 0.2));
          border: 1px solid rgba(65, 217, 217, 0.3);
          border-radius: 20px;
          font-family: 'Segoe UI', system-ui, sans-serif;
          transition: all 0.3s ease;
        }

        .pro-banner:hover .pro-banner-price {
          background: linear-gradient(135deg, rgba(65, 217, 217, 0.3), rgba(255, 107, 157, 0.3));
          border-color: rgba(65, 217, 217, 0.5);
          box-shadow: 0 0 20px rgba(65, 217, 217, 0.2);
        }

        .pro-banner-currency {
          font-size: 12px;
          font-weight: 500;
          color: #41d9d9;
        }

        .pro-banner-amount {
          font-size: 18px;
          font-weight: 700;
          color: #fef8f4;
          text-shadow: 0 0 10px rgba(65, 217, 217, 0.3);
        }

        .pro-banner-border {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(65, 217, 217, 0.5) 20%,
            rgba(255, 107, 157, 0.5) 80%,
            transparent
          );
        }

        .pro-banner-border-bottom {
          top: auto;
          bottom: 0;
        }
      `;
      document.head.appendChild(style);
    }

    banner.innerHTML = `
      <div class="pro-banner" onclick="if(typeof PathfindrPayments !== 'undefined') PathfindrPayments.showPurchasePrompt();">
        <div class="pro-banner-bg"></div>
        <div class="pro-banner-overlay"></div>
        <div class="pro-banner-glow"></div>
        <div class="pro-banner-border"></div>
        <div class="pro-banner-border pro-banner-border-bottom"></div>
        <div class="pro-banner-content">
          <div class="pro-banner-text">
            <span class="pro-banner-title">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              Go Pro
            </span>
            <span class="pro-banner-label">Remove ads forever</span>
          </div>
          <div class="pro-banner-price">
            <span class="pro-banner-currency">$</span>
            <span class="pro-banner-amount">2</span>
          </div>
        </div>
      </div>
    `;
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
        <div class="pro-ad-map-bg"></div>
        <div class="pro-ad-card">
          <div class="pro-ad-noise"></div>
          <div class="pro-ad-glow"></div>
          <div class="pro-ad-corner pro-ad-corner-tl"></div>
          <div class="pro-ad-corner pro-ad-corner-tr"></div>
          <div class="pro-ad-corner pro-ad-corner-bl"></div>
          <div class="pro-ad-corner pro-ad-corner-br"></div>
          <div class="pro-ad-border-top"></div>
          <div class="pro-ad-border-bottom"></div>

          <div class="pro-ad-header">
            <div class="pro-ad-icon-ring">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <div class="pro-ad-badge">PRO</div>
          </div>

          <h2 class="pro-ad-title">Go Pro</h2>
          <p class="pro-ad-subtitle">Remove ads forever & unlock all modes</p>

          <div class="pro-ad-price-container">
            <span class="pro-ad-price-currency">$</span>
            <span class="pro-ad-price-amount">2</span>
            <span class="pro-ad-price-period">one time</span>
          </div>

          <div class="pro-ad-features">
            <div class="pro-ad-feature">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>
              <span>No more ads</span>
            </div>
            <div class="pro-ad-feature">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>
              <span>Explorer mode</span>
            </div>
            <div class="pro-ad-feature">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>
              <span>Visualizer mode</span>
            </div>
          </div>

          <button id="go-pro-ad-btn" class="pro-ad-cta">
            <span>Unlock Pro</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>

          <div class="pro-ad-skip-section">
            <span class="pro-ad-timer"><span id="ad-countdown">5</span>s</span>
            <button id="close-placeholder-ad" class="pro-ad-skip" disabled>Skip</button>
          </div>
        </div>
      `;

      // Add styles if not already present
      if (!document.getElementById('placeholder-ad-styles')) {
        const styles = document.createElement('style');
        styles.id = 'placeholder-ad-styles';
        styles.textContent = `
          #placeholder-ad-overlay {
            position: fixed;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: proAdFadeIn 0.4s ease;
          }

          @keyframes proAdFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          .pro-ad-map-bg {
            position: absolute;
            inset: -50px;
            background-image: url('https://tile.openstreetmap.org/13/4096/2720.png');
            background-size: 300px 300px;
            background-repeat: repeat;
            filter: brightness(0.5) contrast(1.4) saturate(0.5);
            animation: proMapDrift 30s linear infinite;
          }

          @keyframes proMapDrift {
            0% { background-position: 0 0; }
            100% { background-position: 300px 300px; }
          }

          .pro-ad-map-bg::before {
            content: '';
            position: absolute;
            inset: 0;
            background:
              radial-gradient(ellipse at 30% 20%, rgba(65, 217, 217, 0.15) 0%, transparent 50%),
              radial-gradient(ellipse at 70% 80%, rgba(255, 107, 157, 0.1) 0%, transparent 50%);
            pointer-events: none;
          }

          .pro-ad-map-bg::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(
              180deg,
              rgba(13, 10, 20, 0.6) 0%,
              rgba(13, 10, 20, 0.3) 40%,
              rgba(13, 10, 20, 0.5) 100%
            );
          }

          .pro-ad-card {
            position: relative;
            background: linear-gradient(
              165deg,
              rgba(25, 20, 40, 0.97) 0%,
              rgba(15, 12, 28, 0.99) 100%
            );
            border-radius: 20px;
            padding: 36px 32px 28px;
            max-width: 360px;
            width: 90%;
            text-align: center;
            overflow: hidden;
            box-shadow:
              0 25px 80px rgba(0, 0, 0, 0.6),
              0 0 60px rgba(65, 217, 217, 0.1),
              0 0 0 1px rgba(65, 217, 217, 0.15) inset;
            border: 1px solid rgba(65, 217, 217, 0.1);
          }

          /* Scanlines overlay */
          .pro-ad-card::before {
            content: '';
            position: absolute;
            inset: 0;
            background: repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0, 0, 0, 0.1) 2px,
              rgba(0, 0, 0, 0.1) 4px
            );
            pointer-events: none;
            opacity: 0.3;
            border-radius: 20px;
          }

          /* Corner accents */
          .pro-ad-card::after {
            content: '';
            position: absolute;
            inset: 8px;
            border: 1px solid transparent;
            border-image: linear-gradient(
              135deg,
              rgba(65, 217, 217, 0.3) 0%,
              transparent 30%,
              transparent 70%,
              rgba(255, 107, 157, 0.3) 100%
            ) 1;
            pointer-events: none;
          }

          .pro-ad-glow {
            position: absolute;
            top: -50%;
            left: 50%;
            transform: translateX(-50%);
            width: 300px;
            height: 300px;
            background: radial-gradient(circle, rgba(65,217,217,0.2) 0%, transparent 60%);
            pointer-events: none;
            animation: proGlowPulse 3s ease-in-out infinite;
          }

          @keyframes proGlowPulse {
            0%, 100% { opacity: 0.6; transform: translateX(-50%) scale(1); }
            50% { opacity: 1; transform: translateX(-50%) scale(1.1); }
          }

          .pro-ad-border-top, .pro-ad-border-bottom {
            position: absolute;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg,
              transparent 0%,
              rgba(65,217,217,0.6) 20%,
              rgba(65,217,217,0.8) 50%,
              rgba(255,107,157,0.6) 80%,
              transparent 100%
            );
            animation: borderGlow 2s ease-in-out infinite;
          }
          .pro-ad-border-top { top: 0; border-radius: 20px 20px 0 0; }
          .pro-ad-border-bottom { bottom: 0; border-radius: 0 0 20px 20px; }

          @keyframes borderGlow {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
          }

          .pro-ad-noise {
            position: absolute;
            inset: 0;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
            opacity: 0.03;
            pointer-events: none;
            border-radius: 20px;
          }

          .pro-ad-corner {
            position: absolute;
            width: 20px;
            height: 20px;
            pointer-events: none;
          }

          .pro-ad-corner::before,
          .pro-ad-corner::after {
            content: '';
            position: absolute;
            background: linear-gradient(135deg, #41d9d9, #ff6b9d);
          }

          .pro-ad-corner-tl { top: 12px; left: 12px; }
          .pro-ad-corner-tl::before { top: 0; left: 0; width: 12px; height: 2px; }
          .pro-ad-corner-tl::after { top: 0; left: 0; width: 2px; height: 12px; }

          .pro-ad-corner-tr { top: 12px; right: 12px; }
          .pro-ad-corner-tr::before { top: 0; right: 0; width: 12px; height: 2px; }
          .pro-ad-corner-tr::after { top: 0; right: 0; width: 2px; height: 12px; }

          .pro-ad-corner-bl { bottom: 12px; left: 12px; }
          .pro-ad-corner-bl::before { bottom: 0; left: 0; width: 12px; height: 2px; }
          .pro-ad-corner-bl::after { bottom: 0; left: 0; width: 2px; height: 12px; }

          .pro-ad-corner-br { bottom: 12px; right: 12px; }
          .pro-ad-corner-br::before { bottom: 0; right: 0; width: 12px; height: 2px; }
          .pro-ad-corner-br::after { bottom: 0; right: 0; width: 2px; height: 12px; }

          .pro-ad-header {
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            margin-bottom: 16px;
          }

          .pro-ad-icon-ring {
            width: 72px;
            height: 72px;
            border-radius: 50%;
            background: linear-gradient(135deg, rgba(65,217,217,0.2), rgba(255,107,157,0.2));
            border: 2px solid rgba(65,217,217,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            animation: proAdPulse 2s ease-in-out infinite;
          }

          @keyframes proAdPulse {
            0%, 100% { box-shadow: 0 0 20px rgba(65,217,217,0.2); }
            50% { box-shadow: 0 0 35px rgba(65,217,217,0.4); }
          }

          .pro-ad-icon-ring svg {
            width: 32px;
            height: 32px;
            color: #41d9d9;
            filter: drop-shadow(0 0 8px rgba(65,217,217,0.6));
          }

          .pro-ad-badge {
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.2em;
            color: #0d0a14;
            background: linear-gradient(135deg, #41d9d9, #ff6b9d);
            padding: 4px 14px;
            border-radius: 12px;
          }

          .pro-ad-title {
            font-size: 28px;
            font-weight: 700;
            color: #fef8f4;
            margin: 0 0 6px 0;
            letter-spacing: -0.02em;
          }

          .pro-ad-subtitle {
            font-size: 14px;
            color: rgba(254,248,244,0.5);
            margin: 0 0 24px 0;
          }

          .pro-ad-price-container {
            display: flex;
            align-items: baseline;
            justify-content: center;
            gap: 4px;
            margin-bottom: 24px;
          }

          .pro-ad-price-currency {
            font-size: 24px;
            font-weight: 600;
            color: #41d9d9;
          }

          .pro-ad-price-amount {
            font-size: 56px;
            font-weight: 800;
            color: #fef8f4;
            line-height: 1;
            text-shadow: 0 0 30px rgba(65,217,217,0.3);
          }

          .pro-ad-price-period {
            font-size: 13px;
            color: rgba(254,248,244,0.4);
            margin-left: 6px;
          }

          .pro-ad-features {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-bottom: 24px;
            padding: 16px;
            background: rgba(255,255,255,0.03);
            border-radius: 12px;
          }

          .pro-ad-feature {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 14px;
            color: rgba(254,248,244,0.8);
          }

          .pro-ad-feature svg {
            width: 18px;
            height: 18px;
            color: #41d9d9;
            flex-shrink: 0;
          }

          .pro-ad-cta {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            padding: 16px 24px;
            background: linear-gradient(135deg, #41d9d9, #00b8d4);
            border: none;
            border-radius: 14px;
            font-size: 16px;
            font-weight: 700;
            color: #0d0a14;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-bottom: 20px;
          }

          .pro-ad-cta:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(65,217,217,0.4);
          }

          .pro-ad-cta svg {
            width: 18px;
            height: 18px;
            transition: transform 0.3s ease;
          }

          .pro-ad-cta:hover svg {
            transform: translateX(4px);
          }

          .pro-ad-skip-section {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
          }

          .pro-ad-timer {
            font-size: 13px;
            color: rgba(254,248,244,0.3);
            font-variant-numeric: tabular-nums;
          }

          .pro-ad-skip {
            background: transparent;
            border: 1px solid rgba(254,248,244,0.15);
            color: rgba(254,248,244,0.3);
            padding: 8px 20px;
            border-radius: 8px;
            font-size: 13px;
            cursor: not-allowed;
            transition: all 0.3s ease;
          }

          .pro-ad-skip:not(:disabled) {
            border-color: rgba(65,217,217,0.4);
            color: #41d9d9;
            cursor: pointer;
          }

          .pro-ad-skip:not(:disabled):hover {
            background: rgba(65,217,217,0.1);
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

      // Go Pro button handler
      const goProBtn = document.getElementById('go-pro-ad-btn');
      if (goProBtn) {
        goProBtn.addEventListener('click', async () => {
          clearInterval(timer);
          overlay.remove();
          // Trigger purchase flow
          if (typeof PathfindrPayments !== 'undefined') {
            await PathfindrPayments.showPurchasePrompt();
          }
          resolve();
        });
      }

      console.log('[Ads] Showing placeholder ad');
    });
  },

  /**
   * Show inline interstitial ad inside the results panel
   * Appears above the Next Round button after a delay
   */
  showInlineInterstitial() {
    // Don't show if user is ad-free
    if (typeof PathfindrConfig !== 'undefined' && PathfindrConfig.isAdFree()) {
      console.log('[Ads] User is ad-free, skipping inline interstitial');
      return;
    }

    // Find the results panel's next-round-wrapper
    const wrapper = document.querySelector('.next-round-wrapper');
    if (!wrapper) return;

    // Remove any existing inline ad
    const existing = document.getElementById('inline-interstitial');
    if (existing) existing.remove();

    // Create inline interstitial
    const interstitial = document.createElement('div');
    interstitial.id = 'inline-interstitial';
    interstitial.innerHTML = `
      <div class="inline-ad-map-bg"></div>
      <div class="inline-ad-content">
        <div class="inline-ad-left">
          <div class="inline-ad-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <div class="inline-ad-text">
            <span class="inline-ad-title">Go Pro</span>
            <span class="inline-ad-subtitle">Remove ads · $2</span>
          </div>
        </div>
        <div class="inline-ad-right">
          <button class="inline-ad-cta" id="inline-ad-cta">Unlock</button>
          <button class="inline-ad-close" id="inline-ad-close" disabled>
            <span class="inline-ad-timer"><span id="inline-ad-countdown">3</span>s</span>
          </button>
        </div>
      </div>
    `;

    // Add styles if not present
    if (!document.getElementById('inline-interstitial-styles')) {
      const styles = document.createElement('style');
      styles.id = 'inline-interstitial-styles';
      styles.textContent = `
        #inline-interstitial {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          z-index: 10;
          border-radius: 14px;
          overflow: hidden;
          animation: inlineAdSlideIn 0.3s ease;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
          transition: transform 0.4s ease;
        }

        #inline-interstitial.revealed {
          transform: translateY(-100%) translateY(-8px);
        }

        @keyframes inlineAdSlideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .inline-ad-map-bg {
          position: absolute;
          inset: 0;
          background-image: url('https://tile.openstreetmap.org/14/4096/5680.png'),
                            url('https://tile.openstreetmap.org/14/4097/5680.png');
          background-size: 256px 256px;
          background-position: 0 0, 256px 0;
          filter: saturate(0.4) brightness(0.35) contrast(1.2);
          opacity: 0.8;
        }

        .inline-ad-map-bg::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            135deg,
            rgba(13, 10, 20, 0.7) 0%,
            rgba(65, 217, 217, 0.1) 50%,
            rgba(13, 10, 20, 0.7) 100%
          );
        }

        .inline-ad-content {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          gap: 12px;
        }

        .inline-ad-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .inline-ad-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(65,217,217,0.3), rgba(255,107,157,0.3));
          border: 1px solid rgba(65,217,217,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .inline-ad-icon svg {
          width: 18px;
          height: 18px;
          color: #41d9d9;
          filter: drop-shadow(0 0 4px rgba(65,217,217,0.6));
        }

        .inline-ad-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .inline-ad-title {
          font-size: 14px;
          font-weight: 600;
          color: #fef8f4;
        }

        .inline-ad-subtitle {
          font-size: 11px;
          color: rgba(254, 248, 244, 0.5);
        }

        .inline-ad-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .inline-ad-cta {
          padding: 8px 16px;
          background: linear-gradient(135deg, #41d9d9, #00b8d4);
          border: none;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          color: #0d0a14;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .inline-ad-cta:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 15px rgba(65, 217, 217, 0.4);
        }

        .inline-ad-close {
          width: 36px;
          height: 36px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: not-allowed;
          transition: all 0.2s ease;
        }

        .inline-ad-timer {
          font-size: 11px;
          font-weight: 500;
          color: rgba(254, 248, 244, 0.4);
          font-variant-numeric: tabular-nums;
        }

        .inline-ad-close:not(:disabled) {
          cursor: pointer;
          border-color: rgba(65, 217, 217, 0.3);
        }

        .inline-ad-close:not(:disabled) .inline-ad-timer {
          color: #41d9d9;
        }

        .inline-ad-close:not(:disabled):hover {
          background: rgba(65, 217, 217, 0.1);
        }

        .inline-ad-close:not(:disabled)::after {
          content: '×';
          font-size: 18px;
          font-weight: 300;
        }

        .inline-ad-close:not(:disabled) .inline-ad-timer {
          display: none;
        }
      `;
      document.head.appendChild(styles);
    }

    // Insert inside the next-round-wrapper to overlay the button
    wrapper.style.position = 'relative';
    wrapper.appendChild(interstitial);

    // Ad stays covering the button until user dismisses it
    // No automatic reveal - user must click X to access Next Round

    // Countdown timer
    let countdown = 3;
    const countdownEl = document.getElementById('inline-ad-countdown');
    const closeBtn = document.getElementById('inline-ad-close');

    const timer = setInterval(() => {
      countdown--;
      if (countdownEl) countdownEl.textContent = countdown;

      if (countdown <= 0) {
        clearInterval(timer);
        if (closeBtn) {
          closeBtn.disabled = false;
        }
      }
    }, 1000);

    // Close handler
    closeBtn?.addEventListener('click', () => {
      if (closeBtn.disabled) return;
      interstitial.remove();
    });

    // Go Pro button handler
    const ctaBtn = document.getElementById('inline-ad-cta');
    ctaBtn?.addEventListener('click', async () => {
      clearInterval(timer);
      interstitial.remove();
      if (typeof PathfindrPayments !== 'undefined') {
        await PathfindrPayments.showPurchasePrompt();
      }
    });

    console.log('[Ads] Showing inline interstitial');
  },

  /**
   * Hide inline interstitial
   */
  hideInlineInterstitial() {
    const interstitial = document.getElementById('inline-interstitial');
    if (interstitial) interstitial.remove();
  },
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PathfindrAds;
}
