# Fact notes (concepts as stated in the narration)
- LLM: neural model trained on large text corpora to predict/generate text token by token. Accurate simplification.
- API: interface letting software call a service; AI model APIs take a request and return a response. Example JSON is labelled SIMPLIFIED.
- Tokens: sub-word units; one word != one token. Splits shown come from the real o200k_base BPE (npm gpt-tokenizer, run locally): "AI models process text in pieces called tokens." = 9 tokens; "Unbelievably, tokenization works." = 8 tokens (4 words). Other models use other tokenizers (stated on screen).
- Fine-tuning: continued training on selected examples; changes the model weights. Shown explicitly as NOT document upload.
- RAG: retrieval at question time, then generation; no retraining.
- Embeddings: numerical vectors; similar meaning = nearby vectors. 3D map is ILLUSTRATIVE (real embeddings: hundreds+ dimensions). Vector values are made up for illustration.
- Roles overlap: stated as "in practice"; no hard definitions claimed.
