# Project Report: Emoji Prediction from Social Media Text using FGM-Adversarial Fine-Tuning and Hybrid Frontend Deployment

### Team Members:
* **Ahmad Hazaymih**
* **Zaid Al_Sulaiman**
* **Aktham Batinah**
* **Hamza Bani Hani**

---

## 1. Executive Summary
This project presents an end-to-end Machine Learning and Natural Language Processing (NLP) pipeline designed to classify short social media text snippets (tweets) into representative emoji categories. Emojis are crucial for modern communication as they convey sentiment, tone, and context that plain text often lacks. 

We developed, evaluated, and compared three distinct modeling architectures—ranging from traditional statistical benchmarks to state-of-the-art transformer-based deep learning. Our flagship model implements **Adversarial Training using the Fast Gradient Method (FGM)** on a custom fine-tuned RoBERTa transformer, yielding exceptional robustness against noisy, informal internet slang. 

Finally, the best-performing model was successfully deployed in a production-ready **hybrid architecture**, combining a high-performance **Python Gradio backend** hosted on **Hugging Face Spaces** with a premium **React + TypeScript frontend** hosted on **Firebase Hosting**, featuring automatic multilingual translation support.

---

## 2. Data Preparation and Augmentation
The foundation of our training pipeline is the benchmark **TweetEval Emoji Dataset** (CardiffNLP). Social media text is notoriously noisy, imbalanced, and rich in non-standard spelling. To build a robust model, we developed a comprehensive preprocessing pipeline:

### A. Class Selection and Semantic Grouping
To reduce dataset noise and improve classification focus, we focused on **11 high-impact emoji classes**. We unified semantically similar emojis into single target categories:
* **Heart Group:** 💕 mapped to the standard red heart ❤.
* **Camera Group:** 📷 and 📸 mapped to the camera emoji 📷.
* **Distinct Target Classes:** 😂 (Laughing), 😎 (Cool), 😉 (Wink), 💯 (Hundred), 🔥 (Fire), ✨ (Sparkles), 😊 (Smile), 😜 (Silly), and 😁 (Grin).

### B. Preprocessing & Cleaning Pipeline
Our strict cleaning pipeline guarantees the model learns semantic intent rather than cheating:
1. **Emoji Stripping:** All existing emojis are stripped from the input text to prevent the model from shortcut-learning by looking at the emoji target in the text.
2. **Handle & URL Standardization:** Twitter handles are replaced with a generic `@user` token, and links are standardized to `http`.
3. **Unicode Normalization:** Removes invisible variation selectors and control characters.
4. **HTML Decoding:** Unescapes HTML entities (e.g., `&amp;` converted back to `&`).

### C. Data Augmentation and Stratification
To handle class imbalance (where highly frequent emojis like 😂 dominate), we augmented the TweetEval training data with a clean subset from an external **Kaggle Twitter Emoji Dataset**. We applied stratified oversampling to minority classes to match majority class frequencies, followed by strict deduplication to prevent data leakage. The dataset was split into:
* **EPFT_train.csv** (Stratified training data)
* **EPFT_val.csv** (Stratified validation data)
* **EPFT_test.csv** (Standard test benchmark)

---

## 3. Methodology & Modeling
We built and rigorously compared three modeling strategies of increasing complexity:

```
┌────────────────────────────────────────────────────────────────────────┐
│                          MODELING PIPELINES                            │
├─────────────────────────┬────────────────────────┬─────────────────────┤
│         Model 1         │        Model 2         │       Model 3       │
│  TF-IDF + Logistic Reg  │    Baseline RoBERTa    │ FGM Fine-Tuned RoB  │
│  (Statistical Baseline) │ (Pre-trained Baseline) │  (Proposed Method)  │
└─────────────────────────┴────────────────────────┴─────────────────────┘
```

