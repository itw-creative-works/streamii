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

  const path = require('path');
  const jetpack = require('fs-jetpack');
  const EventEmitter = require('events').EventEmitter;
  const util = require('util');
  const moment = require('moment');

  function Streamii(options) {
    const self = this;

    options = options || {};

    // Set stream options
    options.stream = options.stream || {};
    options.ingest = options.ingest || '';
    options.stream.size = options.stream.size || '1920x1080';
    options.stream.fps = options.stream.fps || 30;
    options.stream.videoBitrate = options.stream.videoBitrate || 2000;
    options.stream.audioBitrate = options.stream.audioBitrate || 128;

    // Set assets options
    options.assets = options.assets || {};
    options.assets.owner = options.assets.owner;
    options.assets.repo = options.assets.repo;

    // Set other options
    options.autoRestart = typeof options.autoRestart === 'undefined' ? true : options.autoRestart;

    // Set log options
    options.log = options.log || {};
    options.log.interval = options.log.interval || 60000;

    self.options = options;

    // Set properties
    self.startTime = new Date();
    self.restartCount = 0;
    self.status = 'stopped';
    self.ffmpeg = null;
    self.path = process.cwd();
    self.assets = path.resolve(self.path, 'assets');
    self.live = path.resolve(self.path, 'live');

    self.currentFFmpegLog = null;

    self.currentAudio = null;
    self.audioSwitchInterval = null;

    self.currentVideo = null;

    // Log interval
    function elapsed() {
      if (self.status === 'started') {
        const now = moment();
        const startTime = moment(self.startTime);
        const duration = moment.duration(now.diff(startTime));

        const totalElapsedFormatted = `${Math.floor(duration.asDays())}d ${duration.hours()}h ${duration.minutes()}m ${duration.seconds()}s`;

        console.log(`💎 Server has been online for ${totalElapsedFormatted}: restarts=${self.restartCount}`);
      }
    }
    self.elapsedLogInterval = setInterval(function () {
      elapsed();
    }, 60000);
    elapsed();

    // Call the EventEmitter constructor
    EventEmitter.call(self);
  };

  // Inherit from EventEmitter
  util.inherits(Streamii, EventEmitter);

  Streamii.prototype.start = require('./start.js');
  Streamii.prototype.stop = require('./stop.js');
  Streamii.prototype.preprocess = require('./preprocess.js');
  Streamii.prototype.queue = require('./queue.js');
  Streamii.prototype.updateTitle = require('./updateTitle.js');

  return Streamii; // Enable if using UMD
}));
