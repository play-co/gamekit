Devkit GameKit Plugin
=====================

Game Closure devkit support for iOS Game Center (GameKit) and Google Play
Game Services for Android

![screen shot 2015-02-05 at 9 15 02 pm](https://cloud.githubusercontent.com/assets/4285147/6074938/1a71a85a-ad7e-11e4-850f-763c24280f0f.png)

## Getting Started

### Install the plugin
`devkit install https://github.com/gameclosure/gamekit`.

### Integrate GameKit

```js
// The import statement for GameKit
import GameKit;

// Need to register an auth handler somewhere in your app. Note that this is a
// handler, not a callback, and it may be called multiple times as
// connections/disconnects occur.
GameKit.registerAuthHandler(function (err, player) {
  // `err` will be set when user declines to game center. You should not attempt
  // to use any of the other methods.
  //
  // `player` will have playerID and displayName when the user is logger in.
});

// Try to log the user in if they are not authenticated
if (!GameKit.authenticated) {
  // This is generally good to do on startup. If the player signs in, your auth
  // handler will run and you can start using other GameKit APIs.
  GameKit.showAuthDialog();
}
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

**NOTICE:** This feature is only supported on iOS. There is no equivalent on
Android using Game Services.

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

## Android Testing

1. Set up your application on Google Play
2. Set up game services
3. Make sure to add release and debug client IDs to the game services app.
4. Add ladders, achievements, etc.
5. Put configuration into `manifest.json`. A sample of this config is below.

```json
{
  "addons": {
    "gamekit": {
      "android": {
        "app_id": "1234567890",
        "ladders": {
          "distance": "CgjI6OjVlJ4UEAIQAg"
        }
      }
    }
  }
}
```

## TODO

- iOS should probably have some sort of `ladders` map to match Android so that
  the application can always refer to ladders by the same ID regardless of
  platform.
- Achievements
- Challenges
- Matchmaking
- Turnbased
