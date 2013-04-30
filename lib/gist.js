var fs = require('fs');
var child_process = require('child_process');
var request = require('request');
var async = require('async');
var cheerio = require('cheerio');
var json = require('JSONStream');
var editor = require('editor');
var _ = require('lodash');

var api = 'https://api.github.com';
var version = process.version;
var config = {
  set setConf (obj) {
    this._token = obj.token;
  },
  get getConf () {
    return {
      'Authorization': 'token ' + this._token,
      'User-Agent': this._userAgent
    }
  },
  _userAgent: 'NODE/' + version,
  _token: ''
};

exports.config = function(conf) {
  if (conf.token) {
    config.setConf = conf;
  } else {
    throw new Error("Missing token info in .gistor");
  }
}

exports.login = function(user, pass) {
  var curl = child_process.spawn('curl', ['-u', user, '-d', '{"scopes":["gist"],"note": "gistor"}', api + '/authorizations']);
  curl.stdout.on('data', function(data) {
    fs.writeFileSync(process.env.HOME + '/.gistor', data.toString());
    console.log("Setup user token");
  });
  curl.stderr.on('data', function(err) {
    console.log(err.toString());
  });
}

exports.list = function() {
  request({
    headers: config.getConf,
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

exports.create = function(files, desc) {
  request({
    headers: config.getConf,
    uri: api + '/gists',
    method: 'POST',
    body: JSON.stringify({
      description: desc,
      public: true,
      files: files
    })
  }, function(err, resp, body) {
    if (err) {
      throw err;
    } else {
      var data = JSON.parse(body);
      console.log(data.description);
      console.log(data.html_url);
    }
  });
}

exports.remove = function(id) {
  request({
    headers: config.getConf,
    uri: api + '/gists/' + id,
    method: 'DELETE'
  }, function(err, resp, body) {
    if (err) {
      throw err;
    } else {
      if (resp.statusCode == 204) {
        console.log("Delete gist [" + id + "] success!");
      }
    }
  });
}

exports.search = function(keyword) {
  var gistSearch = 'https://gist.github.com/search';
  request({
    uri: gistSearch + '?q=' + keyword
  }, function(err, resp, body) {
    if (err) {
      throw err;
    } else {
      $ = cheerio.load(body);
      console.log($('.search-head h1').text() + "\n");
      $('.search-results-listing .gist-item').each(function(i, item) {;
        var content = '';
        $(this).find('.file-data .line-data .line').each(function(i, file) {
          content += $(this).text().trim() + '\n';
        });
        var result = [
          '==========\n',
          $(this).find('.creator a').first().text(),
          ' - ',
          $(this).find('.creator .css-truncate-target').text(),
          '\n',
          gistSearch + '/' + $(this).find('.creator .css-truncate-target').parent().attr('href'),
          '\n',
          '----------\n',
          content
        ].join("");
        console.log(result);
      });
    }
  });
}

exports.updateEditor = function(id, file) {
  async.waterfall([
    function(cb) {
      request({
        headers: config.getConf,
        uri: api + '/gists/' + id,
        method: 'GET'
      }, function(err, resp, body) {
        if (err) {
          cb(err);
        } else {
          var result = JSON.parse(body);
          cb(null, result);
        }
      });
    },
    function(result, cb) {
      var template = new Date().getTime();
      child_process.exec('mktemp /tmp/' + template, function(err, stdout, stderr) {
        if (err) {
          cb(err);
        } else {
          var tmpFile = stdout.substr(0, stdout.length - 1);
          var filename = '';
          var content = '';
          if (file) {
            var tmp = _.find(result.files, function(v, k) {
              return k == file;
            });
            filename = file;
            content = tmp.content;
          } else {
            if (typeof(result.files) == 'object') {
              for (var k in result.files) {
                filename = k;
                content = result.files[k].content;
                break;
              }
            }
          }

          if (!content) {
            cb(new Error("Can not get gist file content"));
          } else {
            fs.writeFile(tmpFile, content, function(err) {
              if (err) {
                cb(err);
              } else {
                cb(null, filename, tmpFile);
              }
            });
          }
        }
      });
    },
    function(filename, tmp, cb) {
      editor(tmp, function(code, sig) {
        if (code === 0) {
          var content = fs.readFileSync(tmp);
          cb(null, filename, content);
        } else {
          cb(new Error("Editor did not work well"));
        }
      });
    },
    function(filename, update, cb) {
      var param = {};
      param[filename] = {
        content: update.toString()
      }
      request({
        headers: config.getConf,
        uri: api + '/gists/' + id,
        method: 'PATCH',
        body: JSON.stringify({
          files: param
        })
      }, function(err, resp, body) {
        if (err) {
          cb(err);
        } else {
          cb(null, body);
        }
      });
    }
  ], function(err, data) {
    if (err) {
      throw err;
    } else {
      var result = JSON.parse(data);
      console.log("[" + result.description + "] update successful!");
      console.log(result.html_url);
    }
  });
}

exports.folk = function(id) {
  request({
    headers: config.getConf,
    uri: api + '/gists/' + id + '/fork',
    method: 'POST'
  }, function(err, resp, body) {
    if (err) {
      throw err;
    } else {
      if (resp.statusCode == 201) {
        var data = JSON.parse(body);
        console.log("Folk Success!");
        console.log(data.html_url);
      }
    }
  });
}

exports.get = function(id, target) {
  var parser = json.parse('files.*');
  request({
    url: api + '/gists/' + id,
    method: 'GET'
  }).pipe(parser);

  parser.on('data', function(data) {
    if (data.filename && data.content) {
      var filename = (target) ? target : data.filename;
      fs.writeFile(filename, data.content, function(err){
        if (err) {
          console.error(data.filename + ' fail!');
        }
      });
    }
  });
}
