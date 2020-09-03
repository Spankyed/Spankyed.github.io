// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles

// eslint-disable-next-line no-global-assign
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  for (var i = 0; i < entry.length; i++) {
    newRequire(entry[i]);
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  return newRequire;
})({"node_modules/hyperapp/src/index.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.h = h;
exports.app = app;

function h(name, attributes) {
  var rest = [];
  var children = [];
  var length = arguments.length;

  while (length-- > 2) rest.push(arguments[length]);

  while (rest.length) {
    var node = rest.pop();

    if (node && node.pop) {
      for (length = node.length; length--;) {
        rest.push(node[length]);
      }
    } else if (node != null && node !== true && node !== false) {
      children.push(node);
    }
  }

  return typeof name === "function" ? name(attributes || {}, children) : {
    nodeName: name,
    attributes: attributes || {},
    children: children,
    key: attributes && attributes.key
  };
}

function app(state, actions, view, container) {
  var map = [].map;
  var rootElement = container && container.children[0] || null;
  var oldNode = rootElement && recycleElement(rootElement);
  var lifecycle = [];
  var skipRender;
  var isRecycling = true;
  var globalState = clone(state);
  var wiredActions = wireStateToActions([], globalState, clone(actions));
  scheduleRender();
  return wiredActions;

  function recycleElement(element) {
    return {
      nodeName: element.nodeName.toLowerCase(),
      attributes: {},
      children: map.call(element.childNodes, function (element) {
        return element.nodeType === 3 // Node.TEXT_NODE
        ? element.nodeValue : recycleElement(element);
      })
    };
  }

  function resolveNode(node) {
    return typeof node === "function" ? resolveNode(node(globalState, wiredActions)) : node != null ? node : "";
  }

  function render() {
    skipRender = !skipRender;
    var node = resolveNode(view);

    if (container && !skipRender) {
      rootElement = patch(container, rootElement, oldNode, oldNode = node);
    }

    isRecycling = false;

    while (lifecycle.length) lifecycle.pop()();
  }

  function scheduleRender() {
    if (!skipRender) {
      skipRender = true;
      setTimeout(render);
    }
  }

  function clone(target, source) {
    var out = {};

    for (var i in target) out[i] = target[i];

    for (var i in source) out[i] = source[i];

    return out;
  }

  function setPartialState(path, value, source) {
    var target = {};

    if (path.length) {
      target[path[0]] = path.length > 1 ? setPartialState(path.slice(1), value, source[path[0]]) : value;
      return clone(source, target);
    }

    return value;
  }

  function getPartialState(path, source) {
    var i = 0;

    while (i < path.length) {
      source = source[path[i++]];
    }

    return source;
  }

  function wireStateToActions(path, state, actions) {
    for (var key in actions) {
      typeof actions[key] === "function" ? function (key, action) {
        actions[key] = function (data) {
          var result = action(data);

          if (typeof result === "function") {
            result = result(getPartialState(path, globalState), actions);
          }

          if (result && result !== (state = getPartialState(path, globalState)) && !result.then // !isPromise
          ) {
              scheduleRender(globalState = setPartialState(path, clone(state, result), globalState));
            }

          return result;
        };
      }(key, actions[key]) : wireStateToActions(path.concat(key), state[key] = clone(state[key]), actions[key] = clone(actions[key]));
    }

    return actions;
  }

  function getKey(node) {
    return node ? node.key : null;
  }

  function eventListener(event) {
    return event.currentTarget.events[event.type](event);
  }

  function updateAttribute(element, name, value, oldValue, isSvg) {
    if (name === "key") {} else if (name === "style") {
      if (typeof value === "string") {
        element.style.cssText = value;
      } else {
        if (typeof oldValue === "string") oldValue = element.style.cssText = "";

        for (var i in clone(oldValue, value)) {
          var style = value == null || value[i] == null ? "" : value[i];

          if (i[0] === "-") {
            element.style.setProperty(i, style);
          } else {
            element.style[i] = style;
          }
        }
      }
    } else {
      if (name[0] === "o" && name[1] === "n") {
        name = name.slice(2);

        if (element.events) {
          if (!oldValue) oldValue = element.events[name];
        } else {
          element.events = {};
        }

        element.events[name] = value;

        if (value) {
          if (!oldValue) {
            element.addEventListener(name, eventListener);
          }
        } else {
          element.removeEventListener(name, eventListener);
        }
      } else if (name in element && name !== "list" && name !== "type" && name !== "draggable" && name !== "spellcheck" && name !== "translate" && !isSvg) {
        element[name] = value == null ? "" : value;
      } else if (value != null && value !== false) {
        element.setAttribute(name, value);
      }

      if (value == null || value === false) {
        element.removeAttribute(name);
      }
    }
  }

  function createElement(node, isSvg) {
    var element = typeof node === "string" || typeof node === "number" ? document.createTextNode(node) : (isSvg = isSvg || node.nodeName === "svg") ? document.createElementNS("http://www.w3.org/2000/svg", node.nodeName) : document.createElement(node.nodeName);
    var attributes = node.attributes;

    if (attributes) {
      if (attributes.oncreate) {
        lifecycle.push(function () {
          attributes.oncreate(element);
        });
      }

      for (var i = 0; i < node.children.length; i++) {
        element.appendChild(createElement(node.children[i] = resolveNode(node.children[i]), isSvg));
      }

      for (var name in attributes) {
        updateAttribute(element, name, attributes[name], null, isSvg);
      }
    }

    return element;
  }

  function updateElement(element, oldAttributes, attributes, isSvg) {
    for (var name in clone(oldAttributes, attributes)) {
      if (attributes[name] !== (name === "value" || name === "checked" ? element[name] : oldAttributes[name])) {
        updateAttribute(element, name, attributes[name], oldAttributes[name], isSvg);
      }
    }

    var cb = isRecycling ? attributes.oncreate : attributes.onupdate;

    if (cb) {
      lifecycle.push(function () {
        cb(element, oldAttributes);
      });
    }
  }

  function removeChildren(element, node) {
    var attributes = node.attributes;

    if (attributes) {
      for (var i = 0; i < node.children.length; i++) {
        removeChildren(element.childNodes[i], node.children[i]);
      }

      if (attributes.ondestroy) {
        attributes.ondestroy(element);
      }
    }

    return element;
  }

  function removeElement(parent, element, node) {
    function done() {
      parent.removeChild(removeChildren(element, node));
    }

    var cb = node.attributes && node.attributes.onremove;

    if (cb) {
      cb(element, done);
    } else {
      done();
    }
  }

  function patch(parent, element, oldNode, node, isSvg) {
    if (node === oldNode) {} else if (oldNode == null || oldNode.nodeName !== node.nodeName) {
      var newElement = createElement(node, isSvg);
      parent.insertBefore(newElement, element);

      if (oldNode != null) {
        removeElement(parent, element, oldNode);
      }

      element = newElement;
    } else if (oldNode.nodeName == null) {
      element.nodeValue = node;
    } else {
      updateElement(element, oldNode.attributes, node.attributes, isSvg = isSvg || node.nodeName === "svg");
      var oldKeyed = {};
      var newKeyed = {};
      var oldElements = [];
      var oldChildren = oldNode.children;
      var children = node.children;

      for (var i = 0; i < oldChildren.length; i++) {
        oldElements[i] = element.childNodes[i];
        var oldKey = getKey(oldChildren[i]);

        if (oldKey != null) {
          oldKeyed[oldKey] = [oldElements[i], oldChildren[i]];
        }
      }

      var i = 0;
      var k = 0;

      while (k < children.length) {
        var oldKey = getKey(oldChildren[i]);
        var newKey = getKey(children[k] = resolveNode(children[k]));

        if (newKeyed[oldKey]) {
          i++;
          continue;
        }

        if (newKey != null && newKey === getKey(oldChildren[i + 1])) {
          if (oldKey == null) {
            removeElement(element, oldElements[i], oldChildren[i]);
          }

          i++;
          continue;
        }

        if (newKey == null || isRecycling) {
          if (oldKey == null) {
            patch(element, oldElements[i], oldChildren[i], children[k], isSvg);
            k++;
          }

          i++;
        } else {
          var keyedNode = oldKeyed[newKey] || [];

          if (oldKey === newKey) {
            patch(element, keyedNode[0], keyedNode[1], children[k], isSvg);
            i++;
          } else if (keyedNode[0]) {
            patch(element, element.insertBefore(keyedNode[0], oldElements[i]), keyedNode[1], children[k], isSvg);
          } else {
            patch(element, oldElements[i], null, children[k], isSvg);
          }

          newKeyed[newKey] = children[k];
          k++;
        }
      }

      while (i < oldChildren.length) {
        if (getKey(oldChildren[i]) == null) {
          removeElement(element, oldElements[i], oldChildren[i]);
        }

        i++;
      }

      for (var i in oldKeyed) {
        if (!newKeyed[i]) {
          removeElement(element, oldKeyed[i][0], oldKeyed[i][1]);
        }
      }
    }

    return element;
  }
}
},{}],"node_modules/@hyperapp/router/src/Link.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Link = Link;

var _hyperapp = require("hyperapp");

function getOrigin(loc) {
  return loc.protocol + "//" + loc.hostname + (loc.port ? ":" + loc.port : "");
}

function isExternal(anchorElement) {
  // Location.origin and HTMLAnchorElement.origin are not
  // supported by IE and Safari.
  return getOrigin(location) !== getOrigin(anchorElement);
}

function Link(props, children) {
  return function (state, actions) {
    var to = props.to;
    var location = state.location;
    var onclick = props.onclick;
    delete props.to;
    delete props.location;
    props.href = to;

    props.onclick = function (e) {
      if (onclick) {
        onclick(e);
      }

      if (e.defaultPrevented || e.button !== 0 || e.altKey || e.metaKey || e.ctrlKey || e.shiftKey || props.target === "_blank" || isExternal(e.currentTarget)) {} else {
        e.preventDefault();

        if (to !== location.pathname) {
          history.pushState(location.pathname, "", to);
        }
      }
    };

    return (0, _hyperapp.h)("a", props, children);
  };
}
},{"hyperapp":"node_modules/hyperapp/src/index.js"}],"node_modules/@hyperapp/router/src/parseRoute.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parseRoute = parseRoute;

function createMatch(isExact, path, url, params) {
  return {
    isExact: isExact,
    path: path,
    url: url,
    params: params
  };
}

function trimTrailingSlash(url) {
  for (var len = url.length; "/" === url[--len];);

  return url.slice(0, len + 1);
}

function decodeParam(val) {
  try {
    return decodeURIComponent(val);
  } catch (e) {
    return val;
  }
}

