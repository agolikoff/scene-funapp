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
        // Сначала определяем тип устройства
        const deviceType = this.getDeviceType();
        
        this.deviceInfo = {
            // Тип устройства (определяем первым)
            deviceType: deviceType,
            
            // Ориентация экрана (использует deviceType)
            orientation: this.getScreenOrientation(),
            
            // Разрешение экрана
            resolution: this.getScreenResolution(),
            
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
        // Для десктопов игнорируем screen.orientation API, так как он работает неправильно
        const isDesktop = this.isDesktop();
        
        if (isDesktop) {
            console.log('DeviceService: Desktop detected, ignoring screen.orientation API');
        } else {
            // Проверяем через screen.orientation API только для мобильных устройств
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

        // Для десктопов используем более умную логику
        if (isDesktop) {
            // На десктопах обычно landscape, если только не очень высокое разрешение
            // Если соотношение сторон больше 0.8, считаем landscape
            // Это учитывает случаи с очень высокими мониторами
            if (aspectRatio > 0.8) {
                console.log('DeviceService: Desktop detected, aspect ratio > 0.8 - landscape');
                return 'landscape';
            } else {
                console.log('DeviceService: Desktop detected, aspect ratio <= 0.8 - portrait');
                return 'portrait';
            }
        }
        
        // Для мобильных устройств используем стандартную логику
        if (width > height) {
            console.log('DeviceService: Mobile/tablet detected, width > height - landscape');
            return 'landscape';
        } else {
            console.log('DeviceService: Mobile/tablet detected, width <= height - portrait');
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
            console.log('DeviceService: Device type detected as mobile (user agent match)');
            return 'mobile';
        }
        
        // Проверяем планшеты
        const tabletRegex = /ipad|android(?!.*mobile)|tablet/i;
        if (tabletRegex.test(userAgent)) {
            console.log('DeviceService: Device type detected as tablet (user agent match)');
            return 'tablet';
        }
        
        // Проверяем размер экрана для дополнительной проверки
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
                console.log('DeviceService: Screen orientation changed via screen.orientation API');
                this._updateDeviceInfo();
                this.onDeviceChange();
            });
        } else {
            // Фоллбэк для старых браузеров
            window.addEventListener('orientationchange', () => {
                console.log('DeviceService: Screen orientation changed via orientationchange event');
                setTimeout(() => {
                    this._updateDeviceInfo();
                    this.onDeviceChange();
                }, 100);
            });
        }
        
        // Дополнительно слушаем изменения размера окна для надежности
        window.addEventListener('resize', () => {
            console.log('DeviceService: Window resized');
            setTimeout(() => {
                this._updateDeviceInfo();
                this.onDeviceChange();
            }, 100);
        });
    }

    /**
     * Обновление информации об устройстве
     */
    _updateDeviceInfo() {
        const oldOrientation = this.deviceInfo.orientation;
        
        // Обновляем информацию об устройстве
        this.deviceInfo.orientation = this.getScreenOrientation();
        this.deviceInfo.resolution = this.getScreenResolution();
        this.deviceInfo.viewport = this.getViewportSize();
        
        // Логируем изменение ориентации
        if (oldOrientation !== this.deviceInfo.orientation) {
            console.log(`DeviceService: Orientation changed from ${oldOrientation} to ${this.deviceInfo.orientation}`);
        }
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
