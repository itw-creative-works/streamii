// Libraries
const Manager = new (require('backend-manager'));
const moment = Manager.require('moment');

// Module
module.exports = function (reason) {
  const self = this;

  // timeout should be 100 ms unless it was started less than 5 seconds ago
  const msSinceStart = moment().diff(self.restartTrackerTime, 'milliseconds');
  const timeout = msSinceStart < 5000 ? 5000 - msSinceStart : 100;

  // Log
  console.log(`🔁 Restarting in ${timeout}ms...`, reason || '');

  // Try to stop
  self.stop();

  // Restart
  clearTimeout(self.restartInterval);
  self.restartInterval = setTimeout(() => {
    self.restartInterval = null;

    // Increment restart count
    self.restartCount++;

    console.log(`🔁 Restarted successfully (${self.restartCount} restarts)`);

    self.start();
  }, timeout);

  // Return
  return self;
}
