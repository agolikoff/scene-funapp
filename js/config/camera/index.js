/**
 * Автоматический выбор конфигурации камеры в зависимости от ориентации устройства
 */

// Импортируем конфигурации
import { CAMERA_CONFIG as DEFAULT_CONFIG } from './default.js';
import { CAMERA_CONFIG as PORTRAIT_CONFIG } from './portrait.js';

/**
 * Получение конфигурации камеры в зависимости от ориентации
 * @param {string} orientation - ориентация экрана или имя файла конфигурации
 * @returns {Promise<Object|null>} конфигурация камеры или null если не найдена
 */
export async function getCameraConfig(orientation = 'landscape') {
    const normalizedOrientation = orientation.toLowerCase();
    
    // Проверяем стандартные конфигурации
    switch (normalizedOrientation) {
        case 'portrait':
            return PORTRAIT_CONFIG;
        case 'landscape':
        case 'default':
            return DEFAULT_CONFIG;
        default:
            // Пытаемся загрузить динамическую конфигурацию
            return await loadDynamicCameraConfig(normalizedOrientation);
    }
}

/**
 * Загрузка динамической конфигурации камеры из файла
 * @param {string} configName - имя конфигурации (имя файла без расширения)
 * @returns {Promise<Object|null>} конфигурация камеры или null если не найдена
 */
async function loadDynamicCameraConfig(configName) {
    try {
        // Пытаемся динамически импортировать файл конфигурации
        const configModule = await import(`./${configName}.js`);
        
        if (configModule && configModule.CAMERA_CONFIG) {
            console.log(`Successfully loaded dynamic camera config: ${configName}`);
            return configModule.CAMERA_CONFIG;
        } else {
            console.warn(`Camera config file ${configName}.js exists but doesn't export CAMERA_CONFIG`);
            return null;
        }
    } catch (error) {
        // Файл не найден или ошибка загрузки
        console.warn(`Camera config file ${configName}.js not found or failed to load:`, error.message);
        return null;
    }
}

/**
 * Получение конфигурации камеры с автоматическим определением ориентации
 * @param {Object} deviceService - сервис устройства (опционально)
 * @returns {Promise<Object>} конфигурация камеры
 */
export async function getCameraConfigAuto(deviceService = null) {
    // Сначала проверяем GET параметр
    const urlParams = new URLSearchParams(window.location.search);
    const cameraConfigParam = urlParams.get('cameraConfig');
    
    if (cameraConfigParam) {
        const config = await getCameraConfig(cameraConfigParam);
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
        orientation = width > height ? 'landscape' : 'portrait';
    }
    
    return await getCameraConfig(orientation);
}

/**
 * Синхронная версия getCameraConfig для обратной совместимости
 * @param {string} orientation - ориентация экрана
 * @returns {Object|null} конфигурация камеры или null если не найдена
 */
export function getCameraConfigSync(orientation = 'landscape') {
    const normalizedOrientation = orientation.toLowerCase();
    
    switch (normalizedOrientation) {
        case 'portrait':
            return PORTRAIT_CONFIG;
        case 'landscape':
        case 'default':
            return DEFAULT_CONFIG;
        default:
            console.warn(`Camera config ${orientation} not found in sync mode. Use getCameraConfig() for dynamic loading.`);
            return null;
    }
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
     * Получение конфигурации по ориентации (асинхронная)
     */
    getByOrientation: getCameraConfig,
    
    /**
     * Получение конфигурации по ориентации (синхронная)
     */
    getByOrientationSync: getCameraConfigSync,
    
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
     * Получение списка стандартных конфигураций
     */
    getStandardConfigs: () => ['portrait', 'landscape', 'default'],
    
    /**
     * Проверка, является ли конфигурация стандартной
     */
    isStandardConfig: (configName) => {
        return CameraConfigUtils.getStandardConfigs().includes(configName.toLowerCase());
    },
    
    /**
     * Попытка загрузки динамической конфигурации
     */
    loadDynamicConfig: async (configName) => {
        return await loadDynamicCameraConfig(configName.toLowerCase());
    },
    
    /**
     * Проверка существования файла конфигурации
     */
    configExists: async (configName) => {
        try {
            await import(`./${configName.toLowerCase()}.js`);
            return true;
        } catch (error) {
            return false;
        }
    }
};

