export class RangeSlider{

    isPointerDown = false;

    /**@private */
    percentPosition = 0;

    /**
     * @param {HTMLDivElement} rangeSlider 
     */
    constructor(rangeSlider){
        /**@type {HTMLDivElement} */
        this.rangeSlider = rangeSlider;

        this.buildRangeSlider();

        /**@type {HTMLButtonElement} */
        this.thumb = rangeSlider.querySelector(".thumb");
        this.thumbSize = this.thumb.getBoundingClientRect().width;

        this.eventPointerMove = this.windowMove.bind(this);
        this.eventPointerUp = this.windowUp.bind(this);

        this.initEventListeners();
    }

    /**@private */
    buildRangeSlider(){
        this.rangeSlider.innerHTML = 
        `
        <div class="custom_range_slider_container" style="padding-right: ${this.thumbSize/2}px;">
            <div class="range_slider" style="padding-left: ${this.thumbSize/2}px;">
                <div class="rail" style="width: calc(100% + ${this.thumbSize/2}px);"></div>
                <button class="thumb"></button>
            </div>
        </div>
        `;
    }

    /**@private */
    initEventListeners(){
        this.rangeSlider.querySelector(".range_slider").addEventListener("mousedown", (e) => {
            this.isPointerDown = true;
            this.calculateAndSetPercentPosition(e);
            window.addEventListener("mousemove", this.eventPointerMove);
            window.addEventListener("mouseup", this.eventPointerUp);
        });
    }

    setThumbPosition(percent){
        this.percentPosition = percent;
        this.rangeSlider.querySelector(".thumb").style.left = this.percentPosition + "%";
    }

    /**
     * @private
     * @param {Event} e 
     */
    calculateAndSetPercentPosition(e){
        let relativePositionOnSlider = e.clientX - this.thumbSize/2 - this.rangeSlider.querySelector(".range_slider").getBoundingClientRect().left;
        this.percentPosition = (relativePositionOnSlider / this.rangeSlider.querySelector(".range_slider").getBoundingClientRect().width) * 100;
    
        if(this.percentPosition < 0){
            this.percentPosition = 0;
        }
        else if(this.percentPosition > 100){
            this.percentPosition = 100;
        }

        this.thumb.style.left = this.percentPosition + "%";
    }

    /**
     * @private
     * @param {Event} e 
     */
    windowMove(e){
        if(!this.isPointerDown){
            return;
        }

        this.calculateAndSetPercentPosition(e);
    }

    /**@private */
    windowUp(){
        this.isPointerDown = false;
        window.removeEventListener("mousemove", this.eventPointerMove);
        window.removeEventListener("mouseup", this.eventPointerUp);
        console.log(this.percentPosition);
    }
}