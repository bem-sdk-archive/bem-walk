var path = require('path'),
    cacheAssert = require('./cache-assert'),
    opts = { scheme: 'nested' },
    assert = function (fs, expected, cachedEntities) {
        var cacheExpected = { blocks: expected };

        return cacheAssert(fs, opts, cachedEntities, expected, cacheExpected);
    };

describe('cache', function () {
    it('should cache entities to level', function () {
        var fs = {
                blocks: {
                    block: {
                        'block.tech': ''
                    },
                    block2: {
                        'block2.tech': ''
                    }
                }
            },
            cachedEntities = {},
            expected = [{
                entity: { block: 'block' },
                tech: 'tech',
                level: 'blocks',
                path: path.join('blocks', 'block', 'block.tech')
            },
            {
                entity: { block: 'block2' },
                tech: 'tech',
                level: 'blocks',
                path: path.join('blocks', 'block2', 'block2.tech')
            }];

        return assert(fs, expected, cachedEntities);
    });
});
