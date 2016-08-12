# gulp-common-tasks

This package contains a bunch of common gulp tasks used across projects.

## Usage

```
const gulp = require('gulp');
const commonTasks = require('gulp-common-tasks')(gulp);

// This adds the tasks in the `bundle` family
commonTasks.bundle({
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

Currently these task families are available: `bundle`, `ci`, `npm`, `test` and `install-node`.

## Licensing

This module is licensed under the GPL, Version 2.0. See the [COPYING](COPYING) file for the full license text.

## Contributing

Check our [Contributing](CONTRIBUTING.md) guide.
