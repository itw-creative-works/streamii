// Libraries
const Manager = new (require('backend-manager'));
const jetpack = Manager.require('fs-jetpack');
const powertools = Manager.require('node-powertools');
const moment = Manager.require('moment');
const { basename, normalize } = require('path');
const mm = require('music-metadata');

const queueTemplate = jetpack.read(`${__dirname}/templates/queue.txt`);

// Module
module.exports = async function (type, name) {
  const self = this;

  name = name || '';
  type = type || 'audio';

  // Define file type patterns for audio and video
  const fileTypes = {
    audio: ['*.mp3', '*.wav', '*.aac', '*.aif'], // Add more audio types as needed
    video: ['*.gif', '*.mp4', '*.avi'] // Add more video types as needed
  };

  // Build the matching pattern based on the type
  const matchingPattern = fileTypes[type];

  // Get files
  const files = jetpack.find(`${self.assets}/${type}`, { matching: matchingPattern })
    .map(file => basename(file));

  // console.log('====files', files);

  let choice;

  if (name) {
    choice = files.find((file) => file.includes(name));
  } else {
    choice = powertools.random(files);
  }

  // console.log('====choice', choice);

  // Set paths
  const fullPath = `${self.assets}/${type}/${choice}`;
  const relativePath = normalize(`assets/${type}/${choice}`);
  const queueFilePath = normalize(`${type}/${choice}`);
  const justName = choice.split('.').slice(0, -1).join('.');

  // Write queue
  jetpack.write(`${self.assets}/queue-${type}.txt`, powertools.template(queueTemplate, {file: queueFilePath, type}));

  function emit(data) {
    self.emit(type, new Event(type, {cancelable: false}), data);
  }

  if (type === 'audio') {
    // Get metadata
    const metadata = await mm.parseFile(fullPath);
    const duration = metadata.format.duration;
    const durationFormatted = moment.utc(duration * 1000).format('mm:ss');

    // Log
    console.log(`🎼 Queueing new audio ${choice} [${durationFormatted}]:`);

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
      self.queue();
    }, duration * 1000);

    // Write to title.txt for audio
    self.updateTitle(metadata.common.title || justName);

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
