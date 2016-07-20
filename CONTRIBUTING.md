# Contributing

## Comitting

### Official Lackey Team

 * create/checkout version or feature branch
  * we should create branch for `major.minor`
  * if your branch already exists rebase it by master `git pull origin master --rebase` with fast forward
 * make your changes
  * code
  * `gulp lint`
  * `gulp test`
  * commit your changes to your branch
  * see what [Travis](https://travis-ci.org/getlackey/lackey-cms/branches) thinks about your changes
 * squash your changes `git rebase -i HEAD~[number of commits]`
 * override brach in your fork with squashed changes `git push [remote] [branch] -f`
 * version up
 * update CHANGE_LOG
 * create pull request
 * update documentation

#### Exceptions

 * MarkDown file updates

### Other contributors

 * fork [https://github.com/getlackey/lackey-cms](https://github.com/getlackey/lackey-cms)
 * make your changes
  * code
  * `gulp lint`
  * `gulp test`
  * commit your changes to your `master` or feature branch
 * squash your changes `git rebase -i HEAD~[number of commits]`
 * override brach in your fork with squashed changes `git push [remote] [branch] -f`
 * create pull request

### Versioning

From 0.6 we will apply full [semantic versioning](http://semver.org/)

`MAJOR.MINOR.PATCH`

 * MAJOR version when you make incompatible API changes,
 * MINOR version when you add functionality in a backwards-compatible manner, and
 * PATCH version when you make backwards-compatible bug fixes.

#### Extensions

`MAJOR-MINOR.PATH-EXTENSION`

 * `alpha-1`, `alpha2`, ... `alpha-n` first draft MAJOR/MINOR
 * `beta-1`, `beta-2`, ... `beta-n` QA ready version of MAJOR/MINOR
 * `rc-1`, `rc-2`, ... `rc-n` for preparing MAJOR/MINOR to be released
