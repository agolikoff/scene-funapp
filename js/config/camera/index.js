/**
 * Автоматический выбор конфигурации камеры в зависимости от ориентации устройства
 */

// Импортируем конфигурации
import { CAMERA_CONFIG as DEFAULT_CONFIG } from './default.js';
import { CAMERA_CONFIG as PORTRAIT_CONFIG } from './portrait.js';

/**
 * Получение конфигурации камеры в зависимости от ориентации
 * @param {string} orientation - ориентация экрана ('portrait', 'landscape', 'default')
 * @returns {Object|null} конфигурация камеры или null если не найдена
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
 * Получение конфигурации камеры с автоматическим определением ориентации
 * @param {Object} deviceService - сервис устройства (опционально)
 * @returns {Object} конфигурация камеры
 */
export function getCameraConfigAuto(deviceService = null) {
    // Сначала проверяем GET параметр
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
    
    // Автоматическое определение ориентации
    let orientation = 'landscape';
    
    if (deviceService && typeof deviceService.getScreenOrientation === 'function') {
        orientation = deviceService.getScreenOrientation();
    } else if (typeof window !== 'undefined' && window.screen) {
        // Фоллбэк для определения ориентации без DeviceService
        const width = window.screen.width;
        const height = window.screen.height;
        const aspectRatio = width / height;
        
        // Для больших экранов (десктопы) используем более умную логику
        const maxDimension = Math.max(width, height);
        if (maxDimension > 1024) {
            // Десктоп - обычно landscape, если соотношение сторон разумное
            // Игнорируем screen.orientation API для десктопов
            orientation = aspectRatio > 0.8 ? 'landscape' : 'portrait';
            console.log(`Camera config fallback: Desktop detected (${width}x${height}, ratio: ${aspectRatio.toFixed(3)}) - ${orientation}`);
        } else {
            // Мобильные устройства - проверяем screen.orientation API сначала
            if (screen.orientation) {
                const angle = screen.orientation.angle;
                if (angle === 0 || angle === 180) {
                    orientation = 'portrait';
                } else if (angle === 90 || angle === 270) {
                    orientation = 'landscape';
                } else {
                    // Фоллбэк на размеры экрана
                    orientation = width > height ? 'landscape' : 'portrait';
                }
            } else {
                // Стандартная логика по размерам экрана
                orientation = width > height ? 'landscape' : 'portrait';
            }
            console.log(`Camera config fallback: Mobile/tablet detected (${width}x${height}) - ${orientation}`);
        }
    }
    
    return getCameraConfig(orientation);
}

/**
 * Экспорт конфигурации по умолчанию (ландшафтная ориентация)
 * Это используется для обратной совместимости
 */
export const CAMERA_CONFIG = DEFAULT_CONFIG;

/**
 * Экспорт отдельных конфигураций для прямого доступа
 */
export { DEFAULT_CONFIG, PORTRAIT_CONFIG };

/**
 * Утилиты для работы с конфигурацией камеры
 */
export const CameraConfigUtils = {
    /**
     * Получение конфигурации по ориентации
     */
    getByOrientation: getCameraConfig,
    
    /**
     * Автоматическое получение конфигурации
     */
    getAuto: getCameraConfigAuto,
    
    /**
     * Проверка, является ли ориентация портретной
     */
    isPortrait: (orientation) => orientation === 'portrait',
    
    /**
     * Проверка, является ли ориентация ландшафтной
     */
    isLandscape: (orientation) => orientation === 'landscape',
    
    /**
     * Получение названия конфигурации
     */
    getConfigName: (orientation) => orientation === 'portrait' ? 'portrait' : 'default',
    
    /**
     * Получение GET параметра cameraConfig
     */
    getUrlParameter: () => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('cameraConfig');
    },
    
    /**
     * Проверка, задан ли параметр cameraConfig в URL
     */
    hasUrlParameter: () => {
        return CameraConfigUtils.getUrlParameter() !== null;
    },
    
    /**
     * Получение списка доступных конфигураций
     */
    getAvailableConfigs: () => ['portrait', 'landscape', 'default'],
    
    /**
     * Валидация параметра конфигурации
     */
    isValidConfig: (configName) => {
        return CameraConfigUtils.getAvailableConfigs().includes(configName.toLowerCase());
    }
};

