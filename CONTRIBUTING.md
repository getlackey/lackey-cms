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
