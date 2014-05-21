var test = require('tape');
var render = require('../js/render');
var $ = require('jquery');
var Chunk = require('./utils').mock_chunk;
var Ad = require('../js/ad');

test( "test main render function", function(t) {
  t.plan(5);
  var slug = 'lolnone';
  var author_first_name = 'dash';
  var author_last_name = 'rendar';
  var promise = render.render('byline', {
    slug : slug,
    metadata : { first_name: author_first_name, last_name: author_last_name }
  },
  function(out) {
    var el = $('<div />').html(out);
    t.equal(el.find('li').length, 1,
      'byline gives us a single list item'
    );
    t.equal(el.find('a').attr('href'), '#/author/' + slug,
      'byline gives us a link to the author page of the author passed in'
    );
    t.equal(el.find('a').html(), author_first_name + ' ' + author_last_name,
      'Link text is the author\'s first and last name'
    );
  });
  t.ok(promise,
    'render function returns a promise'
  );
  $.when(promise).done(function() {
    t.ok(true, 'render promise resolved');
  });
});
test( "test dust functions", function(t) {
  t.plan(15);
  var dustBase = render.dustBase();
  var chunk = new Chunk();
  t.ok(dustBase, 'dust base created');
  Ad.key = '';
  Ad.groupId = '';
  var ad_placement = 'test';
  $.when(dustBase.global.ad(chunk, {}, {}, {placement: ad_placement}))
    .done(function() {
      var el = $('<div />').html(chunk.output);
      t.equal( el.find('iframe').length, 1,
        'gives us an iframe'
      );
      var iframe = el.find('iframe');
      t.equal( iframe.attr('data-placement'), ad_placement,
        'sets data-placement attribute correctly'
      );
      t.equal( iframe.attr('id'), 'ad_' + ad_placement,
        'sets the id to be ad_ and the placement'
      );
      t.equal( iframe.attr('src'), Ad.getSrc(ad_placement),
        'src should be set to what Ad\'s getSrc spits out'
      );
    });
  $.when(dustBase.global.load(chunk, {}, {}, {
    slug: 'peter-van-buren',
    template: 'byline'
  }))
  .done(function() {
    var el = $('<div />').html(chunk.output);
    t.equal(el.find('li').length, 1,
      'dust load pulling a byline gives us a single list item'
    );
    t.equal(el.find('a').attr('href'), '#/author/peter-van-buren',
      'dust load pulling a byline gives us a link to the author page of the author passed in'
    );
    console.log(el.find('a').html());
    t.equal(el.find('a').html(), 'Peter Van Buren',
      'dust load pulling a byline gives us the author\'s first and last as link text'
    );
  });
  $.when(dustBase.global.load(chunk, {}, {}, {
    slug: 'peter-van-buren',
  }))
  .done(function() {
    var el = $(chunk.output);
    t.equal( el.attr('class'), 'author',
      'load w/o a template loads an element w/ class author'
    );
    t.equal( el.find('h1').html(), 'Peter Van Buren',
      'load w/o a template loads an author, which has an h1 w/ authorname'
    );
    t.ok( el.find('#component_body').html(),
      'load w/o a template loads an author, which has makrdown text in it'
    );
  });
  $.when(dustBase.global.render(chunk, {
    stack: {
      head: {
        metadata: {
          first_name: 'Peter',
          last_name: 'Van Buren',
        },
        slug: 'peter-van-buren'
      }
    }
  }, {}, {
    template: 'byline'
  }))
  .done(function() {
    var el = $('<div />').html(chunk.output);
    t.equal(el.find('li').length, 1,
      'dust renders a byline gives us a single list item'
    );
    t.equal(el.find('a').attr('href'), '#/author/peter-van-buren',
      'dust renders a byline gives us a link to the author page of the author passed in'
    );
    t.equal(el.find('a').html(), 'Peter Van Buren',
      'dust renders a byline gives us the author\'s first and last as link text'
    );
  });
  $.when(dustBase.global.markdown(chunk, {}, {},
    { data_uri: 'content/peter-van-buren/data' }
    ))
    .done(function() {
      t.equal( chunk.output,
        'we need to fix the fixture server',
        'markdown doenst actually load, boooooo'
      );
  });
});
