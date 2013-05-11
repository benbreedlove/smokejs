/*global define */
'use strict';

(function(define) {

define([
        'underscore',
        'backbone',
        'dust',
        'content',
        'module',
    ], 
    function(_, Backbone, dust, content, module) {
        var NavModel = Backbone.Model.extend({
            defaults: {
                selected: false,
                nav: 'sections',
                ticker: 'top',
            }
        });

        var NavView = Backbone.View.extend({
            events: {
                'hover nav a': 'swapTicker',
            },
            model: NavModel,
            id: 'site-nav',
            tagName: 'div',
            initialize: function() {
                this.navCollection = new content.BaseContentList({
                    url: module.config().DATA_STORE + '/topnav/' + this.nav,
                });
                this.navView = new content.BaseContentListView({
                    collection: this.navCollection
                });

                this.tickerCollection = new content.BaseContentList({
                    url: module.config().DATA_STORE + '/ticker/' + this.ticker,
                });
                this.tickerView = new content.BaseContentListView({
                    collection: this.tickerCollection
                });
            },

            render: function() {
                var that = this;
                dust.render("site_nav", this.model.attributes, function(err, out) {
                    if (err) {
                        //throw error
                        console.log(err);
                    } else {
                        that.$el = that.el = out;
                    }
                });

                $('#nav', this.el).append(
                    this.navView.render().el
                );
                $('#ticker', this.el).append(
                    this.tickerView.render().el
                );

                return this;
            },

        });

        return { 
            'NavView': NavView,
            'NavModel': NavModel,
        };

    }
);

})(define);
