
# lackey-cms/runtime/actions/SiteDebug

<!-- RM(tree:*,content:false) -->

[Got to top](/README.md)

* [module.exports(SPlugin, lackeyPath) ⇒ <code>class</code> ⏏](#moduleexportssplugin-lackeypath-codeclasscode-)
  * [module.exports~SiteDebug](#moduleexportssitedebug)
    * [new SiteDebug(S, config)](#new-sitedebugs-config)
    * [siteDebug.registerActions() ⇒ <code>Promise</code>](#sitedebugregisteractions-codepromisecode)
    * [siteDebug.siteDebug(evt)](#sitedebugsitedebugevt)
    * [siteDebug._prompt() ⇒ <code>Promise</code>](#sitedebug_prompt-codepromisecode)
    * [SiteDebug.getName() ⇒ <code>string</code>](#sitedebuggetname-codestringcode)


<!-- /RM -->


* [lackey-cms/runtime/actions/SiteDebug](#module_lackey-cms/runtime/actions/SiteDebug)
    * [module.exports(SPlugin, lackeyPath)](#exp_module_lackey-cms/runtime/actions/SiteDebug--module.exports) ⇒ <code>class</code> ⏏
        * [~SiteDebug](#module_lackey-cms/runtime/actions/SiteDebug--module.exports..SiteDebug)
            * [new SiteDebug(S, config)](#new_module_lackey-cms/runtime/actions/SiteDebug--module.exports..SiteDebug_new)
            * _instance_
                * [.registerActions()](#module_lackey-cms/runtime/actions/SiteDebug--module.exports..SiteDebug+registerActions) ⇒ <code>Promise</code>
                * [.siteDebug(evt)](#module_lackey-cms/runtime/actions/SiteDebug--module.exports..SiteDebug+siteDebug)
                * [._prompt()](#module_lackey-cms/runtime/actions/SiteDebug--module.exports..SiteDebug+_prompt) ⇒ <code>Promise</code>
            * _static_
                * [.getName()](#module_lackey-cms/runtime/actions/SiteDebug--module.exports..SiteDebug.getName) ⇒ <code>string</code>

<a name="exp_module_lackey-cms/runtime/actions/SiteDebug--module.exports"></a>
### module.exports(SPlugin, lackeyPath) ⇒ <code>class</code> ⏏
Plugin factory

**Kind**: Exported function  
**Returns**: <code>class</code> - SiteDebug  

| Param | Type | Description |
| --- | --- | --- |
| SPlugin | <code>lackey-cms/runtime/Plugin</code> |  |
| lackeyPath | <code>string</code> | path to lackey TODO: replace with global |

<a name="module_lackey-cms/runtime/actions/SiteDebug--module.exports..SiteDebug"></a>
#### module.exports~SiteDebug
**Kind**: inner class of <code>[module.exports](#exp_module_lackey-cms/runtime/actions/SiteDebug--module.exports)</code>  

* [~SiteDebug](#module_lackey-cms/runtime/actions/SiteDebug--module.exports..SiteDebug)
    * [new SiteDebug(S, config)](#new_module_lackey-cms/runtime/actions/SiteDebug--module.exports..SiteDebug_new)
    * _instance_
        * [.registerActions()](#module_lackey-cms/runtime/actions/SiteDebug--module.exports..SiteDebug+registerActions) ⇒ <code>Promise</code>
        * [.siteDebug(evt)](#module_lackey-cms/runtime/actions/SiteDebug--module.exports..SiteDebug+siteDebug)
        * [._prompt()](#module_lackey-cms/runtime/actions/SiteDebug--module.exports..SiteDebug+_prompt) ⇒ <code>Promise</code>
    * _static_
        * [.getName()](#module_lackey-cms/runtime/actions/SiteDebug--module.exports..SiteDebug.getName) ⇒ <code>string</code>

<a name="new_module_lackey-cms/runtime/actions/SiteDebug--module.exports..SiteDebug_new"></a>
##### new SiteDebug(S, config)

| Param | Type | Description |
| --- | --- | --- |
| S | <code>object</code> | runtime |
| config | <code>object</code> |  |

<a name="module_lackey-cms/runtime/actions/SiteDebug--module.exports..SiteDebug+registerActions"></a>
##### siteDebug.registerActions() ⇒ <code>Promise</code>
**Kind**: instance method of <code>[SiteDebug](#module_lackey-cms/runtime/actions/SiteDebug--module.exports..SiteDebug)</code>  
**Returns**: <code>Promise</code> - upon completion of all registrations  
<a name="module_lackey-cms/runtime/actions/SiteDebug--module.exports..SiteDebug+siteDebug"></a>
##### siteDebug.siteDebug(evt)
Action

**Kind**: instance method of <code>[SiteDebug](#module_lackey-cms/runtime/actions/SiteDebug--module.exports..SiteDebug)</code>  

| Param | Type |
| --- | --- |
| evt | <code>object</code> | 

<a name="module_lackey-cms/runtime/actions/SiteDebug--module.exports..SiteDebug+_prompt"></a>
##### siteDebug._prompt() ⇒ <code>Promise</code>
Prompt site

**Kind**: instance method of <code>[SiteDebug](#module_lackey-cms/runtime/actions/SiteDebug--module.exports..SiteDebug)</code>  
<a name="module_lackey-cms/runtime/actions/SiteDebug--module.exports..SiteDebug.getName"></a>
##### SiteDebug.getName() ⇒ <code>string</code>
Define your plugins name

**Kind**: static method of <code>[SiteDebug](#module_lackey-cms/runtime/actions/SiteDebug--module.exports..SiteDebug)</code>  

----

Generated with [gulp-jsdoc-to-markdown](https://www.npmjs.com/package/gulp-jsdoc-to-markdown) and [roadmarks](https://github.com/sielay/roadmarks).

&copy; Enigma Marketing Services 2016
