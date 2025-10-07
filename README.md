# Basketball Scene Configuration and External Data

This document describes the configuration system and external data handling for the basketball scene application.

## Configuration System

The application uses a modular configuration system located in the `js/config/` directory.

### Device Configuration (`js/config/device.js`)

The device configuration system provides adaptive settings based on device type, orientation, and capabilities.

#### Device Types

- **Mobile**: Optimized for touch devices with simplified UI and reduced quality
- **Tablet**: Balanced settings for tablet devices
- **Desktop**: Full-featured settings with maximum quality
- **WebView**: Special settings for embedded applications

#### Configuration Structure

```javascript
DEVICE_CONFIG = {
    mobile: {
        camera: {
            position: { x: 8, y: 4, z: 8 },
            target: { x: -8.5, y: 0, z: 0.8 },
            animationSpeed: 0.8
        },
        performance: {
            quality: 'medium',
            disableEffects: ['shadows', 'reflections']
        }
    },
    // ... other device types
}
```

#### Key Features

- **Automatic device detection**: Determines device type and applies appropriate settings
- **Orientation support**: Separate configurations for portrait and landscape modes
- **Performance optimization**: Automatic quality adjustment based on device capabilities
- **Feature detection**: Checks for WebGL, touch support, fullscreen, etc.

### Camera Configuration (`js/config/camera/`)

The camera system provides different configurations for various orientations and use cases.

#### Available Configurations

- **Default/Landscape** (`default.js`): Standard camera setup for landscape orientation
- **Portrait** (`portrait.js`): Optimized for portrait orientation with wider FOV

#### Camera Configuration Structure

```javascript
CAMERA_CONFIG = {
    initial: {
        name: "camera1",
        alpha: 10,
        beta: 10,
        radius: 10,
        target: { x: -8.5, y: 0, z: 0.8 },
        minZ: 0.5,
        maxZ: 100,
        fov: 45
    },
    animation: {
        fps: 30,
        loopMode: "CYCLE",
        positionKeys: [
            { frame: 0, position: { x: 10, y: 3.5, z: 10 } },
            // ... more keyframes
        ],
        targetKeys: [
            { frame: 0, target: { x: -8.5, y: 0, z: 0.8 } },
            // ... more keyframes
        ],
        fromFrame: 0,
        toFrame: 600
    }
}
```

#### Camera Features

- **Automatic orientation detection**: Uses screen dimensions and orientation API
- **URL parameter override**: Supports `?cameraConfig=portrait` for manual configuration
- **Animation keyframes**: Smooth camera movement with customizable paths
- **Multiple presets**: Development, preview, and production settings

## External Data Service (`js/services/external.js`)

The ExternalService handles fetching and processing external data from the API.

### Data Sources

The service fetches data from multiple endpoints:

- **Scene Settings**: `/v2/hype/public/graphics/team/externalfan/scene?teamId={teamId}`
- **Sponsor Images**: `/v2/team/public/{teamId}/sponsor/graphics/stream?sponsorId={sponsorId}&filePath={filePath}`
- **General Images**: `/v2/hype/public/graphics/scene/image/stream?filePath={filePath}`

### Input Parameters

The service accepts the following URL parameters:

- `gameId` (required): Unique identifier for the game
- `teamId` (required): Team identifier for fetching team-specific data
- `playerId` (optional): Player identifier for player-specific content
- `cameraConfig` (optional): Override camera configuration (`portrait`, `landscape`, `default`)

### Data Structure

The service processes and returns data in the following format:

#### Scene Objects

The service parses scene objects with the following types:

**Colors:**
- `COLOR_COURT`: Court surface color
- `COLOR_SEATS`: Seating area color
- `COLOR_SHOT_MADE`: Color for successful shots
- `COLOR_SHOT_MISS`: Color for missed shots
- `COLOR_SHOT_TRAILER`: Color for shot trajectory
- `COLOR_WALL_LOWER`: Lower wall color
- `COLOR_WALL_UPPER`: Upper wall color

