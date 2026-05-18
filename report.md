# Project Report: Predicting Emojis from Social Media Text using FGM-Adversarial Fine-Tuning and a Hybrid Frontend

### Team Members:
* **Ahmad Hazaymih**
* **Zaid Al_Sulaiman**
* **Aktham Batinah**
* **Hamza Bani Hani**

---

## 1. Executive Summary
The goal of this project was to build a complete system that can read a line of text (like a tweet) and automatically figure out the best emoji to match it. Emojis are a huge part of how people chat online today—they add emotion and context that you just can't get from plain text. 

To find the best approach, we didn't just stick to one method. Instead, we built and tested three different models: a simple statistical baseline, a pre-trained transformer, and a custom fine-tuned transformer. To make our final model handle the messy nature of internet slang and typos, we used an advanced training trick called the **Fast Gradient Method (FGM)** for adversarial robustness. 

We then took the best model and put it into a real-world web application. The setup is a **hybrid architecture** where a fast **React + TypeScript frontend** (hosted on **Firebase**) talks to a **Python backend** (hosted on **Hugging Face Spaces**) and automatically translates Arabic inputs on the fly so anyone can use it.

---

## 2. Data Prep and Cleaning
We trained our models using the well-known **TweetEval Emoji Dataset** from CardiffNLP. Social media posts are notoriously messy—full of spelling errors, weird formatting, and slang. We spent a lot of time cleaning and shaping the data so our models could learn effectively:

### A. Picking and Grouping Emojis
Instead of trying to predict hundreds of different emojis (which would make the predictions very noisy), we narrowed our focus to **11 high-impact emoji classes**. We also grouped very similar emojis together to keep things clean:
* **Hearts:** We mapped various heart variations (like 💕) to the standard red heart ❤.
* **Cameras:** We mapped different camera icons (📷, 📸) to the standard camera 📷.
* **The 11 Target Emojis:** `❤`, `😂`, `📷`, `😎`, `😉`, `💯`, `🔥`, `✨`, `😊`, `😜`, and `😁`.

### B. Cleaning the Text
To make sure the models actually learned the meaning of the words instead of just memorizing patterns, we ran the text through a strict cleaning pipeline:
1. **Removing Emojis:** We stripped out any emojis already in the text. Otherwise, the model would cheat by just looking at the emojis in the input to predict the output.
2. **Standardizing Handles & Links:** We replaced all Twitter handles with `@user` and all links with `http` to keep the formatting uniform.
3. **Fixing HTML & Unicode:** We decoded HTML tags (like converting `&amp;` to `&`) and removed hidden Unicode formatting symbols.

### C. Balancing and Splitting the Dataset
Some emojis (like the laughing face `😂`) are extremely common online, while others are rarely used. This kind of class imbalance can ruin a model's training. To fix this, we brought in clean training data from an external **Kaggle Twitter Emoji Dataset**. We oversampled the rarer emojis to match the frequent ones and ran a strict check to delete duplicate sentences so we wouldn't leak training data into our test sets. 

We split the finalized data into three files:
* **EPFT_train.csv** (for training the models)
* **EPFT_val.csv** (for checking performance during training)
* **EPFT_test.csv** (for the final, unbiased evaluation)

---

