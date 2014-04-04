var fs = require('fs');
var commander = require('commander');
var path = require('path');

var getVersion = function() {
  var pkgPath = path.resolve(__dirname, '../package.json');
  var pkgData = fs.readFileSync(pkgPath);
  var pkg = JSON.parse(pkgData);
  var version = pkg.version;
  return version;
};

module.exports = function() {
  commander.version(getVersion());
  commander.parse(process.argv);
};
