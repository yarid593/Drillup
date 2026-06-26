import cv2
import mediapipe as mp

mp_pose = mp.solutions.pose
pose = mp_pose.Pose(
    static_image_mode=False,
    model_complexity=1,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

def analyze_video(video_path):

    cap = cv2.VideoCapture(video_path)

    total_frames = 0
    detected_frames = 0

    while cap.isOpened():

        success, frame = cap.read()

        if not success:
            break

        total_frames += 1

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        results = pose.process(rgb)

        if results.pose_landmarks:
            detected_frames += 1

    cap.release()

    score = round((detected_frames / max(total_frames, 1)) * 100, 2)

    return {
        "score": score,
        "frames": total_frames,
        "detected": detected_frames,
        "feedback": [
            "Pose detectada correctamente"
            if score > 70
            else "Debe mejorar la visibilidad del cuerpo"
        ]
    }