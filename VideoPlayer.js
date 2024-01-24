import { ProgressionSlider } from "./ProgressionSlider.js";
import { VolumeSlider } from "./VolumeSlider.js";

/**Temps en millisecondes où les controls sont affichés pour les écrans tactiles */
const TIME_CONTROLS_ARE_UP_TOUCH_SCREEN = 3500;

export class VideoPlayer {

    /**@private */
    isVideoOver = false;

    /**@private */
    areControlsUp = false;

    idTimeoutControls = null;


    /**
     * @param {HTMLDivElement} videoContainer
     */
    constructor(videoContainer) {
        /**
         * @private
         * @type {HTMLDivElement}
         */
        this.videoContainer = videoContainer;

        /**
         * @private
         * @type {HTMLVideoElement}
         */
        this.video = videoContainer.querySelector("video");

        /**
         * @private
         * @type {HTMLSpanElement}
         */
        this.timestamp = videoContainer.querySelector(".timestamp");

        /**
         * @private
         * @type {HTMLDivElement}
         */
        this.controls = videoContainer.querySelector(".controls");

        /**
         * @private
         * @type {HTMLButtonElement}
         */
        this.playPauseButton = videoContainer.querySelector(".controls .play_button");

        /**
         * @private
         * @type {HTMLButtonElement}
         */
        this.requestFullScreenButton = videoContainer.querySelector(".controls .full_screen_button");

        /**
         * @private
         * @type {ProgressionSlider}
         */
        this.progressionSlider = new ProgressionSlider(videoContainer.querySelector(".progress_bar"), this);
        this.progressionSlider.setThumbPosition(0);

        /**
         * @private
         * @type {VolumeSlider}
         */
        this.volumeSlider = new VolumeSlider(videoContainer.querySelector(".progress_volume"), this);

        if (this.isTouchScreen()) {
            this.volumeSlider.setThumbPosition(100);
        } else {
            this.volumeSlider.setThumbPosition(this.getVolume() * 100);
        }

        this.initEventListeners();

    }

    /**@private */
    initEventListeners() {
        this.video.addEventListener("timeupdate", this.timeUpdate.bind(this));
        this.playPauseButton.addEventListener("click", this.playOrResume.bind(this));
        this.video.addEventListener("ended", this.endVideo.bind(this));
        this.requestFullScreenButton.addEventListener("click", this.requestOrExitFullScreen.bind(this));

        this.videoContainer.addEventListener("mouseenter", () => {
            this.controls.setAttribute("aria-hidden", "false");
        });

        this.videoContainer.addEventListener("mouseleave", () => {
            this.controls.setAttribute("aria-hidden", "true");
            this.controls.style.pointerEvents = "";
            this.controls.style.opacity = "";
            this.areControlsUp = false;
        });

        this.videoContainer.addEventListener("click", (e) => {
            clearTimeout(this.idTimeoutControls);
            if (this.isTouchScreen() && e.target == this.video) {
                this.toggleControls();
            }
        });

        this.video.addEventListener("loadedmetadata", () => {
            this.updateDisplayTimeStamp();
        });

        //obligé de faire une boucle car même avec l'event loaded il ne me retourne rien
        while(this.timestamp.innerHTML == ""){
            this.updateDisplayTimeStamp();
        }
    }

    /**@private */
    startTimeoutToggleControls() {
        this.idTimeoutControls = setTimeout(() => {
            this.toggleControls();
        }, TIME_CONTROLS_ARE_UP_TOUCH_SCREEN);
    }

    /**Utilisé par ProgressionSlider pour les écrans tactiles lorsqu'on a fini de déplacer le "thumb" dans la barre du temps */
    startTimeoutCloseControls() {
        this.idTimeoutControls = setTimeout(() => {
            this.controls.style.pointerEvents = "none";
            this.controls.style.opacity = "0";
            this.controls.setAttribute("aria-hidden", "true");
        }, TIME_CONTROLS_ARE_UP_TOUCH_SCREEN);
    }
    

    toggleControls() {
        if (this.areControlsUp) {
            this.controls.style.pointerEvents = "none";
            this.controls.style.opacity = "0";
            this.controls.setAttribute("aria-hidden", "true");
        } else {
            this.startTimeoutToggleControls();
            this.controls.style.pointerEvents = "all";
            this.controls.style.opacity = "1";
            this.controls.setAttribute("aria-hidden", "false");
        }

        this.areControlsUp = !this.areControlsUp;
    }

