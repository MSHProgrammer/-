# -*- coding: utf-8 -*-
import json
import random
import sys

# Master Python script that compiles 500 rich, educational, verified Arabic trivia questions
# into src/data/trivia500Bank.ts for JAMR platform.

raw_pool = []

def q(text, correct, wrongs, cat, exp):
    opts = [correct] + list(wrongs)
    random.shuffle(opts)
    raw_pool.append({
        "question": text,
        "correctAnswer": correct,
        "options": opts,
        "category": cat,
        "explanation": exp
    })

# Run builder
print("Assembling 500 questions...")
