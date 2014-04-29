var fs = require('fs');
var path = require('path');
var utils = require('../utils');
var exec = utils.exec;

var logout = function(options) {
  var file = path.resolve(process.env.HOME, '.backlog.json');
  try {
    fs.unlinkSync(file);
    console.log('authentication data file deleted: ' + file);
  } catch (e) {
    // do nothing
  }
};

module.exports = function(commander) {
  commander.parse(process.argv);
  logout(commander);
};
