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

var listProjects = function(options) {
  var auth = authenticate(options);
  var backlog = backlogApi(auth.spaceId, auth.username, auth.password);
  backlog.getProjects()
  .then(function(projects) {
    projects.forEach(function(project) {
      console.log(project.key + '\t' + project.name + '\t' + project.url);
    });
  })
  .fail(function(e) {
    console.error(' error: invalid authentication data');
    process.exit(1);
  });
};

var infoIssue = function(issueKey, options) {
  var auth = authenticate(options);
  var backlog = backlogApi(auth.spaceId, auth.username, auth.password);
  backlog.getIssue({ issueKey: issueKey })
  .then(function(issue) {
    var format = options.format || 'key,summary,url';
    var properties = format.split(',');
    var result = properties.map(function(property) {
      return issue[property];
    }).join('\t');
    console.log(result);
  })
  .fail(function(e) {
    console.error(e);
    process.exit(1);
  });
};

module.exports = function(entryPoint) {
  // version & global options.
  commander
  .version(getVersion())
  .option('-s, --space-id <space-id>', 'spaceid')
  .option('-u, --username <username>', 'username')
  .option('-p, --password <password>', 'password');

  if (!entryPoint) {
    commander.command('login', 'login and create authentication data file')
    commander.command('logout', 'logout and delete authentication data file');
    commander.command('project', 'project list');
    commander.command('issue', 'issue info');
    commander.parse(process.argv);
  } else if (entryPoint === 'login') {
    commander.parse(process.argv);
    login(commander);
  } else if (entryPoint === 'logout') {
    commander.parse(process.argv);
    logout(commander);
  } else if (entryPoint === 'project') {
    commander
    .command('list')
    .description('list projects')
    .action(listProjects);

    commander.parse(process.argv);
  } else if (entryPoint === 'issue') {
    commander
    .command('info <issueKey>')
    .description('issue info')
    .option(
      '-f, --format <format>',
      'format (default: key,summary,url)'
    )
    .action(infoIssue)
    .on('--help', function() {
      var help = [
        '',
        ' Examples:',
        '',
        '   backlog issue info -f \'key,summary\' \'HUBOT-2\'',
        ''
      ].join('\n');
      console.log(help);
    });

    commander.parse(process.argv);
  }
};
