package com.tealeaf.plugin.plugins;

import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.PackageManager.NameNotFoundException;
import com.tealeaf.logger;
import com.tealeaf.TeaLeaf;
import com.tealeaf.EventQueue;
import com.tealeaf.plugin.IPlugin;
import com.tealeaf.plugin.PluginManager;
import java.io.*;
import org.json.JSONObject;
import org.json.JSONArray;
import org.json.JSONException;
import java.net.URI;
import android.app.Activity;
import android.content.Intent;
import android.content.Context;
import android.util.Log;
import android.os.Bundle;
import android.content.pm.ActivityInfo;
import android.content.pm.PackageManager;
import android.content.pm.PackageManager.NameNotFoundException;
import android.content.SharedPreferences;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Iterator;
import java.util.ArrayList;
import java.util.List;
import java.util.Arrays;
import java.util.Date;
import java.io.StringWriter;
import java.io.PrintWriter;

import android.net.Uri;
import android.view.Window;
import android.view.WindowManager;

import android.content.IntentSender;

import java.util.Set;

// Plugin Imports
import com.google.android.gms.common.api.GoogleApiClient;
import com.google.android.gms.common.api.PendingResult;
import com.google.android.gms.common.api.ResultCallback;
import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.games.leaderboard.Leaderboards.*;
import com.google.android.gms.games.leaderboard.LeaderboardVariant;
import com.google.android.gms.games.GamesActivityResultCodes;
import com.google.android.gms.games.leaderboard.*;
import com.google.android.gms.games.Player;
import com.google.android.gms.games.GamesStatusCodes;
import com.google.android.gms.games.Games;
import com.google.android.gms.*;

