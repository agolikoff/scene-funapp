/**
 * Конфигурация камеры для ландшафтной ориентации (по умолчанию)
 */
export const CAMERA_CONFIG = {
    // Начальные настройки камеры
    initial: {
        // Параметры ArcRotateCamera
        name: "camera1",
        alpha: 10,
        beta: 10,
        radius: 10,
        target: { x: -8.5, y: 0, z: 0.8 },
        
        // Ограничения камеры
        minZ: 0.5,
        maxZ: 100,

        // Поле зрения камеры (в градусах) - шире для мобильных устройств
        fov: 45
    },

    // Настройки для режима разработки
    dev: {
        position: { x: 13.4, y: 9.3, z: 0 },
        target: { x: -9, y: 0.6, z: 0 }
    },

    // Настройки для режима предварительного просмотра
    preview: {
        position: { x: 13.4, y: 9.3, z: 0 },
        target: { x: -9, y: 1.5, z: 0 }
    },

    // Настройки для ландшафтной ориентации
    landscape: {
        position: { x: 13.4, y: 9.3, z: 0 },
        target: { x: -9, y: 0.6, z: 0 }
    },

    // Анимация камеры для ландшафтной ориентации
    animation: {
        // Настройки анимации
        fps: 30,
        loopMode: "CYCLE",
        
        // Ключевые точки анимации позиции камеры
        positionKeys: [
            {
                frame: 0,
                position: { x: 10, y: 3.5, z: 10 }
            },
            {
                frame: 150,
                position: { x: 10, y: 8, z: 0 }
            },
            {
                frame: 300,
                position: { x: 10, y: 3.5, z: -10 }
            },
            {
                frame: 450,
                position: { x: 10, y: 8, z: 0 }
            },
            {
                frame: 600,
                position: { x: 10, y: 3.5, z: 10 }
            }
        ],

        // Ключевые точки анимации цели камеры
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

        // Диапазон анимации
        fromFrame: 0,
        toFrame: 600
    }
};

