/**
 * Camera configuration for mobile devices
 * Example of dynamic configuration
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
        
        // Camera field of view (in degrees) - wider for portrait orientation
        fov: 120
    },

    // Settings for development mode
    dev: {
        position: { x: 15, y: 12, z: 0 },
        target: { x: -9, y: 0.6, z: 0 }
    },

    // Settings for preview mode
    preview: {
        position: { x: 15, y: 12, z: 0 },
        target: { x: -9, y: 1.5, z: 0 }
    },

    // Settings for mobile devices
    mobile: {
        position: { x: 0, y: 8, z: 0 },
        target: { x: -9, y: 0.6, z: 0 }
    },

    // Camera animation for mobile devices
    animation: {
        // Animation settings
        fps: 30,
        loopMode: "CYCLE",
        
        // Camera position animation keyframes for mobile
        positionKeys: [
            {
                frame: 0,
                position: { x: 0, y: 8, z: 0 }
            }
        ],

        // Camera target animation keyframes for mobile
        targetKeys: [
            {
                frame: 0,
                target: { x: -5, y: 0, z: 0 }
            },
            {
                frame: 150,
                target: { x: -5, y: 0, z: 5 }
            },
            {
                frame: 300,
                target: { x: -5, y: 0, z: 0 }
            },
            {
                frame: 450,
                target: { x: -5, y: 0, z: -5 }
            },
            {
                frame: 600,
                target: { x: -5, y: 0, z: 0 }
            }
        ],

        // Animation range
        fromFrame: 0,
        toFrame: 600
    }
};
