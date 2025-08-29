import {
    BaseService
} from "./base.js";
import { safeSetItem, getStorageType } from "../helpers/localStorage.js";

export class ExternalService extends BaseService {
    
    /**
     * Parse scene objects array into usable data structure
     */
    parseSceneObjects(sceneObjects) {
        const settings = {};
        
        if (!sceneObjects || !Array.isArray(sceneObjects)) {
            console.warn('sceneObjects is not an array or is undefined:', sceneObjects);
            return settings;
        }
        
        sceneObjects.forEach(obj => {
            switch(obj.objectName) {
                // Colors
                case 'COLOR_COURT':
                    settings.courtColor = obj.objectSetting;
                    break;
                case 'COLOR_SEATS':
                    settings.seatsColor = obj.objectSetting;
                    break;
                case 'COLOR_SHOT_MADE':
                    settings.shotMadeColor = obj.objectSetting;
                    break;
                case 'COLOR_SHOT_MISS':
                    settings.shotMissColor = obj.objectSetting;
                    break;
                case 'COLOR_SHOT_TRAILER':
                    settings.shotTrailerColor = obj.objectSetting;
                    break;
                case 'COLOR_WALL_LOWER':
                    settings.lowerWallColor = obj.objectSetting;
                    break;
                case 'COLOR_WALL_UPPER':
                    settings.upperWallColor = obj.objectSetting;
                    break;
                
                // Images
                case 'IMAGE_CENTER_COURT':
                    settings.centerCourt = obj.objectSetting;
                    break;
                case 'IMAGE_COURT':
                    if (obj.objectId) {
                        settings.courtImageId = obj.objectId;
                    }
                    break;
                case 'IMAGE_HOOP':
                    settings.hoopSetting = obj.objectSetting;
                    settings.hoopImageId = obj.objectId;
                    break;
                case 'IMAGE_TUNNEL_LEFT':
                    settings.leftTunnelSetting = obj.objectSetting;
                    settings.leftTunnelImageId = obj.objectId;
                    break;
                case 'IMAGE_TUNNEL_RIGHT':
                    settings.rightTunnelSetting = obj.objectSetting;
                    settings.rightTunnelImageId = obj.objectId;
                    break;
                case 'IMAGE_WALL_LOWER':
                    settings.lowerWallSetting = obj.objectSetting;
                    settings.lowerWallImageId = obj.objectId;
                    break;
                case 'IMAGE_WALL_UPPER':
                    settings.upperWallSetting = obj.objectSetting;
                    settings.upperWallImageId = obj.objectId;
                    break;
                
                // Sport
                case 'SPORT':
                    settings.sport = obj.objectSetting;
                    break;
            }
        });
        
        return settings;
    }

    /**
     * Get image URL from file path
     */
    getImageUrl(filePath) {
        if (!filePath) return null;
        return `${this.app.baseURL}/v2/hype/public/graphics/scene/image/stream?filePath=${filePath}`;
    }

