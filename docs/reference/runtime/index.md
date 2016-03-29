
# lackey-cms/runtime

<!-- RM(tree:*,content:false) -->

[Got to top](/README.md)

* [lackey-cms/runtime~Lackey](#lackey-cmsruntimelackey)
  * [new Lackey(config)](#new-lackeyconfig)
  * [lackey.addPlugin(ServerlessPlugin) ⇒ <code>Promise</code>](#lackeyaddpluginserverlessplugin-codepromisecode)
  * [lackey.addAction(action, config)](#lackeyaddactionaction-config)
  * [lackey.command(argv) ⇒ <code>Promise</code>](#lackeycommandargv-codepromisecode)
  * [lackey.validateProject()](#lackeyvalidateproject)
****

* [actions](./actions)
  * [lackey-cms/runtime/actions/ProjectCreate](./actions/ProjectCreate.md)
  * [lackey-cms/runtime/actions/SiteDebug](./actions/SiteDebug.md)
  * [lackey-cms/runtime/actions/SiteRun](./actions/SiteRun.md)



<!-- /RM -->

**See**: Based on https://github.com/serverless/serverless/blob/master/lib/Serverless.js  

* [lackey-cms/runtime](#module_lackey-cms/runtime)
    * [~Lackey](#module_lackey-cms/runtime..Lackey)
        * [new Lackey(config)](#new_module_lackey-cms/runtime..Lackey_new)
        * [.addPlugin(ServerlessPlugin)](#module_lackey-cms/runtime..Lackey+addPlugin) ⇒ <code>Promise</code>
        * [.addAction(action, config)](#module_lackey-cms/runtime..Lackey+addAction)
        * [.command(argv)](#module_lackey-cms/runtime..Lackey+command) ⇒ <code>Promise</code>
        * [.validateProject()](#module_lackey-cms/runtime..Lackey+validateProject)

<a name="module_lackey-cms/runtime..Lackey"></a>
### lackey-cms/runtime~Lackey
**Kind**: inner class of <code>[lackey-cms/runtime](#module_lackey-cms/runtime)</code>  

* [~Lackey](#module_lackey-cms/runtime..Lackey)
    * [new Lackey(config)](#new_module_lackey-cms/runtime..Lackey_new)
    * [.addPlugin(ServerlessPlugin)](#module_lackey-cms/runtime..Lackey+addPlugin) ⇒ <code>Promise</code>
    * [.addAction(action, config)](#module_lackey-cms/runtime..Lackey+addAction)
    * [.command(argv)](#module_lackey-cms/runtime..Lackey+command) ⇒ <code>Promise</code>
    * [.validateProject()](#module_lackey-cms/runtime..Lackey+validateProject)

<a name="new_module_lackey-cms/runtime..Lackey_new"></a>
#### new Lackey(config)
Runtime contstructor


| Param | Type |
| --- | --- |
| config | <code>object</code> | 

<a name="module_lackey-cms/runtime..Lackey+addPlugin"></a>
#### lackey.addPlugin(ServerlessPlugin) ⇒ <code>Promise</code>
Add Plugin

**Kind**: instance method of <code>[Lackey](#module_lackey-cms/runtime..Lackey)</code>  

| Param | Type | Description |
| --- | --- | --- |
| ServerlessPlugin | <code>lackey-cms/runtime/Plugin</code> | class object |

<a name="module_lackey-cms/runtime..Lackey+addAction"></a>
#### lackey.addAction(action, config)
Add action

**Kind**: instance method of <code>[Lackey](#module_lackey-cms/runtime..Lackey)</code>  

| Param | Description |
| --- | --- |
| action | must   return an ES6 BbPromise that is resolved or rejected |
| config |  |

<a name="module_lackey-cms/runtime..Lackey+command"></a>
#### lackey.command(argv) ⇒ <code>Promise</code>
Command

**Kind**: instance method of <code>[Lackey](#module_lackey-cms/runtime..Lackey)</code>  

| Param |
| --- |
| argv | 

<a name="module_lackey-cms/runtime..Lackey+validateProject"></a>
#### lackey.validateProject()
Validate Project
Ensures:

**Kind**: instance method of <code>[Lackey](#module_lackey-cms/runtime..Lackey)</code>  

----

Generated with [gulp-jsdoc-to-markdown](https://www.npmjs.com/package/gulp-jsdoc-to-markdown) and [roadmarks](https://github.com/sielay/roadmarks).

&copy; Enigma Marketing Services 2016
