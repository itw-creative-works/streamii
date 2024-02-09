const jetpack = require('fs-jetpack');
const { resolve } = require('path');

module.exports = async function (title) {
  const self = this;

  // Update
  jetpack.write(resolve(self.live, 'title.txt'), title);

  return self;
}
