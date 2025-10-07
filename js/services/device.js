import {
    BaseService
} from "./base.js";
import { getDeviceConfig, isFeatureSupported } from "../config/device.js";

export class DeviceService extends BaseService {
    constructor(app) {
        super(app);
        this.deviceInfo = {};
        this.initializeDeviceInfo();
        this.setupEventListeners();
    }

    /**
     * Initialize device information
     */
    initializeDeviceInfo() {
        // First determine device type
        const deviceType = this.getDeviceType();
        
        this.deviceInfo = {
            // Device type (determined first)
            deviceType: deviceType,
            
            // Screen orientation (uses deviceType)
            orientation: this.getScreenOrientation(),
            
            // Screen resolution
            resolution: this.getScreenResolution(),
            
            // WebView in application
            isWebView: this.isWebView(),
            
            // Additional information
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            
            // Viewport dimensions
            viewport: this.getViewportSize(),
            
            // Pixel density
            pixelRatio: window.devicePixelRatio || 1,
            
            // Touch support
            touchSupport: this.hasTouchSupport(),
            
            // Initialization time
            initializedAt: new Date().toISOString()
        };

        console.log('Device info initialized:', this.deviceInfo);
    }

    /**
     * Determine screen orientation
     */
    getScreenOrientation() {
        // For desktops ignore screen.orientation API as it works incorrectly
        const isDesktop = this.isDesktop();
        
        if (isDesktop) {
            console.log('DeviceService: Desktop detected, ignoring screen.orientation API');
        } else {
            // Check through screen.orientation API only for mobile devices
            if (screen.orientation) {
                const angle = screen.orientation.angle;
                if (angle === 0 || angle === 180) {
                    console.log('DeviceService: Using screen.orientation API - portrait (angle:', angle, ')');
                    return 'portrait';
                } else if (angle === 90 || angle === 270) {
                    console.log('DeviceService: Using screen.orientation API - landscape (angle:', angle, ')');
                    return 'landscape';
                }
            }
        }

        const width = window.screen.width;
        const height = window.screen.height;
        const aspectRatio = width / height;
        
        console.log('DeviceService: Screen dimensions:', width, 'x', height, 'ratio:', aspectRatio.toFixed(3), 'isDesktop:', isDesktop);

        // For desktops use smarter logic
        if (isDesktop) {
            // On desktops usually landscape, unless very high resolution
            // If aspect ratio is greater than 0.8, consider landscape
            // This accounts for cases with very high monitors
            if (aspectRatio > 0.8) {
                console.log('DeviceService: Desktop detected, aspect ratio > 0.8 - landscape');
                return 'landscape';
            } else {
                console.log('DeviceService: Desktop detected, aspect ratio <= 0.8 - portrait');
                return 'portrait';
            }
        }
        
        // For mobile devices use standard logic
        if (width > height) {
            console.log('DeviceService: Mobile/tablet detected, width > height - landscape');
            return 'landscape';
        } else {
            console.log('DeviceService: Mobile/tablet detected, width <= height - portrait');
            return 'portrait';
        }
    }

    /**
     * Get screen resolution
     */
    getScreenResolution() {
        return {
            width: window.screen.width,
            height: window.screen.height,
            availWidth: window.screen.availWidth,
            availHeight: window.screen.availHeight,
            colorDepth: window.screen.colorDepth,
            pixelDepth: window.screen.pixelDepth
        };
    }

