// Requirements
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const axios = require('axios');
const { resolve } = require('path');
const jetpack = require('fs-jetpack');
const moment = require('moment');
const { time } = require('console');

module.exports = function () {
  const self = this;
  const options = self.options;

  // Load env
  require('dotenv').config();

  // Set properties
  ffmpeg.setFfmpegPath(ffmpegPath);

  // Preprocess
  self.preprocess();

  // Check main options
  if (!options.stream.ingest) {
    throw new Error('No ingest URL provided')
  }

  // Check assets options
  // if (!mainOptions.assets.owner) {
  //   throw new Error('No owner provided')
  // } else if (!mainOptions.assets.repo) {
  //   throw new Error('No repo provided')
  // }

  // Check env variables
  if (!process.env.STREAM_KEY) {
    throw new Error('No STREAM_KEY provided')
  } else if (!process.env.GH_TOKEN) {
    throw new Error('No GH_TOKEN provided')
  }

  console.log('🚀 Starting...');

  // Set properties
  self.status = 'started';
  self.ffmpeg = ffmpeg()
    // Video input
    // .addInput(resolve(self.live, 'video', 'background.gif'))
    // Use the concat demuxer for dynamic video input
    .addInput(resolve(self.live, 'queue-video.txt'))
    .inputFormat('concat')
    .inputOption('-safe 0')
    // .addInputOption('-ignore_loop 0') // For gifs
    .addInputOption('-stream_loop -1') // For video files
    .addInputOption('-re') // Realtime

    // Silent audio source
    .addInput('anullsrc')
    .inputFormat('lavfi')

    // Use the concat demuxer for dynamic audio input
    .addInput(resolve(self.live, 'queue-audio.txt'))
    .inputFormat('concat')
    .inputOption('-safe 0') // Necessary if paths are absolute or have special characters

    // Mix the audio inputs together
    // https://stackoverflow.com/questions/14498539/how-to-overlay-downmix-two-audio-files-using-ffmpeg
    .complexFilter([
      'amix=inputs=2:duration=first:dropout_transition=2'
    ])

    // Audio settings
    .audioCodec('aac')
    .audioBitrate(options.stream.audioBitrate)

    // Video settings
    .size(options.stream.size)
    .videoBitrate(options.stream.videoBitrate)
    .fps(options.stream.fps)
    .withAspect('16:9')
    .videoCodec('libx264')
    .videoFilters({
      filter: 'drawtext',
      options: {
        fontfile: resolve(self.live, 'font', 'main.ttf'),
        textfile: resolve(self.live, 'title.txt'),
        fontsize: 40,
        fontcolor: 'white',
        x: '(w-tw)/2',
        y: '(main_h-60)',
        reload: 1,
        shadowcolor: 'black',
        shadowx: 2,
        shadowy: 2,
      }
    })

    // Processing
    .addOptions([
      // Specifies the number of threads for processing. Adjusting this can optimize encoding speed based on your CPU's capabilities.
      '-threads 4',
      // This is a trade-off between encoding speed and output file size/quality. veryfast offers faster encoding with slightly larger output or lower quality compared to slower presets.
      '-preset veryfast',
      // Sets the pixel format to yuv420p, which is compatible with most streaming services and devices.
      '-pix_fmt yuv420p',
      // Sets the Constant Rate Factor to 10, providing high video quality. CRF values range from 0 to 51, where lower values mean better quality and higher file sizes.
      // '-crf 10',
    ])

    // Output
    .toFormat('flv')
    .output(`${options.stream.ingest}/${process.env.STREAM_KEY}`)

  // Listen for events
  self.ffmpeg.on('start', (cmd) => {
    console.log('🎬 FFMPEG command: ' + cmd);

    self.ffmpeg.ffmpegProc.stderr.on('data', (data) => {
      if (data.startsWith('frame=')) {
        self.currentFFmpegLog = data;
        return;
      }
      console.log('📌 FFMPEG' + data);
    });

    self.ffmpeg.ffmpegProc.stdout.on('data', (data) => {
      console.log('📌 FFMPEG' + data);
    });

    // Emit the 'started' event
    self.emit('start', new Event('start', {cancelable: false}));
  })

  // Listen for errors
  self.ffmpeg.on('error', (err, stdout, stderr) => {
    const error = new Error(err.message);
    console.error('🔴 An error occurred: ', error);
    console.log('🔴 FFMPEG stdout: ' + stdout);
    console.log('🔴 FFMPEG stderr: ' + stderr);

    // Emit the 'error' event
    self.emit('error', error);

    // Stop
    try {
      self.stop();
    } catch (e) {
      console.error('🔴 Error stopping: ' + e.message);
    }

    // Restart
    if (options.autoRestart) {
      self.restartCount++;
      console.log(`🔁 Restarting (${self.restartCount} restarts)...`);
      setTimeout(() => {
        self.start();
      }, 100);
    }
  })

  // Listen for end
  self.ffmpeg.on('end', (stdout, stderr) => {
    console.log('🎉 Stream concluded!');
  })

  // Not sure what this does
  self.ffmpeg.run();

  console.log('🚀 Started!');
  console.log('📁 Directory', jetpack.cwd());
  console.log('🖥 Ingest: ' + options.stream.ingest);
  console.log('📏 Size: ' + options.stream.size);
  console.log('🎥 FPS: ' + options.stream.fps);
  console.log('📽 Video Bitrate: ' + options.stream.videoBitrate);
  console.log('🔊 Audio Bitrate: ' + options.stream.audioBitrate);

  // Log current song time
  clearInterval(self.currentAudioInterval);
  self.currentAudioInterval = setInterval(() => {
    const currentAudio = self.currentAudio;
    if (currentAudio) {
      const started = currentAudio.started;
      const current = moment();
      const duration = currentAudio.metadata.format.duration;
      const elapsed = current.diff(started, 'seconds');

      // Format time
      const currentFormatted = moment.utc(elapsed * 1000).format('mm:ss');
      const totalFormatted = moment.utc(duration * 1000).format('mm:ss');

      // Log
      console.log(`🔊 Now playing ${currentAudio.name} [${currentFormatted}/${totalFormatted}]: ${self.currentFFmpegLog}`);
    }
  }, 1000);

  return self;
}