    /**@private */
    endVideo() {
        //video done
        if (this.progressionSlider.getProgression() == 100) {
            this.isVideoOver = true;
            this.playPauseButton.querySelector(".play_icon").classList.add("hidden");
            this.playPauseButton.querySelector(".pause_icon").classList.add("hidden");
            this.playPauseButton.querySelector(".replay_icon").classList.remove("hidden");
        } else {
            console.info("waiting for more data;");
        }
    }

    /**@private */
    playOrResume() {
        if (this.isVideoOver) {
            this.restartVideo();
            return;
        }

        if (this.isPaused()) {
            this.resume();
        } else {
            this.pause();
        }
    }

    /**@private */
    restartVideo() {
        this.isVideoOver = false;
        this.resume(false);
        this.playPauseButton.querySelector(".play_icon").classList.add("hidden");
        this.playPauseButton.querySelector(".pause_icon").classList.remove("hidden");
        this.playPauseButton.querySelector(".replay_icon").classList.add("hidden");
    }

    /**@private */
    timeUpdate() {
        this.updateDisplayTimeStamp();
        if (this.progressionSlider.isPointerDown) {
            return;
        }
        if (this.video.buffered.length != 0) {
            this.progressionSlider.setBufferedLength((this.video.buffered.end(0) / this.getDuration()) * 100);
        }
        this.progressionSlider.setThumbPosition((this.getCurrentTime() / this.getDuration()) * 100);

    }

    /**@private */
    updateDisplayTimeStamp() {
        this.timestamp.innerHTML = `${this.formatTime(Math.round(this.getCurrentTime()))} / ${this.formatTime(Math.round(this.getDuration()))}`;
    }

    /**
     * @private
     * @param {number} second 
     */
    formatTime(second) {
        let minute = Math.floor(second / 60);
        second = second % 60;

        return `${(minute < 10 ? "0" + minute.toString() : minute.toString())}:${(second < 10 ? "0" + second.toString() : second.toString())}`;
    }

    /**@private */
    requestOrExitFullScreen() {
        if (!document.fullscreenElement && !document.mozFullScreen && !document.webkitIsFullScreen && !document.msFullscreenElement) {
            if (this.videoContainer.requestFullscreen) {
                this.videoContainer.requestFullscreen();
            } else if (this.videoContainer.mozRequestFullScreen) {
                this.videoContainer.mozRequestFullScreen();
            } else if (this.videoContainer.webkitRequestFullscreen) {
                this.videoContainer.webkitRequestFullscreen();
            } else if (this.videoContainer.msRequestFullscreen) {
                this.videoContainer.msRequestFullscreen();
            }

            if (this.isTouchScreen()) {
                this.toggleControls();
            }

        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    }

    pause(shouldToggleIcons = true) {
        this.video.pause();

        if (shouldToggleIcons) {
            this.togglePlayPauseIcons();
        }
    }

    resume(shouldToggleIcons = true) {
        this.video.play();

        if (shouldToggleIcons) {
            this.togglePlayPauseIcons();
        }

    }

    stop() {
        this.pause(false);
    }

    /**@private */
    togglePlayPauseIcons() {
        this.playPauseButton.querySelector(".play_icon").classList.toggle("hidden");
        this.playPauseButton.querySelector(".pause_icon").classList.toggle("hidden");
    }

    getDuration() {
        if (this.video.duration == Infinity) {
            window.alert("The video duration is set to INFINITY, this isn't normal, please contact the responsible person.");
            throw new Error("Video duration set to infinity");
        }
        return this.video.duration;
    }

    getCurrentTime() {
        return this.video.currentTime;
    }

    isPaused() {
        return this.video.paused;
    }

    getVolume() {
        return this.video.volume;
    }

    /**
     * @param {number} volume 
     */
    setVolume(volume) {
        this.video.volume = volume;
    }

    toggleMute() {
        this.video.muted = !this.video.muted;
    }



    /**
     * @param {number} timeInSeconds
     * peut être appelé par ProgressionSlider
     */
    setVideoCurrentTime(timeInSeconds) {
        this.video.currentTime = timeInSeconds;
    }

    isTouchScreen() {
        return matchMedia('(hover: none)').matches
        // return (('ontouchstart' in window) ||
        //     (navigator.maxTouchPoints > 0));
    }
}