(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*!
Copyright (C) 2013 by WebReflection

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/
var
  // should be a not so common char
  // possibly one JSON does not encode
  // possibly one encodeURIComponent does not encode
  // right now this char is '~' but this might change in the future
  specialChar = '~',
  safeSpecialChar = '\\x' + (
    '0' + specialChar.charCodeAt(0).toString(16)
  ).slice(-2),
  escapedSafeSpecialChar = '\\' + safeSpecialChar,
  specialCharRG = new RegExp(safeSpecialChar, 'g'),
  safeSpecialCharRG = new RegExp(escapedSafeSpecialChar, 'g'),

  safeStartWithSpecialCharRG = new RegExp('(?:^|[^\\\\])' + escapedSafeSpecialChar),

  indexOf = [].indexOf || function(v){
    for(var i=this.length;i--&&this[i]!==v;);
    return i;
  },
  $String = String  // there's no way to drop warnings in JSHint
                    // about new String ... well, I need that here!
                    // faked, and happy linter!
;

function generateReplacer(value, replacer, resolve) {
  var
    path = [],
    all  = [value],
    seen = [value],
    mapp = [resolve ? specialChar : '[Circular]'],
    last = value,
    lvl  = 1,
    i
  ;
  return function(key, value) {
    // the replacer has rights to decide
    // if a new object should be returned
    // or if there's some key to drop
    // let's call it here rather than "too late"
    if (replacer) value = replacer.call(this, key, value);

    // did you know ? Safari passes keys as integers for arrays
    // which means if (key) when key === 0 won't pass the check
    if (key !== '') {
      if (last !== this) {
        i = lvl - indexOf.call(all, this) - 1;
        lvl -= i;
        all.splice(lvl, all.length);
        path.splice(lvl - 1, path.length);
        last = this;
      }
      // console.log(lvl, key, path);
      if (typeof value === 'object' && value) {
        lvl = all.push(last = value);
        i = indexOf.call(seen, value);
        if (i < 0) {
          i = seen.push(value) - 1;
          if (resolve) {
            // key cannot contain specialChar but could be not a string
            path.push(('' + key).replace(specialCharRG, safeSpecialChar));
            mapp[i] = specialChar + path.join(specialChar);
          } else {
            mapp[i] = mapp[0];
          }
        } else {
          value = mapp[i];
        }
      } else {
        if (typeof value === 'string' && resolve) {
          // ensure no special char involved on deserialization
          // in this case only first char is important
          // no need to replace all value (better performance)
          value = value .replace(safeSpecialChar, escapedSafeSpecialChar)
                        .replace(specialChar, safeSpecialChar);
        }
      }
    }
    return value;
  };
}

function retrieveFromPath(current, keys) {
  for(var i = 0, length = keys.length; i < length; current = current[
    // keys should be normalized back here
    keys[i++].replace(safeSpecialCharRG, specialChar)
  ]);
  return current;
}

function generateReviver(reviver) {
  return function(key, value) {
    var isString = typeof value === 'string';
    if (isString && value.charAt(0) === specialChar) {
      return new $String(value.slice(1));
    }
    if (key === '') value = regenerate(value, value, {});
    // again, only one needed, do not use the RegExp for this replacement
    // only keys need the RegExp
    if (isString) value = value .replace(safeStartWithSpecialCharRG, specialChar)
                                .replace(escapedSafeSpecialChar, safeSpecialChar);
    return reviver ? reviver.call(this, key, value) : value;
  };
}

function regenerateArray(root, current, retrieve) {
  for (var i = 0, length = current.length; i < length; i++) {
    current[i] = regenerate(root, current[i], retrieve);
  }
  return current;
}

function regenerateObject(root, current, retrieve) {
  for (var key in current) {
    if (current.hasOwnProperty(key)) {
      current[key] = regenerate(root, current[key], retrieve);
    }
  }
  return current;
}

function regenerate(root, current, retrieve) {
  return current instanceof Array ?
    // fast Array reconstruction
    regenerateArray(root, current, retrieve) :
    (
      current instanceof $String ?
        (
          // root is an empty string
          current.length ?
            (
              retrieve.hasOwnProperty(current) ?
                retrieve[current] :
                retrieve[current] = retrieveFromPath(
                  root, current.split(specialChar)
                )
            ) :
            root
        ) :
        (
          current instanceof Object ?
            // dedicated Object parser
            regenerateObject(root, current, retrieve) :
            // value as it is
            current
        )
    )
  ;
}

function stringifyRecursion(value, replacer, space, doNotResolve) {
  return JSON.stringify(value, generateReplacer(value, replacer, !doNotResolve), space);
}

function parseRecursion(text, reviver) {
  return JSON.parse(text, generateReviver(reviver));
}
this.stringify = stringifyRecursion;
this.parse = parseRecursion;
},{}],2:[function(require,module,exports){

/**
 * Topological sorting function
 *
 * @param {Array} edges
 * @returns {Array}
 */

module.exports = exports = function(edges){
  return toposort(uniqueNodes(edges), edges)
}

exports.array = toposort

function toposort(nodes, edges) {
  var cursor = nodes.length
    , sorted = new Array(cursor)
    , visited = {}
    , i = cursor

  while (i--) {
    if (!visited[i]) visit(nodes[i], i, [])
  }

  return sorted

  function visit(node, i, predecessors) {
    if(predecessors.indexOf(node) >= 0) {
      throw new Error('Cyclic dependency: '+JSON.stringify(node))
    }

    if (visited[i]) return;
    visited[i] = true

    // outgoing edges
    var outgoing = edges.filter(function(edge){
      return edge[0] === node
    })
    if (i = outgoing.length) {
      var preds = predecessors.concat(node)
      do {
        var child = outgoing[--i][1]
        visit(child, nodes.indexOf(child), preds)
      } while (i)
    }

    sorted[--cursor] = node
  }
}

function uniqueNodes(arr){
  var res = []
  for (var i = 0, len = arr.length; i < len; i++) {
    var edge = arr[i]
    if (res.indexOf(edge[0]) < 0) res.push(edge[0])
    if (res.indexOf(edge[1]) < 0) res.push(edge[1])
  }
  return res
}

},{}],3:[function(require,module,exports){
(function (global){

var rng;

if (global.crypto && crypto.getRandomValues) {
  // WHATWG crypto-based RNG - http://wiki.whatwg.org/wiki/Crypto
  // Moderately fast, high quality
  var _rnds8 = new Uint8Array(16);
  rng = function whatwgRNG() {
    crypto.getRandomValues(_rnds8);
    return _rnds8;
  };
}

if (!rng) {
  // Math.random()-based (RNG)
  //
  // If all else fails, use Math.random().  It's fast, but is of unspecified
  // quality.
  var  _rnds = new Array(16);
  rng = function() {
    for (var i = 0, r; i < 16; i++) {
      if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
      _rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
    }

    return _rnds;
  };
}

module.exports = rng;


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],4:[function(require,module,exports){
//     uuid.js
//
//     Copyright (c) 2010-2012 Robert Kieffer
//     MIT License - http://opensource.org/licenses/mit-license.php

// Unique ID creation requires a high quality random # generator.  We feature
// detect to determine the best RNG source, normalizing to a function that
// returns 128-bits of randomness, since that's what's usually required
var _rng = require('./rng');

// Maps for number <-> hex string conversion
var _byteToHex = [];
var _hexToByte = {};
for (var i = 0; i < 256; i++) {
  _byteToHex[i] = (i + 0x100).toString(16).substr(1);
  _hexToByte[_byteToHex[i]] = i;
}

// **`parse()` - Parse a UUID into it's component bytes**
function parse(s, buf, offset) {
  var i = (buf && offset) || 0, ii = 0;

  buf = buf || [];
  s.toLowerCase().replace(/[0-9a-f]{2}/g, function(oct) {
    if (ii < 16) { // Don't overflow!
      buf[i + ii++] = _hexToByte[oct];
    }
  });

  // Zero out remaining bytes if string was short
  while (ii < 16) {
    buf[i + ii++] = 0;
  }

  return buf;
}

// **`unparse()` - Convert UUID byte array (ala parse()) into a string**
function unparse(buf, offset) {
  var i = offset || 0, bth = _byteToHex;
  return  bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]];
}

// **`v1()` - Generate time-based UUID**
//
// Inspired by https://github.com/LiosK/UUID.js
// and http://docs.python.org/library/uuid.html

// random #'s we need to init node and clockseq
var _seedBytes = _rng();

// Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
var _nodeId = [
  _seedBytes[0] | 0x01,
  _seedBytes[1], _seedBytes[2], _seedBytes[3], _seedBytes[4], _seedBytes[5]
];

// Per 4.2.2, randomize (14 bit) clockseq
var _clockseq = (_seedBytes[6] << 8 | _seedBytes[7]) & 0x3fff;

// Previous uuid creation time
var _lastMSecs = 0, _lastNSecs = 0;

// See https://github.com/broofa/node-uuid for API details
function v1(options, buf, offset) {
  var i = buf && offset || 0;
  var b = buf || [];

  options = options || {};

  var clockseq = options.clockseq !== undefined ? options.clockseq : _clockseq;

  // UUID timestamps are 100 nano-second units since the Gregorian epoch,
  // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
  // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
  // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.
  var msecs = options.msecs !== undefined ? options.msecs : new Date().getTime();

  // Per 4.2.1.2, use count of uuid's generated during the current clock
  // cycle to simulate higher resolution clock
  var nsecs = options.nsecs !== undefined ? options.nsecs : _lastNSecs + 1;

  // Time since last uuid creation (in msecs)
  var dt = (msecs - _lastMSecs) + (nsecs - _lastNSecs)/10000;

  // Per 4.2.1.2, Bump clockseq on clock regression
  if (dt < 0 && options.clockseq === undefined) {
    clockseq = clockseq + 1 & 0x3fff;
  }

  // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
  // time interval
  if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === undefined) {
    nsecs = 0;
  }

  // Per 4.2.1.2 Throw error if too many uuids are requested
  if (nsecs >= 10000) {
    throw new Error('uuid.v1(): Can\'t create more than 10M uuids/sec');
  }

  _lastMSecs = msecs;
  _lastNSecs = nsecs;
  _clockseq = clockseq;

  // Per 4.1.4 - Convert from unix epoch to Gregorian epoch
  msecs += 12219292800000;

  // `time_low`
  var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
  b[i++] = tl >>> 24 & 0xff;
  b[i++] = tl >>> 16 & 0xff;
  b[i++] = tl >>> 8 & 0xff;
  b[i++] = tl & 0xff;

  // `time_mid`
  var tmh = (msecs / 0x100000000 * 10000) & 0xfffffff;
  b[i++] = tmh >>> 8 & 0xff;
  b[i++] = tmh & 0xff;

  // `time_high_and_version`
  b[i++] = tmh >>> 24 & 0xf | 0x10; // include version
  b[i++] = tmh >>> 16 & 0xff;

  // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)
  b[i++] = clockseq >>> 8 | 0x80;

  // `clock_seq_low`
  b[i++] = clockseq & 0xff;

  // `node`
  var node = options.node || _nodeId;
  for (var n = 0; n < 6; n++) {
    b[i + n] = node[n];
  }

  return buf ? buf : unparse(b);
}

// **`v4()` - Generate random UUID**

// See https://github.com/broofa/node-uuid for API details
function v4(options, buf, offset) {
  // Deprecated - 'format' argument, as supported in v1.2
  var i = buf && offset || 0;

  if (typeof(options) == 'string') {
    buf = options == 'binary' ? new Array(16) : null;
    options = null;
  }
  options = options || {};

  var rnds = options.random || (options.rng || _rng)();

  // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
  rnds[6] = (rnds[6] & 0x0f) | 0x40;
  rnds[8] = (rnds[8] & 0x3f) | 0x80;

  // Copy bytes to buffer, if provided
  if (buf) {
    for (var ii = 0; ii < 16; ii++) {
      buf[i + ii] = rnds[ii];
    }
  }

  return buf || unparse(rnds);
}

// Export public API
var uuid = v4;
uuid.v1 = v1;
uuid.v4 = v4;
uuid.parse = parse;
uuid.unparse = unparse;

module.exports = uuid;

},{"./rng":3}],5:[function(require,module,exports){
'use strict';

module.exports = ['CM', 'nodeService', function (CM, nodeService) {

   function link($scope, $element, $attrs) {

      var cm = CM.create($element[0], {
         mode: 'javascript',
         theme: 'elegant',
         lineNumbers: true,
         lineWrapping: true,
         tabSize: 3
      });

      cm.setSize('100%', 300);
      cm.on('change', function () {
         var node = nodeService.getSelectedNode();
         if (node) {
            node._fnstr = cm.getValue();
            cm.clearHistory();
         }
      });
   }

   return {

      restrict: 'E',
      replace: true,
      template: '<textarea></textarea>',
      link: link

   };
}];

},{}],6:[function(require,module,exports){
"use strict";

module.exports = [function () {

   var instance = null;

   function getInstance() {
      return instance;
   }

   function create(textarea, opts) {
      instance = CodeMirror.fromTextArea(textarea, opts);
      return instance;
   }

   return {
      getInstance: getInstance,
      create: create
   };
}];

},{}],7:[function(require,module,exports){
"use strict";

module.exports = [function () {

   return function (input) {
      return CJSON.stringify(input, null, 2);
   };
}];

},{}],8:[function(require,module,exports){
"use strict";

module.exports = [function () {

   var debugEnabled = false;
   var debugNamespaces = [];

   this.enableDebug = function () {
      debugEnabled = true;
   };

   this.enableDebugNamespace = function () {
      for (var i = 0; i < arguments.length; i++) {
         debugNamespaces.push(arguments[i]);
      }
   };

   this.$get = function () {

      function debug() {
         if (!debugEnabled) return;
         if (debugNamespaces.indexOf(arguments[0]) !== -1) {
            console.log.apply(console, arguments);
         }
      }

      return {
         debug: debug
      };
   };
}];

},{}],9:[function(require,module,exports){
'use strict';

module.exports = ['CTXM', '$rootScope', function (CTXM, $rootScope) {

   function controller($scope, $element, $attrs) {

      var handler = $($attrs.handler);

      $('#nodeCanvas').on('contextmenu', function (e) {
         e.preventDefault();
      });
      $('body').on('mousedown', function (e) {
         close();
      });

      $element.on('mousedown', function (e) {
         // stop bubbling up to body so it doesnt clost before ng click
         e.stopPropagation();
      }).on('click', function (e) {
         close();
      }).on('contextmenu', function (e) {
         return e.preventDefault();
      });

      /* example
      $scope.menu = [
         { name: 'Add Input', fn: () => console.log( 'Add Input' ) },
      ];
      */

      $rootScope.$on('menu.open', function (broadCastEvent, data) {
         open(data.event, data.menu);
      });

      function open(e, menu) {
         $scope.menu = menu;
         $element.css({ top: e.clientY, left: e.clientX });
         $scope.active = true;
         $scope.$digest();
      }
      function close() {
         if (!$scope.active) return;
         $scope.active = false;
         $scope.$digest();
      }
   }

   return {

      restrict: 'E',
      replace: true,
      scope: {},
      templateUrl: './src/contextMenu.html',
      controller: controller

   };
}];

},{}],10:[function(require,module,exports){
'use strict';

module.exports = ['$rootScope', function ($rootScope) {

   return {};
}];

},{}],11:[function(require,module,exports){
(function (global){
'use strict';

global.UUID = require('uuid');
global.TOPOSORT = require('toposort');
global.CJSON = require('circular-json');

angular.module('nodeApp', ['common', 'xx', 'codeMirror', 'contextMenu']).config(['logProvider', function (logProvider) {
	logProvider.enableDebug();
	// logProvider.enableDebugNamespace( 'Scope' );
}]);

angular.module('xx', []).factory('nodeService', require('./xx/services/xxService')).factory('nodeFactory', require('./xx/services/xxFactory')).factory('nodeEvent', require('./xx/services/xxEvent')).service('updateLinkEvent', require('./xx/services/events/updateLinkEvent')).controller('xxCtrl', require('./xx/controllers/xx.ctrl')).directive('xxBody', require('./xx/directives/xxBody.dir')).directive('xxInterface', require('./xx/directives/xxInterface.dir')).directive('xxLabel', require('./xx/directives/xxLabel.dir')).directive('xxConnector', require('./xx/directives/xxConnector.dir')).directive('xxLink', require('./xx/directives/xxLink.dir')).directive('xxTempLink', require('./xx/directives/xxTempLink.dir')).directive('xxSortable', require('./xx/directives/xxSortable.dir')).directive('xxSortItem', require('./xx/directives/xxSortItem.dir')).directive('xxSelectable', require('./xx/directives/xxSelectable.dir')).directive('svgDraggable', require('./xx/directives/svgDraggable.dir')).directive('svgZoomable', require('./xx/directives/svgZoomable.dir'));

angular.module('common', []).filter('cjson', require('./common/cjson.filter')).provider('log', require('./common/log.provider'));

angular.module('codeMirror', []).factory('CM', require('./codeMirror.service')).directive('codeMirror', require('./codeMirror.dir'));

angular.module('contextMenu', []).factory('CTXM', require('./contextMenu.service')).directive('contextMenu', require('./contextMenu.dir'));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./codeMirror.dir":5,"./codeMirror.service":6,"./common/cjson.filter":7,"./common/log.provider":8,"./contextMenu.dir":9,"./contextMenu.service":10,"./xx/controllers/xx.ctrl":12,"./xx/directives/svgDraggable.dir":13,"./xx/directives/svgZoomable.dir":14,"./xx/directives/xxBody.dir":15,"./xx/directives/xxConnector.dir":16,"./xx/directives/xxInterface.dir":17,"./xx/directives/xxLabel.dir":18,"./xx/directives/xxLink.dir":19,"./xx/directives/xxSelectable.dir":20,"./xx/directives/xxSortItem.dir":21,"./xx/directives/xxSortable.dir":22,"./xx/directives/xxTempLink.dir":23,"./xx/services/events/updateLinkEvent":24,"./xx/services/xxEvent":25,"./xx/services/xxFactory":26,"./xx/services/xxService":27,"circular-json":1,"toposort":2,"uuid":4}],12:[function(require,module,exports){
(function (global){
'use strict';

module.exports = ['log', '$scope', 'nodeService', function (log, $scope, nodeService) {

   global.SCOPE = $scope;
   $scope.nodeService = nodeService;

   $scope.run = function () {
      nodeService.run();
      $scope.$apply();
   };

   // todo add / remove input, when add/remove input run apply this scope!
   // webaudio

   log.debug('Scope', $scope.$id, 'nodeCtrl', $scope);
}];

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],13:[function(require,module,exports){
'use strict';

module.exports = ['log', function (log) {

   function controller($scope, $element, $attrs) {
      var _this = this;

      if (!$element.attr('transform')) {
         $element.attr('transform', 'matrix(1,0,0,1,0,0)');
      }

      var disabled = false;
      var dragging = false;
      var mousehold = false;
      var prevPos = { x: null, y: null };
      var currPos = { x: null, y: null };

      var numPattern = /[\d|\.|\+|-]+/g;
      var mat = $element.attr('transform');
      mat = mat.match(numPattern).map(function (v) {
         return parseFloat(v);
      });

      // todo if atrs.transform
      this.position = { x: 0, y: 0 };
      this.position.x = mat[4];
      this.position.y = mat[5];

      var handler = $attrs.handler ? $attrs.handler : $element;

      var dragEventFn = [];

      $(handler).on('mousedown', function (e) {

         if (disabled) return;
         mousehold = true;
         prevPos.x = e.pageX;
         prevPos.y = e.pageY;

         mat = $element.attr('transform');
         mat = mat.match(numPattern).map(function (v) {
            return parseFloat(v);
         });
      });

      $('body').on('mouseup', function (e) {

         if (disabled) return;
         mousehold = false;
      }).on('mousemove', function (e) {

         if (disabled) return;

         if (mousehold) {

            dragging = true;

            currPos.x = e.pageX;
            currPos.y = e.pageY;

            var dx = (currPos.x - prevPos.x) / _this.scalingFactor;
            var dy = (currPos.y - prevPos.y) / _this.scalingFactor;

            var newX = mat[4] + dx;
            var newY = mat[5] + dy;

            _this.position.x = newX;
            _this.position.y = newY;

            $element.attr('transform', 'matrix(' + mat[0] + ',' + mat[1] + ',' + mat[2] + ',' + mat[3] + ',' + newX + ',' + newY + ')');

            if (dragEventFn.length) {
               dragEventFn.forEach(function (fn) {
                  return fn();
               });
            }
         }
      });

      this.scalingFactor = 1.0;
      this.disableDrag = function () {
         return disabled = true;
      };
      this.enableDrag = function () {
         return disabled = false;
      };
      this.addDragEvent = function (fn) {
         dragEventFn.push(fn);
      };

      this.getPosition = function () {
         mat = $element.attr('transform');
         mat = mat.match(numPattern).map(function (v) {
            return parseFloat(v);
         });
         return { x: mat[4], y: mat[5] };
      };

      log.debug('Scope', $scope.$id, 'Pannable', $scope);
   }

   return {

      restrict: 'A',
      controller: controller

   };
}];

},{}],14:[function(require,module,exports){
// jshint -W014
'use strict';

module.exports = ['log', function (log) {

   function controller($scope, $element, $attrs) {
      var _this = this;

      this.scalingFactor = 2.0;

      if (!$element.attr('transform')) {
         $element.attr('transform', 'matrix(1,0,0,1,0,0)');
         this.scalingFactor = 1.0;
      }

      var numPattern = /[\d|\.|\+|-]+/g;
      var handler = $($attrs.handler);
      handler.on('mousewheel', function (e) {

         e.preventDefault();
         var mat = $element.attr('transform').match(numPattern).map(function (v) {
            return parseFloat(v);
         });
         var gain = 2.0,
             minz = 0.25,
             maxz = 10.0,
             dd = gain * Math.sign(e.originalEvent ? e.originalEvent.wheelDeltaY : 0.0) * 0.1,
             ss = mat[0] + mat[0] * dd,
             sd = ss / mat[0],
             ox = e.pageX - handler.offset().left,
             oy = e.pageY - handler.offset().top,
             cx = mat[4],
             cy = mat[5],
             xx = sd * (cx - ox) + ox,
             yy = sd * (cy - oy) + oy;

         if (ss < minz || ss > maxz) return;

         $element.attr('transform', 'matrix(' + ss + ',' + mat[1] + ',' + mat[2] + ',' + ss + ',' + xx + ',' + yy + ')');

         $scope.$broadcast('zoomed', ss, xx, yy);
         _this.scalingFactor = ss;
      });

      log.debug('Scope', $scope.$id, 'Zoomable', $scope);
   }

   return {

      restrict: 'A',
      controller: controller

   };
}];

},{}],15:[function(require,module,exports){
'use strict';

module.exports = ['log', 'updateLinkEvent', function (log, updateLinkEvent) {

   function link($scope, $element, $attrs, $controllers) {

      var svgDraggableCtrl = $controllers[0];
      var svgZoomableCtrl = $controllers[1];

      svgDraggableCtrl.addDragEvent(function () {

         $scope.$broadcast('connectionNeedsUpdate');
         updateLinkEvent.broadcast();
      });

      $scope.$on('zoomed', function (e, v) {
         svgDraggableCtrl.scalingFactor = v;
      });

      svgDraggableCtrl.scalingFactor = svgZoomableCtrl.scalingFactor;

      log.debug('Scope', $scope.$id, 'Node', $scope);
   }

   function controller($scope, $element, $attrs) {

      var body = this;

      $scope.headerHeight = 10;
      $scope.width = 0;
      $scope.height = 0;
      $scope.rowHeight = 10;
      $scope.connWidth = 3.5;
      $scope.connHeight = 4;
      $scope.connWidthOffset = -0.5;
      $scope.connHeightOffset = 3;
      $scope.labelSpacing = 2;

      $scope.numInput = $scope.nodeObject.input.length;
      $scope.numOutput = $scope.nodeObject.output.length;

      this.getHeaderHeight = function () {
         return $scope.headerHeight;
      };
      this.getWidth = function () {
         return $scope.width;
      };
      this.getRowHeight = function () {
         return $scope.rowHeight;
      };
      this.getConnWidth = function () {
         return $scope.connWidth;
      };
      this.getConnHeight = function () {
         return $scope.connHeight;
      };
      this.getConnHeightOffset = function () {
         return $scope.connHeightOffset;
      };

      var computedHeaderWidth = 0;
      var maxComputedInputWidth = 0;
      var maxComputedOutputWidth = 0;
      function requestLabelWidth(type, v) {
         if (type === 'header') computedHeaderWidth = v;else if (type === 'input' && v > maxComputedInputWidth) maxComputedInputWidth = v;else if (type === 'output' && v > maxComputedOutputWidth) maxComputedOutputWidth = v;
      }

      function computeWidth() {
         var maxBodyWidth = 5 + maxComputedInputWidth + maxComputedOutputWidth + ($scope.connWidth + $scope.labelSpacing) * 2.0;
         var headerWidth = computedHeaderWidth + 15;
         $scope.width = Math.max(headerWidth, maxBodyWidth);
      }

      function computeHeight() {
         var maxConn = Math.max($scope.nodeObject.input.length, $scope.nodeObject.output.length);
         $scope.height = $scope.headerHeight + maxConn * $scope.rowHeight;
      }

      function updateUI() {
         $scope.numInput = $scope.nodeObject.input.length;
         $scope.numOutput = $scope.nodeObject.output.length;

         computedHeaderWidth = 0;
         maxComputedInputWidth = 0;
         maxComputedOutputWidth = 0;
         $scope.$broadcast('requestLabelWidth', requestLabelWidth);
         computeWidth();
         computeHeight();
         $scope.$broadcast('connectionNeedsUpdate');
      }

      $scope.$watch(function () {
         return $scope.nodeObject._ui.update;
      }, updateUI);
   }

   return {

      restrict: 'E',
      replace: true,
      require: ['^svgDraggable', '^svgZoomable'],
      templateNamespace: 'svg',
      templateUrl: './src/xx/template/xxBody.html',
      link: link,
      controller: controller,
      controllerAs: 'body'

   };
}];

},{}],16:[function(require,module,exports){
'use strict';

module.exports = ['log', '$rootScope', 'nodeService', 'nodeEvent', function (log, $rootScope, nodeService, nodeEvent) {

   function link($scope, $element, $attrs, $controllers) {

      var nodeCtrl = $controllers[0];
      var dragCtrl = $controllers[1];
      var sortCtrl = $controllers[2];

      $scope.hover = false;
      $scope.linking = false;

      $element.on('mousedown', function (e) {
         dragCtrl.disableDrag();
         sortCtrl.disableSort();
         nodeEvent.startConnection($scope.io);
         $rootScope.$broadcast('tempLinkStart', $scope.io.position);
         $scope.linking = true;
         $scope.$digest();
      }).on('mouseenter', function (e) {
         $scope.hover = true;
         $scope.$digest();
      }).on('mouseleave', function (e) {
         dragCtrl.enableDrag();
         sortCtrl.enableSort();
         $scope.hover = false;
         $scope.$digest();
      }).on('mouseup', function (e) {
         nodeEvent.endConnection($scope.io);
         $scope.$digest();
      }).on('dblclick', function (e) {
         nodeService.removeConnections($scope.io);
         nodeService.computeTopologicalOrder();
         $scope.$apply();
      });

      $('body').on('mouseup', function (e) {
         if (!$scope.linking) return;
         $scope.linking = false;
         $scope.$digest();
      });

      computePosition();

      $scope.$on('connectionNeedsUpdate', function () {
         computePosition();
      });

      function computePosition() {
         var yOff = parseInt($attrs.index) * $scope.rowHeight + nodeCtrl.getHeaderHeight() + nodeCtrl.getConnHeightOffset() + nodeCtrl.getConnHeight() * 0.5;
         if (!$scope.io.position) $scope.io.position = {};
         $scope.io.position.left = dragCtrl.position.x + ($scope.io.type ? nodeCtrl.getWidth() - 0.5 : 0 + 0.5);
         $scope.io.position.top = dragCtrl.position.y + yOff;
      }

      log.debug('Scope', $scope.$id, 'Connector', $scope);
   }

   return {

      restrict: 'E',
      replace: true,
      require: ['^xxBody', '^svgDraggable', '^xxSortable'],
      templateNamespace: 'svg',
      templateUrl: './src/xx/template/xxConnector.html',
      link: link

   };
}];

},{}],17:[function(require,module,exports){
'use strict';

module.exports = ['log', function (log) {

	function link($scope, $element, $attrs) {

		$scope.type = $attrs.type;
		$scope.ioArray = $scope.nodeObject[$attrs.type];

		log.debug('Scope', $scope.$id, 'IOCol', $attrs.type, $scope);
	}

	return {

		restrict: 'E',
		replace: true,
		templateNamespace: 'svg',
		templateUrl: './src/xx/template/xxInterface.html',
		scope: true,
		link: link

	};
}];

},{}],18:[function(require,module,exports){
'use strict';

module.exports = ['log', '$timeout', '$rootScope', function (log, $timeout, $rootScope) {

   function link($scope, $element, $attrs) {

      $scope.$on('requestLabelWidth', function (e, setMaxLabelWidth) {
         setMaxLabelWidth($attrs.xxLabel, $element[0].getComputedTextLength());
      });

      $timeout(function () {
         if ($scope.$last) $scope.nodeObject.updateUI();
      });

      log.debug('Scope', $scope.$id, 'Label', $attrs.xxLabel, $scope);

      $element.on('contextmenu', function (e) {

         e.preventDefault();

         if ($scope.io) {
            e.stopPropagation();
            var m = [{ name: 'Log Label Name', fn: function fn() {
                  return console.log($scope.io.name);
               } }, { name: 'Log Scope', fn: function fn() {
                  return console.log($scope);
               } }];
            $rootScope.$broadcast('menu.open', { event: e, menu: m });
         }
      });

      // $element.attachContextMenuService( [contextMenu] )
   }

   return {

      restrict: 'A',
      link: link

   };
}];

},{}],19:[function(require,module,exports){
'use strict';

module.exports = ['updateLinkEvent', function (updateLinkEvent) {

	function link($scope) {

		function updateConnection() {

			$scope.start = {
				x: $scope.pair[0].position.left,
				y: $scope.pair[0].position.top
			};
			$scope.end = {
				x: $scope.pair[1].position.left,
				y: $scope.pair[1].position.top
			};

			var cpOffset = Math.abs($scope.start.x - $scope.end.x) * 0.5;

			$scope.cp1 = {
				x: $scope.start.x - cpOffset,
				y: $scope.start.y
			};
			$scope.cp2 = {
				x: $scope.end.x + cpOffset,
				y: $scope.end.y
			};
		}

		function watcher() {
			return [$scope.pair[0].position, $scope.pair[1].position];
		}
		$scope.$watch(watcher, updateConnection, true);

		updateLinkEvent.listen(function () {
			$scope.$digest();
		});
	}

	return {

		restrict: 'E',
		replace: true,
		templateNamespace: 'svg',
		template: '<path ng-attr-d="M{{start.x}},{{start.y}} C{{cp1.x}},{{cp1.y}} {{cp2.x}},{{cp2.y}} {{end.x}},{{end.y}}"/>',
		scope: true,
		link: link

	};
}];

},{}],20:[function(require,module,exports){
'use strict';

module.exports = ['log', 'nodeService', 'CM', '$rootScope', function (log, nodeService, CM, $rootScope) {

   function link($scope, $element, $attrs, $controllers) {

      $element.on('click', function (e) {
         nodeService.setSelected($scope.nodeObject);
         CM.getInstance().setValue($scope.nodeObject._fnstr);
         $scope.$apply();
      });

      $scope.$watch(nodeService.getSelectedNode, function (n) {
         if (n) $scope.isSelected = n.uuid === $scope.nodeObject.uuid;else $scope.isSelected = false;
      });

      log.debug('Scope', $scope.$id, 'Selectable', $scope);

      $element.on('contextmenu', function (e) {

         e.stopPropagation();
         e.preventDefault();

         var m = [{ name: 'Log Scope', fn: function fn() {
               return console.log($scope);
            } }];
         $rootScope.$broadcast('menu.open', { event: e, menu: m });
      });
   }

   return {

      restrict: 'A',
      link: link

   };
}];

},{}],21:[function(require,module,exports){
'use strict';

module.exports = ['log', function (log) {

   function link($scope, $element, $attrs, $controllers) {

      var sortCtrl = $controllers[0];
      var dragCtrl = $controllers[1];

      $element.on('mousedown', function (e) {
         dragCtrl.disableDrag();
         sortCtrl.sorting = true;
         sortCtrl.startSort($scope.io);
      }).on('mouseenter', function (e) {
         if (!sortCtrl.sorting) return;
         sortCtrl.endSort($scope.io);
      });

      $('body').on('mouseup', function (e) {
         if (!sortCtrl.sorting) return;
         dragCtrl.enableDrag();
         sortCtrl.reset();
         sortCtrl.sorting = false;
      });

      log.debug('Scope', $scope.$id, 'Sortitem', $scope);
   }

   return {

      restrict: 'A',
      require: ['^xxSortable', '^svgDraggable'],
      link: link

   };
}];

},{}],22:[function(require,module,exports){
'use strict';

module.exports = ['log', 'updateLinkEvent', function (log, updateLinkEvent) {

   function controller($scope, $element, $attrs) {
      var _this = this;

      var curr = null;
      var tgt = null;

      var disabled = false;
      this.sorting = false;

      this.reset = function () {
         curr = null;
         tgt = null;
      };

      this.startSort = function (n) {
         if (disabled) return;
         curr = n;
      };

      this.endSort = function (n) {
         if (disabled || !_this.sorting) return;
         tgt = n;
         if (curr !== null && tgt !== null && curr !== tgt) {
            swapRow(curr, tgt);
            $scope.$digest();
            $scope.$broadcast('connectionNeedsUpdate');
            updateLinkEvent.broadcast();
         }
      };

      this.disableSort = function () {
         disabled = true;
      };
      this.enableSort = function () {
         disabled = false;
      };

      function swapRow(curr, tgt) {

         var type = curr.type === 0 ? 'input' : 'output';
         var t1 = $scope.nodeObject[type].indexOf(tgt);
         var t2 = $scope.nodeObject[type].indexOf(curr);

         $scope.nodeObject[type][t1] = curr;
         $scope.nodeObject[type][t2] = tgt;
      }

      log.debug('Scope', $scope.$id, 'Sortable', $scope);
   }

   return {

      restrict: 'A',
      controller: controller

   };
}];

},{}],23:[function(require,module,exports){
'use strict';

module.exports = ['$rootScope', function ($rootScope) {

   function link($scope, $element, $attrs, $controllers) {

      // make element click thru-able
      $element.css('pointer-events', 'none');

      var panCtrl = $controllers[0];
      var zoomCtrl = $controllers[1];
      $scope.active = false;

      $rootScope.$on('tempLinkStart', function (e, pos) {
         $scope.active = true;
         $scope.start = {
            x: pos.left,
            y: pos.top
         };
         $scope.cp1 = $scope.start;
      });

      $('body').on('mousemove', function (e) {
         if (!$scope.active) return;
         var off = $('#nodeCanvas').offset();

         var cx = e.pageX - off.left;
         var cy = e.pageY - off.top;
         var sc = zoomCtrl.scalingFactor;

         var pos = panCtrl.getPosition();
         var ox = pos.x;
         var oy = pos.y;

         $scope.end = {
            x: (cx - ox) / sc,
            y: (cy - oy) / sc
         };
         $scope.cp2 = $scope.end;

         $scope.$digest();
      }).on('mouseup', function (e) {
         $scope.active = false;
         $scope.$digest();
      });
   }

   return {

      restrict: 'E',
      replace: true,
      require: ['^svgDraggable', '^svgZoomable'],
      templateNamespace: 'svg',
      template: '<path ng-show="active" ng-attr-d="M{{start.x}},{{start.y}} C{{cp1.x}},{{cp1.y}} {{cp2.x}},{{cp2.y}} {{end.x}},{{end.y}}"/>',
      scope: {},
      link: link

   };
}];

},{}],24:[function(require,module,exports){
'use strict';

module.exports = ['$rootScope', function ($rootScope) {

   this.broadcast = function () {
      return $rootScope.$broadcast('linkNeedsUpdate');
   };
   this.listen = function (callback) {
      return $rootScope.$on('linkNeedsUpdate', callback);
   };
}];

},{}],25:[function(require,module,exports){
'use strict';

module.exports = ['$rootScope', 'nodeService', function ($rootScope, nodeService) {

   var iniConn = null;

   function startConnection(conn) {
      iniConn = conn;
   }

   function endConnection(endConn) {

      if (validateConnection(iniConn, endConn)) {

         var pair = [];
         pair[iniConn.type] = iniConn;
         pair[endConn.type] = endConn;

         if (!isCyclic(pair)) {
            if (!isDuplicate(pair[0], pair[1])) {

               if (!pair[0].available) {
                  nodeService.removeConnections(pair[0]);
               }

               pair[0].connect(pair[1]);
               nodeService.connections.push(pair);
               nodeService.computeTopologicalOrder();
               $rootScope.$apply();
            } else {
               console.log('Duplicated pair.');
            }
         } else {
            console.log('Cyclic dependency.');
         }
      }

      resetConn();
   }

   function resetConn() {
      iniConn = null;
   }

   function validateConnection(a, b) {

      return a !== null && b !== null && a.getParent().uuid !== b.getParent().uuid && a.type !== b.type;
   }

   function isDuplicate(inp, opt) {
      return nodeService.connections.some(function (pair) {
         return pair[0].uuid === inp.uuid && pair[1].uuid === opt.uuid;
      });
   }

   function isCyclic(pair) {
      var tmp = nodeService.connections.slice();
      tmp.push(pair);
      try {
         nodeService.topoSort(tmp);
      } catch (e) {
         return true;
      }
      return false;
   }

   return {

      startConnection: startConnection,
      endConnection: endConnection

   };
}];

},{}],26:[function(require,module,exports){
// jshint -W054
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

module.exports = [function () {
   var Connection = function Connection(name, parent) {
      _classCallCheck(this, Connection);

      this.uuid = UUID();
      this.name = name;
      this.getParent = function () {
         return parent;
      };
      this.available = true;
   };

   var Input = (function (_Connection) {
      function Input(name, parent) {
         _classCallCheck(this, Input);

         _get(Object.getPrototypeOf(Input.prototype), 'constructor', this).call(this, name, parent);
         this.type = 0;
         this.dest = null;
      }

      _inherits(Input, _Connection);

      _createClass(Input, [{
         key: 'connect',
         value: function connect(io) {
            //input
            this.dest = io;
            this.available = false;
            // output
            io.dest.push(this);
            io.available = false;
         }
      }, {
         key: 'disconnect',
         value: function disconnect() {
            // output
            var i = this.dest.dest.indexOf(this);
            if (i > -1) this.dest.dest.splice(i, 1);
            if (this.dest.dest.length === 0) this.dest.available = true;
            // input
            this.dest = null;
            this.available = true;
         }
      }, {
         key: 'getDestData',
         value: function getDestData() {
            return this.dest === null ? null : this.dest.data;
         }
      }]);

      return Input;
   })(Connection);

   var Output = (function (_Connection2) {
      function Output(name, parent) {
         _classCallCheck(this, Output);

         _get(Object.getPrototypeOf(Output.prototype), 'constructor', this).call(this, name, parent);
         this.type = 1;
         this.data = null;
         this.dest = [];
      }

      _inherits(Output, _Connection2);

      return Output;
   })(Connection);

   var Executable = (function () {
      function Executable() {
         _classCallCheck(this, Executable);

         this._fnstr = '';
         this._task = null;
      }

      _createClass(Executable, [{
         key: 'compile',
         value: function compile() {
            try {
               this._task = new Function('input', this._fnstr);
            } catch (err) {
               return err;
            }
            return null;
         }
      }, {
         key: 'execute',
         value: function execute() {
            var inpObj = {};
            if (this.input.length !== 0) {
               this.input.forEach(function (inp) {
                  inpObj[inp.name] = inp.getDestData();
               });
               console.log(inpObj);
            }
            var res = null;
            try {
               res = this._task.call(null, inpObj);
            } catch (e) {
               console.error(e);
            }
            this.output.forEach(function (opt) {
               opt.data = res[opt.name];
            });
         }
      }]);

      return Executable;
   })();

   var Node = (function (_Executable) {
      function Node(name) {
         var _this = this;

         _classCallCheck(this, Node);

         _get(Object.getPrototypeOf(Node.prototype), 'constructor', this).call(this);
         this.uuid = UUID();
         this.name = name;
         this.input = [];
         this.output = [];
         this.order = -1;
         this.updateUI = function () {
            return _this._ui.update = !_this._ui.update;
         };
         this._ui = {
            update: false
         };
      }

      _inherits(Node, _Executable);

      _createClass(Node, [{
         key: 'addInput',
         value: function addInput() {
            for (var i = 0; i < arguments.length; i++) {
               this.input.push(new Input(arguments[i], this));
            }
         }
      }, {
         key: 'addOutput',
         value: function addOutput(name) {
            for (var i = 0; i < arguments.length; i++) {
               this.output.push(new Output(arguments[i], this));
            }
         }
      }]);

      return Node;
   })(Executable);

   function create(name) {
      return new Node(name);
   }

   return {
      create: create
   };
}];

},{}],27:[function(require,module,exports){
'use strict';

module.exports = ['nodeFactory', function (nodeFactory) {

   var nodes = [];
   var connections = [];

   var selectedNode = null;

   function getSelectedNode() {
      return selectedNode;
   }

   function setSelected(node) {
      selectedNode = node;
   }

   function clearSelected() {
      selectedNode = null;
   }

   function run() {

      nodes.sort(function (a, b) {
         return a.order - b.order;
      });

      nodes.filter(function (n) {
         return n.order !== -1;
      }).forEach(function (n) {
         var err = n.compile();
         if (err) console.error('Node order No.' + n.order, err);
         n.execute();
      });
   }

   function createEmptyNode() {
      var n = nodeFactory.create('NULL');
      nodes.push(n);
      return n;
   }

   function generateNode() {

      var n;

      n = nodeFactory.create('Constants');
      n.addOutput('x', 'y', 'z');
      n._fnstr = 'return { x: 42, y: 33, z: 76 };';
      n.compile();
      nodes.push(n);

      n = nodeFactory.create('Vector3');
      n.addInput('u', 'v', 'w');
      n.addOutput('vec3');
      n._fnstr = 'return { vec3: [ input.u, input.v, input.w ] };';
      n.compile();
      nodes.push(n);

      n = nodeFactory.create('Vector3');
      n.addInput('s', 't', 'p');
      n.addOutput('vec3');
      n._fnstr = 'return { vec3: [ input.s, input.t, input.p ] };';
      n.compile();
      nodes.push(n);

      n = nodeFactory.create('Dot');
      n.addInput('v1', 'v2');
      n.addOutput('f');
      n._fnstr = 'return { f: input.v1[0]*input.v2[0]+input.v1[1]*input.v2[1]+input.v1[2]*input.v2[2] };';
      n.compile();
      nodes.push(n);

      n = nodeFactory.create('Console');
      n.addInput('log');
      n._fnstr = 'console.log( input.log );';
      n.compile();
      nodes.push(n);
   }

   function deleteIO(io) {}

   function topoSort(connArray) {

      var deps = [];
      connArray.forEach(function (pair) {

         var v1 = pair[0].getParent().uuid;
         var v2 = pair[1].getParent().uuid;
         deps.push([v2, v1]);
      });

      return TOPOSORT(deps);
   }

   function computeTopologicalOrder() {

      var sorted = topoSort(connections);
      nodes.forEach(function (n) {
         n.order = sorted.indexOf(n.uuid);
      });
   }

   function removeConnections(conn) {

      var rm = [];
      connections.forEach(function (pair, idx) {
         if (conn.uuid === pair[conn.type].uuid) {
            pair[0].disconnect();
            rm.push(idx);
         }
      });
      for (var i = rm.length - 1; i >= 0; i--) {
         connections.splice(rm[i], 1);
      }
   }

   function parseFunctionParameters(fnStr) {
      var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
      var ARGUMENT_NAMES = /([^\s,]+)/g;
      fnStr = fnStr.replace(STRIP_COMMENTS, '');
      var result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
      if (result === null) result = [];
      return result;
   }

   return {

      nodes: nodes,
      connections: connections,
      generateNode: generateNode,
      computeTopologicalOrder: computeTopologicalOrder,
      removeConnections: removeConnections,
      clearSelected: clearSelected,
      setSelected: setSelected,
      getSelectedNode: getSelectedNode,
      run: run,
      createEmptyNode: createEmptyNode,
      topoSort: topoSort

   };
}];

/* remove connections
   remove io
*/

},{}]},{},[11])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvY2lyY3VsYXItanNvbi9idWlsZC9jaXJjdWxhci1qc29uLm5vZGUuanMiLCJub2RlX21vZHVsZXMvdG9wb3NvcnQvaW5kZXguanMiLCJub2RlX21vZHVsZXMvdXVpZC9ybmctYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy91dWlkL3V1aWQuanMiLCIvVXNlcnMvTklYL0RvY3VtZW50cy9uaXgvZmxvdy9zcmMvY29kZU1pcnJvci5kaXIuanMiLCIvVXNlcnMvTklYL0RvY3VtZW50cy9uaXgvZmxvdy9zcmMvY29kZU1pcnJvci5zZXJ2aWNlLmpzIiwiL1VzZXJzL05JWC9Eb2N1bWVudHMvbml4L2Zsb3cvc3JjL2NvbW1vbi9janNvbi5maWx0ZXIuanMiLCIvVXNlcnMvTklYL0RvY3VtZW50cy9uaXgvZmxvdy9zcmMvY29tbW9uL2xvZy5wcm92aWRlci5qcyIsIi9Vc2Vycy9OSVgvRG9jdW1lbnRzL25peC9mbG93L3NyYy9jb250ZXh0TWVudS5kaXIuanMiLCIvVXNlcnMvTklYL0RvY3VtZW50cy9uaXgvZmxvdy9zcmMvY29udGV4dE1lbnUuc2VydmljZS5qcyIsIi9Vc2Vycy9OSVgvRG9jdW1lbnRzL25peC9mbG93L3NyYy9pbmRleC5qcyIsIi9Vc2Vycy9OSVgvRG9jdW1lbnRzL25peC9mbG93L3NyYy94eC9jb250cm9sbGVycy94eC5jdHJsLmpzIiwiL1VzZXJzL05JWC9Eb2N1bWVudHMvbml4L2Zsb3cvc3JjL3h4L2RpcmVjdGl2ZXMvc3ZnRHJhZ2dhYmxlLmRpci5qcyIsIi9Vc2Vycy9OSVgvRG9jdW1lbnRzL25peC9mbG93L3NyYy94eC9kaXJlY3RpdmVzL3N2Z1pvb21hYmxlLmRpci5qcyIsIi9Vc2Vycy9OSVgvRG9jdW1lbnRzL25peC9mbG93L3NyYy94eC9kaXJlY3RpdmVzL3h4Qm9keS5kaXIuanMiLCIvVXNlcnMvTklYL0RvY3VtZW50cy9uaXgvZmxvdy9zcmMveHgvZGlyZWN0aXZlcy94eENvbm5lY3Rvci5kaXIuanMiLCIvVXNlcnMvTklYL0RvY3VtZW50cy9uaXgvZmxvdy9zcmMveHgvZGlyZWN0aXZlcy94eEludGVyZmFjZS5kaXIuanMiLCIvVXNlcnMvTklYL0RvY3VtZW50cy9uaXgvZmxvdy9zcmMveHgvZGlyZWN0aXZlcy94eExhYmVsLmRpci5qcyIsIi9Vc2Vycy9OSVgvRG9jdW1lbnRzL25peC9mbG93L3NyYy94eC9kaXJlY3RpdmVzL3h4TGluay5kaXIuanMiLCIvVXNlcnMvTklYL0RvY3VtZW50cy9uaXgvZmxvdy9zcmMveHgvZGlyZWN0aXZlcy94eFNlbGVjdGFibGUuZGlyLmpzIiwiL1VzZXJzL05JWC9Eb2N1bWVudHMvbml4L2Zsb3cvc3JjL3h4L2RpcmVjdGl2ZXMveHhTb3J0SXRlbS5kaXIuanMiLCIvVXNlcnMvTklYL0RvY3VtZW50cy9uaXgvZmxvdy9zcmMveHgvZGlyZWN0aXZlcy94eFNvcnRhYmxlLmRpci5qcyIsIi9Vc2Vycy9OSVgvRG9jdW1lbnRzL25peC9mbG93L3NyYy94eC9kaXJlY3RpdmVzL3h4VGVtcExpbmsuZGlyLmpzIiwiL1VzZXJzL05JWC9Eb2N1bWVudHMvbml4L2Zsb3cvc3JjL3h4L3NlcnZpY2VzL2V2ZW50cy91cGRhdGVMaW5rRXZlbnQuanMiLCIvVXNlcnMvTklYL0RvY3VtZW50cy9uaXgvZmxvdy9zcmMveHgvc2VydmljZXMveHhFdmVudC5qcyIsIi9Vc2Vycy9OSVgvRG9jdW1lbnRzL25peC9mbG93L3NyYy94eC9zZXJ2aWNlcy94eEZhY3RvcnkuanMiLCIvVXNlcnMvTklYL0RvY3VtZW50cy9uaXgvZmxvdy9zcmMveHgvc2VydmljZXMveHhTZXJ2aWNlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25MQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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Q2hCOztBQUVELFVBQU87O0FBRUosV0FBSyxFQUFMLEtBQUs7QUFDTCxpQkFBVyxFQUFYLFdBQVc7QUFDWCxrQkFBWSxFQUFaLFlBQVk7QUFDWiw2QkFBdUIsRUFBdkIsdUJBQXVCO0FBQ3ZCLHVCQUFpQixFQUFqQixpQkFBaUI7QUFDakIsbUJBQWEsRUFBYixhQUFhO0FBQ2IsaUJBQVcsRUFBWCxXQUFXO0FBQ1gscUJBQWUsRUFBZixlQUFlO0FBQ2YsU0FBRyxFQUFILEdBQUc7QUFDSCxxQkFBZSxFQUFmLGVBQWU7QUFDZixjQUFRLEVBQVIsUUFBUTs7SUFFVixDQUFDO0NBRUosQ0FBRSxDQUFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qIVxuQ29weXJpZ2h0IChDKSAyMDEzIGJ5IFdlYlJlZmxlY3Rpb25cblxuUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxub2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xudG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG5mdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuXG5UaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG5cblRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbklNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG5BVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG5MSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuVEhFIFNPRlRXQVJFLlxuXG4qL1xudmFyXG4gIC8vIHNob3VsZCBiZSBhIG5vdCBzbyBjb21tb24gY2hhclxuICAvLyBwb3NzaWJseSBvbmUgSlNPTiBkb2VzIG5vdCBlbmNvZGVcbiAgLy8gcG9zc2libHkgb25lIGVuY29kZVVSSUNvbXBvbmVudCBkb2VzIG5vdCBlbmNvZGVcbiAgLy8gcmlnaHQgbm93IHRoaXMgY2hhciBpcyAnficgYnV0IHRoaXMgbWlnaHQgY2hhbmdlIGluIHRoZSBmdXR1cmVcbiAgc3BlY2lhbENoYXIgPSAnficsXG4gIHNhZmVTcGVjaWFsQ2hhciA9ICdcXFxceCcgKyAoXG4gICAgJzAnICsgc3BlY2lhbENoYXIuY2hhckNvZGVBdCgwKS50b1N0cmluZygxNilcbiAgKS5zbGljZSgtMiksXG4gIGVzY2FwZWRTYWZlU3BlY2lhbENoYXIgPSAnXFxcXCcgKyBzYWZlU3BlY2lhbENoYXIsXG4gIHNwZWNpYWxDaGFyUkcgPSBuZXcgUmVnRXhwKHNhZmVTcGVjaWFsQ2hhciwgJ2cnKSxcbiAgc2FmZVNwZWNpYWxDaGFyUkcgPSBuZXcgUmVnRXhwKGVzY2FwZWRTYWZlU3BlY2lhbENoYXIsICdnJyksXG5cbiAgc2FmZVN0YXJ0V2l0aFNwZWNpYWxDaGFyUkcgPSBuZXcgUmVnRXhwKCcoPzpefFteXFxcXFxcXFxdKScgKyBlc2NhcGVkU2FmZVNwZWNpYWxDaGFyKSxcblxuICBpbmRleE9mID0gW10uaW5kZXhPZiB8fCBmdW5jdGlvbih2KXtcbiAgICBmb3IodmFyIGk9dGhpcy5sZW5ndGg7aS0tJiZ0aGlzW2ldIT09djspO1xuICAgIHJldHVybiBpO1xuICB9LFxuICAkU3RyaW5nID0gU3RyaW5nICAvLyB0aGVyZSdzIG5vIHdheSB0byBkcm9wIHdhcm5pbmdzIGluIEpTSGludFxuICAgICAgICAgICAgICAgICAgICAvLyBhYm91dCBuZXcgU3RyaW5nIC4uLiB3ZWxsLCBJIG5lZWQgdGhhdCBoZXJlIVxuICAgICAgICAgICAgICAgICAgICAvLyBmYWtlZCwgYW5kIGhhcHB5IGxpbnRlciFcbjtcblxuZnVuY3Rpb24gZ2VuZXJhdGVSZXBsYWNlcih2YWx1ZSwgcmVwbGFjZXIsIHJlc29sdmUpIHtcbiAgdmFyXG4gICAgcGF0aCA9IFtdLFxuICAgIGFsbCAgPSBbdmFsdWVdLFxuICAgIHNlZW4gPSBbdmFsdWVdLFxuICAgIG1hcHAgPSBbcmVzb2x2ZSA/IHNwZWNpYWxDaGFyIDogJ1tDaXJjdWxhcl0nXSxcbiAgICBsYXN0ID0gdmFsdWUsXG4gICAgbHZsICA9IDEsXG4gICAgaVxuICA7XG4gIHJldHVybiBmdW5jdGlvbihrZXksIHZhbHVlKSB7XG4gICAgLy8gdGhlIHJlcGxhY2VyIGhhcyByaWdodHMgdG8gZGVjaWRlXG4gICAgLy8gaWYgYSBuZXcgb2JqZWN0IHNob3VsZCBiZSByZXR1cm5lZFxuICAgIC8vIG9yIGlmIHRoZXJlJ3Mgc29tZSBrZXkgdG8gZHJvcFxuICAgIC8vIGxldCdzIGNhbGwgaXQgaGVyZSByYXRoZXIgdGhhbiBcInRvbyBsYXRlXCJcbiAgICBpZiAocmVwbGFjZXIpIHZhbHVlID0gcmVwbGFjZXIuY2FsbCh0aGlzLCBrZXksIHZhbHVlKTtcblxuICAgIC8vIGRpZCB5b3Uga25vdyA/IFNhZmFyaSBwYXNzZXMga2V5cyBhcyBpbnRlZ2VycyBmb3IgYXJyYXlzXG4gICAgLy8gd2hpY2ggbWVhbnMgaWYgKGtleSkgd2hlbiBrZXkgPT09IDAgd29uJ3QgcGFzcyB0aGUgY2hlY2tcbiAgICBpZiAoa2V5ICE9PSAnJykge1xuICAgICAgaWYgKGxhc3QgIT09IHRoaXMpIHtcbiAgICAgICAgaSA9IGx2bCAtIGluZGV4T2YuY2FsbChhbGwsIHRoaXMpIC0gMTtcbiAgICAgICAgbHZsIC09IGk7XG4gICAgICAgIGFsbC5zcGxpY2UobHZsLCBhbGwubGVuZ3RoKTtcbiAgICAgICAgcGF0aC5zcGxpY2UobHZsIC0gMSwgcGF0aC5sZW5ndGgpO1xuICAgICAgICBsYXN0ID0gdGhpcztcbiAgICAgIH1cbiAgICAgIC8vIGNvbnNvbGUubG9nKGx2bCwga2V5LCBwYXRoKTtcbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlKSB7XG4gICAgICAgIGx2bCA9IGFsbC5wdXNoKGxhc3QgPSB2YWx1ZSk7XG4gICAgICAgIGkgPSBpbmRleE9mLmNhbGwoc2VlbiwgdmFsdWUpO1xuICAgICAgICBpZiAoaSA8IDApIHtcbiAgICAgICAgICBpID0gc2Vlbi5wdXNoKHZhbHVlKSAtIDE7XG4gICAgICAgICAgaWYgKHJlc29sdmUpIHtcbiAgICAgICAgICAgIC8vIGtleSBjYW5ub3QgY29udGFpbiBzcGVjaWFsQ2hhciBidXQgY291bGQgYmUgbm90IGEgc3RyaW5nXG4gICAgICAgICAgICBwYXRoLnB1c2goKCcnICsga2V5KS5yZXBsYWNlKHNwZWNpYWxDaGFyUkcsIHNhZmVTcGVjaWFsQ2hhcikpO1xuICAgICAgICAgICAgbWFwcFtpXSA9IHNwZWNpYWxDaGFyICsgcGF0aC5qb2luKHNwZWNpYWxDaGFyKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbWFwcFtpXSA9IG1hcHBbMF07XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhbHVlID0gbWFwcFtpXTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgJiYgcmVzb2x2ZSkge1xuICAgICAgICAgIC8vIGVuc3VyZSBubyBzcGVjaWFsIGNoYXIgaW52b2x2ZWQgb24gZGVzZXJpYWxpemF0aW9uXG4gICAgICAgICAgLy8gaW4gdGhpcyBjYXNlIG9ubHkgZmlyc3QgY2hhciBpcyBpbXBvcnRhbnRcbiAgICAgICAgICAvLyBubyBuZWVkIHRvIHJlcGxhY2UgYWxsIHZhbHVlIChiZXR0ZXIgcGVyZm9ybWFuY2UpXG4gICAgICAgICAgdmFsdWUgPSB2YWx1ZSAucmVwbGFjZShzYWZlU3BlY2lhbENoYXIsIGVzY2FwZWRTYWZlU3BlY2lhbENoYXIpXG4gICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZShzcGVjaWFsQ2hhciwgc2FmZVNwZWNpYWxDaGFyKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdmFsdWU7XG4gIH07XG59XG5cbmZ1bmN0aW9uIHJldHJpZXZlRnJvbVBhdGgoY3VycmVudCwga2V5cykge1xuICBmb3IodmFyIGkgPSAwLCBsZW5ndGggPSBrZXlzLmxlbmd0aDsgaSA8IGxlbmd0aDsgY3VycmVudCA9IGN1cnJlbnRbXG4gICAgLy8ga2V5cyBzaG91bGQgYmUgbm9ybWFsaXplZCBiYWNrIGhlcmVcbiAgICBrZXlzW2krK10ucmVwbGFjZShzYWZlU3BlY2lhbENoYXJSRywgc3BlY2lhbENoYXIpXG4gIF0pO1xuICByZXR1cm4gY3VycmVudDtcbn1cblxuZnVuY3Rpb24gZ2VuZXJhdGVSZXZpdmVyKHJldml2ZXIpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcbiAgICB2YXIgaXNTdHJpbmcgPSB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnO1xuICAgIGlmIChpc1N0cmluZyAmJiB2YWx1ZS5jaGFyQXQoMCkgPT09IHNwZWNpYWxDaGFyKSB7XG4gICAgICByZXR1cm4gbmV3ICRTdHJpbmcodmFsdWUuc2xpY2UoMSkpO1xuICAgIH1cbiAgICBpZiAoa2V5ID09PSAnJykgdmFsdWUgPSByZWdlbmVyYXRlKHZhbHVlLCB2YWx1ZSwge30pO1xuICAgIC8vIGFnYWluLCBvbmx5IG9uZSBuZWVkZWQsIGRvIG5vdCB1c2UgdGhlIFJlZ0V4cCBmb3IgdGhpcyByZXBsYWNlbWVudFxuICAgIC8vIG9ubHkga2V5cyBuZWVkIHRoZSBSZWdFeHBcbiAgICBpZiAoaXNTdHJpbmcpIHZhbHVlID0gdmFsdWUgLnJlcGxhY2Uoc2FmZVN0YXJ0V2l0aFNwZWNpYWxDaGFyUkcsIHNwZWNpYWxDaGFyKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZShlc2NhcGVkU2FmZVNwZWNpYWxDaGFyLCBzYWZlU3BlY2lhbENoYXIpO1xuICAgIHJldHVybiByZXZpdmVyID8gcmV2aXZlci5jYWxsKHRoaXMsIGtleSwgdmFsdWUpIDogdmFsdWU7XG4gIH07XG59XG5cbmZ1bmN0aW9uIHJlZ2VuZXJhdGVBcnJheShyb290LCBjdXJyZW50LCByZXRyaWV2ZSkge1xuICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0gY3VycmVudC5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIGN1cnJlbnRbaV0gPSByZWdlbmVyYXRlKHJvb3QsIGN1cnJlbnRbaV0sIHJldHJpZXZlKTtcbiAgfVxuICByZXR1cm4gY3VycmVudDtcbn1cblxuZnVuY3Rpb24gcmVnZW5lcmF0ZU9iamVjdChyb290LCBjdXJyZW50LCByZXRyaWV2ZSkge1xuICBmb3IgKHZhciBrZXkgaW4gY3VycmVudCkge1xuICAgIGlmIChjdXJyZW50Lmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgIGN1cnJlbnRba2V5XSA9IHJlZ2VuZXJhdGUocm9vdCwgY3VycmVudFtrZXldLCByZXRyaWV2ZSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBjdXJyZW50O1xufVxuXG5mdW5jdGlvbiByZWdlbmVyYXRlKHJvb3QsIGN1cnJlbnQsIHJldHJpZXZlKSB7XG4gIHJldHVybiBjdXJyZW50IGluc3RhbmNlb2YgQXJyYXkgP1xuICAgIC8vIGZhc3QgQXJyYXkgcmVjb25zdHJ1Y3Rpb25cbiAgICByZWdlbmVyYXRlQXJyYXkocm9vdCwgY3VycmVudCwgcmV0cmlldmUpIDpcbiAgICAoXG4gICAgICBjdXJyZW50IGluc3RhbmNlb2YgJFN0cmluZyA/XG4gICAgICAgIChcbiAgICAgICAgICAvLyByb290IGlzIGFuIGVtcHR5IHN0cmluZ1xuICAgICAgICAgIGN1cnJlbnQubGVuZ3RoID9cbiAgICAgICAgICAgIChcbiAgICAgICAgICAgICAgcmV0cmlldmUuaGFzT3duUHJvcGVydHkoY3VycmVudCkgP1xuICAgICAgICAgICAgICAgIHJldHJpZXZlW2N1cnJlbnRdIDpcbiAgICAgICAgICAgICAgICByZXRyaWV2ZVtjdXJyZW50XSA9IHJldHJpZXZlRnJvbVBhdGgoXG4gICAgICAgICAgICAgICAgICByb290LCBjdXJyZW50LnNwbGl0KHNwZWNpYWxDaGFyKVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICkgOlxuICAgICAgICAgICAgcm9vdFxuICAgICAgICApIDpcbiAgICAgICAgKFxuICAgICAgICAgIGN1cnJlbnQgaW5zdGFuY2VvZiBPYmplY3QgP1xuICAgICAgICAgICAgLy8gZGVkaWNhdGVkIE9iamVjdCBwYXJzZXJcbiAgICAgICAgICAgIHJlZ2VuZXJhdGVPYmplY3Qocm9vdCwgY3VycmVudCwgcmV0cmlldmUpIDpcbiAgICAgICAgICAgIC8vIHZhbHVlIGFzIGl0IGlzXG4gICAgICAgICAgICBjdXJyZW50XG4gICAgICAgIClcbiAgICApXG4gIDtcbn1cblxuZnVuY3Rpb24gc3RyaW5naWZ5UmVjdXJzaW9uKHZhbHVlLCByZXBsYWNlciwgc3BhY2UsIGRvTm90UmVzb2x2ZSkge1xuICByZXR1cm4gSlNPTi5zdHJpbmdpZnkodmFsdWUsIGdlbmVyYXRlUmVwbGFjZXIodmFsdWUsIHJlcGxhY2VyLCAhZG9Ob3RSZXNvbHZlKSwgc3BhY2UpO1xufVxuXG5mdW5jdGlvbiBwYXJzZVJlY3Vyc2lvbih0ZXh0LCByZXZpdmVyKSB7XG4gIHJldHVybiBKU09OLnBhcnNlKHRleHQsIGdlbmVyYXRlUmV2aXZlcihyZXZpdmVyKSk7XG59XG50aGlzLnN0cmluZ2lmeSA9IHN0cmluZ2lmeVJlY3Vyc2lvbjtcbnRoaXMucGFyc2UgPSBwYXJzZVJlY3Vyc2lvbjsiLCJcclxuLyoqXHJcbiAqIFRvcG9sb2dpY2FsIHNvcnRpbmcgZnVuY3Rpb25cclxuICpcclxuICogQHBhcmFtIHtBcnJheX0gZWRnZXNcclxuICogQHJldHVybnMge0FycmF5fVxyXG4gKi9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IGZ1bmN0aW9uKGVkZ2VzKXtcclxuICByZXR1cm4gdG9wb3NvcnQodW5pcXVlTm9kZXMoZWRnZXMpLCBlZGdlcylcclxufVxyXG5cclxuZXhwb3J0cy5hcnJheSA9IHRvcG9zb3J0XHJcblxyXG5mdW5jdGlvbiB0b3Bvc29ydChub2RlcywgZWRnZXMpIHtcclxuICB2YXIgY3Vyc29yID0gbm9kZXMubGVuZ3RoXHJcbiAgICAsIHNvcnRlZCA9IG5ldyBBcnJheShjdXJzb3IpXHJcbiAgICAsIHZpc2l0ZWQgPSB7fVxyXG4gICAgLCBpID0gY3Vyc29yXHJcblxyXG4gIHdoaWxlIChpLS0pIHtcclxuICAgIGlmICghdmlzaXRlZFtpXSkgdmlzaXQobm9kZXNbaV0sIGksIFtdKVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHNvcnRlZFxyXG5cclxuICBmdW5jdGlvbiB2aXNpdChub2RlLCBpLCBwcmVkZWNlc3NvcnMpIHtcclxuICAgIGlmKHByZWRlY2Vzc29ycy5pbmRleE9mKG5vZGUpID49IDApIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDeWNsaWMgZGVwZW5kZW5jeTogJytKU09OLnN0cmluZ2lmeShub2RlKSlcclxuICAgIH1cclxuXHJcbiAgICBpZiAodmlzaXRlZFtpXSkgcmV0dXJuO1xyXG4gICAgdmlzaXRlZFtpXSA9IHRydWVcclxuXHJcbiAgICAvLyBvdXRnb2luZyBlZGdlc1xyXG4gICAgdmFyIG91dGdvaW5nID0gZWRnZXMuZmlsdGVyKGZ1bmN0aW9uKGVkZ2Upe1xyXG4gICAgICByZXR1cm4gZWRnZVswXSA9PT0gbm9kZVxyXG4gICAgfSlcclxuICAgIGlmIChpID0gb3V0Z29pbmcubGVuZ3RoKSB7XHJcbiAgICAgIHZhciBwcmVkcyA9IHByZWRlY2Vzc29ycy5jb25jYXQobm9kZSlcclxuICAgICAgZG8ge1xyXG4gICAgICAgIHZhciBjaGlsZCA9IG91dGdvaW5nWy0taV1bMV1cclxuICAgICAgICB2aXNpdChjaGlsZCwgbm9kZXMuaW5kZXhPZihjaGlsZCksIHByZWRzKVxyXG4gICAgICB9IHdoaWxlIChpKVxyXG4gICAgfVxyXG5cclxuICAgIHNvcnRlZFstLWN1cnNvcl0gPSBub2RlXHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiB1bmlxdWVOb2RlcyhhcnIpe1xyXG4gIHZhciByZXMgPSBbXVxyXG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBhcnIubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuICAgIHZhciBlZGdlID0gYXJyW2ldXHJcbiAgICBpZiAocmVzLmluZGV4T2YoZWRnZVswXSkgPCAwKSByZXMucHVzaChlZGdlWzBdKVxyXG4gICAgaWYgKHJlcy5pbmRleE9mKGVkZ2VbMV0pIDwgMCkgcmVzLnB1c2goZWRnZVsxXSlcclxuICB9XHJcbiAgcmV0dXJuIHJlc1xyXG59XHJcbiIsIlxudmFyIHJuZztcblxuaWYgKGdsb2JhbC5jcnlwdG8gJiYgY3J5cHRvLmdldFJhbmRvbVZhbHVlcykge1xuICAvLyBXSEFUV0cgY3J5cHRvLWJhc2VkIFJORyAtIGh0dHA6Ly93aWtpLndoYXR3Zy5vcmcvd2lraS9DcnlwdG9cbiAgLy8gTW9kZXJhdGVseSBmYXN0LCBoaWdoIHF1YWxpdHlcbiAgdmFyIF9ybmRzOCA9IG5ldyBVaW50OEFycmF5KDE2KTtcbiAgcm5nID0gZnVuY3Rpb24gd2hhdHdnUk5HKCkge1xuICAgIGNyeXB0by5nZXRSYW5kb21WYWx1ZXMoX3JuZHM4KTtcbiAgICByZXR1cm4gX3JuZHM4O1xuICB9O1xufVxuXG5pZiAoIXJuZykge1xuICAvLyBNYXRoLnJhbmRvbSgpLWJhc2VkIChSTkcpXG4gIC8vXG4gIC8vIElmIGFsbCBlbHNlIGZhaWxzLCB1c2UgTWF0aC5yYW5kb20oKS4gIEl0J3MgZmFzdCwgYnV0IGlzIG9mIHVuc3BlY2lmaWVkXG4gIC8vIHF1YWxpdHkuXG4gIHZhciAgX3JuZHMgPSBuZXcgQXJyYXkoMTYpO1xuICBybmcgPSBmdW5jdGlvbigpIHtcbiAgICBmb3IgKHZhciBpID0gMCwgcjsgaSA8IDE2OyBpKyspIHtcbiAgICAgIGlmICgoaSAmIDB4MDMpID09PSAwKSByID0gTWF0aC5yYW5kb20oKSAqIDB4MTAwMDAwMDAwO1xuICAgICAgX3JuZHNbaV0gPSByID4+PiAoKGkgJiAweDAzKSA8PCAzKSAmIDB4ZmY7XG4gICAgfVxuXG4gICAgcmV0dXJuIF9ybmRzO1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHJuZztcblxuIiwiLy8gICAgIHV1aWQuanNcbi8vXG4vLyAgICAgQ29weXJpZ2h0IChjKSAyMDEwLTIwMTIgUm9iZXJ0IEtpZWZmZXJcbi8vICAgICBNSVQgTGljZW5zZSAtIGh0dHA6Ly9vcGVuc291cmNlLm9yZy9saWNlbnNlcy9taXQtbGljZW5zZS5waHBcblxuLy8gVW5pcXVlIElEIGNyZWF0aW9uIHJlcXVpcmVzIGEgaGlnaCBxdWFsaXR5IHJhbmRvbSAjIGdlbmVyYXRvci4gIFdlIGZlYXR1cmVcbi8vIGRldGVjdCB0byBkZXRlcm1pbmUgdGhlIGJlc3QgUk5HIHNvdXJjZSwgbm9ybWFsaXppbmcgdG8gYSBmdW5jdGlvbiB0aGF0XG4vLyByZXR1cm5zIDEyOC1iaXRzIG9mIHJhbmRvbW5lc3MsIHNpbmNlIHRoYXQncyB3aGF0J3MgdXN1YWxseSByZXF1aXJlZFxudmFyIF9ybmcgPSByZXF1aXJlKCcuL3JuZycpO1xuXG4vLyBNYXBzIGZvciBudW1iZXIgPC0+IGhleCBzdHJpbmcgY29udmVyc2lvblxudmFyIF9ieXRlVG9IZXggPSBbXTtcbnZhciBfaGV4VG9CeXRlID0ge307XG5mb3IgKHZhciBpID0gMDsgaSA8IDI1NjsgaSsrKSB7XG4gIF9ieXRlVG9IZXhbaV0gPSAoaSArIDB4MTAwKS50b1N0cmluZygxNikuc3Vic3RyKDEpO1xuICBfaGV4VG9CeXRlW19ieXRlVG9IZXhbaV1dID0gaTtcbn1cblxuLy8gKipgcGFyc2UoKWAgLSBQYXJzZSBhIFVVSUQgaW50byBpdCdzIGNvbXBvbmVudCBieXRlcyoqXG5mdW5jdGlvbiBwYXJzZShzLCBidWYsIG9mZnNldCkge1xuICB2YXIgaSA9IChidWYgJiYgb2Zmc2V0KSB8fCAwLCBpaSA9IDA7XG5cbiAgYnVmID0gYnVmIHx8IFtdO1xuICBzLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvWzAtOWEtZl17Mn0vZywgZnVuY3Rpb24ob2N0KSB7XG4gICAgaWYgKGlpIDwgMTYpIHsgLy8gRG9uJ3Qgb3ZlcmZsb3chXG4gICAgICBidWZbaSArIGlpKytdID0gX2hleFRvQnl0ZVtvY3RdO1xuICAgIH1cbiAgfSk7XG5cbiAgLy8gWmVybyBvdXQgcmVtYWluaW5nIGJ5dGVzIGlmIHN0cmluZyB3YXMgc2hvcnRcbiAgd2hpbGUgKGlpIDwgMTYpIHtcbiAgICBidWZbaSArIGlpKytdID0gMDtcbiAgfVxuXG4gIHJldHVybiBidWY7XG59XG5cbi8vICoqYHVucGFyc2UoKWAgLSBDb252ZXJ0IFVVSUQgYnl0ZSBhcnJheSAoYWxhIHBhcnNlKCkpIGludG8gYSBzdHJpbmcqKlxuZnVuY3Rpb24gdW5wYXJzZShidWYsIG9mZnNldCkge1xuICB2YXIgaSA9IG9mZnNldCB8fCAwLCBidGggPSBfYnl0ZVRvSGV4O1xuICByZXR1cm4gIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dICtcbiAgICAgICAgICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXSArICctJyArXG4gICAgICAgICAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV0gKyAnLScgK1xuICAgICAgICAgIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dICsgJy0nICtcbiAgICAgICAgICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXSArICctJyArXG4gICAgICAgICAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV0gK1xuICAgICAgICAgIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dICtcbiAgICAgICAgICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXTtcbn1cblxuLy8gKipgdjEoKWAgLSBHZW5lcmF0ZSB0aW1lLWJhc2VkIFVVSUQqKlxuLy9cbi8vIEluc3BpcmVkIGJ5IGh0dHBzOi8vZ2l0aHViLmNvbS9MaW9zSy9VVUlELmpzXG4vLyBhbmQgaHR0cDovL2RvY3MucHl0aG9uLm9yZy9saWJyYXJ5L3V1aWQuaHRtbFxuXG4vLyByYW5kb20gIydzIHdlIG5lZWQgdG8gaW5pdCBub2RlIGFuZCBjbG9ja3NlcVxudmFyIF9zZWVkQnl0ZXMgPSBfcm5nKCk7XG5cbi8vIFBlciA0LjUsIGNyZWF0ZSBhbmQgNDgtYml0IG5vZGUgaWQsICg0NyByYW5kb20gYml0cyArIG11bHRpY2FzdCBiaXQgPSAxKVxudmFyIF9ub2RlSWQgPSBbXG4gIF9zZWVkQnl0ZXNbMF0gfCAweDAxLFxuICBfc2VlZEJ5dGVzWzFdLCBfc2VlZEJ5dGVzWzJdLCBfc2VlZEJ5dGVzWzNdLCBfc2VlZEJ5dGVzWzRdLCBfc2VlZEJ5dGVzWzVdXG5dO1xuXG4vLyBQZXIgNC4yLjIsIHJhbmRvbWl6ZSAoMTQgYml0KSBjbG9ja3NlcVxudmFyIF9jbG9ja3NlcSA9IChfc2VlZEJ5dGVzWzZdIDw8IDggfCBfc2VlZEJ5dGVzWzddKSAmIDB4M2ZmZjtcblxuLy8gUHJldmlvdXMgdXVpZCBjcmVhdGlvbiB0aW1lXG52YXIgX2xhc3RNU2VjcyA9IDAsIF9sYXN0TlNlY3MgPSAwO1xuXG4vLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2Jyb29mYS9ub2RlLXV1aWQgZm9yIEFQSSBkZXRhaWxzXG5mdW5jdGlvbiB2MShvcHRpb25zLCBidWYsIG9mZnNldCkge1xuICB2YXIgaSA9IGJ1ZiAmJiBvZmZzZXQgfHwgMDtcbiAgdmFyIGIgPSBidWYgfHwgW107XG5cbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgdmFyIGNsb2Nrc2VxID0gb3B0aW9ucy5jbG9ja3NlcSAhPT0gdW5kZWZpbmVkID8gb3B0aW9ucy5jbG9ja3NlcSA6IF9jbG9ja3NlcTtcblxuICAvLyBVVUlEIHRpbWVzdGFtcHMgYXJlIDEwMCBuYW5vLXNlY29uZCB1bml0cyBzaW5jZSB0aGUgR3JlZ29yaWFuIGVwb2NoLFxuICAvLyAoMTU4Mi0xMC0xNSAwMDowMCkuICBKU051bWJlcnMgYXJlbid0IHByZWNpc2UgZW5vdWdoIGZvciB0aGlzLCBzb1xuICAvLyB0aW1lIGlzIGhhbmRsZWQgaW50ZXJuYWxseSBhcyAnbXNlY3MnIChpbnRlZ2VyIG1pbGxpc2Vjb25kcykgYW5kICduc2VjcydcbiAgLy8gKDEwMC1uYW5vc2Vjb25kcyBvZmZzZXQgZnJvbSBtc2Vjcykgc2luY2UgdW5peCBlcG9jaCwgMTk3MC0wMS0wMSAwMDowMC5cbiAgdmFyIG1zZWNzID0gb3B0aW9ucy5tc2VjcyAhPT0gdW5kZWZpbmVkID8gb3B0aW9ucy5tc2VjcyA6IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXG4gIC8vIFBlciA0LjIuMS4yLCB1c2UgY291bnQgb2YgdXVpZCdzIGdlbmVyYXRlZCBkdXJpbmcgdGhlIGN1cnJlbnQgY2xvY2tcbiAgLy8gY3ljbGUgdG8gc2ltdWxhdGUgaGlnaGVyIHJlc29sdXRpb24gY2xvY2tcbiAgdmFyIG5zZWNzID0gb3B0aW9ucy5uc2VjcyAhPT0gdW5kZWZpbmVkID8gb3B0aW9ucy5uc2VjcyA6IF9sYXN0TlNlY3MgKyAxO1xuXG4gIC8vIFRpbWUgc2luY2UgbGFzdCB1dWlkIGNyZWF0aW9uIChpbiBtc2VjcylcbiAgdmFyIGR0ID0gKG1zZWNzIC0gX2xhc3RNU2VjcykgKyAobnNlY3MgLSBfbGFzdE5TZWNzKS8xMDAwMDtcblxuICAvLyBQZXIgNC4yLjEuMiwgQnVtcCBjbG9ja3NlcSBvbiBjbG9jayByZWdyZXNzaW9uXG4gIGlmIChkdCA8IDAgJiYgb3B0aW9ucy5jbG9ja3NlcSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgY2xvY2tzZXEgPSBjbG9ja3NlcSArIDEgJiAweDNmZmY7XG4gIH1cblxuICAvLyBSZXNldCBuc2VjcyBpZiBjbG9jayByZWdyZXNzZXMgKG5ldyBjbG9ja3NlcSkgb3Igd2UndmUgbW92ZWQgb250byBhIG5ld1xuICAvLyB0aW1lIGludGVydmFsXG4gIGlmICgoZHQgPCAwIHx8IG1zZWNzID4gX2xhc3RNU2VjcykgJiYgb3B0aW9ucy5uc2VjcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgbnNlY3MgPSAwO1xuICB9XG5cbiAgLy8gUGVyIDQuMi4xLjIgVGhyb3cgZXJyb3IgaWYgdG9vIG1hbnkgdXVpZHMgYXJlIHJlcXVlc3RlZFxuICBpZiAobnNlY3MgPj0gMTAwMDApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3V1aWQudjEoKTogQ2FuXFwndCBjcmVhdGUgbW9yZSB0aGFuIDEwTSB1dWlkcy9zZWMnKTtcbiAgfVxuXG4gIF9sYXN0TVNlY3MgPSBtc2VjcztcbiAgX2xhc3ROU2VjcyA9IG5zZWNzO1xuICBfY2xvY2tzZXEgPSBjbG9ja3NlcTtcblxuICAvLyBQZXIgNC4xLjQgLSBDb252ZXJ0IGZyb20gdW5peCBlcG9jaCB0byBHcmVnb3JpYW4gZXBvY2hcbiAgbXNlY3MgKz0gMTIyMTkyOTI4MDAwMDA7XG5cbiAgLy8gYHRpbWVfbG93YFxuICB2YXIgdGwgPSAoKG1zZWNzICYgMHhmZmZmZmZmKSAqIDEwMDAwICsgbnNlY3MpICUgMHgxMDAwMDAwMDA7XG4gIGJbaSsrXSA9IHRsID4+PiAyNCAmIDB4ZmY7XG4gIGJbaSsrXSA9IHRsID4+PiAxNiAmIDB4ZmY7XG4gIGJbaSsrXSA9IHRsID4+PiA4ICYgMHhmZjtcbiAgYltpKytdID0gdGwgJiAweGZmO1xuXG4gIC8vIGB0aW1lX21pZGBcbiAgdmFyIHRtaCA9IChtc2VjcyAvIDB4MTAwMDAwMDAwICogMTAwMDApICYgMHhmZmZmZmZmO1xuICBiW2krK10gPSB0bWggPj4+IDggJiAweGZmO1xuICBiW2krK10gPSB0bWggJiAweGZmO1xuXG4gIC8vIGB0aW1lX2hpZ2hfYW5kX3ZlcnNpb25gXG4gIGJbaSsrXSA9IHRtaCA+Pj4gMjQgJiAweGYgfCAweDEwOyAvLyBpbmNsdWRlIHZlcnNpb25cbiAgYltpKytdID0gdG1oID4+PiAxNiAmIDB4ZmY7XG5cbiAgLy8gYGNsb2NrX3NlcV9oaV9hbmRfcmVzZXJ2ZWRgIChQZXIgNC4yLjIgLSBpbmNsdWRlIHZhcmlhbnQpXG4gIGJbaSsrXSA9IGNsb2Nrc2VxID4+PiA4IHwgMHg4MDtcblxuICAvLyBgY2xvY2tfc2VxX2xvd2BcbiAgYltpKytdID0gY2xvY2tzZXEgJiAweGZmO1xuXG4gIC8vIGBub2RlYFxuICB2YXIgbm9kZSA9IG9wdGlvbnMubm9kZSB8fCBfbm9kZUlkO1xuICBmb3IgKHZhciBuID0gMDsgbiA8IDY7IG4rKykge1xuICAgIGJbaSArIG5dID0gbm9kZVtuXTtcbiAgfVxuXG4gIHJldHVybiBidWYgPyBidWYgOiB1bnBhcnNlKGIpO1xufVxuXG4vLyAqKmB2NCgpYCAtIEdlbmVyYXRlIHJhbmRvbSBVVUlEKipcblxuLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9icm9vZmEvbm9kZS11dWlkIGZvciBBUEkgZGV0YWlsc1xuZnVuY3Rpb24gdjQob3B0aW9ucywgYnVmLCBvZmZzZXQpIHtcbiAgLy8gRGVwcmVjYXRlZCAtICdmb3JtYXQnIGFyZ3VtZW50LCBhcyBzdXBwb3J0ZWQgaW4gdjEuMlxuICB2YXIgaSA9IGJ1ZiAmJiBvZmZzZXQgfHwgMDtcblxuICBpZiAodHlwZW9mKG9wdGlvbnMpID09ICdzdHJpbmcnKSB7XG4gICAgYnVmID0gb3B0aW9ucyA9PSAnYmluYXJ5JyA/IG5ldyBBcnJheSgxNikgOiBudWxsO1xuICAgIG9wdGlvbnMgPSBudWxsO1xuICB9XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gIHZhciBybmRzID0gb3B0aW9ucy5yYW5kb20gfHwgKG9wdGlvbnMucm5nIHx8IF9ybmcpKCk7XG5cbiAgLy8gUGVyIDQuNCwgc2V0IGJpdHMgZm9yIHZlcnNpb24gYW5kIGBjbG9ja19zZXFfaGlfYW5kX3Jlc2VydmVkYFxuICBybmRzWzZdID0gKHJuZHNbNl0gJiAweDBmKSB8IDB4NDA7XG4gIHJuZHNbOF0gPSAocm5kc1s4XSAmIDB4M2YpIHwgMHg4MDtcblxuICAvLyBDb3B5IGJ5dGVzIHRvIGJ1ZmZlciwgaWYgcHJvdmlkZWRcbiAgaWYgKGJ1Zikge1xuICAgIGZvciAodmFyIGlpID0gMDsgaWkgPCAxNjsgaWkrKykge1xuICAgICAgYnVmW2kgKyBpaV0gPSBybmRzW2lpXTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYnVmIHx8IHVucGFyc2Uocm5kcyk7XG59XG5cbi8vIEV4cG9ydCBwdWJsaWMgQVBJXG52YXIgdXVpZCA9IHY0O1xudXVpZC52MSA9IHYxO1xudXVpZC52NCA9IHY0O1xudXVpZC5wYXJzZSA9IHBhcnNlO1xudXVpZC51bnBhcnNlID0gdW5wYXJzZTtcblxubW9kdWxlLmV4cG9ydHMgPSB1dWlkO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBbICdDTScsICdub2RlU2VydmljZScsICggQ00sIG5vZGVTZXJ2aWNlICkgPT4ge1xuXG4gICBmdW5jdGlvbiBsaW5rKCAkc2NvcGUsICRlbGVtZW50LCAkYXR0cnMgKSB7XG5cbiAgICAgIHZhciBjbSA9IENNLmNyZWF0ZSggJGVsZW1lbnRbIDAgXSwge1xuICAgICAgICAgbW9kZTogJ2phdmFzY3JpcHQnLFxuICAgICAgICAgdGhlbWU6ICdlbGVnYW50JyxcbiAgICAgICAgIGxpbmVOdW1iZXJzOiB0cnVlLFxuICAgICAgICAgbGluZVdyYXBwaW5nOiB0cnVlLFxuICAgICAgICAgdGFiU2l6ZTogM1xuICAgICAgfSApO1xuXG4gICAgICBjbS5zZXRTaXplKCAnMTAwJScsIDMwMCApO1xuICAgICAgY20ub24oICdjaGFuZ2UnLCAoKSA9PiB7XG4gICAgICAgICB2YXIgbm9kZSA9IG5vZGVTZXJ2aWNlLmdldFNlbGVjdGVkTm9kZSgpO1xuICAgICAgICAgaWYgKCBub2RlICkge1xuICAgICAgICAgICAgbm9kZS5fZm5zdHIgPSBjbS5nZXRWYWx1ZSgpO1xuICAgICAgICAgICAgY20uY2xlYXJIaXN0b3J5KCk7XG4gICAgICAgICB9XG4gICAgICB9ICk7XG5cbiAgIH1cblxuICAgcmV0dXJuIHtcblxuICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgIHJlcGxhY2U6IHRydWUsXG4gICAgICB0ZW1wbGF0ZTogJzx0ZXh0YXJlYT48L3RleHRhcmVhPicsXG4gICAgICBsaW5rXG5cbiAgIH07XG5cbn0gXTtcbiIsIm1vZHVsZS5leHBvcnRzID0gWyAoKSA9PiB7XG5cbiAgIHZhciBpbnN0YW5jZSA9IG51bGw7XG5cbiAgIGZ1bmN0aW9uIGdldEluc3RhbmNlKCkge1xuICAgICAgcmV0dXJuIGluc3RhbmNlO1xuICAgfVxuXG4gICBmdW5jdGlvbiBjcmVhdGUoIHRleHRhcmVhLCBvcHRzICkge1xuICAgICAgaW5zdGFuY2UgPSBDb2RlTWlycm9yLmZyb21UZXh0QXJlYSggdGV4dGFyZWEsIG9wdHMgKTtcbiAgICAgIHJldHVybiBpbnN0YW5jZTtcbiAgIH1cblxuICAgcmV0dXJuIHtcbiAgICAgIGdldEluc3RhbmNlLFxuICAgICAgY3JlYXRlXG4gICB9O1xuXG59IF07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFsgKCkgPT4ge1xuXG4gICByZXR1cm4gaW5wdXQgPT4ge1xuICAgICAgcmV0dXJuIENKU09OLnN0cmluZ2lmeSggaW5wdXQsIG51bGwsIDIgKTtcbiAgIH07XG5cbn0gXTtcbiIsIm1vZHVsZS5leHBvcnRzID0gWyBmdW5jdGlvbiAoKSB7XG5cbiAgIHZhciBkZWJ1Z0VuYWJsZWQgPSBmYWxzZTtcbiAgIHZhciBkZWJ1Z05hbWVzcGFjZXMgPSBbXTtcblxuICAgdGhpcy5lbmFibGVEZWJ1ZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGRlYnVnRW5hYmxlZCA9IHRydWU7XG4gICB9O1xuXG4gICB0aGlzLmVuYWJsZURlYnVnTmFtZXNwYWNlID0gZnVuY3Rpb24gKCkge1xuICAgICAgZm9yICggbGV0IGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSArKyApIHtcbiAgICAgICAgIGRlYnVnTmFtZXNwYWNlcy5wdXNoKCBhcmd1bWVudHNbIGkgXSApO1xuICAgICAgfVxuICAgfTtcblxuICAgdGhpcy4kZ2V0ID0gKCkgPT4ge1xuXG4gICAgICBmdW5jdGlvbiBkZWJ1ZygpIHtcbiAgICAgICAgIGlmICggIWRlYnVnRW5hYmxlZCApIHJldHVybjtcbiAgICAgICAgIGlmICggZGVidWdOYW1lc3BhY2VzLmluZGV4T2YoIGFyZ3VtZW50c1sgMCBdICkgIT09IC0xICkge1xuICAgICAgICAgICAgY29uc29sZS5sb2cuYXBwbHkoIGNvbnNvbGUsIGFyZ3VtZW50cyApO1xuICAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4ge1xuICAgICAgICAgZGVidWdcbiAgICAgIH07XG5cbiAgIH07XG5cbn0gXTtcbiIsIm1vZHVsZS5leHBvcnRzID0gWyAnQ1RYTScsICckcm9vdFNjb3BlJywgKCBDVFhNLCAkcm9vdFNjb3BlICkgPT4ge1xuXG4gICBmdW5jdGlvbiBjb250cm9sbGVyKCAkc2NvcGUsICRlbGVtZW50LCAkYXR0cnMgKSB7XG5cbiAgICAgIHZhciBoYW5kbGVyID0gJCggJGF0dHJzLmhhbmRsZXIgKTtcblxuICAgICAgJCggJyNub2RlQ2FudmFzJyApLm9uKCAnY29udGV4dG1lbnUnLCBlID0+IHtcbiAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIH0gKTtcbiAgICAgICQoICdib2R5JyApLm9uKCAnbW91c2Vkb3duJywgZSA9PiB7XG4gICAgICAgICBjbG9zZSgpO1xuICAgICAgfSApO1xuXG4gICAgICAkZWxlbWVudC5vbiggJ21vdXNlZG93bicsIGUgPT4ge1xuICAgICAgICAgLy8gc3RvcCBidWJibGluZyB1cCB0byBib2R5IHNvIGl0IGRvZXNudCBjbG9zdCBiZWZvcmUgbmcgY2xpY2tcbiAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICB9IClcbiAgICAgIC5vbiggJ2NsaWNrJywgZSA9PiB7XG4gICAgICAgICBjbG9zZSgpO1xuICAgICAgfSApXG4gICAgICAub24oICdjb250ZXh0bWVudScsIGUgPT4gZS5wcmV2ZW50RGVmYXVsdCgpICk7XG5cbiAgICAgIC8qIGV4YW1wbGVcbiAgICAgICRzY29wZS5tZW51ID0gW1xuICAgICAgICAgeyBuYW1lOiAnQWRkIElucHV0JywgZm46ICgpID0+IGNvbnNvbGUubG9nKCAnQWRkIElucHV0JyApIH0sXG4gICAgICBdO1xuICAgICAgKi9cblxuICAgICAgJHJvb3RTY29wZS4kb24oICdtZW51Lm9wZW4nLCAoIGJyb2FkQ2FzdEV2ZW50LCBkYXRhICkgPT4ge1xuICAgICAgICAgb3BlbiggZGF0YS5ldmVudCwgZGF0YS5tZW51ICk7XG4gICAgICB9ICk7XG5cbiAgICAgIGZ1bmN0aW9uIG9wZW4oIGUsIG1lbnUgKSB7XG4gICAgICAgICAkc2NvcGUubWVudSA9IG1lbnU7XG4gICAgICAgICAkZWxlbWVudC5jc3MoIHsgdG9wOiBlLmNsaWVudFksIGxlZnQ6IGUuY2xpZW50WCB9ICk7XG4gICAgICAgICAkc2NvcGUuYWN0aXZlID0gdHJ1ZTtcbiAgICAgICAgICRzY29wZS4kZGlnZXN0KCk7XG4gICAgICB9XG4gICAgICBmdW5jdGlvbiBjbG9zZSAoKSB7XG4gICAgICAgICBpZiAoICEkc2NvcGUuYWN0aXZlICkgcmV0dXJuO1xuICAgICAgICAgJHNjb3BlLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICAgJHNjb3BlLiRkaWdlc3QoKTtcbiAgICAgIH1cblxuICAgfVxuXG4gICByZXR1cm4ge1xuXG4gICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgcmVwbGFjZTogdHJ1ZSxcbiAgICAgIHNjb3BlOiB7fSxcbiAgICAgIHRlbXBsYXRlVXJsOiAnLi9zcmMvY29udGV4dE1lbnUuaHRtbCcsXG4gICAgICBjb250cm9sbGVyXG5cbiAgIH07XG5cbn0gXTtcbiIsIm1vZHVsZS5leHBvcnRzICA9IFsgJyRyb290U2NvcGUnLCAoICRyb290U2NvcGUgKSA9PiB7XG5cbiAgIHJldHVybiB7XG5cblxuICAgfTtcblxufSBdO1xuIiwiZ2xvYmFsLlVVSUQgICAgID0gcmVxdWlyZSggJ3V1aWQnICk7XG5nbG9iYWwuVE9QT1NPUlQgPSByZXF1aXJlKCAndG9wb3NvcnQnICk7XG5nbG9iYWwuQ0pTT04gPSByZXF1aXJlKCAnY2lyY3VsYXItanNvbicgKTtcblxuYW5ndWxhci5tb2R1bGUoICdub2RlQXBwJywgW1xuXHQnY29tbW9uJyxcblx0J3h4Jyxcblx0J2NvZGVNaXJyb3InLFxuXHQnY29udGV4dE1lbnUnXG5dICkuY29uZmlnKCBbICdsb2dQcm92aWRlcicsICggbG9nUHJvdmlkZXIgKSA9PiB7XG5cdGxvZ1Byb3ZpZGVyLmVuYWJsZURlYnVnKCk7XG5cdC8vIGxvZ1Byb3ZpZGVyLmVuYWJsZURlYnVnTmFtZXNwYWNlKCAnU2NvcGUnICk7XG59IF0gKTtcblxuYW5ndWxhci5tb2R1bGUoICd4eCcsIFtdIClcblx0LmZhY3RvcnkoICdub2RlU2VydmljZScgICAgLCByZXF1aXJlKCAnLi94eC9zZXJ2aWNlcy94eFNlcnZpY2UnICkgKVxuXHQuZmFjdG9yeSggJ25vZGVGYWN0b3J5JyAgICAsIHJlcXVpcmUoICcuL3h4L3NlcnZpY2VzL3h4RmFjdG9yeScgKSApXG5cdC5mYWN0b3J5KCAnbm9kZUV2ZW50JyAgICAgICwgcmVxdWlyZSggJy4veHgvc2VydmljZXMveHhFdmVudCcgKSApXG5cdC5zZXJ2aWNlKCAndXBkYXRlTGlua0V2ZW50JywgcmVxdWlyZSggJy4veHgvc2VydmljZXMvZXZlbnRzL3VwZGF0ZUxpbmtFdmVudCcgKSApXG5cdC5jb250cm9sbGVyKCAneHhDdHJsJyAgICAgICwgcmVxdWlyZSggJy4veHgvY29udHJvbGxlcnMveHguY3RybCcgKSApXG5cdC5kaXJlY3RpdmUoICd4eEJvZHknICAgICAgICwgcmVxdWlyZSggJy4veHgvZGlyZWN0aXZlcy94eEJvZHkuZGlyJyApIClcblx0LmRpcmVjdGl2ZSggJ3h4SW50ZXJmYWNlJyAgLCByZXF1aXJlKCAnLi94eC9kaXJlY3RpdmVzL3h4SW50ZXJmYWNlLmRpcicgKSApXG5cdC5kaXJlY3RpdmUoICd4eExhYmVsJyAgICAgICwgcmVxdWlyZSggJy4veHgvZGlyZWN0aXZlcy94eExhYmVsLmRpcicgKSApXG5cdC5kaXJlY3RpdmUoICd4eENvbm5lY3RvcicgICwgcmVxdWlyZSggJy4veHgvZGlyZWN0aXZlcy94eENvbm5lY3Rvci5kaXInICkgKVxuXHQuZGlyZWN0aXZlKCAneHhMaW5rJyAgICAgICAsIHJlcXVpcmUoICcuL3h4L2RpcmVjdGl2ZXMveHhMaW5rLmRpcicgKSApXG5cdC5kaXJlY3RpdmUoICd4eFRlbXBMaW5rJyAgICwgcmVxdWlyZSggJy4veHgvZGlyZWN0aXZlcy94eFRlbXBMaW5rLmRpcicgKSApXG5cdC5kaXJlY3RpdmUoICd4eFNvcnRhYmxlJyAgICwgcmVxdWlyZSggJy4veHgvZGlyZWN0aXZlcy94eFNvcnRhYmxlLmRpcicgKSApXG5cdC5kaXJlY3RpdmUoICd4eFNvcnRJdGVtJyAgICwgcmVxdWlyZSggJy4veHgvZGlyZWN0aXZlcy94eFNvcnRJdGVtLmRpcicgKSApXG5cdC5kaXJlY3RpdmUoICd4eFNlbGVjdGFibGUnICwgcmVxdWlyZSggJy4veHgvZGlyZWN0aXZlcy94eFNlbGVjdGFibGUuZGlyJyApIClcblx0LmRpcmVjdGl2ZSggJ3N2Z0RyYWdnYWJsZScgLCByZXF1aXJlKCAnLi94eC9kaXJlY3RpdmVzL3N2Z0RyYWdnYWJsZS5kaXInICkgKVxuXHQuZGlyZWN0aXZlKCAnc3ZnWm9vbWFibGUnICAsIHJlcXVpcmUoICcuL3h4L2RpcmVjdGl2ZXMvc3ZnWm9vbWFibGUuZGlyJyApICk7XG5cbmFuZ3VsYXIubW9kdWxlKCAnY29tbW9uJywgW10gKVxuXHQuZmlsdGVyKCAnY2pzb24nLCByZXF1aXJlKCAnLi9jb21tb24vY2pzb24uZmlsdGVyJyApIClcblx0LnByb3ZpZGVyKCAnbG9nJywgcmVxdWlyZSggJy4vY29tbW9uL2xvZy5wcm92aWRlcicgKSApO1xuXG5hbmd1bGFyLm1vZHVsZSggJ2NvZGVNaXJyb3InLCBbXSApXG5cdC5mYWN0b3J5KCAnQ00nLCByZXF1aXJlKCAnLi9jb2RlTWlycm9yLnNlcnZpY2UnICkgKVxuXHQuZGlyZWN0aXZlKCAnY29kZU1pcnJvcicsIHJlcXVpcmUoICcuL2NvZGVNaXJyb3IuZGlyJyApICk7XG5cbmFuZ3VsYXIubW9kdWxlKCAnY29udGV4dE1lbnUnLCBbXSApXG5cdC5mYWN0b3J5KCAnQ1RYTScsIHJlcXVpcmUoICcuL2NvbnRleHRNZW51LnNlcnZpY2UnICkgKVxuXHQuZGlyZWN0aXZlKCAnY29udGV4dE1lbnUnLCByZXF1aXJlKCAnLi9jb250ZXh0TWVudS5kaXInICkgKTtcbiIsIlxubW9kdWxlLmV4cG9ydHMgPSBbICdsb2cnLCAnJHNjb3BlJywgJ25vZGVTZXJ2aWNlJywgKCBsb2csICRzY29wZSwgbm9kZVNlcnZpY2UgKSA9PiB7XG5cbiAgIGdsb2JhbC5TQ09QRSA9ICRzY29wZTtcbiAgICRzY29wZS5ub2RlU2VydmljZSA9IG5vZGVTZXJ2aWNlO1xuXG4gICAkc2NvcGUucnVuID0gKCkgPT4ge1xuICAgICAgbm9kZVNlcnZpY2UucnVuKCk7XG4gICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICB9O1xuXG4gICAvLyB0b2RvIGFkZCAvIHJlbW92ZSBpbnB1dCwgd2hlbiBhZGQvcmVtb3ZlIGlucHV0IHJ1biBhcHBseSB0aGlzIHNjb3BlIVxuICAgLy8gd2ViYXVkaW9cblxuICAgbG9nLmRlYnVnKCAnU2NvcGUnLCAkc2NvcGUuJGlkLCAnbm9kZUN0cmwnLCAkc2NvcGUgKTtcblxufSBdO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBbICdsb2cnLCAoIGxvZyApID0+IHtcblxuICAgZnVuY3Rpb24gY29udHJvbGxlciggJHNjb3BlLCAkZWxlbWVudCwgJGF0dHJzICkge1xuXG4gICAgICBpZiAoICEkZWxlbWVudC5hdHRyKCAndHJhbnNmb3JtJyApICkge1xuICAgICAgICAgJGVsZW1lbnQuYXR0ciggJ3RyYW5zZm9ybScsICdtYXRyaXgoMSwwLDAsMSwwLDApJyApO1xuICAgICAgfVxuXG4gICAgICB2YXIgZGlzYWJsZWQgPSBmYWxzZTtcbiAgICAgIHZhciBkcmFnZ2luZyA9IGZhbHNlO1xuICAgICAgdmFyIG1vdXNlaG9sZCA9IGZhbHNlO1xuICAgICAgdmFyIHByZXZQb3MgPSB7IHg6IG51bGwsIHk6IG51bGwgfTtcbiAgICAgIHZhciBjdXJyUG9zID0geyB4OiBudWxsLCB5OiBudWxsIH07XG5cbiAgICAgIHZhciBudW1QYXR0ZXJuID0gL1tcXGR8XFwufFxcK3wtXSsvZztcbiAgICAgIHZhciBtYXQgPSAkZWxlbWVudC5hdHRyKCAndHJhbnNmb3JtJyApO1xuICAgICAgbWF0ID0gbWF0Lm1hdGNoKCBudW1QYXR0ZXJuICkubWFwKCB2ID0+IHBhcnNlRmxvYXQoIHYgKSApO1xuXG4gICAgICAvLyB0b2RvIGlmIGF0cnMudHJhbnNmb3JtXG4gICAgICB0aGlzLnBvc2l0aW9uID0geyB4OiAwLCB5OiAwIH07XG4gICAgICB0aGlzLnBvc2l0aW9uLnggPSBtYXRbIDQgXTtcbiAgICAgIHRoaXMucG9zaXRpb24ueSA9IG1hdFsgNSBdO1xuXG4gICAgICB2YXIgaGFuZGxlciA9ICRhdHRycy5oYW5kbGVyID8gJGF0dHJzLmhhbmRsZXIgOiAkZWxlbWVudDtcblxuICAgICAgdmFyIGRyYWdFdmVudEZuID0gW107XG5cbiAgICAgICQoIGhhbmRsZXIgKVxuICAgICAgLm9uKCAnbW91c2Vkb3duJywgZSA9PiB7XG5cbiAgICAgICAgIGlmICggZGlzYWJsZWQgKSByZXR1cm47XG4gICAgICAgICBtb3VzZWhvbGQgPSB0cnVlO1xuICAgICAgICAgcHJldlBvcy54ID0gZS5wYWdlWDtcbiAgICAgICAgIHByZXZQb3MueSA9IGUucGFnZVk7XG5cbiAgICAgICAgIG1hdCA9ICRlbGVtZW50LmF0dHIoICd0cmFuc2Zvcm0nICk7XG4gICAgICAgICBtYXQgPSBtYXQubWF0Y2goIG51bVBhdHRlcm4gKS5tYXAoIHYgPT4gcGFyc2VGbG9hdCggdiApICk7XG5cbiAgICAgIH0gKTtcblxuICAgICAgJCggJ2JvZHknIClcbiAgICAgIC5vbiggJ21vdXNldXAnLCBlID0+IHtcblxuICAgICAgICAgaWYgKCBkaXNhYmxlZCApIHJldHVybjtcbiAgICAgICAgIG1vdXNlaG9sZCA9IGZhbHNlO1xuXG4gICAgICB9IClcbiAgICAgIC5vbiggJ21vdXNlbW92ZScsIGUgPT4ge1xuXG4gICAgICAgICBpZiAoIGRpc2FibGVkICkgcmV0dXJuO1xuXG4gICAgICAgICBpZiAoIG1vdXNlaG9sZCApIHtcblxuICAgICAgICAgICAgZHJhZ2dpbmcgPSB0cnVlO1xuXG4gICAgICAgICAgICBjdXJyUG9zLnggPSBlLnBhZ2VYO1xuICAgICAgICAgICAgY3VyclBvcy55ID0gZS5wYWdlWTtcblxuICAgICAgICAgICAgdmFyIGR4ID0gKCBjdXJyUG9zLnggLSBwcmV2UG9zLnggKSAvIHRoaXMuc2NhbGluZ0ZhY3RvcjtcbiAgICAgICAgICAgIHZhciBkeSA9ICggY3VyclBvcy55IC0gcHJldlBvcy55ICkgLyB0aGlzLnNjYWxpbmdGYWN0b3I7XG5cbiAgICAgICAgICAgIHZhciBuZXdYID0gbWF0WyA0IF0gKyBkeDtcbiAgICAgICAgICAgIHZhciBuZXdZID0gbWF0WyA1IF0gKyBkeTtcblxuICAgICAgICAgICAgdGhpcy5wb3NpdGlvbi54ID0gbmV3WDtcbiAgICAgICAgICAgIHRoaXMucG9zaXRpb24ueSA9IG5ld1k7XG5cbiAgICAgICAgICAgICRlbGVtZW50LmF0dHIoICd0cmFuc2Zvcm0nLCBgbWF0cml4KCR7bWF0WzBdfSwke21hdFsxXX0sJHttYXRbMl19LCR7bWF0WzNdfSwke25ld1h9LCR7bmV3WX0pYCApO1xuXG4gICAgICAgICAgICBpZiAoIGRyYWdFdmVudEZuLmxlbmd0aCApIHtcbiAgICAgICAgICAgICAgIGRyYWdFdmVudEZuLmZvckVhY2goIGZuID0+IGZuKCkgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgfVxuXG4gICAgICB9ICk7XG5cbiAgICAgIHRoaXMuc2NhbGluZ0ZhY3RvciA9IDEuMDtcbiAgICAgIHRoaXMuZGlzYWJsZURyYWcgPSAoKSA9PiBkaXNhYmxlZCA9IHRydWU7XG4gICAgICB0aGlzLmVuYWJsZURyYWcgPSAoKSA9PiBkaXNhYmxlZCA9IGZhbHNlO1xuICAgICAgdGhpcy5hZGREcmFnRXZlbnQgPSBmbiA9PiB7XG4gICAgICAgICBkcmFnRXZlbnRGbi5wdXNoKCBmbiApO1xuICAgICAgfTtcblxuICAgICAgdGhpcy5nZXRQb3NpdGlvbiA9ICgpID0+IHtcbiAgICAgICAgIG1hdCA9ICRlbGVtZW50LmF0dHIoICd0cmFuc2Zvcm0nICk7XG4gICAgICAgICBtYXQgPSBtYXQubWF0Y2goIG51bVBhdHRlcm4gKS5tYXAoIHYgPT4gcGFyc2VGbG9hdCggdiApICk7XG4gICAgICAgICByZXR1cm4geyB4OiBtYXRbIDQgXSwgeTogbWF0WyA1IF0gfTtcbiAgICAgIH07XG5cbiAgICAgIGxvZy5kZWJ1ZyggJ1Njb3BlJywgJHNjb3BlLiRpZCwgJ1Bhbm5hYmxlJywgJHNjb3BlICk7XG5cbiAgIH1cblxuICAgcmV0dXJuIHtcblxuICAgICAgcmVzdHJpY3Q6ICdBJyxcbiAgICAgIGNvbnRyb2xsZXJcblxuICAgfTtcblxufSBdO1xuIiwiLy8ganNoaW50IC1XMDE0XG5tb2R1bGUuZXhwb3J0cyA9IFsgJ2xvZycsICggbG9nICkgPT4ge1xuXG4gICBmdW5jdGlvbiBjb250cm9sbGVyKCAkc2NvcGUsICRlbGVtZW50LCAkYXR0cnMgKSB7XG5cbiAgICAgIHRoaXMuc2NhbGluZ0ZhY3RvciA9IDIuMDtcblxuICAgICAgaWYgKCAhJGVsZW1lbnQuYXR0ciggJ3RyYW5zZm9ybScgKSApIHtcbiAgICAgICAgICRlbGVtZW50LmF0dHIoICd0cmFuc2Zvcm0nLCAnbWF0cml4KDEsMCwwLDEsMCwwKScgKTtcbiAgICAgICAgIHRoaXMuc2NhbGluZ0ZhY3RvciA9IDEuMDtcbiAgICAgIH1cblxuICAgICAgdmFyIG51bVBhdHRlcm4gPSAvW1xcZHxcXC58XFwrfC1dKy9nO1xuICAgICAgdmFyIGhhbmRsZXIgPSAkKCAkYXR0cnMuaGFuZGxlciApO1xuICAgICAgaGFuZGxlci5vbiggJ21vdXNld2hlZWwnLCBlID0+IHtcblxuICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgdmFyIG1hdCA9ICRlbGVtZW50LmF0dHIoICd0cmFuc2Zvcm0nICkubWF0Y2goIG51bVBhdHRlcm4gKS5tYXAoIHYgPT4gcGFyc2VGbG9hdCggdiApICk7XG4gICAgICAgICB2YXIgZ2FpbiA9IDIuMFxuICAgICAgICAgLCBtaW56ID0gMC4yNVxuICAgICAgICAgLCBtYXh6ID0gMTAuMFxuICAgICAgICAgLCBkZCA9IGdhaW4gKiBNYXRoLnNpZ24oIGUub3JpZ2luYWxFdmVudCA/IGUub3JpZ2luYWxFdmVudC53aGVlbERlbHRhWSA6IDAuMCApICogMC4xXG5cbiAgICAgICAgICwgc3MgPSBtYXRbIDAgXSArICggbWF0WyAwIF0gKiBkZCApXG4gICAgICAgICAsIHNkID0gc3MgLyBtYXRbIDAgXVxuICAgICAgICAgLCBveCA9IGUucGFnZVggLSBoYW5kbGVyLm9mZnNldCgpLmxlZnRcbiAgICAgICAgICwgb3kgPSBlLnBhZ2VZIC0gaGFuZGxlci5vZmZzZXQoKS50b3BcbiAgICAgICAgICwgY3ggPSBtYXRbIDQgXVxuICAgICAgICAgLCBjeSA9IG1hdFsgNSBdXG4gICAgICAgICAsIHh4ID0gc2QgKiAoIGN4IC0gb3ggKSArIG94XG4gICAgICAgICAsIHl5ID0gc2QgKiAoIGN5IC0gb3kgKSArIG95XG4gICAgICAgICA7XG5cbiAgICAgICAgIGlmICggc3MgPCBtaW56IHx8IHNzID4gbWF4eiApIHJldHVybjtcblxuICAgICAgICAgJGVsZW1lbnQuYXR0ciggJ3RyYW5zZm9ybScsIGBtYXRyaXgoJHtzc30sJHttYXRbMV19LCR7bWF0WzJdfSwke3NzfSwke3h4fSwke3l5fSlgICk7XG5cbiAgICAgICAgICRzY29wZS4kYnJvYWRjYXN0KCAnem9vbWVkJywgc3MsIHh4LCB5eSApO1xuICAgICAgICAgdGhpcy5zY2FsaW5nRmFjdG9yID0gc3M7XG5cbiAgICAgIH0gKTtcblxuICAgICAgbG9nLmRlYnVnKCAnU2NvcGUnLCAkc2NvcGUuJGlkLCAnWm9vbWFibGUnLCAkc2NvcGUgKTtcblxuICAgfVxuXG4gICByZXR1cm4ge1xuXG4gICAgICByZXN0cmljdDogJ0EnLFxuICAgICAgY29udHJvbGxlclxuXG4gICB9O1xuXG59IF07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFsgJ2xvZycsICd1cGRhdGVMaW5rRXZlbnQnLCAoIGxvZywgdXBkYXRlTGlua0V2ZW50ICkgPT4ge1xuXG4gICBmdW5jdGlvbiBsaW5rKCAkc2NvcGUsICRlbGVtZW50LCAkYXR0cnMsICRjb250cm9sbGVycyApIHtcblxuICAgICAgdmFyIHN2Z0RyYWdnYWJsZUN0cmwgPSAkY29udHJvbGxlcnNbIDAgXTtcbiAgICAgIHZhciBzdmdab29tYWJsZUN0cmwgPSAkY29udHJvbGxlcnNbIDEgXTtcblxuICAgICAgc3ZnRHJhZ2dhYmxlQ3RybC5hZGREcmFnRXZlbnQoICgpID0+IHtcblxuICAgICAgICAgJHNjb3BlLiRicm9hZGNhc3QoICdjb25uZWN0aW9uTmVlZHNVcGRhdGUnICk7XG4gICAgICAgICB1cGRhdGVMaW5rRXZlbnQuYnJvYWRjYXN0KCk7XG5cbiAgICAgIH0gKTtcblxuICAgICAgJHNjb3BlLiRvbiggJ3pvb21lZCcsICggZSwgdiApID0+IHtcbiAgICAgICAgIHN2Z0RyYWdnYWJsZUN0cmwuc2NhbGluZ0ZhY3RvciA9IHY7XG4gICAgICB9ICk7XG5cbiAgICAgIHN2Z0RyYWdnYWJsZUN0cmwuc2NhbGluZ0ZhY3RvciA9IHN2Z1pvb21hYmxlQ3RybC5zY2FsaW5nRmFjdG9yO1xuXG4gICAgICBsb2cuZGVidWcoICdTY29wZScsICRzY29wZS4kaWQsICdOb2RlJywgJHNjb3BlICk7XG5cbiAgIH1cblxuICAgZnVuY3Rpb24gY29udHJvbGxlciggJHNjb3BlLCAkZWxlbWVudCwgJGF0dHJzICkge1xuXG4gICAgICB2YXIgYm9keSA9IHRoaXM7XG5cbiAgICAgICRzY29wZS5oZWFkZXJIZWlnaHQgPSAxMDtcbiAgICAgICRzY29wZS53aWR0aCA9IDA7XG4gICAgICAkc2NvcGUuaGVpZ2h0ID0gMDtcbiAgICAgICRzY29wZS5yb3dIZWlnaHQgPSAxMDtcbiAgICAgICRzY29wZS5jb25uV2lkdGggPSAzLjU7XG4gICAgICAkc2NvcGUuY29ubkhlaWdodCA9IDQ7XG4gICAgICAkc2NvcGUuY29ubldpZHRoT2Zmc2V0ID0gLTAuNTtcbiAgICAgICRzY29wZS5jb25uSGVpZ2h0T2Zmc2V0ID0gMztcbiAgICAgICRzY29wZS5sYWJlbFNwYWNpbmcgPSAyO1xuXG4gICAgICAkc2NvcGUubnVtSW5wdXQgPSAkc2NvcGUubm9kZU9iamVjdC5pbnB1dC5sZW5ndGg7XG4gICAgICAkc2NvcGUubnVtT3V0cHV0ID0gJHNjb3BlLm5vZGVPYmplY3Qub3V0cHV0Lmxlbmd0aDtcblxuICAgICAgdGhpcy5nZXRIZWFkZXJIZWlnaHQgICAgID0gKCkgPT4geyByZXR1cm4gJHNjb3BlLmhlYWRlckhlaWdodDsgfTtcbiAgICAgIHRoaXMuZ2V0V2lkdGggICAgICAgICAgICA9ICgpID0+IHsgcmV0dXJuICRzY29wZS53aWR0aDsgfTtcbiAgICAgIHRoaXMuZ2V0Um93SGVpZ2h0ICAgICAgICA9ICgpID0+IHsgcmV0dXJuICRzY29wZS5yb3dIZWlnaHQ7IH07XG4gICAgICB0aGlzLmdldENvbm5XaWR0aCAgICAgICAgPSAoKSA9PiB7IHJldHVybiAkc2NvcGUuY29ubldpZHRoOyB9O1xuICAgICAgdGhpcy5nZXRDb25uSGVpZ2h0ICAgICAgID0gKCkgPT4geyByZXR1cm4gJHNjb3BlLmNvbm5IZWlnaHQ7IH07XG4gICAgICB0aGlzLmdldENvbm5IZWlnaHRPZmZzZXQgPSAoKSA9PiB7IHJldHVybiAkc2NvcGUuY29ubkhlaWdodE9mZnNldDsgfTtcblxuICAgICAgdmFyIGNvbXB1dGVkSGVhZGVyV2lkdGggPSAwO1xuICAgICAgdmFyIG1heENvbXB1dGVkSW5wdXRXaWR0aCA9IDA7XG4gICAgICB2YXIgbWF4Q29tcHV0ZWRPdXRwdXRXaWR0aCA9IDA7XG4gICAgICBmdW5jdGlvbiByZXF1ZXN0TGFiZWxXaWR0aCggdHlwZSwgdiApIHtcbiAgICAgICAgIGlmICggdHlwZSA9PT0gJ2hlYWRlcicgKSBjb21wdXRlZEhlYWRlcldpZHRoID0gdjtcbiAgICAgICAgIGVsc2UgaWYgKCB0eXBlID09PSAnaW5wdXQnICYmIHYgPiBtYXhDb21wdXRlZElucHV0V2lkdGggKSBtYXhDb21wdXRlZElucHV0V2lkdGggPSB2O1xuICAgICAgICAgZWxzZSBpZiAoIHR5cGUgPT09ICdvdXRwdXQnICYmIHYgPiBtYXhDb21wdXRlZE91dHB1dFdpZHRoICkgbWF4Q29tcHV0ZWRPdXRwdXRXaWR0aCA9IHY7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIGNvbXB1dGVXaWR0aCgpIHtcbiAgICAgICAgIHZhciBtYXhCb2R5V2lkdGggPSA1ICsgbWF4Q29tcHV0ZWRJbnB1dFdpZHRoICsgbWF4Q29tcHV0ZWRPdXRwdXRXaWR0aCArICggJHNjb3BlLmNvbm5XaWR0aCArICRzY29wZS5sYWJlbFNwYWNpbmcgKSAqIDIuMDtcbiAgICAgICAgIHZhciBoZWFkZXJXaWR0aCA9IGNvbXB1dGVkSGVhZGVyV2lkdGggKyAxNTtcbiAgICAgICAgICRzY29wZS53aWR0aCA9IE1hdGgubWF4KCBoZWFkZXJXaWR0aCwgbWF4Qm9keVdpZHRoICk7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIGNvbXB1dGVIZWlnaHQoKSB7XG4gICAgICAgICB2YXIgbWF4Q29ubiA9IE1hdGgubWF4KCAkc2NvcGUubm9kZU9iamVjdC5pbnB1dC5sZW5ndGgsICRzY29wZS5ub2RlT2JqZWN0Lm91dHB1dC5sZW5ndGggKTtcbiAgICAgICAgICRzY29wZS5oZWlnaHQgPSAkc2NvcGUuaGVhZGVySGVpZ2h0ICsgKCBtYXhDb25uICogJHNjb3BlLnJvd0hlaWdodCApO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiB1cGRhdGVVSSgpIHtcbiAgICAgICAgICRzY29wZS5udW1JbnB1dCA9ICRzY29wZS5ub2RlT2JqZWN0LmlucHV0Lmxlbmd0aDtcbiAgICAgICAgICRzY29wZS5udW1PdXRwdXQgPSAkc2NvcGUubm9kZU9iamVjdC5vdXRwdXQubGVuZ3RoO1xuXG4gICAgICAgICBjb21wdXRlZEhlYWRlcldpZHRoID0gMDtcbiAgICAgICAgIG1heENvbXB1dGVkSW5wdXRXaWR0aCA9IDA7XG4gICAgICAgICBtYXhDb21wdXRlZE91dHB1dFdpZHRoID0gMDtcbiAgICAgICAgICRzY29wZS4kYnJvYWRjYXN0KCAncmVxdWVzdExhYmVsV2lkdGgnLCByZXF1ZXN0TGFiZWxXaWR0aCApO1xuICAgICAgICAgY29tcHV0ZVdpZHRoKCk7XG4gICAgICAgICBjb21wdXRlSGVpZ2h0KCk7XG4gICAgICAgICAkc2NvcGUuJGJyb2FkY2FzdCggJ2Nvbm5lY3Rpb25OZWVkc1VwZGF0ZScgKTtcbiAgICAgIH1cblxuICAgICAgJHNjb3BlLiR3YXRjaCggKCkgPT4geyByZXR1cm4gJHNjb3BlLm5vZGVPYmplY3QuX3VpLnVwZGF0ZTsgfSwgdXBkYXRlVUkgKTtcbiAgICAgIFxuICAgfVxuXG4gICByZXR1cm4ge1xuXG4gICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgcmVwbGFjZTogdHJ1ZSxcbiAgICAgIHJlcXVpcmU6IFsgJ15zdmdEcmFnZ2FibGUnLCAnXnN2Z1pvb21hYmxlJyBdLFxuICAgICAgdGVtcGxhdGVOYW1lc3BhY2U6ICdzdmcnLFxuICAgICAgdGVtcGxhdGVVcmw6ICcuL3NyYy94eC90ZW1wbGF0ZS94eEJvZHkuaHRtbCcsXG4gICAgICBsaW5rLFxuICAgICAgY29udHJvbGxlcixcbiAgICAgIGNvbnRyb2xsZXJBczogJ2JvZHknXG5cbiAgIH07XG5cbn0gXTtcbiIsIm1vZHVsZS5leHBvcnRzID0gWyAnbG9nJywgJyRyb290U2NvcGUnLCAnbm9kZVNlcnZpY2UnLCAnbm9kZUV2ZW50JywgKCBsb2csICRyb290U2NvcGUsIG5vZGVTZXJ2aWNlLCBub2RlRXZlbnQgKSA9PiB7XG5cbiAgIGZ1bmN0aW9uIGxpbmsoICRzY29wZSwgJGVsZW1lbnQsICRhdHRycywgJGNvbnRyb2xsZXJzICkge1xuXG4gICAgICB2YXIgbm9kZUN0cmwgPSAkY29udHJvbGxlcnNbIDAgXTtcbiAgICAgIHZhciBkcmFnQ3RybCA9ICRjb250cm9sbGVyc1sgMSBdO1xuICAgICAgdmFyIHNvcnRDdHJsID0gJGNvbnRyb2xsZXJzWyAyIF07XG5cbiAgICAgICRzY29wZS5ob3ZlciA9IGZhbHNlO1xuICAgICAgJHNjb3BlLmxpbmtpbmcgPSBmYWxzZTtcblxuICAgICAgJGVsZW1lbnRcbiAgICAgIC5vbiggJ21vdXNlZG93bicsIGUgPT4ge1xuICAgICAgICAgZHJhZ0N0cmwuZGlzYWJsZURyYWcoKTtcbiAgICAgICAgIHNvcnRDdHJsLmRpc2FibGVTb3J0KCk7XG4gICAgICAgICBub2RlRXZlbnQuc3RhcnRDb25uZWN0aW9uKCAkc2NvcGUuaW8gKTtcbiAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCggJ3RlbXBMaW5rU3RhcnQnLCAkc2NvcGUuaW8ucG9zaXRpb24gKTtcbiAgICAgICAgICRzY29wZS5saW5raW5nID0gdHJ1ZTtcbiAgICAgICAgICRzY29wZS4kZGlnZXN0KCk7XG4gICAgICB9IClcbiAgICAgIC5vbiggJ21vdXNlZW50ZXInLCBlID0+IHtcbiAgICAgICAgICRzY29wZS5ob3ZlciA9IHRydWU7XG4gICAgICAgICAkc2NvcGUuJGRpZ2VzdCgpO1xuICAgICAgfSApXG4gICAgICAub24oICdtb3VzZWxlYXZlJywgZSA9PiB7XG4gICAgICAgICBkcmFnQ3RybC5lbmFibGVEcmFnKCk7XG4gICAgICAgICBzb3J0Q3RybC5lbmFibGVTb3J0KCk7XG4gICAgICAgICAkc2NvcGUuaG92ZXIgPSBmYWxzZTtcbiAgICAgICAgICRzY29wZS4kZGlnZXN0KCk7XG4gICAgICB9IClcbiAgICAgIC5vbiggJ21vdXNldXAnLCBlID0+IHtcbiAgICAgICAgIG5vZGVFdmVudC5lbmRDb25uZWN0aW9uKCAkc2NvcGUuaW8gKTtcbiAgICAgICAgICRzY29wZS4kZGlnZXN0KCk7XG4gICAgICB9IClcbiAgICAgIC5vbiggJ2RibGNsaWNrJywgZSA9PiB7XG4gICAgICAgICBub2RlU2VydmljZS5yZW1vdmVDb25uZWN0aW9ucyggJHNjb3BlLmlvICk7XG4gICAgICAgICBub2RlU2VydmljZS5jb21wdXRlVG9wb2xvZ2ljYWxPcmRlcigpO1xuICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgfSApO1xuXG4gICAgICAkKCAnYm9keScgKVxuICAgICAgLm9uKCAnbW91c2V1cCcsIGUgPT4ge1xuICAgICAgICAgaWYgKCAhJHNjb3BlLmxpbmtpbmcgKSByZXR1cm47XG4gICAgICAgICAkc2NvcGUubGlua2luZyA9IGZhbHNlO1xuICAgICAgICAgJHNjb3BlLiRkaWdlc3QoKTtcbiAgICAgIH0gKTtcblxuICAgICAgY29tcHV0ZVBvc2l0aW9uKCk7XG5cbiAgICAgICRzY29wZS4kb24oICdjb25uZWN0aW9uTmVlZHNVcGRhdGUnLCAoKSA9PiB7XG4gICAgICAgICBjb21wdXRlUG9zaXRpb24oKTtcbiAgICAgIH0gKTtcblxuICAgICAgZnVuY3Rpb24gY29tcHV0ZVBvc2l0aW9uKCkge1xuICAgICAgICAgdmFyIHlPZmYgPSBwYXJzZUludCggJGF0dHJzLmluZGV4ICkgKiAkc2NvcGUucm93SGVpZ2h0ICsgbm9kZUN0cmwuZ2V0SGVhZGVySGVpZ2h0KCkgKyBub2RlQ3RybC5nZXRDb25uSGVpZ2h0T2Zmc2V0KCkgKyBub2RlQ3RybC5nZXRDb25uSGVpZ2h0KCkgKiAwLjU7XG4gICAgICAgICBpZiAoICEkc2NvcGUuaW8ucG9zaXRpb24gKSAkc2NvcGUuaW8ucG9zaXRpb24gPSB7fTtcbiAgICAgICAgICRzY29wZS5pby5wb3NpdGlvbi5sZWZ0ID0gZHJhZ0N0cmwucG9zaXRpb24ueCArICggJHNjb3BlLmlvLnR5cGUgPyBub2RlQ3RybC5nZXRXaWR0aCgpIC0gMC41IDogMCArIDAuNSApO1xuICAgICAgICAgJHNjb3BlLmlvLnBvc2l0aW9uLnRvcCA9IGRyYWdDdHJsLnBvc2l0aW9uLnkgKyB5T2ZmO1xuICAgICAgfVxuXG4gICAgICBsb2cuZGVidWcoICdTY29wZScsICRzY29wZS4kaWQsICdDb25uZWN0b3InLCAkc2NvcGUgKTtcblxuICAgfVxuXG4gICByZXR1cm4ge1xuXG4gICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgcmVwbGFjZTogdHJ1ZSxcbiAgICAgIHJlcXVpcmU6IFsgJ154eEJvZHknLCAnXnN2Z0RyYWdnYWJsZScsICdeeHhTb3J0YWJsZScgXSxcbiAgICAgIHRlbXBsYXRlTmFtZXNwYWNlOiAnc3ZnJyxcbiAgICAgIHRlbXBsYXRlVXJsOiAnLi9zcmMveHgvdGVtcGxhdGUveHhDb25uZWN0b3IuaHRtbCcsXG4gICAgICBsaW5rXG5cbiAgIH07XG5cbn0gXTtcbiIsIm1vZHVsZS5leHBvcnRzID0gWyAnbG9nJywgKCBsb2cgKSA9PiB7XG5cblx0ZnVuY3Rpb24gbGluayggJHNjb3BlLCAkZWxlbWVudCwgJGF0dHJzICkge1xuXG4gICAgICAkc2NvcGUudHlwZSA9ICRhdHRycy50eXBlO1xuICAgICAgJHNjb3BlLmlvQXJyYXkgPSAkc2NvcGUubm9kZU9iamVjdFsgJGF0dHJzLnR5cGUgXTtcblxuICAgICAgbG9nLmRlYnVnKCAnU2NvcGUnLCAkc2NvcGUuJGlkLCAnSU9Db2wnLCAkYXR0cnMudHlwZSwgJHNjb3BlICk7XG5cblx0fVxuXG5cdHJldHVybiB7XG5cblx0XHRyZXN0cmljdDogJ0UnLFxuXHRcdHJlcGxhY2U6IHRydWUsXG5cdFx0dGVtcGxhdGVOYW1lc3BhY2U6ICdzdmcnLFxuXHRcdHRlbXBsYXRlVXJsOiAnLi9zcmMveHgvdGVtcGxhdGUveHhJbnRlcmZhY2UuaHRtbCcsXG5cdFx0c2NvcGU6IHRydWUsXG5cdFx0bGlua1xuXG5cdH07XG5cbn0gXTtcbiIsIm1vZHVsZS5leHBvcnRzID0gWyAnbG9nJywgJyR0aW1lb3V0JywgJyRyb290U2NvcGUnLCAoIGxvZywgJHRpbWVvdXQsICRyb290U2NvcGUgKSA9PiB7XG5cbiAgIGZ1bmN0aW9uIGxpbmsoICRzY29wZSwgJGVsZW1lbnQsICRhdHRycyApIHtcblxuICAgICAgJHNjb3BlLiRvbiggJ3JlcXVlc3RMYWJlbFdpZHRoJywgKCBlLCBzZXRNYXhMYWJlbFdpZHRoICkgPT4ge1xuICAgICAgICAgc2V0TWF4TGFiZWxXaWR0aCggJGF0dHJzLnh4TGFiZWwgLCAkZWxlbWVudFsgMCBdLmdldENvbXB1dGVkVGV4dExlbmd0aCgpICk7XG4gICAgICB9ICk7XG5cbiAgICAgICR0aW1lb3V0KCAoKSA9PiB7XG4gICAgICAgICBpZiAoICRzY29wZS4kbGFzdCApICRzY29wZS5ub2RlT2JqZWN0LnVwZGF0ZVVJKCk7XG4gICAgICB9ICk7XG5cbiAgICAgIGxvZy5kZWJ1ZyggJ1Njb3BlJywgJHNjb3BlLiRpZCwgJ0xhYmVsJywgJGF0dHJzLnh4TGFiZWwsICRzY29wZSApO1xuXG5cbiAgICAgICRlbGVtZW50Lm9uKCAnY29udGV4dG1lbnUnLCBlID0+IHtcblxuICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgICBpZiAoICRzY29wZS5pbyApIHtcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICB2YXIgbSA9IFtcbiAgICAgICAgICAgICAgIHsgbmFtZTogJ0xvZyBMYWJlbCBOYW1lJywgZm46ICgpID0+IGNvbnNvbGUubG9nKCAkc2NvcGUuaW8ubmFtZSApIH0sXG4gICAgICAgICAgICAgICB7IG5hbWU6ICdMb2cgU2NvcGUnLCBmbjogKCkgPT4gY29uc29sZS5sb2coICRzY29wZSApIH1cbiAgICAgICAgICAgIF07XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoICdtZW51Lm9wZW4nLCB7IGV2ZW50OiBlLCBtZW51OiBtIH0gKTtcbiAgICAgICAgIH1cblxuICAgICAgfSApO1xuXG4gICAgICAvLyAkZWxlbWVudC5hdHRhY2hDb250ZXh0TWVudVNlcnZpY2UoIFtjb250ZXh0TWVudV0gKVxuXG4gICB9XG5cbiAgIHJldHVybiB7XG5cbiAgICAgIHJlc3RyaWN0OiAnQScsXG4gICAgICBsaW5rXG5cbiAgIH07XG5cbn0gXTtcbiIsIm1vZHVsZS5leHBvcnRzID0gWyAndXBkYXRlTGlua0V2ZW50JywgKCB1cGRhdGVMaW5rRXZlbnQgKSA9PiB7XG5cblx0ZnVuY3Rpb24gbGluayggJHNjb3BlICkge1xuXG5cdFx0ZnVuY3Rpb24gdXBkYXRlQ29ubmVjdGlvbigpIHtcblxuXHRcdFx0JHNjb3BlLnN0YXJ0ID0ge1xuXHRcdFx0XHR4OiAkc2NvcGUucGFpclsgMCBdLnBvc2l0aW9uLmxlZnQsXG5cdFx0XHRcdHk6ICRzY29wZS5wYWlyWyAwIF0ucG9zaXRpb24udG9wXG5cdFx0XHR9O1xuXHRcdFx0JHNjb3BlLmVuZCA9IHtcblx0XHRcdFx0eDogJHNjb3BlLnBhaXJbIDEgXS5wb3NpdGlvbi5sZWZ0LFxuXHRcdFx0XHR5OiAkc2NvcGUucGFpclsgMSBdLnBvc2l0aW9uLnRvcFxuXHRcdFx0fTtcblxuXHRcdFx0dmFyIGNwT2Zmc2V0ID0gTWF0aC5hYnMoICRzY29wZS5zdGFydC54IC0gJHNjb3BlLmVuZC54ICkgKiAwLjU7XG5cblx0XHRcdCRzY29wZS5jcDEgPSB7XG5cdFx0XHRcdHg6ICRzY29wZS5zdGFydC54IC0gY3BPZmZzZXQsXG5cdFx0XHRcdHk6ICRzY29wZS5zdGFydC55XG5cdFx0XHR9O1xuXHRcdFx0JHNjb3BlLmNwMiA9IHtcblx0XHRcdFx0eDogJHNjb3BlLmVuZC54ICsgY3BPZmZzZXQsXG5cdFx0XHRcdHk6ICRzY29wZS5lbmQueVxuXHRcdFx0fTtcblxuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIHdhdGNoZXIoKSB7IHJldHVybiBbICRzY29wZS5wYWlyWyAwIF0ucG9zaXRpb24sICRzY29wZS5wYWlyWyAxIF0ucG9zaXRpb24gXTsgfVxuXHRcdCRzY29wZS4kd2F0Y2goIHdhdGNoZXIsIHVwZGF0ZUNvbm5lY3Rpb24sIHRydWUgKTtcblxuXHRcdHVwZGF0ZUxpbmtFdmVudC5saXN0ZW4oICgpID0+IHtcblx0XHRcdCRzY29wZS4kZGlnZXN0KCk7XG5cdFx0fSApO1xuXG5cdH1cblxuXHRyZXR1cm4ge1xuXG5cdFx0cmVzdHJpY3Q6ICdFJyxcblx0XHRyZXBsYWNlOiB0cnVlLFxuXHRcdHRlbXBsYXRlTmFtZXNwYWNlOiAnc3ZnJyxcblx0XHR0ZW1wbGF0ZTogJzxwYXRoIG5nLWF0dHItZD1cIk17e3N0YXJ0Lnh9fSx7e3N0YXJ0Lnl9fSBDe3tjcDEueH19LHt7Y3AxLnl9fSB7e2NwMi54fX0se3tjcDIueX19IHt7ZW5kLnh9fSx7e2VuZC55fX1cIi8+Jyxcblx0XHRzY29wZTogdHJ1ZSxcblx0XHRsaW5rXG5cblx0fTtcblxufSBdO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBbICdsb2cnLCAnbm9kZVNlcnZpY2UnLCAnQ00nLCAnJHJvb3RTY29wZScsICggbG9nLCBub2RlU2VydmljZSwgQ00sICRyb290U2NvcGUgKSA9PiB7XG5cbiAgIGZ1bmN0aW9uIGxpbmsoICRzY29wZSwgJGVsZW1lbnQsICRhdHRycywgJGNvbnRyb2xsZXJzICkge1xuXG4gICAgICAkZWxlbWVudC5vbiggJ2NsaWNrJywgZSA9PiB7XG4gICAgICAgICBub2RlU2VydmljZS5zZXRTZWxlY3RlZCggJHNjb3BlLm5vZGVPYmplY3QgKTtcbiAgICAgICAgIENNLmdldEluc3RhbmNlKCkuc2V0VmFsdWUoICRzY29wZS5ub2RlT2JqZWN0Ll9mbnN0ciApO1xuICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgfSApO1xuXG4gICAgICAkc2NvcGUuJHdhdGNoKCBub2RlU2VydmljZS5nZXRTZWxlY3RlZE5vZGUsIG4gPT4ge1xuICAgICAgICAgaWYgKCBuICkgJHNjb3BlLmlzU2VsZWN0ZWQgPSBuLnV1aWQgPT09ICRzY29wZS5ub2RlT2JqZWN0LnV1aWQ7XG4gICAgICAgICBlbHNlICRzY29wZS5pc1NlbGVjdGVkID0gZmFsc2U7XG4gICAgICB9ICk7XG5cbiAgICAgIGxvZy5kZWJ1ZyggJ1Njb3BlJywgJHNjb3BlLiRpZCwgJ1NlbGVjdGFibGUnLCAkc2NvcGUgKTtcblxuICAgICAgJGVsZW1lbnQub24oICdjb250ZXh0bWVudScsIGUgPT4ge1xuXG4gICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgICB2YXIgbSA9IFtcbiAgICAgICAgICAgIHsgbmFtZTogJ0xvZyBTY29wZScsIGZuOiAoKSA9PiBjb25zb2xlLmxvZyggJHNjb3BlICkgfVxuICAgICAgICAgXTtcbiAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCggJ21lbnUub3BlbicsIHsgZXZlbnQ6IGUsIG1lbnU6IG0gfSApO1xuXG4gICAgICB9ICk7XG5cbiAgIH1cblxuICAgcmV0dXJuIHtcblxuICAgICAgcmVzdHJpY3Q6ICdBJyxcbiAgICAgIGxpbmtcblxuICAgfTtcblxufSBdO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBbICdsb2cnLCAoIGxvZyApID0+IHtcblxuICAgZnVuY3Rpb24gbGluayggJHNjb3BlLCAkZWxlbWVudCwgJGF0dHJzLCAkY29udHJvbGxlcnMgKSB7XG5cbiAgICAgIHZhciBzb3J0Q3RybCA9ICRjb250cm9sbGVyc1sgMCBdO1xuICAgICAgdmFyIGRyYWdDdHJsID0gJGNvbnRyb2xsZXJzWyAxIF07XG5cbiAgICAgICRlbGVtZW50XG4gICAgICAub24oICdtb3VzZWRvd24nLCBlID0+IHtcbiAgICAgICAgIGRyYWdDdHJsLmRpc2FibGVEcmFnKCk7XG4gICAgICAgICBzb3J0Q3RybC5zb3J0aW5nID0gdHJ1ZTtcbiAgICAgICAgIHNvcnRDdHJsLnN0YXJ0U29ydCggJHNjb3BlLmlvICk7XG4gICAgICB9IClcbiAgICAgIC5vbiggJ21vdXNlZW50ZXInLCBlID0+IHtcbiAgICAgICAgIGlmICggIXNvcnRDdHJsLnNvcnRpbmcgKSByZXR1cm47XG4gICAgICAgICBzb3J0Q3RybC5lbmRTb3J0KCAkc2NvcGUuaW8gKTtcbiAgICAgIH0gKTtcblxuICAgICAgJCggJ2JvZHknIClcbiAgICAgIC5vbiggJ21vdXNldXAnLCBlID0+IHtcbiAgICAgICAgIGlmICggIXNvcnRDdHJsLnNvcnRpbmcgKSByZXR1cm47XG4gICAgICAgICBkcmFnQ3RybC5lbmFibGVEcmFnKCk7XG4gICAgICAgICBzb3J0Q3RybC5yZXNldCgpO1xuICAgICAgICAgc29ydEN0cmwuc29ydGluZyA9IGZhbHNlO1xuICAgICAgfSApO1xuXG4gICAgICBsb2cuZGVidWcoICdTY29wZScsICRzY29wZS4kaWQsICdTb3J0aXRlbScsICRzY29wZSApO1xuXG4gICB9XG5cbiAgIHJldHVybiB7XG5cbiAgICAgIHJlc3RyaWN0OiAnQScsXG4gICAgICByZXF1aXJlOiBbICdeeHhTb3J0YWJsZScsICdec3ZnRHJhZ2dhYmxlJyBdLFxuICAgICAgbGlua1xuXG4gICB9O1xuXG59IF07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFsgJ2xvZycsICd1cGRhdGVMaW5rRXZlbnQnLCAoIGxvZywgdXBkYXRlTGlua0V2ZW50ICkgPT4ge1xuXG4gICBmdW5jdGlvbiBjb250cm9sbGVyKCAkc2NvcGUsICRlbGVtZW50LCAkYXR0cnMgKSB7XG5cbiAgICAgIHZhciBjdXJyID0gbnVsbDtcbiAgICAgIHZhciB0Z3QgPSBudWxsO1xuXG4gICAgICB2YXIgZGlzYWJsZWQgPSBmYWxzZTtcbiAgICAgIHRoaXMuc29ydGluZyA9IGZhbHNlO1xuXG4gICAgICB0aGlzLnJlc2V0ID0gKCkgPT4ge1xuICAgICAgICAgY3VyciA9IG51bGw7XG4gICAgICAgICB0Z3QgPSBudWxsO1xuICAgICAgfTtcblxuICAgICAgdGhpcy5zdGFydFNvcnQgPSBuID0+IHtcbiAgICAgICAgIGlmICggZGlzYWJsZWQgKSByZXR1cm47XG4gICAgICAgICBjdXJyID0gbjtcbiAgICAgIH07XG5cbiAgICAgIHRoaXMuZW5kU29ydCA9IG4gPT4ge1xuICAgICAgICAgaWYgKCBkaXNhYmxlZCB8fCAhdGhpcy5zb3J0aW5nICkgcmV0dXJuO1xuICAgICAgICAgdGd0ID0gbjtcbiAgICAgICAgIGlmICggY3VyciAhPT0gbnVsbCAmJiB0Z3QgIT09IG51bGwgJiYgY3VyciAhPT0gdGd0ICkge1xuICAgICAgICAgICAgc3dhcFJvdyggY3VyciwgdGd0ICk7XG4gICAgICAgICAgICAkc2NvcGUuJGRpZ2VzdCgpO1xuICAgICAgICAgICAgJHNjb3BlLiRicm9hZGNhc3QoICdjb25uZWN0aW9uTmVlZHNVcGRhdGUnICk7XG4gICAgICAgICAgICB1cGRhdGVMaW5rRXZlbnQuYnJvYWRjYXN0KCk7XG4gICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICB0aGlzLmRpc2FibGVTb3J0ID0gKCkgPT4geyBkaXNhYmxlZCA9IHRydWU7IH07XG4gICAgICB0aGlzLmVuYWJsZVNvcnQgPSAoKSA9PiB7IGRpc2FibGVkID0gZmFsc2U7IH07XG5cbiAgICAgIGZ1bmN0aW9uIHN3YXBSb3coIGN1cnIsIHRndCApIHtcblxuICAgICAgICAgdmFyIHR5cGUgPSBjdXJyLnR5cGUgPT09IDAgPyAnaW5wdXQnIDogJ291dHB1dCc7XG4gICAgICAgICB2YXIgdDEgPSAkc2NvcGUubm9kZU9iamVjdFsgdHlwZSBdLmluZGV4T2YoIHRndCApO1xuICAgICAgICAgdmFyIHQyID0gJHNjb3BlLm5vZGVPYmplY3RbIHR5cGUgXS5pbmRleE9mKCBjdXJyICk7XG5cbiAgICAgICAgICRzY29wZS5ub2RlT2JqZWN0WyB0eXBlIF1bIHQxIF0gPSBjdXJyO1xuICAgICAgICAgJHNjb3BlLm5vZGVPYmplY3RbIHR5cGUgXVsgdDIgXSA9IHRndDtcblxuICAgICAgfVxuXG4gICAgICBsb2cuZGVidWcoICdTY29wZScsICRzY29wZS4kaWQsICdTb3J0YWJsZScsICRzY29wZSApO1xuXG4gICB9XG5cbiAgIHJldHVybiB7XG5cbiAgICAgIHJlc3RyaWN0OiAnQScsXG4gICAgICBjb250cm9sbGVyXG5cbiAgIH07XG5cbn0gXTtcbiIsIm1vZHVsZS5leHBvcnRzID0gWyAnJHJvb3RTY29wZScsICggJHJvb3RTY29wZSApID0+IHtcblxuICAgZnVuY3Rpb24gbGluayggJHNjb3BlLCAkZWxlbWVudCwgJGF0dHJzLCAkY29udHJvbGxlcnMgKSB7XG5cbiAgICAgIC8vIG1ha2UgZWxlbWVudCBjbGljayB0aHJ1LWFibGVcbiAgICAgICRlbGVtZW50LmNzcyggJ3BvaW50ZXItZXZlbnRzJywgJ25vbmUnICk7XG5cbiAgICAgIHZhciBwYW5DdHJsID0gJGNvbnRyb2xsZXJzWyAwIF07XG4gICAgICB2YXIgem9vbUN0cmwgPSAkY29udHJvbGxlcnNbIDEgXTtcbiAgICAgICRzY29wZS5hY3RpdmUgPSBmYWxzZTtcblxuICAgICAgJHJvb3RTY29wZS4kb24oICd0ZW1wTGlua1N0YXJ0JywgKCBlLCBwb3MgKSA9PiB7XG4gICAgICAgICAkc2NvcGUuYWN0aXZlID0gdHJ1ZTtcbiAgICAgICAgICRzY29wZS5zdGFydCA9IHtcbiAgICAgICAgICAgIHg6IHBvcy5sZWZ0LFxuICAgICAgICAgICAgeTogcG9zLnRvcFxuICAgICAgICAgfTtcbiAgICAgICAgICRzY29wZS5jcDEgPSAkc2NvcGUuc3RhcnQ7XG4gICAgICB9ICk7XG5cbiAgICAgICQoICdib2R5JyApXG4gICAgICAub24oICdtb3VzZW1vdmUnLCBlID0+IHtcbiAgICAgICAgIGlmICggISRzY29wZS5hY3RpdmUgKSByZXR1cm47XG4gICAgICAgICB2YXIgb2ZmID0gICQoICcjbm9kZUNhbnZhcycpLm9mZnNldCgpO1xuXG4gICAgICAgICB2YXIgY3ggPSBlLnBhZ2VYIC0gb2ZmLmxlZnQ7XG4gICAgICAgICB2YXIgY3kgPSBlLnBhZ2VZIC0gb2ZmLnRvcDtcbiAgICAgICAgIHZhciBzYyA9IHpvb21DdHJsLnNjYWxpbmdGYWN0b3I7XG5cbiAgICAgICAgIHZhciBwb3MgPSBwYW5DdHJsLmdldFBvc2l0aW9uKCk7XG4gICAgICAgICB2YXIgb3ggPSBwb3MueDtcbiAgICAgICAgIHZhciBveSA9IHBvcy55O1xuXG4gICAgICAgICAkc2NvcGUuZW5kID0ge1xuICAgICAgICAgICAgeDogKCBjeCAtIG94ICkgLyBzYyxcbiAgICAgICAgICAgIHk6ICggY3kgLSBveSApIC8gc2NcbiAgICAgICAgIH07XG4gICAgICAgICAkc2NvcGUuY3AyID0gJHNjb3BlLmVuZDtcblxuICAgICAgICAgJHNjb3BlLiRkaWdlc3QoKTtcblxuICAgICAgfSApXG4gICAgICAub24oICdtb3VzZXVwJywgZSA9PiB7XG4gICAgICAgICAkc2NvcGUuYWN0aXZlID0gZmFsc2U7XG4gICAgICAgICAkc2NvcGUuJGRpZ2VzdCgpO1xuICAgICAgfSApO1xuXG5cdH1cblxuXHRyZXR1cm4ge1xuXG5cdFx0cmVzdHJpY3Q6ICdFJyxcblx0XHRyZXBsYWNlOiB0cnVlLFxuICAgICAgcmVxdWlyZTogWyAnXnN2Z0RyYWdnYWJsZScsICdec3ZnWm9vbWFibGUnIF0sXG5cdFx0dGVtcGxhdGVOYW1lc3BhY2U6ICdzdmcnLFxuXHRcdHRlbXBsYXRlOiAnPHBhdGggbmctc2hvdz1cImFjdGl2ZVwiIG5nLWF0dHItZD1cIk17e3N0YXJ0Lnh9fSx7e3N0YXJ0Lnl9fSBDe3tjcDEueH19LHt7Y3AxLnl9fSB7e2NwMi54fX0se3tjcDIueX19IHt7ZW5kLnh9fSx7e2VuZC55fX1cIi8+Jyxcblx0XHRzY29wZToge30sXG5cdFx0bGlua1xuXG5cdH07XG5cbn0gXTtcbiIsIm1vZHVsZS5leHBvcnRzID0gWyAnJHJvb3RTY29wZScsIGZ1bmN0aW9uICggJHJvb3RTY29wZSApIHtcblxuICAgdGhpcy5icm9hZGNhc3QgPSAoKSA9PiAkcm9vdFNjb3BlLiRicm9hZGNhc3QoICdsaW5rTmVlZHNVcGRhdGUnICk7XG4gICB0aGlzLmxpc3RlbiA9IGNhbGxiYWNrID0+ICRyb290U2NvcGUuJG9uKCAnbGlua05lZWRzVXBkYXRlJywgY2FsbGJhY2sgKTtcblxufSBdO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBbICckcm9vdFNjb3BlJywgJ25vZGVTZXJ2aWNlJywgKCAkcm9vdFNjb3BlLCBub2RlU2VydmljZSApID0+IHtcblxuICAgdmFyIGluaUNvbm4gPSBudWxsO1xuXG4gICBmdW5jdGlvbiBzdGFydENvbm5lY3Rpb24oIGNvbm4gKSB7XG4gICAgICBpbmlDb25uID0gY29ubjtcbiAgIH1cblxuICAgZnVuY3Rpb24gZW5kQ29ubmVjdGlvbiggZW5kQ29ubiApIHtcblxuICAgICAgaWYgKCB2YWxpZGF0ZUNvbm5lY3Rpb24oIGluaUNvbm4sIGVuZENvbm4gKSApIHtcblxuICAgICAgICAgdmFyIHBhaXIgPSBbXTtcbiAgICAgICAgIHBhaXJbIGluaUNvbm4udHlwZSBdID0gaW5pQ29ubjtcbiAgICAgICAgIHBhaXJbIGVuZENvbm4udHlwZSBdID0gZW5kQ29ubjtcblxuICAgICAgICAgaWYgKCAhaXNDeWNsaWMoIHBhaXIgKSApIHtcbiAgICAgICAgICAgIGlmICggIWlzRHVwbGljYXRlKCBwYWlyWyAwIF0sIHBhaXJbIDEgXSApICkge1xuXG4gICAgICAgICAgICAgICBpZiAoICFwYWlyWyAwIF0uYXZhaWxhYmxlICkge1xuICAgICAgICAgICAgICAgICAgbm9kZVNlcnZpY2UucmVtb3ZlQ29ubmVjdGlvbnMoIHBhaXJbIDAgXSApO1xuICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICBwYWlyWyAwIF0uY29ubmVjdCggcGFpclsgMSBdICk7XG4gICAgICAgICAgICAgICBub2RlU2VydmljZS5jb25uZWN0aW9ucy5wdXNoKCBwYWlyICk7XG4gICAgICAgICAgICAgICBub2RlU2VydmljZS5jb21wdXRlVG9wb2xvZ2ljYWxPcmRlcigpO1xuICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYXBwbHkoKTtcblxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCAnRHVwbGljYXRlZCBwYWlyLicgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyggJ0N5Y2xpYyBkZXBlbmRlbmN5LicgKTtcbiAgICAgICAgIH1cblxuICAgICAgfVxuXG4gICAgICByZXNldENvbm4oKTtcblxuICAgfVxuXG4gICBmdW5jdGlvbiByZXNldENvbm4oKSB7XG4gICAgICBpbmlDb25uID0gbnVsbDtcbiAgIH1cblxuICAgZnVuY3Rpb24gdmFsaWRhdGVDb25uZWN0aW9uKCBhLCBiICkge1xuXG4gICAgICByZXR1cm4gKFxuICAgICAgICAgYSAhPT0gbnVsbCAmJiBiICE9PSBudWxsICYmXG4gICAgICAgICBhLmdldFBhcmVudCgpLnV1aWQgIT09IGIuZ2V0UGFyZW50KCkudXVpZCAmJlxuICAgICAgICAgYS50eXBlICE9PSBiLnR5cGVcbiAgICAgICk7XG5cbiAgIH1cblxuICAgZnVuY3Rpb24gaXNEdXBsaWNhdGUoIGlucCwgb3B0ICkge1xuICAgICAgcmV0dXJuIG5vZGVTZXJ2aWNlLmNvbm5lY3Rpb25zLnNvbWUoIHBhaXIgPT4gcGFpclsgMCBdLnV1aWQgPT09IGlucC51dWlkICYmIHBhaXJbIDEgXS51dWlkID09PSBvcHQudXVpZCApO1xuICAgfVxuXG4gICBmdW5jdGlvbiBpc0N5Y2xpYyggcGFpciApIHtcbiAgICAgIHZhciB0bXAgPSBub2RlU2VydmljZS5jb25uZWN0aW9ucy5zbGljZSgpO1xuICAgICAgdG1wLnB1c2goIHBhaXIgKTtcbiAgICAgIHRyeSB7XG4gICAgICAgICBub2RlU2VydmljZS50b3BvU29ydCggdG1wICk7XG4gICAgICB9IGNhdGNoICggZSApIHtcbiAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgfVxuXG4gICByZXR1cm4ge1xuXG4gICAgICBzdGFydENvbm5lY3Rpb24sXG4gICAgICBlbmRDb25uZWN0aW9uXG5cbiAgIH07XG5cbn0gXTtcbiIsIi8vIGpzaGludCAtVzA1NFxubW9kdWxlLmV4cG9ydHMgPSBbICgpID0+IHtcblxuICAgY2xhc3MgQ29ubmVjdGlvbiB7XG4gICAgICBjb25zdHJ1Y3RvciggbmFtZSwgcGFyZW50ICkge1xuICAgICAgICAgdGhpcy51dWlkID0gVVVJRCgpO1xuICAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgIHRoaXMuZ2V0UGFyZW50ID0gKCkgPT4geyByZXR1cm4gcGFyZW50OyB9O1xuICAgICAgICAgdGhpcy5hdmFpbGFibGUgPSB0cnVlO1xuICAgICAgfVxuICAgfVxuXG4gICBjbGFzcyBJbnB1dCBleHRlbmRzIENvbm5lY3Rpb24ge1xuICAgICAgY29uc3RydWN0b3IoIG5hbWUsIHBhcmVudCApIHtcbiAgICAgICAgIHN1cGVyKCBuYW1lLCBwYXJlbnQgKTtcbiAgICAgICAgIHRoaXMudHlwZSA9IDA7XG4gICAgICAgICB0aGlzLmRlc3QgPSBudWxsO1xuICAgICAgfVxuICAgICAgY29ubmVjdCggaW8gKSB7XG4gICAgICAgICAvL2lucHV0XG4gICAgICAgICB0aGlzLmRlc3QgPSBpbztcbiAgICAgICAgIHRoaXMuYXZhaWxhYmxlID0gZmFsc2U7XG4gICAgICAgICAvLyBvdXRwdXRcbiAgICAgICAgIGlvLmRlc3QucHVzaCggdGhpcyApO1xuICAgICAgICAgaW8uYXZhaWxhYmxlID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBkaXNjb25uZWN0KCkge1xuICAgICAgICAgLy8gb3V0cHV0XG4gICAgICAgICB2YXIgaSA9IHRoaXMuZGVzdC5kZXN0LmluZGV4T2YoIHRoaXMgKTtcbiAgICAgICAgIGlmICggaSA+IC0xICkgdGhpcy5kZXN0LmRlc3Quc3BsaWNlKCBpLCAxICk7XG4gICAgICAgICBpZiAoIHRoaXMuZGVzdC5kZXN0Lmxlbmd0aCA9PT0gMCApIHRoaXMuZGVzdC5hdmFpbGFibGUgPSB0cnVlO1xuICAgICAgICAgLy8gaW5wdXRcbiAgICAgICAgIHRoaXMuZGVzdCA9IG51bGw7XG4gICAgICAgICB0aGlzLmF2YWlsYWJsZSA9IHRydWU7XG4gICAgICB9XG4gICAgICBnZXREZXN0RGF0YSgpIHtcbiAgICAgICAgIHJldHVybiB0aGlzLmRlc3QgPT09IG51bGwgPyBudWxsIDogdGhpcy5kZXN0LmRhdGE7XG4gICAgICB9XG4gICB9XG5cbiAgIGNsYXNzIE91dHB1dCBleHRlbmRzIENvbm5lY3Rpb24ge1xuICAgICAgY29uc3RydWN0b3IoIG5hbWUsIHBhcmVudCApIHtcbiAgICAgICAgIHN1cGVyKCBuYW1lLCBwYXJlbnQgKTtcbiAgICAgICAgIHRoaXMudHlwZSA9IDE7XG4gICAgICAgICB0aGlzLmRhdGEgPSBudWxsO1xuICAgICAgICAgdGhpcy5kZXN0ID0gW107XG4gICAgICB9XG4gICB9XG5cbiAgIGNsYXNzIEV4ZWN1dGFibGUge1xuICAgICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgICB0aGlzLl9mbnN0ciA9ICcnO1xuICAgICAgICAgdGhpcy5fdGFzayA9IG51bGw7XG4gICAgICB9XG4gICAgICBjb21waWxlKCkge1xuICAgICAgICAgdHJ5IHsgdGhpcy5fdGFzayA9IG5ldyBGdW5jdGlvbiggJ2lucHV0JywgdGhpcy5fZm5zdHIgKTsgfVxuICAgICAgICAgY2F0Y2ggKCBlcnIgKSB7IHJldHVybiBlcnI7IH1cbiAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgICAgZXhlY3V0ZSgpIHtcbiAgICAgICAgIHZhciBpbnBPYmogPSB7fTtcbiAgICAgICAgIGlmICggdGhpcy5pbnB1dC5sZW5ndGggIT09IDAgKSB7XG4gICAgICAgICAgICB0aGlzLmlucHV0LmZvckVhY2goIGlucCA9PiB7XG4gICAgICAgICAgICAgICBpbnBPYmpbIGlucC5uYW1lIF0gPSBpbnAuZ2V0RGVzdERhdGEoKTtcbiAgICAgICAgICAgIH0gKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCBpbnBPYmogKTtcbiAgICAgICAgIH1cbiAgICAgICAgIHZhciByZXMgPSBudWxsO1xuICAgICAgICAgdHJ5IHsgcmVzID0gdGhpcy5fdGFzay5jYWxsKCBudWxsLCBpbnBPYmogKTsgfVxuICAgICAgICAgY2F0Y2ggKCBlICkgeyBjb25zb2xlLmVycm9yKCBlICk7IH1cbiAgICAgICAgIHRoaXMub3V0cHV0LmZvckVhY2goIG9wdCA9PiB7IG9wdC5kYXRhID0gcmVzWyBvcHQubmFtZSBdOyB9ICk7XG4gICAgICB9XG4gICB9XG5cbiAgIGNsYXNzIE5vZGUgZXh0ZW5kcyBFeGVjdXRhYmxlIHtcbiAgICAgIGNvbnN0cnVjdG9yKCBuYW1lICkge1xuICAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgIHRoaXMudXVpZCA9IFVVSUQoKTtcbiAgICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgICB0aGlzLmlucHV0ID0gW107XG4gICAgICAgICB0aGlzLm91dHB1dCA9IFtdO1xuICAgICAgICAgdGhpcy5vcmRlciA9IC0xO1xuICAgICAgICAgdGhpcy51cGRhdGVVSSA9ICgpID0+IHRoaXMuX3VpLnVwZGF0ZSA9ICF0aGlzLl91aS51cGRhdGU7XG4gICAgICAgICB0aGlzLl91aSA9IHtcbiAgICAgICAgICAgIHVwZGF0ZTogZmFsc2VcbiAgICAgICAgIH07XG4gICAgICB9XG4gICAgICBhZGRJbnB1dCgpIHtcbiAgICAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkgKysgKSB7XG4gICAgICAgICAgICB0aGlzLmlucHV0LnB1c2goIG5ldyBJbnB1dCggYXJndW1lbnRzWyBpIF0sIHRoaXMgKSApO1xuICAgICAgICAgfVxuICAgICAgfVxuICAgICAgYWRkT3V0cHV0KCBuYW1lICkge1xuICAgICAgICAgZm9yICggbGV0IGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSArKyApIHtcbiAgICAgICAgICAgIHRoaXMub3V0cHV0LnB1c2goIG5ldyBPdXRwdXQoIGFyZ3VtZW50c1sgaSBdLCB0aGlzICkgKTtcbiAgICAgICAgIH1cbiAgICAgIH1cbiAgIH1cblxuICAgZnVuY3Rpb24gY3JlYXRlKCBuYW1lICkge1xuICAgICAgcmV0dXJuIG5ldyBOb2RlKCBuYW1lICk7XG4gICB9XG5cbiAgIHJldHVybiB7XG4gICAgICBjcmVhdGVcbiAgIH07XG5cbn0gXTtcbiIsIm1vZHVsZS5leHBvcnRzID0gWyAnbm9kZUZhY3RvcnknLCAoIG5vZGVGYWN0b3J5ICkgPT4ge1xuXG4gICB2YXIgbm9kZXMgPSBbXTtcbiAgIHZhciBjb25uZWN0aW9ucyA9IFtdO1xuXG4gICB2YXIgc2VsZWN0ZWROb2RlID0gbnVsbDtcblxuICAgZnVuY3Rpb24gZ2V0U2VsZWN0ZWROb2RlKCkge1xuICAgICAgcmV0dXJuIHNlbGVjdGVkTm9kZTtcbiAgIH1cblxuICAgZnVuY3Rpb24gc2V0U2VsZWN0ZWQoIG5vZGUgKSB7XG4gICAgICBzZWxlY3RlZE5vZGUgPSBub2RlO1xuICAgfVxuXG4gICBmdW5jdGlvbiBjbGVhclNlbGVjdGVkKCkge1xuICAgICAgc2VsZWN0ZWROb2RlID0gbnVsbDtcbiAgIH1cblxuICAgZnVuY3Rpb24gcnVuKCkge1xuXG4gICAgICBub2Rlcy5zb3J0KCAoIGEsIGIgKSA9PiB7IHJldHVybiBhLm9yZGVyIC0gYi5vcmRlcjsgfSApO1xuXG4gICAgICBub2Rlcy5maWx0ZXIoIG4gPT4geyByZXR1cm4gbi5vcmRlciAhPT0gLTE7IH0gKS5mb3JFYWNoKCBuID0+IHtcbiAgICAgICAgIHZhciBlcnIgPSBuLmNvbXBpbGUoKTtcbiAgICAgICAgIGlmICggZXJyICkgY29uc29sZS5lcnJvciggYE5vZGUgb3JkZXIgTm8uJHtuLm9yZGVyfWAsIGVyciApO1xuICAgICAgICAgbi5leGVjdXRlKCk7XG4gICAgICB9ICk7XG5cbiAgIH1cblxuICAgZnVuY3Rpb24gY3JlYXRlRW1wdHlOb2RlKCkge1xuICAgICAgdmFyIG4gPSBub2RlRmFjdG9yeS5jcmVhdGUoICdOVUxMJyApO1xuICAgICAgbm9kZXMucHVzaCggbiApO1xuICAgICAgcmV0dXJuIG47XG4gICB9XG5cbiAgIGZ1bmN0aW9uIGdlbmVyYXRlTm9kZSgpIHtcblxuICAgICAgdmFyIG47XG5cbiAgICAgIG4gPSBub2RlRmFjdG9yeS5jcmVhdGUoICdDb25zdGFudHMnICk7XG4gICAgICBuLmFkZE91dHB1dCggJ3gnLCAneScsICd6JyApO1xuICAgICAgbi5fZm5zdHIgPSAncmV0dXJuIHsgeDogNDIsIHk6IDMzLCB6OiA3NiB9Oyc7XG4gICAgICBuLmNvbXBpbGUoKTtcbiAgICAgIG5vZGVzLnB1c2goIG4gKTtcblxuICAgICAgbiA9IG5vZGVGYWN0b3J5LmNyZWF0ZSggJ1ZlY3RvcjMnICk7XG4gICAgICBuLmFkZElucHV0KCAndScsICd2JywgJ3cnICk7XG4gICAgICBuLmFkZE91dHB1dCggJ3ZlYzMnICk7XG4gICAgICBuLl9mbnN0ciA9ICdyZXR1cm4geyB2ZWMzOiBbIGlucHV0LnUsIGlucHV0LnYsIGlucHV0LncgXSB9Oyc7XG4gICAgICBuLmNvbXBpbGUoKTtcbiAgICAgIG5vZGVzLnB1c2goIG4gKTtcblxuICAgICAgbiA9IG5vZGVGYWN0b3J5LmNyZWF0ZSggJ1ZlY3RvcjMnICk7XG4gICAgICBuLmFkZElucHV0KCAncycsICd0JywgJ3AnICk7XG4gICAgICBuLmFkZE91dHB1dCggJ3ZlYzMnICk7XG4gICAgICBuLl9mbnN0ciA9ICdyZXR1cm4geyB2ZWMzOiBbIGlucHV0LnMsIGlucHV0LnQsIGlucHV0LnAgXSB9Oyc7XG4gICAgICBuLmNvbXBpbGUoKTtcbiAgICAgIG5vZGVzLnB1c2goIG4gKTtcblxuICAgICAgbiA9IG5vZGVGYWN0b3J5LmNyZWF0ZSggJ0RvdCcgKTtcbiAgICAgIG4uYWRkSW5wdXQoICd2MScsICd2MicgKTtcbiAgICAgIG4uYWRkT3V0cHV0KCAnZicgKTtcbiAgICAgIG4uX2Zuc3RyID0gJ3JldHVybiB7IGY6IGlucHV0LnYxWzBdKmlucHV0LnYyWzBdK2lucHV0LnYxWzFdKmlucHV0LnYyWzFdK2lucHV0LnYxWzJdKmlucHV0LnYyWzJdIH07JztcbiAgICAgIG4uY29tcGlsZSgpO1xuICAgICAgbm9kZXMucHVzaCggbiApO1xuXG4gICAgICBuID0gbm9kZUZhY3RvcnkuY3JlYXRlKCAnQ29uc29sZScgKTtcbiAgICAgIG4uYWRkSW5wdXQoICdsb2cnICk7XG4gICAgICBuLl9mbnN0ciA9ICdjb25zb2xlLmxvZyggaW5wdXQubG9nICk7JztcbiAgICAgIG4uY29tcGlsZSgpO1xuICAgICAgbm9kZXMucHVzaCggbiApO1xuXG4gICB9XG5cbiAgIGZ1bmN0aW9uIGRlbGV0ZUlPKCBpbyApIHtcbiAgICAgIC8qIHJlbW92ZSBjb25uZWN0aW9uc1xuICAgICAgICAgcmVtb3ZlIGlvXG4gICAgICAqL1xuICAgfVxuXG4gICBmdW5jdGlvbiB0b3BvU29ydCggY29ubkFycmF5ICkge1xuXG4gICAgICB2YXIgZGVwcyA9IFtdO1xuICAgICAgY29ubkFycmF5LmZvckVhY2goIHBhaXIgPT4ge1xuXG4gICAgICAgICB2YXIgdjEgPSBwYWlyWyAwIF0uZ2V0UGFyZW50KCkudXVpZDtcbiAgICAgICAgIHZhciB2MiA9IHBhaXJbIDEgXS5nZXRQYXJlbnQoKS51dWlkO1xuICAgICAgICAgZGVwcy5wdXNoKCBbIHYyLCB2MSBdICk7XG5cbiAgICAgIH0gKTtcblxuICAgICAgcmV0dXJuIFRPUE9TT1JUKCBkZXBzICk7XG5cbiAgIH1cblxuICAgZnVuY3Rpb24gY29tcHV0ZVRvcG9sb2dpY2FsT3JkZXIoKSB7XG5cbiAgICAgIHZhciBzb3J0ZWQgPSB0b3BvU29ydCggY29ubmVjdGlvbnMgKTtcbiAgICAgIG5vZGVzLmZvckVhY2goIG4gPT4geyBuLm9yZGVyID0gc29ydGVkLmluZGV4T2YoIG4udXVpZCApOyB9ICk7XG5cbiAgIH1cblxuICAgZnVuY3Rpb24gcmVtb3ZlQ29ubmVjdGlvbnMoIGNvbm4gKSB7XG5cbiAgICAgIHZhciBybSA9IFtdO1xuICAgICAgY29ubmVjdGlvbnMuZm9yRWFjaCggKCBwYWlyLCBpZHggKSA9PiB7XG4gICAgICAgICBpZiAoIGNvbm4udXVpZCA9PT0gcGFpclsgY29ubi50eXBlIF0udXVpZCApIHtcbiAgICAgICAgICAgIHBhaXJbIDAgXS5kaXNjb25uZWN0KCk7XG4gICAgICAgICAgICBybS5wdXNoKCBpZHggKTtcbiAgICAgICAgIH1cbiAgICAgIH0gKTtcbiAgICAgIGZvciAoIGxldCBpID0gcm0ubGVuZ3RoIC0gMTsgaSA+PSAwOyBpIC0tICkge1xuICAgICAgICAgY29ubmVjdGlvbnMuc3BsaWNlKCBybVsgaSBdLCAxICk7XG4gICAgICB9XG5cbiAgIH1cblxuICAgZnVuY3Rpb24gcGFyc2VGdW5jdGlvblBhcmFtZXRlcnMoIGZuU3RyICkge1xuICAgICAgdmFyIFNUUklQX0NPTU1FTlRTID0gLygoXFwvXFwvLiokKXwoXFwvXFwqW1xcc1xcU10qP1xcKlxcLykpL21nO1xuICAgICAgdmFyIEFSR1VNRU5UX05BTUVTID0gLyhbXlxccyxdKykvZztcbiAgICAgIGZuU3RyID0gZm5TdHIucmVwbGFjZShTVFJJUF9DT01NRU5UUywgJycpO1xuICAgICAgdmFyIHJlc3VsdCA9IGZuU3RyLnNsaWNlKGZuU3RyLmluZGV4T2YoJygnKSsxLCBmblN0ci5pbmRleE9mKCcpJykpLm1hdGNoKEFSR1VNRU5UX05BTUVTKTtcbiAgICAgIGlmICggcmVzdWx0ID09PSBudWxsICkgcmVzdWx0ID0gW107XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgfVxuXG4gICByZXR1cm4ge1xuXG4gICAgICBub2RlcyxcbiAgICAgIGNvbm5lY3Rpb25zLFxuICAgICAgZ2VuZXJhdGVOb2RlLFxuICAgICAgY29tcHV0ZVRvcG9sb2dpY2FsT3JkZXIsXG4gICAgICByZW1vdmVDb25uZWN0aW9ucyxcbiAgICAgIGNsZWFyU2VsZWN0ZWQsXG4gICAgICBzZXRTZWxlY3RlZCxcbiAgICAgIGdldFNlbGVjdGVkTm9kZSxcbiAgICAgIHJ1bixcbiAgICAgIGNyZWF0ZUVtcHR5Tm9kZSxcbiAgICAgIHRvcG9Tb3J0XG5cbiAgIH07XG5cbn0gXTtcbiJdfQ==