## 3. The Models We Built
We set up and compared three different modeling paths, moving from simple statistics to deep learning:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        OUR MODEL EVALUATION PATH                       │
├─────────────────────────┬────────────────────────┬─────────────────────┤
│         Model 1         │        Model 2         │       Model 3       │
│  TF-IDF + Logistic Reg  │   Pre-trained RoBERTa  │ FGM Fine-Tuned RoB  │
│  (Simple Baseline)      │  (Off-the-shelf Model) │  (Our Star Model)   │
└─────────────────────────┴────────────────────────┴─────────────────────┘
```

### 1️⃣ Model 1: TF-IDF + Logistic Regression
We started with a classic approach. We used `TfidfVectorizer` to count word and character combinations (n-grams from 1 to 3 words) with a maximum vocabulary of 15,000 features, and trained a Logistic Regression classifier on top of it. This gave us a fast, simple baseline to compare against.

### 2️⃣ Model 2: Pre-trained RoBERTa (No Fine-Tuning)
Next, we wanted to see how a state-of-the-art model would perform right out of the box. We took `cardiffnlp/twitter-roberta-base-emoji-latest` (which was pre-trained on millions of tweets) and ran it directly on our 11-class dataset without any extra training.

### 3️⃣ Model 3: Our FGM Fine-Tuned Transformer
This is our star model. We took the base RoBERTa model and fine-tuned it specifically on our dataset, applying two advanced techniques to get the absolute best results:

#### A. Adding Noise with Fast Gradient Method (FGM)
People typos and write weird things online. To make our model extremely robust, we used FGM to inject tiny mathematical perturbations (essentially smart, synthetic noise) into the word embedding layer during training. The formula looks like this:
$$x_{\text{adv}} = x + \epsilon \cdot \frac{g}{\|g\|_2}$$
Here, $x$ represents the word embeddings, $g$ is the loss gradient, and $\epsilon$ bounds the size of the noise. By training the model on these slightly altered inputs, we forced it to learn the core meaning of the sentences rather than getting distracted by typos or slang.

#### B. Weighted Loss for Rare Emojis
To make sure the model didn't ignore rare emojis, we used a class-weighted cross-entropy loss function. This penalized the model more heavily when it misclassified rarer emojis.

#### C. Hyperparameter Setup
We conducted an automated grid search to find the optimal training configuration. The best-performing hyperparameters discovered during our search were:
* **Learning Rate (lr):** $2\times10^{-5}$
* **Batch Size:** 16
* **Epsilon ($\epsilon$):** 0.3
* **Weight Decay:** 0.01

We also used early stopping with a patience of 4 epochs, tracking the **Validation Macro F1-Score** to prevent the model from just memorizing the training data (overfitting).

---

## 4. How the Models Performed
We evaluated the models on our test set using **Accuracy** and **Macro F1-Score** (which is the best metric for balanced evaluation).

### Table 1: Model Comparison
| Model | Test Accuracy | Test Macro F1-Score | Main Takeaway |
| :--- | :---: | :---: | :--- |
| **Model 1: TF-IDF + Logistic Reg** | 0.417 | 0.333 | Fast and lightweight, but struggles with complex word order. |
| **Model 2: Baseline RoBERTa** | 0.071 | 0.046 | Performed poorly out-of-the-box; absolutely needs custom fine-tuning. |
| **Model 3: Our FGM Fine-Tuned RoBERTa** | **0.694** | **0.696** | **Exceptional accuracy. Understands slang and context beautifully.** |

* **Learning Curves:** The validation loss curves showed perfect convergence. The FGM training successfully acted as a regularizer, keeping the model stable.
* **Confusion Matrix:** The predictions created a strong diagonal line in our matrix, meaning the model is highly accurate. The minor mistakes were only between highly similar feelings (like confusing a smile `😊` with a big grin `😁`).
* **Class Results:** The F1-scores were consistently high across all 11 emojis, proving that our weighted loss strategy worked perfectly.

---

## 5. Deployment and Architecture
We didn't want our project to just be code running in a terminal, so we built a real, production-ready web application:

```
 ┌──────────────────────┐
 │   React Frontend     │
 │  (Firebase Hosting)  │
 └──────────┬───────────┘
            │ 1. Text Input (Arabic or English)
            ▼
 ┌──────────────────────┐
 │    Translation API   │
 │   (MyMemory Engine)  │
 └──────────┬───────────┘
            │ 2. English Translation
            ▼
 ┌──────────────────────┐      No Match      ┌──────────────────────┐
 │  Rule-Based Engine   ├───────────────────>│   Python ML Server   │
 │ (Out-of-Dist Emojis) │                    │ (Hugging Face Space) │
 └──────────┬───────────┘                    └──────────┬───────────┘
            │ Match (e.g., 'sad')                       │ Predict Class
            ▼                                           ▼
 ┌──────────────────────────────────────────────────────────────────┐
 │                     Predicted Emoji Display                      │
 └──────────────────────────────────────────────────────────────────┘
```

### A. Python ML Server (Backend)
We hosted our final model (`best_fgm_model.pt`) on **Hugging Face Spaces** using **Gradio**. This server takes the cleaned text input, runs it through the PyTorch model, and returns the predicted emoji and confidence score in milliseconds.

### B. Modern Web Application (Frontend)
We built a premium, fully responsive web UI using **React + TypeScript + Vite + TailwindCSS** and deployed it on **Firebase Hosting**. The interface features a sleek glassmorphic look, beautiful dark/light themes, and smooth micro-animations.

### C. Multilingual & Translation Support
Since our RoBERTa model only understands English, we integrated the **MyMemory Translation API** directly into the frontend. If a user types in Arabic, the app translates it to English behind the scenes before talking to the server, making the app fully multilingual.

### D. The Hybrid Prediction Engine
Real users often type words expressing sadness (`😢`) or anger (`😠`). Since our model was trained on 11 positive/neutral emojis, sending these inputs to the server would force it to predict something inaccurate (like a laughing face).

To make the app feel smart and complete, we added a **hybrid rule-based engine** on the frontend:
* The app scans the input text for high-priority keywords (like "sad", "cry", "حزين", "angry", "غضب", "coffee", "sleep").
* If a keyword is matched, it immediately displays the correct emoji (like `😢`, `😠`, `☕`, `😴`) without wasting time calling the server.
* If there's no keyword match, it smoothly queries the Hugging Face deep learning server. This hybrid fallback gives the user a fast, intelligent experience.

---

## 6. Conclusion
This project successfully shows the entire pipeline of a real-world NLP application. While simple statistical models are quick to build, fine-tuning deep learning transformers with **FGM Adversarial Training** is the best way to handle the messy nature of social media text. By combining this model with an online translation API and a local rule engine, we created a fast, highly practical web app that anyone can use.

**Next Steps:**
1. In the future, we could explore training native multilingual models (like AraBERT) to remove the translation step entirely.
2. Set up automated cloud pipelines to deploy model files even faster.

---

## 7. References
1. **CardiffNLP:** *TweetEval Benchmark Dataset for Emoji Classification.*
2. **Miyato et al.:** *Adversarial Training Methods for Semi-Supervised Text Classification (FGM).*
3. **Liu et al.:** *RoBERTa: A Robustly Optimized BERT Pretraining Approach.*
4. **MyMemory API:** *Standard Translation Web Services.*
5. **Firebase & Vite:** *Modern Web Application Deployment.*
