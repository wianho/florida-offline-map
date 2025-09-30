# Florida Offline Map

Lightweight PWA for offline Florida maps with GPS support.

## Quick Start

### 1. Test it now (online)
```bash
cd C:/your/project/folder/florida-offline-map
python -m http.server 8000
```
Then open: http://localhost:8000

### 2. Download Offline Map Tiles (Optional - for true offline use)

**Option A: OpenStreetMap tiles (recommended)**
```bash
# Install tile downloader
npm install -g mbutil tl

# Download Florida tiles (zoom levels 7-15, ~500MB)
tl copy \
  --bounds="-87.634643,24.523096,-80.031362,31.000888" \
  --minzoom=7 \
  --maxzoom=15 \
  "https://tile.openstreetmap.org/{z}/{x}/{y}.png" \
  florida-tiles.mbtiles
```

**Option B: Use existing tile services**
- Download pre-made MBTiles from https://openmaptiles.org/downloads/north-america/us/florida/
- Or use https://github.com/onthegomap/planetiler to generate custom tiles

### 3. Set up offline tiles in the app
Once you have `florida-tiles.mbtiles`, update `index.html` line 67 to point to a local tile server or convert to directory tiles.

## Features
- ✅ Works offline after first load
- ✅ GPS "you are here" marker
- ✅ Add to home screen (mobile)
- ✅ Lightweight (~500KB without map tiles)
- 📍 Centered on Florida
- 📱 Mobile-optimized

## Browser Requirements
- Modern browser with Service Worker support
- For offline: Chrome/Edge/Safari (iOS 11.3+)

## Project Structure
```
florida-offline-map/
├── index.html          # Main map interface
├── service-worker.js   # Enables offline mode
├── manifest.json       # PWA config for "Add to Home Screen"
└── README.md          # This file
```

## Next Steps
1. Add app icons (icon-192.png, icon-512.png)
2. Integrate offline MBTiles
3. Add search functionality
4. Add POI markers
5. Deploy to GitHub Pages or host locally

## Deployment Options
- **Local hosting**: Python HTTP server, Node.js serve, etc.
- **GitHub Pages**: Free hosting, works great for PWAs
- **Self-hosted**: Any web server (nginx, Apache)

## Offline Map Data Sources
- **OpenStreetMap**: Free, community-maintained
- **USGS Topographic**: High-detail terrain maps
- **Mapbox**: Requires API key but excellent quality
