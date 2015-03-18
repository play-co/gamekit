function reverseMap (obj, key) {
  var reverse = {};
  for (var orig in obj) {
    var val = obj[orig];

    // Handle object members or primitive members
    if (val.toString() !== '[object Object]') {
      reverse[val] = orig;
    } else {
      reverse[val[key]] = orig;
    }
  }

  return reverse;
}

exports.reverseMap = reverseMap;

exports.parse = function (config, platform) {
  var pconf = config[platform];
  if (!pconf) {
    throw new Error('No config defined for platform ' + platform);
  }

  var reverse = {
    ladders: reverseMap(pconf.ladders, 'id'),
    achievements: reverseMap(pconf.achievements, 'id')
  };

  return {
    ladder: {
      provider: function (referenceID) {
        return pconf.ladders[referenceID].id;
      },
      reference: function (providerID) {
        return reverse.ladders[providerID];
      }
    },
    achievement: {
      provider: function (referenceID) {
        return pconf.achievements[referenceID].id;
      },
      reference: function (providerID) {
        return reverse.achievements[providerID];
      }
    }
  };
};
