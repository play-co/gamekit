#import "PluginManager.h"
#define JSContext JSContext_GK
#define JSType JSType_GK
#include <GameKit/GameKit.h>
#undef JSContext
#undef JSType

@interface GameKitPlugin : GCPlugin { }

@end

