
var expect = require('chai').expect
  , SharedObject = require('../lib/sharedObject').SharedObject;

describe('SharedObject', function() {

  describe('#ctor', function() {

    it('creates default options', function() {
      var so = new SharedObject();
      expect(so.options).to.eql({ path: '/' });
    });

    it('accepts path as a string', function() {
      var so = new SharedObject('/foo');
      expect(so.options).to.eql({ path: '/foo' });
    });

    it('adds path to options if missing', function() {
      var so = new SharedObject({ awesome: true });
      expect(so.options).to.eql({ awesome: true, path: '/' });
    });

    it('does not overwrite path if provided', function() {
      var so = new SharedObject({ awesome: true, path: '/foo' });
      expect(so.options).to.eql({ awesome: true, path: '/foo' });
    })

  });

  describe('#subscribe', function() {

    var so;

    beforeEach(function() {
      so = new SharedObject();
    });

    it('adds subscriber to list', function() {
      var client = {};
      so.subscribe(client);
      expect(so.subscribers).to.have.length(1);
      expect(so.subscribers[0]).to.equal(client);
    });

  });

  describe('#unsubscribe', function() {

    var so;

    beforeEach(function() {
      so = new SharedObject();
    });

    it('adds subscriber to list', function() {
      var client1 = {}, client2 = {};
      so.subscribe(client1).subscribe(client2);
      expect(so.subscribers).to.have.length(2);
      expect(so.subscribers[0]).to.equal(client1);
      expect(so.subscribers[1]).to.equal(client2);

      so.unsubscribe(client2);
      expect(so.subscribers).to.have.length(1);
      expect(so.subscribers[0]).to.equal(client1);
    });

  });

  describe('#set', function() {

    var so;

    beforeEach(function() {
      so = new SharedObject();
    });

    it('sets data to value for no property', function(done) {
      var data = { foo: 'bar' };
      so.set(data, function() {
        expect(so.data).to.equal(data);
        done();
      });
    });

    it('sets data.property to value', function(done) {
      so.set('foo', 'bar', function() {
        expect(so.data).to.have.property('foo')
          .that.equals('bar');
        done();
      });
    });

    it('sets deep property to value, creating parent objects', function(done) {
      so.set('foo.bar.baz', 'w00t!', function() {
        expect(so.data.foo.bar.baz).to.equal('w00t!');
        done();
      });
    });

    it('handles borken paths', function(done) {
      so.set('person.age', 40, function() {
        expect(so.data.person.age).to.equal(40);
        so.set('person.age.fake', '30', function(err, data) {
          expect(err).to.equal('Invalid property \'person.age.fake\'');
        });
      });
    });
  });

});


