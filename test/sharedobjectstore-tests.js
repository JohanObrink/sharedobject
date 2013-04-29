
var expect = require('chai').expect
  , EventEmitter = require('events').EventEmitter
  , SharedObjectStore = require('../lib/sharedobjectstore').SharedObjectStore
  , SharedObject = require('../lib/sharedobject').SharedObject;

describe('SharedObjectStore', function() {

  var sos, io;

  beforeEach(function() {
    io = {
      sockets: new EventEmitter()
    };
    sos = new SharedObjectStore(io);
  });

  describe('#ctor', function() {
    it('saves io', function() {
      expect(sos.io).to.equal(io);
    });
    it('listens for connections', function() {
      expect(io.sockets._events).to.have.property('connection')
        .and.be.a('function');
    });

    describe('connect/disconnect', function() {
      var socket1, socket2;

      beforeEach(function() {
        socket1 = new EventEmitter();
        socket2 = new EventEmitter();
      });

      it('adds connected sockets', function() {
        io.sockets.emit('connection', socket1);
        io.sockets.emit('connection', socket2);

        expect(sos.sockets).to.have.length(2);
        expect(sos.sockets[0]).to.equal(socket1);
        expect(sos.sockets[1]).to.equal(socket2);
      });

      it('removes disconnected sockets', function() {
        io.sockets.emit('connection', socket1);
        io.sockets.emit('connection', socket2);

        expect(sos.sockets).to.have.length(2);
        expect(sos.sockets[0]).to.equal(socket1);
        expect(sos.sockets[1]).to.equal(socket2);

        socket1.emit('disconnect');
        expect(sos.sockets).to.have.length(1);
        expect(sos.sockets[0]).to.equal(socket2);
      });

      describe('listeners', function() {

        beforeEach(function() {
          io.sockets.emit('connection', socket1);
          io.sockets.emit('connection', socket2);
        });

        afterEach(function() {
          socket1.emit('disconnect');
          socket2.emit('disconnect');
        });

        describe('getObject', function() {
          it('creates a SharedObject', function(done) {
            socket1.emit('getObject', '/foo', true, function(err, obj) {
              expect(err).to.not.exist;
              expect(obj).to.be.instanceof(SharedObject);
              expect(Object.keys(sos.objects)).to.have.length(1);
              expect(sos.objects['/foo']).to.exist;
              done();
            });
          });

          it('connects to an existing SharedObject', function(done) {
            socket1.emit('getObject', '/foo', true, function(err, obj) {
              
              var so = obj;

              expect(Object.keys(sos.objects)).to.have.length(1);
              expect(sos.objects['/foo']).to.exist;

              socket1.emit('getObject', '/bar', true, function(err, obj) {

                expect(obj).to.not.equal(so);
                expect(Object.keys(sos.objects)).to.have.length(2);
                expect(sos.objects['/bar']).to.exist;

                socket2.emit('getObject', '/foo', true, function(err, obj) {
                  expect(obj).to.equal(so);
                  expect(Object.keys(sos.objects)).to.have.length(2);

                  done();
                });

              });
            });
          });

          it('subscribes the socket to object changes', function(done) {
            socket1.emit('getObject', '/foo', true, function(err, obj) {
              expect(obj.subscribers).to.have.length(1);
              expect(obj.subscribers[0]).to.equal(socket1);

              socket2.emit('getObject', '/foo', true, function(err, obj) {
                expect(obj.subscribers).to.have.length(2);
                expect(obj.subscribers[1]).to.equal(socket2);

                done();
              });
            });
          });

          it('unsubscribes disconnected sockets', function(done) {
            socket1.emit('getObject', '/foo', true, function(err, obj) {
              expect(obj.subscribers).to.have.length(1);
              expect(obj.subscribers[0]).to.equal(socket1);

              socket2.emit('getObject', '/foo', true, function(err, obj) {
                expect(obj.subscribers).to.have.length(2);
                expect(obj.subscribers[1]).to.equal(socket2);

                socket1.emit('disconnect');
                expect(obj.subscribers).to.have.length(1);
                expect(obj.subscribers[0]).to.equal(socket2);

                done();
              });
            });
          });
        });

      });

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