# TODO
- make function that loads new audio from assets into the live section
- it must first clear the live section
BUT it should not clear the live file that's playing, which can be seen from self.currentAudio


- make a modification so that the streeam plays silent audio when the live section is empty

-- make the name of the song fade in and out


    // // Setup the ffmpeg command
    // const cmd = `
    //   ${ffmpeg} \
    //   -stream_loop -1 \
    //   -re \
    //   -i ${videoFile} \
    //   -stream_loop -1 \
    //   -re \
    //   -f concat -safe 0 -i media/processed/tracklist.txt \
    //   -f lavfi -i anullsrc \
    //   -c:v libx264 -preset veryfast -pix_fmt yuv420p \
    //   -crf 10 \
    //   -r 60 \
    //   -c:a aac \
    //   -b:a 192k -ar 44100 -shortest \
    //   -b:v 4500k \
    //   -threads 4 \
    //   -f flv ${mainOptions.streamURL}/${process.env.STREAM_KEY}
    // `


      // self.ffmpeg = ffmpeg()
  //   .addInput(resolve(self.live, 'video', 'background.gif'))
  //   .addInputOption('-ignore_loop 0')
  //   .addInputOption('-re') // Realtime
  //   .videoFilters({
  //     filter: 'drawtext',
  //     options: {
  //       fontfile: resolve(self.live, 'font', 'title.ttf'),
  //       textfile: resolve(self.live, 'title.txt'),
  //       fontsize: 40,
  //       fontcolor: 'white',
  //       x: '(w-tw)/2',
  //       y: '(main_h-60)',
  //       reload: 1,
  //       shadowcolor: 'black',
  //       shadowx: 2,
  //       shadowy: 2,
  //     }
  //   })
  //   // Use the concat demuxer for dynamic audio input
  //   .addInput(resolve(self.live, 'queue.txt'))
  //   .inputFormat('concat')
  //   .inputOption('-safe 0') // Necessary if paths are absolute or have special characters

  //   .size(options.stream.size)
  //   .videoBitrate(options.stream.videoBitrate)
  //   .withAspect('16:9')
  //   .videoCodec('libx264')
  //   .audioCodec('aac')
  //   .audioBitrate(options.stream.audioBitrate)
  //   .toFormat('flv')
  //   .output(`${options.stream.ingest}/${process.env.STREAM_KEY}`)
