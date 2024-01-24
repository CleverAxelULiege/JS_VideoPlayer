import { VideoPlayer } from "./VideoPlayer.js";

export class ProgressionSlider {
    isPointerDown = false;

    /**@private */
    percentPosition = 0;
    
    /**@private */
    wasPaused = false;

    /**
     * @param {HTMLDivElement} rangeSlider 
     * @param {VideoPlayer} videoPlayer 
     */
    constructor(rangeSlider, videoPlayer) {
        /**@type {HTMLDivElement} */
        this.rangeSlider = rangeSlider;

        /**
         * @private
         * @type {VideoPlayer}
         */
        this.videoPlayer = videoPlayer;

        this.buildRangeSlider();

        /**@type {HTMLButtonElement} */
        this.thumbButton = rangeSlider.querySelector(".thumb");
        this.thumbSize = this.thumbButton.getBoundingClientRect().width; 
        this.thumbButton.style.left = `calc(${this.percentPosition}% - ${this.thumbSize / 2}px)`;

        /**@type {HTMLDivElement} */
        this.progressDone = rangeSlider.querySelector(".done");

        /**@type {HTMLDivElement} */
        this.bufferedProgression = rangeSlider.querySelector(".buffered");

        this.eventPointerMove = this.windowMove.bind(this);
        this.eventPointerUp = this.windowUp.bind(this);

        this.initEventListeners();
    }

    /**@private */
    buildRangeSlider() {
        this.rangeSlider.innerHTML =
            `
            <div class="custom_range_slider">
                <div class="rail"></div>
                <div class="done"></div>
                <div class="buffered"></div>
                <button class="thumb"></button>
            </div>
        `;
    }
    
    getProgression(){
        return this.percentPosition;
    }

    /**@private */
    initEventListeners() {
        if(this.videoPlayer.isTouchScreen()){
            this.rangeSlider.querySelector(".custom_range_slider").addEventListener("touchstart", (e) => {

                this.hideControlsTouchScreen();

                this.isPointerDown = true;
                this.wasPaused = this.videoPlayer.isPaused();
                this.videoPlayer.pause(false);

                if(this.videoPlayer.isVideoOver){
                    this.videoPlayer.restartVideo();
                }

                this.calculateAndSetPercentPosition(e);
                window.addEventListener("touchmove", this.eventPointerMove);
                window.addEventListener("touchend", this.eventPointerUp);
            });
        }else{
            this.rangeSlider.querySelector(".custom_range_slider").addEventListener("mousedown", (e) => {
                this.isPointerDown = true;
                this.wasPaused = this.videoPlayer.isPaused();
                this.videoPlayer.pause(false);
                if(this.videoPlayer.isVideoOver){
                    this.videoPlayer.restartVideo();
                }
                this.calculateAndSetPercentPosition(e);
                window.addEventListener("mousemove", this.eventPointerMove);
                window.addEventListener("mouseup", this.eventPointerUp);
            });
        }
    }

    /**
     * @param {number} percent
     * peut être aussi appelé par le vidéo player (timeUpdate) pour calculer la progression
     */
    setThumbPosition(percent) {
        this.percentPosition = percent;
        this.rangeSlider.ariaValueNow = `${Math.ceil(this.percentPosition)}%`;
        this.thumbButton.style.left = `calc(${this.percentPosition}% - ${this.thumbSize / 2}px)`;
        this.progressDone.style.width = `calc(${this.percentPosition}% + ${this.thumbSize / 2}px)`;
        
    }

    hideControlsTouchScreen(shouldClearTimeout = true){
        if(shouldClearTimeout)
            clearTimeout(this.videoPlayer.idTimeoutControls);

        if(this.videoPlayer.isTouchScreen()){
            this.videoPlayer.startTimeoutCloseControlsTouchScreen();
        }
    }
    
    /**
     * @param {number} percent
     * Est appelé par le vidéo player (timeUpdate) pour calculer la progression du buffer
    */
   setBufferedLength(percent){
       this.bufferedProgression.style.width = `${Math.ceil(percent)}%`;
    }

    /**
     * @private
     * @param {Event|TouchEvent} e 
     */
    calculateAndSetPercentPosition(e) {
        let xPosition = this.videoPlayer.isTouchScreen() ? e.changedTouches[0].clientX : e.clientX;

        let relativePositionOnSlider = xPosition - this.rangeSlider.querySelector(".custom_range_slider").getBoundingClientRect().left;
        this.percentPosition = (relativePositionOnSlider / this.rangeSlider.querySelector(".custom_range_slider").getBoundingClientRect().width) * 100;

        if (this.percentPosition < 0) {
            this.percentPosition = 0;
        }
        else if (this.percentPosition > 100) {
            this.percentPosition = 100;
        }

        this.setThumbPosition(this.percentPosition);
        
        this.progressDone.style.width = `${this.percentPosition}%`;
        //ce qui est passé en paramètre est le currentTime
        this.videoPlayer.setVideoCurrentTime(this.videoPlayer.getDuration() * (this.percentPosition/100));
    }

    /**
     * @private
     * @param {Event} e 
     */
    windowMove(e) {
        if (!this.isPointerDown) {
            return;
        }

        this.hideControlsTouchScreen();

        if(this.videoPlayer.isVideoOver){
            this.videoPlayer.restartVideo();
        }
        this.calculateAndSetPercentPosition(e);
    }

    /**@private */
    windowUp() {
        this.isPointerDown = false;

        if(this.percentPosition == 100){
            this.videoPlayer.stop();
        }
        else if(!this.wasPaused){
            this.videoPlayer.resume(false);
        }

        this.hideControlsTouchScreen(false);

        window.removeEventListener("mousemove", this.eventPointerMove);
        window.removeEventListener("mouseup", this.eventPointerUp);
        window.removeEventListener("touchmove", this.eventPointerMove);
        window.removeEventListener("touchend", this.eventPointerUp);
    }
}