function parseRoute(path, url, options) {
  if (path === url || !path) {
    return createMatch(path === url, path, url);
  }

  var exact = options && options.exact;
  var paths = trimTrailingSlash(path).split("/");
  var urls = trimTrailingSlash(url).split("/");

  if (paths.length > urls.length || exact && paths.length < urls.length) {
    return;
  }

  for (var i = 0, params = {}, len = paths.length, url = ""; i < len; i++) {
    if (":" === paths[i][0]) {
      params[paths[i].slice(1)] = urls[i] = decodeParam(urls[i]);
    } else if (paths[i] !== urls[i]) {
      return;
    }

    url += urls[i] + "/";
  }

  return createMatch(false, path, url.slice(0, -1), params);
}
},{}],"node_modules/@hyperapp/router/src/Route.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Route = Route;

var _parseRoute = require("./parseRoute");

function Route(props) {
  return function (state, actions) {
    var location = state.location;
    var match = (0, _parseRoute.parseRoute)(props.path, location.pathname, {
      exact: !props.parent
    });
    return match && props.render({
      match: match,
      location: location
    });
  };
}
},{"./parseRoute":"node_modules/@hyperapp/router/src/parseRoute.js"}],"node_modules/@hyperapp/router/src/Switch.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Switch = Switch;

function Switch(props, children) {
  return function (state, actions) {
    var child,
        i = 0;

    while (!(child = children[i] && children[i](state, actions)) && i < children.length) i++;

    return child;
  };
}
},{}],"node_modules/@hyperapp/router/src/Redirect.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Redirect = Redirect;

function Redirect(props) {
  return function (state, actions) {
    var location = state.location;
    history.replaceState(props.from || location.pathname, "", props.to);
  };
}
},{}],"node_modules/@hyperapp/router/src/location.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.location = void 0;

function wrapHistory(keys) {
  return keys.reduce(function (next, key) {
    var fn = history[key];

    history[key] = function (data, title, url) {
      fn.call(this, data, title, url);
      dispatchEvent(new CustomEvent("pushstate", {
        detail: data
      }));
    };

    return function () {
      history[key] = fn;
      next && next();
    };
  }, null);
}

var location = {
  state: {
    pathname: window.location.pathname,
    previous: window.location.pathname
  },
  actions: {
    go: function (pathname) {
      history.pushState(null, "", pathname);
    },
    set: function (data) {
      return data;
    }
  },
  subscribe: function (actions) {
    function handleLocationChange(e) {
      actions.set({
        pathname: window.location.pathname,
        previous: e.detail ? window.location.previous = e.detail : window.location.previous
      });
    }

    var unwrap = wrapHistory(["pushState", "replaceState"]);
    addEventListener("pushstate", handleLocationChange);
    addEventListener("popstate", handleLocationChange);
    return function () {
      removeEventListener("pushstate", handleLocationChange);
      removeEventListener("popstate", handleLocationChange);
      unwrap();
    };
  }
};
exports.location = location;
},{}],"node_modules/@hyperapp/router/src/index.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "Link", {
  enumerable: true,
  get: function () {
    return _Link.Link;
  }
});
Object.defineProperty(exports, "Route", {
  enumerable: true,
  get: function () {
    return _Route.Route;
  }
});
Object.defineProperty(exports, "Switch", {
  enumerable: true,
  get: function () {
    return _Switch.Switch;
  }
});
Object.defineProperty(exports, "Redirect", {
  enumerable: true,
  get: function () {
    return _Redirect.Redirect;
  }
});
Object.defineProperty(exports, "location", {
  enumerable: true,
  get: function () {
    return _location.location;
  }
});

var _Link = require("./Link");

var _Route = require("./Route");

var _Switch = require("./Switch");

var _Redirect = require("./Redirect");

var _location = require("./location");
},{"./Link":"node_modules/@hyperapp/router/src/Link.js","./Route":"node_modules/@hyperapp/router/src/Route.js","./Switch":"node_modules/@hyperapp/router/src/Switch.js","./Redirect":"node_modules/@hyperapp/router/src/Redirect.js","./location":"node_modules/@hyperapp/router/src/location.js"}],"node_modules/parcel/src/builtins/bundle-url.js":[function(require,module,exports) {
var bundleURL = null;

function getBundleURLCached() {
  if (!bundleURL) {
    bundleURL = getBundleURL();
  }

  return bundleURL;
}

function getBundleURL() {
  // Attempt to find the URL of the current script and use that as the base URL
  try {
    throw new Error();
  } catch (err) {
    var matches = ('' + err.stack).match(/(https?|file|ftp):\/\/[^)\n]+/g);

    if (matches) {
      return getBaseURL(matches[0]);
    }
  }

  return '/';
}

function getBaseURL(url) {
  return ('' + url).replace(/^((?:https?|file|ftp):\/\/.+)\/[^/]+$/, '$1') + '/';
}

exports.getBundleURL = getBundleURLCached;
exports.getBaseURL = getBaseURL;
},{}],"node_modules/parcel/src/builtins/css-loader.js":[function(require,module,exports) {
var bundle = require('./bundle-url');

function updateLink(link) {
  var newLink = link.cloneNode();

  newLink.onload = function () {
    link.remove();
  };

  newLink.href = link.href.split('?')[0] + '?' + Date.now();
  link.parentNode.insertBefore(newLink, link.nextSibling);
}

var cssTimeout = null;

function reloadCSS() {
  if (cssTimeout) {
    return;
  }

  cssTimeout = setTimeout(function () {
    var links = document.querySelectorAll('link[rel="stylesheet"]');

    for (var i = 0; i < links.length; i++) {
      if (bundle.getBaseURL(links[i].href) === bundle.getBundleURL()) {
        updateLink(links[i]);
      }
    }

    cssTimeout = null;
  }, 50);
}

module.exports = reloadCSS;
},{"./bundle-url":"node_modules/parcel/src/builtins/bundle-url.js"}],"src/style.css":[function(require,module,exports) {
var reloadCSS = require('_css_loader');

module.hot.dispose(reloadCSS);
module.hot.accept(reloadCSS);
},{"_css_loader":"node_modules/parcel/src/builtins/css-loader.js"}],"node_modules/hyperapp-transitions/src/index.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Exit = exports.Move = exports.Enter = void 0;
addEventListener('resize', updateAllTracked);
addEventListener('scroll', updateAllTracked);
var trackingRegistry = [];

function removeElement(el) {
  el.parentNode.removeChild(el);
}

function setStyle(el, attr) {
  Object.keys(attr).forEach(function (name) {
    el.style[name] = attr[name];
  });
}

function registerTracking(el) {
  if (trackingRegistry.indexOf(el) > -1) return;
  trackingRegistry.push(el);
  setTimeout(function () {
    updateTracking(el);
  }, 0);
}

function unregisterTracking(el) {
  var i = trackingRegistry.indexOf(el);
  if (i === -1) return;
  trackingRegistry.splice(i, 1);
}

function updateAllTracked() {
  trackingRegistry.forEach(updateTracking);
}

function invertLastMove(el) {
  var x = el._x;
  var y = el._y;
  if (!x) return 'translate(0, 0)';
  var n = updateTracking(el);
  var dx = Math.floor(x - n.x);
  var dy = Math.floor(y - n.y);
  return 'translate(' + dx + 'px, ' + dy + 'px)';
}

function updateTracking(el) {
  var rect = el.getBoundingClientRect();
  el._x = rect.left;
  el._y = rect.top;
  return {
    x: rect.left,
    y: rect.top
  };
}

function runTransition(el, attr, before, after, ondone) {
  var easing = attr.easing || 'linear';
  var time = attr.time || 300;
  var delay = attr.delay || 0;
  setStyle(el, before);
  setTimeout(function () {
    requestAnimationFrame(function () {
      setStyle(el, after);
      el.style.transition = 'all ' + easing + ' ' + time + 'ms';
      setTimeout(function () {
        el.style.transition = null;
        ondone && ondone();
      }, time);
    });
  }, delay);
}

function runEnter(el, attr, css) {
  if (typeof css === 'function') css = css();
  runTransition(el, attr, css, Object.keys(css).reduce(function (o, n) {
    o[n] = null;
    return o;
  }, {}), function () {
    updateTracking(el);
  });
}

function runMove(el, attr) {
  runTransition(el, attr, {
    transform: invertLastMove(el)
  }, {
    transform: null
  });
}

function runExit(el, attr, css, done) {
  if (typeof css === 'function') css = css();
  unregisterTracking(el);
  var translation = invertLastMove(el);
  css.transform = translation + (css.transform ? ' ' + css.transform : '');
  runTransition(el, attr, {
    transform: translation
  }, css, done);
}

function noop() {}

function composeHandlers(f1, f2) {
  if (!f1) return f2;
  if (!f2) return f1;
  return function (el, done) {
    f1 && f1(el, done);
    f2 && f2(el, done);
    return noop;
  };
}

function transitionComponent(handlersFn) {
  return function (attr, children) {
    var handlers = handlersFn(attr || {});
    return children.filter(function (child) {
      return !!child.attributes;
    }).map(function (child) {
      ['oncreate', 'onupdate', 'onremove'].forEach(function (n) {
        child.attributes[n] = composeHandlers(child.attributes[n], handlers[n]);
      });
      return child;
    });
  };
}

var _track = transitionComponent(function (attr) {
  return {
    oncreate: function (el) {
      registerTracking(el);
    }
  };
});

var _move = transitionComponent(function (attr) {
  return {
    onupdate: function (el) {
      runMove(el, attr);
    }
  };
});

var _exit = transitionComponent(function (attr) {
  return {
    onremove: function (el, done) {
      done = done || function () {
        removeElement(el);
      };

      runExit(el, attr, attr.css || {}, !attr.keep && done);
    }
  };
});

var Enter = transitionComponent(function (attr) {
  return {
    oncreate: function (el) {
      runEnter(el, attr, attr.css || {});
    }
  };
});
exports.Enter = Enter;

var Move = function (attr, children) {
  return _move(attr, _track(null, children));
};

exports.Move = Move;

var Exit = function (attr, children) {
  return _exit(attr, _track(null, children));
};

exports.Exit = Exit;
},{}],"src/pages/home.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _hyperapp = require("hyperapp");

var _router = require("@hyperapp/router");

var _hyperappTransitions = require("hyperapp-transitions");

