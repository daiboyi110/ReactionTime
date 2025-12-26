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
let animationFrameId = null;
let lastProcessedTime = -1;

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

// Initialize MediaPipe Pose
function initializePose() {
    pose = new Pose({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
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
}

// Handle pose detection results
function onPoseResults(results) {
    if (!poseDetectionEnabled) return;

    // Clear canvas
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.poseLandmarks) {
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

        // Draw connectors (skeleton)
        drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
            color: '#00FF00',
            lineWidth: 4
        });

        // Draw landmarks (joints)
        drawLandmarks(canvasCtx, results.poseLandmarks, {
            color: '#FF0000',
            lineWidth: 2,
            radius: 6
        });
    }

    canvasCtx.restore();
}

// Process video frame for pose detection
async function detectPose() {
    if (!poseDetectionEnabled || videoPlayer.paused || videoPlayer.ended) {
        return;
    }

    // Only process if we've moved to a new frame (respects video's native frame rate)
    const currentTime = videoPlayer.currentTime;
    if (currentTime !== lastProcessedTime) {
        lastProcessedTime = currentTime;

        // Ensure canvas matches video's native resolution
        if (canvas.width !== videoPlayer.videoWidth || canvas.height !== videoPlayer.videoHeight) {
            canvas.width = videoPlayer.videoWidth;
            canvas.height = videoPlayer.videoHeight;
        }

        // Send frame to pose detection at video's actual sampling rate
        await pose.send({ image: videoPlayer });
    }

    // Schedule next check
    animationFrameId = requestAnimationFrame(detectPose);
}

// Toggle pose detection
toggleButton.addEventListener('click', () => {
    poseDetectionEnabled = !poseDetectionEnabled;

    if (poseDetectionEnabled) {
        toggleButton.textContent = 'Disable Pose Detection';
        toggleButton.classList.add('active');
        statusDiv.textContent = 'Pose Detection: ON';
        statusDiv.classList.add('active');

        // Initialize pose if not already done
        if (!pose) {
            initializePose();
        }

        // Clear previous data and start fresh
        clearPoseData();

        // Reset time tracking to start fresh
        lastProcessedTime = -1;

        // Start detection if video is playing
        if (!videoPlayer.paused) {
            detectPose();
        }
    } else {
        toggleButton.textContent = 'Enable Pose Detection';
        toggleButton.classList.remove('active');
        statusDiv.textContent = 'Pose Detection: OFF';
        statusDiv.classList.remove('active');

        // Clear canvas
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

        // Cancel animation frame
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }

        // Reset time tracking
        lastProcessedTime = -1;
    }
});

// Start pose detection when video plays
videoPlayer.addEventListener('play', () => {
    if (poseDetectionEnabled && pose) {
        lastProcessedTime = -1; // Reset to ensure we process from current position
        detectPose();
    }
});

// Stop pose detection when video pauses
videoPlayer.addEventListener('pause', () => {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
});

// Update canvas size when video metadata loads
videoPlayer.addEventListener('loadedmetadata', () => {
    canvas.width = videoPlayer.videoWidth;
    canvas.height = videoPlayer.videoHeight;
});

// Handle custom video file upload
fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];

    if (file) {
        const fileURL = URL.createObjectURL(file);
        videoPlayer.src = fileURL;
        videoPlayer.load();
        videoPlayer.play();

        // Reset time tracking for new video
        lastProcessedTime = -1;

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

// Helper function to draw connectors
function drawConnectors(ctx, landmarks, connections, style) {
    connections.forEach(([start, end]) => {
        const startPoint = landmarks[start];
        const endPoint = landmarks[end];

        if (startPoint && endPoint) {
            ctx.beginPath();
            ctx.strokeStyle = style.color;
            ctx.lineWidth = style.lineWidth;
            ctx.moveTo(startPoint.x * canvas.width, startPoint.y * canvas.height);
            ctx.lineTo(endPoint.x * canvas.width, endPoint.y * canvas.height);
            ctx.stroke();
        }
    });
}

// Helper function to draw landmarks
function drawLandmarks(ctx, landmarks, style) {
    landmarks.forEach((landmark) => {
        ctx.beginPath();
        ctx.arc(
            landmark.x * canvas.width,
            landmark.y * canvas.height,
            style.radius,
            0,
            2 * Math.PI
        );
        ctx.fillStyle = style.color;
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = style.lineWidth;
        ctx.stroke();
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
