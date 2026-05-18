# Emoji Prediction from Text Multi-Model Pipeline

This project implements a robust Natural Language Processing (NLP) pipeline to predict emojis from text using the TweetEval dataset. The project transitions from a baseline statistical approach to advanced transformer-based fine-tuning using Adversarial Training (FGM).

---

## 📋 Project Overview

The goal of this project is to classify short text snippets (tweets) into 11 distinct emoji categories. The pipeline is split into three main phases
1.  Data Preparation & Augmentation Cleaning, mapping, and balancing the dataset.
2.  Model Training & Adversarial Fine-Tuning Implementing TF-IDF, RoBERTa baselines, and FGM-enhanced fine-tuning.
3.  Comparative Analysis Evaluating performance across models using Macro F1 and Accuracy.

---

## 🗂️ Dataset & Preprocessing
The pipeline uses the `cardiffnlptweet_eval` (emoji subset) as the primary data source.

### 1. Class Mapping & Selection
To improve model focus, similar emojis were grouped, and minority classes were filtered to maintain 11 target labels
 Heart Group 💕 mapped to ❤.
 Camera Group 📷 and 📸 mapped to 📷.
 Unique Classes 😂, 😎, 😉, 💯, 🔥, ✨, 😊, 😜, 😁.

### 2. Augmentation & Balancing
To combat class imbalance, the training set was augmented using an external Kaggle Twitter Emoji dataset. Minority classes were sampled to match the majority class count, followed by strict deduplication to prevent data leakage.

### 3. Cleaning Pipeline
The pipeline applies several cleaning steps to ensure the model learns linguistic intent
 HandleURL Standardization Replaces mentions with `@user` and links with `http`.
 Emoji Stripping Removes all emojis from input text to prevent the model from cheating by seeing the label in the text.
 Unicode Normalization Removes invisible variation selectors and artifacts.
 HTML Decoding Converts entities like `&amp;` back to standard characters.

---

## 🚀 Modeling Approach

The project evaluates three distinct modeling strategies

### Model 1 TF-IDF + Logistic Regression
 Type Statistical Baseline.
 Features N-grams (1-3) with a maximum of 15,000 features.
 Purpose Provides a lightweight benchmark for performance vs. compute cost.

### Model 2 Baseline Transformer
 Model `cardiffnlptwitter-roberta-base-emoji-latest`.
 Approach Evaluation on the test set without any additional fine-tuning.

### Model 3 FGM-Adversarial Fine-Tuning
This is the flagship model of the pipeline, featuring
 Fast Gradient Method (FGM) Adds small perturbations to word embeddings during training to improve model robustness.
 Hyperparameter Tuning Automated search across learning rates (e.g., 2e-5, 3e-5), batch sizes, and epsilon values.
 Class-Weighted Loss Uses `CrossEntropyLoss` with weights (clipped between 0.5 and 5.0) to handle data imbalances.
 Early Stopping Monitored via Validation Macro F1 with a patience of 4 epochs.

---

## 📊 Evaluation & Results

The pipeline generates several artifacts for analysis
 `test_results_all_models.csv` A summary table comparing Accuracy and Macro F1 across the three models.
 `hp_tuning_results.csv` Logs of the hyperparameter search phase.
 `final_full_training_log.csv` Epoch-by-epoch breakdown of loss and metrics for the final model.

### Expected Performance Comparison
| Model | Strengths | Weaknesses |
| :--- | :--- | :--- |
| **TF-IDF + LR** | Fast training, low compute. | Struggles with deep context. |
| **Baseline RoBERTa** | Strong linguistic pre-training. | Not tuned for specific class groups. |
| **FGM Fine-Tuned** | Highest robustness and F1-score. | Computationally intensive. |

---

## 🛠️ Usage

### Prerequisites
```python
pip install torch transformers datasets scikit-learn emoji pandas numpy