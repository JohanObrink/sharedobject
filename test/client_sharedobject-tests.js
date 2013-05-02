
var SharedObject = require('../src/sharedobject').SharedObject
  , expect = require('chai').expect;

describe('SharedObject', function() {

  var so;

  beforeEach(function() {
    so = new SharedObject('/foo');
  });

  describe('#ctor', function() {
    it('saves the path', function() {
      expect(so.path).to.equal('/foo');
    });
    it('creates a listeners object', function() {
      expect(so.listeners).to.exist;
      expect(so.listeners).to.eql({});
    });
    it('creates an empty data object', function() {
      expect(so.data).to.exist;
      expect(so.data).to.eql({});
    });
  });

  describe('addListener', function() {
    it('adds a single listener to the correct path', function() {
      var listener = function() {};
      so.addListener('change', listener);
      expect(so.listeners.change).to.equal(listener);
    });
    it('adds multiple listeners as an array', function() {
      var listener1 = function() {};
      var listener2 = function() {};
      so.addListener('change', listener1).addListener('change', listener2);
      expect(so.listeners).to.have.property('change');
      expect(so.listeners.change).to.be.instanceof(Array).with.length(2);
      expect(so.listeners.change[0]).to.equal(listener1);
      expect(so.listeners.change[1]).to.equal(listener2);
    });
  });

  describe('on', function() {
    it('adds a single listener to the correct path', function() {
      var listener = function() {};
      so.on('change', listener);
      expect(so.listeners.change).to.equal(listener);
    });
    it('adds multiple listeners as an array', function() {
      var listener1 = function() {};
      var listener2 = function() {};
      so.on('change', listener1).on('change', listener2);
      expect(so.listeners).to.have.property('change');
      expect(so.listeners.change).to.be.instanceof(Array).with.length(2);
      expect(so.listeners.change[0]).to.equal(listener1);
      expect(so.listeners.change[1]).to.equal(listener2);
    });
  });

  describe('removeListeners', function() {
    it('removes a single listener', function() {
      var listener = function() {};
      so.on('change', listener);
      expect(so.listeners.change).to.equal(listener);
      so.removeListener('change', listener);
      expect(so.listeners.change).to.not.exist;
    });
    it('does not remove a single, non matching listener', function() {
      var listener = function() {};
      so.on('change', listener);
      expect(so.listeners.change).to.exist;
      so.removeListener('change', function() {});
      expect(so.listeners.change).to.equal(listener);
    });
    it('removes one in many listeners', function() {
      var listener1 = function() {}, listener2 = function() {}, listener3 = function() {};
      so.on('change', listener1).on('change', listener2).on('change', listener3);
      expect(so.listeners.change).to.have.length(3);
      so.removeListener('change', listener2);
      expect(so.listeners.change).to.have.length(2);
      expect(so.listeners.change[0]).to.equal(listener1);
      expect(so.listeners.change[1]).to.equal(listener3);
    });
    it('converts to naked listener function when removing second to last listener', function() {
      var listener1 = function() {}, listener2 = function() {};
      so.on('change', listener1).on('change', listener2);
      expect(so.listeners.change).to.have.length(2);
      so.removeListener('change', listener1);
      expect(so.listeners.change).to.equal(listener2);
    });
  });

describe('removeAllListeners', function() {
  var listener1, listener2, listener3, listener4;

  beforeEach(function() {
    so.on('change', listener1).on('change', listener2).on('delete', listener3).on('WINNING!', listener4);
  });

  it('removes all listeners for a specified event', function() {
    so.removeAllListeners('change');
    expect(so.listeners['change']).to.not.exist;
    expect(so.listeners['delete']).to.equal(listener3);
    expect(so.listeners['WINNING!']).to.equal(listener4);
  });

  it('removes all listeners', function() {
    so.removeAllListeners();
    expect(so.listeners).to.eql({});
  });
});

});