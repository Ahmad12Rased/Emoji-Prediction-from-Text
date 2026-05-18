import re
import html
import unicodedata
import torch
import gradio as gr
import emoji as emoji_lib
import torch.nn.functional as F
from transformers import AutoTokenizer, AutoModelForSequenceClassification

MODEL_NAME = "cardiffnlp/twitter-roberta-base-emoji-latest"
NUM_CLASSES = 11
MODEL_PATH = "model/best_fgm_model.pt"

emojis = ["❤", "😂", "📷", "😎", "😉", "💯", "🔥", "✨", "😊", "😜", "😁"]
sorted_emojis = sorted(emojis)
ID_TO_EMOJI = {i: emoji for i, emoji in enumerate(sorted_emojis)}

EMOJI_TO_NAME = {
    "❤": "Heart",
    "😂": "Laughing",
    "📷": "Camera",
    "😎": "Cool",
    "😉": "Wink",
    "💯": "Hundred",
    "🔥": "Fire",
    "✨": "Sparkles",
    "😊": "Smile",
    "😜": "Silly",
    "😁": "Grin",
}

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def text_clean(text: str) -> str:
    if not isinstance(text, str):
        return ""
    text = re.sub(r"@[^\s]+", "@user", text)
    text = re.sub(r"http\S+|www\S+|https\S+", "http", text)
    text = emoji_lib.replace_emoji(text, replace='')
    text = "".join(ch for ch in text if unicodedata.category(ch)[0] != 'C')
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'\s@\s\w+.*$', '', text)
    text = html.unescape(text)
    return text.strip()

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSequenceClassification.from_pretrained(
    MODEL_NAME,
    num_labels=NUM_CLASSES,
    ignore_mismatched_sizes=True
)
state_dict = torch.load(MODEL_PATH, map_location=device)
model.load_state_dict(state_dict)
model.to(device)
model.eval()

def predict(text: str):
    if not text.strip():
        return "Please enter some text.", 0.0

    cleaned = text_clean(text)
    if not cleaned:
        return "After cleaning, text became empty. Use a longer message.", 0.0

    inputs = tokenizer(
        cleaned,
        truncation=True,
        padding="max_length",
        max_length=64,
        return_tensors="pt"
    )
    input_ids = inputs["input_ids"].to(device)
    attention_mask = inputs["attention_mask"].to(device)

    with torch.no_grad():
        outputs = model(input_ids, attention_mask=attention_mask)
        logits = outputs.logits
        probs = F.softmax(logits, dim=1)
        confidence, pred_id = torch.max(probs, dim=1)
        confidence = confidence.item()

    pred_emoji = ID_TO_EMOJI[pred_id.item()]
    pred_name = EMOJI_TO_NAME.get(pred_emoji, "Unknown")
    return f"{pred_emoji}  {pred_name}", confidence

demo = gr.Interface(
    fn=predict,
    inputs=gr.Textbox(label="Enter your tweet / text", placeholder="I love this! 😍"),
    outputs=[
        gr.Label(label="Predicted Emoji"),
        gr.Number(label="Confidence (0–1)", precision=3)
    ],
    title="Emoji Prediction from Text",
    description="Enter an English sentence. The model predicts an emoji and shows its confidence score.",
    examples=[
        ["I love you"],
        ["That's hilarious lol"],
        ["Good Night Everyone"],
        ["Let's take a picture"],
        ["100 percent agreed"],
        ["This is fire 🔥"],
        ["The best group to go to celebrate with"],
        ["New York ain't ready..."],
        ["I'll forever miss preforming under the friday night lights"],
        ["Thank you for capturing this moment & Thank you to everyone that came out last night"],
        ["Just livin man"]
    ],
)

if __name__ == "__main__":
    demo.launch()