var fs = require('fs'),
    path = require('path'),
    bemNaming = require('bem-naming'),
    Readable = require('stream').Readable,
    schemes = require('./schemes');

module.exports = function (levels, bemconfig) {
    bemconfig || (bemconfig = {});

    var output = new Readable({ objectMode: true }),
        defaults = bemconfig.defaults || {},
        levelConfigs = bemconfig.levels || {},
        globalCache = bemconfig.cache || false,
        defaultScheme = defaults.scheme || schemes.nested,
        defaultNaming = defaults.naming ? bemNaming(defaults.naming) : bemNaming,
        cachedEntities = bemconfig.cachedEntities || {},
        cache = {};

    if (typeof defaultScheme === 'string') {
        defaultScheme = schemes[defaultScheme];
    }

    levels = levels.map(function (levelname) {
        var config = levelConfigs[levelname],
            level = levelname.path || levelname,
            scheme, naming;

        if (config) {
            scheme = config.scheme;
            naming = config.naming;
        }

        if (globalCache) {
            cache[level] = true;
        } else {
            cache[level] = levelname.cache || false;
        }

        return {
            path: level,
            walk: typeof scheme === 'string' ? schemes[scheme] : (scheme || defaultScheme),
            naming: naming ? bemNaming(naming) : defaultNaming
        };
    });

    function add(level) {
        var levels = level.split('/'),
            levelname = levels[0];

        return function (obj) {
            if (cache[levelname]) {
                (cachedEntities[levelname] = cachedEntities[levelname] || []).push(obj);
            }

            output.push(obj);
        };
    }

    function fromCache(levelCacheObj) {
        levelCacheObj.map(function (entity) {
            return output.push(entity);
        });
    }

    function scan(level, callback) {
        var levelname = level.path,
            step = level.walk(levelname, level.naming);

        walk(levelname, 1, null, callback);

        function walk(dir, depth, data, callback) {
            if (cache[dir] && cachedEntities[dir]) {
                fromCache(cachedEntities[dir]);
            } else {
                fs.readdir(dir, function (err, items) {
                    if (err) { return callback(err); }

                    var n = 0,
                        l = items.length;

                    if (l === 0) {
                        callback();
                    } else {
                        for (var i = 0; i < l; ++i) {
                            var basename = items[i],
                                filename = path.join(dir, basename);

                            step({
                                basename: basename,
                                dirname: dir,
                                filename: filename,
                                depth: depth,
                                data: data
                            }, add(dir), deepWalk, next);
                        }
                    }

                    function deepWalk(dir, data) {
                        walk(dir, depth + 1, data, next);
                    }

                    function next(err) {
                        err && callback(err);

                        ++n === l && callback();
                    }
                });
            }
        }
    }

    var n = levels.length;

    output._read = function () {
        n || output.push(null);

        levels.length && scan(levels.shift(), function (err) {
            err && output.emit('error', err);
            --n || output.push(null);
        });
    };

    return output;
};
