// Libraries
const Manager = new (require('backend-manager'));

// Module
const jetpack = Manager.require('fs-jetpack');

module.exports = async function (title) {
  const self = this;

  // Update title file
  jetpack.write(`${self.assets}/title.txt`, title);

  return self;
}