var _default = function _default(initial) {
  return {
    state: {
      audio: {},
      audioPlaying: false
    },
    actions: {
      playAudio: function playAudio(audio) {
        return function (state) {
          return {
            audioPlaying: true,
            audio: audio
          };
        };
      },
      pauseAudio: function pauseAudio() {
        return function (state) {
          state.audio.pause();
          return {
            audioPlaying: false
          };
        };
      }
    },
    view: function view(state, actions) {
      return function (_ref) {
        var match = _ref.match;
        var headshotImgUrl = "https://i.ibb.co/y83tr7m/fix-that.png";

        function liveClick() {
          var audio = new Audio('95_Til_Infinity.mp3');
          audio.volume = 0.2;
          audio.onended = actions.pauseAudio;
          audio.play();
          actions.playAudio(audio);
          alert(" \n      This feature is still early in development\n      Try again later\n      \n In the meantime, heres some bg music (maybe)");
        }

        return (0, _hyperapp.h)("div", {
          class: "relative bg-wurp max-w-3xl flex items-center h-auto lg:h-screen flex-wrap mx-auto my-32 lg:my-0"
        }, (0, _hyperapp.h)("div", {
          class: "w-full lg:w-2/5 "
        }, (0, _hyperapp.h)("img", {
          src: headshotImgUrl,
          class: "shadow-2xl hidden lg:block rounded-sm"
        })), (0, _hyperapp.h)("div", {
          id: "profile",
          class: "flex w-full lg:w-3/5 shadow-2xl bg-reddish mx-6 lg:mx-0 rounded-sm"
        }, (0, _hyperapp.h)("div", {
          class: "w-full pt-8 md:px-12 md:pb-6 text-center lg:text-left"
        }, (0, _hyperapp.h)("div", {
          class: "block lg:hidden rounded-full shadow-xl mx-auto -mt-16 h-48 w-48 bg-cover bg-center border-solid border-4 shadow-inset",
          style: "background-image: url('".concat(headshotImgUrl, "')")
        }), (0, _hyperapp.h)("h1", {
          class: "text-4xl font-bold pt-8 lg:pt-0"
        }, "Angel Santiago"), (0, _hyperapp.h)("div", {
          class: "mx-auto lg:mx-0 w-4/5 pt-3 border-b-2 border-gray-900 opacity-25"
        }), (0, _hyperapp.h)("p", {
          class: "pt-4 text-base font-bold flex items-center justify-center lg:justify-start text-gray-200"
        }, (0, _hyperapp.h)("svg", {
          class: "h-4 fill-current text-white pr-4",
          xmlns: "http://www.w3.org/2000/svg",
          viewBox: "0 0 20 20"
        }, (0, _hyperapp.h)("path", {
          d: "M9 12H1v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6h-8v2H9v-2zm0-1H0V5c0-1.1.9-2 2-2h4V2a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1h4a2 2 0 0 1 2 2v6h-9V9H9v2zm3-8V2H8v1h4z"
        })), "Software Engineer"), (0, _hyperapp.h)("p", {
          class: "pt-2 text-white text-xs lg:text-sm flex items-center justify-center lg:justify-start"
        }, (0, _hyperapp.h)("svg", {
          class: "h-4 fill-current text-white- pr-4",
          xmlns: "http://www.w3.org/2000/svg",
          viewBox: "0 0 20 20"
        }, (0, _hyperapp.h)("path", {
          d: "M10 20a10 10 0 1 1 0-20 10 10 0 0 1 0 20zm7.75-8a8.01 8.01 0 0 0 0-4h-3.82a28.81 28.81 0 0 1 0 4h3.82zm-.82 2h-3.22a14.44 14.44 0 0 1-.95 3.51A8.03 8.03 0 0 0 16.93 14zm-8.85-2h3.84a24.61 24.61 0 0 0 0-4H8.08a24.61 24.61 0 0 0 0 4zm.25 2c.41 2.4 1.13 4 1.67 4s1.26-1.6 1.67-4H8.33zm-6.08-2h3.82a28.81 28.81 0 0 1 0-4H2.25a8.01 8.01 0 0 0 0 4zm.82 2a8.03 8.03 0 0 0 4.17 3.51c-.42-.96-.74-2.16-.95-3.51H3.07zm13.86-8a8.03 8.03 0 0 0-4.17-3.51c.42.96.74 2.16.95 3.51h3.22zm-8.6 0h3.34c-.41-2.4-1.13-4-1.67-4S8.74 3.6 8.33 6zM3.07 6h3.22c.2-1.35.53-2.55.95-3.51A8.03 8.03 0 0 0 3.07 6z"
        })), "Boca Raton, Florida"), (0, _hyperapp.h)("p", {
          class: "pt-8 font-semibold text-gray-200"
        }, "Engineering personalized solutions to complex problems."), (0, _hyperapp.h)("div", {
          class: "pt-12 pb-8 mx-auto flex items-center justify-center"
        }, (0, _hyperapp.h)("div", {
          class: "flex rounded border-b-2 border-gray-400 mx-2"
        }, (0, _hyperapp.h)("button", {
          onclick: liveClick,
          class: "block text-white text-sm shadow-border bg-blue-700 hover:bg-blue-900 text-sm py-3 px-4 font-sans tracking-wide uppercase font-bold"
        }, "Live"), (0, _hyperapp.h)("div", {
          class: "bg-blue-400 shadow-border p-3"
        }, (0, _hyperapp.h)("div", {
          class: "w-4 h-4"
        }, (0, _hyperapp.h)("i", {
          class: "fas fa-user fa-fw fa-inverse"
        })))), (0, _hyperapp.h)(_router.Link, {
          to: "/projects",
          class: "flex rounded border-b-2 border-gray-400 mx-2"
        }, (0, _hyperapp.h)("button", {
          class: "block text-white text-sm shadow-border bg-green-700 hover:bg-green-900 text-sm py-3 px-4 font-sans tracking-wide uppercase font-bold"
        }, "Projects"), (0, _hyperapp.h)("div", {
          class: "bg-green-400 shadow-border p-3"
        }, (0, _hyperapp.h)("div", {
          class: "w-4 h-4"
        }, (0, _hyperapp.h)("i", {
          class: "fas fa-project-diagram fa-fw fa-inverse"
        })))), (0, _hyperapp.h)(_router.Link, {
          to: "/blogs",
          class: "flex rounded border-b-2 border-gray-400 mx-2"
        }, (0, _hyperapp.h)("button", {
          class: "block text-white text-sm shadow-border bg-green-700 hover:bg-green-900 text-sm py-3 px-4 font-sans tracking-wide uppercase font-bold"
        }, "Blog"), (0, _hyperapp.h)("div", {
          class: "bg-green-400 shadow-border p-3"
        }, (0, _hyperapp.h)("div", {
          class: "w-4 h-4"
        }, (0, _hyperapp.h)("i", {
          class: "fas fa-blog"
        }))))), (0, _hyperapp.h)("div", {
          class: "mt-6 pb-16 lg:pb-0 w-4/5 lg:w-full mx-auto flex flex-wrap items-center justify-between text-white"
        }, (0, _hyperapp.h)("a", {
          class: "link",
          href: "https://facebook.com/Dobberz"
        }, (0, _hyperapp.h)("svg", {
          class: "h-6 fill-current hover:text-gray-700",
          role: "img",
          viewBox: "0 0 24 24",
          xmlns: "http://www.w3.org/2000/svg"
        }, (0, _hyperapp.h)("title", null, "@Dobberz"), (0, _hyperapp.h)("path", {
          d: "M22.676 0H1.324C.593 0 0 .593 0 1.324v21.352C0 23.408.593 24 1.324 24h11.494v-9.294H9.689v-3.621h3.129V8.41c0-3.099 1.894-4.785 4.659-4.785 1.325 0 2.464.097 2.796.141v3.24h-1.921c-1.5 0-1.792.721-1.792 1.771v2.311h3.584l-.465 3.63H16.56V24h6.115c.733 0 1.325-.592 1.325-1.324V1.324C24 .593 23.408 0 22.676 0"
        }))), (0, _hyperapp.h)("a", {
          class: "link",
          href: "https://github.com/Spankyed"
        }, (0, _hyperapp.h)("svg", {
          class: "h-6 fill-current hover:text-gray-700",
          role: "img",
          viewBox: "0 0 24 24",
          xmlns: "http://www.w3.org/2000/svg"
        }, (0, _hyperapp.h)("title", null, "@Spankyed"), (0, _hyperapp.h)("path", {
          d: "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
        }))), (0, _hyperapp.h)("a", {
          class: "link",
          href: "https://www.instagram.com/spankied/"
        }, (0, _hyperapp.h)("svg", {
          class: "h-6 fill-current hover:text-gray-700",
          role: "img",
          viewBox: "0 0 24 24",
          xmlns: "http://www.w3.org/2000/svg"
        }, (0, _hyperapp.h)("title", null, "@Spankied"), (0, _hyperapp.h)("path", {
          d: "M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"
        })))))));
      };
    }
  };
};

exports.default = _default;
},{"hyperapp":"node_modules/hyperapp/src/index.js","@hyperapp/router":"node_modules/@hyperapp/router/src/index.js","hyperapp-transitions":"node_modules/hyperapp-transitions/src/index.js"}],"node_modules/@babel/runtime/helpers/defineProperty.js":[function(require,module,exports) {
function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

module.exports = _defineProperty;
},{}],"node_modules/@babel/runtime/helpers/objectSpread.js":[function(require,module,exports) {
var defineProperty = require("./defineProperty");

function _objectSpread(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};
    var ownKeys = Object.keys(source);

    if (typeof Object.getOwnPropertySymbols === 'function') {
      ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) {
        return Object.getOwnPropertyDescriptor(source, sym).enumerable;
      }));
    }

    ownKeys.forEach(function (key) {
      defineProperty(target, key, source[key]);
    });
  }

  return target;
}

module.exports = _objectSpread;
},{"./defineProperty":"node_modules/@babel/runtime/helpers/defineProperty.js"}],"src/pages/blogs/blog.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var _hyperapp = require("hyperapp");

