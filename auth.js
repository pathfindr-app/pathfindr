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

  /**
   * Initialize Supabase client and restore session
   */
  async init() {
    if (this.initialized) return;

    try {
      // Use global supabase from CDN
      const { createClient } = window.supabase;

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
   * Check if user has purchased ad-free
   * @returns {boolean}
   */
  hasPurchased() {
    return this.currentProfile?.has_purchased === true;
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
      const { data, error } = await this.client.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: window.location.origin,
        }
      });

      if (error) {
        return { success: false, error: error.message };
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
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PathfindrAuth;
}
