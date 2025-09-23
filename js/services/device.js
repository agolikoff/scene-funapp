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
     * Инициализация информации об устройстве
     */
    initializeDeviceInfo() {
        this.deviceInfo = {
            // Ориентация экрана
            orientation: this.getScreenOrientation(),
            
            // Разрешение экрана
            resolution: this.getScreenResolution(),
            
            // Тип устройства
            deviceType: this.getDeviceType(),
            
            // Вебвью в приложении
            isWebView: this.isWebView(),
            
            // Дополнительная информация
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            
            // Размеры viewport
            viewport: this.getViewportSize(),
            
            // Плотность пикселей
            pixelRatio: window.devicePixelRatio || 1,
            
            // Поддержка touch
            touchSupport: this.hasTouchSupport(),
            
            // Время инициализации
            initializedAt: new Date().toISOString()
        };

        console.log('Device info initialized:', this.deviceInfo);
    }

    /**
     * Определение ориентации экрана
     */
    getScreenOrientation() {
        // Проверяем через screen.orientation API (современные браузеры)
        if (screen.orientation) {
            const angle = screen.orientation.angle;
            if (angle === 0 || angle === 180) {
                return 'portrait';
            } else if (angle === 90 || angle === 270) {
                return 'landscape';
            }
        }

        // Фоллбэк через размеры экрана
        const width = window.screen.width;
        const height = window.screen.height;
        
        if (width > height) {
            return 'landscape';
        } else {
            return 'portrait';
        }
    }

    /**
     * Получение разрешения экрана
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
     * Определение типа устройства
     */
    getDeviceType() {
        const userAgent = navigator.userAgent.toLowerCase();
        
        // Проверяем мобильные устройства
        const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
        if (mobileRegex.test(userAgent)) {
            return 'mobile';
        }
        
        // Проверяем планшеты
        const tabletRegex = /ipad|android(?!.*mobile)|tablet/i;
        if (tabletRegex.test(userAgent)) {
            return 'tablet';
        }
        
        // Проверяем размер экрана для дополнительной проверки
        const screenWidth = window.screen.width;
        const screenHeight = window.screen.height;
        const maxDimension = Math.max(screenWidth, screenHeight);
        
        if (maxDimension <= 768) {
            return 'mobile';
        } else if (maxDimension <= 1024) {
            return 'tablet';
        }
        
        return 'desktop';
    }

    /**
     * Определение вебвью в приложении
     */
    isWebView() {
        const userAgent = navigator.userAgent;
        
        // Проверяем различные признаки вебвью
        const webViewIndicators = [
            // iOS WebView
            /wv\)/i,
            /WebView/i,
            
            // Android WebView
            /; wv\)/i,
            /Version\/.*Chrome\/.*Mobile/i,
            
            // Другие приложения
            /FBAN|FBAV/i, // Facebook
            /Instagram/i,
            /Twitter/i,
            /LinkedIn/i,
            /WhatsApp/i,
            /Telegram/i,
            /Discord/i,
            /Slack/i,
            
            // Проверяем отсутствие обычных браузерных функций
            !window.chrome && !window.safari && !window.opera && !window.firefox
        ];

        // Проверяем наличие WebView API
        if (window.webkit && window.webkit.messageHandlers) {
            return true;
        }

        // Проверяем user agent
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
     * Получение размеров viewport
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
     * Проверка поддержки touch
     */
    hasTouchSupport() {
        return 'ontouchstart' in window || 
               navigator.maxTouchPoints > 0 || 
               navigator.msMaxTouchPoints > 0;
    }

    /**
     * Настройка слушателей событий
     */
    setupEventListeners() {
        // Слушаем изменения ориентации
        if (screen.orientation) {
            screen.orientation.addEventListener('change', () => {
                this.deviceInfo.orientation = this.getScreenOrientation();
                this.deviceInfo.resolution = this.getScreenResolution();
                this.deviceInfo.viewport = this.getViewportSize();
                this.onDeviceChange();
            });
        } else {
            // Фоллбэк для старых браузеров
            window.addEventListener('orientationchange', () => {
                setTimeout(() => {
                    this.deviceInfo.orientation = this.getScreenOrientation();
                    this.deviceInfo.resolution = this.getScreenResolution();
                    this.deviceInfo.viewport = this.getViewportSize();
                    this.onDeviceChange();
                }, 100);
            });
        }

        // Слушаем изменения размера окна
        window.addEventListener('resize', () => {
            this.deviceInfo.viewport = this.getViewportSize();
            this.onDeviceChange();
        });
    }

    /**
     * Обработчик изменений устройства
     */
    onDeviceChange() {
        console.log('Device changed:', this.deviceInfo);
        
        // Уведомляем другие сервисы об изменениях
        if (this.app.onDeviceChange) {
            this.app.onDeviceChange(this.deviceInfo);
        }
    }

    /**
     * Получение информации об устройстве
     */
    getDeviceInfo() {
        return { ...this.deviceInfo };
    }

    /**
     * Проверка является ли устройство мобильным
     */
    isMobile() {
        return this.deviceInfo.deviceType === 'mobile';
    }

    /**
     * Проверка является ли устройство планшетом
     */
    isTablet() {
        return this.deviceInfo.deviceType === 'tablet';
    }

    /**
     * Проверка является ли устройство десктопом
     */
    isDesktop() {
        return this.deviceInfo.deviceType === 'desktop';
    }

    /**
     * Проверка ориентации экрана
     */
    isLandscape() {
        return this.deviceInfo.orientation === 'landscape';
    }

    /**
     * Проверка ориентации экрана
     */
    isPortrait() {
        return this.deviceInfo.orientation === 'portrait';
    }

    /**
     * Проверка запуска в вебвью
     */
    isInWebView() {
        return this.deviceInfo.isWebView;
    }

    /**
     * Получение размера экрана в пикселях
     */
    getScreenSize() {
        return {
            width: this.deviceInfo.resolution.width,
            height: this.deviceInfo.resolution.height
        };
    }

    /**
     * Получение размера viewport
     */
    getViewportSize() {
        return this.deviceInfo.viewport;
    }

    /**
     * Получение плотности пикселей
     */
    getPixelRatio() {
        return this.deviceInfo.pixelRatio;
    }

    /**
     * Проверка поддержки touch
     */
    hasTouch() {
        return this.deviceInfo.touchSupport;
    }

    /**
     * Получение краткой информации об устройстве
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
     * Получение конфигурации для текущего устройства
     */
    getDeviceConfig() {
        return getDeviceConfig(this);
    }

    /**
     * Проверка поддержки определенной функции
     */
    isFeatureSupported(feature) {
        return isFeatureSupported(this, feature);
    }

    /**
     * Получение настроек камеры для текущего устройства
     */
    getCameraConfig() {
        const config = this.getDeviceConfig();
        return config.camera || {};
    }

    /**
     * Получение настроек UI для текущего устройства
     */
    getUIConfig() {
        const config = this.getDeviceConfig();
        return config.ui || {};
    }

    /**
     * Получение настроек производительности для текущего устройства
     */
    getPerformanceConfig() {
        const config = this.getDeviceConfig();
        return config.performance || {};
    }

    /**
     * Проверка, нужно ли адаптировать интерфейс для touch
     */
    needsTouchAdaptation() {
        return this.deviceInfo.touchSupport && this.deviceInfo.deviceType !== 'desktop';
    }

    /**
     * Проверка, нужно ли упростить интерфейс
     */
    needsSimplifiedUI() {
        const uiConfig = this.getUIConfig();
        return uiConfig.simplifiedUI === true;
    }

    /**
     * Получение рекомендуемого размера touch-элементов
     */
    getTouchTargetSize() {
        const uiConfig = this.getUIConfig();
        return uiConfig.touchTargetSize || 44;
    }

    /**
     * Проверка, нужно ли оптимизировать для вебвью
     */
    needsWebViewOptimization() {
        const perfConfig = this.getPerformanceConfig();
        return perfConfig.optimizeForWebView === true;
    }

    /**
     * Получение рекомендуемого качества рендеринга
     */
    getRecommendedQuality() {
        const perfConfig = this.getPerformanceConfig();
        return perfConfig.quality || 'high';
    }

    /**
     * Получение списка отключенных эффектов
     */
    getDisabledEffects() {
        const perfConfig = this.getPerformanceConfig();
        return perfConfig.disableEffects || [];
    }
}
