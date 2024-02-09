const jetpack = require('fs-jetpack');
const powertools = require('node-powertools');
const { resolve } = require('path');

module.exports = function () {
  const self = this;

  // Setup assets dir
  jetpack.dir(resolve(self.assets, 'audio'));
  jetpack.dir(resolve(self.assets, 'video'));
  jetpack.dir(resolve(self.assets, 'font'));

  // Setup live dir
  jetpack.remove(self.live);
  jetpack.dir(resolve(self.live, 'audio'));
  jetpack.dir(resolve(self.live, 'video'));
  jetpack.dir(resolve(self.live, 'font'));

  // Pre process files
  jetpack.copy(resolve(self.assets, 'audio'), resolve(self.live, 'audio'), { overwrite: true });
  jetpack.copy(resolve(self.assets, 'video'), resolve(self.live, 'video'), { overwrite: true });
  jetpack.copy(resolve(self.assets, 'font'), resolve(self.live, 'font'), { overwrite: true });
  jetpack.write(resolve(self.live, 'title.txt'), 'Starting soon...');

  self.queue('audio');
  self.queue('video');

  // Return
  return self;
}