var _hyperappTransitions = require("hyperapp-transitions");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _default = {
  state: {
    showAnnotation: false,
    annotation: {}
  },
  actions: {
    showAnnotation: function showAnnotation(annotation) {
      return function (state) {
        return {
          showAnnotation: true,
          annotation: annotation
        };
      };
    },
    hideAnnotation: function hideAnnotation() {
      return function (state) {
        return {
          showAnnotation: false
        };
      };
    }
  },
  view: function view(state, actions) {
    return function (_ref) {
      var match = _ref.match;
      var blog = state.blogs.filter(function (blog) {
        return blog.id == match.params.blog_id;
      })[0];

      var compile = function compile(element) {
        // add highlight onclick handlers to show annotation    
        var highlightedTextEls = document.getElementsByClassName("highlight");

        for (var i = 0; i < highlightedTextEls.length; i++) {
          highlightedTextEls[i].addEventListener('click', showAnnotation, false);
        } // memory leak


        function showAnnotation(e) {
          if (window.innerWidth < 768) {
            actions.hideAnnotation();
            var id = this.id.slice(5);
            var rect = this.getBoundingClientRect();
            var annotation = (0, _objectSpread2.default)({}, blog.annotations.find(function (a) {
              return a.id == id;
            }), {
              posTopM: 0 + 'px',
              rectTop: rect.top
            });
            actions.showAnnotation(annotation);
          } else {
            actions.hideAnnotation();

            var _id = this.id.slice(5);

            var _rect = this.getBoundingClientRect();

            var bodyRect = document.getElementById('markdown-body').getBoundingClientRect();
            var parentRect = document.getElementById('annotations').getBoundingClientRect();

            var _annotation = (0, _objectSpread2.default)({}, blog.annotations.find(function (a) {
              return a.id == _id;
            }), {
              posTop: _rect.top - parentRect.top + 'px',
              //posTopFixed: rect.top - 24 + 'px',
              posLeft: bodyRect.width + 10 + 'px'
            });

            actions.showAnnotation(_annotation);
          } //document.body.style.overflow = "hidden"; 

        }
      };

      function showAnnotation(e) {
        var mparentRect = document.getElementById('annotations1').getBoundingClientRect();
        actions.showAnnotation((0, _objectSpread2.default)({}, state.annotation, {
          posTopM: state.annotation.rectTop - mparentRect.top + 'px'
        }));
      }

      function cleanup() {
        actions.hideAnnotation();
        window.scrollTo(0, 0);
      }

      function close() {
        //document.body.style.overflow = "auto";
        actions.hideAnnotation();
      } //change section tag to article?


      return (0, _hyperapp.h)("section", {
        oncreate: cleanup
      }, (0, _hyperapp.h)(_hyperappTransitions.Enter, {
        time: 200,
        easing: "ease-in-out",
        css: {
          transform: "translateY(-100%)",
          opacity: "0"
        }
      }, (0, _hyperapp.h)("div", {
        class: "hidden lg:block w-full bg-center bg-no-repeat",
        style: "background-size: ".concat(blog.imgSizes[1], "; height:80vh; background-image:url(").concat(blog.image, ");")
      }), (0, _hyperapp.h)("div", {
        class: "block lg:hidden w-full bg-no-repeat",
        style: "background-size: 850px; background-position: 50% 0%; height:60vh; background-image:url(".concat(blog.image, ");")
      })), (0, _hyperapp.h)("div", {
        class: "container w-full mx-auto md:max-w-3xl"
      }, (0, _hyperapp.h)("div", {
        class: "w-full px-4 md:px-6 text-xl text-gray-800 leading-normal",
        style: "font-family:Georgia,serif;"
      }, (0, _hyperapp.h)("div", {
        class: "text-base font-sans md:text-sm text-teal-500 font-bold mt-1"
      }, (0, _hyperapp.h)("span", null, (0, _hyperapp.h)("p", {
        class: "text-sm md:text-base inline-block font-normal text-gray-600 pt-5 pr-6"
      }, blog.date), blog.tags.map(function (tag) {
        return (0, _hyperapp.h)("span", {
          class: "inline-block rounded-sm text-xs text-grey-darker bg-yurp py-1 px-2 mr-2 mb-1 ml-0 leading-none"
        }, "#", tag);
      })), (0, _hyperapp.h)("h1", {
        class: "font-bold font-sans break-normal text-gray-900 text-3xl md:text-4xl"
      }, blog.title)), (0, _hyperapp.h)("div", {
        id: "markdown-body",
        class: "py-6 markdown-body text-gray-900",
        oncreate: compile,
        innerHTML: blog.text
      }), (0, _hyperapp.h)("div", {
        id: "annotations",
        class: "hidden md:flex relative w-1/2"
      }, !state.showAnnotation ? '' : (0, _hyperapp.h)("div", {
        id: state.annotation.id,
        style: "top:".concat(state.annotation.posTop, "; left:").concat(state.annotation.posLeft),
        class: "annotation absolute flex w-64 shadow-2xl bg-reddish mx-6 my-5 p-5 text-gray-700 rounded-sm"
      }, (0, _hyperapp.h)(_hyperappTransitions.Enter, {
        time: 250,
        css: {
          opacity: "0",
          transform: "translateX(100%)"
        }
      }, (0, _hyperapp.h)("div", {
        innerHTML: state.annotation.html,
        class: "markdown-body bg-gray-300 p-4 rounded-sm"
      })))))), !state.showAnnotation ? '' : (0, _hyperapp.h)("div", {
        onclick: actions.hideAnnotation,
        class: "block md:hidden absolute w-full h-full left-0 top-0",
        style: "background-color: rgb(0,0,255,0.5);"
      }, (0, _hyperapp.h)("div", {
        oncreate: showAnnotation,
        id: "annotations1",
        class: "relative flex w-4/6  ml-auto"
      }, (0, _hyperapp.h)("div", {
        onclick: function onclick(e) {
          return e.stopPropagation();
        },
        id: state.annotation.id,
        style: "top:".concat(state.annotation.posTopM, "; right:0px"),
        class: " opacity-100 annotation absolute flex w-64 shadow-2xl bg-reddish my-5 p-5 text-gray-700 rounded-sm"
      }, (0, _hyperapp.h)("svg", {
        onclick: close,
        class: "absolute top-0 left-0",
        viewBox: "0 0 30 30",
        width: "24",
        height: "24",
        xmlns: "http://www.w3.org/2000/svg",
        "fill-rule": "evenodd",
        "clip-rule": "evenodd"
      }, (0, _hyperapp.h)("path", {
        d: "M12 11.293l10.293-10.293.707.707-10.293 10.293 10.293 10.293-.707.707-10.293-10.293-10.293 10.293-.707-.707 10.293-10.293-10.293-10.293.707-.707 10.293 10.293z"
      })), (0, _hyperapp.h)(_hyperappTransitions.Enter, {
        time: 250,
        css: {
          opacity: "0",
          transform: "translateX(100%)"
        }
      }, (0, _hyperapp.h)("div", {
        innerHTML: state.annotation.html,
        class: "markdown-body bg-gray-300 p-4 rounded-sm"
      }))))));
    };
  }
  /*
  export default {
    down: ({ id, value }) => state => ({
      counters: state.counters.map(
        counter =>
          counter.id === id
            ? { ...counter, count: counter.count - value }
            : counter
      )
    }),
  
    up: ({ id, value }) => state => ({
      counters: state.counters.map(
        counter =>
          counter.id === id
            ? { ...counter, count: counter.count + value }
            : counter
      )
    })
  }*/

};
exports.default = _default;
},{"@babel/runtime/helpers/objectSpread":"node_modules/@babel/runtime/helpers/objectSpread.js","hyperapp":"node_modules/hyperapp/src/index.js","hyperapp-transitions":"node_modules/hyperapp-transitions/src/index.js"}],"src/pages/blogs/blogs.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

var _hyperapp = require("hyperapp");

var _router = require("@hyperapp/router");

var _blog = _interopRequireDefault(require("./blog.js"));

var _hyperappTransitions = require("hyperapp-transitions");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Blogs Module
var BlogLink = function BlogLink(_ref) {
  var match = _ref.match,
      blog = _ref.blog,
      setBlog = _ref.setBlog;
  return (0, _hyperapp.h)(_router.Link, {
    to: "".concat(match.path, "/").concat(blog.id),
    class: "mx-auto mb-8 mx-8 bg-reddish rounded-lg shadow block flex-wrap flex w-11/12 text-white",
    href: "/updating-to-babel-7.4/"
  }, (0, _hyperapp.h)("div", {
    class: "w-full md:w-1/2 shadow bg-dark-100 rounded-lg rounded-r-none min-h-featured-item bg-center bg-no-repeat",
    style: "background-size: ".concat(blog.imgSizes[0], ";")
  }, (0, _hyperapp.h)("img", {
    src: blog.image,
    loading: "lazy",
    alt: "...",
    style: "width:100%; height:100%;object-fit: cover;"
  })), (0, _hyperapp.h)("div", {
    class: "w-full md:w-1/2 p-4"
  }, (0, _hyperapp.h)("div", {
    class: "border-b border-gray-700 text-center"
  }, (0, _hyperapp.h)("p", {
    class: "text-sm md:text-base font-normal text-gray-700 -pt-1 -mb-1"
  }, blog.date), (0, _hyperapp.h)("h3", {
    class: "font-bold text-3xl mb-2 inline-block text-gray-200"
  }, blog.title)), (0, _hyperapp.h)("p", {
    class: "text-gray-200 my-4 h-auto text-base overflow-hidden"
  }, blog.description), (0, _hyperapp.h)("div", {
    class: "text-gray-800 flex items-center justify-between"
  }, (0, _hyperapp.h)("div", null, blog.tags.map(function (tag) {
    return (0, _hyperapp.h)("span", {
      class: "inline-block rounded-sm text-xs text-grey-darker bg-yurp py-1 px-2 mr-2 mb-1 ml-0 leading-none"
    }, "#", tag);
  })), (0, _hyperapp.h)("p", {
    class: "text-xs md:text-sm font-semibold"
  }, blog.readTime, " MIN READ"))));
}; // initial: data.blogs


var _default = function _default(initial) {
  return {
    state: (0, _objectSpread2.default)({
      blogs: initial
    }, _blog.default.state),
    actions: (0, _objectSpread2.default)({}, _blog.default.actions),
    view: function view(state, actions) {
      return function (_ref2) {
        var match = _ref2.match;
        var BlogView = _blog.default.view;
        return (0, _hyperapp.h)("div", null, match.params ? (0, _hyperapp.h)(_router.Route, {
          parent: true,
          path: "".concat(match.path, "/:blog_id"),
          render: BlogView(state, actions)
        }) : (0, _hyperapp.h)(_hyperappTransitions.Enter, {
          css: {
            opacity: "0",
            transform: "translateX(100%)"
          }
        }, (0, _hyperapp.h)("div", {
          class: "container mx-auto min-h-screen"
        }, (0, _hyperapp.h)("section", {
          class: "leading-tight py-6 px-4"
        }, (0, _hyperapp.h)("div", {
          class: "bg-gray-700 text-white py-2 sm:w-5/6 sm:mx-auto"
        }, (0, _hyperapp.h)("header", {
          class: "bg-cyan-300"
        }, (0, _hyperapp.h)("div", {
          class: "container"
        }, (0, _hyperapp.h)("div", {
          class: "text-white font-serif text-center"
        }, (0, _hyperapp.h)("h1", {
          class: "font-serif font-black text-5xl mb-2"
        }, "Blog"), (0, _hyperapp.h)("h2", {
          class: "font-light"
        }, "The Web Developer Soapbox.")))))), state.blogs.map(function (blog) {
          return (0, _hyperapp.h)(BlogLink, {
            blog: blog,
            match: match,
            setBlog: actions.setBlog
          });
        }))));
      };
    }
  };
};
/* switch might eliminate coniditional
<Switch></Switch>
*/


exports.default = _default;
},{"@babel/runtime/helpers/objectSpread":"node_modules/@babel/runtime/helpers/objectSpread.js","hyperapp":"node_modules/hyperapp/src/index.js","@hyperapp/router":"node_modules/@hyperapp/router/src/index.js","./blog.js":"src/pages/blogs/blog.js","hyperapp-transitions":"node_modules/hyperapp-transitions/src/index.js"}],"src/pages/projects/project.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _hyperapp = require("hyperapp");

// Projects Module
var dangerouslySetInnerHTML = function dangerouslySetInnerHTML(html) {
  return function (element) {
    element.innerHTML = html;
  };
};

