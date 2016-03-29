
# lackey-cms/runtime/Plugin

<!-- RM(tree:*,content:false) -->

[Got to top](/README.md)

* [lackey-cms/runtime/Plugin~LackeyPlugin](#lackey-cmsruntimepluginlackeyplugin)
  * [new LackeyPlugin()](#new-lackeyplugin)
  * [lackeyPlugin.registerActions()](#lackeypluginregisteractions)
  * [lackeyPlugin.registerHooks()](#lackeypluginregisterhooks)
  * [lackeyPlugin.cliPromptInput(promptSchema, overrides) ⇒ <code>Promise</code>](#lackeypluginclipromptinputpromptschema-overrides-codepromisecode)
  * [lackeyPlugin.cliPromptSelect(message, choices, multi, doneLabel) ⇒ <code>Promise</code>](#lackeypluginclipromptselectmessage-choices-multi-donelabel-codepromisecode)
  * [lackeyPlugin.cliPromptSelectSite()](#lackeypluginclipromptselectsite)
  * [LackeyPlugin.getName()](#lackeyplugingetname)
****

* [actions](./actions)
  * [lackey-cms/runtime/actions/ProjectCreate](./actions/ProjectCreate.md)
  * [lackey-cms/runtime/actions/SiteDebug](./actions/SiteDebug.md)
  * [lackey-cms/runtime/actions/SiteRun](./actions/SiteRun.md)



<!-- /RM -->

**See**: Based on https://raw.githubusercontent.com/serverless/serverless/master/lib/ServerlessPlugin.js  

* [lackey-cms/runtime/Plugin](#module_lackey-cms/runtime/Plugin)
    * [~LackeyPlugin](#module_lackey-cms/runtime/Plugin..LackeyPlugin)
        * [new LackeyPlugin()](#new_module_lackey-cms/runtime/Plugin..LackeyPlugin_new)
        * _instance_
            * [.registerActions()](#module_lackey-cms/runtime/Plugin..LackeyPlugin+registerActions)
            * [.registerHooks()](#module_lackey-cms/runtime/Plugin..LackeyPlugin+registerHooks)
            * [.cliPromptInput(promptSchema, overrides)](#module_lackey-cms/runtime/Plugin..LackeyPlugin+cliPromptInput) ⇒ <code>Promise</code>
            * [.cliPromptSelect(message, choices, multi, doneLabel)](#module_lackey-cms/runtime/Plugin..LackeyPlugin+cliPromptSelect) ⇒ <code>Promise</code>
            * [.cliPromptSelectSite()](#module_lackey-cms/runtime/Plugin..LackeyPlugin+cliPromptSelectSite)
        * _static_
            * [.getName()](#module_lackey-cms/runtime/Plugin..LackeyPlugin.getName)

<a name="module_lackey-cms/runtime/Plugin..LackeyPlugin"></a>
### lackey-cms/runtime/Plugin~LackeyPlugin
This is the base class that all Lackey Plugins should extend.

**Kind**: inner class of <code>[lackey-cms/runtime/Plugin](#module_lackey-cms/runtime/Plugin)</code>  

* [~LackeyPlugin](#module_lackey-cms/runtime/Plugin..LackeyPlugin)
    * [new LackeyPlugin()](#new_module_lackey-cms/runtime/Plugin..LackeyPlugin_new)
    * _instance_
        * [.registerActions()](#module_lackey-cms/runtime/Plugin..LackeyPlugin+registerActions)
        * [.registerHooks()](#module_lackey-cms/runtime/Plugin..LackeyPlugin+registerHooks)
        * [.cliPromptInput(promptSchema, overrides)](#module_lackey-cms/runtime/Plugin..LackeyPlugin+cliPromptInput) ⇒ <code>Promise</code>
        * [.cliPromptSelect(message, choices, multi, doneLabel)](#module_lackey-cms/runtime/Plugin..LackeyPlugin+cliPromptSelect) ⇒ <code>Promise</code>
        * [.cliPromptSelectSite()](#module_lackey-cms/runtime/Plugin..LackeyPlugin+cliPromptSelectSite)
    * _static_
        * [.getName()](#module_lackey-cms/runtime/Plugin..LackeyPlugin.getName)

<a name="new_module_lackey-cms/runtime/Plugin..LackeyPlugin_new"></a>
#### new LackeyPlugin()
Constructor

<a name="module_lackey-cms/runtime/Plugin..LackeyPlugin+registerActions"></a>
#### lackeyPlugin.registerActions()
Register Actions

**Kind**: instance method of <code>[LackeyPlugin](#module_lackey-cms/runtime/Plugin..LackeyPlugin)</code>  
<a name="module_lackey-cms/runtime/Plugin..LackeyPlugin+registerHooks"></a>
#### lackeyPlugin.registerHooks()
Register Hooks

**Kind**: instance method of <code>[LackeyPlugin](#module_lackey-cms/runtime/Plugin..LackeyPlugin)</code>  
<a name="module_lackey-cms/runtime/Plugin..LackeyPlugin+cliPromptInput"></a>
#### lackeyPlugin.cliPromptInput(promptSchema, overrides) ⇒ <code>Promise</code>
CLI: Prompt Input
- Handy CLI Prompt Input function for Plugins

**Kind**: instance method of <code>[LackeyPlugin](#module_lackey-cms/runtime/Plugin..LackeyPlugin)</code>  
**Returns**: <code>Promise</code> - containing answers by key  

| Param | Description |
| --- | --- |
| promptSchema | @see https://github.com/flatiron/prompt#prompting-with-validation-default-values-and-more-complex-properties |
| overrides | map |

<a name="module_lackey-cms/runtime/Plugin..LackeyPlugin+cliPromptSelect"></a>
#### lackeyPlugin.cliPromptSelect(message, choices, multi, doneLabel) ⇒ <code>Promise</code>
CLI: Prompt Select
- Handy CLI Select Input function for Plugins

**Kind**: instance method of <code>[LackeyPlugin](#module_lackey-cms/runtime/Plugin..LackeyPlugin)</code>  

| Param | Description |
| --- | --- |
| message | string |
| choices |  |
| multi | boolean |
| doneLabel | string optional |

<a name="module_lackey-cms/runtime/Plugin..LackeyPlugin+cliPromptSelectSite"></a>
#### lackeyPlugin.cliPromptSelectSite()
CLI: Prompt Select Site

**Kind**: instance method of <code>[LackeyPlugin](#module_lackey-cms/runtime/Plugin..LackeyPlugin)</code>  
<a name="module_lackey-cms/runtime/Plugin..LackeyPlugin.getName"></a>
#### LackeyPlugin.getName()
Define your plugins name

**Kind**: static method of <code>[LackeyPlugin](#module_lackey-cms/runtime/Plugin..LackeyPlugin)</code>  

----

Generated with [gulp-jsdoc-to-markdown](https://www.npmjs.com/package/gulp-jsdoc-to-markdown) and [roadmarks](https://github.com/sielay/roadmarks).

&copy; Enigma Marketing Services 2016
