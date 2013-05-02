
var expect = require('chai').expect
  , EventEmitter = require('events').EventEmitter
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
      var client = new EventEmitter();
      so.subscribe(client);
      expect(so.subscribers).to.have.length(1);
      expect(so.subscribers[0]).to.equal(client);
    });

  });

  describe('connected objects', function() {
    var so1, so2, socket1, socket2;

    beforeEach(function() {
      so1 = new SharedObject();
      so2 = new SharedObject();
      socket1 = new EventEmitter();
      socket2 = new EventEmitter();

      so1
        .subscribe(socket1)
        .subscribe(socket2);
      so2
        .subscribe(socket1)
        .subscribe(socket2);
    });

    afterEach(function() {
      so1
        .unsubscribe(socket1)
        .unsubscribe(socket2);
      so2
        .unsubscribe(socket1)
        .unsubscribe(socket2);
    });

    it('listens for updates to data', function(done) {

      socket2.on('sharedobject-update', function(path, propertyPath, data) {
        done();
      });

      so1.set('foo', 'bar', function(err, data) { });
    });

    it('synchronizes data', function(done) {

      socket2.on('sharedobject-update', function(path, propertyPath, data) {
        
        expect(so2.data).to.eql(so1.data);
        done();
      });

      so1.set('foo', 'bar', function(err, data) { });
    });
  });

  describe('#unsubscribe', function() {

    var so;

    beforeEach(function() {
      so = new SharedObject();
    });

    it('removes subscriber from list', function() {
      var client1 = new EventEmitter(), client2 = new EventEmitter();
      so.subscribe(client1).subscribe(client2);
      expect(so.subscribers).to.have.length(2);
      expect(so.subscribers[0]).to.equal(client1);
      expect(so.subscribers[1]).to.equal(client2);

      so.unsubscribe(client2);
      expect(so.subscribers).to.have.length(1);
      expect(so.subscribers[0]).to.equal(client1);
    });

  });

  describe('#get', function() {

    var so;

    beforeEach(function() {
      so = new SharedObject();
    });

    it('returns root for undefined property', function(done) {
      so.data = {};

      so.get(function(err, data) {
        expect(err).to.not.exist;
        expect(data).to.equal(so.data);
        done();
      });
    });

    it('returns value for propertyPath', function(done) {
      so.data = {
        foo: {
          bar: 'baz'
        }
      };

      so.get('foo', function(err, data) {
        expect(err).to.not.exist;
        expect(data).to.equal(so.data.foo);
        done();
      });
    });

    it('returns value for deep propertyPath', function(done) {
      so.data = {
        foo: {
          bar: 'baz'
        }
      };

      so.get('foo.bar', function(err, data) {
        expect(err).to.not.exist;
        expect(data).to.equal('baz');
        done();
      });
    });

    it('creates property if undefined and create is true', function(done) {
      so.data = {
        foo: { }
      };

      so.get('foo.bar', true, function(err, data) {
        expect(err).to.not.exist;
        expect(data).to.eql({});
        expect(so.data).to.eql({
          foo: {
            bar: {}
          }
        });
        done();
      });
    });

    it('returns an error if path does not exist and create is false', function(done) {
      so.data = {
        foo: { }
      };

      so.get('foo.bar', function(err, data) {
        expect(err).to.exist;
        expect(data).to.not.exist;
        done();
      });
    });

    it('returns an error if path is borken', function(done) {
      so.data = {
        foo: 42
      };

      so.get('foo.bar', true, function(err, data) {
        expect(err).to.exist;
        expect(data).to.not.exist;
        done();
      });
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
          expect(data).to.be.undefined;
          expect(err).to.equal('Invalid property: \'person.age.fake\'');
          done();
        });
      });
    });

    describe('subscribers', function() {
      it('should transmit the updated data to all subscribers', function(done) {
        var socket = {
          emit: function(event, data) {
            expect(event).to.equal('sharedobject-update');
            expect(data).to.eql({
              path: '/',
              propertyPath: 'foo',
              data: { foo: 'bar' }
            });
            done();
          },
          on: function() {}
        };
        so.subscribe(socket).set('foo', 'bar');

      });
    });
  });

});


