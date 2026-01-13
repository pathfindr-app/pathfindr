/**
 * Pathfindr Authentication Module
 *
 * Handles user authentication and profile management via Supabase.
 * Provides: signup, login, logout, session persistence, profile data
 */

const PathfindrAuth = {
  client: null,
  currentUser: null,
  currentProfile: null,
  initialized: false,
  listeners: [],
  needsCallsign: false,

  /**
   * Initialize Supabase client and restore session
   */
  async init() {
    if (this.initialized) return;

    try {
      // Use global supabase from CDN
      // Supabase v2 CDN exposes createClient directly on window.supabase
      if (!window.supabase) {
        console.error('[Auth] Supabase library not loaded. Check CDN script.');
        return;
      }

      const createClient = window.supabase.createClient;
      if (!createClient) {
        console.error('[Auth] createClient not found on window.supabase');
        return;
      }

      this.client = createClient(
        PathfindrConfig.supabase.url,
        PathfindrConfig.supabase.anonKey
      );

      // Listen for auth state changes
      this.client.auth.onAuthStateChange((event, session) => {
        console.log('[Auth] State changed:', event);

        if (session?.user) {
          this.currentUser = session.user;
          this.loadProfile(session.user.id);
        } else {
          this.currentUser = null;
          this.currentProfile = null;
          window.pathfindrUser = null;
        }

        // Notify listeners
        this.listeners.forEach(cb => cb(event, session));
      });

      // Check for existing session
      const { data: { session } } = await this.client.auth.getSession();
      if (session?.user) {
        this.currentUser = session.user;
        await this.loadProfile(session.user.id);
      }

      this.initialized = true;
      console.log('[Auth] Initialized');
    } catch (error) {
      console.error('[Auth] Failed to initialize:', error);
    }
  },

  /**
   * Sign up a new user
   * @param {string} email
   * @param {string} password
   * @param {string} username - Display name for leaderboards
   * @returns {Object} - { success, error, user }
   */
  async signUp(email, password, username) {
    if (!this.client) {
      return { success: false, error: 'Auth not initialized' };
    }

    try {
      // Check if username is taken
      const { data: existingUser } = await this.client
        .from('users')
        .select('username')
        .eq('username', username)
        .single();

      if (existingUser) {
        return { success: false, error: 'Username already taken' };
      }

      // Create auth user
      const { data, error } = await this.client.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Create user profile
      const { error: profileError } = await this.client
        .from('users')
        .insert({
          id: data.user.id,
          email: email,
          username: username,
          has_purchased: false,
          created_at: new Date().toISOString(),
        });

      if (profileError) {
        console.error('[Auth] Failed to create profile:', profileError);
        // User was created but profile failed - they can retry
      }

      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Log in existing user
   * @param {string} email
   * @param {string} password
   * @returns {Object} - { success, error, user }
   */
  async login(email, password) {
    if (!this.client) {
      return { success: false, error: 'Auth not initialized' };
    }

    try {
      const { data, error } = await this.client.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      await this.loadProfile(data.user.id);
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Log out current user
   */
  async logout() {
    if (!this.client) return;

    await this.client.auth.signOut();
    this.currentUser = null;
    this.currentProfile = null;
    window.pathfindrUser = null;
  },

  /**
   * Load user profile from database
   * Creates a new profile if one doesn't exist (for OAuth users)
   * @param {string} userId
   */
  async loadProfile(userId) {
    if (!this.client) return;

    try {
      const { data, error } = await this.client
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // No profile exists - create one for OAuth user
        console.log('[Auth] No profile found, creating one for OAuth user...');
        await this.createOAuthProfile(userId);
        return;
      }

      if (error) {
        console.error('[Auth] Failed to load profile:', error);
        return;
      }

      this.currentProfile = data;

      // Make profile available globally for ads check
      window.pathfindrUser = data;

      console.log('[Auth] Profile loaded:', data.username);
    } catch (error) {
      console.error('[Auth] Error loading profile:', error);
    }
  },

  /**
   * Create a profile for OAuth users who don't have one yet
   * @param {string} userId
   */
  async createOAuthProfile(userId) {
    if (!this.client || !this.currentUser) return;

    try {
      // Generate temporary username from email
      const email = this.currentUser.email || '';
      const tempUsername = `player_${Math.random().toString(36).substring(2, 8)}`;

      const { data, error } = await this.client
        .from('users')
        .insert({
          id: userId,
          email: email,
          username: tempUsername,
          has_purchased: false,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('[Auth] Failed to create OAuth profile:', error);
        return;
      }

      this.currentProfile = data;
      window.pathfindrUser = data;
      this.needsCallsign = true;

      console.log('[Auth] Created OAuth profile, showing callsign prompt...');

      // Show callsign modal for new user
      this.showCallsignModal();
    } catch (error) {
      console.error('[Auth] Error creating OAuth profile:', error);
    }
  },

  /**
   * Show the callsign modal for new users
   */
  showCallsignModal() {
    const modal = document.getElementById('callsign-modal');
    if (!modal) {
      console.error('[Auth] Callsign modal not found');
      return;
    }

    modal.classList.remove('hidden');

    // Set up form handling
    const form = document.getElementById('callsign-form');
    const input = document.getElementById('callsign-input');
    const errorEl = document.getElementById('callsign-error');
    const submitBtn = document.getElementById('callsign-submit');

    if (!form || !input) return;

    // Focus input
    setTimeout(() => input.focus(), 100);

    // Real-time validation
    input.addEventListener('input', () => {
      const value = input.value.trim();
      const validation = this.validateCallsign(value);

      if (errorEl) {
        errorEl.textContent = validation.error || '';
      }

      if (submitBtn) {
        submitBtn.disabled = !validation.valid;
      }
    });

    // Form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const callsign = input.value.trim();
      const validation = this.validateCallsign(callsign);

      if (!validation.valid) {
        if (errorEl) errorEl.textContent = validation.error;
        return;
      }

      // Disable form while submitting
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.querySelector('span').textContent = 'Saving...';
      }

      // Check if callsign is available
      const available = await this.isCallsignAvailable(callsign);
      if (!available) {
        if (errorEl) errorEl.textContent = 'Callsign already taken';
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.querySelector('span').textContent = 'Confirm Callsign';
        }
        return;
      }

      // Update the callsign
      const result = await this.updateCallsign(callsign);

      if (result.success) {
        this.needsCallsign = false;
        modal.classList.add('hidden');
        console.log('[Auth] Callsign set:', callsign);
      } else {
        if (errorEl) errorEl.textContent = result.error || 'Failed to save callsign';
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.querySelector('span').textContent = 'Confirm Callsign';
        }
      }
    });
  },

  /**
   * Validate a callsign
   * @param {string} callsign
   * @returns {Object} - { valid, error }
   */
  validateCallsign(callsign) {
    if (!callsign || callsign.length < 2) {
      return { valid: false, error: 'Callsign must be at least 2 characters' };
    }

    if (callsign.length > 20) {
      return { valid: false, error: 'Callsign must be 20 characters or less' };
    }

    // Only allow alphanumeric, underscores, and hyphens
    if (!/^[a-zA-Z0-9_-]+$/.test(callsign)) {
      return { valid: false, error: 'Only letters, numbers, underscores, and hyphens allowed' };
    }

    // Must start with a letter
    if (!/^[a-zA-Z]/.test(callsign)) {
      return { valid: false, error: 'Must start with a letter' };
    }

    return { valid: true, error: null };
  },

  /**
   * Check if a callsign is available
   * @param {string} callsign
   * @returns {Promise<boolean>}
   */
  async isCallsignAvailable(callsign) {
    if (!this.client) return false;

    try {
      const { data } = await this.client
        .from('users')
        .select('username')
        .ilike('username', callsign)
        .neq('id', this.currentUser?.id || '')
        .single();

      return !data;
    } catch (error) {
      // PGRST116 = no rows found = available
      return true;
    }
  },

  /**
   * Update the current user's callsign (username)
   * @param {string} callsign
   * @returns {Object} - { success, error }
   */
  async updateCallsign(callsign) {
    if (!this.client || !this.currentUser) {
      return { success: false, error: 'Not logged in' };
    }

    try {
      const { data, error } = await this.client
        .from('users')
        .update({ username: callsign })
        .eq('id', this.currentUser.id)
        .select()
        .single();

      if (error) {
        console.error('[Auth] Failed to update callsign:', error);
        return { success: false, error: error.message };
      }

      this.currentProfile = data;
      window.pathfindrUser = data;

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Update user's purchase status
   * @param {boolean} purchased
   */
  async setPurchased(purchased = true) {
    if (!this.client || !this.currentUser) return;

    try {
      await this.client
        .from('users')
        .update({
          has_purchased: purchased,
          purchased_at: new Date().toISOString(),
        })
        .eq('id', this.currentUser.id);

      this.currentProfile.has_purchased = purchased;
      window.pathfindrUser.has_purchased = purchased;

      // Remove ads immediately
      if (purchased && typeof PathfindrAds !== 'undefined') {
        PathfindrAds.removeAllAds();
      }
    } catch (error) {
      console.error('[Auth] Failed to update purchase status:', error);
    }
  },

  /**
   * Get current user's username
   * @returns {string|null}
   */
  getUsername() {
    return this.currentProfile?.username || null;
  },

  /**
   * Check if user is logged in
   * @returns {boolean}
   */
  isLoggedIn() {
    return this.currentUser !== null;
  },

  /**
   * Check if user has purchased ad-free / premium
   * Also checks for dev override in localStorage
   * @returns {boolean}
   */
  hasPurchased() {
    // Check for dev override first
    if (localStorage.getItem('pathfindr_premium_override') === 'true') {
      return true;
    }
    return this.currentProfile?.has_purchased === true;
  },

  /**
   * Enable premium features locally (for development/testing)
   * Run in console: PathfindrAuth.enablePremiumOverride()
   */
  enablePremiumOverride() {
    localStorage.setItem('pathfindr_premium_override', 'true');
    console.log('[Auth] Premium override ENABLED. Refresh the page to access premium features.');
    console.log('[Auth] To disable: PathfindrAuth.disablePremiumOverride()');
  },

  /**
   * Disable premium override
   */
  disablePremiumOverride() {
    localStorage.removeItem('pathfindr_premium_override');
    console.log('[Auth] Premium override DISABLED.');
  },

  /**
   * Add auth state change listener
   * @param {Function} callback - (event, session) => void
   */
  onAuthStateChange(callback) {
    this.listeners.push(callback);
  },

  /**
   * Send password reset email
   * @param {string} email
   * @returns {Object} - { success, error }
   */
  async resetPassword(email) {
    if (!this.client) {
      return { success: false, error: 'Auth not initialized' };
    }

    try {
      const { error } = await this.client.auth.resetPasswordForEmail(email);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Sign in with OAuth provider (Google, Apple, Facebook)
   * @param {string} provider - 'google', 'apple', or 'facebook'
   * @returns {Object} - { success, error }
   */
  async signInWithProvider(provider) {
    if (!this.client) {
      return { success: false, error: 'Auth not initialized' };
    }

    try {
      // Detect platform for proper redirect URL
      const isNativeMobile = typeof window !== 'undefined' &&
                             window.Capacitor &&
                             window.Capacitor.isNativePlatform();

      // Also detect if running in Capacitor WebView (localhost indicates Capacitor)
      const isCapacitorWebView = window.location.origin.includes('localhost') ||
                                  window.location.origin.includes('capacitor://') ||
                                  window.location.protocol === 'capacitor:';

      // On mobile or Capacitor WebView, redirect to deployed website
      // On actual web deployment, use current origin
      // Using Vercel URL for testing until pathfindr.world is set up
      const redirectUrl = (isNativeMobile || isCapacitorWebView)
        ? 'https://pathfindralpha.vercel.app/auth-callback'
        : window.location.origin;

      console.log('[Auth] OAuth redirect URL:', redirectUrl, '(isNative:', isNativeMobile, ', isCapacitor:', isCapacitorWebView, ')');

      const shouldOpenExternal = isNativeMobile || isCapacitorWebView;

      const { data, error } = await this.client.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: redirectUrl,
          // On mobile/Capacitor, open in external browser (required for OAuth)
          skipBrowserRedirect: shouldOpenExternal,
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // On mobile/Capacitor, manually open the OAuth URL in external browser
      if (shouldOpenExternal && data?.url) {
        console.log('[Auth] Opening OAuth URL in external browser:', data.url);
        // Use Capacitor Browser plugin or fallback to window.open
        if (window.Capacitor?.Plugins?.Browser) {
          await window.Capacitor.Plugins.Browser.open({ url: data.url });
        } else {
          window.open(data.url, '_blank');
        }
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // ===========================================
  // SCORE SUBMISSION
  // ===========================================

  /**
   * Submit a game score
   * @param {Object} gameData - { efficiency, location, roundNumber, userPath, optimalPath, etc. }
   */
  async submitScore(gameData) {
    if (!this.client || !this.currentUser) {
      console.log('[Auth] Cannot submit score - not logged in');
      return { success: false, error: 'Not logged in' };
    }

    try {
      const { error } = await this.client
        .from('games')
        .insert({
          user_id: this.currentUser.id,
          efficiency_percentage: gameData.efficiency,
          location_name: gameData.locationName || 'Unknown',
          center_lat: gameData.centerLat,
          center_lng: gameData.centerLng,
          zoom_level: gameData.zoomLevel,
          round_number: gameData.roundNumber,
          user_path: gameData.userPath,
          optimal_path: gameData.optimalPath,
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error('[Auth] Failed to submit score:', error);
        return { success: false, error: error.message };
      }

      // Update leaderboard
      await this.updateLeaderboard();

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Update user's leaderboard entry
   */
  async updateLeaderboard() {
    if (!this.client || !this.currentUser) return;

    try {
      // Get user's best and average efficiency
      const { data: scores } = await this.client
        .from('games')
        .select('efficiency_percentage')
        .eq('user_id', this.currentUser.id);

      if (!scores || scores.length === 0) return;

      const efficiencies = scores.map(s => s.efficiency_percentage);
      const bestEfficiency = Math.max(...efficiencies);
      const avgEfficiency = efficiencies.reduce((a, b) => a + b, 0) / efficiencies.length;

      // Upsert leaderboard entry
      await this.client
        .from('leaderboards')
        .upsert({
          user_id: this.currentUser.id,
          username: this.currentProfile.username,
          best_efficiency: bestEfficiency,
          avg_efficiency: avgEfficiency,
          total_games: scores.length,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

    } catch (error) {
      console.error('[Auth] Failed to update leaderboard:', error);
    }
  },

  // ===========================================
  // LEADERBOARD QUERIES
  // ===========================================

  /**
   * Get top players
   * @param {number} limit - Number of players to fetch
   * @returns {Array}
   */
  async getLeaderboard(limit = 100) {
    if (!this.client) return [];

    try {
      const { data, error } = await this.client
        .from('leaderboards')
        .select('username, best_efficiency, avg_efficiency, total_games')
        .order('best_efficiency', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[Auth] Failed to fetch leaderboard:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[Auth] Error fetching leaderboard:', error);
      return [];
    }
  },

  /**
   * Get current user's rank
   * @returns {number|null}
   */
  async getUserRank() {
    if (!this.client || !this.currentUser) return null;

    try {
      // Get all users ordered by efficiency
      const { data } = await this.client
        .from('leaderboards')
        .select('user_id')
        .order('best_efficiency', { ascending: false });

      if (!data) return null;

      const rank = data.findIndex(entry => entry.user_id === this.currentUser.id);
      return rank >= 0 ? rank + 1 : null;
    } catch (error) {
      return null;
    }
  },

  // ===========================================
  // PROFILE STATS
  // ===========================================

  /**
   * Get detailed profile stats for the current user
   * @returns {Object} - { cities, countries, distance, avgEfficiency, totalRounds, locations }
   */
  async getProfileStats() {
    if (!this.client || !this.currentUser) {
      return {
        cities: 0,
        countries: 0,
        distance: 0,
        avgEfficiency: 0,
        totalRounds: 0,
        locations: []
      };
    }

    try {
      // Fetch all games for this user
      const { data: games, error } = await this.client
        .from('games')
        .select('location_name, center_lat, center_lng, efficiency_percentage, user_path')
        .eq('user_id', this.currentUser.id);

      if (error || !games || games.length === 0) {
        return {
          cities: 0,
          countries: 0,
          distance: 0,
          avgEfficiency: 0,
          totalRounds: 0,
          locations: []
        };
      }

      // Parse unique locations (cities/countries from location_name)
      const locationSet = new Set();
      const countrySet = new Set();
      const locations = [];

      games.forEach(game => {
        if (game.location_name && game.location_name !== 'Unknown') {
          // Location name format is typically "City, State/Country" or "City, Country"
          const parts = game.location_name.split(',').map(p => p.trim());
          if (parts.length > 0) {
            locationSet.add(parts[0]); // City
          }
          if (parts.length > 1) {
            countrySet.add(parts[parts.length - 1]); // Last part (state/country)
          }
        }

        // Store location coordinates for journey map
        if (game.center_lat && game.center_lng) {
          locations.push({
            lat: game.center_lat,
            lng: game.center_lng,
            name: game.location_name
          });
        }
      });

      // Calculate total distance from user_path
      let totalDistance = 0;
      games.forEach(game => {
        if (game.user_path && Array.isArray(game.user_path)) {
          totalDistance += this.calculatePathDistance(game.user_path);
        }
      });

      // Calculate average efficiency
      const efficiencies = games.map(g => g.efficiency_percentage).filter(e => e != null);
      const avgEfficiency = efficiencies.length > 0
        ? efficiencies.reduce((a, b) => a + b, 0) / efficiencies.length
        : 0;

      return {
        cities: locationSet.size,
        countries: countrySet.size,
        distance: Math.round(totalDistance / 1000), // Convert to km
        avgEfficiency: Math.round(avgEfficiency),
        totalRounds: games.length,
        locations: locations
      };
    } catch (error) {
      console.error('[Auth] Error fetching profile stats:', error);
      return {
        cities: 0,
        countries: 0,
        distance: 0,
        avgEfficiency: 0,
        totalRounds: 0,
        locations: []
      };
    }
  },

  /**
   * Calculate the total distance of a path in meters
   * @param {Array} path - Array of {lat, lng} coordinates
   * @returns {number} - Distance in meters
   */
  calculatePathDistance(path) {
    if (!path || path.length < 2) return 0;

    let distance = 0;
    for (let i = 1; i < path.length; i++) {
      const prev = path[i - 1];
      const curr = path[i];
      if (prev && curr && prev.lat && prev.lng && curr.lat && curr.lng) {
        distance += this.haversineDistance(prev.lat, prev.lng, curr.lat, curr.lng);
      }
    }
    return distance;
  },

  /**
   * Calculate distance between two coordinates using Haversine formula
   * @returns {number} - Distance in meters
   */
  haversineDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  /**
   * Update the profile UI with current stats
   */
  async updateProfileUI() {
    if (!this.isLoggedIn()) return;

    const stats = await this.getProfileStats();

    // Update stat values
    const citiesEl = document.getElementById('profile-cities');
    const countriesEl = document.getElementById('profile-countries');
    const distanceEl = document.getElementById('profile-distance');
    const avgEfficiencyEl = document.getElementById('profile-avg-efficiency');
    const journeyRoundsEl = document.getElementById('journey-rounds');
    const usernameEl = document.getElementById('profile-username');
    const statusBadge = document.getElementById('profile-status-badge');
    const statusText = document.getElementById('profile-status');
    const removeAdsBtn = document.getElementById('remove-ads-btn');

    if (citiesEl) citiesEl.textContent = stats.cities;
    if (countriesEl) countriesEl.textContent = stats.countries;
    if (distanceEl) {
      distanceEl.innerHTML = `${stats.distance}<span class="stat-unit">km</span>`;
    }
    if (avgEfficiencyEl) {
      avgEfficiencyEl.innerHTML = `${stats.avgEfficiency}<span class="stat-unit">%</span>`;
    }
    if (journeyRoundsEl) {
      journeyRoundsEl.textContent = `${stats.totalRounds} round${stats.totalRounds !== 1 ? 's' : ''}`;
    }
    if (usernameEl && this.currentProfile) {
      usernameEl.textContent = this.currentProfile.username;
    }

    // Update premium status badge
    const isPremium = this.hasPurchased();
    if (statusBadge) {
      statusBadge.classList.toggle('premium', isPremium);
    }
    if (statusText) {
      statusText.textContent = isPremium ? 'Premium' : 'Free';
    }
    if (removeAdsBtn) {
      removeAdsBtn.style.display = isPremium ? 'none' : 'flex';
    }

    // Update stat bar fill percentages (visual flair)
    const cityBar = document.querySelector('[data-stat="cities"] .stat-bar-fill');
    const regionBar = document.querySelector('[data-stat="regions"] .stat-bar-fill');
    const distanceBar = document.querySelector('[data-stat="distance"] .stat-bar-fill');
    const efficiencyBar = document.querySelector('[data-stat="efficiency"] .stat-bar-fill');

    if (cityBar) cityBar.style.setProperty('--fill-percent', `${Math.min(100, stats.cities * 10)}%`);
    if (regionBar) regionBar.style.setProperty('--fill-percent', `${Math.min(100, stats.countries * 20)}%`);
    if (distanceBar) distanceBar.style.setProperty('--fill-percent', `${Math.min(100, stats.distance / 10)}%`);
    if (efficiencyBar) efficiencyBar.style.setProperty('--fill-percent', `${stats.avgEfficiency}%`);

    // Update navigation log with visited locations
    this.renderNavigationLog(stats.locations);

    console.log('[Auth] Profile UI updated:', stats);
  },

  /**
   * Show the full-screen animated journey map
   * Zooms from current location to world view with pin drops
   */
  async showJourneyAnimation() {
    const stats = await this.getProfileStats();
    if (stats.locations.length === 0) {
      console.log('[Auth] No locations to show in journey animation');
      return;
    }

    // Create fullscreen overlay
    const overlay = document.createElement('div');
    overlay.id = 'journey-animation-overlay';
    overlay.innerHTML = `
      <canvas id="journey-animation-canvas"></canvas>
      <div class="journey-animation-header">
        <span class="journey-title">Your Journey</span>
        <span class="journey-stats">${stats.cities} cities • ${stats.countries} regions • ${stats.distance}km drawn</span>
      </div>
      <button class="journey-close-btn" id="journey-close-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    `;

    document.body.appendChild(overlay);

    // Set up canvas
    const canvas = document.getElementById('journey-animation-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth * 2;
    canvas.height = window.innerHeight * 2;

    // Close button
    document.getElementById('journey-close-btn').addEventListener('click', () => {
      overlay.classList.add('fade-out');
      setTimeout(() => overlay.remove(), 300);
    });

    // Animation state
    const locations = stats.locations;
    let animationPhase = 'zoom-out'; // zoom-out, pin-drop, idle
    let progress = 0;
    let droppedPins = 0;
    const pinDropDelay = 150;
    const zoomDuration = 1500;
    const startTime = Date.now();

    // Calculate world bounds
    const worldBounds = {
      minLat: -60,
      maxLat: 75,
      minLng: -170,
      maxLng: 170
    };

    // Current view bounds (start from recent location)
    const recentLoc = locations[locations.length - 1];
    let currentBounds = {
      minLat: recentLoc.lat - 2,
      maxLat: recentLoc.lat + 2,
      minLng: recentLoc.lng - 4,
      maxLng: recentLoc.lng + 4
    };

    // Easing function
    const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
    const easeOutElastic = t => {
      const c4 = (2 * Math.PI) / 3;
      return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    };

    // Draw function
    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      const elapsed = Date.now() - startTime;

      // Clear
      ctx.fillStyle = '#0d0a14';
      ctx.fillRect(0, 0, width, height);

      // Calculate current bounds based on animation phase
      if (animationPhase === 'zoom-out') {
        progress = Math.min(1, elapsed / zoomDuration);
        const t = easeOutCubic(progress);

        currentBounds = {
          minLat: recentLoc.lat - 2 + (worldBounds.minLat - (recentLoc.lat - 2)) * t,
          maxLat: recentLoc.lat + 2 + (worldBounds.maxLat - (recentLoc.lat + 2)) * t,
          minLng: recentLoc.lng - 4 + (worldBounds.minLng - (recentLoc.lng - 4)) * t,
          maxLng: recentLoc.lng + 4 + (worldBounds.maxLng - (recentLoc.lng + 4)) * t
        };

        if (progress >= 1) {
          animationPhase = 'pin-drop';
          progress = 0;
        }
      }

      // Convert lat/lng to canvas coords
      const toCanvas = (lat, lng) => {
        const x = ((lng - currentBounds.minLng) / (currentBounds.maxLng - currentBounds.minLng)) * width;
        const y = ((currentBounds.maxLat - lat) / (currentBounds.maxLat - currentBounds.minLat)) * height;
        return { x, y };
      };

      // Draw subtle grid
      ctx.strokeStyle = 'rgba(65, 217, 217, 0.05)';
      ctx.lineWidth = 1;
      for (let lat = -60; lat <= 80; lat += 20) {
        const start = toCanvas(lat, -180);
        const end = toCanvas(lat, 180);
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      }
      for (let lng = -180; lng <= 180; lng += 30) {
        const start = toCanvas(-60, lng);
        const end = toCanvas(80, lng);
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      }

      // Draw connections
      if (locations.length > 1 && animationPhase !== 'zoom-out') {
        ctx.strokeStyle = 'rgba(65, 217, 217, 0.2)';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        locations.forEach((loc, i) => {
          if (i >= droppedPins) return;
          const { x, y } = toCanvas(loc.lat, loc.lng);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw pins
      const pinsToDraw = animationPhase === 'zoom-out' ? locations.length :
                        animationPhase === 'pin-drop' ? droppedPins : locations.length;

      locations.forEach((loc, i) => {
        if (i >= pinsToDraw) return;

        const { x, y } = toCanvas(loc.lat, loc.lng);
        const isRecent = i === locations.length - 1;
        const pinAge = animationPhase === 'pin-drop' && i === droppedPins - 1 ?
                      (Date.now() - startTime - zoomDuration - (i * pinDropDelay)) : 1000;
        const pinScale = Math.min(1, pinAge / 200);
        const bounce = easeOutElastic(pinScale);

        // Glow
        const glowSize = 30 * bounce;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowSize);
        gradient.addColorStop(0, isRecent ? 'rgba(255, 107, 157, 0.5)' : 'rgba(65, 217, 217, 0.4)');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, glowSize, 0, Math.PI * 2);
        ctx.fill();

        // Pin
        const pinSize = 8 * bounce;
        ctx.fillStyle = isRecent ? '#ff6b9d' : '#41d9d9';
        ctx.beginPath();
        ctx.arc(x, y, pinSize, 0, Math.PI * 2);
        ctx.fill();

        // Border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Handle pin drop animation
      if (animationPhase === 'pin-drop') {
        const pinDropElapsed = elapsed - zoomDuration;
        const expectedPins = Math.floor(pinDropElapsed / pinDropDelay) + 1;
        if (droppedPins < expectedPins && droppedPins < locations.length) {
          droppedPins = Math.min(expectedPins, locations.length);
        }
        if (droppedPins >= locations.length) {
          animationPhase = 'idle';
        }
      }

      // Continue animation
      if (animationPhase !== 'idle' || elapsed < zoomDuration + (locations.length * pinDropDelay) + 500) {
        requestAnimationFrame(draw);
      }
    };

    // Start animation
    requestAnimationFrame(draw);
  },

  /**
   * Render the navigation log with visited locations
   * Shows up to 25 locations in a scrollable list
   * @param {Array} locations - Array of {lat, lng, name} objects
   */
  renderNavigationLog(locations) {
    const listContainer = document.getElementById('nav-log-list');
    if (!listContainer) return;

    // Clear existing content
    listContainer.innerHTML = '';

    // If no locations, show empty state
    if (!locations || locations.length === 0) {
      listContainer.innerHTML = `
        <div class="nav-log-empty">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1">
            <circle cx="12" cy="12" r="10" stroke-dasharray="2 2"/>
            <circle cx="12" cy="12" r="2"/>
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
          </svg>
          <span>No navigation data yet</span>
        </div>
      `;
      return;
    }

    // Dedupe locations by name (keep most recent)
    const uniqueLocations = [];
    const seenNames = new Set();

    // Reverse to process most recent first, then reverse back
    for (let i = locations.length - 1; i >= 0; i--) {
      const loc = locations[i];
      const key = loc.name || `${loc.lat.toFixed(2)},${loc.lng.toFixed(2)}`;
      if (!seenNames.has(key)) {
        seenNames.add(key);
        uniqueLocations.unshift(loc);
      }
    }

    // Limit to 25 most recent unique locations (reversed so most recent is first)
    const displayLocations = uniqueLocations.slice(-25).reverse();

    // Create entries for each location
    displayLocations.forEach((loc) => {
      const entry = document.createElement('div');
      entry.className = 'nav-log-entry';

      // Format coordinates nicely
      const latDir = loc.lat >= 0 ? 'N' : 'S';
      const lngDir = loc.lng >= 0 ? 'E' : 'W';
      const latFormatted = Math.abs(loc.lat).toFixed(3);
      const lngFormatted = Math.abs(loc.lng).toFixed(3);

      // Use location name or "Unknown Location"
      const displayName = loc.name && loc.name !== 'Unknown' ? loc.name : 'Unknown Location';

      entry.innerHTML = `
        <div class="entry-marker"></div>
        <div class="entry-info">
          <div class="entry-name">${displayName}</div>
          <div class="entry-coords">${latFormatted}°${latDir} ${lngFormatted}°${lngDir}</div>
        </div>
      `;

      listContainer.appendChild(entry);
    });
  },
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PathfindrAuth;
}
