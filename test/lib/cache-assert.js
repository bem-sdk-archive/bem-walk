var mockAndAssert = require('./mock-and-assert-cache'),
    schemes = {
        flat: true,
        nested: true
    };

module.exports = function (fs, defaults, cachedEnteties, expected, cacheExpected) {
    if (arguments.length === 2) {
        expected = defaults;
        defaults = {};
    }
    var config = {
        defaults: defaults,
        levels: {},
        cache: true,
        cachedEntities: cachedEnteties
    };

    Object.keys(fs).forEach(function (levelname) {
        var scheme = levelname.indexOf('.') !== -1 && levelname.split('.')[0],
            info = {
                path: levelname
            };

        schemes[scheme] && (info.scheme = scheme);

        config.levels[levelname] = info;
    });

    return mockAndAssert(fs, Object.keys(config.levels), config, cachedEnteties, expected, cacheExpected);
};