    /**
     * Determine device type
     */
    getDeviceType() {
        const userAgent = navigator.userAgent.toLowerCase();
        
        // Check mobile devices
        const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
        if (mobileRegex.test(userAgent)) {
            console.log('DeviceService: Device type detected as mobile (user agent match)');
            return 'mobile';
        }
        
        // Check tablets
        const tabletRegex = /ipad|android(?!.*mobile)|tablet/i;
        if (tabletRegex.test(userAgent)) {
            console.log('DeviceService: Device type detected as tablet (user agent match)');
            return 'tablet';
        }
        
        // Check screen size for additional verification
        const screenWidth = window.screen.width;
        const screenHeight = window.screen.height;
        const maxDimension = Math.max(screenWidth, screenHeight);
        
        console.log('DeviceService: Screen dimensions for device type:', screenWidth, 'x', screenHeight, 'max:', maxDimension);
        
        if (maxDimension <= 768) {
            console.log('DeviceService: Device type detected as mobile (screen size <= 768)');
            return 'mobile';
        } else if (maxDimension <= 1024) {
            console.log('DeviceService: Device type detected as tablet (screen size <= 1024)');
            return 'tablet';
        }
        
        console.log('DeviceService: Device type detected as desktop (screen size > 1024)');
        return 'desktop';
    }

    /**
     * Determine webview in application
     */
    isWebView() {
        const userAgent = navigator.userAgent;
        
        // Check various webview signs
        const webViewIndicators = [
            // iOS WebView
            /wv\)/i,
            /WebView/i,
            
            // Android WebView
            /; wv\)/i,
            /Version\/.*Chrome\/.*Mobile/i,
            
            // Other applications
            /FBAN|FBAV/i, // Facebook
            /Instagram/i,
            /Twitter/i,
            /LinkedIn/i,
            /WhatsApp/i,
            /Telegram/i,
            /Discord/i,
            /Slack/i,
            
