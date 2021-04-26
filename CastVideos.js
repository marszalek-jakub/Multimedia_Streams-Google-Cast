
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


'use strict';

// importing json file created 

import {
    videoJSON
  } from './mediaVideo.js';

// server address
const server_address = 'Adress IP';

/**
 * Sources path to video
 */
const path_video = 'http://'+server_address+'/source_path/files-sources/videos/';
const path_image = 'http://'+server_address+'/source_path/files-sources/gallery/';

/**
 * Width of progress bar in pixel
 */
var PROGRESS_BAR_WIDTH = 600;

/**time in milliseconds for minimal progress update */
var TIMER_STEP = 1000;

/**  volume upon initial connection */
var DEFAULT_VOLUME = 0.5;

/** Height in pixels, of volume bar */
var FULL_VOLUME_HEIGHT = 100;

// option button to show videos/images
const optVideo = document.getElementById("option--videos");
const optImage = document.getElementById("option--images");

//section with videos/images
const carImage = document.getElementById("carousel--images");
const carVideo = document.getElementById("carousel--videos");

/**
 * Constants of states for media playback
 */
var PLAYER_STATE = {
    IDLE: 'IDLE',
    LOADING: 'LOADING',
    LOADED: 'LOADED',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    STOPPED: 'STOPPED',
    ERROR: 'ERROR'
};

/**
 * Cast player object
 * Main variables:
 *  - PlayerHandler object for handling media playback
 *  - Cast player variables for controlling Cast mode media playback
 *  - Current media variables for transition between Cast and local modes
 */
var CastPlayer = function() {
    /** @type {PlayerHandler} Delegation proxy for media playback */
    this.playerHandler = new PlayerHandler(this);

    /** @type {PLAYER_STATE} A state for media playback */
    this.playerState = PLAYER_STATE.IDLE;

    /* Cast player variables */
    /** @type {cast.framework.RemotePlayer} */
    this.remotePlayer = null;
    /** @type {cast.framework.RemotePlayerController} */
    this.remotePlayerController = null;

    /* Current media variables */
    /** @type {number} A number for current media index */
    this.currentMediaIndex = 0;
    /** @type {number} A number for current media time */
    this.currentMediaTime = 0;
    /** @type {number} A number for current media duration */
    this.currentMediaDuration = -1;
    /** @type {?number} A timer for tracking progress of media */
    this.timer = null;

    /** @type {Object} media contents from JSON */
    this.mediaContents = null;
    
    /** @type {Object} media contents from JSON */
    this.mediaContents2 = null;

    /** @type {boolean} Fullscreen mode on/off */
    this.fullscreen = false;

    /** @type {function()} */
    this.incrementMediaTimeHandler = this.incrementMediaTime.bind(this);

    this.setupLocalPlayer();
    this.addVideoThumbs();
    this.initializeUI();
};

CastPlayer.prototype.initializeCastPlayer = function() {

    var options = {};

    //Receiver aplicationID
    options.receiverApplicationId = chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID;


    // Auto join policy 
    options.autoJoinPolicy = chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED;

    cast.framework.CastContext.getInstance().setOptions(options);

    this.remotePlayer = new cast.framework.RemotePlayer();
    this.remotePlayerController = new cast.framework.RemotePlayerController(this.remotePlayer);
    this.remotePlayerController.addEventListener(
        cast.framework.RemotePlayerEventType.IS_CONNECTED_CHANGED,
        this.switchPlayer.bind(this)
    );
};

/*
 * PlayerHandler and setup functions
 */

CastPlayer.prototype.switchPlayer = function() {
    this.stopProgressTimer();
    this.resetVolumeSlider();
    this.playerHandler.stop();
    this.playerState = PLAYER_STATE.IDLE;
    if (cast && cast.framework) {
        if (this.remotePlayer.isConnected) {
            this.setupRemotePlayer();
            return;
        }
    }
    this.setupLocalPlayer();
};

/**
 * PlayerHandler
 *
 * This is a handler through which the application will interact
 * with both the RemotePlayer and LocalPlayer. Combining these two into
 * one interface is one approach to the dual-player nature of a Cast
 * Chrome application. Otherwise, the state of the RemotePlayer can be
 * queried at any time to decide whether to interact with the local
 * or remote players.

 */
