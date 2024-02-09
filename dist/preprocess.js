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

  // Setup live files
  jetpack.write(`${self.assets}/title.txt`, 'Starting soon...');

  // Queue
  self.queue('audio');
  self.queue('video');

  // Return
  return self;
}
