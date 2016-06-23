const fs = require('fs');
const path = require('path');
const del = require('del');
const babel = require('gulp-babel');
const runSequence = require('run-sequence');

/**
 * Make changes in package.json for adecuating it to the npm distributable
 * @private
 * @param {string} pkgInfo - Content of original package.json
 * @returns {object} - Resulting package.json
*/
function _fixPackageJsonForNpm(pkgInfo) {
  delete pkgInfo.scripts;
  return pkgInfo;
}

module.exports = function(gulp, args) {
  const buildDir = args.buildDir;
  const npmPackageOutputDir = `${buildDir}/npm-package`;
  const sources = args.sources;
  const meta = args.meta;

  gulp.task('npm-pack:clean', () => {
    return del([
      npmPackageOutputDir
    ]);
  });

  gulp.task('npm-pack:transpile', () => {
    return gulp.src(sources, {base: './'})
      .pipe(babel({presets: ['es2015']}))
      .pipe(gulp.dest(npmPackageOutputDir));
  });

  gulp.task('npm-pack:copyMeta', () => {
    return gulp.src(meta, {base: './'})
      .pipe(gulp.dest(npmPackageOutputDir));
  });

  gulp.task('npm-pack:fixPackageInfo', () => {
    return fs.writeFileSync(path.join(npmPackageOutputDir, 'package.json'),
      JSON.stringify(_fixPackageJsonForNpm(JSON.parse(fs.readFileSync('./package.json'))), null, 2));
  });

  gulp.task('npm-pack', () => {
    runSequence(
      'npm-pack:clean',
      'npm-pack:transpile',
      'npm-pack:copyMeta',
      'npm-pack:fixPackageInfo'
    );
  });
};
