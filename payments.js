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
        price: '$2.99',
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
      // Check Supabase for web purchases
      return window.pathfindrUser?.has_purchased === true;
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
      // Web purchases are tied to account, not device
      const hasPurchased = window.pathfindrUser?.has_purchased === true;
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
    // Update Supabase user record (for cross-platform sync)
    if (typeof PathfindrAuth !== 'undefined' && PathfindrAuth.setPurchased) {
      await PathfindrAuth.setPurchased(true);
    }

    // Update local state
    if (window.pathfindrUser) {
      window.pathfindrUser.has_purchased = true;
    }

    // Remove ads immediately
    if (typeof PathfindrAds !== 'undefined' && PathfindrAds.removeAllAds) {
      await PathfindrAds.removeAllAds();
    }

    console.log('[Payments] Purchase successful - premium unlocked');
  },

  /**
   * Check URL params for Stripe redirect result
   * Call this on page load
   */
  checkStripeRedirect() {
    const params = new URLSearchParams(window.location.search);
    const purchaseResult = params.get('purchase');

    if (purchaseResult === 'success') {
      // Clear the URL param
      window.history.replaceState({}, '', window.location.pathname);

      // Handle successful purchase
      this.handlePurchaseSuccess();

      return 'success';
    } else if (purchaseResult === 'cancelled') {
      window.history.replaceState({}, '', window.location.pathname);
      return 'cancelled';
    }

    return null;
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

    // Trigger purchase flow
    return await this.purchasePremium();
  },
};

// Check for Stripe redirect on load
document.addEventListener('DOMContentLoaded', () => {
  const result = PathfindrPayments.checkStripeRedirect();
  if (result === 'success') {
    // Show success message (non-blocking)
    setTimeout(() => {
      if (typeof showToast === 'function') {
        showToast('Thank you! Premium features unlocked.');
      } else {
        alert('Thank you for your purchase! Premium features are now unlocked.');
      }
    }, 500);
  }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PathfindrPayments;
}
