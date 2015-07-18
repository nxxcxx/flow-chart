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

      cm.setSize('100%', 500);
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

angular.module('nodeApp', []).filter('cjson', require('./common/cjson.filter')).provider('log', require('./common/log.provider')).service('updateLinkEvent', require('./xx/services/events/updateLinkEvent')).factory('nodeService', require('./xx/services/xxService')).factory('nodeFactory', require('./xx/services/xxFactory')).factory('nodeEvent', require('./xx/services/xxEvent')).controller('xxCtrl', require('./xx/controllers/xx.ctrl')).directive('xxBody', require('./xx/directives/xxBody.dir')).directive('xxInterface', require('./xx/directives/xxInterface.dir')).directive('xxLabel', require('./xx/directives/xxLabel.dir')).directive('xxConnector', require('./xx/directives/xxConnector.dir')).directive('xxLink', require('./xx/directives/xxLink.dir')).directive('xxTempLink', require('./xx/directives/xxTempLink.dir')).directive('xxSortable', require('./xx/directives/xxSortable.dir')).directive('xxSortItem', require('./xx/directives/xxSortItem.dir')).directive('xxSelectable', require('./xx/directives/xxSelectable.dir')).directive('svgDraggable', require('./xx/directives/svgDraggable.dir')).directive('svgZoomable', require('./xx/directives/svgZoomable.dir')).factory('CM', require('./codeMirror.service')).directive('codeMirror', require('./codeMirror.dir')).factory('CTXM', require('./contextMenu.service')).directive('contextMenu', require('./contextMenu.dir')).config(['logProvider', function (logProvider) {

	logProvider.enableDebug();
	// logProvider.enableDebugNamespace( 'Scope' );
}]);

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./codeMirror.dir":5,"./codeMirror.service":6,"./common/cjson.filter":7,"./common/log.provider":8,"./contextMenu.dir":9,"./contextMenu.service":10,"./xx/controllers/xx.ctrl":12,"./xx/directives/svgDraggable.dir":13,"./xx/directives/svgZoomable.dir":14,"./xx/directives/xxBody.dir":15,"./xx/directives/xxConnector.dir":16,"./xx/directives/xxInterface.dir":17,"./xx/directives/xxLabel.dir":18,"./xx/directives/xxLink.dir":19,"./xx/directives/xxSelectable.dir":20,"./xx/directives/xxSortItem.dir":21,"./xx/directives/xxSortable.dir":22,"./xx/directives/xxTempLink.dir":23,"./xx/services/events/updateLinkEvent":24,"./xx/services/xxEvent":25,"./xx/services/xxFactory":26,"./xx/services/xxService":27,"circular-json":1,"toposort":2,"uuid":4}],12:[function(require,module,exports){
(function (global){
'use strict';

module.exports = ['log', '$scope', '$rootScope', 'nodeService', 'CM', function (log, $scope, $rootScope, nodeService, CM) {

   global.SCOPE = $scope;
   $scope.nodeService = nodeService;
   $scope.CM = CM;

   $scope.run = function () {
      nodeService.run();
      $scope.$apply();
   };

   // todo add / remove input, when add/remove input run apply this scope!
   // webaudio

   log.debug('Scope', $scope.$id, 'NodeCtrl', $scope);
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
      controller: controller

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

         if ($scope.io && e.target === $element[0]) {
            var m = [{ name: 'Log Label Name', fn: function fn() {
                  return console.log($scope.io.name);
               } }, { name: 'Log Scope', fn: function fn() {
                  return console.log($scope);
               } }];
            $rootScope.$broadcast('menu.open', { event: e, menu: m });
         }
      });
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

module.exports = ['log', 'nodeService', 'CM', function (log, nodeService, CM) {

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

},{}]},{},[11])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvY2lyY3VsYXItanNvbi9idWlsZC9jaXJjdWxhci1qc29uLm5vZGUuanMiLCJub2RlX21vZHVsZXMvdG9wb3NvcnQvaW5kZXguanMiLCJub2RlX21vZHVsZXMvdXVpZC9ybmctYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy91dWlkL3V1aWQuanMiLCIvVXNlcnMvTklYL0RvY3VtZW50cy9uaXgvZmxvdy9zcmMvY29kZU1pcnJvci5kaXIuanMiLCIvVXNlcnMvTklYL0RvY3VtZW50cy9uaXgvZmxvdy9zcmMvY29kZU1pcnJvci5zZXJ2aWNlLmpzIiwiL1VzZXJzL05JWC9Eb2N1bWVudHMvbml4L2Zsb3cvc3JjL2NvbW1vbi9janNvbi5maWx0ZXIuanMiLCIvVXNlcnMvTklYL0RvY3VtZW50cy9uaXgvZmxvdy9zcmMvY29tbW9uL2xvZy5wcm92aWRlci5qcyIsIi9Vc2Vycy9OSVgvRG9jdW1lbnRzL25peC9mbG93L3NyYy9jb250ZXh0TWVudS5kaXIuanMiLCIvVXNlcnMvTklYL0RvY3VtZW50cy9uaXgvZmxvdy9zcmMvY29udGV4dE1lbnUuc2VydmljZS5qcyIsIi9Vc2Vycy9OSVgvRG9jdW1lbnRzL25peC9mbG93L3NyYy9pbmRleC5qcyIsIi9Vc2Vycy9OSVgvRG9jdW1lbnRzL25peC9mbG93L3NyYy94eC9jb250cm9sbGVycy94eC5jdHJsLmpzIiwiL1VzZXJzL05JWC9Eb2N1bWVudHMvbml4L2Zsb3cvc3JjL3h4L2RpcmVjdGl2ZXMvc3ZnRHJhZ2dhYmxlLmRpci5qcyIsIi9Vc2Vycy9OSVgvRG9jdW1lbnRzL25peC9mbG93L3NyYy94eC9kaXJlY3RpdmVzL3N2Z1pvb21hYmxlLmRpci5qcyIsIi9Vc2Vycy9OSVgvRG9jdW1lbnRzL25peC9mbG93L3NyYy94eC9kaXJlY3RpdmVzL3h4Qm9keS5kaXIuanMiLCIvVXNlcnMvTklYL0RvY3VtZW50cy9uaXgvZmxvdy9zcmMveHgvZGlyZWN0aXZlcy94eENvbm5lY3Rvci5kaXIuanMiLCIvVXNlcnMvTklYL0RvY3VtZW50cy9uaXgvZmxvdy9zcmMveHgvZGlyZWN0aXZlcy94eEludGVyZmFjZS5kaXIuanMiLCIvVXNlcnMvTklYL0RvY3VtZW50cy9uaXgvZmxvdy9zcmMveHgvZGlyZWN0aXZlcy94eExhYmVsLmRpci5qcyIsIi9Vc2Vycy9OSVgvRG9jdW1lbnRzL25peC9mbG93L3NyYy94eC9kaXJlY3RpdmVzL3h4TGluay5kaXIuanMiLCIvVXNlcnMvTklYL0RvY3VtZW50cy9uaXgvZmxvdy9zcmMveHgvZGlyZWN0aXZlcy94eFNlbGVjdGFibGUuZGlyLmpzIiwiL1VzZXJzL05JWC9Eb2N1bWVudHMvbml4L2Zsb3cvc3JjL3h4L2RpcmVjdGl2ZXMveHhTb3J0SXRlbS5kaXIuanMiLCIvVXNlcnMvTklYL0RvY3VtZW50cy9uaXgvZmxvdy9zcmMveHgvZGlyZWN0aXZlcy94eFNvcnRhYmxlLmRpci5qcyIsIi9Vc2Vycy9OSVgvRG9jdW1lbnRzL25peC9mbG93L3NyYy94eC9kaXJlY3RpdmVzL3h4VGVtcExpbmsuZGlyLmpzIiwiL1VzZXJzL05JWC9Eb2N1bWVudHMvbml4L2Zsb3cvc3JjL3h4L3NlcnZpY2VzL2V2ZW50cy91cGRhdGVMaW5rRXZlbnQuanMiLCIvVXNlcnMvTklYL0RvY3VtZW50cy9uaXgvZmxvdy9zcmMveHgvc2VydmljZXMveHhFdmVudC5qcyIsIi9Vc2Vycy9OSVgvRG9jdW1lbnRzL25peC9mbG93L3NyYy94eC9zZXJ2aWNlcy94eEZhY3RvcnkuanMiLCIvVXNlcnMvTklYL0RvY3VtZW50cy9uaXgvZmxvdy9zcmMveHgvc2VydmljZXMveHhTZXJ2aWNlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25MQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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QU8sQ0FBQyxjQUFjLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDMUMsVUFBSSxNQUFNLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBQ3pGLFVBQUssTUFBTSxLQUFLLElBQUksRUFBRyxNQUFNLEdBQUcsRUFBRSxDQUFDO0FBQ25DLGFBQU8sTUFBTSxDQUFDO0lBQ2hCOztBQUVELFVBQU87O0FBRUosV0FBSyxFQUFMLEtBQUs7QUFDTCxpQkFBVyxFQUFYLFdBQVc7QUFDWCxrQkFBWSxFQUFaLFlBQVk7QUFDWiw2QkFBdUIsRUFBdkIsdUJBQXVCO0FBQ3ZCLHVCQUFpQixFQUFqQixpQkFBaUI7QUFDakIsbUJBQWEsRUFBYixhQUFhO0FBQ2IsaUJBQVcsRUFBWCxXQUFXO0FBQ1gscUJBQWUsRUFBZixlQUFlO0FBQ2YsU0FBRyxFQUFILEdBQUc7QUFDSCxxQkFBZSxFQUFmLGVBQWU7QUFDZixjQUFRLEVBQVIsUUFBUTs7SUFFVixDQUFDO0NBRUosQ0FBRSxDQUFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qIVxuQ29weXJpZ2h0IChDKSAyMDEzIGJ5IFdlYlJlZmxlY3Rpb25cblxuUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxub2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xudG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG5mdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuXG5UaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG5cblRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbklNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG5BVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG5MSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuVEhFIFNPRlRXQVJFLlxuXG4qL1xudmFyXG4gIC8vIHNob3VsZCBiZSBhIG5vdCBzbyBjb21tb24gY2hhclxuICAvLyBwb3NzaWJseSBvbmUgSlNPTiBkb2VzIG5vdCBlbmNvZGVcbiAgLy8gcG9zc2libHkgb25lIGVuY29kZVVSSUNvbXBvbmVudCBkb2VzIG5vdCBlbmNvZGVcbiAgLy8gcmlnaHQgbm93IHRoaXMgY2hhciBpcyAnficgYnV0IHRoaXMgbWlnaHQgY2hhbmdlIGluIHRoZSBmdXR1cmVcbiAgc3BlY2lhbENoYXIgPSAnficsXG4gIHNhZmVTcGVjaWFsQ2hhciA9ICdcXFxceCcgKyAoXG4gICAgJzAnICsgc3BlY2lhbENoYXIuY2hhckNvZGVBdCgwKS50b1N0cmluZygxNilcbiAgKS5zbGljZSgtMiksXG4gIGVzY2FwZWRTYWZlU3BlY2lhbENoYXIgPSAnXFxcXCcgKyBzYWZlU3BlY2lhbENoYXIsXG4gIHNwZWNpYWxDaGFyUkcgPSBuZXcgUmVnRXhwKHNhZmVTcGVjaWFsQ2hhciwgJ2cnKSxcbiAgc2FmZVNwZWNpYWxDaGFyUkcgPSBuZXcgUmVnRXhwKGVzY2FwZWRTYWZlU3BlY2lhbENoYXIsICdnJyksXG5cbiAgc2FmZVN0YXJ0V2l0aFNwZWNpYWxDaGFyUkcgPSBuZXcgUmVnRXhwKCcoPzpefFteXFxcXFxcXFxdKScgKyBlc2NhcGVkU2FmZVNwZWNpYWxDaGFyKSxcblxuICBpbmRleE9mID0gW10uaW5kZXhPZiB8fCBmdW5jdGlvbih2KXtcbiAgICBmb3IodmFyIGk9dGhpcy5sZW5ndGg7aS0tJiZ0aGlzW2ldIT09djspO1xuICAgIHJldHVybiBpO1xuICB9LFxuICAkU3RyaW5nID0gU3RyaW5nICAvLyB0aGVyZSdzIG5vIHdheSB0byBkcm9wIHdhcm5pbmdzIGluIEpTSGludFxuICAgICAgICAgICAgICAgICAgICAvLyBhYm91dCBuZXcgU3RyaW5nIC4uLiB3ZWxsLCBJIG5lZWQgdGhhdCBoZXJlIVxuICAgICAgICAgICAgICAgICAgICAvLyBmYWtlZCwgYW5kIGhhcHB5IGxpbnRlciFcbjtcblxuZnVuY3Rpb24gZ2VuZXJhdGVSZXBsYWNlcih2YWx1ZSwgcmVwbGFjZXIsIHJlc29sdmUpIHtcbiAgdmFyXG4gICAgcGF0aCA9IFtdLFxuICAgIGFsbCAgPSBbdmFsdWVdLFxuICAgIHNlZW4gPSBbdmFsdWVdLFxuICAgIG1hcHAgPSBbcmVzb2x2ZSA/IHNwZWNpYWxDaGFyIDogJ1tDaXJjdWxhcl0nXSxcbiAgICBsYXN0ID0gdmFsdWUsXG4gICAgbHZsICA9IDEsXG4gICAgaVxuICA7XG4gIHJldHVybiBmdW5jdGlvbihrZXksIHZhbHVlKSB7XG4gICAgLy8gdGhlIHJlcGxhY2VyIGhhcyByaWdodHMgdG8gZGVjaWRlXG4gICAgLy8gaWYgYSBuZXcgb2JqZWN0IHNob3VsZCBiZSByZXR1cm5lZFxuICAgIC8vIG9yIGlmIHRoZXJlJ3Mgc29tZSBrZXkgdG8gZHJvcFxuICAgIC8vIGxldCdzIGNhbGwgaXQgaGVyZSByYXRoZXIgdGhhbiBcInRvbyBsYXRlXCJcbiAgICBpZiAocmVwbGFjZXIpIHZhbHVlID0gcmVwbGFjZXIuY2FsbCh0aGlzLCBrZXksIHZhbHVlKTtcblxuICAgIC8vIGRpZCB5b3Uga25vdyA/IFNhZmFyaSBwYXNzZXMga2V5cyBhcyBpbnRlZ2VycyBmb3IgYXJyYXlzXG4gICAgLy8gd2hpY2ggbWVhbnMgaWYgKGtleSkgd2hlbiBrZXkgPT09IDAgd29uJ3QgcGFzcyB0aGUgY2hlY2tcbiAgICBpZiAoa2V5ICE9PSAnJykge1xuICAgICAgaWYgKGxhc3QgIT09IHRoaXMpIHtcbiAgICAgICAgaSA9IGx2bCAtIGluZGV4T2YuY2FsbChhbGwsIHRoaXMpIC0gMTtcbiAgICAgICAgbHZsIC09IGk7XG4gICAgICAgIGFsbC5zcGxpY2UobHZsLCBhbGwubGVuZ3RoKTtcbiAgICAgICAgcGF0aC5zcGxpY2UobHZsIC0gMSwgcGF0aC5sZW5ndGgpO1xuICAgICAgICBsYXN0ID0gdGhpcztcbiAgICAgIH1cbiAgICAgIC8vIGNvbnNvbGUubG9nKGx2bCwga2V5LCBwYXRoKTtcbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlKSB7XG4gICAgICAgIGx2bCA9IGFsbC5wdXNoKGxhc3QgPSB2YWx1ZSk7XG4gICAgICAgIGkgPSBpbmRleE9mLmNhbGwoc2VlbiwgdmFsdWUpO1xuICAgICAgICBpZiAoaSA8IDApIHtcbiAgICAgICAgICBpID0gc2Vlbi5wdXNoKHZhbHVlKSAtIDE7XG4gICAgICAgICAgaWYgKHJlc29sdmUpIHtcbiAgICAgICAgICAgIC8vIGtleSBjYW5ub3QgY29udGFpbiBzcGVjaWFsQ2hhciBidXQgY291bGQgYmUgbm90IGEgc3RyaW5nXG4gICAgICAgICAgICBwYXRoLnB1c2goKCcnICsga2V5KS5yZXBsYWNlKHNwZWNpYWxDaGFyUkcsIHNhZmVTcGVjaWFsQ2hhcikpO1xuICAgICAgICAgICAgbWFwcFtpXSA9IHNwZWNpYWxDaGFyICsgcGF0aC5qb2luKHNwZWNpYWxDaGFyKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbWFwcFtpXSA9IG1hcHBbMF07XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhbHVlID0gbWFwcFtpXTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgJiYgcmVzb2x2ZSkge1xuICAgICAgICAgIC8vIGVuc3VyZSBubyBzcGVjaWFsIGNoYXIgaW52b2x2ZWQgb24gZGVzZXJpYWxpemF0aW9uXG4gICAgICAgICAgLy8gaW4gdGhpcyBjYXNlIG9ubHkgZmlyc3QgY2hhciBpcyBpbXBvcnRhbnRcbiAgICAgICAgICAvLyBubyBuZWVkIHRvIHJlcGxhY2UgYWxsIHZhbHVlIChiZXR0ZXIgcGVyZm9ybWFuY2UpXG4gICAgICAgICAgdmFsdWUgPSB2YWx1ZSAucmVwbGFjZShzYWZlU3BlY2lhbENoYXIsIGVzY2FwZWRTYWZlU3BlY2lhbENoYXIpXG4gICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZShzcGVjaWFsQ2hhciwgc2FmZVNwZWNpYWxDaGFyKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdmFsdWU7XG4gIH07XG59XG5cbmZ1bmN0aW9uIHJldHJpZXZlRnJvbVBhdGgoY3VycmVudCwga2V5cykge1xuICBmb3IodmFyIGkgPSAwLCBsZW5ndGggPSBrZXlzLmxlbmd0aDsgaSA8IGxlbmd0aDsgY3VycmVudCA9IGN1cnJlbnRbXG4gICAgLy8ga2V5cyBzaG91bGQgYmUgbm9ybWFsaXplZCBiYWNrIGhlcmVcbiAgICBrZXlzW2krK10ucmVwbGFjZShzYWZlU3BlY2lhbENoYXJSRywgc3BlY2lhbENoYXIpXG4gIF0pO1xuICByZXR1cm4gY3VycmVudDtcbn1cblxuZnVuY3Rpb24gZ2VuZXJhdGVSZXZpdmVyKHJldml2ZXIpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcbiAgICB2YXIgaXNTdHJpbmcgPSB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnO1xuICAgIGlmIChpc1N0cmluZyAmJiB2YWx1ZS5jaGFyQXQoMCkgPT09IHNwZWNpYWxDaGFyKSB7XG4gICAgICByZXR1cm4gbmV3ICRTdHJpbmcodmFsdWUuc2xpY2UoMSkpO1xuICAgIH1cbiAgICBpZiAoa2V5ID09PSAnJykgdmFsdWUgPSByZWdlbmVyYXRlKHZhbHVlLCB2YWx1ZSwge30pO1xuICAgIC8vIGFnYWluLCBvbmx5IG9uZSBuZWVkZWQsIGRvIG5vdCB1c2UgdGhlIFJlZ0V4cCBmb3IgdGhpcyByZXBsYWNlbWVudFxuICAgIC8vIG9ubHkga2V5cyBuZWVkIHRoZSBSZWdFeHBcbiAgICBpZiAoaXNTdHJpbmcpIHZhbHVlID0gdmFsdWUgLnJlcGxhY2Uoc2FmZVN0YXJ0V2l0aFNwZWNpYWxDaGFyUkcsIHNwZWNpYWxDaGFyKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZShlc2NhcGVkU2FmZVNwZWNpYWxDaGFyLCBzYWZlU3BlY2lhbENoYXIpO1xuICAgIHJldHVybiByZXZpdmVyID8gcmV2aXZlci5jYWxsKHRoaXMsIGtleSwgdmFsdWUpIDogdmFsdWU7XG4gIH07XG59XG5cbmZ1bmN0aW9uIHJlZ2VuZXJhdGVBcnJheShyb290LCBjdXJyZW50LCByZXRyaWV2ZSkge1xuICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0gY3VycmVudC5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIGN1cnJlbnRbaV0gPSByZWdlbmVyYXRlKHJvb3QsIGN1cnJlbnRbaV0sIHJldHJpZXZlKTtcbiAgfVxuICByZXR1cm4gY3VycmVudDtcbn1cblxuZnVuY3Rpb24gcmVnZW5lcmF0ZU9iamVjdChyb290LCBjdXJyZW50LCByZXRyaWV2ZSkge1xuICBmb3IgKHZhciBrZXkgaW4gY3VycmVudCkge1xuICAgIGlmIChjdXJyZW50Lmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgIGN1cnJlbnRba2V5XSA9IHJlZ2VuZXJhdGUocm9vdCwgY3VycmVudFtrZXldLCByZXRyaWV2ZSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBjdXJyZW50O1xufVxuXG5mdW5jdGlvbiByZWdlbmVyYXRlKHJvb3QsIGN1cnJlbnQsIHJldHJpZXZlKSB7XG4gIHJldHVybiBjdXJyZW50IGluc3RhbmNlb2YgQXJyYXkgP1xuICAgIC8vIGZhc3QgQXJyYXkgcmVjb25zdHJ1Y3Rpb25cbiAgICByZWdlbmVyYXRlQXJyYXkocm9vdCwgY3VycmVudCwgcmV0cmlldmUpIDpcbiAgICAoXG4gICAgICBjdXJyZW50IGluc3RhbmNlb2YgJFN0cmluZyA/XG4gICAgICAgIChcbiAgICAgICAgICAvLyByb290IGlzIGFuIGVtcHR5IHN0cmluZ1xuICAgICAgICAgIGN1cnJlbnQubGVuZ3RoID9cbiAgICAgICAgICAgIChcbiAgICAgICAgICAgICAgcmV0cmlldmUuaGFzT3duUHJvcGVydHkoY3VycmVudCkgP1xuICAgICAgICAgICAgICAgIHJldHJpZXZlW2N1cnJlbnRdIDpcbiAgICAgICAgICAgICAgICByZXRyaWV2ZVtjdXJyZW50XSA9IHJldHJpZXZlRnJvbVBhdGgoXG4gICAgICAgICAgICAgICAgICByb290LCBjdXJyZW50LnNwbGl0KHNwZWNpYWxDaGFyKVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICkgOlxuICAgICAgICAgICAgcm9vdFxuICAgICAgICApIDpcbiAgICAgICAgKFxuICAgICAgICAgIGN1cnJlbnQgaW5zdGFuY2VvZiBPYmplY3QgP1xuICAgICAgICAgICAgLy8gZGVkaWNhdGVkIE9iamVjdCBwYXJzZXJcbiAgICAgICAgICAgIHJlZ2VuZXJhdGVPYmplY3Qocm9vdCwgY3VycmVudCwgcmV0cmlldmUpIDpcbiAgICAgICAgICAgIC8vIHZhbHVlIGFzIGl0IGlzXG4gICAgICAgICAgICBjdXJyZW50XG4gICAgICAgIClcbiAgICApXG4gIDtcbn1cblxuZnVuY3Rpb24gc3RyaW5naWZ5UmVjdXJzaW9uKHZhbHVlLCByZXBsYWNlciwgc3BhY2UsIGRvTm90UmVzb2x2ZSkge1xuICByZXR1cm4gSlNPTi5zdHJpbmdpZnkodmFsdWUsIGdlbmVyYXRlUmVwbGFjZXIodmFsdWUsIHJlcGxhY2VyLCAhZG9Ob3RSZXNvbHZlKSwgc3BhY2UpO1xufVxuXG5mdW5jdGlvbiBwYXJzZVJlY3Vyc2lvbih0ZXh0LCByZXZpdmVyKSB7XG4gIHJldHVybiBKU09OLnBhcnNlKHRleHQsIGdlbmVyYXRlUmV2aXZlcihyZXZpdmVyKSk7XG59XG50aGlzLnN0cmluZ2lmeSA9IHN0cmluZ2lmeVJlY3Vyc2lvbjtcbnRoaXMucGFyc2UgPSBwYXJzZVJlY3Vyc2lvbjsiLCJcclxuLyoqXHJcbiAqIFRvcG9sb2dpY2FsIHNvcnRpbmcgZnVuY3Rpb25cclxuICpcclxuICogQHBhcmFtIHtBcnJheX0gZWRnZXNcclxuICogQHJldHVybnMge0FycmF5fVxyXG4gKi9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IGZ1bmN0aW9uKGVkZ2VzKXtcclxuICByZXR1cm4gdG9wb3NvcnQodW5pcXVlTm9kZXMoZWRnZXMpLCBlZGdlcylcclxufVxyXG5cclxuZXhwb3J0cy5hcnJheSA9IHRvcG9zb3J0XHJcblxyXG5mdW5jdGlvbiB0b3Bvc29ydChub2RlcywgZWRnZXMpIHtcclxuICB2YXIgY3Vyc29yID0gbm9kZXMubGVuZ3RoXHJcbiAgICAsIHNvcnRlZCA9IG5ldyBBcnJheShjdXJzb3IpXHJcbiAgICAsIHZpc2l0ZWQgPSB7fVxyXG4gICAgLCBpID0gY3Vyc29yXHJcblxyXG4gIHdoaWxlIChpLS0pIHtcclxuICAgIGlmICghdmlzaXRlZFtpXSkgdmlzaXQobm9kZXNbaV0sIGksIFtdKVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHNvcnRlZFxyXG5cclxuICBmdW5jdGlvbiB2aXNpdChub2RlLCBpLCBwcmVkZWNlc3NvcnMpIHtcclxuICAgIGlmKHByZWRlY2Vzc29ycy5pbmRleE9mKG5vZGUpID49IDApIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDeWNsaWMgZGVwZW5kZW5jeTogJytKU09OLnN0cmluZ2lmeShub2RlKSlcclxuICAgIH1cclxuXHJcbiAgICBpZiAodmlzaXRlZFtpXSkgcmV0dXJuO1xyXG4gICAgdmlzaXRlZFtpXSA9IHRydWVcclxuXHJcbiAgICAvLyBvdXRnb2luZyBlZGdlc1xyXG4gICAgdmFyIG91dGdvaW5nID0gZWRnZXMuZmlsdGVyKGZ1bmN0aW9uKGVkZ2Upe1xyXG4gICAgICByZXR1cm4gZWRnZVswXSA9PT0gbm9kZVxyXG4gICAgfSlcclxuICAgIGlmIChpID0gb3V0Z29pbmcubGVuZ3RoKSB7XHJcbiAgICAgIHZhciBwcmVkcyA9IHByZWRlY2Vzc29ycy5jb25jYXQobm9kZSlcclxuICAgICAgZG8ge1xyXG4gICAgICAgIHZhciBjaGlsZCA9IG91dGdvaW5nWy0taV1bMV1cclxuICAgICAgICB2aXNpdChjaGlsZCwgbm9kZXMuaW5kZXhPZihjaGlsZCksIHByZWRzKVxyXG4gICAgICB9IHdoaWxlIChpKVxyXG4gICAgfVxyXG5cclxuICAgIHNvcnRlZFstLWN1cnNvcl0gPSBub2RlXHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiB1bmlxdWVOb2RlcyhhcnIpe1xyXG4gIHZhciByZXMgPSBbXVxyXG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBhcnIubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuICAgIHZhciBlZGdlID0gYXJyW2ldXHJcbiAgICBpZiAocmVzLmluZGV4T2YoZWRnZVswXSkgPCAwKSByZXMucHVzaChlZGdlWzBdKVxyXG4gICAgaWYgKHJlcy5pbmRleE9mKGVkZ2VbMV0pIDwgMCkgcmVzLnB1c2goZWRnZVsxXSlcclxuICB9XHJcbiAgcmV0dXJuIHJlc1xyXG59XHJcbiIsIlxudmFyIHJuZztcblxuaWYgKGdsb2JhbC5jcnlwdG8gJiYgY3J5cHRvLmdldFJhbmRvbVZhbHVlcykge1xuICAvLyBXSEFUV0cgY3J5cHRvLWJhc2VkIFJORyAtIGh0dHA6Ly93aWtpLndoYXR3Zy5vcmcvd2lraS9DcnlwdG9cbiAgLy8gTW9kZXJhdGVseSBmYXN0LCBoaWdoIHF1YWxpdHlcbiAgdmFyIF9ybmRzOCA9IG5ldyBVaW50OEFycmF5KDE2KTtcbiAgcm5nID0gZnVuY3Rpb24gd2hhdHdnUk5HKCkge1xuICAgIGNyeXB0by5nZXRSYW5kb21WYWx1ZXMoX3JuZHM4KTtcbiAgICByZXR1cm4gX3JuZHM4O1xuICB9O1xufVxuXG5pZiAoIXJuZykge1xuICAvLyBNYXRoLnJhbmRvbSgpLWJhc2VkIChSTkcpXG4gIC8vXG4gIC8vIElmIGFsbCBlbHNlIGZhaWxzLCB1c2UgTWF0aC5yYW5kb20oKS4gIEl0J3MgZmFzdCwgYnV0IGlzIG9mIHVuc3BlY2lmaWVkXG4gIC8vIHF1YWxpdHkuXG4gIHZhciAgX3JuZHMgPSBuZXcgQXJyYXkoMTYpO1xuICBybmcgPSBmdW5jdGlvbigpIHtcbiAgICBmb3IgKHZhciBpID0gMCwgcjsgaSA8IDE2OyBpKyspIHtcbiAgICAgIGlmICgoaSAmIDB4MDMpID09PSAwKSByID0gTWF0aC5yYW5kb20oKSAqIDB4MTAwMDAwMDAwO1xuICAgICAgX3JuZHNbaV0gPSByID4+PiAoKGkgJiAweDAzKSA8PCAzKSAmIDB4ZmY7XG4gICAgfVxuXG4gICAgcmV0dXJuIF9ybmRzO1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHJuZztcblxuIiwiLy8gICAgIHV1aWQuanNcbi8vXG4vLyAgICAgQ29weXJpZ2h0IChjKSAyMDEwLTIwMTIgUm9iZXJ0IEtpZWZmZXJcbi8vICAgICBNSVQgTGljZW5zZSAtIGh0dHA6Ly9vcGVuc291cmNlLm9yZy9saWNlbnNlcy9taXQtbGljZW5zZS5waHBcblxuLy8gVW5pcXVlIElEIGNyZWF0aW9uIHJlcXVpcmVzIGEgaGlnaCBxdWFsaXR5IHJhbmRvbSAjIGdlbmVyYXRvci4gIFdlIGZlYXR1cmVcbi8vIGRldGVjdCB0byBkZXRlcm1pbmUgdGhlIGJlc3QgUk5HIHNvdXJjZSwgbm9ybWFsaXppbmcgdG8gYSBmdW5jdGlvbiB0aGF0XG4vLyByZXR1cm5zIDEyOC1iaXRzIG9mIHJhbmRvbW5lc3MsIHNpbmNlIHRoYXQncyB3aGF0J3MgdXN1YWxseSByZXF1aXJlZFxudmFyIF9ybmcgPSByZXF1aXJlKCcuL3JuZycpO1xuXG4vLyBNYXBzIGZvciBudW1iZXIgPC0+IGhleCBzdHJpbmcgY29udmVyc2lvblxudmFyIF9ieXRlVG9IZXggPSBbXTtcbnZhciBfaGV4VG9CeXRlID0ge307XG5mb3IgKHZhciBpID0gMDsgaSA8IDI1NjsgaSsrKSB7XG4gIF9ieXRlVG9IZXhbaV0gPSAoaSArIDB4MTAwKS50b1N0cmluZygxNikuc3Vic3RyKDEpO1xuICBfaGV4VG9CeXRlW19ieXRlVG9IZXhbaV1dID0gaTtcbn1cblxuLy8gKipgcGFyc2UoKWAgLSBQYXJzZSBhIFVVSUQgaW50byBpdCdzIGNvbXBvbmVudCBieXRlcyoqXG5mdW5jdGlvbiBwYXJzZShzLCBidWYsIG9mZnNldCkge1xuICB2YXIgaSA9IChidWYgJiYgb2Zmc2V0KSB8fCAwLCBpaSA9IDA7XG5cbiAgYnVmID0gYnVmIHx8IFtdO1xuICBzLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvWzAtOWEtZl17Mn0vZywgZnVuY3Rpb24ob2N0KSB7XG4gICAgaWYgKGlpIDwgMTYpIHsgLy8gRG9uJ3Qgb3ZlcmZsb3chXG4gICAgICBidWZbaSArIGlpKytdID0gX2hleFRvQnl0ZVtvY3RdO1xuICAgIH1cbiAgfSk7XG5cbiAgLy8gWmVybyBvdXQgcmVtYWluaW5nIGJ5dGVzIGlmIHN0cmluZyB3YXMgc2hvcnRcbiAgd2hpbGUgKGlpIDwgMTYpIHtcbiAgICBidWZbaSArIGlpKytdID0gMDtcbiAgfVxuXG4gIHJldHVybiBidWY7XG59XG5cbi8vICoqYHVucGFyc2UoKWAgLSBDb252ZXJ0IFVVSUQgYnl0ZSBhcnJheSAoYWxhIHBhcnNlKCkpIGludG8gYSBzdHJpbmcqKlxuZnVuY3Rpb24gdW5wYXJzZShidWYsIG9mZnNldCkge1xuICB2YXIgaSA9IG9mZnNldCB8fCAwLCBidGggPSBfYnl0ZVRvSGV4O1xuICByZXR1cm4gIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dICtcbiAgICAgICAgICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXSArICctJyArXG4gICAgICAgICAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV0gKyAnLScgK1xuICAgICAgICAgIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dICsgJy0nICtcbiAgICAgICAgICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXSArICctJyArXG4gICAgICAgICAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV0gK1xuICAgICAgICAgIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dICtcbiAgICAgICAgICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXTtcbn1cblxuLy8gKipgdjEoKWAgLSBHZW5lcmF0ZSB0aW1lLWJhc2VkIFVVSUQqKlxuLy9cbi8vIEluc3BpcmVkIGJ5IGh0dHBzOi8vZ2l0aHViLmNvbS9MaW9zSy9VVUlELmpzXG4vLyBhbmQgaHR0cDovL2RvY3MucHl0aG9uLm9yZy9saWJyYXJ5L3V1aWQuaHRtbFxuXG4vLyByYW5kb20gIydzIHdlIG5lZWQgdG8gaW5pdCBub2RlIGFuZCBjbG9ja3NlcVxudmFyIF9zZWVkQnl0ZXMgPSBfcm5nKCk7XG5cbi8vIFBlciA0LjUsIGNyZWF0ZSBhbmQgNDgtYml0IG5vZGUgaWQsICg0NyByYW5kb20gYml0cyArIG11bHRpY2FzdCBiaXQgPSAxKVxudmFyIF9ub2RlSWQgPSBbXG4gIF9zZWVkQnl0ZXNbMF0gfCAweDAxLFxuICBfc2VlZEJ5dGVzWzFdLCBfc2VlZEJ5dGVzWzJdLCBfc2VlZEJ5dGVzWzNdLCBfc2VlZEJ5dGVzWzRdLCBfc2VlZEJ5dGVzWzVdXG5dO1xuXG4vLyBQZXIgNC4yLjIsIHJhbmRvbWl6ZSAoMTQgYml0KSBjbG9ja3NlcVxudmFyIF9jbG9ja3NlcSA9IChfc2VlZEJ5dGVzWzZdIDw8IDggfCBfc2VlZEJ5dGVzWzddKSAmIDB4M2ZmZjtcblxuLy8gUHJldmlvdXMgdXVpZCBjcmVhdGlvbiB0aW1lXG52YXIgX2xhc3RNU2VjcyA9IDAsIF9sYXN0TlNlY3MgPSAwO1xuXG4vLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2Jyb29mYS9ub2RlLXV1aWQgZm9yIEFQSSBkZXRhaWxzXG5mdW5jdGlvbiB2MShvcHRpb25zLCBidWYsIG9mZnNldCkge1xuICB2YXIgaSA9IGJ1ZiAmJiBvZmZzZXQgfHwgMDtcbiAgdmFyIGIgPSBidWYgfHwgW107XG5cbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgdmFyIGNsb2Nrc2VxID0gb3B0aW9ucy5jbG9ja3NlcSAhPT0gdW5kZWZpbmVkID8gb3B0aW9ucy5jbG9ja3NlcSA6IF9jbG9ja3NlcTtcblxuICAvLyBVVUlEIHRpbWVzdGFtcHMgYXJlIDEwMCBuYW5vLXNlY29uZCB1bml0cyBzaW5jZSB0aGUgR3JlZ29yaWFuIGVwb2NoLFxuICAvLyAoMTU4Mi0xMC0xNSAwMDowMCkuICBKU051bWJlcnMgYXJlbid0IHByZWNpc2UgZW5vdWdoIGZvciB0aGlzLCBzb1xuICAvLyB0aW1lIGlzIGhhbmRsZWQgaW50ZXJuYWxseSBhcyAnbXNlY3MnIChpbnRlZ2VyIG1pbGxpc2Vjb25kcykgYW5kICduc2VjcydcbiAgLy8gKDEwMC1uYW5vc2Vjb25kcyBvZmZzZXQgZnJvbSBtc2Vjcykgc2luY2UgdW5peCBlcG9jaCwgMTk3MC0wMS0wMSAwMDowMC5cbiAgdmFyIG1zZWNzID0gb3B0aW9ucy5tc2VjcyAhPT0gdW5kZWZpbmVkID8gb3B0aW9ucy5tc2VjcyA6IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXG4gIC8vIFBlciA0LjIuMS4yLCB1c2UgY291bnQgb2YgdXVpZCdzIGdlbmVyYXRlZCBkdXJpbmcgdGhlIGN1cnJlbnQgY2xvY2tcbiAgLy8gY3ljbGUgdG8gc2ltdWxhdGUgaGlnaGVyIHJlc29sdXRpb24gY2xvY2tcbiAgdmFyIG5zZWNzID0gb3B0aW9ucy5uc2VjcyAhPT0gdW5kZWZpbmVkID8gb3B0aW9ucy5uc2VjcyA6IF9sYXN0TlNlY3MgKyAxO1xuXG4gIC8vIFRpbWUgc2luY2UgbGFzdCB1dWlkIGNyZWF0aW9uIChpbiBtc2VjcylcbiAgdmFyIGR0ID0gKG1zZWNzIC0gX2xhc3RNU2VjcykgKyAobnNlY3MgLSBfbGFzdE5TZWNzKS8xMDAwMDtcblxuICAvLyBQZXIgNC4yLjEuMiwgQnVtcCBjbG9ja3NlcSBvbiBjbG9jayByZWdyZXNzaW9uXG4gIGlmIChkdCA8IDAgJiYgb3B0aW9ucy5jbG9ja3NlcSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgY2xvY2tzZXEgPSBjbG9ja3NlcSArIDEgJiAweDNmZmY7XG4gIH1cblxuICAvLyBSZXNldCBuc2VjcyBpZiBjbG9jayByZWdyZXNzZXMgKG5ldyBjbG9ja3NlcSkgb3Igd2UndmUgbW92ZWQgb250byBhIG5ld1xuICAvLyB0aW1lIGludGVydmFsXG4gIGlmICgoZHQgPCAwIHx8IG1zZWNzID4gX2xhc3RNU2VjcykgJiYgb3B0aW9ucy5uc2VjcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgbnNlY3MgPSAwO1xuICB9XG5cbiAgLy8gUGVyIDQuMi4xLjIgVGhyb3cgZXJyb3IgaWYgdG9vIG1hbnkgdXVpZHMgYXJlIHJlcXVlc3RlZFxuICBpZiAobnNlY3MgPj0gMTAwMDApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3V1aWQudjEoKTogQ2FuXFwndCBjcmVhdGUgbW9yZSB0aGFuIDEwTSB1dWlkcy9zZWMnKTtcbiAgfVxuXG4gIF9sYXN0TVNlY3MgPSBtc2VjcztcbiAgX2xhc3ROU2VjcyA9IG5zZWNzO1xuICBfY2xvY2tzZXEgPSBjbG9ja3NlcTtcblxuICAvLyBQZXIgNC4xLjQgLSBDb252ZXJ0IGZyb20gdW5peCBlcG9jaCB0byBHcmVnb3JpYW4gZXBvY2hcbiAgbXNlY3MgKz0gMTIyMTkyOTI4MDAwMDA7XG5cbiAgLy8gYHRpbWVfbG93YFxuICB2YXIgdGwgPSAoKG1zZWNzICYgMHhmZmZmZmZmKSAqIDEwMDAwICsgbnNlY3MpICUgMHgxMDAwMDAwMDA7XG4gIGJbaSsrXSA9IHRsID4+PiAyNCAmIDB4ZmY7XG4gIGJbaSsrXSA9IHRsID4+PiAxNiAmIDB4ZmY7XG4gIGJbaSsrXSA9IHRsID4+PiA4ICYgMHhmZjtcbiAgYltpKytdID0gdGwgJiAweGZmO1xuXG4gIC8vIGB0aW1lX21pZGBcbiAgdmFyIHRtaCA9IChtc2VjcyAvIDB4MTAwMDAwMDAwICogMTAwMDApICYgMHhmZmZmZmZmO1xuICBiW2krK10gPSB0bWggPj4+IDggJiAweGZmO1xuICBiW2krK10gPSB0bWggJiAweGZmO1xuXG4gIC8vIGB0aW1lX2hpZ2hfYW5kX3ZlcnNpb25gXG4gIGJbaSsrXSA9IHRtaCA+Pj4gMjQgJiAweGYgfCAweDEwOyAvLyBpbmNsdWRlIHZlcnNpb25cbiAgYltpKytdID0gdG1oID4+PiAxNiAmIDB4ZmY7XG5cbiAgLy8gYGNsb2NrX3NlcV9oaV9hbmRfcmVzZXJ2ZWRgIChQZXIgNC4yLjIgLSBpbmNsdWRlIHZhcmlhbnQpXG4gIGJbaSsrXSA9IGNsb2Nrc2VxID4+PiA4IHwgMHg4MDtcblxuICAvLyBgY2xvY2tfc2VxX2xvd2BcbiAgYltpKytdID0gY2xvY2tzZXEgJiAweGZmO1xuXG4gIC8vIGBub2RlYFxuICB2YXIgbm9kZSA9IG9wdGlvbnMubm9kZSB8fCBfbm9kZUlkO1xuICBmb3IgKHZhciBuID0gMDsgbiA8IDY7IG4rKykge1xuICAgIGJbaSArIG5dID0gbm9kZVtuXTtcbiAgfVxuXG4gIHJldHVybiBidWYgPyBidWYgOiB1bnBhcnNlKGIpO1xufVxuXG4vLyAqKmB2NCgpYCAtIEdlbmVyYXRlIHJhbmRvbSBVVUlEKipcblxuLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9icm9vZmEvbm9kZS11dWlkIGZvciBBUEkgZGV0YWlsc1xuZnVuY3Rpb24gdjQob3B0aW9ucywgYnVmLCBvZmZzZXQpIHtcbiAgLy8gRGVwcmVjYXRlZCAtICdmb3JtYXQnIGFyZ3VtZW50LCBhcyBzdXBwb3J0ZWQgaW4gdjEuMlxuICB2YXIgaSA9IGJ1ZiAmJiBvZmZzZXQgfHwgMDtcblxuICBpZiAodHlwZW9mKG9wdGlvbnMpID09ICdzdHJpbmcnKSB7XG4gICAgYnVmID0gb3B0aW9ucyA9PSAnYmluYXJ5JyA/IG5ldyBBcnJheSgxNikgOiBudWxsO1xuICAgIG9wdGlvbnMgPSBudWxsO1xuICB9XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gIHZhciBybmRzID0gb3B0aW9ucy5yYW5kb20gfHwgKG9wdGlvbnMucm5nIHx8IF9ybmcpKCk7XG5cbiAgLy8gUGVyIDQuNCwgc2V0IGJpdHMgZm9yIHZlcnNpb24gYW5kIGBjbG9ja19zZXFfaGlfYW5kX3Jlc2VydmVkYFxuICBybmRzWzZdID0gKHJuZHNbNl0gJiAweDBmKSB8IDB4NDA7XG4gIHJuZHNbOF0gPSAocm5kc1s4XSAmIDB4M2YpIHwgMHg4MDtcblxuICAvLyBDb3B5IGJ5dGVzIHRvIGJ1ZmZlciwgaWYgcHJvdmlkZWRcbiAgaWYgKGJ1Zikge1xuICAgIGZvciAodmFyIGlpID0gMDsgaWkgPCAxNjsgaWkrKykge1xuICAgICAgYnVmW2kgKyBpaV0gPSBybmRzW2lpXTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYnVmIHx8IHVucGFyc2Uocm5kcyk7XG59XG5cbi8vIEV4cG9ydCBwdWJsaWMgQVBJXG52YXIgdXVpZCA9IHY0O1xudXVpZC52MSA9IHYxO1xudXVpZC52NCA9IHY0O1xudXVpZC5wYXJzZSA9IHBhcnNlO1xudXVpZC51bnBhcnNlID0gdW5wYXJzZTtcblxubW9kdWxlLmV4cG9ydHMgPSB1dWlkO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBbICdDTScsICdub2RlU2VydmljZScsICggQ00sIG5vZGVTZXJ2aWNlICkgPT4ge1xuXG4gICBmdW5jdGlvbiBsaW5rKCAkc2NvcGUsICRlbGVtZW50LCAkYXR0cnMgKSB7XG5cbiAgICAgIHZhciBjbSA9IENNLmNyZWF0ZSggJGVsZW1lbnRbIDAgXSwge1xuICAgICAgICAgbW9kZTogJ2phdmFzY3JpcHQnLFxuICAgICAgICAgdGhlbWU6ICdlbGVnYW50JyxcbiAgICAgICAgIGxpbmVOdW1iZXJzOiB0cnVlLFxuICAgICAgICAgbGluZVdyYXBwaW5nOiB0cnVlLFxuICAgICAgICAgdGFiU2l6ZTogM1xuICAgICAgfSApO1xuXG4gICAgICBjbS5zZXRTaXplKCAnMTAwJScsIDUwMCApO1xuICAgICAgY20ub24oICdjaGFuZ2UnLCAoKSA9PiB7XG4gICAgICAgICB2YXIgbm9kZSA9IG5vZGVTZXJ2aWNlLmdldFNlbGVjdGVkTm9kZSgpO1xuICAgICAgICAgaWYgKCBub2RlICkge1xuICAgICAgICAgICAgbm9kZS5fZm5zdHIgPSBjbS5nZXRWYWx1ZSgpO1xuICAgICAgICAgICAgY20uY2xlYXJIaXN0b3J5KCk7XG4gICAgICAgICB9XG4gICAgICB9ICk7XG5cbiAgIH1cblxuICAgcmV0dXJuIHtcblxuICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgIHJlcGxhY2U6IHRydWUsXG4gICAgICB0ZW1wbGF0ZTogJzx0ZXh0YXJlYT48L3RleHRhcmVhPicsXG4gICAgICBsaW5rXG5cbiAgIH07XG5cbn0gXTtcbiIsIm1vZHVsZS5leHBvcnRzID0gWyAoKSA9PiB7XG5cbiAgIHZhciBpbnN0YW5jZSA9IG51bGw7XG5cbiAgIGZ1bmN0aW9uIGdldEluc3RhbmNlKCkge1xuICAgICAgcmV0dXJuIGluc3RhbmNlO1xuICAgfVxuXG4gICBmdW5jdGlvbiBjcmVhdGUoIHRleHRhcmVhLCBvcHRzICkge1xuICAgICAgaW5zdGFuY2UgPSBDb2RlTWlycm9yLmZyb21UZXh0QXJlYSggdGV4dGFyZWEsIG9wdHMgKTtcbiAgICAgIHJldHVybiBpbnN0YW5jZTtcbiAgIH1cblxuICAgcmV0dXJuIHtcbiAgICAgIGdldEluc3RhbmNlLFxuICAgICAgY3JlYXRlXG4gICB9O1xuXG59IF07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFsgKCkgPT4ge1xuXG4gICByZXR1cm4gaW5wdXQgPT4ge1xuICAgICAgcmV0dXJuIENKU09OLnN0cmluZ2lmeSggaW5wdXQsIG51bGwsIDIgKTtcbiAgIH07XG5cbn0gXTtcbiIsIm1vZHVsZS5leHBvcnRzID0gWyBmdW5jdGlvbiAoKSB7XG5cbiAgIHZhciBkZWJ1Z0VuYWJsZWQgPSBmYWxzZTtcbiAgIHZhciBkZWJ1Z05hbWVzcGFjZXMgPSBbXTtcblxuICAgdGhpcy5lbmFibGVEZWJ1ZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGRlYnVnRW5hYmxlZCA9IHRydWU7XG4gICB9O1xuXG4gICB0aGlzLmVuYWJsZURlYnVnTmFtZXNwYWNlID0gZnVuY3Rpb24gKCkge1xuICAgICAgZm9yICggbGV0IGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSArKyApIHtcbiAgICAgICAgIGRlYnVnTmFtZXNwYWNlcy5wdXNoKCBhcmd1bWVudHNbIGkgXSApO1xuICAgICAgfVxuICAgfTtcblxuICAgdGhpcy4kZ2V0ID0gKCkgPT4ge1xuXG4gICAgICBmdW5jdGlvbiBkZWJ1ZygpIHtcbiAgICAgICAgIGlmICggIWRlYnVnRW5hYmxlZCApIHJldHVybjtcbiAgICAgICAgIGlmICggZGVidWdOYW1lc3BhY2VzLmluZGV4T2YoIGFyZ3VtZW50c1sgMCBdICkgIT09IC0xICkge1xuICAgICAgICAgICAgY29uc29sZS5sb2cuYXBwbHkoIGNvbnNvbGUsIGFyZ3VtZW50cyApO1xuICAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4ge1xuICAgICAgICAgZGVidWdcbiAgICAgIH07XG5cbiAgIH07XG5cbn0gXTtcbiIsIm1vZHVsZS5leHBvcnRzID0gWyAnQ1RYTScsICckcm9vdFNjb3BlJywgKCBDVFhNLCAkcm9vdFNjb3BlICkgPT4ge1xuXG4gICBmdW5jdGlvbiBjb250cm9sbGVyKCAkc2NvcGUsICRlbGVtZW50LCAkYXR0cnMgKSB7XG5cbiAgICAgIHZhciBoYW5kbGVyID0gJCggJGF0dHJzLmhhbmRsZXIgKTtcblxuICAgICAgJCggJyNub2RlQ2FudmFzJyApLm9uKCAnY29udGV4dG1lbnUnLCBlID0+IHtcbiAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIH0gKTtcbiAgICAgICQoICdib2R5JyApLm9uKCAnbW91c2Vkb3duJywgZSA9PiB7XG4gICAgICAgICBjbG9zZSgpO1xuICAgICAgfSApO1xuXG4gICAgICAkZWxlbWVudC5vbiggJ21vdXNlZG93bicsIGUgPT4ge1xuICAgICAgICAgLy8gc3RvcCBidWJibGluZyB1cCB0byBib2R5IHNvIGl0IGRvZXNudCBjbG9zdCBiZWZvcmUgbmcgY2xpY2tcbiAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICB9IClcbiAgICAgIC5vbiggJ2NsaWNrJywgZSA9PiB7XG4gICAgICAgICBjbG9zZSgpO1xuICAgICAgfSApXG4gICAgICAub24oICdjb250ZXh0bWVudScsIGUgPT4gZS5wcmV2ZW50RGVmYXVsdCgpICk7XG5cbiAgICAgIC8qIGV4YW1wbGVcbiAgICAgICRzY29wZS5tZW51ID0gW1xuICAgICAgICAgeyBuYW1lOiAnQWRkIElucHV0JywgZm46ICgpID0+IGNvbnNvbGUubG9nKCAnQWRkIElucHV0JyApIH0sXG4gICAgICBdO1xuICAgICAgKi9cblxuICAgICAgJHJvb3RTY29wZS4kb24oICdtZW51Lm9wZW4nLCAoIGJyb2FkQ2FzdEV2ZW50LCBkYXRhICkgPT4ge1xuICAgICAgICAgb3BlbiggZGF0YS5ldmVudCwgZGF0YS5tZW51ICk7XG4gICAgICB9ICk7XG5cbiAgICAgIGZ1bmN0aW9uIG9wZW4oIGUsIG1lbnUgKSB7XG4gICAgICAgICAkc2NvcGUubWVudSA9IG1lbnU7XG4gICAgICAgICAkZWxlbWVudC5jc3MoIHsgdG9wOiBlLmNsaWVudFksIGxlZnQ6IGUuY2xpZW50WCB9ICk7XG4gICAgICAgICAkc2NvcGUuYWN0aXZlID0gdHJ1ZTtcbiAgICAgICAgICRzY29wZS4kZGlnZXN0KCk7XG4gICAgICB9XG4gICAgICBmdW5jdGlvbiBjbG9zZSAoKSB7XG4gICAgICAgICBpZiAoICEkc2NvcGUuYWN0aXZlICkgcmV0dXJuO1xuICAgICAgICAgJHNjb3BlLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICAgJHNjb3BlLiRkaWdlc3QoKTtcbiAgICAgIH1cblxuICAgfVxuXG4gICByZXR1cm4ge1xuXG4gICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgcmVwbGFjZTogdHJ1ZSxcbiAgICAgIHNjb3BlOiB7fSxcbiAgICAgIHRlbXBsYXRlVXJsOiAnLi9zcmMvY29udGV4dE1lbnUuaHRtbCcsXG4gICAgICBjb250cm9sbGVyXG5cbiAgIH07XG5cbn0gXTtcbiIsIm1vZHVsZS5leHBvcnRzICA9IFsgJyRyb290U2NvcGUnLCAoICRyb290U2NvcGUgKSA9PiB7XG5cbiAgIHJldHVybiB7XG5cblxuICAgfTtcblxufSBdO1xuIiwiZ2xvYmFsLlVVSUQgPSByZXF1aXJlKCAndXVpZCcgKTtcbmdsb2JhbC5UT1BPU09SVCA9IHJlcXVpcmUoICd0b3Bvc29ydCcgKTtcbmdsb2JhbC5DSlNPTiA9IHJlcXVpcmUoICdjaXJjdWxhci1qc29uJyApO1xuXG5hbmd1bGFyLm1vZHVsZSggJ25vZGVBcHAnLCBbXSApXG5cdC5maWx0ZXIoICdjanNvbicsIHJlcXVpcmUoICcuL2NvbW1vbi9janNvbi5maWx0ZXInICkgKVxuXHQucHJvdmlkZXIoICdsb2cnLCByZXF1aXJlKCAnLi9jb21tb24vbG9nLnByb3ZpZGVyJyApIClcblxuXHQuc2VydmljZSggJ3VwZGF0ZUxpbmtFdmVudCcsIHJlcXVpcmUoICcuL3h4L3NlcnZpY2VzL2V2ZW50cy91cGRhdGVMaW5rRXZlbnQnICkgKVxuXG5cdC5mYWN0b3J5KCAnbm9kZVNlcnZpY2UnLCByZXF1aXJlKCAnLi94eC9zZXJ2aWNlcy94eFNlcnZpY2UnICkgKVxuXHQuZmFjdG9yeSggJ25vZGVGYWN0b3J5JywgcmVxdWlyZSggJy4veHgvc2VydmljZXMveHhGYWN0b3J5JyApIClcblx0LmZhY3RvcnkoICdub2RlRXZlbnQnLCByZXF1aXJlKCAnLi94eC9zZXJ2aWNlcy94eEV2ZW50JyApIClcblxuXHQuY29udHJvbGxlciggJ3h4Q3RybCcsIHJlcXVpcmUoICcuL3h4L2NvbnRyb2xsZXJzL3h4LmN0cmwnICkgKVxuXHQuZGlyZWN0aXZlKCAneHhCb2R5JywgcmVxdWlyZSggJy4veHgvZGlyZWN0aXZlcy94eEJvZHkuZGlyJyApIClcblx0LmRpcmVjdGl2ZSggJ3h4SW50ZXJmYWNlJywgcmVxdWlyZSggJy4veHgvZGlyZWN0aXZlcy94eEludGVyZmFjZS5kaXInICkgKVxuXHQuZGlyZWN0aXZlKCAneHhMYWJlbCcsIHJlcXVpcmUoICcuL3h4L2RpcmVjdGl2ZXMveHhMYWJlbC5kaXInICkgKVxuXHQuZGlyZWN0aXZlKCAneHhDb25uZWN0b3InLCByZXF1aXJlKCAnLi94eC9kaXJlY3RpdmVzL3h4Q29ubmVjdG9yLmRpcicgKSApXG5cdC5kaXJlY3RpdmUoICd4eExpbmsnLCByZXF1aXJlKCAnLi94eC9kaXJlY3RpdmVzL3h4TGluay5kaXInICkgKVxuXHQuZGlyZWN0aXZlKCAneHhUZW1wTGluaycsIHJlcXVpcmUoICcuL3h4L2RpcmVjdGl2ZXMveHhUZW1wTGluay5kaXInICkgKVxuXHQuZGlyZWN0aXZlKCAneHhTb3J0YWJsZScsIHJlcXVpcmUoICcuL3h4L2RpcmVjdGl2ZXMveHhTb3J0YWJsZS5kaXInICkgKVxuXHQuZGlyZWN0aXZlKCAneHhTb3J0SXRlbScsIHJlcXVpcmUoICcuL3h4L2RpcmVjdGl2ZXMveHhTb3J0SXRlbS5kaXInICkgKVxuXHQuZGlyZWN0aXZlKCAneHhTZWxlY3RhYmxlJywgcmVxdWlyZSggJy4veHgvZGlyZWN0aXZlcy94eFNlbGVjdGFibGUuZGlyJyApIClcblx0LmRpcmVjdGl2ZSggJ3N2Z0RyYWdnYWJsZScsIHJlcXVpcmUoICcuL3h4L2RpcmVjdGl2ZXMvc3ZnRHJhZ2dhYmxlLmRpcicgKSApXG5cdC5kaXJlY3RpdmUoICdzdmdab29tYWJsZScsIHJlcXVpcmUoICcuL3h4L2RpcmVjdGl2ZXMvc3ZnWm9vbWFibGUuZGlyJyApIClcblxuXHQuZmFjdG9yeSggJ0NNJywgcmVxdWlyZSggJy4vY29kZU1pcnJvci5zZXJ2aWNlJyApIClcblx0LmRpcmVjdGl2ZSggJ2NvZGVNaXJyb3InLCByZXF1aXJlKCAnLi9jb2RlTWlycm9yLmRpcicgKSApXG5cblx0LmZhY3RvcnkoICdDVFhNJywgcmVxdWlyZSggJy4vY29udGV4dE1lbnUuc2VydmljZScgKSApXG5cdC5kaXJlY3RpdmUoICdjb250ZXh0TWVudScsIHJlcXVpcmUoICcuL2NvbnRleHRNZW51LmRpcicgKSApXG5cblx0LmNvbmZpZyggWyAnbG9nUHJvdmlkZXInLCAoIGxvZ1Byb3ZpZGVyICkgPT4ge1xuXG5cdFx0bG9nUHJvdmlkZXIuZW5hYmxlRGVidWcoKTtcblx0XHQvLyBsb2dQcm92aWRlci5lbmFibGVEZWJ1Z05hbWVzcGFjZSggJ1Njb3BlJyApO1xuXG5cdH0gXSApXG5cdDtcbiIsIlxubW9kdWxlLmV4cG9ydHMgPSBbICdsb2cnLCAnJHNjb3BlJywgJyRyb290U2NvcGUnLCAnbm9kZVNlcnZpY2UnLCAnQ00nLCAoIGxvZywgJHNjb3BlLCAkcm9vdFNjb3BlLCBub2RlU2VydmljZSwgQ00gKSA9PiB7XG5cbiAgIGdsb2JhbC5TQ09QRSA9ICRzY29wZTtcbiAgICRzY29wZS5ub2RlU2VydmljZSA9IG5vZGVTZXJ2aWNlO1xuICAgJHNjb3BlLkNNID0gQ007XG5cbiAgICRzY29wZS5ydW4gPSAoKSA9PiB7XG4gICAgICBub2RlU2VydmljZS5ydW4oKTtcbiAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgIH07XG5cbiAgIC8vIHRvZG8gYWRkIC8gcmVtb3ZlIGlucHV0LCB3aGVuIGFkZC9yZW1vdmUgaW5wdXQgcnVuIGFwcGx5IHRoaXMgc2NvcGUhXG4gICAvLyB3ZWJhdWRpb1xuXG4gICBsb2cuZGVidWcoICdTY29wZScsICRzY29wZS4kaWQsICdOb2RlQ3RybCcsICRzY29wZSApO1xuXG59IF07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFsgJ2xvZycsICggbG9nICkgPT4ge1xuXG4gICBmdW5jdGlvbiBjb250cm9sbGVyKCAkc2NvcGUsICRlbGVtZW50LCAkYXR0cnMgKSB7XG5cbiAgICAgIGlmICggISRlbGVtZW50LmF0dHIoICd0cmFuc2Zvcm0nICkgKSB7XG4gICAgICAgICAkZWxlbWVudC5hdHRyKCAndHJhbnNmb3JtJywgJ21hdHJpeCgxLDAsMCwxLDAsMCknICk7XG4gICAgICB9XG5cbiAgICAgIHZhciBkaXNhYmxlZCA9IGZhbHNlO1xuICAgICAgdmFyIGRyYWdnaW5nID0gZmFsc2U7XG4gICAgICB2YXIgbW91c2Vob2xkID0gZmFsc2U7XG4gICAgICB2YXIgcHJldlBvcyA9IHsgeDogbnVsbCwgeTogbnVsbCB9O1xuICAgICAgdmFyIGN1cnJQb3MgPSB7IHg6IG51bGwsIHk6IG51bGwgfTtcblxuICAgICAgdmFyIG51bVBhdHRlcm4gPSAvW1xcZHxcXC58XFwrfC1dKy9nO1xuICAgICAgdmFyIG1hdCA9ICRlbGVtZW50LmF0dHIoICd0cmFuc2Zvcm0nICk7XG4gICAgICBtYXQgPSBtYXQubWF0Y2goIG51bVBhdHRlcm4gKS5tYXAoIHYgPT4gcGFyc2VGbG9hdCggdiApICk7XG5cbiAgICAgIC8vIHRvZG8gaWYgYXRycy50cmFuc2Zvcm1cbiAgICAgIHRoaXMucG9zaXRpb24gPSB7IHg6IDAsIHk6IDAgfTtcbiAgICAgIHRoaXMucG9zaXRpb24ueCA9IG1hdFsgNCBdO1xuICAgICAgdGhpcy5wb3NpdGlvbi55ID0gbWF0WyA1IF07XG5cbiAgICAgIHZhciBoYW5kbGVyID0gJGF0dHJzLmhhbmRsZXIgPyAkYXR0cnMuaGFuZGxlciA6ICRlbGVtZW50O1xuXG4gICAgICB2YXIgZHJhZ0V2ZW50Rm4gPSBbXTtcblxuICAgICAgJCggaGFuZGxlciApXG4gICAgICAub24oICdtb3VzZWRvd24nLCBlID0+IHtcblxuICAgICAgICAgaWYgKCBkaXNhYmxlZCApIHJldHVybjtcbiAgICAgICAgIG1vdXNlaG9sZCA9IHRydWU7XG4gICAgICAgICBwcmV2UG9zLnggPSBlLnBhZ2VYO1xuICAgICAgICAgcHJldlBvcy55ID0gZS5wYWdlWTtcblxuICAgICAgICAgbWF0ID0gJGVsZW1lbnQuYXR0ciggJ3RyYW5zZm9ybScgKTtcbiAgICAgICAgIG1hdCA9IG1hdC5tYXRjaCggbnVtUGF0dGVybiApLm1hcCggdiA9PiBwYXJzZUZsb2F0KCB2ICkgKTtcblxuICAgICAgfSApO1xuXG4gICAgICAkKCAnYm9keScgKVxuICAgICAgLm9uKCAnbW91c2V1cCcsIGUgPT4ge1xuXG4gICAgICAgICBpZiAoIGRpc2FibGVkICkgcmV0dXJuO1xuICAgICAgICAgbW91c2Vob2xkID0gZmFsc2U7XG5cbiAgICAgIH0gKVxuICAgICAgLm9uKCAnbW91c2Vtb3ZlJywgZSA9PiB7XG5cbiAgICAgICAgIGlmICggZGlzYWJsZWQgKSByZXR1cm47XG5cbiAgICAgICAgIGlmICggbW91c2Vob2xkICkge1xuXG4gICAgICAgICAgICBkcmFnZ2luZyA9IHRydWU7XG5cbiAgICAgICAgICAgIGN1cnJQb3MueCA9IGUucGFnZVg7XG4gICAgICAgICAgICBjdXJyUG9zLnkgPSBlLnBhZ2VZO1xuXG4gICAgICAgICAgICB2YXIgZHggPSAoIGN1cnJQb3MueCAtIHByZXZQb3MueCApIC8gdGhpcy5zY2FsaW5nRmFjdG9yO1xuICAgICAgICAgICAgdmFyIGR5ID0gKCBjdXJyUG9zLnkgLSBwcmV2UG9zLnkgKSAvIHRoaXMuc2NhbGluZ0ZhY3RvcjtcblxuICAgICAgICAgICAgdmFyIG5ld1ggPSBtYXRbIDQgXSArIGR4O1xuICAgICAgICAgICAgdmFyIG5ld1kgPSBtYXRbIDUgXSArIGR5O1xuXG4gICAgICAgICAgICB0aGlzLnBvc2l0aW9uLnggPSBuZXdYO1xuICAgICAgICAgICAgdGhpcy5wb3NpdGlvbi55ID0gbmV3WTtcblxuICAgICAgICAgICAgJGVsZW1lbnQuYXR0ciggJ3RyYW5zZm9ybScsIGBtYXRyaXgoJHttYXRbMF19LCR7bWF0WzFdfSwke21hdFsyXX0sJHttYXRbM119LCR7bmV3WH0sJHtuZXdZfSlgICk7XG5cbiAgICAgICAgICAgIGlmICggZHJhZ0V2ZW50Rm4ubGVuZ3RoICkge1xuICAgICAgICAgICAgICAgZHJhZ0V2ZW50Rm4uZm9yRWFjaCggZm4gPT4gZm4oKSApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICB9XG5cbiAgICAgIH0gKTtcblxuICAgICAgdGhpcy5zY2FsaW5nRmFjdG9yID0gMS4wO1xuICAgICAgdGhpcy5kaXNhYmxlRHJhZyA9ICgpID0+IGRpc2FibGVkID0gdHJ1ZTtcbiAgICAgIHRoaXMuZW5hYmxlRHJhZyA9ICgpID0+IGRpc2FibGVkID0gZmFsc2U7XG4gICAgICB0aGlzLmFkZERyYWdFdmVudCA9IGZuID0+IHtcbiAgICAgICAgIGRyYWdFdmVudEZuLnB1c2goIGZuICk7XG4gICAgICB9O1xuXG4gICAgICB0aGlzLmdldFBvc2l0aW9uID0gKCkgPT4ge1xuICAgICAgICAgbWF0ID0gJGVsZW1lbnQuYXR0ciggJ3RyYW5zZm9ybScgKTtcbiAgICAgICAgIG1hdCA9IG1hdC5tYXRjaCggbnVtUGF0dGVybiApLm1hcCggdiA9PiBwYXJzZUZsb2F0KCB2ICkgKTtcbiAgICAgICAgIHJldHVybiB7IHg6IG1hdFsgNCBdLCB5OiBtYXRbIDUgXSB9O1xuICAgICAgfTtcblxuICAgICAgbG9nLmRlYnVnKCAnU2NvcGUnLCAkc2NvcGUuJGlkLCAnUGFubmFibGUnLCAkc2NvcGUgKTtcblxuICAgfVxuXG4gICByZXR1cm4ge1xuXG4gICAgICByZXN0cmljdDogJ0EnLFxuICAgICAgY29udHJvbGxlclxuXG4gICB9O1xuXG59IF07XG4iLCIvLyBqc2hpbnQgLVcwMTRcbm1vZHVsZS5leHBvcnRzID0gWyAnbG9nJywgKCBsb2cgKSA9PiB7XG5cbiAgIGZ1bmN0aW9uIGNvbnRyb2xsZXIoICRzY29wZSwgJGVsZW1lbnQsICRhdHRycyApIHtcblxuICAgICAgdGhpcy5zY2FsaW5nRmFjdG9yID0gMi4wO1xuXG4gICAgICBpZiAoICEkZWxlbWVudC5hdHRyKCAndHJhbnNmb3JtJyApICkge1xuICAgICAgICAgJGVsZW1lbnQuYXR0ciggJ3RyYW5zZm9ybScsICdtYXRyaXgoMSwwLDAsMSwwLDApJyApO1xuICAgICAgICAgdGhpcy5zY2FsaW5nRmFjdG9yID0gMS4wO1xuICAgICAgfVxuXG4gICAgICB2YXIgbnVtUGF0dGVybiA9IC9bXFxkfFxcLnxcXCt8LV0rL2c7XG4gICAgICB2YXIgaGFuZGxlciA9ICQoICRhdHRycy5oYW5kbGVyICk7XG4gICAgICBoYW5kbGVyLm9uKCAnbW91c2V3aGVlbCcsIGUgPT4ge1xuXG4gICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICB2YXIgbWF0ID0gJGVsZW1lbnQuYXR0ciggJ3RyYW5zZm9ybScgKS5tYXRjaCggbnVtUGF0dGVybiApLm1hcCggdiA9PiBwYXJzZUZsb2F0KCB2ICkgKTtcbiAgICAgICAgIHZhciBnYWluID0gMi4wXG4gICAgICAgICAsIG1pbnogPSAwLjI1XG4gICAgICAgICAsIG1heHogPSAxMC4wXG4gICAgICAgICAsIGRkID0gZ2FpbiAqIE1hdGguc2lnbiggZS5vcmlnaW5hbEV2ZW50ID8gZS5vcmlnaW5hbEV2ZW50LndoZWVsRGVsdGFZIDogMC4wICkgKiAwLjFcblxuICAgICAgICAgLCBzcyA9IG1hdFsgMCBdICsgKCBtYXRbIDAgXSAqIGRkIClcbiAgICAgICAgICwgc2QgPSBzcyAvIG1hdFsgMCBdXG4gICAgICAgICAsIG94ID0gZS5wYWdlWCAtIGhhbmRsZXIub2Zmc2V0KCkubGVmdFxuICAgICAgICAgLCBveSA9IGUucGFnZVkgLSBoYW5kbGVyLm9mZnNldCgpLnRvcFxuICAgICAgICAgLCBjeCA9IG1hdFsgNCBdXG4gICAgICAgICAsIGN5ID0gbWF0WyA1IF1cbiAgICAgICAgICwgeHggPSBzZCAqICggY3ggLSBveCApICsgb3hcbiAgICAgICAgICwgeXkgPSBzZCAqICggY3kgLSBveSApICsgb3lcbiAgICAgICAgIDtcblxuICAgICAgICAgaWYgKCBzcyA8IG1pbnogfHwgc3MgPiBtYXh6ICkgcmV0dXJuO1xuXG4gICAgICAgICAkZWxlbWVudC5hdHRyKCAndHJhbnNmb3JtJywgYG1hdHJpeCgke3NzfSwke21hdFsxXX0sJHttYXRbMl19LCR7c3N9LCR7eHh9LCR7eXl9KWAgKTtcblxuICAgICAgICAgJHNjb3BlLiRicm9hZGNhc3QoICd6b29tZWQnLCBzcywgeHgsIHl5ICk7XG4gICAgICAgICB0aGlzLnNjYWxpbmdGYWN0b3IgPSBzcztcblxuICAgICAgfSApO1xuXG4gICAgICBsb2cuZGVidWcoICdTY29wZScsICRzY29wZS4kaWQsICdab29tYWJsZScsICRzY29wZSApO1xuXG4gICB9XG5cbiAgIHJldHVybiB7XG5cbiAgICAgIHJlc3RyaWN0OiAnQScsXG4gICAgICBjb250cm9sbGVyXG5cbiAgIH07XG5cbn0gXTtcbiIsIm1vZHVsZS5leHBvcnRzID0gWyAnbG9nJywgJ3VwZGF0ZUxpbmtFdmVudCcsICggbG9nLCB1cGRhdGVMaW5rRXZlbnQgKSA9PiB7XG5cbiAgIGZ1bmN0aW9uIGxpbmsoICRzY29wZSwgJGVsZW1lbnQsICRhdHRycywgJGNvbnRyb2xsZXJzICkge1xuXG4gICAgICB2YXIgc3ZnRHJhZ2dhYmxlQ3RybCA9ICRjb250cm9sbGVyc1sgMCBdO1xuICAgICAgdmFyIHN2Z1pvb21hYmxlQ3RybCA9ICRjb250cm9sbGVyc1sgMSBdO1xuXG4gICAgICBzdmdEcmFnZ2FibGVDdHJsLmFkZERyYWdFdmVudCggKCkgPT4ge1xuXG4gICAgICAgICAkc2NvcGUuJGJyb2FkY2FzdCggJ2Nvbm5lY3Rpb25OZWVkc1VwZGF0ZScgKTtcbiAgICAgICAgIHVwZGF0ZUxpbmtFdmVudC5icm9hZGNhc3QoKTtcblxuICAgICAgfSApO1xuXG4gICAgICAkc2NvcGUuJG9uKCAnem9vbWVkJywgKCBlLCB2ICkgPT4ge1xuICAgICAgICAgc3ZnRHJhZ2dhYmxlQ3RybC5zY2FsaW5nRmFjdG9yID0gdjtcbiAgICAgIH0gKTtcblxuICAgICAgc3ZnRHJhZ2dhYmxlQ3RybC5zY2FsaW5nRmFjdG9yID0gc3ZnWm9vbWFibGVDdHJsLnNjYWxpbmdGYWN0b3I7XG5cbiAgICAgIGxvZy5kZWJ1ZyggJ1Njb3BlJywgJHNjb3BlLiRpZCwgJ05vZGUnLCAkc2NvcGUgKTtcblxuICAgfVxuXG4gICBmdW5jdGlvbiBjb250cm9sbGVyKCAkc2NvcGUsICRlbGVtZW50LCAkYXR0cnMgKSB7XG5cbiAgICAgICRzY29wZS5oZWFkZXJIZWlnaHQgPSAxMDtcbiAgICAgICRzY29wZS53aWR0aCA9IDA7XG4gICAgICAkc2NvcGUuaGVpZ2h0ID0gMDtcbiAgICAgICRzY29wZS5yb3dIZWlnaHQgPSAxMDtcbiAgICAgICRzY29wZS5jb25uV2lkdGggPSAzLjU7XG4gICAgICAkc2NvcGUuY29ubkhlaWdodCA9IDQ7XG4gICAgICAkc2NvcGUuY29ubldpZHRoT2Zmc2V0ID0gLTAuNTtcbiAgICAgICRzY29wZS5jb25uSGVpZ2h0T2Zmc2V0ID0gMztcbiAgICAgICRzY29wZS5sYWJlbFNwYWNpbmcgPSAyO1xuXG4gICAgICAkc2NvcGUubnVtSW5wdXQgPSAkc2NvcGUubm9kZU9iamVjdC5pbnB1dC5sZW5ndGg7XG4gICAgICAkc2NvcGUubnVtT3V0cHV0ID0gJHNjb3BlLm5vZGVPYmplY3Qub3V0cHV0Lmxlbmd0aDtcblxuICAgICAgdGhpcy5nZXRIZWFkZXJIZWlnaHQgICAgID0gKCkgPT4geyByZXR1cm4gJHNjb3BlLmhlYWRlckhlaWdodDsgfTtcbiAgICAgIHRoaXMuZ2V0V2lkdGggICAgICAgICAgICA9ICgpID0+IHsgcmV0dXJuICRzY29wZS53aWR0aDsgfTtcbiAgICAgIHRoaXMuZ2V0Um93SGVpZ2h0ICAgICAgICA9ICgpID0+IHsgcmV0dXJuICRzY29wZS5yb3dIZWlnaHQ7IH07XG4gICAgICB0aGlzLmdldENvbm5XaWR0aCAgICAgICAgPSAoKSA9PiB7IHJldHVybiAkc2NvcGUuY29ubldpZHRoOyB9O1xuICAgICAgdGhpcy5nZXRDb25uSGVpZ2h0ICAgICAgID0gKCkgPT4geyByZXR1cm4gJHNjb3BlLmNvbm5IZWlnaHQ7IH07XG4gICAgICB0aGlzLmdldENvbm5IZWlnaHRPZmZzZXQgPSAoKSA9PiB7IHJldHVybiAkc2NvcGUuY29ubkhlaWdodE9mZnNldDsgfTtcblxuICAgICAgdmFyIGNvbXB1dGVkSGVhZGVyV2lkdGggPSAwO1xuICAgICAgdmFyIG1heENvbXB1dGVkSW5wdXRXaWR0aCA9IDA7XG4gICAgICB2YXIgbWF4Q29tcHV0ZWRPdXRwdXRXaWR0aCA9IDA7XG4gICAgICBmdW5jdGlvbiByZXF1ZXN0TGFiZWxXaWR0aCggdHlwZSwgdiApIHtcbiAgICAgICAgIGlmICggdHlwZSA9PT0gJ2hlYWRlcicgKSBjb21wdXRlZEhlYWRlcldpZHRoID0gdjtcbiAgICAgICAgIGVsc2UgaWYgKCB0eXBlID09PSAnaW5wdXQnICYmIHYgPiBtYXhDb21wdXRlZElucHV0V2lkdGggKSBtYXhDb21wdXRlZElucHV0V2lkdGggPSB2O1xuICAgICAgICAgZWxzZSBpZiAoIHR5cGUgPT09ICdvdXRwdXQnICYmIHYgPiBtYXhDb21wdXRlZE91dHB1dFdpZHRoICkgbWF4Q29tcHV0ZWRPdXRwdXRXaWR0aCA9IHY7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIGNvbXB1dGVXaWR0aCgpIHtcbiAgICAgICAgIHZhciBtYXhCb2R5V2lkdGggPSA1ICsgbWF4Q29tcHV0ZWRJbnB1dFdpZHRoICsgbWF4Q29tcHV0ZWRPdXRwdXRXaWR0aCArICggJHNjb3BlLmNvbm5XaWR0aCArICRzY29wZS5sYWJlbFNwYWNpbmcgKSAqIDIuMDtcbiAgICAgICAgIHZhciBoZWFkZXJXaWR0aCA9IGNvbXB1dGVkSGVhZGVyV2lkdGggKyAxNTtcbiAgICAgICAgICRzY29wZS53aWR0aCA9IE1hdGgubWF4KCBoZWFkZXJXaWR0aCwgbWF4Qm9keVdpZHRoICk7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIGNvbXB1dGVIZWlnaHQoKSB7XG4gICAgICAgICB2YXIgbWF4Q29ubiA9IE1hdGgubWF4KCAkc2NvcGUubm9kZU9iamVjdC5pbnB1dC5sZW5ndGgsICRzY29wZS5ub2RlT2JqZWN0Lm91dHB1dC5sZW5ndGggKTtcbiAgICAgICAgICRzY29wZS5oZWlnaHQgPSAkc2NvcGUuaGVhZGVySGVpZ2h0ICsgKCBtYXhDb25uICogJHNjb3BlLnJvd0hlaWdodCApO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiB1cGRhdGVVSSgpIHtcbiAgICAgICAgICRzY29wZS5udW1JbnB1dCA9ICRzY29wZS5ub2RlT2JqZWN0LmlucHV0Lmxlbmd0aDtcbiAgICAgICAgICRzY29wZS5udW1PdXRwdXQgPSAkc2NvcGUubm9kZU9iamVjdC5vdXRwdXQubGVuZ3RoO1xuXG4gICAgICAgICBjb21wdXRlZEhlYWRlcldpZHRoID0gMDtcbiAgICAgICAgIG1heENvbXB1dGVkSW5wdXRXaWR0aCA9IDA7XG4gICAgICAgICBtYXhDb21wdXRlZE91dHB1dFdpZHRoID0gMDtcbiAgICAgICAgICRzY29wZS4kYnJvYWRjYXN0KCAncmVxdWVzdExhYmVsV2lkdGgnLCByZXF1ZXN0TGFiZWxXaWR0aCApO1xuICAgICAgICAgY29tcHV0ZVdpZHRoKCk7XG4gICAgICAgICBjb21wdXRlSGVpZ2h0KCk7XG4gICAgICAgICAkc2NvcGUuJGJyb2FkY2FzdCggJ2Nvbm5lY3Rpb25OZWVkc1VwZGF0ZScgKTtcbiAgICAgIH1cblxuICAgICAgJHNjb3BlLiR3YXRjaCggKCkgPT4geyByZXR1cm4gJHNjb3BlLm5vZGVPYmplY3QuX3VpLnVwZGF0ZTsgfSwgdXBkYXRlVUkgKTtcblxuICAgfVxuXG4gICByZXR1cm4ge1xuXG4gICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgcmVwbGFjZTogdHJ1ZSxcbiAgICAgIHJlcXVpcmU6IFsgJ15zdmdEcmFnZ2FibGUnLCAnXnN2Z1pvb21hYmxlJyBdLFxuICAgICAgdGVtcGxhdGVOYW1lc3BhY2U6ICdzdmcnLFxuICAgICAgdGVtcGxhdGVVcmw6ICcuL3NyYy94eC90ZW1wbGF0ZS94eEJvZHkuaHRtbCcsXG4gICAgICBsaW5rLFxuICAgICAgY29udHJvbGxlclxuXG4gICB9O1xuXG59IF07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFsgJ2xvZycsICckcm9vdFNjb3BlJywgJ25vZGVTZXJ2aWNlJywgJ25vZGVFdmVudCcsICggbG9nLCAkcm9vdFNjb3BlLCBub2RlU2VydmljZSwgbm9kZUV2ZW50ICkgPT4ge1xuXG4gICBmdW5jdGlvbiBsaW5rKCAkc2NvcGUsICRlbGVtZW50LCAkYXR0cnMsICRjb250cm9sbGVycyApIHtcblxuICAgICAgdmFyIG5vZGVDdHJsID0gJGNvbnRyb2xsZXJzWyAwIF07XG4gICAgICB2YXIgZHJhZ0N0cmwgPSAkY29udHJvbGxlcnNbIDEgXTtcbiAgICAgIHZhciBzb3J0Q3RybCA9ICRjb250cm9sbGVyc1sgMiBdO1xuXG4gICAgICAkc2NvcGUuaG92ZXIgPSBmYWxzZTtcbiAgICAgICRzY29wZS5saW5raW5nID0gZmFsc2U7XG5cbiAgICAgICRlbGVtZW50XG4gICAgICAub24oICdtb3VzZWRvd24nLCBlID0+IHtcbiAgICAgICAgIGRyYWdDdHJsLmRpc2FibGVEcmFnKCk7XG4gICAgICAgICBzb3J0Q3RybC5kaXNhYmxlU29ydCgpO1xuICAgICAgICAgbm9kZUV2ZW50LnN0YXJ0Q29ubmVjdGlvbiggJHNjb3BlLmlvICk7XG4gICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoICd0ZW1wTGlua1N0YXJ0JywgJHNjb3BlLmlvLnBvc2l0aW9uICk7XG4gICAgICAgICAkc2NvcGUubGlua2luZyA9IHRydWU7XG4gICAgICAgICAkc2NvcGUuJGRpZ2VzdCgpO1xuICAgICAgfSApXG4gICAgICAub24oICdtb3VzZWVudGVyJywgZSA9PiB7XG4gICAgICAgICAkc2NvcGUuaG92ZXIgPSB0cnVlO1xuICAgICAgICAgJHNjb3BlLiRkaWdlc3QoKTtcbiAgICAgIH0gKVxuICAgICAgLm9uKCAnbW91c2VsZWF2ZScsIGUgPT4ge1xuICAgICAgICAgZHJhZ0N0cmwuZW5hYmxlRHJhZygpO1xuICAgICAgICAgc29ydEN0cmwuZW5hYmxlU29ydCgpO1xuICAgICAgICAgJHNjb3BlLmhvdmVyID0gZmFsc2U7XG4gICAgICAgICAkc2NvcGUuJGRpZ2VzdCgpO1xuICAgICAgfSApXG4gICAgICAub24oICdtb3VzZXVwJywgZSA9PiB7XG4gICAgICAgICBub2RlRXZlbnQuZW5kQ29ubmVjdGlvbiggJHNjb3BlLmlvICk7XG4gICAgICAgICAkc2NvcGUuJGRpZ2VzdCgpO1xuICAgICAgfSApXG4gICAgICAub24oICdkYmxjbGljaycsIGUgPT4ge1xuICAgICAgICAgbm9kZVNlcnZpY2UucmVtb3ZlQ29ubmVjdGlvbnMoICRzY29wZS5pbyApO1xuICAgICAgICAgbm9kZVNlcnZpY2UuY29tcHV0ZVRvcG9sb2dpY2FsT3JkZXIoKTtcbiAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgIH0gKTtcblxuICAgICAgJCggJ2JvZHknIClcbiAgICAgIC5vbiggJ21vdXNldXAnLCBlID0+IHtcbiAgICAgICAgIGlmICggISRzY29wZS5saW5raW5nICkgcmV0dXJuO1xuICAgICAgICAgJHNjb3BlLmxpbmtpbmcgPSBmYWxzZTtcbiAgICAgICAgICRzY29wZS4kZGlnZXN0KCk7XG4gICAgICB9ICk7XG5cbiAgICAgIGNvbXB1dGVQb3NpdGlvbigpO1xuXG4gICAgICAkc2NvcGUuJG9uKCAnY29ubmVjdGlvbk5lZWRzVXBkYXRlJywgKCkgPT4ge1xuICAgICAgICAgY29tcHV0ZVBvc2l0aW9uKCk7XG4gICAgICB9ICk7XG5cbiAgICAgIGZ1bmN0aW9uIGNvbXB1dGVQb3NpdGlvbigpIHtcbiAgICAgICAgIHZhciB5T2ZmID0gcGFyc2VJbnQoICRhdHRycy5pbmRleCApICogJHNjb3BlLnJvd0hlaWdodCArIG5vZGVDdHJsLmdldEhlYWRlckhlaWdodCgpICsgbm9kZUN0cmwuZ2V0Q29ubkhlaWdodE9mZnNldCgpICsgbm9kZUN0cmwuZ2V0Q29ubkhlaWdodCgpICogMC41O1xuICAgICAgICAgaWYgKCAhJHNjb3BlLmlvLnBvc2l0aW9uICkgJHNjb3BlLmlvLnBvc2l0aW9uID0ge307XG4gICAgICAgICAkc2NvcGUuaW8ucG9zaXRpb24ubGVmdCA9IGRyYWdDdHJsLnBvc2l0aW9uLnggKyAoICRzY29wZS5pby50eXBlID8gbm9kZUN0cmwuZ2V0V2lkdGgoKSAtIDAuNSA6IDAgKyAwLjUgKTtcbiAgICAgICAgICRzY29wZS5pby5wb3NpdGlvbi50b3AgPSBkcmFnQ3RybC5wb3NpdGlvbi55ICsgeU9mZjtcbiAgICAgIH1cblxuICAgICAgbG9nLmRlYnVnKCAnU2NvcGUnLCAkc2NvcGUuJGlkLCAnQ29ubmVjdG9yJywgJHNjb3BlICk7XG5cbiAgIH1cblxuICAgcmV0dXJuIHtcblxuICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgIHJlcGxhY2U6IHRydWUsXG4gICAgICByZXF1aXJlOiBbICdeeHhCb2R5JywgJ15zdmdEcmFnZ2FibGUnLCAnXnh4U29ydGFibGUnIF0sXG4gICAgICB0ZW1wbGF0ZU5hbWVzcGFjZTogJ3N2ZycsXG4gICAgICB0ZW1wbGF0ZVVybDogJy4vc3JjL3h4L3RlbXBsYXRlL3h4Q29ubmVjdG9yLmh0bWwnLFxuICAgICAgbGlua1xuXG4gICB9O1xuXG59IF07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFsgJ2xvZycsICggbG9nICkgPT4ge1xuXG5cdGZ1bmN0aW9uIGxpbmsoICRzY29wZSwgJGVsZW1lbnQsICRhdHRycyApIHtcblxuICAgICAgJHNjb3BlLnR5cGUgPSAkYXR0cnMudHlwZTtcbiAgICAgICRzY29wZS5pb0FycmF5ID0gJHNjb3BlLm5vZGVPYmplY3RbICRhdHRycy50eXBlIF07XG5cbiAgICAgIGxvZy5kZWJ1ZyggJ1Njb3BlJywgJHNjb3BlLiRpZCwgJ0lPQ29sJywgJGF0dHJzLnR5cGUsICRzY29wZSApO1xuXG5cdH1cblxuXHRyZXR1cm4ge1xuXG5cdFx0cmVzdHJpY3Q6ICdFJyxcblx0XHRyZXBsYWNlOiB0cnVlLFxuXHRcdHRlbXBsYXRlTmFtZXNwYWNlOiAnc3ZnJyxcblx0XHR0ZW1wbGF0ZVVybDogJy4vc3JjL3h4L3RlbXBsYXRlL3h4SW50ZXJmYWNlLmh0bWwnLFxuXHRcdHNjb3BlOiB0cnVlLFxuXHRcdGxpbmtcblxuXHR9O1xuXG59IF07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFsgJ2xvZycsICckdGltZW91dCcsICckcm9vdFNjb3BlJywgKCBsb2csICR0aW1lb3V0LCAkcm9vdFNjb3BlICkgPT4ge1xuXG4gICBmdW5jdGlvbiBsaW5rKCAkc2NvcGUsICRlbGVtZW50LCAkYXR0cnMgKSB7XG5cbiAgICAgICRzY29wZS4kb24oICdyZXF1ZXN0TGFiZWxXaWR0aCcsICggZSwgc2V0TWF4TGFiZWxXaWR0aCApID0+IHtcbiAgICAgICAgIHNldE1heExhYmVsV2lkdGgoICRhdHRycy54eExhYmVsICwgJGVsZW1lbnRbIDAgXS5nZXRDb21wdXRlZFRleHRMZW5ndGgoKSApO1xuICAgICAgfSApO1xuXG4gICAgICAkdGltZW91dCggKCkgPT4ge1xuICAgICAgICAgaWYgKCAkc2NvcGUuJGxhc3QgKSAkc2NvcGUubm9kZU9iamVjdC51cGRhdGVVSSgpO1xuICAgICAgfSApO1xuXG4gICAgICBsb2cuZGVidWcoICdTY29wZScsICRzY29wZS4kaWQsICdMYWJlbCcsICRhdHRycy54eExhYmVsLCAkc2NvcGUgKTtcblxuXG4gICAgICAkZWxlbWVudC5vbiggJ2NvbnRleHRtZW51JywgZSA9PiB7XG5cbiAgICAgICAgIGlmICggJHNjb3BlLmlvICYmIGUudGFyZ2V0ID09PSAkZWxlbWVudFsgMCBdICkge1xuICAgICAgICAgICAgdmFyIG0gPSBbXG4gICAgICAgICAgICAgICB7IG5hbWU6ICdMb2cgTGFiZWwgTmFtZScsIGZuOiAoKSA9PiBjb25zb2xlLmxvZyggJHNjb3BlLmlvLm5hbWUgKSB9LFxuICAgICAgICAgICAgICAgeyBuYW1lOiAnTG9nIFNjb3BlJywgZm46ICgpID0+IGNvbnNvbGUubG9nKCAkc2NvcGUgKSB9XG4gICAgICAgICAgICBdO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCAnbWVudS5vcGVuJywgeyBldmVudDogZSwgbWVudTogbSB9ICk7XG4gICAgICAgICB9XG5cbiAgICAgIH0gKTtcblxuICAgfVxuXG4gICByZXR1cm4ge1xuXG4gICAgICByZXN0cmljdDogJ0EnLFxuICAgICAgbGlua1xuXG4gICB9O1xuXG59IF07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFsgJ3VwZGF0ZUxpbmtFdmVudCcsICggdXBkYXRlTGlua0V2ZW50ICkgPT4ge1xuXG5cdGZ1bmN0aW9uIGxpbmsoICRzY29wZSApIHtcblxuXHRcdGZ1bmN0aW9uIHVwZGF0ZUNvbm5lY3Rpb24oKSB7XG5cblx0XHRcdCRzY29wZS5zdGFydCA9IHtcblx0XHRcdFx0eDogJHNjb3BlLnBhaXJbIDAgXS5wb3NpdGlvbi5sZWZ0LFxuXHRcdFx0XHR5OiAkc2NvcGUucGFpclsgMCBdLnBvc2l0aW9uLnRvcFxuXHRcdFx0fTtcblx0XHRcdCRzY29wZS5lbmQgPSB7XG5cdFx0XHRcdHg6ICRzY29wZS5wYWlyWyAxIF0ucG9zaXRpb24ubGVmdCxcblx0XHRcdFx0eTogJHNjb3BlLnBhaXJbIDEgXS5wb3NpdGlvbi50b3Bcblx0XHRcdH07XG5cblx0XHRcdHZhciBjcE9mZnNldCA9IE1hdGguYWJzKCAkc2NvcGUuc3RhcnQueCAtICRzY29wZS5lbmQueCApICogMC41O1xuXG5cdFx0XHQkc2NvcGUuY3AxID0ge1xuXHRcdFx0XHR4OiAkc2NvcGUuc3RhcnQueCAtIGNwT2Zmc2V0LFxuXHRcdFx0XHR5OiAkc2NvcGUuc3RhcnQueVxuXHRcdFx0fTtcblx0XHRcdCRzY29wZS5jcDIgPSB7XG5cdFx0XHRcdHg6ICRzY29wZS5lbmQueCArIGNwT2Zmc2V0LFxuXHRcdFx0XHR5OiAkc2NvcGUuZW5kLnlcblx0XHRcdH07XG5cblx0XHR9XG5cblx0XHRmdW5jdGlvbiB3YXRjaGVyKCkgeyByZXR1cm4gWyAkc2NvcGUucGFpclsgMCBdLnBvc2l0aW9uLCAkc2NvcGUucGFpclsgMSBdLnBvc2l0aW9uIF07IH1cblx0XHQkc2NvcGUuJHdhdGNoKCB3YXRjaGVyLCB1cGRhdGVDb25uZWN0aW9uLCB0cnVlICk7XG5cblx0XHR1cGRhdGVMaW5rRXZlbnQubGlzdGVuKCAoKSA9PiB7XG5cdFx0XHQkc2NvcGUuJGRpZ2VzdCgpO1xuXHRcdH0gKTtcblxuXHR9XG5cblx0cmV0dXJuIHtcblxuXHRcdHJlc3RyaWN0OiAnRScsXG5cdFx0cmVwbGFjZTogdHJ1ZSxcblx0XHR0ZW1wbGF0ZU5hbWVzcGFjZTogJ3N2ZycsXG5cdFx0dGVtcGxhdGU6ICc8cGF0aCBuZy1hdHRyLWQ9XCJNe3tzdGFydC54fX0se3tzdGFydC55fX0gQ3t7Y3AxLnh9fSx7e2NwMS55fX0ge3tjcDIueH19LHt7Y3AyLnl9fSB7e2VuZC54fX0se3tlbmQueX19XCIvPicsXG5cdFx0c2NvcGU6IHRydWUsXG5cdFx0bGlua1xuXG5cdH07XG5cbn0gXTtcbiIsIm1vZHVsZS5leHBvcnRzID0gWyAnbG9nJywgJ25vZGVTZXJ2aWNlJywgJ0NNJywgKCBsb2csIG5vZGVTZXJ2aWNlLCBDTSApID0+IHtcblxuICAgZnVuY3Rpb24gbGluayggJHNjb3BlLCAkZWxlbWVudCwgJGF0dHJzLCAkY29udHJvbGxlcnMgKSB7XG5cbiAgICAgICRlbGVtZW50Lm9uKCAnY2xpY2snLCBlID0+IHtcbiAgICAgICAgIG5vZGVTZXJ2aWNlLnNldFNlbGVjdGVkKCAkc2NvcGUubm9kZU9iamVjdCApO1xuICAgICAgICAgQ00uZ2V0SW5zdGFuY2UoKS5zZXRWYWx1ZSggJHNjb3BlLm5vZGVPYmplY3QuX2Zuc3RyICk7XG4gICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICB9ICk7XG5cbiAgICAgICRzY29wZS4kd2F0Y2goIG5vZGVTZXJ2aWNlLmdldFNlbGVjdGVkTm9kZSwgbiA9PiB7XG4gICAgICAgICBpZiAoIG4gKSAkc2NvcGUuaXNTZWxlY3RlZCA9IG4udXVpZCA9PT0gJHNjb3BlLm5vZGVPYmplY3QudXVpZDtcbiAgICAgICAgIGVsc2UgJHNjb3BlLmlzU2VsZWN0ZWQgPSBmYWxzZTtcbiAgICAgIH0gKTtcblxuICAgICAgbG9nLmRlYnVnKCAnU2NvcGUnLCAkc2NvcGUuJGlkLCAnU2VsZWN0YWJsZScsICRzY29wZSApO1xuXG4gICB9XG5cbiAgIHJldHVybiB7XG5cbiAgICAgIHJlc3RyaWN0OiAnQScsXG4gICAgICBsaW5rXG5cbiAgIH07XG5cbn0gXTtcbiIsIm1vZHVsZS5leHBvcnRzID0gWyAnbG9nJywgKCBsb2cgKSA9PiB7XG5cbiAgIGZ1bmN0aW9uIGxpbmsoICRzY29wZSwgJGVsZW1lbnQsICRhdHRycywgJGNvbnRyb2xsZXJzICkge1xuXG4gICAgICB2YXIgc29ydEN0cmwgPSAkY29udHJvbGxlcnNbIDAgXTtcbiAgICAgIHZhciBkcmFnQ3RybCA9ICRjb250cm9sbGVyc1sgMSBdO1xuXG4gICAgICAkZWxlbWVudFxuICAgICAgLm9uKCAnbW91c2Vkb3duJywgZSA9PiB7XG4gICAgICAgICBkcmFnQ3RybC5kaXNhYmxlRHJhZygpO1xuICAgICAgICAgc29ydEN0cmwuc29ydGluZyA9IHRydWU7XG4gICAgICAgICBzb3J0Q3RybC5zdGFydFNvcnQoICRzY29wZS5pbyApO1xuICAgICAgfSApXG4gICAgICAub24oICdtb3VzZWVudGVyJywgZSA9PiB7XG4gICAgICAgICBpZiAoICFzb3J0Q3RybC5zb3J0aW5nICkgcmV0dXJuO1xuICAgICAgICAgc29ydEN0cmwuZW5kU29ydCggJHNjb3BlLmlvICk7XG4gICAgICB9ICk7XG5cbiAgICAgICQoICdib2R5JyApXG4gICAgICAub24oICdtb3VzZXVwJywgZSA9PiB7XG4gICAgICAgICBpZiAoICFzb3J0Q3RybC5zb3J0aW5nICkgcmV0dXJuO1xuICAgICAgICAgZHJhZ0N0cmwuZW5hYmxlRHJhZygpO1xuICAgICAgICAgc29ydEN0cmwucmVzZXQoKTtcbiAgICAgICAgIHNvcnRDdHJsLnNvcnRpbmcgPSBmYWxzZTtcbiAgICAgIH0gKTtcblxuICAgICAgbG9nLmRlYnVnKCAnU2NvcGUnLCAkc2NvcGUuJGlkLCAnU29ydGl0ZW0nLCAkc2NvcGUgKTtcblxuICAgfVxuXG4gICByZXR1cm4ge1xuXG4gICAgICByZXN0cmljdDogJ0EnLFxuICAgICAgcmVxdWlyZTogWyAnXnh4U29ydGFibGUnLCAnXnN2Z0RyYWdnYWJsZScgXSxcbiAgICAgIGxpbmtcblxuICAgfTtcblxufSBdO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBbICdsb2cnLCAndXBkYXRlTGlua0V2ZW50JywgKCBsb2csIHVwZGF0ZUxpbmtFdmVudCApID0+IHtcblxuICAgZnVuY3Rpb24gY29udHJvbGxlciggJHNjb3BlLCAkZWxlbWVudCwgJGF0dHJzICkge1xuXG4gICAgICB2YXIgY3VyciA9IG51bGw7XG4gICAgICB2YXIgdGd0ID0gbnVsbDtcblxuICAgICAgdmFyIGRpc2FibGVkID0gZmFsc2U7XG4gICAgICB0aGlzLnNvcnRpbmcgPSBmYWxzZTtcblxuICAgICAgdGhpcy5yZXNldCA9ICgpID0+IHtcbiAgICAgICAgIGN1cnIgPSBudWxsO1xuICAgICAgICAgdGd0ID0gbnVsbDtcbiAgICAgIH07XG5cbiAgICAgIHRoaXMuc3RhcnRTb3J0ID0gbiA9PiB7XG4gICAgICAgICBpZiAoIGRpc2FibGVkICkgcmV0dXJuO1xuICAgICAgICAgY3VyciA9IG47XG4gICAgICB9O1xuXG4gICAgICB0aGlzLmVuZFNvcnQgPSBuID0+IHtcbiAgICAgICAgIGlmICggZGlzYWJsZWQgfHwgIXRoaXMuc29ydGluZyApIHJldHVybjtcbiAgICAgICAgIHRndCA9IG47XG4gICAgICAgICBpZiAoIGN1cnIgIT09IG51bGwgJiYgdGd0ICE9PSBudWxsICYmIGN1cnIgIT09IHRndCApIHtcbiAgICAgICAgICAgIHN3YXBSb3coIGN1cnIsIHRndCApO1xuICAgICAgICAgICAgJHNjb3BlLiRkaWdlc3QoKTtcbiAgICAgICAgICAgICRzY29wZS4kYnJvYWRjYXN0KCAnY29ubmVjdGlvbk5lZWRzVXBkYXRlJyApO1xuICAgICAgICAgICAgdXBkYXRlTGlua0V2ZW50LmJyb2FkY2FzdCgpO1xuICAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgdGhpcy5kaXNhYmxlU29ydCA9ICgpID0+IHsgZGlzYWJsZWQgPSB0cnVlOyB9O1xuICAgICAgdGhpcy5lbmFibGVTb3J0ID0gKCkgPT4geyBkaXNhYmxlZCA9IGZhbHNlOyB9O1xuXG4gICAgICBmdW5jdGlvbiBzd2FwUm93KCBjdXJyLCB0Z3QgKSB7XG5cbiAgICAgICAgIHZhciB0eXBlID0gY3Vyci50eXBlID09PSAwID8gJ2lucHV0JyA6ICdvdXRwdXQnO1xuICAgICAgICAgdmFyIHQxID0gJHNjb3BlLm5vZGVPYmplY3RbIHR5cGUgXS5pbmRleE9mKCB0Z3QgKTtcbiAgICAgICAgIHZhciB0MiA9ICRzY29wZS5ub2RlT2JqZWN0WyB0eXBlIF0uaW5kZXhPZiggY3VyciApO1xuXG4gICAgICAgICAkc2NvcGUubm9kZU9iamVjdFsgdHlwZSBdWyB0MSBdID0gY3VycjtcbiAgICAgICAgICRzY29wZS5ub2RlT2JqZWN0WyB0eXBlIF1bIHQyIF0gPSB0Z3Q7XG5cbiAgICAgIH1cblxuICAgICAgbG9nLmRlYnVnKCAnU2NvcGUnLCAkc2NvcGUuJGlkLCAnU29ydGFibGUnLCAkc2NvcGUgKTtcblxuICAgfVxuXG4gICByZXR1cm4ge1xuXG4gICAgICByZXN0cmljdDogJ0EnLFxuICAgICAgY29udHJvbGxlclxuXG4gICB9O1xuXG59IF07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFsgJyRyb290U2NvcGUnLCAoICRyb290U2NvcGUgKSA9PiB7XG5cbiAgIGZ1bmN0aW9uIGxpbmsoICRzY29wZSwgJGVsZW1lbnQsICRhdHRycywgJGNvbnRyb2xsZXJzICkge1xuXG4gICAgICAvLyBtYWtlIGVsZW1lbnQgY2xpY2sgdGhydS1hYmxlXG4gICAgICAkZWxlbWVudC5jc3MoICdwb2ludGVyLWV2ZW50cycsICdub25lJyApO1xuXG4gICAgICB2YXIgcGFuQ3RybCA9ICRjb250cm9sbGVyc1sgMCBdO1xuICAgICAgdmFyIHpvb21DdHJsID0gJGNvbnRyb2xsZXJzWyAxIF07XG4gICAgICAkc2NvcGUuYWN0aXZlID0gZmFsc2U7XG5cbiAgICAgICRyb290U2NvcGUuJG9uKCAndGVtcExpbmtTdGFydCcsICggZSwgcG9zICkgPT4ge1xuICAgICAgICAgJHNjb3BlLmFjdGl2ZSA9IHRydWU7XG4gICAgICAgICAkc2NvcGUuc3RhcnQgPSB7XG4gICAgICAgICAgICB4OiBwb3MubGVmdCxcbiAgICAgICAgICAgIHk6IHBvcy50b3BcbiAgICAgICAgIH07XG4gICAgICAgICAkc2NvcGUuY3AxID0gJHNjb3BlLnN0YXJ0O1xuICAgICAgfSApO1xuXG4gICAgICAkKCAnYm9keScgKVxuICAgICAgLm9uKCAnbW91c2Vtb3ZlJywgZSA9PiB7XG4gICAgICAgICBpZiAoICEkc2NvcGUuYWN0aXZlICkgcmV0dXJuO1xuICAgICAgICAgdmFyIG9mZiA9ICAkKCAnI25vZGVDYW52YXMnKS5vZmZzZXQoKTtcblxuICAgICAgICAgdmFyIGN4ID0gZS5wYWdlWCAtIG9mZi5sZWZ0O1xuICAgICAgICAgdmFyIGN5ID0gZS5wYWdlWSAtIG9mZi50b3A7XG4gICAgICAgICB2YXIgc2MgPSB6b29tQ3RybC5zY2FsaW5nRmFjdG9yO1xuXG4gICAgICAgICB2YXIgcG9zID0gcGFuQ3RybC5nZXRQb3NpdGlvbigpO1xuICAgICAgICAgdmFyIG94ID0gcG9zLng7XG4gICAgICAgICB2YXIgb3kgPSBwb3MueTtcblxuICAgICAgICAgJHNjb3BlLmVuZCA9IHtcbiAgICAgICAgICAgIHg6ICggY3ggLSBveCApIC8gc2MsXG4gICAgICAgICAgICB5OiAoIGN5IC0gb3kgKSAvIHNjXG4gICAgICAgICB9O1xuICAgICAgICAgJHNjb3BlLmNwMiA9ICRzY29wZS5lbmQ7XG5cbiAgICAgICAgICRzY29wZS4kZGlnZXN0KCk7XG5cbiAgICAgIH0gKVxuICAgICAgLm9uKCAnbW91c2V1cCcsIGUgPT4ge1xuICAgICAgICAgJHNjb3BlLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICAgJHNjb3BlLiRkaWdlc3QoKTtcbiAgICAgIH0gKTtcblxuXHR9XG5cblx0cmV0dXJuIHtcblxuXHRcdHJlc3RyaWN0OiAnRScsXG5cdFx0cmVwbGFjZTogdHJ1ZSxcbiAgICAgIHJlcXVpcmU6IFsgJ15zdmdEcmFnZ2FibGUnLCAnXnN2Z1pvb21hYmxlJyBdLFxuXHRcdHRlbXBsYXRlTmFtZXNwYWNlOiAnc3ZnJyxcblx0XHR0ZW1wbGF0ZTogJzxwYXRoIG5nLXNob3c9XCJhY3RpdmVcIiBuZy1hdHRyLWQ9XCJNe3tzdGFydC54fX0se3tzdGFydC55fX0gQ3t7Y3AxLnh9fSx7e2NwMS55fX0ge3tjcDIueH19LHt7Y3AyLnl9fSB7e2VuZC54fX0se3tlbmQueX19XCIvPicsXG5cdFx0c2NvcGU6IHt9LFxuXHRcdGxpbmtcblxuXHR9O1xuXG59IF07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFsgJyRyb290U2NvcGUnLCBmdW5jdGlvbiAoICRyb290U2NvcGUgKSB7XG5cbiAgIHRoaXMuYnJvYWRjYXN0ID0gKCkgPT4gJHJvb3RTY29wZS4kYnJvYWRjYXN0KCAnbGlua05lZWRzVXBkYXRlJyApO1xuICAgdGhpcy5saXN0ZW4gPSBjYWxsYmFjayA9PiAkcm9vdFNjb3BlLiRvbiggJ2xpbmtOZWVkc1VwZGF0ZScsIGNhbGxiYWNrICk7XG5cbn0gXTtcbiIsIm1vZHVsZS5leHBvcnRzID0gWyAnJHJvb3RTY29wZScsICdub2RlU2VydmljZScsICggJHJvb3RTY29wZSwgbm9kZVNlcnZpY2UgKSA9PiB7XG5cbiAgIHZhciBpbmlDb25uID0gbnVsbDtcblxuICAgZnVuY3Rpb24gc3RhcnRDb25uZWN0aW9uKCBjb25uICkge1xuICAgICAgaW5pQ29ubiA9IGNvbm47XG4gICB9XG5cbiAgIGZ1bmN0aW9uIGVuZENvbm5lY3Rpb24oIGVuZENvbm4gKSB7XG5cbiAgICAgIGlmICggdmFsaWRhdGVDb25uZWN0aW9uKCBpbmlDb25uLCBlbmRDb25uICkgKSB7XG5cbiAgICAgICAgIHZhciBwYWlyID0gW107XG4gICAgICAgICBwYWlyWyBpbmlDb25uLnR5cGUgXSA9IGluaUNvbm47XG4gICAgICAgICBwYWlyWyBlbmRDb25uLnR5cGUgXSA9IGVuZENvbm47XG5cbiAgICAgICAgIGlmICggIWlzQ3ljbGljKCBwYWlyICkgKSB7XG4gICAgICAgICAgICBpZiAoICFpc0R1cGxpY2F0ZSggcGFpclsgMCBdLCBwYWlyWyAxIF0gKSApIHtcblxuICAgICAgICAgICAgICAgaWYgKCAhcGFpclsgMCBdLmF2YWlsYWJsZSApIHtcbiAgICAgICAgICAgICAgICAgIG5vZGVTZXJ2aWNlLnJlbW92ZUNvbm5lY3Rpb25zKCBwYWlyWyAwIF0gKTtcbiAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgcGFpclsgMCBdLmNvbm5lY3QoIHBhaXJbIDEgXSApO1xuICAgICAgICAgICAgICAgbm9kZVNlcnZpY2UuY29ubmVjdGlvbnMucHVzaCggcGFpciApO1xuICAgICAgICAgICAgICAgbm9kZVNlcnZpY2UuY29tcHV0ZVRvcG9sb2dpY2FsT3JkZXIoKTtcbiAgICAgICAgICAgICAgICRyb290U2NvcGUuJGFwcGx5KCk7XG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICBjb25zb2xlLmxvZyggJ0R1cGxpY2F0ZWQgcGFpci4nICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5sb2coICdDeWNsaWMgZGVwZW5kZW5jeS4nICk7XG4gICAgICAgICB9XG5cbiAgICAgIH1cblxuICAgICAgcmVzZXRDb25uKCk7XG5cbiAgIH1cblxuICAgZnVuY3Rpb24gcmVzZXRDb25uKCkge1xuICAgICAgaW5pQ29ubiA9IG51bGw7XG4gICB9XG5cbiAgIGZ1bmN0aW9uIHZhbGlkYXRlQ29ubmVjdGlvbiggYSwgYiApIHtcblxuICAgICAgcmV0dXJuIChcbiAgICAgICAgIGEgIT09IG51bGwgJiYgYiAhPT0gbnVsbCAmJlxuICAgICAgICAgYS5nZXRQYXJlbnQoKS51dWlkICE9PSBiLmdldFBhcmVudCgpLnV1aWQgJiZcbiAgICAgICAgIGEudHlwZSAhPT0gYi50eXBlXG4gICAgICApO1xuXG4gICB9XG5cbiAgIGZ1bmN0aW9uIGlzRHVwbGljYXRlKCBpbnAsIG9wdCApIHtcbiAgICAgIHJldHVybiBub2RlU2VydmljZS5jb25uZWN0aW9ucy5zb21lKCBwYWlyID0+IHBhaXJbIDAgXS51dWlkID09PSBpbnAudXVpZCAmJiBwYWlyWyAxIF0udXVpZCA9PT0gb3B0LnV1aWQgKTtcbiAgIH1cblxuICAgZnVuY3Rpb24gaXNDeWNsaWMoIHBhaXIgKSB7XG4gICAgICB2YXIgdG1wID0gbm9kZVNlcnZpY2UuY29ubmVjdGlvbnMuc2xpY2UoKTtcbiAgICAgIHRtcC5wdXNoKCBwYWlyICk7XG4gICAgICB0cnkge1xuICAgICAgICAgbm9kZVNlcnZpY2UudG9wb1NvcnQoIHRtcCApO1xuICAgICAgfSBjYXRjaCAoIGUgKSB7XG4gICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgIH1cblxuICAgcmV0dXJuIHtcblxuICAgICAgc3RhcnRDb25uZWN0aW9uLFxuICAgICAgZW5kQ29ubmVjdGlvblxuXG4gICB9O1xuXG59IF07XG4iLCIvLyBqc2hpbnQgLVcwNTRcbm1vZHVsZS5leHBvcnRzID0gWyAoKSA9PiB7XG5cbiAgIGNsYXNzIENvbm5lY3Rpb24ge1xuICAgICAgY29uc3RydWN0b3IoIG5hbWUsIHBhcmVudCApIHtcbiAgICAgICAgIHRoaXMudXVpZCA9IFVVSUQoKTtcbiAgICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgICB0aGlzLmdldFBhcmVudCA9ICgpID0+IHsgcmV0dXJuIHBhcmVudDsgfTtcbiAgICAgICAgIHRoaXMuYXZhaWxhYmxlID0gdHJ1ZTtcbiAgICAgIH1cbiAgIH1cblxuICAgY2xhc3MgSW5wdXQgZXh0ZW5kcyBDb25uZWN0aW9uIHtcbiAgICAgIGNvbnN0cnVjdG9yKCBuYW1lLCBwYXJlbnQgKSB7XG4gICAgICAgICBzdXBlciggbmFtZSwgcGFyZW50ICk7XG4gICAgICAgICB0aGlzLnR5cGUgPSAwO1xuICAgICAgICAgdGhpcy5kZXN0ID0gbnVsbDtcbiAgICAgIH1cbiAgICAgIGNvbm5lY3QoIGlvICkge1xuICAgICAgICAgLy9pbnB1dFxuICAgICAgICAgdGhpcy5kZXN0ID0gaW87XG4gICAgICAgICB0aGlzLmF2YWlsYWJsZSA9IGZhbHNlO1xuICAgICAgICAgLy8gb3V0cHV0XG4gICAgICAgICBpby5kZXN0LnB1c2goIHRoaXMgKTtcbiAgICAgICAgIGlvLmF2YWlsYWJsZSA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgZGlzY29ubmVjdCgpIHtcbiAgICAgICAgIC8vIG91dHB1dFxuICAgICAgICAgdmFyIGkgPSB0aGlzLmRlc3QuZGVzdC5pbmRleE9mKCB0aGlzICk7XG4gICAgICAgICBpZiAoIGkgPiAtMSApIHRoaXMuZGVzdC5kZXN0LnNwbGljZSggaSwgMSApO1xuICAgICAgICAgaWYgKCB0aGlzLmRlc3QuZGVzdC5sZW5ndGggPT09IDAgKSB0aGlzLmRlc3QuYXZhaWxhYmxlID0gdHJ1ZTtcbiAgICAgICAgIC8vIGlucHV0XG4gICAgICAgICB0aGlzLmRlc3QgPSBudWxsO1xuICAgICAgICAgdGhpcy5hdmFpbGFibGUgPSB0cnVlO1xuICAgICAgfVxuICAgICAgZ2V0RGVzdERhdGEoKSB7XG4gICAgICAgICByZXR1cm4gdGhpcy5kZXN0ID09PSBudWxsID8gbnVsbCA6IHRoaXMuZGVzdC5kYXRhO1xuICAgICAgfVxuICAgfVxuXG4gICBjbGFzcyBPdXRwdXQgZXh0ZW5kcyBDb25uZWN0aW9uIHtcbiAgICAgIGNvbnN0cnVjdG9yKCBuYW1lLCBwYXJlbnQgKSB7XG4gICAgICAgICBzdXBlciggbmFtZSwgcGFyZW50ICk7XG4gICAgICAgICB0aGlzLnR5cGUgPSAxO1xuICAgICAgICAgdGhpcy5kYXRhID0gbnVsbDtcbiAgICAgICAgIHRoaXMuZGVzdCA9IFtdO1xuICAgICAgfVxuICAgfVxuXG4gICBjbGFzcyBFeGVjdXRhYmxlIHtcbiAgICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICAgdGhpcy5fZm5zdHIgPSAnJztcbiAgICAgICAgIHRoaXMuX3Rhc2sgPSBudWxsO1xuICAgICAgfVxuICAgICAgY29tcGlsZSgpIHtcbiAgICAgICAgIHRyeSB7IHRoaXMuX3Rhc2sgPSBuZXcgRnVuY3Rpb24oICdpbnB1dCcsIHRoaXMuX2Zuc3RyICk7IH1cbiAgICAgICAgIGNhdGNoICggZXJyICkgeyByZXR1cm4gZXJyOyB9XG4gICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICAgIGV4ZWN1dGUoKSB7XG4gICAgICAgICB2YXIgaW5wT2JqID0ge307XG4gICAgICAgICBpZiAoIHRoaXMuaW5wdXQubGVuZ3RoICE9PSAwICkge1xuICAgICAgICAgICAgdGhpcy5pbnB1dC5mb3JFYWNoKCBpbnAgPT4ge1xuICAgICAgICAgICAgICAgaW5wT2JqWyBpbnAubmFtZSBdID0gaW5wLmdldERlc3REYXRhKCk7XG4gICAgICAgICAgICB9ICk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyggaW5wT2JqICk7XG4gICAgICAgICB9XG4gICAgICAgICB2YXIgcmVzID0gbnVsbDtcbiAgICAgICAgIHRyeSB7IHJlcyA9IHRoaXMuX3Rhc2suY2FsbCggbnVsbCwgaW5wT2JqICk7IH1cbiAgICAgICAgIGNhdGNoICggZSApIHsgY29uc29sZS5lcnJvciggZSApOyB9XG4gICAgICAgICB0aGlzLm91dHB1dC5mb3JFYWNoKCBvcHQgPT4geyBvcHQuZGF0YSA9IHJlc1sgb3B0Lm5hbWUgXTsgfSApO1xuICAgICAgfVxuICAgfVxuXG4gICBjbGFzcyBOb2RlIGV4dGVuZHMgRXhlY3V0YWJsZSB7XG4gICAgICBjb25zdHJ1Y3RvciggbmFtZSApIHtcbiAgICAgICAgIHN1cGVyKCk7XG4gICAgICAgICB0aGlzLnV1aWQgPSBVVUlEKCk7XG4gICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICAgdGhpcy5pbnB1dCA9IFtdO1xuICAgICAgICAgdGhpcy5vdXRwdXQgPSBbXTtcbiAgICAgICAgIHRoaXMub3JkZXIgPSAtMTtcbiAgICAgICAgIHRoaXMudXBkYXRlVUkgPSAoKSA9PiB0aGlzLl91aS51cGRhdGUgPSAhdGhpcy5fdWkudXBkYXRlO1xuICAgICAgICAgdGhpcy5fdWkgPSB7XG4gICAgICAgICAgICB1cGRhdGU6IGZhbHNlXG4gICAgICAgICB9O1xuICAgICAgfVxuICAgICAgYWRkSW5wdXQoKSB7XG4gICAgICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpICsrICkge1xuICAgICAgICAgICAgdGhpcy5pbnB1dC5wdXNoKCBuZXcgSW5wdXQoIGFyZ3VtZW50c1sgaSBdLCB0aGlzICkgKTtcbiAgICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGFkZE91dHB1dCggbmFtZSApIHtcbiAgICAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkgKysgKSB7XG4gICAgICAgICAgICB0aGlzLm91dHB1dC5wdXNoKCBuZXcgT3V0cHV0KCBhcmd1bWVudHNbIGkgXSwgdGhpcyApICk7XG4gICAgICAgICB9XG4gICAgICB9XG4gICB9XG5cbiAgIGZ1bmN0aW9uIGNyZWF0ZSggbmFtZSApIHtcbiAgICAgIHJldHVybiBuZXcgTm9kZSggbmFtZSApO1xuICAgfVxuXG4gICByZXR1cm4ge1xuICAgICAgY3JlYXRlXG4gICB9O1xuXG59IF07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFsgJ25vZGVGYWN0b3J5JywgKCBub2RlRmFjdG9yeSApID0+IHtcblxuICAgdmFyIG5vZGVzID0gW107XG4gICB2YXIgY29ubmVjdGlvbnMgPSBbXTtcblxuICAgdmFyIHNlbGVjdGVkTm9kZSA9IG51bGw7XG5cbiAgIGZ1bmN0aW9uIGdldFNlbGVjdGVkTm9kZSgpIHtcbiAgICAgIHJldHVybiBzZWxlY3RlZE5vZGU7XG4gICB9XG5cbiAgIGZ1bmN0aW9uIHNldFNlbGVjdGVkKCBub2RlICkge1xuICAgICAgc2VsZWN0ZWROb2RlID0gbm9kZTtcbiAgIH1cblxuICAgZnVuY3Rpb24gY2xlYXJTZWxlY3RlZCgpIHtcbiAgICAgIHNlbGVjdGVkTm9kZSA9IG51bGw7XG4gICB9XG5cbiAgIGZ1bmN0aW9uIHJ1bigpIHtcblxuICAgICAgbm9kZXMuc29ydCggKCBhLCBiICkgPT4geyByZXR1cm4gYS5vcmRlciAtIGIub3JkZXI7IH0gKTtcblxuICAgICAgbm9kZXMuZmlsdGVyKCBuID0+IHsgcmV0dXJuIG4ub3JkZXIgIT09IC0xOyB9ICkuZm9yRWFjaCggbiA9PiB7XG4gICAgICAgICB2YXIgZXJyID0gbi5jb21waWxlKCk7XG4gICAgICAgICBpZiAoIGVyciApIGNvbnNvbGUuZXJyb3IoIGBOb2RlIG9yZGVyIE5vLiR7bi5vcmRlcn1gLCBlcnIgKTtcbiAgICAgICAgIG4uZXhlY3V0ZSgpO1xuICAgICAgfSApO1xuXG4gICB9XG5cbiAgIGZ1bmN0aW9uIGNyZWF0ZUVtcHR5Tm9kZSgpIHtcbiAgICAgIHZhciBuID0gbm9kZUZhY3RvcnkuY3JlYXRlKCAnTlVMTCcgKTtcbiAgICAgIG5vZGVzLnB1c2goIG4gKTtcbiAgICAgIHJldHVybiBuO1xuICAgfVxuXG4gICBmdW5jdGlvbiBnZW5lcmF0ZU5vZGUoKSB7XG5cbiAgICAgIHZhciBuO1xuXG4gICAgICBuID0gbm9kZUZhY3RvcnkuY3JlYXRlKCAnQ29uc3RhbnRzJyApO1xuICAgICAgbi5hZGRPdXRwdXQoICd4JywgJ3knLCAneicgKTtcbiAgICAgIG4uX2Zuc3RyID0gJ3JldHVybiB7IHg6IDQyLCB5OiAzMywgejogNzYgfTsnO1xuICAgICAgbi5jb21waWxlKCk7XG4gICAgICBub2Rlcy5wdXNoKCBuICk7XG5cbiAgICAgIG4gPSBub2RlRmFjdG9yeS5jcmVhdGUoICdWZWN0b3IzJyApO1xuICAgICAgbi5hZGRJbnB1dCggJ3UnLCAndicsICd3JyApO1xuICAgICAgbi5hZGRPdXRwdXQoICd2ZWMzJyApO1xuICAgICAgbi5fZm5zdHIgPSAncmV0dXJuIHsgdmVjMzogWyBpbnB1dC51LCBpbnB1dC52LCBpbnB1dC53IF0gfTsnO1xuICAgICAgbi5jb21waWxlKCk7XG4gICAgICBub2Rlcy5wdXNoKCBuICk7XG5cbiAgICAgIG4gPSBub2RlRmFjdG9yeS5jcmVhdGUoICdWZWN0b3IzJyApO1xuICAgICAgbi5hZGRJbnB1dCggJ3MnLCAndCcsICdwJyApO1xuICAgICAgbi5hZGRPdXRwdXQoICd2ZWMzJyApO1xuICAgICAgbi5fZm5zdHIgPSAncmV0dXJuIHsgdmVjMzogWyBpbnB1dC5zLCBpbnB1dC50LCBpbnB1dC5wIF0gfTsnO1xuICAgICAgbi5jb21waWxlKCk7XG4gICAgICBub2Rlcy5wdXNoKCBuICk7XG5cbiAgICAgIG4gPSBub2RlRmFjdG9yeS5jcmVhdGUoICdEb3QnICk7XG4gICAgICBuLmFkZElucHV0KCAndjEnLCAndjInICk7XG4gICAgICBuLmFkZE91dHB1dCggJ2YnICk7XG4gICAgICBuLl9mbnN0ciA9ICdyZXR1cm4geyBmOiBpbnB1dC52MVswXSppbnB1dC52MlswXStpbnB1dC52MVsxXSppbnB1dC52MlsxXStpbnB1dC52MVsyXSppbnB1dC52MlsyXSB9Oyc7XG4gICAgICBuLmNvbXBpbGUoKTtcbiAgICAgIG5vZGVzLnB1c2goIG4gKTtcblxuICAgICAgbiA9IG5vZGVGYWN0b3J5LmNyZWF0ZSggJ0NvbnNvbGUnICk7XG4gICAgICBuLmFkZElucHV0KCAnbG9nJyApO1xuICAgICAgbi5fZm5zdHIgPSAnY29uc29sZS5sb2coIGlucHV0LmxvZyApOyc7XG4gICAgICBuLmNvbXBpbGUoKTtcbiAgICAgIG5vZGVzLnB1c2goIG4gKTtcblxuICAgfVxuXG4gICBmdW5jdGlvbiB0b3BvU29ydCggY29ubkFycmF5ICkge1xuXG4gICAgICB2YXIgZGVwcyA9IFtdO1xuICAgICAgY29ubkFycmF5LmZvckVhY2goIHBhaXIgPT4ge1xuXG4gICAgICAgICB2YXIgdjEgPSBwYWlyWyAwIF0uZ2V0UGFyZW50KCkudXVpZDtcbiAgICAgICAgIHZhciB2MiA9IHBhaXJbIDEgXS5nZXRQYXJlbnQoKS51dWlkO1xuICAgICAgICAgZGVwcy5wdXNoKCBbIHYyLCB2MSBdICk7XG5cbiAgICAgIH0gKTtcblxuICAgICAgcmV0dXJuIFRPUE9TT1JUKCBkZXBzICk7XG5cbiAgIH1cblxuICAgZnVuY3Rpb24gY29tcHV0ZVRvcG9sb2dpY2FsT3JkZXIoKSB7XG5cbiAgICAgIHZhciBzb3J0ZWQgPSB0b3BvU29ydCggY29ubmVjdGlvbnMgKTtcbiAgICAgIG5vZGVzLmZvckVhY2goIG4gPT4geyBuLm9yZGVyID0gc29ydGVkLmluZGV4T2YoIG4udXVpZCApOyB9ICk7XG5cbiAgIH1cblxuICAgZnVuY3Rpb24gcmVtb3ZlQ29ubmVjdGlvbnMoIGNvbm4gKSB7XG5cbiAgICAgIHZhciBybSA9IFtdO1xuICAgICAgY29ubmVjdGlvbnMuZm9yRWFjaCggKCBwYWlyLCBpZHggKSA9PiB7XG4gICAgICAgICBpZiAoIGNvbm4udXVpZCA9PT0gcGFpclsgY29ubi50eXBlIF0udXVpZCApIHtcbiAgICAgICAgICAgIHBhaXJbIDAgXS5kaXNjb25uZWN0KCk7XG4gICAgICAgICAgICBybS5wdXNoKCBpZHggKTtcbiAgICAgICAgIH1cbiAgICAgIH0gKTtcbiAgICAgIGZvciAoIGxldCBpID0gcm0ubGVuZ3RoIC0gMTsgaSA+PSAwOyBpIC0tICkge1xuICAgICAgICAgY29ubmVjdGlvbnMuc3BsaWNlKCBybVsgaSBdLCAxICk7XG4gICAgICB9XG5cbiAgIH1cblxuICAgZnVuY3Rpb24gcGFyc2VGdW5jdGlvblBhcmFtZXRlcnMoIGZuU3RyICkge1xuICAgICAgdmFyIFNUUklQX0NPTU1FTlRTID0gLygoXFwvXFwvLiokKXwoXFwvXFwqW1xcc1xcU10qP1xcKlxcLykpL21nO1xuICAgICAgdmFyIEFSR1VNRU5UX05BTUVTID0gLyhbXlxccyxdKykvZztcbiAgICAgIGZuU3RyID0gZm5TdHIucmVwbGFjZShTVFJJUF9DT01NRU5UUywgJycpO1xuICAgICAgdmFyIHJlc3VsdCA9IGZuU3RyLnNsaWNlKGZuU3RyLmluZGV4T2YoJygnKSsxLCBmblN0ci5pbmRleE9mKCcpJykpLm1hdGNoKEFSR1VNRU5UX05BTUVTKTtcbiAgICAgIGlmICggcmVzdWx0ID09PSBudWxsICkgcmVzdWx0ID0gW107XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgfVxuXG4gICByZXR1cm4ge1xuXG4gICAgICBub2RlcyxcbiAgICAgIGNvbm5lY3Rpb25zLFxuICAgICAgZ2VuZXJhdGVOb2RlLFxuICAgICAgY29tcHV0ZVRvcG9sb2dpY2FsT3JkZXIsXG4gICAgICByZW1vdmVDb25uZWN0aW9ucyxcbiAgICAgIGNsZWFyU2VsZWN0ZWQsXG4gICAgICBzZXRTZWxlY3RlZCxcbiAgICAgIGdldFNlbGVjdGVkTm9kZSxcbiAgICAgIHJ1bixcbiAgICAgIGNyZWF0ZUVtcHR5Tm9kZSxcbiAgICAgIHRvcG9Tb3J0XG5cbiAgIH07XG5cbn0gXTtcbiJdfQ==
