/**
 * Configuration for various device types
 */
export const DEVICE_CONFIG = {
    // Settings for mobile devices
    mobile: {
        // Camera settings
        camera: {
            // Closer camera position for mobile
            position: { x: 8, y: 4, z: 8 },
            target: { x: -8.5, y: 0, z: 0.8 },
            // Reduced animation speed
            animationSpeed: 0.8
        },
        
        // UI settings
        ui: {
            // Increased element sizes for touch
            touchTargetSize: 44,
            // Simplified interface
            simplifiedUI: true
        },
        
        // Performance settings
        performance: {
            // Reduced quality for mobile
            quality: 'medium',
            // Disable some effects
            disableEffects: ['shadows', 'reflections']
        }
    },

    // Settings for tablets
    tablet: {
        camera: {
            position: { x: 10, y: 5, z: 10 },
            target: { x: -8.5, y: 0, z: 0.8 },
            animationSpeed: 0.9
        },
        
        ui: {
            touchTargetSize: 40,
            simplifiedUI: false
        },
        
        performance: {
            quality: 'high',
            disableEffects: []
        }
    },

    // Settings for desktops
    desktop: {
        camera: {
            position: { x: 13.4, y: 9.3, z: 0 },
            target: { x: -9, y: 0.6, z: 0 },
            animationSpeed: 1.0
        },
        
        ui: {
            touchTargetSize: 32,
            simplifiedUI: false
        },
        
        performance: {
            quality: 'ultra',
            disableEffects: []
        }
    },

    // Settings for webview in applications
    webview: {
        // Special settings for webview
        camera: {
            // More static camera for webview
            staticCamera: true,
            position: { x: 10, y: 6, z: 10 },
            target: { x: -8.5, y: 0, z: 0.8 }
        },
        
        ui: {
            // Hide control elements
            hideControls: true,
            // Adaptation to parent application
            adaptToParent: true
        },
        
        performance: {
            // Optimization for webview
            optimizeForWebView: true,
            quality: 'medium'
        }
    },

    // Settings for portrait orientation
    portrait: {
        camera: {
            // Adapted position for portrait
            position: { x: 12, y: 8, z: 5 },
            target: { x: -8.5, y: 0, z: 0.8 },
            // Slower animation
            animationSpeed: 0.7
        },
        
        ui: {
            // Vertical layout
            verticalLayout: true,
            // Increased padding
            increasedPadding: true
        }
    },

    // Settings for landscape orientation
    landscape: {
        camera: {
            // Standard position for landscape
            position: { x: 13.4, y: 9.3, z: 0 },
            target: { x: -9, y: 0.6, z: 0 },
            animationSpeed: 1.0
        },
        
        ui: {
            // Horizontal layout
            horizontalLayout: true,
            // Standard padding
            standardPadding: true
        }
    },

    // Common settings
    common: {
        // Minimum screen sizes
        minScreenWidth: 320,
        minScreenHeight: 568,
        
        // Maximum screen sizes
        maxScreenWidth: 3840,
        maxScreenHeight: 2160,
        
        // Animation settings
        animation: {
            defaultDuration: 1000,
            easing: 'ease-in-out'
        },
        
        // Performance settings
        performance: {
            // Automatic quality reduction at low FPS
            autoQualityAdjustment: true,
            // Target FPS
            targetFPS: 60,
            // Minimum FPS for quality reduction
            minFPS: 30
        }
    }
};

/**
 * Get configuration for current device
 */
export function getDeviceConfig(deviceService) {
    const deviceInfo = deviceService.getDeviceInfo();
    const config = { ...DEVICE_CONFIG.common };

    // Apply settings by device type
    if (deviceInfo.deviceType === 'mobile') {
        Object.assign(config, DEVICE_CONFIG.mobile);
    } else if (deviceInfo.deviceType === 'tablet') {
        Object.assign(config, DEVICE_CONFIG.tablet);
    } else if (deviceInfo.deviceType === 'desktop') {
        Object.assign(config, DEVICE_CONFIG.desktop);
    }

    // Apply webview settings
    if (deviceInfo.isWebView) {
        Object.assign(config, DEVICE_CONFIG.webview);
    }

    // Apply orientation settings
    if (deviceInfo.orientation === 'portrait') {
        Object.assign(config, DEVICE_CONFIG.portrait);
    } else if (deviceInfo.orientation === 'landscape') {
        Object.assign(config, DEVICE_CONFIG.landscape);
    }

    return config;
}

/**
 * Check support for specific feature
 */
export function isFeatureSupported(deviceService, feature) {
    const deviceInfo = deviceService.getDeviceInfo();
    
    switch (feature) {
        case 'touch':
            return deviceInfo.touchSupport;
        case 'webgl2':
            return !!document.createElement('canvas').getContext('webgl2');
        case 'webgl':
            return !!document.createElement('canvas').getContext('webgl');
        case 'fullscreen':
            return !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
        case 'vibration':
            return 'vibrate' in navigator;
        case 'geolocation':
            return 'geolocation' in navigator;
        default:
            return false;
    }
}


