const app = {};
const SCENE_RESOLUTION = 0; // if 0 - auto
const VERSION = '6.0';
//app.baseURL = '//shottracker.stacqan.com:8000';
app.baseURL = '//hype.shottracker.com/3d/api';

const [
    { ScreenService },
    { SegmentService },
    { LocalStorageService },
    { ShotService },
    { SceneService },
    { CacheService },
    { DataService },
    { ColorService },
    { ExternalService }
] = await Promise.all([
    import(`./services/screen.js?v=${VERSION}`),
    import(`./services/segment.js?v=${VERSION}`),
    import(`./services/local_storage.js?v=${VERSION}`),
    import(`./services/shot.js?v=${VERSION}`),
    import(`./services/scene.js?v=${VERSION}`),
    import(`./services/cache.js?v=${VERSION}`),
    import(`./services/data.js?v=${VERSION}`),
    import(`./services/color.js?v=${VERSION}`),
    import(`./services/external.js?v=${VERSION}`),
]);

// Retrieve data from LocalStorage

const urlParams = new URLSearchParams(window.location.search);

app.IS_CHROMAKEY = urlParams.has('IS_CHROMAKEY');
app.IS_DEV = urlParams.has('IS_DEV');
app.IS_TEST = urlParams.has('IS_TEST');
app.DOWNLOAD = urlParams.has('DOWNLOAD');
app.SAVED_SCENE = urlParams.has('scene');
app.STATIC = urlParams.has('static');
app.IS_PREVIEW = urlParams.has('preview');
app.IS_EXTERNAL = urlParams.has('userTeamId');
if(urlParams.has('quality')){
    if(urlParams.get('quality') == 'high'){
        app.BITS = 10000000;
    } else if(urlParams.get('quality') == 'low'){    
        app.BITS = 2500000;
    }
    else app.BITS = 5000000;

}
if(!urlParams.has('quality')){
    app.BITS = urlParams.has('bits') ? parseInt(urlParams.get('bits')) : 5000000;
}

if (app.IS_TEST) {
    app.IS_CHROMAKEY = true;
}
console.log("BITS:", app.BITS);

if(app.SAVED_SCENE || app.IS_PREVIEW){
    const sceneBase64 = urlParams.get('scene');
    if (sceneBase64) {
        try {
            const decodedString = atob(sceneBase64);
            window.localStorage.setItem('air', decodedString);
            console.log('Data successfully loaded from URL');
            } catch (error) {
            console.error('Error decoding or parsing:', error);
        }
    }
}

let previousStaticData = null;
function fetchDataAndUpdateLocalStorage(id) {
    const url = `${app.baseURL}/v2/hype/public/graphics/render/static?id=${id}`;
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            const jsonString = JSON.stringify(data);
            if (jsonString !== previousStaticData) {
                previousStaticData = jsonString;
                window.localStorage.setItem('air', jsonString);
                console.log('Data updated and saved to local storage');
                showLoadingScreen("Updating scene...");
                updateAllServices(); 
                hideLoadingScreenAfterDelay(500);
                if (!app.IS_PREVIEW) {
                    app.scene.beginAnimation(app.camera, 0, 600, true);
                }
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}



if(app.STATIC){
    const staticKey = urlParams.get('static');
    fetchDataAndUpdateLocalStorage(staticKey);
    if (staticKey) {
        setInterval(() => fetchDataAndUpdateLocalStorage(staticKey), 2000);
    }
}

if(app.IS_EXTERNAL){
    app.externalService.initializeFromParams();
}



app.runtime = {
    shots: [],
    loaded: false,
    currentShotIndex: 0
};

// Generate the Babylon.js engine
app.canvas = document.getElementById('renderCanvas');
app.engine = new BABYLON.Engine(app.canvas, true);
if (SCENE_RESOLUTION){
    let viewportWidth = window.innerWidth;
    let sceneRatio = viewportWidth / SCENE_RESOLUTION;
    app.engine.setHardwareScalingLevel(sceneRatio);
}
app.scene = new BABYLON.Scene(app.engine);


//Enabling the cache
if (!app.IS_DEV) {
    BABYLON.Database.IDBStorageEnabled = true;
    app.engine.enableOfflineSupport = true;
}

app.screenService = new ScreenService(app);
app.segmentService = new SegmentService(app);
app.shotService = new ShotService(app);
app.cacheService = new CacheService(app);
app.sceneService = new SceneService(app);
app.dataService = new DataService(app);
app.colorService = new ColorService(app);
app.localStorageService = new LocalStorageService(app);
app.externalService = new ExternalService(app);

if (!app.STATIC && !app.IS_EXTERNAL) {
    app.extractedData = app.localStorageService.extractDataFromLocalStorage();
}

app.colorService.updateColors();

window.addEventListener("keydown", function (event) {
    if (event.key === 'e') {
        let base64String = btoa(localStorage.getItem('air'));
        let urlWithoutParams = `${window.location.protocol}//${window.location.hostname}${window.location.port ? `:${window.location.port}` : ''}${window.location.pathname}`;
        let urlFull = urlWithoutParams + '?scene=' + base64String;
        prompt("Export url", urlFull);
        if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(urlFull);
        }
        console.log(urlFull);
    }
});

