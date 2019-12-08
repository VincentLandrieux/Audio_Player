
/*Variables*/
//audio
var audio;

var contexteAudio;
var analyseur;
var audioDataSize = 256;

var source;

var tailleMemoireTampon;
var tableauDonnees;

//lecteur
var lecteurClip;
var coverLecteurClip;
var lecteur;
var lecteurReduce = true;

var iPlaylist = 0;
var playlist = [["Silent Poets","Asylums for the feeling - feat - leila adu","Down","down.png","asylums-for-the-feeling.ogg"],
                ["Low Roar","Dont Be so Serious","Once in a Long, Long While...","oiallw.png","dont-be-so-serious.ogg"],
                ["Low Roar","I'll Keep Coming","0","0.png","ill-keep-coming.ogg"]];

var plays;

var playlistContainer;
//carousel
var carousel;
var carouselContainer;
var carouselItems;
var transitionSpeed;

var carouselWidth;
var carouselContainerWidth;
var carouselStart;
var carouselEnd;

var mouseMove = false;
var mouseClickX;

//slider
var timeLine;
var volumeLine;

//canvas
var canvas;
var ctx;

var cLong;
var cHaut;
var centerX;
var centerY;

var cFps = 24; //data update/second

var particles = [];
var pWidthStart = 1.5; //particle width percent of distance/2
var pHeightStart = 1; //particle height percent of distance/2 !!!
var pGapStart = 2; //particle gap percent of distance
var pWidth;
var pHeight;
var pGap;
var pReduce = 0.94 //particle reduction size/data update
var pLive = 25; //particle live data update time
var pAudioColorStart = "255,64,0";
var pAudioColorEnd = "255,0,0";

var pDeathWidth = 100; //particle death width circle !!!??

var pOpacity = 0.5; //start particle opacity

var nbTransmitter; //number of transmitter line
var dist;
var nbParticle;

var transmitter = [];

