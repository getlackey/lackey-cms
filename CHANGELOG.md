# Changelog

Going forward we should add hash of issue next to change

## 0.17.10

 * Changes to content page in CMS

## 0.17.8 - 0.17.9

 * Added dust helper for sorting arrays

## 0.17.5 - 0.17.7

 * Babelify
 * NewRelic

## 0.17.4

 * Remove ES6 from some clientside scripts

## 0.17.3

 * Fix taxonomy autocomplete to search label instead of name

## 0.17.2

 * Fixes to allow youtube thumbnail override


## 0.17.1

 * Fix for urls containing URI encoded entities

## 0.17.0

 * Table permalinks
 * Table stay on page after delete action
 * Table export use filters
 * Table back button support

## 0.16.8

 * Content create page - rename `name` column to `template`

## 0.16.7

 * Workaround for problematic media routes in `acl`

## 0.16.6

 * Fix to tables API (missing column setup)

## 0.16.5

 * Dont allow creation of uppercase urls

## 0.16.3 - 0.16.4

 * Fix paging in tables

## 0.16.2

 * Allow sorting CMS tables

## 0.16.1

 * Fix to gated media

## 0.16.0

 * Media restriction
 * Fix to permissions
 * Stored PostgreSQL procedures
 * Fix to automcomplete

## 0.15.0

 * Improve table date handling
 * Introduce sorting columns for tables

## 0.14.0

 * Add `lastActive` user field
 * Clear change log

## 0.13.1

 * Add middleware to convert uppercase urls to lowercase

## 0.13.0

* Show restrictive and non restrictive taxonomies in abstract list

## 0.12.1

 * Vimeo embed
 * Fix in `publishedAt`

## 0.11.2

 * Release 0.10.2

## 0.11.1

 * Added qs dust helper

## 0.10.2

 * Fix regex in YouTube libs
 * Change copy for change info

## 0.10.1

 * Introduced `publishAt` which allows content scheduling
 * Date picker became date-time picker

## 0.9.13

 * Allow to set expire time for login tokens

## 0.9.12

 * Introduce author picker in meat

## 0.9.11

 * Temporary fix for paths. Issue will be reported.

## 0.9.10

 * Fix flightweight - allow non strict equals
   * For proper testing we'd need dependency injeciton for models

## 0.9.9

 * Allow using dust vars in path for @path helper

## 0.9.8

 * Populate sub objects in analytics

## 0.9.7

 * Fix bug introduced in 0.9.6 that made circular references in CRUD responses

## 0.9.6

 * Fix table condition on AJAX refresh

## 0.9.5

 * force pages to be published to be listed
 * fix iframe redirected
 * force type 'image' for default medias
 * override collections and objects in template objects

## 0.9.3-4

 * Fix user session stats

## 0.9.2

 * Capture X-Client-ip

## 0.9.1

 * Expose client IP in session

## 0.9.0-alpha2

 * fix include paths for SASS

## 0.9.0-alpha

 * Date picker and created date
 * Analytics logger
 * Session and impressions analytics
 * Analytics frontend and media
 * Force Psql 9.5 on travis
 * Analytics UIDate picker and created date
 * Analytics logger
 * Session and impressions analytics
 * Analytics frontend and media
 * Force Psql 9.5 on travis
 * Analytics UI

## 0.8.3

 * Fix post create redirection

## 0.8.2

* Fix issue with duplicate taxonomies

## 0.8.1

 * Fix addSlash helper usage in templates

## 0.8.0

 * Added @filter dust helper

## 0.7.1

 * Open permissions due to `acl` dependency bug #66

## 0.7.0

 * #55 Keep query string parameters in edit mode
 * Allow adding blocks to list
 * Allow removing blocks from list
 * Fix editing properties in blocks #56 #57
 * Deprecate `lackey.as`
 * Improve CC to ~46.45%

## 0.6.3

 * Force there is slash on end of base tag (was causing dsubdirectory )

## 0.6.2

 * Introduced base helper to resolve Chrome base issue

## 0.6.1

 * Fix base tag and force absoltue paths for some elemements

## 0.6.0

 * #48 Introduce case insensitive search with UTF8 fallback (fallback is PSQL powered)
 * Introduce case insensitive login by email

## 0.5.24

  * Further fix in redirect (login related)

## 0.5.23

 * Fix taxonomy dust helper in case of duplicate taxonomu - content links
 * Fix base tag for CMS

## 0.5.22

 * Fix redirect base resolve

## 0.5.21

 * Fixed filter excluding current ID in complex query
 * Fixes several redirects

## 0.5.20

 * Fixed date fields on xls exports

## 0.5.19

 * #25 Improve user deletion
 * build and implement acl dust helper
 * #26 ACL dust helper

## 0.5.18

 * Remove user preview link

## 0.5.17

 * #29 Tidy up media table