var _default = function _default(projects, actions) {
  return function (_ref) {
    var match = _ref.match;
    window.scrollTo(0, 0);
    var project = projects.filter(function (project) {
      return project.id == match.params.project_id;
    })[0];
    var compile = dangerouslySetInnerHTML(project.text); //   <div class="hidden mx-auto lg:block w-full bg-center bg-no-repeat" style={`background-size: 1450px; height:80vh; background-image:url(${project.image});`}>
    //   {/* <h1 class="title text-center align-bottom text-yellow pb-4 text-4xl md:text-6xl"  style ="line-height:60vh;">{project.title}</h1>              */}
    // </div> 
    // <div class="block lg:hidden w-full bg-no-repeat" style={`background-size: 850px; background-position: 50% 0%; height:60vh; background-image:url(${project.image});`}>
    //   {/* <h1 class="title text-center align-bottom text-yellow pb-4 text-4xl md:text-6xl"  style ="line-height:60vh">{project.title}</h1>              */}
    // </div>

    return (0, _hyperapp.h)("section", null, (0, _hyperapp.h)("div", {
      class: "bg-reddish container rounded w-full mx-auto max-w-5xl mt-6 mb-6 border-4 border-gray-700"
    }, (0, _hyperapp.h)("div", {
      class: "max-w-sm text-center mx-auto bg-gray-300 shadow-xl p-2",
      style: ""
    }, (0, _hyperapp.h)("a", {
      href: project.link,
      target: "_blank"
    }, (0, _hyperapp.h)("h1", {
      class: "inline text-gray-900 text-5xl"
    }, "You "), (0, _hyperapp.h)("h1", {
      class: "inline bg-reddish text-gray-100 font-black text-5xl px-3 rounded-lg"
    }, "Translate"), (0, _hyperapp.h)("h2", {
      class: "italic text-center text-gray-700 mt-0"
    }, "Translate YouTube Closed Captions"))), (0, _hyperapp.h)("div", {
      class: "w-full px-4 md:px-6 text-xl text-gray-100 leading-normal",
      style: "font-family:Georgia,serif;"
    }, (0, _hyperapp.h)("div", {
      class: "font-sans"
    }, (0, _hyperapp.h)("span", {
      class: "text-base md:text-sm text-teal-500 font-bold"
    }, (0, _hyperapp.h)("span", null))), (0, _hyperapp.h)("div", {
      class: "py-6 markdown-body text-grey-100",
      oncreate: compile
    }))));
  };
};

exports.default = _default;
},{"hyperapp":"node_modules/hyperapp/src/index.js"}],"src/pages/projects/projects.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _hyperapp = require("hyperapp");

var _router = require("@hyperapp/router");

var _project = _interopRequireDefault(require("./project.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Projects Module
var ProjectLink = function ProjectLink(_ref) {
  var match = _ref.match,
      project = _ref.project;

  function routeClick(project) {
    return project.external ? project.link : "".concat(match.path, "/").concat(project.id);
  }

  return (0, _hyperapp.h)("div", {
    class: "project-link bg-reddish shadow-lg border border-yellow text-grey-80 w-full max-w-lg mb-8 md:mx-8"
  }, (0, _hyperapp.h)(_router.Link, {
    to: routeClick(project),
    class: "project-link no-underline "
  }, (0, _hyperapp.h)("header", {
    class: "project-thumbnail relative h-64 border-b-4 border-yellow bg-cover bg-center",
    style: "background-image: url(".concat(project.image, ");")
  }, (0, _hyperapp.h)("div", {
    class: "overlay flex items-end justify-center px-2 absolute h-full w-full bg-black-alpha-30"
  }, (0, _hyperapp.h)("h2", {
    class: "bg-yellow text-xl text-black p-4"
  }, project.title))), (0, _hyperapp.h)("div", {
    class: "project-summary text-grey-80 p-4 text-center leading-normal"
  }, (0, _hyperapp.h)("div", null, (0, _hyperapp.h)("span", {
    class: "border-b-2 border-grey-60"
  }, project.tools)), (0, _hyperapp.h)("p", {
    class: "my-3"
  }, project.description))));
}; // initial: data.projects


var _default = function _default(initial) {
  return {
    state: {
      projects: initial
    },
    actions: {},
    view: function view(state, actions) {
      return function (_ref2) {
        var match = _ref2.match;
        return (0, _hyperapp.h)("div", null, match.params ? (0, _hyperapp.h)(_router.Route, {
          parent: true,
          path: "".concat(match.path, "/:project_id"),
          render: (0, _project.default)(state.projects, actions)
        }) : (0, _hyperapp.h)("div", {
          class: "container mx-auto min-h-screen"
        }, (0, _hyperapp.h)("section", {
          class: "leading-tight py-6 px-4"
        }, (0, _hyperapp.h)("div", {
          class: "bg-gray-700 text-white py-2 sm:w-5/6 sm:mx-auto"
        }, (0, _hyperapp.h)("header", {
          class: "bg-cyan-300"
        }, (0, _hyperapp.h)("div", {
          class: "container"
        }, (0, _hyperapp.h)("div", {
          class: "text-white font-serif text-center"
        }, (0, _hyperapp.h)("h1", {
          class: "font-serif font-black text-5xl mb-2"
        }, "Projects"), (0, _hyperapp.h)("h2", {
          class: "font-light"
        }, "Applications I've designed and developed.")))))), (0, _hyperapp.h)("section", {
          class: "project-list px-4 sm:flex sm:justify-center sm:flex-wrap"
        }, state.projects.map(function (project) {
          return (0, _hyperapp.h)(ProjectLink, {
            project: project,
            match: match
          });
        }))));
      };
    }
  };
};
/*
  class={`font-light bg-${theme}-dark text-${theme}-darker hover:bg-${theme}-lighter`}
 <Enter time={200} easing="ease-in-out" 
        css={{opacity: "0", transform: "scale(1,1)"}}>

        import { Enter } from "@hyperapp/transitions"
*/


exports.default = _default;
},{"hyperapp":"node_modules/hyperapp/src/index.js","@hyperapp/router":"node_modules/@hyperapp/router/src/index.js","./project.js":"src/pages/projects/project.js"}],"node_modules/@babel/runtime/helpers/arrayWithoutHoles.js":[function(require,module,exports) {
function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) {
      arr2[i] = arr[i];
    }

    return arr2;
  }
}

module.exports = _arrayWithoutHoles;
},{}],"node_modules/@babel/runtime/helpers/iterableToArray.js":[function(require,module,exports) {
function _iterableToArray(iter) {
  if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
}

module.exports = _iterableToArray;
},{}],"node_modules/@babel/runtime/helpers/nonIterableSpread.js":[function(require,module,exports) {
function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance");
}

module.exports = _nonIterableSpread;
},{}],"node_modules/@babel/runtime/helpers/toConsumableArray.js":[function(require,module,exports) {
var arrayWithoutHoles = require("./arrayWithoutHoles");

var iterableToArray = require("./iterableToArray");

var nonIterableSpread = require("./nonIterableSpread");

function _toConsumableArray(arr) {
  return arrayWithoutHoles(arr) || iterableToArray(arr) || nonIterableSpread();
}

module.exports = _toConsumableArray;
},{"./arrayWithoutHoles":"node_modules/@babel/runtime/helpers/arrayWithoutHoles.js","./iterableToArray":"node_modules/@babel/runtime/helpers/iterableToArray.js","./nonIterableSpread":"node_modules/@babel/runtime/helpers/nonIterableSpread.js"}],"src/data/index.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// data file
var randString = function randString() {
  return Math.random().toString(36).substring(3, 9);
};

var themes = ['green', 'teal', 'blue', 'indigo', 'purple', 'orange', 'yellow', 'grey', 'red', 'pink'];
var projects = [{
  "id": 1,
  "title": "YouTranslate",
  "link": "https://spankyed.github.io/YouTranslate",
  "image": "https://i.ibb.co/XWxdHtW/yt.png",
  "tools": "Node | Google Cloud | Heroku",
  "description": "Web App to translate YouTube closed captions",
  "text": "<p>I wanted to learn a new language to show off on my resume and to the ladies. So I decided to build this app. The goal was to be able to listen to a YouTube video in English and see the captions in a different language.</p><p>First I needed to get the captions for a YouTube video. I googled it, and found that you can get the caption for a video by using a special YouTube URL that looks like this.</p><blockquote>  <p>http://gdata.youtube.com/feeds/api/videos/[VIDEOID]/captiondata/[CAPTION TRACKID]</p></blockquote><p>So all I really needed to do was translate these captions. For this I did some research into Google's translate service. After creating a service account, I devised a plan to communicate with the Google\u2019s API. I wanted to do the least work possible. In order to use the service I had to send the API endpoint a key along with my translation request. And I couldn't put the key on the client/webpage of course, because then anyone who visits the site will have the key to my Google translate service account. </p><p>So I needed to put the key to use the service on a server. Then the webpage could make requests to that server. Things were coming along. I designed and wired up a user interface to fetch the YouTube closed captions, then that webpage could send those captions to my server, which would then get sent to Google translate, then back to my server, then to the webpage. And vioala.</p><p>One problem. I couldn't request the YouTube captions from my webpage. Something something, cross-site scripting, something something, CORS. In other words, the browser wasn\u2019t cool with my webpage accessing captions from Youtube\u2019s servers, because YouTube hadn't said it was ok.</p><p>Luckily I had a server already setup for the purpose of hiding my Google key and getting the translations. And since servers do not conform to CORS policies, I could just use it as a reverse proxy to request the captions for my webpage. Then send em off to google for translations.</p><p>I like to think the rest was history. However, I had a number of problems still to encounter. I decided to host the webpage on GitHub pages. And because my app is a \u201Csingle-page-application\u201D, GitHub didn't know how to handle the routing for my application. </p><p>In theory, the routing is simple, the user goes from the main page to a page with a video and translated captions. However the page with the video and translated text isn\u2019t actually a different page. It\u2019s just the same page being rerendered through some fancy sleight of hand. For that reason GitHub doesn\u2019t know what to do when the URL changes. GitHubs like oh shit the user just requested some URL, lets tell the webserver to fetch that new page, but oh wait, there\u2019s no page matching that URL. </p><p>Instead of making a request to the webserver, I need the page to do nothing. So I used a hack where you can have a 404 (resource not found) page, that GitHub redirects to when it can\u2019t find the pages. And that 404 page redirects to the main page after storing the URL with the video ID in session memory. The problem then becomes making use of the session memory, because if I naively set the page location GitHub will trigger a page request, and then I\u2019m in a circle jerk. I learned you can push state to the location history, which won\u2019t trigger this loop. Then hope and pray my single-page-application understands the location history changes and acts accordingly.</p><p>Of course my application didn\u2019t understand shit. So instead I just turned the 404 page into a second copy of the application to handle routing to the captions page. This has been the only thing that has worked so far. I could've made it so that the app doesn\u2019t use the current URL to retrieve captions and translations. But that\u2019s no fun and is not how the cool kids are doing shit. Plus, it means the user has to go through the application UI every time they want to get a video with translated captions, instead of just copy and pasting a URL they may have previously visited.</p><p>Eventually I showed this project off to one of my coworkers. To my delight, he informed me that YouTube already translates captions into any language for you, you just have to click captions settings, then auto translate and boom. </p><p>So ya, thanks Phil. Also the app is currently broken, which you probably realized. I'll fix it at some point.</p>",
  "date": "July 9, 2019",
  "tags": ["Node", "Heroku", "Google Cloud"],
  "external": false
}, {
  "id": 2,
  "title": "PBC Vendor Search",
  "link": "https://www.pbcgov.org/pbcvendors",
  "image": "https://i.ibb.co/nzK3GJN/pbcvendors.png",
  "tools": ".Net | Oracle | PL/SQL",
  "description": "Palm Beach County Vendor Search/Directory",
  "date": "January 20, 2019",
  "tags": ["Node", "Heroku", "Google Cloud"],
  "external": true
}]; // need to maintain two copies of blogs. one thats formatted already, and another that can be easily editied in editor

