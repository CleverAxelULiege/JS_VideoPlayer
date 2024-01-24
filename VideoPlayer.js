import { ProgressionSlider } from "./ProgressionSlider.js";
import { VolumeSlider } from "./VolumeSlider.js";

/**
 * Temps en millisecondes où les controls peuvent être affichés.
 * - Soit lorsqu'on clique dessus sur écran tactile
 * - Soit lorsque la souris est sur la vidéo après un temps d'inactivité
 */
const TIME_CONTROLS_ARE_UP = 3500;

export class VideoPlayer {

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

        /**Simple function pour set les ARIA */
        this.videoContainer.addEventListener("mouseenter", () => {
            this.controls.setAttribute("aria-hidden", "false");
        });

        /**Simple function pour set les ARIA */
        this.videoContainer.addEventListener("mouseleave", () => {
            this.controls.setAttribute("aria-hidden", "true");
            this.controls.classList.remove("active");
            this.areControlsUp = false;
        });

        this.videoContainer.addEventListener("mousemove", this.hideCursorAndControlsAfterInactivity.bind(this));
        this.videoContainer.addEventListener("click", this.toggleControlsTouchScreen.bind(this));

        this.video.addEventListener("loadedmetadata", () => {
            this.updateDisplayTimeStamp();
        });

        if(!CSS.supports("aspect-ratio", "16/9")){
            console.info("Aspect-ratio support via JS");
            window.addEventListener("resize", () => {
                this.videoContainer.style.height = (this.videoContainer.getBoundingClientRect().width / 16) * 9;
            });
        }

        //obligé de faire une boucle car même avec l'event loaded il ne me retourne rien même pas le DOM Element
        while (this.timestamp.innerHTML == "") {
            this.updateDisplayTimeStamp();
        }
    }

    /**
     * Peut être également utilisé par ProgressionSlider pour cacher les controls après avoir utilisé le "thumb" 
     * dans la barre du temps UNIQUEMENT POUR LES ECRANS TACTILE */
    startTimeoutCloseControlsTouchScreen(){
        this.idTimeoutControls = setTimeout(() => {
            this.closeControlsTouchScreen();
        }, TIME_CONTROLS_ARE_UP);
    }

    /**@private */
    openControlsTouchScreen() {
        this.controls.classList.add("active");
        this.controls.setAttribute("aria-hidden", "false");
        this.areControlsUp = true;
    }

    /**@private */
    closeControlsTouchScreen() {
        this.controls.classList.remove("active");
        this.controls.setAttribute("aria-hidden", "true");
        this.areControlsUp = false;
    }

    /**
     * @private
     * @param {Event} e 
     */
    toggleControlsTouchScreen(e) {
        if(!this.isTouchScreen()){
            return;
        }

        clearTimeout(this.idTimeoutControls);
        
        if(!this.areControlsUp){
            this.openControlsTouchScreen();
            this.startTimeoutCloseControlsTouchScreen();
        } 
        else if(this.areControlsUp && e.target == this.video){
            this.closeControlsTouchScreen();
        }
    }

    /**
     * @private
     * après un temps d'inactivité le curseur et les controls seront cachés MARCHE UNIQUEMENT SUR DES APPAREILS NON TACTILES
     * @see toggleControlsTouchScreen -> pour voir comment cacher les controls sur les appareils tactiles
     */
    hideCursorAndControlsAfterInactivity(){
        if (this.isTouchScreen()) {
            return;
        }
        clearTimeout(this.idTimeoutControls);
        this.videoContainer.style.cursor = "";
        this.controls.classList.remove("hide");
        this.controls.setAttribute("aria-hidden", "false");
        
        this.idTimeoutControls = setTimeout(() => {
            this.videoContainer.style.cursor = "none";
            this.controls.classList.add("hide");
            this.controls.setAttribute("aria-hidden", "true");
        }, TIME_CONTROLS_ARE_UP)
    }

    /**@private */
    endVideo() {
        //video done
        if (this.progressionSlider.getProgression() == 100) {
            this.isVideoOver = true;
            this.playPauseButton.querySelector(".play_icon").classList.add("hidden");
            this.playPauseButton.querySelector(".pause_icon").classList.add("hidden");
            this.playPauseButton.querySelector(".replay_icon").classList.remove("hidden");

            if(this.isTouchScreen()){
                this.startTimeoutCloseControlsTouchScreen();
            }
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

    /**
     * peut-être aussi utilisé par ProgressionSlider au cas où remonterait la ligne du temps alors que la vidéo est finie
     */
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
        try {
            this.timestamp.innerHTML = `${this.formatTime(Math.round(this.getCurrentTime()))} / ${this.formatTime(Math.round(this.getDuration()))}`;
        } catch (e) {
            this.timestamp.innerHTML = "error";
        }
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
                this.toggleControlsTouchScreen();
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

    /**@private */
    supportFullscreen(){
        if (this.videoContainer.requestFullscreen) {
            return true;
        } else if (this.videoContainer.mozRequestFullScreen) {
            return true;
        } else if (this.videoContainer.webkitRequestFullscreen) {
            return true;
        } else if (this.videoContainer.msRequestFullscreen) {
            return true;
        }

        return false;
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