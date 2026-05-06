/**
 * Camera configuration for tablets
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
        
        // Camera field of view (in degrees) - average for tablets
        fov: 55
    },

    // Settings for development mode
    dev: {
        position: { x: 18, y: 14, z: 0 },
        target: { x: -9, y: 0.6, z: 0 }
    },

    // Settings for preview mode
    preview: {
        position: { x: 18, y: 14, z: 0 },
        target: { x: -9, y: 1.5, z: 0 }
    },

    // Settings for tablets
    tablet: {
        position: { x: 18, y: 14, z: 0 },
        target: { x: -9, y: 0.6, z: 0 }
    },

    // Camera animation for tablets
    animation: {
        // Animation settings
        fps: 30,
        loopMode: "CYCLE",
        
        // Camera position animation key points for tablets
        positionKeys: [
            {
                frame: 0,
                position: { x: 18, y: 14, z: 0 }
            },
            {
                frame: 150,
                position: { x: 25, y: 18, z: 8 }
            },
            {
                frame: 300,
                position: { x: 18, y: 14, z: 0 }
            },
            {
                frame: 450,
                position: { x: 25, y: 18, z: -8 }
            },
            {
                frame: 600,
                position: { x: 18, y: 14, z: 0 }
            }
        ],

        // Camera target animation key points for tablets
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
