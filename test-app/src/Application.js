import ui.TextView as TextView;
import ui.ScrollView as ScrollView;
import GameKit;
import device;

var LEADERBOARD_ID = '';

var boundsWidth = 576;
var boundsHeight = 1024;
var baseWidth = device.screen.width * (boundsHeight / device.screen.height);
var baseHeight = boundsHeight;
var scale = device.screen.height / baseHeight;

var viewOpts = {
  backgroundColor: 'white',
  color: 'black',
  width: 300,
  height: 100,
};

var game = (function () {
  var score = Number(localStorage.getItem('score'));
  return Object.create(null, {
    score: {
      get: function () { return score; },
      set: function (val) {
        score = val;
        localStorage.setItem('score', score);
      }
    }
  });
})();

exports = Class(GC.Application, function () {

  this.initUI = function () {
    var self = this;
    this.view.style.scale = scale;
    this.view.style.width = baseWidth;
    this.view.style.height = baseHeight;
    this.tTitle = new TextView({
      superview: this.view,
      text: 'GameKit Test App',
      color: 'white',
      x: 0,
      y: 0,
      width: this.view.style.width,
      backgroundColor: '#333',
      height: 100,
      horizontalAlign: 'center'
    });

    this.bShowGameCenter = new TextView(merge({
      x: 20,
      y: 120,
      text: 'Show Game Center',
      superview: this.view
    }, viewOpts));

    this.bShowGameCenter.on('InputSelect', function () {
      GameKit.showGameCenter(function (err) {
        logger.log('showGameCenter callback; err:', !!err);
      });
    });

    this.bShowAuthDialog = new TextView(merge({
      x: 20,
      y: 240,
      text: 'Show Auth Dialog',
      superview: this.view
    }, viewOpts));

    this.bShowAuthDialog.on('InputSelect', function () {
      GameKit.showAuthDialog();
    });

    this.bShowBanner = new TextView(merge({
      x: 20,
      y: 360,
      text: 'Show Banner',
      superview: this.view
    }, viewOpts));

    this.bShowBanner.on('InputSelect', function () {
      GameKit.showNotificationBanner({
        title: 'Test Banner',
        message: 'This is a test message for the test banner.'
      });
    });

    this.svLeaderboards = new ScrollView({
      x: baseWidth / 2 + 20,
      y: 120,
      height: 500,
      width: baseWidth / 2 - 40,
      backgroundColor: '#333',
      scrollY: true,
      scrollX: false,
      superview: this.view
    });

    this.svLeaderboards.setScrollBounds({ minX: 0, maxX: 0, minY: 0, maxY: 0 });

    // Leaderboards button
    this.bGetLeaderboards = new TextView(merge({
      x: 20,
      y: 480,
      text: 'Print Leaderboards',
      superview: this.view
    }, viewOpts));

    this.bGetLeaderboards.on('InputSelect', function () {
      GameKit.getLeaderboards(function (err, leaderboards) {
        var list = err ? [err.message] : leaderboards;
        LEADERBOARD_ID = list[0].identifier;
        self.populateScrollView(list);
      });
    });

    this.tAuthStatus = new TextView(merge({
      x: 340,
      y: 120,
      text: 'Not Authed',
      superview: this.view,
      backgroundColor: 'black',
      autoFontSize: true,
      color: 'white',
      wrap: true
    }, viewOpts));

    this.bSubmitScore = new TextView(merge({
      x: 20,
      y: 600,
      text: 'Submit Score',
      superview: this.view
    }, viewOpts));

    this.bSubmitScore.onInputSelect = function () {
      game.score++;
      GameKit.submitScore({ leaderboard: LEADERBOARD_ID, score: game.score });

      self.populateScrollView(['Submitted score ' + game.score]);
    };

    this.bListScores = new TextView(merge({
      x: 20,
      y: 720,
      text: 'List Scores',
      superview: this.view
    }, viewOpts));

    this.bListScores.onInputSelect = function () {
      GameKit.getScores({leaderboard: LEADERBOARD_ID}, function (err, scores) {
        var list = err ? [err.message] : scores;
        self.populateScrollView(list);
      });
    };
  };

  this.populateScrollView = function (data) {
    var self = this;
    var y = 10;
    var height = 100;
    this.svLeaderboards.removeAllSubviews();
    data.forEach(function (obj) {
      if (typeof obj === 'object') {
        obj = JSON.stringify(obj);
      }
      this.svLeaderboards.addSubview(new TextView({
        text: obj,
        x: 10,
        y: 10,
        width: baseWidth / 2 - 60,
        height: 100,
        wrap: true,
        autoSizeFont: true,
        autoFontSize: true,
        backgroundColor: '#444',
        color: '#fff'
      }));
      y = y + 10 + height;
    }, this);
  };

  this.launchUI = function () {
    var self = this;
    GameKit.registerAuthHandler(function (err, player) {
      if (err) {
        self.tAuthStatus.setText('Auth Error:', err.message);
        return;
      }

      self.tAuthStatus.setText('ID:' + player.playerID);
    });
  };
});
