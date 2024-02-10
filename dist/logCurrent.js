// Libraries
const Manager = new (require('backend-manager'));
const moment = Manager.require('moment');

// Module
module.exports = function () {
  const self = this;

  const currentAudio = self.currentAudio;
  if (!currentAudio || !self.currentFFmpegLog) {
    return
  }

  const started = currentAudio.started;
  const current = moment();
  const duration = currentAudio.metadata.format.duration;
  const elapsed = current.diff(started, 'seconds');

  // Format time
  const currentFormatted = moment.utc(elapsed * 1000).format('mm:ss');
  const totalFormatted = moment.utc(duration * 1000).format('mm:ss');

  // Log
  console.log(`🔊 Now playing ${currentAudio.name} [${currentFormatted}/${totalFormatted}]: ${self.currentFFmpegLog}`);

  return self;
}
