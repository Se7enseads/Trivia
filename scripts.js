// Add event listener for the send button click event
document.getElementById('send-button').addEventListener('click', sendMessage);

// Add event listener for the Enter key press in the message input field
document.getElementById('message-input').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
});

// Initialize variables to keep track of the current question, total questions, user answers, and user preferences
let currentQuestionIndex = 0;
let totalQuestions = 0;
let userAnswers = [];
let userPreferences = {};

// Add an initial bot message when the DOM content is loaded
document.addEventListener('DOMContentLoaded', function() {
    addBotMessage('Welcome to Trivia Chat! Please choose type a category');
});

// Function to handle sending messages
function sendMessage() {
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim(); // Get the user input and trim whitespace
    if (message === '') return; // If the message is empty, do nothing

    addUserMessage(message); // Display the user message in the chat
    messageInput.value = ''; // Clear the input field

    // Handle the conversation flow based on the user's progress
    if (currentQuestionIndex === 0 && !userPreferences.category) {
        userPreferences.category = message; // Save the user's category preference
        addBotMessage('Great! Now, please choose a difficulty level: Easy, Medium, or Hard.');
    } else if (!userPreferences.difficulty) {
        userPreferences.difficulty = message; // Save the user's difficulty preference
        addBotMessage('Awesome! How many questions would you like to answer?(limit 50)');
    } else if (!userPreferences.amount) {
        userPreferences.amount = message; // Save the user's amount preference
        fetchQuestions(); // Fetch questions from the server
    } else {
        processAnswer(message); // Process the user's answer to a question
    }
}

// Function to add a user message to the chat
function addUserMessage(message) {
    const chatArea = document.getElementById('chat-area');
    const userMessageElement = document.createElement('div');
    userMessageElement.classList.add('mb-2', 'text-right');
    userMessageElement.innerHTML = `<span class="inline-block bg-blue-500 text-white p-2 rounded-lg">${message}</span>`;
    chatArea.appendChild(userMessageElement);
    chatArea.scrollTop = chatArea.scrollHeight; // Scroll to the bottom of the chat area
}

// Function to add a bot message to the chat
function addBotMessage(message) {
    const chatArea = document.getElementById('chat-area');
    const botMessageElement = document.createElement('div');
    botMessageElement.classList.add('mb-2', 'text-left');
    botMessageElement.innerHTML = `<span class="inline-block bg-gray-300 p-2 rounded-lg">${message}</span>`;
    chatArea.appendChild(botMessageElement);
    chatArea.scrollTop = chatArea.scrollHeight; // Scroll to the bottom of the chat area
}

// Function to fetch questions from the server
function fetchQuestions() {
    fetch('http://localhost:5000/get_questions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userPreferences) // Send the user's preferences as the request body
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            addBotMessage(data.error); // Display an error message if there is an error
            return;
        }
        totalQuestions = data['total_questions']; // Save the total number of questions
        askNextQuestion(); // Ask the first question
    })
    .catch(error => console.error('Error fetching questions:', error));
}

// Function to ask the next question
function askNextQuestion() {
    fetch(`http://localhost:5000/get_question/${currentQuestionIndex}`)
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            addBotMessage(data.error); // Display an error message if there is an error
            return;
        }
        addBotMessage(`Question ${currentQuestionIndex + 1}: ${data.question}`); // Display the question
        data['answers'].forEach((answer, index) => {
            addBotMessage(`(${index + 1}) ${answer}`); // Display the possible answers
        });
    })
    .catch(error => console.error('Error fetching question:', error));
}

// Function to process the user's answer
function processAnswer(userAnswer) {
    userAnswers.push(userAnswer); // Save the user's answer
    currentQuestionIndex++; // Move to the next question

    if (currentQuestionIndex < totalQuestions) {
        addBotMessage('Great! Here is your next question.');
        askNextQuestion(); // Ask the next question
    } else {
        addBotMessage('Thanks for playing! Calculating your score...');
        submitAnswers(); // Submit the user's answers for scoring
    }
}

// Function to submit the user's answers to the server
function submitAnswers() {
    fetch('http://localhost:5000/submit_answers', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(userAnswers) // Send the user's answers as the request body
    })
    .then(response => response.json())
    .then(data => {
        addBotMessage(`Your score: ${data.score}`); // Display the user's score
        addBotMessage('To play again refresh the page'); // Prompt the user to refresh the page to play again
    })
    .catch(error => console.error('Error submitting answers:', error));
}
