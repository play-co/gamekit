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

exports.onBeforeBuild = function (devkitAPI, app, config, cb) {
  console.log('GAMEKIT PLUGIN ONBEFOREBUILD');

  // Generate gamekit plugin resources for android
  if (config.target === 'native-android') {
    console.log(app.manifest);
    var values;
    var gamekit = app.manifest.addons.gamekit.android;
    try {
      values = {
        integers: [ ],
        strings: [
          {
            name: 'app_id',
            value: gamekit.app_id
          }
        ]
      };

      var ladders = Object.keys(gamekit.ladders).map(function (ladder) {
        return { name: 'ladder_' + ladder, value: gamekit.ladders[ladder] };
      });
      values.strings.push.apply(values.strings, ladders);
    } catch (e) {
      console.error('Error generating GameKit android config');
      console.error('Make sure all required values are provided');
      return cb && cb(e);
    }

    var xml = generateResourceXML(values);
    console.log(xml);
    var dirname = path.join(__dirname, '..', 'android', 'res', 'values');
    var resourceFile = path.join(dirname, 'gamekit_app_values.xml');

    mkdirp.sync(dirname);
    fs.writeFile(resourceFile, xml, {encoding: 'utf8'}, function (err) {
      cb && cb(err);
    });
  } else {
    cb && cb();
  }

};
