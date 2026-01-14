/**
 * Pathfindr Analytics Module
 *
 * Handles event tracking, session management, achievement checking,
 * and city leaderboard updates.
 */

const PathfindrAnalytics = {
  sessionId: null,
  sessionStartTime: null,
  roundStartTime: null,
  initialized: false,
  eventQueue: [],
  flushInterval: null,

  // Platform detection
  platform: 'web',
  appVersion: '1.0.0',

  /**
   * Initialize analytics - call once on app start
   */
  init() {
    if (this.initialized) return;

    // Detect platform
    if (window.Capacitor?.isNativePlatform()) {
      this.platform = window.Capacitor.getPlatform(); // 'ios' or 'android'
    }

    // Generate or restore session ID
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();

    // Start session in database
    this.startSession();

    // Set up periodic flush
    this.flushInterval = setInterval(() => this.flushEvents(), 30000);

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.endSession();
      this.flushEvents(true);
    });

    // Track visibility changes for accurate session duration
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.track('app_backgrounded');
      } else {
        this.track('app_foregrounded');
      }
    });

    this.initialized = true;
    console.log('[Analytics] Initialized, session:', this.sessionId);

    // Track landing funnel step
    this.trackFunnel('landing');

    // Preload achievements data
    if (typeof PathfindrAchievements !== 'undefined') {
      PathfindrAchievements.loadAchievements();
    }
  },

  /**
   * Generate a unique session ID
   */
  generateSessionId() {
    return 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
  },

  /**
   * Start a new session in the database
   */
  async startSession() {
    if (!PathfindrAuth?.client) return;

    try {
      await PathfindrAuth.client
        .from('analytics_sessions')
        .insert({
          id: this.sessionId,
          user_id: PathfindrAuth.currentUser?.id || null,
          platform: this.platform,
          app_version: this.appVersion,
          started_at: new Date().toISOString(),
          last_active_at: new Date().toISOString(),
        });
    } catch (error) {
      console.warn('[Analytics] Failed to start session:', error);
    }
  },

  /**
   * Update session with final stats
   */
  async endSession() {
    if (!PathfindrAuth?.client || !this.sessionId) return;

    const duration = Date.now() - this.sessionStartTime;

    try {
      await PathfindrAuth.client
        .from('analytics_sessions')
        .update({
          ended_at: new Date().toISOString(),
          total_duration_ms: duration,
        })
        .eq('id', this.sessionId);
    } catch (error) {
      console.warn('[Analytics] Failed to end session:', error);
    }
  },

  /**
   * Update session activity heartbeat
   */
  async heartbeat() {
    if (!PathfindrAuth?.client || !this.sessionId) return;

    try {
      await PathfindrAuth.client
        .from('analytics_sessions')
        .update({
          last_active_at: new Date().toISOString(),
        })
        .eq('id', this.sessionId);
    } catch (error) {
      // Silently fail heartbeats
    }
  },

  // ==========================================================================
  // EVENT TRACKING
  // ==========================================================================

  /**
   * Track an event
   * @param {string} eventName - Name of the event
   * @param {Object} data - Additional event data
   */
  track(eventName, data = {}) {
    const event = {
      session_id: this.sessionId,
      user_id: PathfindrAuth?.currentUser?.id || null,
      event_name: eventName,
      event_data: data,
      platform: this.platform,
      app_version: this.appVersion,
      created_at: new Date().toISOString(),
    };

    this.eventQueue.push(event);
    console.log('[Analytics] Track:', eventName, data);

    // Flush if queue gets large
    if (this.eventQueue.length >= 10) {
      this.flushEvents();
    }
  },

  /**
   * Flush queued events to database
   */
  async flushEvents(sync = false) {
    if (this.eventQueue.length === 0) return;
    if (!PathfindrAuth?.client) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      if (sync && navigator.sendBeacon) {
        // Use sendBeacon for reliable delivery on page unload
        const blob = new Blob([JSON.stringify({ events })], { type: 'application/json' });
        navigator.sendBeacon(
          `${PathfindrConfig.supabase.url}/rest/v1/events`,
          blob
        );
      } else {
        await PathfindrAuth.client
          .from('events')
          .insert(events);
      }
    } catch (error) {
      // Re-queue events on failure
      this.eventQueue = [...events, ...this.eventQueue];
      console.warn('[Analytics] Failed to flush events:', error);
    }
  },

  // ==========================================================================
  // FUNNEL TRACKING
  // ==========================================================================

  /**
   * Track a funnel step
   * @param {string} step - Funnel step name
   */
  async trackFunnel(step) {
    if (!PathfindrAuth?.client) return;

    try {
      await PathfindrAuth.client
        .from('funnels')
        .insert({
          user_id: PathfindrAuth.currentUser?.id || null,
          session_id: this.sessionId,
          step: step,
        });
    } catch (error) {
      console.warn('[Analytics] Failed to track funnel:', error);
    }
  },

  // ==========================================================================
  // GAME EVENT HELPERS
  // ==========================================================================

  /**
   * Track game start
   */
  trackGameStart(locationMode, cityName) {
    this.track('game_started', {
      location_mode: locationMode,
      city_name: cityName,
    });

    // Track first_game funnel step if this is user's first game
    if (!localStorage.getItem('pathfindr_has_played')) {
      this.trackFunnel('first_game');
      localStorage.setItem('pathfindr_has_played', 'true');
    }
  },

  /**
   * Track round start
   */
  trackRoundStart(roundNumber, cityName) {
    this.roundStartTime = Date.now();
    this.track('round_started', {
      round: roundNumber,
      city_name: cityName,
    });
  },

  /**
   * Track round completion
   */
  trackRoundComplete(roundNumber, efficiency, userDistance, optimalDistance) {
    const duration = this.roundStartTime ? Date.now() - this.roundStartTime : null;

    this.track('round_completed', {
      round: roundNumber,
      efficiency: efficiency,
      user_distance_m: userDistance,
      optimal_distance_m: optimalDistance,
      duration_ms: duration,
    });

    // Update session stats
    this.updateSessionStats();
  },

  /**
   * Track game completion
   */
  trackGameComplete(finalScore, avgEfficiency, cityName, locationMode) {
    this.track('game_completed', {
      final_score: finalScore,
      avg_efficiency: avgEfficiency,
      city_name: cityName,
      location_mode: locationMode,
    });

    // Track completed_game funnel step
    this.trackFunnel('completed_game');
  },

  /**
   * Track A* visualization (did they watch it?)
   */
  trackVisualizationWatched(watchedFull, durationWatched) {
    this.track('astar_visualization', {
      watched_full: watchedFull,
      duration_watched_ms: durationWatched,
    });
  },

  /**
   * Track premium modal view
   */
  trackPremiumViewed() {
    this.track('premium_modal_viewed');
    this.trackFunnel('viewed_premium');
  },

  /**
   * Track purchase
   */
  trackPurchase(amount, currency) {
    this.track('purchase_completed', {
      amount: amount,
      currency: currency,
    });
    this.trackFunnel('purchased');
  },

  /**
   * Track mode selection
   */
  trackModeSelected(mode) {
    this.track('mode_selected', { mode: mode });
  },

  /**
   * Track location selection
   */
  trackLocationSelected(locationType, cityName) {
    this.track('location_selected', {
      type: locationType,
      city_name: cityName,
    });
  },

  /**
   * Update session game stats
   */
  async updateSessionStats() {
    if (!PathfindrAuth?.client || !this.sessionId) return;

    try {
      // Increment rounds_completed
      await PathfindrAuth.client.rpc('increment_session_rounds', {
        p_session_id: this.sessionId
      });
    } catch (error) {
      // Fallback to direct update
      try {
        const { data } = await PathfindrAuth.client
          .from('analytics_sessions')
          .select('rounds_completed')
          .eq('id', this.sessionId)
          .single();

        if (data) {
          await PathfindrAuth.client
            .from('analytics_sessions')
            .update({
              rounds_completed: (data.rounds_completed || 0) + 1,
              last_active_at: new Date().toISOString(),
            })
            .eq('id', this.sessionId);
        }
      } catch (e) {
        // Silently fail
      }
    }
  },

  // ==========================================================================
  // SPECIAL EVENT TRACKING
  // ==========================================================================

  /**
   * Check and track time-based achievements (night owl, early bird)
   */
  trackTimeBasedEvent() {
    const hour = new Date().getHours();

    if (hour >= 2 && hour < 5) {
      this.track('special_night_play');
    } else if (hour >= 5 && hour < 7) {
      this.track('special_morning_play');
    }
  },
};

