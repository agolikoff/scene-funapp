/**
 * Конфигурация камеры для планшетов
 * Пример динамической конфигурации
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
        
        // Поле зрения камеры (в градусах) - среднее для планшетов
        fov: 55
    },

    // Настройки для режима разработки
    dev: {
        position: { x: 18, y: 14, z: 0 },
        target: { x: -9, y: 0.6, z: 0 }
    },

    // Настройки для режима предварительного просмотра
    preview: {
        position: { x: 18, y: 14, z: 0 },
        target: { x: -9, y: 1.5, z: 0 }
    },

    // Настройки для планшетов
    tablet: {
        position: { x: 18, y: 14, z: 0 },
        target: { x: -9, y: 0.6, z: 0 }
    },

    // Анимация камеры для планшетов
    animation: {
        // Настройки анимации
        fps: 30,
        loopMode: "CYCLE",
        
        // Ключевые точки анимации позиции камеры для планшетов
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

        // Ключевые точки анимации цели камеры для планшетов
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
