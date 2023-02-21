module.exports = function (mainOptions) {
  const fastify = require('fastify')({
    logger: false,
  });
  const ffmpeg = require('ffmpeg-static');
  const ffprobe = require('ffprobe-static').path;
  const { exec } = require('child_process');
  const jetpack = require('fs-jetpack');
  const unzipper = require('unzipper');
  const util = require('util')
  const path = require('path')
  const { pipeline } = require('stream')
  const pump = util.promisify(pipeline)
  require('dotenv').config();
  const powertools = require('node-powertools');
  const package = require('../package.json');
  const { Octokit } = require('@octokit/rest');
  const octokit = new Octokit({
    auth: process.env.GH_TOKEN,
  });
  const uuidv4 = require('uuid').v4;
  const Table = require('cli-table3');
  const chalk = require('chalk');

  const logger = new (require('wonderful-log'))({
    console: {
      enabled: true,
    },
    file: {
      enabled: true,
    },
    // worker: {
    //   timeout: 10000
    // },
  });  

  const queue = powertools.queue();
  const status = {
    isStreaming: false,
    isDownloading: false,
    isProcessing: false,
    streamId: null,
  }
  let tracklistInterval;
  
  // Check mainOptions
  if (!mainOptions.streamURL) {
    throw new Error('No URL provided')
  } else if (!mainOptions.assets.owner) {
    throw new Error('No owner provided')
  } else if (!mainOptions.assets.repo) {
    throw new Error('No repo provided')
  } else if (!process.env.STREAM_KEY) {
    throw new Error('No STREAM_KEY provided')
  } else if (!process.env.GH_TOKEN) {
    throw new Error('No GH_TOKEN provided')
  }

  /* 
    SOURCES:
    - Mostly from ChatGPT
    - https://superuser.com/questions/1640011/ffmpeg-loop-stream-of-several-audio-files-and-a-short-video
    - https://stackoverflow.com/questions/65147086/how-to-make-ffmpeg-automatically-inject-mp3-audio-tracks-in-the-single-cycled-mu
    - https://gist.github.com/olasd/9841772
    - https://stackoverflow.com/questions/45213147/i-want-live-stream-1-folder-on-youtube-by-ffmpeg
    - https://consultwithgriff.com/streaming-mp4-to-twitch-youtube-with-ffmpeg/

    - https://superuser.com/questions/155305/how-many-threads-does-ffmpeg-use-by-default
    - https://trac.ffmpeg.org/wiki/ChangingFrameRate#:~:text=down%20a%20video-,How%20to%20change%20the%20frame%20rate,With%20the%20%E2%80%8Bfps%20filter
    - https://www.fiverr.com/ijeckpray/draw-lofi-and-chill-animation-loop-with-detailed-background?context_referrer=search_gigs&source=top-bar&ref_ctx_id=3f121f79c0c7248658c87dff7b2ade27&pckg_id=1&pos=1&context_type=auto&funnel=3f121f79c0c7248658c87dff7b2ade27&imp_id=22e1c131-10b7-4b55-aa58-50f4dda5d301
    - https://www.canva.com/design/DAFa1OeimsI/Y0akrWsbQsiaCweKV1U_fw/edit?category=tADs1de8MlY
    - https://trac.ffmpeg.org/wiki/Encode/YouTube
    - https://www.reddit.com/r/ffmpeg/comments/r1qwyy/best_streaming_settings_for_youtube/
  */
  function startStream() {
    return new Promise(async function(resolve, reject) {    
      // Preprocess the audio files if they haven't been already
      if (!enoughTracksPreprocessed()) {
        queue.add(preprocess)
      }  

      // Wait for the audio files to be preprocessed
      await powertools.poll(() => {
        // console.log('Waiting for enough tracks to be preprocessed...');

        return enoughTracksPreprocessed()
      }, {interval: 500, timeout: 60000})

      // Randomize the tracklist
      randomizeTracklist();

      // get first video file
      const videoFile = getVideoFile()

      // Setup the ffmpeg command
      const cmd = `
        ${ffmpeg} \
        -stream_loop -1 \
        -re \
        -i ${videoFile} \
        -stream_loop -1 \
        -re \
        -f concat -safe 0 -i media/processed/tracklist.txt \
        -f lavfi -i anullsrc \
        -c:v libx264 -preset veryfast -pix_fmt yuv420p \
        -crf 10 \
        -r 60 \
        -c:a aac \
        -b:a 192k -ar 44100 -shortest \
        -b:v 4500k \
        -threads 4 \
        -f flv ${mainOptions.streamURL}/${process.env.STREAM_KEY}
      `

      // Log if tracklist.txt exists
      const tracklistExists = jetpack.read('media/processed/tracklist.txt');
      // console.log('--tracklistExists', tracklistExists);

      // console.log(`\n\n*** STARTING YOUTUBE STREAM ***`);

      status.streamId = uuidv4();

      let statusLogged = false;

      function _logStatus() {
        if (!statusLogged) {
          statusLogged = true;
          logStatus();
        }
      }

      // Start the stream
      const ffmpegProcess = exec(cmd);

      ffmpegProcess.stdout.on('data', (data) => {
        console.log(`STREAM:`, data);

        status.isStreaming = data;

        _logStatus();

        // Log current audio track
        // if (data.includes('Input #1')) {
        //   const split = data.split('Input #1,');
        //   const track = split[1].split(',')[0].trim();
        //   console.log(`\n*** CURRENT TRACK: ${track} ***\n`);
        // }
      });

      ffmpegProcess.stderr.on('data', (data) => {
        console.error(`STREAM:`, data);

        status.isStreaming = data;

        _logStatus();

        // log current audio track
        // if (data.includes('Input #1')) {
        //   const split = data.split('Input #1,');
        //   const track = split[1].split(',')[0].trim();
        //   console.log(`\n*** CURRENT TRACK: ${track} ***\n`);
        // } 
      });

      ffmpegProcess.on('close', (code) => {
        logger.log(`STREAM: ffmpeg exited with code ${code}`);

        status.isStreaming = false;

        // Restart the stream if it fails
        if (code !== 0) {
          logger.error(`Restarting...`);

          setTimeout(function () {
            startStream();
          }, 1000);
        }
      });

      logStatus();

      return resolve();

      // Use ffprobe to get information about the current stream
      // const ffprobeProcess = exec(`${ffprobe} -v quiet -print_format json -show_format -show_streams rtmp://a.rtmp.youtube.com/live2/${process.env.STREAM_KEY}`);
      // const ffprobeProcess = exec(`${ffprobe} -show_streams`);

      // ffprobeProcess.stdout.on('data', (data) => {
      //   console.log(`FFPROBE:`, data);
      // });

      // ffprobeProcess.stderr.on('data', (data) => {
      //   console.error(`FFPROBE:`, data);
      // });

      // ffprobeProcess.on('close', (code) => {
      //   console.log(`FFPROBE: ffprobe exited`, code);
      // });
    });
  }

  // Function that uses octokit download the assets from GitHub and unzip them
  async function downloadAssets() {
    return new Promise(async function(resolve, reject) {
      // Parse the package.json file github repo url
      // const owner = package.repository.url.split('/')[3];
      // const repo = package.repository.url.split('/')[4].replace('.git', '');

      if (mainOptions.assets.fetch === false) {
        logger.log('Skipping download of assets...');
        return resolve();
      }

      logger.log(`Downloading assets ${mainOptions.assets.owner}, ${mainOptions.assets.repo}`);

      // Clear the uploadds directory
      jetpack.remove('media/uploads');   

      // Get the latest release from the GitHub API
      const release = await octokit.request('GET /repos/{owner}/{repo}/releases/latest', {
        owner: mainOptions.assets.owner,
        repo: mainOptions.assets.repo,
      });

      const assets = release.data.assets;

      // Loop through the assets and download them
      assets.forEach(async function(asset) {
        const assetName = asset.name;
        const assetUrl = asset.browser_download_url;

        logger.log(`Downloading asset: ${assetName}`);

        const assetPath = path.join('media', 'uploads', assetName);
        const assetDir = path.dirname(assetPath);

        status.isDownloading = assetName;

        // Remove the asset if it already exists
        jetpack.remove(assetPath);

        // Download the asset
        const response = await octokit.request('GET /repos/{owner}/{repo}/releases/assets/{asset_id}', {
          owner: mainOptions.assets.owner,
          repo: mainOptions.assets.repo,
          asset_id: asset.id,
          headers: {
            Accept: 'application/octet-stream',
          }
        });

        logger.log(`Finished downloading asset: ${assetPath}`);

        // Save ArrayBuffer to disk as a file
        const buffer = Buffer.from(response.data);
        jetpack.write(assetPath, buffer);

        await unzipUploadsFolder();

        // Clear the uploadds directory
        jetpack.remove('media/uploads');   

        status.isDownloading = false;

        return resolve();
      });    
    });
  }

  function unzipUploadsFolder() {
    return new Promise(async function(resolve, reject) {
      // Match zip file
      const uploadPath = path.join('media', 'uploads');
      const uploadFile = jetpack.find(uploadPath, { matching: '*.zip' })[0];

      let uploadCount = 0;

      // Clear the unprocessed directory
      // jetpack.remove('media/unprocessed');    

      // logger.log('Unzipping uploads...', uploadFile);

      // Unzip the file
      const readStream = jetpack.createReadStream(uploadFile);
      await readStream.pipe(unzipper.Extract({ path: 'media/uploads' })).promise();
      
      // Remove the zip
      jetpack.remove(uploadFile);

      // Loop through the files and move them to the unprocessed folder
      const files = jetpack.find(uploadPath, { matching: '*' });

      files.forEach(function (file) {
        const filename = path.basename(file);
        let subfolder = '';

        // if file starts with '._' skip it
        if (filename.startsWith('.') || filename.startsWith('_')) {
          return;
        }

        // if file is an mp3, move it to the unprocessed folder
        if (file.includes('/audio/')) {
          subfolder = 'audio';
        } else if (file.includes('/video/')) {
          subfolder = 'video';
        } else {
          return
        }

        const newFile = path.join('media', 'unprocessed', subfolder, filename);

        uploadCount++;
        
        // console.log('Moving file:', file, 'to', newFile);
        try {
          jetpack.move(file, newFile, { overwrite: false });
        } catch {
          // console.log('Did not move file because already exists');
        }
      });

      // Clear the uploasd directory  
      // jetpack.remove(uploadPath);
      
      // Preprocess the audio files
      await preprocess();

      // Randomize the tracklist
      randomizeTracklist();    

      return resolve(uploadCount)
    });  
  }

  function getVideoFile() {
    return jetpack.find('media/processed/video', { matching: '*.mp4' })[0];
  }

  // function getTracklist() {
  //   // Get the tracklist
  //   const tracklist = jetpack.read('media/processed/tracklist.txt') || '';
  //   const split = tracklist.split('\n');
  //   const tracks = Math.max(split.length - 2, 0);

  //   return split;
  // }

  function getTracklist(type) {
    if (type === 'unprocessed') {
      return jetpack.find('media/unprocessed/audio', { matching: '*.mp3' });
    }
    return jetpack.find('media/processed/audio', { matching: '*.m4a' });
  }

  function getCurrentTrack() {
    const currentTrack = jetpack.read('media/processed/tracklist.txt') || '';
    const split = currentTrack.split('\n');

    return split[1];
  }

  function getVideoList(type) {
    if (type === 'unprocessed') {
      return jetpack.find('media/unprocessed/video', { matching: '*.mp4' });
    }
    return jetpack.find('media/processed/video', { matching: '*.mp4' });
  }

  function logTracklist() {
    const tracks = getTracklist();

    // console.log(`\n\n*** TRACKLIST (${tracks.length} tracks) ***`);
    // console.log(tracks);  
  }

  function enoughTracksPreprocessed() {
    const currentTracklist = getTracklist();
    const currentVideoList = getVideoList();
    // console.log('---currentTracklist', currentTracklist);
    // console.log('---currentVideoList', currentVideoList);
    if (
      currentTracklist.length <= 2
      || currentVideoList.length <= 0
    ) {
      return false
    }

    return true
  }

  function randomizeTracklist() {
    // Write the tracklist
    const tracklist = jetpack.find('media/processed/audio', { matching: '*.m4a',  })

    // console.log(`Randomizing tracklist (${tracklist.length} tracks)...`);

    // Randomize the tracklist
    for (let i = tracklist.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tracklist[i], tracklist[j]] = [tracklist[j], tracklist[i]];
    }

    const randomTrack = tracklist[0]
    let output = `ffconcat version 1.0\n`;
    if (randomTrack) {
      output += `file '${randomTrack.replace('media/processed/', '')}'\n`
    }
    output += `file 'tracklist.txt'`

    // Write the tracklist
    jetpack.write('media/processed/tracklist.txt', output);
  }

  // Register the fastify-multipart plugin
  fastify.register(require('@fastify/multipart'))

  // Set up the song upload endpoint
  fastify.post('/upload', async function (req, res) {
    const data = await req.file();

    // If no file was uploaded, response with an error
    if (!data || !data.file) {
      res.status(500).send(uploadFile)
    }

    const uploadPath = path.join('media', 'uploads')
    const uploadFile = path.join(uploadPath, data.filename)

    // Create the upload directory if it doesn't exist
    // jetpack.dir(uploadPath);
    jetpack.remove(uploadFile);

    // Save the file
    await pump(data.file, jetpack.createWriteStream(uploadFile))

    const uploadCount = await unzipUploadsFolder();

    // redirect to the homepage and append the number of tracks to the URL
    res.redirect(`/?tracks=${uploadCount}`);
  })

  function preprocess() {
    return new Promise(async function(resolve, reject) {
      const cmd = `
        for f in media/unprocessed/audio/*.mp3; do
          filename=$(basename "$f")
          ${ffmpeg} -y -i "$f" -map 0:a -ac 2 -ar 44100 -c:a aac "media/processed/audio/\${filename%.*}.m4a"
          rm "$f"
        done
      `
      const saveTracklistInterval = setInterval(saveTracklist, 10000);

      logger.log('Preprocessing audio files...');

      function _resolve() {
        clearInterval(saveTracklistInterval);
        return resolve();
      }

      if (getTracklist('unprocessed').length <= 0) {
        queue.add(downloadAssets)
        
        return _resolve();
      }

      // Clear the output directory
      // jetpack.remove('media/processed');

      // Create new directory
      // jetpack.dir('media/processed/audio');
      // jetpack.dir('media/processed/video');

      saveTracklist();

      const ffmpegProcess = exec(cmd);

      ffmpegProcess.stdout.on('data', (data) => {
        console.log(`PROCESS:`, data);
        
        status.isProcessing = data;

        saveTracklist();
      });

      ffmpegProcess.stderr.on('data', (data) => {
        console.error(`PROCESS:`, data);
        
        status.isProcessing = data;

        saveTracklist();
      });

      ffmpegProcess.on('close', (code) => {
        logger.log(`PROCESS: ffmpeg exited wtih code ${code}`);

        status.isProcessing = false;

        if (code !== 0) {
          return reject();
        }

        // Save the tracklist
        saveTracklist();

        // Complete      
        return _resolve();
      });    
    });
  }

  function saveTracklist() {
    // console.log('Saving tracklist...');

    // Loop through processed audio files and rename them replacing any non-alphanumeric characters
    const audioFiles = jetpack.find('media/processed/audio', { matching: '*.m4a' });
    audioFiles
    .forEach((file) => {
      // use path to get the filename without the extension
      const parsed = path.parse(file);
      const newFilename = parsed.name
        // Replace any spaces or dashes with an underscore
        // .replace(/(\s|-)+/g, '_')
        // Remove any non-alphanumeric characters
        // .replace(/[^a-zA-Z0-9_]/g, '')
        // If it starts or ends with a number, remove it
        // .replace(/^[0-9]+|[0-9]+$/g, '')
        // If it starts or ends with an underscore, remove it
        // .replace(/^_+|_+$/g, '')
        // .toLowerCase()
        // Remove any quotes
        .replace(/['"]+/g, '')
        // Remove anything thats not a number or letter or dash
        .replace(/[^a-zA-Z0-9-]/g, '')
      
      if (newFilename !== parsed.name) {
        // rename the file and allow overwriting
        // console.log('Renaming', file, 'to', `${newFilename}${parsed.ext}`);

        try {
          jetpack.rename(file, `${newFilename}${parsed.ext}`, { overwrite: false });
        } catch (e) {
          // console.error('Did not rename audio because already exists');
        }

        // Remove the original file
        jetpack.remove(file);
      }

    });

    // Randomize the tracklist
    randomizeTracklist();

    // Copy video files
    const videoFiles = jetpack.find('media/unprocessed/video', { matching: '*.mp4' });
    videoFiles
    .forEach((file) => {
      const newPath = file.replace('unprocessed', 'processed');
      try {
        // @@@
        jetpack.move(file, newPath, { overwrite: false });
      } catch (e) {
        // console.error('Did not rename video because already exists');
      }

      try {
        jetpack.remove(file);
      } catch (e) { 
      }
    });
  }

  // format uptime to HH:MM:SS
  function format(seconds) {
    function pad(s) {
      return (s < 10 ? '0' : '') + s;
    }
    var hours = Math.floor(seconds / (60 * 60));
    var minutes = Math.floor(seconds % (60 * 60) / 60);
    var seconds = Math.floor(seconds % 60);

    return pad(hours) + ':' + pad(minutes) + ':' + pad(seconds);
  }  

  function logStatus() {
    const tracklist = getTracklist();
    const currentTrack = getCurrentTrack();

    logger.log(
      `*** Streamii Status ***\n`
      + `ID: ${status.streamId}\n`
      + `Runtime: ${format(process.uptime())}\n`
      + `Stream: ${status.isStreaming ? 'ON' : 'OFF'} ${status.isStreaming ? status.isStreaming : ''}\n`
      + `Preprocess: ${status.isProcessing ? 'ON' : 'OFF'} ${status.isProcessing ? status.isProcessing : ''}\n`
      + `Download: ${status.isDownloading ? 'ON' : 'OFF'} ${status.isDownloading ? status.isDownloading : ''}\n`
      + `Tracklist: ${tracklist.length} tracks\n`
    )      
  }

  // Serve the upload form
  fastify.get('/', async (request, res) => {
    const tracklist = getTracklist();

    const formHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Upload MP3s ZIP File</title>
          <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-GLhlTQ8iRABdZLl6O3oVMWSktQOp6b7In1Zl3/Jr59b6EGGoI1aFkw7cmDA6j6gD" crossorigin="anonymous">
        </head>
        <body class="container my-5">
          <h1 class="mb-3">Upload MP3s ZIP File</h1>
          <form action="/upload" method="post" enctype="multipart/form-data" class="mb-3">
            <div class="form-group">
              <label for="file">Choose ZIP File</label>
              <input type="file" class="form-control-file" id="file" name="file">
            </div>
            <button type="submit" class="btn btn-primary mt-3">Upload</button>
          </form>
          <h1 class="mb-3">Video File</h1>
          <div class="ratio ratio-16x9">
            <video controls autoplay src="${getVideoFile()}" type="video/mp4" allowfullscreen></video>
          </div>
          <h1 class="mb-3">Tracklist (${tracklist.length})</h1>
          <ul class="list-group">
            ${tracklist.map(track => `<li class="list-group-item">${track}</li>`).join('')}
          </ul>        
          
        </body>
      </html>
    `;

    return res
      .type('text/html')
      .send(formHtml);
  });

  // make fastify public directory
  fastify.register(require('@fastify/static'), {
    root: path.join(__dirname, '../media/'),
  })

  // Run the server and report out to the logs
  fastify.listen({ port: process.env.PORT || 3000, host: '0.0.0.0' }, async function (e, address) {
    if (e) {
      return logger.error(e);
    }

    // Make sure all directories exist
    jetpack.dir('media/unprocessed/audio');
    jetpack.dir('media/unprocessed/video');
    jetpack.dir('media/processed/audio');
    jetpack.dir('media/processed/video');
    jetpack.dir('media/uploads');

    logger.log(``);
    logger.log(`============================================`);
    logger.log(`Streamii server has successfully started`);
    logger.log(`Streamii v${package.version}`);
    logger.log(`Server is listening on ${address}`);
    logger.log(`============================================`);

    // Randomize the tracklist and start the stream
    startStream()
    .catch(e => {
      logger.error(`Error starting the stream: ${e}`)
    })

    // Setup the tracklist interval
    if (!tracklistInterval) {
      // tracklistInterval = setInterval(() => {
      //   getTracklist();
      // }, 60000);   

      // setTimeout(async () => {
      //   getTracklist();
      // }, 5000);

      // Every 10 minutes, randomize the tracklist.txt file by shuffling the lines
      // setInterval(async () => {
      //   randomizeTracklist();
      // }, 60000 * 60 * 10)

      // Stress test preprocessing while the stream is running
      // setTimeout(async () => {
      //   await preprocess()
      // }, 10000);

      // Every 10 minutes, check for new assets
      // Eventually make this more like every 24 hours
      setInterval(async () => {
        queue.add(downloadAssets)
      }, 60000 * 60 * 24)

      queue.add(downloadAssets)

      setInterval(function() {
        logStatus()
      }, 60000);

      // const table = new Table({
      //   head: [chalk.cyan.bold('Process'), chalk.cyan.bold('Status'), chalk.cyan.bold('Detail')],
      //   colWidths: [15, 'auto', 'auto'],
      // });

      // setInterval(function() {
        // const tracklist = getTracklist();
        // const currentTrack = getCurrentTrack();
        
        // table.splice(0);

        // table.push(
        //   [
        //     chalk.yellow('Stream'), 
        //     status.isStreaming ? chalk.green('ON') : chalk.red('OFF'), 
        //     `${status.isStreaming ? status.isStreaming : ''}`
        //       .replace(/= /g, '')
        //       .replace(/ +/g, ' ')          
        //   ],
        //   [chalk.yellow('Download'), status.isDownloading ? chalk.green('ON') : chalk.red('OFF'), `${status.isDownloading ? status.isDownloading : ''}`],
        //   [chalk.yellow('Preprocess'), status.isPreprocessing ? chalk.green('ON') : chalk.red('OFF'), `${status.isPreprocessing ? status.isPreprocessing : ''}`],
        //   [chalk.yellow('Tracklist'), tracklist.length, `(${currentTrack})`]
        // );

        // console.clear();
        // console.log(table.toString());

      // }, 1000);

    }
  });


}