var blogs = [{
  "id": 5,
  "title": "Bundling Intelligence",
  "image": "https://www.robotbutt.com/wp-content/uploads/2016/09/Picard-Tea-e1473391385313.jpg",
  "imgSizes": ["640px", "1000px"],
  "description": "Writing these entries is starting to feel like a full on chore. And like any chore, lets just get straight into it. Today I met with the CEO of BundleIQ. If you know me, you know this is definitely my feng shui. Most of the people I associate with are bosses in their domains. As a matter of fact, yesterday I was speaking with the CEO of Boca Code. And I've had a few other meetings this week with people of importance.",
  "text": "<p>Writing these entries is starting to feel like a full on chore. And like any chore, lets just get straight into it.</p><p>Today I met with the CEO of <a href=\"https://www.bundleiq.com/\">BundleIQ</a>. <span id=\"text_1081770435135\" class=\"highlight\">If you know me, you know this is definitely my feng shui</span>. Most of the people I associate with are bosses in their domains. As a matter of fact, yesterday I was speaking with the CEO of <a href=\"https://bocacode.com/\">Boca Code</a>. And I've had a few other meetings this week with people of importance. </p><p>We are going  to comeback to my meeting with Nick, the CEO of BundleIQ. First, let me take this opportunity to direct any employers to my newly refined <a href=\"#\" onclick=\"window.open('https://spankyed.github.io/Angel_Resume.pdf', '_-blank', 'fullscreen=yes'); return false;\">resume</a>, a la <a href=\"https://www.linkedin.com/\">Linkedin</a>. The other day I had asked my friend Todd, the CEO of Boca Code, to shit on my resume. He did. And today I learned that <a href=\"https://www.indeed.com/\">Indeed</a> makes resumes for you. </p><p>It was kinda crazy actually, here I am closing out my browser tabs and in the very last tab pops up a very well done resume for myself. At first I thought I was looking at something Todd had sent me. But upon further examination, I realized it was an \"Indeed\" webpage delivering me this present. The best part is that it was practically a mirror image of the examples Todd had showed me the day before. Except it was mine. <span id=\"text_1071500758571\" class=\"highlight\">I'm going to send him this copy now and see what he thinks</span>. </p><p>Alright, lets start chopping at the topic of this entry. I met Nick in a slack group. I'd been advised by Todd and others to check out some slack channels for job postings. Todd showed me how to use the search bar in slack to look for posts with keywords like cofounder. While searching one of the channels, I found a post made by Nick who was looking for a technical cofounder. I sent him a message and thus began our conversation.  </p><p>Pause right here. Ight so check it. Cause I know what alot of you <span id=\"text_293445732369\" class=\"highlight\">so called myselfers</span> out there are thinking after reading those last few sentences \u2026 </p><p><span id=\"text_271896358205\" class=\"highlight\">\"Were'nt you just a web designer like 4 blog entries ago. Now you're shooting your shot as a technical cofounder?\"</span></p><p>First off, <span id=\"text_985895145102\" class=\"highlight\">it was 5 entries ago</span>, and second of all, I don't appreciate the way yal are coming at me. Knowing my struggle, and the work I put in, yal want to come at me sideways like that. Ima remember that shit.</p><p>Look bro, all I can say is <span id=\"text_165662393160\" class=\"highlight\">I get shit done</span>. Been doing this since I was a jit. I was 11 sitting at my computer writing down <span id=\"text_1519863590231\" class=\"highlight\">Java code on a piece of paper</span>. That same year I setup my laptop as a game server. Picture a short, curly haired, black kid back in 2007 downloading no-ip so he could forward traffic to a slow ass computer so 3 people could login into his RSPS. <span id=\"text_508530884715\" class=\"highlight\">By 13 I was making fire ass business graphics to sell my gaming services on Zybes</span>. At 14, while yal was worried about <span id=\"text_1210293116337\" class=\"highlight\">sneaking out to go smoke your reefer</span> and fornicate with the opposite sex, I was worried about sneaking under my bed to check my laptop and make sure the bots I'd programmed were still up and running. </p><p>Clearly I'm just built differently. Cut from a more illustrious cloth. <span id=\"text_1310005886132\" class=\"highlight\">I am the traveler</span>.</p><p>Nah but in all serious, I'm just shooting my shot. Miss 100% of ones you don't take am I right. And ya know, I've always been the sink or swim kinda guy. When I can, I push through. In retrospect, I don't know of any job I've taken up where I met all the requirements beforehand. <span id=\"text_1281730851274\" class=\"highlight\">Hell, in a way, the requirements were met just by me showing up</span>.</p><p>What do I mean? For Instance, if someone wanted to get into skateboarding right, the first step would be showing up to the skatepark with a board ready to skate. In other words, showing up is half the battle. The rest of the battle is becoming one with the task at hand, and believing you can achieve. Plus time, effort, natural talent, whatever whatever.</p><p>How hard could it be? Nick sent over a review of the tech stack and I pretty much checked off most of the stuff as being things I'm already familiar with or could easily learn about. There was a few big words in there like Kubernetes and PBKDF2 encryption, but we not finna let that get to us. I look words like that in the eye and say, fuck out of here.</p><p>Lets be honest though. I have 3 fears in life. And big words like kubernetes, <span id=\"text_553239756604\" class=\"highlight\">determinism</span>, and <span id=\"text_1419021458522\" class=\"highlight\">commitment</span> are all of them. So ya, Ima keep yal posted on the situation. </p><p>In other business related news, a researcher named Marc messaged me a few weeks ago looking to start a Nutritions Company. Work on this is planned to begin in about a week. Marc is a Scientist at <a href=\"https://www.uni-marburg.de/en\">Philipps University of Marburg</a> in Germany. German graduates go to him for help with their masters thesis. He has some good ideas. He wants to look at the body as a blackbox with inputs and outputs. Control the input and you can control the output. </p><p>For a little check on the weather, it is currently raining. Which sucks cause I kinda wanted to go skate. My friend Caleb hit me up this morning to go out to Miami and skate Lot 11. I was just like bro I live wellington now, thats a bop and a half. Its all cool though, cause I had plans to finish writing this blog entry anyways. Which if you cant tell is wrapping up. Still tryna figure out how Ima do that. Think Ima just leave yal with some shit like this..</p><p><span id=\"text_1108273516151\" class=\"highlight\">No matter what, keep your head up. Even in the darkest moments you can find a reason to smile.</span> </p>",
  "annotations": [{
    "id": 1081770435135,
    "html": "<p>Reference to the song Fight Night by Migos.</p><div class=\"bg-black video-wrapper\"><iframe width=\"420\" height=\"345\" src=\"https://www.youtube.com/embed/HsVnUpl2IKQ\"></iframe></div>"
  }, {
    "id": 1071500758571,
    "html": "<p>He approved for the most part.</p>\n<blockquote>\n  <p>I would just remove the paragraph under each job and then it would be perfect!</p>\n</blockquote>"
  }, {
    "id": 293445732369,
    "html": "<p>Reference to the blog entry titled \"The Seeds Are Rippe\" where a passage reads,</p>\n<blockquote>\n  <p>Or about myself, I think that is where this is going. And since we are talking about myself good news, I found my pants. Thats an inside joke with myself (see what I did there). You’re not a true myselfer if you don't get it. Sorry bro its a my-self thing.</p>\n</blockquote>"
  }, {
    "id": 271896358205,
    "html": "<p>Reference to the blog entry titled \"Dungeons and Developers\" where a passage reads,</p>\n<blockquote>\n  <p>Who am I fooling Im no lvl 24 web developer. Im a web designer at best. I should be honored that someone even messaged me for my help. Fuck my career aspirations, right?</p>\n</blockquote>"
  }, {
    "id": 985895145102,
    "html": "<p><strong>FACT CHECK:</strong> One blog entry ago would be the previous entry. Following this logic, four blog entries ago would be Angel's first entry, which is the entry being discussed here. There is no entry corresponding to five entries ago.</p>"
  }, {
    "id": 165662393160,
    "html": "<p>There is much evidence that supports the contrary being true.</p>"
  }, {
    "id": 1519863590231,
    "html": "<p>Writing code on paper is comparable to learning to swim in a sink.</p>"
  }, {
    "id": 508530884715,
    "html": "<p>There are numerous <a href=\"https://www.sythe.org/threads/leafy-firecapes-cheap-prices-money-back-guarantee-trusted\">accounts on Zybes</a> created between late 2010-2012 with information identifying Angel as the owner. He would have been between the ages of 14-16 when these accounts were created and not 13 as stated. All of these accounts are banned, and there is damning evidence that Angel was involved in online scams with these accounts. It is reported that Angel used his graphic design skills to create professional looking threads and fake vouchers. He would then trick clients into thinking that he would provide them a service, but would instead steal their valuable ingame items. </p>"
  }, {
    "id": 1210293116337,
    "html": "<p>Psychological projection is a defense mechanism in which the human ego defends itself against unconscious impulses or qualities by denying their existence in themselves while attributing them to others.</p>"
  }, {
    "id": 1310005886132,
    "html": "<p>This is a reference to a story that Angel tells people to coerce them into free/cheap labor. The story is not publicly available.</p>"
  }, {
    "id": 1281730851274,
    "html": "<p>This is a reference to the story of how Angel landed his first entry level job. Angel supposedly told a hiring manager to schedule an interview for their earliest convenience. He woke up the next afternoon and checked his phone. His phone showed an email for an interview scheduled in an hour. The interview location was an hour away and he had no presentable clothes. He quickly ironed a dirty attire and headed out to interview for a position, which he was later offered. This story is unconfirmed.</p>"
  }, {
    "id": 553239756604,
    "html": "<p>Angel constantly talks about determinism in his blog, whether subtle or direct, as shown in this excerpt from the entry titled \"The Choice Is Yours\"</p>\n<blockquote>\n  <p>And if after exploring The Venus Project you still got some indeterminism left in you, listen to a talk or two by Jiddu Krishnamurti.</p>\n</blockquote>"
  }, {
    "id": 1419021458522,
    "html": "<p>Angel often mentions projects he plans to work on, with little follow through. The work is rarely exhibited, not public, or not being developed. </p>"
  }, {
    "id": 1108273516151,
    "html": "<p>A reference to \"One of the best Captain's Logs\".</p><div class=\"bg-black video-wrapper\"><iframe src=\"https://www.youtube.com/embed/wP20erTQf4g?t=41\"></iframe></div>"
  }],
  "date": "Stardate 98143.54",
  "tags": ["BundleIQ", "Star-Trek", "2020"],
  "readTime": 6
}, {
  "id": 4,
  "title": "How to Help When You Can't Help",
  "image": "https://static.wixstatic.com/media/fac0f1_7f62ca69b0954e16b662c79d2786f068~mv2.jpg",
  "imgSizes": ["640px", "1000px"],
  "description": "This is going to be the first blog where I didnt have a general idea of where the entry was going. Most of the time I have a rough outline (even though it might not look like it). The work is trying to get  the ideas out of my head before they are loss. But here, I dont really have any ideas. Idk, but we're going to make it work. And by we're I mean me. Cause you cant help right?",
  "text": "<p>This is going to be the first blog where I didn't have a general idea of where the entry was going. Most of the time I have a rough outline (even though it might not look like it). The work is trying to get the ideas out of my head before they are loss. But here, I don't really have any ideas. </p><p>Idk, but we're going to make it work. And by we're I mean me. Cause you cant help right?</p><p>Or can you?</p><p>So look bro, one of my biggest pet peeves is when people at the skate park who seen me fall ask</p><blockquote>  <p>Yo you good?</p></blockquote><p>Like bro, ya I'm likely good. </p><p>But what if I wasn't. What if I wasn't good? What if in this very moment I was in agonizing pain, what are you going to do to make things better?</p><p>In fact, what if your not okay? What are you going to do then? </p><p>Like i said in the beginning I'm not really sure where this is going. If you were reading this for some sort of edification, I apologize. </p>",
  "date": "July 11, 2020",
  "tags": ["Help", "2020"],
  "readTime": '< 1'
}, {
  "id": 3,
  "title": "The Seeds are Rippe",
  "image": "https://nypost.com/wp-content/uploads/sites/2/2020/06/george-floyd-1.jpg?quality=80&strip=all",
  "imgSizes": ["640px", "1000px"],
  "description": 'Hi, my names Angel. Welcome to my talk. How is everyone doing? More importantly how are you doing as an individual right now? I want to talk to you personally. Can we take a moment? Are you there?',
  "text": "<p>Hi, my names Angel. Welcome to my talk. How is everyone doing? More importantly how are you doing as an individual right now? I want to talk to you personally. Can we take a moment?</p><p>Are you there?</p><p>Great, I hope your here to take this journey with me. Perhaps, it is just me alone on this journey. Which is ok. If that is the case, I feel I am in good company. Let me take this moment to tell you about yourself. </p><p>Or about myself, I think that is where this is going. And since we are talking about myself good news, I found my pants. Thats an inside joke with myself (see what I did there). You\u2019re not a true myselfer if you don't get it. Sorry bro its a my-self thing. </p><p>Language is funny. A dull and insufficient instrument at times. Other times it can cut razor sharp. However, I'm not sure if theres any instrument sharp enough to capture the clarity of the image I want to portray. Perhaps polished be it may. </p><p>Polished enough to see oneself. </p><p>Thanks for coming to my talk. </p><p>Wait that doesn't sound right. Okay, so look we have a lot of protocols for dealing with one another. Especially now, ya know, with everything thats going on. So hear me out. I got this shiny new invention thats going to completely solve all this. </p><p>Its a program Ima call \"Quote\" that makes a record of what you last said, complete sentence or maybe by past seconds. Kinda like that program that handles log entries on Star Trek. That would make writing this a lot easier. Except I'm not saying any of this out loud. Would be better if it was written. This the same reason I don't wanna talk to you people about getting work done over the phone. I rather have our conversation in messages so we can look back on them and shit. I don't know. But also, just to help people get ones thoughts together and their mind right. Recharging your workplace culture, all that. Bro this is going bad.</p><p>Check me out though, its not like you don't already have a ton of programs listening to your audio now anyways. With this you know we listenen to you at all times. And we will make a log of other applications that are recording you and let you know they recording too. Ay and look, you can keep all your recordings to yourself and shit ion even care. Its going to be like your own privacy fence, starting with audio. And its gonna give you a quote of all your data thats being used by other companies too. </p><p>You know what sucks. Finding out something you were in support of might not of been in your best interest. Now you gotta cast it aside like it disappointed you the whole time type shit. Or nah maybe not the whole time. But large sections of it. Time\u2026</p><p>Wow, this is starting to feel like a waste of it, am I right? </p><p>Cause I feel like I'm wrong. </p><p>This is atleast definately a waste of space. Can we agree? </p><p>Why are you so tense. Feel like I'm trying to sell you something. If I could just get you to pullout your phone and download this app. </p><p>Nah but this is serious talk bro. Thats why I'm glad I could share it. With you. And thank you for being such good company. </p>",
  "date": "July 06, 2020",
  "tags": ["Self-Care", "Quotes", "2020"],
  "readTime": 2
}, {
  "id": 2,
  "title": "The Choice Is Yours ",
  //https://i.imgur.com/aFIFrum.png , https://i.imgur.com/ITmGmcm.jpg
  "image": "https://imgur.com/aFIFrum.png",
  "imgSizes": ["640px", "1000px"],
  "description": 'I went to McDonalds this evening. They forgot to give me the fries that they charged me for. I didnt realize until I got home of course. I was dissapointed because I had been friendly with the lady who handed me my food, going as far as to ask her what time she got off that evening...',
  "text": "<div><p>I went to McDonalds this evening. They forgot to give me the fries that they charged me for. I didn't realize until I got home of course. I was dissapointed because I had been friendly with the lady who handed me my food, going as far as to ask her what time she got off that evening.</p><p>About 12 hours earlier, I was at the same McDonalds for a late night-early morning meal. I saw that they had sausage &amp; egg mcmuffins for half-price from 5am - 10am. When I went to order it, I was informed over the intercom that the offer didnt start for another 12 minutes. This information was provided courtesy of the same lady who would hand me a fry-less bag later that evening. With some quick maths I calculated how much money I would make in 15 mins at my job. I concluded that, relative to my hourly wage, it wouldnt be worth my time to wait the 12 minutes. I pay the full price of 3.89 and go about my morning/night.</p><p>24 hours later, 12 hours after I was handed the bag without fries, I was very hungry again. Being too early in the morning to confront a McDonalds employee about my fry situation the previous day, I decide to go to taco bell. Fortuanetly, taco bell closed 2 hours prior to my arrival. So the only other option in this percuilar situation, was to head to the McDonalds at which I was cheated out of a medium fry and denied a cheap sausage &amp; egg mcmuffin. </p><p>I make it to the drive thru menu, and proceed with my order. A quarter pounder, mchicken and a mango smoothie. It was not my normal 5am meal, i felt like improvising a little. I neglected to mention to the employee over the intercom the free medium fry that i expected to be included in my order, until I got to the window. I felt it was better to inform an employee of my sitatuion face to face rather then over an intercom. </p><p>Before I continue with the story, I just wanna mention briefly what the subject of this blog entry is: </p><blockquote><p>Never be so sure of what you want that you arent willing to take something better.</p></blockquote><p>See, I expected that whatever I ordered would include a medium fry- free of charge. I would explain my situation at the window and negotiate compesation for my losses. If they refused I would refuse to pay for the rest of my order, and threaten to take my business to another McDonalds, which conveniently happened to be just as far from my house as the current one. </p><p>Before I could proceed with this plan however, I had to go by the bank and withdraw 20 bucks. They were only accepting cash at this time. After this minor hiccup I proceeded with the plan to secure the free medium fry. I placed my order and drove up to the window; no one was there to take my payment. This wasnt a serious issue, I just needed to wait for an employee to come take my money. A thought came to my mind... what if I pretend I don't have cash, only my credit card. They would of course be annoyed, because they explicitly told me they were only taking cash and a small confrontation would likely insue. But thats it right? I would promptly tell them Im joking, then request they give me a free fry and hand them the cash for the meal. </p><blockquote><p><em>Employee</em>:  \"Hery darling, quarter pounder, mchicken and a mango smoothie- $8.89\".<br><em>Me</em>:  \"Alright\", attempts to hand employee credit card.<br><em>Employee</em>:  \"Cash only\"<br><em>Me</em>:  \"wah?\"<br><em>Employee</em>:  \"I said cash only 10 times at the window..\"<br><em>Me</em>:  \"Oh, I didnt kno what you were saying\"</p></blockquote><p>Employee: lets out big sigh, murmurs something to coworker, closes window and walks away.</p><p>At this point I know Im in for a treat. Whatever happens next is gotta be better then a medium fry. First assumption: Im getting a free meal. And sure enough that is what ocurred. </p><p>So why am I telling you this story? Well, I figured it be more interesting then writing about VDOMs. Im tryna fillup this blog with some content cause it looks wierd otherwise. And being a tech guy, my first inclination is to write about something tech related. Its what all the other cool kids are doing. So I considered writing about Virtual DOMs. I then got hungry and headed to McDonalds for my free medium fry.</p><p>Before I continue with the rest of this blog post, checkout <a href=\"https://www.yang2020.com/\" target=\"_blank\">Andrew Yang's</a> presidential campaign. He's like the Bernie Sanders 2.0. And he wants to give everyone 1000 bucks a month.</p><p>Anyways in recent news, I matched with the lady from McDonalds on a dating app. Perhaps one of these days Ill take her out to taco bell. She works like 12 hours a day though, which is retarded. </p><p>But you know whats not retarded? $1000 bucks a month, courtesy of <a href=\"https://www.youtube.com/watch?v=Xz3L79mBKD0&amp;t=82s\" target=\"_blank\">Andrew Yang</a>. Really you should check em out. Hes a tech entreprenuer so hes pro-automation. Hopefully he can expedite the automation of fast food workers. No human no problem right? Shouldnt be to hard to engineer an automated solution to fast food. Theres not much special about it, its fairly straight forward. And Im confident a machine wouldnt have forgotten to give me my medium fries. They would have however, still denied the deal with the sausage &amp; egg mcmufin 12 minutes before 5. And a computer wouldnt of been subject to give me a whole meal for the free (shoutout to that lady for looking out). </p><p>Also, while your at it, checkout <a href=\"https://www.youtube.com/watch?v=Yb5ivvcTvRQ&amp;t=1915s\" target=\"_blank\">The Venus Project</a>. I stole the picture for this post from one of their videos so only fair I plug them somewhere in this. And if after exploring The Venus Project you still got some indeterminism left in you, listen to a talk or two by <a href=\"https://www.youtube.com/watch?v=hLeQBHlWmfE\" target=\"_blank\">Jiddu Krishnamurti</a>.</p><p>Btw if you do begin to endorse Yang's platform of 1000 a month for every american, your gonna have to deal with a common objection that goes like this: giving everyone 1k a month will disensentivice work and everyone will be lazy. The objector will posit that instead you should jusr work hard, play by the rules, and you\u2019ll go as far as your talents will take you. </p><p><a href=\"https://www.youtube.com/watch?v=dRolGQ3QJPE\" target=\"_blank\">[insert link to rebuttal here]</a> </p><p> I could've summarized the link above, and perhaps related the last few paragraphs to the subject of this blog entry better, but I cant be bothered. In honesty it would be more boring than writing about VDOMs.</p><p>Stop wage slavery, vote for Andrew Yang.  </p><p>Alright I'm out peace. </p></div>",
  "date": "June 22, 2019",
  "tags": ["Communism", "Mangos", "2020"],
  "readTime": 5
}, {
  "id": 1,
  "title": "Dungeons & Developers ",
  "image": "https://cdnb.artstation.com/p/assets/images/images/007/027/571/large/greg-rutkowski-dragon-cave-1920.jpg?1503141992",
  "imgSizes": ["1100px", "1450px"],
  "description": 'Alright so Im not a crappy person. Sometimes I just think like one.Like this afternoon when I got a message from someone "looking for help with web design". It was obvious the guy had messaged the wrong person. Im a web developer (aka software developer/engineer). Not a web designer...',
  "text": "<div><p>Alright so Im not a crappy person. Sometimes I just think like one. </p><p>Like this afternoon when I got a message from someone \"looking for help with web design\". It was obvious the guy had messaged the wrong person. Im a web developer (aka software developer/engineer). Not a web designer. But hold on, </p><blockquote><p>after reading your Simbi page, I wonder if you might also be able to help me with another goal of mine. </p></blockquote><p>Hopefully something developer oriented, am I right?</p><blockquote><p>Do you see this set-up here: <a href=\"http://www.dungeonsanddevelopers.com\" target=\"_blank\">www.dungeonsanddevelopers.com</a>? Id really love to find a way to copy it (or make my own), where I can make my own talent tree, add my own images and text</p></blockquote><p>Heres a list of things Id really love... </p><p>Id really love a puppy. Id really love a decent haircut. Id really love to see a few people attempt to drop in at my local skatepark. Id really love for there to be more 3D character artists/animators on the internet willing to work for free. Id really love it if Rune Skovbo could help Mackey calculate 2D blend trees in javascript so I can steal his animation code. Id really love it if the bank would stop forclosing on my home. Id really love to write a good blog entry.</p><p>I probably wouldnt mind making a skill/talent tree for the guy messaging me either. I mean I have to do something similar to interface with the dialog tree from Watson Assistant for one of my project anyways. Plus if I decide not to help him, he might try to say I stole his idea and used it in one of my projects.</p><p> If you havent visited the <a href=\"http://www.dungeonsanddevelopers.com/\" target=\"_blank\">Dungeon And Developers</a> website yet, dont worry, I already did it for you. Its basically a quiz to test how talented you are in web development. Im a lvl 24 web developer. </p><p> <img src=\"https://i.imgur.com/SYvFkRA.png\" alt=\"level-24-developer\"><br>Who am I fooling Im no lvl 24 web developer. Im a web designer at best. I should be honored that someone even messaged me for my help. Fuck my career aspirations, right? I am curently reevaluating why I signed up on that sYmBiOtiC site in the first place. My house is getting forclosed, I need to be looking for a way to pay this mortgage, not designing someones skill tree for the free. </p><p>If your still reading this, let me take this opportunity to share with you my <a href=\"#\" onclick=\"window.open('https://spankyed.github.io/Angel_Resume.pdf', '_-blank', 'fullscreen=yes'); return false;\">resume</a> in case your considering hiring me for a job (please help).</p><p>Idk where im going with this blog. Its my first time, go easy on me . If this blog hasnt been useful for anything, jus know... you should try and eat a mango while its still mostly green. The way I see it, most the mangos you will ever eat will probably be ripe and mostly yellow. But if your like me, and you really love mangos, try mixing it up by eating one while its still a little bitter. Its a nice way to condition yourselve for the bullsh-</p><p><img src=\"https://i.imgur.com/JH5R83O.jpg\" alt=\"green-mangos\"></p><p>Crap, I suck at blogging. Feel like I couldve written the whole thing backwards and it wouldve still made as much sense. I hope I get better at this. And by get better, I mean I hope it takes less time cause I got other stuff to do. Btw there may have been more to the site that I titled this entry after. I just didnt care enough to look into it.  Supposedly its an RPG?</p><p>I think the real takeaway here is this: if you wanna get someone to help you with something, make them reevaluate their identity, and provide them an opportunity to prove that they arent an imposter. And preferably get them to do so at a very challening moment in their lives.</p><p>If you dont wanna hire me you can support me on patreon. Im tryna buy a racing sim rig. I will design you a website for all donations over $50. I havent really setup the patreon yet, so just cashapp me and we will work it out.</p></div>",
  "date": "June 12, 2019",
  "tags": ["Design", "Devopment", "Javascript", "Mangos"],
  "readTime": 4
}];
var _default = {
  projects: projects,
  blogs: blogs,
  counters: (0, _toConsumableArray2.default)(new Array(10)).map(function (item, index) {
    return {
      id: randString(),
      count: 0,
      theme: themes[index % 10]
    };
  })
};
exports.default = _default;
},{"@babel/runtime/helpers/toConsumableArray":"node_modules/@babel/runtime/helpers/toConsumableArray.js"}],"src/index.js":[function(require,module,exports) {
"use strict";

var _hyperapp = require("hyperapp");

var _router = require("@hyperapp/router");

require("./style.css");

var _home = _interopRequireDefault(require("./pages/home"));

var _blogs = _interopRequireDefault(require("./pages/blogs/blogs"));

var _blog = _interopRequireDefault(require("./pages/blogs/blog"));

var _projects = _interopRequireDefault(require("./pages/projects/projects"));

var _data = _interopRequireDefault(require("./data"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var home = (0, _home.default)();
var blogs = (0, _blogs.default)(_data.default.blogs); // data.blogs sets initial value for module

var projects = (0, _projects.default)(_data.default.projects);
var state = {
  location: _router.location.state,
  home: home.state,
  // router module
  blogs: blogs.state,
  projects: projects.state
};
var actions = {
  location: _router.location.actions,
  home: home.actions,
  blogs: blogs.actions,
  projects: projects.actions
};

var view = function view(state, actions) {
  var index = {
    home: home.view(state.home, actions.home),
    blogs: blogs.view(state.blogs, actions.blogs),
    projects: projects.view(state.projects, actions.projects)
  };
  return (0, _hyperapp.h)("div", {
    class: "relative"
  }, (0, _hyperapp.h)(_router.Switch, null, (0, _hyperapp.h)(_router.Route, {
    path: "/",
    render: index.home
  }), (0, _hyperapp.h)(_router.Route, {
    parent: true,
    path: "/projects",
    render: index.projects
  }), (0, _hyperapp.h)(_router.Route, {
    parent: true,
    path: "/blogs",
    render: index.blogs
  })), !state.home.audioPlaying ? "" : (0, _hyperapp.h)("button", {
    onclick: actions.home.pauseAudio,
    class: "fixed bottom-0 left-0 w-8 m-3 class w-10 h-10 bg-reddish rounded-full hover:bg-red-700 active:shadow-lg mouse shadow transition ease-in duration-200 focus:outline-none"
  }, (0, _hyperapp.h)("img", {
    class: "p-1",
    src: "https://upload.wikimedia.org/wikipedia/commons/3/3f/Mute_Icon.svg"
  })));
};

var main = (0, _hyperapp.app)(state, actions, view, document.body);

var unsubscribe = _router.location.subscribe(main.location);
},{"hyperapp":"node_modules/hyperapp/src/index.js","@hyperapp/router":"node_modules/@hyperapp/router/src/index.js","./style.css":"src/style.css","./pages/home":"src/pages/home.js","./pages/blogs/blogs":"src/pages/blogs/blogs.js","./pages/blogs/blog":"src/pages/blogs/blog.js","./pages/projects/projects":"src/pages/projects/projects.js","./data":"src/data/index.js"}],"node_modules/parcel/src/builtins/hmr-runtime.js":[function(require,module,exports) {
var global = arguments[3];
var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;

function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {});
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };
  module.bundle.hotData = null;
}

module.bundle.Module = Module;
var parent = module.bundle.parent;

if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = "" || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + "51001" + '/');

  ws.onmessage = function (event) {
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      console.clear();
      data.assets.forEach(function (asset) {
        hmrApply(global.parcelRequire, asset);
      });
      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          hmrAccept(global.parcelRequire, asset.id);
        }
      });
    }

    if (data.type === 'reload') {
      ws.close();

      ws.onclose = function () {
        location.reload();
      };
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
      removeErrorOverlay();
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + data.error.stack);
      removeErrorOverlay();
      var overlay = createErrorOverlay(data);
      document.body.appendChild(overlay);
    }
  };
}