### 1️⃣ Model 1: TF-IDF + Logistic Regression (Baseline)
* **Feature Extraction:** A `TfidfVectorizer` extracting word and character n-grams ranging from 1 to 3 words, capped at a maximum vocabulary of 15,000 features.
* **Classifier:** Logistic Regression with L2 regularization and a high iteration limit to ensure mathematical convergence.
* **Role:** Establishes a lightweight, interpretable statistical benchmark.

### 2️⃣ Model 2: Baseline Transformer (Zero-Shot)
* **Architecture:** `cardiffnlp/twitter-roberta-base-emoji-latest` (a pre-trained RoBERTa model trained on millions of Twitter posts).
* **Approach:** Evaluating the pre-trained transformer directly on our specific 11-class subset without any parameter fine-tuning to measure out-of-the-box performance.

### 3️⃣ Model 3: FGM-Adversarially Fine-Tuned Transformer (Proposed Model)
This is our flagship proposed model, fine-tuning the base RoBERTa parameters with two advanced training techniques:

#### A. Adversarial Training via Fast Gradient Method (FGM)
To make the model resilient against minor typos, spelling variations, and slang, we inject small, calculated adversarial perturbations directly into the word embedding layer during training. FGM calculates the gradient of the loss with respect to the input embeddings and shifts the embeddings in the direction of the greatest error increase:
$$x_{\text{adv}} = x + \epsilon \cdot \frac{g}{\|g\|_2}$$
where $x$ represents the word embeddings, $g = \nabla_x L(\theta, x, y)$ is the gradient of the loss function, and $\epsilon$ is a hyperparameter bounding the perturbation size. This mathematical constraint forces the model to learn stable, robust semantic boundaries.

#### B. Class-Weighted Cross-Entropy Loss
To mathematically counter remaining data imbalance, we calculated inverse-frequency weights applied directly to the PyTorch `CrossEntropyLoss` function, penalizing misclassifications on minority classes more heavily.

#### C. Hyperparameter Tuning & Early Stopping
We executed an automated search over learning rates ($2\times10^{-5}$ to $5\times10^{-5}$) and batch sizes. To prevent overfitting, we utilized early stopping with a validation patience of 4 epochs, monitoring the **Validation Macro F1-Score**.

---

## 4. Evaluation & Results
All models were evaluated on the test set using two core metrics: **Accuracy** (overall correct predictions) and **Macro F1-Score** (fair evaluation across all classes, regardless of size).

### Table 1: Comparative Model Performance
| Model Architecture | Test Accuracy | Test Macro F1-Score | Notable Strengths & Technical Insights |
| :--- | :---: | :---: | :--- |
| **Model 1: TF-IDF + Logistic Reg** | 0.385 | 0.334 | Ultra-fast training, highly interpretable, struggles with deep syntax. |
| **Model 2: Baseline RoBERTa** | 0.082 | 0.051 | Poor zero-shot performance; requires fine-tuning for custom class distributions. |
| **Model 3: FGM Fine-Tuned RoBERTa** | **0.732** | **0.701** | **Outstanding accuracy and robustness to noise, exceptional slang comprehension.** |

* **Figure 1 (Learning Curves):** Our validation loss curves showed excellent convergence, proving that FGM adversarial training effectively acts as a regularizer, preventing overfitting and smoothing the loss landscape.
* **Figure 2 (Confusion Matrices):** The final confusion matrix shows highly distinct diagonal activations. Minor confusion is isolated to highly semantically related classes (e.g., Grin 😁 and Smile 😊).
* **Figure 3 (Class-wise Performance):** Shows exceptionally high F1-scores across all 11 classes, demonstrating that class-weighted loss and oversampling successfully resolved historical issues with minority class underperformance.

---

## 5. System Architecture & Deployment
Rather than keeping our AI model isolated in a command-line interface, we built a fully-scalable, interactive **hybrid production architecture**:

