#!/usr/bin/env node

var gist = require('../lib/gist');
var fs = require('fs');
var argv = require('optimist')
  .boolean(['create', 'update', 'remove', 'list', 'edit'])
  .alias('e', 'edit')
  .alias('h', 'help')
  .alias('v', 'version')
  .argv;

/**
 * Display helping message
 */
function displayHelp() {
  var help = [
    '',
    '  Usage: gistor [options] [params]',
    '',
    '  Options:',
    '',
    '    --login --user <username> --pass <password>',
    '    --create <file1, file2,...>',
    '    --update [GistId] -e',
    '    --remove [GsitId]',
    '    --list',
    '',
    ''
  ].join("\n");
  console.log(help);
}

try {
  if (argv.login) {
    if (!argv.user || !argv.pass) {
      throw Error("Input user and pass for login");
    } else {
      gist.login(argv.user, argv.pass);
    }
  } else if (argv.help) {
    displayHelp();
  } else if (argv.version) {
    var pkg = require('../package.json');
    console.log(pkg.version);
  } else {
    var configPath = process.env.HOME + '/.gistor';
    if (fs.existsSync(configPath)) {
      var config = JSON.parse(fs.readFileSync(configPath));
      if (!config || !config.token) {
        throw Error("Config file error! Please run gistor --login again");
      } else {
        gist.config(config);
      }
    } else {
      throw Error("Missing gistor config, please run gistor --login first!");
    }

    if (argv.create) {
      var files = {};
      argv._.forEach(function(f) {
        var content = fs.readFileSync(f);
        if (content) {
          files[f.toString()] = {content: content.toString()};
        }
      });
      if (argv.desc) {
        gist.create(files, argv.desc);
      } else {
        gist.create(files);
      }
    } else if (argv.remove) {
      if (argv._[0]) {
        gist.remove(argv._[0]);
      } else {
        throw Error("Please input gist Id you want to delete");
      }
    } else if (argv.update) {
      if (argv.edit) {
        gist.updateEditor(argv._[0]);
      }
    } else if (argv.list) {
      gist.list();
    } else {
      displayHelp();
    }
  }
} catch(e) {
  console.error(e);
  process.exit(1);
}
