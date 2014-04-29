var q = require('q');
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
      '   backlog issue info -f \'key,summary\' \'HUBOT-2\'',
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

    var deferred = q.defer();
    deferred.promise
    .then(function() {
      // assigner -> assigner id
      if (options.assigner) {
        return client(options).getUser({ id: options.assigner })
      }
    })
    .then(function(assigner) {
      if (assigner) {
        opts.assignerId = assigner.id;
      }
      return client(options).updateIssue(opts)
    })
    .catch(function(e) {
      console.error(e);
      process.exit(1);
    });

    deferred.resolve();
  })
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
};

module.exports = function(commander) {
  info(commander);
  update(commander);
  exec(commander);
};
