// Get DOM elements
const fileInput = document.getElementById('fileInput');
const videoPlayer = document.getElementById('videoPlayer');
const canvas = document.getElementById('poseCanvas');
const canvasCtx = canvas.getContext('2d');
const toggleButton = document.getElementById('togglePose');
const statusDiv = document.getElementById('status');
const exportButton = document.getElementById('exportExcel');
const recordingInfo = document.getElementById('recordingInfo');

// Pose detection state
let poseDetectionEnabled = false;
let pose = null;
let videoFrameCallbackId = null;

// Data collection for export
let poseData = [];
let frameCount = 0;

// Joint names mapping (MediaPipe Pose 33 landmarks)
const LANDMARK_NAMES = [
    'nose', 'left_eye_inner', 'left_eye', 'left_eye_outer', 'right_eye_inner',
    'right_eye', 'right_eye_outer', 'left_ear', 'right_ear', 'mouth_left',
    'mouth_right', 'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
    'left_wrist', 'right_wrist', 'left_pinky', 'right_pinky', 'left_index',
    'right_index', 'left_thumb', 'right_thumb', 'left_hip', 'right_hip',
    'left_knee', 'right_knee', 'left_ankle', 'right_ankle', 'left_heel',
    'right_heel', 'left_foot_index', 'right_foot_index'
];