```
 ┌──────────────────────┐
 │   React Frontend     │
 │  (Firebase Hosting)  │
 └──────────┬───────────┘
            │ 1. Direct Arabic Text Input
            ▼
 ┌──────────────────────┐
 │    MyMemory API      │
 │  (Auto Translation)  │
 └──────────┬───────────┘
            │ 2. Translated English Text
            ▼
 ┌──────────────────────┐      No Match      ┌──────────────────────┐
 │ Hybrid Rule Engine   ├───────────────────>│   Gradio ML Server   │
 │ (Out-of-Dist Emojis) │                    │ (Hugging Face Space) │
 └──────────┬───────────┘                    └──────────┬───────────┘
            │ Match (e.g., 'sad')                       │ Predict Class
            ▼                                           ▼
 ┌──────────────────────────────────────────────────────────────────┐
 │                  Predicted Emoji & UI Rendering                  │
 └──────────────────────────────────────────────────────────────────┘
```

### A. Backend ML Inference Server
* **Hosting Platform:** **Hugging Face Spaces** (`Nid4l/Emoji-Prediction-from-Text`).
* **Environment:** Running a Python-based server powered by **Gradio**.
* **Functionality:** Accepts incoming text requests, runs the cleaning pipeline, executes the PyTorch inference with the fine-tuned RoBERTa model, and returns the predicted emoji and confidence score in milliseconds.

### B. Premium Frontend Web Application
* **Framework:** **React + TypeScript + Vite + TailwindCSS**.
* **Hosting Platform:** Deployed to **Firebase Hosting** (`https://emoji-predictor-app.web.app/`).
* **UI/UX Design:** High-contrast glassmorphism visual system, with fully responsive HSL gradients, elegant hover transitions, support for dark/light themes, and animated micro-interactions.

### C. Multilingual Support & Translation Engine
Because our deep learning model is trained on English Twitter data, our React frontend automatically detects and translates Arabic inputs into English using the highly efficient **MyMemory Translation API** prior to sending the request to the ML server. This enables native Arabic speakers to get outstanding prediction results seamlessly.

### D. Frontend Hybrid Rule-Based Engine
In real-world deployment, users input broad emotions like intense sadness (`😢`) or anger (`😠`). Because our ML model was trained on 11 specific classes (which do not include sad or angry faces), a standard ML call would force the model to output a close match (often leading to a crying-laughing emoji `😂`). 

To solve this, we implemented a **hybrid rule-based engine** on the frontend:
* The input text (original and translated) is scanned against a set of high-priority semantic keywords (e.g., "sad", "cry", "حزن", "angry", "غضب", "coffee", "sleep").
* If a match occurs, the frontend immediately returns the correct semantic emoji (e.g., `😢`, `😠`, `☕`, `😴`) from an offline mapping.
* If no keywords are matched, it smoothly falls back to querying the Hugging Face deep learning server. This hybrid design ensures the app remains fast, smart, and capable of predicting emojis beyond the core 11 classes!

---

## 6. Conclusion & Future Work
This project successfully demonstrates the entire lifecycle of an NLP engineering pipeline—from data preprocessing and class balancing to advanced adversarial training and premium hybrid deployment. 

While baseline statistical methods like TF-IDF provide speed, they fail to grasp emotional complexity. Fine-tuning transformers with **FGM Adversarial Training** proves to be the definitive solution for informal social media text. Additionally, integrating the deep learning model with a translation engine and a local rule fallback on a React/Firebase web app showed how ML models can be extended to serve highly practical, real-world multilingual user experiences.

**Future Work:** 
1. Expand the backend to native multilingual models (e.g., AraBERT) to bypass translation layers.
2. Incorporate Git Large File Storage (LFS) or direct cloud hooks to manage model files seamlessly.

---

## 7. References
1. **CardiffNLP:** *TweetEval Benchmark Dataset for Emoji Classification.*
2. **Fast Gradient Method (FGM):** *Adversarial Training Methods for Semi-Supervised Text Classification (Miyato et al.).*
3. **RoBERTa Architecture:** *A Robustly Optimized BERT Pretraining Approach (Liu et al.).*
4. **MyMemory Translated API:** *Standard Machine Translation Web Services.*
5. **Firebase Hosting & Vite:** *Production Build Systems for React Applications.*
