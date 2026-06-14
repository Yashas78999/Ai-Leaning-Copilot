import google.generativeai as genai
import os

api_key = os.getenv("GEMINI_API_KEY")
model = None

if api_key:
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.5-flash")
        print("Gemini generative model successfully configured.")
    except Exception as err:
        print(f"Error configuring generative model: {err}")
else:
    print("Warning: GEMINI_API_KEY is not configured in the environment.")

# --- DYNAMIC FALLBACK MOCK DATA GENERATORS ---

def fallback_generate_notes(text: str):
    lines = [line.strip() for line in text.split('\n') if len(line.strip()) > 20]
    
    # Group lines into paragraphs for content-driven summary
    paragraphs = []
    current_para = []
    for line in lines:
        if len(line) > 50:
            current_para.append(line)
        elif line.endswith('.') and current_para:
            current_para.append(line)
            paragraphs.append(" ".join(current_para))
            current_para = []
            if len(paragraphs) >= 5:
                break
    if current_para and len(paragraphs) < 5:
        paragraphs.append(" ".join(current_para))
        
    summary = paragraphs[0] if paragraphs else "This study guide provides a detailed review of the key concepts and topics covered in the uploaded document."
    
    notes = f"""# Study Notes: Course Overview & Summary

{summary}

## Important Concepts & Terminology
"""
    if len(paragraphs) > 1:
        for i, para in enumerate(paragraphs[1:4]):
            notes += f"\n### Concept {i+1}\n{para}\n"
    else:
        notes += """
### Active Recall & Spaced Repetition
Reviewing material actively through self-testing (active recall) and spreading reviews out over time (spaced repetition) are proven cognitive science strategies for long-term knowledge retention.
"""
        
    # Extract short sentences to build a custom revision list
    bullet_points = [line for line in lines if len(line) > 30 and len(line) < 120][:6]
    notes += "\n## Key Points & Takeaways\n"
    if bullet_points:
        for bp in bullet_points:
            notes += f"* {bp.replace('*', '').replace('-', '').strip()}\n"
    else:
        notes += """
* Analyze primary documents and source literature systematically.
* Engage in active learning through testing and practice quizzes.
* Implement structured daily schedules to stay aligned with course goals.
"""

    notes += """
## Exam Revision Guidelines
* Focus on core definitions and conceptual links.
* Test your recall using the practice flashcard decks.
* Re-evaluate your subject mastery with custom quiz evaluation sets.
"""
    return notes


def fallback_generate_flashcards(text: str):
    lines = [line.strip() for line in text.split('\n') if len(line.strip()) > 35]
    if not lines:
        lines = [
            "Active recall is a highly effective learning technique that improves long-term memory.",
            "Spaced repetition involves reviewing information at increasing intervals to combat the forgetting curve.",
            "FastAPI is a modern web framework for building APIs with Python based on standard type hints.",
            "SQLAlchemy is an open-source SQL toolkit and object-relational mapper for Python."
        ]
    
    flashcards_text = ""
    for i, line in enumerate(lines[:12]):
        words = line.split()
        if len(words) > 6:
            q = f"Explain the key concept related to: {' '.join(words[:4])}..."
            a = line
        else:
            q = f"What is the significance of the term: '{line}'?"
            a = "It represents a critical component discussed in the study material."
        
        flashcards_text += f"Q: {q}\nA: {a}\n\n"
    return flashcards_text


def fallback_generate_quiz(text: str):
    lines = [line.strip() for line in text.split('\n') if len(line.strip()) > 35]
    if not lines:
        lines = [
            "FastAPI is a Python web framework designed for high performance.",
            "PostgreSQL is a powerful, open-source object-relational database system.",
            "The Gemini API provides access to Google's generative models.",
            "RAG stands for Retrieval-Augmented Generation, enhancing LLM inputs with exact text."
        ]
        
    quiz_text = ""
    for i, line in enumerate(lines[:5]):
        words = line.split()
        keyword = words[0] if words else "Concept"
        correct_answer = "A"
        
        quiz_text += f"""Question: According to the document, which statement is true about {keyword}?

A) {line}
B) It has no practical relevance to the syllabus.
C) It represents a deprecated framework.
D) None of the above.

Answer: {correct_answer}

"""
    return quiz_text


def fallback_generate_study_plan(text: str, days: int):
    lines = [line.strip() for line in text.split('\n') if len(line.strip()) > 25]
    if not lines:
        lines = ["Review core principles.", "Conduct practical exercises.", "Test memory with practice questions."]
        
    plan = f"# Study Schedule: {days} Days Course Mapping\n\n"
    for day in range(1, days + 1):
        task1 = lines[(day * 2) % len(lines)] if lines else "Study chapter sections."
        task2 = lines[(day * 3) % len(lines)] if lines else "Complete practice quizzes."
        
        plan += f"""Day {day}: Conceptual Foundations & Practice
- Study task: {task1}
- Practical task: {task2}
- Revision task: Review flashcard decks for today's topics.

"""
    return plan


