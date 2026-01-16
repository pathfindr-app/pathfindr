/**
 * Pathfindr Payments Module
 *
 * Handles payments across platforms:
 * - Web: Stripe Checkout
 * - iOS: Apple In-App Purchase via RevenueCat
 * - Android: Google Play Billing via RevenueCat
 */

const PathfindrPayments = {
  initialized: false,
  products: [],
  Purchases: null, // RevenueCat SDK reference

  /**
   * Initialize payments based on platform
   */
  async init() {
    if (this.initialized) return;

    const platform = PathfindrConfig.platform;
    console.log('[Payments] Initializing for platform:', platform);

    try {
      if (platform === 'web') {
        await this.initStripe();
      } else if (platform === 'ios' || platform === 'android') {
        await this.initRevenueCat();
      }

      this.initialized = true;
    } catch (error) {
      console.error('[Payments] Failed to initialize:', error);
    }
  },

  /**
   * Initialize Stripe for web payments
   */
  async initStripe() {
    // Stripe.js is loaded via script tag in index.html
    console.log('[Payments] Stripe ready for web payments');
  },

  /**
   * Initialize RevenueCat for native IAP
   */
  async initRevenueCat() {
    try {
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      this.Purchases = Purchases;

      const platform = PathfindrConfig.platform;
      const apiKey = platform === 'ios'
        ? PathfindrConfig.revenuecat.apiKey.ios
        : PathfindrConfig.revenuecat.apiKey.android;

      // Check if API key is configured
      if (apiKey.startsWith('YOUR_')) {
        console.warn('[Payments] RevenueCat API key not configured');
        return;
      }

      // Configure RevenueCat
      await Purchases.configure({
        apiKey: apiKey,
      });

      // Set user ID if logged in (for cross-platform purchase sync)
      if (typeof PathfindrAuth !== 'undefined' && PathfindrAuth.currentUser?.id) {
        await Purchases.logIn({ appUserID: PathfindrAuth.currentUser.id });
      }

      // Load products
      await this.loadProducts();

      console.log('[Payments] RevenueCat initialized successfully');
    } catch (error) {
      console.error('[Payments] RevenueCat initialization failed:', error);
    }
  },

  /**
   * Load available products from store
   */
  async loadProducts() {
    const platform = PathfindrConfig.platform;

    if (platform === 'web') {
      // Web products are defined in config
      this.products = [{
        id: 'pathfindr_premium',
        title: 'Pathfindr Premium',
        description: 'Remove ads + unlock Explorer & Visualizer modes',
        price: '$2',
        priceId: PathfindrConfig.stripe.priceId,
      }];
    } else if (this.Purchases) {
      // Load products from RevenueCat
      try {
        const offerings = await this.Purchases.getOfferings();

        if (offerings.current && offerings.current.availablePackages.length > 0) {
          this.products = offerings.current.availablePackages.map(pkg => ({
            id: pkg.product.identifier,
            title: pkg.product.title,
            description: pkg.product.description,
            price: pkg.product.priceString,
            package: pkg, // Store package for purchase
          }));
        }

        console.log('[Payments] Products loaded:', this.products);
      } catch (error) {
        console.error('[Payments] Failed to load products:', error);
      }
    }
  },

  /**
   * Purchase premium (removes ads + unlocks modes)
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async purchasePremium() {
    const platform = PathfindrConfig.platform;

    if (platform === 'web') {
      return await this.purchaseStripe();
    } else {
      return await this.purchaseRevenueCat();
    }
  },

  /**
   * Web: Redirect to Stripe Checkout via Edge Function
   */
  async purchaseStripe() {
    try {
      console.log('[Payments] Starting Stripe checkout...');

      // Get user email for webhook to identify purchase
      const customerEmail = PathfindrAuth?.currentProfile?.email ||
                           PathfindrAuth?.currentUser?.email;

      // Create checkout session via Edge Function
      const response = await fetch(`${PathfindrConfig.supabase.url}/functions/v1/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${PathfindrConfig.supabase.anonKey}`,
        },
        body: JSON.stringify({
          priceId: PathfindrConfig.stripe.priceId,
          customerEmail: customerEmail,
          successUrl: window.location.origin + '?purchase=success',
          cancelUrl: window.location.origin + '?purchase=cancelled',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('[Payments] Checkout session error:', data.error);
        alert('Unable to start checkout. Please try again.');
        return { success: false, error: data.error };
      }

      if (data.url) {
        console.log('[Payments] Redirecting to Stripe checkout...');
        window.location.href = data.url;
        return { success: true };
      } else {
        console.error('[Payments] No checkout URL returned');
        alert('Unable to start checkout. Please try again.');
        return { success: false, error: 'No checkout URL' };
      }
    } catch (error) {
      console.error('[Payments] Stripe purchase failed:', error);
      alert('Payment error: ' + error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Load Stripe.js dynamically
   */
  loadStripeJs() {
    return new Promise((resolve, reject) => {
      if (window.Stripe) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  },

  /**
   * Native: Purchase via RevenueCat
   */
  async purchaseRevenueCat() {
    if (!this.Purchases) {
      console.error('[Payments] RevenueCat not initialized');
      return { success: false, error: 'Payment system not available' };
    }

    try {
      // Find the premium package
      const offerings = await this.Purchases.getOfferings();

      if (!offerings.current || offerings.current.availablePackages.length === 0) {
        return { success: false, error: 'No products available' };
      }

      // Get the first available package (should be premium)
      const pkg = offerings.current.availablePackages[0];

      console.log('[Payments] Purchasing package:', pkg.product.identifier);

      // Make the purchase
      const { customerInfo } = await this.Purchases.purchasePackage({ aPackage: pkg });

      // Check if premium entitlement is now active
      const premiumEntitlement = PathfindrConfig.revenuecat.entitlements.premium;
      if (customerInfo.entitlements.active[premiumEntitlement]) {
        await this.handlePurchaseSuccess();
        return { success: true };
      }

      return { success: false, error: 'Purchase completed but entitlement not found' };
    } catch (error) {
      // User cancelled
      if (error.code === 'PURCHASE_CANCELLED') {
        console.log('[Payments] Purchase cancelled by user');
        return { success: false, error: 'cancelled' };
      }

      console.error('[Payments] RevenueCat purchase failed:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Check if user has premium entitlement
   * @returns {Promise<boolean>}
   */
  async checkPremiumStatus() {
    const platform = PathfindrConfig.platform;

    if (platform === 'web') {
      // Check via PathfindrAuth (source of truth, prevents console tampering)
      if (typeof PathfindrAuth !== 'undefined' && PathfindrAuth.hasPurchased) {
        return PathfindrAuth.hasPurchased();
      }
      return false;
    }

    if (!this.Purchases) {
      return false;
    }

    try {
      const { customerInfo } = await this.Purchases.getCustomerInfo();
      const premiumEntitlement = PathfindrConfig.revenuecat.entitlements.premium;
      return !!customerInfo.entitlements.active[premiumEntitlement];
    } catch (error) {
      console.error('[Payments] Failed to check premium status:', error);
      return false;
    }
  },

  /**
   * Restore previous purchases (for iOS/Android)
   * @returns {Promise<{success: boolean, isPremium: boolean}>}
   */
  async restorePurchases() {
    const platform = PathfindrConfig.platform;

    if (platform === 'web') {
      // Web purchases are tied to account - check via PathfindrAuth
      const hasPurchased = typeof PathfindrAuth !== 'undefined' &&
                           PathfindrAuth.hasPurchased &&
                           PathfindrAuth.hasPurchased();
      return { success: true, isPremium: hasPurchased };
    }

    if (!this.Purchases) {
      return { success: false, isPremium: false };
    }

    try {
      console.log('[Payments] Restoring purchases...');

      const { customerInfo } = await this.Purchases.restorePurchases();
      const premiumEntitlement = PathfindrConfig.revenuecat.entitlements.premium;
      const isPremium = !!customerInfo.entitlements.active[premiumEntitlement];

      if (isPremium) {
        await this.handlePurchaseSuccess();
      }

      console.log('[Payments] Restore complete, isPremium:', isPremium);
      return { success: true, isPremium };
    } catch (error) {
      console.error('[Payments] Restore failed:', error);
      return { success: false, isPremium: false };
    }
  },

  /**
   * Handle successful purchase
   * Updates user record and removes ads
   */
  async handlePurchaseSuccess() {
    // Refresh profile from server to get webhook-updated purchase status
    // NOTE: has_purchased is ONLY set by Stripe webhook for security
    if (typeof PathfindrAuth !== 'undefined' && PathfindrAuth.refreshProfile) {
      console.log('[Payments] Refreshing profile to get purchase status...');
      await PathfindrAuth.refreshProfile();

      // Give webhook a moment to process if not yet done
      if (!PathfindrAuth.hasPurchased()) {
        console.log('[Payments] Waiting for webhook to process...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        await PathfindrAuth.refreshProfile();
      }
    }

    // Remove ads if now premium
    if (typeof PathfindrAuth !== 'undefined' && PathfindrAuth.hasPurchased && PathfindrAuth.hasPurchased()) {
      if (typeof PathfindrAds !== 'undefined' && PathfindrAds.removeAllAds) {
        await PathfindrAds.removeAllAds();
      }

      // Update Pro user status in UI
      if (typeof updateProUserStatus === 'function') {
        updateProUserStatus();
      }

      console.log('[Payments] Purchase verified - premium unlocked');
    } else {
      console.log('[Payments] Purchase pending verification - refresh page if not unlocked');
    }
  },

  /**
   * Check URL params for Stripe redirect result
   * Call this on page load, AFTER auth is initialized
   */
  async checkStripeRedirect() {
    const params = new URLSearchParams(window.location.search);
    const purchaseResult = params.get('purchase');

    if (purchaseResult === 'success') {
      // Clear the URL param
      window.history.replaceState({}, '', window.location.pathname);

      console.log('[Payments] Processing successful purchase redirect...');

      // Wait a moment for auth to initialize
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Check if user is logged in
      const isLoggedIn = typeof PathfindrAuth !== 'undefined' && PathfindrAuth.isLoggedIn();

      if (isLoggedIn) {
        // User is logged in - normal flow
        await this.handlePurchaseSuccess();

        // Force refresh user profile from database to get webhook-updated status
        if (PathfindrAuth.refreshProfile) {
          await PathfindrAuth.refreshProfile();
        }

        return 'success';
      } else {
        // User is NOT logged in - store pending purchase and prompt sign up
        localStorage.setItem('pathfindr_pending_purchase', 'true');
        console.log('[Payments] User not logged in - stored pending purchase, prompting sign up');

        // Show sign up prompt after a brief delay
        setTimeout(() => {
          this.showSignUpPromptAfterPurchase();
        }, 500);

        return 'pending_signup';
      }
    } else if (purchaseResult === 'cancelled') {
      window.history.replaceState({}, '', window.location.pathname);
      return 'cancelled';
    }

    return null;
  },

  /**
   * Show sign up prompt after anonymous purchase
   */
  showSignUpPromptAfterPurchase() {
    // Create a custom modal prompting sign up
    const existingModal = document.getElementById('purchase-signup-modal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = 'purchase-signup-modal';
    modal.innerHTML = `
      <div class="purchase-signup-backdrop"></div>
      <div class="purchase-signup-card">
        <div class="purchase-signup-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <h2>Payment Successful!</h2>
        <p>Sign up to activate your Pro access and sync across devices.</p>
        <button id="purchase-signup-btn" class="purchase-signup-cta">
          <span>Create Account</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
        <button id="purchase-signin-btn" class="purchase-signup-secondary">Already have an account? Sign in</button>
      </div>
    `;

    // Add styles
    const styles = document.createElement('style');
    styles.id = 'purchase-signup-styles';
    styles.textContent = `
      #purchase-signup-modal {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
        animation: fadeIn 0.3s ease;
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      .purchase-signup-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(13, 10, 20, 0.9);
        backdrop-filter: blur(8px);
      }
      .purchase-signup-card {
        position: relative;
        background: linear-gradient(165deg, rgba(25, 20, 40, 0.98) 0%, rgba(15, 12, 28, 0.99) 100%);
        border: 1px solid rgba(65, 217, 217, 0.2);
        border-radius: 20px;
        padding: 2.5rem 2rem;
        max-width: 360px;
        width: 90%;
        text-align: center;
        box-shadow: 0 25px 80px rgba(0, 0, 0, 0.6), 0 0 60px rgba(65, 217, 217, 0.1);
      }
      .purchase-signup-icon {
        width: 64px;
        height: 64px;
        margin: 0 auto 1.25rem;
        background: linear-gradient(135deg, rgba(57, 255, 20, 0.2), rgba(65, 217, 217, 0.2));
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid rgba(57, 255, 20, 0.4);
      }
      .purchase-signup-icon svg {
        width: 32px;
        height: 32px;
        color: #39ff14;
      }
      .purchase-signup-card h2 {
        font-size: 1.5rem;
        font-weight: 700;
        color: #fef8f4;
        margin: 0 0 0.75rem;
      }
      .purchase-signup-card p {
        font-size: 0.95rem;
        color: rgba(254, 248, 244, 0.6);
        margin: 0 0 1.5rem;
        line-height: 1.5;
      }
      .purchase-signup-cta {
        width: 100%;
        padding: 0.875rem 1.5rem;
        background: linear-gradient(135deg, #41d9d9, #00b8d4);
        border: none;
        border-radius: 12px;
        font-size: 1rem;
        font-weight: 600;
        color: #0d0a14;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        transition: all 0.2s ease;
        margin-bottom: 0.75rem;
      }
      .purchase-signup-cta:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(65, 217, 217, 0.4);
      }
      .purchase-signup-cta svg {
        width: 18px;
        height: 18px;
      }
      .purchase-signup-secondary {
        width: 100%;
        padding: 0.75rem 1rem;
        background: transparent;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        font-size: 0.85rem;
        color: rgba(254, 248, 244, 0.5);
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .purchase-signup-secondary:hover {
        background: rgba(255, 255, 255, 0.05);
        color: rgba(254, 248, 244, 0.8);
      }
    `;
    document.head.appendChild(styles);
    document.body.appendChild(modal);

    // Button handlers
    document.getElementById('purchase-signup-btn').addEventListener('click', () => {
      modal.remove();
      if (typeof PathfindrAuth !== 'undefined' && PathfindrAuth.showAuthModal) {
        PathfindrAuth.showAuthModal('signup');
      }
    });

    document.getElementById('purchase-signin-btn').addEventListener('click', () => {
      modal.remove();
      if (typeof PathfindrAuth !== 'undefined' && PathfindrAuth.showAuthModal) {
        PathfindrAuth.showAuthModal('login');
      }
    });
  },

  /**
   * Check and handle pending purchase after user signs in/up
   * Call this from auth.js after successful authentication
   */
  async handlePendingPurchase() {
    const hasPending = localStorage.getItem('pathfindr_pending_purchase');
    if (!hasPending) return false;

    console.log('[Payments] Found pending purchase, processing...');

    // Clear the pending flag
    localStorage.removeItem('pathfindr_pending_purchase');

    // Refresh profile to get the webhook-linked purchase status
    if (typeof PathfindrAuth !== 'undefined' && PathfindrAuth.refreshProfile) {
      await PathfindrAuth.refreshProfile();
    }

    // Check if purchase was linked by webhook
    const isPremium = await this.checkPremiumStatus();
    if (isPremium) {
      await this.handlePurchaseSuccess();
      return true;
    }

    // If not yet linked, it might still be processing
    // The webhook trigger will link it when user signs up with same email
    console.log('[Payments] Purchase pending webhook processing');
    return false;
  },

  /**
   * Show purchase UI
   * Call this when user taps a premium feature or "Remove Ads" button
   */
  async showPurchasePrompt() {
    // Check if already premium
    const isPremium = await this.checkPremiumStatus();
    if (isPremium) {
      console.log('[Payments] User already has premium');
      return { success: true, alreadyPremium: true };
    }

    // Check if user is logged in - require auth first
    const isLoggedIn = typeof PathfindrAuth !== 'undefined' && PathfindrAuth.isLoggedIn();
    if (!isLoggedIn) {
      console.log('[Payments] User not logged in, showing auth first');
      // Store intent to purchase after auth
      localStorage.setItem('pathfindr_purchase_after_auth', 'true');
      // Show auth modal
      this.showAuthRequiredForPurchase();
      return { success: false, requiresAuth: true };
    }

    // Trigger purchase flow
    return await this.purchasePremium();
  },

  /**
   * Show auth modal with message about needing account for purchase
   */
  showAuthRequiredForPurchase() {
    // Create a custom modal explaining they need to sign in
    const existingModal = document.getElementById('auth-for-purchase-modal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = 'auth-for-purchase-modal';
    modal.innerHTML = `
      <div class="auth-purchase-backdrop"></div>
      <div class="auth-purchase-card">
        <button class="auth-purchase-close" id="auth-purchase-close">&times;</button>
        <div class="auth-purchase-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </div>
        <h2>Create Account to Go Pro</h2>
        <p>Sign up to purchase Pro and sync your progress across devices.</p>
        <div class="auth-purchase-benefits">
          <div class="auth-benefit"><span class="benefit-check">✓</span> Remove all ads forever</div>
          <div class="auth-benefit"><span class="benefit-check">✓</span> Unlock Explorer & Visualizer modes</div>
          <div class="auth-benefit"><span class="benefit-check">✓</span> Sync progress across devices</div>
        </div>
        <button id="auth-purchase-signup-btn" class="auth-purchase-cta">
          <span>Create Account</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
        <button id="auth-purchase-signin-btn" class="auth-purchase-secondary">Already have an account? Sign in</button>
      </div>
    `;

    // Add styles
    if (!document.getElementById('auth-purchase-styles')) {
      const styles = document.createElement('style');
      styles.id = 'auth-purchase-styles';
      styles.textContent = `
        #auth-for-purchase-modal {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10001;
          animation: authPurchaseFadeIn 0.3s ease;
        }
        @keyframes authPurchaseFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .auth-purchase-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(13, 10, 20, 0.9);
          backdrop-filter: blur(8px);
        }
        .auth-purchase-card {
          position: relative;
          background: linear-gradient(165deg, rgba(25, 20, 40, 0.98) 0%, rgba(15, 12, 28, 0.99) 100%);
          border: 1px solid rgba(65, 217, 217, 0.2);
          border-radius: 20px;
          padding: 2rem 1.75rem;
          max-width: 360px;
          width: 90%;
          text-align: center;
          box-shadow: 0 25px 80px rgba(0, 0, 0, 0.6), 0 0 60px rgba(65, 217, 217, 0.1);
        }
        .auth-purchase-close {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 32px;
          height: 32px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.5);
          font-size: 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        .auth-purchase-close:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }
        .auth-purchase-icon {
          width: 56px;
          height: 56px;
          margin: 0 auto 1rem;
          background: linear-gradient(135deg, rgba(65,217,217,0.2), rgba(255,107,157,0.2));
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid rgba(65,217,217,0.3);
        }
        .auth-purchase-icon svg {
          width: 26px;
          height: 26px;
          color: #41d9d9;
          filter: drop-shadow(0 0 6px rgba(65,217,217,0.6));
        }
        .auth-purchase-card h2 {
          font-size: 1.35rem;
          font-weight: 700;
          color: #fef8f4;
          margin: 0 0 0.5rem;
        }
        .auth-purchase-card p {
          font-size: 0.9rem;
          color: rgba(254, 248, 244, 0.6);
          margin: 0 0 1.25rem;
          line-height: 1.4;
        }
        .auth-purchase-benefits {
          text-align: left;
          margin-bottom: 1.25rem;
          padding: 0.75rem 1rem;
          background: rgba(65, 217, 217, 0.05);
          border-radius: 10px;
          border: 1px solid rgba(65, 217, 217, 0.1);
        }
        .auth-benefit {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: rgba(254, 248, 244, 0.8);
          padding: 0.35rem 0;
        }
        .benefit-check {
          color: #41d9d9;
          font-weight: bold;
        }
        .auth-purchase-cta {
          width: 100%;
          padding: 0.8rem 1.25rem;
          background: linear-gradient(135deg, #41d9d9, #00b8d4);
          border: none;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 600;
          color: #0d0a14;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.2s ease;
          margin-bottom: 0.6rem;
        }
        .auth-purchase-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(65, 217, 217, 0.4);
        }
        .auth-purchase-cta svg {
          width: 16px;
          height: 16px;
        }
        .auth-purchase-secondary {
          width: 100%;
          padding: 0.65rem 1rem;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          font-size: 0.8rem;
          color: rgba(254, 248, 244, 0.5);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .auth-purchase-secondary:hover {
          background: rgba(255, 255, 255, 0.05);
          color: rgba(254, 248, 244, 0.8);
        }
      `;
      document.head.appendChild(styles);
    }
    document.body.appendChild(modal);

    // Close button
    document.getElementById('auth-purchase-close').addEventListener('click', () => {
      localStorage.removeItem('pathfindr_purchase_after_auth');
      modal.remove();
    });

    // Backdrop click to close
    modal.querySelector('.auth-purchase-backdrop').addEventListener('click', () => {
      localStorage.removeItem('pathfindr_purchase_after_auth');
      modal.remove();
    });

    // Sign up button
    document.getElementById('auth-purchase-signup-btn').addEventListener('click', () => {
      modal.remove();
      if (typeof PathfindrAuth !== 'undefined' && PathfindrAuth.showAuthModal) {
        PathfindrAuth.showAuthModal('signup');
      }
    });

    // Sign in button
    document.getElementById('auth-purchase-signin-btn').addEventListener('click', () => {
      modal.remove();
      if (typeof PathfindrAuth !== 'undefined' && PathfindrAuth.showAuthModal) {
        PathfindrAuth.showAuthModal('login');
      }
    });
  },

  /**
   * Check if user wanted to purchase after auth and proceed
   * Call this from auth.js after successful authentication
   */
  async proceedWithPurchaseAfterAuth() {
    const wantsPurchase = localStorage.getItem('pathfindr_purchase_after_auth');
    if (!wantsPurchase) return false;

    console.log('[Payments] User authenticated, proceeding with purchase...');
    localStorage.removeItem('pathfindr_purchase_after_auth');

    // Small delay to let auth UI close
    await new Promise(resolve => setTimeout(resolve, 500));

    // Now proceed with purchase
    await this.purchasePremium();
    return true;
  },
};

// Check for Stripe redirect on load
document.addEventListener('DOMContentLoaded', async () => {
  const result = await PathfindrPayments.checkStripeRedirect();
  if (result === 'success') {
    // Show success message for logged-in users
    setTimeout(() => {
      if (typeof showToast === 'function') {
        showToast('Thank you! You are now Pro.');
      } else {
        alert('Thank you for your purchase! You are now Pro.');
      }
    }, 500);
  }
  // 'pending_signup' result is handled by showSignUpPromptAfterPurchase()
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PathfindrPayments;
}
