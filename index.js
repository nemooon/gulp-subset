var _ = require('lodash');
var fs = require('fs');
var path = require('path');
var glob = require('glob');
var through = require('through2');
var gutil = require('gulp-util');
var cssParse = require('css-parse');
var cheerio = require('cheerio');

module.exports = function (options) {

  options = _.defaults(options || {}, {
    html: []
  });

  return through.obj(function(file, enc, cb) {

    if (file.isNull()) {
      return cb(null, file);
    }

    if (file.isStream()) {
      return cb(new PluginError('gulp-subset', 'Streaming not supported'));
    }

    var fontList = [];
    var result = {};

    var css = cssParse(file.contents.toString('utf8'));
    var fontFace = _.map(_.filter(css.stylesheet.rules, {type: 'font-face'}), function(rule){
      return _.find(rule.declarations, {property: 'font-family'}).value;
    });

    _.each(_.filter(css.stylesheet.rules, {type: 'rule'}), function(rule){
      _.each(rule.declarations, function(declaration) {
        if (declaration.property == 'font-family') {
          _.each(declaration.value.split(','), function(fontFamily) {
            if (!result[fontFamily]) result[fontFamily] = [];
            result[fontFamily] = _.union(result[fontFamily], rule.selectors);
          });
        }
      });
    });
    fontList = _.pick(result, fontFace);

    glob(options.html, function(er, files){
      var charList = {};
      _.each(fontList, function(classList, font){
        charList[font] = [];
      });
      _.each(files, function(htmlFile) {
        var $html = cheerio.load(fs.readFileSync(htmlFile, 'utf8'));
        _.each(fontList, function(classList, font){
          classList = _.map(classList, function(className) {
            return className.replace(/:(.+)$/, '');
          })
          var text = $html(classList.join(',')).text();
          var chars = text.replace(/\s/g, '').split('');
          chars = _.uniq(chars).sort();
          charList[font] = _.union(charList[font], chars).sort();
        });
      });
      // output!
      fs.mkdir(options.dest, function() {
        _.each(charList, function(chars, font){
          fs.writeFile(path.resolve(options.dest, font+'.txt'), chars.join(''));
        });
      });
      cb(null, file);
    });
  });
}