def fallback_ask_tutor(pdf_content: str, question: str, history: list = None):
    words = question.lower().split()
    relevant_lines = []
    for line in pdf_content.split('\n'):
        if any(word in line.lower() for word in words if len(word) > 3):
            relevant_lines.append(line.strip())
            if len(relevant_lines) >= 3:
                break
                
    if relevant_lines:
        citations = "\n".join([f"- {line}" for line in relevant_lines])
        return f"Based on your question and the study material, here is what I found:\n\n{citations}\n\nHope this helps your understanding!"
    else:
        return f"I analyzed the document regarding your question: '{question}'. While the document does not explicitly define this in a single sentence, it covers related subjects throughout the text. Try asking a question using keywords present in the document."

# --- MAIN SERVICE EXPORTS ---

def generate_notes(text: str):
    if not model:
        return fallback_generate_notes(text)
    
    prompt = f"""You are an expert AI study tutor.
Create well-structured, professional, and comprehensive study notes from the following content.
Make sure you summarize the content clearly, identify all core concepts with definitions, outline key takeaways in bullet points, and provide exam revision tips.
Answer ONLY using the provided content. If certain sections are not covered in the source text, do not invent information or hallucinate.
Format the output beautifully using markdown headings, bold text, bullet points, and tables where applicable to organize the details.

Content:
{text[:15000]}
"""

    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Gemini generation error: {e}. Falling back.")
        return fallback_generate_notes(text)


def generate_flashcards(text: str):
    if not model:
        return fallback_generate_flashcards(text)

    prompt = f"""You are an expert AI study tutor.
Create exactly 15 high-quality study flashcards from the content below.
Each flashcard must focus on key terms, definitions, and core concepts to help with active recall.
Format each flashcard exactly like:

Q: Question
A: Answer

Ensure the answers are concise, exam-focused, and based ONLY on the provided content. Do not hallucinate or invent information.

Content:
{text[:15000]}
"""

    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Gemini generation error: {e}. Falling back.")
        return fallback_generate_flashcards(text)


def generate_quiz(text: str):
    if not model:
        return fallback_generate_quiz(text)

    prompt = f"""You are an expert AI study tutor.
Create exactly 10 high-quality multiple-choice questions from the content below.
Each question must test conceptual understanding or details in the text.
Format each question exactly like:

Question: Question Text

A) Option A
B) Option B
C) Option C
D) Option D

Answer: Correct Option Letter

Ensure there is only one correct answer per question, and all choices are realistic but clearly distinguishable. Answer options and questions must be derived ONLY from the provided content. Do not invent details.

Content:
{text[:15000]}
"""

    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Gemini generation error: {e}. Falling back.")
        return fallback_generate_quiz(text)


def generate_study_plan(text: str, days: int):
    if not model:
        return fallback_generate_study_plan(text, days)

    prompt = f"""You are an expert AI study tutor.
Create a detailed, day-by-day {days}-day study plan based on the content below.
For each day, structure it with:
- Day Number (formatted as 'Day X')
- Topics to Study (specifically matching sections from the text)
- Revision Tasks (active recall actions, flashcard review, or practice quiz recommendations)

Ensure the timeline is realistic, structured, and covers the material progressively. Use ONLY details present in the provided content. Do not invent information.

Content:
{text[:15000]}
"""

    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Gemini generation error: {e}. Falling back.")
        return fallback_generate_study_plan(text, days)


def ask_tutor(pdf_content: str, question: str, history: list = None):
    if not model:
        return fallback_ask_tutor(pdf_content, question, history)

    history_str = ""
    if history:
        history_lines = []
        for msg in history:
            role = msg.role if hasattr(msg, "role") else (msg.get("role") if isinstance(msg, dict) else "")
            content = msg.content if hasattr(msg, "content") else (msg.get("content") if isinstance(msg, dict) else "")
            role_label = "Student" if role == "user" else "Tutor"
            if content:
                history_lines.append(f"{role_label}: {content}")
        if history_lines:
            history_str = "\nConversation History:\n" + "\n".join(history_lines) + "\n"

    prompt = f"""You are an expert AI study tutor.
Answer the student's question ONLY using the provided study material.
If the answer is not present in the study material, say:
'I could not find that information in the document.'

Explain concepts clearly and simply. Maintain a supportive, instructional tone.

Study Material:
{pdf_content[:15000]}
{history_str}

Student Question:
{question}
"""

    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Gemini generation error: {e}. Falling back.")
        return fallback_ask_tutor(pdf_content, question, history)


def ask_tutor_rag(context: str, question: str, history: list = None):
    if not model:
        return fallback_ask_tutor(context, question, history)

    history_str = ""
    if history:
        history_lines = []
        for msg in history:
            role = msg.role if hasattr(msg, "role") else (msg.get("role") if isinstance(msg, dict) else "")
            content = msg.content if hasattr(msg, "content") else (msg.get("content") if isinstance(msg, dict) else "")
            role_label = "Student" if role == "user" else "Tutor"
            if content:
                history_lines.append(f"{role_label}: {content}")
        if history_lines:
            history_str = "\nConversation History:\n" + "\n".join(history_lines) + "\n"

    prompt = f"""You are an expert AI study tutor.
Answer the student's question ONLY using the provided context.
If the answer is not present in the context, say:
'I could not find that information in the document.'

Explain concepts clearly and simply. Maintain a supportive, instructional tone.

Context:
{context}
{history_str}

Student Question:
{question}
"""

    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Gemini generation error: {e}. Falling back.")
        return fallback_ask_tutor(context, question, history)