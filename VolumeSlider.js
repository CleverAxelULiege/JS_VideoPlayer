import { VideoPlayer } from "./VideoPlayer.js";

export class VolumeSlider {

    /**@private */
    percentPosition = 0;
    
    /**
     * @param {HTMLDivElement} rangeSlider 
     * @param {VideoPlayer} videoPlayer
     * @param {number} volume  
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
        // this.thumbSize = this.thumbButton.getBoundingClientRect().width;
        this.thumbSize = 10;
        this.thumbButton.style.left = `calc(${this.percentPosition}% - ${this.thumbSize / 2}px)`;

        /**@type {HTMLDivElement} */
        this.progressDone = rangeSlider.querySelector(".done");

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
                <button class="thumb"></button>
            </div>
        `;
    }

    /**@private */
    initEventListeners() {
        this.rangeSlider.querySelector(".custom_range_slider").addEventListener("mousedown", (e) => {
            this.isPointerDown = true;
            this.calculateAndSetPercentPosition(e);
            window.addEventListener("mousemove", this.eventPointerMove);
            window.addEventListener("mouseup", this.eventPointerUp);
        });
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
        this.videoPlayer.setVolume(this.percentPosition / 100);
    }
    

    /**
     * @private
     * @param {Event} e 
     */
    calculateAndSetPercentPosition(e) {
        let relativePositionOnSlider = e.clientX - this.rangeSlider.querySelector(".custom_range_slider").getBoundingClientRect().left;
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
        // this.videoPlayer.setVideoCurrentTime(this.videoPlayer.getVideoDuration() * (this.percentPosition/100));
    }

    /**
     * @private
     * @param {Event} e 
     */
    windowMove(e) {
        if (!this.isPointerDown) {
            return;
        }

        this.calculateAndSetPercentPosition(e);
    }

    /**@private */
    windowUp() {
        this.isPointerDown = false;


        window.removeEventListener("mousemove", this.eventPointerMove);
        window.removeEventListener("mouseup", this.eventPointerUp);
        // console.log(this.percentPosition);
    }
}