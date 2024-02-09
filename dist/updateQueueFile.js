// Libraries
const Manager = new (require('backend-manager'));
const jetpack = Manager.require('fs-jetpack');
const powertools = Manager.require('node-powertools');

const queueTemplate = jetpack.read(`${__dirname}/templates/queue.txt`);

// Module
module.exports = async function (type, queueFilePath) {
  const self = this;

  // Write queue file
  jetpack.write(`${self.assets}/queue-${type}.txt`, powertools.template(queueTemplate, {file: queueFilePath, type: type}));

  return self;
}
