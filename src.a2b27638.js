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
},{"_css_loader":"node_modules/parcel/src/builtins/css-loader.js"}],"src/pages/home.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _hyperapp = require("hyperapp");

var _router = require("@hyperapp/router");

var _default = function _default(state, actions) {
  return (0, _hyperapp.h)("div", {
    class: "bg-wurp max-w-3xl flex items-center h-auto lg:h-screen flex-wrap mx-auto my-32 lg:my-0"
  }, (0, _hyperapp.h)("div", {
    class: "w-full lg:w-2/5 "
  }, (0, _hyperapp.h)("img", {
    src: "https://scontent-mia3-2.xx.fbcdn.net/v/t1.0-9/538135_477566988970424_1936353685_n.jpg?_nc_cat=111&_nc_oc=AQm4YNH3OJb-ZSHnFrW-6kETx2ecxDBUKOE8CQbgXLQSdOLqer_iqG-LmUveQ5JKwFMLtAUNox8CFMRqNSDe4CRP&_nc_ht=scontent-mia3-2.xx&oh=4c570dac25f794b8e68ceab0d2095342&oe=5D98B609",
    class: "shadow-2xl hidden lg:block rounded-sm"
  })), (0, _hyperapp.h)("div", {
    id: "profile",
    class: "flex w-full lg:w-3/5 shadow-2xl bg-reddish mx-6 lg:mx-0 rounded-sm"
  }, (0, _hyperapp.h)("div", {
    class: "w-full pt-8 md:px-12 md:pb-6 text-center lg:text-left"
  }, (0, _hyperapp.h)("div", {
    class: "block lg:hidden rounded-full shadow-xl mx-auto -mt-16 h-48 w-48 bg-cover bg-center border-solid border-4 shadow-inset",
    style: "background-image: url('https://scontent-mia3-2.xx.fbcdn.net/v/t1.0-9/538135_477566988970424_1936353685_n.jpg?_nc_cat=111&_nc_oc=AQm4YNH3OJb-ZSHnFrW-6kETx2ecxDBUKOE8CQbgXLQSdOLqer_iqG-LmUveQ5JKwFMLtAUNox8CFMRqNSDe4CRP&_nc_ht=scontent-mia3-2.xx&oh=4c570dac25f794b8e68ceab0d2095342&oe=5D98B609')"
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

exports.default = _default;
},{"hyperapp":"node_modules/hyperapp/src/index.js","@hyperapp/router":"node_modules/@hyperapp/router/src/index.js"}],"src/pages/blogs/blog.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _hyperapp = require("hyperapp");

// Blogs Module
// initial: data.blogs
var _default = function _default(blogs, actions) {
  return function (_ref) {
    var match = _ref.match;
    window.scrollTo(0, 0);
    var blog = blogs.filter(function (blog) {
      return blog.id == match.params.blog_id;
    })[0];
    return (0, _hyperapp.h)("section", null, (0, _hyperapp.h)("div", {
      class: "hidden lg:block w-full bg-center bg-no-repeat",
      style: "background-size: ".concat(blog.imgSizes[1], "; height:80vh; background-image:url(").concat(blog.image, ");")
    }), (0, _hyperapp.h)("div", {
      class: "block lg:hidden w-full bg-no-repeat",
      style: "background-size: 850px; background-position: 50% 0%; height:60vh; background-image:url(".concat(blog.image, ");")
    }), (0, _hyperapp.h)("div", {
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
    }, blog.title)), (0, _hyperapp.h)("p", {
      class: "py-6"
    }, blog.text))));
  };
};
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


exports.default = _default;
},{"hyperapp":"node_modules/hyperapp/src/index.js"}],"src/pages/blogs/blogs.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _hyperapp = require("hyperapp");

var _router = require("@hyperapp/router");

