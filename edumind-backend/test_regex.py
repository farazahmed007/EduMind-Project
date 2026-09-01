import re
from typing import List

def clean_option_text(option: str) -> str:
    option = str(option).strip()
    option = re.sub(
        r"^\s*(?:option\s+(?:[a-d]|[1-4])[\.\):\-]?|\([a-d]\)|\([1-4]\)|[a-d][\.\):\-]|[1-4][\.\):\-])\s*",
        "",
        option,
        flags=re.IGNORECASE,
    )
    return option.strip()

def normalize_quiz_string(text: str) -> str:
    text = str(text).strip().lower()
    text = re.sub(
        r"^\s*(?:option\s+(?:[a-d]|[1-4])[\.\):\-]?|\([a-d]\)|\([1-4]\)|[a-d][\.\):\-]|[1-4][\.\):\-])\s*",
        "",
        text,
        flags=re.IGNORECASE,
    )
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"[^a-z0-9\s]", "", text)
    return text.strip()

def are_similar_texts(first: str, second: str, threshold: float = 0.92) -> bool:
    from difflib import SequenceMatcher
    first_normalized = normalize_quiz_string(first)
    second_normalized = normalize_quiz_string(second)
    if not first_normalized or not second_normalized:
        return False
    if first_normalized == second_normalized:
        return True
    return SequenceMatcher(None, first_normalized, second_normalized).ratio() >= threshold

def match_correct_answer(correct_answer: str, options: List[str]) -> str:
    answer = str(correct_answer).strip()
    if not answer:
        return None

    # letter
    letter_match = re.fullmatch(r"\(?([a-d])\)?(?:[\.\):\-])?", answer, flags=re.IGNORECASE)
    if letter_match:
        index = ord(letter_match.group(1).upper()) - ord("A")
        if 0 <= index < len(options):
            return options[index]

    # option letter
    option_letter_match = re.fullmatch(r"option\s*\(?([a-d])\)?(?:[\.\):\-])?", answer, flags=re.IGNORECASE)
    if option_letter_match:
        index = ord(option_letter_match.group(1).upper()) - ord("A")
        if 0 <= index < len(options):
            return options[index]

    # option number
    option_match = re.fullmatch(r"option\s*([1-4])(?:[\.\):\-])?", answer, flags=re.IGNORECASE)
    if option_match:
        index = int(option_match.group(1)) - 1
        if 0 <= index < len(options):
            return options[index]

    # number
    number_match = re.fullmatch(r"[1-4](?:[\.\):\-])?", answer)
    if number_match:
        index = int(number_match.group()) - 1
        if 0 <= index < len(options):
            return options[index]

    cleaned_answer = clean_option_text(answer)
    normalized_answer = normalize_quiz_string(cleaned_answer)

    for option in options:
        if normalize_quiz_string(option) == normalized_answer:
            return option

    matches = []
    for option in options:
        normalized_option = normalize_quiz_string(option)
        if not normalized_option:
            continue
        if normalized_answer in normalized_option or normalized_option in normalized_answer:
            matches.append(option)
    if len(matches) == 1:
        return matches[0]

    return None

print(match_correct_answer("A", ["Continuous", "Discrete", "Both", "Neither"]))
print(match_correct_answer("D", ["Graph", "Finite set", "Logic", "Real numbers"]))
