import json
import re

import requests
from flask import Flask, jsonify, request

app = Flask(__name__)

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "qwen2.5:7b"


def is_empty_or_emoji_only(text):
    """Return True if text is empty, whitespace-only, or contains only emoji/symbols."""
    if not text or not text.strip():
        return True
    # Remove emoji and common symbol ranges
    stripped = re.sub(
        r'[\U0001F600-\U0001F64F'  # emoticons
        r'\U0001F300-\U0001F5FF'   # symbols & pictographs
        r'\U0001F680-\U0001F6FF'   # transport & map symbols
        r'\U0001F1E0-\U0001F1FF'   # flags
        r'\U00002702-\U000027B0'   # dingbats
        r'\U0000FE00-\U0000FE0F'   # variation selectors
        r'\U0001F900-\U0001F9FF'   # supplemental symbols
        r'\U0001FA00-\U0001FA6F'   # chess symbols
        r'\U0001FA70-\U0001FAFF'   # symbols extended-A
        r'\U00002600-\U000026FF'   # misc symbols
        r'\U0000200D'              # zero width joiner
        r'\U00000020-\U0000002F'   # spaces and punctuation
        r'\U0000003A-\U00000040'   # punctuation
        r'\U0000005B-\U00000060'   # punctuation
        r'\U0000007B-\U0000007E'   # punctuation
        r']+', '', text)
    return len(stripped.strip()) == 0


@app.route("/")
def translate():
    content = request.args.get("content", "")

    if is_empty_or_emoji_only(content):
        return jsonify({"is_english": True, "translated_content": ""})

    prompt = (
        "You are a language detection and translation assistant. "
        "Analyze the following text and determine if it is written in English. "
        "If it is English, respond with exactly: {\"is_english\": true, \"translated_content\": \"\"}\n"
        "If it is NOT English, translate it to English and respond with exactly: "
        "{\"is_english\": false, \"translated_content\": \"<your English translation>\"}\n"
        "Respond ONLY with the JSON object, no other text.\n\n"
        f"Text: {content}"
    )

    try:
        response = requests.post(OLLAMA_URL, json={
            "model": MODEL,
            "prompt": prompt,
            "stream": False,
        }, timeout=60)
        response.raise_for_status()

        result = response.json()
        llm_response = result.get("response", "").strip()

        parsed = json.loads(llm_response)
        return jsonify({
            "is_english": bool(parsed.get("is_english", True)),
            "translated_content": str(parsed.get("translated_content", "")),
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
