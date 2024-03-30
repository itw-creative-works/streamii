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

  const Manager = new (require('backend-manager'));
  const moment = Manager.require('moment');
  const path = require('path');
  const EventEmitter = require('events').EventEmitter;
  const util = require('util');

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

    options.stream.title = options.stream.title || {};
    options.stream.title.enabled = typeof options.stream.title.enabled === 'undefined' ? true : options.stream.title.enabled;
    options.stream.title.fontSize = options.stream.title.fontSize || 40; // 40
    // options.stream.title.x = options.stream.title.x || '(w-tw)/2';
    // options.stream.title.y = options.stream.title.y || '(main_h-80)'; // (main_h-60)
    options.stream.title.x = options.stream.title.x || 20;
    options.stream.title.y = options.stream.title.y || 20; // (main_h-60)
    options.stream.title.shadow = options.stream.title.shadow || {};
    options.stream.title.shadow.x = options.stream.title.shadow.x || 2;
    options.stream.title.shadow.y = options.stream.title.shadow.y || 2;

    options.stream.subtitle = options.stream.subtitle || {};
    options.stream.subtitle.enabled = typeof options.stream.subtitle.enabled === 'undefined' ? true : options.stream.subtitle.enabled;
    options.stream.subtitle.fontSize = options.stream.subtitle.fontSize || 30;
    // options.stream.subtitle.x = options.stream.subtitle.x || '(w-tw)/2';
    // options.stream.subtitle.y = options.stream.subtitle.y || '(main_h-20)';
    options.stream.subtitle.x = options.stream.subtitle.x || 20;
    options.stream.subtitle.y = options.stream.subtitle.y || 60;
    options.stream.subtitle.shadow = options.stream.subtitle.shadow || {};
    options.stream.subtitle.shadow.x = options.stream.subtitle.shadow.x || 2;
    options.stream.subtitle.shadow.y = options.stream.subtitle.shadow.y || 2;

    // Set assets options
    options.assets = options.assets || {};
    options.assets.owner = options.assets.owner;
    options.assets.repo = options.assets.repo;

    // Set youtube options
    options.youtube = options.youtube || {};
    options.youtube.channelId = options.youtube.channelId || '';

    // Set other options
    options.autoRestart = options.autoRestart || {};
    options.autoRestart.enabled = typeof options.autoRestart.enabled === 'undefined' ? true : options.autoRestart.enabled;

    options.checkStream = options.checkStream || {};
    options.checkStream.enabled = typeof options.checkStream.enabled === 'undefined' ? false : options.checkStream.enabled;

    // Set log options
    options.log = options.log || {};
    options.log.interval = options.log.interval || 30000;

    self.options = options;

    // Set properties
    self.startTime = moment();
    self.restartTrackerTime = moment();
    self.restartCount = 0;
    self.status = 'stopped';
    self.ffmpeg = null;
    self.path = process.cwd();
    // self.assets = path.resolve(`${self.path}/assets`);
    // self.live = path.resolve(`${self.path}/live`);
    self.assets = `${self.path}/assets`.replace(/\\/g, '/');
    self.live = `${self.path}/live`.replace(/\\/g, '/');

    // Define file type patterns for audio and video
    self.acceptableFileTypes = {
      audio: ['*.mp3', '*.wav', '*.aac', '*.aif'], // Add more audio types as needed
      video: ['*.gif', '*.mp4', '*.avi'] // Add more video types as needed
    };
    self.acceptableFilenameRegex = /[^a-zA-Z0-9\.\-\_]/;

    self.currentFFmpegLog = null;

    self.currentAudioInterval = null;
    self.audioSwitchInterval = null;

    self.streamCheckInterval = null;

    self.restartInterval = null;

    self.updateQueueFileInterval = null;

    self.currentAudio = null;
    self.currentVideo = null;

    // Log interval
    function elapsed() {
      if (self.status !== 'started') {
        return;
      }

      const now = moment();
      const startTime = moment(self.startTime);
      const duration = moment.duration(now.diff(startTime));

      const totalElapsedFormatted = `${Math.floor(duration.asDays())}d ${duration.hours()}h ${duration.minutes()}m ${duration.seconds()}s`;

      console.log(`💎 Server has been online for ${totalElapsedFormatted} (restarts=${self.restartCount})`);
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

  // Install methods
  Streamii.prototype.start = require('./start.js');
  Streamii.prototype.stop = require('./stop.js');
  Streamii.prototype.restart = require('./restart.js');
  Streamii.prototype.prepare = require('./prepare.js');
  Streamii.prototype.preprocess = require('./preprocess.js');
  Streamii.prototype.queue = require('./queue.js');
  Streamii.prototype.updateText = require('./updateText.js');
  Streamii.prototype.updateQueueFile = require('./updateQueueFile.js');
  Streamii.prototype.logCurrent = require('./logCurrent.js');

  return Streamii; // Enable if using UMD
}));
