Devkit GameKit Plugin
=====================

Game Closure devkit support for iOS Game Center (GameKit) and Android
Game Services

![screen shot 2015-02-05 at 9 15 02 pm](https://cloud.githubusercontent.com/assets/4285147/6074938/1a71a85a-ad7e-11e4-850f-763c24280f0f.png)

## Getting Started

### Install the plugin
`devkit install https://github.com/gameclosure/gamekit-plugin`.

### Integrate GameKit

```js
// The import statement for GameKit
import GameKit;

// Need to register an auth handler somewhere in your app
GameKit.registerAuthHandler(function (err, player) {
  // `err` will be set when user declines to game center. You should not attempt
  // to use any of the other methods.
  //
  // `player` will have playerID and displayName when the user is logger in.
});

// Try to log the user in if they are not authenticated
if (!GameKit.authenticated) {
  GameKit.showAuthDialog();
}

// Hopefully you are authed now and can start posting scores / etc.
```

## API

Check the file [js/native.js](js/native.js) for param/return types on the
interfaces discussed here. Methods and properties are enumerated below.

### Methods

#### getLeaderboards

Return a list of leaderboards configured for your application

#### getScores

Return a list of scores for a given leaderboard

#### showAuthDialog

Show the Game Center auth dialog if the user isn't authed already.

#### showGameCenter

Open up the native game center user interface

#### showNotificationBanner

Show a game center notification

#### submitScore

Submit a single score to a single leaderboard

#### registerAuthHandler

Set a function to be called when the user's auth status changes.

### Properties

#### authenticated

Whether the user is currently authenticated with game center

## iOS Testing

**Important!** Read the official docs about testing your game. It's only 3
paragraphs and quite helpful.

After adding game center entitlements, you can go to the iOS simulator
or your iDevice's settings and set sandbox mode under **Settings > Game
Center**. You need to be logged into game center and reinstall your app to
enable it.

## TODO

The GameKit plugin is very early in development and many features are not
supported.

### Android

- All

### iOS

- Achievements
- Challenges
- Matchmaking
- Turnbased
