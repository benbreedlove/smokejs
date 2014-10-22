var router = require('../js/router');
var routes = require('../js/routes');
var sinon = require('sinon');
var should = require('should');

describe("main", function() {
  var self = new Object();
  before(function() {
    self.browserStart = sinon.stub(router, "browserStart", function() {});
    self.addRoutes = sinon.stub(router, "addRoutes", function() {});
  });
  after(function() {
    self.browserStart.restore();
    self.addRoutes.restore();
  });
  it("runs", function() {
    var main = require('../js/main');
    self.browserStart.calledOnce.should.be.true;
    self.addRoutes.calledOnce.should.be.true;
    self.addRoutes.calledWith(routes).should.be.true;
  });
});
