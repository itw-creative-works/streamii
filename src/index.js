(function (root, factory) {
  // https://github.com/umdjs/umd/blob/master/templates/returnExports.js
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory();
  } else {
    // Browser globals (root is window)
    root.returnExports = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  var environment = (Object.prototype.toString.call(typeof process !== 'undefined' ? process : 0) === '[object process]') ? 'node' : 'browser';

  if (environment === 'browser') {
    try {
      window.Streamii = Streamii;
    } catch (e) {
    }
  }

  function Streamii(options) {
    const self = this;

    options = options || {};
    options.streamURL = options.streamURL;

    options.assets = options.assets || {};
    options.assets.owner = options.assets.owner;
    options.assets.repo = options.assets.repo;

    options.log = options.log || {};
    options.log.interval = options.log.interval || 60000;

    self.options = options;
  };

  Streamii.prototype.stream = function () {
    const self = this;

    require('./lib.js')(self.options);

    return self;
  }

  return Streamii; // Enable if using UMD
}));