**Images:**
- `IMAGE_CENTER_COURT`: Center court logo/image
- `IMAGE_COURT`: Court surface texture
- `IMAGE_HOOP`: Basketball hoop branding
- `IMAGE_TUNNEL_LEFT`: Left tunnel branding
- `IMAGE_TUNNEL_RIGHT`: Right tunnel branding
- `IMAGE_WALL_LOWER`: Lower wall branding
- `IMAGE_WALL_UPPER`: Upper wall branding

**Sport:**
- `SPORT`: Sport type (e.g., "BASKETBALL")

#### Output Data Structure

```javascript
{
    userLevel: "A",
    screensShow: "Full team",
    screensTeam: 'home',
    type: 'shotMap',
    
    // Player data
    screensPlayer: {
        id: parseInt(playerId),
        display_name: "Player Name",
        jersey_number: 0
    },
    
    // Team identifiers
    homeTeamId: parseInt(teamId),
    opponentTeamId: null,
    teamId: parseInt(teamId),
    sport: "BASKETBALL",
    gameId: gameId,
    
    // Color array in API format
    colors: [
        {
            objectName: "COLOR_COURT",
            objectSetting: "#2d2d35"
        },
        // ... more colors
    ],
    
    // Sponsor images
    selectedUpperSponsorImage: { /* sponsor data */ },
    selectedLowerSponsorImage: { /* sponsor data */ },
    selectedHoopStanchionSponsorImage: { /* sponsor data */ },
    selectedCenterCourtSponsorImage: { /* sponsor data */ },
    selectedLeftTunnelSponsorImage: { /* sponsor data */ },
    selectedRightTunnelSponsorImage: { /* sponsor data */ },
    
    // Team and player images
    court: "image_url",
    logoOpponent: "image_url",
    logoHome: "image_url",
    logoTunnel: "image_url",
    screensLeft: "image_url",
    screensCenter: "image_url",
    screensRight: "image_url"
}
```

### Key Features

- **Automatic data fetching**: Retrieves all necessary data from API endpoints
- **Data parsing**: Converts API responses into application-ready format
- **Local storage integration**: Saves processed data to localStorage
- **Sponsor image handling**: Manages sponsor graphics and branding
- **Player-specific content**: Supports individual player images and data
- **Error handling**: Comprehensive error handling with fallbacks
- **Camera integration**: Automatically applies appropriate camera configuration

### Usage

```javascript
// Initialize from URL parameters
const externalService = new ExternalService(app);
externalService.initializeFromParams();

// Or manually fetch data
await externalService.fetchExternalDataAndUpdateLocalStorage(gameId, teamId, playerId);
```

### Error Handling

The service includes comprehensive error handling:

- **Network errors**: Graceful handling of API failures
- **Data validation**: Checks for required fields and data types
- **Fallback values**: Provides default values for missing data
- **Console logging**: Detailed error information for debugging

### Performance Considerations

- **Caching**: Data is cached in localStorage for faster subsequent loads
- **Image optimization**: Images are loaded on-demand with proper URL generation
- **Memory management**: Efficient handling of large image datasets
- **Loading states**: Visual feedback during data fetching operations

## 403 Error Page Configuration (`js/config/errors.js`)

Simple configuration system for customizing the 403 error page message.

### Configuration Structure

```javascript
export const ERROR_403_CONFIG = {
    message: "Invalid Credentials - please try again",
    description: "Access to this resource is restricted. Please check your credentials and try again."
};
```

### Usage

#### Static Configuration

Edit `js/config/errors.js` to modify the default error message:

```javascript
export const ERROR_403_CONFIG = {
    message: "Your custom 403 message",
    description: "Your custom description"
};
```

#### URL Parameters

Pass custom messages via URL parameters:

```
/403.html?message=Custom%20Message&description=Custom%20Description
```

### Error Page Features

The 403.html page includes:

- **Responsive Design**: Works on all device sizes
- **Modern UI**: Glassmorphism design with gradient backgrounds
- **Basketball Theme**: Sport-specific styling and icons
- **Fallback Text**: Default message if no custom message is provided
- **URL Parameter Support**: Dynamic message loading from URL parameters
