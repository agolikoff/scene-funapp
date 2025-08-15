import {
    BaseService
} from "./base.js";

export class ExternalService extends BaseService {
    
    /**
     * Parse scene objects array into usable data structure
     */
    parseSceneObjects(sceneObjects) {
        const settings = {};
        
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
            const sceneUrl = `${this.app.baseURL}/hype/public/graphics/team/externalfan/scene?teamId=${teamId}`;
            const sceneResponse = await fetch(sceneUrl);
            if (!sceneResponse.ok) {
                throw new Error(`Failed to fetch scene settings: ${sceneResponse.status}`);
            }
            const sceneData = await sceneResponse.json();
            
            // Parse scene objects
            const sceneSettings = this.parseSceneObjects(sceneData.sceneObjects);
            
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
            
            // Combine scene settings with player data in the expected airData format
            const combinedData = {
                type: 'external',
                screensTeam: 'home',
                gameId: gameId,
                teamId: teamId,
                court: sceneSettings.courtImageId ? this.getImageUrl(sceneSettings.courtImageId) : null,
                
                // Team logos
                logoHome: teamImages.TEAM_LOGO_HOME || teamImages.TEAM_LOGO || null,
                logoTunnel: teamImages.TEAM_LOGO_TUNNEL || teamImages.TEAM_LOGO || null,
                logoOpponent: teamImages.TEAM_LOGO_OPPONENT || null,
                
                // Screen content - Player images take priority, then team images, then TEAM_LOGO as fallback
                screensLeft: currentPlayerImages.PLAYER_LEFT || teamImages.TEAM_LEFT || teamImages.TEAM_LOGO,
                screensCenter: currentPlayerImages.PLAYER_CENTER || teamImages.TEAM_CENTER || teamImages.TEAM_LOGO,
                screensRight: currentPlayerImages.PLAYER_RIGHT || teamImages.TEAM_RIGHT || teamImages.TEAM_LOGO,
                
                // Sponsor/team images using the expected property names
                selectedLeftTunnelSponsorImage: teamImages.TEAM_TUNNEL_LEFT || 
                           (sceneSettings.leftTunnelSetting === 'Sponsor' && sceneSettings.leftTunnelImageId ? 
                            this.getImageUrl(sceneSettings.leftTunnelImageId) : teamImages.TEAM_LOGO),
                selectedRightTunnelSponsorImage: teamImages.TEAM_TUNNEL_RIGHT || 
                            (sceneSettings.rightTunnelSetting === 'Sponsor' && sceneSettings.rightTunnelImageId ? 
                             this.getImageUrl(sceneSettings.rightTunnelImageId) : teamImages.TEAM_LOGO),
                selectedLowerSponsorImage: teamImages.TEAM_WALL_LOWER || 
                          (sceneSettings.lowerWallSetting === 'Sponsor' && sceneSettings.lowerWallImageId ? 
                           this.getImageUrl(sceneSettings.lowerWallImageId) : teamImages.TEAM_LOGO),
                selectedUpperSponsorImage: teamImages.TEAM_WALL_UPPER || 
                          (sceneSettings.upperWallSetting === 'Sponsor' && sceneSettings.upperWallImageId ? 
                           this.getImageUrl(sceneSettings.upperWallImageId) : teamImages.TEAM_LOGO),
                selectedCenterCourtSponsorImage: teamImages.TEAM_CENTER_COURT || 
                       (sceneSettings.centerCourt === 'Yes' ? teamImages.TEAM_LOGO : null),
                selectedHoopStanchionSponsorImage: teamImages.TEAM_HOOP || 
                      (sceneSettings.hoopSetting === 'Sponsor' && sceneSettings.hoopImageId ? 
                       this.getImageUrl(sceneSettings.hoopImageId) : teamImages.TEAM_LOGO),
                
                // Colors
                colors: {
                    courtColor: sceneSettings.courtColor,
                    seatsColor: sceneSettings.seatsColor,
                    shotMadeColor: sceneSettings.shotMadeColor,
                    shotMissColor: sceneSettings.shotMissColor,
                    shotTrailerColor: sceneSettings.shotTrailerColor,
                    lowerWallColor: sceneSettings.lowerWallColor,
                    upperWallColor: sceneSettings.upperWallColor
                },
                
                // Player data
                screensPlayer: playerId ? {
                    id: playerId,
                    images: currentPlayerImages
                } : null,
                
                logoScreen: null,
                userLevel: 'external',
                
                // Additional data for reference (not in original airData structure)
                _meta: {
                    allPlayerImages: allPlayerImages,
                    teamImages: teamImages,
                    sceneSettings: sceneSettings
                }
            };
            
            const jsonString = JSON.stringify(combinedData);
            window.localStorage.setItem('air', jsonString);
            console.log('External data updated and saved to local storage', combinedData);
            
            showLoadingScreen("Loading external data...");
            updateAllServices(); 
            hideLoadingScreenAfterDelay(500);
            
            if (!this.app.IS_PREVIEW) {
                this.app.scene.beginAnimation(this.app.camera, 0, 600, true);
            }
            
        } catch (error) {
            console.error('Error fetching external data:', error);
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
