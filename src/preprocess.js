// Libraries
const Manager = new (require('backend-manager'));
const jetpack = Manager.require('fs-jetpack');
const powertools = Manager.require('node-powertools');
const { basename, extname } = require('path');

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');

// Module
module.exports = function () {
  const self = this;

  return new Promise(function(resolve, reject) {
    // Setup ffmpeg
    ffmpeg.setFfmpegPath(ffmpegPath);

    // Build the matching pattern based on the type
    const matchingPattern = self.acceptableFileTypes.video;

    // Loop through all video files and remove the audio track using ffmpeg
    const files = jetpack.find(`${self.assets}/video`, {matching: matchingPattern})
    .filter((file) => {
      const name = basename(file);

      if (name.match(self.acceptableFilenameRegex)) {
        console.error(`⛔️  Skipping file "${name}" due to unsafe characters.`);
        return false;
      }
      return true;
    });

    // Keep track of all operations
    const operations = [];

    // Loop through all video files and remvoe the audio track using ffmpeg
    const promises = files.map((file) => {
      const name = basename(file);
      const output = file.replace(`/video/`, `/video/@na-`);

      // Log
      console.log('🔊 Removing audio input', file);
      console.log('🔊 Removing audio output', output);

      // Remove audio
      return new Promise((resolve, reject) => {
        ffmpeg(file)
          .output(output)
          .noAudio()
          .on('end', () => {
            console.log('✅ Done:', output);

            // Remove old file
            jetpack.remove(file);

            // Rename new file
            jetpack.rename(output, name);

            // Resolve
            resolve();
          })
          .on('error', (err) => {
            console.log('🔴 Error:', err);
            reject(err);
          })
          .run();
      });
    });

    // Resolve
    Promise.all(promises)
      .then(() => {
        console.log('✅ Done with all preprocessing!');

        return resolve();
      })
      .catch((e) => reject(e));
  });
}