var PlayerHandler = function(castPlayer) {
    this.target = {};

    this.setTarget= function(target) {
        this.target = target;
    };

    this.play = function() {
        if (castPlayer.playerState !== PLAYER_STATE.PLAYING &&
            castPlayer.playerState !== PLAYER_STATE.PAUSED &&
            castPlayer.playerState !== PLAYER_STATE.LOADED) {
            this.load(castPlayer.currentMediaIndex);
            return;
        }

        this.target.play();
        castPlayer.playerState = PLAYER_STATE.PLAYING;
        document.getElementById('play').style.display = 'none';
        document.getElementById('pause').style.display = 'block';
        this.updateDisplayMessage();
    };

    this.pause = function() {
        if (castPlayer.playerState !== PLAYER_STATE.PLAYING) {
            return;
        }

        this.target.pause();
        castPlayer.playerState = PLAYER_STATE.PAUSED;
        document.getElementById('play').style.display = 'block';
        document.getElementById('pause').style.display = 'none';
        this.updateDisplayMessage();
    };

    this.stop = function() {
        this.pause();
        castPlayer.playerState = PLAYER_STATE.STOPPED;
        this.updateDisplayMessage();
    };

    this.load = function(mediaIndex) {
        castPlayer.playerState = PLAYER_STATE.LOADING;

        document.getElementById('media_title').innerHTML =
            castPlayer.mediaContents[castPlayer.currentMediaIndex]['titleVideo'];
      
        this.target.load(mediaIndex);
        this.updateDisplayMessage();
    };

    this.loaded = function() {
        castPlayer.currentMediaDuration = this.getMediaDuration();
        castPlayer.updateMediaDuration();
        castPlayer.playerState = PLAYER_STATE.LOADED;
        if (castPlayer.currentMediaTime > 0) {
            this.seekTo(castPlayer.currentMediaTime);
        }
        this.play();
        castPlayer.startProgressTimer();
        this.updateDisplayMessage();
    };

    this.getCurrentMediaTime = function() {
        return this.target.getCurrentMediaTime();
    };

    this.getMediaDuration = function() {
        return this.target.getMediaDuration();
    };

    this.updateDisplayMessage = function () {
        this.target.updateDisplayMessage();
    }
;
    this.setVolume = function(volumeSliderPosition) {
        this.target.setVolume(volumeSliderPosition);
    };

    this.mute = function() {
        this.target.mute();
        document.getElementById('audio_on').style.display = 'none';
        document.getElementById('audio_off').style.display = 'block';
    };

    this.unMute = function() {
        this.target.unMute();
        document.getElementById('audio_on').style.display = 'block';
        document.getElementById('audio_off').style.display = 'none';
    };

    this.isMuted = function() {
        return this.target.isMuted();
    };

    this.seekTo = function(time) {
        this.target.seekTo(time);
        this.updateDisplayMessage();
    };
};

/**
 * Set the PlayerHandler target to use the video-element player
 */
