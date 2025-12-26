// Get DOM elements
const fileInput = document.getElementById('fileInput');
const videoPlayer = document.getElementById('videoPlayer');
const canvas = document.getElementById('poseCanvas');
const canvasCtx = canvas.getContext('2d');
const toggleButton = document.getElementById('togglePose');
const statusDiv = document.getElementById('status');

// Pose detection state
let poseDetectionEnabled = false;
let pose = null;
let animationFrameId = null;
let lastProcessedTime = -1;

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
