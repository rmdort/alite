function alite(opts) {
  function noop() { }

  const defaultHeaders = {
      'contentType': 'application/x-www-form-urlencoded'
    , 'requestedWith': 'xmlHttpRequest'
    , 'accept': {
          '*':  'text/javascript, text/html, application/xml, text/xml, */*'
        , 'xml':  'application/xml, text/xml'
        , 'html': 'text/html'
        , 'text': 'text/plain'
        , 'json': 'application/json, text/javascript'
        , 'js':   'application/javascript, text/javascript'
      }
  }

  function serializeQueryString(o, trad) {
    var prefix, i
      , traditional = trad || false
      , s = []
      , enc = encodeURIComponent
      , add = function (key, value) {
          // If value is a function, invoke it and return its value
          value = ('function' === typeof value) ? value() : (value == null ? '' : value)
          s[s.length] = enc(key) + '=' + enc(value)
        }
    // If an array was passed in, assume that it is an array of form elements.
    if (Array.isArray(o)) {
      for (i = 0; o && i < o.length; i++) add(o[i]['name'], o[i]['value'])
    } else {
      // If traditional, encode the "old" way (the way 1.3.2 or older
      // did it), otherwise encode params recursively.
      for (prefix in o) {
        if (o.hasOwnProperty(prefix)) buildParams(prefix, o[prefix], traditional, add)
      }
    }

    // spaces should be + according to spec
    return s.join('&').replace(/%20/g, '+')
  }

  function buildParams(prefix, obj, traditional, add) {
    var name, i, v
      , rbracket = /\[\]$/

    if (Array.isArray(obj)) {
      // Serialize array item.
      for (i = 0; obj && i < obj.length; i++) {
        v = obj[i]
        if (traditional || rbracket.test(prefix)) {
          // Treat each array item as a scalar.
          add(prefix, v)
        } else {
          buildParams(prefix + '[' + (typeof v === 'object' ? i : '') + ']', v, traditional, add)
        }
      }
    } else if (obj && obj.toString() === '[object Object]') {
      // Serialize object item.
      for (name in obj) {
        buildParams(prefix + '[' + name + ']', obj[name], traditional, add)
      }

    } else {
      // Serialize scalar item.
      add(prefix, obj)
    }
  }

  function urlappend (url, s) {
    return url + (/\?/.test(url) ? '&' : '?') + s
  }

  function response(req) {
    var responseText = req && req.responseText;
    var isJson = /^[\{\[]/.test(responseText);

    return isJson ? JSON.parse(responseText) : responseText;
  }

  return new Promise(function(resolve, reject) {
    var req = (opts.xhr || noop)() || new XMLHttpRequest();
    var data = typeof opts.data !== 'string' ? serializeQueryString(opts.data) : (opts.data || null);
    var url = opts.url
    var headers = Object.assign({}, defaultHeaders, opts.headers)

    if (opts.method == 'GET' && data) {
      url = urlappend(url, data)
      data = null
    }

    req.onreadystatechange = function () {
      if (req.readyState == 4) {
        if (req.status >= 200 && req.status < 300) {
          resolve({ response: response(req), xhr: req });
        } else {
          reject({ response: response(req), xhr: req });
        }

        (alite.ajaxStop || noop)(req, opts);
      }
    }
    
    req.open(opts.method, url);

    if (headers) {
      for (var name in headers) {
        req.setRequestHeader(name, headers[name]);
      }
    }

    (alite.ajaxStart || noop)(req, opts);
    (opts.ajaxStart || noop)(req);

    req.send(data);
  })
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = alite;
}
