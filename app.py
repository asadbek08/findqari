from flask import Flask, request, jsonify, render_template
import os
import librosa
import torch
from speechbrain.pretrained import EncoderClassifier  # type: ignore
import joblib
from pydub import AudioSegment
import numpy as np

# Initialize Flask app
app = Flask(__name__)

# Load models
classifier = EncoderClassifier.from_hparams(source="speechbrain/spkrec-xvect-voxceleb")
svm_model = joblib.load('model.pkl')

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def clear_uploads_folder():
    """Delete all files in the uploads folder."""
    for file in os.listdir(app.config['UPLOAD_FOLDER']):
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], file)
        try:
            if os.path.isfile(file_path):
                os.remove(file_path)
        except Exception as e:
            print(f"Error while deleting file {file_path}: {e}")

@app.route('/')
def home():
    return render_template("home.html")

@app.route('/record')
def record():
    return render_template("record.html")

@app.route('/predict', methods=['POST'])
def predict():
    try:
        if 'audio' not in request.files:
            return jsonify({"error": "No audio file provided"}), 400

        audio_file = request.files['audio']
        if audio_file.filename == '':
            return jsonify({"error": "No selected file"}), 400

        # Clear the uploads folder before saving a new file
        clear_uploads_folder()

        # Save the new audio file
        raw_file_path = os.path.join(app.config['UPLOAD_FOLDER'], audio_file.filename)
        audio_file.save(raw_file_path)

        # Preprocess and convert to MP3
        processed_file_path = os.path.join(app.config['UPLOAD_FOLDER'], "processed.mp3")
        waveform, sr = prepare_audio(raw_file_path, processed_file_path)

        # Extract features using the SpeechBrain classifier
        waveform_tensor = torch.tensor(waveform, dtype=torch.float32).unsqueeze(0)
        new_embedding = classifier.encode_batch(waveform_tensor).squeeze().detach().numpy()

        # Predict using SVM model
        probabilities = svm_model.predict_proba([new_embedding])[0]
        classes = svm_model.classes_

        # Sort and prepare top 5 predictions
        top_predictions = sorted(zip(classes, probabilities), key=lambda x: x[1], reverse=True)[:5]
        top_predictions_list = [{"qari": qari, "probability": prob * 100} for qari, prob in top_predictions]

        return render_template("result.html", predictions=top_predictions_list)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

def prepare_audio(input_file, output_file):
    """Convert audio to MP3 format with consistent properties."""
    audio = AudioSegment.from_file(input_file)
    audio = audio.set_frame_rate(16000).set_channels(1)
    audio.export(output_file, format="mp3", bitrate="192k")

    # Load the audio as a waveform for processing
    waveform, sr = librosa.load(output_file, sr=16000, mono=True)

    # Normalize the waveform
    waveform = waveform / np.max(np.abs(waveform))
    return waveform, sr


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 8000))
    app.run(host='0.0.0.0', port=port, debug=True)

