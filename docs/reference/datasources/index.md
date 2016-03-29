
# lackey-cms/datasources

<!-- RM(tree:*,content:false) -->

[Got to top](/README.md)

* [lackey-cms/datasources~DataSourcesManager](#lackey-cmsdatasourcesdatasourcesmanager)
  * [dataSourcesManager.connect(config) ⇒ <code>Promise</code>](#datasourcesmanagerconnectconfig-codepromisecode)
  * [dataSourcesManager.get(provider, connectionName) ⇒ <code>mixed</code> &#124; <code>null</code>](#datasourcesmanagergetprovider-connectionname-codemixedcode-124-codenullcode)
  * [dataSourcesManager.set(provider, connectionName, connection) ⇒ <code>object</code>](#datasourcesmanagersetprovider-connectionname-connection-codeobjectcode)
  * [dataSourcesManager._connectPostgreses(connections) ⇒ <code>Promise</code>](#datasourcesmanager_connectpostgresesconnections-codepromisecode)
  * [dataSourcesManager._connectPostgres(connectionName, config) ⇒ <code>Promise</code>](#datasourcesmanager_connectpostgresconnectionname-config-codepromisecode)
* [lackey-cms/datasources~PgConfig : <code>Object</code>](#lackey-cmsdatasourcespgconfig-codeobjectcode)
* [lackey-cms/datasources~DBConfigObject : <code>Object</code>](#lackey-cmsdatasourcesdbconfigobject-codeobjectcode)


<!-- /RM -->


* [lackey-cms/datasources](#module_lackey-cms/datasources)
    * [~DataSourcesManager](#module_lackey-cms/datasources..DataSourcesManager)
        * [.connect(config)](#module_lackey-cms/datasources..DataSourcesManager+connect) ⇒ <code>Promise</code>
        * [.get(provider, connectionName)](#module_lackey-cms/datasources..DataSourcesManager+get) ⇒ <code>mixed</code> &#124; <code>null</code>
        * [.set(provider, connectionName, connection)](#module_lackey-cms/datasources..DataSourcesManager+set) ⇒ <code>object</code>
        * [._connectPostgreses(connections)](#module_lackey-cms/datasources..DataSourcesManager+_connectPostgreses) ⇒ <code>Promise</code>
        * [._connectPostgres(connectionName, config)](#module_lackey-cms/datasources..DataSourcesManager+_connectPostgres) ⇒ <code>Promise</code>
    * [~PgConfig](#module_lackey-cms/datasources..PgConfig) : <code>Object</code>
    * [~DBConfigObject](#module_lackey-cms/datasources..DBConfigObject) : <code>Object</code>

<a name="module_lackey-cms/datasources..DataSourcesManager"></a>
### lackey-cms/datasources~DataSourcesManager
**Kind**: inner class of <code>[lackey-cms/datasources](#module_lackey-cms/datasources)</code>  

* [~DataSourcesManager](#module_lackey-cms/datasources..DataSourcesManager)
    * [.connect(config)](#module_lackey-cms/datasources..DataSourcesManager+connect) ⇒ <code>Promise</code>
    * [.get(provider, connectionName)](#module_lackey-cms/datasources..DataSourcesManager+get) ⇒ <code>mixed</code> &#124; <code>null</code>
    * [.set(provider, connectionName, connection)](#module_lackey-cms/datasources..DataSourcesManager+set) ⇒ <code>object</code>
    * [._connectPostgreses(connections)](#module_lackey-cms/datasources..DataSourcesManager+_connectPostgreses) ⇒ <code>Promise</code>
    * [._connectPostgres(connectionName, config)](#module_lackey-cms/datasources..DataSourcesManager+_connectPostgres) ⇒ <code>Promise</code>

<a name="module_lackey-cms/datasources..DataSourcesManager+connect"></a>
#### dataSourcesManager.connect(config) ⇒ <code>Promise</code>
Connects to datasources

**Kind**: instance method of <code>[DataSourcesManager](#module_lackey-cms/datasources..DataSourcesManager)</code>  

| Param | Type |
| --- | --- |
| config | <code>DBConfigObject</code> | 

<a name="module_lackey-cms/datasources..DataSourcesManager+get"></a>
#### dataSourcesManager.get(provider, connectionName) ⇒ <code>mixed</code> &#124; <code>null</code>
Gets connection object

**Kind**: instance method of <code>[DataSourcesManager](#module_lackey-cms/datasources..DataSourcesManager)</code>  

| Param | Type |
| --- | --- |
| provider | <code>string</code> | 
| connectionName | <code>string</code> | 

<a name="module_lackey-cms/datasources..DataSourcesManager+set"></a>
#### dataSourcesManager.set(provider, connectionName, connection) ⇒ <code>object</code>
Sets connection object

**Kind**: instance method of <code>[DataSourcesManager](#module_lackey-cms/datasources..DataSourcesManager)</code>  
**Returns**: <code>object</code> - given connection  

| Param | Type |
| --- | --- |
| provider | <code>string</code> | 
| connectionName | <code>string</code> | 
| connection | <code>object</code> | 

<a name="module_lackey-cms/datasources..DataSourcesManager+_connectPostgreses"></a>
#### dataSourcesManager._connectPostgreses(connections) ⇒ <code>Promise</code>
Connects to PostgreSQL

**Kind**: instance method of <code>[DataSourcesManager](#module_lackey-cms/datasources..DataSourcesManager)</code>  

| Param | Type |
| --- | --- |
| connections | <code>Hash.&lt;String, PGDBConfig&gt;</code> | 

<a name="module_lackey-cms/datasources..DataSourcesManager+_connectPostgres"></a>
#### dataSourcesManager._connectPostgres(connectionName, config) ⇒ <code>Promise</code>
Connects to PG

**Kind**: instance method of <code>[DataSourcesManager](#module_lackey-cms/datasources..DataSourcesManager)</code>  

| Param | Type |
| --- | --- |
| connectionName | <code>string</code> | 
| config | <code>PGDBConfig</code> | 

<a name="module_lackey-cms/datasources..PgConfig"></a>
### lackey-cms/datasources~PgConfig : <code>Object</code>
PG Config Object

**Kind**: inner typedef of <code>[lackey-cms/datasources](#module_lackey-cms/datasources)</code>  
**Properties**

| Name | Type |
| --- | --- |
| dsn | <code>string</code> | 

<a name="module_lackey-cms/datasources..DBConfigObject"></a>
### lackey-cms/datasources~DBConfigObject : <code>Object</code>
Config Object

**Kind**: inner typedef of <code>[lackey-cms/datasources](#module_lackey-cms/datasources)</code>  
**Properties**

| Name | Type |
| --- | --- |
| pg | <code>Hash.&lt;String, PgConfig&gt;</code> | 


----

Generated with [gulp-jsdoc-to-markdown](https://www.npmjs.com/package/gulp-jsdoc-to-markdown) and [roadmarks](https://github.com/sielay/roadmarks).

&copy; Enigma Marketing Services 2016
