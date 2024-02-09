// Libraries
const Manager = new (require('backend-manager'));

// Module
module.exports = function () {
  const self = this;

  // Log
  console.log('🛑 Stopping...');

  // Kill ffmpeg
  try {
    self.ffmpeg.kill('SIGKILL');
  } catch (e) {
    console.error('🔴 Error stopping: ' + e.message);
  }

  // Update status
  self.status = 'stopped';

  // Log
  console.log('🛑 Stopped!');

  // Emit the 'stop' event
  self.emit('stop', new Event('stop', {cancelable: false}));

  return self;
}
