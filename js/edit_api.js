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
 * @param {function} callback - callback is called with server response
 * @returns {promise} Resolves when complete
 */
exports.Component.prototype.create = function(callback) {
  var self = this;
  var promise = new Promise(function(resolve, reject) {
    var cb = function(data) {
      self.slug = data.slug;
      callback(data);
    };
    request({
      method: 'POST',
      uri: EnvConfig.MIRRORS_URL + 'component/',
      json: {
        attributes : self.attributes,
        metadata: self.metadata
      }
    }, self._success(cb, resolve, reject));
  });
  return promise;
};

/**
 * Tells mirrors to update a component's attributes and metadata
 * @param {function} callback - callback is called with server response
 * @returns {promise} Resolves when complete
 */
exports.Component.prototype.update = function(callback) {
  var self = this;
  var promise = new Promise(function(resolve, reject) {
    request({
      method: 'PATCH',
      uri: EnvConfig.MIRRORS_URL + 'component/' + self.slug + '/',
      json: {
        attributes: self.attributes,
        metadata: self.metadata
      }
    }, self._success(callback, resolve, reject)
    );
  });
  return promise;
};

/**
 * Helper function to create the callback from mirrors requests
 * @param {function} callback - callback is called with server response
 * @param {function} resolve - function to call to resolve update or create's promise
 * @param {function} reject - function to call to reject update or create's promise
 * @returns {function} The function to be called after update or create requests
 */
exports.Component.prototype._success = function(callback, resolve, reject) {
  return function(err, result, body) {
    if (result.statusText === "OK") {
      if (typeof(Storage)!=="undefined" ) {
        localStorage.setItem(body.slug, body);
      }
      callback(body);
      resolve();
    } else {
      EnvConfig.ERROR_HANDLER(err);
      reject();
    }
  };
};