//Init
window.onload=function(){
    //audio
    audio = document.querySelector("audio");

    contexteAudio = new (window.AudioContext || window.webkitAudioContext)();
    analyseur = contexteAudio.createAnalyser();

    source = contexteAudio.createMediaElementSource(audio);
    source.connect(analyseur);
    analyseur.connect(contexteAudio.destination);

    //analyseur.fftSize = 2048;
    analyseur.fftSize = audioDataSize;
    tailleMemoireTampon = analyseur.frequencyBinCount;
    tableauDonnees = new Uint8Array(tailleMemoireTampon);


    //lecteur
    lecteurClip = document.querySelector(".lecteur-clip");
    coverLecteurClip = document.querySelector(".lecteur-clip>.cover");

    lecteur = document.querySelector('.lecteur');

    plays = document.querySelectorAll('.play');
    playlistContainer = document.querySelector('.top .carousel-container');

    timeLine = document.querySelector('.timeline');
    volumeLine = document.querySelector('.volumeline');

    createCoverPlaylist();

    initAudio();

    //carousel
    carousel = document.querySelector('.carousel');
    carouselContainer = document.querySelector('.top .carousel-container');
    carouselItems = carouselContainer.querySelectorAll('.carousel-item');
    transitionSpeed = getComputedStyle(carouselContainer).transition;

    //canvas
    canvas = document.querySelector("canvas");
    ctx = canvas.getContext("2d");

    nbTransmitter = tableauDonnees.length;

    initCanvas();

    draw();

    // window.addEventListener('mousemove', function moveMouse(e){
    //     contexteAudio.resume();
    //
    //     //window.removeEventListener('mousemove', moveMouse);
    // });


    /*Events*/
    coverLecteurClip.onclick = function(){
        lecteur.classList.toggle('hide');
    };

    plays.forEach(function(item){
        item.onclick = function(){
            contexteAudio.resume();
            if (audio.paused) {
                audio.play();
                plays.forEach(function(play){
                    play.style.backgroundImage = "url('img/pause.png')";
                });
            } else {
                audio.pause();
                plays.forEach(function(play){
                    play.style.backgroundImage = "url('img/play.png')";
                });
            }
        };
    });

    timeLine.addEventListener('mousedown', function(e){
        timeLineDrag(e);
        window.addEventListener('mousemove', timeLineDrag);
    });
    window.addEventListener('mouseup', function(){
        window.removeEventListener('mousemove', timeLineDrag);
    });

    volumeLine.addEventListener('mousedown', function(e){
        volumeLineDrag(e);
        window.addEventListener('mousemove', volumeLineDrag);
    });
    window.addEventListener('mouseup', function(){
        window.removeEventListener('mousemove', volumeLineDrag);
    });


    // window.addEventListener("mousemove", function(e){
    //     mouseX = parseInt((e.offsetX * 800) / window.clientWidth);
    //     mouseY = parseInt((e.offsetY * 450) / window.clientHeight);
    // });


    carousel.addEventListener('mousedown', function(e){
        mouseClickX = e.clientX - parseInt(getComputedStyle(carouselContainer).left,10);
        window.addEventListener('mousemove', carouselDrag);
        carouselContainer.style.transition =  "left 0s";
    });

    window.addEventListener('mouseup', function(){
        carouselContainer.style.transition =  transitionSpeed;
        window.removeEventListener('mousemove', carouselDrag);
        mouseMove = false;
    });

    carouselItems.forEach(function(item,index){
        item.addEventListener('mouseup',function(){
            if(!mouseMove){
                carouselItemClick(item, index);
            }
        });
    });

    window.addEventListener('resize',function(){
            playlistContainer.style.left = 0;
            //carousel
            carouselWidth = parseInt(getComputedStyle(carousel).width,10);
            carouselContainerWidth = parseInt(getComputedStyle(carouselContainer).width,10);
            carouselStart = -(carouselItems[0].getBoundingClientRect().x + carouselItems[0].getBoundingClientRect().width/2 - carouselContainer.getBoundingClientRect().x);
            carouselStart += carouselWidth/2;
            carouselEnd = -(carouselItems[carouselItems.length-1].getBoundingClientRect().x + carouselItems[carouselItems.length-1].getBoundingClientRect().width/2 - carouselContainer.getBoundingClientRect().x);
            carouselEnd += carouselWidth/2;

            initCanvas();
        }
    );


    /*-Intervals-*/
    window.setInterval(function(){
        //update audio data
        analyseur.getByteTimeDomainData(tableauDonnees);
        //analyseur.getByteFrequencyData(tableauDonnees);

        //Update Particles Data
        var i = 0;
        while(i < particles.length){
            if(particles[i][6] > pLive){
                //Delete Particle
                particles.splice(i, 1);
            }else{
                //Live count
                particles[i][6]++;
                //position
                particles[i][0] += particles[i][3];
                particles[i][1] += particles[i][4];
                //size
                particles[i][5] *= pReduce;
                //gap
                particles[i][3] *= pReduce;
                particles[i][4] *= pReduce;
                //color
                // if(particles[i][2] < 1){
                //     particles[i][2] += 0.01;
                // }else{
                //     particles[i][2] = 0;
                // }

                i++;
            }
        }

        //Create new particles
        if(particles.length < 5000 && !audio.paused){
            for(var i = 0; i < transmitter.length; i++){
                createParticuleCenter(transmitter[i][0], transmitter[i][1], tableauDonnees[i]);
            }
        }

        console.log(particles.length);

    }, 1000/cFps);
}

/*Functions*/
function carouselDrag(e){
    var delta = e.clientX-mouseClickX;
    mouseMove = true;

    carouselMove(delta);
}
function carouselMove(left){
    if(left <= carouselStart){
        if(left > carouselEnd){
            carouselContainer.style.left = left+'px';
        }else{
            carouselContainer.style.left = carouselEnd+'px';
        }
    }else{
        carouselContainer.style.left = carouselStart;
    }
}

