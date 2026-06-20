function _mergeNamespaces(n2, m2) {
  for (var i = 0; i < m2.length; i++) {
    const e = m2[i];
    if (typeof e !== "string" && !Array.isArray(e)) {
      for (const k2 in e) {
        if (k2 !== "default" && !(k2 in n2)) {
          const d = Object.getOwnPropertyDescriptor(e, k2);
          if (d) {
            Object.defineProperty(n2, k2, d.get ? d : {
              enumerable: true,
              get: () => e[k2]
            });
          }
        }
      }
    }
  }
  return Object.freeze(Object.defineProperty(n2, Symbol.toStringTag, { value: "Module" }));
}
(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
function getDefaultExportFromCjs(x2) {
  return x2 && x2.__esModule && Object.prototype.hasOwnProperty.call(x2, "default") ? x2["default"] : x2;
}
var jsxRuntime = { exports: {} };
var reactJsxRuntime_production_min = {};
var react = { exports: {} };
var react_production_min = {};
/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var l$1 = Symbol.for("react.element"), n$1 = Symbol.for("react.portal"), p$2 = Symbol.for("react.fragment"), q$1 = Symbol.for("react.strict_mode"), r = Symbol.for("react.profiler"), t = Symbol.for("react.provider"), u = Symbol.for("react.context"), v$1 = Symbol.for("react.forward_ref"), w = Symbol.for("react.suspense"), x = Symbol.for("react.memo"), y = Symbol.for("react.lazy"), z$1 = Symbol.iterator;
function A$1(a) {
  if (null === a || "object" !== typeof a) return null;
  a = z$1 && a[z$1] || a["@@iterator"];
  return "function" === typeof a ? a : null;
}
var B$1 = { isMounted: function() {
  return false;
}, enqueueForceUpdate: function() {
}, enqueueReplaceState: function() {
}, enqueueSetState: function() {
} }, C$1 = Object.assign, D$1 = {};
function E$1(a, b, e) {
  this.props = a;
  this.context = b;
  this.refs = D$1;
  this.updater = e || B$1;
}
E$1.prototype.isReactComponent = {};
E$1.prototype.setState = function(a, b) {
  if ("object" !== typeof a && "function" !== typeof a && null != a) throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
  this.updater.enqueueSetState(this, a, b, "setState");
};
E$1.prototype.forceUpdate = function(a) {
  this.updater.enqueueForceUpdate(this, a, "forceUpdate");
};
function F() {
}
F.prototype = E$1.prototype;
function G$2(a, b, e) {
  this.props = a;
  this.context = b;
  this.refs = D$1;
  this.updater = e || B$1;
}
var H$1 = G$2.prototype = new F();
H$1.constructor = G$2;
C$1(H$1, E$1.prototype);
H$1.isPureReactComponent = true;
var I$1 = Array.isArray, J = Object.prototype.hasOwnProperty, K$1 = { current: null }, L$1 = { key: true, ref: true, __self: true, __source: true };
function M$1(a, b, e) {
  var d, c = {}, k2 = null, h = null;
  if (null != b) for (d in void 0 !== b.ref && (h = b.ref), void 0 !== b.key && (k2 = "" + b.key), b) J.call(b, d) && !L$1.hasOwnProperty(d) && (c[d] = b[d]);
  var g = arguments.length - 2;
  if (1 === g) c.children = e;
  else if (1 < g) {
    for (var f2 = Array(g), m2 = 0; m2 < g; m2++) f2[m2] = arguments[m2 + 2];
    c.children = f2;
  }
  if (a && a.defaultProps) for (d in g = a.defaultProps, g) void 0 === c[d] && (c[d] = g[d]);
  return { $$typeof: l$1, type: a, key: k2, ref: h, props: c, _owner: K$1.current };
}
function N$1(a, b) {
  return { $$typeof: l$1, type: a.type, key: b, ref: a.ref, props: a.props, _owner: a._owner };
}
function O$1(a) {
  return "object" === typeof a && null !== a && a.$$typeof === l$1;
}
function escape(a) {
  var b = { "=": "=0", ":": "=2" };
  return "$" + a.replace(/[=:]/g, function(a2) {
    return b[a2];
  });
}
var P$1 = /\/+/g;
function Q$1(a, b) {
  return "object" === typeof a && null !== a && null != a.key ? escape("" + a.key) : b.toString(36);
}
function R$1(a, b, e, d, c) {
  var k2 = typeof a;
  if ("undefined" === k2 || "boolean" === k2) a = null;
  var h = false;
  if (null === a) h = true;
  else switch (k2) {
    case "string":
    case "number":
      h = true;
      break;
    case "object":
      switch (a.$$typeof) {
        case l$1:
        case n$1:
          h = true;
      }
  }
  if (h) return h = a, c = c(h), a = "" === d ? "." + Q$1(h, 0) : d, I$1(c) ? (e = "", null != a && (e = a.replace(P$1, "$&/") + "/"), R$1(c, b, e, "", function(a2) {
    return a2;
  })) : null != c && (O$1(c) && (c = N$1(c, e + (!c.key || h && h.key === c.key ? "" : ("" + c.key).replace(P$1, "$&/") + "/") + a)), b.push(c)), 1;
  h = 0;
  d = "" === d ? "." : d + ":";
  if (I$1(a)) for (var g = 0; g < a.length; g++) {
    k2 = a[g];
    var f2 = d + Q$1(k2, g);
    h += R$1(k2, b, e, f2, c);
  }
  else if (f2 = A$1(a), "function" === typeof f2) for (a = f2.call(a), g = 0; !(k2 = a.next()).done; ) k2 = k2.value, f2 = d + Q$1(k2, g++), h += R$1(k2, b, e, f2, c);
  else if ("object" === k2) throw b = String(a), Error("Objects are not valid as a React child (found: " + ("[object Object]" === b ? "object with keys {" + Object.keys(a).join(", ") + "}" : b) + "). If you meant to render a collection of children, use an array instead.");
  return h;
}
function S$1(a, b, e) {
  if (null == a) return a;
  var d = [], c = 0;
  R$1(a, d, "", "", function(a2) {
    return b.call(e, a2, c++);
  });
  return d;
}
function T$1(a) {
  if (-1 === a._status) {
    var b = a._result;
    b = b();
    b.then(function(b2) {
      if (0 === a._status || -1 === a._status) a._status = 1, a._result = b2;
    }, function(b2) {
      if (0 === a._status || -1 === a._status) a._status = 2, a._result = b2;
    });
    -1 === a._status && (a._status = 0, a._result = b);
  }
  if (1 === a._status) return a._result.default;
  throw a._result;
}
var U$1 = { current: null }, V$1 = { transition: null }, W$1 = { ReactCurrentDispatcher: U$1, ReactCurrentBatchConfig: V$1, ReactCurrentOwner: K$1 };
function X$2() {
  throw Error("act(...) is not supported in production builds of React.");
}
react_production_min.Children = { map: S$1, forEach: function(a, b, e) {
  S$1(a, function() {
    b.apply(this, arguments);
  }, e);
}, count: function(a) {
  var b = 0;
  S$1(a, function() {
    b++;
  });
  return b;
}, toArray: function(a) {
  return S$1(a, function(a2) {
    return a2;
  }) || [];
}, only: function(a) {
  if (!O$1(a)) throw Error("React.Children.only expected to receive a single React element child.");
  return a;
} };
react_production_min.Component = E$1;
react_production_min.Fragment = p$2;
react_production_min.Profiler = r;
react_production_min.PureComponent = G$2;
react_production_min.StrictMode = q$1;
react_production_min.Suspense = w;
react_production_min.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = W$1;
react_production_min.act = X$2;
react_production_min.cloneElement = function(a, b, e) {
  if (null === a || void 0 === a) throw Error("React.cloneElement(...): The argument must be a React element, but you passed " + a + ".");
  var d = C$1({}, a.props), c = a.key, k2 = a.ref, h = a._owner;
  if (null != b) {
    void 0 !== b.ref && (k2 = b.ref, h = K$1.current);
    void 0 !== b.key && (c = "" + b.key);
    if (a.type && a.type.defaultProps) var g = a.type.defaultProps;
    for (f2 in b) J.call(b, f2) && !L$1.hasOwnProperty(f2) && (d[f2] = void 0 === b[f2] && void 0 !== g ? g[f2] : b[f2]);
  }
  var f2 = arguments.length - 2;
  if (1 === f2) d.children = e;
  else if (1 < f2) {
    g = Array(f2);
    for (var m2 = 0; m2 < f2; m2++) g[m2] = arguments[m2 + 2];
    d.children = g;
  }
  return { $$typeof: l$1, type: a.type, key: c, ref: k2, props: d, _owner: h };
};
react_production_min.createContext = function(a) {
  a = { $$typeof: u, _currentValue: a, _currentValue2: a, _threadCount: 0, Provider: null, Consumer: null, _defaultValue: null, _globalName: null };
  a.Provider = { $$typeof: t, _context: a };
  return a.Consumer = a;
};
react_production_min.createElement = M$1;
react_production_min.createFactory = function(a) {
  var b = M$1.bind(null, a);
  b.type = a;
  return b;
};
react_production_min.createRef = function() {
  return { current: null };
};
react_production_min.forwardRef = function(a) {
  return { $$typeof: v$1, render: a };
};
react_production_min.isValidElement = O$1;
react_production_min.lazy = function(a) {
  return { $$typeof: y, _payload: { _status: -1, _result: a }, _init: T$1 };
};
react_production_min.memo = function(a, b) {
  return { $$typeof: x, type: a, compare: void 0 === b ? null : b };
};
react_production_min.startTransition = function(a) {
  var b = V$1.transition;
  V$1.transition = {};
  try {
    a();
  } finally {
    V$1.transition = b;
  }
};
react_production_min.unstable_act = X$2;
react_production_min.useCallback = function(a, b) {
  return U$1.current.useCallback(a, b);
};
react_production_min.useContext = function(a) {
  return U$1.current.useContext(a);
};
react_production_min.useDebugValue = function() {
};
react_production_min.useDeferredValue = function(a) {
  return U$1.current.useDeferredValue(a);
};
react_production_min.useEffect = function(a, b) {
  return U$1.current.useEffect(a, b);
};
react_production_min.useId = function() {
  return U$1.current.useId();
};
react_production_min.useImperativeHandle = function(a, b, e) {
  return U$1.current.useImperativeHandle(a, b, e);
};
react_production_min.useInsertionEffect = function(a, b) {
  return U$1.current.useInsertionEffect(a, b);
};
react_production_min.useLayoutEffect = function(a, b) {
  return U$1.current.useLayoutEffect(a, b);
};
react_production_min.useMemo = function(a, b) {
  return U$1.current.useMemo(a, b);
};
react_production_min.useReducer = function(a, b, e) {
  return U$1.current.useReducer(a, b, e);
};
react_production_min.useRef = function(a) {
  return U$1.current.useRef(a);
};
react_production_min.useState = function(a) {
  return U$1.current.useState(a);
};
react_production_min.useSyncExternalStore = function(a, b, e) {
  return U$1.current.useSyncExternalStore(a, b, e);
};
react_production_min.useTransition = function() {
  return U$1.current.useTransition();
};
react_production_min.version = "18.3.1";
{
  react.exports = react_production_min;
}
var reactExports = react.exports;
const React$2 = /* @__PURE__ */ getDefaultExportFromCjs(reactExports);
const React$3 = /* @__PURE__ */ _mergeNamespaces({
  __proto__: null,
  default: React$2
}, [reactExports]);
/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var f = reactExports, k = Symbol.for("react.element"), l = Symbol.for("react.fragment"), m$1 = Object.prototype.hasOwnProperty, n = f.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner, p$1 = { key: true, ref: true, __self: true, __source: true };
function q(c, a, g) {
  var b, d = {}, e = null, h = null;
  void 0 !== g && (e = "" + g);
  void 0 !== a.key && (e = "" + a.key);
  void 0 !== a.ref && (h = a.ref);
  for (b in a) m$1.call(a, b) && !p$1.hasOwnProperty(b) && (d[b] = a[b]);
  if (c && c.defaultProps) for (b in a = c.defaultProps, a) void 0 === d[b] && (d[b] = a[b]);
  return { $$typeof: k, type: c, key: e, ref: h, props: d, _owner: n.current };
}
reactJsxRuntime_production_min.Fragment = l;
reactJsxRuntime_production_min.jsx = q;
reactJsxRuntime_production_min.jsxs = q;
{
  jsxRuntime.exports = reactJsxRuntime_production_min;
}
var jsxRuntimeExports = jsxRuntime.exports;
var client = {};
var reactDom = { exports: {} };
var reactDom_production_min = {};
var scheduler = { exports: {} };
var scheduler_production_min = {};
/**
 * @license React
 * scheduler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
(function(exports) {
  function f2(a, b) {
    var c = a.length;
    a.push(b);
    a: for (; 0 < c; ) {
      var d = c - 1 >>> 1, e = a[d];
      if (0 < g(e, b)) a[d] = b, a[c] = e, c = d;
      else break a;
    }
  }
  function h(a) {
    return 0 === a.length ? null : a[0];
  }
  function k2(a) {
    if (0 === a.length) return null;
    var b = a[0], c = a.pop();
    if (c !== b) {
      a[0] = c;
      a: for (var d = 0, e = a.length, w2 = e >>> 1; d < w2; ) {
        var m2 = 2 * (d + 1) - 1, C2 = a[m2], n2 = m2 + 1, x2 = a[n2];
        if (0 > g(C2, c)) n2 < e && 0 > g(x2, C2) ? (a[d] = x2, a[n2] = c, d = n2) : (a[d] = C2, a[m2] = c, d = m2);
        else if (n2 < e && 0 > g(x2, c)) a[d] = x2, a[n2] = c, d = n2;
        else break a;
      }
    }
    return b;
  }
  function g(a, b) {
    var c = a.sortIndex - b.sortIndex;
    return 0 !== c ? c : a.id - b.id;
  }
  if ("object" === typeof performance && "function" === typeof performance.now) {
    var l2 = performance;
    exports.unstable_now = function() {
      return l2.now();
    };
  } else {
    var p2 = Date, q2 = p2.now();
    exports.unstable_now = function() {
      return p2.now() - q2;
    };
  }
  var r2 = [], t2 = [], u2 = 1, v2 = null, y2 = 3, z2 = false, A2 = false, B2 = false, D2 = "function" === typeof setTimeout ? setTimeout : null, E2 = "function" === typeof clearTimeout ? clearTimeout : null, F2 = "undefined" !== typeof setImmediate ? setImmediate : null;
  "undefined" !== typeof navigator && void 0 !== navigator.scheduling && void 0 !== navigator.scheduling.isInputPending && navigator.scheduling.isInputPending.bind(navigator.scheduling);
  function G2(a) {
    for (var b = h(t2); null !== b; ) {
      if (null === b.callback) k2(t2);
      else if (b.startTime <= a) k2(t2), b.sortIndex = b.expirationTime, f2(r2, b);
      else break;
      b = h(t2);
    }
  }
  function H2(a) {
    B2 = false;
    G2(a);
    if (!A2) if (null !== h(r2)) A2 = true, I2(J2);
    else {
      var b = h(t2);
      null !== b && K2(H2, b.startTime - a);
    }
  }
  function J2(a, b) {
    A2 = false;
    B2 && (B2 = false, E2(L2), L2 = -1);
    z2 = true;
    var c = y2;
    try {
      G2(b);
      for (v2 = h(r2); null !== v2 && (!(v2.expirationTime > b) || a && !M2()); ) {
        var d = v2.callback;
        if ("function" === typeof d) {
          v2.callback = null;
          y2 = v2.priorityLevel;
          var e = d(v2.expirationTime <= b);
          b = exports.unstable_now();
          "function" === typeof e ? v2.callback = e : v2 === h(r2) && k2(r2);
          G2(b);
        } else k2(r2);
        v2 = h(r2);
      }
      if (null !== v2) var w2 = true;
      else {
        var m2 = h(t2);
        null !== m2 && K2(H2, m2.startTime - b);
        w2 = false;
      }
      return w2;
    } finally {
      v2 = null, y2 = c, z2 = false;
    }
  }
  var N2 = false, O2 = null, L2 = -1, P2 = 5, Q2 = -1;
  function M2() {
    return exports.unstable_now() - Q2 < P2 ? false : true;
  }
  function R2() {
    if (null !== O2) {
      var a = exports.unstable_now();
      Q2 = a;
      var b = true;
      try {
        b = O2(true, a);
      } finally {
        b ? S2() : (N2 = false, O2 = null);
      }
    } else N2 = false;
  }
  var S2;
  if ("function" === typeof F2) S2 = function() {
    F2(R2);
  };
  else if ("undefined" !== typeof MessageChannel) {
    var T2 = new MessageChannel(), U2 = T2.port2;
    T2.port1.onmessage = R2;
    S2 = function() {
      U2.postMessage(null);
    };
  } else S2 = function() {
    D2(R2, 0);
  };
  function I2(a) {
    O2 = a;
    N2 || (N2 = true, S2());
  }
  function K2(a, b) {
    L2 = D2(function() {
      a(exports.unstable_now());
    }, b);
  }
  exports.unstable_IdlePriority = 5;
  exports.unstable_ImmediatePriority = 1;
  exports.unstable_LowPriority = 4;
  exports.unstable_NormalPriority = 3;
  exports.unstable_Profiling = null;
  exports.unstable_UserBlockingPriority = 2;
  exports.unstable_cancelCallback = function(a) {
    a.callback = null;
  };
  exports.unstable_continueExecution = function() {
    A2 || z2 || (A2 = true, I2(J2));
  };
  exports.unstable_forceFrameRate = function(a) {
    0 > a || 125 < a ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : P2 = 0 < a ? Math.floor(1e3 / a) : 5;
  };
  exports.unstable_getCurrentPriorityLevel = function() {
    return y2;
  };
  exports.unstable_getFirstCallbackNode = function() {
    return h(r2);
  };
  exports.unstable_next = function(a) {
    switch (y2) {
      case 1:
      case 2:
      case 3:
        var b = 3;
        break;
      default:
        b = y2;
    }
    var c = y2;
    y2 = b;
    try {
      return a();
    } finally {
      y2 = c;
    }
  };
  exports.unstable_pauseExecution = function() {
  };
  exports.unstable_requestPaint = function() {
  };
  exports.unstable_runWithPriority = function(a, b) {
    switch (a) {
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
        break;
      default:
        a = 3;
    }
    var c = y2;
    y2 = a;
    try {
      return b();
    } finally {
      y2 = c;
    }
  };
  exports.unstable_scheduleCallback = function(a, b, c) {
    var d = exports.unstable_now();
    "object" === typeof c && null !== c ? (c = c.delay, c = "number" === typeof c && 0 < c ? d + c : d) : c = d;
    switch (a) {
      case 1:
        var e = -1;
        break;
      case 2:
        e = 250;
        break;
      case 5:
        e = 1073741823;
        break;
      case 4:
        e = 1e4;
        break;
      default:
        e = 5e3;
    }
    e = c + e;
    a = { id: u2++, callback: b, priorityLevel: a, startTime: c, expirationTime: e, sortIndex: -1 };
    c > d ? (a.sortIndex = c, f2(t2, a), null === h(r2) && a === h(t2) && (B2 ? (E2(L2), L2 = -1) : B2 = true, K2(H2, c - d))) : (a.sortIndex = e, f2(r2, a), A2 || z2 || (A2 = true, I2(J2)));
    return a;
  };
  exports.unstable_shouldYield = M2;
  exports.unstable_wrapCallback = function(a) {
    var b = y2;
    return function() {
      var c = y2;
      y2 = b;
      try {
        return a.apply(this, arguments);
      } finally {
        y2 = c;
      }
    };
  };
})(scheduler_production_min);
{
  scheduler.exports = scheduler_production_min;
}
var schedulerExports = scheduler.exports;
/**
 * @license React
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var aa = reactExports, ca = schedulerExports;
function p(a) {
  for (var b = "https://reactjs.org/docs/error-decoder.html?invariant=" + a, c = 1; c < arguments.length; c++) b += "&args[]=" + encodeURIComponent(arguments[c]);
  return "Minified React error #" + a + "; visit " + b + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
}
var da = /* @__PURE__ */ new Set(), ea = {};
function fa(a, b) {
  ha(a, b);
  ha(a + "Capture", b);
}
function ha(a, b) {
  ea[a] = b;
  for (a = 0; a < b.length; a++) da.add(b[a]);
}
var ia = !("undefined" === typeof window || "undefined" === typeof window.document || "undefined" === typeof window.document.createElement), ja = Object.prototype.hasOwnProperty, ka = /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/, la = {}, ma = {};
function oa(a) {
  if (ja.call(ma, a)) return true;
  if (ja.call(la, a)) return false;
  if (ka.test(a)) return ma[a] = true;
  la[a] = true;
  return false;
}
function pa(a, b, c, d) {
  if (null !== c && 0 === c.type) return false;
  switch (typeof b) {
    case "function":
    case "symbol":
      return true;
    case "boolean":
      if (d) return false;
      if (null !== c) return !c.acceptsBooleans;
      a = a.toLowerCase().slice(0, 5);
      return "data-" !== a && "aria-" !== a;
    default:
      return false;
  }
}
function qa(a, b, c, d) {
  if (null === b || "undefined" === typeof b || pa(a, b, c, d)) return true;
  if (d) return false;
  if (null !== c) switch (c.type) {
    case 3:
      return !b;
    case 4:
      return false === b;
    case 5:
      return isNaN(b);
    case 6:
      return isNaN(b) || 1 > b;
  }
  return false;
}
function v(a, b, c, d, e, f2, g) {
  this.acceptsBooleans = 2 === b || 3 === b || 4 === b;
  this.attributeName = d;
  this.attributeNamespace = e;
  this.mustUseProperty = c;
  this.propertyName = a;
  this.type = b;
  this.sanitizeURL = f2;
  this.removeEmptyString = g;
}
var z = {};
"children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(a) {
  z[a] = new v(a, 0, false, a, null, false, false);
});
[["acceptCharset", "accept-charset"], ["className", "class"], ["htmlFor", "for"], ["httpEquiv", "http-equiv"]].forEach(function(a) {
  var b = a[0];
  z[b] = new v(b, 1, false, a[1], null, false, false);
});
["contentEditable", "draggable", "spellCheck", "value"].forEach(function(a) {
  z[a] = new v(a, 2, false, a.toLowerCase(), null, false, false);
});
["autoReverse", "externalResourcesRequired", "focusable", "preserveAlpha"].forEach(function(a) {
  z[a] = new v(a, 2, false, a, null, false, false);
});
"allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(a) {
  z[a] = new v(a, 3, false, a.toLowerCase(), null, false, false);
});
["checked", "multiple", "muted", "selected"].forEach(function(a) {
  z[a] = new v(a, 3, true, a, null, false, false);
});
["capture", "download"].forEach(function(a) {
  z[a] = new v(a, 4, false, a, null, false, false);
});
["cols", "rows", "size", "span"].forEach(function(a) {
  z[a] = new v(a, 6, false, a, null, false, false);
});
["rowSpan", "start"].forEach(function(a) {
  z[a] = new v(a, 5, false, a.toLowerCase(), null, false, false);
});
var ra = /[\-:]([a-z])/g;
function sa(a) {
  return a[1].toUpperCase();
}
"accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(a) {
  var b = a.replace(
    ra,
    sa
  );
  z[b] = new v(b, 1, false, a, null, false, false);
});
"xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(a) {
  var b = a.replace(ra, sa);
  z[b] = new v(b, 1, false, a, "http://www.w3.org/1999/xlink", false, false);
});
["xml:base", "xml:lang", "xml:space"].forEach(function(a) {
  var b = a.replace(ra, sa);
  z[b] = new v(b, 1, false, a, "http://www.w3.org/XML/1998/namespace", false, false);
});
["tabIndex", "crossOrigin"].forEach(function(a) {
  z[a] = new v(a, 1, false, a.toLowerCase(), null, false, false);
});
z.xlinkHref = new v("xlinkHref", 1, false, "xlink:href", "http://www.w3.org/1999/xlink", true, false);
["src", "href", "action", "formAction"].forEach(function(a) {
  z[a] = new v(a, 1, false, a.toLowerCase(), null, true, true);
});
function ta(a, b, c, d) {
  var e = z.hasOwnProperty(b) ? z[b] : null;
  if (null !== e ? 0 !== e.type : d || !(2 < b.length) || "o" !== b[0] && "O" !== b[0] || "n" !== b[1] && "N" !== b[1]) qa(b, c, e, d) && (c = null), d || null === e ? oa(b) && (null === c ? a.removeAttribute(b) : a.setAttribute(b, "" + c)) : e.mustUseProperty ? a[e.propertyName] = null === c ? 3 === e.type ? false : "" : c : (b = e.attributeName, d = e.attributeNamespace, null === c ? a.removeAttribute(b) : (e = e.type, c = 3 === e || 4 === e && true === c ? "" : "" + c, d ? a.setAttributeNS(d, b, c) : a.setAttribute(b, c)));
}
var ua = aa.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED, va = Symbol.for("react.element"), wa = Symbol.for("react.portal"), ya = Symbol.for("react.fragment"), za = Symbol.for("react.strict_mode"), Aa = Symbol.for("react.profiler"), Ba = Symbol.for("react.provider"), Ca = Symbol.for("react.context"), Da = Symbol.for("react.forward_ref"), Ea = Symbol.for("react.suspense"), Fa = Symbol.for("react.suspense_list"), Ga = Symbol.for("react.memo"), Ha = Symbol.for("react.lazy");
var Ia = Symbol.for("react.offscreen");
var Ja = Symbol.iterator;
function Ka(a) {
  if (null === a || "object" !== typeof a) return null;
  a = Ja && a[Ja] || a["@@iterator"];
  return "function" === typeof a ? a : null;
}
var A = Object.assign, La;
function Ma(a) {
  if (void 0 === La) try {
    throw Error();
  } catch (c) {
    var b = c.stack.trim().match(/\n( *(at )?)/);
    La = b && b[1] || "";
  }
  return "\n" + La + a;
}
var Na = false;
function Oa(a, b) {
  if (!a || Na) return "";
  Na = true;
  var c = Error.prepareStackTrace;
  Error.prepareStackTrace = void 0;
  try {
    if (b) if (b = function() {
      throw Error();
    }, Object.defineProperty(b.prototype, "props", { set: function() {
      throw Error();
    } }), "object" === typeof Reflect && Reflect.construct) {
      try {
        Reflect.construct(b, []);
      } catch (l2) {
        var d = l2;
      }
      Reflect.construct(a, [], b);
    } else {
      try {
        b.call();
      } catch (l2) {
        d = l2;
      }
      a.call(b.prototype);
    }
    else {
      try {
        throw Error();
      } catch (l2) {
        d = l2;
      }
      a();
    }
  } catch (l2) {
    if (l2 && d && "string" === typeof l2.stack) {
      for (var e = l2.stack.split("\n"), f2 = d.stack.split("\n"), g = e.length - 1, h = f2.length - 1; 1 <= g && 0 <= h && e[g] !== f2[h]; ) h--;
      for (; 1 <= g && 0 <= h; g--, h--) if (e[g] !== f2[h]) {
        if (1 !== g || 1 !== h) {
          do
            if (g--, h--, 0 > h || e[g] !== f2[h]) {
              var k2 = "\n" + e[g].replace(" at new ", " at ");
              a.displayName && k2.includes("<anonymous>") && (k2 = k2.replace("<anonymous>", a.displayName));
              return k2;
            }
          while (1 <= g && 0 <= h);
        }
        break;
      }
    }
  } finally {
    Na = false, Error.prepareStackTrace = c;
  }
  return (a = a ? a.displayName || a.name : "") ? Ma(a) : "";
}
function Pa(a) {
  switch (a.tag) {
    case 5:
      return Ma(a.type);
    case 16:
      return Ma("Lazy");
    case 13:
      return Ma("Suspense");
    case 19:
      return Ma("SuspenseList");
    case 0:
    case 2:
    case 15:
      return a = Oa(a.type, false), a;
    case 11:
      return a = Oa(a.type.render, false), a;
    case 1:
      return a = Oa(a.type, true), a;
    default:
      return "";
  }
}
function Qa(a) {
  if (null == a) return null;
  if ("function" === typeof a) return a.displayName || a.name || null;
  if ("string" === typeof a) return a;
  switch (a) {
    case ya:
      return "Fragment";
    case wa:
      return "Portal";
    case Aa:
      return "Profiler";
    case za:
      return "StrictMode";
    case Ea:
      return "Suspense";
    case Fa:
      return "SuspenseList";
  }
  if ("object" === typeof a) switch (a.$$typeof) {
    case Ca:
      return (a.displayName || "Context") + ".Consumer";
    case Ba:
      return (a._context.displayName || "Context") + ".Provider";
    case Da:
      var b = a.render;
      a = a.displayName;
      a || (a = b.displayName || b.name || "", a = "" !== a ? "ForwardRef(" + a + ")" : "ForwardRef");
      return a;
    case Ga:
      return b = a.displayName || null, null !== b ? b : Qa(a.type) || "Memo";
    case Ha:
      b = a._payload;
      a = a._init;
      try {
        return Qa(a(b));
      } catch (c) {
      }
  }
  return null;
}
function Ra(a) {
  var b = a.type;
  switch (a.tag) {
    case 24:
      return "Cache";
    case 9:
      return (b.displayName || "Context") + ".Consumer";
    case 10:
      return (b._context.displayName || "Context") + ".Provider";
    case 18:
      return "DehydratedFragment";
    case 11:
      return a = b.render, a = a.displayName || a.name || "", b.displayName || ("" !== a ? "ForwardRef(" + a + ")" : "ForwardRef");
    case 7:
      return "Fragment";
    case 5:
      return b;
    case 4:
      return "Portal";
    case 3:
      return "Root";
    case 6:
      return "Text";
    case 16:
      return Qa(b);
    case 8:
      return b === za ? "StrictMode" : "Mode";
    case 22:
      return "Offscreen";
    case 12:
      return "Profiler";
    case 21:
      return "Scope";
    case 13:
      return "Suspense";
    case 19:
      return "SuspenseList";
    case 25:
      return "TracingMarker";
    case 1:
    case 0:
    case 17:
    case 2:
    case 14:
    case 15:
      if ("function" === typeof b) return b.displayName || b.name || null;
      if ("string" === typeof b) return b;
  }
  return null;
}
function Sa(a) {
  switch (typeof a) {
    case "boolean":
    case "number":
    case "string":
    case "undefined":
      return a;
    case "object":
      return a;
    default:
      return "";
  }
}
function Ta(a) {
  var b = a.type;
  return (a = a.nodeName) && "input" === a.toLowerCase() && ("checkbox" === b || "radio" === b);
}
function Ua(a) {
  var b = Ta(a) ? "checked" : "value", c = Object.getOwnPropertyDescriptor(a.constructor.prototype, b), d = "" + a[b];
  if (!a.hasOwnProperty(b) && "undefined" !== typeof c && "function" === typeof c.get && "function" === typeof c.set) {
    var e = c.get, f2 = c.set;
    Object.defineProperty(a, b, { configurable: true, get: function() {
      return e.call(this);
    }, set: function(a2) {
      d = "" + a2;
      f2.call(this, a2);
    } });
    Object.defineProperty(a, b, { enumerable: c.enumerable });
    return { getValue: function() {
      return d;
    }, setValue: function(a2) {
      d = "" + a2;
    }, stopTracking: function() {
      a._valueTracker = null;
      delete a[b];
    } };
  }
}
function Va(a) {
  a._valueTracker || (a._valueTracker = Ua(a));
}
function Wa(a) {
  if (!a) return false;
  var b = a._valueTracker;
  if (!b) return true;
  var c = b.getValue();
  var d = "";
  a && (d = Ta(a) ? a.checked ? "true" : "false" : a.value);
  a = d;
  return a !== c ? (b.setValue(a), true) : false;
}
function Xa(a) {
  a = a || ("undefined" !== typeof document ? document : void 0);
  if ("undefined" === typeof a) return null;
  try {
    return a.activeElement || a.body;
  } catch (b) {
    return a.body;
  }
}
function Ya(a, b) {
  var c = b.checked;
  return A({}, b, { defaultChecked: void 0, defaultValue: void 0, value: void 0, checked: null != c ? c : a._wrapperState.initialChecked });
}
function Za(a, b) {
  var c = null == b.defaultValue ? "" : b.defaultValue, d = null != b.checked ? b.checked : b.defaultChecked;
  c = Sa(null != b.value ? b.value : c);
  a._wrapperState = { initialChecked: d, initialValue: c, controlled: "checkbox" === b.type || "radio" === b.type ? null != b.checked : null != b.value };
}
function ab(a, b) {
  b = b.checked;
  null != b && ta(a, "checked", b, false);
}
function bb(a, b) {
  ab(a, b);
  var c = Sa(b.value), d = b.type;
  if (null != c) if ("number" === d) {
    if (0 === c && "" === a.value || a.value != c) a.value = "" + c;
  } else a.value !== "" + c && (a.value = "" + c);
  else if ("submit" === d || "reset" === d) {
    a.removeAttribute("value");
    return;
  }
  b.hasOwnProperty("value") ? cb(a, b.type, c) : b.hasOwnProperty("defaultValue") && cb(a, b.type, Sa(b.defaultValue));
  null == b.checked && null != b.defaultChecked && (a.defaultChecked = !!b.defaultChecked);
}
function db(a, b, c) {
  if (b.hasOwnProperty("value") || b.hasOwnProperty("defaultValue")) {
    var d = b.type;
    if (!("submit" !== d && "reset" !== d || void 0 !== b.value && null !== b.value)) return;
    b = "" + a._wrapperState.initialValue;
    c || b === a.value || (a.value = b);
    a.defaultValue = b;
  }
  c = a.name;
  "" !== c && (a.name = "");
  a.defaultChecked = !!a._wrapperState.initialChecked;
  "" !== c && (a.name = c);
}
function cb(a, b, c) {
  if ("number" !== b || Xa(a.ownerDocument) !== a) null == c ? a.defaultValue = "" + a._wrapperState.initialValue : a.defaultValue !== "" + c && (a.defaultValue = "" + c);
}
var eb = Array.isArray;
function fb(a, b, c, d) {
  a = a.options;
  if (b) {
    b = {};
    for (var e = 0; e < c.length; e++) b["$" + c[e]] = true;
    for (c = 0; c < a.length; c++) e = b.hasOwnProperty("$" + a[c].value), a[c].selected !== e && (a[c].selected = e), e && d && (a[c].defaultSelected = true);
  } else {
    c = "" + Sa(c);
    b = null;
    for (e = 0; e < a.length; e++) {
      if (a[e].value === c) {
        a[e].selected = true;
        d && (a[e].defaultSelected = true);
        return;
      }
      null !== b || a[e].disabled || (b = a[e]);
    }
    null !== b && (b.selected = true);
  }
}
function gb(a, b) {
  if (null != b.dangerouslySetInnerHTML) throw Error(p(91));
  return A({}, b, { value: void 0, defaultValue: void 0, children: "" + a._wrapperState.initialValue });
}
function hb(a, b) {
  var c = b.value;
  if (null == c) {
    c = b.children;
    b = b.defaultValue;
    if (null != c) {
      if (null != b) throw Error(p(92));
      if (eb(c)) {
        if (1 < c.length) throw Error(p(93));
        c = c[0];
      }
      b = c;
    }
    null == b && (b = "");
    c = b;
  }
  a._wrapperState = { initialValue: Sa(c) };
}
function ib(a, b) {
  var c = Sa(b.value), d = Sa(b.defaultValue);
  null != c && (c = "" + c, c !== a.value && (a.value = c), null == b.defaultValue && a.defaultValue !== c && (a.defaultValue = c));
  null != d && (a.defaultValue = "" + d);
}
function jb(a) {
  var b = a.textContent;
  b === a._wrapperState.initialValue && "" !== b && null !== b && (a.value = b);
}
function kb(a) {
  switch (a) {
    case "svg":
      return "http://www.w3.org/2000/svg";
    case "math":
      return "http://www.w3.org/1998/Math/MathML";
    default:
      return "http://www.w3.org/1999/xhtml";
  }
}
function lb(a, b) {
  return null == a || "http://www.w3.org/1999/xhtml" === a ? kb(b) : "http://www.w3.org/2000/svg" === a && "foreignObject" === b ? "http://www.w3.org/1999/xhtml" : a;
}
var mb, nb = function(a) {
  return "undefined" !== typeof MSApp && MSApp.execUnsafeLocalFunction ? function(b, c, d, e) {
    MSApp.execUnsafeLocalFunction(function() {
      return a(b, c, d, e);
    });
  } : a;
}(function(a, b) {
  if ("http://www.w3.org/2000/svg" !== a.namespaceURI || "innerHTML" in a) a.innerHTML = b;
  else {
    mb = mb || document.createElement("div");
    mb.innerHTML = "<svg>" + b.valueOf().toString() + "</svg>";
    for (b = mb.firstChild; a.firstChild; ) a.removeChild(a.firstChild);
    for (; b.firstChild; ) a.appendChild(b.firstChild);
  }
});
function ob(a, b) {
  if (b) {
    var c = a.firstChild;
    if (c && c === a.lastChild && 3 === c.nodeType) {
      c.nodeValue = b;
      return;
    }
  }
  a.textContent = b;
}
var pb = {
  animationIterationCount: true,
  aspectRatio: true,
  borderImageOutset: true,
  borderImageSlice: true,
  borderImageWidth: true,
  boxFlex: true,
  boxFlexGroup: true,
  boxOrdinalGroup: true,
  columnCount: true,
  columns: true,
  flex: true,
  flexGrow: true,
  flexPositive: true,
  flexShrink: true,
  flexNegative: true,
  flexOrder: true,
  gridArea: true,
  gridRow: true,
  gridRowEnd: true,
  gridRowSpan: true,
  gridRowStart: true,
  gridColumn: true,
  gridColumnEnd: true,
  gridColumnSpan: true,
  gridColumnStart: true,
  fontWeight: true,
  lineClamp: true,
  lineHeight: true,
  opacity: true,
  order: true,
  orphans: true,
  tabSize: true,
  widows: true,
  zIndex: true,
  zoom: true,
  fillOpacity: true,
  floodOpacity: true,
  stopOpacity: true,
  strokeDasharray: true,
  strokeDashoffset: true,
  strokeMiterlimit: true,
  strokeOpacity: true,
  strokeWidth: true
}, qb = ["Webkit", "ms", "Moz", "O"];
Object.keys(pb).forEach(function(a) {
  qb.forEach(function(b) {
    b = b + a.charAt(0).toUpperCase() + a.substring(1);
    pb[b] = pb[a];
  });
});
function rb(a, b, c) {
  return null == b || "boolean" === typeof b || "" === b ? "" : c || "number" !== typeof b || 0 === b || pb.hasOwnProperty(a) && pb[a] ? ("" + b).trim() : b + "px";
}
function sb(a, b) {
  a = a.style;
  for (var c in b) if (b.hasOwnProperty(c)) {
    var d = 0 === c.indexOf("--"), e = rb(c, b[c], d);
    "float" === c && (c = "cssFloat");
    d ? a.setProperty(c, e) : a[c] = e;
  }
}
var tb = A({ menuitem: true }, { area: true, base: true, br: true, col: true, embed: true, hr: true, img: true, input: true, keygen: true, link: true, meta: true, param: true, source: true, track: true, wbr: true });
function ub(a, b) {
  if (b) {
    if (tb[a] && (null != b.children || null != b.dangerouslySetInnerHTML)) throw Error(p(137, a));
    if (null != b.dangerouslySetInnerHTML) {
      if (null != b.children) throw Error(p(60));
      if ("object" !== typeof b.dangerouslySetInnerHTML || !("__html" in b.dangerouslySetInnerHTML)) throw Error(p(61));
    }
    if (null != b.style && "object" !== typeof b.style) throw Error(p(62));
  }
}
function vb(a, b) {
  if (-1 === a.indexOf("-")) return "string" === typeof b.is;
  switch (a) {
    case "annotation-xml":
    case "color-profile":
    case "font-face":
    case "font-face-src":
    case "font-face-uri":
    case "font-face-format":
    case "font-face-name":
    case "missing-glyph":
      return false;
    default:
      return true;
  }
}
var wb = null;
function xb(a) {
  a = a.target || a.srcElement || window;
  a.correspondingUseElement && (a = a.correspondingUseElement);
  return 3 === a.nodeType ? a.parentNode : a;
}
var yb = null, zb = null, Ab = null;
function Bb(a) {
  if (a = Cb(a)) {
    if ("function" !== typeof yb) throw Error(p(280));
    var b = a.stateNode;
    b && (b = Db(b), yb(a.stateNode, a.type, b));
  }
}
function Eb(a) {
  zb ? Ab ? Ab.push(a) : Ab = [a] : zb = a;
}
function Fb() {
  if (zb) {
    var a = zb, b = Ab;
    Ab = zb = null;
    Bb(a);
    if (b) for (a = 0; a < b.length; a++) Bb(b[a]);
  }
}
function Gb(a, b) {
  return a(b);
}
function Hb() {
}
var Ib = false;
function Jb(a, b, c) {
  if (Ib) return a(b, c);
  Ib = true;
  try {
    return Gb(a, b, c);
  } finally {
    if (Ib = false, null !== zb || null !== Ab) Hb(), Fb();
  }
}
function Kb(a, b) {
  var c = a.stateNode;
  if (null === c) return null;
  var d = Db(c);
  if (null === d) return null;
  c = d[b];
  a: switch (b) {
    case "onClick":
    case "onClickCapture":
    case "onDoubleClick":
    case "onDoubleClickCapture":
    case "onMouseDown":
    case "onMouseDownCapture":
    case "onMouseMove":
    case "onMouseMoveCapture":
    case "onMouseUp":
    case "onMouseUpCapture":
    case "onMouseEnter":
      (d = !d.disabled) || (a = a.type, d = !("button" === a || "input" === a || "select" === a || "textarea" === a));
      a = !d;
      break a;
    default:
      a = false;
  }
  if (a) return null;
  if (c && "function" !== typeof c) throw Error(p(231, b, typeof c));
  return c;
}
var Lb = false;
if (ia) try {
  var Mb = {};
  Object.defineProperty(Mb, "passive", { get: function() {
    Lb = true;
  } });
  window.addEventListener("test", Mb, Mb);
  window.removeEventListener("test", Mb, Mb);
} catch (a) {
  Lb = false;
}
function Nb(a, b, c, d, e, f2, g, h, k2) {
  var l2 = Array.prototype.slice.call(arguments, 3);
  try {
    b.apply(c, l2);
  } catch (m2) {
    this.onError(m2);
  }
}
var Ob = false, Pb = null, Qb = false, Rb = null, Sb = { onError: function(a) {
  Ob = true;
  Pb = a;
} };
function Tb(a, b, c, d, e, f2, g, h, k2) {
  Ob = false;
  Pb = null;
  Nb.apply(Sb, arguments);
}
function Ub(a, b, c, d, e, f2, g, h, k2) {
  Tb.apply(this, arguments);
  if (Ob) {
    if (Ob) {
      var l2 = Pb;
      Ob = false;
      Pb = null;
    } else throw Error(p(198));
    Qb || (Qb = true, Rb = l2);
  }
}
function Vb(a) {
  var b = a, c = a;
  if (a.alternate) for (; b.return; ) b = b.return;
  else {
    a = b;
    do
      b = a, 0 !== (b.flags & 4098) && (c = b.return), a = b.return;
    while (a);
  }
  return 3 === b.tag ? c : null;
}
function Wb(a) {
  if (13 === a.tag) {
    var b = a.memoizedState;
    null === b && (a = a.alternate, null !== a && (b = a.memoizedState));
    if (null !== b) return b.dehydrated;
  }
  return null;
}
function Xb(a) {
  if (Vb(a) !== a) throw Error(p(188));
}
function Yb(a) {
  var b = a.alternate;
  if (!b) {
    b = Vb(a);
    if (null === b) throw Error(p(188));
    return b !== a ? null : a;
  }
  for (var c = a, d = b; ; ) {
    var e = c.return;
    if (null === e) break;
    var f2 = e.alternate;
    if (null === f2) {
      d = e.return;
      if (null !== d) {
        c = d;
        continue;
      }
      break;
    }
    if (e.child === f2.child) {
      for (f2 = e.child; f2; ) {
        if (f2 === c) return Xb(e), a;
        if (f2 === d) return Xb(e), b;
        f2 = f2.sibling;
      }
      throw Error(p(188));
    }
    if (c.return !== d.return) c = e, d = f2;
    else {
      for (var g = false, h = e.child; h; ) {
        if (h === c) {
          g = true;
          c = e;
          d = f2;
          break;
        }
        if (h === d) {
          g = true;
          d = e;
          c = f2;
          break;
        }
        h = h.sibling;
      }
      if (!g) {
        for (h = f2.child; h; ) {
          if (h === c) {
            g = true;
            c = f2;
            d = e;
            break;
          }
          if (h === d) {
            g = true;
            d = f2;
            c = e;
            break;
          }
          h = h.sibling;
        }
        if (!g) throw Error(p(189));
      }
    }
    if (c.alternate !== d) throw Error(p(190));
  }
  if (3 !== c.tag) throw Error(p(188));
  return c.stateNode.current === c ? a : b;
}
function Zb(a) {
  a = Yb(a);
  return null !== a ? $b(a) : null;
}
function $b(a) {
  if (5 === a.tag || 6 === a.tag) return a;
  for (a = a.child; null !== a; ) {
    var b = $b(a);
    if (null !== b) return b;
    a = a.sibling;
  }
  return null;
}
var ac = ca.unstable_scheduleCallback, bc = ca.unstable_cancelCallback, cc = ca.unstable_shouldYield, dc = ca.unstable_requestPaint, B = ca.unstable_now, ec = ca.unstable_getCurrentPriorityLevel, fc = ca.unstable_ImmediatePriority, gc = ca.unstable_UserBlockingPriority, hc = ca.unstable_NormalPriority, ic = ca.unstable_LowPriority, jc = ca.unstable_IdlePriority, kc = null, lc = null;
function mc(a) {
  if (lc && "function" === typeof lc.onCommitFiberRoot) try {
    lc.onCommitFiberRoot(kc, a, void 0, 128 === (a.current.flags & 128));
  } catch (b) {
  }
}
var oc = Math.clz32 ? Math.clz32 : nc, pc = Math.log, qc = Math.LN2;
function nc(a) {
  a >>>= 0;
  return 0 === a ? 32 : 31 - (pc(a) / qc | 0) | 0;
}
var rc = 64, sc = 4194304;
function tc(a) {
  switch (a & -a) {
    case 1:
      return 1;
    case 2:
      return 2;
    case 4:
      return 4;
    case 8:
      return 8;
    case 16:
      return 16;
    case 32:
      return 32;
    case 64:
    case 128:
    case 256:
    case 512:
    case 1024:
    case 2048:
    case 4096:
    case 8192:
    case 16384:
    case 32768:
    case 65536:
    case 131072:
    case 262144:
    case 524288:
    case 1048576:
    case 2097152:
      return a & 4194240;
    case 4194304:
    case 8388608:
    case 16777216:
    case 33554432:
    case 67108864:
      return a & 130023424;
    case 134217728:
      return 134217728;
    case 268435456:
      return 268435456;
    case 536870912:
      return 536870912;
    case 1073741824:
      return 1073741824;
    default:
      return a;
  }
}
function uc(a, b) {
  var c = a.pendingLanes;
  if (0 === c) return 0;
  var d = 0, e = a.suspendedLanes, f2 = a.pingedLanes, g = c & 268435455;
  if (0 !== g) {
    var h = g & ~e;
    0 !== h ? d = tc(h) : (f2 &= g, 0 !== f2 && (d = tc(f2)));
  } else g = c & ~e, 0 !== g ? d = tc(g) : 0 !== f2 && (d = tc(f2));
  if (0 === d) return 0;
  if (0 !== b && b !== d && 0 === (b & e) && (e = d & -d, f2 = b & -b, e >= f2 || 16 === e && 0 !== (f2 & 4194240))) return b;
  0 !== (d & 4) && (d |= c & 16);
  b = a.entangledLanes;
  if (0 !== b) for (a = a.entanglements, b &= d; 0 < b; ) c = 31 - oc(b), e = 1 << c, d |= a[c], b &= ~e;
  return d;
}
function vc(a, b) {
  switch (a) {
    case 1:
    case 2:
    case 4:
      return b + 250;
    case 8:
    case 16:
    case 32:
    case 64:
    case 128:
    case 256:
    case 512:
    case 1024:
    case 2048:
    case 4096:
    case 8192:
    case 16384:
    case 32768:
    case 65536:
    case 131072:
    case 262144:
    case 524288:
    case 1048576:
    case 2097152:
      return b + 5e3;
    case 4194304:
    case 8388608:
    case 16777216:
    case 33554432:
    case 67108864:
      return -1;
    case 134217728:
    case 268435456:
    case 536870912:
    case 1073741824:
      return -1;
    default:
      return -1;
  }
}
function wc(a, b) {
  for (var c = a.suspendedLanes, d = a.pingedLanes, e = a.expirationTimes, f2 = a.pendingLanes; 0 < f2; ) {
    var g = 31 - oc(f2), h = 1 << g, k2 = e[g];
    if (-1 === k2) {
      if (0 === (h & c) || 0 !== (h & d)) e[g] = vc(h, b);
    } else k2 <= b && (a.expiredLanes |= h);
    f2 &= ~h;
  }
}
function xc(a) {
  a = a.pendingLanes & -1073741825;
  return 0 !== a ? a : a & 1073741824 ? 1073741824 : 0;
}
function yc() {
  var a = rc;
  rc <<= 1;
  0 === (rc & 4194240) && (rc = 64);
  return a;
}
function zc(a) {
  for (var b = [], c = 0; 31 > c; c++) b.push(a);
  return b;
}
function Ac(a, b, c) {
  a.pendingLanes |= b;
  536870912 !== b && (a.suspendedLanes = 0, a.pingedLanes = 0);
  a = a.eventTimes;
  b = 31 - oc(b);
  a[b] = c;
}
function Bc(a, b) {
  var c = a.pendingLanes & ~b;
  a.pendingLanes = b;
  a.suspendedLanes = 0;
  a.pingedLanes = 0;
  a.expiredLanes &= b;
  a.mutableReadLanes &= b;
  a.entangledLanes &= b;
  b = a.entanglements;
  var d = a.eventTimes;
  for (a = a.expirationTimes; 0 < c; ) {
    var e = 31 - oc(c), f2 = 1 << e;
    b[e] = 0;
    d[e] = -1;
    a[e] = -1;
    c &= ~f2;
  }
}
function Cc(a, b) {
  var c = a.entangledLanes |= b;
  for (a = a.entanglements; c; ) {
    var d = 31 - oc(c), e = 1 << d;
    e & b | a[d] & b && (a[d] |= b);
    c &= ~e;
  }
}
var C = 0;
function Dc(a) {
  a &= -a;
  return 1 < a ? 4 < a ? 0 !== (a & 268435455) ? 16 : 536870912 : 4 : 1;
}
var Ec, Fc, Gc, Hc, Ic, Jc = false, Kc = [], Lc = null, Mc = null, Nc = null, Oc = /* @__PURE__ */ new Map(), Pc = /* @__PURE__ */ new Map(), Qc = [], Rc = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");
function Sc(a, b) {
  switch (a) {
    case "focusin":
    case "focusout":
      Lc = null;
      break;
    case "dragenter":
    case "dragleave":
      Mc = null;
      break;
    case "mouseover":
    case "mouseout":
      Nc = null;
      break;
    case "pointerover":
    case "pointerout":
      Oc.delete(b.pointerId);
      break;
    case "gotpointercapture":
    case "lostpointercapture":
      Pc.delete(b.pointerId);
  }
}
function Tc(a, b, c, d, e, f2) {
  if (null === a || a.nativeEvent !== f2) return a = { blockedOn: b, domEventName: c, eventSystemFlags: d, nativeEvent: f2, targetContainers: [e] }, null !== b && (b = Cb(b), null !== b && Fc(b)), a;
  a.eventSystemFlags |= d;
  b = a.targetContainers;
  null !== e && -1 === b.indexOf(e) && b.push(e);
  return a;
}
function Uc(a, b, c, d, e) {
  switch (b) {
    case "focusin":
      return Lc = Tc(Lc, a, b, c, d, e), true;
    case "dragenter":
      return Mc = Tc(Mc, a, b, c, d, e), true;
    case "mouseover":
      return Nc = Tc(Nc, a, b, c, d, e), true;
    case "pointerover":
      var f2 = e.pointerId;
      Oc.set(f2, Tc(Oc.get(f2) || null, a, b, c, d, e));
      return true;
    case "gotpointercapture":
      return f2 = e.pointerId, Pc.set(f2, Tc(Pc.get(f2) || null, a, b, c, d, e)), true;
  }
  return false;
}
function Vc(a) {
  var b = Wc(a.target);
  if (null !== b) {
    var c = Vb(b);
    if (null !== c) {
      if (b = c.tag, 13 === b) {
        if (b = Wb(c), null !== b) {
          a.blockedOn = b;
          Ic(a.priority, function() {
            Gc(c);
          });
          return;
        }
      } else if (3 === b && c.stateNode.current.memoizedState.isDehydrated) {
        a.blockedOn = 3 === c.tag ? c.stateNode.containerInfo : null;
        return;
      }
    }
  }
  a.blockedOn = null;
}
function Xc(a) {
  if (null !== a.blockedOn) return false;
  for (var b = a.targetContainers; 0 < b.length; ) {
    var c = Yc(a.domEventName, a.eventSystemFlags, b[0], a.nativeEvent);
    if (null === c) {
      c = a.nativeEvent;
      var d = new c.constructor(c.type, c);
      wb = d;
      c.target.dispatchEvent(d);
      wb = null;
    } else return b = Cb(c), null !== b && Fc(b), a.blockedOn = c, false;
    b.shift();
  }
  return true;
}
function Zc(a, b, c) {
  Xc(a) && c.delete(b);
}
function $c() {
  Jc = false;
  null !== Lc && Xc(Lc) && (Lc = null);
  null !== Mc && Xc(Mc) && (Mc = null);
  null !== Nc && Xc(Nc) && (Nc = null);
  Oc.forEach(Zc);
  Pc.forEach(Zc);
}
function ad(a, b) {
  a.blockedOn === b && (a.blockedOn = null, Jc || (Jc = true, ca.unstable_scheduleCallback(ca.unstable_NormalPriority, $c)));
}
function bd(a) {
  function b(b2) {
    return ad(b2, a);
  }
  if (0 < Kc.length) {
    ad(Kc[0], a);
    for (var c = 1; c < Kc.length; c++) {
      var d = Kc[c];
      d.blockedOn === a && (d.blockedOn = null);
    }
  }
  null !== Lc && ad(Lc, a);
  null !== Mc && ad(Mc, a);
  null !== Nc && ad(Nc, a);
  Oc.forEach(b);
  Pc.forEach(b);
  for (c = 0; c < Qc.length; c++) d = Qc[c], d.blockedOn === a && (d.blockedOn = null);
  for (; 0 < Qc.length && (c = Qc[0], null === c.blockedOn); ) Vc(c), null === c.blockedOn && Qc.shift();
}
var cd = ua.ReactCurrentBatchConfig, dd = true;
function ed(a, b, c, d) {
  var e = C, f2 = cd.transition;
  cd.transition = null;
  try {
    C = 1, fd(a, b, c, d);
  } finally {
    C = e, cd.transition = f2;
  }
}
function gd(a, b, c, d) {
  var e = C, f2 = cd.transition;
  cd.transition = null;
  try {
    C = 4, fd(a, b, c, d);
  } finally {
    C = e, cd.transition = f2;
  }
}
function fd(a, b, c, d) {
  if (dd) {
    var e = Yc(a, b, c, d);
    if (null === e) hd(a, b, d, id, c), Sc(a, d);
    else if (Uc(e, a, b, c, d)) d.stopPropagation();
    else if (Sc(a, d), b & 4 && -1 < Rc.indexOf(a)) {
      for (; null !== e; ) {
        var f2 = Cb(e);
        null !== f2 && Ec(f2);
        f2 = Yc(a, b, c, d);
        null === f2 && hd(a, b, d, id, c);
        if (f2 === e) break;
        e = f2;
      }
      null !== e && d.stopPropagation();
    } else hd(a, b, d, null, c);
  }
}
var id = null;
function Yc(a, b, c, d) {
  id = null;
  a = xb(d);
  a = Wc(a);
  if (null !== a) if (b = Vb(a), null === b) a = null;
  else if (c = b.tag, 13 === c) {
    a = Wb(b);
    if (null !== a) return a;
    a = null;
  } else if (3 === c) {
    if (b.stateNode.current.memoizedState.isDehydrated) return 3 === b.tag ? b.stateNode.containerInfo : null;
    a = null;
  } else b !== a && (a = null);
  id = a;
  return null;
}
function jd(a) {
  switch (a) {
    case "cancel":
    case "click":
    case "close":
    case "contextmenu":
    case "copy":
    case "cut":
    case "auxclick":
    case "dblclick":
    case "dragend":
    case "dragstart":
    case "drop":
    case "focusin":
    case "focusout":
    case "input":
    case "invalid":
    case "keydown":
    case "keypress":
    case "keyup":
    case "mousedown":
    case "mouseup":
    case "paste":
    case "pause":
    case "play":
    case "pointercancel":
    case "pointerdown":
    case "pointerup":
    case "ratechange":
    case "reset":
    case "resize":
    case "seeked":
    case "submit":
    case "touchcancel":
    case "touchend":
    case "touchstart":
    case "volumechange":
    case "change":
    case "selectionchange":
    case "textInput":
    case "compositionstart":
    case "compositionend":
    case "compositionupdate":
    case "beforeblur":
    case "afterblur":
    case "beforeinput":
    case "blur":
    case "fullscreenchange":
    case "focus":
    case "hashchange":
    case "popstate":
    case "select":
    case "selectstart":
      return 1;
    case "drag":
    case "dragenter":
    case "dragexit":
    case "dragleave":
    case "dragover":
    case "mousemove":
    case "mouseout":
    case "mouseover":
    case "pointermove":
    case "pointerout":
    case "pointerover":
    case "scroll":
    case "toggle":
    case "touchmove":
    case "wheel":
    case "mouseenter":
    case "mouseleave":
    case "pointerenter":
    case "pointerleave":
      return 4;
    case "message":
      switch (ec()) {
        case fc:
          return 1;
        case gc:
          return 4;
        case hc:
        case ic:
          return 16;
        case jc:
          return 536870912;
        default:
          return 16;
      }
    default:
      return 16;
  }
}
var kd = null, ld = null, md = null;
function nd() {
  if (md) return md;
  var a, b = ld, c = b.length, d, e = "value" in kd ? kd.value : kd.textContent, f2 = e.length;
  for (a = 0; a < c && b[a] === e[a]; a++) ;
  var g = c - a;
  for (d = 1; d <= g && b[c - d] === e[f2 - d]; d++) ;
  return md = e.slice(a, 1 < d ? 1 - d : void 0);
}
function od(a) {
  var b = a.keyCode;
  "charCode" in a ? (a = a.charCode, 0 === a && 13 === b && (a = 13)) : a = b;
  10 === a && (a = 13);
  return 32 <= a || 13 === a ? a : 0;
}
function pd() {
  return true;
}
function qd() {
  return false;
}
function rd(a) {
  function b(b2, d, e, f2, g) {
    this._reactName = b2;
    this._targetInst = e;
    this.type = d;
    this.nativeEvent = f2;
    this.target = g;
    this.currentTarget = null;
    for (var c in a) a.hasOwnProperty(c) && (b2 = a[c], this[c] = b2 ? b2(f2) : f2[c]);
    this.isDefaultPrevented = (null != f2.defaultPrevented ? f2.defaultPrevented : false === f2.returnValue) ? pd : qd;
    this.isPropagationStopped = qd;
    return this;
  }
  A(b.prototype, { preventDefault: function() {
    this.defaultPrevented = true;
    var a2 = this.nativeEvent;
    a2 && (a2.preventDefault ? a2.preventDefault() : "unknown" !== typeof a2.returnValue && (a2.returnValue = false), this.isDefaultPrevented = pd);
  }, stopPropagation: function() {
    var a2 = this.nativeEvent;
    a2 && (a2.stopPropagation ? a2.stopPropagation() : "unknown" !== typeof a2.cancelBubble && (a2.cancelBubble = true), this.isPropagationStopped = pd);
  }, persist: function() {
  }, isPersistent: pd });
  return b;
}
var sd = { eventPhase: 0, bubbles: 0, cancelable: 0, timeStamp: function(a) {
  return a.timeStamp || Date.now();
}, defaultPrevented: 0, isTrusted: 0 }, td = rd(sd), ud = A({}, sd, { view: 0, detail: 0 }), vd = rd(ud), wd, xd, yd, Ad = A({}, ud, { screenX: 0, screenY: 0, clientX: 0, clientY: 0, pageX: 0, pageY: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, getModifierState: zd, button: 0, buttons: 0, relatedTarget: function(a) {
  return void 0 === a.relatedTarget ? a.fromElement === a.srcElement ? a.toElement : a.fromElement : a.relatedTarget;
}, movementX: function(a) {
  if ("movementX" in a) return a.movementX;
  a !== yd && (yd && "mousemove" === a.type ? (wd = a.screenX - yd.screenX, xd = a.screenY - yd.screenY) : xd = wd = 0, yd = a);
  return wd;
}, movementY: function(a) {
  return "movementY" in a ? a.movementY : xd;
} }), Bd = rd(Ad), Cd = A({}, Ad, { dataTransfer: 0 }), Dd = rd(Cd), Ed = A({}, ud, { relatedTarget: 0 }), Fd = rd(Ed), Gd = A({}, sd, { animationName: 0, elapsedTime: 0, pseudoElement: 0 }), Hd = rd(Gd), Id = A({}, sd, { clipboardData: function(a) {
  return "clipboardData" in a ? a.clipboardData : window.clipboardData;
} }), Jd = rd(Id), Kd = A({}, sd, { data: 0 }), Ld = rd(Kd), Md = {
  Esc: "Escape",
  Spacebar: " ",
  Left: "ArrowLeft",
  Up: "ArrowUp",
  Right: "ArrowRight",
  Down: "ArrowDown",
  Del: "Delete",
  Win: "OS",
  Menu: "ContextMenu",
  Apps: "ContextMenu",
  Scroll: "ScrollLock",
  MozPrintableKey: "Unidentified"
}, Nd = {
  8: "Backspace",
  9: "Tab",
  12: "Clear",
  13: "Enter",
  16: "Shift",
  17: "Control",
  18: "Alt",
  19: "Pause",
  20: "CapsLock",
  27: "Escape",
  32: " ",
  33: "PageUp",
  34: "PageDown",
  35: "End",
  36: "Home",
  37: "ArrowLeft",
  38: "ArrowUp",
  39: "ArrowRight",
  40: "ArrowDown",
  45: "Insert",
  46: "Delete",
  112: "F1",
  113: "F2",
  114: "F3",
  115: "F4",
  116: "F5",
  117: "F6",
  118: "F7",
  119: "F8",
  120: "F9",
  121: "F10",
  122: "F11",
  123: "F12",
  144: "NumLock",
  145: "ScrollLock",
  224: "Meta"
}, Od = { Alt: "altKey", Control: "ctrlKey", Meta: "metaKey", Shift: "shiftKey" };
function Pd(a) {
  var b = this.nativeEvent;
  return b.getModifierState ? b.getModifierState(a) : (a = Od[a]) ? !!b[a] : false;
}
function zd() {
  return Pd;
}
var Qd = A({}, ud, { key: function(a) {
  if (a.key) {
    var b = Md[a.key] || a.key;
    if ("Unidentified" !== b) return b;
  }
  return "keypress" === a.type ? (a = od(a), 13 === a ? "Enter" : String.fromCharCode(a)) : "keydown" === a.type || "keyup" === a.type ? Nd[a.keyCode] || "Unidentified" : "";
}, code: 0, location: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, repeat: 0, locale: 0, getModifierState: zd, charCode: function(a) {
  return "keypress" === a.type ? od(a) : 0;
}, keyCode: function(a) {
  return "keydown" === a.type || "keyup" === a.type ? a.keyCode : 0;
}, which: function(a) {
  return "keypress" === a.type ? od(a) : "keydown" === a.type || "keyup" === a.type ? a.keyCode : 0;
} }), Rd = rd(Qd), Sd = A({}, Ad, { pointerId: 0, width: 0, height: 0, pressure: 0, tangentialPressure: 0, tiltX: 0, tiltY: 0, twist: 0, pointerType: 0, isPrimary: 0 }), Td = rd(Sd), Ud = A({}, ud, { touches: 0, targetTouches: 0, changedTouches: 0, altKey: 0, metaKey: 0, ctrlKey: 0, shiftKey: 0, getModifierState: zd }), Vd = rd(Ud), Wd = A({}, sd, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 }), Xd = rd(Wd), Yd = A({}, Ad, {
  deltaX: function(a) {
    return "deltaX" in a ? a.deltaX : "wheelDeltaX" in a ? -a.wheelDeltaX : 0;
  },
  deltaY: function(a) {
    return "deltaY" in a ? a.deltaY : "wheelDeltaY" in a ? -a.wheelDeltaY : "wheelDelta" in a ? -a.wheelDelta : 0;
  },
  deltaZ: 0,
  deltaMode: 0
}), Zd = rd(Yd), $d = [9, 13, 27, 32], ae = ia && "CompositionEvent" in window, be = null;
ia && "documentMode" in document && (be = document.documentMode);
var ce = ia && "TextEvent" in window && !be, de = ia && (!ae || be && 8 < be && 11 >= be), ee = String.fromCharCode(32), fe = false;
function ge(a, b) {
  switch (a) {
    case "keyup":
      return -1 !== $d.indexOf(b.keyCode);
    case "keydown":
      return 229 !== b.keyCode;
    case "keypress":
    case "mousedown":
    case "focusout":
      return true;
    default:
      return false;
  }
}
function he(a) {
  a = a.detail;
  return "object" === typeof a && "data" in a ? a.data : null;
}
var ie = false;
function je(a, b) {
  switch (a) {
    case "compositionend":
      return he(b);
    case "keypress":
      if (32 !== b.which) return null;
      fe = true;
      return ee;
    case "textInput":
      return a = b.data, a === ee && fe ? null : a;
    default:
      return null;
  }
}
function ke(a, b) {
  if (ie) return "compositionend" === a || !ae && ge(a, b) ? (a = nd(), md = ld = kd = null, ie = false, a) : null;
  switch (a) {
    case "paste":
      return null;
    case "keypress":
      if (!(b.ctrlKey || b.altKey || b.metaKey) || b.ctrlKey && b.altKey) {
        if (b.char && 1 < b.char.length) return b.char;
        if (b.which) return String.fromCharCode(b.which);
      }
      return null;
    case "compositionend":
      return de && "ko" !== b.locale ? null : b.data;
    default:
      return null;
  }
}
var le = { color: true, date: true, datetime: true, "datetime-local": true, email: true, month: true, number: true, password: true, range: true, search: true, tel: true, text: true, time: true, url: true, week: true };
function me(a) {
  var b = a && a.nodeName && a.nodeName.toLowerCase();
  return "input" === b ? !!le[a.type] : "textarea" === b ? true : false;
}
function ne(a, b, c, d) {
  Eb(d);
  b = oe(b, "onChange");
  0 < b.length && (c = new td("onChange", "change", null, c, d), a.push({ event: c, listeners: b }));
}
var pe = null, qe = null;
function re(a) {
  se(a, 0);
}
function te(a) {
  var b = ue(a);
  if (Wa(b)) return a;
}
function ve(a, b) {
  if ("change" === a) return b;
}
var we = false;
if (ia) {
  var xe;
  if (ia) {
    var ye = "oninput" in document;
    if (!ye) {
      var ze = document.createElement("div");
      ze.setAttribute("oninput", "return;");
      ye = "function" === typeof ze.oninput;
    }
    xe = ye;
  } else xe = false;
  we = xe && (!document.documentMode || 9 < document.documentMode);
}
function Ae() {
  pe && (pe.detachEvent("onpropertychange", Be), qe = pe = null);
}
function Be(a) {
  if ("value" === a.propertyName && te(qe)) {
    var b = [];
    ne(b, qe, a, xb(a));
    Jb(re, b);
  }
}
function Ce(a, b, c) {
  "focusin" === a ? (Ae(), pe = b, qe = c, pe.attachEvent("onpropertychange", Be)) : "focusout" === a && Ae();
}
function De(a) {
  if ("selectionchange" === a || "keyup" === a || "keydown" === a) return te(qe);
}
function Ee(a, b) {
  if ("click" === a) return te(b);
}
function Fe(a, b) {
  if ("input" === a || "change" === a) return te(b);
}
function Ge(a, b) {
  return a === b && (0 !== a || 1 / a === 1 / b) || a !== a && b !== b;
}
var He = "function" === typeof Object.is ? Object.is : Ge;
function Ie(a, b) {
  if (He(a, b)) return true;
  if ("object" !== typeof a || null === a || "object" !== typeof b || null === b) return false;
  var c = Object.keys(a), d = Object.keys(b);
  if (c.length !== d.length) return false;
  for (d = 0; d < c.length; d++) {
    var e = c[d];
    if (!ja.call(b, e) || !He(a[e], b[e])) return false;
  }
  return true;
}
function Je(a) {
  for (; a && a.firstChild; ) a = a.firstChild;
  return a;
}
function Ke(a, b) {
  var c = Je(a);
  a = 0;
  for (var d; c; ) {
    if (3 === c.nodeType) {
      d = a + c.textContent.length;
      if (a <= b && d >= b) return { node: c, offset: b - a };
      a = d;
    }
    a: {
      for (; c; ) {
        if (c.nextSibling) {
          c = c.nextSibling;
          break a;
        }
        c = c.parentNode;
      }
      c = void 0;
    }
    c = Je(c);
  }
}
function Le(a, b) {
  return a && b ? a === b ? true : a && 3 === a.nodeType ? false : b && 3 === b.nodeType ? Le(a, b.parentNode) : "contains" in a ? a.contains(b) : a.compareDocumentPosition ? !!(a.compareDocumentPosition(b) & 16) : false : false;
}
function Me() {
  for (var a = window, b = Xa(); b instanceof a.HTMLIFrameElement; ) {
    try {
      var c = "string" === typeof b.contentWindow.location.href;
    } catch (d) {
      c = false;
    }
    if (c) a = b.contentWindow;
    else break;
    b = Xa(a.document);
  }
  return b;
}
function Ne(a) {
  var b = a && a.nodeName && a.nodeName.toLowerCase();
  return b && ("input" === b && ("text" === a.type || "search" === a.type || "tel" === a.type || "url" === a.type || "password" === a.type) || "textarea" === b || "true" === a.contentEditable);
}
function Oe(a) {
  var b = Me(), c = a.focusedElem, d = a.selectionRange;
  if (b !== c && c && c.ownerDocument && Le(c.ownerDocument.documentElement, c)) {
    if (null !== d && Ne(c)) {
      if (b = d.start, a = d.end, void 0 === a && (a = b), "selectionStart" in c) c.selectionStart = b, c.selectionEnd = Math.min(a, c.value.length);
      else if (a = (b = c.ownerDocument || document) && b.defaultView || window, a.getSelection) {
        a = a.getSelection();
        var e = c.textContent.length, f2 = Math.min(d.start, e);
        d = void 0 === d.end ? f2 : Math.min(d.end, e);
        !a.extend && f2 > d && (e = d, d = f2, f2 = e);
        e = Ke(c, f2);
        var g = Ke(
          c,
          d
        );
        e && g && (1 !== a.rangeCount || a.anchorNode !== e.node || a.anchorOffset !== e.offset || a.focusNode !== g.node || a.focusOffset !== g.offset) && (b = b.createRange(), b.setStart(e.node, e.offset), a.removeAllRanges(), f2 > d ? (a.addRange(b), a.extend(g.node, g.offset)) : (b.setEnd(g.node, g.offset), a.addRange(b)));
      }
    }
    b = [];
    for (a = c; a = a.parentNode; ) 1 === a.nodeType && b.push({ element: a, left: a.scrollLeft, top: a.scrollTop });
    "function" === typeof c.focus && c.focus();
    for (c = 0; c < b.length; c++) a = b[c], a.element.scrollLeft = a.left, a.element.scrollTop = a.top;
  }
}
var Pe = ia && "documentMode" in document && 11 >= document.documentMode, Qe = null, Re = null, Se = null, Te = false;
function Ue(a, b, c) {
  var d = c.window === c ? c.document : 9 === c.nodeType ? c : c.ownerDocument;
  Te || null == Qe || Qe !== Xa(d) || (d = Qe, "selectionStart" in d && Ne(d) ? d = { start: d.selectionStart, end: d.selectionEnd } : (d = (d.ownerDocument && d.ownerDocument.defaultView || window).getSelection(), d = { anchorNode: d.anchorNode, anchorOffset: d.anchorOffset, focusNode: d.focusNode, focusOffset: d.focusOffset }), Se && Ie(Se, d) || (Se = d, d = oe(Re, "onSelect"), 0 < d.length && (b = new td("onSelect", "select", null, b, c), a.push({ event: b, listeners: d }), b.target = Qe)));
}
function Ve(a, b) {
  var c = {};
  c[a.toLowerCase()] = b.toLowerCase();
  c["Webkit" + a] = "webkit" + b;
  c["Moz" + a] = "moz" + b;
  return c;
}
var We = { animationend: Ve("Animation", "AnimationEnd"), animationiteration: Ve("Animation", "AnimationIteration"), animationstart: Ve("Animation", "AnimationStart"), transitionend: Ve("Transition", "TransitionEnd") }, Xe = {}, Ye = {};
ia && (Ye = document.createElement("div").style, "AnimationEvent" in window || (delete We.animationend.animation, delete We.animationiteration.animation, delete We.animationstart.animation), "TransitionEvent" in window || delete We.transitionend.transition);
function Ze(a) {
  if (Xe[a]) return Xe[a];
  if (!We[a]) return a;
  var b = We[a], c;
  for (c in b) if (b.hasOwnProperty(c) && c in Ye) return Xe[a] = b[c];
  return a;
}
var $e = Ze("animationend"), af = Ze("animationiteration"), bf = Ze("animationstart"), cf = Ze("transitionend"), df = /* @__PURE__ */ new Map(), ef = "abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
function ff(a, b) {
  df.set(a, b);
  fa(b, [a]);
}
for (var gf = 0; gf < ef.length; gf++) {
  var hf = ef[gf], jf = hf.toLowerCase(), kf = hf[0].toUpperCase() + hf.slice(1);
  ff(jf, "on" + kf);
}
ff($e, "onAnimationEnd");
ff(af, "onAnimationIteration");
ff(bf, "onAnimationStart");
ff("dblclick", "onDoubleClick");
ff("focusin", "onFocus");
ff("focusout", "onBlur");
ff(cf, "onTransitionEnd");
ha("onMouseEnter", ["mouseout", "mouseover"]);
ha("onMouseLeave", ["mouseout", "mouseover"]);
ha("onPointerEnter", ["pointerout", "pointerover"]);
ha("onPointerLeave", ["pointerout", "pointerover"]);
fa("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" "));
fa("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));
fa("onBeforeInput", ["compositionend", "keypress", "textInput", "paste"]);
fa("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" "));
fa("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" "));
fa("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
var lf = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), mf = new Set("cancel close invalid load scroll toggle".split(" ").concat(lf));
function nf(a, b, c) {
  var d = a.type || "unknown-event";
  a.currentTarget = c;
  Ub(d, b, void 0, a);
  a.currentTarget = null;
}
function se(a, b) {
  b = 0 !== (b & 4);
  for (var c = 0; c < a.length; c++) {
    var d = a[c], e = d.event;
    d = d.listeners;
    a: {
      var f2 = void 0;
      if (b) for (var g = d.length - 1; 0 <= g; g--) {
        var h = d[g], k2 = h.instance, l2 = h.currentTarget;
        h = h.listener;
        if (k2 !== f2 && e.isPropagationStopped()) break a;
        nf(e, h, l2);
        f2 = k2;
      }
      else for (g = 0; g < d.length; g++) {
        h = d[g];
        k2 = h.instance;
        l2 = h.currentTarget;
        h = h.listener;
        if (k2 !== f2 && e.isPropagationStopped()) break a;
        nf(e, h, l2);
        f2 = k2;
      }
    }
  }
  if (Qb) throw a = Rb, Qb = false, Rb = null, a;
}
function D(a, b) {
  var c = b[of];
  void 0 === c && (c = b[of] = /* @__PURE__ */ new Set());
  var d = a + "__bubble";
  c.has(d) || (pf(b, a, 2, false), c.add(d));
}
function qf(a, b, c) {
  var d = 0;
  b && (d |= 4);
  pf(c, a, d, b);
}
var rf = "_reactListening" + Math.random().toString(36).slice(2);
function sf(a) {
  if (!a[rf]) {
    a[rf] = true;
    da.forEach(function(b2) {
      "selectionchange" !== b2 && (mf.has(b2) || qf(b2, false, a), qf(b2, true, a));
    });
    var b = 9 === a.nodeType ? a : a.ownerDocument;
    null === b || b[rf] || (b[rf] = true, qf("selectionchange", false, b));
  }
}
function pf(a, b, c, d) {
  switch (jd(b)) {
    case 1:
      var e = ed;
      break;
    case 4:
      e = gd;
      break;
    default:
      e = fd;
  }
  c = e.bind(null, b, c, a);
  e = void 0;
  !Lb || "touchstart" !== b && "touchmove" !== b && "wheel" !== b || (e = true);
  d ? void 0 !== e ? a.addEventListener(b, c, { capture: true, passive: e }) : a.addEventListener(b, c, true) : void 0 !== e ? a.addEventListener(b, c, { passive: e }) : a.addEventListener(b, c, false);
}
function hd(a, b, c, d, e) {
  var f2 = d;
  if (0 === (b & 1) && 0 === (b & 2) && null !== d) a: for (; ; ) {
    if (null === d) return;
    var g = d.tag;
    if (3 === g || 4 === g) {
      var h = d.stateNode.containerInfo;
      if (h === e || 8 === h.nodeType && h.parentNode === e) break;
      if (4 === g) for (g = d.return; null !== g; ) {
        var k2 = g.tag;
        if (3 === k2 || 4 === k2) {
          if (k2 = g.stateNode.containerInfo, k2 === e || 8 === k2.nodeType && k2.parentNode === e) return;
        }
        g = g.return;
      }
      for (; null !== h; ) {
        g = Wc(h);
        if (null === g) return;
        k2 = g.tag;
        if (5 === k2 || 6 === k2) {
          d = f2 = g;
          continue a;
        }
        h = h.parentNode;
      }
    }
    d = d.return;
  }
  Jb(function() {
    var d2 = f2, e2 = xb(c), g2 = [];
    a: {
      var h2 = df.get(a);
      if (void 0 !== h2) {
        var k3 = td, n2 = a;
        switch (a) {
          case "keypress":
            if (0 === od(c)) break a;
          case "keydown":
          case "keyup":
            k3 = Rd;
            break;
          case "focusin":
            n2 = "focus";
            k3 = Fd;
            break;
          case "focusout":
            n2 = "blur";
            k3 = Fd;
            break;
          case "beforeblur":
          case "afterblur":
            k3 = Fd;
            break;
          case "click":
            if (2 === c.button) break a;
          case "auxclick":
          case "dblclick":
          case "mousedown":
          case "mousemove":
          case "mouseup":
          case "mouseout":
          case "mouseover":
          case "contextmenu":
            k3 = Bd;
            break;
          case "drag":
          case "dragend":
          case "dragenter":
          case "dragexit":
          case "dragleave":
          case "dragover":
          case "dragstart":
          case "drop":
            k3 = Dd;
            break;
          case "touchcancel":
          case "touchend":
          case "touchmove":
          case "touchstart":
            k3 = Vd;
            break;
          case $e:
          case af:
          case bf:
            k3 = Hd;
            break;
          case cf:
            k3 = Xd;
            break;
          case "scroll":
            k3 = vd;
            break;
          case "wheel":
            k3 = Zd;
            break;
          case "copy":
          case "cut":
          case "paste":
            k3 = Jd;
            break;
          case "gotpointercapture":
          case "lostpointercapture":
          case "pointercancel":
          case "pointerdown":
          case "pointermove":
          case "pointerout":
          case "pointerover":
          case "pointerup":
            k3 = Td;
        }
        var t2 = 0 !== (b & 4), J2 = !t2 && "scroll" === a, x2 = t2 ? null !== h2 ? h2 + "Capture" : null : h2;
        t2 = [];
        for (var w2 = d2, u2; null !== w2; ) {
          u2 = w2;
          var F2 = u2.stateNode;
          5 === u2.tag && null !== F2 && (u2 = F2, null !== x2 && (F2 = Kb(w2, x2), null != F2 && t2.push(tf(w2, F2, u2))));
          if (J2) break;
          w2 = w2.return;
        }
        0 < t2.length && (h2 = new k3(h2, n2, null, c, e2), g2.push({ event: h2, listeners: t2 }));
      }
    }
    if (0 === (b & 7)) {
      a: {
        h2 = "mouseover" === a || "pointerover" === a;
        k3 = "mouseout" === a || "pointerout" === a;
        if (h2 && c !== wb && (n2 = c.relatedTarget || c.fromElement) && (Wc(n2) || n2[uf])) break a;
        if (k3 || h2) {
          h2 = e2.window === e2 ? e2 : (h2 = e2.ownerDocument) ? h2.defaultView || h2.parentWindow : window;
          if (k3) {
            if (n2 = c.relatedTarget || c.toElement, k3 = d2, n2 = n2 ? Wc(n2) : null, null !== n2 && (J2 = Vb(n2), n2 !== J2 || 5 !== n2.tag && 6 !== n2.tag)) n2 = null;
          } else k3 = null, n2 = d2;
          if (k3 !== n2) {
            t2 = Bd;
            F2 = "onMouseLeave";
            x2 = "onMouseEnter";
            w2 = "mouse";
            if ("pointerout" === a || "pointerover" === a) t2 = Td, F2 = "onPointerLeave", x2 = "onPointerEnter", w2 = "pointer";
            J2 = null == k3 ? h2 : ue(k3);
            u2 = null == n2 ? h2 : ue(n2);
            h2 = new t2(F2, w2 + "leave", k3, c, e2);
            h2.target = J2;
            h2.relatedTarget = u2;
            F2 = null;
            Wc(e2) === d2 && (t2 = new t2(x2, w2 + "enter", n2, c, e2), t2.target = u2, t2.relatedTarget = J2, F2 = t2);
            J2 = F2;
            if (k3 && n2) b: {
              t2 = k3;
              x2 = n2;
              w2 = 0;
              for (u2 = t2; u2; u2 = vf(u2)) w2++;
              u2 = 0;
              for (F2 = x2; F2; F2 = vf(F2)) u2++;
              for (; 0 < w2 - u2; ) t2 = vf(t2), w2--;
              for (; 0 < u2 - w2; ) x2 = vf(x2), u2--;
              for (; w2--; ) {
                if (t2 === x2 || null !== x2 && t2 === x2.alternate) break b;
                t2 = vf(t2);
                x2 = vf(x2);
              }
              t2 = null;
            }
            else t2 = null;
            null !== k3 && wf(g2, h2, k3, t2, false);
            null !== n2 && null !== J2 && wf(g2, J2, n2, t2, true);
          }
        }
      }
      a: {
        h2 = d2 ? ue(d2) : window;
        k3 = h2.nodeName && h2.nodeName.toLowerCase();
        if ("select" === k3 || "input" === k3 && "file" === h2.type) var na = ve;
        else if (me(h2)) if (we) na = Fe;
        else {
          na = De;
          var xa = Ce;
        }
        else (k3 = h2.nodeName) && "input" === k3.toLowerCase() && ("checkbox" === h2.type || "radio" === h2.type) && (na = Ee);
        if (na && (na = na(a, d2))) {
          ne(g2, na, c, e2);
          break a;
        }
        xa && xa(a, h2, d2);
        "focusout" === a && (xa = h2._wrapperState) && xa.controlled && "number" === h2.type && cb(h2, "number", h2.value);
      }
      xa = d2 ? ue(d2) : window;
      switch (a) {
        case "focusin":
          if (me(xa) || "true" === xa.contentEditable) Qe = xa, Re = d2, Se = null;
          break;
        case "focusout":
          Se = Re = Qe = null;
          break;
        case "mousedown":
          Te = true;
          break;
        case "contextmenu":
        case "mouseup":
        case "dragend":
          Te = false;
          Ue(g2, c, e2);
          break;
        case "selectionchange":
          if (Pe) break;
        case "keydown":
        case "keyup":
          Ue(g2, c, e2);
      }
      var $a;
      if (ae) b: {
        switch (a) {
          case "compositionstart":
            var ba = "onCompositionStart";
            break b;
          case "compositionend":
            ba = "onCompositionEnd";
            break b;
          case "compositionupdate":
            ba = "onCompositionUpdate";
            break b;
        }
        ba = void 0;
      }
      else ie ? ge(a, c) && (ba = "onCompositionEnd") : "keydown" === a && 229 === c.keyCode && (ba = "onCompositionStart");
      ba && (de && "ko" !== c.locale && (ie || "onCompositionStart" !== ba ? "onCompositionEnd" === ba && ie && ($a = nd()) : (kd = e2, ld = "value" in kd ? kd.value : kd.textContent, ie = true)), xa = oe(d2, ba), 0 < xa.length && (ba = new Ld(ba, a, null, c, e2), g2.push({ event: ba, listeners: xa }), $a ? ba.data = $a : ($a = he(c), null !== $a && (ba.data = $a))));
      if ($a = ce ? je(a, c) : ke(a, c)) d2 = oe(d2, "onBeforeInput"), 0 < d2.length && (e2 = new Ld("onBeforeInput", "beforeinput", null, c, e2), g2.push({ event: e2, listeners: d2 }), e2.data = $a);
    }
    se(g2, b);
  });
}
function tf(a, b, c) {
  return { instance: a, listener: b, currentTarget: c };
}
function oe(a, b) {
  for (var c = b + "Capture", d = []; null !== a; ) {
    var e = a, f2 = e.stateNode;
    5 === e.tag && null !== f2 && (e = f2, f2 = Kb(a, c), null != f2 && d.unshift(tf(a, f2, e)), f2 = Kb(a, b), null != f2 && d.push(tf(a, f2, e)));
    a = a.return;
  }
  return d;
}
function vf(a) {
  if (null === a) return null;
  do
    a = a.return;
  while (a && 5 !== a.tag);
  return a ? a : null;
}
function wf(a, b, c, d, e) {
  for (var f2 = b._reactName, g = []; null !== c && c !== d; ) {
    var h = c, k2 = h.alternate, l2 = h.stateNode;
    if (null !== k2 && k2 === d) break;
    5 === h.tag && null !== l2 && (h = l2, e ? (k2 = Kb(c, f2), null != k2 && g.unshift(tf(c, k2, h))) : e || (k2 = Kb(c, f2), null != k2 && g.push(tf(c, k2, h))));
    c = c.return;
  }
  0 !== g.length && a.push({ event: b, listeners: g });
}
var xf = /\r\n?/g, yf = /\u0000|\uFFFD/g;
function zf(a) {
  return ("string" === typeof a ? a : "" + a).replace(xf, "\n").replace(yf, "");
}
function Af(a, b, c) {
  b = zf(b);
  if (zf(a) !== b && c) throw Error(p(425));
}
function Bf() {
}
var Cf = null, Df = null;
function Ef(a, b) {
  return "textarea" === a || "noscript" === a || "string" === typeof b.children || "number" === typeof b.children || "object" === typeof b.dangerouslySetInnerHTML && null !== b.dangerouslySetInnerHTML && null != b.dangerouslySetInnerHTML.__html;
}
var Ff = "function" === typeof setTimeout ? setTimeout : void 0, Gf = "function" === typeof clearTimeout ? clearTimeout : void 0, Hf = "function" === typeof Promise ? Promise : void 0, Jf = "function" === typeof queueMicrotask ? queueMicrotask : "undefined" !== typeof Hf ? function(a) {
  return Hf.resolve(null).then(a).catch(If);
} : Ff;
function If(a) {
  setTimeout(function() {
    throw a;
  });
}
function Kf(a, b) {
  var c = b, d = 0;
  do {
    var e = c.nextSibling;
    a.removeChild(c);
    if (e && 8 === e.nodeType) if (c = e.data, "/$" === c) {
      if (0 === d) {
        a.removeChild(e);
        bd(b);
        return;
      }
      d--;
    } else "$" !== c && "$?" !== c && "$!" !== c || d++;
    c = e;
  } while (c);
  bd(b);
}
function Lf(a) {
  for (; null != a; a = a.nextSibling) {
    var b = a.nodeType;
    if (1 === b || 3 === b) break;
    if (8 === b) {
      b = a.data;
      if ("$" === b || "$!" === b || "$?" === b) break;
      if ("/$" === b) return null;
    }
  }
  return a;
}
function Mf(a) {
  a = a.previousSibling;
  for (var b = 0; a; ) {
    if (8 === a.nodeType) {
      var c = a.data;
      if ("$" === c || "$!" === c || "$?" === c) {
        if (0 === b) return a;
        b--;
      } else "/$" === c && b++;
    }
    a = a.previousSibling;
  }
  return null;
}
var Nf = Math.random().toString(36).slice(2), Of = "__reactFiber$" + Nf, Pf = "__reactProps$" + Nf, uf = "__reactContainer$" + Nf, of = "__reactEvents$" + Nf, Qf = "__reactListeners$" + Nf, Rf = "__reactHandles$" + Nf;
function Wc(a) {
  var b = a[Of];
  if (b) return b;
  for (var c = a.parentNode; c; ) {
    if (b = c[uf] || c[Of]) {
      c = b.alternate;
      if (null !== b.child || null !== c && null !== c.child) for (a = Mf(a); null !== a; ) {
        if (c = a[Of]) return c;
        a = Mf(a);
      }
      return b;
    }
    a = c;
    c = a.parentNode;
  }
  return null;
}
function Cb(a) {
  a = a[Of] || a[uf];
  return !a || 5 !== a.tag && 6 !== a.tag && 13 !== a.tag && 3 !== a.tag ? null : a;
}
function ue(a) {
  if (5 === a.tag || 6 === a.tag) return a.stateNode;
  throw Error(p(33));
}
function Db(a) {
  return a[Pf] || null;
}
var Sf = [], Tf = -1;
function Uf(a) {
  return { current: a };
}
function E(a) {
  0 > Tf || (a.current = Sf[Tf], Sf[Tf] = null, Tf--);
}
function G$1(a, b) {
  Tf++;
  Sf[Tf] = a.current;
  a.current = b;
}
var Vf = {}, H = Uf(Vf), Wf = Uf(false), Xf = Vf;
function Yf(a, b) {
  var c = a.type.contextTypes;
  if (!c) return Vf;
  var d = a.stateNode;
  if (d && d.__reactInternalMemoizedUnmaskedChildContext === b) return d.__reactInternalMemoizedMaskedChildContext;
  var e = {}, f2;
  for (f2 in c) e[f2] = b[f2];
  d && (a = a.stateNode, a.__reactInternalMemoizedUnmaskedChildContext = b, a.__reactInternalMemoizedMaskedChildContext = e);
  return e;
}
function Zf(a) {
  a = a.childContextTypes;
  return null !== a && void 0 !== a;
}
function $f() {
  E(Wf);
  E(H);
}
function ag(a, b, c) {
  if (H.current !== Vf) throw Error(p(168));
  G$1(H, b);
  G$1(Wf, c);
}
function bg(a, b, c) {
  var d = a.stateNode;
  b = b.childContextTypes;
  if ("function" !== typeof d.getChildContext) return c;
  d = d.getChildContext();
  for (var e in d) if (!(e in b)) throw Error(p(108, Ra(a) || "Unknown", e));
  return A({}, c, d);
}
function cg(a) {
  a = (a = a.stateNode) && a.__reactInternalMemoizedMergedChildContext || Vf;
  Xf = H.current;
  G$1(H, a);
  G$1(Wf, Wf.current);
  return true;
}
function dg(a, b, c) {
  var d = a.stateNode;
  if (!d) throw Error(p(169));
  c ? (a = bg(a, b, Xf), d.__reactInternalMemoizedMergedChildContext = a, E(Wf), E(H), G$1(H, a)) : E(Wf);
  G$1(Wf, c);
}
var eg = null, fg = false, gg = false;
function hg(a) {
  null === eg ? eg = [a] : eg.push(a);
}
function ig(a) {
  fg = true;
  hg(a);
}
function jg() {
  if (!gg && null !== eg) {
    gg = true;
    var a = 0, b = C;
    try {
      var c = eg;
      for (C = 1; a < c.length; a++) {
        var d = c[a];
        do
          d = d(true);
        while (null !== d);
      }
      eg = null;
      fg = false;
    } catch (e) {
      throw null !== eg && (eg = eg.slice(a + 1)), ac(fc, jg), e;
    } finally {
      C = b, gg = false;
    }
  }
  return null;
}
var kg = [], lg = 0, mg = null, ng = 0, og = [], pg = 0, qg = null, rg = 1, sg = "";
function tg(a, b) {
  kg[lg++] = ng;
  kg[lg++] = mg;
  mg = a;
  ng = b;
}
function ug(a, b, c) {
  og[pg++] = rg;
  og[pg++] = sg;
  og[pg++] = qg;
  qg = a;
  var d = rg;
  a = sg;
  var e = 32 - oc(d) - 1;
  d &= ~(1 << e);
  c += 1;
  var f2 = 32 - oc(b) + e;
  if (30 < f2) {
    var g = e - e % 5;
    f2 = (d & (1 << g) - 1).toString(32);
    d >>= g;
    e -= g;
    rg = 1 << 32 - oc(b) + e | c << e | d;
    sg = f2 + a;
  } else rg = 1 << f2 | c << e | d, sg = a;
}
function vg(a) {
  null !== a.return && (tg(a, 1), ug(a, 1, 0));
}
function wg(a) {
  for (; a === mg; ) mg = kg[--lg], kg[lg] = null, ng = kg[--lg], kg[lg] = null;
  for (; a === qg; ) qg = og[--pg], og[pg] = null, sg = og[--pg], og[pg] = null, rg = og[--pg], og[pg] = null;
}
var xg = null, yg = null, I = false, zg = null;
function Ag(a, b) {
  var c = Bg(5, null, null, 0);
  c.elementType = "DELETED";
  c.stateNode = b;
  c.return = a;
  b = a.deletions;
  null === b ? (a.deletions = [c], a.flags |= 16) : b.push(c);
}
function Cg(a, b) {
  switch (a.tag) {
    case 5:
      var c = a.type;
      b = 1 !== b.nodeType || c.toLowerCase() !== b.nodeName.toLowerCase() ? null : b;
      return null !== b ? (a.stateNode = b, xg = a, yg = Lf(b.firstChild), true) : false;
    case 6:
      return b = "" === a.pendingProps || 3 !== b.nodeType ? null : b, null !== b ? (a.stateNode = b, xg = a, yg = null, true) : false;
    case 13:
      return b = 8 !== b.nodeType ? null : b, null !== b ? (c = null !== qg ? { id: rg, overflow: sg } : null, a.memoizedState = { dehydrated: b, treeContext: c, retryLane: 1073741824 }, c = Bg(18, null, null, 0), c.stateNode = b, c.return = a, a.child = c, xg = a, yg = null, true) : false;
    default:
      return false;
  }
}
function Dg(a) {
  return 0 !== (a.mode & 1) && 0 === (a.flags & 128);
}
function Eg(a) {
  if (I) {
    var b = yg;
    if (b) {
      var c = b;
      if (!Cg(a, b)) {
        if (Dg(a)) throw Error(p(418));
        b = Lf(c.nextSibling);
        var d = xg;
        b && Cg(a, b) ? Ag(d, c) : (a.flags = a.flags & -4097 | 2, I = false, xg = a);
      }
    } else {
      if (Dg(a)) throw Error(p(418));
      a.flags = a.flags & -4097 | 2;
      I = false;
      xg = a;
    }
  }
}
function Fg(a) {
  for (a = a.return; null !== a && 5 !== a.tag && 3 !== a.tag && 13 !== a.tag; ) a = a.return;
  xg = a;
}
function Gg(a) {
  if (a !== xg) return false;
  if (!I) return Fg(a), I = true, false;
  var b;
  (b = 3 !== a.tag) && !(b = 5 !== a.tag) && (b = a.type, b = "head" !== b && "body" !== b && !Ef(a.type, a.memoizedProps));
  if (b && (b = yg)) {
    if (Dg(a)) throw Hg(), Error(p(418));
    for (; b; ) Ag(a, b), b = Lf(b.nextSibling);
  }
  Fg(a);
  if (13 === a.tag) {
    a = a.memoizedState;
    a = null !== a ? a.dehydrated : null;
    if (!a) throw Error(p(317));
    a: {
      a = a.nextSibling;
      for (b = 0; a; ) {
        if (8 === a.nodeType) {
          var c = a.data;
          if ("/$" === c) {
            if (0 === b) {
              yg = Lf(a.nextSibling);
              break a;
            }
            b--;
          } else "$" !== c && "$!" !== c && "$?" !== c || b++;
        }
        a = a.nextSibling;
      }
      yg = null;
    }
  } else yg = xg ? Lf(a.stateNode.nextSibling) : null;
  return true;
}
function Hg() {
  for (var a = yg; a; ) a = Lf(a.nextSibling);
}
function Ig() {
  yg = xg = null;
  I = false;
}
function Jg(a) {
  null === zg ? zg = [a] : zg.push(a);
}
var Kg = ua.ReactCurrentBatchConfig;
function Lg(a, b, c) {
  a = c.ref;
  if (null !== a && "function" !== typeof a && "object" !== typeof a) {
    if (c._owner) {
      c = c._owner;
      if (c) {
        if (1 !== c.tag) throw Error(p(309));
        var d = c.stateNode;
      }
      if (!d) throw Error(p(147, a));
      var e = d, f2 = "" + a;
      if (null !== b && null !== b.ref && "function" === typeof b.ref && b.ref._stringRef === f2) return b.ref;
      b = function(a2) {
        var b2 = e.refs;
        null === a2 ? delete b2[f2] : b2[f2] = a2;
      };
      b._stringRef = f2;
      return b;
    }
    if ("string" !== typeof a) throw Error(p(284));
    if (!c._owner) throw Error(p(290, a));
  }
  return a;
}
function Mg(a, b) {
  a = Object.prototype.toString.call(b);
  throw Error(p(31, "[object Object]" === a ? "object with keys {" + Object.keys(b).join(", ") + "}" : a));
}
function Ng(a) {
  var b = a._init;
  return b(a._payload);
}
function Og(a) {
  function b(b2, c2) {
    if (a) {
      var d2 = b2.deletions;
      null === d2 ? (b2.deletions = [c2], b2.flags |= 16) : d2.push(c2);
    }
  }
  function c(c2, d2) {
    if (!a) return null;
    for (; null !== d2; ) b(c2, d2), d2 = d2.sibling;
    return null;
  }
  function d(a2, b2) {
    for (a2 = /* @__PURE__ */ new Map(); null !== b2; ) null !== b2.key ? a2.set(b2.key, b2) : a2.set(b2.index, b2), b2 = b2.sibling;
    return a2;
  }
  function e(a2, b2) {
    a2 = Pg(a2, b2);
    a2.index = 0;
    a2.sibling = null;
    return a2;
  }
  function f2(b2, c2, d2) {
    b2.index = d2;
    if (!a) return b2.flags |= 1048576, c2;
    d2 = b2.alternate;
    if (null !== d2) return d2 = d2.index, d2 < c2 ? (b2.flags |= 2, c2) : d2;
    b2.flags |= 2;
    return c2;
  }
  function g(b2) {
    a && null === b2.alternate && (b2.flags |= 2);
    return b2;
  }
  function h(a2, b2, c2, d2) {
    if (null === b2 || 6 !== b2.tag) return b2 = Qg(c2, a2.mode, d2), b2.return = a2, b2;
    b2 = e(b2, c2);
    b2.return = a2;
    return b2;
  }
  function k2(a2, b2, c2, d2) {
    var f3 = c2.type;
    if (f3 === ya) return m2(a2, b2, c2.props.children, d2, c2.key);
    if (null !== b2 && (b2.elementType === f3 || "object" === typeof f3 && null !== f3 && f3.$$typeof === Ha && Ng(f3) === b2.type)) return d2 = e(b2, c2.props), d2.ref = Lg(a2, b2, c2), d2.return = a2, d2;
    d2 = Rg(c2.type, c2.key, c2.props, null, a2.mode, d2);
    d2.ref = Lg(a2, b2, c2);
    d2.return = a2;
    return d2;
  }
  function l2(a2, b2, c2, d2) {
    if (null === b2 || 4 !== b2.tag || b2.stateNode.containerInfo !== c2.containerInfo || b2.stateNode.implementation !== c2.implementation) return b2 = Sg(c2, a2.mode, d2), b2.return = a2, b2;
    b2 = e(b2, c2.children || []);
    b2.return = a2;
    return b2;
  }
  function m2(a2, b2, c2, d2, f3) {
    if (null === b2 || 7 !== b2.tag) return b2 = Tg(c2, a2.mode, d2, f3), b2.return = a2, b2;
    b2 = e(b2, c2);
    b2.return = a2;
    return b2;
  }
  function q2(a2, b2, c2) {
    if ("string" === typeof b2 && "" !== b2 || "number" === typeof b2) return b2 = Qg("" + b2, a2.mode, c2), b2.return = a2, b2;
    if ("object" === typeof b2 && null !== b2) {
      switch (b2.$$typeof) {
        case va:
          return c2 = Rg(b2.type, b2.key, b2.props, null, a2.mode, c2), c2.ref = Lg(a2, null, b2), c2.return = a2, c2;
        case wa:
          return b2 = Sg(b2, a2.mode, c2), b2.return = a2, b2;
        case Ha:
          var d2 = b2._init;
          return q2(a2, d2(b2._payload), c2);
      }
      if (eb(b2) || Ka(b2)) return b2 = Tg(b2, a2.mode, c2, null), b2.return = a2, b2;
      Mg(a2, b2);
    }
    return null;
  }
  function r2(a2, b2, c2, d2) {
    var e2 = null !== b2 ? b2.key : null;
    if ("string" === typeof c2 && "" !== c2 || "number" === typeof c2) return null !== e2 ? null : h(a2, b2, "" + c2, d2);
    if ("object" === typeof c2 && null !== c2) {
      switch (c2.$$typeof) {
        case va:
          return c2.key === e2 ? k2(a2, b2, c2, d2) : null;
        case wa:
          return c2.key === e2 ? l2(a2, b2, c2, d2) : null;
        case Ha:
          return e2 = c2._init, r2(
            a2,
            b2,
            e2(c2._payload),
            d2
          );
      }
      if (eb(c2) || Ka(c2)) return null !== e2 ? null : m2(a2, b2, c2, d2, null);
      Mg(a2, c2);
    }
    return null;
  }
  function y2(a2, b2, c2, d2, e2) {
    if ("string" === typeof d2 && "" !== d2 || "number" === typeof d2) return a2 = a2.get(c2) || null, h(b2, a2, "" + d2, e2);
    if ("object" === typeof d2 && null !== d2) {
      switch (d2.$$typeof) {
        case va:
          return a2 = a2.get(null === d2.key ? c2 : d2.key) || null, k2(b2, a2, d2, e2);
        case wa:
          return a2 = a2.get(null === d2.key ? c2 : d2.key) || null, l2(b2, a2, d2, e2);
        case Ha:
          var f3 = d2._init;
          return y2(a2, b2, c2, f3(d2._payload), e2);
      }
      if (eb(d2) || Ka(d2)) return a2 = a2.get(c2) || null, m2(b2, a2, d2, e2, null);
      Mg(b2, d2);
    }
    return null;
  }
  function n2(e2, g2, h2, k3) {
    for (var l3 = null, m3 = null, u2 = g2, w2 = g2 = 0, x2 = null; null !== u2 && w2 < h2.length; w2++) {
      u2.index > w2 ? (x2 = u2, u2 = null) : x2 = u2.sibling;
      var n3 = r2(e2, u2, h2[w2], k3);
      if (null === n3) {
        null === u2 && (u2 = x2);
        break;
      }
      a && u2 && null === n3.alternate && b(e2, u2);
      g2 = f2(n3, g2, w2);
      null === m3 ? l3 = n3 : m3.sibling = n3;
      m3 = n3;
      u2 = x2;
    }
    if (w2 === h2.length) return c(e2, u2), I && tg(e2, w2), l3;
    if (null === u2) {
      for (; w2 < h2.length; w2++) u2 = q2(e2, h2[w2], k3), null !== u2 && (g2 = f2(u2, g2, w2), null === m3 ? l3 = u2 : m3.sibling = u2, m3 = u2);
      I && tg(e2, w2);
      return l3;
    }
    for (u2 = d(e2, u2); w2 < h2.length; w2++) x2 = y2(u2, e2, w2, h2[w2], k3), null !== x2 && (a && null !== x2.alternate && u2.delete(null === x2.key ? w2 : x2.key), g2 = f2(x2, g2, w2), null === m3 ? l3 = x2 : m3.sibling = x2, m3 = x2);
    a && u2.forEach(function(a2) {
      return b(e2, a2);
    });
    I && tg(e2, w2);
    return l3;
  }
  function t2(e2, g2, h2, k3) {
    var l3 = Ka(h2);
    if ("function" !== typeof l3) throw Error(p(150));
    h2 = l3.call(h2);
    if (null == h2) throw Error(p(151));
    for (var u2 = l3 = null, m3 = g2, w2 = g2 = 0, x2 = null, n3 = h2.next(); null !== m3 && !n3.done; w2++, n3 = h2.next()) {
      m3.index > w2 ? (x2 = m3, m3 = null) : x2 = m3.sibling;
      var t3 = r2(e2, m3, n3.value, k3);
      if (null === t3) {
        null === m3 && (m3 = x2);
        break;
      }
      a && m3 && null === t3.alternate && b(e2, m3);
      g2 = f2(t3, g2, w2);
      null === u2 ? l3 = t3 : u2.sibling = t3;
      u2 = t3;
      m3 = x2;
    }
    if (n3.done) return c(
      e2,
      m3
    ), I && tg(e2, w2), l3;
    if (null === m3) {
      for (; !n3.done; w2++, n3 = h2.next()) n3 = q2(e2, n3.value, k3), null !== n3 && (g2 = f2(n3, g2, w2), null === u2 ? l3 = n3 : u2.sibling = n3, u2 = n3);
      I && tg(e2, w2);
      return l3;
    }
    for (m3 = d(e2, m3); !n3.done; w2++, n3 = h2.next()) n3 = y2(m3, e2, w2, n3.value, k3), null !== n3 && (a && null !== n3.alternate && m3.delete(null === n3.key ? w2 : n3.key), g2 = f2(n3, g2, w2), null === u2 ? l3 = n3 : u2.sibling = n3, u2 = n3);
    a && m3.forEach(function(a2) {
      return b(e2, a2);
    });
    I && tg(e2, w2);
    return l3;
  }
  function J2(a2, d2, f3, h2) {
    "object" === typeof f3 && null !== f3 && f3.type === ya && null === f3.key && (f3 = f3.props.children);
    if ("object" === typeof f3 && null !== f3) {
      switch (f3.$$typeof) {
        case va:
          a: {
            for (var k3 = f3.key, l3 = d2; null !== l3; ) {
              if (l3.key === k3) {
                k3 = f3.type;
                if (k3 === ya) {
                  if (7 === l3.tag) {
                    c(a2, l3.sibling);
                    d2 = e(l3, f3.props.children);
                    d2.return = a2;
                    a2 = d2;
                    break a;
                  }
                } else if (l3.elementType === k3 || "object" === typeof k3 && null !== k3 && k3.$$typeof === Ha && Ng(k3) === l3.type) {
                  c(a2, l3.sibling);
                  d2 = e(l3, f3.props);
                  d2.ref = Lg(a2, l3, f3);
                  d2.return = a2;
                  a2 = d2;
                  break a;
                }
                c(a2, l3);
                break;
              } else b(a2, l3);
              l3 = l3.sibling;
            }
            f3.type === ya ? (d2 = Tg(f3.props.children, a2.mode, h2, f3.key), d2.return = a2, a2 = d2) : (h2 = Rg(f3.type, f3.key, f3.props, null, a2.mode, h2), h2.ref = Lg(a2, d2, f3), h2.return = a2, a2 = h2);
          }
          return g(a2);
        case wa:
          a: {
            for (l3 = f3.key; null !== d2; ) {
              if (d2.key === l3) if (4 === d2.tag && d2.stateNode.containerInfo === f3.containerInfo && d2.stateNode.implementation === f3.implementation) {
                c(a2, d2.sibling);
                d2 = e(d2, f3.children || []);
                d2.return = a2;
                a2 = d2;
                break a;
              } else {
                c(a2, d2);
                break;
              }
              else b(a2, d2);
              d2 = d2.sibling;
            }
            d2 = Sg(f3, a2.mode, h2);
            d2.return = a2;
            a2 = d2;
          }
          return g(a2);
        case Ha:
          return l3 = f3._init, J2(a2, d2, l3(f3._payload), h2);
      }
      if (eb(f3)) return n2(a2, d2, f3, h2);
      if (Ka(f3)) return t2(a2, d2, f3, h2);
      Mg(a2, f3);
    }
    return "string" === typeof f3 && "" !== f3 || "number" === typeof f3 ? (f3 = "" + f3, null !== d2 && 6 === d2.tag ? (c(a2, d2.sibling), d2 = e(d2, f3), d2.return = a2, a2 = d2) : (c(a2, d2), d2 = Qg(f3, a2.mode, h2), d2.return = a2, a2 = d2), g(a2)) : c(a2, d2);
  }
  return J2;
}
var Ug = Og(true), Vg = Og(false), Wg = Uf(null), Xg = null, Yg = null, Zg = null;
function $g() {
  Zg = Yg = Xg = null;
}
function ah(a) {
  var b = Wg.current;
  E(Wg);
  a._currentValue = b;
}
function bh(a, b, c) {
  for (; null !== a; ) {
    var d = a.alternate;
    (a.childLanes & b) !== b ? (a.childLanes |= b, null !== d && (d.childLanes |= b)) : null !== d && (d.childLanes & b) !== b && (d.childLanes |= b);
    if (a === c) break;
    a = a.return;
  }
}
function ch(a, b) {
  Xg = a;
  Zg = Yg = null;
  a = a.dependencies;
  null !== a && null !== a.firstContext && (0 !== (a.lanes & b) && (dh = true), a.firstContext = null);
}
function eh(a) {
  var b = a._currentValue;
  if (Zg !== a) if (a = { context: a, memoizedValue: b, next: null }, null === Yg) {
    if (null === Xg) throw Error(p(308));
    Yg = a;
    Xg.dependencies = { lanes: 0, firstContext: a };
  } else Yg = Yg.next = a;
  return b;
}
var fh = null;
function gh(a) {
  null === fh ? fh = [a] : fh.push(a);
}
function hh(a, b, c, d) {
  var e = b.interleaved;
  null === e ? (c.next = c, gh(b)) : (c.next = e.next, e.next = c);
  b.interleaved = c;
  return ih(a, d);
}
function ih(a, b) {
  a.lanes |= b;
  var c = a.alternate;
  null !== c && (c.lanes |= b);
  c = a;
  for (a = a.return; null !== a; ) a.childLanes |= b, c = a.alternate, null !== c && (c.childLanes |= b), c = a, a = a.return;
  return 3 === c.tag ? c.stateNode : null;
}
var jh = false;
function kh(a) {
  a.updateQueue = { baseState: a.memoizedState, firstBaseUpdate: null, lastBaseUpdate: null, shared: { pending: null, interleaved: null, lanes: 0 }, effects: null };
}
function lh(a, b) {
  a = a.updateQueue;
  b.updateQueue === a && (b.updateQueue = { baseState: a.baseState, firstBaseUpdate: a.firstBaseUpdate, lastBaseUpdate: a.lastBaseUpdate, shared: a.shared, effects: a.effects });
}
function mh(a, b) {
  return { eventTime: a, lane: b, tag: 0, payload: null, callback: null, next: null };
}
function nh(a, b, c) {
  var d = a.updateQueue;
  if (null === d) return null;
  d = d.shared;
  if (0 !== (K & 2)) {
    var e = d.pending;
    null === e ? b.next = b : (b.next = e.next, e.next = b);
    d.pending = b;
    return ih(a, c);
  }
  e = d.interleaved;
  null === e ? (b.next = b, gh(d)) : (b.next = e.next, e.next = b);
  d.interleaved = b;
  return ih(a, c);
}
function oh(a, b, c) {
  b = b.updateQueue;
  if (null !== b && (b = b.shared, 0 !== (c & 4194240))) {
    var d = b.lanes;
    d &= a.pendingLanes;
    c |= d;
    b.lanes = c;
    Cc(a, c);
  }
}
function ph(a, b) {
  var c = a.updateQueue, d = a.alternate;
  if (null !== d && (d = d.updateQueue, c === d)) {
    var e = null, f2 = null;
    c = c.firstBaseUpdate;
    if (null !== c) {
      do {
        var g = { eventTime: c.eventTime, lane: c.lane, tag: c.tag, payload: c.payload, callback: c.callback, next: null };
        null === f2 ? e = f2 = g : f2 = f2.next = g;
        c = c.next;
      } while (null !== c);
      null === f2 ? e = f2 = b : f2 = f2.next = b;
    } else e = f2 = b;
    c = { baseState: d.baseState, firstBaseUpdate: e, lastBaseUpdate: f2, shared: d.shared, effects: d.effects };
    a.updateQueue = c;
    return;
  }
  a = c.lastBaseUpdate;
  null === a ? c.firstBaseUpdate = b : a.next = b;
  c.lastBaseUpdate = b;
}
function qh(a, b, c, d) {
  var e = a.updateQueue;
  jh = false;
  var f2 = e.firstBaseUpdate, g = e.lastBaseUpdate, h = e.shared.pending;
  if (null !== h) {
    e.shared.pending = null;
    var k2 = h, l2 = k2.next;
    k2.next = null;
    null === g ? f2 = l2 : g.next = l2;
    g = k2;
    var m2 = a.alternate;
    null !== m2 && (m2 = m2.updateQueue, h = m2.lastBaseUpdate, h !== g && (null === h ? m2.firstBaseUpdate = l2 : h.next = l2, m2.lastBaseUpdate = k2));
  }
  if (null !== f2) {
    var q2 = e.baseState;
    g = 0;
    m2 = l2 = k2 = null;
    h = f2;
    do {
      var r2 = h.lane, y2 = h.eventTime;
      if ((d & r2) === r2) {
        null !== m2 && (m2 = m2.next = {
          eventTime: y2,
          lane: 0,
          tag: h.tag,
          payload: h.payload,
          callback: h.callback,
          next: null
        });
        a: {
          var n2 = a, t2 = h;
          r2 = b;
          y2 = c;
          switch (t2.tag) {
            case 1:
              n2 = t2.payload;
              if ("function" === typeof n2) {
                q2 = n2.call(y2, q2, r2);
                break a;
              }
              q2 = n2;
              break a;
            case 3:
              n2.flags = n2.flags & -65537 | 128;
            case 0:
              n2 = t2.payload;
              r2 = "function" === typeof n2 ? n2.call(y2, q2, r2) : n2;
              if (null === r2 || void 0 === r2) break a;
              q2 = A({}, q2, r2);
              break a;
            case 2:
              jh = true;
          }
        }
        null !== h.callback && 0 !== h.lane && (a.flags |= 64, r2 = e.effects, null === r2 ? e.effects = [h] : r2.push(h));
      } else y2 = { eventTime: y2, lane: r2, tag: h.tag, payload: h.payload, callback: h.callback, next: null }, null === m2 ? (l2 = m2 = y2, k2 = q2) : m2 = m2.next = y2, g |= r2;
      h = h.next;
      if (null === h) if (h = e.shared.pending, null === h) break;
      else r2 = h, h = r2.next, r2.next = null, e.lastBaseUpdate = r2, e.shared.pending = null;
    } while (1);
    null === m2 && (k2 = q2);
    e.baseState = k2;
    e.firstBaseUpdate = l2;
    e.lastBaseUpdate = m2;
    b = e.shared.interleaved;
    if (null !== b) {
      e = b;
      do
        g |= e.lane, e = e.next;
      while (e !== b);
    } else null === f2 && (e.shared.lanes = 0);
    rh |= g;
    a.lanes = g;
    a.memoizedState = q2;
  }
}
function sh(a, b, c) {
  a = b.effects;
  b.effects = null;
  if (null !== a) for (b = 0; b < a.length; b++) {
    var d = a[b], e = d.callback;
    if (null !== e) {
      d.callback = null;
      d = c;
      if ("function" !== typeof e) throw Error(p(191, e));
      e.call(d);
    }
  }
}
var th = {}, uh = Uf(th), vh = Uf(th), wh = Uf(th);
function xh(a) {
  if (a === th) throw Error(p(174));
  return a;
}
function yh(a, b) {
  G$1(wh, b);
  G$1(vh, a);
  G$1(uh, th);
  a = b.nodeType;
  switch (a) {
    case 9:
    case 11:
      b = (b = b.documentElement) ? b.namespaceURI : lb(null, "");
      break;
    default:
      a = 8 === a ? b.parentNode : b, b = a.namespaceURI || null, a = a.tagName, b = lb(b, a);
  }
  E(uh);
  G$1(uh, b);
}
function zh() {
  E(uh);
  E(vh);
  E(wh);
}
function Ah(a) {
  xh(wh.current);
  var b = xh(uh.current);
  var c = lb(b, a.type);
  b !== c && (G$1(vh, a), G$1(uh, c));
}
function Bh(a) {
  vh.current === a && (E(uh), E(vh));
}
var L = Uf(0);
function Ch(a) {
  for (var b = a; null !== b; ) {
    if (13 === b.tag) {
      var c = b.memoizedState;
      if (null !== c && (c = c.dehydrated, null === c || "$?" === c.data || "$!" === c.data)) return b;
    } else if (19 === b.tag && void 0 !== b.memoizedProps.revealOrder) {
      if (0 !== (b.flags & 128)) return b;
    } else if (null !== b.child) {
      b.child.return = b;
      b = b.child;
      continue;
    }
    if (b === a) break;
    for (; null === b.sibling; ) {
      if (null === b.return || b.return === a) return null;
      b = b.return;
    }
    b.sibling.return = b.return;
    b = b.sibling;
  }
  return null;
}
var Dh = [];
function Eh() {
  for (var a = 0; a < Dh.length; a++) Dh[a]._workInProgressVersionPrimary = null;
  Dh.length = 0;
}
var Fh = ua.ReactCurrentDispatcher, Gh = ua.ReactCurrentBatchConfig, Hh = 0, M = null, N = null, O = null, Ih = false, Jh = false, Kh = 0, Lh = 0;
function P() {
  throw Error(p(321));
}
function Mh(a, b) {
  if (null === b) return false;
  for (var c = 0; c < b.length && c < a.length; c++) if (!He(a[c], b[c])) return false;
  return true;
}
function Nh(a, b, c, d, e, f2) {
  Hh = f2;
  M = b;
  b.memoizedState = null;
  b.updateQueue = null;
  b.lanes = 0;
  Fh.current = null === a || null === a.memoizedState ? Oh : Ph;
  a = c(d, e);
  if (Jh) {
    f2 = 0;
    do {
      Jh = false;
      Kh = 0;
      if (25 <= f2) throw Error(p(301));
      f2 += 1;
      O = N = null;
      b.updateQueue = null;
      Fh.current = Qh;
      a = c(d, e);
    } while (Jh);
  }
  Fh.current = Rh;
  b = null !== N && null !== N.next;
  Hh = 0;
  O = N = M = null;
  Ih = false;
  if (b) throw Error(p(300));
  return a;
}
function Sh() {
  var a = 0 !== Kh;
  Kh = 0;
  return a;
}
function Th() {
  var a = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
  null === O ? M.memoizedState = O = a : O = O.next = a;
  return O;
}
function Uh() {
  if (null === N) {
    var a = M.alternate;
    a = null !== a ? a.memoizedState : null;
  } else a = N.next;
  var b = null === O ? M.memoizedState : O.next;
  if (null !== b) O = b, N = a;
  else {
    if (null === a) throw Error(p(310));
    N = a;
    a = { memoizedState: N.memoizedState, baseState: N.baseState, baseQueue: N.baseQueue, queue: N.queue, next: null };
    null === O ? M.memoizedState = O = a : O = O.next = a;
  }
  return O;
}
function Vh(a, b) {
  return "function" === typeof b ? b(a) : b;
}
function Wh(a) {
  var b = Uh(), c = b.queue;
  if (null === c) throw Error(p(311));
  c.lastRenderedReducer = a;
  var d = N, e = d.baseQueue, f2 = c.pending;
  if (null !== f2) {
    if (null !== e) {
      var g = e.next;
      e.next = f2.next;
      f2.next = g;
    }
    d.baseQueue = e = f2;
    c.pending = null;
  }
  if (null !== e) {
    f2 = e.next;
    d = d.baseState;
    var h = g = null, k2 = null, l2 = f2;
    do {
      var m2 = l2.lane;
      if ((Hh & m2) === m2) null !== k2 && (k2 = k2.next = { lane: 0, action: l2.action, hasEagerState: l2.hasEagerState, eagerState: l2.eagerState, next: null }), d = l2.hasEagerState ? l2.eagerState : a(d, l2.action);
      else {
        var q2 = {
          lane: m2,
          action: l2.action,
          hasEagerState: l2.hasEagerState,
          eagerState: l2.eagerState,
          next: null
        };
        null === k2 ? (h = k2 = q2, g = d) : k2 = k2.next = q2;
        M.lanes |= m2;
        rh |= m2;
      }
      l2 = l2.next;
    } while (null !== l2 && l2 !== f2);
    null === k2 ? g = d : k2.next = h;
    He(d, b.memoizedState) || (dh = true);
    b.memoizedState = d;
    b.baseState = g;
    b.baseQueue = k2;
    c.lastRenderedState = d;
  }
  a = c.interleaved;
  if (null !== a) {
    e = a;
    do
      f2 = e.lane, M.lanes |= f2, rh |= f2, e = e.next;
    while (e !== a);
  } else null === e && (c.lanes = 0);
  return [b.memoizedState, c.dispatch];
}
function Xh(a) {
  var b = Uh(), c = b.queue;
  if (null === c) throw Error(p(311));
  c.lastRenderedReducer = a;
  var d = c.dispatch, e = c.pending, f2 = b.memoizedState;
  if (null !== e) {
    c.pending = null;
    var g = e = e.next;
    do
      f2 = a(f2, g.action), g = g.next;
    while (g !== e);
    He(f2, b.memoizedState) || (dh = true);
    b.memoizedState = f2;
    null === b.baseQueue && (b.baseState = f2);
    c.lastRenderedState = f2;
  }
  return [f2, d];
}
function Yh() {
}
function Zh(a, b) {
  var c = M, d = Uh(), e = b(), f2 = !He(d.memoizedState, e);
  f2 && (d.memoizedState = e, dh = true);
  d = d.queue;
  $h(ai$1.bind(null, c, d, a), [a]);
  if (d.getSnapshot !== b || f2 || null !== O && O.memoizedState.tag & 1) {
    c.flags |= 2048;
    bi(9, ci.bind(null, c, d, e, b), void 0, null);
    if (null === Q) throw Error(p(349));
    0 !== (Hh & 30) || di(c, b, e);
  }
  return e;
}
function di(a, b, c) {
  a.flags |= 16384;
  a = { getSnapshot: b, value: c };
  b = M.updateQueue;
  null === b ? (b = { lastEffect: null, stores: null }, M.updateQueue = b, b.stores = [a]) : (c = b.stores, null === c ? b.stores = [a] : c.push(a));
}
function ci(a, b, c, d) {
  b.value = c;
  b.getSnapshot = d;
  ei(b) && fi(a);
}
function ai$1(a, b, c) {
  return c(function() {
    ei(b) && fi(a);
  });
}
function ei(a) {
  var b = a.getSnapshot;
  a = a.value;
  try {
    var c = b();
    return !He(a, c);
  } catch (d) {
    return true;
  }
}
function fi(a) {
  var b = ih(a, 1);
  null !== b && gi(b, a, 1, -1);
}
function hi(a) {
  var b = Th();
  "function" === typeof a && (a = a());
  b.memoizedState = b.baseState = a;
  a = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: Vh, lastRenderedState: a };
  b.queue = a;
  a = a.dispatch = ii.bind(null, M, a);
  return [b.memoizedState, a];
}
function bi(a, b, c, d) {
  a = { tag: a, create: b, destroy: c, deps: d, next: null };
  b = M.updateQueue;
  null === b ? (b = { lastEffect: null, stores: null }, M.updateQueue = b, b.lastEffect = a.next = a) : (c = b.lastEffect, null === c ? b.lastEffect = a.next = a : (d = c.next, c.next = a, a.next = d, b.lastEffect = a));
  return a;
}
function ji() {
  return Uh().memoizedState;
}
function ki(a, b, c, d) {
  var e = Th();
  M.flags |= a;
  e.memoizedState = bi(1 | b, c, void 0, void 0 === d ? null : d);
}
function li(a, b, c, d) {
  var e = Uh();
  d = void 0 === d ? null : d;
  var f2 = void 0;
  if (null !== N) {
    var g = N.memoizedState;
    f2 = g.destroy;
    if (null !== d && Mh(d, g.deps)) {
      e.memoizedState = bi(b, c, f2, d);
      return;
    }
  }
  M.flags |= a;
  e.memoizedState = bi(1 | b, c, f2, d);
}
function mi(a, b) {
  return ki(8390656, 8, a, b);
}
function $h(a, b) {
  return li(2048, 8, a, b);
}
function ni(a, b) {
  return li(4, 2, a, b);
}
function oi(a, b) {
  return li(4, 4, a, b);
}
function pi(a, b) {
  if ("function" === typeof b) return a = a(), b(a), function() {
    b(null);
  };
  if (null !== b && void 0 !== b) return a = a(), b.current = a, function() {
    b.current = null;
  };
}
function qi(a, b, c) {
  c = null !== c && void 0 !== c ? c.concat([a]) : null;
  return li(4, 4, pi.bind(null, b, a), c);
}
function ri() {
}
function si(a, b) {
  var c = Uh();
  b = void 0 === b ? null : b;
  var d = c.memoizedState;
  if (null !== d && null !== b && Mh(b, d[1])) return d[0];
  c.memoizedState = [a, b];
  return a;
}
function ti(a, b) {
  var c = Uh();
  b = void 0 === b ? null : b;
  var d = c.memoizedState;
  if (null !== d && null !== b && Mh(b, d[1])) return d[0];
  a = a();
  c.memoizedState = [a, b];
  return a;
}
function ui(a, b, c) {
  if (0 === (Hh & 21)) return a.baseState && (a.baseState = false, dh = true), a.memoizedState = c;
  He(c, b) || (c = yc(), M.lanes |= c, rh |= c, a.baseState = true);
  return b;
}
function vi(a, b) {
  var c = C;
  C = 0 !== c && 4 > c ? c : 4;
  a(true);
  var d = Gh.transition;
  Gh.transition = {};
  try {
    a(false), b();
  } finally {
    C = c, Gh.transition = d;
  }
}
function wi() {
  return Uh().memoizedState;
}
function xi(a, b, c) {
  var d = yi(a);
  c = { lane: d, action: c, hasEagerState: false, eagerState: null, next: null };
  if (zi(a)) Ai(b, c);
  else if (c = hh(a, b, c, d), null !== c) {
    var e = R();
    gi(c, a, d, e);
    Bi(c, b, d);
  }
}
function ii(a, b, c) {
  var d = yi(a), e = { lane: d, action: c, hasEagerState: false, eagerState: null, next: null };
  if (zi(a)) Ai(b, e);
  else {
    var f2 = a.alternate;
    if (0 === a.lanes && (null === f2 || 0 === f2.lanes) && (f2 = b.lastRenderedReducer, null !== f2)) try {
      var g = b.lastRenderedState, h = f2(g, c);
      e.hasEagerState = true;
      e.eagerState = h;
      if (He(h, g)) {
        var k2 = b.interleaved;
        null === k2 ? (e.next = e, gh(b)) : (e.next = k2.next, k2.next = e);
        b.interleaved = e;
        return;
      }
    } catch (l2) {
    } finally {
    }
    c = hh(a, b, e, d);
    null !== c && (e = R(), gi(c, a, d, e), Bi(c, b, d));
  }
}
function zi(a) {
  var b = a.alternate;
  return a === M || null !== b && b === M;
}
function Ai(a, b) {
  Jh = Ih = true;
  var c = a.pending;
  null === c ? b.next = b : (b.next = c.next, c.next = b);
  a.pending = b;
}
function Bi(a, b, c) {
  if (0 !== (c & 4194240)) {
    var d = b.lanes;
    d &= a.pendingLanes;
    c |= d;
    b.lanes = c;
    Cc(a, c);
  }
}
var Rh = { readContext: eh, useCallback: P, useContext: P, useEffect: P, useImperativeHandle: P, useInsertionEffect: P, useLayoutEffect: P, useMemo: P, useReducer: P, useRef: P, useState: P, useDebugValue: P, useDeferredValue: P, useTransition: P, useMutableSource: P, useSyncExternalStore: P, useId: P, unstable_isNewReconciler: false }, Oh = { readContext: eh, useCallback: function(a, b) {
  Th().memoizedState = [a, void 0 === b ? null : b];
  return a;
}, useContext: eh, useEffect: mi, useImperativeHandle: function(a, b, c) {
  c = null !== c && void 0 !== c ? c.concat([a]) : null;
  return ki(
    4194308,
    4,
    pi.bind(null, b, a),
    c
  );
}, useLayoutEffect: function(a, b) {
  return ki(4194308, 4, a, b);
}, useInsertionEffect: function(a, b) {
  return ki(4, 2, a, b);
}, useMemo: function(a, b) {
  var c = Th();
  b = void 0 === b ? null : b;
  a = a();
  c.memoizedState = [a, b];
  return a;
}, useReducer: function(a, b, c) {
  var d = Th();
  b = void 0 !== c ? c(b) : b;
  d.memoizedState = d.baseState = b;
  a = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: a, lastRenderedState: b };
  d.queue = a;
  a = a.dispatch = xi.bind(null, M, a);
  return [d.memoizedState, a];
}, useRef: function(a) {
  var b = Th();
  a = { current: a };
  return b.memoizedState = a;
}, useState: hi, useDebugValue: ri, useDeferredValue: function(a) {
  return Th().memoizedState = a;
}, useTransition: function() {
  var a = hi(false), b = a[0];
  a = vi.bind(null, a[1]);
  Th().memoizedState = a;
  return [b, a];
}, useMutableSource: function() {
}, useSyncExternalStore: function(a, b, c) {
  var d = M, e = Th();
  if (I) {
    if (void 0 === c) throw Error(p(407));
    c = c();
  } else {
    c = b();
    if (null === Q) throw Error(p(349));
    0 !== (Hh & 30) || di(d, b, c);
  }
  e.memoizedState = c;
  var f2 = { value: c, getSnapshot: b };
  e.queue = f2;
  mi(ai$1.bind(
    null,
    d,
    f2,
    a
  ), [a]);
  d.flags |= 2048;
  bi(9, ci.bind(null, d, f2, c, b), void 0, null);
  return c;
}, useId: function() {
  var a = Th(), b = Q.identifierPrefix;
  if (I) {
    var c = sg;
    var d = rg;
    c = (d & ~(1 << 32 - oc(d) - 1)).toString(32) + c;
    b = ":" + b + "R" + c;
    c = Kh++;
    0 < c && (b += "H" + c.toString(32));
    b += ":";
  } else c = Lh++, b = ":" + b + "r" + c.toString(32) + ":";
  return a.memoizedState = b;
}, unstable_isNewReconciler: false }, Ph = {
  readContext: eh,
  useCallback: si,
  useContext: eh,
  useEffect: $h,
  useImperativeHandle: qi,
  useInsertionEffect: ni,
  useLayoutEffect: oi,
  useMemo: ti,
  useReducer: Wh,
  useRef: ji,
  useState: function() {
    return Wh(Vh);
  },
  useDebugValue: ri,
  useDeferredValue: function(a) {
    var b = Uh();
    return ui(b, N.memoizedState, a);
  },
  useTransition: function() {
    var a = Wh(Vh)[0], b = Uh().memoizedState;
    return [a, b];
  },
  useMutableSource: Yh,
  useSyncExternalStore: Zh,
  useId: wi,
  unstable_isNewReconciler: false
}, Qh = { readContext: eh, useCallback: si, useContext: eh, useEffect: $h, useImperativeHandle: qi, useInsertionEffect: ni, useLayoutEffect: oi, useMemo: ti, useReducer: Xh, useRef: ji, useState: function() {
  return Xh(Vh);
}, useDebugValue: ri, useDeferredValue: function(a) {
  var b = Uh();
  return null === N ? b.memoizedState = a : ui(b, N.memoizedState, a);
}, useTransition: function() {
  var a = Xh(Vh)[0], b = Uh().memoizedState;
  return [a, b];
}, useMutableSource: Yh, useSyncExternalStore: Zh, useId: wi, unstable_isNewReconciler: false };
function Ci(a, b) {
  if (a && a.defaultProps) {
    b = A({}, b);
    a = a.defaultProps;
    for (var c in a) void 0 === b[c] && (b[c] = a[c]);
    return b;
  }
  return b;
}
function Di(a, b, c, d) {
  b = a.memoizedState;
  c = c(d, b);
  c = null === c || void 0 === c ? b : A({}, b, c);
  a.memoizedState = c;
  0 === a.lanes && (a.updateQueue.baseState = c);
}
var Ei = { isMounted: function(a) {
  return (a = a._reactInternals) ? Vb(a) === a : false;
}, enqueueSetState: function(a, b, c) {
  a = a._reactInternals;
  var d = R(), e = yi(a), f2 = mh(d, e);
  f2.payload = b;
  void 0 !== c && null !== c && (f2.callback = c);
  b = nh(a, f2, e);
  null !== b && (gi(b, a, e, d), oh(b, a, e));
}, enqueueReplaceState: function(a, b, c) {
  a = a._reactInternals;
  var d = R(), e = yi(a), f2 = mh(d, e);
  f2.tag = 1;
  f2.payload = b;
  void 0 !== c && null !== c && (f2.callback = c);
  b = nh(a, f2, e);
  null !== b && (gi(b, a, e, d), oh(b, a, e));
}, enqueueForceUpdate: function(a, b) {
  a = a._reactInternals;
  var c = R(), d = yi(a), e = mh(c, d);
  e.tag = 2;
  void 0 !== b && null !== b && (e.callback = b);
  b = nh(a, e, d);
  null !== b && (gi(b, a, d, c), oh(b, a, d));
} };
function Fi(a, b, c, d, e, f2, g) {
  a = a.stateNode;
  return "function" === typeof a.shouldComponentUpdate ? a.shouldComponentUpdate(d, f2, g) : b.prototype && b.prototype.isPureReactComponent ? !Ie(c, d) || !Ie(e, f2) : true;
}
function Gi(a, b, c) {
  var d = false, e = Vf;
  var f2 = b.contextType;
  "object" === typeof f2 && null !== f2 ? f2 = eh(f2) : (e = Zf(b) ? Xf : H.current, d = b.contextTypes, f2 = (d = null !== d && void 0 !== d) ? Yf(a, e) : Vf);
  b = new b(c, f2);
  a.memoizedState = null !== b.state && void 0 !== b.state ? b.state : null;
  b.updater = Ei;
  a.stateNode = b;
  b._reactInternals = a;
  d && (a = a.stateNode, a.__reactInternalMemoizedUnmaskedChildContext = e, a.__reactInternalMemoizedMaskedChildContext = f2);
  return b;
}
function Hi(a, b, c, d) {
  a = b.state;
  "function" === typeof b.componentWillReceiveProps && b.componentWillReceiveProps(c, d);
  "function" === typeof b.UNSAFE_componentWillReceiveProps && b.UNSAFE_componentWillReceiveProps(c, d);
  b.state !== a && Ei.enqueueReplaceState(b, b.state, null);
}
function Ii(a, b, c, d) {
  var e = a.stateNode;
  e.props = c;
  e.state = a.memoizedState;
  e.refs = {};
  kh(a);
  var f2 = b.contextType;
  "object" === typeof f2 && null !== f2 ? e.context = eh(f2) : (f2 = Zf(b) ? Xf : H.current, e.context = Yf(a, f2));
  e.state = a.memoizedState;
  f2 = b.getDerivedStateFromProps;
  "function" === typeof f2 && (Di(a, b, f2, c), e.state = a.memoizedState);
  "function" === typeof b.getDerivedStateFromProps || "function" === typeof e.getSnapshotBeforeUpdate || "function" !== typeof e.UNSAFE_componentWillMount && "function" !== typeof e.componentWillMount || (b = e.state, "function" === typeof e.componentWillMount && e.componentWillMount(), "function" === typeof e.UNSAFE_componentWillMount && e.UNSAFE_componentWillMount(), b !== e.state && Ei.enqueueReplaceState(e, e.state, null), qh(a, c, e, d), e.state = a.memoizedState);
  "function" === typeof e.componentDidMount && (a.flags |= 4194308);
}
function Ji(a, b) {
  try {
    var c = "", d = b;
    do
      c += Pa(d), d = d.return;
    while (d);
    var e = c;
  } catch (f2) {
    e = "\nError generating stack: " + f2.message + "\n" + f2.stack;
  }
  return { value: a, source: b, stack: e, digest: null };
}
function Ki(a, b, c) {
  return { value: a, source: null, stack: null != c ? c : null, digest: null != b ? b : null };
}
function Li(a, b) {
  try {
    console.error(b.value);
  } catch (c) {
    setTimeout(function() {
      throw c;
    });
  }
}
var Mi = "function" === typeof WeakMap ? WeakMap : Map;
function Ni(a, b, c) {
  c = mh(-1, c);
  c.tag = 3;
  c.payload = { element: null };
  var d = b.value;
  c.callback = function() {
    Oi || (Oi = true, Pi = d);
    Li(a, b);
  };
  return c;
}
function Qi(a, b, c) {
  c = mh(-1, c);
  c.tag = 3;
  var d = a.type.getDerivedStateFromError;
  if ("function" === typeof d) {
    var e = b.value;
    c.payload = function() {
      return d(e);
    };
    c.callback = function() {
      Li(a, b);
    };
  }
  var f2 = a.stateNode;
  null !== f2 && "function" === typeof f2.componentDidCatch && (c.callback = function() {
    Li(a, b);
    "function" !== typeof d && (null === Ri ? Ri = /* @__PURE__ */ new Set([this]) : Ri.add(this));
    var c2 = b.stack;
    this.componentDidCatch(b.value, { componentStack: null !== c2 ? c2 : "" });
  });
  return c;
}
function Si(a, b, c) {
  var d = a.pingCache;
  if (null === d) {
    d = a.pingCache = new Mi();
    var e = /* @__PURE__ */ new Set();
    d.set(b, e);
  } else e = d.get(b), void 0 === e && (e = /* @__PURE__ */ new Set(), d.set(b, e));
  e.has(c) || (e.add(c), a = Ti.bind(null, a, b, c), b.then(a, a));
}
function Ui(a) {
  do {
    var b;
    if (b = 13 === a.tag) b = a.memoizedState, b = null !== b ? null !== b.dehydrated ? true : false : true;
    if (b) return a;
    a = a.return;
  } while (null !== a);
  return null;
}
function Vi(a, b, c, d, e) {
  if (0 === (a.mode & 1)) return a === b ? a.flags |= 65536 : (a.flags |= 128, c.flags |= 131072, c.flags &= -52805, 1 === c.tag && (null === c.alternate ? c.tag = 17 : (b = mh(-1, 1), b.tag = 2, nh(c, b, 1))), c.lanes |= 1), a;
  a.flags |= 65536;
  a.lanes = e;
  return a;
}
var Wi = ua.ReactCurrentOwner, dh = false;
function Xi(a, b, c, d) {
  b.child = null === a ? Vg(b, null, c, d) : Ug(b, a.child, c, d);
}
function Yi(a, b, c, d, e) {
  c = c.render;
  var f2 = b.ref;
  ch(b, e);
  d = Nh(a, b, c, d, f2, e);
  c = Sh();
  if (null !== a && !dh) return b.updateQueue = a.updateQueue, b.flags &= -2053, a.lanes &= ~e, Zi(a, b, e);
  I && c && vg(b);
  b.flags |= 1;
  Xi(a, b, d, e);
  return b.child;
}
function $i(a, b, c, d, e) {
  if (null === a) {
    var f2 = c.type;
    if ("function" === typeof f2 && !aj(f2) && void 0 === f2.defaultProps && null === c.compare && void 0 === c.defaultProps) return b.tag = 15, b.type = f2, bj(a, b, f2, d, e);
    a = Rg(c.type, null, d, b, b.mode, e);
    a.ref = b.ref;
    a.return = b;
    return b.child = a;
  }
  f2 = a.child;
  if (0 === (a.lanes & e)) {
    var g = f2.memoizedProps;
    c = c.compare;
    c = null !== c ? c : Ie;
    if (c(g, d) && a.ref === b.ref) return Zi(a, b, e);
  }
  b.flags |= 1;
  a = Pg(f2, d);
  a.ref = b.ref;
  a.return = b;
  return b.child = a;
}
function bj(a, b, c, d, e) {
  if (null !== a) {
    var f2 = a.memoizedProps;
    if (Ie(f2, d) && a.ref === b.ref) if (dh = false, b.pendingProps = d = f2, 0 !== (a.lanes & e)) 0 !== (a.flags & 131072) && (dh = true);
    else return b.lanes = a.lanes, Zi(a, b, e);
  }
  return cj(a, b, c, d, e);
}
function dj(a, b, c) {
  var d = b.pendingProps, e = d.children, f2 = null !== a ? a.memoizedState : null;
  if ("hidden" === d.mode) if (0 === (b.mode & 1)) b.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }, G$1(ej, fj), fj |= c;
  else {
    if (0 === (c & 1073741824)) return a = null !== f2 ? f2.baseLanes | c : c, b.lanes = b.childLanes = 1073741824, b.memoizedState = { baseLanes: a, cachePool: null, transitions: null }, b.updateQueue = null, G$1(ej, fj), fj |= a, null;
    b.memoizedState = { baseLanes: 0, cachePool: null, transitions: null };
    d = null !== f2 ? f2.baseLanes : c;
    G$1(ej, fj);
    fj |= d;
  }
  else null !== f2 ? (d = f2.baseLanes | c, b.memoizedState = null) : d = c, G$1(ej, fj), fj |= d;
  Xi(a, b, e, c);
  return b.child;
}
function gj(a, b) {
  var c = b.ref;
  if (null === a && null !== c || null !== a && a.ref !== c) b.flags |= 512, b.flags |= 2097152;
}
function cj(a, b, c, d, e) {
  var f2 = Zf(c) ? Xf : H.current;
  f2 = Yf(b, f2);
  ch(b, e);
  c = Nh(a, b, c, d, f2, e);
  d = Sh();
  if (null !== a && !dh) return b.updateQueue = a.updateQueue, b.flags &= -2053, a.lanes &= ~e, Zi(a, b, e);
  I && d && vg(b);
  b.flags |= 1;
  Xi(a, b, c, e);
  return b.child;
}
function hj(a, b, c, d, e) {
  if (Zf(c)) {
    var f2 = true;
    cg(b);
  } else f2 = false;
  ch(b, e);
  if (null === b.stateNode) ij(a, b), Gi(b, c, d), Ii(b, c, d, e), d = true;
  else if (null === a) {
    var g = b.stateNode, h = b.memoizedProps;
    g.props = h;
    var k2 = g.context, l2 = c.contextType;
    "object" === typeof l2 && null !== l2 ? l2 = eh(l2) : (l2 = Zf(c) ? Xf : H.current, l2 = Yf(b, l2));
    var m2 = c.getDerivedStateFromProps, q2 = "function" === typeof m2 || "function" === typeof g.getSnapshotBeforeUpdate;
    q2 || "function" !== typeof g.UNSAFE_componentWillReceiveProps && "function" !== typeof g.componentWillReceiveProps || (h !== d || k2 !== l2) && Hi(b, g, d, l2);
    jh = false;
    var r2 = b.memoizedState;
    g.state = r2;
    qh(b, d, g, e);
    k2 = b.memoizedState;
    h !== d || r2 !== k2 || Wf.current || jh ? ("function" === typeof m2 && (Di(b, c, m2, d), k2 = b.memoizedState), (h = jh || Fi(b, c, h, d, r2, k2, l2)) ? (q2 || "function" !== typeof g.UNSAFE_componentWillMount && "function" !== typeof g.componentWillMount || ("function" === typeof g.componentWillMount && g.componentWillMount(), "function" === typeof g.UNSAFE_componentWillMount && g.UNSAFE_componentWillMount()), "function" === typeof g.componentDidMount && (b.flags |= 4194308)) : ("function" === typeof g.componentDidMount && (b.flags |= 4194308), b.memoizedProps = d, b.memoizedState = k2), g.props = d, g.state = k2, g.context = l2, d = h) : ("function" === typeof g.componentDidMount && (b.flags |= 4194308), d = false);
  } else {
    g = b.stateNode;
    lh(a, b);
    h = b.memoizedProps;
    l2 = b.type === b.elementType ? h : Ci(b.type, h);
    g.props = l2;
    q2 = b.pendingProps;
    r2 = g.context;
    k2 = c.contextType;
    "object" === typeof k2 && null !== k2 ? k2 = eh(k2) : (k2 = Zf(c) ? Xf : H.current, k2 = Yf(b, k2));
    var y2 = c.getDerivedStateFromProps;
    (m2 = "function" === typeof y2 || "function" === typeof g.getSnapshotBeforeUpdate) || "function" !== typeof g.UNSAFE_componentWillReceiveProps && "function" !== typeof g.componentWillReceiveProps || (h !== q2 || r2 !== k2) && Hi(b, g, d, k2);
    jh = false;
    r2 = b.memoizedState;
    g.state = r2;
    qh(b, d, g, e);
    var n2 = b.memoizedState;
    h !== q2 || r2 !== n2 || Wf.current || jh ? ("function" === typeof y2 && (Di(b, c, y2, d), n2 = b.memoizedState), (l2 = jh || Fi(b, c, l2, d, r2, n2, k2) || false) ? (m2 || "function" !== typeof g.UNSAFE_componentWillUpdate && "function" !== typeof g.componentWillUpdate || ("function" === typeof g.componentWillUpdate && g.componentWillUpdate(d, n2, k2), "function" === typeof g.UNSAFE_componentWillUpdate && g.UNSAFE_componentWillUpdate(d, n2, k2)), "function" === typeof g.componentDidUpdate && (b.flags |= 4), "function" === typeof g.getSnapshotBeforeUpdate && (b.flags |= 1024)) : ("function" !== typeof g.componentDidUpdate || h === a.memoizedProps && r2 === a.memoizedState || (b.flags |= 4), "function" !== typeof g.getSnapshotBeforeUpdate || h === a.memoizedProps && r2 === a.memoizedState || (b.flags |= 1024), b.memoizedProps = d, b.memoizedState = n2), g.props = d, g.state = n2, g.context = k2, d = l2) : ("function" !== typeof g.componentDidUpdate || h === a.memoizedProps && r2 === a.memoizedState || (b.flags |= 4), "function" !== typeof g.getSnapshotBeforeUpdate || h === a.memoizedProps && r2 === a.memoizedState || (b.flags |= 1024), d = false);
  }
  return jj(a, b, c, d, f2, e);
}
function jj(a, b, c, d, e, f2) {
  gj(a, b);
  var g = 0 !== (b.flags & 128);
  if (!d && !g) return e && dg(b, c, false), Zi(a, b, f2);
  d = b.stateNode;
  Wi.current = b;
  var h = g && "function" !== typeof c.getDerivedStateFromError ? null : d.render();
  b.flags |= 1;
  null !== a && g ? (b.child = Ug(b, a.child, null, f2), b.child = Ug(b, null, h, f2)) : Xi(a, b, h, f2);
  b.memoizedState = d.state;
  e && dg(b, c, true);
  return b.child;
}
function kj(a) {
  var b = a.stateNode;
  b.pendingContext ? ag(a, b.pendingContext, b.pendingContext !== b.context) : b.context && ag(a, b.context, false);
  yh(a, b.containerInfo);
}
function lj(a, b, c, d, e) {
  Ig();
  Jg(e);
  b.flags |= 256;
  Xi(a, b, c, d);
  return b.child;
}
var mj = { dehydrated: null, treeContext: null, retryLane: 0 };
function nj(a) {
  return { baseLanes: a, cachePool: null, transitions: null };
}
function oj(a, b, c) {
  var d = b.pendingProps, e = L.current, f2 = false, g = 0 !== (b.flags & 128), h;
  (h = g) || (h = null !== a && null === a.memoizedState ? false : 0 !== (e & 2));
  if (h) f2 = true, b.flags &= -129;
  else if (null === a || null !== a.memoizedState) e |= 1;
  G$1(L, e & 1);
  if (null === a) {
    Eg(b);
    a = b.memoizedState;
    if (null !== a && (a = a.dehydrated, null !== a)) return 0 === (b.mode & 1) ? b.lanes = 1 : "$!" === a.data ? b.lanes = 8 : b.lanes = 1073741824, null;
    g = d.children;
    a = d.fallback;
    return f2 ? (d = b.mode, f2 = b.child, g = { mode: "hidden", children: g }, 0 === (d & 1) && null !== f2 ? (f2.childLanes = 0, f2.pendingProps = g) : f2 = pj(g, d, 0, null), a = Tg(a, d, c, null), f2.return = b, a.return = b, f2.sibling = a, b.child = f2, b.child.memoizedState = nj(c), b.memoizedState = mj, a) : qj(b, g);
  }
  e = a.memoizedState;
  if (null !== e && (h = e.dehydrated, null !== h)) return rj(a, b, g, d, h, e, c);
  if (f2) {
    f2 = d.fallback;
    g = b.mode;
    e = a.child;
    h = e.sibling;
    var k2 = { mode: "hidden", children: d.children };
    0 === (g & 1) && b.child !== e ? (d = b.child, d.childLanes = 0, d.pendingProps = k2, b.deletions = null) : (d = Pg(e, k2), d.subtreeFlags = e.subtreeFlags & 14680064);
    null !== h ? f2 = Pg(h, f2) : (f2 = Tg(f2, g, c, null), f2.flags |= 2);
    f2.return = b;
    d.return = b;
    d.sibling = f2;
    b.child = d;
    d = f2;
    f2 = b.child;
    g = a.child.memoizedState;
    g = null === g ? nj(c) : { baseLanes: g.baseLanes | c, cachePool: null, transitions: g.transitions };
    f2.memoizedState = g;
    f2.childLanes = a.childLanes & ~c;
    b.memoizedState = mj;
    return d;
  }
  f2 = a.child;
  a = f2.sibling;
  d = Pg(f2, { mode: "visible", children: d.children });
  0 === (b.mode & 1) && (d.lanes = c);
  d.return = b;
  d.sibling = null;
  null !== a && (c = b.deletions, null === c ? (b.deletions = [a], b.flags |= 16) : c.push(a));
  b.child = d;
  b.memoizedState = null;
  return d;
}
function qj(a, b) {
  b = pj({ mode: "visible", children: b }, a.mode, 0, null);
  b.return = a;
  return a.child = b;
}
function sj(a, b, c, d) {
  null !== d && Jg(d);
  Ug(b, a.child, null, c);
  a = qj(b, b.pendingProps.children);
  a.flags |= 2;
  b.memoizedState = null;
  return a;
}
function rj(a, b, c, d, e, f2, g) {
  if (c) {
    if (b.flags & 256) return b.flags &= -257, d = Ki(Error(p(422))), sj(a, b, g, d);
    if (null !== b.memoizedState) return b.child = a.child, b.flags |= 128, null;
    f2 = d.fallback;
    e = b.mode;
    d = pj({ mode: "visible", children: d.children }, e, 0, null);
    f2 = Tg(f2, e, g, null);
    f2.flags |= 2;
    d.return = b;
    f2.return = b;
    d.sibling = f2;
    b.child = d;
    0 !== (b.mode & 1) && Ug(b, a.child, null, g);
    b.child.memoizedState = nj(g);
    b.memoizedState = mj;
    return f2;
  }
  if (0 === (b.mode & 1)) return sj(a, b, g, null);
  if ("$!" === e.data) {
    d = e.nextSibling && e.nextSibling.dataset;
    if (d) var h = d.dgst;
    d = h;
    f2 = Error(p(419));
    d = Ki(f2, d, void 0);
    return sj(a, b, g, d);
  }
  h = 0 !== (g & a.childLanes);
  if (dh || h) {
    d = Q;
    if (null !== d) {
      switch (g & -g) {
        case 4:
          e = 2;
          break;
        case 16:
          e = 8;
          break;
        case 64:
        case 128:
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
        case 67108864:
          e = 32;
          break;
        case 536870912:
          e = 268435456;
          break;
        default:
          e = 0;
      }
      e = 0 !== (e & (d.suspendedLanes | g)) ? 0 : e;
      0 !== e && e !== f2.retryLane && (f2.retryLane = e, ih(a, e), gi(d, a, e, -1));
    }
    tj();
    d = Ki(Error(p(421)));
    return sj(a, b, g, d);
  }
  if ("$?" === e.data) return b.flags |= 128, b.child = a.child, b = uj.bind(null, a), e._reactRetry = b, null;
  a = f2.treeContext;
  yg = Lf(e.nextSibling);
  xg = b;
  I = true;
  zg = null;
  null !== a && (og[pg++] = rg, og[pg++] = sg, og[pg++] = qg, rg = a.id, sg = a.overflow, qg = b);
  b = qj(b, d.children);
  b.flags |= 4096;
  return b;
}
function vj(a, b, c) {
  a.lanes |= b;
  var d = a.alternate;
  null !== d && (d.lanes |= b);
  bh(a.return, b, c);
}
function wj(a, b, c, d, e) {
  var f2 = a.memoizedState;
  null === f2 ? a.memoizedState = { isBackwards: b, rendering: null, renderingStartTime: 0, last: d, tail: c, tailMode: e } : (f2.isBackwards = b, f2.rendering = null, f2.renderingStartTime = 0, f2.last = d, f2.tail = c, f2.tailMode = e);
}
function xj(a, b, c) {
  var d = b.pendingProps, e = d.revealOrder, f2 = d.tail;
  Xi(a, b, d.children, c);
  d = L.current;
  if (0 !== (d & 2)) d = d & 1 | 2, b.flags |= 128;
  else {
    if (null !== a && 0 !== (a.flags & 128)) a: for (a = b.child; null !== a; ) {
      if (13 === a.tag) null !== a.memoizedState && vj(a, c, b);
      else if (19 === a.tag) vj(a, c, b);
      else if (null !== a.child) {
        a.child.return = a;
        a = a.child;
        continue;
      }
      if (a === b) break a;
      for (; null === a.sibling; ) {
        if (null === a.return || a.return === b) break a;
        a = a.return;
      }
      a.sibling.return = a.return;
      a = a.sibling;
    }
    d &= 1;
  }
  G$1(L, d);
  if (0 === (b.mode & 1)) b.memoizedState = null;
  else switch (e) {
    case "forwards":
      c = b.child;
      for (e = null; null !== c; ) a = c.alternate, null !== a && null === Ch(a) && (e = c), c = c.sibling;
      c = e;
      null === c ? (e = b.child, b.child = null) : (e = c.sibling, c.sibling = null);
      wj(b, false, e, c, f2);
      break;
    case "backwards":
      c = null;
      e = b.child;
      for (b.child = null; null !== e; ) {
        a = e.alternate;
        if (null !== a && null === Ch(a)) {
          b.child = e;
          break;
        }
        a = e.sibling;
        e.sibling = c;
        c = e;
        e = a;
      }
      wj(b, true, c, null, f2);
      break;
    case "together":
      wj(b, false, null, null, void 0);
      break;
    default:
      b.memoizedState = null;
  }
  return b.child;
}
function ij(a, b) {
  0 === (b.mode & 1) && null !== a && (a.alternate = null, b.alternate = null, b.flags |= 2);
}
function Zi(a, b, c) {
  null !== a && (b.dependencies = a.dependencies);
  rh |= b.lanes;
  if (0 === (c & b.childLanes)) return null;
  if (null !== a && b.child !== a.child) throw Error(p(153));
  if (null !== b.child) {
    a = b.child;
    c = Pg(a, a.pendingProps);
    b.child = c;
    for (c.return = b; null !== a.sibling; ) a = a.sibling, c = c.sibling = Pg(a, a.pendingProps), c.return = b;
    c.sibling = null;
  }
  return b.child;
}
function yj(a, b, c) {
  switch (b.tag) {
    case 3:
      kj(b);
      Ig();
      break;
    case 5:
      Ah(b);
      break;
    case 1:
      Zf(b.type) && cg(b);
      break;
    case 4:
      yh(b, b.stateNode.containerInfo);
      break;
    case 10:
      var d = b.type._context, e = b.memoizedProps.value;
      G$1(Wg, d._currentValue);
      d._currentValue = e;
      break;
    case 13:
      d = b.memoizedState;
      if (null !== d) {
        if (null !== d.dehydrated) return G$1(L, L.current & 1), b.flags |= 128, null;
        if (0 !== (c & b.child.childLanes)) return oj(a, b, c);
        G$1(L, L.current & 1);
        a = Zi(a, b, c);
        return null !== a ? a.sibling : null;
      }
      G$1(L, L.current & 1);
      break;
    case 19:
      d = 0 !== (c & b.childLanes);
      if (0 !== (a.flags & 128)) {
        if (d) return xj(a, b, c);
        b.flags |= 128;
      }
      e = b.memoizedState;
      null !== e && (e.rendering = null, e.tail = null, e.lastEffect = null);
      G$1(L, L.current);
      if (d) break;
      else return null;
    case 22:
    case 23:
      return b.lanes = 0, dj(a, b, c);
  }
  return Zi(a, b, c);
}
var zj, Aj, Bj, Cj;
zj = function(a, b) {
  for (var c = b.child; null !== c; ) {
    if (5 === c.tag || 6 === c.tag) a.appendChild(c.stateNode);
    else if (4 !== c.tag && null !== c.child) {
      c.child.return = c;
      c = c.child;
      continue;
    }
    if (c === b) break;
    for (; null === c.sibling; ) {
      if (null === c.return || c.return === b) return;
      c = c.return;
    }
    c.sibling.return = c.return;
    c = c.sibling;
  }
};
Aj = function() {
};
Bj = function(a, b, c, d) {
  var e = a.memoizedProps;
  if (e !== d) {
    a = b.stateNode;
    xh(uh.current);
    var f2 = null;
    switch (c) {
      case "input":
        e = Ya(a, e);
        d = Ya(a, d);
        f2 = [];
        break;
      case "select":
        e = A({}, e, { value: void 0 });
        d = A({}, d, { value: void 0 });
        f2 = [];
        break;
      case "textarea":
        e = gb(a, e);
        d = gb(a, d);
        f2 = [];
        break;
      default:
        "function" !== typeof e.onClick && "function" === typeof d.onClick && (a.onclick = Bf);
    }
    ub(c, d);
    var g;
    c = null;
    for (l2 in e) if (!d.hasOwnProperty(l2) && e.hasOwnProperty(l2) && null != e[l2]) if ("style" === l2) {
      var h = e[l2];
      for (g in h) h.hasOwnProperty(g) && (c || (c = {}), c[g] = "");
    } else "dangerouslySetInnerHTML" !== l2 && "children" !== l2 && "suppressContentEditableWarning" !== l2 && "suppressHydrationWarning" !== l2 && "autoFocus" !== l2 && (ea.hasOwnProperty(l2) ? f2 || (f2 = []) : (f2 = f2 || []).push(l2, null));
    for (l2 in d) {
      var k2 = d[l2];
      h = null != e ? e[l2] : void 0;
      if (d.hasOwnProperty(l2) && k2 !== h && (null != k2 || null != h)) if ("style" === l2) if (h) {
        for (g in h) !h.hasOwnProperty(g) || k2 && k2.hasOwnProperty(g) || (c || (c = {}), c[g] = "");
        for (g in k2) k2.hasOwnProperty(g) && h[g] !== k2[g] && (c || (c = {}), c[g] = k2[g]);
      } else c || (f2 || (f2 = []), f2.push(
        l2,
        c
      )), c = k2;
      else "dangerouslySetInnerHTML" === l2 ? (k2 = k2 ? k2.__html : void 0, h = h ? h.__html : void 0, null != k2 && h !== k2 && (f2 = f2 || []).push(l2, k2)) : "children" === l2 ? "string" !== typeof k2 && "number" !== typeof k2 || (f2 = f2 || []).push(l2, "" + k2) : "suppressContentEditableWarning" !== l2 && "suppressHydrationWarning" !== l2 && (ea.hasOwnProperty(l2) ? (null != k2 && "onScroll" === l2 && D("scroll", a), f2 || h === k2 || (f2 = [])) : (f2 = f2 || []).push(l2, k2));
    }
    c && (f2 = f2 || []).push("style", c);
    var l2 = f2;
    if (b.updateQueue = l2) b.flags |= 4;
  }
};
Cj = function(a, b, c, d) {
  c !== d && (b.flags |= 4);
};
function Dj(a, b) {
  if (!I) switch (a.tailMode) {
    case "hidden":
      b = a.tail;
      for (var c = null; null !== b; ) null !== b.alternate && (c = b), b = b.sibling;
      null === c ? a.tail = null : c.sibling = null;
      break;
    case "collapsed":
      c = a.tail;
      for (var d = null; null !== c; ) null !== c.alternate && (d = c), c = c.sibling;
      null === d ? b || null === a.tail ? a.tail = null : a.tail.sibling = null : d.sibling = null;
  }
}
function S(a) {
  var b = null !== a.alternate && a.alternate.child === a.child, c = 0, d = 0;
  if (b) for (var e = a.child; null !== e; ) c |= e.lanes | e.childLanes, d |= e.subtreeFlags & 14680064, d |= e.flags & 14680064, e.return = a, e = e.sibling;
  else for (e = a.child; null !== e; ) c |= e.lanes | e.childLanes, d |= e.subtreeFlags, d |= e.flags, e.return = a, e = e.sibling;
  a.subtreeFlags |= d;
  a.childLanes = c;
  return b;
}
function Ej(a, b, c) {
  var d = b.pendingProps;
  wg(b);
  switch (b.tag) {
    case 2:
    case 16:
    case 15:
    case 0:
    case 11:
    case 7:
    case 8:
    case 12:
    case 9:
    case 14:
      return S(b), null;
    case 1:
      return Zf(b.type) && $f(), S(b), null;
    case 3:
      d = b.stateNode;
      zh();
      E(Wf);
      E(H);
      Eh();
      d.pendingContext && (d.context = d.pendingContext, d.pendingContext = null);
      if (null === a || null === a.child) Gg(b) ? b.flags |= 4 : null === a || a.memoizedState.isDehydrated && 0 === (b.flags & 256) || (b.flags |= 1024, null !== zg && (Fj(zg), zg = null));
      Aj(a, b);
      S(b);
      return null;
    case 5:
      Bh(b);
      var e = xh(wh.current);
      c = b.type;
      if (null !== a && null != b.stateNode) Bj(a, b, c, d, e), a.ref !== b.ref && (b.flags |= 512, b.flags |= 2097152);
      else {
        if (!d) {
          if (null === b.stateNode) throw Error(p(166));
          S(b);
          return null;
        }
        a = xh(uh.current);
        if (Gg(b)) {
          d = b.stateNode;
          c = b.type;
          var f2 = b.memoizedProps;
          d[Of] = b;
          d[Pf] = f2;
          a = 0 !== (b.mode & 1);
          switch (c) {
            case "dialog":
              D("cancel", d);
              D("close", d);
              break;
            case "iframe":
            case "object":
            case "embed":
              D("load", d);
              break;
            case "video":
            case "audio":
              for (e = 0; e < lf.length; e++) D(lf[e], d);
              break;
            case "source":
              D("error", d);
              break;
            case "img":
            case "image":
            case "link":
              D(
                "error",
                d
              );
              D("load", d);
              break;
            case "details":
              D("toggle", d);
              break;
            case "input":
              Za(d, f2);
              D("invalid", d);
              break;
            case "select":
              d._wrapperState = { wasMultiple: !!f2.multiple };
              D("invalid", d);
              break;
            case "textarea":
              hb(d, f2), D("invalid", d);
          }
          ub(c, f2);
          e = null;
          for (var g in f2) if (f2.hasOwnProperty(g)) {
            var h = f2[g];
            "children" === g ? "string" === typeof h ? d.textContent !== h && (true !== f2.suppressHydrationWarning && Af(d.textContent, h, a), e = ["children", h]) : "number" === typeof h && d.textContent !== "" + h && (true !== f2.suppressHydrationWarning && Af(
              d.textContent,
              h,
              a
            ), e = ["children", "" + h]) : ea.hasOwnProperty(g) && null != h && "onScroll" === g && D("scroll", d);
          }
          switch (c) {
            case "input":
              Va(d);
              db(d, f2, true);
              break;
            case "textarea":
              Va(d);
              jb(d);
              break;
            case "select":
            case "option":
              break;
            default:
              "function" === typeof f2.onClick && (d.onclick = Bf);
          }
          d = e;
          b.updateQueue = d;
          null !== d && (b.flags |= 4);
        } else {
          g = 9 === e.nodeType ? e : e.ownerDocument;
          "http://www.w3.org/1999/xhtml" === a && (a = kb(c));
          "http://www.w3.org/1999/xhtml" === a ? "script" === c ? (a = g.createElement("div"), a.innerHTML = "<script><\/script>", a = a.removeChild(a.firstChild)) : "string" === typeof d.is ? a = g.createElement(c, { is: d.is }) : (a = g.createElement(c), "select" === c && (g = a, d.multiple ? g.multiple = true : d.size && (g.size = d.size))) : a = g.createElementNS(a, c);
          a[Of] = b;
          a[Pf] = d;
          zj(a, b, false, false);
          b.stateNode = a;
          a: {
            g = vb(c, d);
            switch (c) {
              case "dialog":
                D("cancel", a);
                D("close", a);
                e = d;
                break;
              case "iframe":
              case "object":
              case "embed":
                D("load", a);
                e = d;
                break;
              case "video":
              case "audio":
                for (e = 0; e < lf.length; e++) D(lf[e], a);
                e = d;
                break;
              case "source":
                D("error", a);
                e = d;
                break;
              case "img":
              case "image":
              case "link":
                D(
                  "error",
                  a
                );
                D("load", a);
                e = d;
                break;
              case "details":
                D("toggle", a);
                e = d;
                break;
              case "input":
                Za(a, d);
                e = Ya(a, d);
                D("invalid", a);
                break;
              case "option":
                e = d;
                break;
              case "select":
                a._wrapperState = { wasMultiple: !!d.multiple };
                e = A({}, d, { value: void 0 });
                D("invalid", a);
                break;
              case "textarea":
                hb(a, d);
                e = gb(a, d);
                D("invalid", a);
                break;
              default:
                e = d;
            }
            ub(c, e);
            h = e;
            for (f2 in h) if (h.hasOwnProperty(f2)) {
              var k2 = h[f2];
              "style" === f2 ? sb(a, k2) : "dangerouslySetInnerHTML" === f2 ? (k2 = k2 ? k2.__html : void 0, null != k2 && nb(a, k2)) : "children" === f2 ? "string" === typeof k2 ? ("textarea" !== c || "" !== k2) && ob(a, k2) : "number" === typeof k2 && ob(a, "" + k2) : "suppressContentEditableWarning" !== f2 && "suppressHydrationWarning" !== f2 && "autoFocus" !== f2 && (ea.hasOwnProperty(f2) ? null != k2 && "onScroll" === f2 && D("scroll", a) : null != k2 && ta(a, f2, k2, g));
            }
            switch (c) {
              case "input":
                Va(a);
                db(a, d, false);
                break;
              case "textarea":
                Va(a);
                jb(a);
                break;
              case "option":
                null != d.value && a.setAttribute("value", "" + Sa(d.value));
                break;
              case "select":
                a.multiple = !!d.multiple;
                f2 = d.value;
                null != f2 ? fb(a, !!d.multiple, f2, false) : null != d.defaultValue && fb(
                  a,
                  !!d.multiple,
                  d.defaultValue,
                  true
                );
                break;
              default:
                "function" === typeof e.onClick && (a.onclick = Bf);
            }
            switch (c) {
              case "button":
              case "input":
              case "select":
              case "textarea":
                d = !!d.autoFocus;
                break a;
              case "img":
                d = true;
                break a;
              default:
                d = false;
            }
          }
          d && (b.flags |= 4);
        }
        null !== b.ref && (b.flags |= 512, b.flags |= 2097152);
      }
      S(b);
      return null;
    case 6:
      if (a && null != b.stateNode) Cj(a, b, a.memoizedProps, d);
      else {
        if ("string" !== typeof d && null === b.stateNode) throw Error(p(166));
        c = xh(wh.current);
        xh(uh.current);
        if (Gg(b)) {
          d = b.stateNode;
          c = b.memoizedProps;
          d[Of] = b;
          if (f2 = d.nodeValue !== c) {
            if (a = xg, null !== a) switch (a.tag) {
              case 3:
                Af(d.nodeValue, c, 0 !== (a.mode & 1));
                break;
              case 5:
                true !== a.memoizedProps.suppressHydrationWarning && Af(d.nodeValue, c, 0 !== (a.mode & 1));
            }
          }
          f2 && (b.flags |= 4);
        } else d = (9 === c.nodeType ? c : c.ownerDocument).createTextNode(d), d[Of] = b, b.stateNode = d;
      }
      S(b);
      return null;
    case 13:
      E(L);
      d = b.memoizedState;
      if (null === a || null !== a.memoizedState && null !== a.memoizedState.dehydrated) {
        if (I && null !== yg && 0 !== (b.mode & 1) && 0 === (b.flags & 128)) Hg(), Ig(), b.flags |= 98560, f2 = false;
        else if (f2 = Gg(b), null !== d && null !== d.dehydrated) {
          if (null === a) {
            if (!f2) throw Error(p(318));
            f2 = b.memoizedState;
            f2 = null !== f2 ? f2.dehydrated : null;
            if (!f2) throw Error(p(317));
            f2[Of] = b;
          } else Ig(), 0 === (b.flags & 128) && (b.memoizedState = null), b.flags |= 4;
          S(b);
          f2 = false;
        } else null !== zg && (Fj(zg), zg = null), f2 = true;
        if (!f2) return b.flags & 65536 ? b : null;
      }
      if (0 !== (b.flags & 128)) return b.lanes = c, b;
      d = null !== d;
      d !== (null !== a && null !== a.memoizedState) && d && (b.child.flags |= 8192, 0 !== (b.mode & 1) && (null === a || 0 !== (L.current & 1) ? 0 === T && (T = 3) : tj()));
      null !== b.updateQueue && (b.flags |= 4);
      S(b);
      return null;
    case 4:
      return zh(), Aj(a, b), null === a && sf(b.stateNode.containerInfo), S(b), null;
    case 10:
      return ah(b.type._context), S(b), null;
    case 17:
      return Zf(b.type) && $f(), S(b), null;
    case 19:
      E(L);
      f2 = b.memoizedState;
      if (null === f2) return S(b), null;
      d = 0 !== (b.flags & 128);
      g = f2.rendering;
      if (null === g) if (d) Dj(f2, false);
      else {
        if (0 !== T || null !== a && 0 !== (a.flags & 128)) for (a = b.child; null !== a; ) {
          g = Ch(a);
          if (null !== g) {
            b.flags |= 128;
            Dj(f2, false);
            d = g.updateQueue;
            null !== d && (b.updateQueue = d, b.flags |= 4);
            b.subtreeFlags = 0;
            d = c;
            for (c = b.child; null !== c; ) f2 = c, a = d, f2.flags &= 14680066, g = f2.alternate, null === g ? (f2.childLanes = 0, f2.lanes = a, f2.child = null, f2.subtreeFlags = 0, f2.memoizedProps = null, f2.memoizedState = null, f2.updateQueue = null, f2.dependencies = null, f2.stateNode = null) : (f2.childLanes = g.childLanes, f2.lanes = g.lanes, f2.child = g.child, f2.subtreeFlags = 0, f2.deletions = null, f2.memoizedProps = g.memoizedProps, f2.memoizedState = g.memoizedState, f2.updateQueue = g.updateQueue, f2.type = g.type, a = g.dependencies, f2.dependencies = null === a ? null : { lanes: a.lanes, firstContext: a.firstContext }), c = c.sibling;
            G$1(L, L.current & 1 | 2);
            return b.child;
          }
          a = a.sibling;
        }
        null !== f2.tail && B() > Gj && (b.flags |= 128, d = true, Dj(f2, false), b.lanes = 4194304);
      }
      else {
        if (!d) if (a = Ch(g), null !== a) {
          if (b.flags |= 128, d = true, c = a.updateQueue, null !== c && (b.updateQueue = c, b.flags |= 4), Dj(f2, true), null === f2.tail && "hidden" === f2.tailMode && !g.alternate && !I) return S(b), null;
        } else 2 * B() - f2.renderingStartTime > Gj && 1073741824 !== c && (b.flags |= 128, d = true, Dj(f2, false), b.lanes = 4194304);
        f2.isBackwards ? (g.sibling = b.child, b.child = g) : (c = f2.last, null !== c ? c.sibling = g : b.child = g, f2.last = g);
      }
      if (null !== f2.tail) return b = f2.tail, f2.rendering = b, f2.tail = b.sibling, f2.renderingStartTime = B(), b.sibling = null, c = L.current, G$1(L, d ? c & 1 | 2 : c & 1), b;
      S(b);
      return null;
    case 22:
    case 23:
      return Hj(), d = null !== b.memoizedState, null !== a && null !== a.memoizedState !== d && (b.flags |= 8192), d && 0 !== (b.mode & 1) ? 0 !== (fj & 1073741824) && (S(b), b.subtreeFlags & 6 && (b.flags |= 8192)) : S(b), null;
    case 24:
      return null;
    case 25:
      return null;
  }
  throw Error(p(156, b.tag));
}
function Ij(a, b) {
  wg(b);
  switch (b.tag) {
    case 1:
      return Zf(b.type) && $f(), a = b.flags, a & 65536 ? (b.flags = a & -65537 | 128, b) : null;
    case 3:
      return zh(), E(Wf), E(H), Eh(), a = b.flags, 0 !== (a & 65536) && 0 === (a & 128) ? (b.flags = a & -65537 | 128, b) : null;
    case 5:
      return Bh(b), null;
    case 13:
      E(L);
      a = b.memoizedState;
      if (null !== a && null !== a.dehydrated) {
        if (null === b.alternate) throw Error(p(340));
        Ig();
      }
      a = b.flags;
      return a & 65536 ? (b.flags = a & -65537 | 128, b) : null;
    case 19:
      return E(L), null;
    case 4:
      return zh(), null;
    case 10:
      return ah(b.type._context), null;
    case 22:
    case 23:
      return Hj(), null;
    case 24:
      return null;
    default:
      return null;
  }
}
var Jj = false, U = false, Kj = "function" === typeof WeakSet ? WeakSet : Set, V = null;
function Lj(a, b) {
  var c = a.ref;
  if (null !== c) if ("function" === typeof c) try {
    c(null);
  } catch (d) {
    W(a, b, d);
  }
  else c.current = null;
}
function Mj(a, b, c) {
  try {
    c();
  } catch (d) {
    W(a, b, d);
  }
}
var Nj = false;
function Oj(a, b) {
  Cf = dd;
  a = Me();
  if (Ne(a)) {
    if ("selectionStart" in a) var c = { start: a.selectionStart, end: a.selectionEnd };
    else a: {
      c = (c = a.ownerDocument) && c.defaultView || window;
      var d = c.getSelection && c.getSelection();
      if (d && 0 !== d.rangeCount) {
        c = d.anchorNode;
        var e = d.anchorOffset, f2 = d.focusNode;
        d = d.focusOffset;
        try {
          c.nodeType, f2.nodeType;
        } catch (F2) {
          c = null;
          break a;
        }
        var g = 0, h = -1, k2 = -1, l2 = 0, m2 = 0, q2 = a, r2 = null;
        b: for (; ; ) {
          for (var y2; ; ) {
            q2 !== c || 0 !== e && 3 !== q2.nodeType || (h = g + e);
            q2 !== f2 || 0 !== d && 3 !== q2.nodeType || (k2 = g + d);
            3 === q2.nodeType && (g += q2.nodeValue.length);
            if (null === (y2 = q2.firstChild)) break;
            r2 = q2;
            q2 = y2;
          }
          for (; ; ) {
            if (q2 === a) break b;
            r2 === c && ++l2 === e && (h = g);
            r2 === f2 && ++m2 === d && (k2 = g);
            if (null !== (y2 = q2.nextSibling)) break;
            q2 = r2;
            r2 = q2.parentNode;
          }
          q2 = y2;
        }
        c = -1 === h || -1 === k2 ? null : { start: h, end: k2 };
      } else c = null;
    }
    c = c || { start: 0, end: 0 };
  } else c = null;
  Df = { focusedElem: a, selectionRange: c };
  dd = false;
  for (V = b; null !== V; ) if (b = V, a = b.child, 0 !== (b.subtreeFlags & 1028) && null !== a) a.return = b, V = a;
  else for (; null !== V; ) {
    b = V;
    try {
      var n2 = b.alternate;
      if (0 !== (b.flags & 1024)) switch (b.tag) {
        case 0:
        case 11:
        case 15:
          break;
        case 1:
          if (null !== n2) {
            var t2 = n2.memoizedProps, J2 = n2.memoizedState, x2 = b.stateNode, w2 = x2.getSnapshotBeforeUpdate(b.elementType === b.type ? t2 : Ci(b.type, t2), J2);
            x2.__reactInternalSnapshotBeforeUpdate = w2;
          }
          break;
        case 3:
          var u2 = b.stateNode.containerInfo;
          1 === u2.nodeType ? u2.textContent = "" : 9 === u2.nodeType && u2.documentElement && u2.removeChild(u2.documentElement);
          break;
        case 5:
        case 6:
        case 4:
        case 17:
          break;
        default:
          throw Error(p(163));
      }
    } catch (F2) {
      W(b, b.return, F2);
    }
    a = b.sibling;
    if (null !== a) {
      a.return = b.return;
      V = a;
      break;
    }
    V = b.return;
  }
  n2 = Nj;
  Nj = false;
  return n2;
}
function Pj(a, b, c) {
  var d = b.updateQueue;
  d = null !== d ? d.lastEffect : null;
  if (null !== d) {
    var e = d = d.next;
    do {
      if ((e.tag & a) === a) {
        var f2 = e.destroy;
        e.destroy = void 0;
        void 0 !== f2 && Mj(b, c, f2);
      }
      e = e.next;
    } while (e !== d);
  }
}
function Qj(a, b) {
  b = b.updateQueue;
  b = null !== b ? b.lastEffect : null;
  if (null !== b) {
    var c = b = b.next;
    do {
      if ((c.tag & a) === a) {
        var d = c.create;
        c.destroy = d();
      }
      c = c.next;
    } while (c !== b);
  }
}
function Rj(a) {
  var b = a.ref;
  if (null !== b) {
    var c = a.stateNode;
    switch (a.tag) {
      case 5:
        a = c;
        break;
      default:
        a = c;
    }
    "function" === typeof b ? b(a) : b.current = a;
  }
}
function Sj(a) {
  var b = a.alternate;
  null !== b && (a.alternate = null, Sj(b));
  a.child = null;
  a.deletions = null;
  a.sibling = null;
  5 === a.tag && (b = a.stateNode, null !== b && (delete b[Of], delete b[Pf], delete b[of], delete b[Qf], delete b[Rf]));
  a.stateNode = null;
  a.return = null;
  a.dependencies = null;
  a.memoizedProps = null;
  a.memoizedState = null;
  a.pendingProps = null;
  a.stateNode = null;
  a.updateQueue = null;
}
function Tj(a) {
  return 5 === a.tag || 3 === a.tag || 4 === a.tag;
}
function Uj(a) {
  a: for (; ; ) {
    for (; null === a.sibling; ) {
      if (null === a.return || Tj(a.return)) return null;
      a = a.return;
    }
    a.sibling.return = a.return;
    for (a = a.sibling; 5 !== a.tag && 6 !== a.tag && 18 !== a.tag; ) {
      if (a.flags & 2) continue a;
      if (null === a.child || 4 === a.tag) continue a;
      else a.child.return = a, a = a.child;
    }
    if (!(a.flags & 2)) return a.stateNode;
  }
}
function Vj(a, b, c) {
  var d = a.tag;
  if (5 === d || 6 === d) a = a.stateNode, b ? 8 === c.nodeType ? c.parentNode.insertBefore(a, b) : c.insertBefore(a, b) : (8 === c.nodeType ? (b = c.parentNode, b.insertBefore(a, c)) : (b = c, b.appendChild(a)), c = c._reactRootContainer, null !== c && void 0 !== c || null !== b.onclick || (b.onclick = Bf));
  else if (4 !== d && (a = a.child, null !== a)) for (Vj(a, b, c), a = a.sibling; null !== a; ) Vj(a, b, c), a = a.sibling;
}
function Wj(a, b, c) {
  var d = a.tag;
  if (5 === d || 6 === d) a = a.stateNode, b ? c.insertBefore(a, b) : c.appendChild(a);
  else if (4 !== d && (a = a.child, null !== a)) for (Wj(a, b, c), a = a.sibling; null !== a; ) Wj(a, b, c), a = a.sibling;
}
var X$1 = null, Xj = false;
function Yj(a, b, c) {
  for (c = c.child; null !== c; ) Zj(a, b, c), c = c.sibling;
}
function Zj(a, b, c) {
  if (lc && "function" === typeof lc.onCommitFiberUnmount) try {
    lc.onCommitFiberUnmount(kc, c);
  } catch (h) {
  }
  switch (c.tag) {
    case 5:
      U || Lj(c, b);
    case 6:
      var d = X$1, e = Xj;
      X$1 = null;
      Yj(a, b, c);
      X$1 = d;
      Xj = e;
      null !== X$1 && (Xj ? (a = X$1, c = c.stateNode, 8 === a.nodeType ? a.parentNode.removeChild(c) : a.removeChild(c)) : X$1.removeChild(c.stateNode));
      break;
    case 18:
      null !== X$1 && (Xj ? (a = X$1, c = c.stateNode, 8 === a.nodeType ? Kf(a.parentNode, c) : 1 === a.nodeType && Kf(a, c), bd(a)) : Kf(X$1, c.stateNode));
      break;
    case 4:
      d = X$1;
      e = Xj;
      X$1 = c.stateNode.containerInfo;
      Xj = true;
      Yj(a, b, c);
      X$1 = d;
      Xj = e;
      break;
    case 0:
    case 11:
    case 14:
    case 15:
      if (!U && (d = c.updateQueue, null !== d && (d = d.lastEffect, null !== d))) {
        e = d = d.next;
        do {
          var f2 = e, g = f2.destroy;
          f2 = f2.tag;
          void 0 !== g && (0 !== (f2 & 2) ? Mj(c, b, g) : 0 !== (f2 & 4) && Mj(c, b, g));
          e = e.next;
        } while (e !== d);
      }
      Yj(a, b, c);
      break;
    case 1:
      if (!U && (Lj(c, b), d = c.stateNode, "function" === typeof d.componentWillUnmount)) try {
        d.props = c.memoizedProps, d.state = c.memoizedState, d.componentWillUnmount();
      } catch (h) {
        W(c, b, h);
      }
      Yj(a, b, c);
      break;
    case 21:
      Yj(a, b, c);
      break;
    case 22:
      c.mode & 1 ? (U = (d = U) || null !== c.memoizedState, Yj(a, b, c), U = d) : Yj(a, b, c);
      break;
    default:
      Yj(a, b, c);
  }
}
function ak(a) {
  var b = a.updateQueue;
  if (null !== b) {
    a.updateQueue = null;
    var c = a.stateNode;
    null === c && (c = a.stateNode = new Kj());
    b.forEach(function(b2) {
      var d = bk.bind(null, a, b2);
      c.has(b2) || (c.add(b2), b2.then(d, d));
    });
  }
}
function ck(a, b) {
  var c = b.deletions;
  if (null !== c) for (var d = 0; d < c.length; d++) {
    var e = c[d];
    try {
      var f2 = a, g = b, h = g;
      a: for (; null !== h; ) {
        switch (h.tag) {
          case 5:
            X$1 = h.stateNode;
            Xj = false;
            break a;
          case 3:
            X$1 = h.stateNode.containerInfo;
            Xj = true;
            break a;
          case 4:
            X$1 = h.stateNode.containerInfo;
            Xj = true;
            break a;
        }
        h = h.return;
      }
      if (null === X$1) throw Error(p(160));
      Zj(f2, g, e);
      X$1 = null;
      Xj = false;
      var k2 = e.alternate;
      null !== k2 && (k2.return = null);
      e.return = null;
    } catch (l2) {
      W(e, b, l2);
    }
  }
  if (b.subtreeFlags & 12854) for (b = b.child; null !== b; ) dk(b, a), b = b.sibling;
}
function dk(a, b) {
  var c = a.alternate, d = a.flags;
  switch (a.tag) {
    case 0:
    case 11:
    case 14:
    case 15:
      ck(b, a);
      ek(a);
      if (d & 4) {
        try {
          Pj(3, a, a.return), Qj(3, a);
        } catch (t2) {
          W(a, a.return, t2);
        }
        try {
          Pj(5, a, a.return);
        } catch (t2) {
          W(a, a.return, t2);
        }
      }
      break;
    case 1:
      ck(b, a);
      ek(a);
      d & 512 && null !== c && Lj(c, c.return);
      break;
    case 5:
      ck(b, a);
      ek(a);
      d & 512 && null !== c && Lj(c, c.return);
      if (a.flags & 32) {
        var e = a.stateNode;
        try {
          ob(e, "");
        } catch (t2) {
          W(a, a.return, t2);
        }
      }
      if (d & 4 && (e = a.stateNode, null != e)) {
        var f2 = a.memoizedProps, g = null !== c ? c.memoizedProps : f2, h = a.type, k2 = a.updateQueue;
        a.updateQueue = null;
        if (null !== k2) try {
          "input" === h && "radio" === f2.type && null != f2.name && ab(e, f2);
          vb(h, g);
          var l2 = vb(h, f2);
          for (g = 0; g < k2.length; g += 2) {
            var m2 = k2[g], q2 = k2[g + 1];
            "style" === m2 ? sb(e, q2) : "dangerouslySetInnerHTML" === m2 ? nb(e, q2) : "children" === m2 ? ob(e, q2) : ta(e, m2, q2, l2);
          }
          switch (h) {
            case "input":
              bb(e, f2);
              break;
            case "textarea":
              ib(e, f2);
              break;
            case "select":
              var r2 = e._wrapperState.wasMultiple;
              e._wrapperState.wasMultiple = !!f2.multiple;
              var y2 = f2.value;
              null != y2 ? fb(e, !!f2.multiple, y2, false) : r2 !== !!f2.multiple && (null != f2.defaultValue ? fb(
                e,
                !!f2.multiple,
                f2.defaultValue,
                true
              ) : fb(e, !!f2.multiple, f2.multiple ? [] : "", false));
          }
          e[Pf] = f2;
        } catch (t2) {
          W(a, a.return, t2);
        }
      }
      break;
    case 6:
      ck(b, a);
      ek(a);
      if (d & 4) {
        if (null === a.stateNode) throw Error(p(162));
        e = a.stateNode;
        f2 = a.memoizedProps;
        try {
          e.nodeValue = f2;
        } catch (t2) {
          W(a, a.return, t2);
        }
      }
      break;
    case 3:
      ck(b, a);
      ek(a);
      if (d & 4 && null !== c && c.memoizedState.isDehydrated) try {
        bd(b.containerInfo);
      } catch (t2) {
        W(a, a.return, t2);
      }
      break;
    case 4:
      ck(b, a);
      ek(a);
      break;
    case 13:
      ck(b, a);
      ek(a);
      e = a.child;
      e.flags & 8192 && (f2 = null !== e.memoizedState, e.stateNode.isHidden = f2, !f2 || null !== e.alternate && null !== e.alternate.memoizedState || (fk = B()));
      d & 4 && ak(a);
      break;
    case 22:
      m2 = null !== c && null !== c.memoizedState;
      a.mode & 1 ? (U = (l2 = U) || m2, ck(b, a), U = l2) : ck(b, a);
      ek(a);
      if (d & 8192) {
        l2 = null !== a.memoizedState;
        if ((a.stateNode.isHidden = l2) && !m2 && 0 !== (a.mode & 1)) for (V = a, m2 = a.child; null !== m2; ) {
          for (q2 = V = m2; null !== V; ) {
            r2 = V;
            y2 = r2.child;
            switch (r2.tag) {
              case 0:
              case 11:
              case 14:
              case 15:
                Pj(4, r2, r2.return);
                break;
              case 1:
                Lj(r2, r2.return);
                var n2 = r2.stateNode;
                if ("function" === typeof n2.componentWillUnmount) {
                  d = r2;
                  c = r2.return;
                  try {
                    b = d, n2.props = b.memoizedProps, n2.state = b.memoizedState, n2.componentWillUnmount();
                  } catch (t2) {
                    W(d, c, t2);
                  }
                }
                break;
              case 5:
                Lj(r2, r2.return);
                break;
              case 22:
                if (null !== r2.memoizedState) {
                  gk(q2);
                  continue;
                }
            }
            null !== y2 ? (y2.return = r2, V = y2) : gk(q2);
          }
          m2 = m2.sibling;
        }
        a: for (m2 = null, q2 = a; ; ) {
          if (5 === q2.tag) {
            if (null === m2) {
              m2 = q2;
              try {
                e = q2.stateNode, l2 ? (f2 = e.style, "function" === typeof f2.setProperty ? f2.setProperty("display", "none", "important") : f2.display = "none") : (h = q2.stateNode, k2 = q2.memoizedProps.style, g = void 0 !== k2 && null !== k2 && k2.hasOwnProperty("display") ? k2.display : null, h.style.display = rb("display", g));
              } catch (t2) {
                W(a, a.return, t2);
              }
            }
          } else if (6 === q2.tag) {
            if (null === m2) try {
              q2.stateNode.nodeValue = l2 ? "" : q2.memoizedProps;
            } catch (t2) {
              W(a, a.return, t2);
            }
          } else if ((22 !== q2.tag && 23 !== q2.tag || null === q2.memoizedState || q2 === a) && null !== q2.child) {
            q2.child.return = q2;
            q2 = q2.child;
            continue;
          }
          if (q2 === a) break a;
          for (; null === q2.sibling; ) {
            if (null === q2.return || q2.return === a) break a;
            m2 === q2 && (m2 = null);
            q2 = q2.return;
          }
          m2 === q2 && (m2 = null);
          q2.sibling.return = q2.return;
          q2 = q2.sibling;
        }
      }
      break;
    case 19:
      ck(b, a);
      ek(a);
      d & 4 && ak(a);
      break;
    case 21:
      break;
    default:
      ck(
        b,
        a
      ), ek(a);
  }
}
function ek(a) {
  var b = a.flags;
  if (b & 2) {
    try {
      a: {
        for (var c = a.return; null !== c; ) {
          if (Tj(c)) {
            var d = c;
            break a;
          }
          c = c.return;
        }
        throw Error(p(160));
      }
      switch (d.tag) {
        case 5:
          var e = d.stateNode;
          d.flags & 32 && (ob(e, ""), d.flags &= -33);
          var f2 = Uj(a);
          Wj(a, f2, e);
          break;
        case 3:
        case 4:
          var g = d.stateNode.containerInfo, h = Uj(a);
          Vj(a, h, g);
          break;
        default:
          throw Error(p(161));
      }
    } catch (k2) {
      W(a, a.return, k2);
    }
    a.flags &= -3;
  }
  b & 4096 && (a.flags &= -4097);
}
function hk(a, b, c) {
  V = a;
  ik(a);
}
function ik(a, b, c) {
  for (var d = 0 !== (a.mode & 1); null !== V; ) {
    var e = V, f2 = e.child;
    if (22 === e.tag && d) {
      var g = null !== e.memoizedState || Jj;
      if (!g) {
        var h = e.alternate, k2 = null !== h && null !== h.memoizedState || U;
        h = Jj;
        var l2 = U;
        Jj = g;
        if ((U = k2) && !l2) for (V = e; null !== V; ) g = V, k2 = g.child, 22 === g.tag && null !== g.memoizedState ? jk(e) : null !== k2 ? (k2.return = g, V = k2) : jk(e);
        for (; null !== f2; ) V = f2, ik(f2), f2 = f2.sibling;
        V = e;
        Jj = h;
        U = l2;
      }
      kk(a);
    } else 0 !== (e.subtreeFlags & 8772) && null !== f2 ? (f2.return = e, V = f2) : kk(a);
  }
}
function kk(a) {
  for (; null !== V; ) {
    var b = V;
    if (0 !== (b.flags & 8772)) {
      var c = b.alternate;
      try {
        if (0 !== (b.flags & 8772)) switch (b.tag) {
          case 0:
          case 11:
          case 15:
            U || Qj(5, b);
            break;
          case 1:
            var d = b.stateNode;
            if (b.flags & 4 && !U) if (null === c) d.componentDidMount();
            else {
              var e = b.elementType === b.type ? c.memoizedProps : Ci(b.type, c.memoizedProps);
              d.componentDidUpdate(e, c.memoizedState, d.__reactInternalSnapshotBeforeUpdate);
            }
            var f2 = b.updateQueue;
            null !== f2 && sh(b, f2, d);
            break;
          case 3:
            var g = b.updateQueue;
            if (null !== g) {
              c = null;
              if (null !== b.child) switch (b.child.tag) {
                case 5:
                  c = b.child.stateNode;
                  break;
                case 1:
                  c = b.child.stateNode;
              }
              sh(b, g, c);
            }
            break;
          case 5:
            var h = b.stateNode;
            if (null === c && b.flags & 4) {
              c = h;
              var k2 = b.memoizedProps;
              switch (b.type) {
                case "button":
                case "input":
                case "select":
                case "textarea":
                  k2.autoFocus && c.focus();
                  break;
                case "img":
                  k2.src && (c.src = k2.src);
              }
            }
            break;
          case 6:
            break;
          case 4:
            break;
          case 12:
            break;
          case 13:
            if (null === b.memoizedState) {
              var l2 = b.alternate;
              if (null !== l2) {
                var m2 = l2.memoizedState;
                if (null !== m2) {
                  var q2 = m2.dehydrated;
                  null !== q2 && bd(q2);
                }
              }
            }
            break;
          case 19:
          case 17:
          case 21:
          case 22:
          case 23:
          case 25:
            break;
          default:
            throw Error(p(163));
        }
        U || b.flags & 512 && Rj(b);
      } catch (r2) {
        W(b, b.return, r2);
      }
    }
    if (b === a) {
      V = null;
      break;
    }
    c = b.sibling;
    if (null !== c) {
      c.return = b.return;
      V = c;
      break;
    }
    V = b.return;
  }
}
function gk(a) {
  for (; null !== V; ) {
    var b = V;
    if (b === a) {
      V = null;
      break;
    }
    var c = b.sibling;
    if (null !== c) {
      c.return = b.return;
      V = c;
      break;
    }
    V = b.return;
  }
}
function jk(a) {
  for (; null !== V; ) {
    var b = V;
    try {
      switch (b.tag) {
        case 0:
        case 11:
        case 15:
          var c = b.return;
          try {
            Qj(4, b);
          } catch (k2) {
            W(b, c, k2);
          }
          break;
        case 1:
          var d = b.stateNode;
          if ("function" === typeof d.componentDidMount) {
            var e = b.return;
            try {
              d.componentDidMount();
            } catch (k2) {
              W(b, e, k2);
            }
          }
          var f2 = b.return;
          try {
            Rj(b);
          } catch (k2) {
            W(b, f2, k2);
          }
          break;
        case 5:
          var g = b.return;
          try {
            Rj(b);
          } catch (k2) {
            W(b, g, k2);
          }
      }
    } catch (k2) {
      W(b, b.return, k2);
    }
    if (b === a) {
      V = null;
      break;
    }
    var h = b.sibling;
    if (null !== h) {
      h.return = b.return;
      V = h;
      break;
    }
    V = b.return;
  }
}
var lk = Math.ceil, mk = ua.ReactCurrentDispatcher, nk = ua.ReactCurrentOwner, ok = ua.ReactCurrentBatchConfig, K = 0, Q = null, Y = null, Z = 0, fj = 0, ej = Uf(0), T = 0, pk = null, rh = 0, qk = 0, rk = 0, sk = null, tk = null, fk = 0, Gj = Infinity, uk = null, Oi = false, Pi = null, Ri = null, vk = false, wk = null, xk = 0, yk = 0, zk = null, Ak = -1, Bk = 0;
function R() {
  return 0 !== (K & 6) ? B() : -1 !== Ak ? Ak : Ak = B();
}
function yi(a) {
  if (0 === (a.mode & 1)) return 1;
  if (0 !== (K & 2) && 0 !== Z) return Z & -Z;
  if (null !== Kg.transition) return 0 === Bk && (Bk = yc()), Bk;
  a = C;
  if (0 !== a) return a;
  a = window.event;
  a = void 0 === a ? 16 : jd(a.type);
  return a;
}
function gi(a, b, c, d) {
  if (50 < yk) throw yk = 0, zk = null, Error(p(185));
  Ac(a, c, d);
  if (0 === (K & 2) || a !== Q) a === Q && (0 === (K & 2) && (qk |= c), 4 === T && Ck(a, Z)), Dk(a, d), 1 === c && 0 === K && 0 === (b.mode & 1) && (Gj = B() + 500, fg && jg());
}
function Dk(a, b) {
  var c = a.callbackNode;
  wc(a, b);
  var d = uc(a, a === Q ? Z : 0);
  if (0 === d) null !== c && bc(c), a.callbackNode = null, a.callbackPriority = 0;
  else if (b = d & -d, a.callbackPriority !== b) {
    null != c && bc(c);
    if (1 === b) 0 === a.tag ? ig(Ek.bind(null, a)) : hg(Ek.bind(null, a)), Jf(function() {
      0 === (K & 6) && jg();
    }), c = null;
    else {
      switch (Dc(d)) {
        case 1:
          c = fc;
          break;
        case 4:
          c = gc;
          break;
        case 16:
          c = hc;
          break;
        case 536870912:
          c = jc;
          break;
        default:
          c = hc;
      }
      c = Fk(c, Gk.bind(null, a));
    }
    a.callbackPriority = b;
    a.callbackNode = c;
  }
}
function Gk(a, b) {
  Ak = -1;
  Bk = 0;
  if (0 !== (K & 6)) throw Error(p(327));
  var c = a.callbackNode;
  if (Hk() && a.callbackNode !== c) return null;
  var d = uc(a, a === Q ? Z : 0);
  if (0 === d) return null;
  if (0 !== (d & 30) || 0 !== (d & a.expiredLanes) || b) b = Ik(a, d);
  else {
    b = d;
    var e = K;
    K |= 2;
    var f2 = Jk();
    if (Q !== a || Z !== b) uk = null, Gj = B() + 500, Kk(a, b);
    do
      try {
        Lk();
        break;
      } catch (h) {
        Mk(a, h);
      }
    while (1);
    $g();
    mk.current = f2;
    K = e;
    null !== Y ? b = 0 : (Q = null, Z = 0, b = T);
  }
  if (0 !== b) {
    2 === b && (e = xc(a), 0 !== e && (d = e, b = Nk(a, e)));
    if (1 === b) throw c = pk, Kk(a, 0), Ck(a, d), Dk(a, B()), c;
    if (6 === b) Ck(a, d);
    else {
      e = a.current.alternate;
      if (0 === (d & 30) && !Ok(e) && (b = Ik(a, d), 2 === b && (f2 = xc(a), 0 !== f2 && (d = f2, b = Nk(a, f2))), 1 === b)) throw c = pk, Kk(a, 0), Ck(a, d), Dk(a, B()), c;
      a.finishedWork = e;
      a.finishedLanes = d;
      switch (b) {
        case 0:
        case 1:
          throw Error(p(345));
        case 2:
          Pk(a, tk, uk);
          break;
        case 3:
          Ck(a, d);
          if ((d & 130023424) === d && (b = fk + 500 - B(), 10 < b)) {
            if (0 !== uc(a, 0)) break;
            e = a.suspendedLanes;
            if ((e & d) !== d) {
              R();
              a.pingedLanes |= a.suspendedLanes & e;
              break;
            }
            a.timeoutHandle = Ff(Pk.bind(null, a, tk, uk), b);
            break;
          }
          Pk(a, tk, uk);
          break;
        case 4:
          Ck(a, d);
          if ((d & 4194240) === d) break;
          b = a.eventTimes;
          for (e = -1; 0 < d; ) {
            var g = 31 - oc(d);
            f2 = 1 << g;
            g = b[g];
            g > e && (e = g);
            d &= ~f2;
          }
          d = e;
          d = B() - d;
          d = (120 > d ? 120 : 480 > d ? 480 : 1080 > d ? 1080 : 1920 > d ? 1920 : 3e3 > d ? 3e3 : 4320 > d ? 4320 : 1960 * lk(d / 1960)) - d;
          if (10 < d) {
            a.timeoutHandle = Ff(Pk.bind(null, a, tk, uk), d);
            break;
          }
          Pk(a, tk, uk);
          break;
        case 5:
          Pk(a, tk, uk);
          break;
        default:
          throw Error(p(329));
      }
    }
  }
  Dk(a, B());
  return a.callbackNode === c ? Gk.bind(null, a) : null;
}
function Nk(a, b) {
  var c = sk;
  a.current.memoizedState.isDehydrated && (Kk(a, b).flags |= 256);
  a = Ik(a, b);
  2 !== a && (b = tk, tk = c, null !== b && Fj(b));
  return a;
}
function Fj(a) {
  null === tk ? tk = a : tk.push.apply(tk, a);
}
function Ok(a) {
  for (var b = a; ; ) {
    if (b.flags & 16384) {
      var c = b.updateQueue;
      if (null !== c && (c = c.stores, null !== c)) for (var d = 0; d < c.length; d++) {
        var e = c[d], f2 = e.getSnapshot;
        e = e.value;
        try {
          if (!He(f2(), e)) return false;
        } catch (g) {
          return false;
        }
      }
    }
    c = b.child;
    if (b.subtreeFlags & 16384 && null !== c) c.return = b, b = c;
    else {
      if (b === a) break;
      for (; null === b.sibling; ) {
        if (null === b.return || b.return === a) return true;
        b = b.return;
      }
      b.sibling.return = b.return;
      b = b.sibling;
    }
  }
  return true;
}
function Ck(a, b) {
  b &= ~rk;
  b &= ~qk;
  a.suspendedLanes |= b;
  a.pingedLanes &= ~b;
  for (a = a.expirationTimes; 0 < b; ) {
    var c = 31 - oc(b), d = 1 << c;
    a[c] = -1;
    b &= ~d;
  }
}
function Ek(a) {
  if (0 !== (K & 6)) throw Error(p(327));
  Hk();
  var b = uc(a, 0);
  if (0 === (b & 1)) return Dk(a, B()), null;
  var c = Ik(a, b);
  if (0 !== a.tag && 2 === c) {
    var d = xc(a);
    0 !== d && (b = d, c = Nk(a, d));
  }
  if (1 === c) throw c = pk, Kk(a, 0), Ck(a, b), Dk(a, B()), c;
  if (6 === c) throw Error(p(345));
  a.finishedWork = a.current.alternate;
  a.finishedLanes = b;
  Pk(a, tk, uk);
  Dk(a, B());
  return null;
}
function Qk(a, b) {
  var c = K;
  K |= 1;
  try {
    return a(b);
  } finally {
    K = c, 0 === K && (Gj = B() + 500, fg && jg());
  }
}
function Rk(a) {
  null !== wk && 0 === wk.tag && 0 === (K & 6) && Hk();
  var b = K;
  K |= 1;
  var c = ok.transition, d = C;
  try {
    if (ok.transition = null, C = 1, a) return a();
  } finally {
    C = d, ok.transition = c, K = b, 0 === (K & 6) && jg();
  }
}
function Hj() {
  fj = ej.current;
  E(ej);
}
function Kk(a, b) {
  a.finishedWork = null;
  a.finishedLanes = 0;
  var c = a.timeoutHandle;
  -1 !== c && (a.timeoutHandle = -1, Gf(c));
  if (null !== Y) for (c = Y.return; null !== c; ) {
    var d = c;
    wg(d);
    switch (d.tag) {
      case 1:
        d = d.type.childContextTypes;
        null !== d && void 0 !== d && $f();
        break;
      case 3:
        zh();
        E(Wf);
        E(H);
        Eh();
        break;
      case 5:
        Bh(d);
        break;
      case 4:
        zh();
        break;
      case 13:
        E(L);
        break;
      case 19:
        E(L);
        break;
      case 10:
        ah(d.type._context);
        break;
      case 22:
      case 23:
        Hj();
    }
    c = c.return;
  }
  Q = a;
  Y = a = Pg(a.current, null);
  Z = fj = b;
  T = 0;
  pk = null;
  rk = qk = rh = 0;
  tk = sk = null;
  if (null !== fh) {
    for (b = 0; b < fh.length; b++) if (c = fh[b], d = c.interleaved, null !== d) {
      c.interleaved = null;
      var e = d.next, f2 = c.pending;
      if (null !== f2) {
        var g = f2.next;
        f2.next = e;
        d.next = g;
      }
      c.pending = d;
    }
    fh = null;
  }
  return a;
}
function Mk(a, b) {
  do {
    var c = Y;
    try {
      $g();
      Fh.current = Rh;
      if (Ih) {
        for (var d = M.memoizedState; null !== d; ) {
          var e = d.queue;
          null !== e && (e.pending = null);
          d = d.next;
        }
        Ih = false;
      }
      Hh = 0;
      O = N = M = null;
      Jh = false;
      Kh = 0;
      nk.current = null;
      if (null === c || null === c.return) {
        T = 1;
        pk = b;
        Y = null;
        break;
      }
      a: {
        var f2 = a, g = c.return, h = c, k2 = b;
        b = Z;
        h.flags |= 32768;
        if (null !== k2 && "object" === typeof k2 && "function" === typeof k2.then) {
          var l2 = k2, m2 = h, q2 = m2.tag;
          if (0 === (m2.mode & 1) && (0 === q2 || 11 === q2 || 15 === q2)) {
            var r2 = m2.alternate;
            r2 ? (m2.updateQueue = r2.updateQueue, m2.memoizedState = r2.memoizedState, m2.lanes = r2.lanes) : (m2.updateQueue = null, m2.memoizedState = null);
          }
          var y2 = Ui(g);
          if (null !== y2) {
            y2.flags &= -257;
            Vi(y2, g, h, f2, b);
            y2.mode & 1 && Si(f2, l2, b);
            b = y2;
            k2 = l2;
            var n2 = b.updateQueue;
            if (null === n2) {
              var t2 = /* @__PURE__ */ new Set();
              t2.add(k2);
              b.updateQueue = t2;
            } else n2.add(k2);
            break a;
          } else {
            if (0 === (b & 1)) {
              Si(f2, l2, b);
              tj();
              break a;
            }
            k2 = Error(p(426));
          }
        } else if (I && h.mode & 1) {
          var J2 = Ui(g);
          if (null !== J2) {
            0 === (J2.flags & 65536) && (J2.flags |= 256);
            Vi(J2, g, h, f2, b);
            Jg(Ji(k2, h));
            break a;
          }
        }
        f2 = k2 = Ji(k2, h);
        4 !== T && (T = 2);
        null === sk ? sk = [f2] : sk.push(f2);
        f2 = g;
        do {
          switch (f2.tag) {
            case 3:
              f2.flags |= 65536;
              b &= -b;
              f2.lanes |= b;
              var x2 = Ni(f2, k2, b);
              ph(f2, x2);
              break a;
            case 1:
              h = k2;
              var w2 = f2.type, u2 = f2.stateNode;
              if (0 === (f2.flags & 128) && ("function" === typeof w2.getDerivedStateFromError || null !== u2 && "function" === typeof u2.componentDidCatch && (null === Ri || !Ri.has(u2)))) {
                f2.flags |= 65536;
                b &= -b;
                f2.lanes |= b;
                var F2 = Qi(f2, h, b);
                ph(f2, F2);
                break a;
              }
          }
          f2 = f2.return;
        } while (null !== f2);
      }
      Sk(c);
    } catch (na) {
      b = na;
      Y === c && null !== c && (Y = c = c.return);
      continue;
    }
    break;
  } while (1);
}
function Jk() {
  var a = mk.current;
  mk.current = Rh;
  return null === a ? Rh : a;
}
function tj() {
  if (0 === T || 3 === T || 2 === T) T = 4;
  null === Q || 0 === (rh & 268435455) && 0 === (qk & 268435455) || Ck(Q, Z);
}
function Ik(a, b) {
  var c = K;
  K |= 2;
  var d = Jk();
  if (Q !== a || Z !== b) uk = null, Kk(a, b);
  do
    try {
      Tk();
      break;
    } catch (e) {
      Mk(a, e);
    }
  while (1);
  $g();
  K = c;
  mk.current = d;
  if (null !== Y) throw Error(p(261));
  Q = null;
  Z = 0;
  return T;
}
function Tk() {
  for (; null !== Y; ) Uk(Y);
}
function Lk() {
  for (; null !== Y && !cc(); ) Uk(Y);
}
function Uk(a) {
  var b = Vk(a.alternate, a, fj);
  a.memoizedProps = a.pendingProps;
  null === b ? Sk(a) : Y = b;
  nk.current = null;
}
function Sk(a) {
  var b = a;
  do {
    var c = b.alternate;
    a = b.return;
    if (0 === (b.flags & 32768)) {
      if (c = Ej(c, b, fj), null !== c) {
        Y = c;
        return;
      }
    } else {
      c = Ij(c, b);
      if (null !== c) {
        c.flags &= 32767;
        Y = c;
        return;
      }
      if (null !== a) a.flags |= 32768, a.subtreeFlags = 0, a.deletions = null;
      else {
        T = 6;
        Y = null;
        return;
      }
    }
    b = b.sibling;
    if (null !== b) {
      Y = b;
      return;
    }
    Y = b = a;
  } while (null !== b);
  0 === T && (T = 5);
}
function Pk(a, b, c) {
  var d = C, e = ok.transition;
  try {
    ok.transition = null, C = 1, Wk(a, b, c, d);
  } finally {
    ok.transition = e, C = d;
  }
  return null;
}
function Wk(a, b, c, d) {
  do
    Hk();
  while (null !== wk);
  if (0 !== (K & 6)) throw Error(p(327));
  c = a.finishedWork;
  var e = a.finishedLanes;
  if (null === c) return null;
  a.finishedWork = null;
  a.finishedLanes = 0;
  if (c === a.current) throw Error(p(177));
  a.callbackNode = null;
  a.callbackPriority = 0;
  var f2 = c.lanes | c.childLanes;
  Bc(a, f2);
  a === Q && (Y = Q = null, Z = 0);
  0 === (c.subtreeFlags & 2064) && 0 === (c.flags & 2064) || vk || (vk = true, Fk(hc, function() {
    Hk();
    return null;
  }));
  f2 = 0 !== (c.flags & 15990);
  if (0 !== (c.subtreeFlags & 15990) || f2) {
    f2 = ok.transition;
    ok.transition = null;
    var g = C;
    C = 1;
    var h = K;
    K |= 4;
    nk.current = null;
    Oj(a, c);
    dk(c, a);
    Oe(Df);
    dd = !!Cf;
    Df = Cf = null;
    a.current = c;
    hk(c);
    dc();
    K = h;
    C = g;
    ok.transition = f2;
  } else a.current = c;
  vk && (vk = false, wk = a, xk = e);
  f2 = a.pendingLanes;
  0 === f2 && (Ri = null);
  mc(c.stateNode);
  Dk(a, B());
  if (null !== b) for (d = a.onRecoverableError, c = 0; c < b.length; c++) e = b[c], d(e.value, { componentStack: e.stack, digest: e.digest });
  if (Oi) throw Oi = false, a = Pi, Pi = null, a;
  0 !== (xk & 1) && 0 !== a.tag && Hk();
  f2 = a.pendingLanes;
  0 !== (f2 & 1) ? a === zk ? yk++ : (yk = 0, zk = a) : yk = 0;
  jg();
  return null;
}
function Hk() {
  if (null !== wk) {
    var a = Dc(xk), b = ok.transition, c = C;
    try {
      ok.transition = null;
      C = 16 > a ? 16 : a;
      if (null === wk) var d = false;
      else {
        a = wk;
        wk = null;
        xk = 0;
        if (0 !== (K & 6)) throw Error(p(331));
        var e = K;
        K |= 4;
        for (V = a.current; null !== V; ) {
          var f2 = V, g = f2.child;
          if (0 !== (V.flags & 16)) {
            var h = f2.deletions;
            if (null !== h) {
              for (var k2 = 0; k2 < h.length; k2++) {
                var l2 = h[k2];
                for (V = l2; null !== V; ) {
                  var m2 = V;
                  switch (m2.tag) {
                    case 0:
                    case 11:
                    case 15:
                      Pj(8, m2, f2);
                  }
                  var q2 = m2.child;
                  if (null !== q2) q2.return = m2, V = q2;
                  else for (; null !== V; ) {
                    m2 = V;
                    var r2 = m2.sibling, y2 = m2.return;
                    Sj(m2);
                    if (m2 === l2) {
                      V = null;
                      break;
                    }
                    if (null !== r2) {
                      r2.return = y2;
                      V = r2;
                      break;
                    }
                    V = y2;
                  }
                }
              }
              var n2 = f2.alternate;
              if (null !== n2) {
                var t2 = n2.child;
                if (null !== t2) {
                  n2.child = null;
                  do {
                    var J2 = t2.sibling;
                    t2.sibling = null;
                    t2 = J2;
                  } while (null !== t2);
                }
              }
              V = f2;
            }
          }
          if (0 !== (f2.subtreeFlags & 2064) && null !== g) g.return = f2, V = g;
          else b: for (; null !== V; ) {
            f2 = V;
            if (0 !== (f2.flags & 2048)) switch (f2.tag) {
              case 0:
              case 11:
              case 15:
                Pj(9, f2, f2.return);
            }
            var x2 = f2.sibling;
            if (null !== x2) {
              x2.return = f2.return;
              V = x2;
              break b;
            }
            V = f2.return;
          }
        }
        var w2 = a.current;
        for (V = w2; null !== V; ) {
          g = V;
          var u2 = g.child;
          if (0 !== (g.subtreeFlags & 2064) && null !== u2) u2.return = g, V = u2;
          else b: for (g = w2; null !== V; ) {
            h = V;
            if (0 !== (h.flags & 2048)) try {
              switch (h.tag) {
                case 0:
                case 11:
                case 15:
                  Qj(9, h);
              }
            } catch (na) {
              W(h, h.return, na);
            }
            if (h === g) {
              V = null;
              break b;
            }
            var F2 = h.sibling;
            if (null !== F2) {
              F2.return = h.return;
              V = F2;
              break b;
            }
            V = h.return;
          }
        }
        K = e;
        jg();
        if (lc && "function" === typeof lc.onPostCommitFiberRoot) try {
          lc.onPostCommitFiberRoot(kc, a);
        } catch (na) {
        }
        d = true;
      }
      return d;
    } finally {
      C = c, ok.transition = b;
    }
  }
  return false;
}
function Xk(a, b, c) {
  b = Ji(c, b);
  b = Ni(a, b, 1);
  a = nh(a, b, 1);
  b = R();
  null !== a && (Ac(a, 1, b), Dk(a, b));
}
function W(a, b, c) {
  if (3 === a.tag) Xk(a, a, c);
  else for (; null !== b; ) {
    if (3 === b.tag) {
      Xk(b, a, c);
      break;
    } else if (1 === b.tag) {
      var d = b.stateNode;
      if ("function" === typeof b.type.getDerivedStateFromError || "function" === typeof d.componentDidCatch && (null === Ri || !Ri.has(d))) {
        a = Ji(c, a);
        a = Qi(b, a, 1);
        b = nh(b, a, 1);
        a = R();
        null !== b && (Ac(b, 1, a), Dk(b, a));
        break;
      }
    }
    b = b.return;
  }
}
function Ti(a, b, c) {
  var d = a.pingCache;
  null !== d && d.delete(b);
  b = R();
  a.pingedLanes |= a.suspendedLanes & c;
  Q === a && (Z & c) === c && (4 === T || 3 === T && (Z & 130023424) === Z && 500 > B() - fk ? Kk(a, 0) : rk |= c);
  Dk(a, b);
}
function Yk(a, b) {
  0 === b && (0 === (a.mode & 1) ? b = 1 : (b = sc, sc <<= 1, 0 === (sc & 130023424) && (sc = 4194304)));
  var c = R();
  a = ih(a, b);
  null !== a && (Ac(a, b, c), Dk(a, c));
}
function uj(a) {
  var b = a.memoizedState, c = 0;
  null !== b && (c = b.retryLane);
  Yk(a, c);
}
function bk(a, b) {
  var c = 0;
  switch (a.tag) {
    case 13:
      var d = a.stateNode;
      var e = a.memoizedState;
      null !== e && (c = e.retryLane);
      break;
    case 19:
      d = a.stateNode;
      break;
    default:
      throw Error(p(314));
  }
  null !== d && d.delete(b);
  Yk(a, c);
}
var Vk;
Vk = function(a, b, c) {
  if (null !== a) if (a.memoizedProps !== b.pendingProps || Wf.current) dh = true;
  else {
    if (0 === (a.lanes & c) && 0 === (b.flags & 128)) return dh = false, yj(a, b, c);
    dh = 0 !== (a.flags & 131072) ? true : false;
  }
  else dh = false, I && 0 !== (b.flags & 1048576) && ug(b, ng, b.index);
  b.lanes = 0;
  switch (b.tag) {
    case 2:
      var d = b.type;
      ij(a, b);
      a = b.pendingProps;
      var e = Yf(b, H.current);
      ch(b, c);
      e = Nh(null, b, d, a, e, c);
      var f2 = Sh();
      b.flags |= 1;
      "object" === typeof e && null !== e && "function" === typeof e.render && void 0 === e.$$typeof ? (b.tag = 1, b.memoizedState = null, b.updateQueue = null, Zf(d) ? (f2 = true, cg(b)) : f2 = false, b.memoizedState = null !== e.state && void 0 !== e.state ? e.state : null, kh(b), e.updater = Ei, b.stateNode = e, e._reactInternals = b, Ii(b, d, a, c), b = jj(null, b, d, true, f2, c)) : (b.tag = 0, I && f2 && vg(b), Xi(null, b, e, c), b = b.child);
      return b;
    case 16:
      d = b.elementType;
      a: {
        ij(a, b);
        a = b.pendingProps;
        e = d._init;
        d = e(d._payload);
        b.type = d;
        e = b.tag = Zk(d);
        a = Ci(d, a);
        switch (e) {
          case 0:
            b = cj(null, b, d, a, c);
            break a;
          case 1:
            b = hj(null, b, d, a, c);
            break a;
          case 11:
            b = Yi(null, b, d, a, c);
            break a;
          case 14:
            b = $i(null, b, d, Ci(d.type, a), c);
            break a;
        }
        throw Error(p(
          306,
          d,
          ""
        ));
      }
      return b;
    case 0:
      return d = b.type, e = b.pendingProps, e = b.elementType === d ? e : Ci(d, e), cj(a, b, d, e, c);
    case 1:
      return d = b.type, e = b.pendingProps, e = b.elementType === d ? e : Ci(d, e), hj(a, b, d, e, c);
    case 3:
      a: {
        kj(b);
        if (null === a) throw Error(p(387));
        d = b.pendingProps;
        f2 = b.memoizedState;
        e = f2.element;
        lh(a, b);
        qh(b, d, null, c);
        var g = b.memoizedState;
        d = g.element;
        if (f2.isDehydrated) if (f2 = { element: d, isDehydrated: false, cache: g.cache, pendingSuspenseBoundaries: g.pendingSuspenseBoundaries, transitions: g.transitions }, b.updateQueue.baseState = f2, b.memoizedState = f2, b.flags & 256) {
          e = Ji(Error(p(423)), b);
          b = lj(a, b, d, c, e);
          break a;
        } else if (d !== e) {
          e = Ji(Error(p(424)), b);
          b = lj(a, b, d, c, e);
          break a;
        } else for (yg = Lf(b.stateNode.containerInfo.firstChild), xg = b, I = true, zg = null, c = Vg(b, null, d, c), b.child = c; c; ) c.flags = c.flags & -3 | 4096, c = c.sibling;
        else {
          Ig();
          if (d === e) {
            b = Zi(a, b, c);
            break a;
          }
          Xi(a, b, d, c);
        }
        b = b.child;
      }
      return b;
    case 5:
      return Ah(b), null === a && Eg(b), d = b.type, e = b.pendingProps, f2 = null !== a ? a.memoizedProps : null, g = e.children, Ef(d, e) ? g = null : null !== f2 && Ef(d, f2) && (b.flags |= 32), gj(a, b), Xi(a, b, g, c), b.child;
    case 6:
      return null === a && Eg(b), null;
    case 13:
      return oj(a, b, c);
    case 4:
      return yh(b, b.stateNode.containerInfo), d = b.pendingProps, null === a ? b.child = Ug(b, null, d, c) : Xi(a, b, d, c), b.child;
    case 11:
      return d = b.type, e = b.pendingProps, e = b.elementType === d ? e : Ci(d, e), Yi(a, b, d, e, c);
    case 7:
      return Xi(a, b, b.pendingProps, c), b.child;
    case 8:
      return Xi(a, b, b.pendingProps.children, c), b.child;
    case 12:
      return Xi(a, b, b.pendingProps.children, c), b.child;
    case 10:
      a: {
        d = b.type._context;
        e = b.pendingProps;
        f2 = b.memoizedProps;
        g = e.value;
        G$1(Wg, d._currentValue);
        d._currentValue = g;
        if (null !== f2) if (He(f2.value, g)) {
          if (f2.children === e.children && !Wf.current) {
            b = Zi(a, b, c);
            break a;
          }
        } else for (f2 = b.child, null !== f2 && (f2.return = b); null !== f2; ) {
          var h = f2.dependencies;
          if (null !== h) {
            g = f2.child;
            for (var k2 = h.firstContext; null !== k2; ) {
              if (k2.context === d) {
                if (1 === f2.tag) {
                  k2 = mh(-1, c & -c);
                  k2.tag = 2;
                  var l2 = f2.updateQueue;
                  if (null !== l2) {
                    l2 = l2.shared;
                    var m2 = l2.pending;
                    null === m2 ? k2.next = k2 : (k2.next = m2.next, m2.next = k2);
                    l2.pending = k2;
                  }
                }
                f2.lanes |= c;
                k2 = f2.alternate;
                null !== k2 && (k2.lanes |= c);
                bh(
                  f2.return,
                  c,
                  b
                );
                h.lanes |= c;
                break;
              }
              k2 = k2.next;
            }
          } else if (10 === f2.tag) g = f2.type === b.type ? null : f2.child;
          else if (18 === f2.tag) {
            g = f2.return;
            if (null === g) throw Error(p(341));
            g.lanes |= c;
            h = g.alternate;
            null !== h && (h.lanes |= c);
            bh(g, c, b);
            g = f2.sibling;
          } else g = f2.child;
          if (null !== g) g.return = f2;
          else for (g = f2; null !== g; ) {
            if (g === b) {
              g = null;
              break;
            }
            f2 = g.sibling;
            if (null !== f2) {
              f2.return = g.return;
              g = f2;
              break;
            }
            g = g.return;
          }
          f2 = g;
        }
        Xi(a, b, e.children, c);
        b = b.child;
      }
      return b;
    case 9:
      return e = b.type, d = b.pendingProps.children, ch(b, c), e = eh(e), d = d(e), b.flags |= 1, Xi(a, b, d, c), b.child;
    case 14:
      return d = b.type, e = Ci(d, b.pendingProps), e = Ci(d.type, e), $i(a, b, d, e, c);
    case 15:
      return bj(a, b, b.type, b.pendingProps, c);
    case 17:
      return d = b.type, e = b.pendingProps, e = b.elementType === d ? e : Ci(d, e), ij(a, b), b.tag = 1, Zf(d) ? (a = true, cg(b)) : a = false, ch(b, c), Gi(b, d, e), Ii(b, d, e, c), jj(null, b, d, true, a, c);
    case 19:
      return xj(a, b, c);
    case 22:
      return dj(a, b, c);
  }
  throw Error(p(156, b.tag));
};
function Fk(a, b) {
  return ac(a, b);
}
function $k(a, b, c, d) {
  this.tag = a;
  this.key = c;
  this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null;
  this.index = 0;
  this.ref = null;
  this.pendingProps = b;
  this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null;
  this.mode = d;
  this.subtreeFlags = this.flags = 0;
  this.deletions = null;
  this.childLanes = this.lanes = 0;
  this.alternate = null;
}
function Bg(a, b, c, d) {
  return new $k(a, b, c, d);
}
function aj(a) {
  a = a.prototype;
  return !(!a || !a.isReactComponent);
}
function Zk(a) {
  if ("function" === typeof a) return aj(a) ? 1 : 0;
  if (void 0 !== a && null !== a) {
    a = a.$$typeof;
    if (a === Da) return 11;
    if (a === Ga) return 14;
  }
  return 2;
}
function Pg(a, b) {
  var c = a.alternate;
  null === c ? (c = Bg(a.tag, b, a.key, a.mode), c.elementType = a.elementType, c.type = a.type, c.stateNode = a.stateNode, c.alternate = a, a.alternate = c) : (c.pendingProps = b, c.type = a.type, c.flags = 0, c.subtreeFlags = 0, c.deletions = null);
  c.flags = a.flags & 14680064;
  c.childLanes = a.childLanes;
  c.lanes = a.lanes;
  c.child = a.child;
  c.memoizedProps = a.memoizedProps;
  c.memoizedState = a.memoizedState;
  c.updateQueue = a.updateQueue;
  b = a.dependencies;
  c.dependencies = null === b ? null : { lanes: b.lanes, firstContext: b.firstContext };
  c.sibling = a.sibling;
  c.index = a.index;
  c.ref = a.ref;
  return c;
}
function Rg(a, b, c, d, e, f2) {
  var g = 2;
  d = a;
  if ("function" === typeof a) aj(a) && (g = 1);
  else if ("string" === typeof a) g = 5;
  else a: switch (a) {
    case ya:
      return Tg(c.children, e, f2, b);
    case za:
      g = 8;
      e |= 8;
      break;
    case Aa:
      return a = Bg(12, c, b, e | 2), a.elementType = Aa, a.lanes = f2, a;
    case Ea:
      return a = Bg(13, c, b, e), a.elementType = Ea, a.lanes = f2, a;
    case Fa:
      return a = Bg(19, c, b, e), a.elementType = Fa, a.lanes = f2, a;
    case Ia:
      return pj(c, e, f2, b);
    default:
      if ("object" === typeof a && null !== a) switch (a.$$typeof) {
        case Ba:
          g = 10;
          break a;
        case Ca:
          g = 9;
          break a;
        case Da:
          g = 11;
          break a;
        case Ga:
          g = 14;
          break a;
        case Ha:
          g = 16;
          d = null;
          break a;
      }
      throw Error(p(130, null == a ? a : typeof a, ""));
  }
  b = Bg(g, c, b, e);
  b.elementType = a;
  b.type = d;
  b.lanes = f2;
  return b;
}
function Tg(a, b, c, d) {
  a = Bg(7, a, d, b);
  a.lanes = c;
  return a;
}
function pj(a, b, c, d) {
  a = Bg(22, a, d, b);
  a.elementType = Ia;
  a.lanes = c;
  a.stateNode = { isHidden: false };
  return a;
}
function Qg(a, b, c) {
  a = Bg(6, a, null, b);
  a.lanes = c;
  return a;
}
function Sg(a, b, c) {
  b = Bg(4, null !== a.children ? a.children : [], a.key, b);
  b.lanes = c;
  b.stateNode = { containerInfo: a.containerInfo, pendingChildren: null, implementation: a.implementation };
  return b;
}
function al(a, b, c, d, e) {
  this.tag = b;
  this.containerInfo = a;
  this.finishedWork = this.pingCache = this.current = this.pendingChildren = null;
  this.timeoutHandle = -1;
  this.callbackNode = this.pendingContext = this.context = null;
  this.callbackPriority = 0;
  this.eventTimes = zc(0);
  this.expirationTimes = zc(-1);
  this.entangledLanes = this.finishedLanes = this.mutableReadLanes = this.expiredLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0;
  this.entanglements = zc(0);
  this.identifierPrefix = d;
  this.onRecoverableError = e;
  this.mutableSourceEagerHydrationData = null;
}
function bl(a, b, c, d, e, f2, g, h, k2) {
  a = new al(a, b, c, h, k2);
  1 === b ? (b = 1, true === f2 && (b |= 8)) : b = 0;
  f2 = Bg(3, null, null, b);
  a.current = f2;
  f2.stateNode = a;
  f2.memoizedState = { element: d, isDehydrated: c, cache: null, transitions: null, pendingSuspenseBoundaries: null };
  kh(f2);
  return a;
}
function cl(a, b, c) {
  var d = 3 < arguments.length && void 0 !== arguments[3] ? arguments[3] : null;
  return { $$typeof: wa, key: null == d ? null : "" + d, children: a, containerInfo: b, implementation: c };
}
function dl(a) {
  if (!a) return Vf;
  a = a._reactInternals;
  a: {
    if (Vb(a) !== a || 1 !== a.tag) throw Error(p(170));
    var b = a;
    do {
      switch (b.tag) {
        case 3:
          b = b.stateNode.context;
          break a;
        case 1:
          if (Zf(b.type)) {
            b = b.stateNode.__reactInternalMemoizedMergedChildContext;
            break a;
          }
      }
      b = b.return;
    } while (null !== b);
    throw Error(p(171));
  }
  if (1 === a.tag) {
    var c = a.type;
    if (Zf(c)) return bg(a, c, b);
  }
  return b;
}
function el(a, b, c, d, e, f2, g, h, k2) {
  a = bl(c, d, true, a, e, f2, g, h, k2);
  a.context = dl(null);
  c = a.current;
  d = R();
  e = yi(c);
  f2 = mh(d, e);
  f2.callback = void 0 !== b && null !== b ? b : null;
  nh(c, f2, e);
  a.current.lanes = e;
  Ac(a, e, d);
  Dk(a, d);
  return a;
}
function fl(a, b, c, d) {
  var e = b.current, f2 = R(), g = yi(e);
  c = dl(c);
  null === b.context ? b.context = c : b.pendingContext = c;
  b = mh(f2, g);
  b.payload = { element: a };
  d = void 0 === d ? null : d;
  null !== d && (b.callback = d);
  a = nh(e, b, g);
  null !== a && (gi(a, e, g, f2), oh(a, e, g));
  return g;
}
function gl(a) {
  a = a.current;
  if (!a.child) return null;
  switch (a.child.tag) {
    case 5:
      return a.child.stateNode;
    default:
      return a.child.stateNode;
  }
}
function hl(a, b) {
  a = a.memoizedState;
  if (null !== a && null !== a.dehydrated) {
    var c = a.retryLane;
    a.retryLane = 0 !== c && c < b ? c : b;
  }
}
function il(a, b) {
  hl(a, b);
  (a = a.alternate) && hl(a, b);
}
function jl() {
  return null;
}
var kl = "function" === typeof reportError ? reportError : function(a) {
  console.error(a);
};
function ll(a) {
  this._internalRoot = a;
}
ml.prototype.render = ll.prototype.render = function(a) {
  var b = this._internalRoot;
  if (null === b) throw Error(p(409));
  fl(a, b, null, null);
};
ml.prototype.unmount = ll.prototype.unmount = function() {
  var a = this._internalRoot;
  if (null !== a) {
    this._internalRoot = null;
    var b = a.containerInfo;
    Rk(function() {
      fl(null, a, null, null);
    });
    b[uf] = null;
  }
};
function ml(a) {
  this._internalRoot = a;
}
ml.prototype.unstable_scheduleHydration = function(a) {
  if (a) {
    var b = Hc();
    a = { blockedOn: null, target: a, priority: b };
    for (var c = 0; c < Qc.length && 0 !== b && b < Qc[c].priority; c++) ;
    Qc.splice(c, 0, a);
    0 === c && Vc(a);
  }
};
function nl(a) {
  return !(!a || 1 !== a.nodeType && 9 !== a.nodeType && 11 !== a.nodeType);
}
function ol(a) {
  return !(!a || 1 !== a.nodeType && 9 !== a.nodeType && 11 !== a.nodeType && (8 !== a.nodeType || " react-mount-point-unstable " !== a.nodeValue));
}
function pl() {
}
function ql(a, b, c, d, e) {
  if (e) {
    if ("function" === typeof d) {
      var f2 = d;
      d = function() {
        var a2 = gl(g);
        f2.call(a2);
      };
    }
    var g = el(b, d, a, 0, null, false, false, "", pl);
    a._reactRootContainer = g;
    a[uf] = g.current;
    sf(8 === a.nodeType ? a.parentNode : a);
    Rk();
    return g;
  }
  for (; e = a.lastChild; ) a.removeChild(e);
  if ("function" === typeof d) {
    var h = d;
    d = function() {
      var a2 = gl(k2);
      h.call(a2);
    };
  }
  var k2 = bl(a, 0, false, null, null, false, false, "", pl);
  a._reactRootContainer = k2;
  a[uf] = k2.current;
  sf(8 === a.nodeType ? a.parentNode : a);
  Rk(function() {
    fl(b, k2, c, d);
  });
  return k2;
}
function rl(a, b, c, d, e) {
  var f2 = c._reactRootContainer;
  if (f2) {
    var g = f2;
    if ("function" === typeof e) {
      var h = e;
      e = function() {
        var a2 = gl(g);
        h.call(a2);
      };
    }
    fl(b, g, a, e);
  } else g = ql(c, b, a, e, d);
  return gl(g);
}
Ec = function(a) {
  switch (a.tag) {
    case 3:
      var b = a.stateNode;
      if (b.current.memoizedState.isDehydrated) {
        var c = tc(b.pendingLanes);
        0 !== c && (Cc(b, c | 1), Dk(b, B()), 0 === (K & 6) && (Gj = B() + 500, jg()));
      }
      break;
    case 13:
      Rk(function() {
        var b2 = ih(a, 1);
        if (null !== b2) {
          var c2 = R();
          gi(b2, a, 1, c2);
        }
      }), il(a, 1);
  }
};
Fc = function(a) {
  if (13 === a.tag) {
    var b = ih(a, 134217728);
    if (null !== b) {
      var c = R();
      gi(b, a, 134217728, c);
    }
    il(a, 134217728);
  }
};
Gc = function(a) {
  if (13 === a.tag) {
    var b = yi(a), c = ih(a, b);
    if (null !== c) {
      var d = R();
      gi(c, a, b, d);
    }
    il(a, b);
  }
};
Hc = function() {
  return C;
};
Ic = function(a, b) {
  var c = C;
  try {
    return C = a, b();
  } finally {
    C = c;
  }
};
yb = function(a, b, c) {
  switch (b) {
    case "input":
      bb(a, c);
      b = c.name;
      if ("radio" === c.type && null != b) {
        for (c = a; c.parentNode; ) c = c.parentNode;
        c = c.querySelectorAll("input[name=" + JSON.stringify("" + b) + '][type="radio"]');
        for (b = 0; b < c.length; b++) {
          var d = c[b];
          if (d !== a && d.form === a.form) {
            var e = Db(d);
            if (!e) throw Error(p(90));
            Wa(d);
            bb(d, e);
          }
        }
      }
      break;
    case "textarea":
      ib(a, c);
      break;
    case "select":
      b = c.value, null != b && fb(a, !!c.multiple, b, false);
  }
};
Gb = Qk;
Hb = Rk;
var sl = { usingClientEntryPoint: false, Events: [Cb, ue, Db, Eb, Fb, Qk] }, tl = { findFiberByHostInstance: Wc, bundleType: 0, version: "18.3.1", rendererPackageName: "react-dom" };
var ul = { bundleType: tl.bundleType, version: tl.version, rendererPackageName: tl.rendererPackageName, rendererConfig: tl.rendererConfig, overrideHookState: null, overrideHookStateDeletePath: null, overrideHookStateRenamePath: null, overrideProps: null, overridePropsDeletePath: null, overridePropsRenamePath: null, setErrorHandler: null, setSuspenseHandler: null, scheduleUpdate: null, currentDispatcherRef: ua.ReactCurrentDispatcher, findHostInstanceByFiber: function(a) {
  a = Zb(a);
  return null === a ? null : a.stateNode;
}, findFiberByHostInstance: tl.findFiberByHostInstance || jl, findHostInstancesForRefresh: null, scheduleRefresh: null, scheduleRoot: null, setRefreshHandler: null, getCurrentFiber: null, reconcilerVersion: "18.3.1-next-f1338f8080-20240426" };
if ("undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__) {
  var vl = __REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!vl.isDisabled && vl.supportsFiber) try {
    kc = vl.inject(ul), lc = vl;
  } catch (a) {
  }
}
reactDom_production_min.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = sl;
reactDom_production_min.createPortal = function(a, b) {
  var c = 2 < arguments.length && void 0 !== arguments[2] ? arguments[2] : null;
  if (!nl(b)) throw Error(p(200));
  return cl(a, b, null, c);
};
reactDom_production_min.createRoot = function(a, b) {
  if (!nl(a)) throw Error(p(299));
  var c = false, d = "", e = kl;
  null !== b && void 0 !== b && (true === b.unstable_strictMode && (c = true), void 0 !== b.identifierPrefix && (d = b.identifierPrefix), void 0 !== b.onRecoverableError && (e = b.onRecoverableError));
  b = bl(a, 1, false, null, null, c, false, d, e);
  a[uf] = b.current;
  sf(8 === a.nodeType ? a.parentNode : a);
  return new ll(b);
};
reactDom_production_min.findDOMNode = function(a) {
  if (null == a) return null;
  if (1 === a.nodeType) return a;
  var b = a._reactInternals;
  if (void 0 === b) {
    if ("function" === typeof a.render) throw Error(p(188));
    a = Object.keys(a).join(",");
    throw Error(p(268, a));
  }
  a = Zb(b);
  a = null === a ? null : a.stateNode;
  return a;
};
reactDom_production_min.flushSync = function(a) {
  return Rk(a);
};
reactDom_production_min.hydrate = function(a, b, c) {
  if (!ol(b)) throw Error(p(200));
  return rl(null, a, b, true, c);
};
reactDom_production_min.hydrateRoot = function(a, b, c) {
  if (!nl(a)) throw Error(p(405));
  var d = null != c && c.hydratedSources || null, e = false, f2 = "", g = kl;
  null !== c && void 0 !== c && (true === c.unstable_strictMode && (e = true), void 0 !== c.identifierPrefix && (f2 = c.identifierPrefix), void 0 !== c.onRecoverableError && (g = c.onRecoverableError));
  b = el(b, null, a, 1, null != c ? c : null, e, false, f2, g);
  a[uf] = b.current;
  sf(a);
  if (d) for (a = 0; a < d.length; a++) c = d[a], e = c._getVersion, e = e(c._source), null == b.mutableSourceEagerHydrationData ? b.mutableSourceEagerHydrationData = [c, e] : b.mutableSourceEagerHydrationData.push(
    c,
    e
  );
  return new ml(b);
};
reactDom_production_min.render = function(a, b, c) {
  if (!ol(b)) throw Error(p(200));
  return rl(null, a, b, false, c);
};
reactDom_production_min.unmountComponentAtNode = function(a) {
  if (!ol(a)) throw Error(p(40));
  return a._reactRootContainer ? (Rk(function() {
    rl(null, null, a, false, function() {
      a._reactRootContainer = null;
      a[uf] = null;
    });
  }), true) : false;
};
reactDom_production_min.unstable_batchedUpdates = Qk;
reactDom_production_min.unstable_renderSubtreeIntoContainer = function(a, b, c, d) {
  if (!ol(c)) throw Error(p(200));
  if (null == a || void 0 === a._reactInternals) throw Error(p(38));
  return rl(a, b, c, false, d);
};
reactDom_production_min.version = "18.3.1-next-f1338f8080-20240426";
function checkDCE() {
  if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ === "undefined" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE !== "function") {
    return;
  }
  try {
    __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(checkDCE);
  } catch (err) {
    console.error(err);
  }
}
{
  checkDCE();
  reactDom.exports = reactDom_production_min;
}
var reactDomExports = reactDom.exports;
var m = reactDomExports;
{
  client.createRoot = m.createRoot;
  client.hydrateRoot = m.hydrateRoot;
}
/**
 * @remix-run/router v1.23.3
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
function _extends$2() {
  return _extends$2 = Object.assign ? Object.assign.bind() : function(n2) {
    for (var e = 1; e < arguments.length; e++) {
      var t2 = arguments[e];
      for (var r2 in t2) ({}).hasOwnProperty.call(t2, r2) && (n2[r2] = t2[r2]);
    }
    return n2;
  }, _extends$2.apply(null, arguments);
}
var Action;
(function(Action2) {
  Action2["Pop"] = "POP";
  Action2["Push"] = "PUSH";
  Action2["Replace"] = "REPLACE";
})(Action || (Action = {}));
const PopStateEventType = "popstate";
function createBrowserHistory(options) {
  if (options === void 0) {
    options = {};
  }
  function createBrowserLocation(window2, globalHistory) {
    let {
      pathname,
      search,
      hash
    } = window2.location;
    return createLocation(
      "",
      {
        pathname,
        search,
        hash
      },
      // state defaults to `null` because `window.history.state` does
      globalHistory.state && globalHistory.state.usr || null,
      globalHistory.state && globalHistory.state.key || "default"
    );
  }
  function createBrowserHref(window2, to) {
    return typeof to === "string" ? to : createPath(to);
  }
  return getUrlBasedHistory(createBrowserLocation, createBrowserHref, null, options);
}
function invariant(value, message) {
  if (value === false || value === null || typeof value === "undefined") {
    throw new Error(message);
  }
}
function warning(cond, message) {
  if (!cond) {
    if (typeof console !== "undefined") console.warn(message);
    try {
      throw new Error(message);
    } catch (e) {
    }
  }
}
function createKey() {
  return Math.random().toString(36).substr(2, 8);
}
function getHistoryState(location, index) {
  return {
    usr: location.state,
    key: location.key,
    idx: index
  };
}
function createLocation(current, to, state, key) {
  if (state === void 0) {
    state = null;
  }
  let location = _extends$2({
    pathname: typeof current === "string" ? current : current.pathname,
    search: "",
    hash: ""
  }, typeof to === "string" ? parsePath(to) : to, {
    state,
    // TODO: This could be cleaned up.  push/replace should probably just take
    // full Locations now and avoid the need to run through this flow at all
    // But that's a pretty big refactor to the current test suite so going to
    // keep as is for the time being and just let any incoming keys take precedence
    key: to && to.key || key || createKey()
  });
  return location;
}
function createPath(_ref) {
  let {
    pathname = "/",
    search = "",
    hash = ""
  } = _ref;
  if (search && search !== "?") pathname += search.charAt(0) === "?" ? search : "?" + search;
  if (hash && hash !== "#") pathname += hash.charAt(0) === "#" ? hash : "#" + hash;
  return pathname;
}
function parsePath(path) {
  let parsedPath = {};
  if (path) {
    let hashIndex = path.indexOf("#");
    if (hashIndex >= 0) {
      parsedPath.hash = path.substr(hashIndex);
      path = path.substr(0, hashIndex);
    }
    let searchIndex = path.indexOf("?");
    if (searchIndex >= 0) {
      parsedPath.search = path.substr(searchIndex);
      path = path.substr(0, searchIndex);
    }
    if (path) {
      parsedPath.pathname = path;
    }
  }
  return parsedPath;
}
function getUrlBasedHistory(getLocation, createHref, validateLocation, options) {
  if (options === void 0) {
    options = {};
  }
  let {
    window: window2 = document.defaultView,
    v5Compat = false
  } = options;
  let globalHistory = window2.history;
  let action = Action.Pop;
  let listener = null;
  let index = getIndex();
  if (index == null) {
    index = 0;
    globalHistory.replaceState(_extends$2({}, globalHistory.state, {
      idx: index
    }), "");
  }
  function getIndex() {
    let state = globalHistory.state || {
      idx: null
    };
    return state.idx;
  }
  function handlePop() {
    action = Action.Pop;
    let nextIndex = getIndex();
    let delta = nextIndex == null ? null : nextIndex - index;
    index = nextIndex;
    if (listener) {
      listener({
        action,
        location: history.location,
        delta
      });
    }
  }
  function push(to, state) {
    action = Action.Push;
    let location = createLocation(history.location, to, state);
    index = getIndex() + 1;
    let historyState = getHistoryState(location, index);
    let url = history.createHref(location);
    try {
      globalHistory.pushState(historyState, "", url);
    } catch (error) {
      if (error instanceof DOMException && error.name === "DataCloneError") {
        throw error;
      }
      window2.location.assign(url);
    }
    if (v5Compat && listener) {
      listener({
        action,
        location: history.location,
        delta: 1
      });
    }
  }
  function replace(to, state) {
    action = Action.Replace;
    let location = createLocation(history.location, to, state);
    index = getIndex();
    let historyState = getHistoryState(location, index);
    let url = history.createHref(location);
    globalHistory.replaceState(historyState, "", url);
    if (v5Compat && listener) {
      listener({
        action,
        location: history.location,
        delta: 0
      });
    }
  }
  function createURL(to) {
    let base = window2.location.origin !== "null" ? window2.location.origin : window2.location.href;
    let href = typeof to === "string" ? to : createPath(to);
    href = href.replace(/ $/, "%20");
    invariant(base, "No window.location.(origin|href) available to create URL for href: " + href);
    return new URL(href, base);
  }
  let history = {
    get action() {
      return action;
    },
    get location() {
      return getLocation(window2, globalHistory);
    },
    listen(fn) {
      if (listener) {
        throw new Error("A history only accepts one active listener");
      }
      window2.addEventListener(PopStateEventType, handlePop);
      listener = fn;
      return () => {
        window2.removeEventListener(PopStateEventType, handlePop);
        listener = null;
      };
    },
    createHref(to) {
      return createHref(window2, to);
    },
    createURL,
    encodeLocation(to) {
      let url = createURL(to);
      return {
        pathname: url.pathname,
        search: url.search,
        hash: url.hash
      };
    },
    push,
    replace,
    go(n2) {
      return globalHistory.go(n2);
    }
  };
  return history;
}
var ResultType;
(function(ResultType2) {
  ResultType2["data"] = "data";
  ResultType2["deferred"] = "deferred";
  ResultType2["redirect"] = "redirect";
  ResultType2["error"] = "error";
})(ResultType || (ResultType = {}));
function matchRoutes(routes, locationArg, basename) {
  if (basename === void 0) {
    basename = "/";
  }
  return matchRoutesImpl(routes, locationArg, basename);
}
function matchRoutesImpl(routes, locationArg, basename, allowPartial) {
  let location = typeof locationArg === "string" ? parsePath(locationArg) : locationArg;
  let pathname = stripBasename(location.pathname || "/", basename);
  if (pathname == null) {
    return null;
  }
  let branches = flattenRoutes(routes);
  rankRouteBranches(branches);
  let matches = null;
  let decoded = decodePath(pathname);
  for (let i = 0; matches == null && i < branches.length; ++i) {
    matches = matchRouteBranch(branches[i], decoded);
  }
  return matches;
}
function flattenRoutes(routes, branches, parentsMeta, parentPath) {
  if (branches === void 0) {
    branches = [];
  }
  if (parentsMeta === void 0) {
    parentsMeta = [];
  }
  if (parentPath === void 0) {
    parentPath = "";
  }
  let flattenRoute = (route, index, relativePath) => {
    let meta = {
      relativePath: relativePath === void 0 ? route.path || "" : relativePath,
      caseSensitive: route.caseSensitive === true,
      childrenIndex: index,
      route
    };
    if (meta.relativePath.startsWith("/")) {
      invariant(meta.relativePath.startsWith(parentPath), 'Absolute route path "' + meta.relativePath + '" nested under path ' + ('"' + parentPath + '" is not valid. An absolute child route path ') + "must start with the combined path of all its parent routes.");
      meta.relativePath = meta.relativePath.slice(parentPath.length);
    }
    let path = joinPaths([parentPath, meta.relativePath]);
    let routesMeta = parentsMeta.concat(meta);
    if (route.children && route.children.length > 0) {
      invariant(
        // Our types know better, but runtime JS may not!
        // @ts-expect-error
        route.index !== true,
        "Index routes must not have child routes. Please remove " + ('all child routes from route path "' + path + '".')
      );
      flattenRoutes(route.children, branches, routesMeta, path);
    }
    if (route.path == null && !route.index) {
      return;
    }
    branches.push({
      path,
      score: computeScore(path, route.index),
      routesMeta
    });
  };
  routes.forEach((route, index) => {
    var _route$path;
    if (route.path === "" || !((_route$path = route.path) != null && _route$path.includes("?"))) {
      flattenRoute(route, index);
    } else {
      for (let exploded of explodeOptionalSegments(route.path)) {
        flattenRoute(route, index, exploded);
      }
    }
  });
  return branches;
}
function explodeOptionalSegments(path) {
  let segments = path.split("/");
  if (segments.length === 0) return [];
  let [first, ...rest] = segments;
  let isOptional = first.endsWith("?");
  let required = first.replace(/\?$/, "");
  if (rest.length === 0) {
    return isOptional ? [required, ""] : [required];
  }
  let restExploded = explodeOptionalSegments(rest.join("/"));
  let result = [];
  result.push(...restExploded.map((subpath) => subpath === "" ? required : [required, subpath].join("/")));
  if (isOptional) {
    result.push(...restExploded);
  }
  return result.map((exploded) => path.startsWith("/") && exploded === "" ? "/" : exploded);
}
function rankRouteBranches(branches) {
  branches.sort((a, b) => a.score !== b.score ? b.score - a.score : compareIndexes(a.routesMeta.map((meta) => meta.childrenIndex), b.routesMeta.map((meta) => meta.childrenIndex)));
}
const paramRe = /^:[\w-]+$/;
const dynamicSegmentValue = 3;
const indexRouteValue = 2;
const emptySegmentValue = 1;
const staticSegmentValue = 10;
const splatPenalty = -2;
const isSplat = (s) => s === "*";
function computeScore(path, index) {
  let segments = path.split("/");
  let initialScore = segments.length;
  if (segments.some(isSplat)) {
    initialScore += splatPenalty;
  }
  if (index) {
    initialScore += indexRouteValue;
  }
  return segments.filter((s) => !isSplat(s)).reduce((score, segment) => score + (paramRe.test(segment) ? dynamicSegmentValue : segment === "" ? emptySegmentValue : staticSegmentValue), initialScore);
}
function compareIndexes(a, b) {
  let siblings = a.length === b.length && a.slice(0, -1).every((n2, i) => n2 === b[i]);
  return siblings ? (
    // If two routes are siblings, we should try to match the earlier sibling
    // first. This allows people to have fine-grained control over the matching
    // behavior by simply putting routes with identical paths in the order they
    // want them tried.
    a[a.length - 1] - b[b.length - 1]
  ) : (
    // Otherwise, it doesn't really make sense to rank non-siblings by index,
    // so they sort equally.
    0
  );
}
function matchRouteBranch(branch, pathname, allowPartial) {
  let {
    routesMeta
  } = branch;
  let matchedParams = {};
  let matchedPathname = "/";
  let matches = [];
  for (let i = 0; i < routesMeta.length; ++i) {
    let meta = routesMeta[i];
    let end = i === routesMeta.length - 1;
    let remainingPathname = matchedPathname === "/" ? pathname : pathname.slice(matchedPathname.length) || "/";
    let match = matchPath({
      path: meta.relativePath,
      caseSensitive: meta.caseSensitive,
      end
    }, remainingPathname);
    let route = meta.route;
    if (!match) {
      return null;
    }
    Object.assign(matchedParams, match.params);
    matches.push({
      // TODO: Can this as be avoided?
      params: matchedParams,
      pathname: joinPaths([matchedPathname, match.pathname]),
      pathnameBase: normalizePathname(joinPaths([matchedPathname, match.pathnameBase])),
      route
    });
    if (match.pathnameBase !== "/") {
      matchedPathname = joinPaths([matchedPathname, match.pathnameBase]);
    }
  }
  return matches;
}
function matchPath(pattern, pathname) {
  if (typeof pattern === "string") {
    pattern = {
      path: pattern,
      caseSensitive: false,
      end: true
    };
  }
  let [matcher, compiledParams] = compilePath(pattern.path, pattern.caseSensitive, pattern.end);
  let match = pathname.match(matcher);
  if (!match) return null;
  let matchedPathname = match[0];
  let pathnameBase = matchedPathname.replace(/(.)\/+$/, "$1");
  let captureGroups = match.slice(1);
  let params = compiledParams.reduce((memo, _ref, index) => {
    let {
      paramName,
      isOptional
    } = _ref;
    if (paramName === "*") {
      let splatValue = captureGroups[index] || "";
      pathnameBase = matchedPathname.slice(0, matchedPathname.length - splatValue.length).replace(/(.)\/+$/, "$1");
    }
    const value = captureGroups[index];
    if (isOptional && !value) {
      memo[paramName] = void 0;
    } else {
      memo[paramName] = (value || "").replace(/%2F/g, "/");
    }
    return memo;
  }, {});
  return {
    params,
    pathname: matchedPathname,
    pathnameBase,
    pattern
  };
}
function compilePath(path, caseSensitive, end) {
  if (caseSensitive === void 0) {
    caseSensitive = false;
  }
  if (end === void 0) {
    end = true;
  }
  warning(path === "*" || !path.endsWith("*") || path.endsWith("/*"), 'Route path "' + path + '" will be treated as if it were ' + ('"' + path.replace(/\*$/, "/*") + '" because the `*` character must ') + "always follow a `/` in the pattern. To get rid of this warning, " + ('please change the route path to "' + path.replace(/\*$/, "/*") + '".'));
  let params = [];
  let regexpSource = "^" + path.replace(/\/*\*?$/, "").replace(/^\/*/, "/").replace(/[\\.*+^${}|()[\]]/g, "\\$&").replace(/\/:([\w-]+)(\?)?/g, (_, paramName, isOptional) => {
    params.push({
      paramName,
      isOptional: isOptional != null
    });
    return isOptional ? "/?([^\\/]+)?" : "/([^\\/]+)";
  });
  if (path.endsWith("*")) {
    params.push({
      paramName: "*"
    });
    regexpSource += path === "*" || path === "/*" ? "(.*)$" : "(?:\\/(.+)|\\/*)$";
  } else if (end) {
    regexpSource += "\\/*$";
  } else if (path !== "" && path !== "/") {
    regexpSource += "(?:(?=\\/|$))";
  } else ;
  let matcher = new RegExp(regexpSource, caseSensitive ? void 0 : "i");
  return [matcher, params];
}
function decodePath(value) {
  try {
    return value.split("/").map((v2) => decodeURIComponent(v2).replace(/\//g, "%2F")).join("/");
  } catch (error) {
    warning(false, 'The URL path "' + value + '" could not be decoded because it is is a malformed URL segment. This is probably due to a bad percent ' + ("encoding (" + error + ")."));
    return value;
  }
}
function stripBasename(pathname, basename) {
  if (basename === "/") return pathname;
  if (!pathname.toLowerCase().startsWith(basename.toLowerCase())) {
    return null;
  }
  let startIndex = basename.endsWith("/") ? basename.length - 1 : basename.length;
  let nextChar = pathname.charAt(startIndex);
  if (nextChar && nextChar !== "/") {
    return null;
  }
  return pathname.slice(startIndex) || "/";
}
const ABSOLUTE_URL_REGEX$1 = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;
const isAbsoluteUrl = (url) => ABSOLUTE_URL_REGEX$1.test(url);
function resolvePath(to, fromPathname) {
  if (fromPathname === void 0) {
    fromPathname = "/";
  }
  let {
    pathname: toPathname,
    search = "",
    hash = ""
  } = typeof to === "string" ? parsePath(to) : to;
  let pathname;
  if (toPathname) {
    if (isAbsoluteUrl(toPathname)) {
      pathname = toPathname;
    } else {
      if (toPathname.includes("//")) {
        let oldPathname = toPathname;
        toPathname = removeDoubleSlashes(toPathname);
        warning(false, "Pathnames cannot have embedded double slashes - normalizing " + (oldPathname + " -> " + toPathname));
      }
      if (toPathname.startsWith("/")) {
        pathname = resolvePathname(toPathname.substring(1), "/");
      } else {
        pathname = resolvePathname(toPathname, fromPathname);
      }
    }
  } else {
    pathname = fromPathname;
  }
  return {
    pathname,
    search: normalizeSearch(search),
    hash: normalizeHash(hash)
  };
}
function resolvePathname(relativePath, fromPathname) {
  let segments = fromPathname.replace(/\/+$/, "").split("/");
  let relativeSegments = relativePath.split("/");
  relativeSegments.forEach((segment) => {
    if (segment === "..") {
      if (segments.length > 1) segments.pop();
    } else if (segment !== ".") {
      segments.push(segment);
    }
  });
  return segments.length > 1 ? segments.join("/") : "/";
}
function getInvalidPathError(char, field, dest, path) {
  return "Cannot include a '" + char + "' character in a manually specified " + ("`to." + field + "` field [" + JSON.stringify(path) + "].  Please separate it out to the ") + ("`to." + dest + "` field. Alternatively you may provide the full path as ") + 'a string in <Link to="..."> and the router will parse it for you.';
}
function getPathContributingMatches(matches) {
  return matches.filter((match, index) => index === 0 || match.route.path && match.route.path.length > 0);
}
function getResolveToMatches(matches, v7_relativeSplatPath) {
  let pathMatches = getPathContributingMatches(matches);
  if (v7_relativeSplatPath) {
    return pathMatches.map((match, idx) => idx === pathMatches.length - 1 ? match.pathname : match.pathnameBase);
  }
  return pathMatches.map((match) => match.pathnameBase);
}
function resolveTo(toArg, routePathnames, locationPathname, isPathRelative) {
  if (isPathRelative === void 0) {
    isPathRelative = false;
  }
  let to;
  if (typeof toArg === "string") {
    to = parsePath(toArg);
  } else {
    to = _extends$2({}, toArg);
    invariant(!to.pathname || !to.pathname.includes("?"), getInvalidPathError("?", "pathname", "search", to));
    invariant(!to.pathname || !to.pathname.includes("#"), getInvalidPathError("#", "pathname", "hash", to));
    invariant(!to.search || !to.search.includes("#"), getInvalidPathError("#", "search", "hash", to));
  }
  let isEmptyPath = toArg === "" || to.pathname === "";
  let toPathname = isEmptyPath ? "/" : to.pathname;
  let from;
  if (toPathname == null) {
    from = locationPathname;
  } else {
    let routePathnameIndex = routePathnames.length - 1;
    if (!isPathRelative && toPathname.startsWith("..")) {
      let toSegments = toPathname.split("/");
      while (toSegments[0] === "..") {
        toSegments.shift();
        routePathnameIndex -= 1;
      }
      to.pathname = toSegments.join("/");
    }
    from = routePathnameIndex >= 0 ? routePathnames[routePathnameIndex] : "/";
  }
  let path = resolvePath(to, from);
  let hasExplicitTrailingSlash = toPathname && toPathname !== "/" && toPathname.endsWith("/");
  let hasCurrentTrailingSlash = (isEmptyPath || toPathname === ".") && locationPathname.endsWith("/");
  if (!path.pathname.endsWith("/") && (hasExplicitTrailingSlash || hasCurrentTrailingSlash)) {
    path.pathname += "/";
  }
  return path;
}
const removeDoubleSlashes = (path) => path.replace(/\/\/+/g, "/");
const joinPaths = (paths) => removeDoubleSlashes(paths.join("/"));
const normalizePathname = (pathname) => pathname.replace(/\/+$/, "").replace(/^\/*/, "/");
const normalizeSearch = (search) => !search || search === "?" ? "" : search.startsWith("?") ? search : "?" + search;
const normalizeHash = (hash) => !hash || hash === "#" ? "" : hash.startsWith("#") ? hash : "#" + hash;
function isRouteErrorResponse(error) {
  return error != null && typeof error.status === "number" && typeof error.statusText === "string" && typeof error.internal === "boolean" && "data" in error;
}
const validMutationMethodsArr = ["post", "put", "patch", "delete"];
new Set(validMutationMethodsArr);
const validRequestMethodsArr = ["get", ...validMutationMethodsArr];
new Set(validRequestMethodsArr);
/**
 * React Router v6.30.4
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
function _extends$1() {
  return _extends$1 = Object.assign ? Object.assign.bind() : function(n2) {
    for (var e = 1; e < arguments.length; e++) {
      var t2 = arguments[e];
      for (var r2 in t2) ({}).hasOwnProperty.call(t2, r2) && (n2[r2] = t2[r2]);
    }
    return n2;
  }, _extends$1.apply(null, arguments);
}
const DataRouterContext = /* @__PURE__ */ reactExports.createContext(null);
const DataRouterStateContext = /* @__PURE__ */ reactExports.createContext(null);
const NavigationContext = /* @__PURE__ */ reactExports.createContext(null);
const LocationContext = /* @__PURE__ */ reactExports.createContext(null);
const RouteContext = /* @__PURE__ */ reactExports.createContext({
  outlet: null,
  matches: [],
  isDataRoute: false
});
const RouteErrorContext = /* @__PURE__ */ reactExports.createContext(null);
function useHref(to, _temp) {
  let {
    relative
  } = _temp === void 0 ? {} : _temp;
  !useInRouterContext() ? invariant(false) : void 0;
  let {
    basename,
    navigator: navigator2
  } = reactExports.useContext(NavigationContext);
  let {
    hash,
    pathname,
    search
  } = useResolvedPath(to, {
    relative
  });
  let joinedPathname = pathname;
  if (basename !== "/") {
    joinedPathname = pathname === "/" ? basename : joinPaths([basename, pathname]);
  }
  return navigator2.createHref({
    pathname: joinedPathname,
    search,
    hash
  });
}
function useInRouterContext() {
  return reactExports.useContext(LocationContext) != null;
}
function useLocation() {
  !useInRouterContext() ? invariant(false) : void 0;
  return reactExports.useContext(LocationContext).location;
}
function useIsomorphicLayoutEffect(cb2) {
  let isStatic = reactExports.useContext(NavigationContext).static;
  if (!isStatic) {
    reactExports.useLayoutEffect(cb2);
  }
}
function useNavigate() {
  let {
    isDataRoute
  } = reactExports.useContext(RouteContext);
  return isDataRoute ? useNavigateStable() : useNavigateUnstable();
}
function useNavigateUnstable() {
  !useInRouterContext() ? invariant(false) : void 0;
  let dataRouterContext = reactExports.useContext(DataRouterContext);
  let {
    basename,
    future,
    navigator: navigator2
  } = reactExports.useContext(NavigationContext);
  let {
    matches
  } = reactExports.useContext(RouteContext);
  let {
    pathname: locationPathname
  } = useLocation();
  let routePathnamesJson = JSON.stringify(getResolveToMatches(matches, future.v7_relativeSplatPath));
  let activeRef = reactExports.useRef(false);
  useIsomorphicLayoutEffect(() => {
    activeRef.current = true;
  });
  let navigate = reactExports.useCallback(function(to, options) {
    if (options === void 0) {
      options = {};
    }
    if (!activeRef.current) return;
    if (typeof to === "number") {
      navigator2.go(to);
      return;
    }
    let path = resolveTo(to, JSON.parse(routePathnamesJson), locationPathname, options.relative === "path");
    if (dataRouterContext == null && basename !== "/") {
      path.pathname = path.pathname === "/" ? basename : joinPaths([basename, path.pathname]);
    }
    (!!options.replace ? navigator2.replace : navigator2.push)(path, options.state, options);
  }, [basename, navigator2, routePathnamesJson, locationPathname, dataRouterContext]);
  return navigate;
}
function useParams() {
  let {
    matches
  } = reactExports.useContext(RouteContext);
  let routeMatch = matches[matches.length - 1];
  return routeMatch ? routeMatch.params : {};
}
function useResolvedPath(to, _temp2) {
  let {
    relative
  } = _temp2 === void 0 ? {} : _temp2;
  let {
    future
  } = reactExports.useContext(NavigationContext);
  let {
    matches
  } = reactExports.useContext(RouteContext);
  let {
    pathname: locationPathname
  } = useLocation();
  let routePathnamesJson = JSON.stringify(getResolveToMatches(matches, future.v7_relativeSplatPath));
  return reactExports.useMemo(() => resolveTo(to, JSON.parse(routePathnamesJson), locationPathname, relative === "path"), [to, routePathnamesJson, locationPathname, relative]);
}
function useRoutes(routes, locationArg) {
  return useRoutesImpl(routes, locationArg);
}
function useRoutesImpl(routes, locationArg, dataRouterState, future) {
  !useInRouterContext() ? invariant(false) : void 0;
  let {
    navigator: navigator2
  } = reactExports.useContext(NavigationContext);
  let {
    matches: parentMatches
  } = reactExports.useContext(RouteContext);
  let routeMatch = parentMatches[parentMatches.length - 1];
  let parentParams = routeMatch ? routeMatch.params : {};
  routeMatch ? routeMatch.pathname : "/";
  let parentPathnameBase = routeMatch ? routeMatch.pathnameBase : "/";
  routeMatch && routeMatch.route;
  let locationFromContext = useLocation();
  let location;
  if (locationArg) {
    var _parsedLocationArg$pa;
    let parsedLocationArg = typeof locationArg === "string" ? parsePath(locationArg) : locationArg;
    !(parentPathnameBase === "/" || ((_parsedLocationArg$pa = parsedLocationArg.pathname) == null ? void 0 : _parsedLocationArg$pa.startsWith(parentPathnameBase))) ? invariant(false) : void 0;
    location = parsedLocationArg;
  } else {
    location = locationFromContext;
  }
  let pathname = location.pathname || "/";
  let remainingPathname = pathname;
  if (parentPathnameBase !== "/") {
    let parentSegments = parentPathnameBase.replace(/^\//, "").split("/");
    let segments = pathname.replace(/^\//, "").split("/");
    remainingPathname = "/" + segments.slice(parentSegments.length).join("/");
  }
  let matches = matchRoutes(routes, {
    pathname: remainingPathname
  });
  let renderedMatches = _renderMatches(matches && matches.map((match) => Object.assign({}, match, {
    params: Object.assign({}, parentParams, match.params),
    pathname: joinPaths([
      parentPathnameBase,
      // Re-encode pathnames that were decoded inside matchRoutes
      navigator2.encodeLocation ? navigator2.encodeLocation(match.pathname).pathname : match.pathname
    ]),
    pathnameBase: match.pathnameBase === "/" ? parentPathnameBase : joinPaths([
      parentPathnameBase,
      // Re-encode pathnames that were decoded inside matchRoutes
      navigator2.encodeLocation ? navigator2.encodeLocation(match.pathnameBase).pathname : match.pathnameBase
    ])
  })), parentMatches, dataRouterState, future);
  if (locationArg && renderedMatches) {
    return /* @__PURE__ */ reactExports.createElement(LocationContext.Provider, {
      value: {
        location: _extends$1({
          pathname: "/",
          search: "",
          hash: "",
          state: null,
          key: "default"
        }, location),
        navigationType: Action.Pop
      }
    }, renderedMatches);
  }
  return renderedMatches;
}
function DefaultErrorComponent() {
  let error = useRouteError();
  let message = isRouteErrorResponse(error) ? error.status + " " + error.statusText : error instanceof Error ? error.message : JSON.stringify(error);
  let stack = error instanceof Error ? error.stack : null;
  let lightgrey = "rgba(200,200,200, 0.5)";
  let preStyles = {
    padding: "0.5rem",
    backgroundColor: lightgrey
  };
  let devInfo = null;
  return /* @__PURE__ */ reactExports.createElement(reactExports.Fragment, null, /* @__PURE__ */ reactExports.createElement("h2", null, "Unexpected Application Error!"), /* @__PURE__ */ reactExports.createElement("h3", {
    style: {
      fontStyle: "italic"
    }
  }, message), stack ? /* @__PURE__ */ reactExports.createElement("pre", {
    style: preStyles
  }, stack) : null, devInfo);
}
const defaultErrorElement = /* @__PURE__ */ reactExports.createElement(DefaultErrorComponent, null);
class RenderErrorBoundary extends reactExports.Component {
  constructor(props) {
    super(props);
    this.state = {
      location: props.location,
      revalidation: props.revalidation,
      error: props.error
    };
  }
  static getDerivedStateFromError(error) {
    return {
      error
    };
  }
  static getDerivedStateFromProps(props, state) {
    if (state.location !== props.location || state.revalidation !== "idle" && props.revalidation === "idle") {
      return {
        error: props.error,
        location: props.location,
        revalidation: props.revalidation
      };
    }
    return {
      error: props.error !== void 0 ? props.error : state.error,
      location: state.location,
      revalidation: props.revalidation || state.revalidation
    };
  }
  componentDidCatch(error, errorInfo) {
    console.error("React Router caught the following error during render", error, errorInfo);
  }
  render() {
    return this.state.error !== void 0 ? /* @__PURE__ */ reactExports.createElement(RouteContext.Provider, {
      value: this.props.routeContext
    }, /* @__PURE__ */ reactExports.createElement(RouteErrorContext.Provider, {
      value: this.state.error,
      children: this.props.component
    })) : this.props.children;
  }
}
function RenderedRoute(_ref) {
  let {
    routeContext,
    match,
    children
  } = _ref;
  let dataRouterContext = reactExports.useContext(DataRouterContext);
  if (dataRouterContext && dataRouterContext.static && dataRouterContext.staticContext && (match.route.errorElement || match.route.ErrorBoundary)) {
    dataRouterContext.staticContext._deepestRenderedBoundaryId = match.route.id;
  }
  return /* @__PURE__ */ reactExports.createElement(RouteContext.Provider, {
    value: routeContext
  }, children);
}
function _renderMatches(matches, parentMatches, dataRouterState, future) {
  var _dataRouterState;
  if (parentMatches === void 0) {
    parentMatches = [];
  }
  if (dataRouterState === void 0) {
    dataRouterState = null;
  }
  if (future === void 0) {
    future = null;
  }
  if (matches == null) {
    var _future;
    if (!dataRouterState) {
      return null;
    }
    if (dataRouterState.errors) {
      matches = dataRouterState.matches;
    } else if ((_future = future) != null && _future.v7_partialHydration && parentMatches.length === 0 && !dataRouterState.initialized && dataRouterState.matches.length > 0) {
      matches = dataRouterState.matches;
    } else {
      return null;
    }
  }
  let renderedMatches = matches;
  let errors = (_dataRouterState = dataRouterState) == null ? void 0 : _dataRouterState.errors;
  if (errors != null) {
    let errorIndex = renderedMatches.findIndex((m2) => m2.route.id && (errors == null ? void 0 : errors[m2.route.id]) !== void 0);
    !(errorIndex >= 0) ? invariant(false) : void 0;
    renderedMatches = renderedMatches.slice(0, Math.min(renderedMatches.length, errorIndex + 1));
  }
  let renderFallback = false;
  let fallbackIndex = -1;
  if (dataRouterState && future && future.v7_partialHydration) {
    for (let i = 0; i < renderedMatches.length; i++) {
      let match = renderedMatches[i];
      if (match.route.HydrateFallback || match.route.hydrateFallbackElement) {
        fallbackIndex = i;
      }
      if (match.route.id) {
        let {
          loaderData,
          errors: errors2
        } = dataRouterState;
        let needsToRunLoader = match.route.loader && loaderData[match.route.id] === void 0 && (!errors2 || errors2[match.route.id] === void 0);
        if (match.route.lazy || needsToRunLoader) {
          renderFallback = true;
          if (fallbackIndex >= 0) {
            renderedMatches = renderedMatches.slice(0, fallbackIndex + 1);
          } else {
            renderedMatches = [renderedMatches[0]];
          }
          break;
        }
      }
    }
  }
  return renderedMatches.reduceRight((outlet, match, index) => {
    let error;
    let shouldRenderHydrateFallback = false;
    let errorElement = null;
    let hydrateFallbackElement = null;
    if (dataRouterState) {
      error = errors && match.route.id ? errors[match.route.id] : void 0;
      errorElement = match.route.errorElement || defaultErrorElement;
      if (renderFallback) {
        if (fallbackIndex < 0 && index === 0) {
          warningOnce("route-fallback");
          shouldRenderHydrateFallback = true;
          hydrateFallbackElement = null;
        } else if (fallbackIndex === index) {
          shouldRenderHydrateFallback = true;
          hydrateFallbackElement = match.route.hydrateFallbackElement || null;
        }
      }
    }
    let matches2 = parentMatches.concat(renderedMatches.slice(0, index + 1));
    let getChildren = () => {
      let children;
      if (error) {
        children = errorElement;
      } else if (shouldRenderHydrateFallback) {
        children = hydrateFallbackElement;
      } else if (match.route.Component) {
        children = /* @__PURE__ */ reactExports.createElement(match.route.Component, null);
      } else if (match.route.element) {
        children = match.route.element;
      } else {
        children = outlet;
      }
      return /* @__PURE__ */ reactExports.createElement(RenderedRoute, {
        match,
        routeContext: {
          outlet,
          matches: matches2,
          isDataRoute: dataRouterState != null
        },
        children
      });
    };
    return dataRouterState && (match.route.ErrorBoundary || match.route.errorElement || index === 0) ? /* @__PURE__ */ reactExports.createElement(RenderErrorBoundary, {
      location: dataRouterState.location,
      revalidation: dataRouterState.revalidation,
      component: errorElement,
      error,
      children: getChildren(),
      routeContext: {
        outlet: null,
        matches: matches2,
        isDataRoute: true
      }
    }) : getChildren();
  }, null);
}
var DataRouterHook$1 = /* @__PURE__ */ function(DataRouterHook2) {
  DataRouterHook2["UseBlocker"] = "useBlocker";
  DataRouterHook2["UseRevalidator"] = "useRevalidator";
  DataRouterHook2["UseNavigateStable"] = "useNavigate";
  return DataRouterHook2;
}(DataRouterHook$1 || {});
var DataRouterStateHook$1 = /* @__PURE__ */ function(DataRouterStateHook2) {
  DataRouterStateHook2["UseBlocker"] = "useBlocker";
  DataRouterStateHook2["UseLoaderData"] = "useLoaderData";
  DataRouterStateHook2["UseActionData"] = "useActionData";
  DataRouterStateHook2["UseRouteError"] = "useRouteError";
  DataRouterStateHook2["UseNavigation"] = "useNavigation";
  DataRouterStateHook2["UseRouteLoaderData"] = "useRouteLoaderData";
  DataRouterStateHook2["UseMatches"] = "useMatches";
  DataRouterStateHook2["UseRevalidator"] = "useRevalidator";
  DataRouterStateHook2["UseNavigateStable"] = "useNavigate";
  DataRouterStateHook2["UseRouteId"] = "useRouteId";
  return DataRouterStateHook2;
}(DataRouterStateHook$1 || {});
function useDataRouterContext$1(hookName) {
  let ctx = reactExports.useContext(DataRouterContext);
  !ctx ? invariant(false) : void 0;
  return ctx;
}
function useDataRouterState(hookName) {
  let state = reactExports.useContext(DataRouterStateContext);
  !state ? invariant(false) : void 0;
  return state;
}
function useRouteContext(hookName) {
  let route = reactExports.useContext(RouteContext);
  !route ? invariant(false) : void 0;
  return route;
}
function useCurrentRouteId(hookName) {
  let route = useRouteContext();
  let thisRoute = route.matches[route.matches.length - 1];
  !thisRoute.route.id ? invariant(false) : void 0;
  return thisRoute.route.id;
}
function useRouteError() {
  var _state$errors;
  let error = reactExports.useContext(RouteErrorContext);
  let state = useDataRouterState();
  let routeId = useCurrentRouteId();
  if (error !== void 0) {
    return error;
  }
  return (_state$errors = state.errors) == null ? void 0 : _state$errors[routeId];
}
function useNavigateStable() {
  let {
    router
  } = useDataRouterContext$1(DataRouterHook$1.UseNavigateStable);
  let id2 = useCurrentRouteId(DataRouterStateHook$1.UseNavigateStable);
  let activeRef = reactExports.useRef(false);
  useIsomorphicLayoutEffect(() => {
    activeRef.current = true;
  });
  let navigate = reactExports.useCallback(function(to, options) {
    if (options === void 0) {
      options = {};
    }
    if (!activeRef.current) return;
    if (typeof to === "number") {
      router.navigate(to);
    } else {
      router.navigate(to, _extends$1({
        fromRouteId: id2
      }, options));
    }
  }, [router, id2]);
  return navigate;
}
const alreadyWarned$1 = {};
function warningOnce(key, cond, message) {
  if (!alreadyWarned$1[key]) {
    alreadyWarned$1[key] = true;
  }
}
function logV6DeprecationWarnings(renderFuture, routerFuture) {
  if ((renderFuture == null ? void 0 : renderFuture.v7_startTransition) === void 0) ;
  if ((renderFuture == null ? void 0 : renderFuture.v7_relativeSplatPath) === void 0 && true) ;
}
function Navigate(_ref4) {
  let {
    to,
    replace: replace2,
    state,
    relative
  } = _ref4;
  !useInRouterContext() ? invariant(false) : void 0;
  let {
    future,
    static: isStatic
  } = reactExports.useContext(NavigationContext);
  let {
    matches
  } = reactExports.useContext(RouteContext);
  let {
    pathname: locationPathname
  } = useLocation();
  let navigate = useNavigate();
  let path = resolveTo(to, getResolveToMatches(matches, future.v7_relativeSplatPath), locationPathname, relative === "path");
  let jsonPath = JSON.stringify(path);
  reactExports.useEffect(() => navigate(JSON.parse(jsonPath), {
    replace: replace2,
    state,
    relative
  }), [navigate, jsonPath, relative, replace2, state]);
  return null;
}
function Route(_props) {
  invariant(false);
}
function Router(_ref5) {
  let {
    basename: basenameProp = "/",
    children = null,
    location: locationProp,
    navigationType = Action.Pop,
    navigator: navigator2,
    static: staticProp = false,
    future
  } = _ref5;
  !!useInRouterContext() ? invariant(false) : void 0;
  let basename = basenameProp.replace(/^\/*/, "/");
  let navigationContext = reactExports.useMemo(() => ({
    basename,
    navigator: navigator2,
    static: staticProp,
    future: _extends$1({
      v7_relativeSplatPath: false
    }, future)
  }), [basename, future, navigator2, staticProp]);
  if (typeof locationProp === "string") {
    locationProp = parsePath(locationProp);
  }
  let {
    pathname = "/",
    search = "",
    hash = "",
    state = null,
    key = "default"
  } = locationProp;
  let locationContext = reactExports.useMemo(() => {
    let trailingPathname = stripBasename(pathname, basename);
    if (trailingPathname == null) {
      return null;
    }
    return {
      location: {
        pathname: trailingPathname,
        search,
        hash,
        state,
        key
      },
      navigationType
    };
  }, [basename, pathname, search, hash, state, key, navigationType]);
  if (locationContext == null) {
    return null;
  }
  return /* @__PURE__ */ reactExports.createElement(NavigationContext.Provider, {
    value: navigationContext
  }, /* @__PURE__ */ reactExports.createElement(LocationContext.Provider, {
    children,
    value: locationContext
  }));
}
function Routes(_ref6) {
  let {
    children,
    location
  } = _ref6;
  return useRoutes(createRoutesFromChildren(children), location);
}
new Promise(() => {
});
function createRoutesFromChildren(children, parentPath) {
  if (parentPath === void 0) {
    parentPath = [];
  }
  let routes = [];
  reactExports.Children.forEach(children, (element, index) => {
    if (!/* @__PURE__ */ reactExports.isValidElement(element)) {
      return;
    }
    let treePath = [...parentPath, index];
    if (element.type === reactExports.Fragment) {
      routes.push.apply(routes, createRoutesFromChildren(element.props.children, treePath));
      return;
    }
    !(element.type === Route) ? invariant(false) : void 0;
    !(!element.props.index || !element.props.children) ? invariant(false) : void 0;
    let route = {
      id: element.props.id || treePath.join("-"),
      caseSensitive: element.props.caseSensitive,
      element: element.props.element,
      Component: element.props.Component,
      index: element.props.index,
      path: element.props.path,
      loader: element.props.loader,
      action: element.props.action,
      errorElement: element.props.errorElement,
      ErrorBoundary: element.props.ErrorBoundary,
      hasErrorBoundary: element.props.ErrorBoundary != null || element.props.errorElement != null,
      shouldRevalidate: element.props.shouldRevalidate,
      handle: element.props.handle,
      lazy: element.props.lazy
    };
    if (element.props.children) {
      route.children = createRoutesFromChildren(element.props.children, treePath);
    }
    routes.push(route);
  });
  return routes;
}
/**
 * React Router DOM v6.30.4
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
function _extends() {
  return _extends = Object.assign ? Object.assign.bind() : function(n2) {
    for (var e = 1; e < arguments.length; e++) {
      var t2 = arguments[e];
      for (var r2 in t2) ({}).hasOwnProperty.call(t2, r2) && (n2[r2] = t2[r2]);
    }
    return n2;
  }, _extends.apply(null, arguments);
}
function _objectWithoutPropertiesLoose(r2, e) {
  if (null == r2) return {};
  var t2 = {};
  for (var n2 in r2) if ({}.hasOwnProperty.call(r2, n2)) {
    if (-1 !== e.indexOf(n2)) continue;
    t2[n2] = r2[n2];
  }
  return t2;
}
function isModifiedEvent(event) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
}
function shouldProcessLinkClick(event, target) {
  return event.button === 0 && // Ignore everything but left clicks
  (!target || target === "_self") && // Let browser handle "target=_blank" etc.
  !isModifiedEvent(event);
}
function createSearchParams(init) {
  if (init === void 0) {
    init = "";
  }
  return new URLSearchParams(typeof init === "string" || Array.isArray(init) || init instanceof URLSearchParams ? init : Object.keys(init).reduce((memo, key) => {
    let value = init[key];
    return memo.concat(Array.isArray(value) ? value.map((v2) => [key, v2]) : [[key, value]]);
  }, []));
}
function getSearchParamsForLocation(locationSearch, defaultSearchParams) {
  let searchParams = createSearchParams(locationSearch);
  if (defaultSearchParams) {
    defaultSearchParams.forEach((_, key) => {
      if (!searchParams.has(key)) {
        defaultSearchParams.getAll(key).forEach((value) => {
          searchParams.append(key, value);
        });
      }
    });
  }
  return searchParams;
}
const _excluded = ["onClick", "relative", "reloadDocument", "replace", "state", "target", "to", "preventScrollReset", "viewTransition"], _excluded2 = ["aria-current", "caseSensitive", "className", "end", "style", "to", "viewTransition", "children"];
const REACT_ROUTER_VERSION = "6";
try {
  window.__reactRouterVersion = REACT_ROUTER_VERSION;
} catch (e) {
}
const ViewTransitionContext = /* @__PURE__ */ reactExports.createContext({
  isTransitioning: false
});
const START_TRANSITION = "startTransition";
const startTransitionImpl = React$3[START_TRANSITION];
function BrowserRouter(_ref4) {
  let {
    basename,
    children,
    future,
    window: window2
  } = _ref4;
  let historyRef = reactExports.useRef();
  if (historyRef.current == null) {
    historyRef.current = createBrowserHistory({
      window: window2,
      v5Compat: true
    });
  }
  let history = historyRef.current;
  let [state, setStateImpl] = reactExports.useState({
    action: history.action,
    location: history.location
  });
  let {
    v7_startTransition
  } = future || {};
  let setState = reactExports.useCallback((newState) => {
    v7_startTransition && startTransitionImpl ? startTransitionImpl(() => setStateImpl(newState)) : setStateImpl(newState);
  }, [setStateImpl, v7_startTransition]);
  reactExports.useLayoutEffect(() => history.listen(setState), [history, setState]);
  reactExports.useEffect(() => logV6DeprecationWarnings(future), [future]);
  return /* @__PURE__ */ reactExports.createElement(Router, {
    basename,
    children,
    location: state.location,
    navigationType: state.action,
    navigator: history,
    future
  });
}
const isBrowser = typeof window !== "undefined" && typeof window.document !== "undefined" && typeof window.document.createElement !== "undefined";
const ABSOLUTE_URL_REGEX = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;
const Link = /* @__PURE__ */ reactExports.forwardRef(function LinkWithRef(_ref7, ref) {
  let {
    onClick,
    relative,
    reloadDocument,
    replace: replace2,
    state,
    target,
    to,
    preventScrollReset,
    viewTransition
  } = _ref7, rest = _objectWithoutPropertiesLoose(_ref7, _excluded);
  let {
    basename
  } = reactExports.useContext(NavigationContext);
  let absoluteHref;
  let isExternal = false;
  if (typeof to === "string" && ABSOLUTE_URL_REGEX.test(to)) {
    absoluteHref = to;
    if (isBrowser) {
      try {
        let currentUrl = new URL(window.location.href);
        let targetUrl = to.startsWith("//") ? new URL(currentUrl.protocol + to) : new URL(to);
        let path = stripBasename(targetUrl.pathname, basename);
        if (targetUrl.origin === currentUrl.origin && path != null) {
          to = path + targetUrl.search + targetUrl.hash;
        } else {
          isExternal = true;
        }
      } catch (e) {
      }
    }
  }
  let href = useHref(to, {
    relative
  });
  let internalOnClick = useLinkClickHandler(to, {
    replace: replace2,
    state,
    target,
    preventScrollReset,
    relative,
    viewTransition
  });
  function handleClick(event) {
    if (onClick) onClick(event);
    if (!event.defaultPrevented) {
      internalOnClick(event);
    }
  }
  return (
    // eslint-disable-next-line jsx-a11y/anchor-has-content
    /* @__PURE__ */ reactExports.createElement("a", _extends({}, rest, {
      href: absoluteHref || href,
      onClick: isExternal || reloadDocument ? onClick : handleClick,
      ref,
      target
    }))
  );
});
const NavLink = /* @__PURE__ */ reactExports.forwardRef(function NavLinkWithRef(_ref8, ref) {
  let {
    "aria-current": ariaCurrentProp = "page",
    caseSensitive = false,
    className: classNameProp = "",
    end = false,
    style: styleProp,
    to,
    viewTransition,
    children
  } = _ref8, rest = _objectWithoutPropertiesLoose(_ref8, _excluded2);
  let path = useResolvedPath(to, {
    relative: rest.relative
  });
  let location = useLocation();
  let routerState = reactExports.useContext(DataRouterStateContext);
  let {
    navigator: navigator2,
    basename
  } = reactExports.useContext(NavigationContext);
  let isTransitioning = routerState != null && // Conditional usage is OK here because the usage of a data router is static
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useViewTransitionState(path) && viewTransition === true;
  let toPathname = navigator2.encodeLocation ? navigator2.encodeLocation(path).pathname : path.pathname;
  let locationPathname = location.pathname;
  let nextLocationPathname = routerState && routerState.navigation && routerState.navigation.location ? routerState.navigation.location.pathname : null;
  if (!caseSensitive) {
    locationPathname = locationPathname.toLowerCase();
    nextLocationPathname = nextLocationPathname ? nextLocationPathname.toLowerCase() : null;
    toPathname = toPathname.toLowerCase();
  }
  if (nextLocationPathname && basename) {
    nextLocationPathname = stripBasename(nextLocationPathname, basename) || nextLocationPathname;
  }
  const endSlashPosition = toPathname !== "/" && toPathname.endsWith("/") ? toPathname.length - 1 : toPathname.length;
  let isActive = locationPathname === toPathname || !end && locationPathname.startsWith(toPathname) && locationPathname.charAt(endSlashPosition) === "/";
  let isPending = nextLocationPathname != null && (nextLocationPathname === toPathname || !end && nextLocationPathname.startsWith(toPathname) && nextLocationPathname.charAt(toPathname.length) === "/");
  let renderProps = {
    isActive,
    isPending,
    isTransitioning
  };
  let ariaCurrent = isActive ? ariaCurrentProp : void 0;
  let className;
  if (typeof classNameProp === "function") {
    className = classNameProp(renderProps);
  } else {
    className = [classNameProp, isActive ? "active" : null, isPending ? "pending" : null, isTransitioning ? "transitioning" : null].filter(Boolean).join(" ");
  }
  let style = typeof styleProp === "function" ? styleProp(renderProps) : styleProp;
  return /* @__PURE__ */ reactExports.createElement(Link, _extends({}, rest, {
    "aria-current": ariaCurrent,
    className,
    ref,
    style,
    to,
    viewTransition
  }), typeof children === "function" ? children(renderProps) : children);
});
var DataRouterHook;
(function(DataRouterHook2) {
  DataRouterHook2["UseScrollRestoration"] = "useScrollRestoration";
  DataRouterHook2["UseSubmit"] = "useSubmit";
  DataRouterHook2["UseSubmitFetcher"] = "useSubmitFetcher";
  DataRouterHook2["UseFetcher"] = "useFetcher";
  DataRouterHook2["useViewTransitionState"] = "useViewTransitionState";
})(DataRouterHook || (DataRouterHook = {}));
var DataRouterStateHook;
(function(DataRouterStateHook2) {
  DataRouterStateHook2["UseFetcher"] = "useFetcher";
  DataRouterStateHook2["UseFetchers"] = "useFetchers";
  DataRouterStateHook2["UseScrollRestoration"] = "useScrollRestoration";
})(DataRouterStateHook || (DataRouterStateHook = {}));
function useDataRouterContext(hookName) {
  let ctx = reactExports.useContext(DataRouterContext);
  !ctx ? invariant(false) : void 0;
  return ctx;
}
function useLinkClickHandler(to, _temp) {
  let {
    target,
    replace: replaceProp,
    state,
    preventScrollReset,
    relative,
    viewTransition
  } = _temp === void 0 ? {} : _temp;
  let navigate = useNavigate();
  let location = useLocation();
  let path = useResolvedPath(to, {
    relative
  });
  return reactExports.useCallback((event) => {
    if (shouldProcessLinkClick(event, target)) {
      event.preventDefault();
      let replace2 = replaceProp !== void 0 ? replaceProp : createPath(location) === createPath(path);
      navigate(to, {
        replace: replace2,
        state,
        preventScrollReset,
        relative,
        viewTransition
      });
    }
  }, [location, navigate, path, replaceProp, state, target, to, preventScrollReset, relative, viewTransition]);
}
function useSearchParams(defaultInit) {
  let defaultSearchParamsRef = reactExports.useRef(createSearchParams(defaultInit));
  let hasSetSearchParamsRef = reactExports.useRef(false);
  let location = useLocation();
  let searchParams = reactExports.useMemo(() => (
    // Only merge in the defaults if we haven't yet called setSearchParams.
    // Once we call that we want those to take precedence, otherwise you can't
    // remove a param with setSearchParams({}) if it has an initial value
    getSearchParamsForLocation(location.search, hasSetSearchParamsRef.current ? null : defaultSearchParamsRef.current)
  ), [location.search]);
  let navigate = useNavigate();
  let setSearchParams = reactExports.useCallback((nextInit, navigateOptions) => {
    const newSearchParams = createSearchParams(typeof nextInit === "function" ? nextInit(searchParams) : nextInit);
    hasSetSearchParamsRef.current = true;
    navigate("?" + newSearchParams, navigateOptions);
  }, [navigate, searchParams]);
  return [searchParams, setSearchParams];
}
function useViewTransitionState(to, opts) {
  if (opts === void 0) {
    opts = {};
  }
  let vtContext = reactExports.useContext(ViewTransitionContext);
  !(vtContext != null) ? invariant(false) : void 0;
  let {
    basename
  } = useDataRouterContext(DataRouterHook.useViewTransitionState);
  let path = useResolvedPath(to, {
    relative: opts.relative
  });
  if (!vtContext.isTransitioning) {
    return false;
  }
  let currentPath = stripBasename(vtContext.currentLocation.pathname, basename) || vtContext.currentLocation.pathname;
  let nextPath = stripBasename(vtContext.nextLocation.pathname, basename) || vtContext.nextLocation.pathname;
  return matchPath(path.pathname, nextPath) != null || matchPath(path.pathname, currentPath) != null;
}
const __vite_import_meta_env__$2 = {};
const createStoreImpl = (createState) => {
  let state;
  const listeners = /* @__PURE__ */ new Set();
  const setState = (partial, replace) => {
    const nextState = typeof partial === "function" ? partial(state) : partial;
    if (!Object.is(nextState, state)) {
      const previousState = state;
      state = (replace != null ? replace : typeof nextState !== "object" || nextState === null) ? nextState : Object.assign({}, state, nextState);
      listeners.forEach((listener) => listener(state, previousState));
    }
  };
  const getState = () => state;
  const getInitialState = () => initialState;
  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };
  const destroy = () => {
    if ((__vite_import_meta_env__$2 ? "production" : void 0) !== "production") {
      console.warn(
        "[DEPRECATED] The `destroy` method will be unsupported in a future version. Instead use unsubscribe function returned by subscribe. Everything will be garbage-collected if store is garbage-collected."
      );
    }
    listeners.clear();
  };
  const api2 = { setState, getState, getInitialState, subscribe, destroy };
  const initialState = state = createState(setState, getState, api2);
  return api2;
};
const createStore = (createState) => createState ? createStoreImpl(createState) : createStoreImpl;
var withSelector = { exports: {} };
var withSelector_production = {};
var shim$2 = { exports: {} };
var useSyncExternalStoreShim_production = {};
/**
 * @license React
 * use-sync-external-store-shim.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var React$1 = reactExports;
function is$1(x2, y2) {
  return x2 === y2 && (0 !== x2 || 1 / x2 === 1 / y2) || x2 !== x2 && y2 !== y2;
}
var objectIs$1 = "function" === typeof Object.is ? Object.is : is$1, useState = React$1.useState, useEffect$1 = React$1.useEffect, useLayoutEffect = React$1.useLayoutEffect, useDebugValue$2 = React$1.useDebugValue;
function useSyncExternalStore$2(subscribe, getSnapshot) {
  var value = getSnapshot(), _useState = useState({ inst: { value, getSnapshot } }), inst = _useState[0].inst, forceUpdate = _useState[1];
  useLayoutEffect(
    function() {
      inst.value = value;
      inst.getSnapshot = getSnapshot;
      checkIfSnapshotChanged(inst) && forceUpdate({ inst });
    },
    [subscribe, value, getSnapshot]
  );
  useEffect$1(
    function() {
      checkIfSnapshotChanged(inst) && forceUpdate({ inst });
      return subscribe(function() {
        checkIfSnapshotChanged(inst) && forceUpdate({ inst });
      });
    },
    [subscribe]
  );
  useDebugValue$2(value);
  return value;
}
function checkIfSnapshotChanged(inst) {
  var latestGetSnapshot = inst.getSnapshot;
  inst = inst.value;
  try {
    var nextValue = latestGetSnapshot();
    return !objectIs$1(inst, nextValue);
  } catch (error) {
    return true;
  }
}
function useSyncExternalStore$1(subscribe, getSnapshot) {
  return getSnapshot();
}
var shim$1 = "undefined" === typeof window || "undefined" === typeof window.document || "undefined" === typeof window.document.createElement ? useSyncExternalStore$1 : useSyncExternalStore$2;
useSyncExternalStoreShim_production.useSyncExternalStore = void 0 !== React$1.useSyncExternalStore ? React$1.useSyncExternalStore : shim$1;
{
  shim$2.exports = useSyncExternalStoreShim_production;
}
var shimExports = shim$2.exports;
/**
 * @license React
 * use-sync-external-store-shim/with-selector.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var React = reactExports, shim = shimExports;
function is(x2, y2) {
  return x2 === y2 && (0 !== x2 || 1 / x2 === 1 / y2) || x2 !== x2 && y2 !== y2;
}
var objectIs = "function" === typeof Object.is ? Object.is : is, useSyncExternalStore = shim.useSyncExternalStore, useRef = React.useRef, useEffect = React.useEffect, useMemo = React.useMemo, useDebugValue$1 = React.useDebugValue;
withSelector_production.useSyncExternalStoreWithSelector = function(subscribe, getSnapshot, getServerSnapshot, selector, isEqual) {
  var instRef = useRef(null);
  if (null === instRef.current) {
    var inst = { hasValue: false, value: null };
    instRef.current = inst;
  } else inst = instRef.current;
  instRef = useMemo(
    function() {
      function memoizedSelector(nextSnapshot) {
        if (!hasMemo) {
          hasMemo = true;
          memoizedSnapshot = nextSnapshot;
          nextSnapshot = selector(nextSnapshot);
          if (void 0 !== isEqual && inst.hasValue) {
            var currentSelection = inst.value;
            if (isEqual(currentSelection, nextSnapshot))
              return memoizedSelection = currentSelection;
          }
          return memoizedSelection = nextSnapshot;
        }
        currentSelection = memoizedSelection;
        if (objectIs(memoizedSnapshot, nextSnapshot)) return currentSelection;
        var nextSelection = selector(nextSnapshot);
        if (void 0 !== isEqual && isEqual(currentSelection, nextSelection))
          return memoizedSnapshot = nextSnapshot, currentSelection;
        memoizedSnapshot = nextSnapshot;
        return memoizedSelection = nextSelection;
      }
      var hasMemo = false, memoizedSnapshot, memoizedSelection, maybeGetServerSnapshot = void 0 === getServerSnapshot ? null : getServerSnapshot;
      return [
        function() {
          return memoizedSelector(getSnapshot());
        },
        null === maybeGetServerSnapshot ? void 0 : function() {
          return memoizedSelector(maybeGetServerSnapshot());
        }
      ];
    },
    [getSnapshot, getServerSnapshot, selector, isEqual]
  );
  var value = useSyncExternalStore(subscribe, instRef[0], instRef[1]);
  useEffect(
    function() {
      inst.hasValue = true;
      inst.value = value;
    },
    [value]
  );
  useDebugValue$1(value);
  return value;
};
{
  withSelector.exports = withSelector_production;
}
var withSelectorExports = withSelector.exports;
const useSyncExternalStoreExports = /* @__PURE__ */ getDefaultExportFromCjs(withSelectorExports);
const __vite_import_meta_env__$1 = {};
const { useDebugValue } = React$2;
const { useSyncExternalStoreWithSelector } = useSyncExternalStoreExports;
let didWarnAboutEqualityFn = false;
const identity = (arg) => arg;
function useStore(api2, selector = identity, equalityFn) {
  if ((__vite_import_meta_env__$1 ? "production" : void 0) !== "production" && equalityFn && !didWarnAboutEqualityFn) {
    console.warn(
      "[DEPRECATED] Use `createWithEqualityFn` instead of `create` or use `useStoreWithEqualityFn` instead of `useStore`. They can be imported from 'zustand/traditional'. https://github.com/pmndrs/zustand/discussions/1937"
    );
    didWarnAboutEqualityFn = true;
  }
  const slice = useSyncExternalStoreWithSelector(
    api2.subscribe,
    api2.getState,
    api2.getServerState || api2.getInitialState,
    selector,
    equalityFn
  );
  useDebugValue(slice);
  return slice;
}
const createImpl = (createState) => {
  if ((__vite_import_meta_env__$1 ? "production" : void 0) !== "production" && typeof createState !== "function") {
    console.warn(
      "[DEPRECATED] Passing a vanilla store will be unsupported in a future version. Instead use `import { useStore } from 'zustand'`."
    );
  }
  const api2 = typeof createState === "function" ? createStore(createState) : createState;
  const useBoundStore = (selector, equalityFn) => useStore(api2, selector, equalityFn);
  Object.assign(useBoundStore, api2);
  return useBoundStore;
};
const create$1 = (createState) => createState ? createImpl(createState) : createImpl;
const __vite_import_meta_env__ = {};
function createJSONStorage(getStorage, options) {
  let storage;
  try {
    storage = getStorage();
  } catch (_e) {
    return;
  }
  const persistStorage = {
    getItem: (name) => {
      var _a;
      const parse = (str2) => {
        if (str2 === null) {
          return null;
        }
        return JSON.parse(str2, void 0);
      };
      const str = (_a = storage.getItem(name)) != null ? _a : null;
      if (str instanceof Promise) {
        return str.then(parse);
      }
      return parse(str);
    },
    setItem: (name, newValue) => storage.setItem(
      name,
      JSON.stringify(newValue, void 0)
    ),
    removeItem: (name) => storage.removeItem(name)
  };
  return persistStorage;
}
const toThenable = (fn) => (input) => {
  try {
    const result = fn(input);
    if (result instanceof Promise) {
      return result;
    }
    return {
      then(onFulfilled) {
        return toThenable(onFulfilled)(result);
      },
      catch(_onRejected) {
        return this;
      }
    };
  } catch (e) {
    return {
      then(_onFulfilled) {
        return this;
      },
      catch(onRejected) {
        return toThenable(onRejected)(e);
      }
    };
  }
};
const oldImpl = (config, baseOptions) => (set, get, api2) => {
  let options = {
    getStorage: () => localStorage,
    serialize: JSON.stringify,
    deserialize: JSON.parse,
    partialize: (state) => state,
    version: 0,
    merge: (persistedState, currentState) => ({
      ...currentState,
      ...persistedState
    }),
    ...baseOptions
  };
  let hasHydrated = false;
  const hydrationListeners = /* @__PURE__ */ new Set();
  const finishHydrationListeners = /* @__PURE__ */ new Set();
  let storage;
  try {
    storage = options.getStorage();
  } catch (_e) {
  }
  if (!storage) {
    return config(
      (...args) => {
        console.warn(
          `[zustand persist middleware] Unable to update item '${options.name}', the given storage is currently unavailable.`
        );
        set(...args);
      },
      get,
      api2
    );
  }
  const thenableSerialize = toThenable(options.serialize);
  const setItem = () => {
    const state = options.partialize({ ...get() });
    let errorInSync;
    const thenable = thenableSerialize({ state, version: options.version }).then(
      (serializedValue) => storage.setItem(options.name, serializedValue)
    ).catch((e) => {
      errorInSync = e;
    });
    if (errorInSync) {
      throw errorInSync;
    }
    return thenable;
  };
  const savedSetState = api2.setState;
  api2.setState = (state, replace) => {
    savedSetState(state, replace);
    void setItem();
  };
  const configResult = config(
    (...args) => {
      set(...args);
      void setItem();
    },
    get,
    api2
  );
  let stateFromStorage;
  const hydrate = () => {
    var _a;
    if (!storage) return;
    hasHydrated = false;
    hydrationListeners.forEach((cb2) => cb2(get()));
    const postRehydrationCallback = ((_a = options.onRehydrateStorage) == null ? void 0 : _a.call(options, get())) || void 0;
    return toThenable(storage.getItem.bind(storage))(options.name).then((storageValue) => {
      if (storageValue) {
        return options.deserialize(storageValue);
      }
    }).then((deserializedStorageValue) => {
      if (deserializedStorageValue) {
        if (typeof deserializedStorageValue.version === "number" && deserializedStorageValue.version !== options.version) {
          if (options.migrate) {
            return options.migrate(
              deserializedStorageValue.state,
              deserializedStorageValue.version
            );
          }
          console.error(
            `State loaded from storage couldn't be migrated since no migrate function was provided`
          );
        } else {
          return deserializedStorageValue.state;
        }
      }
    }).then((migratedState) => {
      var _a2;
      stateFromStorage = options.merge(
        migratedState,
        (_a2 = get()) != null ? _a2 : configResult
      );
      set(stateFromStorage, true);
      return setItem();
    }).then(() => {
      postRehydrationCallback == null ? void 0 : postRehydrationCallback(stateFromStorage, void 0);
      hasHydrated = true;
      finishHydrationListeners.forEach((cb2) => cb2(stateFromStorage));
    }).catch((e) => {
      postRehydrationCallback == null ? void 0 : postRehydrationCallback(void 0, e);
    });
  };
  api2.persist = {
    setOptions: (newOptions) => {
      options = {
        ...options,
        ...newOptions
      };
      if (newOptions.getStorage) {
        storage = newOptions.getStorage();
      }
    },
    clearStorage: () => {
      storage == null ? void 0 : storage.removeItem(options.name);
    },
    getOptions: () => options,
    rehydrate: () => hydrate(),
    hasHydrated: () => hasHydrated,
    onHydrate: (cb2) => {
      hydrationListeners.add(cb2);
      return () => {
        hydrationListeners.delete(cb2);
      };
    },
    onFinishHydration: (cb2) => {
      finishHydrationListeners.add(cb2);
      return () => {
        finishHydrationListeners.delete(cb2);
      };
    }
  };
  hydrate();
  return stateFromStorage || configResult;
};
const newImpl = (config, baseOptions) => (set, get, api2) => {
  let options = {
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => state,
    version: 0,
    merge: (persistedState, currentState) => ({
      ...currentState,
      ...persistedState
    }),
    ...baseOptions
  };
  let hasHydrated = false;
  const hydrationListeners = /* @__PURE__ */ new Set();
  const finishHydrationListeners = /* @__PURE__ */ new Set();
  let storage = options.storage;
  if (!storage) {
    return config(
      (...args) => {
        console.warn(
          `[zustand persist middleware] Unable to update item '${options.name}', the given storage is currently unavailable.`
        );
        set(...args);
      },
      get,
      api2
    );
  }
  const setItem = () => {
    const state = options.partialize({ ...get() });
    return storage.setItem(options.name, {
      state,
      version: options.version
    });
  };
  const savedSetState = api2.setState;
  api2.setState = (state, replace) => {
    savedSetState(state, replace);
    void setItem();
  };
  const configResult = config(
    (...args) => {
      set(...args);
      void setItem();
    },
    get,
    api2
  );
  api2.getInitialState = () => configResult;
  let stateFromStorage;
  const hydrate = () => {
    var _a, _b;
    if (!storage) return;
    hasHydrated = false;
    hydrationListeners.forEach((cb2) => {
      var _a2;
      return cb2((_a2 = get()) != null ? _a2 : configResult);
    });
    const postRehydrationCallback = ((_b = options.onRehydrateStorage) == null ? void 0 : _b.call(options, (_a = get()) != null ? _a : configResult)) || void 0;
    return toThenable(storage.getItem.bind(storage))(options.name).then((deserializedStorageValue) => {
      if (deserializedStorageValue) {
        if (typeof deserializedStorageValue.version === "number" && deserializedStorageValue.version !== options.version) {
          if (options.migrate) {
            return [
              true,
              options.migrate(
                deserializedStorageValue.state,
                deserializedStorageValue.version
              )
            ];
          }
          console.error(
            `State loaded from storage couldn't be migrated since no migrate function was provided`
          );
        } else {
          return [false, deserializedStorageValue.state];
        }
      }
      return [false, void 0];
    }).then((migrationResult) => {
      var _a2;
      const [migrated, migratedState] = migrationResult;
      stateFromStorage = options.merge(
        migratedState,
        (_a2 = get()) != null ? _a2 : configResult
      );
      set(stateFromStorage, true);
      if (migrated) {
        return setItem();
      }
    }).then(() => {
      postRehydrationCallback == null ? void 0 : postRehydrationCallback(stateFromStorage, void 0);
      stateFromStorage = get();
      hasHydrated = true;
      finishHydrationListeners.forEach((cb2) => cb2(stateFromStorage));
    }).catch((e) => {
      postRehydrationCallback == null ? void 0 : postRehydrationCallback(void 0, e);
    });
  };
  api2.persist = {
    setOptions: (newOptions) => {
      options = {
        ...options,
        ...newOptions
      };
      if (newOptions.storage) {
        storage = newOptions.storage;
      }
    },
    clearStorage: () => {
      storage == null ? void 0 : storage.removeItem(options.name);
    },
    getOptions: () => options,
    rehydrate: () => hydrate(),
    hasHydrated: () => hasHydrated,
    onHydrate: (cb2) => {
      hydrationListeners.add(cb2);
      return () => {
        hydrationListeners.delete(cb2);
      };
    },
    onFinishHydration: (cb2) => {
      finishHydrationListeners.add(cb2);
      return () => {
        finishHydrationListeners.delete(cb2);
      };
    }
  };
  if (!options.skipHydration) {
    hydrate();
  }
  return stateFromStorage || configResult;
};
const persistImpl = (config, baseOptions) => {
  if ("getStorage" in baseOptions || "serialize" in baseOptions || "deserialize" in baseOptions) {
    if ((__vite_import_meta_env__ ? "production" : void 0) !== "production") {
      console.warn(
        "[DEPRECATED] `getStorage`, `serialize` and `deserialize` options are deprecated. Use `storage` option instead."
      );
    }
    return oldImpl(config, baseOptions);
  }
  return newImpl(config, baseOptions);
};
const persist = persistImpl;
function bind(fn, thisArg) {
  return function wrap() {
    return fn.apply(thisArg, arguments);
  };
}
const { toString } = Object.prototype;
const { getPrototypeOf } = Object;
const { iterator, toStringTag } = Symbol;
const hasOwnProperty = (({ hasOwnProperty: hasOwnProperty2 }) => (obj, prop) => hasOwnProperty2.call(obj, prop))(Object.prototype);
const hasOwnInPrototypeChain = (thing, prop) => {
  let obj = thing;
  const seen2 = [];
  while (obj != null && obj !== Object.prototype) {
    if (seen2.indexOf(obj) !== -1) {
      return false;
    }
    seen2.push(obj);
    if (hasOwnProperty(obj, prop)) {
      return true;
    }
    obj = getPrototypeOf(obj);
  }
  return false;
};
const getSafeProp = (obj, prop) => obj != null && hasOwnInPrototypeChain(obj, prop) ? obj[prop] : void 0;
const kindOf = /* @__PURE__ */ ((cache) => (thing) => {
  const str = toString.call(thing);
  return cache[str] || (cache[str] = str.slice(8, -1).toLowerCase());
})(/* @__PURE__ */ Object.create(null));
const kindOfTest = (type) => {
  type = type.toLowerCase();
  return (thing) => kindOf(thing) === type;
};
const typeOfTest = (type) => (thing) => typeof thing === type;
const { isArray } = Array;
const isUndefined = typeOfTest("undefined");
function isBuffer(val) {
  return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor) && isFunction$1(val.constructor.isBuffer) && val.constructor.isBuffer(val);
}
const isArrayBuffer = kindOfTest("ArrayBuffer");
function isArrayBufferView(val) {
  let result;
  if (typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView) {
    result = ArrayBuffer.isView(val);
  } else {
    result = val && val.buffer && isArrayBuffer(val.buffer);
  }
  return result;
}
const isString = typeOfTest("string");
const isFunction$1 = typeOfTest("function");
const isNumber = typeOfTest("number");
const isObject = (thing) => thing !== null && typeof thing === "object";
const isBoolean = (thing) => thing === true || thing === false;
const isPlainObject = (val) => {
  if (!isObject(val)) {
    return false;
  }
  const prototype2 = getPrototypeOf(val);
  return (prototype2 === null || prototype2 === Object.prototype || getPrototypeOf(prototype2) === null) && // Treat any genuine (non-Object.prototype-polluted) Symbol.toStringTag or
  // Symbol.iterator as evidence the value is a tagged/iterable type rather
  // than a plain object, while ignoring keys injected onto Object.prototype.
  !hasOwnInPrototypeChain(val, toStringTag) && !hasOwnInPrototypeChain(val, iterator);
};
const isEmptyObject = (val) => {
  if (!isObject(val) || isBuffer(val)) {
    return false;
  }
  try {
    return Object.keys(val).length === 0 && Object.getPrototypeOf(val) === Object.prototype;
  } catch (e) {
    return false;
  }
};
const isDate = kindOfTest("Date");
const isFile = kindOfTest("File");
const isReactNativeBlob = (value) => {
  return !!(value && typeof value.uri !== "undefined");
};
const isReactNative = (formData) => formData && typeof formData.getParts !== "undefined";
const isBlob = kindOfTest("Blob");
const isFileList = kindOfTest("FileList");
const isStream = (val) => isObject(val) && isFunction$1(val.pipe);
function getGlobal() {
  if (typeof globalThis !== "undefined") return globalThis;
  if (typeof self !== "undefined") return self;
  if (typeof window !== "undefined") return window;
  if (typeof global !== "undefined") return global;
  return {};
}
const G = getGlobal();
const FormDataCtor = typeof G.FormData !== "undefined" ? G.FormData : void 0;
const isFormData = (thing) => {
  if (!thing) return false;
  if (FormDataCtor && thing instanceof FormDataCtor) return true;
  const proto = getPrototypeOf(thing);
  if (!proto || proto === Object.prototype) return false;
  if (!isFunction$1(thing.append)) return false;
  const kind = kindOf(thing);
  return kind === "formdata" || // detect form-data instance
  kind === "object" && isFunction$1(thing.toString) && thing.toString() === "[object FormData]";
};
const isURLSearchParams = kindOfTest("URLSearchParams");
const [isReadableStream, isRequest, isResponse, isHeaders] = [
  "ReadableStream",
  "Request",
  "Response",
  "Headers"
].map(kindOfTest);
const trim = (str) => {
  return str.trim ? str.trim() : str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
};
function forEach(obj, fn, { allOwnKeys = false } = {}) {
  if (obj === null || typeof obj === "undefined") {
    return;
  }
  let i;
  let l2;
  if (typeof obj !== "object") {
    obj = [obj];
  }
  if (isArray(obj)) {
    for (i = 0, l2 = obj.length; i < l2; i++) {
      fn.call(null, obj[i], i, obj);
    }
  } else {
    if (isBuffer(obj)) {
      return;
    }
    const keys = allOwnKeys ? Object.getOwnPropertyNames(obj) : Object.keys(obj);
    const len = keys.length;
    let key;
    for (i = 0; i < len; i++) {
      key = keys[i];
      fn.call(null, obj[key], key, obj);
    }
  }
}
function findKey(obj, key) {
  if (isBuffer(obj)) {
    return null;
  }
  key = key.toLowerCase();
  const keys = Object.keys(obj);
  let i = keys.length;
  let _key;
  while (i-- > 0) {
    _key = keys[i];
    if (key === _key.toLowerCase()) {
      return _key;
    }
  }
  return null;
}
const _global = (() => {
  if (typeof globalThis !== "undefined") return globalThis;
  return typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : global;
})();
const isContextDefined = (context) => !isUndefined(context) && context !== _global;
function merge(...objs) {
  const { caseless, skipUndefined } = isContextDefined(this) && this || {};
  const result = {};
  const assignValue = (val, key) => {
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      return;
    }
    const targetKey = caseless && typeof key === "string" && findKey(result, key) || key;
    const existing = hasOwnProperty(result, targetKey) ? result[targetKey] : void 0;
    if (isPlainObject(existing) && isPlainObject(val)) {
      result[targetKey] = merge(existing, val);
    } else if (isPlainObject(val)) {
      result[targetKey] = merge({}, val);
    } else if (isArray(val)) {
      result[targetKey] = val.slice();
    } else if (!skipUndefined || !isUndefined(val)) {
      result[targetKey] = val;
    }
  };
  for (let i = 0, l2 = objs.length; i < l2; i++) {
    const source = objs[i];
    if (!source || isBuffer(source)) {
      continue;
    }
    forEach(source, assignValue);
    if (typeof source !== "object" || isArray(source)) {
      continue;
    }
    const symbols = Object.getOwnPropertySymbols(source);
    for (let j = 0; j < symbols.length; j++) {
      const symbol = symbols[j];
      if (propertyIsEnumerable.call(source, symbol)) {
        assignValue(source[symbol], symbol);
      }
    }
  }
  return result;
}
const extend = (a, b, thisArg, { allOwnKeys } = {}) => {
  forEach(
    b,
    (val, key) => {
      if (thisArg && isFunction$1(val)) {
        Object.defineProperty(a, key, {
          // Null-proto descriptor so a polluted Object.prototype.get cannot
          // hijack defineProperty's accessor-vs-data resolution.
          __proto__: null,
          value: bind(val, thisArg),
          writable: true,
          enumerable: true,
          configurable: true
        });
      } else {
        Object.defineProperty(a, key, {
          __proto__: null,
          value: val,
          writable: true,
          enumerable: true,
          configurable: true
        });
      }
    },
    { allOwnKeys }
  );
  return a;
};
const stripBOM = (content) => {
  if (content.charCodeAt(0) === 65279) {
    content = content.slice(1);
  }
  return content;
};
const inherits = (constructor, superConstructor, props, descriptors) => {
  constructor.prototype = Object.create(superConstructor.prototype, descriptors);
  Object.defineProperty(constructor.prototype, "constructor", {
    __proto__: null,
    value: constructor,
    writable: true,
    enumerable: false,
    configurable: true
  });
  Object.defineProperty(constructor, "super", {
    __proto__: null,
    value: superConstructor.prototype
  });
  props && Object.assign(constructor.prototype, props);
};
const toFlatObject = (sourceObj, destObj, filter2, propFilter) => {
  let props;
  let i;
  let prop;
  const merged = {};
  destObj = destObj || {};
  if (sourceObj == null) return destObj;
  do {
    props = Object.getOwnPropertyNames(sourceObj);
    i = props.length;
    while (i-- > 0) {
      prop = props[i];
      if ((!propFilter || propFilter(prop, sourceObj, destObj)) && !merged[prop]) {
        destObj[prop] = sourceObj[prop];
        merged[prop] = true;
      }
    }
    sourceObj = filter2 !== false && getPrototypeOf(sourceObj);
  } while (sourceObj && (!filter2 || filter2(sourceObj, destObj)) && sourceObj !== Object.prototype);
  return destObj;
};
const endsWith = (str, searchString, position) => {
  str = String(str);
  if (position === void 0 || position > str.length) {
    position = str.length;
  }
  position -= searchString.length;
  const lastIndex = str.indexOf(searchString, position);
  return lastIndex !== -1 && lastIndex === position;
};
const toArray = (thing) => {
  if (!thing) return null;
  if (isArray(thing)) return thing;
  let i = thing.length;
  if (!isNumber(i)) return null;
  const arr = new Array(i);
  while (i-- > 0) {
    arr[i] = thing[i];
  }
  return arr;
};
const isTypedArray = /* @__PURE__ */ ((TypedArray) => {
  return (thing) => {
    return TypedArray && thing instanceof TypedArray;
  };
})(typeof Uint8Array !== "undefined" && getPrototypeOf(Uint8Array));
const forEachEntry = (obj, fn) => {
  const generator = obj && obj[iterator];
  const _iterator = generator.call(obj);
  let result;
  while ((result = _iterator.next()) && !result.done) {
    const pair = result.value;
    fn.call(obj, pair[0], pair[1]);
  }
};
const matchAll = (regExp, str) => {
  let matches;
  const arr = [];
  while ((matches = regExp.exec(str)) !== null) {
    arr.push(matches);
  }
  return arr;
};
const isHTMLForm = kindOfTest("HTMLFormElement");
const toCamelCase = (str) => {
  return str.toLowerCase().replace(/[-_\s]([a-z\d])(\w*)/g, function replacer(m2, p1, p2) {
    return p1.toUpperCase() + p2;
  });
};
const { propertyIsEnumerable } = Object.prototype;
const isRegExp = kindOfTest("RegExp");
const reduceDescriptors = (obj, reducer) => {
  const descriptors = Object.getOwnPropertyDescriptors(obj);
  const reducedDescriptors = {};
  forEach(descriptors, (descriptor, name) => {
    let ret;
    if ((ret = reducer(descriptor, name, obj)) !== false) {
      reducedDescriptors[name] = ret || descriptor;
    }
  });
  Object.defineProperties(obj, reducedDescriptors);
};
const freezeMethods = (obj) => {
  reduceDescriptors(obj, (descriptor, name) => {
    if (isFunction$1(obj) && ["arguments", "caller", "callee"].includes(name)) {
      return false;
    }
    const value = obj[name];
    if (!isFunction$1(value)) return;
    descriptor.enumerable = false;
    if ("writable" in descriptor) {
      descriptor.writable = false;
      return;
    }
    if (!descriptor.set) {
      descriptor.set = () => {
        throw Error("Can not rewrite read-only method '" + name + "'");
      };
    }
  });
};
const toObjectSet = (arrayOrString, delimiter) => {
  const obj = {};
  const define = (arr) => {
    arr.forEach((value) => {
      obj[value] = true;
    });
  };
  isArray(arrayOrString) ? define(arrayOrString) : define(String(arrayOrString).split(delimiter));
  return obj;
};
const noop = () => {
};
const toFiniteNumber = (value, defaultValue) => {
  return value != null && Number.isFinite(value = +value) ? value : defaultValue;
};
function isSpecCompliantForm(thing) {
  return !!(thing && isFunction$1(thing.append) && thing[toStringTag] === "FormData" && thing[iterator]);
}
const toJSONObject = (obj) => {
  const visited = /* @__PURE__ */ new WeakSet();
  const visit = (source) => {
    if (isObject(source)) {
      if (visited.has(source)) {
        return;
      }
      if (isBuffer(source)) {
        return source;
      }
      if (!("toJSON" in source)) {
        visited.add(source);
        const target = isArray(source) ? [] : {};
        forEach(source, (value, key) => {
          const reducedValue = visit(value);
          !isUndefined(reducedValue) && (target[key] = reducedValue);
        });
        visited.delete(source);
        return target;
      }
    }
    return source;
  };
  return visit(obj);
};
const isAsyncFn = kindOfTest("AsyncFunction");
const isThenable = (thing) => thing && (isObject(thing) || isFunction$1(thing)) && isFunction$1(thing.then) && isFunction$1(thing.catch);
const _setImmediate = ((setImmediateSupported, postMessageSupported) => {
  if (setImmediateSupported) {
    return setImmediate;
  }
  return postMessageSupported ? ((token, callbacks) => {
    _global.addEventListener(
      "message",
      ({ source, data }) => {
        if (source === _global && data === token) {
          callbacks.length && callbacks.shift()();
        }
      },
      false
    );
    return (cb2) => {
      callbacks.push(cb2);
      _global.postMessage(token, "*");
    };
  })(`axios@${Math.random()}`, []) : (cb2) => setTimeout(cb2);
})(typeof setImmediate === "function", isFunction$1(_global.postMessage));
const asap = typeof queueMicrotask !== "undefined" ? queueMicrotask.bind(_global) : typeof process !== "undefined" && process.nextTick || _setImmediate;
const isIterable = (thing) => thing != null && isFunction$1(thing[iterator]);
const isSafeIterable = (thing) => thing != null && hasOwnInPrototypeChain(thing, iterator) && isIterable(thing);
const utils$1 = {
  isArray,
  isArrayBuffer,
  isBuffer,
  isFormData,
  isArrayBufferView,
  isString,
  isNumber,
  isBoolean,
  isObject,
  isPlainObject,
  isEmptyObject,
  isReadableStream,
  isRequest,
  isResponse,
  isHeaders,
  isUndefined,
  isDate,
  isFile,
  isReactNativeBlob,
  isReactNative,
  isBlob,
  isRegExp,
  isFunction: isFunction$1,
  isStream,
  isURLSearchParams,
  isTypedArray,
  isFileList,
  forEach,
  merge,
  extend,
  trim,
  stripBOM,
  inherits,
  toFlatObject,
  kindOf,
  kindOfTest,
  endsWith,
  toArray,
  forEachEntry,
  matchAll,
  isHTMLForm,
  hasOwnProperty,
  hasOwnProp: hasOwnProperty,
  // an alias to avoid ESLint no-prototype-builtins detection
  hasOwnInPrototypeChain,
  getSafeProp,
  reduceDescriptors,
  freezeMethods,
  toObjectSet,
  toCamelCase,
  noop,
  toFiniteNumber,
  findKey,
  global: _global,
  isContextDefined,
  isSpecCompliantForm,
  toJSONObject,
  isAsyncFn,
  isThenable,
  setImmediate: _setImmediate,
  asap,
  isIterable,
  isSafeIterable
};
const ignoreDuplicateOf = utils$1.toObjectSet([
  "age",
  "authorization",
  "content-length",
  "content-type",
  "etag",
  "expires",
  "from",
  "host",
  "if-modified-since",
  "if-unmodified-since",
  "last-modified",
  "location",
  "max-forwards",
  "proxy-authorization",
  "referer",
  "retry-after",
  "user-agent"
]);
const parseHeaders = (rawHeaders) => {
  const parsed = {};
  let key;
  let val;
  let i;
  rawHeaders && rawHeaders.split("\n").forEach(function parser(line) {
    i = line.indexOf(":");
    key = line.substring(0, i).trim().toLowerCase();
    val = line.substring(i + 1).trim();
    if (!key || parsed[key] && ignoreDuplicateOf[key]) {
      return;
    }
    if (key === "set-cookie") {
      if (parsed[key]) {
        parsed[key].push(val);
      } else {
        parsed[key] = [val];
      }
    } else {
      parsed[key] = parsed[key] ? parsed[key] + ", " + val : val;
    }
  });
  return parsed;
};
function trimSPorHTAB(str) {
  let start = 0;
  let end = str.length;
  while (start < end) {
    const code = str.charCodeAt(start);
    if (code !== 9 && code !== 32) {
      break;
    }
    start += 1;
  }
  while (end > start) {
    const code = str.charCodeAt(end - 1);
    if (code !== 9 && code !== 32) {
      break;
    }
    end -= 1;
  }
  return start === 0 && end === str.length ? str : str.slice(start, end);
}
const INVALID_UNICODE_HEADER_VALUE_CHARS = new RegExp("[\\u0000-\\u0008\\u000a-\\u001f\\u007f]+", "g");
const INVALID_BYTE_STRING_HEADER_VALUE_CHARS = new RegExp("[^\\u0009\\u0020-\\u007e\\u0080-\\u00ff]+", "g");
function sanitizeValue(value, invalidChars) {
  if (utils$1.isArray(value)) {
    return value.map((item) => sanitizeValue(item, invalidChars));
  }
  return trimSPorHTAB(String(value).replace(invalidChars, ""));
}
const sanitizeHeaderValue = (value) => sanitizeValue(value, INVALID_UNICODE_HEADER_VALUE_CHARS);
const sanitizeByteStringHeaderValue = (value) => sanitizeValue(value, INVALID_BYTE_STRING_HEADER_VALUE_CHARS);
function toByteStringHeaderObject(headers) {
  const byteStringHeaders = /* @__PURE__ */ Object.create(null);
  utils$1.forEach(headers.toJSON(), (value, header) => {
    byteStringHeaders[header] = sanitizeByteStringHeaderValue(value);
  });
  return byteStringHeaders;
}
const $internals = Symbol("internals");
function normalizeHeader(header) {
  return header && String(header).trim().toLowerCase();
}
function normalizeValue(value) {
  if (value === false || value == null) {
    return value;
  }
  return utils$1.isArray(value) ? value.map(normalizeValue) : sanitizeHeaderValue(String(value));
}
function parseTokens(str) {
  const tokens = /* @__PURE__ */ Object.create(null);
  const tokensRE = /([^\s,;=]+)\s*(?:=\s*([^,;]+))?/g;
  let match;
  while (match = tokensRE.exec(str)) {
    tokens[match[1]] = match[2];
  }
  return tokens;
}
const isValidHeaderName = (str) => /^[-_a-zA-Z0-9^`|~,!#$%&'*+.]+$/.test(str.trim());
function matchHeaderValue(context, value, header, filter2, isHeaderNameFilter) {
  if (utils$1.isFunction(filter2)) {
    return filter2.call(this, value, header);
  }
  if (isHeaderNameFilter) {
    value = header;
  }
  if (!utils$1.isString(value)) return;
  if (utils$1.isString(filter2)) {
    return value.indexOf(filter2) !== -1;
  }
  if (utils$1.isRegExp(filter2)) {
    return filter2.test(value);
  }
}
function formatHeader(header) {
  return header.trim().toLowerCase().replace(/([a-z\d])(\w*)/g, (w2, char, str) => {
    return char.toUpperCase() + str;
  });
}
function buildAccessors(obj, header) {
  const accessorName = utils$1.toCamelCase(" " + header);
  ["get", "set", "has"].forEach((methodName) => {
    Object.defineProperty(obj, methodName + accessorName, {
      // Null-proto descriptor so a polluted Object.prototype.get cannot turn
      // this data descriptor into an accessor descriptor on the way in.
      __proto__: null,
      value: function(arg1, arg2, arg3) {
        return this[methodName].call(this, header, arg1, arg2, arg3);
      },
      configurable: true
    });
  });
}
let AxiosHeaders$1 = class AxiosHeaders {
  constructor(headers) {
    headers && this.set(headers);
  }
  set(header, valueOrRewrite, rewrite) {
    const self2 = this;
    function setHeader(_value, _header, _rewrite) {
      const lHeader = normalizeHeader(_header);
      if (!lHeader) {
        return;
      }
      const key = utils$1.findKey(self2, lHeader);
      if (!key || self2[key] === void 0 || _rewrite === true || _rewrite === void 0 && self2[key] !== false) {
        self2[key || _header] = normalizeValue(_value);
      }
    }
    const setHeaders = (headers, _rewrite) => utils$1.forEach(headers, (_value, _header) => setHeader(_value, _header, _rewrite));
    if (utils$1.isPlainObject(header) || header instanceof this.constructor) {
      setHeaders(header, valueOrRewrite);
    } else if (utils$1.isString(header) && (header = header.trim()) && !isValidHeaderName(header)) {
      setHeaders(parseHeaders(header), valueOrRewrite);
    } else if (utils$1.isObject(header) && utils$1.isSafeIterable(header)) {
      let obj = /* @__PURE__ */ Object.create(null), dest, key;
      for (const entry of header) {
        if (!utils$1.isArray(entry)) {
          throw new TypeError("Object iterator must return a key-value pair");
        }
        key = entry[0];
        if (utils$1.hasOwnProp(obj, key)) {
          dest = obj[key];
          obj[key] = utils$1.isArray(dest) ? [...dest, entry[1]] : [dest, entry[1]];
        } else {
          obj[key] = entry[1];
        }
      }
      setHeaders(obj, valueOrRewrite);
    } else {
      header != null && setHeader(valueOrRewrite, header, rewrite);
    }
    return this;
  }
  get(header, parser) {
    header = normalizeHeader(header);
    if (header) {
      const key = utils$1.findKey(this, header);
      if (key) {
        const value = this[key];
        if (!parser) {
          return value;
        }
        if (parser === true) {
          return parseTokens(value);
        }
        if (utils$1.isFunction(parser)) {
          return parser.call(this, value, key);
        }
        if (utils$1.isRegExp(parser)) {
          return parser.exec(value);
        }
        throw new TypeError("parser must be boolean|regexp|function");
      }
    }
  }
  has(header, matcher) {
    header = normalizeHeader(header);
    if (header) {
      const key = utils$1.findKey(this, header);
      return !!(key && this[key] !== void 0 && (!matcher || matchHeaderValue(this, this[key], key, matcher)));
    }
    return false;
  }
  delete(header, matcher) {
    const self2 = this;
    let deleted = false;
    function deleteHeader(_header) {
      _header = normalizeHeader(_header);
      if (_header) {
        const key = utils$1.findKey(self2, _header);
        if (key && (!matcher || matchHeaderValue(self2, self2[key], key, matcher))) {
          delete self2[key];
          deleted = true;
        }
      }
    }
    if (utils$1.isArray(header)) {
      header.forEach(deleteHeader);
    } else {
      deleteHeader(header);
    }
    return deleted;
  }
  clear(matcher) {
    const keys = Object.keys(this);
    let i = keys.length;
    let deleted = false;
    while (i--) {
      const key = keys[i];
      if (!matcher || matchHeaderValue(this, this[key], key, matcher, true)) {
        delete this[key];
        deleted = true;
      }
    }
    return deleted;
  }
  normalize(format) {
    const self2 = this;
    const headers = {};
    utils$1.forEach(this, (value, header) => {
      const key = utils$1.findKey(headers, header);
      if (key) {
        self2[key] = normalizeValue(value);
        delete self2[header];
        return;
      }
      const normalized = format ? formatHeader(header) : String(header).trim();
      if (normalized !== header) {
        delete self2[header];
      }
      self2[normalized] = normalizeValue(value);
      headers[normalized] = true;
    });
    return this;
  }
  concat(...targets) {
    return this.constructor.concat(this, ...targets);
  }
  toJSON(asStrings) {
    const obj = /* @__PURE__ */ Object.create(null);
    utils$1.forEach(this, (value, header) => {
      value != null && value !== false && (obj[header] = asStrings && utils$1.isArray(value) ? value.join(", ") : value);
    });
    return obj;
  }
  [Symbol.iterator]() {
    return Object.entries(this.toJSON())[Symbol.iterator]();
  }
  toString() {
    return Object.entries(this.toJSON()).map(([header, value]) => header + ": " + value).join("\n");
  }
  getSetCookie() {
    return this.get("set-cookie") || [];
  }
  get [Symbol.toStringTag]() {
    return "AxiosHeaders";
  }
  static from(thing) {
    return thing instanceof this ? thing : new this(thing);
  }
  static concat(first, ...targets) {
    const computed = new this(first);
    targets.forEach((target) => computed.set(target));
    return computed;
  }
  static accessor(header) {
    const internals = this[$internals] = this[$internals] = {
      accessors: {}
    };
    const accessors = internals.accessors;
    const prototype2 = this.prototype;
    function defineAccessor(_header) {
      const lHeader = normalizeHeader(_header);
      if (!accessors[lHeader]) {
        buildAccessors(prototype2, _header);
        accessors[lHeader] = true;
      }
    }
    utils$1.isArray(header) ? header.forEach(defineAccessor) : defineAccessor(header);
    return this;
  }
};
AxiosHeaders$1.accessor([
  "Content-Type",
  "Content-Length",
  "Accept",
  "Accept-Encoding",
  "User-Agent",
  "Authorization"
]);
utils$1.reduceDescriptors(AxiosHeaders$1.prototype, ({ value }, key) => {
  let mapped = key[0].toUpperCase() + key.slice(1);
  return {
    get: () => value,
    set(headerValue) {
      this[mapped] = headerValue;
    }
  };
});
utils$1.freezeMethods(AxiosHeaders$1);
const REDACTED = "[REDACTED ****]";
function hasOwnOrPrototypeToJSON(source) {
  if (utils$1.hasOwnProp(source, "toJSON")) {
    return true;
  }
  let prototype2 = Object.getPrototypeOf(source);
  while (prototype2 && prototype2 !== Object.prototype) {
    if (utils$1.hasOwnProp(prototype2, "toJSON")) {
      return true;
    }
    prototype2 = Object.getPrototypeOf(prototype2);
  }
  return false;
}
function redactConfig(config, redactKeys) {
  const lowerKeys = new Set(redactKeys.map((k2) => String(k2).toLowerCase()));
  const seen2 = [];
  const visit = (source) => {
    if (source === null || typeof source !== "object") return source;
    if (utils$1.isBuffer(source)) return source;
    if (seen2.indexOf(source) !== -1) return void 0;
    if (source instanceof AxiosHeaders$1) {
      source = source.toJSON();
    }
    seen2.push(source);
    let result;
    if (utils$1.isArray(source)) {
      result = [];
      source.forEach((v2, i) => {
        const reducedValue = visit(v2);
        if (!utils$1.isUndefined(reducedValue)) {
          result[i] = reducedValue;
        }
      });
    } else {
      if (!utils$1.isPlainObject(source) && hasOwnOrPrototypeToJSON(source)) {
        seen2.pop();
        return source;
      }
      result = /* @__PURE__ */ Object.create(null);
      for (const [key, value] of Object.entries(source)) {
        const reducedValue = lowerKeys.has(key.toLowerCase()) ? REDACTED : visit(value);
        if (!utils$1.isUndefined(reducedValue)) {
          result[key] = reducedValue;
        }
      }
    }
    seen2.pop();
    return result;
  };
  return visit(config);
}
let AxiosError$1 = class AxiosError extends Error {
  static from(error, code, config, request, response, customProps) {
    const axiosError = new AxiosError(error.message, code || error.code, config, request, response);
    axiosError.cause = error;
    axiosError.name = error.name;
    if (error.status != null && axiosError.status == null) {
      axiosError.status = error.status;
    }
    customProps && Object.assign(axiosError, customProps);
    return axiosError;
  }
  /**
   * Create an Error with the specified message, config, error code, request and response.
   *
   * @param {string} message The error message.
   * @param {string} [code] The error code (for example, 'ECONNABORTED').
   * @param {Object} [config] The config.
   * @param {Object} [request] The request.
   * @param {Object} [response] The response.
   *
   * @returns {Error} The created error.
   */
  constructor(message, code, config, request, response) {
    super(message);
    Object.defineProperty(this, "message", {
      // Null-proto descriptor so a polluted Object.prototype.get cannot turn
      // this data descriptor into an accessor descriptor on the way in.
      __proto__: null,
      value: message,
      enumerable: true,
      writable: true,
      configurable: true
    });
    this.name = "AxiosError";
    this.isAxiosError = true;
    code && (this.code = code);
    config && (this.config = config);
    request && (this.request = request);
    if (response) {
      this.response = response;
      this.status = response.status;
    }
  }
  toJSON() {
    const config = this.config;
    const redactKeys = config && utils$1.hasOwnProp(config, "redact") ? config.redact : void 0;
    const serializedConfig = utils$1.isArray(redactKeys) && redactKeys.length > 0 ? redactConfig(config, redactKeys) : utils$1.toJSONObject(config);
    return {
      // Standard
      message: this.message,
      name: this.name,
      // Microsoft
      description: this.description,
      number: this.number,
      // Mozilla
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      // Axios
      config: serializedConfig,
      code: this.code,
      status: this.status
    };
  }
};
AxiosError$1.ERR_BAD_OPTION_VALUE = "ERR_BAD_OPTION_VALUE";
AxiosError$1.ERR_BAD_OPTION = "ERR_BAD_OPTION";
AxiosError$1.ECONNABORTED = "ECONNABORTED";
AxiosError$1.ETIMEDOUT = "ETIMEDOUT";
AxiosError$1.ECONNREFUSED = "ECONNREFUSED";
AxiosError$1.ERR_NETWORK = "ERR_NETWORK";
AxiosError$1.ERR_FR_TOO_MANY_REDIRECTS = "ERR_FR_TOO_MANY_REDIRECTS";
AxiosError$1.ERR_DEPRECATED = "ERR_DEPRECATED";
AxiosError$1.ERR_BAD_RESPONSE = "ERR_BAD_RESPONSE";
AxiosError$1.ERR_BAD_REQUEST = "ERR_BAD_REQUEST";
AxiosError$1.ERR_CANCELED = "ERR_CANCELED";
AxiosError$1.ERR_NOT_SUPPORT = "ERR_NOT_SUPPORT";
AxiosError$1.ERR_INVALID_URL = "ERR_INVALID_URL";
AxiosError$1.ERR_FORM_DATA_DEPTH_EXCEEDED = "ERR_FORM_DATA_DEPTH_EXCEEDED";
const httpAdapter = null;
const DEFAULT_FORM_DATA_MAX_DEPTH = 100;
function isVisitable(thing) {
  return utils$1.isPlainObject(thing) || utils$1.isArray(thing);
}
function removeBrackets(key) {
  return utils$1.endsWith(key, "[]") ? key.slice(0, -2) : key;
}
function renderKey(path, key, dots) {
  if (!path) return key;
  return path.concat(key).map(function each(token, i) {
    token = removeBrackets(token);
    return !dots && i ? "[" + token + "]" : token;
  }).join(dots ? "." : "");
}
function isFlatArray(arr) {
  return utils$1.isArray(arr) && !arr.some(isVisitable);
}
const predicates = utils$1.toFlatObject(utils$1, {}, null, function filter(prop) {
  return /^is[A-Z]/.test(prop);
});
function toFormData$1(obj, formData, options) {
  if (!utils$1.isObject(obj)) {
    throw new TypeError("target must be an object");
  }
  formData = formData || new FormData();
  options = utils$1.toFlatObject(
    options,
    {
      metaTokens: true,
      dots: false,
      indexes: false
    },
    false,
    function defined(option, source) {
      return !utils$1.isUndefined(source[option]);
    }
  );
  const metaTokens = options.metaTokens;
  const visitor = options.visitor || defaultVisitor;
  const dots = options.dots;
  const indexes = options.indexes;
  const _Blob = options.Blob || typeof Blob !== "undefined" && Blob;
  const maxDepth = options.maxDepth === void 0 ? DEFAULT_FORM_DATA_MAX_DEPTH : options.maxDepth;
  const useBlob = _Blob && utils$1.isSpecCompliantForm(formData);
  const stack = [];
  if (!utils$1.isFunction(visitor)) {
    throw new TypeError("visitor must be a function");
  }
  function convertValue(value) {
    if (value === null) return "";
    if (utils$1.isDate(value)) {
      return value.toISOString();
    }
    if (utils$1.isBoolean(value)) {
      return value.toString();
    }
    if (!useBlob && utils$1.isBlob(value)) {
      throw new AxiosError$1("Blob is not supported. Use a Buffer instead.");
    }
    if (utils$1.isArrayBuffer(value) || utils$1.isTypedArray(value)) {
      return useBlob && typeof Blob === "function" ? new Blob([value]) : Buffer.from(value);
    }
    return value;
  }
  function throwIfMaxDepthExceeded(depth) {
    if (depth > maxDepth) {
      throw new AxiosError$1(
        "Object is too deeply nested (" + depth + " levels). Max depth: " + maxDepth,
        AxiosError$1.ERR_FORM_DATA_DEPTH_EXCEEDED
      );
    }
  }
  function stringifyWithDepthLimit(value, depth) {
    if (maxDepth === Infinity) {
      return JSON.stringify(value);
    }
    const ancestors = [];
    return JSON.stringify(value, function limitDepth(_key, currentValue) {
      if (!utils$1.isObject(currentValue)) {
        return currentValue;
      }
      while (ancestors.length && ancestors[ancestors.length - 1] !== this) {
        ancestors.pop();
      }
      ancestors.push(currentValue);
      throwIfMaxDepthExceeded(depth + ancestors.length - 1);
      return currentValue;
    });
  }
  function defaultVisitor(value, key, path) {
    let arr = value;
    if (utils$1.isReactNative(formData) && utils$1.isReactNativeBlob(value)) {
      formData.append(renderKey(path, key, dots), convertValue(value));
      return false;
    }
    if (value && !path && typeof value === "object") {
      if (utils$1.endsWith(key, "{}")) {
        key = metaTokens ? key : key.slice(0, -2);
        value = stringifyWithDepthLimit(value, 1);
      } else if (utils$1.isArray(value) && isFlatArray(value) || (utils$1.isFileList(value) || utils$1.endsWith(key, "[]")) && (arr = utils$1.toArray(value))) {
        key = removeBrackets(key);
        arr.forEach(function each(el2, index) {
          !(utils$1.isUndefined(el2) || el2 === null) && formData.append(
            // eslint-disable-next-line no-nested-ternary
            indexes === true ? renderKey([key], index, dots) : indexes === null ? key : key + "[]",
            convertValue(el2)
          );
        });
        return false;
      }
    }
    if (isVisitable(value)) {
      return true;
    }
    formData.append(renderKey(path, key, dots), convertValue(value));
    return false;
  }
  const exposedHelpers = Object.assign(predicates, {
    defaultVisitor,
    convertValue,
    isVisitable
  });
  function build(value, path, depth = 0) {
    if (utils$1.isUndefined(value)) return;
    throwIfMaxDepthExceeded(depth);
    if (stack.indexOf(value) !== -1) {
      throw new Error("Circular reference detected in " + path.join("."));
    }
    stack.push(value);
    utils$1.forEach(value, function each(el2, key) {
      const result = !(utils$1.isUndefined(el2) || el2 === null) && visitor.call(formData, el2, utils$1.isString(key) ? key.trim() : key, path, exposedHelpers);
      if (result === true) {
        build(el2, path ? path.concat(key) : [key], depth + 1);
      }
    });
    stack.pop();
  }
  if (!utils$1.isObject(obj)) {
    throw new TypeError("data must be an object");
  }
  build(obj);
  return formData;
}
function encode$1(str) {
  const charMap = {
    "!": "%21",
    "'": "%27",
    "(": "%28",
    ")": "%29",
    "~": "%7E",
    "%20": "+"
  };
  return encodeURIComponent(str).replace(/[!'()~]|%20/g, function replacer(match) {
    return charMap[match];
  });
}
function AxiosURLSearchParams(params, options) {
  this._pairs = [];
  params && toFormData$1(params, this, options);
}
const prototype = AxiosURLSearchParams.prototype;
prototype.append = function append(name, value) {
  this._pairs.push([name, value]);
};
prototype.toString = function toString2(encoder) {
  const _encode = encoder ? function(value) {
    return encoder.call(this, value, encode$1);
  } : encode$1;
  return this._pairs.map(function each(pair) {
    return _encode(pair[0]) + "=" + _encode(pair[1]);
  }, "").join("&");
};
function encode(val) {
  return encodeURIComponent(val).replace(/%3A/gi, ":").replace(/%24/g, "$").replace(/%2C/gi, ",").replace(/%20/g, "+");
}
function buildURL(url, params, options) {
  if (!params) {
    return url;
  }
  const _options = utils$1.isFunction(options) ? {
    serialize: options
  } : options;
  const _encode = utils$1.getSafeProp(_options, "encode") || encode;
  const serializeFn = utils$1.getSafeProp(_options, "serialize");
  let serializedParams;
  if (serializeFn) {
    serializedParams = serializeFn(params, _options);
  } else {
    serializedParams = utils$1.isURLSearchParams(params) ? params.toString() : new AxiosURLSearchParams(params, _options).toString(_encode);
  }
  if (serializedParams) {
    const hashmarkIndex = url.indexOf("#");
    if (hashmarkIndex !== -1) {
      url = url.slice(0, hashmarkIndex);
    }
    url += (url.indexOf("?") === -1 ? "?" : "&") + serializedParams;
  }
  return url;
}
class InterceptorManager {
  constructor() {
    this.handlers = [];
  }
  /**
   * Add a new interceptor to the stack
   *
   * @param {Function} fulfilled The function to handle `then` for a `Promise`
   * @param {Function} rejected The function to handle `reject` for a `Promise`
   * @param {Object} options The options for the interceptor, synchronous and runWhen
   *
   * @return {Number} An ID used to remove interceptor later
   */
  use(fulfilled, rejected, options) {
    this.handlers.push({
      fulfilled,
      rejected,
      synchronous: options ? options.synchronous : false,
      runWhen: options ? options.runWhen : null
    });
    return this.handlers.length - 1;
  }
  /**
   * Remove an interceptor from the stack
   *
   * @param {Number} id The ID that was returned by `use`
   *
   * @returns {void}
   */
  eject(id2) {
    if (this.handlers[id2]) {
      this.handlers[id2] = null;
    }
  }
  /**
   * Clear all interceptors from the stack
   *
   * @returns {void}
   */
  clear() {
    if (this.handlers) {
      this.handlers = [];
    }
  }
  /**
   * Iterate over all the registered interceptors
   *
   * This method is particularly useful for skipping over any
   * interceptors that may have become `null` calling `eject`.
   *
   * @param {Function} fn The function to call for each interceptor
   *
   * @returns {void}
   */
  forEach(fn) {
    utils$1.forEach(this.handlers, function forEachHandler(h) {
      if (h !== null) {
        fn(h);
      }
    });
  }
}
const transitionalDefaults = {
  silentJSONParsing: true,
  forcedJSONParsing: true,
  clarifyTimeoutError: false,
  legacyInterceptorReqResOrdering: true,
  advertiseZstdAcceptEncoding: false,
  validateStatusUndefinedResolves: true
};
const URLSearchParams$1 = typeof URLSearchParams !== "undefined" ? URLSearchParams : AxiosURLSearchParams;
const FormData$1 = typeof FormData !== "undefined" ? FormData : null;
const Blob$1 = typeof Blob !== "undefined" ? Blob : null;
const platform$1 = {
  isBrowser: true,
  classes: {
    URLSearchParams: URLSearchParams$1,
    FormData: FormData$1,
    Blob: Blob$1
  },
  protocols: ["http", "https", "file", "blob", "url", "data"]
};
const hasBrowserEnv = typeof window !== "undefined" && typeof document !== "undefined";
const _navigator = typeof navigator === "object" && navigator || void 0;
const hasStandardBrowserEnv = hasBrowserEnv && (!_navigator || ["ReactNative", "NativeScript", "NS"].indexOf(_navigator.product) < 0);
const hasStandardBrowserWebWorkerEnv = (() => {
  return typeof WorkerGlobalScope !== "undefined" && // eslint-disable-next-line no-undef
  self instanceof WorkerGlobalScope && typeof self.importScripts === "function";
})();
const origin = hasBrowserEnv && window.location.href || "http://localhost";
const utils = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  hasBrowserEnv,
  hasStandardBrowserEnv,
  hasStandardBrowserWebWorkerEnv,
  navigator: _navigator,
  origin
}, Symbol.toStringTag, { value: "Module" }));
const platform = {
  ...utils,
  ...platform$1
};
function toURLEncodedForm(data, options) {
  return toFormData$1(data, new platform.classes.URLSearchParams(), {
    visitor: function(value, key, path, helpers) {
      if (platform.isNode && utils$1.isBuffer(value)) {
        this.append(key, value.toString("base64"));
        return false;
      }
      return helpers.defaultVisitor.apply(this, arguments);
    },
    ...options
  });
}
const MAX_DEPTH = DEFAULT_FORM_DATA_MAX_DEPTH;
function throwIfDepthExceeded(index) {
  if (index > MAX_DEPTH) {
    throw new AxiosError$1(
      "FormData field is too deeply nested (" + index + " levels). Max depth: " + MAX_DEPTH,
      AxiosError$1.ERR_FORM_DATA_DEPTH_EXCEEDED
    );
  }
}
function parsePropPath(name) {
  const path = [];
  const pattern = /\w+|\[(\w*)]/g;
  let match;
  while ((match = pattern.exec(name)) !== null) {
    throwIfDepthExceeded(path.length);
    path.push(match[0] === "[]" ? "" : match[1] || match[0]);
  }
  return path;
}
function arrayToObject(arr) {
  const obj = {};
  const keys = Object.keys(arr);
  let i;
  const len = keys.length;
  let key;
  for (i = 0; i < len; i++) {
    key = keys[i];
    obj[key] = arr[key];
  }
  return obj;
}
function formDataToJSON(formData) {
  function buildPath(path, value, target, index) {
    throwIfDepthExceeded(index);
    let name = path[index++];
    if (name === "__proto__") return true;
    const isNumericKey = Number.isFinite(+name);
    const isLast = index >= path.length;
    name = !name && utils$1.isArray(target) ? target.length : name;
    if (isLast) {
      if (utils$1.hasOwnProp(target, name)) {
        target[name] = utils$1.isArray(target[name]) ? target[name].concat(value) : [target[name], value];
      } else {
        target[name] = value;
      }
      return !isNumericKey;
    }
    if (!utils$1.hasOwnProp(target, name) || !utils$1.isObject(target[name])) {
      target[name] = [];
    }
    const result = buildPath(path, value, target[name], index);
    if (result && utils$1.isArray(target[name])) {
      target[name] = arrayToObject(target[name]);
    }
    return !isNumericKey;
  }
  if (utils$1.isFormData(formData) && utils$1.isFunction(formData.entries)) {
    const obj = {};
    utils$1.forEachEntry(formData, (name, value) => {
      buildPath(parsePropPath(name), value, obj, 0);
    });
    return obj;
  }
  return null;
}
const own = (obj, key) => obj != null && utils$1.hasOwnProp(obj, key) ? obj[key] : void 0;
function stringifySafely(rawValue, parser, encoder) {
  if (utils$1.isString(rawValue)) {
    try {
      (parser || JSON.parse)(rawValue);
      return utils$1.trim(rawValue);
    } catch (e) {
      if (e.name !== "SyntaxError") {
        throw e;
      }
    }
  }
  return (encoder || JSON.stringify)(rawValue);
}
const defaults = {
  transitional: transitionalDefaults,
  adapter: ["xhr", "http", "fetch"],
  transformRequest: [
    function transformRequest(data, headers) {
      const contentType = headers.getContentType() || "";
      const hasJSONContentType = contentType.indexOf("application/json") > -1;
      const isObjectPayload = utils$1.isObject(data);
      if (isObjectPayload && utils$1.isHTMLForm(data)) {
        data = new FormData(data);
      }
      const isFormData2 = utils$1.isFormData(data);
      if (isFormData2) {
        return hasJSONContentType ? JSON.stringify(formDataToJSON(data)) : data;
      }
      if (utils$1.isArrayBuffer(data) || utils$1.isBuffer(data) || utils$1.isStream(data) || utils$1.isFile(data) || utils$1.isBlob(data) || utils$1.isReadableStream(data)) {
        return data;
      }
      if (utils$1.isArrayBufferView(data)) {
        return data.buffer;
      }
      if (utils$1.isURLSearchParams(data)) {
        headers.setContentType("application/x-www-form-urlencoded;charset=utf-8", false);
        return data.toString();
      }
      let isFileList2;
      if (isObjectPayload) {
        const formSerializer = own(this, "formSerializer");
        if (contentType.indexOf("application/x-www-form-urlencoded") > -1) {
          return toURLEncodedForm(data, formSerializer).toString();
        }
        if ((isFileList2 = utils$1.isFileList(data)) || contentType.indexOf("multipart/form-data") > -1) {
          const env = own(this, "env");
          const _FormData = env && env.FormData;
          return toFormData$1(
            isFileList2 ? { "files[]": data } : data,
            _FormData && new _FormData(),
            formSerializer
          );
        }
      }
      if (isObjectPayload || hasJSONContentType) {
        headers.setContentType("application/json", false);
        return stringifySafely(data);
      }
      return data;
    }
  ],
  transformResponse: [
    function transformResponse(data) {
      const transitional2 = own(this, "transitional") || defaults.transitional;
      const forcedJSONParsing = transitional2 && transitional2.forcedJSONParsing;
      const responseType = own(this, "responseType");
      const JSONRequested = responseType === "json";
      if (utils$1.isResponse(data) || utils$1.isReadableStream(data)) {
        return data;
      }
      if (data && utils$1.isString(data) && (forcedJSONParsing && !responseType || JSONRequested)) {
        const silentJSONParsing = transitional2 && transitional2.silentJSONParsing;
        const strictJSONParsing = !silentJSONParsing && JSONRequested;
        try {
          return JSON.parse(data, own(this, "parseReviver"));
        } catch (e) {
          if (strictJSONParsing) {
            if (e.name === "SyntaxError") {
              throw AxiosError$1.from(e, AxiosError$1.ERR_BAD_RESPONSE, this, null, own(this, "response"));
            }
            throw e;
          }
        }
      }
      return data;
    }
  ],
  /**
   * A timeout in milliseconds to abort a request. If set to 0 (default) a
   * timeout is not created.
   */
  timeout: 0,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
  maxContentLength: -1,
  maxBodyLength: -1,
  env: {
    FormData: platform.classes.FormData,
    Blob: platform.classes.Blob
  },
  validateStatus: function validateStatus(status) {
    return status >= 200 && status < 300;
  },
  headers: {
    common: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": void 0
    }
  }
};
utils$1.forEach(["delete", "get", "head", "post", "put", "patch", "query"], (method) => {
  defaults.headers[method] = {};
});
function transformData(fns, response) {
  const config = this || defaults;
  const context = response || config;
  const headers = AxiosHeaders$1.from(context.headers);
  let data = context.data;
  utils$1.forEach(fns, function transform(fn) {
    data = fn.call(config, data, headers.normalize(), response ? response.status : void 0);
  });
  headers.normalize();
  return data;
}
function isCancel$1(value) {
  return !!(value && value.__CANCEL__);
}
let CanceledError$1 = class CanceledError extends AxiosError$1 {
  /**
   * A `CanceledError` is an object that is thrown when an operation is canceled.
   *
   * @param {string=} message The message.
   * @param {Object=} config The config.
   * @param {Object=} request The request.
   *
   * @returns {CanceledError} The created error.
   */
  constructor(message, config, request) {
    super(message == null ? "canceled" : message, AxiosError$1.ERR_CANCELED, config, request);
    this.name = "CanceledError";
    this.__CANCEL__ = true;
  }
};
function settle(resolve, reject, response) {
  const validateStatus2 = response.config.validateStatus;
  if (!response.status || !validateStatus2 || validateStatus2(response.status)) {
    resolve(response);
  } else {
    reject(new AxiosError$1(
      "Request failed with status code " + response.status,
      response.status >= 400 && response.status < 500 ? AxiosError$1.ERR_BAD_REQUEST : AxiosError$1.ERR_BAD_RESPONSE,
      response.config,
      response.request,
      response
    ));
  }
}
function parseProtocol(url) {
  const match = /^([-+\w]{1,25}):(?:\/\/)?/.exec(url);
  return match && match[1] || "";
}
function speedometer(samplesCount, min) {
  samplesCount = samplesCount || 10;
  const bytes = new Array(samplesCount);
  const timestamps = new Array(samplesCount);
  let head = 0;
  let tail = 0;
  let firstSampleTS;
  min = min !== void 0 ? min : 1e3;
  return function push(chunkLength) {
    const now = Date.now();
    const startedAt = timestamps[tail];
    if (!firstSampleTS) {
      firstSampleTS = now;
    }
    bytes[head] = chunkLength;
    timestamps[head] = now;
    let i = tail;
    let bytesCount = 0;
    while (i !== head) {
      bytesCount += bytes[i++];
      i = i % samplesCount;
    }
    head = (head + 1) % samplesCount;
    if (head === tail) {
      tail = (tail + 1) % samplesCount;
    }
    if (now - firstSampleTS < min) {
      return;
    }
    const passed = startedAt && now - startedAt;
    return passed ? Math.round(bytesCount * 1e3 / passed) : void 0;
  };
}
function throttle(fn, freq) {
  let timestamp = 0;
  let threshold = 1e3 / freq;
  let lastArgs;
  let timer;
  const invoke = (args, now = Date.now()) => {
    timestamp = now;
    lastArgs = null;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    fn(...args);
  };
  const throttled = (...args) => {
    const now = Date.now();
    const passed = now - timestamp;
    if (passed >= threshold) {
      invoke(args, now);
    } else {
      lastArgs = args;
      if (!timer) {
        timer = setTimeout(() => {
          timer = null;
          invoke(lastArgs);
        }, threshold - passed);
      }
    }
  };
  const flush = () => lastArgs && invoke(lastArgs);
  return [throttled, flush];
}
const progressEventReducer = (listener, isDownloadStream, freq = 3) => {
  let bytesNotified = 0;
  const _speedometer = speedometer(50, 250);
  return throttle((e) => {
    if (!e || typeof e.loaded !== "number") {
      return;
    }
    const rawLoaded = e.loaded;
    const total = e.lengthComputable ? e.total : void 0;
    const loaded = total != null ? Math.min(rawLoaded, total) : rawLoaded;
    const progressBytes = Math.max(0, loaded - bytesNotified);
    const rate = _speedometer(progressBytes);
    bytesNotified = Math.max(bytesNotified, loaded);
    const data = {
      loaded,
      total,
      progress: total ? loaded / total : void 0,
      bytes: progressBytes,
      rate: rate ? rate : void 0,
      estimated: rate && total ? (total - loaded) / rate : void 0,
      event: e,
      lengthComputable: total != null,
      [isDownloadStream ? "download" : "upload"]: true
    };
    listener(data);
  }, freq);
};
const progressEventDecorator = (total, throttled) => {
  const lengthComputable = total != null;
  return [
    (loaded) => throttled[0]({
      lengthComputable,
      total,
      loaded
    }),
    throttled[1]
  ];
};
const asyncDecorator = (fn) => (...args) => utils$1.asap(() => fn(...args));
const isURLSameOrigin = platform.hasStandardBrowserEnv ? /* @__PURE__ */ ((origin2, isMSIE) => (url) => {
  url = new URL(url, platform.origin);
  return origin2.protocol === url.protocol && origin2.host === url.host && (isMSIE || origin2.port === url.port);
})(
  new URL(platform.origin),
  platform.navigator && /(msie|trident)/i.test(platform.navigator.userAgent)
) : () => true;
const cookies = platform.hasStandardBrowserEnv ? (
  // Standard browser envs support document.cookie
  {
    write(name, value, expires, path, domain, secure, sameSite) {
      if (typeof document === "undefined") return;
      const cookie = [`${name}=${encodeURIComponent(value)}`];
      if (utils$1.isNumber(expires)) {
        cookie.push(`expires=${new Date(expires).toUTCString()}`);
      }
      if (utils$1.isString(path)) {
        cookie.push(`path=${path}`);
      }
      if (utils$1.isString(domain)) {
        cookie.push(`domain=${domain}`);
      }
      if (secure === true) {
        cookie.push("secure");
      }
      if (utils$1.isString(sameSite)) {
        cookie.push(`SameSite=${sameSite}`);
      }
      document.cookie = cookie.join("; ");
    },
    read(name) {
      if (typeof document === "undefined") return null;
      const cookies2 = document.cookie.split(";");
      for (let i = 0; i < cookies2.length; i++) {
        const cookie = cookies2[i].replace(/^\s+/, "");
        const eq = cookie.indexOf("=");
        if (eq !== -1 && cookie.slice(0, eq) === name) {
          return decodeURIComponent(cookie.slice(eq + 1));
        }
      }
      return null;
    },
    remove(name) {
      this.write(name, "", Date.now() - 864e5, "/");
    }
  }
) : (
  // Non-standard browser env (web workers, react-native) lack needed support.
  {
    write() {
    },
    read() {
      return null;
    },
    remove() {
    }
  }
);
function isAbsoluteURL(url) {
  if (typeof url !== "string") {
    return false;
  }
  return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url);
}
function combineURLs(baseURL, relativeURL) {
  return relativeURL ? baseURL.replace(/\/?\/$/, "") + "/" + relativeURL.replace(/^\/+/, "") : baseURL;
}
const malformedHttpProtocol = /^https?:(?!\/\/)/i;
const httpProtocolControlCharacters = /[\t\n\r]/g;
function stripLeadingC0ControlOrSpace(url) {
  let i = 0;
  while (i < url.length && url.charCodeAt(i) <= 32) {
    i++;
  }
  return url.slice(i);
}
function normalizeURLForProtocolCheck(url) {
  return stripLeadingC0ControlOrSpace(url).replace(httpProtocolControlCharacters, "");
}
function assertValidHttpProtocolURL(url, config) {
  if (typeof url === "string" && malformedHttpProtocol.test(normalizeURLForProtocolCheck(url))) {
    throw new AxiosError$1(
      'Invalid URL: missing "//" after protocol',
      AxiosError$1.ERR_INVALID_URL,
      config
    );
  }
}
function buildFullPath(baseURL, requestedURL, allowAbsoluteUrls, config) {
  assertValidHttpProtocolURL(requestedURL, config);
  let isRelativeUrl = !isAbsoluteURL(requestedURL);
  if (baseURL && (isRelativeUrl || allowAbsoluteUrls === false)) {
    assertValidHttpProtocolURL(baseURL, config);
    return combineURLs(baseURL, requestedURL);
  }
  return requestedURL;
}
const headersToObject = (thing) => thing instanceof AxiosHeaders$1 ? { ...thing } : thing;
function mergeConfig$1(config1, config2) {
  config2 = config2 || {};
  const config = /* @__PURE__ */ Object.create(null);
  Object.defineProperty(config, "hasOwnProperty", {
    // Null-proto descriptor so a polluted Object.prototype.get cannot turn
    // this data descriptor into an accessor descriptor on the way in.
    __proto__: null,
    value: Object.prototype.hasOwnProperty,
    enumerable: false,
    writable: true,
    configurable: true
  });
  function getMergedValue(target, source, prop, caseless) {
    if (utils$1.isPlainObject(target) && utils$1.isPlainObject(source)) {
      return utils$1.merge.call({ caseless }, target, source);
    } else if (utils$1.isPlainObject(source)) {
      return utils$1.merge({}, source);
    } else if (utils$1.isArray(source)) {
      return source.slice();
    }
    return source;
  }
  function mergeDeepProperties(a, b, prop, caseless) {
    if (!utils$1.isUndefined(b)) {
      return getMergedValue(a, b, prop, caseless);
    } else if (!utils$1.isUndefined(a)) {
      return getMergedValue(void 0, a, prop, caseless);
    }
  }
  function valueFromConfig2(a, b) {
    if (!utils$1.isUndefined(b)) {
      return getMergedValue(void 0, b);
    }
  }
  function defaultToConfig2(a, b) {
    if (!utils$1.isUndefined(b)) {
      return getMergedValue(void 0, b);
    } else if (!utils$1.isUndefined(a)) {
      return getMergedValue(void 0, a);
    }
  }
  function getMergedTransitionalOption(prop) {
    const transitional2 = utils$1.hasOwnProp(config2, "transitional") ? config2.transitional : void 0;
    if (!utils$1.isUndefined(transitional2)) {
      if (utils$1.isPlainObject(transitional2)) {
        if (utils$1.hasOwnProp(transitional2, prop)) {
          return transitional2[prop];
        }
      } else {
        return void 0;
      }
    }
    const transitional1 = utils$1.hasOwnProp(config1, "transitional") ? config1.transitional : void 0;
    if (utils$1.isPlainObject(transitional1) && utils$1.hasOwnProp(transitional1, prop)) {
      return transitional1[prop];
    }
    return void 0;
  }
  function mergeDirectKeys(a, b, prop) {
    if (utils$1.hasOwnProp(config2, prop)) {
      return getMergedValue(a, b);
    } else if (utils$1.hasOwnProp(config1, prop)) {
      return getMergedValue(void 0, a);
    }
  }
  const mergeMap = {
    url: valueFromConfig2,
    method: valueFromConfig2,
    data: valueFromConfig2,
    baseURL: defaultToConfig2,
    transformRequest: defaultToConfig2,
    transformResponse: defaultToConfig2,
    paramsSerializer: defaultToConfig2,
    timeout: defaultToConfig2,
    timeoutMessage: defaultToConfig2,
    withCredentials: defaultToConfig2,
    withXSRFToken: defaultToConfig2,
    adapter: defaultToConfig2,
    responseType: defaultToConfig2,
    xsrfCookieName: defaultToConfig2,
    xsrfHeaderName: defaultToConfig2,
    onUploadProgress: defaultToConfig2,
    onDownloadProgress: defaultToConfig2,
    decompress: defaultToConfig2,
    maxContentLength: defaultToConfig2,
    maxBodyLength: defaultToConfig2,
    beforeRedirect: defaultToConfig2,
    transport: defaultToConfig2,
    httpAgent: defaultToConfig2,
    httpsAgent: defaultToConfig2,
    cancelToken: defaultToConfig2,
    socketPath: defaultToConfig2,
    allowedSocketPaths: defaultToConfig2,
    responseEncoding: defaultToConfig2,
    validateStatus: mergeDirectKeys,
    headers: (a, b, prop) => mergeDeepProperties(headersToObject(a), headersToObject(b), prop, true)
  };
  utils$1.forEach(Object.keys({ ...config1, ...config2 }), function computeConfigValue(prop) {
    if (prop === "__proto__" || prop === "constructor" || prop === "prototype") return;
    const merge2 = utils$1.hasOwnProp(mergeMap, prop) ? mergeMap[prop] : mergeDeepProperties;
    const a = utils$1.hasOwnProp(config1, prop) ? config1[prop] : void 0;
    const b = utils$1.hasOwnProp(config2, prop) ? config2[prop] : void 0;
    const configValue = merge2(a, b, prop);
    utils$1.isUndefined(configValue) && merge2 !== mergeDirectKeys || (config[prop] = configValue);
  });
  if (utils$1.hasOwnProp(config2, "validateStatus") && utils$1.isUndefined(config2.validateStatus) && getMergedTransitionalOption("validateStatusUndefinedResolves") === false) {
    if (utils$1.hasOwnProp(config1, "validateStatus")) {
      config.validateStatus = getMergedValue(void 0, config1.validateStatus);
    } else {
      delete config.validateStatus;
    }
  }
  return config;
}
const FORM_DATA_CONTENT_HEADERS = ["content-type", "content-length"];
function setFormDataHeaders(headers, formHeaders, policy) {
  if (policy !== "content-only") {
    headers.set(formHeaders);
    return;
  }
  Object.entries(formHeaders).forEach(([key, val]) => {
    if (FORM_DATA_CONTENT_HEADERS.includes(key.toLowerCase())) {
      headers.set(key, val);
    }
  });
}
const encodeUTF8$1 = (str) => encodeURIComponent(str).replace(
  /%([0-9A-F]{2})/gi,
  (_, hex) => String.fromCharCode(parseInt(hex, 16))
);
function resolveConfig(config) {
  const newConfig = mergeConfig$1({}, config);
  const own2 = (key) => utils$1.hasOwnProp(newConfig, key) ? newConfig[key] : void 0;
  const data = own2("data");
  let withXSRFToken = own2("withXSRFToken");
  const xsrfHeaderName = own2("xsrfHeaderName");
  const xsrfCookieName = own2("xsrfCookieName");
  let headers = own2("headers");
  const auth2 = own2("auth");
  const baseURL = own2("baseURL");
  const allowAbsoluteUrls = own2("allowAbsoluteUrls");
  const url = own2("url");
  newConfig.headers = headers = AxiosHeaders$1.from(headers);
  newConfig.url = buildURL(
    buildFullPath(baseURL, url, allowAbsoluteUrls, newConfig),
    own2("params"),
    own2("paramsSerializer")
  );
  if (auth2) {
    const username = utils$1.getSafeProp(auth2, "username") || "";
    const password = utils$1.getSafeProp(auth2, "password") || "";
    headers.set(
      "Authorization",
      "Basic " + btoa(username + ":" + (password ? encodeUTF8$1(password) : ""))
    );
  }
  if (utils$1.isFormData(data)) {
    if (platform.hasStandardBrowserEnv || platform.hasStandardBrowserWebWorkerEnv || utils$1.isReactNative(data)) {
      headers.setContentType(void 0);
    } else if (utils$1.isFunction(data.getHeaders)) {
      setFormDataHeaders(headers, data.getHeaders(), own2("formDataHeaderPolicy"));
    }
  }
  if (platform.hasStandardBrowserEnv) {
    if (utils$1.isFunction(withXSRFToken)) {
      withXSRFToken = withXSRFToken(newConfig);
    }
    const shouldSendXSRF = withXSRFToken === true || withXSRFToken == null && isURLSameOrigin(newConfig.url);
    if (shouldSendXSRF) {
      const xsrfValue = xsrfHeaderName && xsrfCookieName && cookies.read(xsrfCookieName);
      if (xsrfValue) {
        headers.set(xsrfHeaderName, xsrfValue);
      }
    }
  }
  return newConfig;
}
const isXHRAdapterSupported = typeof XMLHttpRequest !== "undefined";
const xhrAdapter = isXHRAdapterSupported && function(config) {
  return new Promise(function dispatchXhrRequest(resolve, reject) {
    const _config = resolveConfig(config);
    let requestData = _config.data;
    const requestHeaders = AxiosHeaders$1.from(_config.headers).normalize();
    let { responseType, onUploadProgress, onDownloadProgress } = _config;
    let onCanceled;
    let uploadThrottled, downloadThrottled;
    let flushUpload, flushDownload;
    function done() {
      flushUpload && flushUpload();
      flushDownload && flushDownload();
      _config.cancelToken && _config.cancelToken.unsubscribe(onCanceled);
      _config.signal && _config.signal.removeEventListener("abort", onCanceled);
    }
    let request = new XMLHttpRequest();
    request.open(_config.method.toUpperCase(), _config.url, true);
    request.timeout = _config.timeout;
    function onloadend() {
      if (!request) {
        return;
      }
      const responseHeaders = AxiosHeaders$1.from(
        "getAllResponseHeaders" in request && request.getAllResponseHeaders()
      );
      const responseData = !responseType || responseType === "text" || responseType === "json" ? request.responseText : request.response;
      const response = {
        data: responseData,
        status: request.status,
        statusText: request.statusText,
        headers: responseHeaders,
        config,
        request
      };
      settle(
        function _resolve(value) {
          resolve(value);
          done();
        },
        function _reject(err) {
          reject(err);
          done();
        },
        response
      );
      request = null;
    }
    if ("onloadend" in request) {
      request.onloadend = onloadend;
    } else {
      request.onreadystatechange = function handleLoad() {
        if (!request || request.readyState !== 4) {
          return;
        }
        if (request.status === 0 && !(request.responseURL && request.responseURL.startsWith("file:"))) {
          return;
        }
        setTimeout(onloadend);
      };
    }
    request.onabort = function handleAbort() {
      if (!request) {
        return;
      }
      reject(new AxiosError$1("Request aborted", AxiosError$1.ECONNABORTED, config, request));
      done();
      request = null;
    };
    request.onerror = function handleError(event) {
      const msg = event && event.message ? event.message : "Network Error";
      const err = new AxiosError$1(msg, AxiosError$1.ERR_NETWORK, config, request);
      err.event = event || null;
      reject(err);
      done();
      request = null;
    };
    request.ontimeout = function handleTimeout() {
      let timeoutErrorMessage = _config.timeout ? "timeout of " + _config.timeout + "ms exceeded" : "timeout exceeded";
      const transitional2 = _config.transitional || transitionalDefaults;
      if (_config.timeoutErrorMessage) {
        timeoutErrorMessage = _config.timeoutErrorMessage;
      }
      reject(
        new AxiosError$1(
          timeoutErrorMessage,
          transitional2.clarifyTimeoutError ? AxiosError$1.ETIMEDOUT : AxiosError$1.ECONNABORTED,
          config,
          request
        )
      );
      done();
      request = null;
    };
    requestData === void 0 && requestHeaders.setContentType(null);
    if ("setRequestHeader" in request) {
      utils$1.forEach(toByteStringHeaderObject(requestHeaders), function setRequestHeader(val, key) {
        request.setRequestHeader(key, val);
      });
    }
    if (!utils$1.isUndefined(_config.withCredentials)) {
      request.withCredentials = !!_config.withCredentials;
    }
    if (responseType && responseType !== "json") {
      request.responseType = _config.responseType;
    }
    if (onDownloadProgress) {
      [downloadThrottled, flushDownload] = progressEventReducer(onDownloadProgress, true);
      request.addEventListener("progress", downloadThrottled);
    }
    if (onUploadProgress && request.upload) {
      [uploadThrottled, flushUpload] = progressEventReducer(onUploadProgress);
      request.upload.addEventListener("progress", uploadThrottled);
      request.upload.addEventListener("loadend", flushUpload);
    }
    if (_config.cancelToken || _config.signal) {
      onCanceled = (cancel) => {
        if (!request) {
          return;
        }
        reject(!cancel || cancel.type ? new CanceledError$1(null, config, request) : cancel);
        request.abort();
        done();
        request = null;
      };
      _config.cancelToken && _config.cancelToken.subscribe(onCanceled);
      if (_config.signal) {
        _config.signal.aborted ? onCanceled() : _config.signal.addEventListener("abort", onCanceled);
      }
    }
    const protocol = parseProtocol(_config.url);
    if (protocol && !platform.protocols.includes(protocol)) {
      reject(
        new AxiosError$1(
          "Unsupported protocol " + protocol + ":",
          AxiosError$1.ERR_BAD_REQUEST,
          config
        )
      );
      return;
    }
    request.send(requestData || null);
  });
};
const composeSignals = (signals, timeout) => {
  signals = signals ? signals.filter(Boolean) : [];
  if (!timeout && !signals.length) {
    return;
  }
  const controller = new AbortController();
  let aborted = false;
  const onabort = function(reason) {
    if (!aborted) {
      aborted = true;
      unsubscribe();
      const err = reason instanceof Error ? reason : this.reason;
      controller.abort(
        err instanceof AxiosError$1 ? err : new CanceledError$1(err instanceof Error ? err.message : err)
      );
    }
  };
  let timer = timeout && setTimeout(() => {
    timer = null;
    onabort(new AxiosError$1(`timeout of ${timeout}ms exceeded`, AxiosError$1.ETIMEDOUT));
  }, timeout);
  const unsubscribe = () => {
    if (!signals) {
      return;
    }
    timer && clearTimeout(timer);
    timer = null;
    signals.forEach((signal2) => {
      signal2.unsubscribe ? signal2.unsubscribe(onabort) : signal2.removeEventListener("abort", onabort);
    });
    signals = null;
  };
  signals.forEach((signal2) => signal2.addEventListener("abort", onabort));
  const { signal } = controller;
  signal.unsubscribe = () => utils$1.asap(unsubscribe);
  return signal;
};
const streamChunk = function* (chunk, chunkSize) {
  let len = chunk.byteLength;
  if (len < chunkSize) {
    yield chunk;
    return;
  }
  let pos = 0;
  let end;
  while (pos < len) {
    end = pos + chunkSize;
    yield chunk.slice(pos, end);
    pos = end;
  }
};
const readBytes = async function* (iterable, chunkSize) {
  for await (const chunk of readStream(iterable)) {
    yield* streamChunk(chunk, chunkSize);
  }
};
const readStream = async function* (stream) {
  if (stream[Symbol.asyncIterator]) {
    yield* stream;
    return;
  }
  const reader = stream.getReader();
  try {
    for (; ; ) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      yield value;
    }
  } finally {
    await reader.cancel();
  }
};
const trackStream = (stream, chunkSize, onProgress, onFinish) => {
  const iterator2 = readBytes(stream, chunkSize);
  let bytes = 0;
  let done;
  let _onFinish = (e) => {
    if (!done) {
      done = true;
      onFinish && onFinish(e);
    }
  };
  return new ReadableStream(
    {
      async pull(controller) {
        try {
          const { done: done2, value } = await iterator2.next();
          if (done2) {
            _onFinish();
            controller.close();
            return;
          }
          let len = value.byteLength;
          if (onProgress) {
            let loadedBytes = bytes += len;
            onProgress(loadedBytes);
          }
          controller.enqueue(new Uint8Array(value));
        } catch (err) {
          _onFinish(err);
          throw err;
        }
      },
      cancel(reason) {
        _onFinish(reason);
        return iterator2.return();
      }
    },
    {
      highWaterMark: 2
    }
  );
};
const isHexDigit = (charCode) => charCode >= 48 && charCode <= 57 || charCode >= 65 && charCode <= 70 || charCode >= 97 && charCode <= 102;
const isPercentEncodedByte = (str, i, len) => i + 2 < len && isHexDigit(str.charCodeAt(i + 1)) && isHexDigit(str.charCodeAt(i + 2));
function estimateDataURLDecodedBytes(url) {
  if (!url || typeof url !== "string") return 0;
  if (!url.startsWith("data:")) return 0;
  const comma = url.indexOf(",");
  if (comma < 0) return 0;
  const meta = url.slice(5, comma);
  const body = url.slice(comma + 1);
  const isBase64 = /;base64/i.test(meta);
  if (isBase64) {
    let effectiveLen = body.length;
    const len = body.length;
    for (let i = 0; i < len; i++) {
      if (body.charCodeAt(i) === 37 && i + 2 < len) {
        const a = body.charCodeAt(i + 1);
        const b = body.charCodeAt(i + 2);
        const isHex = isHexDigit(a) && isHexDigit(b);
        if (isHex) {
          effectiveLen -= 2;
          i += 2;
        }
      }
    }
    let pad = 0;
    let idx = len - 1;
    const tailIsPct3D = (j) => j >= 2 && body.charCodeAt(j - 2) === 37 && // '%'
    body.charCodeAt(j - 1) === 51 && // '3'
    (body.charCodeAt(j) === 68 || body.charCodeAt(j) === 100);
    if (idx >= 0) {
      if (body.charCodeAt(idx) === 61) {
        pad++;
        idx--;
      } else if (tailIsPct3D(idx)) {
        pad++;
        idx -= 3;
      }
    }
    if (pad === 1 && idx >= 0) {
      if (body.charCodeAt(idx) === 61) {
        pad++;
      } else if (tailIsPct3D(idx)) {
        pad++;
      }
    }
    const groups = Math.floor(effectiveLen / 4);
    const bytes2 = groups * 3 - (pad || 0);
    return bytes2 > 0 ? bytes2 : 0;
  }
  let bytes = 0;
  for (let i = 0, len = body.length; i < len; i++) {
    const c = body.charCodeAt(i);
    if (c === 37 && isPercentEncodedByte(body, i, len)) {
      bytes += 1;
      i += 2;
    } else if (c < 128) {
      bytes += 1;
    } else if (c < 2048) {
      bytes += 2;
    } else if (c >= 55296 && c <= 56319 && i + 1 < len) {
      const next = body.charCodeAt(i + 1);
      if (next >= 56320 && next <= 57343) {
        bytes += 4;
        i++;
      } else {
        bytes += 3;
      }
    } else {
      bytes += 3;
    }
  }
  return bytes;
}
const VERSION$1 = "1.18.0";
const DEFAULT_CHUNK_SIZE = 64 * 1024;
const { isFunction } = utils$1;
const encodeUTF8 = (str) => encodeURIComponent(str).replace(
  /%([0-9A-F]{2})/gi,
  (_, hex) => String.fromCharCode(parseInt(hex, 16))
);
const decodeURIComponentSafe = (value) => {
  if (!utils$1.isString(value)) {
    return value;
  }
  try {
    return decodeURIComponent(value);
  } catch (error) {
    return value;
  }
};
const test = (fn, ...args) => {
  try {
    return !!fn(...args);
  } catch (e) {
    return false;
  }
};
const maybeWithAuthCredentials = (url) => {
  const protocolIndex = url.indexOf("://");
  let urlToCheck = url;
  if (protocolIndex !== -1) {
    urlToCheck = urlToCheck.slice(protocolIndex + 3);
  }
  return urlToCheck.includes("@") || urlToCheck.includes(":");
};
const factory = (env) => {
  const globalObject = utils$1.global !== void 0 && utils$1.global !== null ? utils$1.global : globalThis;
  const { ReadableStream: ReadableStream2, TextEncoder } = globalObject;
  env = utils$1.merge.call(
    {
      skipUndefined: true
    },
    {
      Request: globalObject.Request,
      Response: globalObject.Response
    },
    env
  );
  const { fetch: envFetch, Request, Response } = env;
  const isFetchSupported = envFetch ? isFunction(envFetch) : typeof fetch === "function";
  const isRequestSupported = isFunction(Request);
  const isResponseSupported = isFunction(Response);
  if (!isFetchSupported) {
    return false;
  }
  const isReadableStreamSupported = isFetchSupported && isFunction(ReadableStream2);
  const encodeText = isFetchSupported && (typeof TextEncoder === "function" ? /* @__PURE__ */ ((encoder) => (str) => encoder.encode(str))(new TextEncoder()) : async (str) => new Uint8Array(await new Request(str).arrayBuffer()));
  const supportsRequestStream = isRequestSupported && isReadableStreamSupported && test(() => {
    let duplexAccessed = false;
    const request = new Request(platform.origin, {
      body: new ReadableStream2(),
      method: "POST",
      get duplex() {
        duplexAccessed = true;
        return "half";
      }
    });
    const hasContentType = request.headers.has("Content-Type");
    if (request.body != null) {
      request.body.cancel();
    }
    return duplexAccessed && !hasContentType;
  });
  const supportsResponseStream = isResponseSupported && isReadableStreamSupported && test(() => utils$1.isReadableStream(new Response("").body));
  const resolvers = {
    stream: supportsResponseStream && ((res) => res.body)
  };
  isFetchSupported && (() => {
    ["text", "arrayBuffer", "blob", "formData", "stream"].forEach((type) => {
      !resolvers[type] && (resolvers[type] = (res, config) => {
        let method = res && res[type];
        if (method) {
          return method.call(res);
        }
        throw new AxiosError$1(
          `Response type '${type}' is not supported`,
          AxiosError$1.ERR_NOT_SUPPORT,
          config
        );
      });
    });
  })();
  const getBodyLength = async (body) => {
    if (body == null) {
      return 0;
    }
    if (utils$1.isBlob(body)) {
      return body.size;
    }
    if (utils$1.isSpecCompliantForm(body)) {
      const _request = new Request(platform.origin, {
        method: "POST",
        body
      });
      return (await _request.arrayBuffer()).byteLength;
    }
    if (utils$1.isArrayBufferView(body) || utils$1.isArrayBuffer(body)) {
      return body.byteLength;
    }
    if (utils$1.isURLSearchParams(body)) {
      body = body + "";
    }
    if (utils$1.isString(body)) {
      return (await encodeText(body)).byteLength;
    }
  };
  const resolveBodyLength = async (headers, body) => {
    const length = utils$1.toFiniteNumber(headers.getContentLength());
    return length == null ? getBodyLength(body) : length;
  };
  return async (config) => {
    let {
      url,
      method,
      data,
      signal,
      cancelToken,
      timeout,
      onDownloadProgress,
      onUploadProgress,
      responseType,
      headers,
      withCredentials = "same-origin",
      fetchOptions,
      maxContentLength,
      maxBodyLength
    } = resolveConfig(config);
    const hasMaxContentLength = utils$1.isNumber(maxContentLength) && maxContentLength > -1;
    const hasMaxBodyLength = utils$1.isNumber(maxBodyLength) && maxBodyLength > -1;
    const own2 = (key) => utils$1.hasOwnProp(config, key) ? config[key] : void 0;
    let _fetch = envFetch || fetch;
    responseType = responseType ? (responseType + "").toLowerCase() : "text";
    let composedSignal = composeSignals(
      [signal, cancelToken && cancelToken.toAbortSignal()],
      timeout
    );
    let request = null;
    const unsubscribe = composedSignal && composedSignal.unsubscribe && (() => {
      composedSignal.unsubscribe();
    });
    let requestContentLength;
    let pendingBodyError = null;
    const maxBodyLengthError = () => new AxiosError$1(
      "Request body larger than maxBodyLength limit",
      AxiosError$1.ERR_BAD_REQUEST,
      config,
      request
    );
    try {
      let auth2 = void 0;
      const configAuth = own2("auth");
      if (configAuth) {
        const username = utils$1.getSafeProp(configAuth, "username") || "";
        const password = utils$1.getSafeProp(configAuth, "password") || "";
        auth2 = {
          username,
          password
        };
      }
      if (maybeWithAuthCredentials(url)) {
        const parsedURL = new URL(url, platform.origin);
        if (!auth2 && (parsedURL.username || parsedURL.password)) {
          const urlUsername = decodeURIComponentSafe(parsedURL.username);
          const urlPassword = decodeURIComponentSafe(parsedURL.password);
          auth2 = {
            username: urlUsername,
            password: urlPassword
          };
        }
        if (parsedURL.username || parsedURL.password) {
          parsedURL.username = "";
          parsedURL.password = "";
          url = parsedURL.href;
        }
      }
      if (auth2) {
        headers.delete("authorization");
        headers.set(
          "Authorization",
          "Basic " + btoa(encodeUTF8((auth2.username || "") + ":" + (auth2.password || "")))
        );
      }
      if (hasMaxContentLength && typeof url === "string" && url.startsWith("data:")) {
        const estimated = estimateDataURLDecodedBytes(url);
        if (estimated > maxContentLength) {
          throw new AxiosError$1(
            "maxContentLength size of " + maxContentLength + " exceeded",
            AxiosError$1.ERR_BAD_RESPONSE,
            config,
            request
          );
        }
      }
      if (hasMaxBodyLength && method !== "get" && method !== "head") {
        const outboundLength = await getBodyLength(data);
        if (typeof outboundLength === "number" && isFinite(outboundLength)) {
          requestContentLength = outboundLength;
          if (outboundLength > maxBodyLength) {
            throw maxBodyLengthError();
          }
        }
      }
      const mustEnforceStreamBody = hasMaxBodyLength && (utils$1.isReadableStream(data) || utils$1.isStream(data));
      const trackRequestStream = (stream, onProgress, flush) => trackStream(
        stream,
        DEFAULT_CHUNK_SIZE,
        (loadedBytes) => {
          if (hasMaxBodyLength && loadedBytes > maxBodyLength) {
            throw pendingBodyError = maxBodyLengthError();
          }
          onProgress && onProgress(loadedBytes);
        },
        flush
      );
      if (supportsRequestStream && method !== "get" && method !== "head" && (onUploadProgress || mustEnforceStreamBody)) {
        requestContentLength = requestContentLength == null ? await resolveBodyLength(headers, data) : requestContentLength;
        if (requestContentLength !== 0 || mustEnforceStreamBody) {
          let _request = new Request(url, {
            method: "POST",
            body: data,
            duplex: "half"
          });
          let contentTypeHeader;
          if (utils$1.isFormData(data) && (contentTypeHeader = _request.headers.get("content-type"))) {
            headers.setContentType(contentTypeHeader);
          }
          if (_request.body) {
            const [onProgress, flush] = onUploadProgress && progressEventDecorator(
              requestContentLength,
              progressEventReducer(asyncDecorator(onUploadProgress))
            ) || [];
            data = trackRequestStream(_request.body, onProgress, flush);
          }
        }
      } else if (mustEnforceStreamBody && !isRequestSupported && isReadableStreamSupported && method !== "get" && method !== "head") {
        data = trackRequestStream(data);
      } else if (mustEnforceStreamBody && isRequestSupported && !supportsRequestStream && method !== "get" && method !== "head") {
        throw new AxiosError$1(
          "Stream request bodies are not supported by the current fetch implementation",
          AxiosError$1.ERR_NOT_SUPPORT,
          config,
          request
        );
      }
      if (!utils$1.isString(withCredentials)) {
        withCredentials = withCredentials ? "include" : "omit";
      }
      const isCredentialsSupported = isRequestSupported && "credentials" in Request.prototype;
      if (utils$1.isFormData(data)) {
        const contentType = headers.getContentType();
        if (contentType && /^multipart\/form-data/i.test(contentType) && !/boundary=/i.test(contentType)) {
          headers.delete("content-type");
        }
      }
      headers.set("User-Agent", "axios/" + VERSION$1, false);
      const resolvedOptions = {
        ...fetchOptions,
        signal: composedSignal,
        method: method.toUpperCase(),
        headers: toByteStringHeaderObject(headers.normalize()),
        body: data,
        duplex: "half",
        credentials: isCredentialsSupported ? withCredentials : void 0
      };
      request = isRequestSupported && new Request(url, resolvedOptions);
      let response = await (isRequestSupported ? _fetch(request, fetchOptions) : _fetch(url, resolvedOptions));
      const responseHeaders = AxiosHeaders$1.from(response.headers);
      if (hasMaxContentLength) {
        const declaredLength = utils$1.toFiniteNumber(responseHeaders.getContentLength());
        if (declaredLength != null && declaredLength > maxContentLength) {
          throw new AxiosError$1(
            "maxContentLength size of " + maxContentLength + " exceeded",
            AxiosError$1.ERR_BAD_RESPONSE,
            config,
            request
          );
        }
      }
      const isStreamResponse = supportsResponseStream && (responseType === "stream" || responseType === "response");
      if (supportsResponseStream && response.body && (onDownloadProgress || hasMaxContentLength || isStreamResponse && unsubscribe)) {
        const options = {};
        ["status", "statusText", "headers"].forEach((prop) => {
          options[prop] = response[prop];
        });
        const responseContentLength = utils$1.toFiniteNumber(responseHeaders.getContentLength());
        const [onProgress, flush] = onDownloadProgress && progressEventDecorator(
          responseContentLength,
          progressEventReducer(asyncDecorator(onDownloadProgress), true)
        ) || [];
        let bytesRead = 0;
        const onChunkProgress = (loadedBytes) => {
          if (hasMaxContentLength) {
            bytesRead = loadedBytes;
            if (bytesRead > maxContentLength) {
              throw new AxiosError$1(
                "maxContentLength size of " + maxContentLength + " exceeded",
                AxiosError$1.ERR_BAD_RESPONSE,
                config,
                request
              );
            }
          }
          onProgress && onProgress(loadedBytes);
        };
        response = new Response(
          trackStream(response.body, DEFAULT_CHUNK_SIZE, onChunkProgress, () => {
            flush && flush();
            unsubscribe && unsubscribe();
          }),
          options
        );
      }
      responseType = responseType || "text";
      let responseData = await resolvers[utils$1.findKey(resolvers, responseType) || "text"](
        response,
        config
      );
      if (hasMaxContentLength && !supportsResponseStream && !isStreamResponse) {
        let materializedSize;
        if (responseData != null) {
          if (typeof responseData.byteLength === "number") {
            materializedSize = responseData.byteLength;
          } else if (typeof responseData.size === "number") {
            materializedSize = responseData.size;
          } else if (typeof responseData === "string") {
            materializedSize = typeof TextEncoder === "function" ? new TextEncoder().encode(responseData).byteLength : responseData.length;
          }
        }
        if (typeof materializedSize === "number" && materializedSize > maxContentLength) {
          throw new AxiosError$1(
            "maxContentLength size of " + maxContentLength + " exceeded",
            AxiosError$1.ERR_BAD_RESPONSE,
            config,
            request
          );
        }
      }
      !isStreamResponse && unsubscribe && unsubscribe();
      return await new Promise((resolve, reject) => {
        settle(resolve, reject, {
          data: responseData,
          headers: AxiosHeaders$1.from(response.headers),
          status: response.status,
          statusText: response.statusText,
          config,
          request
        });
      });
    } catch (err) {
      unsubscribe && unsubscribe();
      if (composedSignal && composedSignal.aborted && composedSignal.reason instanceof AxiosError$1) {
        const canceledError = composedSignal.reason;
        canceledError.config = config;
        request && (canceledError.request = request);
        err !== canceledError && (canceledError.cause = err);
        throw canceledError;
      }
      if (pendingBodyError) {
        request && !pendingBodyError.request && (pendingBodyError.request = request);
        throw pendingBodyError;
      }
      if (err instanceof AxiosError$1) {
        request && !err.request && (err.request = request);
        throw err;
      }
      if (err && err.name === "TypeError" && /Load failed|fetch/i.test(err.message)) {
        throw Object.assign(
          new AxiosError$1(
            "Network Error",
            AxiosError$1.ERR_NETWORK,
            config,
            request,
            err && err.response
          ),
          {
            cause: err.cause || err
          }
        );
      }
      throw AxiosError$1.from(err, err && err.code, config, request, err && err.response);
    }
  };
};
const seedCache = /* @__PURE__ */ new Map();
const getFetch = (config) => {
  let env = config && config.env || {};
  const { fetch: fetch2, Request, Response } = env;
  const seeds = [Request, Response, fetch2];
  let len = seeds.length, i = len, seed, target, map = seedCache;
  while (i--) {
    seed = seeds[i];
    target = map.get(seed);
    target === void 0 && map.set(seed, target = i ? /* @__PURE__ */ new Map() : factory(env));
    map = target;
  }
  return target;
};
getFetch();
const knownAdapters = {
  http: httpAdapter,
  xhr: xhrAdapter,
  fetch: {
    get: getFetch
  }
};
utils$1.forEach(knownAdapters, (fn, value) => {
  if (fn) {
    try {
      Object.defineProperty(fn, "name", { __proto__: null, value });
    } catch (e) {
    }
    Object.defineProperty(fn, "adapterName", { __proto__: null, value });
  }
});
const renderReason = (reason) => `- ${reason}`;
const isResolvedHandle = (adapter) => utils$1.isFunction(adapter) || adapter === null || adapter === false;
function getAdapter$1(adapters2, config) {
  adapters2 = utils$1.isArray(adapters2) ? adapters2 : [adapters2];
  const { length } = adapters2;
  let nameOrAdapter;
  let adapter;
  const rejectedReasons = {};
  for (let i = 0; i < length; i++) {
    nameOrAdapter = adapters2[i];
    let id2;
    adapter = nameOrAdapter;
    if (!isResolvedHandle(nameOrAdapter)) {
      adapter = knownAdapters[(id2 = String(nameOrAdapter)).toLowerCase()];
      if (adapter === void 0) {
        throw new AxiosError$1(`Unknown adapter '${id2}'`);
      }
    }
    if (adapter && (utils$1.isFunction(adapter) || (adapter = adapter.get(config)))) {
      break;
    }
    rejectedReasons[id2 || "#" + i] = adapter;
  }
  if (!adapter) {
    const reasons = Object.entries(rejectedReasons).map(
      ([id2, state]) => `adapter ${id2} ` + (state === false ? "is not supported by the environment" : "is not available in the build")
    );
    let s = length ? reasons.length > 1 ? "since :\n" + reasons.map(renderReason).join("\n") : " " + renderReason(reasons[0]) : "as no adapter specified";
    throw new AxiosError$1(
      `There is no suitable adapter to dispatch the request ` + s,
      "ERR_NOT_SUPPORT"
    );
  }
  return adapter;
}
const adapters = {
  /**
   * Resolve an adapter from a list of adapter names or functions.
   * @type {Function}
   */
  getAdapter: getAdapter$1,
  /**
   * Exposes all known adapters
   * @type {Object<string, Function|Object>}
   */
  adapters: knownAdapters
};
function throwIfCancellationRequested(config) {
  if (config.cancelToken) {
    config.cancelToken.throwIfRequested();
  }
  if (config.signal && config.signal.aborted) {
    throw new CanceledError$1(null, config);
  }
}
function dispatchRequest(config) {
  throwIfCancellationRequested(config);
  config.headers = AxiosHeaders$1.from(config.headers);
  config.data = transformData.call(config, config.transformRequest);
  if (["post", "put", "patch"].indexOf(config.method) !== -1) {
    config.headers.setContentType("application/x-www-form-urlencoded", false);
  }
  const adapter = adapters.getAdapter(config.adapter || defaults.adapter, config);
  return adapter(config).then(
    function onAdapterResolution(response) {
      throwIfCancellationRequested(config);
      config.response = response;
      try {
        response.data = transformData.call(config, config.transformResponse, response);
      } finally {
        delete config.response;
      }
      response.headers = AxiosHeaders$1.from(response.headers);
      return response;
    },
    function onAdapterRejection(reason) {
      if (!isCancel$1(reason)) {
        throwIfCancellationRequested(config);
        if (reason && reason.response) {
          config.response = reason.response;
          try {
            reason.response.data = transformData.call(
              config,
              config.transformResponse,
              reason.response
            );
          } finally {
            delete config.response;
          }
          reason.response.headers = AxiosHeaders$1.from(reason.response.headers);
        }
      }
      return Promise.reject(reason);
    }
  );
}
const validators$1 = {};
["object", "boolean", "number", "function", "string", "symbol"].forEach((type, i) => {
  validators$1[type] = function validator2(thing) {
    return typeof thing === type || "a" + (i < 1 ? "n " : " ") + type;
  };
});
const deprecatedWarnings = {};
validators$1.transitional = function transitional(validator2, version, message) {
  function formatMessage(opt, desc) {
    return "[Axios v" + VERSION$1 + "] Transitional option '" + opt + "'" + desc + (message ? ". " + message : "");
  }
  return (value, opt, opts) => {
    if (validator2 === false) {
      throw new AxiosError$1(
        formatMessage(opt, " has been removed" + (version ? " in " + version : "")),
        AxiosError$1.ERR_DEPRECATED
      );
    }
    if (version && !deprecatedWarnings[opt]) {
      deprecatedWarnings[opt] = true;
      console.warn(
        formatMessage(
          opt,
          " has been deprecated since v" + version + " and will be removed in the near future"
        )
      );
    }
    return validator2 ? validator2(value, opt, opts) : true;
  };
};
validators$1.spelling = function spelling(correctSpelling) {
  return (value, opt) => {
    console.warn(`${opt} is likely a misspelling of ${correctSpelling}`);
    return true;
  };
};
function assertOptions(options, schema, allowUnknown) {
  if (typeof options !== "object") {
    throw new AxiosError$1("options must be an object", AxiosError$1.ERR_BAD_OPTION_VALUE);
  }
  const keys = Object.keys(options);
  let i = keys.length;
  while (i-- > 0) {
    const opt = keys[i];
    const validator2 = Object.prototype.hasOwnProperty.call(schema, opt) ? schema[opt] : void 0;
    if (validator2) {
      const value = options[opt];
      const result = value === void 0 || validator2(value, opt, options);
      if (result !== true) {
        throw new AxiosError$1(
          "option " + opt + " must be " + result,
          AxiosError$1.ERR_BAD_OPTION_VALUE
        );
      }
      continue;
    }
    if (allowUnknown !== true) {
      throw new AxiosError$1("Unknown option " + opt, AxiosError$1.ERR_BAD_OPTION);
    }
  }
}
const validator = {
  assertOptions,
  validators: validators$1
};
const validators = validator.validators;
let Axios$1 = class Axios {
  constructor(instanceConfig) {
    this.defaults = instanceConfig || {};
    this.interceptors = {
      request: new InterceptorManager(),
      response: new InterceptorManager()
    };
  }
  /**
   * Dispatch a request
   *
   * @param {String|Object} configOrUrl The config specific for this request (merged with this.defaults)
   * @param {?Object} config
   *
   * @returns {Promise} The Promise to be fulfilled
   */
  async request(configOrUrl, config) {
    try {
      return await this._request(configOrUrl, config);
    } catch (err) {
      if (err instanceof Error) {
        let dummy = {};
        Error.captureStackTrace ? Error.captureStackTrace(dummy) : dummy = new Error();
        const stack = (() => {
          if (!dummy.stack) {
            return "";
          }
          const firstNewlineIndex = dummy.stack.indexOf("\n");
          return firstNewlineIndex === -1 ? "" : dummy.stack.slice(firstNewlineIndex + 1);
        })();
        try {
          if (!err.stack) {
            err.stack = stack;
          } else if (stack) {
            const firstNewlineIndex = stack.indexOf("\n");
            const secondNewlineIndex = firstNewlineIndex === -1 ? -1 : stack.indexOf("\n", firstNewlineIndex + 1);
            const stackWithoutTwoTopLines = secondNewlineIndex === -1 ? "" : stack.slice(secondNewlineIndex + 1);
            if (!String(err.stack).endsWith(stackWithoutTwoTopLines)) {
              err.stack += "\n" + stack;
            }
          }
        } catch (e) {
        }
      }
      throw err;
    }
  }
  _request(configOrUrl, config) {
    if (typeof configOrUrl === "string") {
      config = config || {};
      config.url = configOrUrl;
    } else {
      config = configOrUrl || {};
    }
    config = mergeConfig$1(this.defaults, config);
    const { transitional: transitional2, paramsSerializer, headers } = config;
    if (transitional2 !== void 0) {
      validator.assertOptions(
        transitional2,
        {
          silentJSONParsing: validators.transitional(validators.boolean),
          forcedJSONParsing: validators.transitional(validators.boolean),
          clarifyTimeoutError: validators.transitional(validators.boolean),
          legacyInterceptorReqResOrdering: validators.transitional(validators.boolean),
          advertiseZstdAcceptEncoding: validators.transitional(validators.boolean),
          validateStatusUndefinedResolves: validators.transitional(validators.boolean)
        },
        false
      );
    }
    if (paramsSerializer != null) {
      if (utils$1.isFunction(paramsSerializer)) {
        config.paramsSerializer = {
          serialize: paramsSerializer
        };
      } else {
        validator.assertOptions(
          paramsSerializer,
          {
            encode: validators.function,
            serialize: validators.function
          },
          true
        );
      }
    }
    if (config.allowAbsoluteUrls !== void 0) ;
    else if (this.defaults.allowAbsoluteUrls !== void 0) {
      config.allowAbsoluteUrls = this.defaults.allowAbsoluteUrls;
    } else {
      config.allowAbsoluteUrls = true;
    }
    validator.assertOptions(
      config,
      {
        baseUrl: validators.spelling("baseURL"),
        withXsrfToken: validators.spelling("withXSRFToken")
      },
      true
    );
    config.method = (config.method || this.defaults.method || "get").toLowerCase();
    let contextHeaders = headers && utils$1.merge(headers.common, headers[config.method]);
    headers && utils$1.forEach(["delete", "get", "head", "post", "put", "patch", "query", "common"], (method) => {
      delete headers[method];
    });
    config.headers = AxiosHeaders$1.concat(contextHeaders, headers);
    const requestInterceptorChain = [];
    let synchronousRequestInterceptors = true;
    this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
      if (typeof interceptor.runWhen === "function" && interceptor.runWhen(config) === false) {
        return;
      }
      synchronousRequestInterceptors = synchronousRequestInterceptors && interceptor.synchronous;
      const transitional3 = config.transitional || transitionalDefaults;
      const legacyInterceptorReqResOrdering = transitional3 && transitional3.legacyInterceptorReqResOrdering;
      if (legacyInterceptorReqResOrdering) {
        requestInterceptorChain.unshift(interceptor.fulfilled, interceptor.rejected);
      } else {
        requestInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
      }
    });
    const responseInterceptorChain = [];
    this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
      responseInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
    });
    let promise;
    let i = 0;
    let len;
    if (!synchronousRequestInterceptors) {
      const chain = [dispatchRequest.bind(this), void 0];
      chain.unshift(...requestInterceptorChain);
      chain.push(...responseInterceptorChain);
      len = chain.length;
      promise = Promise.resolve(config);
      while (i < len) {
        promise = promise.then(chain[i++], chain[i++]);
      }
      return promise;
    }
    len = requestInterceptorChain.length;
    let newConfig = config;
    while (i < len) {
      const onFulfilled = requestInterceptorChain[i++];
      const onRejected = requestInterceptorChain[i++];
      try {
        newConfig = onFulfilled(newConfig);
      } catch (error) {
        onRejected.call(this, error);
        break;
      }
    }
    try {
      promise = dispatchRequest.call(this, newConfig);
    } catch (error) {
      return Promise.reject(error);
    }
    i = 0;
    len = responseInterceptorChain.length;
    while (i < len) {
      promise = promise.then(responseInterceptorChain[i++], responseInterceptorChain[i++]);
    }
    return promise;
  }
  getUri(config) {
    config = mergeConfig$1(this.defaults, config);
    const fullPath = buildFullPath(config.baseURL, config.url, config.allowAbsoluteUrls, config);
    return buildURL(fullPath, config.params, config.paramsSerializer);
  }
};
utils$1.forEach(["delete", "get", "head", "options"], function forEachMethodNoData(method) {
  Axios$1.prototype[method] = function(url, config) {
    return this.request(
      mergeConfig$1(config || {}, {
        method,
        url,
        data: config && utils$1.hasOwnProp(config, "data") ? config.data : void 0
      })
    );
  };
});
utils$1.forEach(["post", "put", "patch", "query"], function forEachMethodWithData(method) {
  function generateHTTPMethod(isForm) {
    return function httpMethod(url, data, config) {
      return this.request(
        mergeConfig$1(config || {}, {
          method,
          headers: isForm ? {
            "Content-Type": "multipart/form-data"
          } : {},
          url,
          data
        })
      );
    };
  }
  Axios$1.prototype[method] = generateHTTPMethod();
  if (method !== "query") {
    Axios$1.prototype[method + "Form"] = generateHTTPMethod(true);
  }
});
let CancelToken$1 = class CancelToken {
  constructor(executor) {
    if (typeof executor !== "function") {
      throw new TypeError("executor must be a function.");
    }
    let resolvePromise;
    this.promise = new Promise(function promiseExecutor(resolve) {
      resolvePromise = resolve;
    });
    const token = this;
    this.promise.then((cancel) => {
      if (!token._listeners) return;
      let i = token._listeners.length;
      while (i-- > 0) {
        token._listeners[i](cancel);
      }
      token._listeners = null;
    });
    this.promise.then = (onfulfilled) => {
      let _resolve;
      const promise = new Promise((resolve) => {
        token.subscribe(resolve);
        _resolve = resolve;
      }).then(onfulfilled);
      promise.cancel = function reject() {
        token.unsubscribe(_resolve);
      };
      return promise;
    };
    executor(function cancel(message, config, request) {
      if (token.reason) {
        return;
      }
      token.reason = new CanceledError$1(message, config, request);
      resolvePromise(token.reason);
    });
  }
  /**
   * Throws a `CanceledError` if cancellation has been requested.
   */
  throwIfRequested() {
    if (this.reason) {
      throw this.reason;
    }
  }
  /**
   * Subscribe to the cancel signal
   */
  subscribe(listener) {
    if (this.reason) {
      listener(this.reason);
      return;
    }
    if (this._listeners) {
      this._listeners.push(listener);
    } else {
      this._listeners = [listener];
    }
  }
  /**
   * Unsubscribe from the cancel signal
   */
  unsubscribe(listener) {
    if (!this._listeners) {
      return;
    }
    const index = this._listeners.indexOf(listener);
    if (index !== -1) {
      this._listeners.splice(index, 1);
    }
  }
  toAbortSignal() {
    const controller = new AbortController();
    const abort = (err) => {
      controller.abort(err);
    };
    this.subscribe(abort);
    controller.signal.unsubscribe = () => this.unsubscribe(abort);
    return controller.signal;
  }
  /**
   * Returns an object that contains a new `CancelToken` and a function that, when called,
   * cancels the `CancelToken`.
   */
  static source() {
    let cancel;
    const token = new CancelToken(function executor(c) {
      cancel = c;
    });
    return {
      token,
      cancel
    };
  }
};
function spread$1(callback) {
  return function wrap(arr) {
    return callback.apply(null, arr);
  };
}
function isAxiosError$1(payload) {
  return utils$1.isObject(payload) && payload.isAxiosError === true;
}
const HttpStatusCode$1 = {
  Continue: 100,
  SwitchingProtocols: 101,
  Processing: 102,
  EarlyHints: 103,
  Ok: 200,
  Created: 201,
  Accepted: 202,
  NonAuthoritativeInformation: 203,
  NoContent: 204,
  ResetContent: 205,
  PartialContent: 206,
  MultiStatus: 207,
  AlreadyReported: 208,
  ImUsed: 226,
  MultipleChoices: 300,
  MovedPermanently: 301,
  Found: 302,
  SeeOther: 303,
  NotModified: 304,
  UseProxy: 305,
  Unused: 306,
  TemporaryRedirect: 307,
  PermanentRedirect: 308,
  BadRequest: 400,
  Unauthorized: 401,
  PaymentRequired: 402,
  Forbidden: 403,
  NotFound: 404,
  MethodNotAllowed: 405,
  NotAcceptable: 406,
  ProxyAuthenticationRequired: 407,
  RequestTimeout: 408,
  Conflict: 409,
  Gone: 410,
  LengthRequired: 411,
  PreconditionFailed: 412,
  PayloadTooLarge: 413,
  UriTooLong: 414,
  UnsupportedMediaType: 415,
  RangeNotSatisfiable: 416,
  ExpectationFailed: 417,
  ImATeapot: 418,
  MisdirectedRequest: 421,
  UnprocessableEntity: 422,
  Locked: 423,
  FailedDependency: 424,
  TooEarly: 425,
  UpgradeRequired: 426,
  PreconditionRequired: 428,
  TooManyRequests: 429,
  RequestHeaderFieldsTooLarge: 431,
  UnavailableForLegalReasons: 451,
  InternalServerError: 500,
  NotImplemented: 501,
  BadGateway: 502,
  ServiceUnavailable: 503,
  GatewayTimeout: 504,
  HttpVersionNotSupported: 505,
  VariantAlsoNegotiates: 506,
  InsufficientStorage: 507,
  LoopDetected: 508,
  NotExtended: 510,
  NetworkAuthenticationRequired: 511,
  WebServerIsDown: 521,
  ConnectionTimedOut: 522,
  OriginIsUnreachable: 523,
  TimeoutOccurred: 524,
  SslHandshakeFailed: 525,
  InvalidSslCertificate: 526
};
Object.entries(HttpStatusCode$1).forEach(([key, value]) => {
  HttpStatusCode$1[value] = key;
});
function createInstance(defaultConfig) {
  const context = new Axios$1(defaultConfig);
  const instance = bind(Axios$1.prototype.request, context);
  utils$1.extend(instance, Axios$1.prototype, context, { allOwnKeys: true });
  utils$1.extend(instance, context, null, { allOwnKeys: true });
  instance.create = function create2(instanceConfig) {
    return createInstance(mergeConfig$1(defaultConfig, instanceConfig));
  };
  return instance;
}
const axios = createInstance(defaults);
axios.Axios = Axios$1;
axios.CanceledError = CanceledError$1;
axios.CancelToken = CancelToken$1;
axios.isCancel = isCancel$1;
axios.VERSION = VERSION$1;
axios.toFormData = toFormData$1;
axios.AxiosError = AxiosError$1;
axios.Cancel = axios.CanceledError;
axios.all = function all(promises) {
  return Promise.all(promises);
};
axios.spread = spread$1;
axios.isAxiosError = isAxiosError$1;
axios.mergeConfig = mergeConfig$1;
axios.AxiosHeaders = AxiosHeaders$1;
axios.formToJSON = (thing) => formDataToJSON(utils$1.isHTMLForm(thing) ? new FormData(thing) : thing);
axios.getAdapter = adapters.getAdapter;
axios.HttpStatusCode = HttpStatusCode$1;
axios.default = axios;
const {
  Axios: Axios2,
  AxiosError: AxiosError2,
  CanceledError: CanceledError2,
  isCancel,
  CancelToken: CancelToken2,
  VERSION,
  all: all2,
  Cancel,
  isAxiosError,
  spread,
  toFormData,
  AxiosHeaders: AxiosHeaders2,
  HttpStatusCode,
  formToJSON,
  getAdapter,
  mergeConfig,
  create
} = axios;
const _base = "http://localhost:5000/api";
const BASE = _base.endsWith("/api") ? _base : `${_base}/api`;
const http = axios.create({ baseURL: BASE });
http.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});
http.interceptors.response.use(
  (r2) => r2,
  (err) => {
    var _a;
    if (((_a = err.response) == null ? void 0 : _a.status) === 401) {
      localStorage.removeItem("token");
      window.location.href = "/";
    }
    return Promise.reject(err);
  }
);
const auth = {
  signup: (data) => http.post("/auth/signup", data),
  login: (data) => http.post("/auth/login", data),
  me: () => http.get("/auth/me"),
  update: (data) => http.patch("/auth/me", data)
};
const onboarding = {
  session: () => http.post("/onboarding/session"),
  complete: (data) => http.post("/onboarding/complete", data)
  // streaming: call fetch() directly with SSE
};
const companies = {
  get: () => http.get("/companies"),
  update: (data) => http.patch("/companies", data),
  updateConfig: (data) => http.patch("/companies/config", data),
  updateLeadSource: (source, data) => http.patch(`/companies/config/lead-sources/${source}`, data)
};
const projects = {
  list: () => http.get("/projects"),
  get: (id2) => http.get(`/projects/${id2}`),
  create: (data) => http.post("/projects", data),
  update: (id2, data) => http.patch(`/projects/${id2}`, data),
  delete: (id2) => http.delete(`/projects/${id2}`),
  addPhase: (id2, data) => http.post(`/projects/${id2}/phases`, data),
  updatePhase: (id2, pid, data) => http.patch(`/projects/${id2}/phases/${pid}`, data),
  resetPortalToken: (id2) => http.post(`/projects/${id2}/reset-portal-token`),
  getPortalMessages: (id2) => http.get(`/projects/${id2}/portal-messages`),
  geocode: (id2) => http.post(`/projects/${id2}/geocode`),
  // Batch J — rentabilité, corps de métiers, dépenses
  profitability: (id2) => http.get(`/projects/${id2}/profitability`),
  addTrade: (id2, data) => http.post(`/projects/${id2}/trades`, data),
  updateTrade: (id2, tid, data) => http.patch(`/projects/${id2}/trades/${tid}`, data),
  deleteTrade: (id2, tid) => http.delete(`/projects/${id2}/trades/${tid}`),
  addExpense: (id2, data) => http.post(`/projects/${id2}/expenses`, data),
  deleteExpense: (id2, eid) => http.delete(`/projects/${id2}/expenses/${eid}`),
  // Batch 3 — estimation terrain
  estimateField: (id2, data) => http.post(`/projects/${id2}/estimate-field`, data),
  sendPrice: (id2, data) => http.post(`/projects/${id2}/send-price`, data),
  requestClientMedia: (id2, data) => http.post(`/projects/${id2}/request-client-media`, data)
};
const leads = {
  list: (params) => http.get("/leads", { params }),
  get: (id2) => http.get(`/leads/${id2}`),
  create: (data) => http.post("/leads", data),
  update: (id2, data) => http.patch(`/leads/${id2}`, data),
  delete: (id2) => http.delete(`/leads/${id2}`)
};
const contacts = {
  list: (params) => http.get("/contacts", { params }),
  get: (id2) => http.get(`/contacts/${id2}`),
  create: (data) => http.post("/contacts", data),
  update: (id2, data) => http.patch(`/contacts/${id2}`, data),
  delete: (id2) => http.delete(`/contacts/${id2}`)
};
const quotes = {
  list: () => http.get("/quotes"),
  byProject: (projectId) => http.get(`/quotes/project/${projectId}`),
  get: (id2) => http.get(`/quotes/${id2}`),
  create: (data) => http.post("/quotes", data),
  update: (id2, data) => http.patch(`/quotes/${id2}`, data),
  delete: (id2) => http.delete(`/quotes/${id2}`),
  convert: (id2) => http.post(`/quotes/${id2}/convert`),
  send: (id2) => http.post(`/quotes/${id2}/send`),
  generateContract: (id2, data) => http.post(`/quotes/${id2}/generate-contract`, data || {})
};
const contracts = {
  list: (params) => http.get("/contracts", { params }),
  get: (id2) => http.get(`/contracts/${id2}`),
  update: (id2, data) => http.patch(`/contracts/${id2}`, data),
  delete: (id2) => http.delete(`/contracts/${id2}`),
  send: (id2) => http.post(`/contracts/${id2}/send`)
};
const invoices = {
  list: (params) => http.get("/invoices", { params }),
  get: (id2) => http.get(`/invoices/${id2}`),
  create: (data) => http.post("/invoices", data),
  update: (id2, data) => http.patch(`/invoices/${id2}`, data),
  delete: (id2) => http.delete(`/invoices/${id2}`)
};
const subcontractors = {
  list: () => http.get("/subcontractors"),
  create: (data) => http.post("/subcontractors", data),
  update: (id2, data) => http.patch(`/subcontractors/${id2}`, data),
  delete: (id2) => http.delete(`/subcontractors/${id2}`)
};
const rfqs = {
  list: () => http.get("/rfqs"),
  byProject: (projectId) => http.get(`/rfqs/project/${projectId}`),
  get: (id2) => http.get(`/rfqs/${id2}`),
  create: (data) => http.post("/rfqs", data),
  invite: (id2, ids) => http.post(`/rfqs/${id2}/invite`, { subcontractor_ids: ids })
};
const punch = {
  generate: (data) => http.post("/punch/generate", data),
  clockIn: (data) => http.post("/punch/clock-in", data),
  clockOut: (data) => http.post("/punch/clock-out", data),
  getSite: (token) => http.get(`/punch/${token}`)
};
const timesheets = {
  list: (params) => http.get("/timesheets", { params }),
  approve: (id2) => http.patch(`/timesheets/${id2}/approve`)
};
const documents = {
  list: (projectId) => http.get(`/documents/project/${projectId}`),
  upload: (data) => http.post("/documents", data)
};
const pdf = {
  quoteUrl: (id2) => `${BASE}/pdf/quote/${id2}`,
  invoiceUrl: (id2) => `${BASE}/pdf/invoice/${id2}`
};
const email = {
  sendQuote: (id2, data) => http.post(`/email/quote/${id2}`, data),
  sendInvoice: (id2, data) => http.post(`/email/invoice/${id2}`, data)
};
const ai = {
  healthCheck: () => http.get("/ai/health-check"),
  estimate: (data) => http.post("/ai/estimate", data),
  actions: () => http.get("/ai/actions"),
  updateAction: (id2, data) => http.patch(`/ai/actions/${id2}`, data),
  newConversation: (data) => http.post("/chat/conversations", data),
  usage: () => http.get("/ai/usage"),
  buyCredits: (amount) => http.post("/ai/credits", { amount })
};
const dashboard = {
  summary: () => http.get("/dashboard/summary"),
  activity: () => http.get("/dashboard/activity"),
  presence: () => http.get("/dashboard/presence"),
  notifications: () => http.get("/dashboard/notifications")
};
const quittances = {
  list: (params) => http.get("/quittances", { params }),
  create: (data) => http.post("/quittances", data),
  update: (id2, data) => http.patch(`/quittances/${id2}`, data),
  delete: (id2) => http.delete(`/quittances/${id2}`)
};
const changeOrders = {
  list: (params) => http.get("/change-orders", { params }),
  create: (data) => http.post("/change-orders", data),
  update: (id2, data) => http.patch(`/change-orders/${id2}`, data),
  delete: (id2) => http.delete(`/change-orders/${id2}`)
};
const members = {
  list: () => http.get("/members"),
  invite: (data) => http.post("/members/invite", data),
  updateRole: (id2, role) => http.patch(`/members/${id2}/role`, { role }),
  remove: (id2) => http.delete(`/members/${id2}`),
  cancelInvite: (id2) => http.delete(`/members/invites/${id2}`)
};
const dev = {
  plans: () => http.get("/dev/plans"),
  current: () => http.get("/dev/current"),
  switch: (data) => http.post("/dev/switch", data),
  clear: () => http.delete("/dev/switch")
};
const api$3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ai,
  auth,
  changeOrders,
  companies,
  contacts,
  contracts,
  dashboard,
  default: http,
  dev,
  documents,
  email,
  invoices,
  leads,
  members,
  onboarding,
  pdf,
  projects,
  punch,
  quittances,
  quotes,
  rfqs,
  subcontractors,
  timesheets
}, Symbol.toStringTag, { value: "Module" }));
const DEFAULT_PIPELINE = [
  { key: "brouillon", label: "Brouillon", color: "#94a3b8" },
  { key: "estimation", label: "Estimation terrain", color: "#a855f7" },
  { key: "prix_envoye", label: "Prix envoyé", color: "#f59e0b" },
  { key: "accepte", label: "Accepté", color: "#3b82f6" },
  { key: "planifie", label: "Planifié", color: "#6366f1" },
  { key: "en_chantier", label: "En chantier", color: "#22c55e" },
  { key: "a_facturer", label: "À facturer", color: "#eab308" },
  { key: "paye", label: "Payé", color: "#10b981" },
  { key: "clos", label: "Clos", color: "#64748b", terminal: true }
];
const CORE_MODULES = [
  { key: "dashboard", label: "Tableau de bord", path: "/dashboard", icon: "LayoutDashboard" },
  { key: "chat", label: "Assistant IA", path: "/chat", icon: "Sparkles", highlight: true },
  { key: "projets", label: "Projets", path: "/projets", icon: "FolderKanban" }
];
const SECONDARY_MODULES = [
  { key: "leads", label: "Leads", path: "/leads", icon: "Users" },
  { key: "soumissions", label: "Soumissions", path: "/soumissions", icon: "FileText" },
  { key: "contrats", label: "Contrats", path: "/contrats", icon: "FileSignature", comingSoon: true },
  { key: "commandes", label: "Commandes", path: "/commandes", icon: "ShoppingCart", comingSoon: true },
  { key: "factures", label: "Factures", path: "/factures", icon: "Receipt" },
  { key: "factures_achat", label: "Factures d'achat", path: "/factures-achat", icon: "FileStack", comingSoon: true },
  { key: "sous_traitants", label: "Sous-traitants", path: "/sous-traitants", icon: "HardHat" },
  { key: "punch", label: "Punch", path: "/punch", icon: "QrCode" },
  { key: "rapport", label: "Rapport", path: "/rapport", icon: "BarChart3" },
  { key: "contacts", label: "Contacts", path: "/contacts", icon: "BookUser" }
];
const ROLE_ALLOW = {
  owner: "ALL",
  chef_chantier: "ALL",
  technicien: ["dashboard", "chat", "projets", "punch", "soumissions"],
  sous_traitant: ["chat", "projets", "punch"],
  client_readonly: ["chat", "projets"]
};
function roleAllows(role, key) {
  const a = ROLE_ALLOW[role] || "ALL";
  return a === "ALL" ? true : a.includes(key);
}
function defaultModulesEnabled() {
  return {
    leads: true,
    soumissions: true,
    factures: true,
    sous_traitants: true,
    punch: true,
    rapport: true,
    contacts: false,
    contrats: false,
    commandes: false,
    factures_achat: false
  };
}
const useAuthStore = create$1(
  persist(
    (set) => ({
      user: null,
      company: null,
      plan: null,
      token: null,
      isAuthenticated: false,
      setAuth: ({ token, user, company, plan }) => {
        localStorage.setItem("token", token);
        set({ token, user, company, plan, isAuthenticated: true });
      },
      setCompany: (company) => set({ company }),
      setPlan: (plan) => set({ plan }),
      logout: () => {
        localStorage.removeItem("token");
        set({ user: null, company: null, plan: null, token: null, isAuthenticated: false });
      }
    }),
    { name: "monflux-auth", partialize: (s) => ({ token: s.token, user: s.user, company: s.company }) }
  )
);
const useUIStore = create$1(
  persist(
    (set) => ({
      darkMode: false,
      sidebarOpen: true,
      activeModule: "dashboard",
      toggleDark: () => set((s) => {
        const d = !s.darkMode;
        document.documentElement.classList.toggle("dark", d);
        return { darkMode: d };
      }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setModule: (m2) => set({ activeModule: m2 })
    }),
    {
      name: "monflux-ui",
      partialize: (s) => ({ darkMode: s.darkMode, sidebarOpen: s.sidebarOpen }),
      onRehydrateStorage: () => (state) => {
        if (state == null ? void 0 : state.darkMode) document.documentElement.classList.add("dark");
      }
    }
  )
);
const useDevStore = create$1((set) => ({
  enabled: false,
  currentOverride: null,
  setOverride: (o) => set({ currentOverride: o })
}));
const useConfigStore = create$1((set, get) => ({
  modules: null,
  // objet modules_enabled { key: bool }
  pipeline: null,
  // tableau d'états [{ key, label, color, terminal? }]
  loaded: false,
  loading: false,
  load: async (force = false) => {
    if (get().loading || get().loaded && !force) return;
    set({ loading: true });
    try {
      const { data } = await companies.get();
      set({
        modules: data.modules_enabled || defaultModulesEnabled(),
        pipeline: Array.isArray(data.pipeline_stages) && data.pipeline_stages.length ? data.pipeline_stages : DEFAULT_PIPELINE,
        loaded: true
      });
    } catch {
      set({ modules: defaultModulesEnabled(), pipeline: DEFAULT_PIPELINE, loaded: true });
    } finally {
      set({ loading: false });
    }
  },
  toggleModule: async (key) => {
    var _a;
    const modules = { ...get().modules || {}, [key]: !((_a = get().modules) == null ? void 0 : _a[key]) };
    set({ modules });
    try {
      await companies.update({ modules_enabled: modules });
    } catch {
    }
  },
  setPipeline: async (pipeline) => {
    set({ pipeline });
    try {
      await companies.update({ pipeline_stages: pipeline });
    } catch {
    }
  },
  reset: () => set({ modules: null, pipeline: null, loaded: false })
}));
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
var defaultAttributes = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round"
};
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const toKebabCase = (string) => string.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase().trim();
const createLucideIcon = (iconName, iconNode) => {
  const Component = reactExports.forwardRef(
    ({ color = "currentColor", size = 24, strokeWidth = 2, absoluteStrokeWidth, className = "", children, ...rest }, ref) => reactExports.createElement(
      "svg",
      {
        ref,
        ...defaultAttributes,
        width: size,
        height: size,
        stroke: color,
        strokeWidth: absoluteStrokeWidth ? Number(strokeWidth) * 24 / Number(size) : strokeWidth,
        className: ["lucide", `lucide-${toKebabCase(iconName)}`, className].join(" "),
        ...rest
      },
      [
        ...iconNode.map(([tag, attrs]) => reactExports.createElement(tag, attrs)),
        ...Array.isArray(children) ? children : [children]
      ]
    )
  );
  Component.displayName = `${iconName}`;
  return Component;
};
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Activity = createLucideIcon("Activity", [
  ["path", { d: "M22 12h-4l-3 9L9 3l-3 9H2", key: "d5dnw9" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const AlertCircle = createLucideIcon("AlertCircle", [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["line", { x1: "12", x2: "12", y1: "8", y2: "12", key: "1pkeuh" }],
  ["line", { x1: "12", x2: "12.01", y1: "16", y2: "16", key: "4dfq90" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const AlertTriangle = createLucideIcon("AlertTriangle", [
  [
    "path",
    {
      d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z",
      key: "c3ski4"
    }
  ],
  ["path", { d: "M12 9v4", key: "juzpu7" }],
  ["path", { d: "M12 17h.01", key: "p32p05" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const ArrowDown = createLucideIcon("ArrowDown", [
  ["path", { d: "M12 5v14", key: "s699le" }],
  ["path", { d: "m19 12-7 7-7-7", key: "1idqje" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const ArrowLeft = createLucideIcon("ArrowLeft", [
  ["path", { d: "m12 19-7-7 7-7", key: "1l729n" }],
  ["path", { d: "M19 12H5", key: "x3x0zl" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const ArrowRight = createLucideIcon("ArrowRight", [
  ["path", { d: "M5 12h14", key: "1ays0h" }],
  ["path", { d: "m12 5 7 7-7 7", key: "xquz4c" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const ArrowUp = createLucideIcon("ArrowUp", [
  ["path", { d: "m5 12 7-7 7 7", key: "hav0vg" }],
  ["path", { d: "M12 19V5", key: "x0mq9r" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const BarChart3 = createLucideIcon("BarChart3", [
  ["path", { d: "M3 3v18h18", key: "1s2lah" }],
  ["path", { d: "M18 17V9", key: "2bz60n" }],
  ["path", { d: "M13 17V5", key: "1frdt8" }],
  ["path", { d: "M8 17v-3", key: "17ska0" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Bell = createLucideIcon("Bell", [
  ["path", { d: "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9", key: "1qo2s2" }],
  ["path", { d: "M10.3 21a1.94 1.94 0 0 0 3.4 0", key: "qgo35s" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const BookUser = createLucideIcon("BookUser", [
  ["path", { d: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20", key: "t4utmx" }],
  ["circle", { cx: "12", cy: "8", r: "2", key: "1822b1" }],
  ["path", { d: "M15 13a3 3 0 1 0-6 0", key: "10j68g" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Briefcase = createLucideIcon("Briefcase", [
  ["rect", { width: "20", height: "14", x: "2", y: "7", rx: "2", ry: "2", key: "eto64e" }],
  ["path", { d: "M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16", key: "zwj3tp" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Building2 = createLucideIcon("Building2", [
  ["path", { d: "M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z", key: "1b4qmf" }],
  ["path", { d: "M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2", key: "i71pzd" }],
  ["path", { d: "M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2", key: "10jefs" }],
  ["path", { d: "M10 6h4", key: "1itunk" }],
  ["path", { d: "M10 10h4", key: "tcdvrf" }],
  ["path", { d: "M10 14h4", key: "kelpxr" }],
  ["path", { d: "M10 18h4", key: "1ulq68" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Calendar = createLucideIcon("Calendar", [
  ["rect", { width: "18", height: "18", x: "3", y: "4", rx: "2", ry: "2", key: "eu3xkr" }],
  ["line", { x1: "16", x2: "16", y1: "2", y2: "6", key: "m3sa8f" }],
  ["line", { x1: "8", x2: "8", y1: "2", y2: "6", key: "18kwsl" }],
  ["line", { x1: "3", x2: "21", y1: "10", y2: "10", key: "xt86sb" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Camera = createLucideIcon("Camera", [
  [
    "path",
    {
      d: "M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z",
      key: "1tc9qg"
    }
  ],
  ["circle", { cx: "12", cy: "13", r: "3", key: "1vg3eu" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const CheckCheck = createLucideIcon("CheckCheck", [
  ["path", { d: "M18 6 7 17l-5-5", key: "116fxf" }],
  ["path", { d: "m22 10-7.5 7.5L13 16", key: "ke71qq" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const CheckCircle2 = createLucideIcon("CheckCircle2", [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "m9 12 2 2 4-4", key: "dzmm74" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const CheckCircle = createLucideIcon("CheckCircle", [
  ["path", { d: "M22 11.08V12a10 10 0 1 1-5.93-9.14", key: "g774vq" }],
  ["path", { d: "m9 11 3 3L22 4", key: "1pflzl" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Check = createLucideIcon("Check", [["path", { d: "M20 6 9 17l-5-5", key: "1gmf2c" }]]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const ChevronRight = createLucideIcon("ChevronRight", [
  ["path", { d: "m9 18 6-6-6-6", key: "mthhwq" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const ClipboardCheck = createLucideIcon("ClipboardCheck", [
  ["rect", { width: "8", height: "4", x: "8", y: "2", rx: "1", ry: "1", key: "tgr4d6" }],
  [
    "path",
    {
      d: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2",
      key: "116196"
    }
  ],
  ["path", { d: "m9 14 2 2 4-4", key: "df797q" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const ClipboardList = createLucideIcon("ClipboardList", [
  ["rect", { width: "8", height: "4", x: "8", y: "2", rx: "1", ry: "1", key: "tgr4d6" }],
  [
    "path",
    {
      d: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2",
      key: "116196"
    }
  ],
  ["path", { d: "M12 11h4", key: "1jrz19" }],
  ["path", { d: "M12 16h4", key: "n85exb" }],
  ["path", { d: "M8 11h.01", key: "1dfujw" }],
  ["path", { d: "M8 16h.01", key: "18s6g9" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Clock = createLucideIcon("Clock", [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["polyline", { points: "12 6 12 12 16 14", key: "68esgv" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Copy = createLucideIcon("Copy", [
  ["rect", { width: "14", height: "14", x: "8", y: "8", rx: "2", ry: "2", key: "17jyea" }],
  ["path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2", key: "zix9uf" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const CreditCard = createLucideIcon("CreditCard", [
  ["rect", { width: "20", height: "14", x: "2", y: "5", rx: "2", key: "ynyp8z" }],
  ["line", { x1: "2", x2: "22", y1: "10", y2: "10", key: "1b3vmo" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const DollarSign = createLucideIcon("DollarSign", [
  ["line", { x1: "12", x2: "12", y1: "2", y2: "22", key: "7eqyqh" }],
  ["path", { d: "M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6", key: "1b0p4s" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Download = createLucideIcon("Download", [
  ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", key: "ih7n3h" }],
  ["polyline", { points: "7 10 12 15 17 10", key: "2ggqvy" }],
  ["line", { x1: "12", x2: "12", y1: "15", y2: "3", key: "1vk2je" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const ExternalLink = createLucideIcon("ExternalLink", [
  ["path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6", key: "a6xqqp" }],
  ["polyline", { points: "15 3 21 3 21 9", key: "mznyad" }],
  ["line", { x1: "10", x2: "21", y1: "14", y2: "3", key: "18c3s4" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Eye = createLucideIcon("Eye", [
  ["path", { d: "M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z", key: "rwhkz3" }],
  ["circle", { cx: "12", cy: "12", r: "3", key: "1v7zrd" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const FileEdit = createLucideIcon("FileEdit", [
  ["path", { d: "M4 13.5V4a2 2 0 0 1 2-2h8.5L20 7.5V20a2 2 0 0 1-2 2h-5.5", key: "1bg6eb" }],
  ["polyline", { points: "14 2 14 8 20 8", key: "1ew0cm" }],
  [
    "path",
    { d: "M10.42 12.61a2.1 2.1 0 1 1 2.97 2.97L7.95 21 4 22l.99-3.95 5.43-5.44Z", key: "1rgxu8" }
  ]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const FileQuestion = createLucideIcon("FileQuestion", [
  [
    "path",
    { d: "M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z", key: "1nnpy2" }
  ],
  [
    "path",
    {
      d: "M10 10.3c.2-.4.5-.8.9-1a2.1 2.1 0 0 1 2.6.4c.3.4.5.8.5 1.3 0 1.3-2 2-2 2",
      key: "1umxtm"
    }
  ],
  ["path", { d: "M12 17h.01", key: "p32p05" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const FileSignature = createLucideIcon("FileSignature", [
  [
    "path",
    { d: "M20 19.5v.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8.5L18 5.5", key: "kd5d3" }
  ],
  ["path", { d: "M8 18h1", key: "13wk12" }],
  [
    "path",
    { d: "M18.42 9.61a2.1 2.1 0 1 1 2.97 2.97L16.95 17 13 18l.99-3.95 4.43-4.44Z", key: "johvi5" }
  ]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const FileStack = createLucideIcon("FileStack", [
  ["path", { d: "M16 2v5h5", key: "kt2in0" }],
  [
    "path",
    {
      d: "M21 6v6.5c0 .8-.7 1.5-1.5 1.5h-7c-.8 0-1.5-.7-1.5-1.5v-9c0-.8.7-1.5 1.5-1.5H17l4 4z",
      key: "1km23n"
    }
  ],
  ["path", { d: "M7 8v8.8c0 .3.2.6.4.8.2.2.5.4.8.4H15", key: "16874u" }],
  ["path", { d: "M3 12v8.8c0 .3.2.6.4.8.2.2.5.4.8.4H11", key: "k2ox98" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const FileText = createLucideIcon("FileText", [
  [
    "path",
    { d: "M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z", key: "1nnpy2" }
  ],
  ["polyline", { points: "14 2 14 8 20 8", key: "1ew0cm" }],
  ["line", { x1: "16", x2: "8", y1: "13", y2: "13", key: "14keom" }],
  ["line", { x1: "16", x2: "8", y1: "17", y2: "17", key: "17nazh" }],
  ["line", { x1: "10", x2: "8", y1: "9", y2: "9", key: "1a5vjj" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const FolderClosed = createLucideIcon("FolderClosed", [
  [
    "path",
    {
      d: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z",
      key: "1kt360"
    }
  ],
  ["path", { d: "M2 10h20", key: "1ir3d8" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const FolderKanban = createLucideIcon("FolderKanban", [
  [
    "path",
    {
      d: "M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z",
      key: "1fr9dc"
    }
  ],
  ["path", { d: "M8 10v4", key: "tgpxqk" }],
  ["path", { d: "M12 10v2", key: "hh53o1" }],
  ["path", { d: "M16 10v6", key: "1d6xys" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const FolderOpen = createLucideIcon("FolderOpen", [
  [
    "path",
    {
      d: "m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2",
      key: "usdka0"
    }
  ]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const GitBranch = createLucideIcon("GitBranch", [
  ["line", { x1: "6", x2: "6", y1: "3", y2: "15", key: "17qcm7" }],
  ["circle", { cx: "18", cy: "6", r: "3", key: "1h7g24" }],
  ["circle", { cx: "6", cy: "18", r: "3", key: "fqmcym" }],
  ["path", { d: "M18 9a9 9 0 0 1-9 9", key: "n2h4wq" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Globe = createLucideIcon("Globe", [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20", key: "13o1zl" }],
  ["path", { d: "M2 12h20", key: "9i4pu4" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const HardHat = createLucideIcon("HardHat", [
  [
    "path",
    {
      d: "M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2z",
      key: "1dej2m"
    }
  ],
  ["path", { d: "M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5", key: "1p9q5i" }],
  ["path", { d: "M4 15v-3a6 6 0 0 1 6-6h0", key: "1uc279" }],
  ["path", { d: "M14 6h0a6 6 0 0 1 6 6v3", key: "1j9mnm" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const ImagePlus = createLucideIcon("ImagePlus", [
  ["path", { d: "M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7", key: "31hg93" }],
  ["line", { x1: "16", x2: "22", y1: "5", y2: "5", key: "ez7e4s" }],
  ["line", { x1: "19", x2: "19", y1: "2", y2: "8", key: "1gkr8c" }],
  ["circle", { cx: "9", cy: "9", r: "2", key: "af1f0g" }],
  ["path", { d: "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21", key: "1xmnt7" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Info = createLucideIcon("Info", [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "M12 16v-4", key: "1dtifu" }],
  ["path", { d: "M12 8h.01", key: "e9boi3" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const LayoutDashboard = createLucideIcon("LayoutDashboard", [
  ["rect", { width: "7", height: "9", x: "3", y: "3", rx: "1", key: "10lvy0" }],
  ["rect", { width: "7", height: "5", x: "14", y: "3", rx: "1", key: "16une8" }],
  ["rect", { width: "7", height: "9", x: "14", y: "12", rx: "1", key: "1hutg5" }],
  ["rect", { width: "7", height: "5", x: "3", y: "16", rx: "1", key: "ldoo1y" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Link2 = createLucideIcon("Link2", [
  ["path", { d: "M9 17H7A5 5 0 0 1 7 7h2", key: "8i5ue5" }],
  ["path", { d: "M15 7h2a5 5 0 1 1 0 10h-2", key: "1b9ql8" }],
  ["line", { x1: "8", x2: "16", y1: "12", y2: "12", key: "1jonct" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const List = createLucideIcon("List", [
  ["line", { x1: "8", x2: "21", y1: "6", y2: "6", key: "7ey8pc" }],
  ["line", { x1: "8", x2: "21", y1: "12", y2: "12", key: "rjfblc" }],
  ["line", { x1: "8", x2: "21", y1: "18", y2: "18", key: "c3b1m8" }],
  ["line", { x1: "3", x2: "3.01", y1: "6", y2: "6", key: "1g7gq3" }],
  ["line", { x1: "3", x2: "3.01", y1: "12", y2: "12", key: "1pjlvk" }],
  ["line", { x1: "3", x2: "3.01", y1: "18", y2: "18", key: "28t2mc" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Loader2 = createLucideIcon("Loader2", [
  ["path", { d: "M21 12a9 9 0 1 1-6.219-8.56", key: "13zald" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const LogOut = createLucideIcon("LogOut", [
  ["path", { d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", key: "1uf3rs" }],
  ["polyline", { points: "16 17 21 12 16 7", key: "1gabdz" }],
  ["line", { x1: "21", x2: "9", y1: "12", y2: "12", key: "1uyos4" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Mail = createLucideIcon("Mail", [
  ["rect", { width: "20", height: "16", x: "2", y: "4", rx: "2", key: "18n3k1" }],
  ["path", { d: "m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7", key: "1ocrg3" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const MapPin = createLucideIcon("MapPin", [
  ["path", { d: "M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z", key: "2oe9fu" }],
  ["circle", { cx: "12", cy: "10", r: "3", key: "ilqhr7" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Map$1 = createLucideIcon("Map", [
  ["polygon", { points: "3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21", key: "ok2ie8" }],
  ["line", { x1: "9", x2: "9", y1: "3", y2: "18", key: "w34qz5" }],
  ["line", { x1: "15", x2: "15", y1: "6", y2: "21", key: "volv9a" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Menu = createLucideIcon("Menu", [
  ["line", { x1: "4", x2: "20", y1: "12", y2: "12", key: "1e0a9i" }],
  ["line", { x1: "4", x2: "20", y1: "6", y2: "6", key: "1owob3" }],
  ["line", { x1: "4", x2: "20", y1: "18", y2: "18", key: "yk5zj1" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const MessageCircle = createLucideIcon("MessageCircle", [
  ["path", { d: "m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z", key: "v2veuj" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Mic = createLucideIcon("Mic", [
  ["path", { d: "M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z", key: "131961" }],
  ["path", { d: "M19 10v2a7 7 0 0 1-14 0v-2", key: "1vc78b" }],
  ["line", { x1: "12", x2: "12", y1: "19", y2: "22", key: "x3vr5v" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Moon = createLucideIcon("Moon", [
  ["path", { d: "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z", key: "a7tn18" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const PenLine = createLucideIcon("PenLine", [
  ["path", { d: "M12 20h9", key: "t2du7b" }],
  ["path", { d: "M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z", key: "ymcmye" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Pencil = createLucideIcon("Pencil", [
  ["path", { d: "M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z", key: "5qss01" }],
  ["path", { d: "m15 5 4 4", key: "1mk7zo" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Phone = createLucideIcon("Phone", [
  [
    "path",
    {
      d: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z",
      key: "foiqr5"
    }
  ]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Plus = createLucideIcon("Plus", [
  ["path", { d: "M5 12h14", key: "1ays0h" }],
  ["path", { d: "M12 5v14", key: "s699le" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const QrCode = createLucideIcon("QrCode", [
  ["rect", { width: "5", height: "5", x: "3", y: "3", rx: "1", key: "1tu5fj" }],
  ["rect", { width: "5", height: "5", x: "16", y: "3", rx: "1", key: "1v8r4q" }],
  ["rect", { width: "5", height: "5", x: "3", y: "16", rx: "1", key: "1x03jg" }],
  ["path", { d: "M21 16h-3a2 2 0 0 0-2 2v3", key: "177gqh" }],
  ["path", { d: "M21 21v.01", key: "ents32" }],
  ["path", { d: "M12 7v3a2 2 0 0 1-2 2H7", key: "8crl2c" }],
  ["path", { d: "M3 12h.01", key: "nlz23k" }],
  ["path", { d: "M12 3h.01", key: "n36tog" }],
  ["path", { d: "M12 16v.01", key: "133mhm" }],
  ["path", { d: "M16 12h1", key: "1slzba" }],
  ["path", { d: "M21 12v.01", key: "1lwtk9" }],
  ["path", { d: "M12 21v-1", key: "1880an" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Receipt = createLucideIcon("Receipt", [
  [
    "path",
    {
      d: "M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z",
      key: "wqdwcb"
    }
  ],
  ["path", { d: "M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8", key: "1h4pet" }],
  ["path", { d: "M12 17V7", key: "pyj7ub" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const RefreshCw = createLucideIcon("RefreshCw", [
  ["path", { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8", key: "v9h5vc" }],
  ["path", { d: "M21 3v5h-5", key: "1q7to0" }],
  ["path", { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16", key: "3uifl3" }],
  ["path", { d: "M8 16H3v5", key: "1cv678" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Save = createLucideIcon("Save", [
  ["path", { d: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z", key: "1owoqh" }],
  ["polyline", { points: "17 21 17 13 7 13 7 21", key: "1md35c" }],
  ["polyline", { points: "7 3 7 8 15 8", key: "8nz8an" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Search = createLucideIcon("Search", [
  ["circle", { cx: "11", cy: "11", r: "8", key: "4ej97u" }],
  ["path", { d: "m21 21-4.3-4.3", key: "1qie3q" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Send = createLucideIcon("Send", [
  ["path", { d: "m22 2-7 20-4-9-9-4Z", key: "1q3vgg" }],
  ["path", { d: "M22 2 11 13", key: "nzbqef" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Settings2 = createLucideIcon("Settings2", [
  ["path", { d: "M20 7h-9", key: "3s1dr2" }],
  ["path", { d: "M14 17H5", key: "gfn3mx" }],
  ["circle", { cx: "17", cy: "17", r: "3", key: "18b49y" }],
  ["circle", { cx: "7", cy: "7", r: "3", key: "dfmy0x" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Settings = createLucideIcon("Settings", [
  [
    "path",
    {
      d: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z",
      key: "1qme2f"
    }
  ],
  ["circle", { cx: "12", cy: "12", r: "3", key: "1v7zrd" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Shield = createLucideIcon("Shield", [
  ["path", { d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10", key: "1irkt0" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const ShoppingCart = createLucideIcon("ShoppingCart", [
  ["circle", { cx: "8", cy: "21", r: "1", key: "jimo8o" }],
  ["circle", { cx: "19", cy: "21", r: "1", key: "13723u" }],
  [
    "path",
    {
      d: "M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12",
      key: "9zh506"
    }
  ]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const SlidersHorizontal = createLucideIcon("SlidersHorizontal", [
  ["line", { x1: "21", x2: "14", y1: "4", y2: "4", key: "obuewd" }],
  ["line", { x1: "10", x2: "3", y1: "4", y2: "4", key: "1q6298" }],
  ["line", { x1: "21", x2: "12", y1: "12", y2: "12", key: "1iu8h1" }],
  ["line", { x1: "8", x2: "3", y1: "12", y2: "12", key: "ntss68" }],
  ["line", { x1: "21", x2: "16", y1: "20", y2: "20", key: "14d8ph" }],
  ["line", { x1: "12", x2: "3", y1: "20", y2: "20", key: "m0wm8r" }],
  ["line", { x1: "14", x2: "14", y1: "2", y2: "6", key: "14e1ph" }],
  ["line", { x1: "8", x2: "8", y1: "10", y2: "14", key: "1i6ji0" }],
  ["line", { x1: "16", x2: "16", y1: "18", y2: "22", key: "1lctlv" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Sparkles = createLucideIcon("Sparkles", [
  [
    "path",
    {
      d: "m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z",
      key: "17u4zn"
    }
  ],
  ["path", { d: "M5 3v4", key: "bklmnn" }],
  ["path", { d: "M19 17v4", key: "iiml17" }],
  ["path", { d: "M3 5h4", key: "nem4j1" }],
  ["path", { d: "M17 19h4", key: "lbex7p" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Star = createLucideIcon("Star", [
  [
    "polygon",
    {
      points: "12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2",
      key: "8f66p6"
    }
  ]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const StickyNote = createLucideIcon("StickyNote", [
  [
    "path",
    { d: "M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z", key: "1wis1t" }
  ],
  ["path", { d: "M15 3v6h6", key: "edgan2" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Sun = createLucideIcon("Sun", [
  ["circle", { cx: "12", cy: "12", r: "4", key: "4exip2" }],
  ["path", { d: "M12 2v2", key: "tus03m" }],
  ["path", { d: "M12 20v2", key: "1lh1kg" }],
  ["path", { d: "m4.93 4.93 1.41 1.41", key: "149t6j" }],
  ["path", { d: "m17.66 17.66 1.41 1.41", key: "ptbguv" }],
  ["path", { d: "M2 12h2", key: "1t8f8n" }],
  ["path", { d: "M20 12h2", key: "1q8mjw" }],
  ["path", { d: "m6.34 17.66-1.41 1.41", key: "1m8zz5" }],
  ["path", { d: "m19.07 4.93-1.41 1.41", key: "1shlcs" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const ToggleLeft = createLucideIcon("ToggleLeft", [
  ["rect", { width: "20", height: "12", x: "2", y: "6", rx: "6", ry: "6", key: "f2vt7d" }],
  ["circle", { cx: "8", cy: "12", r: "2", key: "1nvbw3" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const ToggleRight = createLucideIcon("ToggleRight", [
  ["rect", { width: "20", height: "12", x: "2", y: "6", rx: "6", ry: "6", key: "f2vt7d" }],
  ["circle", { cx: "16", cy: "12", r: "2", key: "4ma0v8" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Trash2 = createLucideIcon("Trash2", [
  ["path", { d: "M3 6h18", key: "d0wm0j" }],
  ["path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6", key: "4alrt4" }],
  ["path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2", key: "v07s0e" }],
  ["line", { x1: "10", x2: "10", y1: "11", y2: "17", key: "1uufr5" }],
  ["line", { x1: "14", x2: "14", y1: "11", y2: "17", key: "xtxkd" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const TrendingUp = createLucideIcon("TrendingUp", [
  ["polyline", { points: "22 7 13.5 15.5 8.5 10.5 2 17", key: "126l90" }],
  ["polyline", { points: "16 7 22 7 22 13", key: "kwv8wd" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const UserPlus = createLucideIcon("UserPlus", [
  ["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", key: "1yyitq" }],
  ["circle", { cx: "9", cy: "7", r: "4", key: "nufk8" }],
  ["line", { x1: "19", x2: "19", y1: "8", y2: "14", key: "1bvyxn" }],
  ["line", { x1: "22", x2: "16", y1: "11", y2: "11", key: "1shjgl" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const User = createLucideIcon("User", [
  ["path", { d: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2", key: "975kel" }],
  ["circle", { cx: "12", cy: "7", r: "4", key: "17ys0d" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Users = createLucideIcon("Users", [
  ["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", key: "1yyitq" }],
  ["circle", { cx: "9", cy: "7", r: "4", key: "nufk8" }],
  ["path", { d: "M22 21v-2a4 4 0 0 0-3-3.87", key: "kshegd" }],
  ["path", { d: "M16 3.13a4 4 0 0 1 0 7.75", key: "1da9ce" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Wrench = createLucideIcon("Wrench", [
  [
    "path",
    {
      d: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",
      key: "cbrjhi"
    }
  ]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const XCircle = createLucideIcon("XCircle", [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "m15 9-6 6", key: "1uzhvr" }],
  ["path", { d: "m9 9 6 6", key: "z0biqf" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const X = createLucideIcon("X", [
  ["path", { d: "M18 6 6 18", key: "1bl5f8" }],
  ["path", { d: "m6 6 12 12", key: "d8bk6v" }]
]);
/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Zap = createLucideIcon("Zap", [
  ["polygon", { points: "13 2 3 14 12 14 11 22 21 10 12 10 13 2", key: "45s27k" }]
]);
function Auth() {
  const [mode, setMode] = reactExports.useState("login");
  const [form, setForm] = reactExports.useState({ email: "", password: "", name: "" });
  const [error, setError] = reactExports.useState("");
  const [loading, setLoading] = reactExports.useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const set = (k2) => (e) => setForm((f2) => ({ ...f2, [k2]: e.target.value }));
  const submit = async (e) => {
    var _a, _b;
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const fn = mode === "login" ? auth.login : auth.signup;
      const { data } = await fn(form);
      setAuth({ token: data.token, user: data.user, company: data.company });
      if (data.needs_onboarding) navigate("/onboarding");
      else navigate("/dashboard");
    } catch (err) {
      setError(((_b = (_a = err.response) == null ? void 0 : _a.data) == null ? void 0 : _b.error) || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 rounded-xl flex items-center justify-center", style: { background: "#F26522" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-white font-bold text-lg", children: "M" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-gray-900 text-xl", children: "MONFLUX" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card w-full max-w-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-lg font-semibold text-gray-900 mb-1", children: mode === "login" ? "Connexion" : "Créer un compte" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 mb-5", children: mode === "login" ? "Bon retour." : "Commençons avec votre entreprise." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: submit, className: "space-y-3", children: [
        mode === "signup" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Votre nom" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", placeholder: "Jean Tremblay", value: form.name, onChange: set("name") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Courriel" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", type: "email", placeholder: "you@example.com", value: form.email, onChange: set("email"), required: true })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Mot de passe" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", type: "password", placeholder: "••••••••", value: form.password, onChange: set("password"), required: true, minLength: 8 })
        ] }),
        error && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-red-500", children: error }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "submit", className: "btn-primary w-full justify-center", disabled: loading, children: [
          loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 15, className: "animate-spin" }) : null,
          mode === "login" ? "Se connecter" : "Créer mon compte"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 pt-4 border-t border-gray-100 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          className: "text-sm text-gray-500 hover:text-brand",
          onClick: () => {
            setMode((m2) => m2 === "login" ? "signup" : "login");
            setError("");
          },
          children: mode === "login" ? "Pas de compte ? Créer un compte" : "Déjà un compte ? Se connecter"
        }
      ) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400 mt-6", children: "Gestion de chantier propulsée par l'IA · Québec" })
  ] });
}
const API_BASE$1 = "http://localhost:5000/api".replace(/\/api$/, "") + "/api";
const WELCOME = `Bonjour! 👋 Je suis l'assistant MONFLUX.

Je vais configurer ton espace en quelques questions — ton métier, ton rôle dans les projets, et les vues qui te seront utiles. Commençons : **quel est le nom de ton entreprise?** (ou ton nom si tu gères tes propres projets)`;
const CONTROL_RE = /<OPTIONS(?:\s+multi)?>[\s\S]*?<\/OPTIONS>|<PROFILE_COMPLETE>[\s\S]*?<\/PROFILE_COMPLETE>/g;
function parseAssistant(raw = "") {
  let options = null, multi = false;
  const m2 = raw.match(/<OPTIONS(\s+multi)?>([\s\S]*?)<\/OPTIONS>/);
  if (m2) {
    multi = !!m2[1];
    try {
      const arr = JSON.parse(m2[2].trim());
      if (Array.isArray(arr)) options = arr;
    } catch {
    }
  }
  let text = raw.replace(CONTROL_RE, "");
  text = text.replace(/<OPTIONS[\s\S]*$/, "").replace(/<PROFILE_COMPLETE[\s\S]*$/, "");
  return { text: text.trim(), options, multi };
}
function Onboarding() {
  var _a;
  const [messages, setMessages] = reactExports.useState([{ role: "assistant", content: WELCOME }]);
  const [input, setInput] = reactExports.useState("");
  const [loading, setLoading] = reactExports.useState(false);
  const [sessionId, setSessionId] = reactExports.useState(null);
  const [profile, setProfile] = reactExports.useState(null);
  const [completing, setCompleting] = reactExports.useState(false);
  const [done, setDone] = reactExports.useState(false);
  const [selected, setSelected] = reactExports.useState([]);
  const bottomRef = reactExports.useRef(null);
  const { setCompany, user } = useAuthStore();
  const navigate = useNavigate();
  reactExports.useEffect(() => {
    onboarding.session().then(({ data }) => setSessionId(data.session_id)).catch(() => {
    });
  }, []);
  reactExports.useEffect(() => {
    var _a2;
    (_a2 = bottomRef.current) == null ? void 0 : _a2.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);
  const send = async (textArg) => {
    const content = (typeof textArg === "string" ? textArg : input).trim();
    if (!content || loading) return;
    const userMsg = { role: "user", content };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setSelected([]);
    setLoading(true);
    const aiMsg = { role: "assistant", content: "" };
    setMessages((m2) => [...m2, aiMsg]);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE$1}/onboarding/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: nextMessages, session_id: sessionId })
      });
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let detectedProfile = null;
      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        const lines = decoder.decode(value).split("\n").filter((l2) => l2.startsWith("data: "));
        for (const line of lines) {
          const evt = JSON.parse(line.slice(6));
          if (evt.type === "text") {
            setMessages((m2) => {
              const copy = [...m2];
              copy[copy.length - 1] = { ...copy[copy.length - 1], content: copy[copy.length - 1].content + evt.text };
              return copy;
            });
          }
          if (evt.type === "profile_ready") {
            detectedProfile = evt.profile;
            setProfile(evt.profile);
          }
        }
      }
      if (detectedProfile) {
        setTimeout(() => completeOnboarding(detectedProfile, nextMessages), 1200);
      }
    } catch (err) {
      setMessages((m2) => {
        const copy = [...m2];
        copy[copy.length - 1] = { ...copy[copy.length - 1], content: "Désolé, une erreur s'est produite. Réessayez." };
        return copy;
      });
    } finally {
      setLoading(false);
    }
  };
  const completeOnboarding = async (p2, msgs) => {
    setCompleting(true);
    try {
      const { data } = await onboarding.complete({ profile: p2 || profile, session_id: sessionId });
      setCompany({ id: data.company_id });
      setDone(true);
      setTimeout(() => navigate("/dashboard"), 1800);
    } catch (err) {
      console.error(err);
    } finally {
      setCompleting(false);
    }
  };
  if (done) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { size: 48, className: "text-green-500" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg font-semibold text-gray-900", children: "Profil créé !" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500", children: "Redirection vers votre tableau de bord…" })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-xl flex flex-col", style: { height: "85vh" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", style: { background: "#F26522" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-white font-bold text-sm", children: "M" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-gray-900", children: "Assistant MONFLUX" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400", children: "Configuration de votre compte" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-y-auto flex flex-col gap-3 pb-2", children: [
      messages.map((m2, i) => {
        var _a2;
        const isAssistant = m2.role === "assistant";
        const parsed = isAssistant ? parseAssistant(m2.content) : null;
        const display = isAssistant ? parsed.text : m2.content;
        const isLast = i === messages.length - 1;
        const showChips = isAssistant && isLast && ((_a2 = parsed == null ? void 0 : parsed.options) == null ? void 0 : _a2.length) && !loading && !completing && !profile;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: isAssistant ? "flex justify-start fade-in" : "flex justify-end fade-in", children: [
          isAssistant && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-0.5", style: { background: "#F26522" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-white text-xs font-bold", children: "M" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2 max-w-[85%]", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: isAssistant ? "chat-bubble-ai" : "chat-bubble-user", children: display ? display.split("\n").map((line, j) => /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: j > 0 ? "mt-1" : "", dangerouslySetInnerHTML: {
              __html: line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            } }, j)) : /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex gap-1 py-0.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "typing-dot" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "typing-dot" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "typing-dot" })
            ] }) }),
            showChips && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", children: parsed.multi ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              parsed.options.map((opt) => {
                const on = selected.includes(opt);
                return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    onClick: () => setSelected((s) => on ? s.filter((x2) => x2 !== opt) : [...s, opt]),
                    className: `text-xs px-3 py-1.5 rounded-full border transition-colors flex items-center gap-1 ${on ? "border-brand bg-orange-50 text-brand font-medium" : "border-gray-200 text-gray-600 hover:border-gray-300"}`,
                    children: [
                      on && /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { size: 12 }),
                      opt
                    ]
                  },
                  opt
                );
              }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  onClick: () => send(selected.join(", ")),
                  disabled: !selected.length,
                  className: "text-xs px-3 py-1.5 rounded-full bg-brand text-white font-medium flex items-center gap-1 disabled:opacity-40",
                  children: [
                    "Continuer ",
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { size: 12 })
                  ]
                }
              )
            ] }) : parsed.options.map((opt) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => send(opt),
                className: "text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-brand hover:text-brand hover:bg-orange-50 transition-colors",
                children: opt
              },
              opt
            )) })
          ] })
        ] }, i);
      }),
      loading && ((_a = messages[messages.length - 1]) == null ? void 0 : _a.content) === "" && null,
      completing && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm text-gray-500 self-center mt-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 14, className: "animate-spin text-brand" }),
        "Création de votre entreprise…"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: bottomRef })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 pt-3 border-t border-gray-100 mt-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          className: "input flex-1",
          placeholder: "Votre réponse…",
          value: input,
          onChange: (e) => setInput(e.target.value),
          onKeyDown: (e) => e.key === "Enter" && !e.shiftKey && send(),
          disabled: loading || completing,
          autoFocus: true
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          className: "btn-primary flex-shrink-0",
          onClick: send,
          disabled: loading || completing || !input.trim(),
          children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 15, className: "animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { size: 15 })
        }
      )
    ] })
  ] }) });
}
const TYPE_META = {
  lead: { label: "Lead", color: "#F26522", Icon: Users },
  project: { label: "Projet", color: "#6366f1", Icon: FolderKanban },
  quote: { label: "Soumission", color: "#3b82f6", Icon: FileText },
  invoice: { label: "Facture", color: "#22c55e", Icon: Receipt },
  contact: { label: "Contact", color: "#9ca3af", Icon: BookUser },
  subcontractor: { label: "Sous-traitant", color: "#f59e0b", Icon: HardHat }
};
const STATUS_FR$1 = {
  new: "Nouveau",
  contacted: "Contacté",
  won: "Gagné",
  lost: "Perdu",
  active: "Actif",
  draft: "Brouillon",
  sent: "Envoyée",
  signed: "Signée",
  paid: "Payée",
  overdue: "En retard",
  completed: "Terminé",
  on_hold: "En pause"
};
function SearchModal({ onClose }) {
  const [q2, setQ] = reactExports.useState("");
  const [results, setResults] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(false);
  const [selected, setSelected] = reactExports.useState(0);
  const navigate = useNavigate();
  const inputRef = reactExports.useRef(null);
  const listRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    setTimeout(() => {
      var _a;
      return (_a = inputRef.current) == null ? void 0 : _a.focus();
    }, 50);
  }, []);
  reactExports.useEffect(() => {
    if (q2.trim().length < 2) {
      setResults([]);
      return;
    }
    const t2 = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await http.get("/search", { params: { q: q2.trim() } });
        setResults(data);
        setSelected(0);
      } catch {
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => clearTimeout(t2);
  }, [q2]);
  reactExports.useEffect(() => {
    var _a;
    const el2 = (_a = listRef.current) == null ? void 0 : _a.children[selected];
    el2 == null ? void 0 : el2.scrollIntoView({ block: "nearest" });
  }, [selected]);
  const go = (path) => {
    navigate(path);
    onClose();
  };
  const handleKey = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter" && results[selected]) {
      go(results[selected].path);
    } else if (e.key === "Escape") {
      onClose();
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: "fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-start justify-center pt-[12vh]",
      onClick: onClose,
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in fade-in slide-in-from-top-4",
          style: { animationDuration: "150ms" },
          onClick: (e) => e.stopPropagation(),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 px-4 py-3.5", children: [
              loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 17, className: "text-brand animate-spin flex-shrink-0" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { size: 17, className: "text-gray-400 flex-shrink-0" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  ref: inputRef,
                  className: "flex-1 text-sm outline-none placeholder:text-gray-400 bg-transparent",
                  placeholder: "Rechercher leads, projets, factures, contacts…",
                  value: q2,
                  onChange: (e) => setQ(e.target.value),
                  onKeyDown: handleKey
                }
              ),
              q2 && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "text-gray-300 hover:text-gray-500", onClick: () => {
                var _a;
                setQ("");
                setResults([]);
                (_a = inputRef.current) == null ? void 0 : _a.focus();
              }, children: "×" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("kbd", { className: "text-xs text-gray-300 bg-gray-100 px-1.5 py-0.5 rounded font-mono", children: "Esc" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-px bg-gray-100" }),
            results.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: listRef, className: "max-h-72 overflow-y-auto py-1", children: results.map((r2, i) => {
              const meta = TYPE_META[r2.type] || { label: r2.type, color: "#9ca3af", Icon: Search };
              STATUS_FR$1[r2.status] || r2.status;
              return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  className: `w-full text-left flex items-center gap-3 px-4 py-2.5 transition-colors ${i === selected ? "bg-orange-50" : "hover:bg-gray-50"}`,
                  onClick: () => go(r2.path),
                  onMouseEnter: () => setSelected(i),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "div",
                      {
                        className: "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0",
                        style: { background: meta.color + "18" },
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(meta.Icon, { size: 13, style: { color: meta.color } })
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-900 truncate", children: r2.name }),
                      r2.sub && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400 truncate", children: r2.sub })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 flex-shrink-0", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "span",
                        {
                          className: "text-xs px-2 py-0.5 rounded-full font-medium",
                          style: { background: meta.color + "15", color: meta.color },
                          children: meta.label
                        }
                      ),
                      i === selected && /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { size: 13, className: "text-gray-300" })
                    ] })
                  ]
                },
                `${r2.type}-${r2.id}`
              );
            }) }),
            q2.trim().length >= 2 && !loading && results.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 py-8 text-center", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { size: 24, className: "text-gray-200 mx-auto mb-2" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-gray-400", children: [
                "Aucun résultat pour ",
                /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
                  "« ",
                  q2,
                  " »"
                ] })
              ] })
            ] }),
            q2.trim().length < 2 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 py-5 flex flex-wrap gap-2 justify-center", children: Object.entries(TYPE_META).map(([type, meta]) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: "flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 px-2.5 py-1.5 rounded-lg",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(meta.Icon, { size: 11, style: { color: meta.color } }),
                  meta.label
                ]
              },
              type
            )) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 py-2 border-t border-gray-50 flex items-center gap-5 text-xs text-gray-300", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("kbd", { className: "bg-gray-100 px-1 rounded font-mono", children: "↑↓" }),
                " naviguer"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("kbd", { className: "bg-gray-100 px-1 rounded font-mono", children: "↵" }),
                " ouvrir"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("kbd", { className: "bg-gray-100 px-1 rounded font-mono", children: "Esc" }),
                " fermer"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-auto", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("kbd", { className: "bg-gray-100 px-1 rounded font-mono", children: "⌘K" }),
                " pour rouvrir"
              ] })
            ] })
          ]
        }
      )
    }
  );
}
const ICONS = {
  LayoutDashboard,
  Sparkles,
  FolderKanban,
  Users,
  FileText,
  Receipt,
  HardHat,
  QrCode,
  BarChart3,
  BookUser,
  FileSignature,
  ShoppingCart,
  FileStack
};
const QUICK = [
  { label: "Nouveau lead", path: "/leads?new=1" },
  { label: "Nouvelle soumission", path: "/soumissions?new=1" },
  { label: "Nouveau projet", path: "/projets?new=1" },
  { label: "Pointer un chantier", path: "/punch" }
];
function Layout({ children }) {
  var _a, _b;
  const { user, logout, company } = useAuthStore();
  const { darkMode, sidebarOpen, toggleDark, toggleSidebar } = useUIStore();
  const { modules, load, toggleModule } = useConfigStore();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = reactExports.useState(false);
  const [quickOpen, setQuickOpen] = reactExports.useState(false);
  const [userMenuOpen, setUserMenuOpen] = reactExports.useState(false);
  const [notifOpen, setNotifOpen] = reactExports.useState(false);
  const [notifs, setNotifs] = reactExports.useState([]);
  const [notifSeen, setNotifSeen] = reactExports.useState(false);
  const [manageOpen, setManageOpen] = reactExports.useState(false);
  const userMenuRef = reactExports.useRef(null);
  const notifRef = reactExports.useRef(null);
  const role = company == null ? void 0 : company.role;
  const coreNav = CORE_MODULES.filter((m2) => roleAllows(role, m2.key));
  const secondaryNav = SECONDARY_MODULES.filter((m2) => roleAllows(role, m2.key) && (modules == null ? void 0 : modules[m2.key]));
  const manageable = SECONDARY_MODULES.filter((m2) => roleAllows(role, m2.key));
  reactExports.useEffect(() => {
    load();
  }, []);
  reactExports.useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  reactExports.useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);
  reactExports.useEffect(() => {
    const load2 = async () => {
      try {
        const { data } = await dashboard.notifications();
        setNotifs(data || []);
      } catch {
      }
    };
    load2();
    const t2 = setInterval(load2, 3e5);
    return () => clearInterval(t2);
  }, []);
  const handleLogout = () => {
    logout();
    navigate("/");
  };
  const initials = (((_a = user == null ? void 0 : user.name) == null ? void 0 : _a[0]) || ((_b = user == null ? void 0 : user.email) == null ? void 0 : _b[0]) || "U").toUpperCase();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-screen bg-gray-50 overflow-hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: `${sidebarOpen ? "w-56" : "w-14"} flex-shrink-0 bg-white border-r border-gray-100 flex flex-col transition-all duration-200`, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 px-3 py-4 border-b border-gray-100", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0", style: { background: "#F26522" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-white font-bold text-xs", children: "M" }) }),
        sidebarOpen && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-gray-900 text-sm", children: "MONFLUX" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("nav", { className: "flex-1 px-2 py-3 space-y-0.5 overflow-y-auto", children: [
        [...coreNav, ...secondaryNav].map((m2) => {
          const Icon = ICONS[m2.icon] || FolderKanban;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            NavLink,
            {
              to: m2.path,
              className: ({ isActive }) => `nav-item ${isActive ? "active" : ""} ${m2.highlight ? "nav-item-ai" : ""}`,
              title: !sidebarOpen ? m2.label : void 0,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { size: 16, className: "flex-shrink-0" }),
                sidebarOpen && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: m2.label }),
                m2.highlight && sidebarOpen && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-auto text-[10px] font-semibold text-brand bg-brand/10 px-1.5 py-0.5 rounded-full", children: "IA" }),
                m2.comingSoon && sidebarOpen && !m2.highlight && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-auto text-[9px] text-gray-300 italic", children: "bientôt" })
              ]
            },
            m2.path
          );
        }),
        sidebarOpen && manageable.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pt-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: () => setManageOpen((o) => !o),
              className: "nav-item w-full text-gray-400 hover:text-gray-700",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SlidersHorizontal, { size: 16, className: "flex-shrink-0" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: "Gérer les vues" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { size: 14, className: `ml-auto transition-transform ${manageOpen ? "rotate-90" : ""}` })
              ]
            }
          ),
          manageOpen && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 ml-1 pl-2 border-l border-gray-100 space-y-0.5", children: manageable.map((m2) => {
            const on = !!(modules == null ? void 0 : modules[m2.key]);
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: () => toggleModule(m2.key),
                className: "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-gray-600 hover:bg-gray-50 transition-colors",
                title: on ? "Masquer" : "Afficher",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0 ${on ? "bg-brand text-white" : "border border-gray-300"}`, children: on && /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { size: 10 }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: m2.label }),
                  m2.comingSoon && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-auto text-[9px] text-gray-300 italic", children: "bientôt" })
                ]
              },
              m2.key
            );
          }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-2 py-3 border-t border-gray-100 space-y-0.5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: toggleDark, className: "nav-item w-full", title: "Mode sombre", children: [
        darkMode ? /* @__PURE__ */ jsxRuntimeExports.jsx(Sun, { size: 16 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Moon, { size: 16 }),
        sidebarOpen && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: darkMode ? "Mode clair" : "Mode sombre" })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 flex flex-col overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "h-12 bg-white border-b border-gray-100 flex items-center gap-3 px-4 flex-shrink-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: toggleSidebar, className: "btn-ghost p-1.5 rounded-md", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Menu, { size: 16 }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            className: "hidden sm:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-400 hover:border-gray-300 hover:bg-gray-100 transition-colors ml-2",
            onClick: () => setSearchOpen(true),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { size: 12 }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Rechercher…" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("kbd", { className: "ml-2 bg-white border border-gray-200 px-1 rounded text-gray-300 font-mono", children: "⌘K" })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", ref: notifRef, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              className: "relative btn-ghost p-1.5 rounded-md",
              onClick: () => {
                setNotifOpen((o) => !o);
                setNotifSeen(true);
                setQuickOpen(false);
                setUserMenuOpen(false);
              },
              title: "Notifications",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { size: 16, className: notifs.length > 0 ? "text-gray-700" : "text-gray-400" }),
                notifs.length > 0 && !notifSeen && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute top-0.5 right-0.5 min-w-[14px] h-3.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none", children: notifs.length > 9 ? "9+" : notifs.length })
              ]
            }
          ),
          notifOpen && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute right-0 top-9 bg-white border border-gray-100 rounded-xl shadow-xl z-50 w-72 overflow-hidden", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 py-2.5 border-b border-gray-50 flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-gray-900", children: "Notifications" }),
              notifs.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium", children: notifs.length })
            ] }),
            notifs.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 py-6 text-center", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { size: 20, className: "text-gray-200 mx-auto mb-2" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400", children: "Aucune alerte en ce moment" })
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-h-64 overflow-y-auto py-1", children: notifs.map((n2, i) => {
              const Icon = n2.type === "invoice_overdue" ? AlertCircle : n2.type === "follow_up" ? Clock : FileQuestion;
              const color = n2.severity === "error" ? "#ef4444" : n2.severity === "warning" ? "#f59e0b" : "#6366f1";
              return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  className: "w-full text-left flex items-start gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors",
                  onClick: () => {
                    navigate(n2.path);
                    setNotifOpen(false);
                  },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { size: 14, className: "mt-0.5 flex-shrink-0", style: { color } }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-700 leading-snug", children: n2.label })
                  ]
                },
                i
              );
            }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              className: "w-7 h-7 rounded-lg flex items-center justify-center text-white flex-shrink-0 shadow-sm",
              style: { background: "#F26522" },
              onClick: () => {
                setQuickOpen((o) => !o);
                setUserMenuOpen(false);
              },
              title: "Actions rapides",
              children: quickOpen ? /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 14 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 14 })
            }
          ),
          quickOpen && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute right-0 top-9 bg-white border border-gray-100 rounded-xl shadow-lg z-50 py-1 w-48", children: QUICK.map((q2) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              className: "w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-brand transition-colors",
              onClick: () => {
                navigate(q2.path);
                setQuickOpen(false);
              },
              children: q2.label
            },
            q2.path
          )) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", ref: userMenuRef, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: () => {
                setUserMenuOpen((o) => !o);
                setQuickOpen(false);
              },
              className: "flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-gray-50 transition-colors",
              title: "Mon compte",
              children: [
                (user == null ? void 0 : user.name) && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-gray-500 hidden sm:block", children: user.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "div",
                  {
                    className: "w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0",
                    style: { background: "#111827" },
                    children: initials
                  }
                )
              ]
            }
          ),
          userMenuOpen && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute right-0 top-10 bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-1 w-52", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 py-2.5 border-b border-gray-50", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-gray-900 truncate", children: (user == null ? void 0 : user.name) || "Mon compte" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400 truncate", children: user == null ? void 0 : user.email })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                className: "w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2",
                onClick: () => {
                  navigate("/parametres?tab=profil");
                  setUserMenuOpen(false);
                },
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(User, { size: 14, className: "text-gray-400" }),
                  "Mon profil"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                className: "w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2",
                onClick: () => {
                  navigate("/parametres");
                  setUserMenuOpen(false);
                },
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Settings, { size: 14, className: "text-gray-400" }),
                  "Paramètres"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "my-1 border-t border-gray-100" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                className: "w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2",
                onClick: handleLogout,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(LogOut, { size: 14 }),
                  "Déconnexion"
                ]
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "flex-1 overflow-y-auto", children })
    ] }),
    searchOpen && /* @__PURE__ */ jsxRuntimeExports.jsx(SearchModal, { onClose: () => setSearchOpen(false) })
  ] });
}
const TYPE_ICON = {
  lead: { label: "Lead", color: "#3b82f6" },
  quote: { label: "Soumission", color: "#F26522" },
  invoice: { label: "Facture", color: "#22c55e" },
  project: { label: "Projet", color: "#6366f1" },
  punch: { label: "Punch", color: "#f59e0b" }
};
const STATUS_FR = {
  new: "Nouveau",
  contacted: "Contacté",
  quote_sent: "Soumission envoyée",
  won: "Gagné",
  lost: "Perdu",
  draft: "Brouillon",
  sent: "Envoyée",
  viewed: "Vue",
  signed: "Signée",
  expired: "Expirée",
  rejected: "Refusée",
  converted: "Convertie",
  paid: "Payée",
  overdue: "En retard",
  partial: "Partielle",
  active: "Actif",
  completed: "Terminé",
  on_hold: "En pause",
  cancelled: "Annulé"
};
function timeAgo(ts) {
  const diff = (Date.now() - new Date(ts)) / 1e3;
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.round(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.round(diff / 3600)} h`;
  if (diff < 604800) return `il y a ${Math.round(diff / 86400)} j`;
  return new Date(ts).toLocaleDateString("fr-CA", { day: "numeric", month: "short" });
}
function useCountUp(target, duration = 900) {
  const [val, setVal] = reactExports.useState(0);
  const frame = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (!target || isNaN(target)) {
      setVal(target || 0);
      return;
    }
    const start = Date.now();
    const tick = () => {
      const p2 = Math.min((Date.now() - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p2, 3);
      setVal(Math.round(target * ease));
      if (p2 < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [target, duration]);
  return val;
}
function KPI({ icon: Icon, label, value, color, sub, onClick, raw }) {
  const numeric = typeof raw === "number" ? raw : null;
  const animated = useCountUp(numeric);
  const display = numeric !== null ? value.includes("k$") ? `${Math.round(animated / 1e3)}k$` : String(animated) : value;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: `card flex items-center gap-3 transition-all duration-200 ${onClick ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5" : ""}`,
      onClick,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", style: { background: color + "18" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { size: 18, style: { color } }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400", children: label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-gray-900 leading-tight tabular-nums", children: display }),
          sub && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-red-500 font-medium", children: sub })
        ] }),
        onClick && /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { size: 14, className: "text-gray-300 flex-shrink-0" })
      ]
    }
  );
}
function LivePresence({ workers }) {
  const [now, setNow] = reactExports.useState(Date.now());
  reactExports.useEffect(() => {
    if (!(workers == null ? void 0 : workers.length)) return;
    const t2 = setInterval(() => setNow(Date.now()), 3e4);
    return () => clearInterval(t2);
  }, [workers]);
  if (!(workers == null ? void 0 : workers.length)) return null;
  const elapsed = (clockIn) => {
    const diff = (now - new Date(clockIn).getTime()) / 1e3 / 60;
    if (diff < 60) return `${Math.round(diff)}min`;
    const h = Math.floor(diff / 60);
    const m2 = Math.round(diff % 60);
    return `${h}h${m2.toString().padStart(2, "0")}`;
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-2.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "relative flex h-2 w-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "relative inline-flex rounded-full h-2 w-2 bg-green-500" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold text-gray-700", children: "Sur le chantier en ce moment" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium", children: [
        workers.length,
        " actif",
        workers.length > 1 ? "s" : ""
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", children: workers.map((w2) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2.5 bg-white border border-green-100 shadow-sm rounded-xl px-3 py-2 hover:border-green-300 transition-colors", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0",
          style: { background: `hsl(${w2.name.charCodeAt(0) * 37 % 360},60%,50%)` },
          children: (w2.name || "?")[0].toUpperCase()
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold text-gray-800 leading-tight", children: w2.name }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-gray-400 leading-tight", children: [
          w2.project_name || "Chantier",
          " · ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-green-600 font-medium", children: elapsed(w2.clock_in) })
        ] })
      ] })
    ] }, w2.id)) })
  ] });
}
const STATUS_COLOR$1 = { active: "#22c55e", on_hold: "#f59e0b", completed: "#6b7280", cancelled: "#ef4444", lead: "#3b82f6", quote: "#6366f1" };
const STATUS_LABEL$1 = { active: "Actif", on_hold: "En pause", completed: "Terminé", cancelled: "Annulé", lead: "Lead", quote: "Soumission" };
function ProjectTimeline({ projects: projects2, onNavigate }) {
  const [hoveredId, setHoveredId] = reactExports.useState(null);
  const dated = projects2.filter((p2) => p2.start_date && p2.end_date);
  if (dated.length === 0) return null;
  const today = /* @__PURE__ */ new Date();
  const starts = dated.map((p2) => new Date(p2.start_date));
  const ends = dated.map((p2) => new Date(p2.end_date));
  const minDate = new Date(Math.min(...starts));
  const maxDate = new Date(Math.max(...ends, today));
  const range = maxDate - minDate || 1;
  const toPct = (d) => Math.max(0, Math.min(100, (new Date(d) - minDate) / range * 100));
  const todayPct = toPct(today);
  const labels = [];
  const cursor = new Date(minDate);
  cursor.setDate(1);
  while (cursor <= maxDate) {
    labels.push({ label: cursor.toLocaleDateString("fr-CA", { month: "short" }), pct: toPct(cursor) });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card mb-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "font-semibold text-gray-900 text-sm mb-3 flex items-center gap-1.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { size: 14, className: "text-indigo-500" }),
      " Calendrier des chantiers",
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-gray-300 font-normal ml-1", children: "— cliquer pour ouvrir" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative select-none", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative h-5 mb-1 border-b border-gray-100", children: labels.map((m2, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute text-xs text-gray-300 -translate-x-1/2", style: { left: `${m2.pct}%` }, children: m2.label }, i)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-1.5 pt-1", children: dated.map((p2) => {
        const left = toPct(p2.start_date);
        const width = toPct(p2.end_date) - left;
        const isLate = p2.status === "active" && new Date(p2.end_date) < today;
        const pct = p2.progress_pct || 0;
        const isHovered = hoveredId === p2.id;
        const tipLeft = left + width / 2;
        const anchorLeft = tipLeft > 65 ? "right-0" : tipLeft < 35 ? "left-0" : "left-1/2 -translate-x-1/2";
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "relative h-8",
            onMouseEnter: () => setHoveredId(p2.id),
            onMouseLeave: () => setHoveredId(null),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-gray-50 rounded-lg" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  className: `absolute h-full rounded-lg transition-all duration-150 cursor-pointer flex items-center px-2 text-xs text-white font-medium overflow-hidden
                    ${isLate ? "bg-red-400 hover:bg-red-500" : "bg-brand hover:brightness-110"}
                    ${isHovered ? "shadow-md ring-2 ring-white z-10" : ""}`,
                  style: { left: `${left}%`, width: `${Math.max(width, 2)}%` },
                  onClick: () => onNavigate(p2.id),
                  children: [
                    pct > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "div",
                      {
                        className: "absolute inset-y-0 left-0 bg-white/25 rounded-lg pointer-events-none",
                        style: { width: `${pct}%` }
                      }
                    ),
                    width > 8 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "relative truncate", children: p2.name })
                  ]
                }
              ),
              width <= 8 && /* @__PURE__ */ jsxRuntimeExports.jsx(
                "span",
                {
                  className: "absolute text-xs text-gray-500 truncate",
                  style: { left: `${Math.min(left + Math.max(width, 2) + 0.5, 95)}%`, top: "50%", transform: "translateY(-50%)", maxWidth: 100 },
                  children: p2.name
                }
              ),
              isHovered && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  className: `absolute bottom-full mb-2 z-50 pointer-events-none ${anchorLeft}`,
                  style: { left: tipLeft > 65 ? "auto" : tipLeft < 35 ? "auto" : `${tipLeft}%` },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-gray-900 text-white rounded-xl shadow-xl p-3 w-52 text-xs", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-sm mb-1 truncate", children: p2.name }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-1.5 h-1.5 rounded-full flex-shrink-0", style: { background: STATUS_COLOR$1[p2.status] || "#6b7280" } }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: STATUS_COLOR$1[p2.status] || "#9ca3af" }, children: STATUS_LABEL$1[p2.status] || p2.status }),
                        isLate && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-400 font-medium ml-auto", children: "En retard" })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full h-1.5 bg-white/20 rounded-full mb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full rounded-full bg-brand", style: { width: `${pct}%` } }) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-gray-400 mb-1.5", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Avancement" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-white font-semibold", children: [
                          pct,
                          "%"
                        ] })
                      ] }),
                      p2.contract_value > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-gray-400 mb-1", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Contrat" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-white", children: [
                          Number(p2.contract_value).toLocaleString("fr-CA"),
                          "$"
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-gray-400 border-t border-white/10 pt-1.5 mt-0.5", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Fin prévue" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: isLate ? "text-red-400" : "text-white", children: new Date(p2.end_date).toLocaleDateString("fr-CA", { day: "numeric", month: "short" }) })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center mt-2 text-gray-500 text-xs", children: "Cliquer pour ouvrir →" })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-2 h-2 bg-gray-900 rotate-45 -mt-1" }) })
                  ]
                }
              )
            ]
          },
          p2.id
        );
      }) }),
      todayPct >= 0 && todayPct <= 100 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute top-0 bottom-0 w-px bg-brand/60 pointer-events-none z-20", style: { left: `${todayPct}%` }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -top-0.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-brand" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-2 left-1 text-xs text-brand/70 whitespace-nowrap font-medium", children: "auj." })
      ] })
    ] })
  ] });
}
function Dashboard() {
  var _a;
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [summary, setSummary] = reactExports.useState(null);
  const [activity, setActivity] = reactExports.useState([]);
  const [activeProjs, setActiveProjs] = reactExports.useState([]);
  const [hotLeads, setHotLeads] = reactExports.useState([]);
  const [presence, setPresence] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [health, setHealth] = reactExports.useState(null);
  const [hl2, setHL] = reactExports.useState(false);
  const [askInput, setAskInput] = reactExports.useState("");
  const askAI = (q2) => {
    const question = (q2 || askInput).trim();
    if (!question) {
      navigate("/chat");
      return;
    }
    navigate(`/chat?q=${encodeURIComponent(question)}`);
  };
  const load = async () => {
    setLoading(true);
    try {
      const [sum, act, projs, leads$1, pres] = await Promise.all([
        dashboard.summary(),
        dashboard.activity(),
        projects.list(),
        leads.list(),
        dashboard.presence().catch(() => ({ data: [] }))
      ]);
      setSummary(sum.data);
      setActivity(act.data);
      setActiveProjs(projs.data.filter((p2) => p2.status === "active").slice(0, 6));
      setHotLeads(leads$1.data.filter((l2) => ["new", "contacted"].includes(l2.status)).slice(0, 5));
      setPresence(pres.data || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };
  const loadHealth = async () => {
    setHL(true);
    try {
      const { data } = await ai.healthCheck();
      setHealth(data.summary);
    } catch {
    } finally {
      setHL(false);
    }
  };
  reactExports.useEffect(() => {
    load().then(() => loadHealth());
    const t2 = setInterval(() => dashboard.presence().catch(() => ({ data: [] })).then((r2) => setPresence(r2.data || [])), 9e4);
    return () => clearInterval(t2);
  }, []);
  const name = ((_a = user == null ? void 0 : user.name) == null ? void 0 : _a.split(" ")[0]) || "";
  const h = (/* @__PURE__ */ new Date()).getHours();
  const greet = h < 12 ? "Bonjour" : h < 18 ? "Bon après-midi" : "Bonsoir";
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 max-w-6xl mx-auto", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-xl font-bold text-gray-900", children: [
        greet,
        name ? `, ${name}` : "",
        " 👋"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-400 mt-0.5 capitalize", children: (/* @__PURE__ */ new Date()).toLocaleDateString("fr-CA", { weekday: "long", day: "numeric", month: "long" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-5 rounded-2xl p-4 sm:p-5", style: { background: "linear-gradient(135deg, #fff7ed 0%, #ffffff 55%)", border: "1px solid #fde6d3" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0", style: { background: "#F26522" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { size: 15, className: "text-white" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-gray-900 leading-tight", children: "Assistant IA MONFLUX" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 leading-tight truncate", children: summary ? `${summary.active_projects ?? 0} chantier(s) actif(s) · ${summary.new_leads ?? 0} lead(s) à suivre · ${summary.outstanding > 0 ? `${Math.round(summary.outstanding / 1e3)}k$ à encaisser` : "rien à encaisser"}${summary.overdue_count > 0 ? ` · ${summary.overdue_count} en retard` : ""}` : "Posez une question ou demandez une action en langage naturel." })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 mb-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            className: "input flex-1 bg-white",
            placeholder: "Demandez à l'IA : « Résume mes chantiers » ou « Crée un lead… »",
            value: askInput,
            onChange: (e) => setAskInput(e.target.value),
            onKeyDown: (e) => e.key === "Enter" && askAI()
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "btn-primary px-4 flex-shrink-0", onClick: () => askAI(), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { size: 14 }),
          " Demander"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", children: [
        "Résume mes chantiers actifs",
        "Quelles factures sont en retard ?",
        "Montre mes leads à rappeler",
        "Génère une estimation de rénovation cuisine"
      ].map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => askAI(s),
          className: "text-xs px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-brand hover:text-brand transition-colors",
          children: s
        },
        s
      )) })
    ] }),
    loading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-gray-400 py-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 16, className: "animate-spin" }),
      " Chargement…"
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      (summary == null ? void 0 : summary.overdue_count) > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { size: 16, className: "text-red-500 flex-shrink-0" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-semibold text-red-700", children: [
            summary.overdue_count,
            " facture",
            summary.overdue_count > 1 ? "s" : "",
            " en retard"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-red-500", children: "Action requise pour maintenir votre flux de trésorerie" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "btn-danger text-xs py-1.5 px-3", onClick: () => navigate("/factures"), children: "Voir" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          KPI,
          {
            icon: Users,
            label: "Leads à suivre",
            value: String((summary == null ? void 0 : summary.new_leads) ?? 0),
            raw: (summary == null ? void 0 : summary.new_leads) ?? 0,
            color: "#F26522",
            onClick: () => navigate("/leads")
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          KPI,
          {
            icon: FolderKanban,
            label: "Chantiers actifs",
            value: String((summary == null ? void 0 : summary.active_projects) ?? 0),
            raw: (summary == null ? void 0 : summary.active_projects) ?? 0,
            color: "#22c55e",
            onClick: () => navigate("/projets")
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          KPI,
          {
            icon: Receipt,
            label: "À encaisser",
            value: (summary == null ? void 0 : summary.outstanding) > 0 ? `${Math.round(summary.outstanding / 1e3)}k$` : "0$",
            raw: (summary == null ? void 0 : summary.outstanding) ?? 0,
            color: (summary == null ? void 0 : summary.overdue_count) > 0 ? "#ef4444" : "#6b7280",
            sub: (summary == null ? void 0 : summary.overdue_count) > 0 ? `${summary.overdue_count} en retard` : void 0,
            onClick: () => navigate("/factures")
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          KPI,
          {
            icon: TrendingUp,
            label: "Pipeline",
            value: (summary == null ? void 0 : summary.pipeline_value) > 0 ? `${Math.round(summary.pipeline_value / 1e3)}k$` : "0$",
            raw: (summary == null ? void 0 : summary.pipeline_value) ?? 0,
            color: "#6366f1",
            onClick: () => navigate("/soumissions")
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 mb-5 flex-wrap", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "btn-primary", onClick: () => navigate("/leads?new=1"), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 14 }),
          " Nouveau lead"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "btn-secondary", onClick: () => navigate("/soumissions?new=1"), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { size: 14 }),
          " Nouvelle soumission"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "btn-secondary", onClick: () => navigate("/projets?new=1"), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FolderKanban, { size: 14 }),
          " Nouveau projet"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "btn-secondary", onClick: () => navigate("/punch"), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(QrCode, { size: 14 }),
          " Pointer"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(LivePresence, { workers: presence }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ProjectTimeline, { projects: activeProjs, onNavigate: (id2) => navigate(`/projets/${id2}`) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "font-semibold text-gray-900 text-sm flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(FolderKanban, { size: 14, className: "text-brand" }),
              " Chantiers actifs"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "btn-ghost text-xs py-0.5 px-2", onClick: () => navigate("/projets"), children: "Voir tout" })
          ] }),
          activeProjs.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "py-5 text-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-400 mb-2", children: "Aucun chantier actif" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "btn-primary text-xs", onClick: () => navigate("/projets"), children: "Créer un projet" })
          ] }) : activeProjs.map((p2) => {
            const pct = p2.progress_pct || 0;
            const end = p2.end_date ? new Date(p2.end_date) : null;
            const late = end && end < /* @__PURE__ */ new Date() && p2.status === "active";
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: "flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-orange-50/30 -mx-5 px-5 rounded",
                onClick: () => navigate(`/projets/${p2.id}`),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 mb-1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-800 truncate", children: p2.name }),
                      late && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "badge badge-red text-xs", children: "Retard" })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full h-1.5 bg-gray-100 rounded-full overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full rounded-full bg-brand transition-all", style: { width: `${pct}%` } }) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-bold text-brand flex-shrink-0", children: [
                    pct,
                    "%"
                  ] })
                ]
              },
              p2.id
            );
          })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "font-semibold text-gray-900 text-sm flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { size: 14, className: "text-green-500" }),
              " Leads à rappeler"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "btn-ghost text-xs py-0.5 px-2", onClick: () => navigate("/leads"), children: "Voir tout" })
          ] }),
          hotLeads.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "py-5 text-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-400 mb-2", children: "Aucun lead en attente" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "btn-primary text-xs", onClick: () => navigate("/leads?new=1"), children: "Ajouter un lead" })
          ] }) : hotLeads.map((l2) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-800 truncate", children: l2.title }),
              l2.contact_name && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400", children: l2.contact_name })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 flex-shrink-0", children: [
              l2.contact_phone && /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: `tel:${l2.contact_phone}`, className: "btn-ghost p-1.5 text-green-500", title: "Appeler", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { size: 13 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "btn-secondary text-xs py-1 px-2", onClick: () => navigate("/leads"), children: "Ouvrir" })
            ] })
          ] }, l2.id))
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 mb-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Activity, { size: 14, className: "text-purple-500" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-semibold text-gray-900 text-sm", children: "Activité récente" })
          ] }),
          activity.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-400 py-4 text-center", children: "Aucune activité récente." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-0", children: activity.slice(0, 8).map((ev, i) => {
            const meta = TYPE_ICON[ev.type] || { label: ev.type, color: "#9ca3af" };
            const status = STATUS_FR[ev.status] || ev.status;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2.5 py-2 border-b border-gray-50 last:border-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0", style: { background: meta.color } }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-gray-800 truncate leading-snug", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", style: { color: meta.color }, children: meta.label }),
                  " ",
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-600", children: ev.label || "—" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-gray-400", children: [
                  status,
                  " · ",
                  timeAgo(ev.ts)
                ] })
              ] })
            ] }, i);
          }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { size: 14, className: "text-brand" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-gray-900 text-sm", children: "Résumé IA" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-gray-300", children: "· Vous pouvez aussi créer des leads en écrivant à l'assistant ↘" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "btn-ghost p-1.5", onClick: loadHealth, disabled: hl2, title: "Actualiser", children: hl2 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 13, className: "animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { size: 13 }) })
        ] }),
        hl2 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-400", children: "Analyse en cours…" }) : health ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-700 leading-relaxed whitespace-pre-wrap", children: health }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-400", children: "Cliquez sur actualiser pour un résumé IA de votre journée." })
      ] })
    ] })
  ] }) });
}
function SlideOver({ title, subtitle, onClose, width = "max-w-md", footer, children }) {
  reactExports.useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose == null ? void 0 : onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "fixed inset-0 z-50 flex justify-end", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "slide-over-backdrop absolute inset-0 bg-gray-900/20 backdrop-blur-[2px]",
        onClick: onClose
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `slide-over-panel relative h-full w-full ${width} bg-white shadow-2xl flex flex-col rounded-l-2xl overflow-hidden`, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3 px-6 py-4 border-b border-gray-100 flex-shrink-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-semibold text-gray-900 text-base leading-tight truncate", children: title }),
          subtitle && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400 mt-0.5", children: subtitle })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: onClose,
            className: "w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0",
            title: "Fermer (Échap)",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 18 })
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-y-auto px-6 py-5", children }),
      footer && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-6 py-4 border-t border-gray-100 flex-shrink-0", children: footer })
    ] })
  ] });
}
const num = (v2) => Number(v2) || 0;
const money$1 = (v2) => num(v2).toLocaleString("fr-CA", { maximumFractionDigits: 0 }) + "$";
const theoMargin = (p2) => num(p2.contract_value) - (num(p2.budget_materials) + num(p2.budget_labor) + num(p2.trades_estimated_cost));
const realMargin = (p2) => num(p2.invoiced_real) - (num(p2.labor_cost_real) + num(p2.expenses_real));
let leafletPromise = null;
function loadLeaflet() {
  if (typeof window !== "undefined" && window.L) return Promise.resolve(window.L);
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((resolve, reject) => {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(css);
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => resolve(window.L);
    script.onerror = reject;
    document.body.appendChild(script);
  });
  return leafletPromise;
}
function MapView({ projects: projects2, onGeocodeAll, geocoding, stageMap }) {
  const navigate = useNavigate();
  const mapEl = reactExports.useRef(null);
  const mapRef = reactExports.useRef(null);
  const layerRef = reactExports.useRef(null);
  const [ready, setReady] = reactExports.useState(false);
  reactExports.useEffect(() => {
    let cancelled = false;
    loadLeaflet().then((L2) => {
      if (cancelled || !mapEl.current || mapRef.current) return;
      mapRef.current = L2.map(mapEl.current, { scrollWheelZoom: false }).setView([46.81, -71.21], 6);
      L2.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19
      }).addTo(mapRef.current);
      layerRef.current = L2.layerGroup().addTo(mapRef.current);
      setReady(true);
    }).catch(() => {
    });
    return () => {
      cancelled = true;
    };
  }, []);
  reactExports.useEffect(() => {
    if (!ready || !window.L || !layerRef.current) return;
    const L2 = window.L;
    layerRef.current.clearLayers();
    const located2 = projects2.filter((p2) => p2.latitude && p2.longitude);
    const bounds = [];
    located2.forEach((p2) => {
      var _a;
      const lat = Number(p2.latitude), lng = Number(p2.longitude);
      const color = ((_a = stageMap == null ? void 0 : stageMap[p2.status]) == null ? void 0 : _a.color) || "#94a3b8";
      const icon = L2.divIcon({
        className: "",
        html: `<div style="width:18px;height:18px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9]
      });
      const m2 = L2.marker([lat, lng], { icon });
      m2.bindTooltip(`${p2.name}${p2.contract_value ? ` · ${Number(p2.contract_value).toLocaleString("fr-CA")}$` : ""}`, { direction: "top", offset: [0, -8] });
      m2.on("click", () => navigate(`/projets/${p2.id}`));
      m2.addTo(layerRef.current);
      bounds.push([lat, lng]);
    });
    if (bounds.length) mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
  }, [ready, projects2, navigate]);
  const located = projects2.filter((p2) => p2.latitude && p2.longitude).length;
  const missing = projects2.filter((p2) => p2.address && (!p2.latitude || !p2.longitude)).length;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-3 text-xs text-gray-500", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
        located,
        " chantier(s) localisé(s)",
        missing > 0 ? ` · ${missing} sans position` : ""
      ] }),
      missing > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "btn-secondary text-xs py-1", onClick: onGeocodeAll, disabled: geocoding, children: [
        geocoding ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 12, className: "animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { size: 12 }),
        "Localiser ",
        missing,
        " chantier",
        missing > 1 ? "s" : ""
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: mapEl, style: { height: 520, borderRadius: 16, overflow: "hidden", zIndex: 0 }, className: "border border-gray-100" }),
    located === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-center text-sm text-gray-400 mt-3", children: "Aucun chantier localisé. Ajoutez une adresse aux projets puis cliquez « Localiser »." })
  ] });
}
const EMPTY$2 = { name: "", address: "", start_date: "", end_date: "", contract_value: "" };
const slugify = (str) => (str || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "etat";
function PipelineManager({ pipeline, onSave, onClose }) {
  const [stages, setStages] = reactExports.useState(() => pipeline.map((s) => ({ ...s })));
  const [saving, setSaving] = reactExports.useState(false);
  const upd = (i, patch) => setStages((s) => s.map((st, idx) => idx === i ? { ...st, ...patch } : st));
  const move = (i, dir) => setStages((s) => {
    const j = i + dir;
    if (j < 0 || j >= s.length) return s;
    const next = [...s];
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  });
  const remove = (i) => setStages((s) => s.filter((_, idx) => idx !== i));
  const add = () => setStages((s) => [...s, { key: "", label: "Nouvel état", color: "#94a3b8" }]);
  const save = async () => {
    setSaving(true);
    const seen2 = /* @__PURE__ */ new Set();
    const cleaned = stages.filter((st) => (st.label || "").trim()).map((st) => {
      let key = st.key && /^[a-z0-9_]+$/.test(st.key) ? st.key : slugify(st.label);
      const base = key;
      let n2 = 1;
      while (seen2.has(key)) key = `${base}_${n2++}`;
      seen2.add(key);
      return { key, label: st.label.trim(), color: st.color || "#94a3b8", ...st.terminal ? { terminal: true } : {} };
    });
    if (cleaned.length) await onSave(cleaned);
    setSaving(false);
    onClose();
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    SlideOver,
    {
      title: "Gérer le pipeline",
      subtitle: "Personnalise les états par lesquels tes projets passent",
      onClose,
      footer: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn-secondary flex-1", onClick: onClose, children: "Annuler" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "btn-primary flex-1", onClick: save, disabled: saving, children: [
          saving && /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 14, className: "animate-spin" }),
          " Enregistrer"
        ] })
      ] }),
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        stages.map((st, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 p-2 rounded-xl border border-gray-100 bg-gray-50", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => move(i, -1), disabled: i === 0, className: "text-gray-300 hover:text-gray-600 disabled:opacity-30", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowUp, { size: 13 }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => move(i, 1), disabled: i === stages.length - 1, className: "text-gray-300 hover:text-gray-600 disabled:opacity-30", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowDown, { size: 13 }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "color", value: st.color || "#94a3b8", onChange: (e) => upd(i, { color: e.target.value }), className: "w-7 h-7 rounded cursor-pointer flex-shrink-0 border border-gray-200", title: "Couleur" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input flex-1 py-1 text-sm", value: st.label, onChange: (e) => upd(i, { label: e.target.value }), placeholder: "Nom de l'état" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-1 text-[10px] text-gray-400 flex-shrink-0", title: "État final (projet terminé)", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: !!st.terminal, onChange: (e) => upd(i, { terminal: e.target.checked }) }),
            " fin"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => remove(i), className: "text-gray-300 hover:text-red-500 flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 14 }) })
        ] }, i)),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: add, className: "w-full flex items-center justify-center gap-1 py-2 text-sm text-brand border border-dashed border-brand/40 rounded-xl hover:bg-orange-50", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 14 }),
          " Ajouter un état"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400 pt-1", children: "L'ordre définit la progression. Coche « fin » pour les états où le projet est clos (rangé dans « Terminés »)." })
      ] })
    }
  );
}
function ProjectModal({ project, onClose, onSave }) {
  const [form, setForm] = reactExports.useState(project ? {
    name: project.name || "",
    address: project.address || "",
    start_date: project.start_date ? project.start_date.slice(0, 10) : "",
    end_date: project.end_date ? project.end_date.slice(0, 10) : "",
    contract_value: project.contract_value || ""
  } : { ...EMPTY$2 });
  const [saving, setSaving] = reactExports.useState(false);
  const f2 = (k2) => (e) => setForm((p2) => ({ ...p2, [k2]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { name: form.name, address: form.address, start_date: form.start_date || null, end_date: form.end_date || null, contract_value: form.contract_value || null };
      const { data } = project ? await projects.update(project.id, payload) : await projects.create(payload);
      onSave(data, !!project);
    } catch {
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    SlideOver,
    {
      title: project ? "Modifier le projet" : "Nouveau projet",
      subtitle: project ? project.name : "Créer un nouveau chantier",
      onClose,
      footer: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn-secondary flex-1", onClick: onClose, children: "Annuler" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "submit", form: "project-form", className: "btn-primary flex-1", disabled: saving, children: [
          saving && /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 14, className: "animate-spin" }),
          " ",
          project ? "Enregistrer" : "Créer"
        ] })
      ] }),
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { id: "project-form", onSubmit: submit, className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Nom du projet *" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", value: form.name, onChange: f2("name"), required: true })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Adresse du chantier" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", placeholder: "123 rue Principale, Montréal", value: form.address, onChange: f2("address") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Début" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", type: "date", value: form.start_date, onChange: f2("start_date") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Fin prévue" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", type: "date", value: form.end_date, onChange: f2("end_date") })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Valeur du contrat ($)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", type: "number", value: form.contract_value, onChange: f2("contract_value") })
        ] })
      ] })
    }
  );
}
function Projets() {
  const [searchParams] = useSearchParams();
  const [items, setItems] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [showNew, setShowNew] = reactExports.useState(searchParams.get("new") === "1");
  const [editItem, setEditItem] = reactExports.useState(null);
  const [search, setSearch] = reactExports.useState("");
  const [statusFilter, setStatusFilter] = reactExports.useState("");
  const [pipeOpen, setPipeOpen] = reactExports.useState(false);
  const navigate = useNavigate();
  const storePipeline = useConfigStore((s) => s.pipeline);
  const loadCfg = useConfigStore((s) => s.load);
  const setPipeline = useConfigStore((s) => s.setPipeline);
  const pipeline = storePipeline && storePipeline.length ? storePipeline : DEFAULT_PIPELINE;
  const stageMap = reactExports.useMemo(() => Object.fromEntries(pipeline.map((s) => [s.key, s])), [pipeline]);
  const isTerminal = (p2) => {
    var _a;
    return !!((_a = stageMap[p2.status]) == null ? void 0 : _a.terminal);
  };
  const load = async () => {
    setLoading(true);
    try {
      const { data } = await projects.list();
      setItems(data);
    } catch {
    } finally {
      setLoading(false);
    }
  };
  reactExports.useEffect(() => {
    load();
    loadCfg();
  }, []);
  const changeStage = async (id2, status) => {
    setItems((i) => i.map((p2) => p2.id === id2 ? { ...p2, status } : p2));
    try {
      await projects.update(id2, { status });
    } catch {
    }
  };
  const handleSave = (data, isEdit) => {
    if (isEdit) setItems((i) => i.map((p2) => p2.id === data.id ? { ...p2, ...data } : p2));
    else {
      setItems((i) => [data, ...i]);
      navigate(`/projets/${data.id}`);
    }
    setShowNew(false);
    setEditItem(null);
  };
  const del = async (id2) => {
    if (!confirm("Supprimer ce projet ?")) return;
    await projects.delete(id2);
    setItems((i) => i.filter((p2) => p2.id !== id2));
  };
  const filtered = items.filter((p2) => {
    var _a, _b;
    const q2 = search.toLowerCase();
    const matchSearch = !q2 || ((_a = p2.name) == null ? void 0 : _a.toLowerCase().includes(q2)) || ((_b = p2.address) == null ? void 0 : _b.toLowerCase().includes(q2));
    const matchStatus = !statusFilter || p2.status === statusFilter;
    return matchSearch && matchStatus;
  });
  const active = filtered.filter((p2) => !isTerminal(p2));
  const others = filtered.filter((p2) => isTerminal(p2));
  const [sliderProject, setSliderProject] = reactExports.useState(null);
  const [view, setView] = reactExports.useState("list");
  const [geocoding, setGeocoding] = reactExports.useState(false);
  const saveProgress = reactExports.useCallback(async (id2, pct) => {
    setItems((i) => i.map((p2) => p2.id === id2 ? { ...p2, progress_pct: pct } : p2));
    try {
      await projects.update(id2, { progress_pct: pct });
    } catch {
    }
  }, []);
  const geocodeAll = reactExports.useCallback(async () => {
    const missing = items.filter((p2) => p2.address && (!p2.latitude || !p2.longitude));
    if (!missing.length) return;
    setGeocoding(true);
    for (const p2 of missing) {
      try {
        const { data } = await projects.geocode(p2.id);
        setItems((i) => i.map((pr) => pr.id === p2.id ? { ...pr, latitude: data.latitude, longitude: data.longitude } : pr));
      } catch {
      }
      await new Promise((r2) => setTimeout(r2, 1100));
    }
    setGeocoding(false);
  }, [items]);
  const ProjectCard = ({ p: p2 }) => {
    const pct = p2.progress_pct || 0;
    const st = stageMap[p2.status] || {};
    const color = st.color || "#94a3b8";
    const isEditing = sliderProject === p2.id;
    const daysLeft = p2.end_date && !st.terminal ? Math.ceil((new Date(p2.end_date) - Date.now()) / 864e5) : null;
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card hover:shadow-md transition-shadow", onClick: () => {
      if (!isEditing) navigate(`/projets/${p2.id}`);
    }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 cursor-pointer", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-2 h-10 rounded-full flex-shrink-0", style: { background: color } }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-0.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-gray-900 text-sm truncate", children: p2.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0", style: { background: `${color}1a`, color }, children: st.label || p2.status }),
            daysLeft !== null && daysLeft <= 7 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `text-[10px] font-semibold flex items-center gap-0.5 ${daysLeft < 0 ? "text-red-500" : "text-orange-500"}`, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { size: 9 }),
              daysLeft < 0 ? `${Math.abs(daysLeft)}j retard` : `${daysLeft}j`
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 text-xs text-gray-400 flex-wrap mb-1.5", children: [
            p2.address && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { size: 11 }),
              p2.address
            ] }),
            p2.start_date && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { size: 11 }),
              new Date(p2.start_date).toLocaleDateString("fr-CA")
            ] }),
            p2.contract_value && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { size: 11 }),
              Number(p2.contract_value).toLocaleString("fr-CA"),
              "$"
            ] }),
            (() => {
              const hasReal = num(p2.invoiced_real) > 0;
              const m2 = hasReal ? realMargin(p2) : theoMargin(p2);
              const rev = hasReal ? num(p2.invoiced_real) : num(p2.contract_value);
              if (!rev && !m2) return null;
              const pos = m2 >= 0;
              return /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `flex items-center gap-1 font-medium ${pos ? "text-green-600" : "text-red-500"}`, title: hasReal ? "Marge réelle" : "Marge théorique", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { size: 11 }),
                money$1(m2),
                rev > 0 ? ` · ${Math.round(m2 / rev * 100)}%` : "",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-300 font-normal", children: hasReal ? "réel" : "prév." })
              ] });
            })()
          ] }),
          !st.terminal && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: "flex items-center gap-2 group",
              onClick: (e) => {
                e.stopPropagation();
                setSliderProject(isEditing ? null : p2.id);
              },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative flex-1 h-2 bg-gray-100 rounded-full cursor-pointer group-hover:h-3 transition-all", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full rounded-full transition-all", style: { width: `${pct}%`, background: color } }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-medium w-8 text-right flex-shrink-0 group-hover:underline", style: { color }, children: [
                  pct,
                  "%"
                ] })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 flex-shrink-0", onClick: (e) => e.stopPropagation(), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "select",
            {
              value: p2.status,
              onChange: (e) => changeStage(p2.id, e.target.value),
              className: "text-xs border border-gray-200 rounded-lg px-1.5 py-1 text-gray-600 bg-white hover:border-gray-300 cursor-pointer max-w-[8.5rem]",
              title: "Changer l'état",
              children: [
                pipeline.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: s.key, children: s.label }, s.key)),
                !stageMap[p2.status] && /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: p2.status, children: p2.status })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "btn-ghost p-1.5 text-gray-400 hover:text-blue-500", onClick: () => setEditItem(p2), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { size: 13 }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "btn-ghost p-1.5 text-gray-400 hover:text-red-500", onClick: () => del(p2.id), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 13 }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { size: 14, className: "text-gray-300 ml-1" })
        ] })
      ] }),
      isEditing && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 pt-3 border-t border-gray-100", onClick: (e) => e.stopPropagation(), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-gray-500 flex-shrink-0", children: "Avancement" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "range",
              min: "0",
              max: "100",
              step: "5",
              defaultValue: pct,
              className: "flex-1 accent-brand",
              onChange: (e) => setItems((i) => i.map((pr) => pr.id === p2.id ? { ...pr, progress_pct: Number(e.target.value) } : pr)),
              onMouseUp: (e) => {
                saveProgress(p2.id, Number(e.target.value));
                setSliderProject(null);
              },
              onTouchEnd: (e) => {
                saveProgress(p2.id, Number(e.target.value));
                setSliderProject(null);
              }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-bold w-10 text-right flex-shrink-0", style: { color }, children: [
            pct,
            "%"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-1.5 mt-2", children: [0, 25, 50, 75, 100].map((v2) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            className: `flex-1 text-xs py-1 rounded-lg border transition-colors ${pct === v2 ? "border-brand text-brand bg-orange-50 font-semibold" : "border-gray-200 text-gray-400 hover:border-gray-300"}`,
            onClick: () => {
              saveProgress(p2.id, v2);
              setSliderProject(null);
            },
            children: [
              v2,
              "%"
            ]
          },
          v2
        )) })
      ] })
    ] });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 max-w-5xl mx-auto", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-6 gap-3 flex-wrap", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-bold text-gray-900", children: "Projets" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex bg-gray-100 rounded-lg p-0.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              className: `flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md transition-colors ${view === "list" ? "bg-white shadow-sm text-gray-900 font-medium" : "text-gray-400"}`,
              onClick: () => setView("list"),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(List, { size: 13 }),
                " Liste"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              className: `flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md transition-colors ${view === "map" ? "bg-white shadow-sm text-gray-900 font-medium" : "text-gray-400"}`,
              onClick: () => setView("map"),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Map$1, { size: 13 }),
                " Carte"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "btn-secondary", onClick: () => setPipeOpen(true), title: "Personnaliser le pipeline", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Settings2, { size: 15 }),
          " Pipeline"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "btn-primary", onClick: () => setShowNew(true), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 15 }),
          " Nouveau projet"
        ] })
      ] })
    ] }),
    showNew && /* @__PURE__ */ jsxRuntimeExports.jsx(ProjectModal, { onClose: () => setShowNew(false), onSave: handleSave }),
    editItem && /* @__PURE__ */ jsxRuntimeExports.jsx(ProjectModal, { project: editItem, onClose: () => setEditItem(null), onSave: handleSave }),
    pipeOpen && /* @__PURE__ */ jsxRuntimeExports.jsx(PipelineManager, { pipeline, onSave: setPipeline, onClose: () => setPipeOpen(false) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 mb-4 flex-wrap", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex-1 min-w-48", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { size: 13, className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input pl-8", placeholder: "Rechercher par nom ou adresse…", value: search, onChange: (e) => setSearch(e.target.value) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "input w-auto text-sm", value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "Tous les états" }),
        pipeline.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: s.key, children: s.label }, s.key))
      ] })
    ] }),
    loading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-gray-400 py-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 16, className: "animate-spin" }),
      " Chargement…"
    ] }) : view === "map" ? /* @__PURE__ */ jsxRuntimeExports.jsx(MapView, { projects: filtered, onGeocodeAll: geocodeAll, geocoding, stageMap }) : filtered.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center py-12 text-gray-400 text-sm", children: items.length === 0 ? "Aucun projet. Créez-en un!" : "Aucun projet ne correspond à votre recherche." }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      filtered.length > 0 && (() => {
        const totContract = filtered.reduce((s, p2) => s + num(p2.contract_value), 0);
        const totInvoiced = filtered.reduce((s, p2) => s + num(p2.invoiced_real), 0);
        const totReal = filtered.reduce((s, p2) => s + realMargin(p2), 0);
        const totTheo = filtered.reduce((s, p2) => s + theoMargin(p2), 0);
        const stat = (label, val, color) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-[110px]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400", children: label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-lg font-bold ${color || "text-gray-900"}`, children: money$1(val) })
        ] });
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card mb-5 flex flex-wrap gap-4", children: [
          stat("Valeur portefeuille", totContract),
          stat("Facturé", totInvoiced),
          stat("Marge théorique", totTheo, totTheo >= 0 ? "text-green-600" : "text-red-500"),
          stat("Marge réelle", totReal, totReal >= 0 ? "text-green-600" : "text-red-500")
        ] });
      })(),
      active.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2", children: [
          "En cours (",
          active.length,
          ")"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3", children: active.map((p2) => /* @__PURE__ */ jsxRuntimeExports.jsx(ProjectCard, { p: p2 }, p2.id)) })
      ] }),
      others.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2", children: [
          "Terminés (",
          others.length,
          ")"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3", children: others.map((p2) => /* @__PURE__ */ jsxRuntimeExports.jsx(ProjectCard, { p: p2 }, p2.id)) })
      ] })
    ] })
  ] }) });
}
const FRONTEND_URL = window.location.origin;
const money = (v2) => (Number(v2) || 0).toLocaleString("fr-CA", { maximumFractionDigits: 0 }) + "$";
const TRADE_STATUS = {
  to_find: { label: "À trouver", badge: "badge-gray" },
  contacted: { label: "Contacté", badge: "badge-blue" },
  quoted: { label: "Soumissionné", badge: "badge-yellow" },
  confirmed: { label: "Confirmé", badge: "badge-orange" },
  done: { label: "Terminé", badge: "badge-green" }
};
const EXPENSE_TYPES = {
  supplier_invoice: "Facture fournisseur",
  material: "Matériaux",
  equipment: "Équipement",
  permit: "Permis",
  rental: "Location",
  other: "Autre"
};
function DocPreview({ doc, onClose }) {
  if (!doc) return null;
  const isImage = (doc.mime_type || "").startsWith("image/") || /\.(png|jpe?g|gif|webp|svg)$/i.test(doc.url || "");
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4", onClick: onClose, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white rounded-2xl w-full max-w-3xl flex flex-col overflow-hidden", style: { height: "85vh" }, onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between px-4 py-3 border-b border-gray-100", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { size: 15, className: "text-brand" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-gray-800 truncate", children: doc.title || "Aperçu du document" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: doc.url, target: "_blank", rel: "noopener noreferrer", className: "btn-ghost text-xs py-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { size: 13 }),
          " Ouvrir"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "btn-ghost text-xs py-1 px-2", onClick: onClose, children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 16 }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 bg-gray-50 overflow-auto flex items-center justify-center", children: isImage ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: doc.url, alt: doc.title, className: "max-w-full max-h-full object-contain" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("iframe", { src: doc.url, title: doc.title || "document", className: "w-full h-full", style: { border: 0 } }) })
  ] }) });
}
const PS_BADGE = { not_started: "badge-gray", in_progress: "badge-orange", delayed: "badge-red", completed: "badge-green", cancelled: "badge-gray" };
const PS_LABEL = { not_started: "Non démarré", in_progress: "En cours", delayed: "En retard", completed: "Terminé", cancelled: "Annulé" };
const PHASE_COLORS = ["#F26522", "#3b82f6", "#22c55e", "#a855f7", "#f59e0b", "#ef4444", "#14b8a6", "#ec4899"];
function GanttChart({ phases, projectStart, projectEnd }) {
  if (!phases || phases.length === 0) return null;
  const refStart = projectStart ? new Date(projectStart) : /* @__PURE__ */ new Date();
  const refEnd = projectEnd ? new Date(projectEnd) : new Date(refStart.getTime() + 90 * 864e5);
  const totalMs = refEnd - refStart || 1;
  const months = [];
  const cur = new Date(refStart.getFullYear(), refStart.getMonth(), 1);
  while (cur <= refEnd) {
    months.push(new Date(cur));
    cur.setMonth(cur.getMonth() + 1);
  }
  const pct = (d) => Math.max(0, Math.min(100, (new Date(d) - refStart) / totalMs * 100));
  const width = (s, e) => Math.max(1, pct(e) - pct(s));
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { minWidth: 480 }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex mb-1 ml-36", children: months.map((m2, i) => {
      const left = pct(m2);
      const nextM = new Date(m2.getFullYear(), m2.getMonth() + 1, 1);
      const w2 = Math.min(pct(nextM), 100) - left;
      return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-400 border-l border-gray-100 pl-1", style: { width: `${Math.max(w2, 0)}%`, minWidth: 30 }, children: m2.toLocaleDateString("fr-CA", { month: "short" }) }, i);
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative ml-36", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-0 bottom-0 w-px bg-brand z-10", style: { left: `${pct(/* @__PURE__ */ new Date())}%` } }),
      phases.map((ph2, i) => {
        const s = ph2.start_date ? new Date(ph2.start_date) : refStart;
        const e = ph2.end_date ? new Date(ph2.end_date) : new Date(s.getTime() + 14 * 864e5);
        const color = ph2.color || PHASE_COLORS[i % PHASE_COLORS.length];
        const pct_left = pct(s);
        const pct_width = width(s, e);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center mb-2 gap-2 -ml-36", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-36 text-xs font-medium text-gray-700 truncate pr-2 text-right flex-shrink-0", children: ph2.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 relative h-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: "absolute h-full rounded-full flex items-center px-2 overflow-hidden",
              style: { left: `${pct_left}%`, width: `${pct_width}%`, minWidth: 4, background: color + "33", border: `1.5px solid ${color}` },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full rounded-full absolute left-0 top-0", style: { width: `${ph2.progress_pct || 0}%`, background: color + "66" } }),
                pct_width > 8 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "relative text-xs font-medium z-10 truncate", style: { color }, children: [
                  ph2.progress_pct || 0,
                  "%"
                ] })
              ]
            }
          ) })
        ] }, ph2.id);
      })
    ] })
  ] }) });
}
function PhaseModal({ projectId, phase, onClose, onSave }) {
  const [form, setForm] = reactExports.useState(phase ? {
    name: phase.name || "",
    start_date: phase.start_date ? phase.start_date.slice(0, 10) : "",
    end_date: phase.end_date ? phase.end_date.slice(0, 10) : "",
    progress_pct: phase.progress_pct || 0,
    status: phase.status || "not_started"
  } : { name: "", start_date: "", end_date: "", progress_pct: 0, status: "not_started" });
  const [saving, setSaving] = reactExports.useState(false);
  const f2 = (k2) => (e) => setForm((p2) => ({ ...p2, [k2]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let data;
      if (phase) {
        const res = await projects.updatePhase(projectId, phase.id, form);
        data = res.data;
      } else {
        const res = await projects.addPhase(projectId, form);
        data = res.data;
      }
      onSave(data, !!phase);
    } catch {
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card w-full max-w-md", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-semibold text-gray-900 mb-4", children: phase ? "Modifier la phase" : "Nouvelle phase" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: submit, className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Nom *" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", value: form.name, onChange: f2("name"), required: true })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Début" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", type: "date", value: form.start_date, onChange: f2("start_date") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Fin" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", type: "date", value: form.end_date, onChange: f2("end_date") })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "label", children: [
            "Avancement (",
            form.progress_pct,
            "%)"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "w-full", type: "range", min: "0", max: "100", value: form.progress_pct, onChange: f2("progress_pct") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Statut" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("select", { className: "input", value: form.status, onChange: f2("status"), children: Object.entries(PS_LABEL).map(([k2, v2]) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: k2, children: v2 }, k2)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 pt-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn-secondary flex-1", onClick: onClose, children: "Annuler" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "submit", className: "btn-primary flex-1", disabled: saving, children: [
          saving && /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 14, className: "animate-spin" }),
          " ",
          phase ? "Enregistrer" : "Ajouter"
        ] })
      ] })
    ] })
  ] }) });
}
const FIELD_STATUS = {
  ok: { label: "Conforme", color: "#22c55e" },
  watch: { label: "À surveiller", color: "#f59e0b" },
  issue: { label: "Problème", color: "#ef4444" }
};
function InfoModal({ project, onClose, onSave }) {
  const [form, setForm] = reactExports.useState({
    payment_terms: project.payment_terms || "",
    project_manager: project.project_manager || "",
    materials_buyer: project.materials_buyer || "",
    permits_responsible: project.permits_responsible || "",
    permits_required: !!project.permits_required,
    approvers: (project.approvers || []).join(", "),
    machines: (project.machines || []).join(", ")
  });
  const [saving, setSaving] = reactExports.useState(false);
  const f2 = (k2) => (e) => setForm((p2) => ({ ...p2, [k2]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        payment_terms: form.payment_terms || null,
        project_manager: form.project_manager || null,
        materials_buyer: form.materials_buyer || null,
        permits_responsible: form.permits_responsible || null,
        permits_required: form.permits_required,
        approvers: form.approvers.split(",").map((s) => s.trim()).filter(Boolean),
        machines: form.machines.split(",").map((s) => s.trim()).filter(Boolean)
      };
      const { data } = await projects.update(project.id, payload);
      onSave(data);
    } catch {
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card w-full max-w-lg max-h-[90vh] overflow-y-auto", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-semibold text-gray-900 mb-4", children: "Infos du projet" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: submit, className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Termes de paiement" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", value: form.payment_terms, onChange: f2("payment_terms"), placeholder: "30% dépôt · 40% mi-chantier · 30% fin" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Chargé de projet" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", value: form.project_manager, onChange: f2("project_manager"), placeholder: "Nom" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Acheteur matériaux" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", value: form.materials_buyer, onChange: f2("materials_buyer"), placeholder: "Nom" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Approbateurs (séparés par des virgules)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", value: form.approvers, onChange: f2("approvers"), placeholder: "Marie, Jean" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Responsable des permis" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", value: form.permits_responsible, onChange: f2("permits_responsible"), placeholder: "Nom" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 text-sm text-gray-600 mt-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: form.permits_required, onChange: (e) => setForm((p2) => ({ ...p2, permits_required: e.target.checked })) }),
          " Permis requis"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Machines / équipements (virgules)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", value: form.machines, onChange: f2("machines"), placeholder: "Excavatrice, échafaudage, nacelle" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 pt-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn-secondary flex-1", onClick: onClose, children: "Annuler" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "submit", className: "btn-primary flex-1", disabled: saving, children: [
          saving && /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 14, className: "animate-spin" }),
          " Enregistrer"
        ] })
      ] })
    ] })
  ] }) });
}
function FieldEstimation({ project, onUpdated }) {
  var _a, _b, _c;
  const checklists = project.field_checklists || {};
  const tradeKeys = Object.keys(checklists);
  const initial = project.field_assessment || {};
  const [checks, setChecks] = reactExports.useState(initial.checks || {});
  const [notOnSite, setNotOnSite] = reactExports.useState(!!initial.not_on_site);
  const [estimate, setEstimate] = reactExports.useState(initial.ai_estimate || null);
  const [estimating, setEstimating] = reactExports.useState(false);
  const [sending, setSending] = reactExports.useState(false);
  const [requesting, setRequesting] = reactExports.useState(false);
  const [msg, setMsg] = reactExports.useState(null);
  const saveTimer = reactExports.useRef(null);
  const persist2 = (nextChecks, nextNotOnSite) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      projects.update(project.id, {
        field_assessment: { ...initial, checks: nextChecks, not_on_site: nextNotOnSite }
      }).catch(() => {
      });
    }, 900);
  };
  const setItem = (key, label, patch) => {
    setChecks((prev) => {
      const next = { ...prev, [key]: { label, ...prev[key] || {}, ...patch } };
      persist2(next, notOnSite);
      return next;
    });
  };
  const runEstimate = async () => {
    setEstimating(true);
    setMsg(null);
    try {
      const { data } = await projects.estimateField(project.id, { field_assessment: { checks, not_on_site: notOnSite } });
      setEstimate(data.estimate);
      onUpdated == null ? void 0 : onUpdated();
    } catch {
      setMsg({ err: true, text: "L'estimation a échoué. Réessaie." });
    } finally {
      setEstimating(false);
    }
  };
  const sendPrice = async () => {
    setSending(true);
    try {
      const { data } = await projects.sendPrice(project.id, { price: estimate == null ? void 0 : estimate.expected_price });
      setMsg({ err: false, text: data.message });
      onUpdated == null ? void 0 : onUpdated();
    } catch {
    } finally {
      setSending(false);
    }
  };
  const requestMedia = async () => {
    setRequesting(true);
    try {
      const items = tradeKeys.flatMap((t2) => checklists[t2] || []);
      const { data } = await projects.requestClientMedia(project.id, {
        items,
        message: "Peux-tu m'envoyer des photos/vidéos de ces éléments pour finaliser l'estimation?"
      });
      setMsg({ err: false, text: data.message });
    } catch {
    } finally {
      setRequesting(false);
    }
  };
  if (!tradeKeys.length) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card mb-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ClipboardCheck, { size: 15, className: "text-brand" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-semibold text-gray-900 text-sm", children: "Estimation terrain" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400", children: "Les listes de vérification terrain sont générées selon les corps de métier choisis à l'onboarding. Complète ton profil métier pour les activer ici." })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card mb-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ClipboardCheck, { size: 15, className: "text-brand" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-semibold text-gray-900 text-sm", children: "Estimation terrain" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-1.5 text-xs text-gray-500", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: notOnSite, onChange: (e) => {
          setNotOnSite(e.target.checked);
          persist2(checks, e.target.checked);
        } }),
        " Pas sur place"
      ] })
    ] }),
    notOnSite && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 p-3 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-orange-700", children: "Demande au client des photos/vidéos pour répondre à la checklist à distance." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "btn-secondary text-xs flex-shrink-0", onClick: requestMedia, disabled: requesting, children: [
        requesting ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 12, className: "animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Camera, { size: 12 }),
        " Demander au client"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: tradeKeys.map((trade) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2", children: trade.replace(/_/g, " ") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-1.5", children: (checklists[trade] || []).map((label, i) => {
        const key = `${trade}__${i}`;
        const item = checks[key] || {};
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2 py-1.5 border-b border-gray-50 last:border-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-700", children: label }),
            item.status && /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input mt-1 py-1 text-xs", placeholder: "Note (mesure, état, problème…)", value: item.note || "", onChange: (e) => setItem(key, label, { note: e.target.value }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-1 flex-shrink-0", children: Object.entries(FIELD_STATUS).map(([k2, v2]) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => setItem(key, label, { status: item.status === k2 ? "" : k2 }),
              title: v2.label,
              className: "w-6 h-6 rounded-full border text-[10px] font-bold flex items-center justify-center transition-colors",
              style: item.status === k2 ? { background: v2.color, borderColor: v2.color, color: "#fff" } : { borderColor: "#e5e7eb", color: "#9ca3af" },
              children: v2.label[0]
            },
            k2
          )) })
        ] }, key);
      }) })
    ] }, trade)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "btn-primary w-full mt-4", onClick: runEstimate, disabled: estimating, children: [
      estimating ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 14, className: "animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { size: 14 }),
      " Estimer le prix global (IA)"
    ] }),
    estimate && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 p-4 rounded-xl bg-gray-50 border border-gray-100", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-end justify-between gap-3 mb-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400", children: "Prix global estimé" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-bold text-gray-900", children: money(estimate.expected_price) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-gray-400", children: [
            "Fourchette ",
            money(estimate.low_price),
            " – ",
            money(estimate.high_price),
            " · confiance ",
            estimate.confidence
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "btn-primary text-xs flex-shrink-0", onClick: sendPrice, disabled: sending, children: [
          sending ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 12, className: "animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { size: 12 }),
          " Envoyer au client"
        ] })
      ] }),
      ((_a = estimate.breakdown) == null ? void 0 : _a.length) > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 space-y-1", children: estimate.breakdown.map((b, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-xs gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-600", children: b.poste }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-900 font-medium flex-shrink-0", children: money(b.amount) })
      ] }, i)) }),
      ((_b = estimate.assumptions) == null ? void 0 : _b.length) > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[11px] text-gray-400 mt-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Hypothèses :" }),
        " ",
        estimate.assumptions.join(" · ")
      ] }),
      ((_c = estimate.missing_info) == null ? void 0 : _c.length) > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[11px] text-orange-500 mt-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "À préciser :" }),
        " ",
        estimate.missing_info.join(" · ")
      ] }),
      estimate.notes && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-gray-500 mt-1", children: estimate.notes })
    ] }),
    msg && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-xs mt-2 ${msg.err ? "text-red-500" : "text-green-600"}`, children: msg.text }),
    project.price_sent_at && !msg && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-gray-400 mt-2", children: [
      "Prix envoyé le ",
      new Date(project.price_sent_at).toLocaleDateString("fr-CA"),
      "."
    ] })
  ] });
}
function ProjectDetail() {
  var _a, _b, _c, _d, _e, _f, _g, _h;
  const { id: id2 } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [qrData, setQrData] = reactExports.useState(null);
  const [genQr, setGenQr] = reactExports.useState(false);
  const [timesheets$1, setTimesheets] = reactExports.useState([]);
  const [showPhase, setShowPhase] = reactExports.useState(false);
  const [editPhase, setEditPhase] = reactExports.useState(null);
  const [projectInvoices, setProjectInvoices] = reactExports.useState([]);
  const [projectQuotes, setProjectQuotes] = reactExports.useState([]);
  const [notes, setNotes] = reactExports.useState("");
  const [notesSaving, setNotesSaving] = reactExports.useState(false);
  const notesTimer = reactExports.useRef(null);
  const [quittance, setQuittance] = reactExports.useState(null);
  const [showQuittanceForm, setShowQuittanceForm] = reactExports.useState(false);
  const [quittanceForm, setQuittanceForm] = reactExports.useState({ client_name: "", client_email: "", project_description: "", amount_paid: "", notes: "" });
  const [savingQuittance, setSavingQuittance] = reactExports.useState(false);
  const [portalCopied, setPortalCopied] = reactExports.useState(false);
  const [resettingPortal, setResettingPortal] = reactExports.useState(false);
  const [changeOrdersList, setChangeOrdersList] = reactExports.useState([]);
  const [showCOForm, setShowCOForm] = reactExports.useState(false);
  const [coForm, setCoForm] = reactExports.useState({ title: "", description: "", amount: "", notes: "" });
  const [savingCO, setSavingCO] = reactExports.useState(false);
  const [copiedCO, setCopiedCO] = reactExports.useState(null);
  const [portalMessages, setPortalMessages] = reactExports.useState([]);
  const [profit, setProfit] = reactExports.useState(null);
  const [subs, setSubs] = reactExports.useState([]);
  const [preview, setPreview] = reactExports.useState(null);
  const [showTradeForm, setShowTradeForm] = reactExports.useState(false);
  const [tradeForm, setTradeForm] = reactExports.useState({ trade: "", estimated_cost: "", chosen_subcontractor_id: "" });
  const [showExpenseForm, setShowExpenseForm] = reactExports.useState(false);
  const [expenseForm, setExpenseForm] = reactExports.useState({ type: "supplier_invoice", description: "", amount: "", expense_date: "" });
  const [laborRate, setLaborRate] = reactExports.useState("");
  const [savingRate, setSavingRate] = reactExports.useState(false);
  const [showInfo, setShowInfo] = reactExports.useState(false);
  const [activeTab, setActiveTab] = reactExports.useState("apercu");
  const [quoteBuilderQuote, setQuoteBuilderQuote] = reactExports.useState(null);
  const [quoteBuilderItems, setQuoteBuilderItems] = reactExports.useState([]);
  const [quoteSaving, setQuoteSaving] = reactExports.useState(false);
  const [quoteSending, setQuoteSending] = reactExports.useState(false);
  const [projectRfqs, setProjectRfqs] = reactExports.useState([]);
  const [showRfqForm, setShowRfqForm] = reactExports.useState(false);
  const [rfqForm, setRfqForm] = reactExports.useState({ title: "", specialty: "", description: "", deadline: "" });
  const [showInviteModal, setShowInviteModal] = reactExports.useState(null);
  const [selectedSubIds, setSelectedSubIds] = reactExports.useState([]);
  const [inviting, setInviting] = reactExports.useState(false);
  const [projectContracts, setProjectContracts] = reactExports.useState([]);
  const [generatingContract, setGeneratingContract] = reactExports.useState(false);
  const [contractSendingId, setContractSendingId] = reactExports.useState(null);
  const [showContractContent, setShowContractContent] = reactExports.useState(null);
  const quoteTimer = reactExports.useRef(null);
  const load = async () => {
    var _a2, _b2;
    setLoading(true);
    try {
      const [{ data: proj }, { data: ts }, { data: invs }, { data: qs }, { data: quits }, { data: cos }, { data: msgs }, { data: prof }, { data: subList }, { data: projQuotes }, { data: rfqList }, { data: contractList }] = await Promise.all([
        projects.get(id2),
        timesheets.list({ project_id: id2 }),
        invoices.list({ project_id: id2 }),
        quotes.list(),
        quittances.list({ project_id: id2 }),
        changeOrders.list({ project_id: id2 }),
        projects.getPortalMessages(id2).catch(() => ({ data: [] })),
        projects.profitability(id2).catch(() => ({ data: null })),
        subcontractors.list().catch(() => ({ data: [] })),
        quotes.byProject(id2).catch(() => ({ data: [] })),
        rfqs.byProject(id2).catch(() => ({ data: [] })),
        contracts.list({ project_id: id2 }).catch(() => ({ data: [] }))
      ]);
      setProject(proj);
      setTimesheets(ts);
      setProjectInvoices(invs);
      setProjectQuotes(qs.filter((q2) => q2.project_id === id2));
      setQuittance((quits == null ? void 0 : quits[0]) || null);
      setChangeOrdersList(cos || []);
      setPortalMessages(msgs || []);
      setNotes(proj.notes || "");
      setProfit(prof);
      setSubs(subList || []);
      setLaborRate(((_b2 = (_a2 = prof == null ? void 0 : prof.actual) == null ? void 0 : _a2.cost_breakdown) == null ? void 0 : _b2.labor_cost_rate) ? String(prof.actual.cost_breakdown.labor_cost_rate) : "");
      const firstQuote = (projQuotes == null ? void 0 : projQuotes[0]) || null;
      setQuoteBuilderQuote(firstQuote);
      setQuoteBuilderItems((firstQuote == null ? void 0 : firstQuote.items) || []);
      setProjectRfqs(rfqList || []);
      setProjectContracts(contractList || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };
  const refreshProfit = async () => {
    try {
      const { data } = await projects.profitability(id2);
      setProfit(data);
    } catch {
    }
  };
  const saveNotes = async (val) => {
    setNotesSaving(true);
    try {
      await projects.update(id2, { notes: val });
    } catch {
    } finally {
      setNotesSaving(false);
    }
  };
  const handleNotesChange = (val) => {
    setNotes(val);
    clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(() => saveNotes(val), 1200);
  };
  reactExports.useEffect(() => {
    load();
  }, [id2]);
  const generateQR = async () => {
    setGenQr(true);
    try {
      const { data } = await punch.generate({ project_id: id2, label: project == null ? void 0 : project.name });
      setQrData(data);
    } catch {
    } finally {
      setGenQr(false);
    }
  };
  const handlePhaseSave = (data, isEdit) => {
    setProject((p2) => ({
      ...p2,
      phases: isEdit ? p2.phases.map((ph2) => ph2.id === data.id ? data : ph2) : [...p2.phases || [], data]
    }));
    setShowPhase(false);
    setEditPhase(null);
  };
  const printQR = () => {
    if (!qrData) return;
    const w2 = window.open("", "_blank", "width=420,height=520");
    w2.document.write(`<!DOCTYPE html><html><head><title>QR ${(project == null ? void 0 : project.name) || ""}</title><style>body{margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#fff;}img{width:300px;height:300px;}h1{margin-top:16px;font-size:16px;font-weight:700;color:#111;text-align:center;}p{font-size:12px;color:#888;margin:4px 0 0;}</style></head><body><img src="${qrData.qr_image}" alt="QR"/><h1>${(project == null ? void 0 : project.name) || "Chantier"}</h1><p>Scannez pour pointer</p></body></html>`);
    w2.document.close();
    w2.focus();
    w2.print();
  };
  const createQuittance = async (e) => {
    e.preventDefault();
    setSavingQuittance(true);
    try {
      const { data } = await quittances.create({
        project_id: id2,
        client_name: quittanceForm.client_name || project.client_name || "",
        client_email: quittanceForm.client_email || "",
        project_description: quittanceForm.project_description || project.name,
        amount_paid: quittanceForm.amount_paid ? Number(quittanceForm.amount_paid) : project.contract_value || 0,
        notes: quittanceForm.notes || ""
      });
      setQuittance(data);
      setShowQuittanceForm(false);
    } catch {
    } finally {
      setSavingQuittance(false);
    }
  };
  const resetPortalToken = async () => {
    if (!confirm("Générer un nouveau lien ? L'ancien lien ne fonctionnera plus.")) return;
    setResettingPortal(true);
    try {
      const { data } = await projects.resetPortalToken(id2);
      setProject((p2) => ({ ...p2, portal_token: data.portal_token }));
    } catch {
    } finally {
      setResettingPortal(false);
    }
  };
  const copyPortalLink = () => {
    if (!project.portal_token) return;
    navigator.clipboard.writeText(`${FRONTEND_URL}/portal/${project.portal_token}`);
    setPortalCopied(true);
    setTimeout(() => setPortalCopied(false), 2e3);
  };
  const createChangeOrder = async (e) => {
    e.preventDefault();
    setSavingCO(true);
    try {
      const { data } = await changeOrders.create({
        project_id: id2,
        title: coForm.title,
        description: coForm.description,
        amount: coForm.amount ? Number(coForm.amount) : 0,
        notes: coForm.notes
      });
      setChangeOrdersList((l2) => [data, ...l2]);
      setShowCOForm(false);
      setCoForm({ title: "", description: "", amount: "", notes: "" });
    } catch {
    } finally {
      setSavingCO(false);
    }
  };
  const deleteCO = async (coId) => {
    if (!confirm("Supprimer cette demande de modification ?")) return;
    await changeOrders.delete(coId);
    setChangeOrdersList((l2) => l2.filter((c) => c.id !== coId));
  };
  const copyCOLink = (co) => {
    navigator.clipboard.writeText(`${FRONTEND_URL}/modification/${co.public_token}`);
    setCopiedCO(co.id);
    setTimeout(() => setCopiedCO(null), 2e3);
  };
  const addTrade = async (e) => {
    e.preventDefault();
    if (!tradeForm.trade.trim()) return;
    try {
      const { data } = await projects.addTrade(id2, {
        trade: tradeForm.trade.trim(),
        estimated_cost: tradeForm.estimated_cost ? Number(tradeForm.estimated_cost) : null,
        chosen_subcontractor_id: tradeForm.chosen_subcontractor_id || null
      });
      setProject((p2) => ({ ...p2, trades: [...p2.trades || [], data] }));
      setTradeForm({ trade: "", estimated_cost: "", chosen_subcontractor_id: "" });
      setShowTradeForm(false);
      refreshProfit();
    } catch {
    }
  };
  const patchTrade = async (tradeId, patch) => {
    setProject((p2) => ({ ...p2, trades: p2.trades.map((t2) => t2.id === tradeId ? { ...t2, ...patch } : t2) }));
    try {
      const { data } = await projects.updateTrade(id2, tradeId, patch);
      setProject((p2) => ({ ...p2, trades: p2.trades.map((t2) => t2.id === tradeId ? data : t2) }));
      if ("estimated_cost" in patch) refreshProfit();
    } catch {
    }
  };
  const removeTrade = async (tradeId) => {
    if (!confirm("Retirer ce corps de métier ?")) return;
    await projects.deleteTrade(id2, tradeId);
    setProject((p2) => ({ ...p2, trades: p2.trades.filter((t2) => t2.id !== tradeId) }));
    refreshProfit();
  };
  const addExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.amount) return;
    try {
      const { data } = await projects.addExpense(id2, {
        type: expenseForm.type,
        description: expenseForm.description || null,
        amount: Number(expenseForm.amount),
        expense_date: expenseForm.expense_date || null
      });
      setProject((p2) => ({ ...p2, expenses: [data, ...p2.expenses || []] }));
      setExpenseForm({ type: "supplier_invoice", description: "", amount: "", expense_date: "" });
      setShowExpenseForm(false);
      refreshProfit();
    } catch {
    }
  };
  const removeExpense = async (expenseId) => {
    if (!confirm("Supprimer cette dépense ?")) return;
    await projects.deleteExpense(id2, expenseId);
    setProject((p2) => ({ ...p2, expenses: p2.expenses.filter((x2) => x2.id !== expenseId) }));
    refreshProfit();
  };
  const saveLaborRate = async () => {
    setSavingRate(true);
    try {
      await companies.update({ default_labor_cost_rate: Number(laborRate) || 0 });
      await refreshProfit();
    } catch {
    } finally {
      setSavingRate(false);
    }
  };
  const ensureQuote = async () => {
    if (quoteBuilderQuote) return quoteBuilderQuote;
    setQuoteSaving(true);
    try {
      const { data } = await quotes.create({ project_id: id2, title: `Soumission — ${(project == null ? void 0 : project.name) || "Projet"}` });
      setQuoteBuilderQuote(data);
      setQuoteBuilderItems([]);
      return data;
    } catch {
      return null;
    } finally {
      setQuoteSaving(false);
    }
  };
  const saveQuoteItems = async (items) => {
    const q2 = quoteBuilderQuote;
    if (!q2) return;
    setQuoteSaving(true);
    try {
      const { data } = await quotes.update(q2.id, { items });
      setQuoteBuilderQuote(data);
      setQuoteBuilderItems(data.items || items);
    } catch {
    } finally {
      setQuoteSaving(false);
    }
  };
  const scheduleQuoteSave = (items) => {
    clearTimeout(quoteTimer.current);
    quoteTimer.current = setTimeout(() => saveQuoteItems(items), 900);
  };
  const addQuoteItem = async (type) => {
    const q2 = await ensureQuote();
    if (!q2) return;
    const unitMap = { labor: "h", material: "un.", subcontractor: "forfait", other: "un." };
    const next = [...quoteBuilderItems, { type, name: "", qty: 1, unit: unitMap[type] || "un.", unit_price: 0 }];
    setQuoteBuilderItems(next);
    scheduleQuoteSave(next);
  };
  const updateQuoteItem = (i, patch) => {
    const next = quoteBuilderItems.map((it, idx) => idx === i ? { ...it, ...patch } : it);
    setQuoteBuilderItems(next);
    scheduleQuoteSave(next);
  };
  const removeQuoteItem = (i) => {
    const next = quoteBuilderItems.filter((_, idx) => idx !== i);
    setQuoteBuilderItems(next);
    scheduleQuoteSave(next);
  };
  const sendQuoteToClient = async () => {
    if (!quoteBuilderQuote) return;
    setQuoteSending(true);
    try {
      const { data } = await quotes.send(quoteBuilderQuote.id);
      setQuoteBuilderQuote(data);
      setProject((p2) => ({ ...p2, status: "prix_envoye", price_sent_at: data.updated_at }));
    } catch {
    } finally {
      setQuoteSending(false);
    }
  };
  const createRfq = async (e) => {
    e.preventDefault();
    try {
      const { data } = await rfqs.create({ project_id: id2, ...rfqForm });
      setProjectRfqs((r2) => [data, ...r2]);
      setShowRfqForm(false);
      setRfqForm({ title: "", specialty: "", description: "", deadline: "" });
    } catch {
    }
  };
  const inviteSubsToRfq = async (rfqId) => {
    if (!selectedSubIds.length) return;
    setInviting(true);
    try {
      await rfqs.invite(rfqId, selectedSubIds);
      const { data: updated } = await rfqs.byProject(id2);
      setProjectRfqs(updated || []);
      setShowInviteModal(null);
      setSelectedSubIds([]);
    } catch {
    } finally {
      setInviting(false);
    }
  };
  const generateContract = async () => {
    if (!quoteBuilderQuote) return;
    setGeneratingContract(true);
    try {
      const { data } = await quotes.generateContract(quoteBuilderQuote.id);
      setProjectContracts((c) => [data, ...c]);
    } catch {
    } finally {
      setGeneratingContract(false);
    }
  };
  const sendContract = async (contractId) => {
    setContractSendingId(contractId);
    try {
      const { data } = await contracts.send(contractId);
      setProjectContracts((cs) => cs.map((c) => c.id === contractId ? data : c));
    } catch {
    } finally {
      setContractSendingId(null);
    }
  };
  const deleteContract = async (contractId) => {
    if (!confirm("Supprimer ce contrat ?")) return;
    await contracts.delete(contractId);
    setProjectContracts((cs) => cs.filter((c) => c.id !== contractId));
  };
  if (loading) return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-gray-400 p-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 16, className: "animate-spin" }),
    " Chargement…"
  ] }) });
  if (!project) return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-8 text-red-500", children: "Projet non trouvé" }) });
  const pct = project.progress_pct || 0;
  const activeTs = timesheets$1.filter((t2) => !t2.clock_out);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Layout, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 max-w-5xl mx-auto", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "btn-ghost text-sm", onClick: () => navigate("/projets"), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { size: 14 }),
          " Projets"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            className: "btn-secondary text-xs",
            onClick: () => navigate(`/soumissions?new=1&project_id=${id2}&title=${encodeURIComponent("Avenant — " + project.name)}`),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(GitBranch, { size: 13 }),
              " Créer un avenant"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card mb-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-bold text-gray-900 mb-1", children: project.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-3 text-sm text-gray-400", children: [
              project.address && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { size: 13 }),
                project.address
              ] }),
              project.start_date && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { size: 13 }),
                new Date(project.start_date).toLocaleDateString("fr-CA"),
                project.end_date && ` → ${new Date(project.end_date).toLocaleDateString("fr-CA")}`
              ] }),
              project.contract_value && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { size: 13 }),
                Number(project.contract_value).toLocaleString("fr-CA"),
                "$"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right flex-shrink-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-3xl font-bold text-brand", children: [
              pct,
              "%"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-400", children: "Avancement" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 w-full h-2 bg-gray-100 rounded-full", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full rounded-full bg-brand transition-all", style: { width: `${pct}%` } }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-1 mb-4 bg-gray-100/70 rounded-2xl p-1", children: [
        { key: "apercu", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(LayoutDashboard, { size: 13 }), label: "Aperçu" },
        { key: "vente", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Briefcase, { size: 13 }), label: "Vente" },
        { key: "chantier", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Wrench, { size: 13 }), label: "Chantier" },
        { key: "docs", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(FolderClosed, { size: 13 }), label: "Docs" }
      ].map(({ key, icon, label }) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => setActiveTab(key),
          className: `flex items-center gap-1.5 flex-1 justify-center px-3 py-2 rounded-xl text-xs font-medium transition-all ${activeTab === key ? "bg-white text-brand shadow-sm" : "text-gray-500 hover:text-gray-700"}`,
          children: [
            icon,
            label
          ]
        },
        key
      )) }),
      activeTab === "apercu" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card mb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-semibold text-gray-900 text-sm", children: "Infos du projet" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "btn-ghost text-xs text-gray-400 hover:text-brand", onClick: () => setShowInfo(true), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { size: 12 }),
              " Modifier"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 p-3 rounded-xl bg-orange-50 border border-orange-100 flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { size: 16, className: "text-brand flex-shrink-0" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-gray-400 uppercase tracking-wide", children: "Termes de paiement" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-900", children: project.payment_terms || "À définir" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2.5 text-sm", children: [
            ["Chargé de projet", project.project_manager],
            ["Acheteur matériaux", project.materials_buyer],
            ["Approbateurs", (project.approvers || []).join(", ")],
            ["Responsable permis", project.permits_responsible],
            ["Permis requis", project.permits_required ? "Oui" : "Non"],
            ["Machines", (project.machines || []).join(", ")]
          ].map(([label, value]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-gray-400 uppercase tracking-wide", children: label }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-800 truncate", children: value || "—" })
          ] }, label)) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(FieldEstimation, { project, onUpdated: load }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-3 mb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card text-center py-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-gray-900", children: ((_a = project.phases) == null ? void 0 : _a.length) || 0 }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400 mt-0.5", children: "Phases" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card text-center py-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-green-500", children: activeTs.length }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400 mt-0.5", children: "Pointés maintenant" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card text-center py-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-bold text-gray-900", children: timesheets$1.length }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400 mt-0.5", children: "Total punchs" })
          ] })
        ] }),
        profit && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card mb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { size: 15, className: "text-brand" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-semibold text-gray-900 text-sm", children: "Rentabilité" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: [
            { label: "Théorique", d: profit.theoretical, sub: "Commande − coûts estimés (budgets + métiers)" },
            { label: "Réelle", d: profit.actual, sub: "Factures émises − punch & dépenses" }
          ].map(({ label, d, sub }) => {
            const pos = (d.margin || 0) >= 0;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-gray-100 p-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs font-medium text-gray-500", children: [
                  "Marge ",
                  label.toLowerCase()
                ] }),
                d.margin_pct != null && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `badge ${pos ? "badge-green" : "badge-red"}`, children: [
                  d.margin_pct,
                  "%"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-2xl font-bold mt-1 ${pos ? "text-green-600" : "text-red-500"}`, children: money(d.margin) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400 mb-2", children: sub }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pt-2 border-t border-gray-50 space-y-0.5 text-xs text-gray-500", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Revenus" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-gray-700", children: money(d.revenue) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Coûts" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-gray-700", children: money(d.cost) })
                ] })
              ] })
            ] }, label);
          }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 pt-3 border-t border-gray-50 flex flex-wrap items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-gray-500", children: "Taux de coût main d'œuvre interne (punch) :" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  className: "input py-1 text-xs",
                  style: { width: 80 },
                  type: "number",
                  min: "0",
                  step: "0.5",
                  value: laborRate,
                  onChange: (e) => setLaborRate(e.target.value),
                  placeholder: "0"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-gray-400", children: "$/h" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "btn-secondary text-xs py-1 px-2", onClick: saveLaborRate, disabled: savingRate, children: savingRate ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 12, className: "animate-spin" }) : "Enregistrer" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[11px] text-gray-400", children: [
              profit.actual.cost_breakdown.hours_logged || 0,
              "h pointées · main d'œuvre ",
              money(profit.actual.cost_breakdown.labor_punch),
              " · dépenses ",
              money(profit.actual.cost_breakdown.expenses)
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card mb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-semibold text-gray-900 text-sm", children: "Phases" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "btn-secondary text-xs py-1.5", onClick: () => setShowPhase(true), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 13 }),
              " Ajouter une phase"
            ] })
          ] }),
          (showPhase || editPhase) && /* @__PURE__ */ jsxRuntimeExports.jsx(
            PhaseModal,
            {
              projectId: id2,
              phase: editPhase,
              onClose: () => {
                setShowPhase(false);
                setEditPhase(null);
              },
              onSave: handlePhaseSave
            }
          ),
          ((_b = project.phases) == null ? void 0 : _b.length) > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(GanttChart, { phases: project.phases, projectStart: project.start_date, projectEnd: project.end_date }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 space-y-2", children: project.phases.map((ph2, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 py-2 border-b border-gray-50 last:border-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-2.5 h-2.5 rounded-full flex-shrink-0", style: { background: ph2.color || PHASE_COLORS[i % PHASE_COLORS.length] } }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-800", children: ph2.name }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `badge ${PS_BADGE[ph2.status]}`, children: PS_LABEL[ph2.status] })
                ] }),
                ph2.start_date && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-gray-400", children: [
                  new Date(ph2.start_date).toLocaleDateString("fr-CA"),
                  ph2.end_date && ` → ${new Date(ph2.end_date).toLocaleDateString("fr-CA")}`
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-24 h-1.5 bg-gray-100 rounded-full flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full rounded-full bg-brand", style: { width: `${ph2.progress_pct || 0}%` } }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-bold text-brand w-8 text-right", children: [
                  ph2.progress_pct || 0,
                  "%"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "btn-ghost p-1 text-gray-300 hover:text-blue-500", onClick: () => setEditPhase(ph2), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { size: 12 }) })
              ] })
            ] }, ph2.id)) })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-8", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-400 mb-3", children: "Aucune phase définie. Ajoutez des phases pour activer le Gantt." }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "btn-primary text-xs", onClick: () => setShowPhase(true), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 13 }),
              " Ajouter une phase"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card mb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(StickyNote, { size: 15, className: "text-brand" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-semibold text-gray-900 text-sm", children: "Notes de chantier" }),
            notesSaving && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-gray-400 ml-auto", children: "Enregistrement…" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "textarea",
            {
              className: "input resize-none",
              style: { minHeight: 96 },
              placeholder: "Ajoutez des notes, remarques ou observations sur ce projet…",
              value: notes,
              onChange: (e) => handleNotesChange(e.target.value)
            }
          )
        ] })
      ] }),
      activeTab === "vente" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card mb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { size: 15, className: "text-brand" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-semibold text-gray-900 text-sm", children: "Soumission détaillée" }),
              (quoteBuilderQuote == null ? void 0 : quoteBuilderQuote.status) === "sent" && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "badge badge-blue text-xs", children: "Envoyée" }),
              (quoteBuilderQuote == null ? void 0 : quoteBuilderQuote.status) === "signed" && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "badge badge-green text-xs", children: "Signée" })
            ] }),
            quoteSaving && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-gray-400 flex items-center gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 11, className: "animate-spin" }),
              " Enreg…"
            ] })
          ] }),
          ["material", "labor", "subcontractor", "other"].map((type) => {
            const typeLabels = { material: "Matériaux", labor: "Main d'œuvre", subcontractor: "Sous-traitants", other: "Autres" };
            const typeItems = quoteBuilderItems.map((it, i) => ({ ...it, _i: i })).filter((it) => it.type === type);
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold text-gray-400 uppercase tracking-wide", children: typeLabels[type] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "btn-ghost text-xs py-0.5 px-2 text-brand", onClick: () => addQuoteItem(type), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 11 }),
                  " Ligne"
                ] })
              ] }),
              typeItems.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-300 italic py-1", children: "Aucun poste" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-1.5", children: typeItems.map((it) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 py-1 border-b border-gray-50 last:border-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    className: "input py-1 text-xs flex-1 min-w-0",
                    placeholder: "Description",
                    value: it.name,
                    onChange: (e) => updateQuoteItem(it._i, { name: e.target.value })
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    className: "input py-1 text-xs w-14 text-right",
                    type: "number",
                    min: "0",
                    step: "0.01",
                    placeholder: "Qté",
                    value: it.qty,
                    onChange: (e) => updateQuoteItem(it._i, { qty: Number(e.target.value) })
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    className: "input py-1 text-xs w-14",
                    placeholder: "Unité",
                    value: it.unit,
                    onChange: (e) => updateQuoteItem(it._i, { unit: e.target.value })
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    className: "input py-1 text-xs w-20 text-right",
                    type: "number",
                    min: "0",
                    step: "0.01",
                    placeholder: "Prix unit.",
                    value: it.unit_price,
                    onChange: (e) => updateQuoteItem(it._i, { unit_price: Number(e.target.value) })
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-gray-600 font-medium w-20 text-right flex-shrink-0", children: [
                  ((Number(it.qty) || 1) * (Number(it.unit_price) || 0)).toLocaleString("fr-CA", { minimumFractionDigits: 2 }),
                  "$"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "btn-ghost p-1 text-gray-300 hover:text-red-500 flex-shrink-0", onClick: () => removeQuoteItem(it._i), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 12 }) })
              ] }, it._i)) })
            ] }, type);
          }),
          quoteBuilderItems.length > 0 && (() => {
            const subtotal = quoteBuilderItems.reduce((s, it) => s + (Number(it.qty) || 1) * (Number(it.unit_price) || 0), 0);
            const tps = subtotal * 0.05;
            const tvq = subtotal * 0.09975;
            const total = subtotal + tps + tvq;
            const fmt = (v2) => v2.toLocaleString("fr-CA", { minimumFractionDigits: 2 }) + " $";
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 pt-3 border-t border-gray-100 space-y-1 text-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-gray-500", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Sous-total" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: fmt(subtotal) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-gray-400 text-xs", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "TPS (5%)" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: fmt(tps) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-gray-400 text-xs", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "TVQ (9,975%)" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: fmt(tvq) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between font-bold text-gray-900 text-base pt-1 border-t border-gray-100", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Total" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-brand", children: fmt(total) })
              ] })
            ] });
          })(),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex gap-2 flex-wrap", children: [
            quoteBuilderItems.length > 0 && (quoteBuilderQuote == null ? void 0 : quoteBuilderQuote.status) !== "sent" && (quoteBuilderQuote == null ? void 0 : quoteBuilderQuote.status) !== "signed" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                className: "btn-primary text-xs py-2",
                onClick: sendQuoteToClient,
                disabled: quoteSending || !quoteBuilderQuote,
                children: [
                  quoteSending ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 13, className: "animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { size: 13 }),
                  "Envoyer au client"
                ]
              }
            ),
            quoteBuilderQuote && /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "btn-secondary text-xs py-2", onClick: () => setPreview({ url: pdf.quoteUrl(quoteBuilderQuote.id), title: "Soumission" }), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { size: 13 }),
              " Aperçu PDF"
            ] }),
            (quoteBuilderQuote == null ? void 0 : quoteBuilderQuote.status) === "sent" && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-blue-500 flex items-center gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { size: 12 }),
              " Soumission envoyée au client."
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card mb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { size: 15, className: "text-brand" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-semibold text-gray-900 text-sm", children: "Demandes de prix (sous-traitants)" }),
              projectRfqs.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "bg-gray-100 text-gray-500 text-xs rounded-full px-1.5 py-0.5", children: projectRfqs.length })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "btn-secondary text-xs py-1.5", onClick: () => setShowRfqForm((v2) => !v2), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 13 }),
              " Créer un RFQ"
            ] })
          ] }),
          showRfqForm && /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: createRfq, className: "bg-gray-50 rounded-xl p-3 mb-3 space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Titre *" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", value: rfqForm.title, onChange: (e) => setRfqForm((f2) => ({ ...f2, title: e.target.value })), placeholder: "Ex: Demande de prix — Électricité", required: true })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Spécialité" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", value: rfqForm.specialty, onChange: (e) => setRfqForm((f2) => ({ ...f2, specialty: e.target.value })), placeholder: "Électricité, Plomberie…" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Description" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { className: "input resize-none", rows: 2, value: rfqForm.description, onChange: (e) => setRfqForm((f2) => ({ ...f2, description: e.target.value })), placeholder: "Portée des travaux…" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Date limite" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", type: "date", value: rfqForm.deadline, onChange: (e) => setRfqForm((f2) => ({ ...f2, deadline: e.target.value })) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-end gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn-secondary flex-1 text-xs", onClick: () => setShowRfqForm(false), children: "Annuler" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "submit", className: "btn-primary flex-1 text-xs", children: "Créer" })
              ] })
            ] })
          ] }),
          projectRfqs.length === 0 && !showRfqForm ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { size: 26, className: "text-gray-200 mx-auto mb-2" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-400", children: "Créez des demandes de prix aux sous-traitants directement depuis ce projet." })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: projectRfqs.map((rfq) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 py-2 border-b border-gray-50 last:border-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-800 truncate", children: rfq.title }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mt-0.5", children: [
                rfq.specialty && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "badge badge-gray text-xs", children: rfq.specialty }),
                rfq.deadline && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-gray-400", children: [
                  "Échéance: ",
                  new Date(rfq.deadline).toLocaleDateString("fr-CA")
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-gray-400", children: [
                  rfq.responses_count || 0,
                  " invité(s)"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                className: "btn-secondary text-xs py-1",
                onClick: () => {
                  setShowInviteModal(rfq.id);
                  setSelectedSubIds([]);
                },
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(UserPlus, { size: 12 }),
                  " Inviter"
                ]
              }
            )
          ] }, rfq.id)) })
        ] }),
        showInviteModal && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card w-full max-w-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-gray-900 mb-3", children: "Inviter des sous-traitants" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5 max-h-48 overflow-y-auto mb-4", children: [
            subs.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-400", children: "Aucun sous-traitant enregistré. Allez dans Sous-traitants pour en ajouter." }),
            subs.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50 rounded-lg px-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "checkbox",
                  checked: selectedSubIds.includes(s.id),
                  onChange: () => setSelectedSubIds((ids) => ids.includes(s.id) ? ids.filter((x2) => x2 !== s.id) : [...ids, s.id])
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm text-gray-700", children: [
                s.name,
                s.company_name ? ` — ${s.company_name}` : ""
              ] })
            ] }, s.id))
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "btn-secondary flex-1 text-xs", onClick: () => setShowInviteModal(null), children: "Annuler" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                className: "btn-primary flex-1 text-xs",
                onClick: () => inviteSubsToRfq(showInviteModal),
                disabled: inviting || !selectedSubIds.length,
                children: [
                  inviting ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 12, className: "animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { size: 12 }),
                  "Inviter (",
                  selectedSubIds.length,
                  ")"
                ]
              }
            )
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card mb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(FileSignature, { size: 15, className: "text-brand" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-semibold text-gray-900 text-sm", children: "Contrat" }),
              projectContracts.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "bg-gray-100 text-gray-500 text-xs rounded-full px-1.5 py-0.5", children: projectContracts.length })
            ] }),
            quoteBuilderQuote && projectContracts.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "btn-secondary text-xs py-1.5", onClick: generateContract, disabled: generatingContract, children: [
              generatingContract ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 13, className: "animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(FileSignature, { size: 13 }),
              "Générer depuis la soumission"
            ] })
          ] }),
          projectContracts.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(FileSignature, { size: 28, className: "text-gray-200 mx-auto mb-2" }),
            quoteBuilderQuote ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-400", children: "Génère un contrat depuis la soumission détaillée." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-400", children: "Crée d'abord une soumission dans cet onglet pour générer un contrat." })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: projectContracts.map((c) => {
            const isSending = contractSendingId === c.id;
            const statusColor = { draft: "badge-gray", sent: "badge-blue", signed: "badge-green", cancelled: "badge-gray" };
            const statusLabel = { draft: "Brouillon", sent: "Envoyé", signed: "Signé", cancelled: "Annulé" };
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-gray-100 p-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-800 truncate", children: c.title }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400", children: new Date(c.created_at).toLocaleDateString("fr-CA") })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `badge ${statusColor[c.status] || "badge-gray"} text-xs`, children: statusLabel[c.status] || c.status })
              ] }),
              c.status === "signed" && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-green-600 mb-2 flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { size: 11 }),
                " Signé par ",
                c.signer_name,
                " le ",
                new Date(c.signed_at).toLocaleDateString("fr-CA")
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 flex-wrap", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "btn-secondary text-xs py-1", onClick: () => setShowContractContent(showContractContent === c.id ? null : c.id), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { size: 11 }),
                  " ",
                  showContractContent === c.id ? "Masquer" : "Voir le contrat"
                ] }),
                c.status === "draft" && /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "btn-primary text-xs py-1", onClick: () => sendContract(c.id), disabled: isSending, children: [
                  isSending ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 11, className: "animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { size: 11 }),
                  " Envoyer (stub)"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "btn-ghost text-xs py-1 text-gray-300 hover:text-red-500", onClick: () => deleteContract(c.id), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 11 }) })
              ] }),
              c.status === "draft" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-start gap-2 p-2 rounded-lg bg-amber-50 border border-amber-100", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { size: 12, className: "text-amber-500 flex-shrink-0 mt-0.5" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-amber-700", children: "Signature électronique désactivée — configurez une clé dans Paramètres › Intégrations pour activer DocuSign / Notarize." })
              ] }),
              showContractContent === c.id && /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "mt-3 text-xs text-gray-600 bg-gray-50 rounded-xl p-3 overflow-auto whitespace-pre-wrap font-mono", style: { maxHeight: 320 }, children: c.content })
            ] }, c.id);
          }) })
        ] }),
        projectInvoices.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card mb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Receipt, { size: 15, className: "text-brand" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "font-semibold text-gray-900 text-sm", children: [
                "Factures (",
                projectInvoices.length,
                ")"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "btn-ghost text-xs py-1 px-2", onClick: () => navigate("/factures"), children: "Voir tout" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: projectInvoices.map((inv) => {
            const SB2 = { draft: "badge-gray", sent: "badge-blue", viewed: "badge-yellow", partial: "badge-orange", paid: "badge-green", overdue: "badge-red", cancelled: "badge-gray" };
            const SL2 = { draft: "Brouillon", sent: "Envoyée", viewed: "Vue", partial: "Partielle", paid: "Payée", overdue: "En retard", cancelled: "Annulée" };
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { size: 13, className: "text-gray-300 flex-shrink-0" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 min-w-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-800 truncate", children: inv.title || `Facture ${inv.number}` }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `badge ${SB2[inv.status] || "badge-gray"} text-xs`, children: SL2[inv.status] || inv.status }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-semibold text-gray-700 flex-shrink-0", children: [
                Number(inv.total || 0).toLocaleString("fr-CA"),
                "$"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "btn-ghost p-1 text-gray-300 hover:text-brand", title: "Prévisualiser", onClick: () => setPreview({ url: pdf.invoiceUrl(inv.id), title: inv.title || `Facture ${inv.number}` }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { size: 13 }) })
            ] }, inv.id);
          }) })
        ] }),
        projectQuotes.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card mb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { size: 15, className: "text-brand" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "font-semibold text-gray-900 text-sm", children: [
                "Soumissions & Avenants (",
                projectQuotes.length,
                ")"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "btn-secondary text-xs py-1 px-2", onClick: () => navigate(`/soumissions?new=1&project_id=${id2}&title=${encodeURIComponent("Avenant — " + project.name)}`), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 12 }),
              " Avenant"
            ] })
          ] }),
          (() => {
            const QSB = { draft: "badge-gray", sent: "badge-blue", viewed: "badge-yellow", signed: "badge-green", expired: "badge-gray", rejected: "badge-red", converted: "badge-orange" };
            const QSL = { draft: "Brouillon", sent: "Envoyée", viewed: "Vue", signed: "Signée", expired: "Expirée", rejected: "Refusée", converted: "Convertie" };
            return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: projectQuotes.map((q2) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 min-w-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-800 truncate", children: q2.title || "Soumission" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `badge ${QSB[q2.status] || "badge-gray"} text-xs`, children: QSL[q2.status] || q2.status }),
              q2.total > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-semibold text-gray-700 flex-shrink-0", children: [
                Number(q2.total).toLocaleString("fr-CA"),
                "$"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "btn-ghost p-1 text-gray-300 hover:text-brand", title: "Prévisualiser", onClick: () => setPreview({ url: pdf.quoteUrl(q2.id), title: q2.title || "Soumission" }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { size: 13 }) })
            ] }, q2.id)) });
          })()
        ] })
      ] }),
      activeTab === "chantier" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card mb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(HardHat, { size: 15, className: "text-brand" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-semibold text-gray-900 text-sm", children: "Corps de métiers" }),
              ((_c = project.trades) == null ? void 0 : _c.length) > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "bg-gray-100 text-gray-500 text-xs rounded-full px-1.5 py-0.5", children: project.trades.length })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "btn-secondary text-xs py-1.5", onClick: () => setShowTradeForm((v2) => !v2), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 13 }),
              " Ajouter"
            ] })
          ] }),
          showTradeForm && /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: addTrade, className: "bg-gray-50 rounded-xl p-3 mb-3 grid grid-cols-1 sm:grid-cols-3 gap-2 items-end", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sm:col-span-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Métier *" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", value: tradeForm.trade, onChange: (e) => setTradeForm((f2) => ({ ...f2, trade: e.target.value })), placeholder: "Ex: Électricité", required: true })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Coût estimé ($)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", type: "number", step: "0.01", value: tradeForm.estimated_cost, onChange: (e) => setTradeForm((f2) => ({ ...f2, estimated_cost: e.target.value })), placeholder: "0" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "input flex-1", value: tradeForm.chosen_subcontractor_id, onChange: (e) => setTradeForm((f2) => ({ ...f2, chosen_subcontractor_id: e.target.value })), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "Sous-traitant…" }),
                subs.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: s.id, children: [
                  s.name,
                  s.company_name ? ` (${s.company_name})` : ""
                ] }, s.id))
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "submit", className: "btn-primary text-xs px-3", children: "OK" })
            ] })
          ] }),
          ((_d = project.trades) == null ? void 0 : _d.length) > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: project.trades.map((t2) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2 py-2 border-b border-gray-50 last:border-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-gray-800 flex-1 min-w-[120px]", children: t2.trade }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "select",
              {
                className: "input py-1 text-xs",
                style: { width: 130 },
                value: t2.status,
                onChange: (e) => patchTrade(t2.id, { status: e.target.value }),
                children: Object.entries(TRADE_STATUS).map(([k2, v2]) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: k2, children: v2.label }, k2))
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "select",
              {
                className: "input py-1 text-xs",
                style: { width: 170 },
                value: t2.chosen_subcontractor_id || "",
                onChange: (e) => patchTrade(t2.id, { chosen_subcontractor_id: e.target.value || null }),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "— Sous-traitant choisi —" }),
                  subs.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: s.id, children: [
                    s.name,
                    s.company_name ? ` (${s.company_name})` : ""
                  ] }, s.id))
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-gray-500 w-20 text-right", children: t2.estimated_cost != null ? money(t2.estimated_cost) : "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "btn-ghost p-1 text-gray-300 hover:text-red-500", onClick: () => removeTrade(t2.id), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 13 }) })
          ] }, t2.id)) }) : !showTradeForm && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(HardHat, { size: 26, className: "text-gray-200 mx-auto mb-2" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-400", children: "Déclarez les corps de métiers requis et assignez le sous-traitant choisi pour chacun." })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card mb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { size: 15, className: "text-brand" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-semibold text-gray-900 text-sm", children: "Dépenses & factures fournisseurs" }),
              ((_e = project.expenses) == null ? void 0 : _e.length) > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "bg-gray-100 text-gray-500 text-xs rounded-full px-1.5 py-0.5", children: project.expenses.length })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "btn-secondary text-xs py-1.5", onClick: () => setShowExpenseForm((v2) => !v2), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 13 }),
              " Ajouter"
            ] })
          ] }),
          showExpenseForm && /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: addExpense, className: "bg-gray-50 rounded-xl p-3 mb-3 grid grid-cols-2 sm:grid-cols-4 gap-2 items-end", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Type" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("select", { className: "input", value: expenseForm.type, onChange: (e) => setExpenseForm((f2) => ({ ...f2, type: e.target.value })), children: Object.entries(EXPENSE_TYPES).map(([k2, v2]) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: k2, children: v2 }, k2)) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Montant ($) *" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", type: "number", step: "0.01", value: expenseForm.amount, onChange: (e) => setExpenseForm((f2) => ({ ...f2, amount: e.target.value })), required: true })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Date" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", type: "date", value: expenseForm.expense_date, onChange: (e) => setExpenseForm((f2) => ({ ...f2, expense_date: e.target.value })) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input flex-1", value: expenseForm.description, onChange: (e) => setExpenseForm((f2) => ({ ...f2, description: e.target.value })), placeholder: "Description" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "submit", className: "btn-primary text-xs px-3", children: "OK" })
            ] })
          ] }),
          ((_f = project.expenses) == null ? void 0 : _f.length) > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-1.5", children: project.expenses.map((x2) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "badge badge-gray text-xs", children: EXPENSE_TYPES[x2.type] || x2.type }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-gray-700 flex-1 min-w-0 truncate", children: x2.description || x2.subcontractor_name || "—" }),
            x2.expense_date && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-gray-400", children: new Date(x2.expense_date).toLocaleDateString("fr-CA") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-semibold text-gray-700", children: money(x2.amount) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "btn-ghost p-1 text-gray-300 hover:text-red-500", onClick: () => removeExpense(x2.id), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 13 }) })
          ] }, x2.id)) }) : !showExpenseForm && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-400 text-center py-4", children: "Aucune dépense. Ajoutez factures fournisseurs et dépenses pour calculer la rentabilité réelle." })
        ] })
      ] }),
      activeTab === "docs" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card mb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(FolderOpen, { size: 15, className: "text-brand" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-semibold text-gray-900 text-sm", children: "Documents" }),
            ((_g = project.documents) == null ? void 0 : _g.length) > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "bg-gray-100 text-gray-500 text-xs rounded-full px-1.5 py-0.5", children: project.documents.length })
          ] }),
          ((_h = project.documents) == null ? void 0 : _h.length) > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: project.documents.map((d) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { size: 14, className: "text-gray-300 flex-shrink-0" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-800 truncate", children: d.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-gray-400", children: [
                d.type,
                d.created_at ? ` · ${new Date(d.created_at).toLocaleDateString("fr-CA")}` : ""
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "btn-ghost text-xs py-1 px-2", onClick: () => setPreview({ url: d.file_url, mime_type: d.mime_type, title: d.name }), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { size: 13 }),
              " Prévisualiser"
            ] })
          ] }, d.id)) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-400 text-center py-4", children: "Aucun document téléversé sur ce projet." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card mb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between mb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { size: 15, className: "text-brand" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-semibold text-gray-900 text-sm", children: "Quittance finale" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-gray-400", children: "— Certificat de satisfaction client (Québec)" })
          ] }) }),
          !quittance && !showQuittanceForm && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { size: 28, className: "text-gray-200 mx-auto mb-3" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-400 mb-4", children: "Envoyez une quittance à votre client pour confirmer la fin des travaux et obtenir sa signature électronique." }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                className: "btn-primary text-xs",
                onClick: () => {
                  setQuittanceForm({ client_name: project.client_name || "", client_email: project.client_email || "", project_description: project.name || "", amount_paid: project.contract_value || "", notes: "" });
                  setShowQuittanceForm(true);
                },
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { size: 13 }),
                  " Générer une quittance"
                ]
              }
            )
          ] }),
          showQuittanceForm && /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: createQuittance, className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Nom du client *" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", value: quittanceForm.client_name, onChange: (e) => setQuittanceForm((f2) => ({ ...f2, client_name: e.target.value })), required: true })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Courriel client" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", type: "email", value: quittanceForm.client_email, onChange: (e) => setQuittanceForm((f2) => ({ ...f2, client_email: e.target.value })) })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Description des travaux" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { className: "input resize-none", rows: 2, value: quittanceForm.project_description, onChange: (e) => setQuittanceForm((f2) => ({ ...f2, project_description: e.target.value })) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Montant payé ($)" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", type: "number", value: quittanceForm.amount_paid, onChange: (e) => setQuittanceForm((f2) => ({ ...f2, amount_paid: e.target.value })) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Note (optionnel)" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", value: quittanceForm.notes, onChange: (e) => setQuittanceForm((f2) => ({ ...f2, notes: e.target.value })) })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn-secondary flex-1", onClick: () => setShowQuittanceForm(false), children: "Annuler" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "submit", className: "btn-primary flex-1", disabled: savingQuittance, children: [
                savingQuittance && /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 13, className: "animate-spin" }),
                " Créer la quittance"
              ] })
            ] })
          ] }),
          quittance && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `w-2 h-2 rounded-full flex-shrink-0 ${quittance.status === "signed" ? "bg-green-500" : quittance.status === "sent" ? "bg-blue-400" : "bg-gray-300"}` }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-800", children: quittance.client_name }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400", children: quittance.status === "signed" ? `✓ Signée le ${new Date(quittance.signed_at).toLocaleDateString("fr-CA")}` : quittance.status === "sent" ? "Envoyée — en attente de signature" : "Brouillon — non envoyée" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `badge ${quittance.status === "signed" ? "badge-green" : quittance.status === "sent" ? "badge-blue" : "badge-gray"}`, children: quittance.status === "signed" ? "Signée" : quittance.status === "sent" ? "Envoyée" : "Brouillon" })
            ] }),
            quittance.status !== "signed" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 flex-wrap", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  className: "btn-secondary text-xs py-1.5",
                  onClick: () => {
                    const url = `${FRONTEND_URL}/quittance/${quittance.public_token}`;
                    navigator.clipboard.writeText(url);
                    alert("Lien copié!");
                  },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Link2, { size: 12 }),
                    " Copier le lien client"
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "a",
                {
                  href: `${FRONTEND_URL}/quittance/${quittance.public_token}`,
                  target: "_blank",
                  rel: "noopener noreferrer",
                  className: "btn-ghost text-xs py-1.5",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { size: 12 }),
                    " Prévisualiser"
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "a",
                {
                  href: `https://wa.me/?text=${encodeURIComponent(`Bonjour ${quittance.client_name}, voici votre quittance de fin de travaux à signer : ${FRONTEND_URL}/quittance/${quittance.public_token}`)}`,
                  target: "_blank",
                  rel: "noreferrer",
                  className: "btn-ghost text-xs py-1.5 text-green-600 hover:text-green-700",
                  title: "Envoyer la quittance par WhatsApp",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircle, { size: 12 }),
                    " WhatsApp"
                  ]
                }
              )
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Globe, { size: 15, className: "text-brand" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-semibold text-gray-900 text-sm", children: "Portail client" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400 mb-4", children: "Partagez ce lien avec votre client pour qu'il suive l'avancement du chantier en temps réel." }),
          project.portal_token ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-gray-50 rounded-xl px-3 py-2 flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Globe, { size: 13, className: "text-gray-300 flex-shrink-0" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-gray-500 truncate flex-1 font-mono", children: [
                FRONTEND_URL,
                "/portal/",
                project.portal_token
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 flex-wrap", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  className: "btn-primary text-xs py-1.5 flex-1",
                  onClick: copyPortalLink,
                  children: [
                    portalCopied ? /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { size: 13, className: "text-green-300" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Link2, { size: 13 }),
                    portalCopied ? "Copié !" : "Copier le lien"
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "a",
                {
                  href: `${FRONTEND_URL}/portal/${project.portal_token}`,
                  target: "_blank",
                  rel: "noopener noreferrer",
                  className: "btn-secondary text-xs py-1.5",
                  title: "Aperçu du portail",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { size: 13 }),
                    " Aperçu"
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "a",
                {
                  href: `https://wa.me/?text=${encodeURIComponent(`Bonjour, voici le lien pour suivre l'avancement de vos travaux en temps réel : ${FRONTEND_URL}/portal/${project.portal_token}`)}`,
                  target: "_blank",
                  rel: "noopener noreferrer",
                  className: "btn-secondary text-xs py-1.5 text-green-600",
                  title: "Envoyer par WhatsApp",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircle, { size: 13 })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  className: "btn-ghost text-xs py-1.5 text-gray-400",
                  onClick: resetPortalToken,
                  disabled: resettingPortal,
                  title: "Générer un nouveau lien (invalide l'ancien)",
                  children: resettingPortal ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 13, className: "animate-spin" }) : "↻"
                }
              )
            ] })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Globe, { size: 28, className: "text-gray-200 mx-auto mb-3" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-400 mb-4", children: "Le lien portail sera disponible au prochain rechargement (migration DB en cours)." })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(FileEdit, { size: 15, className: "text-brand" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-semibold text-gray-900 text-sm", children: "Demandes de modification" }),
              changeOrdersList.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "bg-gray-100 text-gray-500 text-xs rounded-full px-1.5 py-0.5", children: changeOrdersList.length })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "btn-secondary text-xs py-1.5", onClick: () => setShowCOForm((v2) => !v2), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 13 }),
              " Nouvelle"
            ] })
          ] }),
          showCOForm && /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: createChangeOrder, className: "bg-gray-50 rounded-xl p-4 mb-4 space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Titre *" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", value: coForm.title, onChange: (e) => setCoForm((f2) => ({ ...f2, title: e.target.value })), required: true, placeholder: "Ex: Ajout d'une salle de bain" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Description" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { className: "input resize-none", rows: 2, value: coForm.description, onChange: (e) => setCoForm((f2) => ({ ...f2, description: e.target.value })), placeholder: "Détails des travaux supplémentaires…" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Montant ($)" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", type: "number", step: "0.01", value: coForm.amount, onChange: (e) => setCoForm((f2) => ({ ...f2, amount: e.target.value })), placeholder: "0" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Note interne" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", value: coForm.notes, onChange: (e) => setCoForm((f2) => ({ ...f2, notes: e.target.value })) })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn-secondary flex-1 text-sm", onClick: () => setShowCOForm(false), children: "Annuler" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "submit", className: "btn-primary flex-1 text-sm", disabled: savingCO, children: [
                savingCO && /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 13, className: "animate-spin" }),
                " Créer"
              ] })
            ] })
          ] }),
          changeOrdersList.length === 0 && !showCOForm ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(FileEdit, { size: 28, className: "text-gray-200 mx-auto mb-2" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-400", children: "Aucune demande de modification. Créez-en une pour tout changement de portée de projet." })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: changeOrdersList.map((co) => {
            const statusColor = co.status === "approved" ? "text-green-600" : co.status === "rejected" ? "text-red-500" : co.status === "pending_approval" ? "text-blue-500" : "text-gray-400";
            const statusLabel = co.status === "approved" ? "Approuvée" : co.status === "rejected" ? "Refusée" : co.status === "pending_approval" ? "Envoyée" : "Brouillon";
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `w-2 h-2 rounded-full flex-shrink-0 mt-0.5 ${co.status === "approved" ? "bg-green-500" : co.status === "rejected" ? "bg-red-400" : co.status === "sent" ? "bg-blue-400" : "bg-gray-300"}` }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-800 truncate", children: co.title }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mt-0.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-xs font-medium ${statusColor}`, children: statusLabel }),
                  co.amount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-gray-400", children: [
                    "+",
                    Number(co.amount).toLocaleString("fr-CA"),
                    "$"
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1 flex-shrink-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    className: "p-1.5 rounded-lg text-gray-400 hover:text-brand hover:bg-white transition-colors",
                    title: copiedCO === co.id ? "Copié!" : "Copier le lien client",
                    onClick: () => copyCOLink(co),
                    children: copiedCO === co.id ? /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCheck, { size: 13, className: "text-green-500" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { size: 13 })
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "a",
                  {
                    href: `https://wa.me/?text=${encodeURIComponent(`Bonjour, voici une demande de modification à approuver : ${FRONTEND_URL}/modification/${co.public_token}`)}`,
                    target: "_blank",
                    rel: "noopener noreferrer",
                    className: "p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-white transition-colors",
                    title: "Envoyer par WhatsApp",
                    onClick: async () => {
                      if (co.status === "draft") await changeOrders.update(co.id, { status: "pending_approval" }).then(() => setChangeOrdersList((l2) => l2.map((c) => c.id === co.id ? { ...c, status: "pending_approval" } : c)));
                    },
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircle, { size: 13 })
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "a",
                  {
                    href: `${FRONTEND_URL}/modification/${co.public_token}`,
                    target: "_blank",
                    rel: "noopener noreferrer",
                    className: "p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-white transition-colors",
                    title: "Aperçu",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { size: 13 })
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    className: "p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-white transition-colors",
                    onClick: () => deleteCO(co.id),
                    title: "Supprimer",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 13 })
                  }
                )
              ] })
            ] }, co.id);
          }) })
        ] }),
        portalMessages.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card mt-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircle, { size: 15, className: "text-brand" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-semibold text-gray-900 text-sm", children: "Messages du portail client" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "bg-brand/10 text-brand text-xs rounded-full px-1.5 py-0.5", children: portalMessages.length })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: portalMessages.map((msg) => {
            var _a2;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold text-gray-500", children: (((_a2 = msg.author_name) == null ? void 0 : _a2[0]) || "C").toUpperCase() }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 bg-gray-50 rounded-xl px-3 py-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold text-gray-700", children: msg.author_name }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-gray-400", children: new Date(msg.created_at).toLocaleDateString("fr-CA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 leading-snug", children: msg.content })
              ] })
            ] }, msg.id);
          }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card mt-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(QrCode, { size: 15, className: "text-brand" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-semibold text-gray-900 text-sm", children: "Punch" })
            ] }),
            !qrData && /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "btn-secondary text-xs py-1.5", onClick: generateQR, disabled: genQr, children: [
              genQr ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 13, className: "animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 13 }),
              " Générer QR"
            ] })
          ] }),
          qrData ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: qrData.qr_image, alt: "QR", className: "w-28 h-28 border border-gray-200 rounded-xl flex-shrink-0" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-900 mb-1", children: "Affichez ce QR à l'entrée du chantier" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400 mb-3", children: "Les travailleurs scannent pour pointer entrée et sortie." }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "btn-primary text-xs py-1.5", onClick: printQR, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(QrCode, { size: 13 }),
                " Imprimer le QR"
              ] })
            ] })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-400", children: "Générez un QR unique pour que les travailleurs puissent pointer sur ce chantier." }),
          timesheets$1.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 pt-3 border-t border-gray-100", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-gray-500 mb-2", children: "Punchs récents" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-1.5", children: timesheets$1.slice(0, 5).map((ts) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 text-xs text-gray-600", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { size: 12, className: ts.clock_out ? "text-gray-300" : "text-green-500" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: ts.user_name || ts.sub_name || ts.worker_name || "Inconnu" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-400", children: ts.clock_in && new Date(ts.clock_in).toLocaleString("fr-CA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) }),
              ts.hours_total && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-auto font-medium text-gray-700", children: [
                ts.hours_total,
                "h"
              ] })
            ] }, ts.id)) })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(DocPreview, { doc: preview, onClose: () => setPreview(null) }),
    showInfo && /* @__PURE__ */ jsxRuntimeExports.jsx(
      InfoModal,
      {
        project,
        onClose: () => setShowInfo(false),
        onSave: (data) => {
          setProject((p2) => ({ ...p2, ...data }));
          setShowInfo(false);
        }
      }
    )
  ] });
}
const COLS = [
  { key: "new", label: "Nouveau", color: "#3b82f6" },
  { key: "contacted", label: "Contacté", color: "#f59e0b" },
  { key: "quote_sent", label: "Soumission envoyée", color: "#F26522" },
  { key: "won", label: "Gagné", color: "#22c55e" },
  { key: "lost", label: "Perdu", color: "#9ca3af" }
];
const WL = { residential: "Résidentiel", commercial: "Commercial", industrial: "Industriel", renovation: "Rénovation", roofing: "Toiture", concrete: "Béton", other: "Autre" };
const EMPTY_FORM = { title: "", contact_name: "", contact_phone: "", contact_email: "", contact_address: "", source: "manual", type_of_work: "other", budget_min: "", budget_max: "", description: "" };
function LeadModal({ lead, onClose, onSave }) {
  const [form, setForm] = reactExports.useState(lead ? {
    title: lead.title || "",
    contact_name: lead.contact_name || "",
    contact_phone: lead.contact_phone || "",
    contact_email: lead.contact_email || "",
    contact_address: lead.city || "",
    source: lead.source || "manual",
    type_of_work: lead.type_of_work || "other",
    budget_min: lead.budget_min || "",
    budget_max: lead.budget_max || "",
    description: lead.description || ""
  } : { ...EMPTY_FORM });
  const [saving, setSaving] = reactExports.useState(false);
  const f2 = (k2) => (e) => setForm((p2) => ({ ...p2, [k2]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, budget_min: form.budget_min || null, budget_max: form.budget_max || null };
      const { data } = lead ? await leads.update(lead.id, payload) : await leads.create(payload);
      onSave(data, !!lead);
    } catch {
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    SlideOver,
    {
      title: lead ? "Modifier le lead" : "Nouveau lead",
      subtitle: lead ? form.title : "Ajouter un client potentiel",
      width: "max-w-lg",
      onClose,
      footer: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn-secondary flex-1", onClick: onClose, children: "Annuler" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "submit", form: "lead-form", className: "btn-primary flex-1", disabled: saving, children: [
          saving && /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 14, className: "animate-spin" }),
          " ",
          lead ? "Enregistrer" : "Créer"
        ] })
      ] }),
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { id: "lead-form", onSubmit: submit, className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Titre du projet *" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", value: form.title, onChange: f2("title"), required: true })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Nom du client" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", value: form.contact_name, onChange: f2("contact_name") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Téléphone" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", type: "tel", value: form.contact_phone, onChange: f2("contact_phone") })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Courriel" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", type: "email", value: form.contact_email, onChange: f2("contact_email") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Ville" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", value: form.contact_address, onChange: f2("contact_address") })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Budget min ($)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", type: "number", value: form.budget_min, onChange: f2("budget_min") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Budget max ($)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", type: "number", value: form.budget_max, onChange: f2("budget_max") })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Type de travail" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("select", { className: "input", value: form.type_of_work, onChange: f2("type_of_work"), children: Object.entries(WL).map(([k2, v2]) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: k2, children: v2 }, k2)) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Source" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "input", value: form.source, onChange: f2("source"), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "manual", children: "Manuel" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "referral", children: "Référence" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "facebook_ads", children: "Facebook Ads" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "google_lsa", children: "Google LSA" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "soumissions_reno", children: "SoumissionsRéno" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "whatsapp", children: "WhatsApp" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Notes" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { className: "input", rows: 2, value: form.description, onChange: f2("description") })
        ] })
      ] })
    }
  );
}
function QuoteModal({ lead, format, onClose, onDone }) {
  const [form, setForm] = reactExports.useState({ title: (lead == null ? void 0 : lead.title) || "", budget_min: "", budget_max: "", items: [{ name: "", qty: 1, unit_price: "" }] });
  const [saving, setSaving] = reactExports.useState(false);
  const isField = format === "field_estimate";
  const setItem = (i, k2, v2) => setForm((p2) => ({ ...p2, items: p2.items.map((it, idx) => idx === i ? { ...it, [k2]: v2 } : it) }));
  const addItem = () => setForm((p2) => ({ ...p2, items: [...p2.items, { name: "", qty: 1, unit_price: "" }] }));
  const removeItem = (i) => setForm((p2) => ({ ...p2, items: p2.items.filter((_, idx) => idx !== i) }));
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await quotes.create({
        lead_id: lead.id,
        title: form.title,
        format,
        budget_min: form.budget_min || null,
        budget_max: form.budget_max || null,
        items: isField ? [] : form.items.map((it) => ({ ...it, qty: Number(it.qty) || 1, unit_price: Number(it.unit_price) || 0 }))
      });
      await leads.update(lead.id, { status: "quote_sent" });
      onDone();
    } catch {
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card w-full max-w-lg max-h-[90vh] overflow-y-auto", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-semibold text-gray-900 mb-1", children: isField ? "Formulaire terrain" : "Devis détaillé" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400 mb-4", children: lead.title }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: submit, className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Titre" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", value: form.title, onChange: (e) => setForm((p2) => ({ ...p2, title: e.target.value })), required: true })
      ] }),
      isField ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Budget min ($)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", type: "number", value: form.budget_min, onChange: (e) => setForm((p2) => ({ ...p2, budget_min: e.target.value })) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Budget max ($)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", type: "number", value: form.budget_max, onChange: (e) => setForm((p2) => ({ ...p2, budget_max: e.target.value })) })
        ] })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between mb-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label mb-0", children: "Lignes" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn-ghost text-xs py-0.5 px-2", onClick: addItem, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 12 }) })
        ] }),
        form.items.map((it, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-12 gap-1.5 mb-1.5 items-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input col-span-5 text-xs", placeholder: "Description", value: it.name, onChange: (e) => setItem(i, "name", e.target.value) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input col-span-2 text-xs", placeholder: "Qté", type: "number", value: it.qty, onChange: (e) => setItem(i, "qty", e.target.value) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input col-span-3 text-xs", placeholder: "Prix", type: "number", value: it.unit_price, onChange: (e) => setItem(i, "unit_price", e.target.value) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "col-span-1 text-gray-300 hover:text-red-400", onClick: () => removeItem(i), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 13 }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "col-span-1 text-xs text-right text-gray-400", children: [
            ((it.qty || 1) * (it.unit_price || 0)).toFixed(0),
            "$"
          ] })
        ] }, i))
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 pt-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn-secondary flex-1", onClick: onClose, children: "Annuler" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "submit", className: "btn-primary flex-1", disabled: saving, children: [
          saving && /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 14, className: "animate-spin" }),
          " Créer"
        ] })
      ] })
    ] })
  ] }) });
}
function LeadCard({ lead, onEdit, onDelete, onQuote, onTerrain, onConvert, onFollowup, dragStart }) {
  const [converting, setConverting] = reactExports.useState(false);
  const doConvert = async () => {
    setConverting(true);
    try {
      await onConvert(lead);
    } finally {
      setConverting(false);
    }
  };
  const followUpDate = lead.follow_up_at ? new Date(lead.follow_up_at) : null;
  const followUpOverdue = followUpDate && followUpDate < /* @__PURE__ */ new Date();
  const followUpToday = followUpDate && followUpDate.toDateString() === (/* @__PURE__ */ new Date()).toDateString();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: `card p-3 cursor-grab active:cursor-grabbing select-none hover:shadow-md transition-shadow ${followUpOverdue ? "ring-2 ring-orange-300" : ""}`,
      draggable: true,
      onDragStart: (e) => dragStart(e, lead.id),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-2 mb-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-gray-900 leading-tight", children: lead.title }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-0.5 flex-shrink-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "p-1 text-gray-300 hover:text-orange-500 rounded", title: "Rappel", onClick: (e) => {
              e.stopPropagation();
              onFollowup(lead);
            }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { size: 11, className: followUpDate ? "text-orange-400" : "" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "p-1 text-gray-300 hover:text-blue-500 rounded", onClick: (e) => {
              e.stopPropagation();
              onEdit(lead);
            }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { size: 11 }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "p-1 text-gray-300 hover:text-red-500 rounded", onClick: (e) => {
              e.stopPropagation();
              onDelete(lead.id);
            }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 11 }) })
          ] })
        ] }),
        lead.contact_name && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 mb-1", children: lead.contact_name }),
        lead.contact_phone && /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: `tel:${lead.contact_phone}`, className: "flex items-center gap-1 text-xs text-green-600 hover:text-green-700 mb-1.5", onClick: (e) => e.stopPropagation(), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { size: 11 }),
          lead.contact_phone
        ] }),
        (lead.budget_min || lead.budget_max) && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-gray-400 mb-1.5", children: [
          lead.budget_min ? `${Number(lead.budget_min).toLocaleString("fr-CA")}$` : "",
          lead.budget_max ? ` – ${Number(lead.budget_max).toLocaleString("fr-CA")}$` : ""
        ] }),
        followUpDate && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: `text-xs flex items-center gap-1 mb-1.5 font-medium ${followUpOverdue ? "text-red-500" : followUpToday ? "text-orange-500" : "text-gray-400"}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { size: 10 }),
          followUpOverdue ? "Rappel en retard" : "Rappel",
          " : ",
          followUpDate.toLocaleDateString("fr-CA", { day: "numeric", month: "short" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1 mt-2 flex-wrap", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "btn-ghost text-xs py-0.5 px-1.5 gap-1", onClick: (e) => {
            e.stopPropagation();
            onTerrain(lead);
          }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ClipboardList, { size: 11 }),
            "Terrain"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "btn-ghost text-xs py-0.5 px-1.5 gap-1", onClick: (e) => {
            e.stopPropagation();
            onQuote(lead);
          }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { size: 11 }),
            "Devis"
          ] }),
          lead.status === "won" && /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "btn-ghost text-xs py-0.5 px-1.5 gap-1 text-green-600", onClick: (e) => {
            e.stopPropagation();
            doConvert();
          }, disabled: converting, children: [
            converting ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 11, className: "animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(FolderKanban, { size: 11 }),
            "Convertir"
          ] })
        ] })
      ]
    }
  );
}
function Leads() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [items, setItems] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [showNew, setShowNew] = reactExports.useState(searchParams.get("new") === "1");
  const [editLead, setEditLead] = reactExports.useState(null);
  const [quoteModal, setQuoteModal] = reactExports.useState(null);
  const [followupLead, setFollowupLead] = reactExports.useState(null);
  const [followupDate, setFollowupDate] = reactExports.useState("");
  const [dragOver, setDragOver] = reactExports.useState(null);
  const dragId = reactExports.useRef(null);
  const load = async () => {
    setLoading(true);
    try {
      const { data } = await leads.list();
      setItems(data);
    } catch {
    } finally {
      setLoading(false);
    }
  };
  reactExports.useEffect(() => {
    load();
  }, []);
  const handleSave = (data, isEdit) => {
    if (isEdit) setItems((i) => i.map((l2) => l2.id === data.id ? { ...l2, ...data } : l2));
    else setItems((i) => [data, ...i]);
    setShowNew(false);
    setEditLead(null);
  };
  const del = async (id2) => {
    if (!confirm("Supprimer ce lead ?")) return;
    await leads.delete(id2);
    setItems((i) => i.filter((l2) => l2.id !== id2));
  };
  const changeStatus = async (id2, status) => {
    await leads.update(id2, { status });
    setItems((i) => i.map((l2) => l2.id === id2 ? { ...l2, status } : l2));
  };
  const handleDrop = (e, status) => {
    e.preventDefault();
    const id2 = dragId.current;
    if (id2) changeStatus(id2, status);
    setDragOver(null);
    dragId.current = null;
  };
  const convertToProject = async (lead) => {
    const { data: qs } = await quotes.list();
    const signed = qs.find((q2) => q2.lead_id === lead.id && q2.status === "signed");
    if (!signed) {
      alert("Aucune soumission signée pour ce lead. Marquez une soumission comme signée d'abord.");
      return;
    }
    await quotes.convert(signed.id);
    setItems((i) => i.map((l2) => l2.id === lead.id ? { ...l2, status: "won" } : l2));
    navigate("/projets");
  };
  const saveFollowup = async () => {
    if (!followupLead) return;
    const val = followupDate ? new Date(followupDate).toISOString() : null;
    await leads.update(followupLead.id, { follow_up_at: val });
    setItems((i) => i.map((l2) => l2.id === followupLead.id ? { ...l2, follow_up_at: val } : l2));
    setFollowupLead(null);
  };
  const byStatus = (status) => items.filter((l2) => l2.status === status);
  if (loading) return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-gray-400 p-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 16, className: "animate-spin" }),
    " Chargement…"
  ] }) });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 h-full flex flex-col", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-bold text-gray-900", children: "Leads" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "btn-primary", onClick: () => setShowNew(true), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 14 }),
        " Nouveau lead"
      ] })
    ] }),
    (() => {
      const due = items.filter((l2) => l2.follow_up_at && new Date(l2.follow_up_at) <= /* @__PURE__ */ new Date() && !["won", "lost"].includes(l2.status));
      if (!due.length) return null;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 px-3 py-2.5 bg-orange-50 border border-orange-200 rounded-xl flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { size: 14, className: "text-orange-500 flex-shrink-0" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs font-medium text-orange-700 flex-1", children: [
          due.length,
          " rappel",
          due.length > 1 ? "s" : "",
          " en attente : ",
          due.slice(0, 2).map((l2) => l2.title).join(", "),
          due.length > 2 ? "…" : ""
        ] })
      ] });
    })(),
    showNew && /* @__PURE__ */ jsxRuntimeExports.jsx(LeadModal, { onClose: () => setShowNew(false), onSave: handleSave }),
    editLead && /* @__PURE__ */ jsxRuntimeExports.jsx(LeadModal, { lead: editLead, onClose: () => setEditLead(null), onSave: handleSave }),
    followupLead && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card w-full max-w-xs", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-semibold text-gray-900 mb-1 text-sm", children: "Rappel pour" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400 mb-3 truncate", children: followupLead.title }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input mb-3", type: "date", value: followupDate, onChange: (e) => setFollowupDate(e.target.value) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "btn-secondary flex-1 text-sm", onClick: () => setFollowupLead(null), children: "Annuler" }),
        followupLead.follow_up_at && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "btn-ghost flex-1 text-sm text-red-500", onClick: async () => {
          await leads.update(followupLead.id, { follow_up_at: null });
          setItems((i) => i.map((l2) => l2.id === followupLead.id ? { ...l2, follow_up_at: null } : l2));
          setFollowupLead(null);
        }, children: "Supprimer" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "btn-primary flex-1 text-sm", onClick: saveFollowup, children: "Enregistrer" })
      ] })
    ] }) }),
    quoteModal && /* @__PURE__ */ jsxRuntimeExports.jsx(
      QuoteModal,
      {
        lead: quoteModal.lead,
        format: quoteModal.format,
        onClose: () => setQuoteModal(null),
        onDone: () => {
          setQuoteModal(null);
          load();
        }
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-3 overflow-x-auto pb-4 flex-1", children: COLS.map((col) => {
      const colLeads = byStatus(col.key);
      const isOver = dragOver === col.key;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "flex-shrink-0 w-64 flex flex-col",
          onDragOver: (e) => {
            e.preventDefault();
            setDragOver(col.key);
          },
          onDragLeave: () => setDragOver(null),
          onDrop: (e) => handleDrop(e, col.key),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: "flex items-center gap-2 mb-2 px-1",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-2.5 h-2.5 rounded-full", style: { background: col.color } }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold text-gray-600 uppercase tracking-wide", children: col.label }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-gray-400 ml-auto bg-gray-100 rounded-full px-1.5 py-0.5", children: colLeads.length })
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: `flex-1 rounded-xl min-h-32 transition-colors p-1 space-y-2 ${isOver ? "bg-orange-50 ring-2 ring-brand ring-dashed" : "bg-gray-50"}`,
                children: [
                  col.key === "new" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "button",
                    {
                      className: "w-full border-2 border-dashed border-gray-200 hover:border-brand rounded-lg py-2 text-xs text-gray-400 hover:text-brand transition-colors flex items-center justify-center gap-1",
                      onClick: () => setShowNew(true),
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 12 }),
                        " Ajouter"
                      ]
                    }
                  ),
                  colLeads.map((lead) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                    LeadCard,
                    {
                      lead,
                      onEdit: setEditLead,
                      onDelete: del,
                      onQuote: (l2) => setQuoteModal({ lead: l2, format: "pdf" }),
                      onTerrain: (l2) => setQuoteModal({ lead: l2, format: "field_estimate" }),
                      onConvert: convertToProject,
                      onFollowup: (l2) => {
                        setFollowupLead(l2);
                        setFollowupDate(l2.follow_up_at ? l2.follow_up_at.slice(0, 10) : "");
                      },
                      dragStart: (e, id2) => {
                        dragId.current = id2;
                        e.dataTransfer.effectAllowed = "move";
                      }
                    },
                    lead.id
                  )),
                  colLeads.length === 0 && col.key !== "new" && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-300 text-center py-4", children: "Glissez ici" })
                ]
              }
            )
          ]
        },
        col.key
      );
    }) })
  ] }) });
}
const ToastCtx = reactExports.createContext(null);
let _toastId = 0;
function ToastProvider({ children }) {
  const [toasts, setToasts] = reactExports.useState([]);
  const add = reactExports.useCallback((msg, type = "info", duration = 3500) => {
    const id2 = ++_toastId;
    setToasts((t2) => [...t2, { id: id2, msg, type }]);
    setTimeout(() => setToasts((t2) => t2.filter((x2) => x2.id !== id2)), duration);
    return id2;
  }, []);
  const remove = reactExports.useCallback((id2) => setToasts((t2) => t2.filter((x2) => x2.id !== id2)), []);
  const ICONS2 = {
    success: /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { size: 15, className: "text-green-500 flex-shrink-0" }),
    error: /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { size: 15, className: "text-red-500 flex-shrink-0" }),
    info: /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { size: 15, className: "text-blue-500 flex-shrink-0" })
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(ToastCtx.Provider, { value: add, children: [
    children,
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed bottom-20 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 items-center pointer-events-none", children: toasts.map((t2) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "flex items-center gap-2 bg-white border border-gray-100 shadow-lg rounded-xl px-4 py-2.5 text-sm text-gray-800 pointer-events-auto max-w-sm",
        style: { animation: "fadeInUp 0.2s ease" },
        children: [
          ICONS2[t2.type] || ICONS2.info,
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1", children: t2.msg }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => remove(t2.id), className: "text-gray-300 hover:text-gray-500 ml-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 13 }) })
        ]
      },
      t2.id
    )) })
  ] });
}
function useToast() {
  return reactExports.useContext(ToastCtx);
}
const SL$2 = { draft: "Brouillon", sent: "Envoyée", viewed: "Vue", signed: "Signée", expired: "Expirée", rejected: "Refusée", converted: "Convertie" };
const SB$2 = { draft: "badge-gray", sent: "badge-blue", viewed: "badge-yellow", signed: "badge-green", expired: "badge-gray", rejected: "badge-red", converted: "badge-orange" };
const STATUSES = ["draft", "sent", "viewed", "signed", "rejected", "expired"];
function CreateModal$1({ leads: leads2, onClose, onSave, initialTitle = "", initialLeadId = "" }) {
  const [form, setForm] = reactExports.useState({ lead_id: initialLeadId, title: initialTitle, format: "pdf", items: [{ name: "", qty: 1, unit: "un.", unit_price: "" }] });
  const [saving, setSaving] = reactExports.useState(false);
  const [aiDesc, setAiDesc] = reactExports.useState("");
  const [aiLoading, setAiLoading] = reactExports.useState(false);
  const isField = form.format === "field_estimate";
  const f2 = (k2) => (e) => setForm((p2) => ({ ...p2, [k2]: e.target.value }));
  const addItem = () => setForm((p2) => ({ ...p2, items: [...p2.items, { name: "", qty: 1, unit: "un.", unit_price: "" }] }));
  const removeItem = (i) => setForm((p2) => ({ ...p2, items: p2.items.filter((_, idx) => idx !== i) }));
  const setItem = (i, k2, v2) => setForm((p2) => ({ ...p2, items: p2.items.map((it, idx) => idx === i ? { ...it, [k2]: v2 } : it) }));
  const runAI = async () => {
    var _a;
    if (!aiDesc.trim()) return;
    setAiLoading(true);
    try {
      const { data } = await ai.estimate({ description: aiDesc, project_type: "residential" });
      if ((_a = data.items) == null ? void 0 : _a.length) {
        const mapped = data.items.map((it) => ({
          name: it.name,
          qty: it.qty || 1,
          unit: it.unit || "un.",
          unit_price: it.unit_price_estimate || 0
        }));
        setForm((p2) => ({ ...p2, items: mapped }));
        if (!form.title) setForm((p2) => ({ ...p2, title: aiDesc.slice(0, 60) }));
      }
    } catch {
      alert("Erreur estimation IA. Vérifiez que ANTHROPIC_API_KEY est configuré.");
    } finally {
      setAiLoading(false);
    }
  };
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const items = isField ? [] : form.items.map((it) => ({ ...it, qty: Number(it.qty) || 1, unit_price: Number(it.unit_price) || 0 }));
      const { data } = await quotes.create({ ...form, lead_id: form.lead_id || null, items });
      onSave(data);
    } catch {
    } finally {
      setSaving(false);
    }
  };
  const subtotal = form.items.reduce((s, it) => s + (Number(it.qty) || 1) * (Number(it.unit_price) || 0), 0);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    SlideOver,
    {
      title: "Nouvelle soumission",
      subtitle: "Devis détaillé ou formulaire terrain",
      width: "max-w-lg",
      onClose,
      footer: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn-secondary flex-1", onClick: onClose, children: "Annuler" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "submit", form: "create-quote-form", className: "btn-primary flex-1", disabled: saving, children: [
          saving && /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 14, className: "animate-spin" }),
          " Créer"
        ] })
      ] }),
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { id: "create-quote-form", onSubmit: submit, className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Titre *" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", value: form.title, onChange: f2("title"), required: true })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Type" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "input", value: form.format, onChange: f2("format"), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "field_estimate", children: "Formulaire terrain" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "pdf", children: "Devis détaillé" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Lead lié" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "input", value: form.lead_id, onChange: f2("lead_id"), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "— Aucun —" }),
              leads2.map((l2) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: l2.id, children: l2.title }, l2.id))
            ] })
          ] })
        ] }),
        !isField && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-orange-50 border border-orange-100 rounded-xl p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 mb-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { size: 13, className: "text-brand" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold text-brand", children: "Estimation IA — auto-remplir les lignes" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                className: "input flex-1 text-sm",
                placeholder: "Ex: Rénovation cuisine 200 pi², armoires, comptoir, plomberie…",
                value: aiDesc,
                onChange: (e) => setAiDesc(e.target.value),
                onKeyDown: (e) => e.key === "Enter" && (e.preventDefault(), runAI())
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                className: "btn-primary flex-shrink-0 text-xs",
                onClick: runAI,
                disabled: aiLoading || !aiDesc.trim(),
                children: [
                  aiLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 13, className: "animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { size: 13 }),
                  "Générer"
                ]
              }
            )
          ] })
        ] }),
        isField ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Budget min ($)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", type: "number", value: form.budget_min || "", onChange: f2("budget_min") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Budget max ($)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", type: "number", value: form.budget_max || "", onChange: f2("budget_max") })
          ] })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label mb-0", children: "Lignes" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "btn-ghost text-xs py-0.5 px-2", onClick: addItem, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 12 }),
              " Ajouter"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: form.items.map((it, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-12 gap-1.5 items-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input col-span-5 text-xs", placeholder: "Description", value: it.name, onChange: (e) => setItem(i, "name", e.target.value) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input col-span-2 text-xs", placeholder: "Qté", type: "number", value: it.qty, onChange: (e) => setItem(i, "qty", e.target.value) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input col-span-3 text-xs", placeholder: "Prix", type: "number", value: it.unit_price, onChange: (e) => setItem(i, "unit_price", e.target.value) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "col-span-1 text-gray-300 hover:text-red-400", onClick: () => removeItem(i), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 13 }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "col-span-1 text-xs text-right text-gray-400", children: [
              ((it.qty || 1) * (it.unit_price || 0)).toFixed(0),
              "$"
            ] })
          ] }, i)) }),
          subtotal > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-right text-xs font-semibold text-gray-700 mt-2", children: [
            "Sous-total : ",
            subtotal.toLocaleString("fr-CA"),
            "$ + taxes"
          ] })
        ] })
      ] })
    }
  );
}
function EditModal$1({ quote, onClose, onSave }) {
  const [status, setStatus] = reactExports.useState(quote.status);
  const [title, setTitle] = reactExports.useState(quote.title || "");
  const [items, setItems] = reactExports.useState([]);
  const [loadingItems, setLoadingItems] = reactExports.useState(true);
  const [saving, setSaving] = reactExports.useState(false);
  reactExports.useEffect(() => {
    quotes.get(quote.id).then(({ data }) => setItems((data.items || []).map((it) => ({
      name: it.name || "",
      qty: it.qty || 1,
      unit: it.unit || "un.",
      unit_price: Number(it.unit_price) || 0,
      supplier: it.supplier || "",
      supplier_url: it.supplier_url || ""
    })))).catch(() => {
    }).finally(() => setLoadingItems(false));
  }, [quote.id]);
  const addItem = () => setItems((p2) => [...p2, { name: "", qty: 1, unit: "un.", unit_price: 0 }]);
  const removeItem = (i) => setItems((p2) => p2.filter((_, idx) => idx !== i));
  const setItem = (i, k2, v2) => setItems((p2) => p2.map((it, idx) => idx === i ? { ...it, [k2]: v2 } : it));
  const subtotal = items.reduce((s, it) => s + (Number(it.qty) || 1) * (Number(it.unit_price) || 0), 0);
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { status, title };
      if (items.length > 0) payload.items = items.map((it) => ({ ...it, qty: Number(it.qty) || 1, unit_price: Number(it.unit_price) || 0 }));
      const { data } = await quotes.update(quote.id, payload);
      onSave(data);
    } catch {
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    SlideOver,
    {
      title: "Modifier la soumission",
      subtitle: title || void 0,
      width: "max-w-lg",
      onClose,
      footer: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn-secondary flex-1", onClick: onClose, children: "Annuler" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "submit", form: "edit-quote-form", className: "btn-primary flex-1", disabled: saving, children: [
          saving && /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 14, className: "animate-spin" }),
          " Enregistrer"
        ] })
      ] }),
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { id: "edit-quote-form", onSubmit: submit, className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Titre" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", value: title, onChange: (e) => setTitle(e.target.value) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Statut" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("select", { className: "input", value: status, onChange: (e) => setStatus(e.target.value), children: STATUSES.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: s, children: SL$2[s] }, s)) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pt-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label mb-0", children: "Lignes de la soumission" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "btn-ghost text-xs py-0.5 px-2", onClick: addItem, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 12 }),
              " Ajouter"
            ] })
          ] }),
          loadingItems ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-gray-400 flex items-center gap-1.5 py-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 12, className: "animate-spin" }),
            " Chargement des lignes…"
          ] }) : items.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400 py-2", children: "Aucune ligne détaillée (soumission terrain). Cliquez « Ajouter » pour en créer." }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            items.map((it, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-12 gap-1.5 items-center", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input col-span-5 text-sm py-1.5", placeholder: "Description", value: it.name, onChange: (e) => setItem(i, "name", e.target.value) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input col-span-2 text-sm py-1.5", type: "number", placeholder: "Qté", value: it.qty, onChange: (e) => setItem(i, "qty", e.target.value) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input col-span-2 text-sm py-1.5", placeholder: "Unité", value: it.unit, onChange: (e) => setItem(i, "unit", e.target.value) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input col-span-2 text-sm py-1.5", type: "number", step: "0.01", placeholder: "Prix", value: it.unit_price, onChange: (e) => setItem(i, "unit_price", e.target.value) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "col-span-1 text-gray-300 hover:text-red-400", onClick: () => removeItem(i), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 13 }) })
            ] }, i)),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end pt-1 text-sm font-semibold text-gray-700", children: [
              "Sous-total : ",
              subtotal.toLocaleString("fr-CA", { minimumFractionDigits: 2 }),
              " $"
            ] })
          ] })
        ] })
      ] })
    }
  );
}
function Soumissions() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const [items, setItems] = reactExports.useState([]);
  const [leadList, setLeadList] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [showCreate, setShowCreate] = reactExports.useState(searchParams.get("new") === "1");
  const initialTitle = searchParams.get("title") ? decodeURIComponent(searchParams.get("title")) : "";
  const initialLeadId = searchParams.get("lead_id") || "";
  const [editItem, setEditItem] = reactExports.useState(null);
  const [converting, setConverting] = reactExports.useState(null);
  const load = async () => {
    setLoading(true);
    try {
      const [{ data: qs }, { data: ls }] = await Promise.all([quotes.list(), leads.list()]);
      setItems(qs);
      setLeadList(ls);
    } catch {
    } finally {
      setLoading(false);
    }
  };
  reactExports.useEffect(() => {
    load();
  }, []);
  const handleCreate = (data) => {
    setItems((i) => [data, ...i]);
    setShowCreate(false);
  };
  const handleEdit = (data) => {
    setItems((i) => i.map((q2) => q2.id === data.id ? { ...q2, ...data } : q2));
    setEditItem(null);
  };
  const del = async (id2) => {
    if (!confirm("Supprimer cette soumission ?")) return;
    await quotes.delete(id2);
    setItems((i) => i.filter((q2) => q2.id !== id2));
  };
  const convert = async (quote) => {
    setConverting(quote.id);
    try {
      const { data } = await quotes.convert(quote.id);
      setItems((i) => i.map((q2) => q2.id === quote.id ? { ...q2, status: "converted" } : q2));
      navigate("/projets");
    } catch {
      toast("Erreur lors de la conversion", "error");
    } finally {
      setConverting(null);
    }
  };
  const getLeadName = (lead_id) => {
    var _a;
    return ((_a = leadList.find((l2) => l2.id === lead_id)) == null ? void 0 : _a.title) || "";
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 max-w-5xl mx-auto", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-bold text-gray-900", children: "Soumissions" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "btn-primary", onClick: () => setShowCreate(true), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 15 }),
        " Nouvelle soumission"
      ] })
    ] }),
    showCreate && /* @__PURE__ */ jsxRuntimeExports.jsx(CreateModal$1, { leads: leadList, onClose: () => setShowCreate(false), onSave: handleCreate, initialTitle, initialLeadId }),
    editItem && /* @__PURE__ */ jsxRuntimeExports.jsx(EditModal$1, { quote: editItem, onClose: () => setEditItem(null), onSave: handleEdit }),
    loading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-gray-400 py-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 16, className: "animate-spin" }),
      " Chargement…"
    ] }) : items.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-12", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { size: 36, className: "text-gray-200 mx-auto mb-3" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-400 text-sm", children: "Aucune soumission. Créez-en une ou passez par un lead." })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: items.map((q2) => {
      const isField = q2.format === "field_estimate";
      const leadName = getLeadName(q2.lead_id);
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card flex items-center gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isField ? "bg-orange-50" : "bg-blue-50"}`, children: isField ? /* @__PURE__ */ jsxRuntimeExports.jsx(ClipboardList, { size: 14, className: "text-orange-500" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { size: 14, className: "text-blue-500" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-0.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-gray-900 text-sm truncate", children: q2.title || "Soumission" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `badge ${SB$2[q2.status]}`, children: SL$2[q2.status] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "badge badge-gray text-xs", children: isField ? "Terrain" : "Devis" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-gray-400", children: [
            leadName && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "mr-2", children: [
              "Lead : ",
              leadName
            ] }),
            q2.total > 0 && `${Number(q2.total).toLocaleString("fr-CA")}$`,
            q2.sent_at && ` · Envoyée le ${new Date(q2.sent_at).toLocaleDateString("fr-CA")}`
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 flex-shrink-0", children: [
          q2.interactive_token && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                className: "btn-ghost p-1.5 text-gray-400 hover:text-purple-500",
                title: "Copier le lien client",
                onClick: () => {
                  const url = `${window.location.origin}/soumission/${q2.interactive_token}`;
                  navigator.clipboard.writeText(url).then(() => toast("Lien copié !", "success"));
                },
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link2, { size: 13 })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "a",
              {
                className: "btn-ghost p-1.5 text-gray-400 hover:text-green-600",
                title: "Envoyer par WhatsApp",
                href: `https://wa.me/?text=${encodeURIComponent(`Bonjour, voici votre soumission "${q2.title || ""}". Vous pouvez la consulter et l'accepter ici : ${window.location.origin}/soumission/${q2.interactive_token}`)}`,
                target: "_blank",
                rel: "noreferrer",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircle, { size: 13 })
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              className: "btn-ghost p-1.5 text-gray-400 hover:text-brand",
              title: "Télécharger PDF",
              onClick: () => {
                const tok = localStorage.getItem("token");
                const url = pdf.quoteUrl(q2.id);
                fetch(url, { headers: { Authorization: `Bearer ${tok}` } }).then((r2) => r2.blob()).then((b) => {
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(b);
                  a.download = `soumission-${q2.id.slice(0, 8)}.pdf`;
                  a.click();
                });
              },
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { size: 13 })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              className: "btn-ghost p-1.5 text-gray-400 hover:text-green-600",
              title: "Envoyer par courriel",
              onClick: () => {
                const to = prompt("Adresse courriel du client :");
                if (to) email.sendQuote(q2.id, { to }).then(() => toast(`Soumission envoyée à ${to}`, "success")).catch((e) => {
                  var _a, _b;
                  return toast(((_b = (_a = e.response) == null ? void 0 : _a.data) == null ? void 0 : _b.detail) || "Erreur envoi — SMTP non configuré", "error");
                });
              },
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { size: 13 })
            }
          ),
          q2.status === "signed" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              className: "btn-primary text-xs py-1 px-2 gap-1",
              onClick: () => convert(q2),
              disabled: converting === q2.id,
              title: "Créer le projet + acompte",
              children: [
                converting === q2.id ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 12, className: "animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(FolderKanban, { size: 12 }),
                "Convertir"
              ]
            }
          ),
          q2.interactive_token && /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: `/soumission/${q2.interactive_token}`, target: "_blank", rel: "noreferrer", className: "btn-ghost p-1.5 text-gray-400", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { size: 13 }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "btn-ghost p-1.5 text-gray-400 hover:text-blue-500", onClick: () => setEditItem(q2), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { size: 14 }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "btn-ghost p-1.5 text-gray-400 hover:text-red-500", onClick: () => del(q2.id), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 14 }) })
        ] })
      ] }, q2.id);
    }) })
  ] }) });
}
const SL$1 = { draft: "Brouillon", sent: "Envoyée", viewed: "Vue", partial: "Partielle", paid: "Payée", overdue: "En retard", cancelled: "Annulée" };
const SB$1 = { draft: "badge-gray", sent: "badge-blue", viewed: "badge-yellow", partial: "badge-orange", paid: "badge-green", overdue: "badge-red", cancelled: "badge-gray" };
const FILTERS = ["", "sent", "overdue", "paid"];
const FL = { "": "Toutes", sent: "Envoyées", overdue: "En retard", paid: "Payées" };
function CreateModal({ projects: projects2, onClose, onSave }) {
  const [form, setForm] = reactExports.useState({
    project_id: "",
    client_name: "",
    client_email: "",
    due_date: "",
    items: [{ description: "", qty: 1, unit_price: "" }],
    tps_pct: 5,
    tvq_pct: 9.975
  });
  const [saving, setSaving] = reactExports.useState(false);
  const f2 = (k2) => (e) => setForm((p2) => ({ ...p2, [k2]: e.target.value }));
  const addItem = () => setForm((p2) => ({ ...p2, items: [...p2.items, { description: "", qty: 1, unit_price: "" }] }));
  const removeItem = (i) => setForm((p2) => ({ ...p2, items: p2.items.filter((_, idx) => idx !== i) }));
  const setItem = (i, k2, v2) => setForm((p2) => ({ ...p2, items: p2.items.map((it, idx) => idx === i ? { ...it, [k2]: v2 } : it) }));
  const subtotal = form.items.reduce((s, it) => s + (Number(it.qty) || 1) * (Number(it.unit_price) || 0), 0);
  const taxes = subtotal * (form.tps_pct / 100 + form.tvq_pct / 100);
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await invoices.create({
        ...form,
        project_id: form.project_id || null,
        items: form.items.map((it) => ({ ...it, qty: Number(it.qty) || 1, unit_price: Number(it.unit_price) || 0 })),
        tps_pct: Number(form.tps_pct),
        tvq_pct: Number(form.tvq_pct)
      });
      onSave(data);
    } catch {
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    SlideOver,
    {
      title: "Nouvelle facture",
      subtitle: "Facture avec TPS/TVQ",
      width: "max-w-lg",
      onClose,
      footer: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn-secondary flex-1", onClick: onClose, children: "Annuler" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "submit", form: "create-invoice-form", className: "btn-primary flex-1", disabled: saving, children: [
          saving && /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 14, className: "animate-spin" }),
          " Créer"
        ] })
      ] }),
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { id: "create-invoice-form", onSubmit: submit, className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Client *" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", value: form.client_name, onChange: f2("client_name"), required: true })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Courriel client" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", type: "email", value: form.client_email, onChange: f2("client_email") })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Projet lié" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "input", value: form.project_id, onChange: f2("project_id"), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "— Aucun —" }),
              projects2.map((p2) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: p2.id, children: p2.name }, p2.id))
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Date d'échéance" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", type: "date", value: form.due_date, onChange: f2("due_date") })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label mb-0", children: "Lignes" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "btn-ghost text-xs py-0.5 px-2", onClick: addItem, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 12 }),
              " Ajouter"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: form.items.map((it, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-12 gap-1.5 items-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input col-span-6 text-xs", placeholder: "Description", value: it.description, onChange: (e) => setItem(i, "description", e.target.value) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input col-span-2 text-xs", placeholder: "Qté", type: "number", value: it.qty, onChange: (e) => setItem(i, "qty", e.target.value) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input col-span-3 text-xs", placeholder: "Prix", type: "number", value: it.unit_price, onChange: (e) => setItem(i, "unit_price", e.target.value) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "col-span-1 text-gray-300 hover:text-red-400", onClick: () => removeItem(i), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 13 }) })
          ] }, i)) })
        ] }),
        subtotal > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-gray-50 rounded-xl p-3 text-xs space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-gray-600", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Sous-total" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              subtotal.toLocaleString("fr-CA"),
              "$"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-gray-400", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              "TPS (",
              form.tps_pct,
              "%)"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              (subtotal * form.tps_pct / 100).toFixed(2),
              "$"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-gray-400", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              "TVQ (",
              form.tvq_pct,
              "%)"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              (subtotal * form.tvq_pct / 100).toFixed(2),
              "$"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between font-semibold text-gray-900 border-t border-gray-200 pt-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Total" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              (subtotal + taxes).toFixed(2),
              "$"
            ] })
          ] })
        ] })
      ] })
    }
  );
}
function PartialPaymentModal({ inv, onClose, onSave }) {
  const [amount, setAmount] = reactExports.useState("");
  const [saving, setSaving] = reactExports.useState(false);
  const remaining = Number(inv.amount_due || inv.total || 0);
  const submit = async (e) => {
    e.preventDefault();
    const paid = Number(amount);
    if (paid <= 0 || paid > remaining) return;
    setSaving(true);
    try {
      const newAmountPaid = Number(inv.amount_paid || 0) + paid;
      const newAmountDue = remaining - paid;
      const status = newAmountDue <= 0 ? "paid" : "partial";
      const { data } = await invoices.update(inv.id, {
        amount_paid: newAmountPaid,
        amount_due: Math.max(0, newAmountDue),
        status,
        ...status === "paid" ? { paid_at: (/* @__PURE__ */ new Date()).toISOString() } : {}
      });
      onSave(data);
    } catch {
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card w-full max-w-sm", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-semibold text-gray-900 mb-1 text-sm", children: "Paiement reçu" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-gray-400 mb-4", children: [
      inv.number,
      " — Solde dû : ",
      remaining.toLocaleString("fr-CA"),
      "$"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: submit, className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Montant reçu ($)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", type: "number", step: "0.01", min: "0.01", max: remaining, value: amount, onChange: (e) => setAmount(e.target.value), autoFocus: true, required: true })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 pt-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn-secondary flex-1", onClick: onClose, children: "Annuler" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "submit", className: "btn-primary flex-1", disabled: saving || !amount || Number(amount) <= 0, children: [
          saving && /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 14, className: "animate-spin" }),
          " Enregistrer"
        ] })
      ] })
    ] })
  ] }) });
}
function EditModal({ inv, onClose, onSave }) {
  const [status, setStatus] = reactExports.useState(inv.status);
  const [due_date, setDueDate] = reactExports.useState(inv.due_date ? inv.due_date.slice(0, 10) : "");
  const [saving, setSaving] = reactExports.useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await invoices.update(inv.id, { status, due_date: due_date || null });
      onSave(data);
    } catch {
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    SlideOver,
    {
      title: "Modifier la facture",
      subtitle: inv.number ? `Facture ${inv.number}` : void 0,
      onClose,
      footer: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn-secondary flex-1", onClick: onClose, children: "Annuler" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "submit", form: "edit-invoice-form", className: "btn-primary flex-1", disabled: saving, children: [
          saving && /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 14, className: "animate-spin" }),
          " Enregistrer"
        ] })
      ] }),
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { id: "edit-invoice-form", onSubmit: submit, className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Statut" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("select", { className: "input", value: status, onChange: (e) => setStatus(e.target.value), children: Object.entries(SL$1).map(([k2, v2]) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: k2, children: v2 }, k2)) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Échéance" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", type: "date", value: due_date, onChange: (e) => setDueDate(e.target.value) })
        ] })
      ] })
    }
  );
}
function Factures() {
  const toast = useToast();
  const [items, setItems] = reactExports.useState([]);
  const [projects$1, setProjects] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [filter2, setFilter] = reactExports.useState("");
  const [showCreate, setShowCreate] = reactExports.useState(false);
  const [editItem, setEditItem] = reactExports.useState(null);
  const [partialItem, setPartialItem] = reactExports.useState(null);
  const load = async () => {
    setLoading(true);
    try {
      const [{ data: invs }, { data: projs }] = await Promise.all([
        invoices.list(filter2 ? { status: filter2 } : {}),
        projects.list()
      ]);
      setItems(invs);
      setProjects(projs);
    } catch {
    } finally {
      setLoading(false);
    }
  };
  reactExports.useEffect(() => {
    load();
  }, [filter2]);
  const handleCreate = (data) => {
    setItems((i) => [data, ...i]);
    setShowCreate(false);
  };
  const handleEdit = (data) => {
    setItems((i) => i.map((inv) => inv.id === data.id ? { ...inv, ...data } : inv));
    setEditItem(null);
  };
  const markPaid = async (inv) => {
    if (!confirm(`Marquer la facture ${inv.number} comme payée ?`)) return;
    const { data } = await invoices.update(inv.id, { status: "paid", amount_due: 0, paid_at: (/* @__PURE__ */ new Date()).toISOString(), amount_paid: inv.total });
    setItems((i) => i.map((x2) => x2.id === data.id ? { ...x2, ...data } : x2));
    toast("Facture marquée comme payée", "success");
  };
  const del = async (id2) => {
    if (!confirm("Supprimer cette facture ?")) return;
    await invoices.delete(id2);
    setItems((i) => i.filter((inv) => inv.id !== id2));
  };
  const sendReminder = async (inv) => {
    var _a, _b;
    const to = inv.client_email || prompt(`Courriel de ${inv.client_name || "ce client"} :`);
    if (!to) return;
    const dueStr = inv.due_date ? new Date(inv.due_date).toLocaleDateString("fr-CA", { day: "numeric", month: "long", year: "numeric" }) : "";
    const link = inv.public_token ? `

Voir en ligne : ${window.location.origin}/facture/${inv.public_token}` : "";
    try {
      await email.sendInvoice(inv.id, {
        to,
        subject: `Rappel de paiement — Facture ${inv.number} — ${Number(inv.amount_due || 0).toLocaleString("fr-CA")}$`,
        message: `Bonjour ${inv.client_name || ""},

Ceci est un rappel amical concernant votre facture ${inv.number} d'un montant de ${Number(inv.amount_due || 0).toLocaleString("fr-CA")}$${dueStr ? `, dont l'échéance était le ${dueStr}` : ""}.

Si vous avez déjà effectué le paiement, veuillez ignorer ce message.${link}

Merci et bonne journée.`
      });
      toast(`Rappel envoyé à ${to}`, "success");
    } catch (e) {
      toast(((_b = (_a = e.response) == null ? void 0 : _a.data) == null ? void 0 : _b.detail) || "Erreur envoi — SMTP non configuré", "error");
    }
  };
  const totalOverdue = items.filter((i) => i.status === "overdue").reduce((s, i) => s + Number(i.amount_due || 0), 0);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 max-w-5xl mx-auto", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-bold text-gray-900", children: "Factures" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "btn-primary", onClick: () => setShowCreate(true), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 15 }),
        " Nouvelle facture"
      ] })
    ] }),
    showCreate && /* @__PURE__ */ jsxRuntimeExports.jsx(CreateModal, { projects: projects$1, onClose: () => setShowCreate(false), onSave: handleCreate }),
    editItem && /* @__PURE__ */ jsxRuntimeExports.jsx(EditModal, { inv: editItem, onClose: () => setEditItem(null), onSave: handleEdit }),
    partialItem && /* @__PURE__ */ jsxRuntimeExports.jsx(PartialPaymentModal, { inv: partialItem, onClose: () => setPartialItem(null), onSave: (data) => {
      handleEdit(data);
      setPartialItem(null);
    } }),
    totalOverdue > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-red-700", children: "Factures en retard" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-red-500", children: [
          Number(totalOverdue).toLocaleString("fr-CA"),
          "$ en attente"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "btn-danger text-xs py-1.5", onClick: () => setFilter("overdue"), children: "Voir" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2 mb-4 flex-wrap", children: FILTERS.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: `btn ${filter2 === s ? "btn-primary" : "btn-secondary"} py-1 px-3 text-xs`, onClick: () => setFilter(s), children: FL[s] }, s)) }),
    loading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-gray-400 py-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 16, className: "animate-spin" }),
      " Chargement…"
    ] }) : items.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-12", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Receipt, { size: 36, className: "text-gray-200 mx-auto mb-3" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-400 text-sm", children: "Aucune facture trouvée." })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: items.map((inv) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card flex items-center gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-0.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-medium text-gray-900 text-sm", children: [
            inv.number,
            " ",
            inv.client_name && `— ${inv.client_name}`
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `badge ${SB$1[inv.status]}`, children: SL$1[inv.status] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-gray-400", children: [
          "Total : ",
          Number(inv.total).toLocaleString("fr-CA"),
          "$",
          inv.amount_due > 0 && ` · Dû : ${Number(inv.amount_due).toLocaleString("fr-CA")}$`,
          inv.due_date && ` · Échéance : ${new Date(inv.due_date).toLocaleDateString("fr-CA")}`
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 flex-shrink-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-bold text-gray-900 text-sm mr-1", children: [
          Number(inv.total).toLocaleString("fr-CA"),
          "$"
        ] }),
        inv.public_token && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              className: "btn-ghost p-1.5 text-gray-400 hover:text-purple-500",
              title: "Copier le lien client",
              onClick: () => {
                const url = `${window.location.origin}/facture/${inv.public_token}`;
                navigator.clipboard.writeText(url).then(() => toast("Lien copié !", "success"));
              },
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link2, { size: 13 })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "a",
            {
              className: "btn-ghost p-1.5 text-gray-400 hover:text-green-600",
              title: "Envoyer par WhatsApp",
              href: `https://wa.me/?text=${encodeURIComponent(`Bonjour ${inv.client_name || ""}, voici votre facture ${inv.number} de ${Number(inv.amount_due || inv.total || 0).toLocaleString("fr-CA")}$ : ${window.location.origin}/facture/${inv.public_token}`)}`,
              target: "_blank",
              rel: "noreferrer",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircle, { size: 13 })
            }
          )
        ] }),
        !["paid", "cancelled"].includes(inv.status) && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              className: "btn-ghost p-1.5 text-gray-400 hover:text-orange-500",
              title: "Paiement partiel reçu",
              onClick: () => setPartialItem(inv),
              children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold", children: "½" })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              className: "btn-ghost p-1.5 text-gray-400 hover:text-green-600",
              title: "Marquer comme payée (complète)",
              onClick: () => markPaid(inv),
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { size: 13 })
            }
          )
        ] }),
        inv.status === "overdue" && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            className: "btn-ghost p-1.5 text-red-400 hover:text-red-600 animate-pulse",
            title: "Envoyer un rappel de paiement",
            onClick: () => sendReminder(inv),
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { size: 13 })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            className: "btn-ghost p-1.5 text-gray-400 hover:text-brand",
            title: "Télécharger PDF",
            onClick: () => {
              const tok = localStorage.getItem("token");
              fetch(pdf.invoiceUrl(inv.id), { headers: { Authorization: `Bearer ${tok}` } }).then((r2) => r2.blob()).then((b) => {
                const a = document.createElement("a");
                a.href = URL.createObjectURL(b);
                a.download = `facture-${inv.number}.pdf`;
                a.click();
              });
            },
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { size: 14 })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            className: "btn-ghost p-1.5 text-gray-400 hover:text-green-600",
            title: "Envoyer par courriel",
            onClick: () => {
              const to = prompt("Adresse courriel du client :");
              if (to) email.sendInvoice(inv.id, { to }).then(() => toast(`Facture envoyée à ${to}`, "success")).catch((e) => {
                var _a, _b;
                return toast(((_b = (_a = e.response) == null ? void 0 : _a.data) == null ? void 0 : _b.detail) || "Erreur envoi — SMTP non configuré", "error");
              });
            },
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { size: 14 })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "btn-ghost p-1.5 text-gray-400 hover:text-blue-500", onClick: () => setEditItem(inv), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { size: 14 }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "btn-ghost p-1.5 text-gray-400 hover:text-red-500", onClick: () => del(inv.id), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 14 }) })
      ] })
    ] }, inv.id)) })
  ] }) });
}
const EMPTY$1 = { name: "", company_name: "", email: "", phone: "", whatsapp: "", specialties: "", hourly_rate: "", rbq_number: "" };
function SubModal({ sub, onClose, onSave }) {
  const [form, setForm] = reactExports.useState(sub ? {
    name: sub.name || "",
    company_name: sub.company_name || "",
    email: sub.email || "",
    phone: sub.phone || "",
    whatsapp: sub.whatsapp || "",
    specialties: Array.isArray(sub.specialties) ? sub.specialties.join(", ") : sub.specialties || "",
    hourly_rate: sub.hourly_rate || "",
    rbq_number: sub.rbq_number || ""
  } : { ...EMPTY$1 });
  const [saving, setSaving] = reactExports.useState(false);
  const f2 = (k2) => (e) => setForm((p2) => ({ ...p2, [k2]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, specialties: form.specialties ? form.specialties.split(",").map((s) => s.trim()).filter(Boolean) : [], hourly_rate: form.hourly_rate || null };
      const { data } = sub ? await subcontractors.update(sub.id, payload) : await subcontractors.create(payload);
      onSave(data, !!sub);
    } catch {
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card w-full max-w-md max-h-[90vh] overflow-y-auto", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-semibold text-gray-900 mb-4", children: sub ? "Modifier" : "Nouveau sous-traitant" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: submit, className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Nom *" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", value: form.name, onChange: f2("name"), required: true })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Compagnie" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", value: form.company_name, onChange: f2("company_name") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Téléphone" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", type: "tel", value: form.phone, onChange: f2("phone") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "WhatsApp" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", type: "tel", value: form.whatsapp, onChange: f2("whatsapp") })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Courriel" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", type: "email", value: form.email, onChange: f2("email") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Spécialités (séparées par virgules)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", placeholder: "Électricité, Plomberie", value: form.specialties, onChange: f2("specialties") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Taux horaire ($)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", type: "number", value: form.hourly_rate, onChange: f2("hourly_rate") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Numéro RBQ" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", value: form.rbq_number, onChange: f2("rbq_number") })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 pt-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn-secondary flex-1", onClick: onClose, children: "Annuler" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "submit", className: "btn-primary flex-1", disabled: saving, children: [
          saving && /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 14, className: "animate-spin" }),
          " ",
          sub ? "Enregistrer" : "Ajouter"
        ] })
      ] })
    ] })
  ] }) });
}
function RFQModal({ sub, projects: projects2, onClose }) {
  const [form, setForm] = reactExports.useState({ project_id: "", title: "", description: "", specialty: Array.isArray(sub.specialties) ? sub.specialties[0] || "" : sub.specialties || "", deadline: "" });
  const [saving, setSaving] = reactExports.useState(false);
  const [sent, setSent] = reactExports.useState(false);
  const f2 = (k2) => (e) => setForm((p2) => ({ ...p2, [k2]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: rfq } = await rfqs.create({ ...form, project_id: form.project_id || null });
      await rfqs.invite(rfq.id, [sub.id]);
      setSent(true);
    } catch {
    } finally {
      setSaving(false);
    }
  };
  if (sent) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card w-full max-w-sm text-center py-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { size: 20, className: "text-green-600" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-gray-900 mb-1", children: "Demande envoyée!" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-gray-400 mb-4", children: [
      "La demande de prix a été créée pour ",
      sub.name,
      "."
    ] }),
    sub.whatsapp && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "a",
      {
        href: `https://wa.me/${sub.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Bonjour ${sub.name},

Nous aimerions obtenir votre prix pour : ${form.title}.

${form.description}

Merci!`)}`,
        target: "_blank",
        rel: "noreferrer",
        className: "btn-primary inline-flex items-center gap-2 mb-3",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircle, { size: 14 }),
          " Envoyer sur WhatsApp"
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "btn-ghost text-sm mt-2", onClick: onClose, children: "Fermer" })
  ] }) });
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card w-full max-w-md", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-semibold text-gray-900 mb-1", children: "Demande de prix" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-gray-400 mb-4", children: [
      "Pour : ",
      sub.name
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: submit, className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Titre de la demande *" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", value: form.title, onChange: f2("title"), required: true, placeholder: "Électricité phase 1 — Cuisine…" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Projet lié" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "input", value: form.project_id, onChange: f2("project_id"), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "— Aucun —" }),
          projects2.map((p2) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: p2.id, children: p2.name }, p2.id))
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Description / Portée des travaux" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { className: "input", rows: 3, value: form.description, onChange: f2("description"), placeholder: "Détails des travaux demandés…" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Spécialité" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", value: form.specialty, onChange: f2("specialty") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Date limite" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", type: "date", value: form.deadline, onChange: f2("deadline") })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 pt-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn-secondary flex-1", onClick: onClose, children: "Annuler" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "submit", className: "btn-primary flex-1", disabled: saving, children: [
          saving ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 14, className: "animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { size: 14 }),
          " Envoyer"
        ] })
      ] })
    ] })
  ] }) });
}
function SousTraitants() {
  const [items, setItems] = reactExports.useState([]);
  const [projects$1, setProjects] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [showNew, setShowNew] = reactExports.useState(false);
  const [editItem, setEditItem] = reactExports.useState(null);
  const [rfqSub, setRfqSub] = reactExports.useState(null);
  const load = async () => {
    setLoading(true);
    try {
      const [{ data: subs }, { data: projs }] = await Promise.all([subcontractors.list(), projects.list()]);
      setItems(subs);
      setProjects(projs.filter((p2) => p2.status === "active"));
    } catch {
    } finally {
      setLoading(false);
    }
  };
  reactExports.useEffect(() => {
    load();
  }, []);
  const handleSave = (data, isEdit) => {
    if (isEdit) setItems((i) => i.map((s) => s.id === data.id ? data : s));
    else setItems((i) => [...i, data]);
    setShowNew(false);
    setEditItem(null);
  };
  const del = async (id2) => {
    if (!confirm("Supprimer ce sous-traitant ?")) return;
    await subcontractors.delete(id2);
    setItems((i) => i.filter((s) => s.id !== id2));
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 max-w-5xl mx-auto", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-bold text-gray-900", children: "Sous-traitants" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "btn-primary", onClick: () => setShowNew(true), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 15 }),
        " Ajouter"
      ] })
    ] }),
    showNew && /* @__PURE__ */ jsxRuntimeExports.jsx(SubModal, { onClose: () => setShowNew(false), onSave: handleSave }),
    editItem && /* @__PURE__ */ jsxRuntimeExports.jsx(SubModal, { sub: editItem, onClose: () => setEditItem(null), onSave: handleSave }),
    rfqSub && /* @__PURE__ */ jsxRuntimeExports.jsx(RFQModal, { sub: rfqSub, projects: projects$1, onClose: () => setRfqSub(null) }),
    loading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-gray-400 py-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 16, className: "animate-spin" }),
      " Chargement…"
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [
      items.map((s) => {
        var _a;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between mb-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-gray-900 text-sm", children: s.name }),
              s.company_name && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400", children: s.company_name })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-0.5 mr-1", children: [1, 2, 3, 4, 5].map((n2) => /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { size: 11, className: n2 <= (s.rating || 0) ? "text-yellow-400 fill-yellow-400" : "text-gray-200" }, n2)) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "btn-ghost p-1 text-gray-400 hover:text-blue-500", onClick: () => setEditItem(s), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { size: 13 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "btn-ghost p-1 text-gray-400 hover:text-red-500", onClick: () => del(s.id), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 13 }) })
            ] })
          ] }),
          ((_a = s.specialties) == null ? void 0 : _a.length) > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1 mb-2", children: s.specialties.map((sp) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "badge badge-orange", children: sp }, sp)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 text-xs text-gray-400 flex-wrap mb-2", children: [
            s.phone && /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: `tel:${s.phone}`, className: "flex items-center gap-1 hover:text-green-600", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { size: 11 }),
              s.phone
            ] }),
            s.email && /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: `mailto:${s.email}`, className: "flex items-center gap-1 hover:text-brand truncate", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { size: 11 }),
              s.email
            ] }),
            s.hourly_rate && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-auto font-medium text-gray-700", children: [
              s.hourly_rate,
              "$/h"
            ] })
          ] }),
          s.rbq_number && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-gray-300 mb-2", children: [
            "RBQ : ",
            s.rbq_number
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 pt-1 border-t border-gray-50", children: [
            s.whatsapp && /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "a",
              {
                href: `https://wa.me/${s.whatsapp.replace(/\D/g, "")}`,
                target: "_blank",
                rel: "noreferrer",
                className: "btn-ghost text-xs py-1 px-2 text-green-600 hover:bg-green-50 flex items-center gap-1",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircle, { size: 12 }),
                  " WhatsApp"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                className: "btn-ghost text-xs py-1 px-2 flex items-center gap-1 ml-auto",
                onClick: () => setRfqSub(s),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { size: 12 }),
                  " Demande de prix"
                ]
              }
            )
          ] })
        ] }, s.id);
      }),
      items.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "col-span-2 text-center py-12 text-gray-400 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(HardHat, { size: 32, className: "text-gray-200 mx-auto mb-3" }),
        "Aucun sous-traitant ajouté"
      ] })
    ] })
  ] }) });
}
const EMPTY = { name: "", email: "", phone: "", company: "", notes: "" };
function ContactModal({ contact, onClose, onSave }) {
  const [form, setForm] = reactExports.useState(contact ? {
    name: contact.name || "",
    email: contact.email || "",
    phone: contact.phone || "",
    company: contact.company || "",
    notes: contact.notes || ""
  } : { ...EMPTY });
  const [saving, setSaving] = reactExports.useState(false);
  const f2 = (k2) => (e) => setForm((p2) => ({ ...p2, [k2]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = contact ? await contacts.update(contact.id, form) : await contacts.create(form);
      onSave(data, !!contact);
    } catch {
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card w-full max-w-md", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-semibold text-gray-900 mb-4", children: contact ? "Modifier le contact" : "Nouveau contact" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: submit, className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Nom *" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", value: form.name, onChange: f2("name"), required: true })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Courriel" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", type: "email", value: form.email, onChange: f2("email") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Téléphone" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", value: form.phone, onChange: f2("phone") })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Entreprise" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", value: form.company, onChange: f2("company") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Notes" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { className: "input min-h-[64px] resize-none", value: form.notes, onChange: f2("notes") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 pt-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn-secondary flex-1", onClick: onClose, children: "Annuler" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "submit", className: "btn-primary flex-1", disabled: saving, children: [
          saving && /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 14, className: "animate-spin" }),
          contact ? "Enregistrer" : "Créer"
        ] })
      ] })
    ] })
  ] }) });
}
function Contacts() {
  const [items, setItems] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [showNew, setShowNew] = reactExports.useState(false);
  const [editItem, setEditItem] = reactExports.useState(null);
  const [q2, setQ] = reactExports.useState("");
  const load = async () => {
    setLoading(true);
    try {
      const { data } = await contacts.list();
      setItems(data);
    } catch {
    } finally {
      setLoading(false);
    }
  };
  reactExports.useEffect(() => {
    load();
  }, []);
  const handleSave = (data, isEdit) => {
    if (isEdit) setItems((i) => i.map((c) => c.id === data.id ? { ...c, ...data } : c));
    else setItems((i) => [data, ...i]);
    setShowNew(false);
    setEditItem(null);
  };
  const del = async (id2) => {
    if (!confirm("Supprimer ce contact ?")) return;
    await contacts.delete(id2);
    setItems((i) => i.filter((c) => c.id !== id2));
  };
  const filtered = items.filter(
    (c) => !q2 || [c.name, c.email, c.phone, c.company].some((v2) => v2 == null ? void 0 : v2.toLowerCase().includes(q2.toLowerCase()))
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 max-w-5xl mx-auto", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-bold text-gray-900", children: "Contacts" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "btn-primary", onClick: () => setShowNew(true), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 15 }),
        " Nouveau contact"
      ] })
    ] }),
    showNew && /* @__PURE__ */ jsxRuntimeExports.jsx(ContactModal, { onClose: () => setShowNew(false), onSave: handleSave }),
    editItem && /* @__PURE__ */ jsxRuntimeExports.jsx(ContactModal, { contact: editItem, onClose: () => setEditItem(null), onSave: handleSave }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative mb-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { size: 14, className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          className: "input pl-8",
          placeholder: "Rechercher par nom, courriel, téléphone…",
          value: q2,
          onChange: (e) => setQ(e.target.value)
        }
      )
    ] }),
    loading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-gray-400 py-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 16, className: "animate-spin" }),
      " Chargement…"
    ] }) : filtered.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-12", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(User, { size: 36, className: "text-gray-200 mx-auto mb-3" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-400 text-sm", children: q2 ? "Aucun résultat." : "Aucun contact. Créez-en un!" })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3", children: filtered.map((c) => {
      var _a;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card flex flex-col gap-2 hover:shadow-md transition-shadow", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 text-sm", style: { background: "#F26522" }, children: (((_a = c.name) == null ? void 0 : _a[0]) || "?").toUpperCase() }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-gray-900 text-sm truncate", children: c.name }),
            c.company && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-gray-400 flex items-center gap-1 truncate", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Building2, { size: 10 }),
              c.company
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1 flex-shrink-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "btn-ghost p-1 text-gray-300 hover:text-blue-500", onClick: () => setEditItem(c), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { size: 12 }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "btn-ghost p-1 text-gray-300 hover:text-red-500", onClick: () => del(c.id), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 12 }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1 pl-13", children: [
          c.phone && /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: `tel:${c.phone}`, className: "flex items-center gap-1.5 text-xs text-gray-600 hover:text-green-600", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { size: 11, className: "text-gray-400" }),
            c.phone
          ] }),
          c.email && /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: `mailto:${c.email}`, className: "flex items-center gap-1.5 text-xs text-gray-600 hover:text-brand truncate", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { size: 11, className: "text-gray-400" }),
            c.email
          ] }),
          c.notes && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400 italic truncate", children: c.notes })
        ] })
      ] }, c.id);
    }) })
  ] }) });
}
function StatCard({ label, value, sub, color = "#F26522" }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400 mb-1", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-bold", style: { color }, children: value }),
    sub && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400 mt-0.5", children: sub })
  ] });
}
function Rapport() {
  const [data, setData] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const load = async () => {
    setLoading(true);
    try {
      const [p2, i, l2, q2, ts] = await Promise.all([
        projects.list(),
        invoices.list(),
        leads.list(),
        quotes.list(),
        timesheets.list({})
      ]);
      setData({ projects: p2.data, invoices: i.data, leads: l2.data, quotes: q2.data, timesheets: ts.data });
    } catch {
    } finally {
      setLoading(false);
    }
  };
  reactExports.useEffect(() => {
    load();
  }, []);
  const exportCSV = () => {
    if (!data) return;
    const rows = [
      ["Métrique", "Valeur"],
      ["Projets actifs", data.projects.filter((p2) => p2.status === "active").length],
      ["Total projets", data.projects.length],
      ["Revenus facturés", data.invoices.filter((i) => i.status !== "cancelled").reduce((s, i) => s + Number(i.total || 0), 0).toFixed(2)],
      ["Revenus encaissés", data.invoices.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.total || 0), 0).toFixed(2)],
      ["À encaisser", data.invoices.filter((i) => ["sent", "viewed", "partial", "overdue"].includes(i.status)).reduce((s, i) => s + Number(i.amount_due || 0), 0).toFixed(2)],
      ["Leads total", data.leads.length],
      ["Leads gagnés", data.leads.filter((l2) => l2.status === "won").length],
      ["Pipeline soumissions", data.quotes.filter((q2) => ["draft", "sent", "viewed", "signed"].includes(q2.status)).reduce((s, q2) => s + Number(q2.total || 0), 0).toFixed(2)],
      ["Total heures pointées", data.timesheets.reduce((s, t2) => s + Number(t2.hours_total || 0), 0).toFixed(1)]
    ];
    const csv = rows.map((r2) => r2.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
    a.download = `rapport-monflux-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`;
    a.click();
  };
  if (loading) return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-gray-400 p-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 16, className: "animate-spin" }),
    " Chargement…"
  ] }) });
  if (!data) return null;
  const activeProjects = data.projects.filter((p2) => p2.status === "active");
  const totalRevenue = data.invoices.filter((i) => i.status !== "cancelled").reduce((s, i) => s + Number(i.total || 0), 0);
  const collected = data.invoices.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.total || 0), 0);
  const outstanding = data.invoices.filter((i) => ["sent", "viewed", "partial", "overdue"].includes(i.status)).reduce((s, i) => s + Number(i.amount_due || 0), 0);
  const overdue = data.invoices.filter((i) => i.status === "overdue");
  const pipeline = data.quotes.filter((q2) => ["draft", "sent", "viewed", "signed"].includes(q2.status)).reduce((s, q2) => s + Number(q2.total || 0), 0);
  const wonLeads = data.leads.filter((l2) => l2.status === "won");
  const totalLeads = data.leads.length;
  const convRate = totalLeads > 0 ? Math.round(wonLeads.length / totalLeads * 100) : 0;
  const totalHours = data.timesheets.reduce((s, t2) => s + Number(t2.hours_total || 0), 0);
  const now = /* @__PURE__ */ new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return { label: d.toLocaleDateString("fr-CA", { month: "short" }), year: d.getFullYear(), month: d.getMonth() };
  });
  const monthlyRevenue = months.map((m2) => ({
    label: m2.label,
    revenue: data.invoices.filter((inv) => {
      const d = new Date(inv.created_at);
      return d.getFullYear() === m2.year && d.getMonth() === m2.month;
    }).reduce((s, i) => s + Number(i.total || 0), 0)
  }));
  const maxRev = Math.max(...monthlyRevenue.map((m2) => m2.revenue), 1);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 max-w-5xl mx-auto", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-xl font-bold text-gray-900 flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(BarChart3, { size: 20 }),
        " Rapport & Indicateurs"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "btn-secondary", onClick: exportCSV, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { size: 14 }),
        " Exporter CSV"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { label: "Revenus facturés", value: `${Math.round(totalRevenue / 1e3)}k$`, sub: "total", color: "#F26522" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { label: "Encaissé", value: `${Math.round(collected / 1e3)}k$`, sub: `${Math.round(totalRevenue > 0 ? collected / totalRevenue * 100 : 0)}% du facturé`, color: "#22c55e" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { label: "À encaisser", value: `${Math.round(outstanding / 1e3)}k$`, sub: overdue.length > 0 ? `${overdue.length} en retard` : "à jour", color: overdue.length > 0 ? "#ef4444" : "#6b7280" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { label: "Pipeline", value: `${Math.round(pipeline / 1e3)}k$`, sub: "soumissions actives", color: "#6366f1" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { label: "Projets actifs", value: activeProjects.length, sub: `/ ${data.projects.length} total`, color: "#22c55e" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { label: "Taux conversion", value: `${convRate}%`, sub: `${wonLeads.length}/${totalLeads} leads`, color: "#F26522" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { label: "Heures pointées", value: `${totalHours.toFixed(0)}h`, sub: `${data.timesheets.length} entrées`, color: "#3b82f6" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { label: "Leads actifs", value: data.leads.filter((l2) => ["new", "contacted"].includes(l2.status)).length, sub: "nouveaux / contactés", color: "#f59e0b" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { size: 14, className: "text-brand" }),
          " Facturation — 6 derniers mois"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-end gap-2 h-28 mb-1", children: monthlyRevenue.map((m2, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center flex-1 gap-1 group", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: "w-full rounded-t-md transition-all relative",
              style: {
                height: `${Math.round(m2.revenue / maxRev * 100)}%`,
                minHeight: m2.revenue > 0 ? 4 : 0,
                background: i === 5 ? "#F26522" : "#F26522",
                opacity: 0.4 + i * 0.12
              },
              title: `${m2.label}: ${m2.revenue.toLocaleString("fr-CA")}$`
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400", children: m2.label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold text-gray-600 h-4", children: m2.revenue > 0 ? `${Math.round(m2.revenue / 1e3)}k` : "" })
        ] }, i)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { size: 14, className: "text-brand" }),
          " Entonnoir des leads"
        ] }),
        (() => {
          const stages = [
            { key: "all", label: "Leads total", count: data.leads.length, color: "#6b7280" },
            { key: "contacted", label: "Contactés", count: data.leads.filter((l2) => ["contacted", "quote_sent", "won"].includes(l2.status)).length, color: "#F26522" },
            { key: "quoted", label: "Soumission envoyée", count: data.leads.filter((l2) => ["quote_sent", "won"].includes(l2.status)).length, color: "#6366f1" },
            { key: "won", label: "Gagnés", count: wonLeads.length, color: "#22c55e" }
          ];
          const max = stages[0].count || 1;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            stages.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-gray-500", children: s.label }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold", style: { color: s.color }, children: s.count })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full h-2 bg-gray-100 rounded-full overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  className: "h-full rounded-full transition-all",
                  style: { width: `${Math.round(s.count / max * 100)}%`, background: s.color }
                }
              ) })
            ] }, s.key)),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-gray-400 mt-2 pt-2 border-t border-gray-50", children: [
              "Taux de conversion global : ",
              /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { style: { color: "#22c55e" }, children: [
                convRate,
                "%"
              ] })
            ] })
          ] });
        })()
      ] })
    ] }),
    overdue.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card mb-6 border-red-100", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "font-semibold text-red-600 text-sm mb-3 flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { size: 14 }),
        " Factures en retard (",
        overdue.length,
        ")"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: overdue.map((inv) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-800", children: inv.title || `Facture ${inv.number}` }),
          inv.client_name && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400", children: inv.client_name })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-bold text-red-500", children: [
          Number(inv.amount_due || 0).toLocaleString("fr-CA"),
          "$"
        ] })
      ] }, inv.id)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { size: 14, className: "text-brand" }),
        " Projets par valeur"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        data.projects.filter((p2) => p2.contract_value > 0).sort((a, b) => Number(b.contract_value) - Number(a.contract_value)).slice(0, 8).map((p2) => {
          const SL2 = { active: "badge-green", lead: "badge-gray", quote: "badge-yellow", on_hold: "badge-blue", completed: "badge-gray", cancelled: "badge-red" };
          const SN = { active: "Actif", lead: "Lead", quote: "Soumission", on_hold: "En pause", completed: "Terminé", cancelled: "Annulé" };
          const maxVal = data.projects.reduce((s, p22) => Math.max(s, Number(p22.contract_value || 0)), 0) || 1;
          const pct = Math.round(Number(p2.contract_value) / maxVal * 100);
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "py-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-800 flex-1 truncate", children: p2.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `badge ${SL2[p2.status] || "badge-gray"} text-xs`, children: SN[p2.status] || p2.status }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-bold text-gray-700 flex-shrink-0", children: [
                Number(p2.contract_value).toLocaleString("fr-CA"),
                "$"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full h-1 bg-gray-100 rounded-full", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full rounded-full bg-brand", style: { width: `${pct}%` } }) })
          ] }, p2.id);
        }),
        data.projects.filter((p2) => p2.contract_value > 0).length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-400", children: "Aucun projet avec valeur de contrat définie." })
      ] })
    ] })
  ] }) });
}
function Punch() {
  const [projectList, setProjectList] = reactExports.useState([]);
  const [selectedProject, setSelectedProject] = reactExports.useState("");
  const [qrData, setQrData] = reactExports.useState(null);
  const [generating, setGenerating] = reactExports.useState(false);
  const [timesheets$1, setTimesheets] = reactExports.useState([]);
  const [tsLoading, setTsLoading] = reactExports.useState(true);
  reactExports.useEffect(() => {
    projects.list().then(({ data }) => setProjectList(data.filter((p2) => p2.status === "active"))).catch(() => {
    });
    timesheets.list({}).then(({ data }) => setTimesheets(data)).catch(() => {
    }).finally(() => setTsLoading(false));
  }, []);
  const generate = async () => {
    if (!selectedProject) return;
    const proj = projectList.find((p2) => p2.id === selectedProject);
    setGenerating(true);
    try {
      const { data } = await punch.generate({ project_id: selectedProject, label: proj == null ? void 0 : proj.name });
      setQrData(data);
    } catch {
    } finally {
      setGenerating(false);
    }
  };
  const totalHoursToday = timesheets$1.filter((t2) => t2.clock_in && new Date(t2.clock_in).toDateString() === (/* @__PURE__ */ new Date()).toDateString()).reduce((s, t2) => s + Number(t2.hours_total || 0), 0);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 max-w-5xl mx-auto", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-bold text-gray-900 mb-6", children: "Punch" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-4 mb-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-bold text-brand", children: timesheets$1.filter((t2) => !t2.clock_out).length }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400 mt-1", children: "Pointés en ce moment" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-2xl font-bold text-gray-900", children: [
          totalHoursToday.toFixed(1),
          "h"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400 mt-1", children: "Heures aujourd'hui" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-bold text-gray-900", children: timesheets$1.length }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400 mt-1", children: "Total entrées" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4 mb-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(QrCode, { size: 16, className: "text-brand" }),
          " Générer un QR de chantier"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "input", value: selectedProject, onChange: (e) => setSelectedProject(e.target.value), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "Choisir un projet…" }),
            projectList.map((p2) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: p2.id, children: p2.name }, p2.id))
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "btn-primary w-full justify-center", onClick: generate, disabled: !selectedProject || generating, children: [
            generating ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 15, className: "animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 15 }),
            "Générer le QR"
          ] })
        ] }),
        qrData && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 pt-4 border-t border-gray-100 text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: qrData.qr_image, alt: "QR", className: "w-40 h-40 mx-auto border border-gray-200 rounded-xl mb-3" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 mb-2", children: "Imprimez et affichez à l'entrée du chantier" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "btn-secondary text-xs w-full justify-center", onClick: () => {
            const w2 = window.open("", "_blank", "width=420,height=520");
            w2.document.write(`<!DOCTYPE html><html><head><title>QR Chantier</title><style>body{margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#fff;}img{width:300px;height:300px;}p{margin-top:16px;font-size:15px;color:#333;font-weight:600;}</style></head><body><img src="${qrData.qr_image}" alt="QR"/><p>${qrData.label || "Chantier"}</p></body></html>`);
            w2.document.close();
            w2.focus();
            w2.print();
          }, children: "🖨️ Imprimer le QR" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-300 font-mono mt-2 break-all", children: qrData.url })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { size: 16, className: "text-green-500" }),
          " Présents maintenant"
        ] }),
        timesheets$1.filter((t2) => !t2.clock_out).length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-400", children: "Personne de pointé en ce moment." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: timesheets$1.filter((t2) => !t2.clock_out).map((t2) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-800 truncate", children: t2.user_name || t2.sub_name || t2.worker_name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400", children: t2.project_name })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400", children: t2.clock_in && new Date(t2.clock_in).toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" }) })
        ] }, t2.id)) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-semibold text-gray-900 text-sm", children: "Journal de punch" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            className: "btn-ghost text-xs py-1 px-2 flex items-center gap-1",
            onClick: () => {
              const rows = [["Nom", "Projet", "Entrée", "Sortie", "Heures"]];
              timesheets$1.forEach((t2) => rows.push([
                t2.user_name || t2.sub_name || "Anonyme",
                t2.project_name || "",
                t2.clock_in ? new Date(t2.clock_in).toLocaleString("fr-CA") : "",
                t2.clock_out ? new Date(t2.clock_out).toLocaleString("fr-CA") : "En cours",
                t2.hours_total || ""
              ]));
              const csv = rows.map((r2) => r2.map((v2) => `"${String(v2).replace(/"/g, '""')}"`).join(",")).join("\n");
              const a = document.createElement("a");
              a.href = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
              a.download = `pointage-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`;
              a.click();
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { size: 12 }),
              " Exporter CSV"
            ]
          }
        )
      ] }),
      tsLoading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-gray-400 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 14, className: "animate-spin" }),
        " Chargement…"
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        timesheets$1.slice(0, 20).map((t2) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 py-2 border-b border-gray-50 last:border-0 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { size: 14, className: t2.clock_out ? "text-gray-300" : "text-green-500" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-gray-800", children: t2.user_name || t2.sub_name || t2.worker_name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-400 mx-2", children: "·" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-500 text-xs", children: t2.project_name })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-gray-400 text-right flex-shrink-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: t2.clock_in && new Date(t2.clock_in).toLocaleDateString("fr-CA", { month: "short", day: "numeric" }) }),
            t2.hours_total && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-2 font-medium text-gray-700", children: [
              t2.hours_total,
              "h"
            ] })
          ] })
        ] }, t2.id)),
        timesheets$1.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-400", children: "Aucun punch enregistré." })
      ] })
    ] })
  ] }) });
}
function PunchPublic() {
  const { token } = useParams();
  const [site, setSite] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [name, setName] = reactExports.useState("");
  const [phone, setPhone] = reactExports.useState("");
  const [tsId, setTsId] = reactExports.useState(localStorage.getItem(`punch_ts_${token}`) || null);
  const [action, setAction] = reactExports.useState(false);
  const [done, setDone] = reactExports.useState(false);
  const [error, setError] = reactExports.useState("");
  reactExports.useEffect(() => {
    punch.getSite(token).then(({ data }) => setSite(data)).catch(() => setError("QR Code invalide ou expiré")).finally(() => setLoading(false));
  }, [token]);
  const clockIn = async () => {
    var _a, _b;
    if (!name.trim()) return setError("Entrez votre nom");
    setAction(true);
    try {
      const { data } = await punch.clockIn({ token, worker_name: name, worker_phone: phone });
      localStorage.setItem(`punch_ts_${token}`, data.timesheet_id);
      setTsId(data.timesheet_id);
      setDone("in");
    } catch (e) {
      setError(((_b = (_a = e.response) == null ? void 0 : _a.data) == null ? void 0 : _b.error) || "Erreur");
    } finally {
      setAction(false);
    }
  };
  const clockOut = async () => {
    var _a, _b;
    setAction(true);
    try {
      const { data } = await punch.clockOut({ timesheet_id: tsId });
      localStorage.removeItem(`punch_ts_${token}`);
      setTsId(null);
      setDone("out");
    } catch (e) {
      setError(((_b = (_a = e.response) == null ? void 0 : _a.data) == null ? void 0 : _b.error) || "Erreur");
    } finally {
      setAction(false);
    }
  };
  if (loading) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 24, className: "animate-spin text-brand" }) });
  if (error && !site) return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3 p-6 text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-4xl", children: "❌" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-gray-900", children: "Code invalide" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-400", children: error })
  ] });
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-sm", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-8 justify-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-9 h-9 rounded-xl flex items-center justify-center", style: { background: "#F26522" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-white font-bold", children: "M" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-gray-900", children: "MONFLUX · Punch" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card mb-5 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { size: 28, className: "text-brand mx-auto mb-2" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-bold text-gray-900 text-lg", children: site == null ? void 0 : site.project_name }),
      (site == null ? void 0 : site.project_address) && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-gray-400 flex items-center justify-center gap-1 mt-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { size: 13 }),
        site.project_address
      ] })
    ] }),
    done === "in" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { size: 40, className: "text-green-500 mx-auto mb-3" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-gray-900", children: "Arrivée enregistrée !" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-gray-400 mt-1", children: [
        "Bonne journée de travail, ",
        name,
        "."
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-300 mt-3", children: "Scannez à nouveau en fin de journée pour pointer votre départ." })
    ] }),
    done === "out" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { size: 40, className: "text-brand mx-auto mb-3" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-gray-900", children: "Départ enregistré !" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-400 mt-1", children: "Bonne fin de journée !" })
    ] }),
    !done && tsId && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 mb-4", children: "Vous êtes déjà pointé en entrée. Cliquez pour enregistrer votre départ." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "btn-primary w-full justify-center", onClick: clockOut, disabled: action, children: [
        action ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 15, className: "animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { size: 15 }),
        "Enregistrer mon départ"
      ] })
    ] }),
    !done && !tsId && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600", children: "Entrez vos informations pour pointer votre arrivée." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Votre nom *" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", placeholder: "Jean Tremblay", value: name, onChange: (e) => setName(e.target.value) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Téléphone (optionnel)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", type: "tel", placeholder: "514-555-0000", value: phone, onChange: (e) => setPhone(e.target.value) })
      ] }),
      error && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-red-500", children: error }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "btn-primary w-full justify-center", onClick: clockIn, disabled: action, children: [
        action ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 15, className: "animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { size: 15 }),
        "Pointer mon arrivée"
      ] })
    ] })
  ] }) });
}
const STATUS_LABELS = {
  draft: "Brouillon",
  sent: "Envoyée",
  viewed: "Vue",
  signed: "Signée",
  expired: "Expirée",
  rejected: "Refusée",
  converted: "Convertie"
};
function QuotePublic() {
  var _a, _b;
  const { token } = useParams();
  const [quote, setQuote] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState(null);
  const [signing, setSigning] = reactExports.useState(false);
  const [declining, setDeclining] = reactExports.useState(false);
  const [done, setDone] = reactExports.useState(null);
  const [confirm2, setConfirm] = reactExports.useState(false);
  reactExports.useEffect(() => {
    const load = async () => {
      var _a2, _b2;
      try {
        const { data } = await http.get(`/public/quote/${token}`);
        setQuote(data);
      } catch (e) {
        setError(((_b2 = (_a2 = e.response) == null ? void 0 : _a2.data) == null ? void 0 : _b2.error) || "Soumission introuvable");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);
  const handleSign = async () => {
    var _a2, _b2;
    setSigning(true);
    try {
      await http.post(`/public/quote/${token}/sign`);
      setDone("signed");
      setQuote((q2) => ({ ...q2, status: "signed", signed_at: (/* @__PURE__ */ new Date()).toISOString() }));
    } catch (e) {
      alert(((_b2 = (_a2 = e.response) == null ? void 0 : _a2.data) == null ? void 0 : _b2.error) || "Erreur lors de la signature");
    } finally {
      setSigning(false);
      setConfirm(false);
    }
  };
  const handleDecline = async () => {
    var _a2, _b2;
    setDeclining(true);
    try {
      await http.post(`/public/quote/${token}/decline`);
      setDone("declined");
      setQuote((q2) => ({ ...q2, status: "rejected" }));
    } catch (e) {
      alert(((_b2 = (_a2 = e.response) == null ? void 0 : _a2.data) == null ? void 0 : _b2.error) || "Erreur");
    } finally {
      setDeclining(false);
    }
  };
  const subtotal = ((_a = quote == null ? void 0 : quote.items) == null ? void 0 : _a.reduce((s, i) => s + (Number(i.qty) || 1) * (Number(i.unit_price) || 0), 0)) || 0;
  const tps = subtotal * ((Number(quote == null ? void 0 : quote.tps_pct) || 5) / 100);
  const tvq = subtotal * ((Number(quote == null ? void 0 : quote.tvq_pct) || 9.975) / 100);
  const total = (quote == null ? void 0 : quote.total) ? Number(quote.total) : subtotal + tps + tvq;
  if (loading) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 text-gray-500", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 20, className: "animate-spin" }),
    "Chargement de votre soumission…"
  ] }) });
  if (error) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(AlertTriangle, { size: 40, className: "text-orange-400 mx-auto mb-4" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-lg font-semibold text-gray-800 mb-2", children: "Soumission introuvable" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500", children: error })
  ] }) });
  const isExpired = quote.valid_until && new Date(quote.valid_until) < /* @__PURE__ */ new Date();
  const canSign = ["draft", "sent", "viewed"].includes(quote.status) && !isExpired && !done;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-gray-50", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-white border-b border-gray-100 px-4 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-2xl mx-auto flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-7 h-7 rounded-lg flex items-center justify-center", style: { background: "#F26522" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-white font-bold text-xs", children: "M" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-gray-900 text-sm", children: "MONFLUX" })
      ] }),
      quote.company_name && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500", children: quote.company_name })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-2xl mx-auto p-4 space-y-4", children: [
      done === "signed" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { size: 20, className: "text-green-500 flex-shrink-0" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-green-800", children: "Soumission acceptée !" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-green-700", children: "Votre entrepreneur vous contactera sous peu." })
        ] })
      ] }),
      done === "declined" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(XCircle, { size: 20, className: "text-red-400 flex-shrink-0" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-red-700", children: "Soumission refusée. Merci de nous avoir contactés." })
      ] }),
      quote.status === "signed" && !done && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { size: 16, className: "text-green-500" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-green-700 font-medium", children: [
          "Soumission signée le ",
          new Date(quote.signed_at).toLocaleDateString("fr-CA", { day: "numeric", month: "long", year: "numeric" })
        ] })
      ] }),
      isExpired && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertTriangle, { size: 16, className: "text-orange-500" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-orange-700", children: [
          "Cette soumission a expiré le ",
          new Date(quote.valid_until).toLocaleDateString("fr-CA"),
          "."
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white rounded-2xl shadow-sm p-5 border border-gray-100", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-start justify-between gap-3 mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { size: 16, className: "text-orange-500" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-lg font-bold text-gray-900", children: quote.title || "Soumission" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-gray-400", children: [
            "Statut : ",
            STATUS_LABELS[quote.status] || quote.status,
            quote.valid_until && !isExpired && ` · Valide jusqu'au ${new Date(quote.valid_until).toLocaleDateString("fr-CA")}`
          ] })
        ] }) }),
        (quote.company_name || quote.company_phone || quote.company_email) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-gray-50 rounded-xl p-3 flex flex-wrap gap-3 text-xs text-gray-600", children: [
          quote.company_name && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Building2, { size: 12, className: "text-gray-400" }),
            " ",
            quote.company_name
          ] }),
          quote.company_phone && /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: `tel:${quote.company_phone}`, className: "flex items-center gap-1.5 hover:text-brand", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { size: 12, className: "text-gray-400" }),
            " ",
            quote.company_phone
          ] }),
          quote.company_email && /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: `mailto:${quote.company_email}`, className: "flex items-center gap-1.5 hover:text-brand", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { size: 12, className: "text-gray-400" }),
            " ",
            quote.company_email
          ] })
        ] })
      ] }),
      ((_b = quote.items) == null ? void 0 : _b.length) > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-5 py-3 border-b border-gray-50 flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold text-gray-800", children: "Détail des travaux" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-gray-400", children: [
            "(",
            quote.items.length,
            " poste",
            quote.items.length > 1 ? "s" : "",
            ")"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "divide-y divide-gray-50", children: quote.items.map((item, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-5 py-3 flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-800 truncate", children: item.name || "—" }),
            item.description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400 truncate", children: item.description })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right flex-shrink-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-gray-600", children: [
              Number(item.qty) || 1,
              " × ",
              Number(item.unit_price || 0).toLocaleString("fr-CA"),
              "$"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs font-semibold text-gray-800", children: [
              ((Number(item.qty) || 1) * (Number(item.unit_price) || 0)).toLocaleString("fr-CA"),
              "$"
            ] })
          ] })
        ] }, item.id || i)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-5 py-3 bg-gray-50 border-t border-gray-100 space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm text-gray-600", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Sous-total" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              subtotal.toLocaleString("fr-CA", { minimumFractionDigits: 2 }),
              "$"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-xs text-gray-400", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              "TPS (",
              quote.tps_pct || 5,
              "%)"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              tps.toLocaleString("fr-CA", { minimumFractionDigits: 2 }),
              "$"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-xs text-gray-400", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              "TVQ (",
              quote.tvq_pct || 9.975,
              "%)"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              tvq.toLocaleString("fr-CA", { minimumFractionDigits: 2 }),
              "$"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm font-bold text-gray-900 pt-1 border-t border-gray-200", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Total" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-brand", children: [
              total.toLocaleString("fr-CA", { minimumFractionDigits: 2 }),
              "$"
            ] })
          ] })
        ] })
      ] }),
      quote.description && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white rounded-2xl shadow-sm border border-gray-100 p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold text-gray-800 mb-2", children: "Notes" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 whitespace-pre-wrap", children: quote.description })
      ] }),
      canSign && !confirm2 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white rounded-2xl shadow-sm border border-gray-100 p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold text-gray-800 mb-1", children: "Votre réponse" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400 mb-4", children: "En acceptant, vous confirmez avoir lu et compris les travaux décrits ci-dessus." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              className: "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm text-white shadow-sm transition-opacity hover:opacity-90",
              style: { background: "#F26522" },
              onClick: () => setConfirm(true),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { size: 16 }),
                " Accepter la soumission"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              className: "flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors",
              onClick: handleDecline,
              disabled: declining,
              children: [
                declining ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 14, className: "animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(XCircle, { size: 14 }),
                "Refuser"
              ]
            }
          )
        ] })
      ] }),
      canSign && confirm2 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-green-50 rounded-2xl border border-green-200 p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold text-green-800 mb-1", children: "Confirmer l'acceptation" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-green-700 mb-4", children: [
          "En cliquant sur « Confirmer », vous acceptez cette soumission de",
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
            total.toLocaleString("fr-CA", { minimumFractionDigits: 2 }),
            "$"
          ] }),
          "."
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              className: "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm text-white shadow-sm",
              style: { background: "#22c55e" },
              onClick: handleSign,
              disabled: signing,
              children: [
                signing ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 14, className: "animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { size: 14 }),
                "Confirmer l'acceptation"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              className: "px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-white",
              onClick: () => setConfirm(false),
              children: "Annuler"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-center text-xs text-gray-300 pb-4", children: "Propulsé par MONFLUX — logiciel de gestion pour entrepreneurs en construction" })
    ] })
  ] });
}
const SL = { draft: "Brouillon", sent: "Envoyée", viewed: "Vue", partial: "Partielle", paid: "Payée", overdue: "En retard", cancelled: "Annulée" };
const SB = { draft: "#9ca3af", sent: "#3b82f6", viewed: "#f59e0b", partial: "#F26522", paid: "#22c55e", overdue: "#ef4444", cancelled: "#9ca3af" };
function InvoicePublic() {
  var _a;
  const { token } = useParams();
  const [invoice, setInvoice] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState(null);
  reactExports.useEffect(() => {
    http.get(`/public/invoice/${token}`).then(({ data }) => setInvoice(data)).catch((e) => {
      var _a2, _b;
      return setError(((_b = (_a2 = e.response) == null ? void 0 : _a2.data) == null ? void 0 : _b.error) || "Facture introuvable");
    }).finally(() => setLoading(false));
  }, [token]);
  if (loading) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 text-gray-500", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 20, className: "animate-spin" }),
    "Chargement de votre facture…"
  ] }) });
  if (error) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(AlertTriangle, { size: 40, className: "text-orange-400 mx-auto mb-4" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-lg font-semibold text-gray-800 mb-2", children: "Facture introuvable" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500", children: error })
  ] }) });
  const isOverdue = invoice.status === "overdue" || invoice.due_date && new Date(invoice.due_date) < /* @__PURE__ */ new Date() && !["paid", "cancelled"].includes(invoice.status);
  const isPaid = invoice.status === "paid";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-gray-50", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-white border-b border-gray-100 px-4 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-2xl mx-auto flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-7 h-7 rounded-lg flex items-center justify-center", style: { background: "#F26522" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-white font-bold text-xs", children: "M" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-gray-900 text-sm", children: "MONFLUX" })
      ] }),
      invoice.company_name && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500", children: invoice.company_name })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-2xl mx-auto p-4 space-y-4", children: [
      isPaid && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { size: 20, className: "text-green-500 flex-shrink-0" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-green-800", children: "Facture payée" }),
          invoice.paid_at && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-green-700", children: [
            "Reçu le ",
            new Date(invoice.paid_at).toLocaleDateString("fr-CA", { day: "numeric", month: "long", year: "numeric" })
          ] })
        ] })
      ] }),
      isOverdue && !isPaid && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertTriangle, { size: 16, className: "text-red-500" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-red-700 font-medium", children: [
          "Cette facture est en retard — échéance ",
          invoice.due_date ? new Date(invoice.due_date).toLocaleDateString("fr-CA") : "dépassée",
          "."
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white rounded-2xl shadow-sm p-5 border border-gray-100", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3 mb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Receipt, { size: 16, className: "text-orange-500" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-lg font-bold text-gray-900", children: [
                "Facture ",
                invoice.number
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2 mt-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs px-2 py-0.5 rounded-full font-medium", style: { background: SB[invoice.status] + "22", color: SB[invoice.status] }, children: SL[invoice.status] || invoice.status }),
              invoice.due_date && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-gray-400", children: [
                "Échéance : ",
                new Date(invoice.due_date).toLocaleDateString("fr-CA")
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-2xl font-bold text-gray-900", children: [
              Number(invoice.total).toLocaleString("fr-CA", { minimumFractionDigits: 2 }),
              "$"
            ] }),
            invoice.amount_due > 0 && !isPaid && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-orange-600 font-medium", children: [
              "Solde dû : ",
              Number(invoice.amount_due).toLocaleString("fr-CA", { minimumFractionDigits: 2 }),
              "$"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-x-6 gap-y-1 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400 mb-0.5", children: "Facturé à" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-gray-800", children: invoice.client_name }),
            invoice.client_address && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500", children: invoice.client_address })
          ] }),
          invoice.company_name && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400 mb-0.5", children: "De" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-gray-800", children: invoice.company_name }),
            (invoice.company_phone || invoice.company_email) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 mt-0.5", children: [
              invoice.company_phone && /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: `tel:${invoice.company_phone}`, className: "text-xs text-gray-500 flex items-center gap-1 hover:text-brand", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { size: 10 }),
                invoice.company_phone
              ] }),
              invoice.company_email && /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: `mailto:${invoice.company_email}`, className: "text-xs text-gray-500 flex items-center gap-1 hover:text-brand", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { size: 10 }),
                invoice.company_email
              ] })
            ] })
          ] })
        ] })
      ] }),
      ((_a = invoice.items) == null ? void 0 : _a.length) > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-5 py-3 border-b border-gray-50", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold text-gray-800", children: "Détail" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "divide-y divide-gray-50", children: invoice.items.map((item, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-5 py-3 flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 min-w-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-800", children: item.description || "—" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right flex-shrink-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-gray-500", children: [
              Number(item.qty) || 1,
              " × ",
              Number(item.unit_price || 0).toLocaleString("fr-CA"),
              "$"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-semibold text-gray-800", children: [
              ((Number(item.qty) || 1) * (Number(item.unit_price) || 0)).toLocaleString("fr-CA"),
              "$"
            ] })
          ] })
        ] }, item.id || i)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-5 py-3 bg-gray-50 border-t border-gray-100 space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm text-gray-600", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Sous-total" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              Number(invoice.subtotal || 0).toLocaleString("fr-CA", { minimumFractionDigits: 2 }),
              "$"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-xs text-gray-400", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              "TPS (",
              invoice.tps_pct || 5,
              "%)"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              Number(invoice.tps_amount || 0).toLocaleString("fr-CA", { minimumFractionDigits: 2 }),
              "$"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-xs text-gray-400", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              "TVQ (",
              invoice.tvq_pct || 9.975,
              "%)"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              Number(invoice.tvq_amount || 0).toLocaleString("fr-CA", { minimumFractionDigits: 2 }),
              "$"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-base font-bold text-gray-900 pt-1 border-t border-gray-200", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Total" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { color: "#F26522" }, children: [
              Number(invoice.total || 0).toLocaleString("fr-CA", { minimumFractionDigits: 2 }),
              "$"
            ] })
          ] }),
          invoice.amount_due > 0 && !isPaid && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm font-semibold text-orange-600 pt-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Solde dû" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              Number(invoice.amount_due).toLocaleString("fr-CA", { minimumFractionDigits: 2 }),
              "$"
            ] })
          ] })
        ] })
      ] }),
      !isPaid && invoice.amount_due > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white rounded-2xl shadow-sm border border-gray-100 p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { size: 14, className: "text-brand" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold text-gray-800", children: "Informations de paiement" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600", children: "Pour effectuer votre paiement ou pour toute question concernant cette facture, veuillez contacter votre entrepreneur directement." }),
        invoice.company_phone && /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: `tel:${invoice.company_phone}`, className: "mt-3 inline-flex items-center gap-2 btn-primary text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { size: 14 }),
          " Appeler ",
          invoice.company_name || "l'entrepreneur"
        ] })
      ] }),
      invoice.notes && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white rounded-2xl shadow-sm border border-gray-100 p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold text-gray-800 mb-2", children: "Notes" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 whitespace-pre-wrap", children: invoice.notes })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-center text-xs text-gray-300 pb-4", children: "Propulsé par MONFLUX — logiciel de gestion pour entrepreneurs en construction" })
    ] })
  ] });
}
const api$2 = axios.create({ baseURL: "http://localhost:5000/api".replace(/\/api$/, "") + "/api" });
function QuittancePublic() {
  const { token } = useParams();
  const [q2, setQ] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState(null);
  const [signerName, setSignerName] = reactExports.useState("");
  const [confirming, setConfirming] = reactExports.useState(false);
  const [signed, setSigned] = reactExports.useState(false);
  const [signing, setSigning] = reactExports.useState(false);
  reactExports.useEffect(() => {
    api$2.get(`/public/quittance/${token}`).then((r2) => {
      setQ(r2.data);
      setSignerName(r2.data.client_name || "");
    }).catch(() => setError("Quittance introuvable ou lien invalide.")).finally(() => setLoading(false));
  }, [token]);
  const handleSign = async () => {
    var _a, _b;
    setSigning(true);
    try {
      await api$2.post(`/public/quittance/${token}/sign`, { signer_name: signerName });
      setSigned(true);
    } catch (err) {
      alert(((_b = (_a = err.response) == null ? void 0 : _a.data) == null ? void 0 : _b.error) || "Erreur lors de la signature.");
    } finally {
      setSigning(false);
    }
  };
  if (loading) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 24, className: "animate-spin text-gray-400" }) });
  if (error) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50 p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card max-w-md w-full text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { size: 32, className: "text-red-400 mx-auto mb-3" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-700", children: error })
  ] }) });
  const isSigned = signed || (q2 == null ? void 0 : q2.status) === "signed";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-gray-50", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-7 h-7 rounded-lg flex items-center justify-center", style: { background: "#F26522" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-white font-bold text-xs", children: "M" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-gray-900 text-sm", children: "MONFLUX" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-gray-400", children: "Document officiel" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-2xl mx-auto px-4 py-8", children: [
      isSigned && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card text-center py-10 mb-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle2, { size: 32, className: "text-green-500" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-bold text-gray-900 mb-2", children: "Quittance signée" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-500 text-sm", children: (q2 == null ? void 0 : q2.signed_at) ? `Signée le ${new Date(q2.signed_at).toLocaleDateString("fr-CA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}` : "Votre signature a été enregistrée avec succès." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400 mt-3", children: "Merci pour votre confiance — et bonne continuation!" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card mb-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pb-4 border-b border-gray-100 mb-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-bold text-gray-900", children: q2 == null ? void 0 : q2.company_name }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-3 mt-2 text-xs text-gray-400", children: [
            (q2 == null ? void 0 : q2.company_address) && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { size: 11 }),
              q2.company_address
            ] }),
            (q2 == null ? void 0 : q2.company_phone) && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { size: 11 }),
              q2.company_phone
            ] }),
            (q2 == null ? void 0 : q2.company_email) && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { size: 11 }),
              q2.company_email
            ] }),
            (q2 == null ? void 0 : q2.company_website) && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Globe, { size: 11 }),
              q2.company_website
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center mb-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "inline-flex items-center gap-2 bg-brand/10 text-brand px-4 py-1.5 rounded-full text-sm font-semibold mb-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { size: 14 }),
            " QUITTANCE FINALE"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400", children: (/* @__PURE__ */ new Date()).toLocaleDateString("fr-CA", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) })
        ] }),
        ((q2 == null ? void 0 : q2.project_name) || (q2 == null ? void 0 : q2.project_address)) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-gray-50 rounded-xl p-4 mb-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2", children: "Projet concerné" }),
          (q2 == null ? void 0 : q2.project_name) && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-gray-900", children: q2.project_name }),
          (q2 == null ? void 0 : q2.project_address) && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-gray-400 flex items-center gap-1 mt-0.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { size: 11 }),
            q2.project_address
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "prose prose-sm text-gray-700 text-sm leading-relaxed space-y-3 mb-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
            "Je soussigné(e), ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: (q2 == null ? void 0 : q2.client_name) || "_______________" }),
            ", certifie avoir reçu et accepté les travaux réalisés par ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: q2 == null ? void 0 : q2.company_name }),
            " à ma pleine et entière satisfaction."
          ] }),
          (q2 == null ? void 0 : q2.project_description) && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("em", { children: "Description des travaux :" }),
            " ",
            q2.project_description
          ] }),
          (q2 == null ? void 0 : q2.amount_paid) > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
            "Je confirme avoir versé la somme totale de ",
            /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
              Number(q2.amount_paid).toLocaleString("fr-CA"),
              " $"
            ] }),
            " en règlement complet de ces travaux."
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Par la présente, je déclare que tous les travaux ont été réalisés conformément au contrat, sans malfaçon apparente, et que je n'ai aucune réclamation à formuler à ce jour." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
            "J'autorise également ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: q2 == null ? void 0 : q2.company_name }),
            " à mentionner ce projet dans son portfolio de réalisations, sauf avis contraire explicite."
          ] }),
          (q2 == null ? void 0 : q2.notes) && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "bg-orange-50 border border-orange-100 rounded-lg px-3 py-2 text-xs text-orange-700", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Note :" }),
            " ",
            q2.notes
          ] })
        ] }),
        !isSigned ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-t border-gray-100 pt-5", children: !confirming ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-700 mb-2", children: "Votre nom complet" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              className: "input mb-3",
              placeholder: "Prénom Nom",
              value: signerName,
              onChange: (e) => setSignerName(e.target.value)
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400 mb-4", children: "En signant, vous confirmez avoir lu et accepté le contenu de cette quittance." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              className: "btn-primary w-full py-3 text-sm",
              onClick: () => setConfirming(true),
              disabled: !signerName.trim(),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(PenLine, { size: 14 }),
                " Signer cette quittance"
              ]
            }
          )
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-orange-50 border border-orange-200 rounded-xl p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-orange-800 mb-2", children: "Confirmer la signature" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-orange-700 mb-4", children: [
            "Vous allez signer en tant que ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: signerName }),
            ". Cette action est définitive et sera horodatée."
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "btn-secondary flex-1", onClick: () => setConfirming(false), children: "Annuler" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "btn-primary flex-1 py-2", onClick: handleSign, disabled: signing, children: [
              signing ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 13, className: "animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle2, { size: 13 }),
              "Confirmer la signature"
            ] })
          ] })
        ] }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-gray-100 pt-4 flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle2, { size: 18, className: "text-green-500 flex-shrink-0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-medium text-gray-800", children: [
              "Signé par ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: q2 == null ? void 0 : q2.client_name })
            ] }),
            (q2 == null ? void 0 : q2.signed_at) && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400", children: new Date(q2.signed_at).toLocaleDateString("fr-CA", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-center text-xs text-gray-300", children: "Document généré par MONFLUX · Gestion de construction au Québec" })
    ] })
  ] });
}
const api$1 = axios.create({ baseURL: "http://localhost:5000/api".replace(/\/api$/, "") + "/api" });
const STATUS_LABEL = {
  active: "En cours",
  completed: "Terminé",
  on_hold: "En pause",
  cancelled: "Annulé",
  pending: "À démarrer",
  planning: "En planification"
};
const STATUS_COLOR = {
  active: "#22c55e",
  completed: "#3b82f6",
  on_hold: "#f59e0b",
  cancelled: "#9ca3af",
  pending: "#a855f7",
  planning: "#F26522"
};
const PHASE_STATUS_LABEL = {
  not_started: "À venir",
  in_progress: "En cours",
  completed: "Terminé",
  on_hold: "En pause"
};
const PHASE_STATUS_COLOR = {
  not_started: "#d1d5db",
  in_progress: "#F26522",
  completed: "#22c55e",
  on_hold: "#f59e0b"
};
function ProgressCircle({ pct, size = 100, stroke = 8, color = "#F26522" }) {
  const r2 = (size - stroke) / 2;
  const circ = 2 * Math.PI * r2;
  const offset = circ - pct / 100 * circ;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: size, height: size, viewBox: `0 0 ${size} ${size}`, className: "rotate-[-90deg]", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: size / 2, cy: size / 2, r: r2, fill: "none", stroke: "#f3f4f6", strokeWidth: stroke }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "circle",
      {
        cx: size / 2,
        cy: size / 2,
        r: r2,
        fill: "none",
        stroke: color,
        strokeWidth: stroke,
        strokeDasharray: circ,
        strokeDashoffset: offset,
        strokeLinecap: "round",
        style: { transition: "stroke-dashoffset 0.8s ease" }
      }
    )
  ] });
}
function TimelineBar({ start, end }) {
  const now = Date.now();
  const s = start ? new Date(start).getTime() : null;
  const e = end ? new Date(end).getTime() : null;
  if (!s || !e) return null;
  const total = e - s;
  const elapsed = Math.max(0, Math.min(total, now - s));
  const pct = Math.round(elapsed / total * 100);
  const isLate = now > e;
  const fmt = (d) => new Date(d).toLocaleDateString("fr-CA", { day: "numeric", month: "short" });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-xs text-gray-400 mb-1.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: fmt(start) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: isLate ? "text-red-500 font-medium" : "text-gray-400", children: fmt(end) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative h-2 bg-gray-100 rounded-full overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: `h-full rounded-full transition-all duration-700 ${isLate ? "bg-red-400" : "bg-brand"}`,
          style: { width: `${Math.min(pct, 100)}%` }
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: "absolute top-0 bottom-0 w-0.5 bg-gray-600",
          style: { left: `${Math.min(pct, 99)}%` }
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-xs text-gray-400 mt-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Début" }),
      isLate ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-400 font-medium", children: "Dépassement prévu" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
        pct,
        "% du temps écoulé"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Fin prévue" })
    ] })
  ] });
}
function ProjectPortal() {
  var _a, _b, _c;
  const { token } = useParams();
  const [data, setData] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState(null);
  const [feedback, setFeedback] = reactExports.useState("");
  const [authorName, setAuthorName] = reactExports.useState("");
  const [sendingFeedback, setSendingFeedback] = reactExports.useState(false);
  const [feedbackSent, setFeedbackSent] = reactExports.useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = reactExports.useState(false);
  reactExports.useEffect(() => {
    api$1.get(`/public/portal/${token}`).then((r2) => setData(r2.data)).catch(() => setError("Portail introuvable ou lien invalide.")).finally(() => setLoading(false));
  }, [token]);
  const sendFeedback = async () => {
    if (!feedback.trim()) return;
    setSendingFeedback(true);
    try {
      await api$1.post(`/public/portal/${token}/feedback`, { message: feedback, author_name: authorName });
      setFeedbackSent(true);
      setFeedback("");
      setShowFeedbackForm(false);
    } catch {
      alert("Erreur lors de l'envoi.");
    } finally {
      setSendingFeedback(false);
    }
  };
  if (loading) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 24, className: "animate-spin text-gray-400" }) });
  if (error) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50 p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white rounded-2xl shadow p-8 max-w-sm w-full text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { size: 32, className: "text-red-400 mx-auto mb-3" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-700 font-medium", children: error }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400 mt-2", children: "Demandez le lien à votre entrepreneur." })
  ] }) });
  const progress = data.progress_pct || 0;
  const statusColor = STATUS_COLOR[data.status] || "#9ca3af";
  const statusLabel = STATUS_LABEL[data.status] || data.status;
  const completedPhases = ((_a = data.phases) == null ? void 0 : _a.filter((p2) => p2.status === "completed").length) || 0;
  const totalPhases = ((_b = data.phases) == null ? void 0 : _b.length) || 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-gray-50", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-white border-b border-gray-100 sticky top-0 z-10", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-lg mx-auto px-4 py-3 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0", style: { background: "#F26522" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-white font-bold text-xs", children: "M" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold text-gray-900 leading-none", children: "MONFLUX" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-gray-400", children: "Suivi de chantier" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
          style: { background: `${statusColor}18`, color: statusColor },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-1.5 h-1.5 rounded-full", style: { background: statusColor } }),
            statusLabel
          ]
        }
      )
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-lg mx-auto px-4 py-6 space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white rounded-2xl shadow-sm overflow-hidden", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2", style: { background: `linear-gradient(90deg, #F26522, #ff8c42)` } }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-bold text-gray-900 leading-tight mb-1", children: data.name }),
          data.description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-500 mb-3 line-clamp-2", children: data.description }),
          (data.address || data.city) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 text-sm text-gray-400 mb-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { size: 13, className: "flex-shrink-0" }),
            [data.address, data.city].filter(Boolean).join(", ")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex-shrink-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ProgressCircle, { pct: progress, size: 88, stroke: 8, color: statusColor }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-lg font-bold text-gray-900", children: [
                  progress,
                  "%"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-gray-400 leading-none", children: "complété" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 space-y-2", children: [
              (data.start_date || data.end_date) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm text-gray-500", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { size: 13, className: "text-gray-300 flex-shrink-0" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                  data.start_date ? new Date(data.start_date).toLocaleDateString("fr-CA", { day: "numeric", month: "short", year: "numeric" }) : "?",
                  data.end_date && ` → ${new Date(data.end_date).toLocaleDateString("fr-CA", { day: "numeric", month: "short", year: "numeric" })}`
                ] })
              ] }),
              totalPhases > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm text-gray-500", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle2, { size: 13, className: "text-green-400 flex-shrink-0" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                  completedPhases,
                  " / ",
                  totalPhases,
                  " phase",
                  totalPhases > 1 ? "s" : "",
                  " terminée",
                  completedPhases > 1 ? "s" : ""
                ] })
              ] }),
              data.end_date && data.status !== "completed" && (() => {
                const daysLeft = Math.ceil((new Date(data.end_date) - Date.now()) / 864e5);
                return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `flex items-center gap-2 text-sm font-medium ${daysLeft < 0 ? "text-red-500" : daysLeft <= 7 ? "text-orange-500" : "text-gray-500"}`, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { size: 13, className: "flex-shrink-0" }),
                  daysLeft < 0 ? `${Math.abs(daysLeft)}j de retard` : daysLeft === 0 ? "Fin prévue aujourd'hui" : `${daysLeft}j restant${daysLeft > 1 ? "s" : ""}`
                ] });
              })()
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TimelineBar, { start: data.start_date, end: data.end_date })
        ] })
      ] }),
      ((_c = data.phases) == null ? void 0 : _c.length) > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white rounded-2xl shadow-sm p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold text-gray-700 mb-3", children: "Étapes du chantier" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: data.phases.map((phase, idx) => {
          const pct = phase.progress_pct || 0;
          const phColor = PHASE_STATUS_COLOR[phase.status] || "#d1d5db";
          const isCompleted = phase.status === "completed";
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `flex items-center gap-3 ${isCompleted ? "opacity-70" : ""}`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold",
                style: { background: `${phColor}20`, color: phColor },
                children: isCompleted ? /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle2, { size: 14 }) : idx + 1
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-sm font-medium truncate ${isCompleted ? "line-through text-gray-400" : "text-gray-800"}`, children: phase.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-gray-400 ml-2 flex-shrink-0", children: [
                  pct,
                  "%"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-1.5 bg-gray-100 rounded-full overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  className: "h-full rounded-full transition-all duration-500",
                  style: { width: `${pct}%`, background: phColor }
                }
              ) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "span",
              {
                className: "text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0",
                style: { background: `${phColor}18`, color: phColor },
                children: PHASE_STATUS_LABEL[phase.status] || phase.status
              }
            )
          ] }, idx);
        }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-white rounded-2xl shadow-sm p-5", children: feedbackSent ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle2, { size: 18, className: "text-green-500 flex-shrink-0" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-700", children: "Votre message a été transmis à l'entrepreneur." })
      ] }) : showFeedbackForm ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold text-gray-700 mb-3", children: "Envoyer un message" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            className: "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/30 mb-2",
            placeholder: "Votre nom",
            value: authorName,
            onChange: (e) => setAuthorName(e.target.value)
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "textarea",
          {
            className: "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/30 resize-none mb-3",
            rows: 3,
            placeholder: "Votre message à l'entrepreneur...",
            value: feedback,
            onChange: (e) => setFeedback(e.target.value)
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "flex-1 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50", onClick: () => setShowFeedbackForm(false), children: "Annuler" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              className: "flex-1 py-2 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-1.5 disabled:opacity-50",
              style: { background: "#F26522" },
              onClick: sendFeedback,
              disabled: sendingFeedback || !feedback.trim(),
              children: [
                sendingFeedback ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 13, className: "animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { size: 13 }),
                "Envoyer"
              ]
            }
          )
        ] })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          className: "w-full flex items-center justify-between text-sm text-gray-500 hover:text-gray-700 transition-colors",
          onClick: () => setShowFeedbackForm(true),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Envoyer un message à l'entrepreneur" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { size: 15, className: "text-gray-300" })
          ]
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white rounded-2xl shadow-sm p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400 uppercase tracking-wide font-semibold mb-3", children: "Votre entrepreneur" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-base font-bold text-gray-900 mb-2", children: data.company_name }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          data.company_phone && /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: `tel:${data.company_phone}`, className: "flex items-center gap-2.5 text-sm text-gray-600 hover:text-brand", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { size: 14, className: "text-gray-300 flex-shrink-0" }),
            data.company_phone
          ] }),
          data.company_email && /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: `mailto:${data.company_email}`, className: "flex items-center gap-2.5 text-sm text-gray-600 hover:text-brand", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { size: 14, className: "text-gray-300 flex-shrink-0" }),
            data.company_email
          ] }),
          data.company_website && /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: data.company_website, target: "_blank", rel: "noopener noreferrer", className: "flex items-center gap-2.5 text-sm text-gray-600 hover:text-brand", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Globe, { size: 14, className: "text-gray-300 flex-shrink-0" }),
            data.company_website
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-center text-xs text-gray-300 pb-4", children: "Suivi de chantier propulsé par MONFLUX · Gestion de construction au Québec" })
    ] })
  ] });
}
const api = axios.create({ baseURL: "http://localhost:5000/api".replace(/\/api$/, "") + "/api" });
function ChangeOrderPublic() {
  const { token } = useParams();
  const [co, setCo] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState(null);
  const [signerName, setSignerName] = reactExports.useState("");
  const [confirming, setConfirming] = reactExports.useState(false);
  const [processing, setProcessing] = reactExports.useState(false);
  const [result, setResult] = reactExports.useState(null);
  reactExports.useEffect(() => {
    api.get(`/public/change-order/${token}`).then((r2) => {
      setCo(r2.data);
      setSignerName(r2.data.signer_name || "");
    }).catch(() => setError("Demande introuvable ou lien invalide.")).finally(() => setLoading(false));
  }, [token]);
  const handleApprove = async () => {
    var _a, _b;
    setProcessing(true);
    try {
      await api.post(`/public/change-order/${token}/approve`, { signer_name: signerName });
      setResult("approved");
    } catch (err) {
      alert(((_b = (_a = err.response) == null ? void 0 : _a.data) == null ? void 0 : _b.error) || "Erreur lors de l'approbation.");
    } finally {
      setProcessing(false);
    }
  };
  const handleReject = async () => {
    var _a, _b;
    if (!confirm("Êtes-vous sûr de vouloir refuser cette demande de modification?")) return;
    setProcessing(true);
    try {
      await api.post(`/public/change-order/${token}/reject`);
      setResult("rejected");
    } catch (err) {
      alert(((_b = (_a = err.response) == null ? void 0 : _a.data) == null ? void 0 : _b.error) || "Erreur.");
    } finally {
      setProcessing(false);
    }
  };
  if (loading) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 24, className: "animate-spin text-gray-400" }) });
  if (error) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50 p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white rounded-2xl shadow p-8 max-w-sm w-full text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { size: 32, className: "text-red-400 mx-auto mb-3" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-700 font-medium", children: error })
  ] }) });
  const isApproved = result === "approved" || (co == null ? void 0 : co.status) === "approved" || !!(co == null ? void 0 : co.approved_at);
  const isRejected = result === "rejected" || (co == null ? void 0 : co.status) === "rejected";
  const isFinal = isApproved || isRejected;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-gray-50", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-7 h-7 rounded-lg flex items-center justify-center", style: { background: "#F26522" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-white font-bold text-xs", children: "M" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-gray-900 text-sm", children: "MONFLUX" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-gray-400", children: "Demande de modification" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-2xl mx-auto px-4 py-8", children: [
      isApproved && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white rounded-2xl shadow-sm p-8 mb-6 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle2, { size: 32, className: "text-green-500" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-bold text-gray-900 mb-2", children: "Demande approuvée" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-500 text-sm", children: (co == null ? void 0 : co.approved_at) || (co == null ? void 0 : co.signed_at) ? `Approuvée le ${new Date(co.approved_at || co.signed_at).toLocaleDateString("fr-CA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}` : "Votre approbation a été enregistrée." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400 mt-3", children: "L'entrepreneur a été informé. Merci!" })
      ] }),
      isRejected && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white rounded-2xl shadow-sm p-8 mb-6 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(XCircle, { size: 32, className: "text-red-400" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-bold text-gray-900 mb-2", children: "Demande refusée" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-500 text-sm", children: "Vous avez refusé cette demande de modification." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400 mt-3", children: "L'entrepreneur sera contacté pour en discuter." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white rounded-2xl shadow-sm overflow-hidden mb-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-1.5", style: { background: "linear-gradient(90deg, #F26522, #ff8c42)" } }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pb-4 border-b border-gray-100 mb-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold text-gray-900 text-lg", children: co == null ? void 0 : co.company_name }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-3 mt-1.5 text-xs text-gray-400", children: [
              (co == null ? void 0 : co.company_address) && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { size: 11 }),
                co.company_address
              ] }),
              (co == null ? void 0 : co.company_phone) && /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: `tel:${co.company_phone}`, className: "flex items-center gap-1 hover:text-brand", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { size: 11 }),
                co.company_phone
              ] }),
              (co == null ? void 0 : co.company_email) && /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: `mailto:${co.company_email}`, className: "flex items-center gap-1 hover:text-brand", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { size: 11 }),
                co.company_email
              ] }),
              (co == null ? void 0 : co.company_website) && /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: co.company_website, target: "_blank", rel: "noopener noreferrer", className: "flex items-center gap-1 hover:text-brand", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Globe, { size: 11 }),
                co.company_website
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center mb-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "inline-flex items-center gap-2 bg-brand/10 text-brand px-4 py-1.5 rounded-full text-sm font-semibold mb-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(FileEdit, { size: 14 }),
              " DEMANDE DE MODIFICATION"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400", children: new Date((co == null ? void 0 : co.created_at) || Date.now()).toLocaleDateString("fr-CA", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) })
          ] }),
          ((co == null ? void 0 : co.project_name) || (co == null ? void 0 : co.project_address)) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-gray-50 rounded-xl p-3.5 mb-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1", children: "Projet concerné" }),
            co.project_name && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-gray-900", children: co.project_name }),
            co.project_address && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-gray-400 flex items-center gap-1 mt-0.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { size: 11 }),
              co.project_address
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-bold text-gray-900 mb-2", children: co == null ? void 0 : co.title }),
            (co == null ? void 0 : co.description) && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 leading-relaxed whitespace-pre-line", children: co.description })
          ] }),
          (co == null ? void 0 : co.amount) > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-orange-50 border border-orange-100 rounded-xl p-4 mb-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { size: 16, className: "text-brand" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-semibold text-gray-700", children: "Montant supplémentaire" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xl font-bold text-brand", children: [
                Number(co.amount).toLocaleString("fr-CA"),
                " $"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400 mt-1.5", children: "Ce montant s'ajoute au contrat d'origine si vous approuvez." })
          ] }),
          (co == null ? void 0 : co.notes) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-gray-50 rounded-xl p-3 mb-5 text-xs text-gray-500", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Note :" }),
            " ",
            co.notes
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-600 leading-relaxed space-y-2 mb-5 border-t border-gray-100 pt-5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
            "En approuvant cette demande de modification, je ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: signerName || "_______________" }),
            ", autorise ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: co == null ? void 0 : co.company_name }),
            " à réaliser les travaux supplémentaires décrits ci-dessus,",
            (co == null ? void 0 : co.amount) > 0 && ` pour un montant additionnel de ${Number(co.amount).toLocaleString("fr-CA")} $,`,
            " et accepte d'en régler le montant selon les termes du contrat en vigueur."
          ] }) }),
          !isFinal && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-t border-gray-100 pt-5", children: !confirming ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-700 mb-2", children: "Votre nom complet" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                className: "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/30 mb-3",
                placeholder: "Prénom Nom",
                value: signerName,
                onChange: (e) => setSignerName(e.target.value)
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  className: "flex-1 py-3 rounded-xl border border-gray-200 text-sm text-red-500 font-medium hover:bg-red-50 transition-colors",
                  onClick: handleReject,
                  disabled: processing,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(XCircle, { size: 14, className: "inline mr-1.5" }),
                    "Refuser"
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  className: "flex-1 py-3 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-1.5 disabled:opacity-50",
                  style: { background: "#F26522" },
                  onClick: () => setConfirming(true),
                  disabled: !signerName.trim(),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(PenLine, { size: 14 }),
                    "Approuver"
                  ]
                }
              )
            ] })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-orange-50 border border-orange-200 rounded-xl p-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-orange-800 mb-1", children: "Confirmer l'approbation" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-orange-700 mb-4", children: [
              "Vous allez approuver en tant que ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: signerName }),
              ".",
              (co == null ? void 0 : co.amount) > 0 && ` Cela engage ${Number(co.amount).toLocaleString("fr-CA")} $ supplémentaires.`,
              " ",
              "Cette action est définitive."
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "flex-1 py-2 rounded-xl border border-orange-200 text-sm text-orange-700 hover:bg-orange-100", onClick: () => setConfirming(false), children: "Annuler" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  className: "flex-1 py-2 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-1.5 disabled:opacity-50",
                  style: { background: "#F26522" },
                  onClick: handleApprove,
                  disabled: processing,
                  children: [
                    processing ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 13, className: "animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle2, { size: 13 }),
                    "Confirmer"
                  ]
                }
              )
            ] })
          ] }) }),
          isApproved && ((co == null ? void 0 : co.approved_by) || (co == null ? void 0 : co.signer_name)) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-gray-100 pt-4 flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle2, { size: 18, className: "text-green-500 flex-shrink-0" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-medium text-gray-800", children: [
                "Approuvée par ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: co.approved_by || co.signer_name })
              ] }),
              (co.approved_at || co.signed_at) && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400", children: new Date(co.approved_at || co.signed_at).toLocaleDateString("fr-CA", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }) })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-center text-xs text-gray-300 pb-4", children: "Document généré par MONFLUX · Gestion de construction au Québec" })
    ] })
  ] });
}
const API_BASE = "http://localhost:5000/api".replace(/\/api$/, "") + "/api";
const SUGGESTIONS = [
  "Montre-moi les projets en retard",
  "Génère une estimation pour une rénovation de cuisine 200 pi²",
  "Résume les factures impayées",
  "Comment créer une soumission?"
];
function Chat() {
  const [conversations, setConversations] = reactExports.useState([]);
  const [activeConvId, setActiveConvId] = reactExports.useState(null);
  const [messages, setMessages] = reactExports.useState([]);
  const [input, setInput] = reactExports.useState("");
  const [loading, setLoading] = reactExports.useState(false);
  const bottomRef = reactExports.useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const autoSent = reactExports.useRef(false);
  const [usage, setUsage] = reactExports.useState(null);
  const [quotaHit, setQuotaHit] = reactExports.useState(false);
  const [buying, setBuying] = reactExports.useState(false);
  const [pendingImage, setPendingImage] = reactExports.useState(null);
  const [listening, setListening] = reactExports.useState(false);
  const recognitionRef = reactExports.useRef(null);
  const fileRef = reactExports.useRef(null);
  const SpeechRec = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
  const toggleVoice = () => {
    var _a;
    if (!SpeechRec) {
      alert("La saisie vocale n'est pas supportée par ce navigateur. Essayez Chrome.");
      return;
    }
    if (listening) {
      (_a = recognitionRef.current) == null ? void 0 : _a.stop();
      return;
    }
    const rec = new SpeechRec();
    rec.lang = "fr-CA";
    rec.interimResults = true;
    rec.continuous = false;
    let finalText = "";
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t2 = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t2;
        else interim += t2;
      }
      setInput((finalText + interim).trim());
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    setListening(true);
    rec.start();
  };
  const onPickImage = (e) => {
    var _a;
    const file = (_a = e.target.files) == null ? void 0 : _a[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Image trop volumineuse (max 5 Mo).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const base64 = String(dataUrl).split(",")[1];
      setPendingImage({ media_type: file.type, data: base64, url: dataUrl });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };
  const loadUsage = () => ai.usage().then(({ data }) => setUsage(data)).catch(() => {
  });
  reactExports.useEffect(() => {
    loadUsage();
  }, []);
  const buyCredits = async () => {
    setBuying(true);
    try {
      const { data } = await ai.buyCredits(100);
      setUsage(data);
      setQuotaHit(false);
    } catch {
    } finally {
      setBuying(false);
    }
  };
  reactExports.useEffect(() => {
    var _a;
    (_a = bottomRef.current) == null ? void 0 : _a.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);
  reactExports.useEffect(() => {
    const q2 = searchParams.get("q");
    if (q2 && !autoSent.current) {
      autoSent.current = true;
      setSearchParams({}, { replace: true });
      send(q2);
    }
  }, [searchParams]);
  const newConversation = async () => {
    const { data } = await ai.newConversation({ context_type: "general" });
    setActiveConvId(data.id);
    setMessages([]);
  };
  const send = async (text) => {
    const typed = text || input.trim();
    const img = pendingImage;
    if (!typed && !img || loading) return;
    setInput("");
    setPendingImage(null);
    let content;
    if (img) {
      content = [];
      if (typed) content.push({ type: "text", text: typed });
      content.push({ type: "image", source: { type: "base64", media_type: img.media_type, data: img.data } });
    } else {
      content = typed;
    }
    const userMsg = { role: "user", content };
    const next = [...messages, userMsg];
    setMessages(next);
    setLoading(true);
    const aiMsg = { role: "assistant", content: "" };
    setMessages((m2) => [...m2, aiMsg]);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: next, conversation_id: activeConvId })
      });
      if (!res.ok) {
        let data = {};
        try {
          data = await res.json();
        } catch {
        }
        if (res.status === 429 || data.code === "ai_quota_exceeded") {
          setQuotaHit(true);
          setMessages((m2) => {
            const c = [...m2];
            c[c.length - 1] = { ...c[c.length - 1], content: `⚠️ Vous avez atteint votre limite de ${data.limit ?? ""} requêtes IA ce mois-ci. Achetez des crédits supplémentaires pour continuer.` };
            return c;
          });
        } else {
          setMessages((m2) => {
            const c = [...m2];
            c[c.length - 1] = { ...c[c.length - 1], content: data.error || "Erreur. Réessayez." };
            return c;
          });
        }
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of dec.decode(value).split("\n").filter((l2) => l2.startsWith("data: "))) {
          const evt = JSON.parse(line.slice(6));
          if (evt.type === "text") {
            setMessages((m2) => {
              const c = [...m2];
              c[c.length - 1] = { ...c[c.length - 1], content: c[c.length - 1].content + evt.text };
              return c;
            });
          }
        }
      }
      loadUsage();
    } catch {
      setMessages((m2) => {
        const c = [...m2];
        c[c.length - 1] = { ...c[c.length - 1], content: "Erreur. Réessayez." };
        return c;
      });
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-full", style: { height: "calc(100vh - 48px)" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-48 border-r border-gray-100 flex flex-col p-3 gap-2 flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "btn-primary w-full justify-center text-xs py-1.5", onClick: newConversation, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 13 }),
      " Nouvelle conversation"
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 flex flex-col", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-5 py-3 border-b border-gray-100 flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { size: 15, className: "text-brand" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-semibold text-gray-900", children: "Assistant IA MONFLUX" }),
        usage && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-auto flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `text-xs ${usage.remaining <= 5 ? "text-red-500 font-medium" : "text-gray-400"}`, children: [
            Math.max(0, usage.remaining),
            " requête",
            usage.remaining > 1 ? "s" : "",
            " restante",
            usage.remaining > 1 ? "s" : "",
            " ce mois"
          ] }),
          usage.remaining <= 10 && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: buyCredits, disabled: buying, className: "text-xs px-2 py-1 rounded-lg bg-brand/10 text-brand font-medium hover:bg-brand/20", children: buying ? "…" : "+100 crédits" })
        ] })
      ] }),
      quotaHit && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-5 mt-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-amber-800", children: "Limite IA mensuelle atteinte" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-amber-600", children: "Achetez des crédits supplémentaires pour continuer à utiliser l'assistant." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: buyCredits, disabled: buying, className: "btn-primary text-xs py-1.5 flex-shrink-0", children: [
          buying ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 13, className: "animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 13 }),
          " Acheter 100 crédits"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3", children: [
        messages.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center h-full gap-4 text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-12 h-12 rounded-xl flex items-center justify-center", style: { background: "#F26522" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { size: 22, className: "text-white" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-gray-900", children: "Comment puis-je vous aider?" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-400 mt-1", children: "Posez une question ou essayez une suggestion" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-2 w-full max-w-lg mt-2", children: SUGGESTIONS.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              className: "text-left text-xs border border-gray-200 rounded-lg px-3 py-2.5 hover:border-brand hover:text-brand transition-colors",
              onClick: () => send(s),
              children: s
            },
            s
          )) })
        ] }),
        messages.map((m2, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `flex ${m2.role === "user" ? "justify-end" : "justify-start"} fade-in`, children: [
          m2.role === "assistant" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-0.5", style: { background: "#F26522" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-white text-xs font-bold", children: "M" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: m2.role === "user" ? "chat-bubble-user" : "chat-bubble-ai", children: Array.isArray(m2.content) ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: m2.content.map(
            (block, j) => {
              var _a;
              return block.type === "image" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                "img",
                {
                  src: `data:${block.source.media_type};base64,${block.source.data}`,
                  alt: "Photo",
                  className: "rounded-lg max-w-[220px] max-h-[220px] object-cover"
                },
                j
              ) : (_a = block.text) == null ? void 0 : _a.split("\n").map((l2, k2) => /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: k2 > 0 ? "mt-1" : "", children: l2 }, `${j}-${k2}`));
            }
          ) }) : m2.content ? m2.content.split("\n").map((l2, j) => /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: j > 0 ? "mt-1" : "", children: l2 }, j)) : /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex gap-1 py-0.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "typing-dot" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "typing-dot" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "typing-dot" })
          ] }) })
        ] }, i)),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: bottomRef })
      ] }),
      pendingImage && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-5 pt-3 flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: pendingImage.url, alt: "Aperçu", className: "w-16 h-16 rounded-lg object-cover border border-gray-200" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => setPendingImage(null),
              className: "absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gray-800 text-white flex items-center justify-center text-xs",
              title: "Retirer",
              children: "×"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-gray-400", children: "Photo prête à envoyer" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-5 py-3 border-t border-gray-100 flex gap-2 items-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { ref: fileRef, type: "file", accept: "image/*", capture: "environment", className: "hidden", onChange: onPickImage }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            className: "flex-shrink-0 w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-brand hover:border-brand transition-colors",
            onClick: () => {
              var _a;
              return (_a = fileRef.current) == null ? void 0 : _a.click();
            },
            title: "Joindre une photo",
            disabled: loading,
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(ImagePlus, { size: 16 })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            className: `flex-shrink-0 w-9 h-9 rounded-lg border flex items-center justify-center transition-colors ${listening ? "border-red-400 text-red-500 bg-red-50 animate-pulse" : "border-gray-200 text-gray-400 hover:text-brand hover:border-brand"}`,
            onClick: toggleVoice,
            title: listening ? "Arrêter" : "Dictée vocale",
            disabled: loading,
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Mic, { size: 16 })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            className: "input flex-1",
            placeholder: listening ? "Parlez…" : "Écrivez, dictez, ou joignez une photo…",
            value: input,
            onChange: (e) => setInput(e.target.value),
            onKeyDown: (e) => e.key === "Enter" && !e.shiftKey && send(),
            disabled: loading,
            autoFocus: true
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "btn-primary flex-shrink-0", onClick: () => send(), disabled: loading || !input.trim() && !pendingImage, children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 15, className: "animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { size: 15 }) })
      ] })
    ] })
  ] }) });
}
const scriptRel = "modulepreload";
const assetsURL = function(dep) {
  return "/" + dep;
};
const seen = {};
const __vitePreload = function preload(baseModule, deps, importerUrl) {
  let promise = Promise.resolve();
  if (deps && deps.length > 0) {
    document.getElementsByTagName("link");
    const cspNonceMeta = document.querySelector(
      "meta[property=csp-nonce]"
    );
    const cspNonce = (cspNonceMeta == null ? void 0 : cspNonceMeta.nonce) || (cspNonceMeta == null ? void 0 : cspNonceMeta.getAttribute("nonce"));
    promise = Promise.allSettled(
      deps.map((dep) => {
        dep = assetsURL(dep);
        if (dep in seen) return;
        seen[dep] = true;
        const isCss = dep.endsWith(".css");
        const cssSelector = isCss ? '[rel="stylesheet"]' : "";
        if (document.querySelector(`link[href="${dep}"]${cssSelector}`)) {
          return;
        }
        const link = document.createElement("link");
        link.rel = isCss ? "stylesheet" : scriptRel;
        if (!isCss) {
          link.as = "script";
        }
        link.crossOrigin = "";
        link.href = dep;
        if (cspNonce) {
          link.setAttribute("nonce", cspNonce);
        }
        document.head.appendChild(link);
        if (isCss) {
          return new Promise((res, rej) => {
            link.addEventListener("load", res);
            link.addEventListener(
              "error",
              () => rej(new Error(`Unable to preload CSS for ${dep}`))
            );
          });
        }
      })
    );
  }
  function handlePreloadError(err) {
    const e = new Event("vite:preloadError", {
      cancelable: true
    });
    e.payload = err;
    window.dispatchEvent(e);
    if (!e.defaultPrevented) {
      throw err;
    }
  }
  return promise.then((res) => {
    for (const item of res || []) {
      if (item.status !== "rejected") continue;
      handlePreloadError(item.reason);
    }
    return baseModule().catch(handlePreloadError);
  });
};
const LEAD_SOURCES = [
  { key: "soumissions_reno", label: "SoumissionsRenovations.ca", desc: "Scraping des leads publics sur le site (nécessite accord avec le site)" },
  { key: "facebook_ads", label: "Facebook Lead Ads", desc: "Leads depuis vos campagnes Meta (compte Business connecté requis)" },
  { key: "google_lsa", label: "Google Local Services Ads", desc: "Leads depuis Google LSA (compte connecté requis)" },
  { key: "kijiji", label: "Kijiji", desc: "Recherche de leads sur Kijiji (région et mots-clés configurés)" }
];
const FREQ_OPTIONS = [6, 12, 24, 48, 72];
function ProfileTab() {
  var _a, _b;
  const { user, company, plan, token, setAuth } = useAuthStore();
  const [form, setForm] = reactExports.useState({ name: (user == null ? void 0 : user.name) || "", phone: (user == null ? void 0 : user.phone) || "", language: (user == null ? void 0 : user.language) || "fr" });
  const [saving, setSaving] = reactExports.useState(false);
  const [saved, setSaved] = reactExports.useState(false);
  const f2 = (k2) => (e) => setForm((p2) => ({ ...p2, [k2]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await auth.update(form);
      setAuth({ token, user: { ...user, ...data }, company, plan });
      setSaved(true);
      setTimeout(() => setSaved(false), 2e3);
    } catch {
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: submit, className: "space-y-5 max-w-lg", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 mb-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold text-white flex-shrink-0", style: { background: "#F26522" }, children: (((_a = form.name) == null ? void 0 : _a[0]) || ((_b = user == null ? void 0 : user.email) == null ? void 0 : _b[0]) || "U").toUpperCase() }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-gray-900", children: form.name || (user == null ? void 0 : user.email) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-400", children: user == null ? void 0 : user.email })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "col-span-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Nom complet" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", value: form.name, onChange: f2("name"), placeholder: "Jean Tremblay" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Téléphone" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", value: form.phone, onChange: f2("phone"), placeholder: "514-555-1234" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Langue" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "input", value: form.language, onChange: f2("language"), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "fr", children: "Français" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "en", children: "English" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Adresse courriel" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input bg-gray-50", value: (user == null ? void 0 : user.email) || "", disabled: true }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400 mt-1", children: "L'adresse courriel ne peut pas être modifiée." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "submit", className: "btn-primary", disabled: saving, children: [
      saving ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 14, className: "animate-spin" }) : saved ? /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { size: 14 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { size: 14 }),
      saved ? "Enregistré!" : "Enregistrer"
    ] })
  ] });
}
function LeadSourcesTab() {
  const [config, setConfig] = reactExports.useState(null);
  const [saving, setSaving] = reactExports.useState({});
  reactExports.useEffect(() => {
    companies.get().then(({ data }) => setConfig(data.config)).catch(() => {
    });
  }, []);
  const toggleSource = async (key, enabled) => {
    setSaving((s) => ({ ...s, [key]: true }));
    try {
      await companies.updateLeadSource(key, { enabled });
      setConfig((c) => {
        var _a;
        return {
          ...c,
          lead_sources: { ...c.lead_sources, [key]: { ...((_a = c.lead_sources) == null ? void 0 : _a[key]) || {}, enabled } }
        };
      });
    } catch {
    } finally {
      setSaving((s) => ({ ...s, [key]: false }));
    }
  };
  const setFrequency = async (key, frequency_hours) => {
    await companies.updateLeadSource(key, { frequency_hours: Number(frequency_hours) });
    setConfig((c) => {
      var _a;
      return {
        ...c,
        lead_sources: { ...c.lead_sources, [key]: { ...((_a = c.lead_sources) == null ? void 0 : _a[key]) || {}, frequency_hours: Number(frequency_hours) } }
      };
    });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400 mb-4", children: "Activez les sources que vous souhaitez. MONFLUX scrape ou intègre ces sources à la fréquence choisie." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: LEAD_SOURCES.map(({ key, label, desc }) => {
      var _a;
      const src = ((_a = config == null ? void 0 : config.lead_sources) == null ? void 0 : _a[key]) || {};
      const isOn = !!src.enabled;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-4 py-3 border-b border-gray-50 last:border-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-800", children: label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400 mt-0.5", children: desc }),
          isOn && key !== "facebook_ads" && key !== "google_lsa" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mt-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs text-gray-500", children: "Fréquence :" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "select",
              {
                className: "input py-0.5 text-xs w-32",
                value: src.frequency_hours || 24,
                onChange: (e) => setFrequency(key, e.target.value),
                children: FREQ_OPTIONS.map((h) => /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: h, children: [
                  "Toutes les ",
                  h,
                  "h"
                ] }, h))
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => toggleSource(key, !isOn), disabled: saving[key], className: "flex-shrink-0 mt-0.5", children: saving[key] ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 22, className: "animate-spin text-gray-300" }) : isOn ? /* @__PURE__ */ jsxRuntimeExports.jsx(ToggleRight, { size: 28, className: "text-brand" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ToggleLeft, { size: 28, className: "text-gray-300" }) })
      ] }, key);
    }) })
  ] });
}
function CompanyTab() {
  const { company: storeCompany, token, user, plan, setAuth } = useAuthStore();
  const [form, setForm] = reactExports.useState(null);
  const [saving, setSaving] = reactExports.useState(false);
  const [saved, setSaved] = reactExports.useState(false);
  const f2 = (k2) => (e) => setForm((p2) => ({ ...p2, [k2]: e.target.value }));
  reactExports.useEffect(() => {
    companies.get().then(({ data }) => {
      var _a, _b, _c;
      return setForm({
        name: data.name || "",
        phone: data.phone || "",
        email: data.email || "",
        address: data.address || "",
        city: data.city || "",
        postal_code: data.postal_code || "",
        rbq_number: data.rbq_number || "",
        neq_number: data.neq_number || "",
        tps_number: data.tps_number || "",
        tvq_number: data.tvq_number || "",
        website: data.website || "",
        facebook: ((_a = data.social_links) == null ? void 0 : _a.facebook) || "",
        instagram: ((_b = data.social_links) == null ? void 0 : _b.instagram) || "",
        linkedin: ((_c = data.social_links) == null ? void 0 : _c.linkedin) || ""
      });
    }).catch(() => {
    });
  }, []);
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { facebook, instagram, linkedin, ...rest } = form;
      const payload = { ...rest, social_links: { facebook, instagram, linkedin } };
      await companies.update(payload);
      setAuth({ token, user, company: { ...storeCompany, ...rest }, plan });
      setSaved(true);
      setTimeout(() => setSaved(false), 2e3);
    } catch {
    } finally {
      setSaving(false);
    }
  };
  if (!form) return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-gray-400", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 14, className: "animate-spin" }),
    " Chargement…"
  ] });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: submit, className: "space-y-4 max-w-lg", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Nom de l'entreprise *" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", value: form.name, onChange: f2("name"), required: true, placeholder: "Constructions Tremblay inc." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Téléphone" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", value: form.phone, onChange: f2("phone"), placeholder: "514-555-1234" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Courriel entreprise" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", type: "email", value: form.email, onChange: f2("email"), placeholder: "info@constructionstremblay.ca" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Adresse" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", value: form.address, onChange: f2("address"), placeholder: "123 rue Principale" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Ville" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", value: form.city, onChange: f2("city"), placeholder: "Montréal" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Code postal" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", value: form.postal_code, onChange: f2("postal_code"), placeholder: "H1A 1A1" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Numéro RBQ" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", value: form.rbq_number, onChange: f2("rbq_number"), placeholder: "1234-5678-90" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400 mt-0.5", children: "Régie du bâtiment du Québec — affiché sur soumissions et contrats" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Numéro NEQ" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", value: form.neq_number, onChange: f2("neq_number"), placeholder: "1234567890" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400 mt-0.5", children: "Numéro d'entreprise du Québec" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Numéro TPS" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", value: form.tps_number, onChange: f2("tps_number"), placeholder: "123456789 RT0001" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400 mt-0.5", children: "Apparaît sur les factures PDF" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Numéro TVQ" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", value: form.tvq_number, onChange: f2("tvq_number"), placeholder: "1234567890 TQ0001" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Site web" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", value: form.website, onChange: f2("website"), placeholder: "https://constructions-tremblay.ca" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pt-2 border-t border-gray-100", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-gray-700 mb-3", children: "Médias sociaux" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Facebook" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", value: form.facebook, onChange: f2("facebook"), placeholder: "https://facebook.com/votreentreprise" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "Instagram" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", value: form.instagram, onChange: f2("instagram"), placeholder: "https://instagram.com/votreentreprise" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "label", children: "LinkedIn" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input", value: form.linkedin, onChange: f2("linkedin"), placeholder: "https://linkedin.com/company/votreentreprise" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "submit", className: "btn-primary", disabled: saving, children: [
      saving ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 14, className: "animate-spin" }) : saved ? /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { size: 14 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { size: 14 }),
      saved ? "Enregistré!" : "Enregistrer"
    ] })
  ] });
}
const ROLE_LABELS = {
  owner: "Propriétaire",
  chef_chantier: "Chef de chantier",
  technicien: "Technicien",
  sous_traitant: "Sous-traitant",
  client_readonly: "Client (lecture)"
};
const ROLE_COLORS = {
  owner: "bg-brand/10 text-brand",
  chef_chantier: "bg-blue-100 text-blue-700",
  technicien: "bg-green-100 text-green-700",
  sous_traitant: "bg-purple-100 text-purple-700",
  client_readonly: "bg-gray-100 text-gray-500"
};
const ASSIGNABLE_ROLES = ["chef_chantier", "technicien", "sous_traitant", "client_readonly"];
function TeamTab() {
  var _a;
  const { user } = useAuthStore();
  const [data, setData] = reactExports.useState({ members: [], invites: [] });
  const [loading, setLoading] = reactExports.useState(true);
  const [inviteEmail, setInviteEmail] = reactExports.useState("");
  const [inviteRole, setInviteRole] = reactExports.useState("technicien");
  const [inviting, setInviting] = reactExports.useState(false);
  const [inviteMsg, setInviteMsg] = reactExports.useState(null);
  const [removing, setRemoving] = reactExports.useState({});
  const isOwner = (_a = data.members.find((m2) => m2.email === (user == null ? void 0 : user.email))) == null ? void 0 : _a.is_owner;
  const load = () => members.list().then(({ data: d }) => setData(d)).catch(() => {
  }).finally(() => setLoading(false));
  reactExports.useEffect(() => {
    load();
  }, []);
  const invite = async (e) => {
    var _a2, _b;
    e.preventDefault();
    setInviting(true);
    setInviteMsg(null);
    try {
      const { data: res } = await members.invite({ email: inviteEmail, role: inviteRole });
      setInviteMsg({ ok: true, text: res.added ? `${res.user.name || inviteEmail} ajouté comme ${ROLE_LABELS[inviteRole]}.` : res.message });
      setInviteEmail("");
      load();
    } catch (err) {
      setInviteMsg({ ok: false, text: ((_b = (_a2 = err.response) == null ? void 0 : _a2.data) == null ? void 0 : _b.error) || "Erreur lors de l'invitation." });
    } finally {
      setInviting(false);
    }
  };
  const changeRole = async (memberId, role) => {
    var _a2, _b;
    try {
      await members.updateRole(memberId, role);
      setData((d) => ({ ...d, members: d.members.map((m2) => m2.id === memberId ? { ...m2, role } : m2) }));
    } catch (err) {
      alert(((_b = (_a2 = err.response) == null ? void 0 : _a2.data) == null ? void 0 : _b.error) || "Erreur");
    }
  };
  const removeMember = async (memberId, name) => {
    var _a2, _b;
    if (!confirm(`Retirer ${name} de l'équipe ?`)) return;
    setRemoving((r2) => ({ ...r2, [memberId]: true }));
    try {
      await members.remove(memberId);
      setData((d) => ({ ...d, members: d.members.filter((m2) => m2.id !== memberId) }));
    } catch (err) {
      alert(((_b = (_a2 = err.response) == null ? void 0 : _a2.data) == null ? void 0 : _b.error) || "Erreur");
    } finally {
      setRemoving((r2) => ({ ...r2, [memberId]: false }));
    }
  };
  const cancelInvite = async (inviteId) => {
    try {
      await members.cancelInvite(inviteId);
      setData((d) => ({ ...d, invites: d.invites.filter((i) => i.id !== inviteId) }));
    } catch {
    }
  };
  if (loading) return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-gray-400", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 14, className: "animate-spin" }),
    " Chargement…"
  ] });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { size: 15 }),
        " Membres (",
        data.members.length,
        ")"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: data.members.map((m2) => {
        var _a2;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 py-2.5 px-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0", style: { background: "#F26522" }, children: (((_a2 = m2.name) == null ? void 0 : _a2[0]) || m2.email[0]).toUpperCase() }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-900 truncate", children: m2.name || m2.email }),
            m2.name && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400 truncate", children: m2.email })
          ] }),
          m2.is_owner ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS.owner}`, children: ROLE_LABELS.owner }) : isOwner ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "select",
            {
              className: "input py-0.5 text-xs w-40",
              value: m2.role,
              onChange: (e) => changeRole(m2.id, e.target.value),
              children: ASSIGNABLE_ROLES.map((r2) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: r2, children: ROLE_LABELS[r2] }, r2))
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[m2.role] || ROLE_COLORS.technicien}`, children: ROLE_LABELS[m2.role] || m2.role }),
          isOwner && !m2.is_owner && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => removeMember(m2.id, m2.name || m2.email),
              disabled: removing[m2.id],
              className: "p-1.5 text-gray-300 hover:text-red-500 transition-colors rounded-lg",
              children: removing[m2.id] ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 14, className: "animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 14 })
            }
          )
        ] }, m2.id);
      }) })
    ] }),
    data.invites.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-gray-700 mb-3", children: "Invitations en attente" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: data.invites.map((inv) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 py-2 px-3 rounded-xl border border-dashed border-gray-200 bg-gray-50", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600", children: inv.email }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-gray-400", children: [
            ROLE_LABELS[inv.role] || inv.role,
            " · En attente de connexion"
          ] })
        ] }),
        isOwner && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => cancelInvite(inv.id), className: "text-xs text-gray-400 hover:text-red-500 transition-colors", children: "Annuler" })
      ] }, inv.id)) })
    ] }),
    isOwner && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-gray-100 pt-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(UserPlus, { size: 15 }),
        " Inviter un membre"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: invite, className: "flex gap-2 flex-wrap", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            className: "input flex-1 min-w-48",
            type: "email",
            placeholder: "courriel@exemple.com",
            value: inviteEmail,
            onChange: (e) => setInviteEmail(e.target.value),
            required: true
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("select", { className: "input w-44", value: inviteRole, onChange: (e) => setInviteRole(e.target.value), children: ASSIGNABLE_ROLES.map((r2) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: r2, children: ROLE_LABELS[r2] }, r2)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "submit", className: "btn-primary flex-shrink-0", disabled: inviting, children: [
          inviting ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 14, className: "animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(UserPlus, { size: 14 }),
          "Inviter"
        ] })
      ] }),
      inviteMsg && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-xs mt-2 ${inviteMsg.ok ? "text-green-600" : "text-red-500"}`, children: inviteMsg.text }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400 mt-2", children: "Si l'utilisateur a déjà un compte MONFLUX, il est ajouté immédiatement. Sinon, l'invitation s'active à sa première connexion." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-gray-100 pt-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs font-medium text-gray-500 mb-2 flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { size: 12 }),
        " Rôles disponibles"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-1.5", children: [
        ["chef_chantier", "Accès complet aux projets et à l'équipe"],
        ["technicien", "Punch, feuilles de temps, tâches assignées"],
        ["sous_traitant", "Corps de métiers et documents partagés"],
        ["client_readonly", "Portail client lecture seule"]
      ].map(([role, desc]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2 p-2 rounded-lg bg-gray-50", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-xs font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${ROLE_COLORS[role]}`, children: ROLE_LABELS[role] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-400 leading-tight", children: desc })
      ] }, role)) })
    ] })
  ] });
}
function DevTab() {
  const [devPlans, setDevPlans] = reactExports.useState([]);
  const [devCurrent, setDevCurrent] = reactExports.useState(null);
  const [devSwitching, setDevSwitching] = reactExports.useState(false);
  const [selectedPlan, setSelectedPlan] = reactExports.useState("");
  const [devNote, setDevNote] = reactExports.useState("");
  reactExports.useEffect(() => {
    __vitePreload(async () => {
      const { dev: dev2 } = await Promise.resolve().then(() => api$3);
      return { dev: dev2 };
    }, true ? void 0 : void 0).then(({ dev: dev2 }) => {
      dev2.plans().then(({ data }) => setDevPlans(data)).catch(() => {
      });
      dev2.current().then(({ data }) => setDevCurrent(data)).catch(() => {
      });
    });
  }, []);
  const switchPlan = async () => {
    if (!selectedPlan) return;
    setDevSwitching(true);
    try {
      const { dev: dev2 } = await __vitePreload(async () => {
        const { dev: dev3 } = await Promise.resolve().then(() => api$3);
        return { dev: dev3 };
      }, true ? void 0 : void 0);
      await dev2.switch({ plan_slug: selectedPlan, note: devNote });
      const { data } = await dev2.current();
      setDevCurrent(data);
    } catch {
    } finally {
      setDevSwitching(false);
    }
  };
  const clearPlan = async () => {
    const { dev: dev2 } = await __vitePreload(async () => {
      const { dev: dev3 } = await Promise.resolve().then(() => api$3);
      return { dev: dev3 };
    }, true ? void 0 : void 0);
    await dev2.clear();
    setDevCurrent(null);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-purple-200 bg-purple-50 rounded-xl p-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { size: 16, className: "text-purple-600" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-semibold text-purple-900 text-sm", children: "⚡ MODE DEV — Simuler un forfait" })
    ] }),
    (devCurrent == null ? void 0 : devCurrent.is_dev_override) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 px-3 py-2 bg-purple-100 rounded-lg text-xs text-purple-700", children: [
      "Override actif: ",
      /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: devCurrent.slug }),
      devCurrent.dev_note && ` — ${devCurrent.dev_note}`,
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "ml-3 text-purple-400 hover:text-purple-700 underline", onClick: clearPlan, children: "Réinitialiser" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "input flex-1 text-sm", value: selectedPlan, onChange: (e) => setSelectedPlan(e.target.value), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "Choisir un forfait…" }),
        devPlans.map((p2) => /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: p2.slug, children: [
          p2.name,
          " (",
          p2.base_price,
          "$ + ",
          p2.per_seat_price,
          "$/siège)"
        ] }, p2.slug))
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { className: "input w-40 text-sm", placeholder: "Note (optionnel)", value: devNote, onChange: (e) => setDevNote(e.target.value) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "btn-primary flex-shrink-0", onClick: switchPlan, disabled: !selectedPlan || devSwitching, children: [
        devSwitching ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader2, { size: 14, className: "animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { size: 14 }),
        " Appliquer"
      ] })
    ] })
  ] });
}
const TABS = [
  { id: "profil", label: "Mon profil", icon: User },
  { id: "company", label: "Entreprise", icon: Building2 },
  { id: "team", label: "Équipe", icon: Users },
  { id: "sources", label: "Sources leads", icon: Settings }
];
function Parametres() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { enabled: devEnabled } = useDevStore();
  const initialTab = searchParams.get("tab") || "profil";
  const [activeTab, setActiveTab] = reactExports.useState(initialTab);
  const tabs = devEnabled ? [...TABS, { id: "dev", label: "Dev", icon: Zap }] : TABS;
  const switchTab = (id2) => {
    setActiveTab(id2);
    setSearchParams({ tab: id2 });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 max-w-3xl mx-auto", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-xl font-bold text-gray-900 mb-5 flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Settings, { size: 20 }),
      " Paramètres"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-1 mb-6 border-b border-gray-100", children: tabs.map(({ id: id2, label, icon: Icon }) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        onClick: () => switchTab(id2),
        className: `flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === id2 ? "border-brand text-brand" : "border-transparent text-gray-500 hover:text-gray-700"}`,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { size: 14 }),
          label
        ]
      },
      id2
    )) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card", children: [
      activeTab === "profil" && /* @__PURE__ */ jsxRuntimeExports.jsx(ProfileTab, {}),
      activeTab === "company" && /* @__PURE__ */ jsxRuntimeExports.jsx(CompanyTab, {}),
      activeTab === "team" && /* @__PURE__ */ jsxRuntimeExports.jsx(TeamTab, {}),
      activeTab === "sources" && /* @__PURE__ */ jsxRuntimeExports.jsx(LeadSourcesTab, {}),
      activeTab === "dev" && devEnabled && /* @__PURE__ */ jsxRuntimeExports.jsx(DevTab, {})
    ] })
  ] }) });
}
function ComingSoon({ title = "Module", batch }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 max-w-3xl mx-auto", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-bold text-gray-900 mb-6", children: title }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "card flex flex-col items-center justify-center text-center py-16", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { size: 22, className: "text-brand" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-base font-semibold text-gray-900 mb-1", children: "Bientôt disponible" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-gray-400 max-w-sm", children: [
        "Le module « ",
        title,
        " » est activé sur ton espace. La vue complète arrive",
        batch ? ` au ${batch}` : " dans une prochaine mise à jour",
        ". Tu peux le masquer en attendant via « Gérer les vues » dans le menu."
      ] })
    ] })
  ] }) });
}
function Guard({ children }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/", replace: true });
}
function App() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(BrowserRouter, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Routes, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/", element: /* @__PURE__ */ jsxRuntimeExports.jsx(Auth, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/punch/:token", element: /* @__PURE__ */ jsxRuntimeExports.jsx(PunchPublic, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/soumission/:token", element: /* @__PURE__ */ jsxRuntimeExports.jsx(QuotePublic, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/facture/:token", element: /* @__PURE__ */ jsxRuntimeExports.jsx(InvoicePublic, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/quittance/:token", element: /* @__PURE__ */ jsxRuntimeExports.jsx(QuittancePublic, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/portal/:token", element: /* @__PURE__ */ jsxRuntimeExports.jsx(ProjectPortal, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/modification/:token", element: /* @__PURE__ */ jsxRuntimeExports.jsx(ChangeOrderPublic, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/onboarding", element: /* @__PURE__ */ jsxRuntimeExports.jsx(Onboarding, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/dashboard", element: /* @__PURE__ */ jsxRuntimeExports.jsx(Guard, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Dashboard, {}) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/projets", element: /* @__PURE__ */ jsxRuntimeExports.jsx(Guard, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Projets, {}) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/projets/:id", element: /* @__PURE__ */ jsxRuntimeExports.jsx(Guard, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(ProjectDetail, {}) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/leads", element: /* @__PURE__ */ jsxRuntimeExports.jsx(Guard, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Leads, {}) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/soumissions", element: /* @__PURE__ */ jsxRuntimeExports.jsx(Guard, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Soumissions, {}) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/factures", element: /* @__PURE__ */ jsxRuntimeExports.jsx(Guard, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Factures, {}) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/sous-traitants", element: /* @__PURE__ */ jsxRuntimeExports.jsx(Guard, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SousTraitants, {}) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/contacts", element: /* @__PURE__ */ jsxRuntimeExports.jsx(Guard, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Contacts, {}) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/rapport", element: /* @__PURE__ */ jsxRuntimeExports.jsx(Guard, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Rapport, {}) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/contrats", element: /* @__PURE__ */ jsxRuntimeExports.jsx(Guard, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(ComingSoon, { title: "Contrats", batch: "Batch 4" }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/commandes", element: /* @__PURE__ */ jsxRuntimeExports.jsx(Guard, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(ComingSoon, { title: "Commandes", batch: "Batch 6" }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/factures-achat", element: /* @__PURE__ */ jsxRuntimeExports.jsx(Guard, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(ComingSoon, { title: "Factures d'achat", batch: "Batch 6" }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/punch", element: /* @__PURE__ */ jsxRuntimeExports.jsx(Guard, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Punch, {}) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/chat", element: /* @__PURE__ */ jsxRuntimeExports.jsx(Guard, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Chat, {}) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/parametres", element: /* @__PURE__ */ jsxRuntimeExports.jsx(Guard, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Parametres, {}) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/project/:id", element: /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/projets", replace: true }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "*", element: /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/", replace: true }) })
  ] }) });
}
client.createRoot(document.getElementById("root")).render(
  /* @__PURE__ */ jsxRuntimeExports.jsx(React$2.StrictMode, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(ToastProvider, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(App, {}) }) })
);
