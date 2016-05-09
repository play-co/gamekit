/**
 * The browser implementation of this doesn't really do anything. The methods
 * all exist so the code still runs. Maybe we can use DOM APIs to at least show
 * something is happening.
 */

exports = {
  getLeaderboards: function (cb) {
    logger.debug('{GameKit} getLeaderboards');
    setTimeout(function () {
      cb(null, []);
    });
  },
  getScores: function (opts, cb) {
    logger.debug('{GameKit} getScores');
    setTimeout(function () {
      cb(null, []);
    });
  },
  showAuthDialog: function () {
    logger.debug('{GameKit} showAuthDialog');
  },
  showGameCenter: function () {
    logger.debug('{GameKit} showGameCenter');
  },
  showNotificationBanner: function () {
    logger.debug('{GameKit} showNotificationBanner');
  },
  submitScore: function (opts) {
    logger.debug('{GameKit} submitScore');
  },
  unlockAchievement: function (opts) {
    logger.debug('{GameKit} unlockAchievement');
  },
  registerAuthHandler: function (cb) {
    // Instead of registering, just call it async
    setTimeout(function () {
      cb(null, {
        playerID: 'THIS_IS_BROWSER',
        displayName: 'Me'
      });
    });
  }
};

exports.authenticated = false;
