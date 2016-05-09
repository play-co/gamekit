#import "GameKitPlugin.h"
#import "platform/log.h"

#define JSContext JSContext_GK
#define JSType JSType_GK
#  include <GameKit/GameKit.h>
#undef JSContext
#undef JSType


static bool gameCenterEnabled = false;

static UIViewController* authViewController = nil;
static UIViewController* rootViewController = nil;

static NSNumber* requestIdForActiveUI = nil;
static NSArray* _leaderboards = nil;

@implementation GameKitPlugin

// -----------------------------------------------------------------------------
// EXPOSED PLUGIN METHODS
// -----------------------------------------------------------------------------

- (void) registerAuthHandler {
    GKLocalPlayer *localPlayer = [GKLocalPlayer localPlayer];
    localPlayer.authenticateHandler = ^(UIViewController *viewController, NSError *error) {
        if (error != nil) {
            NSLOG(@"{GameKitPlugin} Error %@", error.localizedDescription);
            return;
        }

        // gameCenterEnabled is false until authentication succeeds
        if (viewController != nil) {
            gameCenterEnabled = false;

            // Save ref to auth view controller
            authViewController = viewController;
        } else if (localPlayer.isAuthenticated) {
            gameCenterEnabled = true;
           [[PluginManager get] dispatchEvent:@"auth:success" forPlugin:self withData:@{
               @"player": @{
                   @"playerID": localPlayer.playerID,
                   @"displayName": localPlayer.displayName
               }
           }];
        } else {
            gameCenterEnabled = false;
           [[PluginManager get] dispatchEvent:@"auth:failure" forPlugin:self withData:@{
               @"error": @{
                    @"message": @"User declined auth"
               }
           }];
        }
     };
}

- (void) showGameCenter:(NSDictionary*)data withRequestId:(NSNumber*) requestId {
    if (!gameCenterEnabled) {
        [[PluginManager get] dispatchJSResponse:nil withError:@{
            @"message": @"Game Center unavailable because player is not logger in"
        } andRequestId:requestId];
        return;
    }

    GKGameCenterViewController* gameCenterController = [[GKGameCenterViewController alloc] init];
    if (gameCenterController != nil) {
        requestIdForActiveUI = requestId;
        gameCenterController.gameCenterDelegate = (id)self;
        [rootViewController presentViewController:gameCenterController animated:YES completion:nil];
    } else {
        [[PluginManager get] dispatchJSResponse:nil withError:@{
            @"message": @"Error creating view controller"
        } andRequestId:requestId];
    }
}



- (void) getLeaderboards:(NSDictionary*)opts withRequestId:(NSNumber*) requestId {
    [GKLeaderboard loadLeaderboardsWithCompletionHandler:^(NSArray *leaderboards, NSError *error) {
        if (error != nil) {
            [[PluginManager get] dispatchJSResponse:nil
                                          withError:@{@"message": error.localizedDescription}
                                       andRequestId:requestId];
        }
        
        // Create serializeable list
        NSMutableArray* res = [[NSMutableArray alloc] init];
        for (GKLeaderboard* lb in leaderboards) {
            NSMutableDictionary *tmp = [[NSMutableDictionary alloc] init];
            tmp[@"identifier"] = lb.identifier;
            tmp[@"title"] = lb.title;
            if (lb.groupIdentifier != nil) {
                tmp[@"groupIdentifier"] = lb.groupIdentifier;
            } else {
                tmp[@"groupIdentifier"] = @"";
            }
            [res addObject:tmp];
        }

        _leaderboards = leaderboards;

        [[PluginManager get] dispatchJSResponse:@{@"leaderboards":res}
                                      withError:nil
                                   andRequestId:requestId];
    }];
}

