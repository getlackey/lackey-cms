#!/usr/bin/env node --harmony

'use strict';

const cli = require('command-line-args'),
    lorem = require('lorem-hipsum'),
    chalk = require('chalk'),
    path = require('path'),
    slug = require('slug'),
    json2yaml = require('json2yaml'),
    objectPath = require('object-path'),
    fs = require('fs');

function random(count, source) {
    let max = source.length,
        indexes = [],
        result = [];
    if (count === max) {
        return source;
    }
    while (indexes.length < count) {
        let next = Math.floor(Math.random() * (max));
        if (indexes.indexOf(next) === -1) {
            indexes.push(next);
        }
    }
    while (indexes.length) {
        result.push(source[indexes.pop()]);
    }
    return result;
}

function randomize(settings) {
    if (typeof settings !== 'object') {
        return settings;
    }
    if (settings.$random) {
        return random(settings.$random, settings.$from);
    }

    Object
        .keys(settings)
        .forEach((key) => {
            settings[key] = randomize(settings[key]);
        });
    return settings;
}

function map(props, data) {
    if (typeof props !== 'object') {
        return props;
    }
    if (props.$map) {
        let key = objectPath.get(data, props.$path);
        return props.$map[key];
    }
    Object
        .keys(props)
        .map((key) => {
            props[key] = map(props[key], data);
        });
    return props;
}

function file(fileName, schema, dirname) {
    console.log(chalk.green('Generationg'), chalk.yellow(fileName));
    let number = +schema.$number || 10,
        results = [];

    for (let i = 0; i < number; i++) {
        let nameLength = Math.ceil(Math.random() * 5),
            image = 'https://unsplash.it/g/1000/1000?random&_=' + (Math.round(Math.random() * 10000000000)),
            name = lorem({
                count: nameLength,
                units: 'words'
            }),
            intro = lorem({
                count: 1,
                units: 'paragraphs'
            }),
            content = lorem({
                count: 6,
                units: 'paragraphs'
            }),
            route = schema.route.replace(/\$1/g, slug(name)).toLowerCase(),
            data,
            taxonomies = randomize(JSON.parse(JSON.stringify(schema.taxonomies)));

        content = content.split('\r\n').filter((l) => l.replace(/\s+/g, '').length > 0);
        content.splice(2, 0, '![](' + image + ')');
        content = content.join('\n\n');

        data = {
            route: route,
            name: name,
            layout: {
                type: 'Fields',
                title: name,
                intro: intro,
                content: content,
                image: {
                    type: 'Media',
                    source: image,
                    mime: 'image/jpeg'
                }
            },
            template: schema.template,
            state: 'published',
            taxonomies: taxonomies
        };

        data.props = map(schema.props, data) || {};

        results.push(data);

    }

    return new Promise((resolve, reject) => {
        fs.writeFile(path.join(dirname, fileName), json2yaml.stringify(results), 'utf8', (err) => {
            if (err) {
                return reject(err);
            }
            resolve();
        });
    });
}

function parse(input) {
    return read(input)
        .then((data) => {
            return Promise.all(Object.keys(data).map((fileName) => file(fileName, data[fileName], path.dirname(input))));
        });
}

function read(input) {
    return new Promise((resolve, reject) => {
        let filePath = path.join(process.cwd(), input);
        filePath = path.resolve(filePath);
        fs.readFile(filePath, 'utf8', (err, content) => {
            if (err) {
                return reject(err);
            }
            console.log(chalk.green('Parsing'), chalk.yellow(input));
            try {
                resolve(JSON.parse(content));
            } catch (e) {
                console.log(e);
                reject(e);
            }
        });
    });
}

try {
    let options = cli([
        {
            name: 'input',
            alias: 'i',
            defaultOption: true,
            type: String,
            multiple: true
        }
    ]);

    if (options.input && Array.isArray(options.input)) {
        Promise
            .all(options.input.map((input) => parse(input)))
            .then((data) => {
                //console.log(data);
            }, (error) => {
                console.error(error);
            })
    }

} catch (e) {
    console.error(chalk.red(e));
}