CastPlayer.prototype.setupLocalPlayer = function () {
    var localPlayer = document.getElementById('video_element');
    localPlayer.addEventListener(
        'loadeddata', this.onMediaLoadedLocally.bind(this));

    // This object will implement PlayerHandler callbacks with localPlayer
    var playerTarget = {};

    playerTarget.play = function() {
        localPlayer.play();

        var vi = document.getElementById('video_image');
        vi.style.display = 'none';
        localPlayer.style.display = 'block';
    };

    playerTarget.pause = function () {
        localPlayer.pause();
    };

    playerTarget.stop = function () {
        localPlayer.stop();
    };

// loading to file to local

    playerTarget.load = function(mediaIndex) {
        console.log( this.mediaContents[mediaIndex]['FullName']);
        if(this.mediaContents[mediaIndex]['TypeFile'] == "mp4" || this.mediaContents[mediaIndex]['TypeFile'] == "webm" ||  this.mediaContents[mediaIndex]['TypeFile'] == "ogg"){
        localPlayer.src =
        path_video+this.mediaContents[mediaIndex]['FullName'];
        console.log(localPlayer.load());
        localPlayer.load();
        }
        else {
            localPlayer.src =
        path_image+this.mediaContents[mediaIndex]['FullName'];
        console.log(localPlayer.load());
        localPlayer.load();
        }
    }.bind(this);

    playerTarget.getCurrentMediaTime = function() {
        return localPlayer.currentTime;
    };

    playerTarget.getMediaDuration = function() {
        return localPlayer.duration;
    };

    playerTarget.updateDisplayMessage = function () {
        document.getElementById('playerstate').style.display = 'none';
        document.getElementById('playerstatebg').style.display = 'none';
        document.getElementById('video_image_overlay').style.display = 'none';
    };

    playerTarget.setVolume = function(volumeSliderPosition) {
        localPlayer.volume = volumeSliderPosition < FULL_VOLUME_HEIGHT ?
            volumeSliderPosition / FULL_VOLUME_HEIGHT : 1;
        var p = document.getElementById('audio_bg_level');
        p.style.height = volumeSliderPosition + 'px';
        p.style.marginTop = -volumeSliderPosition + 'px';
    };

    playerTarget.mute = function() {
        localPlayer.muted = true;
    };

    playerTarget.unMute = function() {
        localPlayer.muted = false;
    };

    playerTarget.isMuted = function() {
        return localPlayer.muted;
    };

    playerTarget.seekTo = function(time) {
        localPlayer.currentTime = time;
    };

    this.playerHandler.setTarget(playerTarget);

    this.playerHandler.setVolume(DEFAULT_VOLUME * FULL_VOLUME_HEIGHT);

    this.showFullscreenButton();

    if (this.currentMediaTime > 0) {
        this.playerHandler.play();
    }
};

/**
 * Set the PlayerHandler target to use the remote player
 */