var _blog = _interopRequireDefault(require("./blog.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Blogs Module
var BlogLink = function BlogLink(_ref) {
  var match = _ref.match,
      blog = _ref.blog;
  return (0, _hyperapp.h)(_router.Link, {
    to: "".concat(match.path, "/").concat(blog.id),
    class: "mx-auto mb-8 mx-2 bg-reddish rounded-lg shadow block flex-wrap flex w-full text-white",
    href: "/updating-to-babel-7.4/"
  }, (0, _hyperapp.h)("div", {
    class: "w-full md:w-1/2 shadow bg-dark-100 rounded-lg rounded-r-none min-h-featured-item bg-center bg-no-repeat",
    style: "background-image: url(".concat(blog.image, ");\n              background-size: ").concat(blog.imgSizes[0], ";")
  }), (0, _hyperapp.h)("div", {
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
    state: {
      blogs: initial
    },
    actions: {
      increment: function increment(evt) {
        return function (state) {
          return {
            cat: 'meow'
          };
        };
      }
    },
    view: function view(state, actions) {
      return function (_ref2) {
        var match = _ref2.match;
        return (0, _hyperapp.h)("div", null, match.params ? (0, _hyperapp.h)(_router.Route, {
          parent: true,
          path: "".concat(match.path, "/:blog_id"),
          render: (0, _blog.default)(state.blogs, actions)
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
        }, "Blog"), (0, _hyperapp.h)("h2", {
          class: "font-light"
        }, "The Communist Soapbox.")))))), state.blogs.map(function (blog) {
          return (0, _hyperapp.h)(BlogLink, {
            blog: blog,
            match: match
          });
        })));
      };
    }
  };
};
/* switch might eliminate coniditional
<Switch></Switch>
*/


exports.default = _default;
},{"hyperapp":"node_modules/hyperapp/src/index.js","@hyperapp/router":"node_modules/@hyperapp/router/src/index.js","./blog.js":"src/pages/blogs/blog.js"}],"src/pages/projects/project.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _hyperapp = require("hyperapp");