public class GameKitPlugin implements IPlugin,
       GoogleApiClient.ConnectionCallbacks,
       GoogleApiClient.OnConnectionFailedListener {

  static String PLUGIN_NAME = "GameKitPlugin";
  private static Integer GKP_AUTH_REQUEST = 11337;
  private static Integer GKP_SHOW_LEADERBOARD = 11338;

  Activity _activity;
  Context _context;

  GoogleApiClient _client;
  Player _player = null;
  boolean _authed = false;
  boolean _triedSignin = false;
  ConnectionResult _loginConnection = null;
  Integer _showGameCenterRequest = null;

  // ---------------------------------------------------------------------------
  // JavaScript interface
  // ---------------------------------------------------------------------------

  public void getLeaderboards (JSONObject req, Integer requestId) {
    final Integer reqId = requestId;
    log("getLeaderboards");
    PendingResult<LeaderboardMetadataResult> result =
      Games.Leaderboards.loadLeaderboardMetadata(_client, false);

    result.setResultCallback(new ResultCallback<LeaderboardMetadataResult>() {
      @Override
      public void onResult (LeaderboardMetadataResult res) {
        if (res.getStatus().isSuccess()) {
          LeaderboardBuffer buf = res.getLeaderboards();

          // Build a JSONArray response
          JSONArray leaderboards = new JSONArray();
          for (Leaderboard leaderboard : buf) {
            leaderboards.put(toJSON(leaderboard));
          }

          JSONObject out = new JSONObject();
          try {
            out.put("leaderboards", leaderboards);
          } catch (JSONException e) {}
          buf.release();
          PluginManager.sendResponse(out, null, reqId);
        } else {
          JSONObject err = new JSONObject();
          try {
            err.put("error", "Failed to fetch leaderboards");
          } catch (JSONException e) {
            // pass
          }
          PluginManager.sendResponse(null, err.toString(), reqId);
        }
      }
    });
  }

  public void showGameCenter (JSONObject req, Integer reqId) {
    if (_showGameCenterRequest == null) {
      _showGameCenterRequest = reqId;
      Intent intent = Games.Leaderboards.getAllLeaderboardsIntent(_client);
      _activity.startActivityForResult(intent, GKP_SHOW_LEADERBOARD);
    } else {
      String err = "{\"error\": \"Already showing game center\"}";
      PluginManager.sendResponse(null, err, reqId);
    }
  }

  // Sync interface follows
  public void showAuthDialog (JSONObject req) {
    // Open sign-in prompt
    if (_authed) {
      JSONObject res = new JSONObject();
      try { res.put("player", toJSON(_player));} catch (JSONException e) {}

      PluginManager.sendEvent("auth:success", PLUGIN_NAME, res);
    } else if (!_loginConnection.isSuccess() && !_triedSignin) {
      _triedSignin = true;
      try {
        _loginConnection.startResolutionForResult(_activity, GKP_AUTH_REQUEST);
      } catch (IntentSender.SendIntentException e) {
        log(e);
      }
    }
  }

  public void showNotificationBanner (JSONObject req) {
    // TODO
  }

  public void submitScore (JSONObject req) {
    String leaderboard = req.optString("leaderboard", "");
    long score = req.optLong("score", 0);
    Games.Leaderboards.submitScore(_client, leaderboard, score);
  }

  public void getScores (JSONObject req, final Integer requestId) {
    String leaderboard = req.optString("leaderboard", "");
    Integer maxResults = req.optInt("maxResults", 10);

    PendingResult<LoadScoresResult> pending =
      Games.Leaderboards.loadTopScores(
        _client,
        leaderboard,
        LeaderboardVariant.TIME_SPAN_ALL_TIME,
        LeaderboardVariant.COLLECTION_SOCIAL,
        maxResults
      );

    pending.setResultCallback(new ResultCallback<LoadScoresResult>() {
      @Override
      public void onResult (LoadScoresResult scoresResult) {
        if (!scoresResult.getStatus().isSuccess()) {
          String err = "{\"error\": \"Error loading scores\"}";
          PluginManager.sendResponse(null, err, requestId);
          return;
        }

        LeaderboardScoreBuffer buf = scoresResult.getScores();
        JSONObject res = new JSONObject();
        JSONArray scores = new JSONArray();
        try {
          res.put("scores", scores);
        } catch (JSONException e) { /* pass */ }

        for (LeaderboardScore score : buf) {
          scores.put(toJSON(score));
        }

        PluginManager.sendResponse(res, null, requestId);
        buf.release();
      }
    });

  }

  public void unlockAchievement (JSONObject req) {
    String achievement = req.optString("achievement", "");
    Games.Achievements.unlock(_client, achievement);
  }

  public String authenticated (JSONObject req) {
    JSONObject obj = new JSONObject();
    try {
      obj.put("authenticated", _authed);
    } catch (JSONException e) {
      // pass
    }

    return obj.toString();
  }

  // ---------------------------------------------------------------------------
  // GAPI callbacks/handlers
  // ---------------------------------------------------------------------------
  @Override
  public void onConnected(Bundle connectionHint) {
    log("onConnected");
    _authed = true;

    // Get player
    _player = Games.Players.getCurrentPlayer(_client);

    // build response
    JSONObject res = new JSONObject();
    try { res.put("player", toJSON(_player));} catch (JSONException e) {}

    PluginManager.sendEvent("auth:success", PLUGIN_NAME, res);
  }

  @Override
  public void onConnectionSuspended(int i) {
    log("onConnectionSuspended");
    // Notify JS
    _authed = false;
    JSONObject res = connectionFailedResponse();
    PluginManager.sendEvent("auth:failure", PLUGIN_NAME, res);

    // Attempt to reconnect
    _client.connect();
  }

  @Override
  public void onConnectionFailed(ConnectionResult connectionResult) {
    log("onConnectionFailed", connectionResult); // DEBUG

    // Notify JS
    JSONObject res = connectionFailedResponse();
    _authed = false;
    PluginManager.sendEvent("auth:failure", PLUGIN_NAME, res);

    _loginConnection = connectionResult;
  }

  // ---------------------------------------------------------------------------
  // Util
  // ---------------------------------------------------------------------------

  private JSONObject connectionFailedResponse() {
    String message = "Cannot connect to play services at this time";
    JSONObject err = new JSONObject();
    try { err.put("error", message); } catch (JSONException e) {}
    return err;
  }

  private static JSONObject toJSON(Player player) {
    JSONObject p = new JSONObject();
    if (player == null) { return p; }

    try {
      p.put("playerID", player.getPlayerId());
      p.put("displayName", player.getDisplayName());
    } catch (JSONException e) { }

    return p;
  }

  private static JSONObject toJSON(LeaderboardScore score) {
    JSONObject s = new JSONObject();

    try {
      s.put("rank", score.getRank());
      s.put("value", score.getRawScore());
      s.put("date", score.getTimestampMillis());
      s.put("context", score.getScoreTag());
      s.put("formattedValue", score.getDisplayScore());
      s.put("player", toJSON(score.getScoreHolder()));
    } catch (JSONException e) {
      log("Error generating score JSON");
    }

    return s;
  }

  private static JSONObject toJSON(Leaderboard leaderboard) {
    JSONObject json = new JSONObject();

    try {
      json.put("identifier", leaderboard.getLeaderboardId());
      json.put("title", leaderboard.getDisplayName());
      json.put("groupIdentifier", "");
    } catch (JSONException e) {
      log("Error generating score JSON");
    }

    return json;
  }

  public static void log(Object... args) {
    Object[] newArgs = new Object[args.length + 1];
    newArgs[0] = "{" + PLUGIN_NAME + "}";
    System.arraycopy(args, 0, newArgs, 1, args.length);
    logger.log(newArgs);
  }

  // ---------------------------------------------------------------------------
  // Plugin Interface Methods
  // ---------------------------------------------------------------------------

  public void onCreateApplication(Context applicationContext) {
    _context = applicationContext;
  }

  public void onCreate(Activity activity, Bundle savedInstanceState) {
    _activity = activity;

    // GoogleApiClient
    _client = new GoogleApiClient.Builder(_activity)
      .addConnectionCallbacks(this)
      .addOnConnectionFailedListener(this)
      .addApi(Games.API).addScope(Games.SCOPE_GAMES) // just need games api
      .build();

    PackageManager manager = _activity.getPackageManager();

    try {
      Bundle meta = manager.getApplicationInfo(
        _activity.getPackageName(),
        PackageManager.GET_META_DATA
      ).metaData;

    } catch (Exception e) {
      log("Exception on start:", e.getMessage());
    }

  }

  public void onResume() {
  }

  public void onStart() {
    _client.connect();
  }

  public void onPause() {

  }

  public void onStop() {
    _client.disconnect();
  }

  public void onDestroy() {

  }

  public void onNewIntent(Intent intent) {

  }

  public void setInstallReferrer(String referrer) {

  }

  @Override
  public void onActivityResult(Integer request, Integer result, Intent data) {
    if (request.equals(GKP_AUTH_REQUEST)) {
      if (result.equals(Activity.RESULT_OK)) {
        log("Sign-in successful; connecting to GameServices");
        _client.connect();
      } else {
        String message;
        switch (result.intValue()) {
          case GamesActivityResultCodes.RESULT_APP_MISCONFIGURED:
            message = "the game is not properly configured " +
              "to access the Games service";
            break;
          default:
            message = result.toString();
        }

        log("Error during sign-in:", message);
      }
    } else if (request.equals(GKP_SHOW_LEADERBOARD)) {
      if (_showGameCenterRequest != null) {
        Integer requestId = _showGameCenterRequest;
        _showGameCenterRequest = null;
        PluginManager.sendResponse(null, null, requestId);
      }
    }
  }

  public boolean consumeOnBackPressed() {
    return true;
  }

  public void onBackPressed() {
  }
}
