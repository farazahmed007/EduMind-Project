import os
from cerebras.cloud.sdk import Cerebras


api_key = os.getenv("CEREBRAS_API_KEY")

if not api_key:
    raise RuntimeError(
        "CEREBRAS_API_KEY is not set."
    )


model = os.getenv(
    "CEREBRAS_MODEL",
    "qwen-3.8-27b",
)


client = Cerebras(
    api_key=api_key
)


response = client.chat.completions.create(
    model=model,
    messages=[
        {
            "role": "user",
            "content": (
                "Reply with exactly: "
                "EduMind Cerebras test successful"
            ),
        }
    ],
    temperature=0.2,
    max_completion_tokens=100,
)


answer = response.choices[0].message.content

print(answer)