var utils = require('../utils');
var client = utils.client;
var exec = utils.exec;
var format = utils.format;

var add = function(commander) {
  commander
  .command('add <issue-key> <comment>')
  .description('add comment to issue')
  .action(function(issueKey, comment, options) {
    client(options).addComment({ key: issueKey, content: comment })
    .then(function() {
      // do nothing
    })
    .fail(function(e) {
      console.error(e);
      process.exit(1);
    });
  });
};

module.exports = function(commander) {
  add(commander);
  exec(commander);
};
