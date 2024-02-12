// Libraries
const Manager = new (require('backend-manager'));
const jetpack = Manager.require('fs-jetpack');
const powertools = Manager.require('node-powertools');

// Module
module.exports = function () {
  const self = this;

  // Setup assets dir
  jetpack.dir(`${self.assets}/audio`);
  jetpack.dir(`${self.assets}/video`);
  jetpack.dir(`${self.assets}/font`);

  // Copy font if not exists
  // copyIfNotExists(`${__dirname}/templates/main.ttf`, `${self.assets}/font/main.ttf`);

  // Copy buffer
  copyIfNotExists(`${__dirname}/templates/buffer.mp3`, `${self.assets}/buffer.mp3`);
  copyIfNotExists(`${__dirname}/templates/buffer.mp4`, `${self.assets}/buffer.mp4`);

  // Setup live files
  jetpack.write(`${self.assets}/title.txt`, 'Starting soon...');

  // Write queue files iwht buffer while we wait for the first real queue
  self.updateQueueFile('audio', 'buffer.mp3');
  self.updateQueueFile('video', 'buffer.mp4');

  // Return
  return self;
}

function copyIfNotExists(source, destination) {
  if (!jetpack.exists(destination)) {
    jetpack.copy(source, destination);
  }
}
