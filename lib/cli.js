var fs = require('fs');
var path = require('path');
var commander = require('commander');

var getVersion = function() {
  var pkgPath = path.resolve(__dirname, '../package.json');
  var pkgData = fs.readFileSync(pkgPath, 'utf8');
  var pkg = JSON.parse(pkgData);
  var version = pkg.version;
  return version;
};

var setGlobalOptions = function(commander) {
  commander
  .option('-s, --space-id <space-id>', 'spaceid')
  .option('-u, --username <username>', 'username')
  .option('-p, --password <password>', 'password');
  return commander;
};

module.exports = function(entryPoint) {
  commander.version(getVersion());

  if (!entryPoint) {
    commander.command('login', 'login and create authentication data file')
    commander.command('logout', 'logout and delete authentication data file');
    commander.command('project', 'display help for project');
    commander.command('issue',   'display help for issue');
    commander.command('comment', 'display help for comment');
    // commander.parse returns truthy when sub-command is not executed.
    if (commander.parse(process.argv)) {
      commander.help();
    }
    return;
  }

  setGlobalOptions(commander);
  require('./tasks/' + entryPoint)(commander);
};
