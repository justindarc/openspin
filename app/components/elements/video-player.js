const { getTempFilePath } = require('../common/theme-utils.js');

const electron = require('electron');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const tmp = require('tmp');

const MAX_VIDEO_CHUNK_DURATION = 6.0;
const MIN_VIDEO_CHUNK_DURATION = 4.0;

ffmpeg.setFfmpegPath(require('ffmpeg-static').path.replace('app.asar', 'app.asar.unpacked'));
ffmpeg.setFfprobePath(require('ffprobe-static').path.replace('app.asar', 'app.asar.unpacked'));

let _videoEl = new WeakMap();

function getMetadata(src) {
  return new Promise((resolve, reject) => {
    ffmpeg(src).ffprobe((error, metadata) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(metadata);
    });
  });
}

function getTranscodedVideoBuffer(src, seek, duration) {
  return new Promise((resolve, reject) => {
    getTempFilePath('video-XXXXXX.mp4').then((tmpFilePath) => {
      ffmpeg(src)
        .format('mp4')
        .videoCodec('libx264')
        .seek(seek)
        .duration(duration)
        .outputOptions('-movflags frag_keyframe+empty_moov+default_base_moof')
        .on('end', () => {
          fs.readFile(tmpFilePath, (error, data) => {
            if (error) {
              reject(error);
              return;
            }

            // Cleanup temp file.
            setTimeout(() => {
              fs.unlink(tmpFilePath, (error) => {
                if (error) {
                  console.error(error);
                }
              });
            });

            resolve(data.buffer);
          });
        })
        .on('error', (error) => {
          reject(error);
        })
        .output(tmpFilePath)
        .run();
    }).catch(error => reject(error));
  });
}

class VideoPlayerElement extends HTMLElement {
  constructor() {
    super();

    const html =
`
<style>
  :host {
    display: inline-block;
  }
  video {
    width: 100%;
    height: 100%;
    object-fit: inherit;
  }
</style>
<video></video>
`;

    let template = document.createElement('template');
    template.innerHTML = html;

    let shadowRoot = this.attachShadow({ mode: 'closed' });
    shadowRoot.appendChild(template.content.cloneNode(true));

    let videoEl = shadowRoot.querySelector('video');
    videoEl.loop = this.hasAttribute('loop');
    videoEl.muted = this.hasAttribute('muted');
    videoEl.onloadedmetadata = () => this.onloadedmetadata();
    videoEl.onended = () => this.onended();
    videoEl.onerror = () => this.onerror();
    videoEl.oncanplay = () => {
      let src = videoEl.src;
      if (src && src.startsWith('blob:')) {
        URL.revokeObjectURL(src);
      }
    };
    _videoEl.set(this, videoEl);

    setTimeout(() => {
      this.src = this.getAttribute('src');
    });
  }

  get src() {
    return this.getAttribute('src') || null;
  }

  set src(value) {
    if (value === this.src) {
      return;
    }

    this.setAttribute('src', value);

    if (!value) {
      return;
    }

    let videoEl = _videoEl.get(this);

    let extension = path.extname(value).toLowerCase();
    if (extension === '.flv') {
      getMetadata(value).then((metadata) => {
        let duration = metadata.format.duration;
        if (duration <= MAX_VIDEO_CHUNK_DURATION) {
          // Since the video is smaller than our chunk size,
          // just convert the entire video to a Blob.
          getTranscodedVideoBuffer(value, 0, duration).then((buffer) => {
            let blob = new Blob([buffer], { type: 'video/mp4' });

            videoEl.src = URL.createObjectURL(blob);

            if (this.hasAttribute('autoplay')) {
              videoEl.play();
            }
          });
          return;
        }

        let seek = 0;
        let timestampOffset = MAX_VIDEO_CHUNK_DURATION;

        let mediaSource = new MediaSource();
        mediaSource.onsourceopen = () => {
          let sourceBuffer = mediaSource.addSourceBuffer('video/mp4; codecs="avc1.64001f,mp4a.40.2"');
          let loadNextChunk = () => {
            getTranscodedVideoBuffer(value, seek, timestampOffset).then((buffer) => {
              sourceBuffer.appendBuffer(buffer);
              seek += timestampOffset;

              // Keep reducing the size of the video chunks as we progress.
              timestampOffset = Math.max(MIN_VIDEO_CHUNK_DURATION, timestampOffset / 1.125);

              if (seek > duration) {
                sourceBuffer.onupdateend = null;
                setTimeout(() => mediaSource.endOfStream(), timestampOffset * 1000);
              }
            });
          };

          sourceBuffer.mode = 'sequence';
          sourceBuffer.onupdateend = () => loadNextChunk();

          loadNextChunk();
        };

        videoEl.src = URL.createObjectURL(mediaSource);

        if (this.hasAttribute('autoplay')) {
          videoEl.play();
        }
      });
    } else {
      videoEl.src = value;

      if (this.hasAttribute('autoplay')) {
        videoEl.play();
      }
    }
  }

  get videoWidth() {
    return _videoEl.get(this).videoWidth;
  }

  get videoHeight() {
    return _videoEl.get(this).videoHeight;
  }

  play() {
    _videoEl.get(this).play();
  }

  pause() {
    _videoEl.get(this).pause();
  }

  onloadedmetadata() {}
  onended() {}
  onerror() {}
}

exports.VideoPlayerElement = VideoPlayerElement;

customElements.define('video-player', VideoPlayerElement);
