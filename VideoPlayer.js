import { ProgressionSlider } from "./ProgressionSlider.js";
import { VolumeSlider } from "./VolumeSlider.js";

export class VideoPlayer{

    /**@private */
    isVideoOver = false;


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
         * @type {HTMLSpanElement}
         */
        this.timestamp = videoContainer.querySelector(".timestamp");

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
        this.progressionSlider.setThumbPosition(0);

        /**
         * @private
         * @type {VolumeSlider}
         */
        this.volumeSlider = new VolumeSlider(document.querySelector(".progress_volume"), this);
        //TODO IS_TOUCH_SCREEN DEFAULT TO 100
        this.volumeSlider.setThumbPosition(this.getVolume() * 100);

        this.initEventListeners();
        this.updateDisplayTimeStamp();
    }

    /**@private */
    initEventListeners(){
        this.video.addEventListener("timeupdate", this.timeUpdate.bind(this));
        this.playPauseButton.addEventListener("click", this.playOrResume.bind(this));
        this.video.addEventListener("ended", this.endVideo.bind(this));
    }

    /**@private */
    endVideo(){
        //video done
        if(this.progressionSlider.getProgression() == 100){
            this.isVideoOver = true;
            this.playPauseButton.querySelector(".play_icon").classList.add("hidden");
            this.playPauseButton.querySelector(".pause_icon").classList.add("hidden");
            this.playPauseButton.querySelector(".replay_icon").classList.remove("hidden");
        } else {
            console.info("waiting for more data;");
        }
    }
    
    /**@private */
    playOrResume(){
        if(this.isVideoOver){
            this.restartVideo();
            return;
        }

        if(this.isPaused()){
            this.resume();
        } else {
            this.pause();
        }
    }

    /**@private */
    restartVideo(){
        this.isVideoOver = false;
        this.resume(false);
        this.playPauseButton.querySelector(".play_icon").classList.add("hidden");
        this.playPauseButton.querySelector(".pause_icon").classList.remove("hidden");
        this.playPauseButton.querySelector(".replay_icon").classList.add("hidden");
    }

    /**@private */
    timeUpdate(){
        this.updateDisplayTimeStamp();
        if(this.progressionSlider.isPointerDown){
            return;
        }
        if(this.video.buffered.length != 0){
            this.progressionSlider.setBufferedLength((this.video.buffered.end(0) / this.getDuration()) * 100);
        }
        this.progressionSlider.setThumbPosition((this.getCurrentTime() / this.getDuration()) * 100);

    }

    /**@private */
    updateDisplayTimeStamp(){
       this.timestamp.innerText = `${this.formatTime(Math.round(this.getCurrentTime()))} / ${this.formatTime(Math.round(this.getDuration()))}`;
    }

    /**
     * @private
     * @param {number} second 
     */
    formatTime(second){
        let minute = Math.floor(second / 60);
        second = second % 60;

        return `${(minute < 10 ? "0" + minute.toString() : minute.toString())}:${(second < 10 ? "0" + second.toString() : second.toString())}`;
    }

    pause(shouldToggleIcons = true){
        this.video.pause();

        if(shouldToggleIcons){
            this.togglePlayPauseIcons();
        }
    }

    resume(shouldToggleIcons = true){
        this.video.play();

        if(shouldToggleIcons){
            this.togglePlayPauseIcons();
        }

    }

    stop(){
        this.pause(false);
    }

    /**@private */
    togglePlayPauseIcons(){
        this.playPauseButton.querySelector(".play_icon").classList.toggle("hidden");
        this.playPauseButton.querySelector(".pause_icon").classList.toggle("hidden");
    }

    getDuration(){
        if(this.video.duration == Infinity){
            window.alert("The video duration is set to INFINITY, this isn't normal, please contact the responsible person.");
            throw new Error("Video duration set to infinity");
        }
        return this.video.duration;
    }

    getCurrentTime(){
        return this.video.currentTime;
    }

    isPaused(){
        return this.video.paused;
    }

    getVolume(){
        return this.video.volume;
    }
    
    /**
     * @param {number} volume 
     */
    setVolume(volume){
        this.video.volume = volume;
    }

    toggleMute(){
        this.video.muted = !this.video.muted;
    }



    /**
     * @param {number} timeInSeconds
     * peut être appelé par ProgressionSlider
     */
    setVideoCurrentTime(timeInSeconds){
        this.video.currentTime = timeInSeconds;
    }
}