var Promise = require('q').Promise;
var utils = require('../utils');
var client = utils.client;
var exec = utils.exec;
var format = utils.format;
var table = require('text-table');

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
      '  Examples:',
      '',
      '    backlog issue info PJ-123 -f \'key,summary\' \'HUBOT-2\'',
      ''
    ].join('\n');
    console.log(help);
  });
};

var update = function(commander) {
  commander
  .command('update <issue-key>')
  .description('update issue')
  .option('--assigner <login-id>', 'assigner login-id')
  .option('--comment <comment>', 'comment')
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
      '  Examples:',
      '',
      '    backlog issue update \'PJ-123\' \\',
      '      --assigner \'bouzuya\' \\',
      '      --comment \'piyo\' \\',
      '      --start-date \'20140101\'',
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

var list = function(commander) {
  commander
  .command("list <project-key>")
  .description("show issue lists")
  .option(
    '-f, --format <format>',
    'format (default: key,summary,type,issueType,status,assigner,due_date,milestones,created_user,created_on,url)'
  )
  .option(
    '-S, --short',
    'short format (default: key,summary,type,issueType,status,assigner,due_date,url)'
  )
  .option(
    '-s, --sort <field>',
    'sort field(default: updated)'
  )
  .option(
    '-o, --order <order>',
    'order (default: desc)'
  )
  .option(
    '-p, --page <page>',
    'page(default: 1)'
  )
  .option(
    '-l, --limit <limit>',
    'limit(default: none[unlimited])'
  )
  .option(
    '-a, --all',
    'show all issues(default: unfinished issues)'
  )
  .option(
    '-q, --query <query>',
    'search keyword'
  )
  .action(function(projectKey, options) {
    if (options.short && !options.format) {
      options.format = "key,summary,type,issueType,status,assigner,due_date,url";
    }
    client(options).getProject({ projectKey: projectKey })
    .then(function(project) {
      var opts = {
        projectId: project.id,
        order: (options.order || "desc") == "desc" ? 1 : 0,
        sort: (options.sort || "updated").toUpperCase(),
      };
      if (options.limit) {
        var limit = parseInt(options.limit, 10);
        opts.limit = limit;
        if (options.page) {
          opts.offset = limit * (options.page - 1);
        }
      }
      if (!options.all) {
        opts.statusId = [1, 2, 3];
      }
      if (options.query) {
        opts.query = options.query;
      }
      return client(options).findIssue(opts);
    })
    .then(function(issues) {
      if (issues.length > 0) {
        var defaultFormat = 'key,summary,type,issueType,status,assigner,due_date,milestones,created_user,created_on,url';
        var formattedIssues = issues.map(function(issue) {
          if (typeof issue.components !== "undefined") {
            issue.components = issue.components.map(function(m) {
              return m.name;
            }).join(",");
          }
          if (typeof issue.milestones !== "undefined") {
            issue.milestones = issue.milestones.map(function(m) {
              return m.name + (m.date ? "[" + m.date + "]" : "");
            }).join(",");
          }

          ["status", "issueType", "created_user", "priority", "resolution", "assigner"].forEach(function(prop) {
            if (typeof issue[prop] === 'object') issue[prop] = issue[prop].name;
          });
          ["updated_on", "created_on", "due_date"].forEach(function(prop) {
            issue[prop] = issue[prop]
              .replace(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, "$1-$2-$3 $4:$5:$6")
              .replace(/^(\d{4})(\d{2})(\d{2})$/, "$1-$2-$3");
          });
          return format(issue, options.format, defaultFormat).split('\t')
        });
        var headers = (options.format || defaultFormat).split(',');
        formattedIssues.unshift(headers);
        console.log(table(formattedIssues, {
          align: headers.map(function() { return 'l'; }),
          stringLength: function(s) {
            var m = s.match(/[\x00-\x7F]/g);
            return String(s).length * 2 - (m ? m.length : 0);
          },
        }));
      }
    })
    .catch(function(e) {
      console.error(e);
      process.exit(1);
    });
  }).on('--help', function() {
    var help = [
      '',
      '  Examples:',
      '',
      '    backlog issue list -s due_date -o asc \\',
      '      --limit 50 --page 2 \\',
      '      \'PJ\'',
      '',
    ].join('\n');

    console.log(help);
  });
};

module.exports = function(commander) {
  info(commander);
  update(commander);
  status(commander);
  list(commander);
  exec(commander);
};
