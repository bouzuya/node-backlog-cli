var fs = require('fs');
var path = require('path');
var backlogApi = require('backlog-api');
var commander = require('commander');
var q = require('q');

var getVersion = function() {
  var pkgPath = path.resolve(__dirname, '../package.json');
  var pkgData = fs.readFileSync(pkgPath, 'utf8');
  var pkg = JSON.parse(pkgData);
  var version = pkg.version;
  return version;
};

var authenticate = function(options) {
  var deferred = q.defer();

  // from env
  var spaceId = process.env.BACKLOG_SPACE_ID;
  var username = process.env.BACKLOG_USERNAME;
  var password = process.env.BACKLOG_PASSWORD;

  // TODO: from file
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
  spaceId = options.parent.spaceId ? options.parent.spaceId : spaceId;
  username = options.parent.username ? options.parent.username : username;
  password = options.parent.password ? options.parent.password : password;

  if (!spaceId || !username || !password) {
    var msg = ' error: no authentication data. set options or file or env.';
    console.error(msg);
    process.exit(1);
  }

  return { spaceId: spaceId, username: username, password: password };
};

var login = function(options) {
  var auth = authenticate(options);
  var backlog = backlogApi(auth.spaceId, auth.username, auth.password);
  backlog.getProjects()
  .then(function() {
    var file = path.resolve(process.env.HOME, '.backlog.json');
    try {
      fs.writeFileSync(file, JSON.stringify(auth));
      console.log('authentication data file created: ' + file);
    } catch (e) {
      console.error(e);
    }
  })
  .fail(function(e) {
    console.error(' error: invalid authentication data');
    process.exit(1);
  });
};

var logout = function(options) {
  var file = path.resolve(process.env.HOME, '.backlog.json');
  try {
    fs.unlinkSync(file);
    console.log('authentication data file deleted: ' + file);
  } catch (e) {
    // do nothing
  }
};

module.exports = function() {
  // version & global options.
  commander
  .version(getVersion())
  .option('-s, --space-id <space-id>', 'spaceid')
  .option('-u, --username <username>', 'username')
  .option('-p, --password <password>', 'password');

  // backlog login
  commander
  .command('login')
  .option('-s, --space-id <space-id>', 'spaceid')
  .option('-u, --username <username>', 'username')
  .option('-p, --password <password>', 'password')
  .description('login and create authentication data file.')
  .action(login);

  // backlog logout
  commander
  .command('logout')
  .description('logout and delete authentication data file.')
  .action(logout);

  commander.parse(process.argv);
};
