<p align="center">
  <a href="https://cdn.itwcreativeworks.com/assets/itw-creative-works/images/logo/itw-creative-works-brandmark-black-x.svg">
    <img src="https://cdn.itwcreativeworks.com/assets/itw-creative-works/images/logo/itw-creative-works-brandmark-black-x.svg" width="100px">
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/github/package-json/v/itw-creative-works/streamii.svg">
  <br>
  <img src="https://img.shields.io/librariesio/release/npm/streamii.svg">
  <img src="https://img.shields.io/bundlephobia/min/streamii.svg">
  <img src="https://img.shields.io/codeclimate/maintainability-percentage/itw-creative-works/streamii.svg">
  <img src="https://img.shields.io/npm/dm/streamii.svg">
  <img src="https://img.shields.io/node/v/streamii.svg">
  <img src="https://img.shields.io/website/https/itwcreativeworks.com.svg">
  <img src="https://img.shields.io/github/license/itw-creative-works/streamii.svg">
  <img src="https://img.shields.io/github/contributors/itw-creative-works/streamii.svg">
  <img src="https://img.shields.io/github/last-commit/itw-creative-works/streamii.svg">
  <br>
  <br>
  <a href="https://itwcreativeworks.com">Site</a> | <a href="https://www.npmjs.com/package/streamii">NPM Module</a> | <a href="https://github.com/itw-creative-works/streamii">GitHub Repo</a>
  <br>
  <br>
  <strong>Streamii</strong> is an NPM module for running a 24/7 livestream on YouTube, Twitch, or any streaming service
</p>

## Features
* Just `require` and you're good to go
* Stream 24/7 to YouTube, Twitch, etc

## Install Streamii
### Install via npm
Install with npm if you plan to use **Streamii** in a Node.js project or in the browser.
```shell
npm install streamii
```

```js
const Streamii = require('streamii');
const streamii = new Streamii({
  // The URL to stream to
  streamURL: 'rtmp://a.rtmp.youtube.com/live2',

  // The repository where the assets are stored
  assets: {
    owner: 'your-github-username',
    repo: 'your-github-repo',
  },
});

streamii.stream();
```

### Confgure Streamii
#### 1. Setup .env file
Create a `.env` file in your project root directory with the following
```
STREAM_KEY='put_your_stream_key_here'
GH_TOKEN='put_your_gh_token_here'
```

#### 2. Upload assets
Zip and upload your stream assets to the same GitHub repository as release assets that you configure when you call `new Streamii()`. Your assets should be in this format:
```
.
├── audio
│   ├── audio1.mp3
│   ├── audio2.mp3
│   └── audio3.mp3
└── video
    └── video.mp4
```
The module will automatically download the release assets and use them in the stream.

## TODO
* Clean old audio files
  * When downloading the `.zip` file, extract and make a list of the extracted files in the unprocessed folder called `uploads/contents.txt` with the names of the files. After the download completes, wait like 10 minutes (so current song can finish) and the loop through the unprocessed audio as well as the processed audio and remove any audio files that are not in the `contents.txt` as a way of clearing out any old audio files


## Final Words
If you are still having difficulty, we would love for you to post a question to [the Streamii issues page](https://github.com/itw-creative-works/streamii/issues). It is much easier to answer questions that include your code and relevant files! So if you can provide them, we'd be extremely grateful (and more likely to help you find the answer!)

## Projects Using this Library
[SoundGrail Music App](https://app.soundgrail.com/): A resource for producers, musicians, and DJs. <br>

Ask us to have your project listed! :)
