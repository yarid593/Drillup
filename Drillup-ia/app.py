from fastapi import FastAPI, UploadFile, File, Form
import shutil
import os

from services.mediapipe_service import analyze_video

app = FastAPI()

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@app.get("/")
def root():
    return {
        "message": "DrillUp AI funcionando"
    }


@app.post("/analyze")
async def analyze(
    video: UploadFile = File(...),
    exercise_id: int = Form(...)
):

    file_path = os.path.join(
        UPLOAD_FOLDER,
        video.filename
    )

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(video.file, buffer)

    analysis = analyze_video(file_path)

    score = round(analysis["score"] / 10, 1)

    return {

    "score": score,

    "metrics": {

        "Detección corporal": score,
        "Seguimiento": max(score - 0.3, 0),
        "Estabilidad": max(score - 0.5, 0),
        "Precisión": score

    },

    "strengths": [

        analysis["feedback"][0]

    ],

    "weaknesses": [

        "La evaluación biomecánica aún está en desarrollo."

    ],

    "exercises": [

        "Practicar el ejercicio manteniendo todo el cuerpo dentro del encuadre.",
        "Realizar la ejecución nuevamente con una mejor postura."

    ]

}