CastPlayer.prototype.setupRemotePlayer = function () {
    var castSession = cast.framework.CastContext.getInstance().getCurrentSession();

    // Add event listeners for player changes which may occur outside sender app
    this.remotePlayerController.addEventListener(
        cast.framework.RemotePlayerEventType.IS_PAUSED_CHANGED,
        function() {
            if (this.remotePlayer.isPaused) {
                this.playerHandler.pause();
            } else {
                this.playerHandler.play();
            }
        }.bind(this)
    );

    this.remotePlayerController.addEventListener(
        cast.framework.RemotePlayerEventType.IS_MUTED_CHANGED,
        function() {
            if (this.remotePlayer.isMuted) {
                this.playerHandler.mute();
            } else {
                this.playerHandler.unMute();
            }
        }.bind(this)
    );

    this.remotePlayerController.addEventListener(
        cast.framework.RemotePlayerEventType.VOLUME_LEVEL_CHANGED,
        function() {
            var newVolume = this.remotePlayer.volumeLevel * FULL_VOLUME_HEIGHT;
            var p = document.getElementById('audio_bg_level');
            p.style.height = newVolume + 'px';
            p.style.marginTop = -newVolume + 'px';
        }.bind(this)
    );

    // This object will implement PlayerHandler callbacks with
    // remotePlayerController, and makes necessary UI updates specific
    // to remote playback
    var playerTarget = {};

    playerTarget.play = function () {
        if (this.remotePlayer.isPaused) {
            this.remotePlayerController.playOrPause();
        }

        var vi = document.getElementById('video_image');
        vi.style.display = 'block';
        var localPlayer = document.getElementById('video_element');
        localPlayer.style.display = 'none';
    }.bind(this);

    playerTarget.pause = function () {
        if (!this.remotePlayer.isPaused) {
            this.remotePlayerController.playOrPause();
        }
    }.bind(this);

    playerTarget.stop = function () {
         this.remotePlayerController.stop();
    }.bind(this);


    // loading files remotly
    playerTarget.load = function (mediaIndex) {
        console.log('Loading...' + this.mediaContents[mediaIndex]['titleVideo']);
        if(this.mediaContents[mediaIndex]['TypeFile'] == "mp4" || this.mediaContents[mediaIndex]['TypeFile'] == "webm" ||  this.mediaContents[mediaIndex]['TypeFile'] == "ogg")
        {
        var mediaInfo = new chrome.cast.media.MediaInfo(
           path_video+this.mediaContents[mediaIndex]['FullName'], 'video/mp4');

        }

        else {
    
            var mediaInfo = new chrome.cast.media.MediaInfo(
                path_image+this.mediaContents[mediaIndex]['FullName'], 'image/jpg');
            }
            console.log(this.mediaContents[mediaIndex]['FullName']);
        

        mediaInfo.metadata = new chrome.cast.media.GenericMediaMetadata();
        mediaInfo.metadata.metadataType = chrome.cast.media.MetadataType.GENERIC;
        mediaInfo.metadata.title = this.mediaContents[mediaIndex]['titleVideo'];

        var request = new chrome.cast.media.LoadRequest(mediaInfo);
        castSession.loadMedia(request).then(
            this.playerHandler.loaded.bind(this.playerHandler),
            function (errorCode) {
                this.playerState = PLAYER_STATE.ERROR;
                console.log('Remote media load error: ' +
                    CastPlayer.getErrorMessage(errorCode));
            }.bind(this));
    }.bind(this);

    playerTarget.getCurrentMediaTime = function() {
        return this.remotePlayer.currentTime;
    }.bind(this);

    playerTarget.getMediaDuration = function() {
        return this.remotePlayer.duration;
    }.bind(this);

    playerTarget.updateDisplayMessage = function () {
        document.getElementById('playerstate').style.display = 'block';
        document.getElementById('playerstatebg').style.display = 'block';
        document.getElementById('video_image_overlay').style.display = 'block';
        document.getElementById('playerstate').innerHTML =
            this.mediaContents[ this.currentMediaIndex]['titleVideo'] + ' ' +
            this.playerState + ' on ' + castSession.getCastDevice().friendlyName;
    }.bind(this);

    playerTarget.setVolume = function (volumeSliderPosition) {
        // Add resistance to avoid loud volume
        var currentVolume = this.remotePlayer.volumeLevel;
        var p = document.getElementById('audio_bg_level');
        if (volumeSliderPosition < FULL_VOLUME_HEIGHT) {
            var vScale =  this.currentVolume * FULL_VOLUME_HEIGHT;
            if (volumeSliderPosition > vScale) {
                volumeSliderPosition = vScale + (pos - vScale) / 2;
            }
            p.style.height = volumeSliderPosition + 'px';
            p.style.marginTop = -volumeSliderPosition + 'px';
            currentVolume = volumeSliderPosition / FULL_VOLUME_HEIGHT;
        } else {
            currentVolume = 1;
        }
        this.remotePlayer.volumeLevel = currentVolume;
        this.remotePlayerController.setVolumeLevel();
    }.bind(this);

    playerTarget.mute = function () {
        if (!this.remotePlayer.isMuted) {
            this.remotePlayerController.muteOrUnmute();
        }
    }.bind(this);

    playerTarget.unMute = function () {
        if (this.remotePlayer.isMuted) {
            this.remotePlayerController.muteOrUnmute();
        }
    }.bind(this);

    playerTarget.isMuted = function() {
        return this.remotePlayer.isMuted;
    }.bind(this);

    playerTarget.seekTo = function (time) {
        this.remotePlayer.currentTime = time;
        this.remotePlayerController.seek();
    }.bind(this);

    this.playerHandler.setTarget(playerTarget);

    // Setup remote player volume right on setup
    // The remote player may have had a volume set from previous playback
    if (this.remotePlayer.isMuted) {
        this.playerHandler.mute();
    }
    var currentVolume = this.remotePlayer.volumeLevel * FULL_VOLUME_HEIGHT;
    var p = document.getElementById('audio_bg_level');
    p.style.height = currentVolume + 'px';
    p.style.marginTop = -currentVolume + 'px';

    this.hideFullscreenButton();

    this.playerHandler.play();
};

/**
 * Callback when media is loaded in local player
 */
CastPlayer.prototype.onMediaLoadedLocally = function() {
    var localPlayer = document.getElementById('video_element');
    localPlayer.currentTime = this.currentMediaTime;

    this.playerHandler.loaded();
};

