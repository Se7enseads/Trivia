from flask import Flask, request, jsonify
import requests
import random
import spacy
from flask_cors import CORS

# Initialize the Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load the spaCy model for English language processing
nlp = spacy.load('en_core_web_md')

# Dictionary mapping category names to their corresponding IDs in OpenTDB
categories = {
    "general knowledge": 9,
    "books": 10,
    "film": 11,
    "music": 12,
    "science": 17,
    "sports": 21,
    "geography": 22,
    "history": 23,
    "politics": 24,
    "art": 25,
    "celebrities": 26,
    "animals": 27,
    "vehicles": 28,
    "comics": 29,
    "gadgets": 30,
    "anime & manga": 31,
    "cartoon & animations": 32
}


# Function to find the closest matching category based on user input
def get_closest_category(user_input):
    user_doc = nlp(user_input.lower())  # Convert user input to a spaCy document
    highest_similarity = 0
    best_match = 'general knowledge'  # Default category

    # Compare user input with each category to find the best match
    for category in categories.keys():
        category_doc = nlp(category)
        similarity = user_doc.similarity(category_doc)
        if similarity > highest_similarity:
            highest_similarity = similarity
            best_match = category

    return categories[best_match]  # Return the ID of the best matching category


# Route to get trivia questions based on user input
@app.route('/get_questions', methods=['POST'])
def get_questions():
    data = request.json  # Get the JSON data from the request
    category_input = data.get('category', '')  # Get the category input from the user
    difficulty = data.get('difficulty', 'easy').lower()  # Get the difficulty level
    amount = data.get('amount', '10')  # Get the number of questions requested

    category_id = get_closest_category(category_input)  # Get the ID of the closest matching category

    # Make a request to the OpenTDB API to fetch questions
    response = requests.get(
        f'https://opentdb.com/api.php?amount={amount}&category={category_id}&difficulty={difficulty}')
    questions = response.json()['results']  # Parse the response JSON

    # Shuffle the answers for each question
    for question in questions:
        question['answers'] = question['incorrect_answers'] + [question['correct_answer']]
        random.shuffle(question['answers'])

    app.config['QUESTIONS_CACHE'] = questions  # Cache the questions in the app config

    return jsonify({'total_questions': len(questions)})  # Return the total number of questions


# Route to get a specific question by its ID
@app.route('/get_question/<int:question_id>', methods=['GET'])
def get_question(question_id):
    questions = app.config.get('QUESTIONS_CACHE', [])  # Retrieve the cached questions
    if question_id < len(questions):
        return jsonify(questions[question_id])  # Return the question if it exists
    return jsonify({'error': 'Question not found'}), 404  # Return an error if the question ID is out of range


# Route to submit answers and calculate the score
@app.route('/submit_answers', methods=['POST'])
def submit_answers():
    answers = request.json  # Get the JSON data containing user answers
    questions = app.config.get('QUESTIONS_CACHE', [])  # Retrieve the cached questions

    score = 0  # Initialize the score

    # Compare user answers with correct answers and calculate the score
    for idx, question in enumerate(questions):
        correct = question['correct_answer']
        correct_answer = question['answers'].index(correct) + 1
        user_answer = answers[idx]

        if int(user_answer) == correct_answer:
            score += 1

    return jsonify({'score': score})  # Return the score


# Run the Flask app
if __name__ == '__main__':
    app.run(debug=True)
