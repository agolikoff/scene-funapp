/**
 * Automatic camera configuration selection based on device orientation
 */

// Import configurations
import { CAMERA_CONFIG as DEFAULT_CONFIG } from './default.js';
import { CAMERA_CONFIG as PORTRAIT_CONFIG } from './portrait.js';

/**
 * Get camera configuration based on orientation
 * @param {string} orientation - screen orientation ('portrait', 'landscape', 'default')
 * @returns {Object|null} camera configuration or null if not found
 */
export function getCameraConfig(orientation = 'landscape') {
    const normalizedOrientation = orientation.toLowerCase();
    console.log(normalizedOrientation);
    switch (normalizedOrientation) {
        case 'portrait':
            return PORTRAIT_CONFIG;
        case 'landscape':
        case 'default':
            return DEFAULT_CONFIG;
        default:
            console.warn(`Unknown camera config orientation: ${orientation}. Available options: portrait, landscape, default`);
            return null;
    }
}

/**
 * Get camera configuration with automatic orientation detection
 * @param {Object} deviceService - device service (optional)
 * @returns {Object} camera configuration
 */
export function getCameraConfigAuto(deviceService = null) {
    // First check GET parameter
    const urlParams = new URLSearchParams(window.location.search);
    const cameraConfigParam = urlParams.get('cameraConfig');
    
    if (cameraConfigParam) {
        const config = getCameraConfig(cameraConfigParam);
        if (config) {
            console.log(`Using camera config from URL parameter: ${cameraConfigParam}`);
            return config;
        } else {
            console.warn(`Invalid camera config parameter: ${cameraConfigParam}. Falling back to auto-detection.`);
        }
    }
    
    // Automatic orientation detection
    let orientation = 'landscape';
    
    if (deviceService && typeof deviceService.getScreenOrientation === 'function') {
        orientation = deviceService.getScreenOrientation();
    } else if (typeof window !== 'undefined' && window.screen) {
        // Fallback for orientation detection without DeviceService
        const width = window.screen.width;
        const height = window.screen.height;
        const aspectRatio = width / height;
        
        // For large screens (desktops) use smarter logic
        const maxDimension = Math.max(width, height);
        if (maxDimension > 1024) {
            // Desktop - usually landscape if aspect ratio is reasonable
            // Ignore screen.orientation API for desktops
            orientation = aspectRatio > 0.8 ? 'landscape' : 'portrait';
            console.log(`Camera config fallback: Desktop detected (${width}x${height}, ratio: ${aspectRatio.toFixed(3)}) - ${orientation}`);
        } else {
            // Mobile devices - check screen.orientation API first
            if (screen.orientation) {
                const angle = screen.orientation.angle;
                if (angle === 0 || angle === 180) {
                    orientation = 'portrait';
                } else if (angle === 90 || angle === 270) {
                    orientation = 'landscape';
                } else {
                    // Fallback to screen dimensions
                    orientation = width > height ? 'landscape' : 'portrait';
                }
            } else {
                // Standard logic by screen dimensions
                orientation = width > height ? 'landscape' : 'portrait';
            }
            console.log(`Camera config fallback: Mobile/tablet detected (${width}x${height}) - ${orientation}`);
        }
    }
    
    return getCameraConfig(orientation);
}

/**
 * Export default configuration (landscape orientation)
 * This is used for backward compatibility
 */
export const CAMERA_CONFIG = DEFAULT_CONFIG;

/**
 * Export individual configurations for direct access
 */
export { DEFAULT_CONFIG, PORTRAIT_CONFIG };

/**
 * Utilities for working with camera configuration
 */
export const CameraConfigUtils = {
    /**
     * Get configuration by orientation
     */
    getByOrientation: getCameraConfig,
    
    /**
     * Automatic configuration retrieval
     */
    getAuto: getCameraConfigAuto,
    
    /**
     * Check if orientation is portrait
     */
    isPortrait: (orientation) => orientation === 'portrait',
    
    /**
     * Check if orientation is landscape
     */
    isLandscape: (orientation) => orientation === 'landscape',
    
    /**
     * Get configuration name
     */
    getConfigName: (orientation) => orientation === 'portrait' ? 'portrait' : 'default',
    
    /**
     * Get cameraConfig GET parameter
     */
    getUrlParameter: () => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('cameraConfig');
    },
    
    /**
     * Check if cameraConfig parameter is set in URL
     */
    hasUrlParameter: () => {
        return CameraConfigUtils.getUrlParameter() !== null;
    },
    
    /**
     * Get list of available configurations
     */
    getAvailableConfigs: () => ['portrait', 'landscape', 'default'],
    
    /**
     * Validate configuration parameter
     */
    isValidConfig: (configName) => {
        return CameraConfigUtils.getAvailableConfigs().includes(configName.toLowerCase());
    }
};