/**
 * Select a media content
 */
CastPlayer.prototype.selectMedia = function(mediaIndex) {
    console.log('Media index selected: ' + mediaIndex);

    this.currentMediaIndex = mediaIndex;

    var vi = document.getElementById('video_image');
    var ve = document.getElementById('video_element');

    var media = document.getElementById('media_control');

    if(this.mediaContents[mediaIndex]['TypeFile'] == "mp4" || this.mediaContents[mediaIndex]['TypeFile'] == "webm" ||  this.mediaContents[mediaIndex]['TypeFile'] == "ogg")
        {
            media.style.display = "flex";
            vi.src = 'http://'+server_address+'//PD2/imagefiles/default.png';
            var elems = document.getElementsByClassName('available');
            for (var i=0;i<elems.length;i+=1){
            elems[i].style.visibility = 'visible';
            }
            vi.style.display = "none";
            ve.style.display = "block"

        }
        else {
            var elems = document.getElementsByClassName('available');
            for (var i=0;i<elems.length;i+=1){
            elems[i].style.visibility = 'hidden';
            }
            vi.src = path_image + this.mediaContents[mediaIndex]['FullName'];
            vi.style.display = "block";
            ve.style.display = "none"
        }


    // Reset progress bar
    var pi = document.getElementById('progress_indicator');
    var p = document.getElementById('progress');
    p.style.width = '0px';
    pi.style.marginLeft = -21 - PROGRESS_BAR_WIDTH + 'px';

    // Reset currentMediaTime
    this.currentMediaTime = 0;

    this.playerState = PLAYER_STATE.IDLE;
    this.playerHandler.play();
};


/**
 * Media seek function
 */
CastPlayer.prototype.seekMedia = function(event) {
    var pos = parseInt(event.offsetX, 10);
    var pi = document.getElementById('progress_indicator');
    var p = document.getElementById('progress');
    if (event.currentTarget.id == 'progress_indicator') {
        var curr = parseInt(
            this.currentMediaTime + this.currentMediaDuration * pos /
            PROGRESS_BAR_WIDTH, 10);
        var pp = parseInt(pi.style.marginLeft, 10) + pos;
        var pw = parseInt(p.style.width, 10) + pos;
    } else {
        var curr = parseInt(
            pos * this.currentMediaDuration / PROGRESS_BAR_WIDTH, 10);
        var pp = pos - 21 - PROGRESS_BAR_WIDTH;
        var pw = pos;
    }

    if (this.playerState === PLAYER_STATE.PLAYING ||
        this.playerState === PLAYER_STATE.PAUSED) {
        this.currentMediaTime = curr;
        p.style.width = pw + 'px';
        pi.style.marginLeft = pp + 'px';
    }

    this.playerHandler.seekTo(curr);
};

/**
 * Set current player volume
 */
CastPlayer.prototype.setVolume = function(mouseEvent) {
    var p = document.getElementById('audio_bg_level');
    var pos = 0;
    if (mouseEvent.currentTarget.id === 'audio_bg_track') {
        pos = FULL_VOLUME_HEIGHT - parseInt(mouseEvent.offsetY, 10);
    } else {
        pos = parseInt(p.clientHeight, 10) - parseInt(mouseEvent.offsetY, 10);
    }
    this.playerHandler.setVolume(pos);
};

/**
 * Starts the timer to increment the media progress bar
 */
CastPlayer.prototype.startProgressTimer = function() {
    this.stopProgressTimer();

    // Start progress timer
    this.timer =
        setInterval(this.incrementMediaTimeHandler, TIMER_STEP);
};

/**
 * Stops the timer to increment the media progress bar
 */
CastPlayer.prototype.stopProgressTimer = function() {
    if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
    }
};

/**
 * Helper function
 * Increment media current position by 1 second
 */
CastPlayer.prototype.incrementMediaTime = function() {
    // First sync with the current player's time
    this.currentMediaTime = this.playerHandler.getCurrentMediaTime();
    this.currentMediaDuration = this.playerHandler.getMediaDuration();

    if (this.playerState === PLAYER_STATE.PLAYING) {
        if (this.currentMediaTime < this.currentMediaDuration) {
            this.currentMediaTime += 1;
            this.updateProgressBarByTimer();
        } else {
            this.endPlayback();
        }
    }
};

