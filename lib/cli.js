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

var setGlobalOptions = function(commander) {
  commander
  .option('-s, --space-id <space-id>', 'spaceid')
  .option('-u, --username <username>', 'username')
  .option('-p, --password <password>', 'password');
  return commander;
};

var backlog = function(options) {
  var auth = authenticate(options);
  return backlogApi(auth.spaceId, auth.username, auth.password);
};

var format = function(obj, format, defaultFormat) {
  var properties = (format || defaultFormat).split(',');
  var result = properties.map(function(property) {
    return obj[property];
  }).join('\t');
  return result;
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

var infoProject = function(projectKey, options) {
  backlog(options).getProject({ projectKey: projectKey })
  .then(function(project) {
    var result = format(project, options.format, 'key,name,url');
    console.log(result);
  })
  .fail(function(e) {
    console.error(e);
    process.exit(1);
  });
};

var listProjects = function(options) {
  backlog(options).getProjects()
  .then(function(projects) {
    projects.forEach(function(project) {
      var result = format(project, options.format, 'key,name,url');
      console.log(result);
    });
  })
  .fail(function(e) {
    console.error(e);
    process.exit(1);
  });
};

var infoIssue = function(issueKey, options) {
  backlog(options).getIssue({ issueKey: issueKey })
  .then(function(issue) {
    var result = format(issue, options.format, 'key,summary,url');
    console.log(result);
  })
  .fail(function(e) {
    console.error(e);
    process.exit(1);
  });
};

var updateIssue = function(issueKey, options) {
  var opts = { key: issueKey };
  if (options.comment) {
    opts.comment = options.comment;
  }

  var deferred = q.defer();
  deferred.promise
  .then(function() {
    // assigner -> assigner id
    if (options.assigner) {
      return backlog(options).getUser({ id: options.assigner })
    } else {
      var deferred = q.defer();
      deferred.resolve(null);
      return deferred.promise;
    }
  })
  .then(function(user) {
    if (user) {
      opts.assignerId = user.id;
    }
    return backlog(options).updateIssue(opts)
  })
  .fail(function(e) {
    console.error(e);
    process.exit(1);
  });

  deferred.resolve();
};

var addComment = function(issueKey, comment, options) {
  backlog(options).addComment({ key: issueKey, content: comment })
  .then(function() {
    // do nothing
  })
  .fail(function(e) {
    console.error(e);
    process.exit(1);
  });
};

module.exports = function(entryPoint) {
  // version
  commander.version(getVersion());

  if (!entryPoint) {
    commander.command('login', 'login and create authentication data file')
    commander.command('logout', 'logout and delete authentication data file');
    commander.command('project', 'display help for project');
    commander.command('issue',   'display help for issue');
    commander.command('comment', 'display help for comment');
    // return truthy unless exec sub-command
    if (commander.parse(process.argv)) {
      commander.help();
    }
    return;
  }

  setGlobalOptions(commander);
  if (entryPoint === 'login') {
    commander.parse(process.argv);
    login(commander);
  } else if (entryPoint === 'logout') {
    commander.parse(process.argv);
    logout(commander);
  } else if (entryPoint === 'project') {
    commander
    .command('info <project-key>')
    .description('info project')
    .option(
      '-f, --format <format>',
      'format (default: key,name,url)'
    )
    .action(infoProject)
    .on('--help', function() {
      var help = [
        '',
        ' Examples:',
        '',
        '   backlog project info -f \'key,name\' \'HUBOT\'',
        ''
      ].join('\n');
      console.log(help);
    });

    commander
    .command('list')
    .description('list projects')
    .option(
      '-f, --format <format>',
      'format (default: key,name,url)'
    )
    .action(listProjects)
    .on('--help', function() {
      var help = [
        '',
        ' Examples:',
        '',
        '   backlog project list -f \'key,name\'',
        ''
      ].join('\n');
      console.log(help);
    });

    commander.parse(process.argv);
    if (commander.args.length === 0) {
      commander.help();
    }

  } else if (entryPoint === 'issue') {
    commander
    .command('info <issue-key>')
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

    commander
    .command('update <issue-key>')
    .description('update issue')
    .option('--comment <comment>', 'comment')
    .option('--assigner <login-id>', 'assigner login-id')
    .action(updateIssue)
    .on('--help', function() {
      var help = [
        '',
        ' Examples:',
        '',
        '   backlog issue update --comment \'piyo\' --assigner \'bouzuya\'',
        ''
      ].join('\n');
      console.log(help);
    });

    commander.parse(process.argv);
    if (commander.args.length === 0) {
      commander.help();
    }
  } else if (entryPoint === 'comment') {
    commander
    .command('add <issue-key> <comment>')
    .description('add comment to issue')
    .action(addComment);

    commander.parse(process.argv);
    if (commander.args.length === 0) {
      commander.help();
    }
  }
};
