var path = require('path'),
    mock = require('mock-fs'),
    walk = require('../../lib/index'),
    verboseAssert = require('../lib/assert'),
    opts = { scheme: 'flat' },
    assert = function (levels, expected, done) {
        verboseAssert(levels, opts, expected, done);
    };

describe('flat scheme', function () {
    afterEach(function () {
        mock.restore();
    });

    it('must end if levels is empty', function (done) {
        var levels = [],
            expected = [];

        assert(levels, expected, done);
    });
});