- (void) getScores:(NSDictionary*)opts withRequestId:(NSNumber*)requestId {
    GKLeaderboard* leaderboardRequest = [[GKLeaderboard alloc] init];
    if (leaderboardRequest == nil) {
        [[PluginManager get] dispatchJSResponse:nil withError:@{
            @"message": @"Something went horribly wrong"
        } andRequestId:requestId];
        return;
    }

    // TODO allow opts to specify playerScope, timeScope, range

    leaderboardRequest.playerScope = GKLeaderboardPlayerScopeFriendsOnly;
    leaderboardRequest.timeScope = GKLeaderboardTimeScopeAllTime;
    leaderboardRequest.identifier = opts[@"leaderboard"];
    leaderboardRequest.range = NSMakeRange(1, 10);

    [leaderboardRequest loadScoresWithCompletionHandler:^(NSArray *scores, NSError *error) {
        if (error != nil) {
            [[PluginManager get] dispatchJSResponse:nil withError:@{
                @"message": error.localizedDescription
            } andRequestId:requestId];
            return;
        }

        NSMutableArray* res = [[NSMutableArray alloc] init];
        for (GKScore* score in scores) {
            NSMutableDictionary* _score = [[NSMutableDictionary alloc] init];
            _score[@"rank"] = [NSNumber numberWithInteger:score.rank];
            _score[@"value"] = [NSNumber numberWithInteger:score.value];
            _score[@"formattedValue"] = score.formattedValue;
            _score[@"date"] = [self numberWithNSDate:score.date];
            _score[@"context"] = [NSNumber numberWithInteger:score.context];
            _score[@"player"] = @{
                @"playerID": score.player.playerID,
                @"displayName": score.player.displayName
            };

            [res addObject:_score];
        }

        [[PluginManager get] dispatchJSResponse:@{@"scores": res}
                                      withError:nil
                                   andRequestId:requestId];
    }];
}

// -----------------------------------------------------------------------------
// EXPOSED PLUGIN SYNCHRONOUS METHODS (with return value)
// -----------------------------------------------------------------------------

- (NSDictionary*) authenticatedWithReturnValue:(NSDictionary*)opts {
    GKLocalPlayer* localPlayer = [GKLocalPlayer localPlayer];
    NSDictionary* res = @{
        @"authenticated": [NSNumber numberWithBool:localPlayer.authenticated]
    };
    return res;
}

// -----------------------------------------------------------------------------
// EXPOSED PLUGIN SYNCHRONOUS METHODS
// -----------------------------------------------------------------------------

- (void) showNotificationBanner:(NSDictionary*)opts {
    NSString* title = opts[@"title"];
    NSString* message = opts[@"message"];

    [GKNotificationBanner showBannerWithTitle:title
                                      message:message
                            completionHandler:nil];
}

- (void) submitScore:(NSDictionary*)opts {
    GKScore *score = [[GKScore alloc] initWithLeaderboardIdentifier:opts[@"leaderboard"]];
    score.value = [opts[@"score"] longLongValue];
    score.context = 0;

    NSArray* scores = @[score];

    // TODO we should probably provide a completion handler so we can
    // alert devs when their ladder is wrong
    [GKScore reportScores:scores withCompletionHandler:nil];
}

- (void) unlockAchievement:(NSDictionary*)opts {
    GKAchievement *achievement = [[[GKAchievement alloc] initWithIdentifier:opts[@"achievement"]] autorelease];
    if (achievement)
    {
        achievement.percentComplete = 100; //don't manage percent 
        [achievement reportAchievementWithCompletionHandler: nil];
    }
}

// -----------------------------------------------------------------------------
// Helper functions
// -----------------------------------------------------------------------------

- (NSNumber*) numberWithNSDate:(NSDate*)date {
    return [NSNumber numberWithDouble:floor([date timeIntervalSince1970] * 1000)];
}

- (void) showAuthDialog:(NSDictionary*)data {
    if (authViewController == nil) {
        NSLOG(@"authViewController is nil; aborting showAuthDialog");
        return;
    }
    [rootViewController presentViewController:authViewController animated:YES completion:nil];
}

- (void) gameCenterViewControllerDidFinish:(GKGameCenterViewController*) viewController {
    [rootViewController dismissViewControllerAnimated:YES completion:nil];
    if (requestIdForActiveUI != nil) {
        [[PluginManager get] dispatchJSResponse:nil withError: nil andRequestId:requestIdForActiveUI];
    }
    requestIdForActiveUI = nil;
}

// -----------------------------------------------------------------------------
// GC PLUGIN INTERFACE
// -----------------------------------------------------------------------------

- (void) initializeWithManifest:(NSDictionary *)manifest appDelegate:(TeaLeafAppDelegate *)appDelegate {
    rootViewController = [[[UIApplication sharedApplication] keyWindow] rootViewController];
    NSLOG(@"{GameKitPlugin} initializeWithManifest");
    [self registerAuthHandler];
    [[PluginManager get] dispatchEvent:@"GameKitPluginReady"
                             forPlugin:self
                              withData:@{@"status": @"OK"}];
}

- (void) applicationWillTerminate:(UIApplication *)app {

}

- (void) applicationDidBecomeActive:(UIApplication *)app {

}

- (void) handleOpenURL:(NSURL *)url sourceApplication:(NSString *)sourceApplication {
}

// The plugin must call super dealloc.
- (void) dealloc {
  [super dealloc];
}

// The plugin must call super init.
- (id) init {
  self = [super init];
  if (!self) {
    return nil;
  }

  return self;
}


@end





