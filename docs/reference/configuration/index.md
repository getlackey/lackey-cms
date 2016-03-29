
# lackey-cms/configuration

<!-- RM(tree:*,content:false) -->

[Got to top](/README.md)

* [module.exports(site, stage) ⏏](#moduleexportssite-stage-)
  * [module.exports~Configuration](#moduleexportsconfiguration)
    * [new Configuration(site, stage)](#new-configurationsite-stage)
    * [configuration.load() ⇒ <code>Promise.&lt;Config&gt;</code>](#configurationload-codepromiseltconfiggtcode)
    * [configuration.isTest() ⇒ <code>Boolean</code>](#configurationistest-codebooleancode)
    * [configuration.get(name) ⇒ <code>mixed</code> &#124; <code>null</code>](#configurationgetname-codemixedcode-124-codenullcode)


<!-- /RM -->


* [lackey-cms/configuration](#module_lackey-cms/configuration)
    * [module.exports(site, stage)](#exp_module_lackey-cms/configuration--module.exports) ⏏
        * [~Configuration](#module_lackey-cms/configuration--module.exports..Configuration)
            * [new Configuration(site, stage)](#new_module_lackey-cms/configuration--module.exports..Configuration_new)
            * [.load()](#module_lackey-cms/configuration--module.exports..Configuration+load) ⇒ <code>Promise.&lt;Config&gt;</code>
            * [.isTest()](#module_lackey-cms/configuration--module.exports..Configuration+isTest) ⇒ <code>Boolean</code>
            * [.get(name)](#module_lackey-cms/configuration--module.exports..Configuration+get) ⇒ <code>mixed</code> &#124; <code>null</code>

<a name="exp_module_lackey-cms/configuration--module.exports"></a>
### module.exports(site, stage) ⏏
Setups module and overrides it

**Kind**: Exported function  

| Param | Type |
| --- | --- |
| site | <code>string</code> | 
| stage | <code>string</code> | 

<a name="module_lackey-cms/configuration--module.exports..Configuration"></a>
#### module.exports~Configuration
Manages configuration loading. Configuration is composed from layers, where every next can override previous. Order of loading is:

- CMS config for stage (or default, if stage doesn't exists)
- Stack config for stage  (or default, if stage doesn't exists)
- Site config for stage (or default, if stage doesn't exists)

**Kind**: inner class of <code>[module.exports](#exp_module_lackey-cms/configuration--module.exports)</code>  

* [~Configuration](#module_lackey-cms/configuration--module.exports..Configuration)
    * [new Configuration(site, stage)](#new_module_lackey-cms/configuration--module.exports..Configuration_new)
    * [.load()](#module_lackey-cms/configuration--module.exports..Configuration+load) ⇒ <code>Promise.&lt;Config&gt;</code>
    * [.isTest()](#module_lackey-cms/configuration--module.exports..Configuration+isTest) ⇒ <code>Boolean</code>
    * [.get(name)](#module_lackey-cms/configuration--module.exports..Configuration+get) ⇒ <code>mixed</code> &#124; <code>null</code>

<a name="new_module_lackey-cms/configuration--module.exports..Configuration_new"></a>
##### new Configuration(site, stage)

| Param | Type | Description |
| --- | --- | --- |
| site | <code>string</code> | website name |
| stage | <code>string</code> | staging environment |

<a name="module_lackey-cms/configuration--module.exports..Configuration+load"></a>
##### configuration.load() ⇒ <code>Promise.&lt;Config&gt;</code>
Loads configuration

**Kind**: instance method of <code>[Configuration](#module_lackey-cms/configuration--module.exports..Configuration)</code>  
<a name="module_lackey-cms/configuration--module.exports..Configuration+isTest"></a>
##### configuration.isTest() ⇒ <code>Boolean</code>
Informs is application runs in test mode

**Kind**: instance method of <code>[Configuration](#module_lackey-cms/configuration--module.exports..Configuration)</code>  
**Returns**: <code>Boolean</code> - is in test mode  
<a name="module_lackey-cms/configuration--module.exports..Configuration+get"></a>
##### configuration.get(name) ⇒ <code>mixed</code> &#124; <code>null</code>
Gets field from configuration. Accept dot notation as defined in https://www.npmjs.com/package/object-path

**Kind**: instance method of <code>[Configuration](#module_lackey-cms/configuration--module.exports..Configuration)</code>  

| Param | Type |
| --- | --- |
| name | <code>string</code> | 


----

Generated with [gulp-jsdoc-to-markdown](https://www.npmjs.com/package/gulp-jsdoc-to-markdown) and [roadmarks](https://github.com/sielay/roadmarks).

&copy; Enigma Marketing Services 2016