// Initialize MediaPipe Pose (async version)
async function initializePoseAsync() {
    console.log('Initializing MediaPipe Pose...');
    console.log('Checking if Pose class is available:', typeof Pose);
    console.log('Window.Pose:', window.Pose);

    return new Promise((resolve, reject) => {
        try {
            // Check if Pose class is available
            if (typeof Pose === 'undefined') {
                const errorMsg = 'MediaPipe Pose library not loaded. Please refresh the page.';
                console.error(errorMsg);
                alert(errorMsg);
                reject(new Error(errorMsg));
                return;
            }

            pose = new Pose({
                locateFile: (file) => {
                    console.log('Loading file:', file);
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5/${file}`;
                }
            });

            pose.setOptions({
                modelComplexity: 1,
                smoothLandmarks: true,
                enableSegmentation: false,
                smoothSegmentation: false,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            pose.onResults(onPoseResults);

            // MediaPipe Pose loads model files asynchronously
            // We'll consider it ready after setting up callbacks
            console.log('MediaPipe Pose initialized successfully!');

            // Give it a moment to load
            setTimeout(() => {
                resolve();
            }, 1000);

        } catch (error) {
            console.error('Error creating Pose instance:', error);
            console.error('Error details:', error.message, error.stack);
            alert('Failed to initialize pose detection: ' + error.message + '. Check browser console for details.');
            reject(error);
        }
    });
}

// Handle pose detection results
function onPoseResults(results) {
    if (!poseDetectionEnabled) return;

    // Clear canvas
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.poseLandmarks && results.poseLandmarks.length > 0) {
        // Collect data for export (convert normalized coordinates to pixels)
        const frameData = {
            frame: frameCount++,
            timestamp: videoPlayer.currentTime.toFixed(3),
            landmarks: {}
        };

        results.poseLandmarks.forEach((landmark, index) => {
            const jointName = LANDMARK_NAMES[index];
            frameData.landmarks[jointName] = {
                x: Math.round(landmark.x * canvas.width),
                y: Math.round(landmark.y * canvas.height),
                z: landmark.z,
                visibility: landmark.visibility
            };
        });

        poseData.push(frameData);
        updateRecordingInfo();

        // Draw connectors (skeleton) using custom draw function
        drawPoseConnections(canvasCtx, results.poseLandmarks);

        // Draw landmarks (joints) using custom draw function
        drawPoseLandmarks(canvasCtx, results.poseLandmarks);
    }

    canvasCtx.restore();
}

// Process video frame for pose detection (called for every video frame)
async function detectPose(now, metadata) {
    if (!poseDetectionEnabled || !pose) {
        return;
    }

    try {
        // Ensure canvas matches video's native resolution
        if (canvas.width !== videoPlayer.videoWidth || canvas.height !== videoPlayer.videoHeight) {
            canvas.width = videoPlayer.videoWidth;
            canvas.height = videoPlayer.videoHeight;
        }

        // Send frame to pose detection (processes every video frame at native frame rate)
        await pose.send({ image: videoPlayer });

        // Schedule next frame callback (will be called for every video frame)
        if (poseDetectionEnabled && !videoPlayer.paused && !videoPlayer.ended) {
            videoFrameCallbackId = videoPlayer.requestVideoFrameCallback(detectPose);
        }
    } catch (error) {
        console.error('Error in pose detection:', error);
        // Continue with next frame even if this one fails
        if (poseDetectionEnabled && !videoPlayer.paused && !videoPlayer.ended) {
            videoFrameCallbackId = videoPlayer.requestVideoFrameCallback(detectPose);
        }
    }
}

// Toggle pose detection
toggleButton.addEventListener('click', async () => {
    poseDetectionEnabled = !poseDetectionEnabled;

    if (poseDetectionEnabled) {
        toggleButton.textContent = 'Initializing...';
        toggleButton.disabled = true;
        statusDiv.textContent = 'Pose Detection: Initializing...';
        statusDiv.classList.add('active');

        // Initialize pose if not already done
        if (!pose) {
            try {
                await initializePoseAsync();
                console.log('Pose initialized, ready to detect');
            } catch (error) {
                console.error('Failed to initialize pose:', error);
                poseDetectionEnabled = false;
                toggleButton.textContent = 'Enable Pose Detection';
                toggleButton.disabled = false;
                statusDiv.textContent = 'Pose Detection: Failed to Initialize';
                statusDiv.classList.remove('active');
                return;
            }
        }

        toggleButton.textContent = 'Disable Pose Detection';
        toggleButton.disabled = false;
        toggleButton.classList.add('active');
        statusDiv.textContent = 'Pose Detection: ON';

        // Clear previous data and start fresh
        clearPoseData();

        // Start detection if video is playing
        if (!videoPlayer.paused && !videoPlayer.ended) {
            videoFrameCallbackId = videoPlayer.requestVideoFrameCallback(detectPose);
        }
    } else {
        toggleButton.textContent = 'Enable Pose Detection';
        toggleButton.classList.remove('active');
        statusDiv.textContent = 'Pose Detection: OFF';
        statusDiv.classList.remove('active');

        // Clear canvas
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

        // Cancel video frame callback
        if (videoFrameCallbackId) {
            videoPlayer.cancelVideoFrameCallback(videoFrameCallbackId);
            videoFrameCallbackId = null;
        }
    }
});

// Start pose detection when video plays
videoPlayer.addEventListener('play', () => {
    if (poseDetectionEnabled && pose) {
        videoFrameCallbackId = videoPlayer.requestVideoFrameCallback(detectPose);
    }
});

// Stop pose detection when video pauses
videoPlayer.addEventListener('pause', () => {
    if (videoFrameCallbackId) {
        videoPlayer.cancelVideoFrameCallback(videoFrameCallbackId);
        videoFrameCallbackId = null;
    }
});

// Update canvas size when video metadata loads
videoPlayer.addEventListener('loadedmetadata', () => {
    canvas.width = videoPlayer.videoWidth;
    canvas.height = videoPlayer.videoHeight;
});

// Clear data when video restarts (seeking back to beginning)
videoPlayer.addEventListener('seeked', () => {
    // If seeking to near the beginning (within first second) and pose detection is enabled
    // Clear the data to start a fresh recording
    if (poseDetectionEnabled && videoPlayer.currentTime < 1.0 && poseData.length > 0) {
        clearPoseData();
        console.log('Video restarted - pose data cleared for new recording');
    }
});

// Handle custom video file upload
fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];

    if (file) {
        const fileURL = URL.createObjectURL(file);
        videoPlayer.src = fileURL;
        videoPlayer.load();
        videoPlayer.play();

        // Clear previous pose data for new video
        clearPoseData();
    }
});

// Keyboard controls
document.addEventListener('keydown', function(e) {
    switch(e.key) {
        case ' ':
            e.preventDefault();
            if (videoPlayer.paused) {
                videoPlayer.play();
            } else {
                videoPlayer.pause();
            }
            break;
        case 'ArrowRight':
            videoPlayer.currentTime += 5;
            break;
        case 'ArrowLeft':
            videoPlayer.currentTime -= 5;
            break;
        case 'p':
        case 'P':
            // Toggle pose detection with 'P' key
            toggleButton.click();
            break;
    }
});

// Update recording info display
function updateRecordingInfo() {
    if (poseData.length > 0) {
        recordingInfo.textContent = `Recorded: ${poseData.length} frames`;
        recordingInfo.classList.add('recording');
        exportButton.disabled = false;
    } else {
        recordingInfo.textContent = 'No data recorded yet';
        recordingInfo.classList.remove('recording');
        exportButton.disabled = true;
    }
}

// Export pose data to Excel
function exportToExcel() {
    if (poseData.length === 0) {
        alert('No pose data to export. Enable pose detection and play a video first.');
        return;
    }

    // Create Excel data structure
    const excelData = [];

    // Add header row
    const headerRow = ['Frame', 'Timestamp (s)'];
    LANDMARK_NAMES.forEach(name => {
        headerRow.push(`${name}_x`, `${name}_y`);
    });
    excelData.push(headerRow);

    // Add data rows
    poseData.forEach(frameData => {
        const row = [frameData.frame, frameData.timestamp];
        LANDMARK_NAMES.forEach(name => {
            const landmark = frameData.landmarks[name];
            if (landmark) {
                row.push(landmark.x, landmark.y);
            } else {
                row.push('', '');
            }
        });
        excelData.push(row);
    });

    // Create worksheet and workbook
    const ws = XLSX.utils.aoa_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pose Data');

    // Generate filename with timestamp
    const now = new Date();
    const filename = `pose_coordinates_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}.xlsx`;

    // Download file
    XLSX.writeFile(wb, filename);

    alert(`Exported ${poseData.length} frames to ${filename}`);
}

// Clear pose data when starting new detection
function clearPoseData() {
    poseData = [];
    frameCount = 0;
    updateRecordingInfo();
}

// Export button click handler
exportButton.addEventListener('click', exportToExcel);

// Initialize export button state
updateRecordingInfo();

// Helper function to draw pose connections (skeleton)
function drawPoseConnections(ctx, landmarks) {
    POSE_CONNECTIONS.forEach(([start, end]) => {
        const startPoint = landmarks[start];
        const endPoint = landmarks[end];

        if (startPoint && endPoint && startPoint.visibility > 0.5 && endPoint.visibility > 0.5) {
            ctx.beginPath();
            ctx.strokeStyle = '#00FF00';
            ctx.lineWidth = 4;
            ctx.moveTo(startPoint.x * canvas.width, startPoint.y * canvas.height);
            ctx.lineTo(endPoint.x * canvas.width, endPoint.y * canvas.height);
            ctx.stroke();
        }
    });
}

// Helper function to draw pose landmarks (joints)
function drawPoseLandmarks(ctx, landmarks) {
    landmarks.forEach((landmark) => {
        if (landmark.visibility > 0.5) {
            ctx.beginPath();
            ctx.arc(
                landmark.x * canvas.width,
                landmark.y * canvas.height,
                6,
                0,
                2 * Math.PI
            );
            ctx.fillStyle = '#FF0000';
            ctx.fill();
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    });
}

// MediaPipe Pose connections
const POSE_CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5],
    [5, 6], [6, 8], [9, 10], [11, 12], [11, 13],
    [13, 15], [15, 17], [15, 19], [15, 21], [17, 19],
    [12, 14], [14, 16], [16, 18], [16, 20], [16, 22],
    [18, 20], [11, 23], [12, 24], [23, 24], [23, 25],
    [24, 26], [25, 27], [26, 28], [27, 29], [28, 30],
    [29, 31], [30, 32], [27, 31], [28, 32]
];
