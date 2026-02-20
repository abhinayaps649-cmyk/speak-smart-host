from flask import Flask, request, jsonify
from flask_cors import CORS
import speech_recognition as sr
import google.generativeai as genai
import os
import json
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-flash-latest')

@app.route('/api/analyze', methods=['POST'])
def analyze():
    print("------- NEW REQUEST -------")
    print("Files received:", request.files)
    print("Form data received:", request.form)
    
    if 'audio' not in request.files:
        print("ERROR: No audio file provided in request.")
        return jsonify({"error": "No audio file provided"}), 400
    
    audio_file = request.files['audio']
    topic = request.form.get('topic', 'A random topic')
    duration_str = request.form.get('duration', '0')
    try:
        duration = float(duration_str)
    except ValueError:
        duration = 0.0
    
    # Save the uploaded wav file temporarily
    wav_path = "temp_recording.wav"
    audio_file.save(wav_path)
    
    try:
        # Speech to text using SpeechRecognition
        recognizer = sr.Recognizer()
        with sr.AudioFile(wav_path) as source:
            audio_data = recognizer.record(source)
            try:
                # Using Google Web Speech API (Free, no key required)
                transcript = recognizer.recognize_google(audio_data)
            except sr.UnknownValueError:
                transcript = ""
            except sr.RequestError:
                return jsonify({"error": "Speech recognition service unavailable"}), 500
                
        # Calculate WPM based on transcript length and duration
        words = transcript.split()
        word_count = len(words)
        wpm = round((word_count / duration) * 60) if duration > 0 else 0
        
        # Count filler words
        filler_words = ['um', 'uh', 'like', 'actually', 'basically', 'literally', 'right']
        fillers = sum(1 for w in words if w.lower().strip(".,!?") in filler_words)
        
        print(f"Transcribed successfully. WPM: {wpm}, Fillers: {fillers}")
        print(f"Transcript preview: '{transcript[:50]}...'")
        print("Calling Gemini API...")
        
        prompt = f"""
        You are an expert public speaking coach. The user was speaking on the topic: "{topic}".
        Here is the transcript of their speech:
        "{transcript}"
        
        Analyze this speech. Provide:
        1. A confidence score as an integer (out of 100).
        2. A short paragraph of constructive feedback praising strengths and pointing out weaknesses (max 3 sentences).
        3. A list of exactly 2 specific areas for improvement.
        
        Return the response STRICTLY as a JSON object matching this schema:
        {{
            "confidence_score": 85,
            "feedback": "Your feedback here.",
            "improvements": ["Improvement 1", "Improvement 2"]
        }}
        """
        
        # Ensure we just get JSON
        ai_response = model.generate_content(prompt)
        text_response = ai_response.text
        
        # Clean markdown codeblocks if they exist
        if text_response.startswith('```json'):
            text_response = text_response[7:-3]
        elif text_response.startswith('```'):
            text_response = text_response[3:-3]
            
        try:
            analysis = json.loads(text_response.strip())
        except json.JSONDecodeError:
            # Fallback if Gemini failed to return valid JSON
            analysis = {
                "confidence_score": 50,
                "feedback": "Unable to parse AI feedback.",
                "improvements": ["Speak clearly", "Pace yourself"]
            }
        
        print("Gemini API call successful.")
        
        return jsonify({
            "transcript": transcript,
            "word_count": word_count,
            "wpm": wpm,
            "fillers": fillers,
            "analysis": analysis
        })
        
    except Exception as e:
        import traceback
        print("Backend Error Detailed:", e)
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        # Cleanup temp file
        import os
        if os.path.exists(wav_path):
            try:
                os.remove(wav_path)
            except:
                pass

if __name__ == '__main__':
    app.run(debug=True, port=5000)
