/*global require */
'use strict';
var api = require('./api');
var render = require('./render');

/**
 * Include views to be called by the router here each should
 * take a callback that takes in data, html
 * and returns a promise which is resolved after its loaded.
 * @module views
 */

/**
 * Main view for rendering components.
 * @param {object} match - match object Returned by routes.
 * @param {function} callback - callback is called with html
 * @returns {promise} Resolves when complete
 */
exports.displayMainContent = function(match, callback) {
  var slug = match.params.slug ? match.params.slug : 'homepage';
  var component = new api.Component(slug);
  return component.get(function(data) {
    render.render(render.selectTemplate(data), data, function(html) {
      if (callback) { callback(data, html); }
    });
  });
};
