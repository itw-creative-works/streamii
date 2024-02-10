const { exec } = require('child_process');

function startApp(command, timeout) {
  console.log(`[Monitor] 🚀 Starting app with command: ${command}`);

  timeout = timeout || 5000;

  // Start the app
  const process = exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`[Monitor] exec error: ${error}`);
      return;
    }
    console.log(`[Monitor] stdout: ${stdout}`);
    console.error(`[Monitor] stderr: ${stderr}`);
  });

  // Log the output of the app
  process.on('exit', (code) => {
    // If the app exits without an error, do nothing
    if (code === 0) {
      return
    }

    console.error('[Monitor] ⛔️ App crashed! Attempting to restart...');

    // Restart the app with the same command if it crashes
    setTimeout(function () {
      startApp(command);
    }, timeout);
  });
}

// Construct the command to pass to exec
// Include the process.argv to forward any additional command line arguments
const args = process.argv.slice(2).join(' ');
const command = `npm start ${args}`;

// Start the app
startApp(command);
