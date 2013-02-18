#!/usr/bin/env node

var gist = require('../lib/gist');
var fs = require('fs');
var argv = require('optimist')
  .boolean(['create', 'remove', 'list'])
  .argv;

// check authorize file exist
try {
  if (argv.login) {
    if (!argv.user|| !argv.pass) {
      throw Error("Input user and pass for login");
    } else {
      gist.login(argv.user, argv.pass);
    }
  } else {
    var config = JSON.parse(fs.readFileSync(process.env.HOME + '/.gistor'));
    if (!config || !config.token) {
      throw Error("Config file error! Please run gistor login again");
    } else {
      gist.config(config);
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
        console.log(argv._[0]);
        gist.remove(argv._[0]);
      } else {
        throw Error("Please input gist Id you want to delete");
      }
    } else if (argv.list) {
      gist.list();
    } else {
      throw Error('Not support this action');
    }
  }
} catch(e) {
  if (e) {
    console.log(e);
  } else {
    console.log('Missing config! Please do gistor login first');
  }
}