/**
 * Update progress bar based on timer
 */
CastPlayer.prototype.updateProgressBarByTimer = function() {
    var p = document.getElementById('progress');
    if (isNaN(parseInt(p.style.width, 10))) {
        p.style.width = 0;
    }
    if (this.currentMediaDuration > 0) {
        var pp = Math.floor(
            PROGRESS_BAR_WIDTH * this.currentMediaTime / this.currentMediaDuration);
    }

    p.style.width = pp + 'px';
    var pi = document.getElementById('progress_indicator');
    pi.style.marginLeft = -21 - PROGRESS_BAR_WIDTH + pp + 'px';

    if (pp >= PROGRESS_BAR_WIDTH) {
        this.endPlayback();
    }
};

/**
 *  End playback. Called when media ends.
 */
CastPlayer.prototype.endPlayback = function() {
    this.currentMediaTime = 0;
    this.stopProgressTimer();
    this.playerState = PLAYER_STATE.IDLE;
    this.playerHandler.updateDisplayMessage();

    document.getElementById('play').style.display = 'block';
    document.getElementById('pause').style.display = 'none';
};

/**
 * @param {number} durationInSec
 * @return {string}
 */
CastPlayer.getDurationString = function(durationInSec) {
    var durationString = '' + Math.floor(durationInSec % 60);
    var durationInMin = Math.floor(durationInSec / 60);
    if (durationInMin === 0) {
        return durationString;
    }
    durationString = (durationInMin % 60) + ':' + durationString;
    var durationInHour = Math.floor(durationInMin / 60);
    if (durationInHour === 0) {
        return durationString;
    }
    return durationInHour + ':' + durationString;
};

/**
 * Updates media duration text in UI
 */
CastPlayer.prototype.updateMediaDuration = function() {
    document.getElementById('duration').innerHTML =
        CastPlayer.getDurationString(this.currentMediaDuration);
};

/**
 * Request full screen mode
 */
CastPlayer.prototype.requestFullScreen = function() {
    // Supports most browsers and their versions.
    var element = document.getElementById('video_element');
    var requestMethod =
        element['requestFullScreen'] || element['webkitRequestFullScreen'];

    if (requestMethod) { // Native full screen.
        requestMethod.call(element);
        console.log('Requested fullscreen');
    }
};

/**
 * Exit full screen mode
 */
CastPlayer.prototype.cancelFullScreen = function() {
    // Supports most browsers and their versions.
    var requestMethod =
        document['cancelFullScreen'] || document['webkitCancelFullScreen'];

    if (requestMethod) {
        requestMethod.call(document);
    }
};


/**
 * Exit fullscreen mode by escape
 */
CastPlayer.prototype.fullscreenChangeHandler = function() {
    this.fullscreen = !this.fullscreen;
};


/**
 * Show expand/collapse fullscreen button
 */
CastPlayer.prototype.showFullscreenButton = function() {
    if (this.fullscreen) {
        document.getElementById('fullscreen_expand').style.display = 'none';
        document.getElementById('fullscreen_collapse').style.display = 'block';
    } else {
        document.getElementById('fullscreen_expand').style.display = 'block';
        document.getElementById('fullscreen_collapse').style.display = 'none';
    }
};


/**
 * Hide expand/collapse fullscreen button
 */
CastPlayer.prototype.hideFullscreenButton = function() {
    document.getElementById('fullscreen_expand').style.display = 'none';
    document.getElementById('fullscreen_collapse').style.display = 'none';
};

/**
 * Show the media control
 */
CastPlayer.prototype.showMediaControl = function() {
    document.getElementById('media_control').style.opacity = 1.0;
    document.getElementById('media_info').style.opacity = 1.0;
};


/**
 * Hide the media control
 */
CastPlayer.prototype.hideMediaControl = function() {
    document.getElementById('media_control').style.opacity = 0.0;
    document.getElementById('media_info').style.opacity = 0.0;

};


