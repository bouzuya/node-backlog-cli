var Promise = require('q').Promise;
var utils = require('../utils');
var client = utils.client;
var exec = utils.exec;
var format = utils.format;

var info = function(commander) {
  commander
  .command('info <issue-key>')
  .description('issue info')
  .option(
    '-f, --format <format>',
    'format (default: key,summary,url)'
  )
  .action(function(issueKey, options) {
    client(options).getIssue({ issueKey: issueKey })
    .then(function(issue) {
      var result = format(issue, options.format, 'key,summary,url');
      console.log(result);
    })
    .fail(function(e) {
      console.error(e);
      process.exit(1);
    });
  })
  .on('--help', function() {
    var help = [
      '',
      ' Examples:',
      '',
      '   backlog issue info PJ-123 -f \'key,summary\' \'HUBOT-2\'',
      ''
    ].join('\n');
    console.log(help);
  });
};

var update = function(commander) {
  commander
  .command('update <issue-key>')
  .description('update issue')
  .option('--comment <comment>', 'comment')
  .option('--assigner <login-id>', 'assigner login-id')
  .option('--start-date <YYYYMMDD>', 'start-date YYYYMMDD')
  .action(function(issueKey, options) {
    var opts = { key: issueKey };

    if (options.comment) {
      opts.comment = options.comment;
    }
    if (options.startDate) {
      opts.start_date = options.startDate;
    }

    var promise;
    if (options.assigner) {
      promise = client(options).getUser({ id: options.assigner })
    } else {
      promise = new Promise(function(resolve) { resolve(); });
    }
    promise.then(function(assigner) {
      if (assigner) {
        opts.assignerId = assigner.id;
      }
      return client(options).updateIssue(opts)
    })
    .catch(function(e) {
      console.error(e);
      process.exit(1);
    });
  })
  .on('--help', function() {
    var help = [
      '',
      ' Examples:',
      '',
      '   backlog issue update PJ-123 --comment \'piyo\' --assigner \'bouzuya\'',
      ''
    ].join('\n');
    console.log(help);
  });
};

var status = function(commander) {
  var resolutions = [
    { id: 0, name: 'Fixed' },
    { id: 1, name: 'Won\'t Fix' },
    { id: 2, name: 'Invalid' },
    { id: 3, name: 'Duplication' },
    { id: 4, name: 'Cannot Reproduce' }
  ];
  var statuses = [
    { id: 1, name: 'Open' },
    { id: 2, name: 'In Progress' },
    { id: 3, name: 'Resolved' },
    { id: 4, name: 'Closed' }
  ];

  commander
  .command('status <issue-key> <status-id>')
  .description('switch issue status')
  .option('--assigner <login-id>', 'assigner')
  .option('--comment <comment>', 'comment')
  .option('--resolution-id <resolution-id>', 'resolution id')
  .action(function(issueKey, statusId, options) {
    var opts = { key: issueKey, statusId: parseInt(statusId) };

    if (options.resolutionId) {
      opts.resolutionId = options.resolutionId;
    }
    if (options.comment) {
      opts.comment = options.comment;
    }

    var promise;
    if (options.assigner) {
      promise = client(options).getUser({ id: options.assigner })
    } else {
      promise = new Promise(function(resolve) { resolve(); });
    }
    promise.then(function(assigner) {
      if (assigner) {
        opts.assignerId = assigner.id;
      }
      return client(options).switchStatus(opts)
    })
    .catch(function(e) {
      console.error(e);
      process.exit(1);
    });
  })
  .on('--help', function() {
    var help = [
      '  Status Ids:',
      '',
      statuses.map(function(i) {
        return '    ' + i.id + ': ' + i.name;
      }).join('\n'),
      '',
      '  Resolution Ids:',
      '',
      resolutions.map(function(i) {
        return '    ' + i.id + ': ' + i.name;
      }).join('\n'),
      '',
      '  Examples:',
      '',
      '    backlog issue status \'PJ-123\' \'1\' \\',
      '      --assigner \'bouzuya\' \\',
      '      --comment \'piyo\' \\',
      '      --resolution-id \'1\'',
      ''
    ].join('\n');
    console.log(help);
  });
};

module.exports = function(commander) {
  info(commander);
  update(commander);
  status(commander);
  exec(commander);
};
