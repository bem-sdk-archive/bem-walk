var path = require('path'),
    mock = require('mock-fs'),
    walk = require('../../lib/index'),
    verboseAssert = require('../lib/assert'),
    opts = { scheme: 'nested' },
    assert = function (levels, expected, done) {
        verboseAssert(levels, opts, expected, done);
    };

describe('nested scheme', function () {
    afterEach(function () {
        mock.restore();
    });

    it('must end if levels is empty', function (done) {
        var levels = [],
            expected = [];

        assert(levels, expected, done);
    });

    it('must throw error if levels is not found', function (done) {
        var walker = walk(['not-existing-level']);

        walker
            .on('error', function (err) {
                err.must.throw();
                done();
            })
            .resume();
    });
});
