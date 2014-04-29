var fs = require('fs');
var path = require('path');
var utils = require('../utils');
var authenticate = utils.authenticate;
var client = utils.client;

var login = function(options) {
  var auth = authenticate(options);
  client(options).getProjects()
  .then(function() {
    var file = path.resolve(process.env.HOME, '.backlog.json');
    try {
      fs.writeFileSync(file, JSON.stringify(auth));
      console.log('authentication data file created: ' + file);
    } catch (e) {
      console.error(e);
    }
  })
  .catch(function(e) {
    console.error(' error: invalid authentication data');
    process.exit(1);
  });
};

module.exports = function(commander) {
  commander.parse(process.argv);
  login(commander);
};
