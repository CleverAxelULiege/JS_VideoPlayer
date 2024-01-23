import { ProgressionSlider } from "./ProgressionSlider.js";
import { VolumeSlider } from "./VolumeSlider.js";

export class VideoPlayer{
    /**
     * @param {HTMLDivElement} videoContainer
     */
    constructor(videoContainer){
        /**
         * @private
         * @type {HTMLVideoElement}
         */
        this.video = videoContainer.querySelector("video");

        /**
         * @private
         * @type {HTMLButtonElement}
         */
        this.playPauseButton = videoContainer.querySelector(".controls .play_button");

        /**
         * @private
         * @type {ProgressionSlider}
         */
        this.progressionSlider = new ProgressionSlider(document.querySelector(".progress_bar"), this);

        /**
         * @private
         * @type {VolumeSlider}
         */
        this.volumeSlider = new VolumeSlider(document.querySelector(".progress_volume"), this);

        this.initEventListeners();
    }

    /**@private */
    initEventListeners(){
        this.video.addEventListener("timeupdate", this.timeUpdate.bind(this));
        this.playPauseButton.addEventListener("click", this.playOrResumeVideo.bind(this));
    }
    
    /**@private */
    playOrResumeVideo(){
        if(this.isPaused()){
            this.resumeVideo();
        } else {
            this.pauseVideo();
        }
    }

    /**@private */
    timeUpdate(){
        if(this.progressionSlider.isPointerDown){
            return;
        }
        if(this.video.buffered.length != 0){
            this.progressionSlider.setBufferedLength((this.video.buffered.end(0) / this.getVideoDuration()) * 100);
        }
        this.progressionSlider.setThumbPosition((this.getVideoCurrentTime() / this.getVideoDuration()) * 100);

    }

    pauseVideo(shouldToggleIcons = true){
        this.video.pause();

        if(shouldToggleIcons){
            this.togglePlayPauseIcons();
        }
    }

    resumeVideo(shouldToggleIcons = true){
        this.video.play();

        if(shouldToggleIcons){
            this.togglePlayPauseIcons();
        }

    }

    stopVideo(){
        this.video.pause();
    }

    /**@private */
    togglePlayPauseIcons(){
        this.playPauseButton.querySelector(".play_icon").classList.toggle("hidden");
        this.playPauseButton.querySelector(".pause_icon").classList.toggle("hidden");
    }

    getVideoDuration(){
        if(this.video.duration == Infinity){
            window.alert("The video duration is set to INFINITY, this isn't normal, please contact the responsible person.");
            throw new Error("Video duration set to infinity");
        }
        return this.video.duration;
    }

    getVideoCurrentTime(){
        return this.video.currentTime;
    }

    isPaused(){
        return this.video.paused;
    }

    /**
     * @param {number} timeInSeconds 
     */
    setVideoCurrentTime(timeInSeconds){
        this.video.currentTime = timeInSeconds;
    }
}