const logCameraParameters = function (camera) {
    console.log("Camera Position:", app.camera.position);
    console.log("Camera Alpha:", app.camera.alpha);
    console.log("Camera Beta:", app.camera.beta);
    console.log("Camera Radius:", app.camera.radius);
    console.log("Camera Target:", app.camera.target);
};

// Register a render loop to repeatedly render the scene
app.startLoop = () => {
    app.engine.runRenderLoop(function () {
        app.shotService.process();
        app.segmentService.process();

        app.scene.render();

        if (app.IS_TEST) {
            const fpsLabel = document.getElementById("fpsLabel");
            fpsLabel.innerHTML = app.engine.getFps().toFixed() + " fps";
        }
        //logCameraParameters(scene.activeCamera);
    });
}

// Watch for browser/canvas resize events
window.addEventListener("resize", function () {
    app.engine.resize();
});



var loadingScreen = document.getElementById("loadingScreen");
function updateAllServices() {
    try {
        app.extractedData = app.localStorageService.extractDataFromLocalStorage();
        app.dataService.loadStats();
        app.screenService.updateScreens();
        app.colorService.updateColors();
        app.sceneService.applyColors();
        app.shotService.updateMarkers();
        console.log("Scene updated");
        
    } catch (error) {
        console.error("Error executing one of the functions:", error);
    }
}

function showLoadingScreen(text) {
    loadingScreen.textContent = text;
    loadingScreen.style.display = "flex";
}

function hideLoadingScreen() {
    loadingScreen.style.display = "none";
}

function hideLoadingScreenAfterDelay(delay) {
    setTimeout(hideLoadingScreen, delay);
}

window.addEventListener("storage", function (event) {
    if (event.key === "air" && !app.SAVED_SCENE) {
        console.log("loacalStorage changed");
        showLoadingScreen("Updating scene...");
        updateAllServices(); 
        hideLoadingScreenAfterDelay(500);
    }
});

if (app.IS_DEV) {
    window.app = app;
    app.scene.debugLayer.show({
        embedMode: true // Embeds statistics into the render window
    });
}

app.checkIfLoaded = () => {
    if (!app.runtime.loaded) {
        throw "Scene has not been loaded yet";
    }
}

function isMacUser() {
    if (navigator.userAgentData && navigator.userAgentData.platform) {
        return navigator.userAgentData.platform.toLowerCase().includes('mac');
    }
    // Фоллбэк для браузеров, которые не поддерживают userAgentData
    return navigator.userAgent.toLowerCase().includes('mac');
}

// Function to automatically download the video
function downloadVideo(blob, fileName) {
    if (blob && blob instanceof Blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } else {
        console.error("The recorded video is not a valid Blob object.");
    }
}

// Function to start recording and play animation
function startRecording() {
    showLoadingScreen("Recording starts...");
    hideLoadingScreenAfterDelay(2000);
    if (typeof MediaRecorder === "undefined") {
        console.error("MediaRecorder is not supported in this browser.");
        return;
    }
    console.log("Recording started at", new Date().toLocaleTimeString());
    const stream = app.canvas.captureStream(30); // Capture at 30fps
    let mimeType = "video/mp4;codecs=opus";
    if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "video/mp4;codecs=vp9";
    }
    if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "video/mp4;codecs:vp8";
    }
    if (isMacUser()) {
        mimeType = "video/mp4;codecs=avc1";
    }
    if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "video/mp4";
    }
    if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "video/webm;codecs=opus";
    }
    if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "video/webm";
    }
    const options = {
        videoBitsPerSecond: app.BITS,
        mimeType: mimeType,
    };
    console.log("Using mimeType:", mimeType);
    console.log("Using videoBitsPerSecond:", app.BITS);
    const videoRecorder = new MediaRecorder(stream, options);
    const recordedChunks = [];

    videoRecorder.ondataavailable = function(event) {
        if (event.data.size > 0) {
        recordedChunks.push(event.data);
        }
    };

    videoRecorder.onstop = function() {
        if(MediaRecorder.isTypeSupported("video/mp4")){
            const videoBlob = new Blob(recordedChunks, { type: 'video/mp4' });
            downloadVideo(videoBlob, "animation-recording.mp4");
        } else {
            const videoBlob = new Blob(recordedChunks, { type: 'video/webm' });
            downloadVideo(videoBlob, "animation-recording.webm");
        }
        showLoadingScreen("Video recording is complete. The file will now start downloading.");     
        console.log("Recording stopped at", new Date().toLocaleTimeString());
    };

    videoRecorder.start();
    app.scene.beginAnimation(app.camera, 0, 600, false, 1, () => {
        videoRecorder.stop();
    });
}

window.addEventListener("keydown", function (event) {
    if (event.key === 'r') {
        startRecording();
    }
    if (event.key === 's') {
        app.scene.beginAnimation(app.camera, 0, 600, true);
    }
    // Optionally log camera parameters on key press (e.g., 'p' for print)
    if (event.key === 'p') {
        logCameraParameters(app.scene.activeCamera);
    }

});

app.sceneService.setUpScene();

app.scene.executeWhenReady(() => {
    if (app.DOWNLOAD) {
        startRecording();
    }
});

window.app = app;