function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);

  if (overlay) {
    overlay.remove();
  }
}

function createErrorOverlay(data) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID; // html encode message and stack trace

  var message = document.createElement('div');
  var stackTrace = document.createElement('pre');
  message.innerText = data.error.message;
  stackTrace.innerText = data.error.stack;
  overlay.innerHTML = '<div style="background: black; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; opacity: 0.85; font-family: Menlo, Consolas, monospace; z-index: 9999;">' + '<span style="background: red; padding: 2px 4px; border-radius: 2px;">ERROR</span>' + '<span style="top: 2px; margin-left: 5px; position: relative;">🚨</span>' + '<div style="font-size: 18px; font-weight: bold; margin-top: 20px;">' + message.innerHTML + '</div>' + '<pre>' + stackTrace.innerHTML + '</pre>' + '</div>';
  return overlay;
}

function getParents(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];

      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAccept(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAccept(bundle.parent, id);
  }

  var cached = bundle.cache[id];
  bundle.hotData = {};

  if (cached) {
    cached.hot.data = bundle.hotData;
  }

  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }

  delete bundle.cache[id];
  bundle(id);
  cached = bundle.cache[id];

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb();
    });

    return true;
  }

  return getParents(global.parcelRequire, id).some(function (id) {
    return hmrAccept(global.parcelRequire, id);
  });
}
},{}]},{},["node_modules/parcel/src/builtins/hmr-runtime.js","src/index.js"], null)
//# sourceMappingURL=/src.a2b27638.map