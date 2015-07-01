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
         uuid: '=',

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
      if (iniConn !== null && endConn !== null && iniConn.uuid !== endConn.uuid) {

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
// jshint -W014

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

   $('#testSvg').on('mousedown', function (e) {

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

   $('#testSvg').on('mousewheel', function (e) {

      e.preventDefault();
      var mat = $element.attr('transform').match(numPattern).map(function (v) {
         return parseFloat(v);
      });

      var gain = 2.0,
          minz = 0.1,
          maxz = 10.0,
          dd = gain * Math.sign(e.originalEvent.wheelDeltaY) * 0.1,
          ss = mat[0] + mat[0] * dd,
          sd = ss / mat[0],
          ox = e.pageX,
          oy = e.pageY,
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvdXVpZC9ybmctYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy91dWlkL3V1aWQuanMiLCIvVXNlcnMvTklYL0RvY3VtZW50cy9uaXgvZmxvdy9zcmMvaW5kZXguanMiLCIvVXNlcnMvTklYL0RvY3VtZW50cy9uaXgvZmxvdy9zcmMvbm9kZUJveC5qcyIsIi9Vc2Vycy9OSVgvRG9jdW1lbnRzL25peC9mbG93L3NyYy9ub2RlQ29ubmVjdG9yLmpzIiwiL1VzZXJzL05JWC9Eb2N1bWVudHMvbml4L2Zsb3cvc3JjL25vZGVDdHJsLmpzIiwiL1VzZXJzL05JWC9Eb2N1bWVudHMvbml4L2Zsb3cvc3JjL25vZGVJdGVtLmpzIiwiL1VzZXJzL05JWC9Eb2N1bWVudHMvbml4L2Zsb3cvc3JjL25vZGVMaW5rLmpzIiwiL1VzZXJzL05JWC9Eb2N1bWVudHMvbml4L2Zsb3cvc3JjL3N2Zy1wYW5uYWJsZS5qcyIsIi9Vc2Vycy9OSVgvRG9jdW1lbnRzL25peC9mbG93L3NyYy9zdmctem9vbWFibGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUN2TEEsTUFBTSxDQUFDLElBQUksR0FBRyxPQUFPLENBQUUsTUFBTSxDQUFFLENBQUM7O0FBRWhDLE9BQU8sQ0FBQyxNQUFNLENBQUUsU0FBUyxFQUFFLEVBQUUsQ0FBRSxDQUM3QixVQUFVLENBQUUsVUFBVSxFQUFFLE9BQU8sQ0FBRSxZQUFZ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QUMsQ0FBQyxTQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsU0FBSSxFQUFFLFNBQUksRUFBRSxTQUFJLEVBQUUsT0FBSyxDQUFDO0lBRXRGLENBQUUsQ0FBQztDQUVOOztBQUVELE1BQU0sQ0FBQyxPQUFPLEdBQUcsWUFBTTs7QUFFcEIsVUFBTzs7QUFFSixjQUFRLEVBQUUsR0FBRztBQUNiLFVBQUksRUFBSixJQUFJOztJQUVOLENBQUM7Q0FFSixDQUFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlxudmFyIHJuZztcblxuaWYgKGdsb2JhbC5jcnlwdG8gJiYgY3J5cHRvLmdldFJhbmRvbVZhbHVlcykge1xuICAvLyBXSEFUV0cgY3J5cHRvLWJhc2VkIFJORyAtIGh0dHA6Ly93aWtpLndoYXR3Zy5vcmcvd2lraS9DcnlwdG9cbiAgLy8gTW9kZXJhdGVseSBmYXN0LCBoaWdoIHF1YWxpdHlcbiAgdmFyIF9ybmRzOCA9IG5ldyBVaW50OEFycmF5KDE2KTtcbiAgcm5nID0gZnVuY3Rpb24gd2hhdHdnUk5HKCkge1xuICAgIGNyeXB0by5nZXRSYW5kb21WYWx1ZXMoX3JuZHM4KTtcbiAgICByZXR1cm4gX3JuZHM4O1xuICB9O1xufVxuXG5pZiAoIXJuZykge1xuICAvLyBNYXRoLnJhbmRvbSgpLWJhc2VkIChSTkcpXG4gIC8vXG4gIC8vIElmIGFsbCBlbHNlIGZhaWxzLCB1c2UgTWF0aC5yYW5kb20oKS4gIEl0J3MgZmFzdCwgYnV0IGlzIG9mIHVuc3BlY2lmaWVkXG4gIC8vIHF1YWxpdHkuXG4gIHZhciAgX3JuZHMgPSBuZXcgQXJyYXkoMTYpO1xuICBybmcgPSBmdW5jdGlvbigpIHtcbiAgICBmb3IgKHZhciBpID0gMCwgcjsgaSA8IDE2OyBpKyspIHtcbiAgICAgIGlmICgoaSAmIDB4MDMpID09PSAwKSByID0gTWF0aC5yYW5kb20oKSAqIDB4MTAwMDAwMDAwO1xuICAgICAgX3JuZHNbaV0gPSByID4+PiAoKGkgJiAweDAzKSA8PCAzKSAmIDB4ZmY7XG4gICAgfVxuXG4gICAgcmV0dXJuIF9ybmRzO1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHJuZztcblxuIiwiLy8gICAgIHV1aWQuanNcbi8vXG4vLyAgICAgQ29weXJpZ2h0IChjKSAyMDEwLTIwMTIgUm9iZXJ0IEtpZWZmZXJcbi8vICAgICBNSVQgTGljZW5zZSAtIGh0dHA6Ly9vcGVuc291cmNlLm9yZy9saWNlbnNlcy9taXQtbGljZW5zZS5waHBcblxuLy8gVW5pcXVlIElEIGNyZWF0aW9uIHJlcXVpcmVzIGEgaGlnaCBxdWFsaXR5IHJhbmRvbSAjIGdlbmVyYXRvci4gIFdlIGZlYXR1cmVcbi8vIGRldGVjdCB0byBkZXRlcm1pbmUgdGhlIGJlc3QgUk5HIHNvdXJjZSwgbm9ybWFsaXppbmcgdG8gYSBmdW5jdGlvbiB0aGF0XG4vLyByZXR1cm5zIDEyOC1iaXRzIG9mIHJhbmRvbW5lc3MsIHNpbmNlIHRoYXQncyB3aGF0J3MgdXN1YWxseSByZXF1aXJlZFxudmFyIF9ybmcgPSByZXF1aXJlKCcuL3JuZycpO1xuXG4vLyBNYXBzIGZvciBudW1iZXIgPC0+IGhleCBzdHJpbmcgY29udmVyc2lvblxudmFyIF9ieXRlVG9IZXggPSBbXTtcbnZhciBfaGV4VG9CeXRlID0ge307XG5mb3IgKHZhciBpID0gMDsgaSA8IDI1NjsgaSsrKSB7XG4gIF9ieXRlVG9IZXhbaV0gPSAoaSArIDB4MTAwKS50b1N0cmluZygxNikuc3Vic3RyKDEpO1xuICBfaGV4VG9CeXRlW19ieXRlVG9IZXhbaV1dID0gaTtcbn1cblxuLy8gKipgcGFyc2UoKWAgLSBQYXJzZSBhIFVVSUQgaW50byBpdCdzIGNvbXBvbmVudCBieXRlcyoqXG5mdW5jdGlvbiBwYXJzZShzLCBidWYsIG9mZnNldCkge1xuICB2YXIgaSA9IChidWYgJiYgb2Zmc2V0KSB8fCAwLCBpaSA9IDA7XG5cbiAgYnVmID0gYnVmIHx8IFtdO1xuICBzLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvWzAtOWEtZl17Mn0vZywgZnVuY3Rpb24ob2N0KSB7XG4gICAgaWYgKGlpIDwgMTYpIHsgLy8gRG9uJ3Qgb3ZlcmZsb3chXG4gICAgICBidWZbaSArIGlpKytdID0gX2hleFRvQnl0ZVtvY3RdO1xuICAgIH1cbiAgfSk7XG5cbiAgLy8gWmVybyBvdXQgcmVtYWluaW5nIGJ5dGVzIGlmIHN0cmluZyB3YXMgc2hvcnRcbiAgd2hpbGUgKGlpIDwgMTYpIHtcbiAgICBidWZbaSArIGlpKytdID0gMDtcbiAgfVxuXG4gIHJldHVybiBidWY7XG59XG5cbi8vICoqYHVucGFyc2UoKWAgLSBDb252ZXJ0IFVVSUQgYnl0ZSBhcnJheSAoYWxhIHBhcnNlKCkpIGludG8gYSBzdHJpbmcqKlxuZnVuY3Rpb24gdW5wYXJzZShidWYsIG9mZnNldCkge1xuICB2YXIgaSA9IG9mZnNldCB8fCAwLCBidGggPSBfYnl0ZVRvSGV4O1xuICByZXR1cm4gIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dICtcbiAgICAgICAgICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXSArICctJyArXG4gICAgICAgICAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV0gKyAnLScgK1xuICAgICAgICAgIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dICsgJy0nICtcbiAgICAgICAgICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXSArICctJyArXG4gICAgICAgICAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV0gK1xuICAgICAgICAgIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dICtcbiAgICAgICAgICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXTtcbn1cblxuLy8gKipgdjEoKWAgLSBHZW5lcmF0ZSB0aW1lLWJhc2VkIFVVSUQqKlxuLy9cbi8vIEluc3BpcmVkIGJ5IGh0dHBzOi8vZ2l0aHViLmNvbS9MaW9zSy9VVUlELmpzXG4vLyBhbmQgaHR0cDovL2RvY3MucHl0aG9uLm9yZy9saWJyYXJ5L3V1aWQuaHRtbFxuXG4vLyByYW5kb20gIydzIHdlIG5lZWQgdG8gaW5pdCBub2RlIGFuZCBjbG9ja3NlcVxudmFyIF9zZWVkQnl0ZXMgPSBfcm5nKCk7XG5cbi8vIFBlciA0LjUsIGNyZWF0ZSBhbmQgNDgtYml0IG5vZGUgaWQsICg0NyByYW5kb20gYml0cyArIG11bHRpY2FzdCBiaXQgPSAxKVxudmFyIF9ub2RlSWQgPSBbXG4gIF9zZWVkQnl0ZXNbMF0gfCAweDAxLFxuICBfc2VlZEJ5dGVzWzFdLCBfc2VlZEJ5dGVzWzJdLCBfc2VlZEJ5dGVzWzNdLCBfc2VlZEJ5dGVzWzRdLCBfc2VlZEJ5dGVzWzVdXG5dO1xuXG4vLyBQZXIgNC4yLjIsIHJhbmRvbWl6ZSAoMTQgYml0KSBjbG9ja3NlcVxudmFyIF9jbG9ja3NlcSA9IChfc2VlZEJ5dGVzWzZdIDw8IDggfCBfc2VlZEJ5dGVzWzddKSAmIDB4M2ZmZjtcblxuLy8gUHJldmlvdXMgdXVpZCBjcmVhdGlvbiB0aW1lXG52YXIgX2xhc3RNU2VjcyA9IDAsIF9sYXN0TlNlY3MgPSAwO1xuXG4vLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2Jyb29mYS9ub2RlLXV1aWQgZm9yIEFQSSBkZXRhaWxzXG5mdW5jdGlvbiB2MShvcHRpb25zLCBidWYsIG9mZnNldCkge1xuICB2YXIgaSA9IGJ1ZiAmJiBvZmZzZXQgfHwgMDtcbiAgdmFyIGIgPSBidWYgfHwgW107XG5cbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgdmFyIGNsb2Nrc2VxID0gb3B0aW9ucy5jbG9ja3NlcSAhPT0gdW5kZWZpbmVkID8gb3B0aW9ucy5jbG9ja3NlcSA6IF9jbG9ja3NlcTtcblxuICAvLyBVVUlEIHRpbWVzdGFtcHMgYXJlIDEwMCBuYW5vLXNlY29uZCB1bml0cyBzaW5jZSB0aGUgR3JlZ29yaWFuIGVwb2NoLFxuICAvLyAoMTU4Mi0xMC0xNSAwMDowMCkuICBKU051bWJlcnMgYXJlbid0IHByZWNpc2UgZW5vdWdoIGZvciB0aGlzLCBzb1xuICAvLyB0aW1lIGlzIGhhbmRsZWQgaW50ZXJuYWxseSBhcyAnbXNlY3MnIChpbnRlZ2VyIG1pbGxpc2Vjb25kcykgYW5kICduc2VjcydcbiAgLy8gKDEwMC1uYW5vc2Vjb25kcyBvZmZzZXQgZnJvbSBtc2Vjcykgc2luY2UgdW5peCBlcG9jaCwgMTk3MC0wMS0wMSAwMDowMC5cbiAgdmFyIG1zZWNzID0gb3B0aW9ucy5tc2VjcyAhPT0gdW5kZWZpbmVkID8gb3B0aW9ucy5tc2VjcyA6IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXG4gIC8vIFBlciA0LjIuMS4yLCB1c2UgY291bnQgb2YgdXVpZCdzIGdlbmVyYXRlZCBkdXJpbmcgdGhlIGN1cnJlbnQgY2xvY2tcbiAgLy8gY3ljbGUgdG8gc2ltdWxhdGUgaGlnaGVyIHJlc29sdXRpb24gY2xvY2tcbiAgdmFyIG5zZWNzID0gb3B0aW9ucy5uc2VjcyAhPT0gdW5kZWZpbmVkID8gb3B0aW9ucy5uc2VjcyA6IF9sYXN0TlNlY3MgKyAxO1xuXG4gIC8vIFRpbWUgc2luY2UgbGFzdCB1dWlkIGNyZWF0aW9uIChpbiBtc2VjcylcbiAgdmFyIGR0ID0gKG1zZWNzIC0gX2xhc3RNU2VjcykgKyAobnNlY3MgLSBfbGFzdE5TZWNzKS8xMDAwMDtcblxuICAvLyBQZXIgNC4yLjEuMiwgQnVtcCBjbG9ja3NlcSBvbiBjbG9jayByZWdyZXNzaW9uXG4gIGlmIChkdCA8IDAgJiYgb3B0aW9ucy5jbG9ja3NlcSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgY2xvY2tzZXEgPSBjbG9ja3NlcSArIDEgJiAweDNmZmY7XG4gIH1cblxuICAvLyBSZXNldCBuc2VjcyBpZiBjbG9jayByZWdyZXNzZXMgKG5ldyBjbG9ja3NlcSkgb3Igd2UndmUgbW92ZWQgb250byBhIG5ld1xuICAvLyB0aW1lIGludGVydmFsXG4gIGlmICgoZHQgPCAwIHx8IG1zZWNzID4gX2xhc3RNU2VjcykgJiYgb3B0aW9ucy5uc2VjcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgbnNlY3MgPSAwO1xuICB9XG5cbiAgLy8gUGVyIDQuMi4xLjIgVGhyb3cgZXJyb3IgaWYgdG9vIG1hbnkgdXVpZHMgYXJlIHJlcXVlc3RlZFxuICBpZiAobnNlY3MgPj0gMTAwMDApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3V1aWQudjEoKTogQ2FuXFwndCBjcmVhdGUgbW9yZSB0aGFuIDEwTSB1dWlkcy9zZWMnKTtcbiAgfVxuXG4gIF9sYXN0TVNlY3MgPSBtc2VjcztcbiAgX2xhc3ROU2VjcyA9IG5zZWNzO1xuICBfY2xvY2tzZXEgPSBjbG9ja3NlcTtcblxuICAvLyBQZXIgNC4xLjQgLSBDb252ZXJ0IGZyb20gdW5peCBlcG9jaCB0byBHcmVnb3JpYW4gZXBvY2hcbiAgbXNlY3MgKz0gMTIyMTkyOTI4MDAwMDA7XG5cbiAgLy8gYHRpbWVfbG93YFxuICB2YXIgdGwgPSAoKG1zZWNzICYgMHhmZmZmZmZmKSAqIDEwMDAwICsgbnNlY3MpICUgMHgxMDAwMDAwMDA7XG4gIGJbaSsrXSA9IHRsID4+PiAyNCAmIDB4ZmY7XG4gIGJbaSsrXSA9IHRsID4+PiAxNiAmIDB4ZmY7XG4gIGJbaSsrXSA9IHRsID4+PiA4ICYgMHhmZjtcbiAgYltpKytdID0gdGwgJiAweGZmO1xuXG4gIC8vIGB0aW1lX21pZGBcbiAgdmFyIHRtaCA9IChtc2VjcyAvIDB4MTAwMDAwMDAwICogMTAwMDApICYgMHhmZmZmZmZmO1xuICBiW2krK10gPSB0bWggPj4+IDggJiAweGZmO1xuICBiW2krK10gPSB0bWggJiAweGZmO1xuXG4gIC8vIGB0aW1lX2hpZ2hfYW5kX3ZlcnNpb25gXG4gIGJbaSsrXSA9IHRtaCA+Pj4gMjQgJiAweGYgfCAweDEwOyAvLyBpbmNsdWRlIHZlcnNpb25cbiAgYltpKytdID0gdG1oID4+PiAxNiAmIDB4ZmY7XG5cbiAgLy8gYGNsb2NrX3NlcV9oaV9hbmRfcmVzZXJ2ZWRgIChQZXIgNC4yLjIgLSBpbmNsdWRlIHZhcmlhbnQpXG4gIGJbaSsrXSA9IGNsb2Nrc2VxID4+PiA4IHwgMHg4MDtcblxuICAvLyBgY2xvY2tfc2VxX2xvd2BcbiAgYltpKytdID0gY2xvY2tzZXEgJiAweGZmO1xuXG4gIC8vIGBub2RlYFxuICB2YXIgbm9kZSA9IG9wdGlvbnMubm9kZSB8fCBfbm9kZUlkO1xuICBmb3IgKHZhciBuID0gMDsgbiA8IDY7IG4rKykge1xuICAgIGJbaSArIG5dID0gbm9kZVtuXTtcbiAgfVxuXG4gIHJldHVybiBidWYgPyBidWYgOiB1bnBhcnNlKGIpO1xufVxuXG4vLyAqKmB2NCgpYCAtIEdlbmVyYXRlIHJhbmRvbSBVVUlEKipcblxuLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9icm9vZmEvbm9kZS11dWlkIGZvciBBUEkgZGV0YWlsc1xuZnVuY3Rpb24gdjQob3B0aW9ucywgYnVmLCBvZmZzZXQpIHtcbiAgLy8gRGVwcmVjYXRlZCAtICdmb3JtYXQnIGFyZ3VtZW50LCBhcyBzdXBwb3J0ZWQgaW4gdjEuMlxuICB2YXIgaSA9IGJ1ZiAmJiBvZmZzZXQgfHwgMDtcblxuICBpZiAodHlwZW9mKG9wdGlvbnMpID09ICdzdHJpbmcnKSB7XG4gICAgYnVmID0gb3B0aW9ucyA9PSAnYmluYXJ5JyA/IG5ldyBBcnJheSgxNikgOiBudWxsO1xuICAgIG9wdGlvbnMgPSBudWxsO1xuICB9XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gIHZhciBybmRzID0gb3B0aW9ucy5yYW5kb20gfHwgKG9wdGlvbnMucm5nIHx8IF9ybmcpKCk7XG5cbiAgLy8gUGVyIDQuNCwgc2V0IGJpdHMgZm9yIHZlcnNpb24gYW5kIGBjbG9ja19zZXFfaGlfYW5kX3Jlc2VydmVkYFxuICBybmRzWzZdID0gKHJuZHNbNl0gJiAweDBmKSB8IDB4NDA7XG4gIHJuZHNbOF0gPSAocm5kc1s4XSAmIDB4M2YpIHwgMHg4MDtcblxuICAvLyBDb3B5IGJ5dGVzIHRvIGJ1ZmZlciwgaWYgcHJvdmlkZWRcbiAgaWYgKGJ1Zikge1xuICAgIGZvciAodmFyIGlpID0gMDsgaWkgPCAxNjsgaWkrKykge1xuICAgICAgYnVmW2kgKyBpaV0gPSBybmRzW2lpXTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYnVmIHx8IHVucGFyc2Uocm5kcyk7XG59XG5cbi8vIEV4cG9ydCBwdWJsaWMgQVBJXG52YXIgdXVpZCA9IHY0O1xudXVpZC52MSA9IHYxO1xudXVpZC52NCA9IHY0O1xudXVpZC5wYXJzZSA9IHBhcnNlO1xudXVpZC51bnBhcnNlID0gdW5wYXJzZTtcblxubW9kdWxlLmV4cG9ydHMgPSB1dWlkO1xuIiwiZ2xvYmFsLlVVSUQgPSByZXF1aXJlKCAndXVpZCcgKTtcblxuYW5ndWxhci5tb2R1bGUoICdub2RlQXBwJywgW10gKVxuXHQuY29udHJvbGxlciggJ25vZGVDdHJsJywgcmVxdWlyZSggJy4vbm9kZUN0cmwnICkgKVxuXHQuZGlyZWN0aXZlKCAnbm9kZUJveCcsIHJlcXVpcmUoICcuL25vZGVCb3gnICkgKVxuXHQuZGlyZWN0aXZlKCAnbm9kZUl0ZW0nLCByZXF1aXJlKCAnLi9ub2RlSXRlbScgKSApXG5cdC5kaXJlY3RpdmUoICdub2RlQ29ubmVjdG9yJywgcmVxdWlyZSggJy4vbm9kZUNvbm5lY3RvcicgKSApXG5cdC5kaXJlY3RpdmUoICdub2RlTGluaycsIHJlcXVpcmUoICcuL25vZGVMaW5rJyApIClcblx0LmRpcmVjdGl2ZSggJ3N2Z1Bhbm5hYmxlJywgcmVxdWlyZSggJy4vc3ZnLXBhbm5hYmxlJyApIClcblx0LmRpcmVjdGl2ZSggJ3N2Z1pvb21hYmxlJywgcmVxdWlyZSggJy4vc3ZnLXpvb21hYmxlJyApIClcblx0O1xuIiwiXG5mdW5jdGlvbiBjb250cm9sbGVyKCAkc2NvcGUsICRlbGVtZW50ICkge1xuXG4gICAkZWxlbWVudC5kcmFnZ2FibGUoKTtcblxuICAgJHNjb3BlLmJyb2FkY2FzdFVwZGF0ZUNvbm4gPSAoKSA9PiB7XG4gICAgICBzZXRUaW1lb3V0KCAoKSA9PiAkc2NvcGUuJGJyb2FkY2FzdCggJ2Nvbm5lY3Rpb25OZWVkc1VwZGF0ZScgKSwgMCApO1xuICAgfTtcblxuICAgJGVsZW1lbnQub24oICdkcmFnIGRyYWdzdGFydCBkcmFnc3RvcCcsICRzY29wZS5icm9hZGNhc3RVcGRhdGVDb25uICk7XG5cbiAgIHRoaXMuZW5hYmxlRHJhZyA9ICgpID0+IHtcbiAgICAgICRlbGVtZW50LmRyYWdnYWJsZSggJ2VuYWJsZScgKTtcbiAgICAgIC8vIGNvbnNvbGUubG9nKCAnZHJhZyBlbmFibGVkLicgKTtcbiAgIH07XG4gICB0aGlzLmRpc2FibGVEcmFnID0gKCkgPT4ge1xuICAgICAgJGVsZW1lbnQuZHJhZ2dhYmxlKCAnZGlzYWJsZScgKTtcbiAgICAgIC8vIGNvbnNvbGUubG9nKCAnZHJhZyBkaXNhYmxlZC4nICk7XG4gICB9O1xuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gKCkgPT4ge1xuXG4gICByZXR1cm4ge1xuICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgIHJlcGxhY2U6IHRydWUsXG4gICAgICB0ZW1wbGF0ZVVybDogJy4vdGVtcGxhdGUvbm9kZS5odG1sJyxcbiAgICAgIHNjb3BlOiB7XG4gICAgICAgICBub2RlT2JqZWN0OiAnPSdcbiAgICAgIH0sXG4gICAgICBjb250cm9sbGVyXG4gICB9O1xuXG59O1xuIiwiXG5mdW5jdGlvbiBsaW5rKCAkc2NvcGUsICRlbGVtZW50LCAkYXR0cnMsICRjb250cm9sbGVyICkge1xuXG4gICB2YXIgbm9kZURpckN0cmwgPSAkY29udHJvbGxlclsgMCBdO1xuICAgdmFyIG5vZGVTb3J0Q3RybCA9ICRjb250cm9sbGVyWyAxIF07XG5cbiAgICRlbGVtZW50XG4gICAub24oICdtb3VzZWVudGVyJywgZSAgPT4ge1xuICAgICAgbm9kZURpckN0cmwuZGlzYWJsZURyYWcoKTtcbiAgICAgIG5vZGVTb3J0Q3RybC5kaXNhYmxlU29ydCgpO1xuICAgfSApXG4gICAub24oICdtb3VzZWxlYXZlJywgZSA9PiB7XG4gICAgICBub2RlRGlyQ3RybC5lbmFibGVEcmFnKCk7XG4gICAgICBub2RlU29ydEN0cmwuZW5hYmxlU29ydCgpO1xuICAgfSApXG4gICAub24oICdtb3VzZWRvd24nLCBlID0+IHtcbiAgICAgICRzY29wZS5zdGFydENvbm4oKTtcbiAgIH0gKVxuICAgLm9uKCAnbW91c2V1cCcsIGUgPT4ge1xuICAgICAgJHNjb3BlLmVuZENvbm4oKTtcbiAgIH0gKTtcblxuICAgdmFyIGNvbm4gPSAkc2NvcGUuaW5wdXQgPyAkc2NvcGUuaW5wdXQgOiAkc2NvcGUub3V0cHV0O1xuICAgY29ubi50eXBlID0gJHNjb3BlLmlucHV0ID8gMCA6IDE7XG5cbiAgIHVwZGF0ZUNvbm4oKTtcbiAgIGZ1bmN0aW9uIHVwZGF0ZUNvbm4oKSB7XG5cbiAgICAgIGNvbm4ucG9zaXRpb24gPSAkZWxlbWVudC5vZmZzZXQoKTtcbiAgICAgIGNvbm4ucG9zaXRpb24ubGVmdCAtPSAkKCAnI25vZGVDYW52YXMnICkub2Zmc2V0KCkubGVmdDtcbiAgICAgIGNvbm4ucG9zaXRpb24udG9wIC09ICQoICcjbm9kZUNhbnZhcycgKS5vZmZzZXQoKS50b3A7XG5cbiAgIH1cblxuXG5cblxuICAgJHNjb3BlLnN0YXJ0Q29ubiA9ICgpID0+IHtcblxuICAgICAgdXBkYXRlQ29ubigpO1xuICAgICAgJHNjb3BlLiRlbWl0KCAnc3RhcnRDb25uJywgY29ubiApO1xuXG4gICB9O1xuXG4gICAkc2NvcGUuZW5kQ29ubiA9ICgpID0+IHtcblxuICAgICAgdXBkYXRlQ29ubigpO1xuICAgICAgJHNjb3BlLiRlbWl0KCAnZW5kQ29ubicsIGNvbm4gKTtcblxuICAgfTtcblxuICAgJHNjb3BlLiRvbiggJ2Nvbm5lY3Rpb25OZWVkc1VwZGF0ZScsICgpID0+IHtcblxuICAgICAgdXBkYXRlQ29ubigpO1xuICAgICAgJHNjb3BlLiRhcHBseSgpO1xuXG4gICB9ICk7XG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XG5cbiAgIHJldHVybiB7XG5cbiAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICByZXF1aXJlOiBbICdebm9kZUJveCcsICdebm9kZUl0ZW0nIF0sXG4gICAgICBzY29wZToge1xuICAgICAgICAgdXVpZDogJz0nLFxuXG4gICAgICAgICBpbnB1dDogJz0nLFxuICAgICAgICAgb3V0cHV0OiAnPSdcblxuICAgICAgfSxcbiAgICAgIGxpbmtcblxuICAgfTtcblxufTtcblxuLy8gdG9kbyBjaG9wIGRpcmVjdGl2ZVxuIiwiXG5tb2R1bGUuZXhwb3J0cyA9IFsgJyRzY29wZScsICckcm9vdFNjb3BlJywgKCAkc2NvcGUsICRyb290U2NvcGUgKSA9PiB7XG5cbiAgIGdsb2JhbC5TQ09QRSA9ICRzY29wZTtcblxuICAgJHNjb3BlLm5vZGVzID0gW107XG4gICAkc2NvcGUuY29ubmVjdGlvbiA9IFtdO1xuXG4gICAkc2NvcGUuZ2VuZXJhdGVOb2RlID0gKCkgPT4ge1xuXG4gICAgICB2YXIgaW5wdXRzID0gWyAnZGF0YScsICd4JywgJ3knLCAneicsICd3JywgJ3V2JywgJ21hdDQnLCAndmVjMicsICdjb2xvcicsICdnZW9tZXRyeScsICd2ZWN0b3IzJywgJ2J1ZmZlcicsICdtZXNoJywgJ21hdGVyaWFsJyBdO1xuXG4gICAgICB2YXIgcm5kSW50ID0gbiA9PiB7IHJldHVybiB+figgTWF0aC5yYW5kb20oKSAqIG4gKTsgfTtcblxuICAgICAgdmFyIG5vZGUgPSB7XG4gICAgICAgICB0aXRsZTogaW5wdXRzWyBybmRJbnQoIGlucHV0cy5sZW5ndGggKSBdLFxuICAgICAgICAgdXVpZDogVVVJRCgpLFxuICAgICAgICAgaW5wdXQ6IGdlbkl0ZW1zKCksXG4gICAgICAgICBvdXRwdXQ6IGdlbkl0ZW1zKClcbiAgICAgIH07XG5cbiAgICAgICRzY29wZS5ub2Rlcy5wdXNoKCBub2RlICk7XG4gICAgICByZXR1cm4gbm9kZTtcblxuICAgICAgZnVuY3Rpb24gZ2VuSXRlbXMoKSB7XG4gICAgICAgICB2YXIgcmVzID0gW107XG4gICAgICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCBybmRJbnQoIDUgKSArIDE7IGkrKyApIHtcbiAgICAgICAgICAgIHJlcy5wdXNoKCB7IG5hbWU6IGlucHV0c1sgcm5kSW50KCBpbnB1dHMubGVuZ3RoICkgXSwgdXVpZDogVVVJRCgpIH0gKTtcbiAgICAgICAgIH1cbiAgICAgICAgIHJldHVybiByZXM7XG4gICAgICB9XG5cbiAgIH07XG5cblxuICAgLy8gc3RvcmUgd2hpY2ggY29ubiBpcyBpbml0aWF0b3JcbiAgIHZhciBpbmlDb25uID0gbnVsbDtcbiAgIHZhciBlbmRDb25uID0gbnVsbDtcbiAgICRzY29wZS4kb24oICdzdGFydENvbm4nLCAoIGUsIGNvbm4gKSA9PiB7XG5cbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICBpbmlDb25uID0gY29ubjtcblxuICAgfSApO1xuXG4gICAkc2NvcGUuJG9uKCAnZW5kQ29ubicsICggZSwgY29ubiApID0+IHtcblxuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIGVuZENvbm4gPSBjb25uO1xuXG4gICAgICAvLyByZWdpc3RlciBjb25uZWN0aW9uXG4gICAgICBpZiAoIGluaUNvbm4gIT09IG51bGwgJiYgZW5kQ29ubiAhPT0gbnVsbCAmJiBpbmlDb25uLnV1aWQgIT09IGVuZENvbm4udXVpZCApIHtcblxuICAgICAgICAgaWYgKCBpbmlDb25uLnR5cGUgIT09IGVuZENvbm4udHlwZSApIHtcblxuICAgICAgICAgICAgdmFyIHBhaXIgPSBbXTtcbiAgICAgICAgICAgIHBhaXJbIGluaUNvbm4udHlwZSBdID0gaW5pQ29ubjtcbiAgICAgICAgICAgIHBhaXJbIGVuZENvbm4udHlwZSBdID0gZW5kQ29ubjtcblxuICAgICAgICAgICAgaWYgKCAhaXNEdXBsaWNhdGUoIHBhaXJbIDAgXSwgcGFpclsgMSBdICkgKSB7XG4gICAgICAgICAgICAgICAkc2NvcGUuY29ubmVjdGlvbi5wdXNoKCBwYWlyICk7XG4gICAgICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgY29uc29sZS5sb2coICdkdXBlcyBjb25uJyApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICB9XG5cbiAgICAgIH1cblxuICAgICAgLy8gcmVzZXRcbiAgICAgIGluaUNvbm4gPSBudWxsO1xuICAgICAgZW5kQ29ubiA9IG51bGw7XG5cbiAgIH0gKTtcblxuICAgZnVuY3Rpb24gaXNEdXBsaWNhdGUoIHNyYywgdGd0ICkge1xuXG4gICAgICByZXR1cm4gJHNjb3BlLmNvbm5lY3Rpb24uc29tZSggcGFpciA9PiBwYWlyWyAwIF0udXVpZCA9PT0gc3JjLnV1aWQgJiYgcGFpclsgMSBdLnV1aWQgPT09IHRndC51dWlkICk7XG5cbiAgIH1cblxufSBdO1xuIiwiXG5mdW5jdGlvbiBsaW5rKCAkc2NvcGUsICRlbGVtZW50ICkge1xuXG4gICAkZWxlbWVudC5zb3J0YWJsZSgge1xuICAgfSApO1xuICAgJGVsZW1lbnQub24oICdzb3J0IHNvcnR1cGRhdGUgc29ydHN0b3AnLCAkc2NvcGUuYnJvYWRjYXN0VXBkYXRlQ29ubiApO1xuXG59XG5cbmZ1bmN0aW9uIGNvbnRyb2xsZXIoICRzY29wZSwgJGVsZW1lbnQgKSB7XG5cbiAgIHRoaXMuZW5hYmxlU29ydCA9ICgpID0+IHtcbiAgICAgICRlbGVtZW50LnNvcnRhYmxlKCAnZW5hYmxlJyApO1xuICAgICAgLy8gY29uc29sZS5sb2coICdzb3J0IGVuYWJsZWQuJyApO1xuICAgfTtcbiAgIHRoaXMuZGlzYWJsZVNvcnQgPSAoKSA9PiB7XG4gICAgICAkZWxlbWVudC5zb3J0YWJsZSggJ2Rpc2FibGUnICk7XG4gICAgICAvLyBjb25zb2xlLmxvZyggJ3NvcnQgZGlzYWJsZWQuJyApO1xuICAgfTtcblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcblxuICAgcmV0dXJuIHtcblxuICAgICAgcmVzdHJpY3Q6ICdBJyxcbiAgICAgIHNjb3BlOiB0cnVlLFxuICAgICAgbGluayxcbiAgICAgIGNvbnRyb2xsZXJcblxuICAgfTtcblxufTtcbiIsImZ1bmN0aW9uIGNvbnRyb2xsZXIoICRzY29wZSApIHtcblxuXHRmdW5jdGlvbiB1cGRhdGVDb25uZWN0aW9uKCkge1xuXG5cdFx0dmFyIG9mZiA9IDU7XG5cblx0XHQkc2NvcGUuc3RhcnQgPSB7XG5cdFx0XHR4OiAkc2NvcGUucGFpclsgMCBdLnBvc2l0aW9uLmxlZnQgKyBvZmYsXG5cdFx0XHR5OiAkc2NvcGUucGFpclsgMCBdLnBvc2l0aW9uLnRvcCArIG9mZlxuXHRcdH07XG5cdFx0JHNjb3BlLmVuZCA9IHtcblx0XHRcdHg6ICRzY29wZS5wYWlyWyAxIF0ucG9zaXRpb24ubGVmdCArIG9mZixcblx0XHRcdHk6ICRzY29wZS5wYWlyWyAxIF0ucG9zaXRpb24udG9wICsgb2ZmXG5cdFx0fTtcblxuXHRcdHZhciBjcE9mZnNldCA9IE1hdGguYWJzKCAkc2NvcGUuc3RhcnQueCAtICRzY29wZS5lbmQueCApICogMC41O1xuXG5cdFx0JHNjb3BlLmNwMSA9IHtcblx0XHRcdHg6ICRzY29wZS5zdGFydC54IC0gY3BPZmZzZXQsXG5cdFx0XHR5OiAkc2NvcGUuc3RhcnQueVxuXHRcdH07XG5cdFx0JHNjb3BlLmNwMiA9IHtcblx0XHRcdHg6ICRzY29wZS5lbmQueCArIGNwT2Zmc2V0LFxuXHRcdFx0eTogJHNjb3BlLmVuZC55XG5cdFx0fTtcblxuXHR9XG5cblx0JHNjb3BlLiR3YXRjaCggJ3BhaXInLCB1cGRhdGVDb25uZWN0aW9uLCB0cnVlICk7XG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XG5cblx0cmV0dXJuIHtcblxuXHRcdHJlc3RyaWN0OiAnRScsXG5cdFx0cmVwbGFjZTogdHJ1ZSxcblx0XHR0ZW1wbGF0ZU5hbWVzcGFjZTogJ3N2ZycsXG5cdFx0dGVtcGxhdGU6ICc8cGF0aCBuZy1hdHRyLWQ9XCJNe3tzdGFydC54fX0se3tzdGFydC55fX0gQ3t7Y3AxLnh9fSx7e2NwMS55fX0ge3tjcDIueH19LHt7Y3AyLnl9fSB7e2VuZC54fX0se3tlbmQueX19XCIgaWQ9XCJjdXJ2ZVwiLz4nLFxuXHRcdHNjb3BlOiB7XG5cdFx0XHRwYWlyOiAnPSdcblx0XHR9LFxuXHRcdGNvbnRyb2xsZXJcblxuXHR9O1xuXG59O1xuIiwiLy8ganNoaW50IC1XMDE0XG5cbmZ1bmN0aW9uIGxpbmsoICRzY29wZSwgJGVsZW1lbnQsICRhdHRycyApIHtcblxuICAgaWYgKCAhJGVsZW1lbnQuYXR0ciggJ3RyYW5zZm9ybScgKSApIHtcbiAgICAgICRlbGVtZW50LmF0dHIoICd0cmFuc2Zvcm0nLCAnbWF0cml4KDEsMCwwLDEsMCwwKScgKTtcbiAgIH1cblxuICAgdmFyIG1vdXNlaG9sZCA9IGZhbHNlO1xuICAgdmFyIHByZXZQb3MgPSB7IHg6IG51bGwsIHk6IG51bGwgfTtcbiAgIHZhciBjdXJyUG9zID0geyB4OiBudWxsLCB5OiBudWxsIH07XG5cbiAgIHZhciBtYXQgPSBudWxsO1xuICAgdmFyIG51bVBhdHRlcm4gPSAvW1xcZHxcXC58XFwrfC1dKy9nO1xuXG4gICAkKCAnI3Rlc3RTdmcnIClcbiAgIC5vbiggJ21vdXNlZG93bicsIGUgPT4ge1xuXG4gICAgICBtb3VzZWhvbGQgPSB0cnVlO1xuICAgICAgcHJldlBvcy54ID0gZS5wYWdlWDtcbiAgICAgIHByZXZQb3MueSA9IGUucGFnZVk7XG5cbiAgICAgIG1hdCA9ICRlbGVtZW50LmF0dHIoICd0cmFuc2Zvcm0nICk7XG4gICAgICBtYXQgPSBtYXQubWF0Y2goIG51bVBhdHRlcm4gKS5tYXAoIHYgPT4gcGFyc2VGbG9hdCggdiApICk7XG5cbiAgIH0gKVxuICAgLm9uKCAnbW91c2V1cCcsIGUgPT4ge1xuICAgICAgbW91c2Vob2xkID0gZmFsc2U7XG4gICB9IClcbiAgIC5vbiggJ21vdXNlbW92ZScsIGUgPT4ge1xuXG4gICAgICBpZiAoIG1vdXNlaG9sZCApIHtcblxuICAgICAgICAgY3VyclBvcy54ID0gZS5wYWdlWDtcbiAgICAgICAgIGN1cnJQb3MueSA9IGUucGFnZVk7XG5cbiAgICAgICAgIHZhciBkeCA9IGN1cnJQb3MueCAtIHByZXZQb3MueDtcbiAgICAgICAgIHZhciBkeSA9IGN1cnJQb3MueSAtIHByZXZQb3MueTtcblxuICAgICAgICAgdmFyIG5ld1ggPSBtYXRbIDQgXSArIGR4O1xuICAgICAgICAgdmFyIG5ld1kgPSBtYXRbIDUgXSArIGR5O1xuXG4gICAgICAgICAkZWxlbWVudC5hdHRyKCAndHJhbnNmb3JtJywgYG1hdHJpeCgke21hdFswXX0sJHttYXRbMV19LCR7bWF0WzJdfSwke21hdFszXX0sJHtuZXdYfSwke25ld1l9KWAgKTtcblxuICAgICAgfVxuXG4gICB9ICk7XG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XG5cbiAgIHJldHVybiB7XG5cbiAgICAgIHJlc3RyaWN0OiAnQScsXG4gICAgICBsaW5rXG5cbiAgIH07XG5cbn07XG4iLCIvLyBqc2hpbnQgLVcwMTRcblxuZnVuY3Rpb24gbGluayggJHNjb3BlLCAkZWxlbWVudCwgJGF0dHJzICkge1xuXG4gICBpZiAoICEkZWxlbWVudC5hdHRyKCAndHJhbnNmb3JtJyApICkge1xuICAgICAgJGVsZW1lbnQuYXR0ciggJ3RyYW5zZm9ybScsICdtYXRyaXgoMSwwLDAsMSwwLDApJyApO1xuICAgfVxuXG4gICB2YXIgbnVtUGF0dGVybiA9IC9bXFxkfFxcLnxcXCt8LV0rL2c7XG5cbiAgICQoICcjdGVzdFN2ZycgKVxuICAgLm9uKCAnbW91c2V3aGVlbCcsIGUgPT4ge1xuXG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB2YXIgbWF0ID0gJGVsZW1lbnQuYXR0ciggJ3RyYW5zZm9ybScgKS5tYXRjaCggbnVtUGF0dGVybiApLm1hcCggdiA9PiBwYXJzZUZsb2F0KCB2ICkgKTtcblxuICAgICAgdmFyIGdhaW4gPSAyLjBcbiAgICAgICwgbWlueiA9IDAuMVxuICAgICAgLCBtYXh6ID0gMTAuMFxuICAgICAgLCBkZCA9IGdhaW4gKiBNYXRoLnNpZ24oIGUub3JpZ2luYWxFdmVudC53aGVlbERlbHRhWSApICogMC4xXG5cbiAgICAgICwgc3MgPSBtYXRbIDAgXSArICggbWF0WyAwIF0gKiBkZCApXG4gICAgICAsIHNkID0gc3MgLyBtYXRbIDAgXVxuICAgICAgLCBveCA9IGUucGFnZVhcbiAgICAgICwgb3kgPSBlLnBhZ2VZXG4gICAgICAsIGN4ID0gbWF0WyA0IF1cbiAgICAgICwgY3kgPSBtYXRbIDUgXVxuICAgICAgLCB4eCA9IHNkICogKCBjeCAtIG94ICkgKyBveFxuICAgICAgLCB5eSA9IHNkICogKCBjeSAtIG95ICkgKyBveVxuICAgICAgO1xuXG4gICAgICBpZiAoIHNzIDwgbWlueiB8fCBzcyA+IG1heHogKSByZXR1cm47XG5cbiAgICAgICRlbGVtZW50LmF0dHIoICd0cmFuc2Zvcm0nLCBgbWF0cml4KCR7c3N9LCR7bWF0WzFdfSwke21hdFsyXX0sJHtzc30sJHt4eH0sJHt5eX0pYCApO1xuXG4gICB9ICk7XG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSAoKSA9PiB7XG5cbiAgIHJldHVybiB7XG5cbiAgICAgIHJlc3RyaWN0OiAnQScsXG4gICAgICBsaW5rXG5cbiAgIH07XG5cbn07XG4iXX0=
