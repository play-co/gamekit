import device;
import lib.PubSub;
import lib.Callback;

import .native;
import .browser;

/**
 * The devkit GameKit interface.
 * @constructor GameKit
 */
function GameKit () {
}

/**
 * Initialize the game kit plugin
 */

GameKit.prototype.init = function (opts) {

};

/**
 * Define plugin methods
 */

var methods = [
    'getLeaderboards',
    'getScores',
    'showAuthDialog',
    'showGameCenter',
    'showNotificationBanner',
    'submitScore',
    'unlockAchievement',
    'registerAuthHandler'
];

// Proxy methods to implementation
methods.forEach(function (method) {
    GameKit.prototype[method] = function gameKitMethodProxy () {
        return this.impl[method].apply(this.impl, arguments);
    };
});

var properties = [
    'authenticated'
];

propertiesObject = {};
properties.forEach(function (name) {
    propertiesObject[name] = {
        get: function () {
            return this.impl[name];
        }
    };
});

propertiesObject.impl = {
  get: function () {
    if (device.isMobileNative) {
      return native;
    }
    return browser;
  }
};

exports = Object.create(GameKit.prototype, propertiesObject);
