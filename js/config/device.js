/**
 * Конфигурация для различных типов устройств
 */
export const DEVICE_CONFIG = {
    // Настройки для мобильных устройств
    mobile: {
        // Настройки камеры
        camera: {
            // Более близкая позиция камеры для мобильных
            position: { x: 8, y: 4, z: 8 },
            target: { x: -8.5, y: 0, z: 0.8 },
            // Уменьшенная скорость анимации
            animationSpeed: 0.8
        },
        
        // Настройки интерфейса
        ui: {
            // Увеличенные размеры элементов для touch
            touchTargetSize: 44,
            // Упрощенный интерфейс
            simplifiedUI: true
        },
        
        // Настройки производительности
        performance: {
            // Сниженное качество для мобильных
            quality: 'medium',
            // Отключение некоторых эффектов
            disableEffects: ['shadows', 'reflections']
        }
    },

    // Настройки для планшетов
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

    // Настройки для десктопов
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

    // Настройки для вебвью в приложениях
    webview: {
        // Специальные настройки для вебвью
        camera: {
            // Более статичная камера для вебвью
            staticCamera: true,
            position: { x: 10, y: 6, z: 10 },
            target: { x: -8.5, y: 0, z: 0.8 }
        },
        
        ui: {
            // Скрытие элементов управления
            hideControls: true,
            // Адаптация под родительское приложение
            adaptToParent: true
        },
        
        performance: {
            // Оптимизация для вебвью
            optimizeForWebView: true,
            quality: 'medium'
        }
    },

    // Настройки для портретной ориентации
    portrait: {
        camera: {
            // Адаптированная позиция для портрета
            position: { x: 12, y: 8, z: 5 },
            target: { x: -8.5, y: 0, z: 0.8 },
            // Более медленная анимация
            animationSpeed: 0.7
        },
        
        ui: {
            // Вертикальная компоновка
            verticalLayout: true,
            // Увеличенные отступы
            increasedPadding: true
        }
    },

    // Настройки для ландшафтной ориентации
    landscape: {
        camera: {
            // Стандартная позиция для ландшафта
            position: { x: 13.4, y: 9.3, z: 0 },
            target: { x: -9, y: 0.6, z: 0 },
            animationSpeed: 1.0
        },
        
        ui: {
            // Горизонтальная компоновка
            horizontalLayout: true,
            // Стандартные отступы
            standardPadding: true
        }
    },

    // Общие настройки
    common: {
        // Минимальные размеры экрана
        minScreenWidth: 320,
        minScreenHeight: 568,
        
        // Максимальные размеры экрана
        maxScreenWidth: 3840,
        maxScreenHeight: 2160,
        
        // Настройки анимации
        animation: {
            defaultDuration: 1000,
            easing: 'ease-in-out'
        },
        
        // Настройки производительности
        performance: {
            // Автоматическое снижение качества при низком FPS
            autoQualityAdjustment: true,
            // Целевой FPS
            targetFPS: 60,
            // Минимальный FPS для снижения качества
            minFPS: 30
        }
    }
};

/**
 * Получение конфигурации для текущего устройства
 */
export function getDeviceConfig(deviceService) {
    const deviceInfo = deviceService.getDeviceInfo();
    const config = { ...DEVICE_CONFIG.common };

    // Применяем настройки по типу устройства
    if (deviceInfo.deviceType === 'mobile') {
        Object.assign(config, DEVICE_CONFIG.mobile);
    } else if (deviceInfo.deviceType === 'tablet') {
        Object.assign(config, DEVICE_CONFIG.tablet);
    } else if (deviceInfo.deviceType === 'desktop') {
        Object.assign(config, DEVICE_CONFIG.desktop);
    }

    // Применяем настройки для вебвью
    if (deviceInfo.isWebView) {
        Object.assign(config, DEVICE_CONFIG.webview);
    }

    // Применяем настройки по ориентации
    if (deviceInfo.orientation === 'portrait') {
        Object.assign(config, DEVICE_CONFIG.portrait);
    } else if (deviceInfo.orientation === 'landscape') {
        Object.assign(config, DEVICE_CONFIG.landscape);
    }

    return config;
}

/**
 * Проверка поддержки определенной функции
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

