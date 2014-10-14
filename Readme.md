# gulp-subset

Extract a subset for character list for Gulp.js

## Install
`npm install gulp-less`

## Usage
```javascript
var subset = require('gulp-subset');

gulp.task('subset', function () {
  gulp.src('./dest/css/style.min.css')
    .pipe(subset({
      html: './dest/**/*.html'
      dest: './subset/'
    }));
});
```