## 0.5.15-0.5.16

 * #28 Allow to export tables as XSLS

## 0.5.14

 * Fix tables on frontend

## 0.5.13

 * #35 #36
 * Expose identities for user
 * Lock down API

## 0.5.12

 * #24 Add ability to override static getters of crud controllers

## 0.5.11

 *  #22 Change path of attachment icon from `/img/cms/cms/svg/file.svg` to `img/cms/cms/svg/file.svg`

## 0.5.10

 * Dust `base` filter

## 0.5.9

 * #23 Fix create link

## 0.5.8

 * Fix sockets
 * #19
 * #22

## 0.5.7

 * #17 fix failing tests

## 0.5.6

 * #15 add sendinblue provider

## 0.5.5

 * fix iframe - WYSIWYG relation

## 0.5.4

 * #6 default properties for templates

## 0.5.3

 * #6 fix action condition

## 0.5.2

 * Fix header.js

## 0.5.1

 * direct call to `res.send` locked, use `res.print` instead
 * permission restriction on temlate
 * `<base href="{host}/" target="_top"/>` is required

## 0.5.0

 * removed all CLI tools
 * gulp incorporated

### Breaking changes

 * Moving content of `/sites/<SITENAME>` to `/`
 * Rather using relative paths in frontend JS we use now paths scoped to `/modules` both in project and lackey

## 0.4.20

 * Expose query

## 0.4.19

 * Fix routes in tweetable quotes

## 0.4.18

 * Fix media in prose mirror

## 0.4.17

 * Hide not published content

## 0.4.16

 * Tweetable open in new window

## 0.4.14-15

 * Clear image
 * Video alternatives

## 0.4.12-13

 * Error block for embed

## 0.4.11

 * Fix avatar setup

## 0.4.10

 * Fix export

## 0.4.9

 * Fix populate
 * Remove console logs
 * Add state to toYAML of content
 * Fix content unserialize

## 0.4.8

 * Twitter helper

## 0.4.6 - 0.4.7

 * Exclude taxonomies in populate
 * Fix getByTaxonomies to populate taxonomies

## 0.4.5

 * Fix taxonomy detach

## 0.4.4

 * Error styling

## 0.4.1 - 0.4.3

 * Secure media alernatives

## 0.4.0

  * `faclor-router` from `0.2.12` to `0.4.0`
  * `fs-extra` from `0.26.4` to `0.30.0`
  * remove `marked`
  * `nodemailer-html-to-text` from `1.0.2` to `2.1.0`
  * remove `primer-css`
  * `query-string` from `3.0.0` to `4.1.0`
  * `shelljs` from `0.6.0` to `0.7.0`

## 0.3.19

* Remove default `controls` from video

## 0.3.18

  * API actions in tables
  * Delete page
  * Clear media
  * Apply attributes to media `attr-*`

## 0.3.15 - 0.3.16

  * `@hasContent` helper

## 0.3.14

  * Default value for editable

## 0.3.13

  * Upgrades to YAML serializer

## 0.3.12
  * Not populating empty properties in block

## 0.3.11
  * Related content

## 0.3.9 - 0.3.10
  * Make strucutre editor reflect changes, cleanup

## 0.3.8
  * Add author picker for page

## 0.3.7
 * `@taxonomy` dust helper

## 0.3.6
 * Fixing view in variant
 * Remove paragraphs for heading editable
 * Minor fixes to media

## 0.3.5
 * Add `raw` option to XHR

## 0.3.4
 * Add view as fragment
 * Minor fix to media

## 0.3.3
 * Add dependencies `autoprefixer`, `postcss` and `postcss-js`

## 0.3.2
 * Fix tweetable quotes after ProseMirror upgraede

## 0.3.1
 * Add dependency `dust-naming-convention-filters`
 * Support dates in YAML
 * Add view as YAML

## 0.3.0
 * Add support for `populate` in template YAML definition

## 0.2.11
 * Add `!import` instruction to YAML configs

## 0.2.10
 * Fix variant edition

## 0.2.8 - 0.2.9
 * Fix author saving

## 0.2.5 - 0.2.7
 * Add support for IFRAME in prose mirror `[IFRAME](pathToSource)`

## 0.2.4
 * Add filter by taxonomy to page model `getByTaxonomies(taxonomies, limit)`

## 0.2.3
 * Add edit field for `createdAt` field of page

## 0.2.2
 * Support for fonts

## 0.2.1
 * Fix population of properties to dynamic blocks

## 0.2.0
 * Features
  * Content dump to YAML
  * `res.yaml(response)`
  * Edititin in locale - i18n
  * `page` REST API param for table and list endpoints
  * Media dialog (image and/or videos)
  * Basic structure viewer/editor
  * Creation of new pages from UI

 * Dependencies
  * ProseMirror upgraded to 0.6.0
 * Bug Fixes
  * DB Drop on deploy function fixed
  * CMS table views fixed
