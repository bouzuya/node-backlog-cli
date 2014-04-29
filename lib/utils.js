var fs = require('fs');
var path = require('path');
var backlogApi = require('backlog-api');

var format = function(obj, format, defaultFormat) {
  var properties = (format || defaultFormat).split(',');
  var result = properties.map(function(property) {
    return obj[property];
  }).join('\t');
  return result;
};

var authenticate = function(options) {
  // from env
  var spaceId = process.env.BACKLOG_SPACE_ID;
  var username = process.env.BACKLOG_USERNAME;
  var password = process.env.BACKLOG_PASSWORD;

  // from file
  var file = path.resolve(process.env.HOME, '.backlog.json');
  try {
    var data = fs.readFileSync(file, 'utf8');
    var json = JSON.parse(data);
    spaceId = json.spaceId ? json.spaceId : spaceId;
    username = json.username ? json.username : username;
    password = json.password ? json.password : password;
  } catch (e) {
    // do nothing
  }

  // from options
  options = options.parent ? options.parent : options;
  spaceId = options.spaceId ? options.spaceId : spaceId;
  username = options.username ? options.username : username;
  password = options.password ? options.password : password;

  if (!spaceId || !username || !password) {
    var msg = ' error: no authentication data. set options or file or env.';
    console.error(msg);
    process.exit(1);
  }

  return { spaceId: spaceId, username: username, password: password };
};

var exec = function(commander, noHelp) {
  commander.parse(process.argv);
  if (!noHelp && commander.args.length === 0) {
    commander.help();
  }
};

var client = function(options) {
  var auth = authenticate(options);
  return backlogApi(auth.spaceId, auth.username, auth.password);
};

module.exports.authenticate = authenticate;
module.exports.client = client;
module.exports.exec = exec;
module.exports.format = format;

