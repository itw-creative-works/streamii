// Libraries
const Manager = new (require('backend-manager'));
const jetpack = Manager.require('fs-jetpack');
const powertools = Manager.require('node-powertools');
const moment = Manager.require('moment');
const { basename, extname } = require('path');
const mm = require('music-metadata');

// Module
module.exports = async function (type, name) {
  const self = this;

  type = type || 'audio';
  name = (name || '');
  name = basename(name, extname(name)).toLowerCase();

  // Build the matching pattern based on the type
  const matchingPattern = self.acceptableFileTypes[type];

  // Get files
  const files = jetpack.find(`${self.assets}/${type}`, { matching: matchingPattern })
    // Get just the file name
    .map(file => basename(file))
    // Remove any files with unsafe characters
    .filter(file => {
      if (file.match(self.acceptableFilenameRegex)) {
        console.error(`⛔️  Skipping file "${file}" due to unsafe characters.`);
        return false;
      }
      return true;
    });

  let choice;

  if (name) {
    // choice = files.find((file) => file.includes(name));
    choice = files.find((file) => {
      const extensionlessName = basename(file, extname(file)).toLowerCase();
      return extensionlessName === name;
    });
  } else {
    choice = powertools.random(files);
  }

  if (!choice) {
    console.error('Files', files)
    throw new Error(`No ${type} found with name=${name}, please ensure you have assets setup correctly.`);
  }

  // console.log('====choice', choice);

  // Set paths
  const fullPath = `${self.assets}/${type}/${choice}`;
  const relativePath = `assets/${type}/${choice}`;
  const queueFilePath = `${type}/${choice}`;
  const justName = basename(choice, extname(choice));

  // Write queue
  self.updateQueueFile(type, queueFilePath);

  function emit(data) {
    self.emit(type, new Event(type, {cancelable: false}), data);
  }

  if (type === 'audio') {
    // Get metadata
    const metadata = await mm.parseFile(fullPath);
    const duration = metadata.format.duration;
    const durationFormatted = moment.utc(duration * 1000).format('mm:ss');

    // Log
    console.log(`🎼 Queueing new audio ${choice} [${durationFormatted}]:`, metadata);

    // Set current audio
    self.currentAudio = {
      name: choice,
      path: relativePath,
      metadata: metadata,
      started: moment(),
    }

    // Set interval for next queueing
    clearTimeout(self.audioSwitchInterval);
    self.audioSwitchInterval = setTimeout(() => {
      self.queue('audio');
    }, duration * 1000);

    // Reset back to buffer after 2 seconds
    // This is so there is a buffer between songs to prevent audio and song title from being out of sync
    clearTimeout(self.updateQueueFileInterval);
    self.updateQueueFileInterval = setTimeout(() => {
      self.updateQueueFile('audio', 'buffer.mp3');
    // }, 2000);
    }, 10000);

    // Write to title.txt for audio
    metadata.common.title = metadata.common.title || justName;
    metadata.common.artists = powertools.arrayify(metadata.common.artists || 'Unknown');
    self.updateText('title', metadata.common.title);
    self.updateText('subtitle', metadata.common.artists.join(', '));

    // Poll for current audio
    powertools.poll(() => {
      if (!self.currentAudio || !self.currentFFmpegLog) {
        return false;
      }
      self.logCurrent();
      return true;
    }, {interval: 1000, timeout: 30000}).catch((e) => e);

    // Emit
    emit(self.currentAudio);
  } else {
    // Log for video
    console.log(`🎬 Queueing new video ${choice}:`);

    // Set current video
    self.currentVideo = {
      name: choice,
      path: relativePath,
      started: moment(),
    }

    // Emit
    emit(self.currentVideo);
  }

  return self;
}
