var configTools = jsio('import GameKit.config');

var config = {
  ios: {
    ladders: {
      kiwi_distance: {
        id: 'kiwi_distance'
      }
    }
  },
  android: {
    app_id: '1234987',
    ladders: {
      kiwi_distance: {
        name: 'leaderboard_distance',
        id: 'foo_leaderboard'
      }
    },
    achievements: {
      achievement_run_100m: {
        name: 'achievement_run_100m',
        id: 'foobarbaz1'
      },
      achievement_run_200m: {
        name: 'achievement_run_200m',
        id: 'foobarbaz2'
      },
      achievement_run_500m: {
        name: 'achievement_run_500m',
        id: 'foobarbaz3'
      },
      achievement_run_1000m: {
        name: 'achievement_run_1000m',
        id: 'foobarbaz4'
      },
      achievement_run_5000m: {
        name: 'achievement_run_5000m',
        id: 'foobarbaz5'
      },
      achievement_run_10000m: {
        name: 'achievement_run_10000m',
        id: 'foobarbaz6'
      }
    }
  }
};

describe('GameKit Config Tools', function () {
  describe('#reverseMap', function () {
    it('returns a reverse lookup table with primitives', function () {
      var obj = { a: 1, b: 2, c: 'arst' };
      var rev = configTools.reverseMap(obj);
      for (var key in obj) {
        assert(obj[key] in rev);
      }
    });

    it('returns a revers lookup table when values are objects', function () {
      var obj = { a: {id: 'foo'}, b: {id: 'bar'}, c: {id: 'baz'}};
      var rev = configTools.reverseMap(obj, 'id');
      for (var key in obj) {
        assert(obj[key].id in rev);
      }
    });
  });

  describe('#parse', function () {
    var parsed;
    beforeEach(function () {
      parsed = configTools.parse(config, 'android');
      // iOS would be fine too if there was stuff in it. The functionality is
      // equivalent.
    });

    describe('ladder.provider', function () {
      it('returns the provider ladder id given the ref id', function () {
        assert.equal(config.android.ladders.kiwi_distance.id,
                      parsed.ladder.provider('kiwi_distance'));
      });
    });
    describe('ladder.reference', function () {
      it('returns the reference ladder id given provider id', function () {
        var providerID = config.android.ladders.kiwi_distance.id;
        assert.equal('kiwi_distance', parsed.ladder.reference(providerID));
      });
    });

    describe('achievement.provider', function () {
      it('returns the provider achievement id given the ref id', function () {
        assert.equal(config.android.achievements.achievement_run_100m.id,
                      parsed.achievement.provider('achievement_run_100m'));
      });
    });
    describe('achievement.reference', function () {
      it('returns the reference achievement id given provider id', function () {
        var providerID = config.android.achievements.achievement_run_100m.id;
        assert.equal('achievement_run_100m',
                     parsed.achievement.reference(providerID));
      });
    });
  });
});
