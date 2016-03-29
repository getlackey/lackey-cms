# Modules

<!-- RM-IGNORE -->
## Table of contents
<!-- /RM-IGNORE -->
<!-- RM(tree:*) -->

[Got to parent](./../README.md) | [Got to top](/README.md)

* [Module life cycle](#module-life-cycle)
* [Application of MVC and DDD](#application-of-mvc-and-ddd)
  * [Server: M for Model](#server-m-for-model)
    * [Example from Core module](#example-from-core-module)
  * [Server: V for View](#server-v-for-view)
    * [JSON VIEW](#json-view)
  * [Server: C for Controller](#server-c-for-controller)
  * [Routes](#routes)
    * [Express Route](#express-route)
    * [Falcor Route](#falcor-route)
  * [Policy](#policy)
  * [Controllers](#controllers)
    * [Express Controller](#express-controller)
    * [Faclor Controller](#faclor-controller)
    * [CRUD Controller](#crud-controller)
  * [Client MVC](#client-mvc)
* [Structure](#structure)
  * [client](#client)
    * [js](#js)
    * [scss](#scss)
    * [img](#img)
    * [views](#views)
  * [docs](#docs)
    * [reference](#reference)
  * [server](#server)
    * [controllers](#controllers)
    * [lib](#lib)
    * [models](#models)
    * [policies](#policies)
    * [routes](#routes)
    * [views](#views)
  * [shared](#shared)
    * [views](#views)
  * [test](#test)
    * [client](#client)
    * [e2e](#e2e)
    * [server](#server)
  * [index.js](#indexjs)
  * [module.json](#modulejson)
  * [package.json](#packagejson)


<!-- /RM -->

## Module life cycle

 1. Server scans `/modules` without order, on each:
    1. If `module.json` exists reads it
    1. If it require some (`n`) module it goes directly to loading it (`1.n.1`), once loaded ((`1.n.4`), proceeds
    1. If module folder contains `index.js` requires it
        1. Module can ammend configuration
        1. Module can schedule express initware
        1. Module can schedule express post-init-ware
    1. Next
 1. Server loads resources
    1. CMS resources without order
    1. Module resources without order
 1. Server loads datasoruces
 1. Server setups express
 1. Server inits modules in loading order (actual order made in `1.*`)
    1. Loads model files
    1. Loads and inits route fiels
 1. Starts listening

## Application of MVC and DDD

![MVC - Wikipedia](https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/MVC-Process.svg/436px-MVC-Process.svg.png)

**MVC** ([Model-View-Controller](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller)) is popular and useful pattern in programming. Anyhow it's very controversial what is proper implementation of it for web pages. We based our current structure on most of nice Node project available.

**DDD** ([Domain Driven Desing](https://en.wikipedia.org/wiki/Domain-driven_design)) is used to abstract model/business logic from data storage to make clear division between Models and Controllers.

> Many frameworks are mixing model and controller by i.e. direclty accessing mongo collections (data/model) from express route handlers (route/controller).

Also good read [here](http://www.perlmonks.org/?node_id=402070) and some quotes from it:

> What's so useful about it
>
> **Separation of requests and pages**
>
> Since the Controller is in charge of handling the requests and selecting an appropriate page (View), there is no immediate coupling between the request made by the user and the resulting page.
> This turns out to be very useful if the page-flow in the application is complex, but even for simple applications the Controller is a good place to handle common actions - authentication and session management can be handled in the Controller, for instance.
>
> **Views are dumb**
>
> Since all code that does anything except building a nice page for the user is outside the View objects, changing the layout does not involve touching the logic of the application. Since the part of the application that changes the most during and after development is the layout, this means much less chance of adding bugs.
> **Shielding of the Model implementation**
>
> Since all actions on the application state are handled by the Model, it is possible to change the Model's implementation without touching the user interface, as long as the Model's public API doesn't change.

### Server: M for Model

Models are stored in `<module>/models/<modelDir>`. Each model expose native ES6 class that fullfil use cases for given model.

For example:

```javascript
class Dog {
 get name()
 bark()
 feed(food)
 static callByName(name)
}
```

New element of interface is introduced once there is business use case for it.

Class don't represent data in database. Class `Dog` can store some of it data in memory, some in Mongo and some in Redis. It's up to model.

There can be two classes `Dog` and `Cat` that use equally one collection `pets` and recognise each other by `type`. Anyhow it's **NEVER** exposed outside of model and not View nor Controller would ever know about it.

Class should implement `toJSON` method that will serialize model to form that doesn't contain restricted data and database native properties. Fields like mongo `_id` should be serialized to string `id`.

#### Example from Core module

```javascript
toJSON() {
    let data = this._doc.toJSON();
    data.id = this.id;
    delete data._id;
    delete data.__v;
    return data;
}
```

### Server: V for View

Views are done at the moment using [DUST](dustjs.com) templates.

View `should be dumb`. No sophisticated logic should be placed in templates. Controller is meant to prepare data for view. To ensure division we introduce one more layer `json view`.

#### JSON VIEW

If you access any URI in lackey and add `.json` to it you should see JSON representation of the layout.

**IMPORTANT!!!** this representation **MAY NOT** contain any data that is not safe to pass to the client.

```javascript
{
    "template" : "cms/cms/page",
    "javascripts" : [ "js/cms/page.js" ],
    "edit" : true,
    "data" : {
        "path" : "http://staging.lackey.io/",
        "content" : {
            "id" : "56b3746dba0d36dd3005e459",
            "$uri" : "/api/cms/content/56b3746dba0d36dd3005e459",
            "type" : "page",
            "path" : "/",
            "createdAt" : "2016-02-04T15:55:25.582Z",
            "author" : null,
            "template" :null,
            "layout" : {...}
        },
    },
    "user" : {
        "name" : "Admin"
    },
    "route" : "/"
}
```

Exactly this data would be passed to DUST template. For instance to print `path` field in exposed `data` template should look like:

```dust
{data.path}
```

### Server: C for Controller

Controller in our case can be composed from few elements (running in order) which sometimes can be divided further:

 1. Route - map specific `HTTP method` and `path` pattern
    * Express Route - default use case
    * Falcor Route - for falcor requests
 1. Policy - apply basic ACL on request
 1. Controller - process request
    * Express Controller - default use case
    * Falcor Controller - for falcor requests
    * CRUD Controller - simplifies REST opererations

### Routes

All routes can be found in `<module>/server/routes`

#### Express Route

```javascript
server.route('/cms/activity').get(policy.isAllowed, CMSController.activityStream);
```

Where
 * `server` is `express` instance injected into route module
 * `policy` is policy helper working as `express` middleware
 * `CMSController.activityStream` is basic express request handler

#### Falcor Route

```javacript
falcorRoutes.push({
    route: 'pages.byPath[{keys:path}]',
    get : PageController.falcorPageByPath
});
```

Where
 * `faclorRoutes` is array of routes injected into moduel that would be passed into `FalcorRouter` instance
 * `PageController.falcorPageByPath` is falcor request handler

### Policy

Policies can be found in `<module>/server/policies`.

We are using [ACL](https://www.npmjs.com/package/acl) library to manage policies.

### Controllers
#### Express Controller

You can find proper documentation about route handler in Express [here](http://expressjs.com/en/guide/routing.html).

We expose to our controllers:

 * `req.user` representing current user if logged in
 * `res.error` that renders error message
 * `res.send` that accept sliglhty customised format:

```javascript
res.send({
    template: 'cms/cms/pages',
    javascripts: [
        'js/cms/pages.js'
    ],
    data: {
        list: data.map((content) => {
            return content.toJSON();
        })
    }
});
```

#### Faclor Controller

Example
```javascript
module.exports.falcorPageById = (pathSet) => {
    return Model.findById(pathSet.id).then((page) => {
        if (page) {
            return {
                path: ['pages', page._id.toString()],
                value: page.toJSON()
            };
        }
        return null;
    });

    return null;
};
```

#### CRUD Controller

We have a easier way to create CRUD routes and controllers.

Consider following route
```javascript
server.crud('/api/cms/content', 'content', [], {
    list: ContentController.list,
    create: ContentController.create,
    read: ContentController.read,
    update: ContentController.update,
    delete: ContentController.delete,
    byID: ContentController.byId
});
```

This will do following mapping
 * `GET /api/cms/content` to `ContentController.list(req, res)`
 * `POST /api/cms/content` to `ContentController.create(req, res)`
 * `READ /api/cms/content/:content_id` to `ContentController.read(req, res)` with exposed `req.content`
 * `PUT /api/cms/content/:content_id` to `ContentController.update(req, res)` with exposed `req.content`
 * `DELETE /api/cms/content/:content_id` to `ContentController.delete(req, res)` with exposed `req.content`
 * param `content_id` to `ContentController.byId(req, res, next, id)` expecting to populate `req.content`

### Client MVC

Lackey by default is frontend framework indepentant. Client MVC implementation for own use is delivered with `core` module.

## Structure

```
/client
    /js
    /scss
    /views
    /img
    /views
/docs
    /reference
/server
    /controllers
    /lib
    /models
    /policies
    /routes
    /views
/shared
    /views
/test
    /client
    /e2e
    /server
/index.js
/module.json
/package.json
```

### client

Contains all client resources. While build they will be deployed to site public folders.

#### js

Contains all client javascript files. They will be browserified and deployed to `/sites/<site>/htdocs/js/<module>/*`

#### scss

Contains all client SASS files. They will be compiled and deployed to `/sites/<site>/htdocs/css/<module>/*`

#### img

Contains all client images. They will deployed to `/sites/<site>/htdocs/img/<module>/*`

#### views

Contains all client dust templates. They will compiled deployed to `/sites/<site>/htdocs/views/<module>/*`

### docs

Contains module documentation

#### reference

Contains module documentation generated from JSDOC.

### server

Contains all server module code and resoures.

#### controllers

Contains all server controllers: express, CRUD and falcor.

#### lib

Contains uncategorised server logic.

#### models

Contains all server models.

#### policies

Contains all server policies.

#### routes

Contains all server routes.

#### views

Contains all server DUST templates.

### shared

Contains any javascript/templates that should be accessible both on backend an frontend.

#### views

Contains shared views.

### test

Contains all mocha test.

#### client

For client JavaScript.

#### e2e

For protractor.

#### server

For serverside JavaScript.

### index.js

Contains module loader.

### module.json

Allows to set loading sequence of modules.

```
{
    "require" : [
        "cms/core",
        "cms/users",
        "cms/media"
    ]
}
```

### package.json

TODO: discuss need of this one.
