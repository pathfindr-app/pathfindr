/**
 * Pathfindr Payments Module
 *
 * Handles payments across platforms:
 * - Web: Stripe Checkout
 * - iOS: Apple In-App Purchase
 * - Android: Google Play Billing
 */

const PathfindrPayments = {
  initialized: false,
  products: [],

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
        await this.initIAP();
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
    // Stripe.js is loaded dynamically when needed
    console.log('[Payments] Stripe ready for web payments');
  },

  /**
   * Initialize In-App Purchases for native platforms
   */
  async initIAP() {
    try {
      // Note: You'll need to install a Capacitor IAP plugin
      // Options: @capgo/capacitor-purchases (RevenueCat) or similar
      console.log('[Payments] IAP ready for native payments');

      // Load available products
      await this.loadProducts();
    } catch (error) {
      console.error('[Payments] IAP initialization failed:', error);
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
        id: 'remove_ads',
        title: 'Remove Ads',
        price: '$2.99',
        priceId: PathfindrConfig.stripe.priceId,
      }];
    } else {
      // Native products would be loaded from the store
      // This is a placeholder - actual implementation depends on IAP plugin
      this.products = [{
        id: 'remove_ads',
        title: 'Remove Ads',
        price: '$2.99',
      }];
    }

    console.log('[Payments] Products loaded:', this.products);
  },

  /**
   * Purchase the "Remove Ads" product
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async purchaseRemoveAds() {
    const platform = PathfindrConfig.platform;

    if (platform === 'web') {
      return await this.purchaseStripe();
    } else {
      return await this.purchaseIAP();
    }
  },

  /**
   * Web: Redirect to Stripe Checkout
   */
  async purchaseStripe() {
    try {
      // Load Stripe.js if not already loaded
      if (!window.Stripe) {
        await this.loadStripeJs();
      }

      const stripe = window.Stripe(PathfindrConfig.stripe.publishableKey);

      // Create checkout session via your backend
      // For now, we'll use Stripe's client-only checkout (limited but works for testing)
      const { error } = await stripe.redirectToCheckout({
        lineItems: [{
          price: PathfindrConfig.stripe.priceId,
          quantity: 1,
        }],
        mode: 'payment',
        successUrl: window.location.origin + '?purchase=success',
        cancelUrl: window.location.origin + '?purchase=cancelled',
      });

      if (error) {
        console.error('[Payments] Stripe error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('[Payments] Stripe purchase failed:', error);
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
   * Native: Purchase via In-App Purchase
   */
  async purchaseIAP() {
    try {
      // This is a placeholder - actual implementation depends on which IAP plugin you use
      // Popular options:
      // 1. @capgo/capacitor-purchases (RevenueCat wrapper)
      // 2. @awesome-cordova-plugins/in-app-purchase-2
      // 3. capacitor-plugin-in-app-purchases

      console.log('[Payments] Starting IAP purchase...');

      // Placeholder for actual IAP implementation
      // const { Purchases } = await import('@capgo/capacitor-purchases');
      // const purchaseResult = await Purchases.purchaseProduct('remove_ads');

      // For now, return placeholder
      console.warn('[Payments] IAP not fully implemented - install an IAP plugin');
      return { success: false, error: 'IAP not configured' };

    } catch (error) {
      console.error('[Payments] IAP purchase failed:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Restore previous purchases (for iOS/Android)
   */
  async restorePurchases() {
    const platform = PathfindrConfig.platform;

    if (platform === 'web') {
      // Web purchases are tied to account, not device
      // Check Supabase for purchase status
      return PathfindrAuth.hasPurchased();
    }

    try {
      // Placeholder for restore implementation
      console.log('[Payments] Restoring purchases...');

      // const { Purchases } = await import('@capgo/capacitor-purchases');
      // const restoredPurchases = await Purchases.restorePurchases();
      // return restoredPurchases.some(p => p.productId === 'remove_ads');

      return false;
    } catch (error) {
      console.error('[Payments] Restore failed:', error);
      return false;
    }
  },

  /**
   * Handle successful purchase
   * Updates user record and removes ads
   */
  async handlePurchaseSuccess() {
    // Update Supabase user record
    await PathfindrAuth.setPurchased(true);

    // Remove ads immediately
    await PathfindrAds.removeAllAds();

    console.log('[Payments] Purchase successful - ads removed');
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
};

// Check for Stripe redirect on load
document.addEventListener('DOMContentLoaded', () => {
  const result = PathfindrPayments.checkStripeRedirect();
  if (result === 'success') {
    alert('Thank you for your purchase! Ads have been removed.');
  }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PathfindrPayments;
}
