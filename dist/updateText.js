// Libraries
const Manager = new (require('backend-manager'));

// Module
const jetpack = Manager.require('fs-jetpack');

module.exports = async function (type, title) {
  const self = this;

  // Update title file
  jetpack.write(`${self.assets}/${type}.txt`, title);

  return self;
}