function carouselItemClick(item, index){
    //Add click Item actions
    if(!lecteurReduce){
        iPlaylist = item.dataset.iAudio;
        initAudio();
    }

}
//slider
function setTimeLineValue(percent){
    let progress = timeLine.querySelector('.progress');
    if(percent < 0){
        percent = 0;
    }else if(percent > 100){
        percent = 100;
    }
    progress.style.width = percent + '%';
}
function timeLineDrag(e){
    let fraction = (e.clientX-timeLine.getBoundingClientRect().x) / timeLine.clientWidth;
    let percent  = Math.round(fraction * 1000)/10;

    audio.currentTime = fraction * audio.duration;
    setTimeLineValue(percent);
}
function setVolumeLineValue(percent){
    let progress = volumeLine.querySelector('.progress');
    if(percent < 0){
        percent = 0;
        document.querySelector('.volume-clip .volume').style.backgroundImage = "url('img/mute.png')";
    }else if(percent > 100){
        percent = 100;
    }else{
        document.querySelector('.volume-clip .volume').style.backgroundImage = "url('img/volume.png')";
    }
    audio.volume = percent/100;
    progress.style.height = percent + '%';
}
function volumeLineDrag(e){
    let fraction = (e.clientY-volumeLine.getBoundingClientRect().y) / volumeLine.clientHeight;
    let percent  = Math.round(fraction * 1000)/10;

    setVolumeLineValue(100-percent);
}


function createCoverPlaylist(){
    playlist.forEach(function(item, index){
        var cover = document.createElement("div");
        cover.classList.add("cover");
        cover.classList.add("carousel-item");
        if(index != iPlaylist){
            cover.classList.add('hide');
        }
        cover.dataset.iAudio = index;

        var img = document.createElement("div");
        img.classList.add("img");
        img.style.backgroundImage = "url('img/cover/"+item[3]+"')";

        var title = document.createElement("p");
        title.classList.add("hide");
        title.appendChild(document.createTextNode(item[1]));
        var artist = document.createElement("p");
        artist.classList.add("hide");
        artist.appendChild(document.createTextNode(item[0]));

        cover.appendChild(img);
        cover.appendChild(title);
        cover.appendChild(artist);

        // cover.addEventListener('dblclick',function(){
        //     if(!lecteurReduce){
        //         iPlaylist = this.dataset.iAudio;
        //         initAudio();
        //     }
        // });

        playlistContainer.appendChild(cover);
    });
}

function sizeLecteur(){
    lecteurReduce = (lecteurReduce) ? false : true;

    lecteurClip.classList.toggle('hide');
    lecteur.classList.toggle('max');
    lecteur.classList.toggle('min');

    //toggle hide
    var playlistCovers = playlistContainer.querySelectorAll(".cover");

    playlistCovers.forEach(function(item, index){
        if(index != iPlaylist){
            item.classList.toggle('hide');
        }
    });

    //toggle titles (Optionnal)
    let titles = document.querySelectorAll(".playlist .cover p");
    titles.forEach(function(item){
        item.classList.toggle('hide');
    });

    //carousel
    carouselWidth = parseInt(getComputedStyle(carousel).width,10);
    carouselContainerWidth = parseInt(getComputedStyle(carouselContainer).width,10);
    carouselStart = -(carouselItems[0].getBoundingClientRect().x + carouselItems[0].getBoundingClientRect().width/2 - carouselContainer.getBoundingClientRect().x);
    carouselStart += carouselWidth/2;
    carouselEnd = -(carouselItems[carouselItems.length-1].getBoundingClientRect().x + carouselItems[carouselItems.length-1].getBoundingClientRect().width/2 - carouselContainer.getBoundingClientRect().x);
    carouselEnd += carouselWidth/2;

    if(!lecteurReduce){
        var x = playlistCovers[iPlaylist].getBoundingClientRect().x + playlistCovers[iPlaylist].getBoundingClientRect().width/2 - carouselContainer.getBoundingClientRect().x;
        carouselMove(-x+(carousel.getBoundingClientRect().width/2));
    }
}
function toggleVolume(){
    var volumeClip = document.querySelector(".volume-clip");

    volumeClip.classList.toggle("volume-clip_open");
}

function updateTimeline() {
    var fraction = audio.currentTime / audio.duration;
    var percent  = Math.ceil(fraction * 100);

    setTimeLineValue(percent)

    if(audio.currentTime == audio.duration){
        next();
        audio.play();
    }
}

