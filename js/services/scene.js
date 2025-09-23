import {
    BaseService
} from "./base.js";
import { getCameraConfigAuto } from "../config/camera/index.js";

export class SceneService extends BaseService {
    async setUpScene() {

        BABYLON.ScenePerformancePriority.Aggressive = 2;
        // Create and position a free camera using config
        const cameraConfig = await getCameraConfigAuto(this.app.deviceService);
        const config = cameraConfig.initial;
        this.app.camera = new BABYLON.ArcRotateCamera(
            config.name, 
            config.alpha, 
            config.beta, 
            config.radius, 
            new BABYLON.Vector3(config.target.x, config.target.y, config.target.z), 
            this.app.scene
        );
        this.app.camera.minZ = config.minZ;
        this.app.camera.maxZ = config.maxZ;

        if (this.app.IS_DEV) {
            const devConfig = cameraConfig.dev;
            this.app.camera.setPosition(new BABYLON.Vector3(devConfig.position.x, devConfig.position.y, devConfig.position.z));
            this.app.camera.setTarget(new BABYLON.Vector3(devConfig.target.x, devConfig.target.y, devConfig.target.z));
            this.app.camera.attachControl(this.app.canvas, true);
        }
        if (this.app.IS_PREVIEW) {
            const previewConfig = cameraConfig.preview;
            this.app.camera.setPosition(new BABYLON.Vector3(previewConfig.position.x, previewConfig.position.y, previewConfig.position.z));
            this.app.camera.setTarget(new BABYLON.Vector3(previewConfig.target.x, previewConfig.target.y, previewConfig.target.z));
        }

        // Применяем настройки камеры в зависимости от ориентации (если DeviceService доступен)
        if (this.app.deviceService && !this.app.IS_DEV && !this.app.IS_PREVIEW) {
            this.applyCameraOrientationConfig();
        }

        // Устанавливаем поле зрения камеры из конфигурации
        if (config.fov !== undefined) {
            this.app.camera.fov = BABYLON.Tools.ToRadians(config.fov);
        } else {
            // Фоллбэк на значение по умолчанию
            this.app.camera.fov = BABYLON.Tools.ToRadians(45);
        }

        // Create a basic light, aiming 0, 1, 0 - meaning, to the sky
        const light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), this.app.scene);
        light.intensity = 1;
        //const light2 = new BABYLON.SpotLight( "spotlight_1", new BABYLON.Vector3(0, 30, 0),  new BABYLON.Vector3(0, -1, 0.3), Math.PI, 1, scene );
        //light2.intensity = 2000;

        const markersRoot = new BABYLON.TransformNode("markersRoot", this.app.scene);
        const segmentsRoot = new BABYLON.TransformNode("segmentsRoot", this.app.scene);

        // Load the GLTF model
        BABYLON.SceneLoader.Append("./", "scene.glb" + (this.app.IS_DEV ? "?time=" + (new Date()).getTime() : ""), this.app.scene,
            async () => {
                this.app.runtime.loaded = true;

                if (!this.app.IS_DEV) {
                    // Do something with the scene after loading
                    // Получаем конфиг анимации в зависимости от ориентации
                    const currentCameraConfig = await getCameraConfigAuto(this.app.deviceService);
                    const animConfig = currentCameraConfig.animation;
                    
                    // Create position animation
                    const animation = new BABYLON.Animation(
                        "cameraAnimation", 
                        "position", 
                        animConfig.fps,
                        BABYLON.Animation.ANIMATIONTYPE_VECTOR3, 
                        BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
                    );

                    // Animation keys from config
                    const keys = animConfig.positionKeys.map(key => ({
                        frame: key.frame,
                        value: new BABYLON.Vector3(key.position.x, key.position.y, key.position.z)
                    }));

                    animation.setKeys(keys);

                    // Attach the animation to the camera
                    this.app.camera.animations.push(animation);

                    // Create an animation for the camera's target
                    const targetAnimation = new BABYLON.Animation(
                        "cameraTargetAnimation", 
                        "target", 
                        animConfig.fps,
                        BABYLON.Animation.ANIMATIONTYPE_VECTOR3, 
                        BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
                    );

                    // Target animation keys from config
                    const targetKeys = animConfig.targetKeys.map(key => ({
                        frame: key.frame,
                        value: new BABYLON.Vector3(key.target.x, key.target.y, key.target.z)
                    }));

                    targetAnimation.setKeys(targetKeys);

                    // Attach the animation to the camera
                    this.app.camera.animations.push(targetAnimation);

                    // Run the animation
                    if (!this.app.IS_PREVIEW) {
                        this.app.scene.beginAnimation(
                            this.app.camera, 
                            animConfig.fromFrame, 
                            animConfig.toFrame, 
                            true
                        );
                    }
                }

                this.app.scene.getMeshByName('ball1').setEnabled(false);
                this.app.scene.getMeshByName('ball2').setEnabled(false);
                if(this.app.extractedData && this.app.extractedData.userLevel == 'A'){
                    this.app.scene.getMeshByName('logo_shottracker').setEnabled(false);
                }
                this.app.scene.getMeshById("screen_count").setEnabled(false);

                for (let i = 1; i <= 14; i++) {
                    this.app.scene.getMeshByName('segment_' + i).setEnabled(false);
                }

                /*
                ((this.app.IS_DEV && !this.app.IS_CHROMAKEY) || this.app.IS_TEST) && this.app.segmentService.setUpSegments({
                    "segment_1": {
                        "missed": 10,
                        "made": 20
                    },
                    "segment_2": {
                        "missed": 0,
                        "made": 10
                    },
                    "segment_3": {
                        "missed": 10,
                        "made": 10
                    }
                })
                */
                // Add test shots for preview mode
                if (this.app.IS_PREVIEW && this.app.extractedData && !this.app.extractedData.gameId) {
                    this.app.shotService.clearShots();
                    
                    // Create test shots: 2 successful and 2 missed
                    const testShots = [
                        // Successful shots
                        { hsx: 3000, hsy: 5000, st: "MAKE" },
                        { hsx: -4000, hsy: 6000, st: "MAKE" },
                        // Missed shots
                        { hsx: 5000, hsy: 5000, st: "MISS" },
                        { hsx: -5000, hsy: 3500, st: "MISS" }
                    ];
                    
                    // Create shots and add them to runtime
                    this.app.runtime.shots = testShots.map(shotData => 
                        this.app.shotService.prepareShot(shotData)
                    );

                    this.app.screenService.setUpMainScreen({
                        firstName: "Text1",
                        lastName: "Text2",
                        number: "Text3",
                        stat1: "0",
                        stat2: "0%",
                        stat3: "0%",
                        backgroundImgUrl: this.app.extractedData.screensCenter,
                        teamLogoBackgroundImgUrl: this.app.extractedData.logoScreen,
                        playerImgUrl: null,
                        color: null,
                        noImage: this.app.extractedData.screensCenter ? false : true
                    })
                    
                    console.log("Test shots added for preview mode");
                }
                else{
                    this.app.dataService.loadStats();
                }
                
                
                this.app.screenService.updateScreens();
                this.applyColors();

                this.app.startLoop();
            });
    }

    applyColors() {
        this.app.checkIfLoaded();

        this.app.scene.getMeshByName('upper_wall').material.albedoColor = BABYLON.Color3.FromHexString(this.app.supportColor3).toLinearSpace();
        this.app.scene.getMeshByName('seats').material.albedoColor = BABYLON.Color3.FromHexString(this.app.supportColor1).toLinearSpace();
        this.app.scene.getMeshByName('blue_wall').material.albedoColor = BABYLON.Color3.FromHexString(this.app.supportColor2).toLinearSpace();

    }

    /**
     * Применение конфигурации камеры в зависимости от ориентации
     */
    async applyCameraOrientationConfig() {
        if (!this.app.deviceService) return;

        const orientation = this.app.deviceService.getScreenOrientation();
        const cameraConfig = await getCameraConfigAuto(this.app.deviceService);
        
        // Используем конфигурацию для текущей ориентации
        const config = orientation === 'portrait' ? cameraConfig.portrait : cameraConfig.landscape;

        if (config && config.position) {
            this.app.camera.setPosition(new BABYLON.Vector3(
                config.position.x,
                config.position.y,
                config.position.z
            ));
        }

        if (config && config.target) {
            this.app.camera.setTarget(new BABYLON.Vector3(
                config.target.x,
                config.target.y,
                config.target.z
            ));
        }

        // Применяем FOV из конфигурации
        if (cameraConfig.initial && cameraConfig.initial.fov !== undefined) {
            this.app.camera.fov = BABYLON.Tools.ToRadians(cameraConfig.initial.fov);
        }

        // Логируем применение конфигурации в режиме разработки
        if (this.app.IS_DEV) {
            console.log(`Applied camera config for ${orientation} orientation:`, config);
            console.log(`Applied FOV: ${cameraConfig.initial?.fov || 'default'} degrees`);
        }
    }

    /**
     * Обновление анимации камеры при изменении ориентации
     */
    async updateCameraAnimationForOrientation() {
        if (!this.app.deviceService || !this.app.camera || !this.app.camera.animations) return;

        const orientation = this.app.deviceService.getScreenOrientation();
        const cameraConfig = await getCameraConfigAuto(this.app.deviceService);
        const animConfig = cameraConfig.animation;

        // Очищаем существующие анимации
        this.app.camera.animations = [];

        // Создаем новую анимацию позиции
        const animation = new BABYLON.Animation(
            "cameraAnimation", 
            "position", 
            animConfig.fps,
            BABYLON.Animation.ANIMATIONTYPE_VECTOR3, 
            BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
        );

        const keys = animConfig.positionKeys.map(key => ({
            frame: key.frame,
            value: new BABYLON.Vector3(key.position.x, key.position.y, key.position.z)
        }));

        animation.setKeys(keys);
        this.app.camera.animations.push(animation);

        // Создаем новую анимацию цели
        const targetAnimation = new BABYLON.Animation(
            "cameraTargetAnimation", 
            "target", 
            animConfig.fps,
            BABYLON.Animation.ANIMATIONTYPE_VECTOR3, 
            BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
        );

        const targetKeys = animConfig.targetKeys.map(key => ({
            frame: key.frame,
            value: new BABYLON.Vector3(key.target.x, key.target.y, key.target.z)
        }));

        targetAnimation.setKeys(targetKeys);
        this.app.camera.animations.push(targetAnimation);

        // Запускаем анимацию если не в режиме предварительного просмотра
        if (!this.app.IS_PREVIEW) {
            this.app.scene.beginAnimation(
                this.app.camera, 
                animConfig.fromFrame, 
                animConfig.toFrame, 
                true
            );
        }

        // Логируем обновление анимации в режиме разработки
        if (this.app.IS_DEV) {
            console.log(`Updated camera animation for ${orientation} orientation`);
        }
    }
}