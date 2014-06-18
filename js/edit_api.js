/* global localStorage */
'use strict';
var EnvConfig = require('./config');
var request = require('browser-request');
var Promise = require('promise-polyfill');

/**
 * Add create and update methods to component objects
 * @module edit_api
 */

/**
 * @class
 */
exports.Component = require('./api').Component;

/**
 * Tells mirrors to make a new component and give us a slug for it
 * this function sends the post to create the component, then creates all the attributes
 * of the component, and then updates the attributes so they have the value currently on the component 
 * @returns {promise} Resolves when complete
 */
exports.Component.prototype.create = function() {
  var self = this;
  for (var attr in this.attributes) {
    this.createdAttributes[attr] = this.updatedAttributes[attr] = true;
  }
  return new Promise(function(resolve, reject) {
    self._post().then(function() {
      self.createAndUpdateAttributes().then(resolve, reject);
    }, reject);
  });
};

/**
 * Makes a post to create a component. Does not create attributes!
 * @param {function} callback - Optional, callback is called with server response
 * @returns {promise} Resolves when complete
 */
exports.Component.prototype._post = function(callback) {
  var self = this;
  var payload = {
    slug: this.slug,
    content_type: 'application/json',
    schema_name: this.schemaType,
    metadata: this.metadata
  };
  return new Promise(function(resolve, reject) {
    request({
      method: 'POST',
      uri: EnvConfig.MIRRORS_URL + 'component/',
      json: payload
    }, self._success(resolve, reject, callback)
    );
  });
};

/**
 * Tells mirrors to update a component's attributes and metadata
 * @returns {promise} Resolves when complete
 */
exports.Component.prototype.update = function() {
  var self = this;
  var promise = new Promise(function(resolve, reject) {
    var oldChanged = self.changed;
    self.changed = {};
    var rej = function() {
      for (var i in oldChanged) {
        self.changed[i] = true;
      }
      reject();
    };
    
    self._post().then(function() {
      self.createAndUpdateAttributes().then(resolve, rej);
    }, rej);
  });
  return promise;
};

/**
 * Tells mirrors to create and update a component's attributes
 * @returns {promise} Resolves when complete
 */
exports.Component.prototype.createAndUpdateAttributes = function() {
  var self = this;
  return new Promise(function(resolve, reject) {
    var attributeCreation = [];
    for (var attr in self.createdAttributes) { 
      attributeCreation.push(self.createdAttribute(attr));
    }
    Promise.all(attributeCreation).then(function() {
      var attributeUpdating = []; //update each attribute
      for (var attr in self.changedAttributes) {
        attributeUpdating.push(self.updateAttribute(attr));
      }
      Promise.all(attributeUpdating).then(resolve, reject);
    }, reject);
  });
};
/**
 * Makes a post to update a component. Does not update attributes!
 * mostly useful for updating metadata, I guess
 * @param {function} callback - Optional, callback is called with server response
 * @returns {promise} Resolves when complete
 */
exports.Component.prototype._put = function(callback) {
  var self = this;
  return new Promise(function(resolve, reject) {
    var payload = {};
    var oldChanged = self.changed;
    for (var attr in self.changed) {
      payload[attr] = self[attr];
      delete self[attr];
    }
    var rej = function() {
      for (var attr in oldChanged) {
        self.changed[attr] = true;
      }
      reject();
    };
    request({
      method: 'PUT',
      uri: EnvConfig.MIRRORS_URL + 'component/' + self.slug,
      json: payload
    }, self._success(resolve, rej, callback)
    );
  });
};

/**
 * Creates a callback function for mirrors requests
 * @param {function} resolve - called with response if response is ok
 * @param {function} reject - called with response if response is not ok
 * @param {function} callback - callback is called with server response body if status ok
 * @returns {function} The function to be called after update or create requests
 */
exports.Component.prototype._success = function(resolve, reject, callback) {
  var callback = callback ? callback : function() {};
  return function(err, result, body) {
    if (result.statusText === "OK") {
      if (typeof(Storage)!=="undefined" ) {
        localStorage.setItem(body.slug, body);
      }
      callback(body);
      resolve(result);
    } else {
      EnvConfig.ERROR_HANDLER(err);
      reject(result);
    }
  };
};

/**
 * Changes a component and makes sure the component knows it needs to patch it
 * @param {string} key - the key of the thing you want to change
 * @param {whatever} value - the value you want to set it to.
 * @returns {void} doesn't return anything
 */
exports.Component.prototype.set = function(key, value) {
  this.changed[key] = true;
  this[key] = value;
};

/**
 * Changes the metadata of a component and makes sure the component knows it needs to patch it
 * @param {string} key - the key of the thing in metadata you want to change
 * @param {whatever} value - the value you want to set it to.
 * @returns {void} doesn't return anything
 */
exports.Component.prototype.setMetadata = function(key, value) {
  this.changed.metadata = true;
  this.metadata[key] = value;
};

/**
 * Changes an attribute of a component and makes sure the component knows it needs to patch it
 * @param {string} key - the key of the attribute you want to change
 * @param {whatever} value - the new attribute value
 * @returns {void} doesn't return anything
 */
exports.Component.prototype.setAttribute = function(key, value) {
  if (!this.attributes[key]) {
    this.createdAttributes[key] = true;
  }
  this.changedAttributes[key] = true;
  this.attributes[key] = value;
};

/**
 * Creates an attribute for a slug. Does not 
 * @param {string} attr - the key of the attribute you want to change
 * @returns {promise} promise - a promise which resolves when all attributes are updated
 */
exports.Component.prototype.createAttribute = function(attr) {
  var self = this;
  var payload = {
    name: attr,
    child: this.slug,
  };
  //is array check
  if (Object.prototype.toString.call( this.attributes[attr] ) === '[object Array]') {
    payload.contents = this.attributes[attr];
  }
  var uri = EnvConfig.MIRRORS_URL + 'component/' + this.slug + '/attribute/';
  return new Promise(function(resolve, reject) {
    delete self.createdAttributes[attr];
    var rej = function() {
      self.createdAttributes[attr] = true;
      reject();
    };
    request({
      method: 'POST',
      uri: uri,
      json: payload
    }, self._success(resolve, rej)
    );
  });
};
/**
 * Helper function to make calls to update a component's attribute
 * @param {attr} component - the attribute you want to update
 * @returns {promise} promise - a promise which resolves when attribute is updated
 */
exports.Component.prototype.updateAttribute = function(attr) {
  var self = this; 
  var url = EnvConfig.MIRRORS_URL + 'component/' + 
    this.slug + '/attribute/' + attr;
  return new Promise(function(resolve, reject) {
    delete self.changedAttributes[attr];
    var rej = function() {
      self.changedAttributes[attr] = true;
      reject();
    };
    request({
      method: 'PUT',
      uri: url,
      json: self.attributes[attr]
    }, self._success(resolve, rej)
    );
  });
};
