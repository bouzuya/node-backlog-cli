var utils = require('../utils');
var client = utils.client;
var format = utils.format;
var exec = utils.exec;

var info = function(commander) {
  commander
  .command('info <project-key>')
  .description('info project')
  .option(
    '-f, --format <format>',
    'format (default: key,name,url)'
  )
  .action(function(projectKey, options) {
    client(options).getProject({ projectKey: projectKey })
    .then(function(project) {
      var result = format(project, options.format, 'key,name,url');
      console.log(result);
    })
    .fail(function(e) {
      console.error(e);
      process.exit(1);
    });
  })
  .on('--help', function() {
    var help = [
      '  Examples:',
      '',
      '    backlog project info -f \'key,name\' \'HUBOT\'',
      ''
    ].join('\n');
    console.log(help);
  });
};

var list = function(commander) {
  commander
  .command('list')
  .description('list projects')
  .option(
    '-f, --format <format>',
    'format (default: key,name,url)'
  )
  .action(function(options) {
    client(options).getProjects()
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
  })
  .on('--help', function() {
    var help = [
      '  Examples:',
      '',
      '    backlog project list -f \'key,name\'',
      ''
    ].join('\n');
    console.log(help);
  });
};

module.exports = function(commander) {
  info(commander);
  list(commander);
  exec(commander);
};
