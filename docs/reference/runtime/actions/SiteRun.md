
# lackey-cms/runtime/actions/SiteRun

<!-- RM(tree:*,content:false) -->

[Got to top](/README.md)

* [module.exports(SPlugin, lackeyPath) ⇒ <code>class</code> ⏏](#moduleexportssplugin-lackeypath-codeclasscode-)
  * [module.exports~SiteRun](#moduleexportssiterun)
    * [new SiteRun(S, config)](#new-siteruns-config)
    * [siteRun.registerActions() ⇒ <code>Promise</code>](#siterunregisteractions-codepromisecode)
    * [siteRun.siteRun(evt) ⇒ <code>Promise</code>](#siterunsiterunevt-codepromisecode)
    * [SiteRun.getName() ⇒ <code>string</code>](#siterungetname-codestringcode)


<!-- /RM -->


* [lackey-cms/runtime/actions/SiteRun](#module_lackey-cms/runtime/actions/SiteRun)
    * [module.exports(SPlugin, lackeyPath)](#exp_module_lackey-cms/runtime/actions/SiteRun--module.exports) ⇒ <code>class</code> ⏏
        * [~SiteRun](#module_lackey-cms/runtime/actions/SiteRun--module.exports..SiteRun)
            * [new SiteRun(S, config)](#new_module_lackey-cms/runtime/actions/SiteRun--module.exports..SiteRun_new)
            * _instance_
                * [.registerActions()](#module_lackey-cms/runtime/actions/SiteRun--module.exports..SiteRun+registerActions) ⇒ <code>Promise</code>
                * [.siteRun(evt)](#module_lackey-cms/runtime/actions/SiteRun--module.exports..SiteRun+siteRun) ⇒ <code>Promise</code>
            * _static_
                * [.getName()](#module_lackey-cms/runtime/actions/SiteRun--module.exports..SiteRun.getName) ⇒ <code>string</code>

<a name="exp_module_lackey-cms/runtime/actions/SiteRun--module.exports"></a>
### module.exports(SPlugin, lackeyPath) ⇒ <code>class</code> ⏏
Plugin Factory

**Kind**: Exported function  
**Returns**: <code>class</code> - SiteRun  

| Param | Type | Description |
| --- | --- | --- |
| SPlugin | <code>lackey-cms/runtime/Plugin</code> |  |
| lackeyPath | <code>string</code> | TODO: change to global |

<a name="module_lackey-cms/runtime/actions/SiteRun--module.exports..SiteRun"></a>
#### module.exports~SiteRun
**Kind**: inner class of <code>[module.exports](#exp_module_lackey-cms/runtime/actions/SiteRun--module.exports)</code>  

* [~SiteRun](#module_lackey-cms/runtime/actions/SiteRun--module.exports..SiteRun)
    * [new SiteRun(S, config)](#new_module_lackey-cms/runtime/actions/SiteRun--module.exports..SiteRun_new)
    * _instance_
        * [.registerActions()](#module_lackey-cms/runtime/actions/SiteRun--module.exports..SiteRun+registerActions) ⇒ <code>Promise</code>
        * [.siteRun(evt)](#module_lackey-cms/runtime/actions/SiteRun--module.exports..SiteRun+siteRun) ⇒ <code>Promise</code>
    * _static_
        * [.getName()](#module_lackey-cms/runtime/actions/SiteRun--module.exports..SiteRun.getName) ⇒ <code>string</code>

<a name="new_module_lackey-cms/runtime/actions/SiteRun--module.exports..SiteRun_new"></a>
##### new SiteRun(S, config)

| Param | Type | Description |
| --- | --- | --- |
| S | <code>object</code> | runtime |
| config | <code>object</code> |  |

<a name="module_lackey-cms/runtime/actions/SiteRun--module.exports..SiteRun+registerActions"></a>
##### siteRun.registerActions() ⇒ <code>Promise</code>
**Kind**: instance method of <code>[SiteRun](#module_lackey-cms/runtime/actions/SiteRun--module.exports..SiteRun)</code>  
**Returns**: <code>Promise</code> - upon completion of all registrations  
<a name="module_lackey-cms/runtime/actions/SiteRun--module.exports..SiteRun+siteRun"></a>
##### siteRun.siteRun(evt) ⇒ <code>Promise</code>
Action

**Kind**: instance method of <code>[SiteRun](#module_lackey-cms/runtime/actions/SiteRun--module.exports..SiteRun)</code>  

| Param | Type |
| --- | --- |
| evt | <code>object</code> | 

<a name="module_lackey-cms/runtime/actions/SiteRun--module.exports..SiteRun.getName"></a>
##### SiteRun.getName() ⇒ <code>string</code>
Define your plugins name

**Kind**: static method of <code>[SiteRun](#module_lackey-cms/runtime/actions/SiteRun--module.exports..SiteRun)</code>  

----

Generated with [gulp-jsdoc-to-markdown](https://www.npmjs.com/package/gulp-jsdoc-to-markdown) and [roadmarks](https://github.com/sielay/roadmarks).

&copy; Enigma Marketing Services 2016
