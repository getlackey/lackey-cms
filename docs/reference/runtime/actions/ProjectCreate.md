
# lackey-cms/runtime/actions/ProjectCreate

<!-- RM(tree:*,content:false) -->

[Got to top](/README.md)

* [module.exports(SPlugin, lackeyPath) ⇒ <code>class</code> ⏏](#moduleexportssplugin-lackeypath-codeclasscode-)
  * [module.exports~ProjectCreate](#moduleexportsprojectcreate)
    * [new ProjectCreate(S, config)](#new-projectcreates-config)
    * [projectCreate.registerActions() ⇒ <code>Promise</code>](#projectcreateregisteractions-codepromisecode)
    * [projectCreate.projectCreate(evt) ⇒ <code>Promise</code>](#projectcreateprojectcreateevt-codepromisecode)
    * [projectCreate._create(projectName)](#projectcreate_createprojectname)
    * [ProjectCreate.getName() ⇒ <code>string</code>](#projectcreategetname-codestringcode)


<!-- /RM -->


* [lackey-cms/runtime/actions/ProjectCreate](#module_lackey-cms/runtime/actions/ProjectCreate)
    * [module.exports(SPlugin, lackeyPath)](#exp_module_lackey-cms/runtime/actions/ProjectCreate--module.exports) ⇒ <code>class</code> ⏏
        * [~ProjectCreate](#module_lackey-cms/runtime/actions/ProjectCreate--module.exports..ProjectCreate)
            * [new ProjectCreate(S, config)](#new_module_lackey-cms/runtime/actions/ProjectCreate--module.exports..ProjectCreate_new)
            * _instance_
                * [.registerActions()](#module_lackey-cms/runtime/actions/ProjectCreate--module.exports..ProjectCreate+registerActions) ⇒ <code>Promise</code>
                * [.projectCreate(evt)](#module_lackey-cms/runtime/actions/ProjectCreate--module.exports..ProjectCreate+projectCreate) ⇒ <code>Promise</code>
                * [._create(projectName)](#module_lackey-cms/runtime/actions/ProjectCreate--module.exports..ProjectCreate+_create)
            * _static_
                * [.getName()](#module_lackey-cms/runtime/actions/ProjectCreate--module.exports..ProjectCreate.getName) ⇒ <code>string</code>

<a name="exp_module_lackey-cms/runtime/actions/ProjectCreate--module.exports"></a>
### module.exports(SPlugin, lackeyPath) ⇒ <code>class</code> ⏏
Plugin Factory

**Kind**: Exported function  
**Returns**: <code>class</code> - SiteRun  

| Param | Type | Description |
| --- | --- | --- |
| SPlugin | <code>lackey-cms/runtime/Plugin</code> |  |
| lackeyPath | <code>string</code> | TODO: change to global |

<a name="module_lackey-cms/runtime/actions/ProjectCreate--module.exports..ProjectCreate"></a>
#### module.exports~ProjectCreate
**Kind**: inner class of <code>[module.exports](#exp_module_lackey-cms/runtime/actions/ProjectCreate--module.exports)</code>  

* [~ProjectCreate](#module_lackey-cms/runtime/actions/ProjectCreate--module.exports..ProjectCreate)
    * [new ProjectCreate(S, config)](#new_module_lackey-cms/runtime/actions/ProjectCreate--module.exports..ProjectCreate_new)
    * _instance_
        * [.registerActions()](#module_lackey-cms/runtime/actions/ProjectCreate--module.exports..ProjectCreate+registerActions) ⇒ <code>Promise</code>
        * [.projectCreate(evt)](#module_lackey-cms/runtime/actions/ProjectCreate--module.exports..ProjectCreate+projectCreate) ⇒ <code>Promise</code>
        * [._create(projectName)](#module_lackey-cms/runtime/actions/ProjectCreate--module.exports..ProjectCreate+_create)
    * _static_
        * [.getName()](#module_lackey-cms/runtime/actions/ProjectCreate--module.exports..ProjectCreate.getName) ⇒ <code>string</code>

<a name="new_module_lackey-cms/runtime/actions/ProjectCreate--module.exports..ProjectCreate_new"></a>
##### new ProjectCreate(S, config)

| Param | Type | Description |
| --- | --- | --- |
| S | <code>object</code> | runtime |
| config | <code>object</code> |  |

<a name="module_lackey-cms/runtime/actions/ProjectCreate--module.exports..ProjectCreate+registerActions"></a>
##### projectCreate.registerActions() ⇒ <code>Promise</code>
**Kind**: instance method of <code>[ProjectCreate](#module_lackey-cms/runtime/actions/ProjectCreate--module.exports..ProjectCreate)</code>  
**Returns**: <code>Promise</code> - upon completion of all registrations  
<a name="module_lackey-cms/runtime/actions/ProjectCreate--module.exports..ProjectCreate+projectCreate"></a>
##### projectCreate.projectCreate(evt) ⇒ <code>Promise</code>
Action

**Kind**: instance method of <code>[ProjectCreate](#module_lackey-cms/runtime/actions/ProjectCreate--module.exports..ProjectCreate)</code>  

| Param | Type |
| --- | --- |
| evt | <code>object</code> | 

<a name="module_lackey-cms/runtime/actions/ProjectCreate--module.exports..ProjectCreate+_create"></a>
##### projectCreate._create(projectName)
Creates new project

**Kind**: instance method of <code>[ProjectCreate](#module_lackey-cms/runtime/actions/ProjectCreate--module.exports..ProjectCreate)</code>  

| Param | Type |
| --- | --- |
| projectName | <code>string</code> | 

<a name="module_lackey-cms/runtime/actions/ProjectCreate--module.exports..ProjectCreate.getName"></a>
##### ProjectCreate.getName() ⇒ <code>string</code>
Define your plugins name

**Kind**: static method of <code>[ProjectCreate](#module_lackey-cms/runtime/actions/ProjectCreate--module.exports..ProjectCreate)</code>  

----

Generated with [gulp-jsdoc-to-markdown](https://www.npmjs.com/package/gulp-jsdoc-to-markdown) and [roadmarks](https://github.com/sielay/roadmarks).

&copy; Enigma Marketing Services 2016