            // Check absence of normal browser functions
            !window.chrome && !window.safari && !window.opera && !window.firefox
        ];

        // Check for WebView API
        if (window.webkit && window.webkit.messageHandlers) {
            return true;
        }

        // Check user agent
        for (const indicator of webViewIndicators) {
            if (indicator instanceof RegExp) {
                if (indicator.test(userAgent)) {
                    return true;
                }
            } else if (indicator === true) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get viewport dimensions
     */
    getViewportSize() {
        return {
            width: window.innerWidth,
            height: window.innerHeight,
            outerWidth: window.outerWidth,
            outerHeight: window.outerHeight
        };
    }

    /**
     * Check touch support
     */
    hasTouchSupport() {
        return 'ontouchstart' in window || 
               navigator.maxTouchPoints > 0 || 
               navigator.msMaxTouchPoints > 0;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for orientation changes
        if (screen.orientation) {
            screen.orientation.addEventListener('change', () => {
                console.log('DeviceService: Screen orientation changed via screen.orientation API');
                this._updateDeviceInfo();
                this.onDeviceChange();
            });
        } else {
            // Fallback for old browsers
            window.addEventListener('orientationchange', () => {
                console.log('DeviceService: Screen orientation changed via orientationchange event');
                setTimeout(() => {
                    this._updateDeviceInfo();
                    this.onDeviceChange();
                }, 100);
            });
        }
        
        // Additionally listen for window size changes for reliability
        window.addEventListener('resize', () => {
            console.log('DeviceService: Window resized');
            setTimeout(() => {
                this._updateDeviceInfo();
                this.onDeviceChange();
            }, 100);
        });
    }

    /**
     * Update device information
     */
    _updateDeviceInfo() {
        const oldOrientation = this.deviceInfo.orientation;
        
        // Update device information
        this.deviceInfo.orientation = this.getScreenOrientation();
        this.deviceInfo.resolution = this.getScreenResolution();
        this.deviceInfo.viewport = this.getViewportSize();
        
        // Log orientation change
        if (oldOrientation !== this.deviceInfo.orientation) {
            console.log(`DeviceService: Orientation changed from ${oldOrientation} to ${this.deviceInfo.orientation}`);
        }
    }

    /**
     * Device change handler
     */
    onDeviceChange() {
        console.log('Device changed:', this.deviceInfo);
        
        // Notify other services about changes
        if (this.app.onDeviceChange) {
            this.app.onDeviceChange(this.deviceInfo);
        }
    }

    /**
     * Get device information
     */
    getDeviceInfo() {
        return { ...this.deviceInfo };
    }

    /**
     * Check if device is mobile
     */
    isMobile() {
        return this.deviceInfo.deviceType === 'mobile';
    }

    /**
     * Check if device is tablet
     */
    isTablet() {
        return this.deviceInfo.deviceType === 'tablet';
    }

    /**
     * Check if device is desktop
     */
    isDesktop() {
        return this.deviceInfo.deviceType === 'desktop';
    }

    /**
     * Check screen orientation
     */
    isLandscape() {
        return this.deviceInfo.orientation === 'landscape';
    }

    /**
     * Check screen orientation
     */
    isPortrait() {
        return this.deviceInfo.orientation === 'portrait';
    }

    /**
     * Check if running in webview
     */
    isInWebView() {
        return this.deviceInfo.isWebView;
    }

    /**
     * Get screen size in pixels
     */
    getScreenSize() {
        return {
            width: this.deviceInfo.resolution.width,
            height: this.deviceInfo.resolution.height
        };
    }

    /**
     * Get viewport size
     */
    getViewportSize() {
        return this.deviceInfo.viewport;
    }

    /**
     * Get pixel density
     */
    getPixelRatio() {
        return this.deviceInfo.pixelRatio;
    }

    /**
     * Check touch support
     */
    hasTouch() {
        return this.deviceInfo.touchSupport;
    }

    /**
     * Get brief device information
     */
    getDeviceSummary() {
        return {
            type: this.deviceInfo.deviceType,
            orientation: this.deviceInfo.orientation,
            resolution: `${this.deviceInfo.resolution.width}x${this.deviceInfo.resolution.height}`,
            viewport: `${this.deviceInfo.viewport.width}x${this.deviceInfo.viewport.height}`,
            isWebView: this.deviceInfo.isWebView,
            hasTouch: this.deviceInfo.touchSupport,
            pixelRatio: this.deviceInfo.pixelRatio
        };
    }

    /**
     * Get configuration for current device
     */
    getDeviceConfig() {
        return getDeviceConfig(this);
    }

    /**
     * Check support for specific feature
     */
    isFeatureSupported(feature) {
        return isFeatureSupported(this, feature);
    }

    /**
     * Get camera settings for current device
     */
    getCameraConfig() {
        const config = this.getDeviceConfig();
        return config.camera || {};
    }

    /**
     * Get UI settings for current device
     */
    getUIConfig() {
        const config = this.getDeviceConfig();
        return config.ui || {};
    }

    /**
     * Get performance settings for current device
     */
    getPerformanceConfig() {
        const config = this.getDeviceConfig();
        return config.performance || {};
    }

    /**
     * Check if UI should be adapted for touch
     */
    needsTouchAdaptation() {
        return this.deviceInfo.touchSupport && this.deviceInfo.deviceType !== 'desktop';
    }

    /**
     * Check if UI should be simplified
     */
    needsSimplifiedUI() {
        const uiConfig = this.getUIConfig();
        return uiConfig.simplifiedUI === true;
    }

    /**
     * Get recommended size for touch elements
     */
    getTouchTargetSize() {
        const uiConfig = this.getUIConfig();
        return uiConfig.touchTargetSize || 44;
    }

    /**
     * Check if optimization for webview is needed
     */
    needsWebViewOptimization() {
        const perfConfig = this.getPerformanceConfig();
        return perfConfig.optimizeForWebView === true;
    }

    /**
     * Get recommended rendering quality
     */
    getRecommendedQuality() {
        const perfConfig = this.getPerformanceConfig();
        return perfConfig.quality || 'high';
    }

    /**
     * Get list of disabled effects
     */
    getDisabledEffects() {
        const perfConfig = this.getPerformanceConfig();
        return perfConfig.disableEffects || [];
    }
}