/**
 * Show the volume slider
 */
CastPlayer.prototype.showVolumeSlider = function() {
    if (!this.playerHandler.isMuted()) {
        document.getElementById('audio_bg').style.opacity = 1;
        document.getElementById('audio_bg_track').style.opacity = 1;
        document.getElementById('audio_bg_level').style.opacity = 1;
        document.getElementById('audio_indicator').style.opacity = 1;
    }
};

/**
 * Hide the volume slider
 */
CastPlayer.prototype.hideVolumeSlider = function() {
    document.getElementById('audio_bg').style.opacity = 0;
    document.getElementById('audio_bg_track').style.opacity = 0;
    document.getElementById('audio_bg_level').style.opacity = 0;
    document.getElementById('audio_indicator').style.opacity = 0;
};

/**
 * Reset the volume slider
 */
CastPlayer.prototype.resetVolumeSlider = function() {
    var volumeTrackHeight = document.getElementById('audio_bg_track').clientHeight;
    var defaultVolumeSliderHeight = DEFAULT_VOLUME * volumeTrackHeight;
    document.getElementById('audio_bg_level').style.height =
        defaultVolumeSliderHeight + 'px';
    document.getElementById('audio_on').style.display = 'block';
    document.getElementById('audio_off').style.display = 'none';
};

/**
 * Initialize UI components and add event listeners
 */
CastPlayer.prototype.initializeUI = function() {
    // Set initial values for title, subtitle, and description
    document.getElementById('media_title').innerHTML =
        this.mediaContents[0]['titleVideo'];
    // Add event handlers to UI components
    document.getElementById('progress_bg').addEventListener(
        'click', this.seekMedia.bind(this));
    document.getElementById('progress').addEventListener(
        'click', this.seekMedia.bind(this));
    document.getElementById('progress_indicator').addEventListener(
       'dragend', this.seekMedia.bind(this));
    document.getElementById('audio_on').addEventListener(
        'click', this.playerHandler.mute.bind(this.playerHandler));
    document.getElementById('audio_off').addEventListener(
        'click', this.playerHandler.unMute.bind(this.playerHandler));
    document.getElementById('audio_bg').addEventListener(
        'mouseover', this.showVolumeSlider.bind(this));
    document.getElementById('audio_on').addEventListener(
        'mouseover', this.showVolumeSlider.bind(this));
    document.getElementById('audio_bg_level').addEventListener(
        'mouseover', this.showVolumeSlider.bind(this));
    document.getElementById('audio_bg_track').addEventListener(
        'mouseover', this.showVolumeSlider.bind(this));
    document.getElementById('audio_bg_level').addEventListener(
        'click', this.setVolume.bind(this));
    document.getElementById('audio_bg_track').addEventListener(
        'click', this.setVolume.bind(this));
    document.getElementById('audio_bg').addEventListener(
        'mouseout', this.hideVolumeSlider.bind(this));
    document.getElementById('audio_on').addEventListener(
        'mouseout', this.hideVolumeSlider.bind(this));
    document.getElementById('main_video').addEventListener(
        'mouseover', this.showMediaControl.bind(this));
    document.getElementById('main_video').addEventListener(
        'mouseout', this.hideMediaControl.bind(this));
    document.getElementById('media_control').addEventListener(
        'mouseover', this.showMediaControl.bind(this));
    document.getElementById('media_control').addEventListener(
        'mouseout', this.hideMediaControl.bind(this));
    document.getElementById('fullscreen_expand').addEventListener(
        'click', this.requestFullScreen.bind(this));
    document.getElementById('fullscreen_collapse').addEventListener(
        'click', this.cancelFullScreen.bind(this));
    document.addEventListener(
        'fullscreenchange', this.fullscreenChangeHandler.bind(this), false);
    document.addEventListener(
        'webkitfullscreenchange', this.fullscreenChangeHandler.bind(this), false);

    // Enable play/pause buttons
    document.getElementById('play').addEventListener(
        'click', this.playerHandler.play.bind(this.playerHandler));
    document.getElementById('pause').addEventListener(
        'click', this.playerHandler.pause.bind(this.playerHandler));
    document.getElementById('progress_indicator').draggable = true;
};

