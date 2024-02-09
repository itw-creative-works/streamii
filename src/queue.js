const jetpack = require('fs-jetpack');
const powertools = require('node-powertools');
const { resolve, basename, join } = require('path');
const mm = require('music-metadata');
const moment = require('moment');

const queueTemplate = jetpack.read(resolve(__dirname, 'templates/queue.txt'));

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
  const files = jetpack.find(resolve(self.live, type), { matching: matchingPattern })
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
  const fullPath = resolve(self.live, type, choice);
  const queueFilePath = join(type, choice);
  const relativePath = join('live', queueFilePath);
  const justName = choice.split('.').slice(0, -1).join('.');

  // Write queue
  jetpack.write(resolve(self.live, `queue-${type}.txt`), powertools.template(queueTemplate, {file: queueFilePath, type}));

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
