// Libraries
const Manager = new (require('backend-manager'));

// Module
module.exports = function () {
  const self = this;

  console.log('🛑 Stopping...');

  // self.ffmpeg.ffmpegProc.stdin.write('q');

  try {
    self.ffmpeg.kill('SIGKILL');
  } catch (e) {
    console.error('🔴 Error stopping: ' + e.message);
  }

  self.status = 'stopped';

  console.log('🛑 Stopped!');

  // Emit the 'stop' event
  self.emit('stop', new Event('stop', {cancelable: false}));

  return self;
}
