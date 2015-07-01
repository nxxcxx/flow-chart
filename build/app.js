(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{}],2:[function(require,module,exports){
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

},{"./rng":1}],3:[function(require,module,exports){
(function (global){
'use strict';

global.UUID = require('uuid');

angular.module('nodeApp', []).controller('nodeCtrl', require('./nodeCtrl')).directive('nodeBox', require('./nodeBox')).directive('nodeItem', require('./nodeItem')).directive('nodeConnector', require('./nodeConnector')).directive('nodeLink', require('./nodeLink')).directive('svgPannable', require('./svg-pannable')).directive('svgZoomable', require('./svg-zoomable'));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./nodeBox":4,"./nodeConnector":5,"./nodeCtrl":6,"./nodeItem":7,"./nodeLink":8,"./svg-pannable":9,"./svg-zoomable":10,"uuid":2}],4:[function(require,module,exports){
'use strict';

function controller($scope, $element) {

   $element.draggable();

   $scope.broadcastUpdateConn = function () {
      setTimeout(function () {
         return $scope.$broadcast('connectionNeedsUpdate');
      }, 0);
   };

   $element.on('drag dragstart dragstop', $scope.broadcastUpdateConn);

   this.enableDrag = function () {
      $element.draggable('enable');
      // console.log( 'drag enabled.' );
   };
   this.disableDrag = function () {
      $element.draggable('disable');
      // console.log( 'drag disabled.' );
   };
}

module.exports = function () {

   return {
      restrict: 'E',
      replace: true,
      templateUrl: './template/node.html',
      scope: {
         nodeObject: '='
      },
      controller: controller
   };
};

},{}],5:[function(require,module,exports){
'use strict';

function link($scope, $element, $attrs, $controller) {

   var nodeDirCtrl = $controller[0];
   var nodeSortCtrl = $controller[1];

   $element.on('mouseenter', function (e) {
      nodeDirCtrl.disableDrag();
      nodeSortCtrl.disableSort();
   }).on('mouseleave', function (e) {
      nodeDirCtrl.enableDrag();
      nodeSortCtrl.enableSort();
   }).on('mousedown', function (e) {
      $scope.startConn();
   }).on('mouseup', function (e) {
      $scope.endConn();
   });

   var conn = $scope.input ? $scope.input : $scope.output;
   conn.type = $scope.input ? 0 : 1;
   conn.parentUUID = $scope.parentNode.uuid;

   updateConn();
   function updateConn() {

      conn.position = $element.offset();
      conn.position.left -= $('#nodeCanvas').offset().left;
      conn.position.top -= $('#nodeCanvas').offset().top;
   }
   $scope.startConn = function () {

      updateConn();
      $scope.$emit('startConn', conn);
   };

   $scope.endConn = function () {

      updateConn();
      $scope.$emit('endConn', conn);
   };

   $scope.$on('connectionNeedsUpdate', function () {

      updateConn();
      $scope.$apply();
   });
}

module.exports = function () {

   return {

      restrict: 'E',
      require: ['^nodeBox', '^nodeItem'],
      scope: {
         parentNode: '=',
         input: '=',
         output: '='
      },
      link: link

   };
};

// todo chop directive

},{}],6:[function(require,module,exports){
(function (global){
'use strict';

module.exports = ['$scope', '$rootScope', function ($scope, $rootScope) {

   global.SCOPE = $scope;

   $scope.nodes = [];
   $scope.connection = [];

   $scope.generateNode = function () {

      var inputs = ['data', 'x', 'y', 'z', 'w', 'uv', 'mat4', 'vec2', 'color', 'geometry', 'vector3', 'buffer', 'mesh', 'material'];

      var rndInt = function rndInt(n) {
         return ~ ~(Math.random() * n);
      };

      var node = {
         title: inputs[rndInt(inputs.length)],
         uuid: UUID(),
         input: genItems(),
         output: genItems()
      };

      $scope.nodes.push(node);
      return node;

      function genItems() {
         var res = [];
         for (var i = 0; i < rndInt(5) + 1; i++) {
            res.push({ name: inputs[rndInt(inputs.length)], uuid: UUID() });
         }
         return res;
      }
   };

   // store which conn is initiator
   var iniConn = null;
   var endConn = null;
   $scope.$on('startConn', function (e, conn) {

      e.stopPropagation();
      iniConn = conn;
   });

   $scope.$on('endConn', function (e, conn) {

      e.stopPropagation();
      endConn = conn;

      // register connection
      if (iniConn !== null && endConn !== null && iniConn.uuid !== endConn.uuid && iniConn.parentUUID !== endConn.parentUUID) {

         if (iniConn.type !== endConn.type) {

            var pair = [];
            pair[iniConn.type] = iniConn;
            pair[endConn.type] = endConn;

            if (!isDuplicate(pair[0], pair[1])) {
               $scope.connection.push(pair);
               $scope.$apply();
            } else {
               console.log('dupes conn');
            }
         }
      }

      // reset
      iniConn = null;
      endConn = null;
   });

   function isDuplicate(src, tgt) {

      return $scope.connection.some(function (pair) {
         return pair[0].uuid === src.uuid && pair[1].uuid === tgt.uuid;
      });
   }
}];

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],7:[function(require,module,exports){
'use strict';

function link($scope, $element) {

   $element.sortable({});
   $element.on('sort sortupdate sortstop', $scope.broadcastUpdateConn);
}

function controller($scope, $element) {

   this.enableSort = function () {
      $element.sortable('enable');
      // console.log( 'sort enabled.' );
   };
   this.disableSort = function () {
      $element.sortable('disable');
      // console.log( 'sort disabled.' );
   };
}

module.exports = function () {

   return {

      restrict: 'A',
      scope: true,
      link: link,
      controller: controller

   };
};

},{}],8:[function(require,module,exports){
'use strict';

function controller($scope) {

	function updateConnection() {

		var off = 5;

		$scope.start = {
			x: $scope.pair[0].position.left + off,
			y: $scope.pair[0].position.top + off
		};
		$scope.end = {
			x: $scope.pair[1].position.left + off,
			y: $scope.pair[1].position.top + off
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

	$scope.$watch('pair', updateConnection, true);
}

module.exports = function () {

	return {

		restrict: 'E',
		replace: true,
		templateNamespace: 'svg',
		template: '<path ng-attr-d="M{{start.x}},{{start.y}} C{{cp1.x}},{{cp1.y}} {{cp2.x}},{{cp2.y}} {{end.x}},{{end.y}}" id="curve"/>',
		scope: {
			pair: '='
		},
		controller: controller

	};
};

},{}],9:[function(require,module,exports){
'use strict';

function link($scope, $element, $attrs) {

   if (!$element.attr('transform')) {
      $element.attr('transform', 'matrix(1,0,0,1,0,0)');
   }

   var mousehold = false;
   var prevPos = { x: null, y: null };
   var currPos = { x: null, y: null };

   var mat = null;
   var numPattern = /[\d|\.|\+|-]+/g;

   $($attrs.handler).on('mousedown', function (e) {

      mousehold = true;
      prevPos.x = e.pageX;
      prevPos.y = e.pageY;

      mat = $element.attr('transform');
      mat = mat.match(numPattern).map(function (v) {
         return parseFloat(v);
      });
   }).on('mouseup', function (e) {
      mousehold = false;
   }).on('mousemove', function (e) {

      if (mousehold) {

         currPos.x = e.pageX;
         currPos.y = e.pageY;

         var dx = currPos.x - prevPos.x;
         var dy = currPos.y - prevPos.y;

         var newX = mat[4] + dx;
         var newY = mat[5] + dy;

         $element.attr('transform', 'matrix(' + mat[0] + ',' + mat[1] + ',' + mat[2] + ',' + mat[3] + ',' + newX + ',' + newY + ')');
      }
   });
}

module.exports = function () {

   return {

      restrict: 'A',
      link: link

   };
};

},{}],10:[function(require,module,exports){
// jshint -W014

'use strict';

function link($scope, $element, $attrs) {

   if (!$element.attr('transform')) {
      $element.attr('transform', 'matrix(1,0,0,1,0,0)');
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
          dd = gain * Math.sign(e.originalEvent.wheelDeltaY) * 0.1,
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
   });
}

module.exports = function () {

   return {

      restrict: 'A',
      link: link

   };
};

},{}]},{},[3])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvdXVpZC9ybmctYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy91dWlkL3V1aWQuanMiLCIvVXNlcnMvTklYL0RvY3VtZW50cy9uaXgvZmxvdy9zcmMvaW5kZXguanMiLCIvVXNlcnMvTklYL0RvY3VtZW50cy9uaXgvZmxvdy9zcmMvbm9kZUJveC5qcyIsIi9Vc2Vycy9OSVgvRG9jdW1lbnRzL25peC9mbG93L3NyYy9ub2RlQ29ubmVjdG9yLmpzIiwiL1VzZXJzL05JWC9Eb2N1bWVudHMvbml4L2Zsb3cvc3JjL25vZGVDdHJsLmpzIiwiL1VzZXJzL05JWC9Eb2N1bWVudHMvbml4L2Zsb3cvc3JjL25vZGVJdGVtLmpzIiwiL1VzZXJzL05JWC9Eb2N1bWVudHMvbml4L2Zsb3cvc3JjL25vZGVMaW5rLmpzIiwiL1VzZXJzL05JWC9Eb2N1bWVudHMvbml4L2Zsb3cvc3JjL3N2Zy1wYW5uYWJsZS5qcyIsIi9Vc2Vycy9OSVgvRG9jdW1lbnRzL25peC9mbG93L3NyYy9zdmctem9vbWFibGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUN2TEEsTUFBTSxDQUFDLElBQUksR0FBRyxPQUFPLENBQUUsTUFBTSxDQUFFLENBQUM7O0FBRWhDLE9BQU8sQ0FBQyxNQUFNLENBQUUsU0FBUyxFQUFFLEVBQUUsQ0FBRSxDQUM3QixVQUFVLENBQUUsVUFBVSxFQUFFLE9BQU8sQ0FBRSxZQUFZ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RUFBRSxHQUFHLEVBQUUsQ0FBQSxBQUFFLEdBQUcsRUFBRTtVQUMxQixFQUFFLEdBQUcsRUFBRSxJQUFLLEVBQUUsR0FBRyxFQUFFLENBQUEsQUFBRSxHQUFHLEVBQUUsQ0FDM0I7O0FBRUQsVUFBSyxFQUFFLEdBQUcsSUFBSSxJQUFJLEVBQUUsR0FBRyxJQUFJLEVBQUcsT0FBTzs7QUFFckMsY0FBUSxDQUFDLElBQUksQ0FBRSxXQUFXLGNBQVksRUFBRSxTQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsU0FBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLFNBQUksRUFBRSxTQUFJLEVBQUUsU0FBSSxFQUFFLE9BQUssQ0FBQztJQUV0RixDQUFFLENBQUM7Q0FFTjs7QUFFRCxNQUFNLENBQUMsT0FBTyxHQUFHLFlBQU07O0FBRXBCLFVBQU87O0FBRUosY0FBUSxFQUFFLEdBQUc7QUFDYixVQUFJLEVBQUosSUFBSTs7SUFFTixDQUFDO0NBRUosQ0FBQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcbnZhciBybmc7XG5cbmlmIChnbG9iYWwuY3J5cHRvICYmIGNyeXB0by5nZXRSYW5kb21WYWx1ZXMpIHtcbiAgLy8gV0hBVFdHIGNyeXB0by1iYXNlZCBSTkcgLSBodHRwOi8vd2lraS53aGF0d2cub3JnL3dpa2kvQ3J5cHRvXG4gIC8vIE1vZGVyYXRlbHkgZmFzdCwgaGlnaCBxdWFsaXR5XG4gIHZhciBfcm5kczggPSBuZXcgVWludDhBcnJheSgxNik7XG4gIHJuZyA9IGZ1bmN0aW9uIHdoYXR3Z1JORygpIHtcbiAgICBjcnlwdG8uZ2V0UmFuZG9tVmFsdWVzKF9ybmRzOCk7XG4gICAgcmV0dXJuIF9ybmRzODtcbiAgfTtcbn1cblxuaWYgKCFybmcpIHtcbiAgLy8gTWF0aC5yYW5kb20oKS1iYXNlZCAoUk5HKVxuICAvL1xuICAvLyBJZiBhbGwgZWxzZSBmYWlscywgdXNlIE1hdGgucmFuZG9tKCkuICBJdCdzIGZhc3QsIGJ1dCBpcyBvZiB1bnNwZWNpZmllZFxuICAvLyBxdWFsaXR5LlxuICB2YXIgIF9ybmRzID0gbmV3IEFycmF5KDE2KTtcbiAgcm5nID0gZnVuY3Rpb24oKSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIHI7IGkgPCAxNjsgaSsrKSB7XG4gICAgICBpZiAoKGkgJiAweDAzKSA9PT0gMCkgciA9IE1hdGgucmFuZG9tKCkgKiAweDEwMDAwMDAwMDtcbiAgICAgIF9ybmRzW2ldID0gciA+Pj4gKChpICYgMHgwMykgPDwgMykgJiAweGZmO1xuICAgIH1cblxuICAgIHJldHVybiBfcm5kcztcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBybmc7XG5cbiIsIi8vICAgICB1dWlkLmpzXG4vL1xuLy8gICAgIENvcHlyaWdodCAoYykgMjAxMC0yMDEyIFJvYmVydCBLaWVmZmVyXG4vLyAgICAgTUlUIExpY2Vuc2UgLSBodHRwOi8vb3BlbnNvdXJjZS5vcmcvbGljZW5zZXMvbWl0LWxpY2Vuc2UucGhwXG5cbi8vIFVuaXF1ZSBJRCBjcmVhdGlvbiByZXF1aXJlcyBhIGhpZ2ggcXVhbGl0eSByYW5kb20gIyBnZW5lcmF0b3IuICBXZSBmZWF0dXJlXG4vLyBkZXRlY3QgdG8gZGV0ZXJtaW5lIHRoZSBiZXN0IFJORyBzb3VyY2UsIG5vcm1hbGl6aW5nIHRvIGEgZnVuY3Rpb24gdGhhdFxuLy8gcmV0dXJucyAxMjgtYml0cyBvZiByYW5kb21uZXNzLCBzaW5jZSB0aGF0J3Mgd2hhdCdzIHVzdWFsbHkgcmVxdWlyZWRcbnZhciBfcm5nID0gcmVxdWlyZSgnLi9ybmcnKTtcblxuLy8gTWFwcyBmb3IgbnVtYmVyIDwtPiBoZXggc3RyaW5nIGNvbnZlcnNpb25cbnZhciBfYnl0ZVRvSGV4ID0gW107XG52YXIgX2hleFRvQnl0ZSA9IHt9O1xuZm9yICh2YXIgaSA9IDA7IGkgPCAyNTY7IGkrKykge1xuICBfYnl0ZVRvSGV4W2ldID0gKGkgKyAweDEwMCkudG9TdHJpbmcoMTYpLnN1YnN0cigxKTtcbiAgX2hleFRvQnl0ZVtfYnl0ZVRvSGV4W2ldXSA9IGk7XG59XG5cbi8vICoqYHBhcnNlKClgIC0gUGFyc2UgYSBVVUlEIGludG8gaXQncyBjb21wb25lbnQgYnl0ZXMqKlxuZnVuY3Rpb24gcGFyc2UocywgYnVmLCBvZmZzZXQpIHtcbiAgdmFyIGkgPSAoYnVmICYmIG9mZnNldCkgfHwgMCwgaWkgPSAwO1xuXG4gIGJ1ZiA9IGJ1ZiB8fCBbXTtcbiAgcy50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL1swLTlhLWZdezJ9L2csIGZ1bmN0aW9uKG9jdCkge1xuICAgIGlmIChpaSA8IDE2KSB7IC8vIERvbid0IG92ZXJmbG93IVxuICAgICAgYnVmW2kgKyBpaSsrXSA9IF9oZXhUb0J5dGVbb2N0XTtcbiAgICB9XG4gIH0pO1xuXG4gIC8vIFplcm8gb3V0IHJlbWFpbmluZyBieXRlcyBpZiBzdHJpbmcgd2FzIHNob3J0XG4gIHdoaWxlIChpaSA8IDE2KSB7XG4gICAgYnVmW2kgKyBpaSsrXSA9IDA7XG4gIH1cblxuICByZXR1cm4gYnVmO1xufVxuXG4vLyAqKmB1bnBhcnNlKClgIC0gQ29udmVydCBVVUlEIGJ5dGUgYXJyYXkgKGFsYSBwYXJzZSgpKSBpbnRvIGEgc3RyaW5nKipcbmZ1bmN0aW9uIHVucGFyc2UoYnVmLCBvZmZzZXQpIHtcbiAgdmFyIGkgPSBvZmZzZXQgfHwgMCwgYnRoID0gX2J5dGVUb0hleDtcbiAgcmV0dXJuICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXSArXG4gICAgICAgICAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV0gKyAnLScgK1xuICAgICAgICAgIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dICsgJy0nICtcbiAgICAgICAgICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXSArICctJyArXG4gICAgICAgICAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV0gKyAnLScgK1xuICAgICAgICAgIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dICtcbiAgICAgICAgICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXSArXG4gICAgICAgICAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV07XG59XG5cbi8vICoqYHYxKClgIC0gR2VuZXJhdGUgdGltZS1iYXNlZCBVVUlEKipcbi8vXG4vLyBJbnNwaXJlZCBieSBodHRwczovL2dpdGh1Yi5jb20vTGlvc0svVVVJRC5qc1xuLy8gYW5kIGh0dHA6Ly9kb2NzLnB5dGhvbi5vcmcvbGlicmFyeS91dWlkLmh0bWxcblxuLy8gcmFuZG9tICMncyB3ZSBuZWVkIHRvIGluaXQgbm9kZSBhbmQgY2xvY2tzZXFcbnZhciBfc2VlZEJ5dGVzID0gX3JuZygpO1xuXG4vLyBQZXIgNC41LCBjcmVhdGUgYW5kIDQ4LWJpdCBub2RlIGlkLCAoNDcgcmFuZG9tIGJpdHMgKyBtdWx0aWNhc3QgYml0ID0gMSlcbnZhciBfbm9kZUlkID0gW1xuICBfc2VlZEJ5dGVzWzBdIHwgMHgwMSxcbiAgX3NlZWRCeXRlc1sxXSwgX3NlZWRCeXRlc1syXSwgX3NlZWRCeXRlc1szXSwgX3NlZWRCeXRlc1s0XSwgX3NlZWRCeXRlc1s1XVxuXTtcblxuLy8gUGVyIDQuMi4yLCByYW5kb21pemUgKDE0IGJpdCkgY2xvY2tzZXFcbnZhciBfY2xvY2tzZXEgPSAoX3NlZWRCeXRlc1s2XSA8PCA4IHwgX3NlZWRCeXRlc1s3XSkgJiAweDNmZmY7XG5cbi8vIFByZXZpb3VzIHV1aWQgY3JlYXRpb24gdGltZVxudmFyIF9sYXN0TVNlY3MgPSAwLCBfbGFzdE5TZWNzID0gMDtcblxuLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9icm9vZmEvbm9kZS11dWlkIGZvciBBUEkgZGV0YWlsc1xuZnVuY3Rpb24gdjEob3B0aW9ucywgYnVmLCBvZmZzZXQpIHtcbiAgdmFyIGkgPSBidWYgJiYgb2Zmc2V0IHx8IDA7XG4gIHZhciBiID0gYnVmIHx8IFtdO1xuXG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gIHZhciBjbG9ja3NlcSA9IG9wdGlvbnMuY2xvY2tzZXEgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMuY2xvY2tzZXEgOiBfY2xvY2tzZXE7XG5cbiAgLy8gVVVJRCB0aW1lc3RhbXBzIGFyZSAxMDAgbmFuby1zZWNvbmQgdW5pdHMgc2luY2UgdGhlIEdyZWdvcmlhbiBlcG9jaCxcbiAgLy8gKDE1ODItMTAtMTUgMDA6MDApLiAgSlNOdW1iZXJzIGFyZW4ndCBwcmVjaXNlIGVub3VnaCBmb3IgdGhpcywgc29cbiAgLy8gdGltZSBpcyBoYW5kbGVkIGludGVybmFsbHkgYXMgJ21zZWNzJyAoaW50ZWdlciBtaWxsaXNlY29uZHMpIGFuZCAnbnNlY3MnXG4gIC8vICgxMDAtbmFub3NlY29uZHMgb2Zmc2V0IGZyb20gbXNlY3MpIHNpbmNlIHVuaXggZXBvY2gsIDE5NzAtMDEtMDEgMDA6MDAuXG4gIHZhciBtc2VjcyA9IG9wdGlvbnMubXNlY3MgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMubXNlY3MgOiBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcblxuICAvLyBQZXIgNC4yLjEuMiwgdXNlIGNvdW50IG9mIHV1aWQncyBnZW5lcmF0ZWQgZHVyaW5nIHRoZSBjdXJyZW50IGNsb2NrXG4gIC8vIGN5Y2xlIHRvIHNpbXVsYXRlIGhpZ2hlciByZXNvbHV0aW9uIGNsb2NrXG4gIHZhciBuc2VjcyA9IG9wdGlvbnMubnNlY3MgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMubnNlY3MgOiBfbGFzdE5TZWNzICsgMTtcblxuICAvLyBUaW1lIHNpbmNlIGxhc3QgdXVpZCBjcmVhdGlvbiAoaW4gbXNlY3MpXG4gIHZhciBkdCA9IChtc2VjcyAtIF9sYXN0TVNlY3MpICsgKG5zZWNzIC0gX2xhc3ROU2VjcykvMTAwMDA7XG5cbiAgLy8gUGVyIDQuMi4xLjIsIEJ1bXAgY2xvY2tzZXEgb24gY2xvY2sgcmVncmVzc2lvblxuICBpZiAoZHQgPCAwICYmIG9wdGlvbnMuY2xvY2tzZXEgPT09IHVuZGVmaW5lZCkge1xuICAgIGNsb2Nrc2VxID0gY2xvY2tzZXEgKyAxICYgMHgzZmZmO1xuICB9XG5cbiAgLy8gUmVzZXQgbnNlY3MgaWYgY2xvY2sgcmVncmVzc2VzIChuZXcgY2xvY2tzZXEpIG9yIHdlJ3ZlIG1vdmVkIG9udG8gYSBuZXdcbiAgLy8gdGltZSBpbnRlcnZhbFxuICBpZiAoKGR0IDwgMCB8fCBtc2VjcyA+IF9sYXN0TVNlY3MpICYmIG9wdGlvbnMubnNlY3MgPT09IHVuZGVmaW5lZCkge1xuICAgIG5zZWNzID0gMDtcbiAgfVxuXG4gIC8vIFBlciA0LjIuMS4yIFRocm93IGVycm9yIGlmIHRvbyBtYW55IHV1aWRzIGFyZSByZXF1ZXN0ZWRcbiAgaWYgKG5zZWNzID49IDEwMDAwKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCd1dWlkLnYxKCk6IENhblxcJ3QgY3JlYXRlIG1vcmUgdGhhbiAxME0gdXVpZHMvc2VjJyk7XG4gIH1cblxuICBfbGFzdE1TZWNzID0gbXNlY3M7XG4gIF9sYXN0TlNlY3MgPSBuc2VjcztcbiAgX2Nsb2Nrc2VxID0gY2xvY2tzZXE7XG5cbiAgLy8gUGVyIDQuMS40IC0gQ29udmVydCBmcm9tIHVuaXggZXBvY2ggdG8gR3JlZ29yaWFuIGVwb2NoXG4gIG1zZWNzICs9IDEyMjE5MjkyODAwMDAwO1xuXG4gIC8vIGB0aW1lX2xvd2BcbiAgdmFyIHRsID0gKChtc2VjcyAmIDB4ZmZmZmZmZikgKiAxMDAwMCArIG5zZWNzKSAlIDB4MTAwMDAwMDAwO1xuICBiW2krK10gPSB0bCA+Pj4gMjQgJiAweGZmO1xuICBiW2krK10gPSB0bCA+Pj4gMTYgJiAweGZmO1xuICBiW2krK10gPSB0bCA+Pj4gOCAmIDB4ZmY7XG4gIGJbaSsrXSA9IHRsICYgMHhmZjtcblxuICAvLyBgdGltZV9taWRgXG4gIHZhciB0bWggPSAobXNlY3MgLyAweDEwMDAwMDAwMCAqIDEwMDAwKSAmIDB4ZmZmZmZmZjtcbiAgYltpKytdID0gdG1oID4+PiA4ICYgMHhmZjtcbiAgYltpKytdID0gdG1oICYgMHhmZjtcblxuICAvLyBgdGltZV9oaWdoX2FuZF92ZXJzaW9uYFxuICBiW2krK10gPSB0bWggPj4+IDI0ICYgMHhmIHwgMHgxMDsgLy8gaW5jbHVkZSB2ZXJzaW9uXG4gIGJbaSsrXSA9IHRtaCA+Pj4gMTYgJiAweGZmO1xuXG4gIC8vIGBjbG9ja19zZXFfaGlfYW5kX3Jlc2VydmVkYCAoUGVyIDQuMi4yIC0gaW5jbHVkZSB2YXJpYW50KVxuICBiW2krK10gPSBjbG9ja3NlcSA+Pj4gOCB8IDB4ODA7XG5cbiAgLy8gYGNsb2NrX3NlcV9sb3dgXG4gIGJbaSsrXSA9IGNsb2Nrc2VxICYgMHhmZjtcblxuICAvLyBgbm9kZWBcbiAgdmFyIG5vZGUgPSBvcHRpb25zLm5vZGUgfHwgX25vZGVJZDtcbiAgZm9yICh2YXIgbiA9IDA7IG4gPCA2OyBuKyspIHtcbiAgICBiW2kgKyBuXSA9IG5vZGVbbl07XG4gIH1cblxuICByZXR1cm4gYnVmID8gYnVmIDogdW5wYXJzZShiKTtcbn1cblxuLy8gKipgdjQoKWAgLSBHZW5lcmF0ZSByYW5kb20gVVVJRCoqXG5cbi8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vYnJvb2ZhL25vZGUtdXVpZCBmb3IgQVBJIGRldGFpbHNcbmZ1bmN0aW9uIHY0KG9wdGlvbnMsIGJ1Ziwgb2Zmc2V0KSB7XG4gIC8vIERlcHJlY2F0ZWQgLSAnZm9ybWF0JyBhcmd1bWVudCwgYXMgc3VwcG9ydGVkIGluIHYxLjJcbiAgdmFyIGkgPSBidWYgJiYgb2Zmc2V0IHx8IDA7XG5cbiAgaWYgKHR5cGVvZihvcHRpb25zKSA9PSAnc3RyaW5nJykge1xuICAgIGJ1ZiA9IG9wdGlvbnMgPT0gJ2JpbmFyeScgPyBuZXcgQXJyYXkoMTYpIDogbnVsbDtcbiAgICBvcHRpb25zID0gbnVsbDtcbiAgfVxuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICB2YXIgcm5kcyA9IG9wdGlvbnMucmFuZG9tIHx8IChvcHRpb25zLnJuZyB8fCBfcm5nKSgpO1xuXG4gIC8vIFBlciA0LjQsIHNldCBiaXRzIGZvciB2ZXJzaW9uIGFuZCBgY2xvY2tfc2VxX2hpX2FuZF9yZXNlcnZlZGBcbiAgcm5kc1s2XSA9IChybmRzWzZdICYgMHgwZikgfCAweDQwO1xuICBybmRzWzhdID0gKHJuZHNbOF0gJiAweDNmKSB8IDB4ODA7XG5cbiAgLy8gQ29weSBieXRlcyB0byBidWZmZXIsIGlmIHByb3ZpZGVkXG4gIGlmIChidWYpIHtcbiAgICBmb3IgKHZhciBpaSA9IDA7IGlpIDwgMTY7IGlpKyspIHtcbiAgICAgIGJ1ZltpICsgaWldID0gcm5kc1tpaV07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGJ1ZiB8fCB1bnBhcnNlKHJuZHMpO1xufVxuXG4vLyBFeHBvcnQgcHVibGljIEFQSVxudmFyIHV1aWQgPSB2NDtcbnV1aWQudjEgPSB2MTtcbnV1aWQudjQgPSB2NDtcbnV1aWQucGFyc2UgPSBwYXJzZTtcbnV1aWQudW5wYXJzZSA9IHVucGFyc2U7XG5cbm1vZHVsZS5leHBvcnRzID0gdXVpZDtcbiIsImdsb2JhbC5VVUlEID0gcmVxdWlyZSggJ3V1aWQnICk7XG5cbmFuZ3VsYXIubW9kdWxlKCAnbm9kZUFwcCcsIFtdIClcblx0LmNvbnRyb2xsZXIoICdub2RlQ3RybCcsIHJlcXVpcmUoICcuL25vZGVDdHJsJyApIClcblx0LmRpcmVjdGl2ZSggJ25vZGVCb3gnLCByZXF1aXJlKCAnLi9ub2RlQm94JyApIClcblx0LmRpcmVjdGl2ZSggJ25vZGVJdGVtJywgcmVxdWlyZSggJy4vbm9kZUl0ZW0nICkgKVxuXHQuZGlyZWN0aXZlKCAnbm9kZUNvbm5lY3RvcicsIHJlcXVpcmUoICcuL25vZGVDb25uZWN0b3InICkgKVxuXHQuZGlyZWN0aXZlKCAnbm9kZUxpbmsnLCByZXF1aXJlKCAnLi9ub2RlTGluaycgKSApXG5cdC5kaXJlY3RpdmUoICdzdmdQYW5uYWJsZScsIHJlcXVpcmUoICcuL3N2Zy1wYW5uYWJsZScgKSApXG5cdC5kaXJlY3RpdmUoICdzdmdab29tYWJsZScsIHJlcXVpcmUoICcuL3N2Zy16b29tYWJsZScgKSApXG5cdDtcbiIsIlxuZnVuY3Rpb24gY29udHJvbGxlciggJHNjb3BlLCAkZWxlbWVudCApIHtcblxuICAgJGVsZW1lbnQuZHJhZ2dhYmxlKCk7XG5cbiAgICRzY29wZS5icm9hZGNhc3RVcGRhdGVDb25uID0gKCkgPT4ge1xuICAgICAgc2V0VGltZW91dCggKCkgPT4gJHNjb3BlLiRicm9hZGNhc3QoICdjb25uZWN0aW9uTmVlZHNVcGRhdGUnICksIDAgKTtcbiAgIH07XG5cbiAgICRlbGVtZW50Lm9uKCAnZHJhZyBkcmFnc3RhcnQgZHJhZ3N0b3AnLCAkc2NvcGUuYnJvYWRjYXN0VXBkYXRlQ29ubiApO1xuXG4gICB0aGlzLmVuYWJsZURyYWcgPSAoKSA9PiB7XG4gICAgICAkZWxlbWVudC5kcmFnZ2FibGUoICdlbmFibGUnICk7XG4gICAgICAvLyBjb25zb2xlLmxvZyggJ2RyYWcgZW5hYmxlZC4nICk7XG4gICB9O1xuICAgdGhpcy5kaXNhYmxlRHJhZyA9ICgpID0+IHtcbiAgICAgICRlbGVtZW50LmRyYWdnYWJsZSggJ2Rpc2FibGUnICk7XG4gICAgICAvLyBjb25zb2xlLmxvZyggJ2RyYWcgZGlzYWJsZWQuJyApO1xuICAgfTtcblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcblxuICAgcmV0dXJuIHtcbiAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICByZXBsYWNlOiB0cnVlLFxuICAgICAgdGVtcGxhdGVVcmw6ICcuL3RlbXBsYXRlL25vZGUuaHRtbCcsXG4gICAgICBzY29wZToge1xuICAgICAgICAgbm9kZU9iamVjdDogJz0nXG4gICAgICB9LFxuICAgICAgY29udHJvbGxlclxuICAgfTtcblxufTtcbiIsIlxuZnVuY3Rpb24gbGluayggJHNjb3BlLCAkZWxlbWVudCwgJGF0dHJzLCAkY29udHJvbGxlciApIHtcblxuICAgdmFyIG5vZGVEaXJDdHJsID0gJGNvbnRyb2xsZXJbIDAgXTtcbiAgIHZhciBub2RlU29ydEN0cmwgPSAkY29udHJvbGxlclsgMSBdO1xuXG4gICAkZWxlbWVudFxuICAgLm9uKCAnbW91c2VlbnRlcicsIGUgID0+IHtcbiAgICAgIG5vZGVEaXJDdHJsLmRpc2FibGVEcmFnKCk7XG4gICAgICBub2RlU29ydEN0cmwuZGlzYWJsZVNvcnQoKTtcbiAgIH0gKVxuICAgLm9uKCAnbW91c2VsZWF2ZScsIGUgPT4ge1xuICAgICAgbm9kZURpckN0cmwuZW5hYmxlRHJhZygpO1xuICAgICAgbm9kZVNvcnRDdHJsLmVuYWJsZVNvcnQoKTtcbiAgIH0gKVxuICAgLm9uKCAnbW91c2Vkb3duJywgZSA9PiB7XG4gICAgICAkc2NvcGUuc3RhcnRDb25uKCk7XG4gICB9IClcbiAgIC5vbiggJ21vdXNldXAnLCBlID0+IHtcbiAgICAgICRzY29wZS5lbmRDb25uKCk7XG4gICB9ICk7XG5cbiAgIHZhciBjb25uID0gJHNjb3BlLmlucHV0ID8gJHNjb3BlLmlucHV0IDogJHNjb3BlLm91dHB1dDtcbiAgIGNvbm4udHlwZSA9ICRzY29wZS5pbnB1dCA/IDAgOiAxO1xuICAgY29ubi5wYXJlbnRVVUlEID0gJHNjb3BlLnBhcmVudE5vZGUudXVpZDtcblxuICAgdXBkYXRlQ29ubigpO1xuICAgZnVuY3Rpb24gdXBkYXRlQ29ubigpIHtcblxuICAgICAgY29ubi5wb3NpdGlvbiA9ICRlbGVtZW50Lm9mZnNldCgpO1xuICAgICAgY29ubi5wb3NpdGlvbi5sZWZ0IC09ICQoICcjbm9kZUNhbnZhcycgKS5vZmZzZXQoKS5sZWZ0O1xuICAgICAgY29ubi5wb3NpdGlvbi50b3AgLT0gJCggJyNub2RlQ2FudmFzJyApLm9mZnNldCgpLnRvcDtcblxuICAgfVxuICAgJHNjb3BlLnN0YXJ0Q29ubiA9ICgpID0+IHtcblxuICAgICAgdXBkYXRlQ29ubigpO1xuICAgICAgJHNjb3BlLiRlbWl0KCAnc3RhcnRDb25uJywgY29ubiApO1xuXG4gICB9O1xuXG4gICAkc2NvcGUuZW5kQ29ubiA9ICgpID0+IHtcblxuICAgICAgdXBkYXRlQ29ubigpO1xuICAgICAgJHNjb3BlLiRlbWl0KCAnZW5kQ29ubicsIGNvbm4gKTtcblxuICAgfTtcblxuICAgJHNjb3BlLiRvbiggJ2Nvbm5lY3Rpb25OZWVkc1VwZGF0ZScsICgpID0+IHtcblxuICAgICAgdXBkYXRlQ29ubigpO1xuICAgICAgJHNjb3BlLiRhcHBseSgpO1xuXG4gICB9ICk7XG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XG5cbiAgIHJldHVybiB7XG5cbiAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICByZXF1aXJlOiBbICdebm9kZUJveCcsICdebm9kZUl0ZW0nIF0sXG4gICAgICBzY29wZToge1xuICAgICAgICAgcGFyZW50Tm9kZTogJz0nLFxuICAgICAgICAgaW5wdXQ6ICc9JyxcbiAgICAgICAgIG91dHB1dDogJz0nXG4gICAgICB9LFxuICAgICAgbGlua1xuXG4gICB9O1xuXG59O1xuXG4vLyB0b2RvIGNob3AgZGlyZWN0aXZlXG4iLCJcbm1vZHVsZS5leHBvcnRzID0gWyAnJHNjb3BlJywgJyRyb290U2NvcGUnLCAoICRzY29wZSwgJHJvb3RTY29wZSApID0+IHtcblxuICAgZ2xvYmFsLlNDT1BFID0gJHNjb3BlO1xuXG4gICAkc2NvcGUubm9kZXMgPSBbXTtcbiAgICRzY29wZS5jb25uZWN0aW9uID0gW107XG5cbiAgICRzY29wZS5nZW5lcmF0ZU5vZGUgPSAoKSA9PiB7XG5cbiAgICAgIHZhciBpbnB1dHMgPSBbICdkYXRhJywgJ3gnLCAneScsICd6JywgJ3cnLCAndXYnLCAnbWF0NCcsICd2ZWMyJywgJ2NvbG9yJywgJ2dlb21ldHJ5JywgJ3ZlY3RvcjMnLCAnYnVmZmVyJywgJ21lc2gnLCAnbWF0ZXJpYWwnIF07XG5cbiAgICAgIHZhciBybmRJbnQgPSBuID0+IHsgcmV0dXJuIH5+KCBNYXRoLnJhbmRvbSgpICogbiApOyB9O1xuXG4gICAgICB2YXIgbm9kZSA9IHtcbiAgICAgICAgIHRpdGxlOiBpbnB1dHNbIHJuZEludCggaW5wdXRzLmxlbmd0aCApIF0sXG4gICAgICAgICB1dWlkOiBVVUlEKCksXG4gICAgICAgICBpbnB1dDogZ2VuSXRlbXMoKSxcbiAgICAgICAgIG91dHB1dDogZ2VuSXRlbXMoKVxuICAgICAgfTtcblxuICAgICAgJHNjb3BlLm5vZGVzLnB1c2goIG5vZGUgKTtcbiAgICAgIHJldHVybiBub2RlO1xuXG4gICAgICBmdW5jdGlvbiBnZW5JdGVtcygpIHtcbiAgICAgICAgIHZhciByZXMgPSBbXTtcbiAgICAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8IHJuZEludCggNSApICsgMTsgaSsrICkge1xuICAgICAgICAgICAgcmVzLnB1c2goIHsgbmFtZTogaW5wdXRzWyBybmRJbnQoIGlucHV0cy5sZW5ndGggKSBdLCB1dWlkOiBVVUlEKCkgfSApO1xuICAgICAgICAgfVxuICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgIH1cblxuICAgfTtcblxuXG4gICAvLyBzdG9yZSB3aGljaCBjb25uIGlzIGluaXRpYXRvclxuICAgdmFyIGluaUNvbm4gPSBudWxsO1xuICAgdmFyIGVuZENvbm4gPSBudWxsO1xuICAgJHNjb3BlLiRvbiggJ3N0YXJ0Q29ubicsICggZSwgY29ubiApID0+IHtcblxuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIGluaUNvbm4gPSBjb25uO1xuXG4gICB9ICk7XG5cbiAgICRzY29wZS4kb24oICdlbmRDb25uJywgKCBlLCBjb25uICkgPT4ge1xuXG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgZW5kQ29ubiA9IGNvbm47XG5cbiAgICAgIC8vIHJlZ2lzdGVyIGNvbm5lY3Rpb25cbiAgICAgIGlmIChcbiAgICAgICAgIGluaUNvbm4gIT09IG51bGwgJiYgZW5kQ29ubiAhPT0gbnVsbCAmJlxuICAgICAgICAgaW5pQ29ubi51dWlkICE9PSBlbmRDb25uLnV1aWQgJiZcbiAgICAgICAgIGluaUNvbm4ucGFyZW50VVVJRCAhPT0gZW5kQ29ubi5wYXJlbnRVVUlEXG4gICAgICApIHtcblxuICAgICAgICAgaWYgKCBpbmlDb25uLnR5cGUgIT09IGVuZENvbm4udHlwZSApIHtcblxuICAgICAgICAgICAgdmFyIHBhaXIgPSBbXTtcbiAgICAgICAgICAgIHBhaXJbIGluaUNvbm4udHlwZSBdID0gaW5pQ29ubjtcbiAgICAgICAgICAgIHBhaXJbIGVuZENvbm4udHlwZSBdID0gZW5kQ29ubjtcblxuICAgICAgICAgICAgaWYgKCAhaXNEdXBsaWNhdGUoIHBhaXJbIDAgXSwgcGFpclsgMSBdICkgKSB7XG4gICAgICAgICAgICAgICAkc2NvcGUuY29ubmVjdGlvbi5wdXNoKCBwYWlyICk7XG4gICAgICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgY29uc29sZS5sb2coICdkdXBlcyBjb25uJyApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICB9XG5cbiAgICAgIH1cblxuICAgICAgLy8gcmVzZXRcbiAgICAgIGluaUNvbm4gPSBudWxsO1xuICAgICAgZW5kQ29ubiA9IG51bGw7XG5cbiAgIH0gKTtcblxuICAgZnVuY3Rpb24gaXNEdXBsaWNhdGUoIHNyYywgdGd0ICkge1xuXG4gICAgICByZXR1cm4gJHNjb3BlLmNvbm5lY3Rpb24uc29tZSggcGFpciA9PiBwYWlyWyAwIF0udXVpZCA9PT0gc3JjLnV1aWQgJiYgcGFpclsgMSBdLnV1aWQgPT09IHRndC51dWlkICk7XG5cbiAgIH1cblxufSBdO1xuIiwiXG5mdW5jdGlvbiBsaW5rKCAkc2NvcGUsICRlbGVtZW50ICkge1xuXG4gICAkZWxlbWVudC5zb3J0YWJsZSgge1xuICAgfSApO1xuICAgJGVsZW1lbnQub24oICdzb3J0IHNvcnR1cGRhdGUgc29ydHN0b3AnLCAkc2NvcGUuYnJvYWRjYXN0VXBkYXRlQ29ubiApO1xuXG59XG5cbmZ1bmN0aW9uIGNvbnRyb2xsZXIoICRzY29wZSwgJGVsZW1lbnQgKSB7XG5cbiAgIHRoaXMuZW5hYmxlU29ydCA9ICgpID0+IHtcbiAgICAgICRlbGVtZW50LnNvcnRhYmxlKCAnZW5hYmxlJyApO1xuICAgICAgLy8gY29uc29sZS5sb2coICdzb3J0IGVuYWJsZWQuJyApO1xuICAgfTtcbiAgIHRoaXMuZGlzYWJsZVNvcnQgPSAoKSA9PiB7XG4gICAgICAkZWxlbWVudC5zb3J0YWJsZSggJ2Rpc2FibGUnICk7XG4gICAgICAvLyBjb25zb2xlLmxvZyggJ3NvcnQgZGlzYWJsZWQuJyApO1xuICAgfTtcblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcblxuICAgcmV0dXJuIHtcblxuICAgICAgcmVzdHJpY3Q6ICdBJyxcbiAgICAgIHNjb3BlOiB0cnVlLFxuICAgICAgbGluayxcbiAgICAgIGNvbnRyb2xsZXJcblxuICAgfTtcblxufTtcbiIsImZ1bmN0aW9uIGNvbnRyb2xsZXIoICRzY29wZSApIHtcblxuXHRmdW5jdGlvbiB1cGRhdGVDb25uZWN0aW9uKCkge1xuXG5cdFx0dmFyIG9mZiA9IDU7XG5cblx0XHQkc2NvcGUuc3RhcnQgPSB7XG5cdFx0XHR4OiAkc2NvcGUucGFpclsgMCBdLnBvc2l0aW9uLmxlZnQgKyBvZmYsXG5cdFx0XHR5OiAkc2NvcGUucGFpclsgMCBdLnBvc2l0aW9uLnRvcCArIG9mZlxuXHRcdH07XG5cdFx0JHNjb3BlLmVuZCA9IHtcblx0XHRcdHg6ICRzY29wZS5wYWlyWyAxIF0ucG9zaXRpb24ubGVmdCArIG9mZixcblx0XHRcdHk6ICRzY29wZS5wYWlyWyAxIF0ucG9zaXRpb24udG9wICsgb2ZmXG5cdFx0fTtcblxuXHRcdHZhciBjcE9mZnNldCA9IE1hdGguYWJzKCAkc2NvcGUuc3RhcnQueCAtICRzY29wZS5lbmQueCApICogMC41O1xuXG5cdFx0JHNjb3BlLmNwMSA9IHtcblx0XHRcdHg6ICRzY29wZS5zdGFydC54IC0gY3BPZmZzZXQsXG5cdFx0XHR5OiAkc2NvcGUuc3RhcnQueVxuXHRcdH07XG5cdFx0JHNjb3BlLmNwMiA9IHtcblx0XHRcdHg6ICRzY29wZS5lbmQueCArIGNwT2Zmc2V0LFxuXHRcdFx0eTogJHNjb3BlLmVuZC55XG5cdFx0fTtcblxuXHR9XG5cblx0JHNjb3BlLiR3YXRjaCggJ3BhaXInLCB1cGRhdGVDb25uZWN0aW9uLCB0cnVlICk7XG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XG5cblx0cmV0dXJuIHtcblxuXHRcdHJlc3RyaWN0OiAnRScsXG5cdFx0cmVwbGFjZTogdHJ1ZSxcblx0XHR0ZW1wbGF0ZU5hbWVzcGFjZTogJ3N2ZycsXG5cdFx0dGVtcGxhdGU6ICc8cGF0aCBuZy1hdHRyLWQ9XCJNe3tzdGFydC54fX0se3tzdGFydC55fX0gQ3t7Y3AxLnh9fSx7e2NwMS55fX0ge3tjcDIueH19LHt7Y3AyLnl9fSB7e2VuZC54fX0se3tlbmQueX19XCIgaWQ9XCJjdXJ2ZVwiLz4nLFxuXHRcdHNjb3BlOiB7XG5cdFx0XHRwYWlyOiAnPSdcblx0XHR9LFxuXHRcdGNvbnRyb2xsZXJcblxuXHR9O1xuXG59O1xuIiwiZnVuY3Rpb24gbGluayggJHNjb3BlLCAkZWxlbWVudCwgJGF0dHJzICkge1xuXG4gICBpZiAoICEkZWxlbWVudC5hdHRyKCAndHJhbnNmb3JtJyApICkge1xuICAgICAgJGVsZW1lbnQuYXR0ciggJ3RyYW5zZm9ybScsICdtYXRyaXgoMSwwLDAsMSwwLDApJyApO1xuICAgfVxuXG4gICB2YXIgbW91c2Vob2xkID0gZmFsc2U7XG4gICB2YXIgcHJldlBvcyA9IHsgeDogbnVsbCwgeTogbnVsbCB9O1xuICAgdmFyIGN1cnJQb3MgPSB7IHg6IG51bGwsIHk6IG51bGwgfTtcblxuICAgdmFyIG1hdCA9IG51bGw7XG4gICB2YXIgbnVtUGF0dGVybiA9IC9bXFxkfFxcLnxcXCt8LV0rL2c7XG5cbiAgICQoICRhdHRycy5oYW5kbGVyIClcbiAgIC5vbiggJ21vdXNlZG93bicsIGUgPT4ge1xuXG4gICAgICBtb3VzZWhvbGQgPSB0cnVlO1xuICAgICAgcHJldlBvcy54ID0gZS5wYWdlWDtcbiAgICAgIHByZXZQb3MueSA9IGUucGFnZVk7XG5cbiAgICAgIG1hdCA9ICRlbGVtZW50LmF0dHIoICd0cmFuc2Zvcm0nICk7XG4gICAgICBtYXQgPSBtYXQubWF0Y2goIG51bVBhdHRlcm4gKS5tYXAoIHYgPT4gcGFyc2VGbG9hdCggdiApICk7XG5cbiAgIH0gKVxuICAgLm9uKCAnbW91c2V1cCcsIGUgPT4ge1xuICAgICAgbW91c2Vob2xkID0gZmFsc2U7XG4gICB9IClcbiAgIC5vbiggJ21vdXNlbW92ZScsIGUgPT4ge1xuXG4gICAgICBpZiAoIG1vdXNlaG9sZCApIHtcblxuICAgICAgICAgY3VyclBvcy54ID0gZS5wYWdlWDtcbiAgICAgICAgIGN1cnJQb3MueSA9IGUucGFnZVk7XG5cbiAgICAgICAgIHZhciBkeCA9IGN1cnJQb3MueCAtIHByZXZQb3MueDtcbiAgICAgICAgIHZhciBkeSA9IGN1cnJQb3MueSAtIHByZXZQb3MueTtcblxuICAgICAgICAgdmFyIG5ld1ggPSBtYXRbIDQgXSArIGR4O1xuICAgICAgICAgdmFyIG5ld1kgPSBtYXRbIDUgXSArIGR5O1xuXG4gICAgICAgICAkZWxlbWVudC5hdHRyKCAndHJhbnNmb3JtJywgYG1hdHJpeCgke21hdFswXX0sJHttYXRbMV19LCR7bWF0WzJdfSwke21hdFszXX0sJHtuZXdYfSwke25ld1l9KWAgKTtcblxuICAgICAgfVxuXG4gICB9ICk7XG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XG5cbiAgIHJldHVybiB7XG5cbiAgICAgIHJlc3RyaWN0OiAnQScsXG4gICAgICBsaW5rXG5cbiAgIH07XG5cbn07XG4iLCIvLyBqc2hpbnQgLVcwMTRcblxuZnVuY3Rpb24gbGluayggJHNjb3BlLCAkZWxlbWVudCwgJGF0dHJzICkge1xuXG4gICBpZiAoICEkZWxlbWVudC5hdHRyKCAndHJhbnNmb3JtJyApICkge1xuICAgICAgJGVsZW1lbnQuYXR0ciggJ3RyYW5zZm9ybScsICdtYXRyaXgoMSwwLDAsMSwwLDApJyApO1xuICAgfVxuXG4gICB2YXIgbnVtUGF0dGVybiA9IC9bXFxkfFxcLnxcXCt8LV0rL2c7XG5cbiAgIHZhciBoYW5kbGVyID0gJCggJGF0dHJzLmhhbmRsZXIgKTtcbiAgIGhhbmRsZXJcbiAgIC5vbiggJ21vdXNld2hlZWwnLCBlID0+IHtcblxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgdmFyIG1hdCA9ICRlbGVtZW50LmF0dHIoICd0cmFuc2Zvcm0nICkubWF0Y2goIG51bVBhdHRlcm4gKS5tYXAoIHYgPT4gcGFyc2VGbG9hdCggdiApICk7XG4gICAgICB2YXIgZ2FpbiA9IDIuMFxuICAgICAgLCBtaW56ID0gMC4yNVxuICAgICAgLCBtYXh6ID0gMTAuMFxuICAgICAgLCBkZCA9IGdhaW4gKiBNYXRoLnNpZ24oIGUub3JpZ2luYWxFdmVudC53aGVlbERlbHRhWSApICogMC4xXG5cbiAgICAgICwgc3MgPSBtYXRbIDAgXSArICggbWF0WyAwIF0gKiBkZCApXG4gICAgICAsIHNkID0gc3MgLyBtYXRbIDAgXVxuICAgICAgLCBveCA9IGUucGFnZVggLSBoYW5kbGVyLm9mZnNldCgpLmxlZnRcbiAgICAgICwgb3kgPSBlLnBhZ2VZIC0gaGFuZGxlci5vZmZzZXQoKS50b3BcbiAgICAgICwgY3ggPSBtYXRbIDQgXVxuICAgICAgLCBjeSA9IG1hdFsgNSBdXG4gICAgICAsIHh4ID0gc2QgKiAoIGN4IC0gb3ggKSArIG94XG4gICAgICAsIHl5ID0gc2QgKiAoIGN5IC0gb3kgKSArIG95XG4gICAgICA7XG5cbiAgICAgIGlmICggc3MgPCBtaW56IHx8IHNzID4gbWF4eiApIHJldHVybjtcblxuICAgICAgJGVsZW1lbnQuYXR0ciggJ3RyYW5zZm9ybScsIGBtYXRyaXgoJHtzc30sJHttYXRbMV19LCR7bWF0WzJdfSwke3NzfSwke3h4fSwke3l5fSlgICk7XG5cbiAgIH0gKTtcblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcblxuICAgcmV0dXJuIHtcblxuICAgICAgcmVzdHJpY3Q6ICdBJyxcbiAgICAgIGxpbmtcblxuICAgfTtcblxufTtcbiJdfQ==
