var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');

function generateResourceXML (values) {
  return '' +
    '<?xml version="1.0" encoding="utf-8"?>\n' +
    '<resources>' +

    values.integers.map(function (desc) {
      return '\n\t<integer name="' + desc.name + '">' +
        desc.value + '</integer>';
    }).join('') +

    values.strings.map(function (desc) {
      return '\n\t<string name="' + desc.name + '">' +
        desc.value.toString() + '</string>';
    }).join('') +

    '\n</resources>';
}

/**
 * GameKit.build#onBeforeBuild
 *
 * Write a <resources> XML section with config for android.
 */


exports.onBeforeBuild = function (devkitAPI, app, config, cb) {
  var log = console.log.bind(null, '{GameKit} onBeforeBuild -');
  log('starting');

  if (config.target === 'native-android') {
    console.log(app.manifest);
    var values;
    var gk = app.manifest.addons.gamekit.android;
    try {
      values = {
        integers: [ ],
        strings: [
          {
            name: 'app_id',
            value: gk.app_id
          }
        ]
      };
      var strings = values.strings;

      // add configured ladders to list of string values
      var ladders = Object.keys(gk.ladders);
      strings.push.apply(strings, ladders.map(function (ladder) {
        return { name: gk.ladders[ladder].name, value: gk.ladders[ladder].id };
      }));

      // Add configured achievements to list of string values
      var achievements = Object.keys(gk.achievements);
      strings.push.apply(strings, achievements.map(function (achievement) {
        return {
          name: gk.achievements[achievement].name,
          value: gk.achievements[achievement].id
        };
      }));

    } catch (e) {
      console.error('\n\nError generating GameKit android config');
      console.error('Make sure all required values are provided\n\n');
      return cb && cb(e);
    }

    var xml = generateResourceXML(values);
    console.log(xml);
    var dirname = path.join(__dirname, '..', 'android', 'res', 'values');
    var resourceFile = path.join(dirname, 'gamekit_app_values.xml');

    mkdirp.sync(dirname);
    fs.writeFile(resourceFile, xml, {encoding: 'utf8'}, function (err) {
      cb(err);
    });
  } else {
    cb(null);
  }

};