// =============================================================================
// CITY LEADERBOARD MODULE
// =============================================================================

const CityLeaderboard = {
  /**
   * Update city leaderboard after a game
   */
  async submitScore(cityName, efficiency) {
    if (!PathfindrAuth?.client || !PathfindrAuth.currentUser) {
      console.log('[CityLeaderboard] Not logged in, skipping');
      return null;
    }

    try {
      const { data, error } = await PathfindrAuth.client.rpc('update_city_leaderboard', {
        p_user_id: PathfindrAuth.currentUser.id,
        p_username: PathfindrAuth.currentProfile?.username || 'Anonymous',
        p_city_name: cityName,
        p_efficiency: efficiency,
      });

      if (error) throw error;

      if (data && data[0]) {
        const result = data[0];
        console.log(`[CityLeaderboard] ${cityName}: Rank #${result.city_rank}, New record: ${result.is_new_record}`);
        return result;
      }
    } catch (error) {
      console.warn('[CityLeaderboard] Failed to submit:', error);
    }
    return null;
  },

  /**
   * Get leaderboard for a city
   */
  async getLeaderboard(cityName, limit = 10) {
    if (!PathfindrAuth?.client) return [];

    try {
      const { data, error } = await PathfindrAuth.client.rpc('get_city_leaderboard', {
        p_city_name: cityName,
        p_limit: limit,
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn('[CityLeaderboard] Failed to get leaderboard:', error);
      return [];
    }
  },

  /**
   * Get user's rank in a city
   */
  async getUserRank(cityName) {
    if (!PathfindrAuth?.client || !PathfindrAuth.currentUser) return null;

    const leaderboard = await this.getLeaderboard(cityName, 1000);
    const userEntry = leaderboard.find(e => e.user_id === PathfindrAuth.currentUser.id);
    return userEntry?.rank || null;
  },
};

// =============================================================================
// ACHIEVEMENTS MODULE
// =============================================================================

const PathfindrAchievements = {
  cachedAchievements: null,
  unlockedQueue: [],

  /**
   * Load all achievement definitions
   */
  async loadAchievements() {
    if (this.cachedAchievements) return this.cachedAchievements;
    if (!PathfindrAuth?.client) return [];

    try {
      const { data, error } = await PathfindrAuth.client
        .from('achievements')
        .select('*')
        .order('requirement_value', { ascending: true });

      if (error) throw error;
      this.cachedAchievements = data || [];
      return this.cachedAchievements;
    } catch (error) {
      console.warn('[Achievements] Failed to load:', error);
      return [];
    }
  },

  /**
   * Get user's achievement progress
   */
  async getUserProgress() {
    if (!PathfindrAuth?.client || !PathfindrAuth.currentUser) return [];

    try {
      const { data, error } = await PathfindrAuth.client
        .from('user_achievements')
        .select(`
          achievement_id,
          progress,
          unlocked_at,
          achievements (
            name,
            description,
            icon,
            requirement_value,
            rarity
          )
        `)
        .eq('user_id', PathfindrAuth.currentUser.id);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn('[Achievements] Failed to get progress:', error);
      return [];
    }
  },

  /**
   * Check for newly unlocked achievements
   * Call this after game events (round complete, game complete, etc.)
   */
  async checkAchievements() {
    if (!PathfindrAuth?.client || !PathfindrAuth.currentUser) return [];

    try {
      const { data, error } = await PathfindrAuth.client.rpc('check_achievements', {
        p_user_id: PathfindrAuth.currentUser.id,
      });

      if (error) throw error;

      // Queue newly unlocked achievements for display
      if (data && data.length > 0) {
        data.forEach(ach => {
          if (ach.newly_unlocked) {
            this.unlockedQueue.push(ach);
            console.log('[Achievements] Unlocked:', ach.achievement_name);
          }
        });

        // Show achievement toast
        this.showNextUnlocked();
      }

      return data || [];
    } catch (error) {
      console.warn('[Achievements] Check failed:', error);
      return [];
    }
  },

  /**
   * Show the next unlocked achievement toast
   */
  showNextUnlocked() {
    if (this.unlockedQueue.length === 0) return;

    const ach = this.unlockedQueue.shift();
    this.showAchievementToast(ach.achievement_name, ach.achievement_id);

    // Show next after delay
    if (this.unlockedQueue.length > 0) {
      setTimeout(() => this.showNextUnlocked(), 3500);
    }
  },

  /**
   * Display achievement unlock toast
   */
  showAchievementToast(name, id) {
    // Find achievement details
    const achievement = this.cachedAchievements?.find(a => a.id === id);
    const icon = achievement?.icon || '🏆';
    const rarity = achievement?.rarity || 'common';

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `achievement-toast rarity-${rarity}`;
    toast.innerHTML = `
      <div class="achievement-toast-icon">${icon}</div>
      <div class="achievement-toast-content">
        <div class="achievement-toast-label">Achievement Unlocked!</div>
        <div class="achievement-toast-name">${name}</div>
      </div>
    `;

    document.body.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // Remove after animation
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 500);
    }, 3000);

    // Play sound
    if (typeof SoundEngine !== 'undefined') {
      SoundEngine.complete?.();
    }
  },

  /**
   * Get total achievement points for user
   */
  async getTotalPoints() {
    const progress = await this.getUserProgress();
    let total = 0;

    progress.forEach(p => {
      if (p.unlocked_at && p.achievements) {
        total += p.achievements.points || 0;
      }
    });

    return total;
  },
};

