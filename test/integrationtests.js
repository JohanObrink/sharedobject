
var io = require('socket.io')
  , ioClient = require('socket.io-client')
  , SharedObject = require('../lib/sharedobject').SharedObject
  , ClientSharedObject = require('../src/sharedobject').SharedObject
  , SharedObjectStore = require('../lib/sharedobjectstore').SharedObjectStore
  , expect = require('chai').expect;

describe('End to end test', function() {

  var server, sos, so, cso1, cso2, client1, client2, port = 3000;

  beforeEach(function(done) {
    port++;

    server = io.listen(port, { log: false });
    sos = new SharedObjectStore(server);

    client1 = ioClient.connect('http://localhost:' + port);
    client2 = ioClient.connect('http://localhost:' + port);

    cso1 = new ClientSharedObject('/foo').connect(client1, function(err, obj) {
      cso2 = new ClientSharedObject('/foo').connect(client2, function(err, obj) {
        sos.getObject('/foo', false, function(err, obj) {
          so = obj;

          done();
        });
      });
    });
  });

  afterEach(function() {
    //client1.disconnect();
    //client2.disconnect();
  });

  it('creates SharedObject on server', function() {
    expect(so).to.be.instanceof(SharedObject);
  });

  it('recieves data from server - callback', function(done) {
    cso1.set('bar', 'baz', function(err, data) {
      expect(err).to.not.exist;
      expect(data).to.eql({bar:'baz'});
      expect(cso1.data).to.equal(data);

      done();
    });
  });

  it('recieves data from server - event', function(done) {

    cso2.on('change', function(propertyPath, value) {
      expect(propertyPath).to.equal('bar');
      expect(value).to.eql({bar: 'baz'});

      cso2.removeAllListeners();
      done();
    });

    cso1.set('bar', 'baz', function(err, data) {});
  });

});