import { RangeSlider } from "./RangeSlider.js";
import { VideoPlayer } from "./VideoPlayer.js";

const VIDEO = document.querySelector("video");
const VIDEO_DURATION = VIDEO.duration;

let videoPlayer = new VideoPlayer(document.querySelector(".video_player"));

// console.log(VIDEO.buffered);
// console.log(VIDEO.buffered.end(0)); //will failed if video.buffered.length == 0

// let range_slider = new RangeSlider(document.querySelector(".my_range_slider"))
// VIDEO.addEventListener("timeupdate", () => {
//     // console.log(VIDEO.buffered.end(0)); // USE
//     if(range_slider.isPointerDown){
//         return;
//     }

//     // console.log((VIDEO.currentTime / VIDEO_DURATION) * 100)
//     range_slider.setThumbPosition((VIDEO.currentTime / VIDEO_DURATION) * 100)
//     //fired while video is playing continously
// });