// =============================================================================
// CHALLENGES MODULE
// =============================================================================

const PathfindrChallenges = {
  currentChallenge: null,

  /**
   * Get the active daily challenge
   */
  async getDailyChallenge() {
    if (!PathfindrAuth?.client) return null;

    try {
      const { data, error } = await PathfindrAuth.client.rpc('get_active_challenge', {
        p_type: 'daily',
      });

      if (error) throw error;
      this.currentChallenge = data?.[0] || null;
      return this.currentChallenge;
    } catch (error) {
      console.warn('[Challenges] Failed to get daily:', error);
      return null;
    }
  },

  /**
   * Submit entry to current challenge
   */
  async submitEntry(efficiency, pathData, durationMs) {
    if (!PathfindrAuth?.client || !PathfindrAuth.currentUser || !this.currentChallenge) {
      return null;
    }

    try {
      const { data, error } = await PathfindrAuth.client.rpc('submit_challenge_entry', {
        p_challenge_id: this.currentChallenge.id,
        p_user_id: PathfindrAuth.currentUser.id,
        p_username: PathfindrAuth.currentProfile?.username || 'Anonymous',
        p_efficiency: efficiency,
        p_path_data: pathData,
        p_duration_ms: durationMs,
      });

      if (error) throw error;

      if (data && data[0]) {
        console.log('[Challenges] Entry submitted, rank:', data[0].new_rank);
        return data[0];
      }
    } catch (error) {
      console.warn('[Challenges] Failed to submit:', error);
    }
    return null;
  },

  /**
   * Get challenge leaderboard
   */
  async getLeaderboard(challengeId = null, limit = 100) {
    if (!PathfindrAuth?.client) return [];

    const id = challengeId || this.currentChallenge?.id;
    if (!id) return [];

    try {
      const { data, error } = await PathfindrAuth.client.rpc('get_challenge_leaderboard', {
        p_challenge_id: id,
        p_limit: limit,
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn('[Challenges] Failed to get leaderboard:', error);
      return [];
    }
  },
};

// =============================================================================
// REPLAYS MODULE
// =============================================================================

const PathfindrReplays = {
  /**
   * Save a replay for ghost racing
   */
  async saveReplay(gameData) {
    if (!PathfindrAuth?.client || !PathfindrAuth.currentUser) return null;

    try {
      const { data, error } = await PathfindrAuth.client.rpc('save_replay', {
        p_user_id: PathfindrAuth.currentUser.id,
        p_username: PathfindrAuth.currentProfile?.username || 'Anonymous',
        p_location_name: gameData.locationName,
        p_center_lat: gameData.centerLat,
        p_center_lng: gameData.centerLng,
        p_zoom_level: gameData.zoomLevel,
        p_path_data: gameData.pathData,
        p_optimal_path: gameData.optimalPath,
        p_efficiency: gameData.efficiency,
        p_duration_ms: gameData.durationMs,
      });

      if (error) throw error;
      console.log('[Replays] Saved replay');
      return data;
    } catch (error) {
      console.warn('[Replays] Failed to save:', error);
      return null;
    }
  },

  /**
   * Get a ghost for a location
   */
  async getGhost(locationName, type = 'best') {
    if (!PathfindrAuth?.client) return null;

    try {
      const { data, error } = await PathfindrAuth.client.rpc('get_ghost', {
        p_location_name: locationName,
        p_ghost_type: type,
      });

      if (error) throw error;
      return data?.[0] || null;
    } catch (error) {
      console.warn('[Replays] Failed to get ghost:', error);
      return null;
    }
  },
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PathfindrAnalytics,
    CityLeaderboard,
    PathfindrAchievements,
    PathfindrChallenges,
    PathfindrReplays,
  };
}