// Projects Module
var _default = function _default(projects, actions) {
  return function (_ref) {
    var match = _ref.match;
    var project = projects.filter(function (project) {
      return project.id == match.params.project_id;
    })[0];
    return (0, _hyperapp.h)("section", null, (0, _hyperapp.h)("div", {
      class: "hidden mx-auto lg:block w-full bg-center bg-no-repeat",
      style: "background-size: 1450px; height:80vh; background-image:url(".concat(project.image, ");")
    }, (0, _hyperapp.h)("h1", {
      class: "title text-center align-bottom text-yellow pb-4 text-4xl md:text-6xl",
      style: "line-height:60vh;"
    }, project.title)), (0, _hyperapp.h)("div", {
      class: "block lg:hidden w-full bg-no-repeat",
      style: "background-size: 850px; background-position: 50% 0%; height:60vh; background-image:url(".concat(project.image, ");")
    }, (0, _hyperapp.h)("h1", {
      class: "title text-center align-bottom text-yellow pb-4 text-4xl md:text-6xl",
      style: "line-height:60vh"
    }, project.title)), (0, _hyperapp.h)("div", {
      class: "bg-reddish container w-full mx-auto max-w-5xl -mt-32 border-4 border-gray-700"
    }, (0, _hyperapp.h)("div", {
      class: "w-full px-4 md:px-6 text-xl text-gray-100 leading-normal",
      style: "font-family:Georgia,serif;"
    }, (0, _hyperapp.h)("div", {
      class: "font-sans"
    }, (0, _hyperapp.h)("span", {
      class: "text-base md:text-sm text-teal-500 font-bold"
    }, (0, _hyperapp.h)("span", null))), (0, _hyperapp.h)("p", {
      class: "py-6"
    }, project.text))));
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
  return (0, _hyperapp.h)("div", {
    class: "project-link bg-reddish shadow-lg border border-yellow text-grey-80 w-full max-w-lg mb-8 md:mx-8"
  }, (0, _hyperapp.h)(_router.Link, {
    to: "".concat(match.path, "/").concat(project.id),
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
  "title": "My Task Grid",
  "image": "https://res.cloudinary.com/duua3lsu1/image/upload/v1557590908/blog/task-grid-thumbnail.png",
  "tools": "Javascript | React | Sass",
  "description": "Task management app built with Reacts",
  "text": 'Alright so Im not a crappy person. Sometimes I just think like one. Like this afternoon when I got a message from someone "looking for help with web design". It was obvious the guy had messaged the wrong person. Im a web developer (aka software developer/engineer). Not a web designer. But hold on, "after reading your Simbi page, I wonder if you might also be able to help me with another goal of mine". Hopefully something developer oriented, am I right?[screenshot - "Do you see this set-up here? www.dungeonsanddevelopers.com. Id really love to find a way to copy it (or make my own), where I can make my own talent tree, add my own images and text."]Heres a list of things Id really love. Id really love a puppy. Id really love a decent haircut. Id really love to see a few people attempt to drop in at my local skatepark. Id really love for there to be more 3D character artists/animators on the internet willing to work for free. Id really love it if Rune Skovbo could help Mackey calculate 2D blend trees in javascript so I can steal his animation code. Id really love it if the bank would stop forclosing on my home. Id really love to write a good blog entry.I probably wouldnt mind making a skill/talent tree for the guy messaging me either. I mean I have to do something similar to interface with the dialog tree from Watson Assistant for one of my project anyways. Plus if I decide not to help him, he might try to say I stole his idea and used it in one of my projects. If you havent visited the Dungeon And Developers website yet, dont worry, I already did it for you. Its basically a quiz to test how talented you are in web development. Im a lvl 24 web developer. [image here]Who am I fooling Im no lvl 24 web developer. Im a web designer at best. I should be honored that someone even messaged me for my help. Fuck my career aspirations, right? I am curently reevaluating why I signed up on that sYmBiOtiC site in the first place. My house is getting forclosed, I need to be looking for a way to pay this mortgage, not designing someones skill tree for the free. If your still reading this, let me take this opportunity to share with you my [resume] in case your considering hiring me for a job (please help).Idk where im going with this blog. Its my first time, go easy on me . If this blog hasnt been useful for anything, jus know... you should try and eat a mango while its still mostly green. The way I see it, most the mangos you will ever eat will probably be ripe and mostly yellow. But if your like me, and you really love mangos, try mixing it up by eating one while its still a little bitter. Its a nice way to condition yourselve for bullsh-[mango images]Crap, I suck at blogging. Feel like I couldve written the whole thing backwards and it wouldve still made as much sense. I hope I get better at this. And by get better, I mean I hope it takes less time cause I got other stuff to do. Btw there may have been more to the site that I titled this entry after. I just didnt care enough to look into it.  Supposedly its an RPG?I think the real takeaway here is this: if you wanna get someone to help you with something, make them reevaluate their identity, and provide them an opportunity to prove that they arent an imposter. And preferably get them to do so at a very challening moment in their lives.If you dont wanna hire me you can support me on patreon. Im tryna buy a racing sim rig. I will design you a website for all donations over 50. I havent really setup the patreon yet, so just cashapp me and we will work it out.',
  "date": "June 12, 2019",
  "tags": ["Design", "Devopment", "Javascript", "Mangos"]
}, {
  "id": 2,
  "title": "My Task Grid",
  "image": "https://res.cloudinary.com/duua3lsu1/image/upload/v1557590908/blog/task-grid-thumbnail.png",
  "tools": "Javascript | React | Sass",
  "description": "Task management app built with Reacts",
  "text": 'Alright so Im not a crappy person. Sometimes I just think like one. Like this afternoon when I got a message from someone "looking for help with web design". It was obvious the guy had messaged the wrong person. Im a web developer (aka software developer/engineer). Not a web designer. But hold on, "after reading your Simbi page, I wonder if you might also be able to help me with another goal of mine". Hopefully something developer oriented, am I right?[screenshot - "Do you see this set-up here? www.dungeonsanddevelopers.com. Id really love to find a way to copy it (or make my own), where I can make my own talent tree, add my own images and text."]Heres a list of things Id really love. Id really love a puppy. Id really love a decent haircut. Id really love to see a few people attempt to drop in at my local skatepark. Id really love for there to be more 3D character artists/animators on the internet willing to work for free. Id really love it if Rune Skovbo could help Mackey calculate 2D blend trees in javascript so I can steal his animation code. Id really love it if the bank would stop forclosing on my home. Id really love to write a good blog entry.I probably wouldnt mind making a skill/talent tree for the guy messaging me either. I mean I have to do something similar to interface with the dialog tree from Watson Assistant for one of my project anyways. Plus if I decide not to help him, he might try to say I stole his idea and used it in one of my projects. If you havent visited the Dungeon And Developers website yet, dont worry, I already did it for you. Its basically a quiz to test how talented you are in web development. Im a lvl 24 web developer. [image here]Who am I fooling Im no lvl 24 web developer. Im a web designer at best. I should be honored that someone even messaged me for my help. Fuck my career aspirations, right? I am curently reevaluating why I signed up on that sYmBiOtiC site in the first place. My house is getting forclosed, I need to be looking for a way to pay this mortgage, not designing someones skill tree for the free. If your still reading this, let me take this opportunity to share with you my [resume] in case your considering hiring me for a job (please help).Idk where im going with this blog. Its my first time, go easy on me . If this blog hasnt been useful for anything, jus know... you should try and eat a mango while its still mostly green. The way I see it, most the mangos you will ever eat will probably be ripe and mostly yellow. But if your like me, and you really love mangos, try mixing it up by eating one while its still a little bitter. Its a nice way to condition yourselve for bullsh-[mango images]Crap, I suck at blogging. Feel like I couldve written the whole thing backwards and it wouldve still made as much sense. I hope I get better at this. And by get better, I mean I hope it takes less time cause I got other stuff to do. Btw there may have been more to the site that I titled this entry after. I just didnt care enough to look into it.  Supposedly its an RPG?I think the real takeaway here is this: if you wanna get someone to help you with something, make them reevaluate their identity, and provide them an opportunity to prove that they arent an imposter. And preferably get them to do so at a very challening moment in their lives.If you dont wanna hire me you can support me on patreon. Im tryna buy a racing sim rig. I will design you a website for all donations over 50. I havent really setup the patreon yet, so just cashapp me and we will work it out.',
  "date": "June 12, 2019",
  "tags": ["Design", "Devopment", "Javascript", "Mangos"]
}];
var blogs = [{
  "id": 2,
  "title": "The Choice Is Yours ",
  //https://i.imgur.com/aFIFrum.png , https://i.imgur.com/ITmGmcm.jpg
  "image": "https://imgur.com/aFIFrum.png",
  "imgSizes": ["640px", "1000px"],
  "description": 'I went to mcdonalds this evening. They forgot to give me the fries that they charged me for. I didnt realize until I got home of course. I was dissapointed because I had been friendly with the lady who handed me my food, going as far as to ask her what time she got off that evening...',
  "text": 'I went to mcdonalds this evening. They forgot to give me the fries that they charged me for. I didnt realize until I got home of course. I was dissapointed because I had been friendly with the lady who handed me my food, going as far as to ask her what time she got off that evening...',
  "date": "June 22, 2019",
  "tags": ["Communism", "2020", "Mangos"],
  "readTime": 6
}, {
  "id": 1,
  "title": "Dungeons & Developers ",
  "image": "https://cdnb.artstation.com/p/assets/images/images/007/027/571/large/greg-rutkowski-dragon-cave-1920.jpg?1503141992",
  "imgSizes": ["1100px", "1450px"],
  "description": 'Alright so Im not a crappy person. Sometimes I just think like one.Like this afternoon when I got a message from someone "looking for help with web design". It was obvious the guy had messaged the wrong person. Im a web developer (aka software developer/engineer). Not a web designer...',
  "text": 'Alright so Im not a crappy person. Sometimes I just think like one. Like this afternoon when I got a message from someone "looking for help with web design". It was obvious the guy had messaged the wrong person. Im a web developer (aka software developer/engineer). Not a web designer. But hold on, "after reading your Simbi page, I wonder if you might also be able to help me with another goal of mine". Hopefully something developer oriented, am I right?[screenshot - "Do you see this set-up here? www.dungeonsanddevelopers.com. Id really love to find a way to copy it (or make my own), where I can make my own talent tree, add my own images and text."]Heres a list of things Id really love. Id really love a puppy. Id really love a decent haircut. Id really love to see a few people attempt to drop in at my local skatepark. Id really love for there to be more 3D character artists/animators on the internet willing to work for free. Id really love it if Rune Skovbo could help Mackey calculate 2D blend trees in javascript so I can steal his animation code. Id really love it if the bank would stop forclosing on my home. Id really love to write a good blog entry.I probably wouldnt mind making a skill/talent tree for the guy messaging me either. I mean I have to do something similar to interface with the dialog tree from Watson Assistant for one of my project anyways. Plus if I decide not to help him, he might try to say I stole his idea and used it in one of my projects. If you havent visited the Dungeon And Developers website yet, dont worry, I already did it for you. Its basically a quiz to test how talented you are in web development. Im a lvl 24 web developer. [image here]Who am I fooling Im no lvl 24 web developer. Im a web designer at best. I should be honored that someone even messaged me for my help. Fuck my career aspirations, right? I am curently reevaluating why I signed up on that sYmBiOtiC site in the first place. My house is getting forclosed, I need to be looking for a way to pay this mortgage, not designing someones skill tree for the free. If your still reading this, let me take this opportunity to share with you my [resume] in case your considering hiring me for a job (please help).Idk where im going with this blog. Its my first time, go easy on me . If this blog hasnt been useful for anything, jus know... you should try and eat a mango while its still mostly green. The way I see it, most the mangos you will ever eat will probably be ripe and mostly yellow. But if your like me, and you really love mangos, try mixing it up by eating one while its still a little bitter. Its a nice way to condition yourselve for bullsh-[mango images]Crap, I suck at blogging. Feel like I couldve written the whole thing backwards and it wouldve still made as much sense. I hope I get better at this. And by get better, I mean I hope it takes less time cause I got other stuff to do. Btw there may have been more to the site that I titled this entry after. I just didnt care enough to look into it.  Supposedly its an RPG?I think the real takeaway here is this: if you wanna get someone to help you with something, make them reevaluate their identity, and provide them an opportunity to prove that they arent an imposter. And preferably get them to do so at a very challening moment in their lives.If you dont wanna hire me you can support me on patreon. Im tryna buy a racing sim rig. I will design you a website for all donations over 50. I havent really setup the patreon yet, so just cashapp me and we will work it out.',
  "date": "June 12, 2019",
  "tags": ["Design", "Devopment", "Javascript", "Mangos"],
  "readTime": 3
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

var _projects = _interopRequireDefault(require("./pages/projects/projects"));

var _data = _interopRequireDefault(require("./data"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var blogs = (0, _blogs.default)(_data.default.blogs); // data.blogs sets initial value for module

var projects = (0, _projects.default)(_data.default.projects);
var state = {
  location: _router.location.state,
  // router module
  blogs: blogs.state,
  projects: projects.state
};
var actions = {
  location: _router.location.actions,
  blogs: blogs.actions,
  projects: projects.actions
};

var view = function view(state, actions) {
  var index = {
    blogs: blogs.view(state.blogs, actions.blogs),
    projects: projects.view(state.projects, actions.projects)
  };
  return (0, _hyperapp.h)("div", null, (0, _hyperapp.h)(_router.Switch, null, (0, _hyperapp.h)(_router.Route, {
    path: "/",
    render: _home.default
  }), (0, _hyperapp.h)(_router.Route, {
    parent: true,
    path: "/projects",
    render: index.projects
  }), (0, _hyperapp.h)(_router.Route, {
    parent: true,
    path: "/blogs",
    render: index.blogs
  })));
};

var main = (0, _hyperapp.app)(state, actions, view, document.body);

var unsubscribe = _router.location.subscribe(main.location);
},{"hyperapp":"node_modules/hyperapp/src/index.js","@hyperapp/router":"node_modules/@hyperapp/router/src/index.js","./style.css":"src/style.css","./pages/home":"src/pages/home.js","./pages/blogs/blogs":"src/pages/blogs/blogs.js","./pages/projects/projects":"src/pages/projects/projects.js","./data":"src/data/index.js"}],"node_modules/parcel/src/builtins/hmr-runtime.js":[function(require,module,exports) {
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
  var ws = new WebSocket(protocol + '://' + hostname + ':' + "65038" + '/');

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