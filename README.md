# Video Player with Pose Detection

A modern web-based video player with real-time human pose estimation capabilities.

## Features

- ✨ Clean, modern design with gradient background
- 🎬 HTML5 video player with standard controls
- 🤸 **Real-time pose detection** using MediaPipe Pose
- 🦴 **Skeleton visualization** showing body joint locations
- 📊 **Export to Excel** - Export x,y coordinates of all joints in pixels to Excel file
- 📁 Load custom video files from your device
- ⌨️ Keyboard controls:
  - **Space**: Play/Pause
  - **Arrow Right**: Skip forward 5 seconds
  - **Arrow Left**: Rewind 5 seconds
  - **P**: Toggle pose detection on/off
- 🎯 Toggle pose detection on/off with button
- 📱 Responsive design for mobile and desktop

## How to Use

1. **Open the app**: Simply open `index.html` in your web browser
2. **Load a video**: Use the file input to select a video from your device (preferably with people in it)
3. **Play the video**: The video will automatically start playing after selection
4. **Enable pose detection**: Click the "Enable Pose Detection" button or press 'P'
5. **Watch the magic**: See skeleton overlay showing detected body joints in real-time!
6. **Export data**: Click "Export Coordinates to Excel" to download an Excel file with all joint positions

## Supported Video Formats

The app supports all video formats that your browser supports, including:
- MP4
- WebM
- Ogg

## Pose Detection

The app uses **MediaPipe Pose**, a state-of-the-art machine learning solution for real-time human pose estimation. When enabled, it:

- Detects 33 body landmarks (joints) including face, torso, arms, and legs
- Draws green skeleton lines connecting the joints
- Shows red circles at each joint location
- Works in real-time as the video plays
- Automatically adjusts to different body positions and camera angles

### What it detects:
- Face (eyes, ears, nose, mouth)
- Upper body (shoulders, elbows, wrists)
- Torso (hips)
- Lower body (knees, ankles, feet)

## Excel Export

The app can export all detected joint coordinates to an Excel (.xlsx) file for further analysis.

### Export Format:
- **Column 1**: Frame number (sequential count)
- **Column 2**: Timestamp in seconds
- **Columns 3+**: X and Y coordinates in pixels for each of the 33 joints

### Joint Coordinates:
Each joint has two columns:
- `{joint_name}_x`: Horizontal position in pixels (from left edge of video)
- `{joint_name}_y`: Vertical position in pixels (from top edge of video)

### Usage:
1. Enable pose detection and play your video
2. The app will record all detected poses automatically
3. Click "Export Coordinates to Excel" when done
4. The file will download with timestamp in filename (e.g., `pose_coordinates_20251226_143045.xlsx`)

### Use Cases:
- Biomechanical analysis
- Sports performance tracking
- Gesture recognition research
- Animation reference data
- Physical therapy assessment

## Files

- `index.html` - Main HTML structure with MediaPipe integration
- `style.css` - Styling, layout, and canvas overlay
- `script.js` - Pose detection logic, file loading, and keyboard controls
- `video-player-standalone.html` - Self-contained single-file version

## Customization

You can customize:
- **Colors**: Modify the skeleton (green) and joint (red) colors in `script.js:44-53`
- **Detection sensitivity**: Adjust `minDetectionConfidence` and `minTrackingConfidence` in `script.js:27-28`
- **Line thickness**: Change `lineWidth` values for skeleton and joints