function initAudio(){
    var progress = document.querySelector('.progress');
    let play = !audio.paused;
    var playlistCovers = playlistContainer.querySelectorAll(".cover");

    //sons
    audio.src = "audio/"+playlist[iPlaylist][4];

    //timeLine
    if (play) {
        audio.play();
    }
    progress.style.width = 0 + '%';

    //images
    if(lecteurReduce){
        playlistCovers.forEach(function(item, index){
            if(index != iPlaylist){
                item.classList.add('hide');
            }
        });
    }

    playlistCovers[iPlaylist].classList.remove('hide');

    coverLecteurClip.style.backgroundImage = "url('img/cover/"+playlist[iPlaylist][3]+"')";

    //textes


    //carousel
    if(!lecteurReduce){
        var x = playlistCovers[iPlaylist].getBoundingClientRect().x + playlistCovers[iPlaylist].getBoundingClientRect().width/2 - carouselContainer.getBoundingClientRect().x;
        carouselMove(-x+(carousel.getBoundingClientRect().width/2));
    }
}

function prev(){
    if(iPlaylist > 0){
        iPlaylist--;
    }else{
        iPlaylist = playlist.length-1;
    }
    initAudio();
}
function next(){
    if(iPlaylist < playlist.length-1){
        iPlaylist++;
    }else{
        iPlaylist = 0;
    }
    initAudio();
}


//canvas
function distanceCenter(x,y){
    return Math.sqrt(Math.pow(Math.abs(centerX - x),2) + Math.pow(Math.abs(centerY - y),2));
}

function createTransmitter(){
    transmitter.splice(0, transmitter.length);
    var step = (2*Math.PI)/nbTransmitter;
    var rot = Math.PI/2;

    var x;
    var y;

    for(var i = 0; i < nbTransmitter; i++){
        x = Math.cos(rot)*dist;
        y = Math.sin(rot)*dist;
        transmitter.push([x, y]);
        rot += step;
    }
}

function createParticuleCenter(x , y, opacity){
    opacity /= 255;

    particles.push([centerX+x, centerY+y, opacity, -x/nbParticle, -y/nbParticle, pWidth, 0]);
}

function initCanvas(){
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    cLong = canvas.width;
    cHaut = canvas.height;
    centerX = canvas.width/2;
    centerY = canvas.height/2;

    dist = (cLong > cHaut) ? cLong/2 : cHaut/2;

    pWidth = (pWidthStart*dist)/100;
    pHeight = (pHeightStart*dist)/100;//!!!!!
    pGap = (pGapStart*dist)/100;

    nbParticle = dist / (pWidth*2+pGap);
    //!!!!!
    // pLive = (nbParticle / 100)*80;
    //!!!!!

    particles.splice(0, particles.length);
    createTransmitter();
}

function draw(){
    requestAnimationFrame(draw);

    //Draw
    ctx.clearRect(0,0,cLong,cHaut);

    ctx.fillStyle = 'red';//!!!!!
    for(var i = 0; i < particles.length; i++){
        //ctx.fillStyle = 'rgba(255,0,0,'+particles[i][2]+')';
        //ctx.fillStyle = `rgba(0,0,255,${(0.5-particles[i][2])})`;
        var color = "";
        var opacity = particles[i][2];
        if(opacity > 0.5){
            color = pAudioColorEnd;
            opacity = (opacity-0.5)*2;
        }else{
            color = pAudioColorStart;
            opacity = (0.5-opacity)*2;
        }
        if(opacity < 0.02){
            opacity = 0.02;
        }
        ctx.fillStyle = 'rgba('+color+','+opacity+')';

        //ctx.fillRect(particles[i][0] - pWidth, particles[i][1] - pHeight, pWidth*2, pHeight*2);

        ctx.beginPath();
        ctx.arc(particles[i][0], particles[i][1], particles[i][5], 0, 2*Math.PI);
        ctx.fill();
    }
}



// function formatTime(time) {
//     var hours = Math.floor(time / 3600);
//     var mins  = Math.floor((time % 3600) / 60);
//     var secs  = Math.floor(time % 60);
//
//     if (secs < 10) {
//         secs = "0" + secs;
//     }
//
//     if (hours) {
//         if (mins < 10) {
//             mins = "0" + mins;
//         }
//
//         return hours + ":" + mins + ":" + secs; // hh:mm:ss
//     } else {
//         return mins + ":" + secs; // mm:ss
//     }
// }

// document.querySelector('#progressTime').textContent = formatTime(time);

// <div id="progressBarControl">
//     <div id="progressBar">Pas de lecture</div>
// </div>
// <span id="progressTime">00:00</span>
