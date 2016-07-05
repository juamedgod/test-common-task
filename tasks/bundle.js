'use strict';

const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const del = require('del');
const install = require('gulp-install');
const webpack = require('webpack-stream');
const rename = require('gulp-rename');
const chmod = require('gulp-chmod');
const download = require('gulp-download');
const tar = require('gulp-tar');
const gzip = require('gulp-gzip');
const runSequence = require('run-sequence');

module.exports = function(gulp) {
  /**
   * Create a glob selector from a list of npm packages
   * @private
   * @param {string} base - Directory base (should have a `node_modules` folder)
   * @param {object} pkgs - Object where the key is the name of the package and key is the glob
   * filter for files relative to the directory of the package.
   * @returns {array} - Agregated glob selector for the packages.
   * @example
   * const pkgs = {
   *   'lodash': ['**\/*.js', '!test{,/**}'],
   *   'fs-extra': '**\/*.js',
   * }
   * _relativizePkgs('./', 'conf/php.ini');
   */
  function _relativizePkgs(base, pkgs) {
    const result = [];
    _.map(pkgs, (globs, pkg) => {
      _.each(globs, (i) => {
        let exclude = '';
        if (i.substring(0, 1) === '!') {
          exclude = '!';
          i = i.substring(1);
        }
        result.push(`${exclude}${path.join(base, 'node_modules', pkg)}/${i}`);
      });
    });
    return result;
  }

  /**
   * Make globs relative to a base
   * @private
   * @param {string} base - Directory base
   * @param {array|string} globs - Globs to relativize
   * @returns {array} - Globs relativized
   */
  function _relativizeGlob(base, globs) {
    const result = [];
    _.each(globs, (i) => {
      let exclude = '';
      if (i.substring(0, 1) === '!') {
        exclude = '!';
        i = i.substring(1);
      }
      result.push(`${exclude}${base}/${i}`);
    });
    return result;
  }

  /**
   * Get the path of a package relative to certain base
   * @private
   * @param {string} base - Directory base (should have a `node_modules` folder)
   * @param {object} pkgs - List of packages
   * @returns {array} - Paths to the modules
   */
  function _pathToPkg(base, pkgs) {
    const result = [];
    _.map(pkgs, (pkg) => {
      result.push(`${path.join(base, 'node_modules', pkg)}`);
    });
    return result;
  }

  /**
   * Generate a object by expanding a package.json as if we combine several packages into the current
   * project.
   * @private
   * @param {object} pkgInfo - Content of original package.json to extend
   * @param {object} pkgs - Packages to merge into the current project
   * @returns {object} - Resulting package.json
   */
  function _mergeDeps(pkgInfo, pkgs) {
    _.each(pkgs, (props, pkg) => {
      const deps = JSON.parse(fs.readFileSync(path.join('./node_modules', pkg, 'package.json'))).dependencies;
      _.assign(pkgInfo.dependencies, deps);
      delete pkgInfo.dependencies[pkg];
    });
    delete pkgInfo.devDependencies;
    return pkgInfo;
  }

  /**
   * Return a list of all the packages under a `node_modules` folder.
   * @private
   * @param {string} folder - Folder to scan
   * @returns {array} - List of packages in the folder
   */
  function _scanPackagesFolder(folder) {
    return fs.readdirSync(folder)
      .filter((x) => x !== '.bin');
  }

  /**
   * bundle tasks:
   * - `bundle`
   * - `bundle-webpack`
   * - `bundle:clean`
   * - `bundle:preinstallPackages`
   * - `bundle:copySources`
   * - `bundle:copyBundledPackages`
   * - `bundle:mergeDeps`
   * - `bundle:installDeps`
   * - `bundle:webpackize`
   * - `bundle:deleteSources`
   * - `bundle:renameEntryfile`
   * - `bundle:addRuntime`
   * - `bundle:addLicense`
   * - `bundle:compress`
   * @param {object} args
   * @param {string} args.buildDir - Directory where the result of the bundle operations will be stored
   * @param {string} args.artifactName - Base name for the artifacts
   * @param {array|string} args.sources - Glob selector for application sources
   * @param {array|string} [args.postBundleFilter=[]] - Glob selector for application sources you
   * want to filter out in the bundle
   * @param {array|string} [args.postWebpackFilter=args.sources] - Glob selector for application
   * sources you want to filter out after doing webpack in the bundle
   * @param {object} [args.bundledPkgs=null] - Object where the key is the name of the package to
   * bundle and key is the glob filter for files relative to the directory of the package.
   * @param {string} [args.entrypoint='index.js'] - Name of the file used as entrypoint for the application
   * @param {string} [args.runtimeName=null] - In case the app needs a runtime to be included, name
   * of that runtime
   * @param {string} [args.runtimeUrl=null] - In case the app needs a runtime to be included, url
   * where the runtime will be downloaded from
   */
  function bundle(args) {
    const buildDir = args.buildDir;
    const bundleOutputName = args.artifactName;
    const sources = args.sources;
    const bundledPkgs = args.bundledPkgs || null;
    const entrypoint = args.entrypoint || 'index.js';
    const runtimeName = args.runtimeName || null;
    const runtimeUrl = args.runtimeUrl || null;
    const bundleOutputDir = `${buildDir}/bundle`;
    const postBundleFilter = _relativizeGlob(bundleOutputDir, args.postBundleFilter) || [];
    const postWebpackFilter = _relativizeGlob(bundleOutputDir, args.postWebpackFilter) ||
                                _relativizeGlob(bundleOutputDir, args.sources);

    function _checkRuntimeUrl() {
      if (runtimeName && !runtimeUrl) {
        throw new Error('Runtime is required but url not provided');
      }
    }

    gulp.task('bundle:clean', () => {
      return del([
        bundleOutputDir,
        `${buildDir}/${bundleOutputName}.tar.gz`
      ]);
    });

    gulp.task('bundle:preinstallPackages', () => {
      return gulp.src(['./package.json'], {base: './'})
        .pipe(install());
    });

    gulp.task('bundle:copySources', () => {
      return gulp.src(sources, {base: './'})
        .pipe(gulp.dest(bundleOutputDir));
    });

    gulp.task('bundle:copyBundledPackages', () => {
      const base = './';
      return gulp.src(_relativizePkgs(base, bundledPkgs), {base})
        .pipe(gulp.dest(bundleOutputDir));
    });

    gulp.task('bundle:mergeDeps', () => {
      return fs.writeFileSync(path.join(bundleOutputDir, 'package.json'),
                              JSON.stringify(_mergeDeps(JSON.parse(fs.readFileSync('./package.json')),
                                              bundledPkgs), null, 2));
    });

    gulp.task('bundle:installDeps', () => {
      return gulp.src([`${bundleOutputDir}/package.json`], {base: bundleOutputDir})
        .pipe(install({production: true}));
    });

    gulp.task('bundle:webpackize', () => {
      const externals = {};
      _.each(_scanPackagesFolder(`${bundleOutputDir}/node_modules`), (pkg) => externals[pkg] = `commonjs ${pkg}`);
      _.each(bundledPkgs, (props, pkg) => delete externals[pkg]);
      const webpackConfig = {
        entry: {app: `${bundleOutputDir}/${entrypoint}`},
        target: 'node',
        node: { // tells webpack not to mock `__filename` nor `__dirname`
          __filename: false,
          __dirname: false,
        },
        output: {
          filename: 'bundle.js'
        },
        module: {
          loaders: [
            {test: /\.json$/, loader: 'json'},
          ]
        },
        resolve: {
          root: [
            path.resolve(bundleOutputDir)
          ],
          modulesDirectories: [
            path.join(bundleOutputDir, 'node_modules/')
          ]
        },
        externals
      };

      return gulp.src([`${bundleOutputDir}/${entrypoint}`], {base: bundleOutputDir})
        .pipe(webpack(webpackConfig))
        .pipe(gulp.dest(bundleOutputDir));
    });

    gulp.task('bundle:deleteWebpackedSources', () => {
      return del(postWebpackFilter.concat(_pathToPkg(bundleOutputDir, _.keys(bundledPkgs))));
    });

    gulp.task('bundle:postBundleFilter', () => {
      return del(postBundleFilter.concat(_pathToPkg(bundleOutputDir, _.keys(bundledPkgs))));
    });

    gulp.task('bundle:renameEntryfile', () => {
      fs.renameSync(path.join(bundleOutputDir, 'bundle.js'), path.join(bundleOutputDir, 'index.js'));
    });

    gulp.task('bundle:addRuntime', () => {
      return download(runtimeUrl)
        .pipe(rename(`./${runtimeName}`))
        .pipe(chmod(755))
        .pipe(gulp.dest(`${bundleOutputDir}/runtime`));
    });

    gulp.task('bundle:addLicense', () => {
      return gulp.src('./COPYING')
        .pipe(gulp.dest(bundleOutputDir));
    });

    gulp.task('bundle:compress', () => {
      return gulp.src(`${bundleOutputDir}{,/**}`, {base: bundleOutputDir})
        .pipe(rename((p) => p.dirname = path.join(bundleOutputName, p.dirname)))
        .pipe(tar(`${bundleOutputName}.tar`))
        .pipe(gzip())
        .pipe(gulp.dest(buildDir));
    });

    gulp.task('bundle-webpack', () => {
      _checkRuntimeUrl();
      runSequence(
        'bundle:clean',
        'bundle:preinstallPackages',
        'bundle:copySources',
        'bundle:copyBundledPackages',
        'bundle:mergeDeps',
        'bundle:installDeps',
        'bundle:webpackize',
        'bundle:deleteWebpackedSources',
        'bundle:postBundleFilter',
        'bundle:renameEntryfile',
        'bundle:addRuntime',
        'bundle:addLicense',
        'bundle:compress'
      );
    });

    gulp.task('bundle', () => {
      _checkRuntimeUrl();
      runSequence(
        'bundle:clean',
        'bundle:preinstallPackages',
        'bundle:copySources',
        'bundle:installDeps',
        'bundle:postBundleFilter',
        'bundle:addRuntime',
        'bundle:addLicense',
        'bundle:compress'
      );
    });
  }
  return bundle;
};
