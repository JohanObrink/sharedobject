
var expect = require('chai').expect
  , SharedObjectStore = require('../lib/sharedobjectstore').SharedObjectStore
  , SharedObject = require('../lib/sharedobject').SharedObject;

describe('SharedObjectStore', function() {

  var sos, io;

  beforeEach(function() {
    io = {};
    sos = new SharedObjectStore(io);
  });

  describe('#ctor', function() {
    it('saves io', function() {
      expect(sos.io).to.equal(io);
    });
  });

  describe('getObject', function() {

    var so, path;

    beforeEach(function() {
      so = {};
      path = '/foo';
      sos.objects[path] = so;
    });

    it('returns an existing object', function(done) {
      sos.getObject(path, function(err, obj) {
        expect(err).to.not.exist;
        expect(obj).to.equal(so);
        done();
      });
    });

    it('returns an error for missing object', function(done) {
      sos.getObject('bar', function(err, obj) {
        expect(err).to.equal('No such object: \'bar\'');
        expect(obj).to.not.exist;
        done();
      });
    });

    it('creates and returns an object for missing object and create=true', function(done) {
      sos.getObject('bar', true, function(err, obj) {
        expect(err).to.not.exist;
        expect(obj).to.be.instanceof(SharedObject);
        done();
      });
    });
  });

});