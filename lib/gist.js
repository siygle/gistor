var request = require('request');
var JSONStream = require('JSONStream');
var fs = require('fs');
var api = 'https://api.github.com';
var config = {};

exports.config = function(conf) {
  config = conf;
}

exports.login = function(user, pass) {
  request({
    headers: {
      'Content-type': 'application/json',
      'Authorization': 'Basic ' + new Buffer(user + ':' + pass).toString('base64')
    },
    uri: api + '/authorizations',
    method: 'POST',
    body: JSON.stringify({
      "scopes": ["gist"],
      "note": "gistor"
    })
  }, function(err, resp, body) {
    if (err) {
      throw err;
    } else {
      fs.writeFileSync(process.env.HOME + '/.gistor', body);
    }
  });
}

exports.list = function() {
  request({
    headers: {
      'Authorization': 'token ' + config.token
    },
    uri: api + '/gists',
    method: 'GET'
  }, function(err, resp, body) {
    if (err) {
      throw err;
    } else {
      var data = JSON.parse(body);
      data.forEach(function(item) {
        console.log(item.id + '\t' + item.description);
        console.log(item.html_url + '\n');
      });
    }
  });
}
