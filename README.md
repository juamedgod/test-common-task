# gulp-common-tasks

This package contains a bunch of common gulp tasks used across projects.

## Usage

```
const gulp = require('gulp');
const commonTasks = require('gulp-common-tasks');

// This adds the tasks in the `bundle` family
commonTasks.bundle(gulp, {
  buildDir: './build',
  artifactName: 'myartifact',
  sources: [
       './package.json',
       './index.js',
       './cli/*.js',
       './templates/**/*.tpl',
       './bin/**/*'
     ]
});
```

## Task families

Currently there are this task families: `bundle`, `ci`, `npm`, `test` and `install-node`.
