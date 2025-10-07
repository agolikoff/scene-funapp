/**
 * Camera configuration for landscape orientation (default)
 */
export const CAMERA_CONFIG = {
    // Initial camera settings
    initial: {
        // ArcRotateCamera parameters
        name: "camera1",
        alpha: 10,
        beta: 10,
        radius: 10,
        target: { x: -8.5, y: 0, z: 0.8 },
        
        // Camera constraints
        minZ: 0.5,
        maxZ: 100,

        // Camera field of view (in degrees) - wider for mobile devices
        fov: 45
    },

    // Settings for development mode
    dev: {
        position: { x: 13.4, y: 9.3, z: 0 },
        target: { x: -9, y: 0.6, z: 0 }
    },

    // Settings for preview mode
    preview: {
        position: { x: 13.4, y: 9.3, z: 0 },
        target: { x: -9, y: 1.5, z: 0 }
    },

    // Settings for landscape orientation
    landscape: {
        position: { x: 13.4, y: 9.3, z: 0 },
        target: { x: -9, y: 0.6, z: 0 }
    },

    // Camera animation for landscape orientation
    animation: {
        // Animation settings
        fps: 30,
        loopMode: "CYCLE",
        
        // Camera position animation keyframes
        positionKeys: [
            {
                frame: 0,
                position: { x: 10, y: 3.5, z: 10 }
            },
            {
                frame: 150,
                position: { x: 10, y: 8, z: 0 }
            },
            {
                frame: 300,
                position: { x: 10, y: 3.5, z: -10 }
            },
            {
                frame: 450,
                position: { x: 10, y: 8, z: 0 }
            },
            {
                frame: 600,
                position: { x: 10, y: 3.5, z: 10 }
            }
        ],

        // Camera target animation keyframes
        targetKeys: [
            {
                frame: 0,
                target: { x: -8.5, y: 0, z: 0.8 }
            },
            {
                frame: 300,
                target: { x: -7, y: 0, z: 0.8 }
            },
            {
                frame: 600,
                target: { x: -8.5, y: 0, z: 0.8 }
            }
        ],

        // Animation range
        fromFrame: 0,
        toFrame: 600
    }
};


