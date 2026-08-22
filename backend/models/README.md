# Crop-disease classifier

Drop the trained model here as two files:

```
models/crop_disease.onnx              the exported graph
models/crop_disease.labels.json       {"labels": ["Tomato___Early_blight", ...]}
```

The label list must be in the model's output order and the same length as the
output layer — `classify()` refuses to guess if they disagree.

`app/services/classifier.py` reads the input height and width off the graph, so
a model that expects something other than 224×224 works without a code change.
Preprocessing is RGB, resize, scale to 0–1, ImageNet mean/std, NCHW. If the
model was trained with different preprocessing, change `_preprocess`.

Until both files exist, `POST /api/farmers/diagnose` returns **503** naming
what is missing. It never falls back to a guessed diagnosis — the flagship
module either runs a real classifier or says it cannot.

Override the path with `CROP_MODEL_PATH` in `backend/.env`.
