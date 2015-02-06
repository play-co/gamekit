import lib.PubSub;

/**
 * get wrapped functions for native plugin
 *
 * @param {string} pluginName
 * @return {NativeInterface<pluginName>}
 */

function getNativeInterface (pluginName, opts) {
  opts = opts || {};
  var events = new lib.PubSub();
  var subscribedTo = {};
  GC.plugins.register(pluginName, events);
  return {
    notify: function sendNativeEvent (event, data) {
      data = JSON.stringify(data || {});
      var res = NATIVE.plugins.sendEvent(pluginName, event, data);
      if (typeof res === 'string') {
        try {
            res = JSON.parse(res);
        } catch (e) {}
      }
      return res;
    },
    request: function sendNativeRequest (event, data, cb) {
      logger.log('[js] {' + pluginName + '} sending request', event);
      logger.log('\tdata:', JSON.stringify(data, null, '\t'));

      if (typeof data === 'function') {
        cb = data;
        data = {};
      }

      var fn = opts.noErrorback ? function ignoreErrorParameter (err, res) {
        cb(res);
      } : cb;

      // To make life easy in android, we handle optional string results.
      var unpackResults = function unpackResults (err, res) {
        if (err) {
          if (typeof err === 'string') {
            try {
              err = JSON.parse(err);
            } catch (e) {
              // pass
            }
          }
        }

        if (typeof res === 'string') {
          try {
            res = JSON.parse(res);
          } catch (e) {
            // pass
          }

          if (res === '') {
            res = void 0;
          }
        }

        fn(err, res);
      };

      NATIVE.plugins.sendRequest(pluginName, event, data, unpackResults);
    },
    subscribe: function onNativeEvent (event, cb) {
      function tryParseEventData (res) {
        if (res && typeof res === 'string') {
          try {
            res = JSON.parse(res);
          } catch (e) {
             // pass
          }
        }
        cb(res);
      }
      cb.__parser = tryParseEventData;
      events.subscribe(event, tryParseEventData);
    },
    unsubscribe: function unsubscribeFromNativeEvent (event, cb) {
      events.unsubscribe(event, cb.__parser);
    }
  };
}

exports.getNativeInterface = getNativeInterface;