    /**
     * Fetch external data and update localStorage (similar to static mode)
     */
    async fetchExternalDataAndUpdateLocalStorage(gameId, teamId, playerId = null) {
        try {
            // Fetch scene settings
            const sceneUrl = `${this.app.baseURL}/v2/hype/public/graphics/team/externalfan/scene?teamId=${teamId}`;
            const sceneResponse = await fetch(sceneUrl);
            if (!sceneResponse.ok) {
                throw new Error(`Failed to fetch scene settings: ${sceneResponse.status}`);
            }
            const sceneData = await sceneResponse.json();
            console.log('Scene data received:', sceneData);
            
            // Parse scene objects - API returns { data: { sceneObjects: [...] } }
            const sceneSettings = this.parseSceneObjects(sceneData.data?.sceneObjects);
            
            // Fetch all images (team and players)
            let teamImages = {};
            let allPlayerImages = {}; // Group by playerId
            let currentPlayerImages = {}; // Images for the current playerId
            
            try {
                const imagesUrl = `${this.app.baseURL}/v2/hype/public/graphics/scene/images?teamId=${teamId}`;
                const imagesResponse = await fetch(imagesUrl);
                if (imagesResponse.ok) {
                    const imagesData = await imagesResponse.json();
                    if (imagesData.data && Array.isArray(imagesData.data)) {
                        imagesData.data.forEach(img => {
                            const imageUrl = this.getImageUrl(img.imagePath);
                            
                            if (!img.playerId) {
                                // Team images (playerId is null)
                                teamImages[img.imageType] = imageUrl;
                            } else {
                                // Player images - group by playerId
                                if (!allPlayerImages[img.playerId]) {
                                    allPlayerImages[img.playerId] = {};
                                }
                                allPlayerImages[img.playerId][img.imageType] = imageUrl;
                                
                                // If this is the current player, also add to currentPlayerImages
                                if (playerId && img.playerId == playerId) {
                                    currentPlayerImages[img.imageType] = imageUrl;
                                }
                            }
                        });
                    }
                }
            } catch (error) {
                console.warn('Error fetching images:', error);
            }
            
            // Helper function to create sponsor image object
            const createSponsorImageObject = (setting, imageId, graphicType) => {
                if (setting === 'Sponsor' && imageId) {
                    return {
                        sponsorId: imageId,
                        graphicPathFilename: `teamsponsor/187665/${teamId}/${graphicType}` // This would need to be dynamic based on actual sponsor data
                    };
                }
                return null;
            };

            // Combine scene settings with player data in the expected airData format
            const combinedData = {
                userLevel: "A",
                screensShow: "Full team",
                screensTeam: 'home',
                type: 'shotMap',
                
                // Player data with expected structure
                screensPlayer: playerId ? {
                    id: parseInt(playerId),
                    display_name: "Player Name", // Would need to fetch from player data
                    jersey_number: 0 // Would need to fetch from player data
                } : null,
                
                // Team IDs
                homeTeamId: parseInt(teamId),
                opponentTeamId: null, // Would need to be provided
                teamId: parseInt(teamId),
                sport: sceneSettings.sport || "BASKETBALL",
                gameId: gameId,
                
                // Colors array in original API format
                colors: [
                    {
                        objectName: "COLOR_COURT",
                        objectSetting: sceneSettings.courtColor || "#2d2d35"
                    },
                    {
                        objectName: "COLOR_SEATS", 
                        objectSetting: sceneSettings.seatsColor || "#6b6b68"
                    },
                    {
                        objectName: "COLOR_SHOT_MADE",
                        objectSetting: sceneSettings.shotMadeColor || "#00D578"
                    },
                    {
                        objectName: "COLOR_SHOT_MISS",
                        objectSetting: sceneSettings.shotMissColor || "#ED1C24"
                    },
                    {
                        objectName: "COLOR_SHOT_TRAILER",
                        objectSetting: sceneSettings.shotTrailerColor || "#00D578"
                    },
                    {
                        objectName: "COLOR_WALL_LOWER",
                        objectSetting: sceneSettings.lowerWallColor || "#6b6b68"
                    },
                    {
                        objectName: "COLOR_WALL_UPPER", 
                        objectSetting: sceneSettings.upperWallColor || "#c4c3c3"
                    }
                ],
                
                // Sponsor images in expected format
                selectedUpperSponsorImage: createSponsorImageObject(sceneSettings.upperWallSetting, sceneSettings.upperWallImageId, "WALL"),
                selectedLowerSponsorImage: createSponsorImageObject(sceneSettings.lowerWallSetting, sceneSettings.lowerWallImageId, "WALL"), 
                selectedHoopStanchionSponsorImage: createSponsorImageObject(sceneSettings.hoopSetting, sceneSettings.hoopImageId, "WALL"),
                selectedCenterCourtSponsorImage: sceneSettings.centerCourt || "No",
                selectedLeftTunnelSponsorImage: createSponsorImageObject(sceneSettings.leftTunnelSetting, sceneSettings.leftTunnelImageId, "TUNNEL"),
                selectedRightTunnelSponsorImage: createSponsorImageObject(sceneSettings.rightTunnelSetting, sceneSettings.rightTunnelImageId, "TUNNEL"),
                
                // Images
                court: sceneSettings.courtImageId ? this.getImageUrl(sceneSettings.courtImageId) : null,
                logoOpponent: teamImages.TEAM_LOGO_OPPONENT || null,
                logoHome: teamImages.TEAM_LOGO_HOME || teamImages.TEAM_LOGO || null,
                logoTunnel: teamImages.TEAM_LOGO_TUNNEL || teamImages.TEAM_LOGO || null,
                
                // Screen content - Player images take priority, then team images, then TEAM_LOGO as fallback
                screensLeft: currentPlayerImages.PLAYER_LEFT || teamImages.TEAM_LEFT || teamImages.TEAM_LOGO,
                screensCenter: currentPlayerImages.PLAYER_CENTER || teamImages.TEAM_CENTER || teamImages.TEAM_LOGO,
                screensRight: currentPlayerImages.PLAYER_RIGHT || teamImages.TEAM_RIGHT || teamImages.TEAM_LOGO,
                
                // Additional data for reference (not in original airData structure)
                _meta: {
                    allPlayerImages: allPlayerImages,
                    teamImages: teamImages,
                    sceneSettings: sceneSettings
                }
            };
            
            const jsonString = JSON.stringify(combinedData);
            const success = await safeSetItem('air', jsonString);
            const storageType = await getStorageType();
            
            if (success) {
                console.log(`External data updated and saved to ${storageType}`, combinedData);
            } else {
                console.error(`Не удалось сохранить данные в ${storageType}`);
            }
            
            window.showLoadingScreen("Loading external data...");
            await window.updateAllServices(); 
            window.hideLoadingScreenAfterDelay(500);
            
            if (!this.app.IS_PREVIEW) {
                this.app.scene.beginAnimation(this.app.camera, 0, 600, true);
            }
            
        } catch (error) {
            console.error('Error fetching external data:', error);
            console.error('Error details:', {
                gameId,
                teamId,
                playerId,
                sceneUrl: `${this.app.baseURL}/v2/hype/public/graphics/team/externalfan/scene?teamId=${teamId}`,
                imagesUrl: `${this.app.baseURL}/v2/hype/public/graphics/scene/images?teamId=${teamId}`
            });
        }
    }

    /**
     * Initialize external mode from URL parameters
     */
    initializeFromParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const gameId = urlParams.get('gameId');
        const teamId = urlParams.get('teamId');
        const playerId = urlParams.get('playerId');
        
        if (gameId && teamId) {
            this.fetchExternalDataAndUpdateLocalStorage(gameId, teamId, playerId);
        } else {
            console.error('Missing required parameters for external mode: gameId, teamId');
        }
    }
}
