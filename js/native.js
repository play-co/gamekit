import .util;

/**
 * @typedef {Object} GKLeaderboard
 * @property {String} identifier
 * @property {String} title
 * @property {String} groupIdentifier
 */

/**
 * @typedef {Object} GKPlayer
 * @property {String} playerID
 * @property {String} displayName
 */

/**
 * @typedef {Object} GKScore
 * @property {Number} rank
 * @property {Number} value
 * @property {Number} date timestamp in milliseconds
 * @property {Number} context
 * @property {String} formattedValue
 * @property {GKPlayer} player
 */

// Wrapper for the GameKitPlugin
var GKPlugin = util.getNativeInterface('GameKitPlugin');

/**
 * Methods in the GameKitPlugin
 */
var nativeImpl = {

  /**
   * getLeaderboards
   *
   * @return {Array<GKLeaderboard>}
   */

  getLeaderboards: function nativeGetLeaderboards (cb) {
    GKPlugin.request('getLeaderboards', function (err, res) {
      if (err) { return cb(err); }
      return cb(null, res.leaderboards);
    });
  },

  /**
   * getScores
   *
   * @param {String} opts.leaderboard
   * @return {Array<GKScore>}
   */

  getScores: function nativeGetScores (opts, cb) {
    if (!opts.leaderboard || typeof opts.leaderboard !== 'string') {
      throw new Error('Must provide valid leaderboard');
    }

    GKPlugin.request('getScores', opts, function (err, res) {
      if (err) { return cb(err); }
      cb(null, res.scores);
    });
  },

  /**
   * Open the game center native UI
   */

  showGameCenter: function nativeShowGameCenter (cb) {
    return GKPlugin.request('showGameCenter', function (err, res) {
      cb && cb(err, res);
    });
  },

  /**
   * showAuthDialog
   *
   * Prompt a user to log in to game center.
   */

  showAuthDialog: function nativeShowAuthDialog () {
    return GKPlugin.notify('showAuthDialog');
  },

  /**
   * showNotificationBanner
   *
   * Show a native game center banner
   *
   * @param {String} opts.title
   * @param {String} opts.message
   */

  showNotificationBanner: function nativeShowNotificationBanner (opts) {
    return GKPlugin.notify('showNotificationBanner', opts);
  },

  /**
   * Submit a score to a leaderboard
   *
   * @param {String} opts.leaderboard
   * @param {Number} opts.score
   */

  submitScore: function nativeSubmitScore (opts) {
    if (!opts.leaderboard || (typeof opts.leaderboard !== 'string')) {
      throw new Error('must provide valid leaderboard id');
    }

    if (!opts.score || (typeof opts.score !== 'number')) {
      throw new Error('must provide valid score');
    }

    GKPlugin.notify('submitScore', opts);
  },

  /**
   * Update progress on an achievement
   *
   * @param {String} opts.achievement
   */

  unlockAchievement: function nativeUnlockAchievement (opts) {
    if (!opts.achievement || (typeof opts.achievement !== 'string')) {
      throw new Error('must provide valid achievement id');
    }

    GKPlugin.notify('unlockAchievement', opts);
  },

  /**
   * registerAuthHandler
   *
   * The callback is called with (err, res) where res might be a
   * @link{GKPlayer}.
   */

  registerAuthHandler: function nativeRegisterAuthHandler (cb) {
    nativeImpl.authHandler = cb;
  }
};

/**
 * The function passed to registerAuthHandler is stored on the implementation
 * as authHandler.
 */

nativeImpl.authHandler = function (err, player) {
  logger.warn('Default auth handler called', err, player);
};

/**
 * Subscribe to plugin events. auth:success and auth:failure both go to the
 * authHandler function.
 */

GKPlugin.subscribe('auth:success', function (res) {
  nativeImpl.authHandler(null, res.player);
});

GKPlugin.subscribe('auth:failure', function (res) {
  nativeImpl.authHandler(res.error);
});

/**
 * GameKit properties
 */

Object.defineProperties(nativeImpl, {

  /**
   * authenticated
   *
   * User's game center authentication status
   * @returns {bool}
   */

  authenticated: {
    get: function () {
      return !!GKPlugin.notify('authenticated').authenticated;
    }
  }

});

exports = nativeImpl;