/**
 * Add video thumbnails div's to UI for media JSON contents
 */
CastPlayer.prototype.addVideoThumbs = function() {
    this.mediaContents = videoJSON['videos'];
  
    var nvideo = document.getElementById('carousel--videos');
    var nimage = document.getElementById('carousel--images');
    var newdiv = null;
    var divIdName = null;
    for (var i = 0; i < this.mediaContents.length; i++) { 
        if(this.mediaContents[i]['TypeFile'] == "mp4" ||  //Czy plik jest plikiem video
         this.mediaContents[i]['TypeFile'] == "webm" ||  this.mediaContents[i]['TypeFile'] == "ogg")
        {
        newdiv = document.createElement('div');  //struktura krazueli html
        divIdName = 'thumb' + i + 'Video';
        newdiv.setAttribute('id', divIdName);
        newdiv.setAttribute('class', 'thumb');
        newdiv.innerHTML =
            '<video src="' + path_video + this.mediaContents[i]['FullName'] + //dodanie pliku video
            '" class="thumbnail">';
            newdiv.innerHTML +=
            '<p>' + this.mediaContents[i]['titleVideo'] +  //dodanie tytułu pliku video
            '</p>';
        newdiv.addEventListener('click', this.selectMedia.bind(this, i));
        nvideo.appendChild(newdiv);
        }
        else {
            newdiv = document.createElement('div');
            divIdName = 'thumb' + i + 'Image';
            newdiv.setAttribute('id', divIdName);
            newdiv.setAttribute('class', 'thumb');
            newdiv.innerHTML =
                '<img src="' + path_image + this.mediaContents[i]['FullName'] +
                '" class="thumbnail">';
            newdiv.innerHTML +=
                '<p>' + this.mediaContents[i]['titleVideo'] +
                '</p>';
            newdiv.addEventListener('click', this.selectMedia.bind(this, i));
            nimage.appendChild(newdiv);
        }
    }
};


/**
 * Makes human-readable message from chrome.cast.Error
 * @param {chrome.cast.Error} error
 * @return {string} error message
 */
CastPlayer.getErrorMessage = function(error) {
    switch (error.code) {
        case chrome.cast.ErrorCode.API_NOT_INITIALIZED:
            return 'The API is not initialized.' +
                (error.description ? ' :' + error.description : '');
        case chrome.cast.ErrorCode.CANCEL:
            return 'The operation was canceled by the user' +
                (error.description ? ' :' + error.description : '');
        case chrome.cast.ErrorCode.CHANNEL_ERROR:
            return 'A channel to the receiver is not available.' +
                (error.description ? ' :' + error.description : '');
        case chrome.cast.ErrorCode.EXTENSION_MISSING:
            return 'The Cast extension is not available.' +
                (error.description ? ' :' + error.description : '');
        case chrome.cast.ErrorCode.INVALID_PARAMETER:
            return 'The parameters to the operation were not valid.' +
                (error.description ? ' :' + error.description : '');
        case chrome.cast.ErrorCode.RECEIVER_UNAVAILABLE:
            return 'No receiver was compatible with the session request.' +
                (error.description ? ' :' + error.description : '');
        case chrome.cast.ErrorCode.SESSION_ERROR:
            return 'A session could not be created, or a session was invalid.' +
                (error.description ? ' :' + error.description : '');
        case chrome.cast.ErrorCode.TIMEOUT:
            return 'The operation timed out.' +
                (error.description ? ' :' + error.description : '');
    }
};



optImage.addEventListener("click", function(){
carImage.style.display="flex";
optImage.style.backgroundColor="#d4af37";
optVideo.style.backgroundColor="white";

carVideo.style.display="none";
});

optVideo.addEventListener("click", function(){
    carImage.style.display="none";
    optVideo.style.backgroundColor="#d4af37";
    optImage.style.backgroundColor="white";
    carVideo.style.display="flex";
    });

    var castPlayer = new CastPlayer();
    window['__onGCastApiAvailable'] = function (isAvailable) {
      if (isAvailable) {
        castPlayer.initializeCastPlayer();
      }
    };