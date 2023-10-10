let puzzleNumber = Math.floor(Math.random() * 21);
document.getElementById('newButton').textContent = `Puzzle ${puzzleNumber}`;

let letters;
let letterTracker = {};
let tickCounter = 0;
let simulation;
let word;
let newRun = true;
let touchStartPosition = { x: 0, y: 0 };

let currentWordLetterIDs = new Set();

const puzzles = {
    0: "DikembeMutomboMpolondoMukambaJeanJacquesWamutombo",
    1: "supercalifragilisticexpialidocious",
    2: "antidisestablishmentarianism",
    3: "floccinaucinihilipilification",
    4: "pneumonoultramicroscopicsilicovolcanoconiosis",
    5: "hippopotomonstrosesquippedaliophobia",
    6: "hydrochlorofluorocarbon",
    7: "counterdemonstration",
    8: "uncharacteristically",
    9: "overenthusiastically",
    10: "anthropomorphization",
    11: "deinstitutionalizing",
    12: "nonrepresentational",
    13: "disproportionality",
    14: "counterintelligence",
    15: "tetrahydrocannabinol",
    16: "antienvironmentalist",
    17: "neurotransmitter",
    18: "circumnavigation",
    19: "mischaracterization",
    20: "nonproliferation"
};

function setupGame(rand=false) {

    if (rand) {
        puzzleNumber = Math.floor(Math.random() * 21);
        document.getElementById('newButton').textContent = `Puzzle ${puzzleNumber}`;
    }

    newRun = true
    // Reset the letters
    word = puzzles[puzzleNumber].toUpperCase().split('').sort(() => Math.random() - 0.5).join('');
    letters = [...word].map((letter, id) => ({ letter, id, r: 25 }));

    // Initialize letter tracker
    letterTracker = {};
    letters.forEach(({ id }) => {
        letterTracker[id] = {
            letter: word[id],
            state: 'default',
            words: []
        };
    });

    // Reset the input value and word list
    document.getElementById('word-input').textContent = "PANDAGRAM";
    document.getElementById('word-list').innerHTML = `
    <div id="word-list">
    Use each letter at least once in as few words as possible. 
    <br>
    Letters cannot be re-used within a word.
</div>`;


    // Set up the simulation
    simulation = d3.forceSimulation(letters)
        .force("center", d3.forceCenter(width / 2, height / 3.5))
        .force("collide", d3.forceCollide().radius(d => d.r + 3).iterations(10).strength(1))
        .force("x", d3.forceX(width / 2).strength(0.03))
        .force("y", d3.forceY(height / 2).strength(0.03))
        .on("tick", () => {
            drawCircles();
            tickCounter++;
            if (tickCounter >= 200) {
                simulation.stop();
            }
        }); 

    tickCounter = 0;
    newRun = false;
}

const canvas = document.createElement('canvas');
canvas.style.background = 'transparent';
canvas.id = 'wordCanvas';
document.body.appendChild(canvas);

const context = canvas.getContext("2d");
const width = window.innerWidth;
const height = window.innerHeight;

const dpr = window.devicePixelRatio || 1;
canvas.width = width * dpr;
canvas.height = height * dpr;
canvas.style.width = `${width}px`;
canvas.style.height = `${height}px`;
context.scale(dpr, dpr);

const drawCircles = () => {
    context.clearRect(0, 0, width, height);

    // First draw all the circles except the dragged circle
    for (let circle of letters) {
        if (circle !== draggedCircle) {
            drawCircle(circle);
        }
    }

    // Now draw the dragged circle (if it exists) so it's on top
    if (draggedCircle) {
        drawCircle(draggedCircle);
    }
};

const circleStyle = {
    fill: {
        default: "black",
        used: "lightgreen",
        pending: "white"
    },
    font: {
        default: "24px Belanosima",
        used: "24px Belanosima",
        pending: "bold 24px Belanosima"
    },
    fontColor: {
        default: "white",
        used: "black",
        pending: "black"
    },
    stroke: {
        default: "white",
        used: "green",
        pending: "grey"
    },
    lineWidth: 4,
    textAlign: "center",
    textBaseline: "middle"
};


const drawCircle = (d) => {
    context.beginPath();
    context.arc(d.x, d.y, d.r, 0, 2 * Math.PI, false);
    
    let currentFontColor;

    switch (letterTracker[d.id].state) {
        case 'pending':
            context.fillStyle = circleStyle.fill.pending;
            context.font = circleStyle.font.pending;
            context.strokeStyle = circleStyle.stroke.pending;
            currentFontColor = circleStyle.fontColor.pending;
            break;
        case 'used':
            context.fillStyle = circleStyle.fill.used;
            context.font = circleStyle.font.used;
            context.strokeStyle = circleStyle.stroke.used;
            currentFontColor = circleStyle.fontColor.used;
            break;
        default:
            context.fillStyle = circleStyle.fill.default;
            context.font = circleStyle.font.default;
            context.strokeStyle = circleStyle.stroke.default;
            currentFontColor = circleStyle.fontColor.default;
    }
    
    context.fill();
    context.lineWidth = circleStyle.lineWidth;
    context.lineJoin = "round";
    context.lineCap = "round";
    context.stroke();
    context.fillStyle = currentFontColor;
    context.textAlign = circleStyle.textAlign;
    context.textBaseline = circleStyle.textBaseline;
    context.imageSmoothingQuality = 'high';
    context.fillText(d.letter, d.x, d.y);
};


// Function to find and increment or add to the count of an ID in a given list
const incrementOrAdd = (list, id) => {
    const found = list.find(item => item.id === id);
    if (found) {
        found.count++;
    } else {
        list.push({ id, count: 1 });
    }
};

// Function to decrement or remove from the count of an ID in a given list
const decrementOrRemove = (list, id) => {
    const found = list.find(item => item.id === id);
    if (found) {
        found.count--;
        if (found.count === 0) {
            const index = list.indexOf(found);
            list.splice(index, 1);
        }
    }
};

canvas.addEventListener("click", event => {
    const { left, top } = canvas.getBoundingClientRect();
    const x = event.clientX - left;
    const y = event.clientY - top;

    // Find if a circle was clicked
    const clickedCircle = letters.find(d => Math.hypot(d.x - x, d.y - y) < d.r);

    if (clickedCircle && !currentWordLetterIDs.has(clickedCircle.id)) {
        const currentLetter = clickedCircle.letter;

        // Count how many times this letter occurs in the word
        const allOccurrencesOfLetter = [...word].filter(l => l === currentLetter).length;
        
        // Count how many times this letter is already used or pending
        const usedOccurrencesOfLetter = Object.values(letterTracker).filter(l => l.letter === currentLetter && l.state === 'used').length;
        const pendingOccurrencesOfLetter = Object.values(letterTracker).filter(l => l.letter === currentLetter && l.state === 'pending').length;

        // If there are still unused occurrences of this letter, add it to the input and mark as pending
        if (usedOccurrencesOfLetter + pendingOccurrencesOfLetter < allOccurrencesOfLetter) {
            if (document.getElementById('word-input').textContent === "PANDAGRAM") document.getElementById('word-input').textContent = "";
            document.getElementById('word-input').textContent += clickedCircle.letter;

            // Using the id directly to update letterTracker
            letterTracker[clickedCircle.id].state = 'pending';

            // Add the ID to the currentWordLetterIDs set
            currentWordLetterIDs.add(clickedCircle.id);
        }
        
        drawCircles();  // Redraw circles to reflect changes.
    }
    
});


async function isDictionaryWord(word) {
    try {
        const response = await fetch(`https://api.datamuse.com/words?sp=${word}&max=1`);
        const data = await response.json();
        return data.length > 0 && data[0].word === word;
    } catch (err) {
        console.error("Error verifying word:", err);
        return false;
    }
}

const clearWord = () => {
    const input = document.getElementById('word-input');

    // Revert pending letters to their saved state
    for (let id in letterTracker) {
        if (letterTracker[id].state === 'pending') {
            // Check if the letter was previously in valid words
            if (letterTracker[id].words.length > 0) {
                letterTracker[id].state = 'used';
            } else {
                letterTracker[id].state = 'default';
            }
        }
    }

    // Clear the currentWordLetterIDs set
    currentWordLetterIDs.clear();

    // Reset input value
    input.textContent = "PANDAGRAM";
    input.style.color = "white";
    drawCircles();
};

const submitWord = async () => {
    const input = document.getElementById('word-input');
    const wordList = document.getElementById('word-list');
    const inputValue = input.textContent;

    // Validate the input is in the dictionary
    const isLegitWord = await isDictionaryWord(inputValue.toLowerCase());
    if (!isLegitWord) {
        input.style.color = "red";
        setTimeout(function() {
            
            // Revert pending letters to their saved state
            for (let id in letterTracker) {
                if (letterTracker[id].state === 'pending') {
                    // Check if the letter was previously in valid words
                    if (letterTracker[id].words.length > 0) {
                        letterTracker[id].state = 'used';
                    } else {
                        letterTracker[id].state = 'default';
                    }
                }
            }

             // Clear the currentWordLetterIDs set
            currentWordLetterIDs.clear();
            
            // Reset input value
            input.textContent = "PANDAGRAM";
            input.style.color = "white";
            drawCircles();
            return;

         }, 2000);
        
        return;

    }

    // Update letter tracker for the submitted word
    let processedIds = []; // To keep track of processed ids

    inputValue.split('').forEach(letter => {
        const id = Object.keys(letterTracker).find(id => {
            return letterTracker[id].letter === letter && 
                letterTracker[id].state === 'pending' && 
                !processedIds.includes(id);
        });
        if (id) {
            letterTracker[id].state = 'used';
            if (!letterTracker[id].words.includes(inputValue)) {
                letterTracker[id].words.push(inputValue);
            }
            processedIds.push(id); // Add the processed id to the list
        }
    });
        
    if (document.getElementsByClassName('used-word').length === 0) {
        wordList.innerHTML = "";
    }

    // Clear the currentWordLetterIDs set
    currentWordLetterIDs.clear();


    wordList.insertAdjacentHTML('beforeend', `<span class='used-word' onclick="removeWord(this, [${processedIds}])">${inputValue}</span>`);

    drawCircles();
    input.textContent = "PANDAGRAM";
    checkWin();
    
};


function removeWord(elem, ids) {
    elem.style.color = "red";
    setTimeout(function() {
        ids.forEach(id => {
            const tracker = letterTracker[id];
            tracker.words = tracker.words.filter(word => !elem.textContent.includes(word));

            // If the letter is not in any other words, set its state to 'default'
            if (tracker.words.length === 0 && tracker.state !== 'default') {
                tracker.state = 'default';
            }
        });
        elem.remove();
        if (document.getElementsByClassName('used-word').length === 0) {
            document.getElementById('word-list').innerHTML = `
            <div id="word-list">
            Use each letter at least once in as few words as possible. 
            <br>
            Letters cannot be re-used within a word.
        </div>`;
        }

        drawCircles(); 
        checkWin();
    }, 2000);
        
    return;

}


const checkWin = () => {
    if (Object.values(letterTracker).every(entry => entry.state === 'used')) alert("You win!");
};

let draggedCircle = null;


function updateWordInput(newLetter) {
    const inputSpan = document.getElementById('word-input');
    inputSpan.textContent += newLetter;

    let letterCounts = {};

    for (let char of inputSpan.textContent) {
        letterCounts[char] = (letterCounts[char] || 0) + 1;
    }

    inputSpan.textContent = Array.from(inputSpan.textContent).filter(char => {
        const charCountInWord = word.split(char).length - 1;
        if (letterCounts[char] > charCountInWord) {
            letterCounts[char]--;
            return false;
        }
        return true;
    }).join('');

    for (const id in letterTracker) {
        if (inputSpan.textContent.includes(letterTracker[id].letter)) {
            letterTracker[id].state = 'pending';
        } else if (letterTracker[id].words.length === 0) {
            letterTracker[id].state = 'default';
        }
    }

    drawCircles();
}


function shuffleLetters() {
    // Randomize the positions of the letters
    letters.forEach(letter => {
        letter.x = Math.random() * width;
        letter.y = Math.random() * height;
    });

    // Reheat the simulation to animate the letters back into position
    tickCounter = 0;
    simulation.alpha(1).restart();
    
}

canvas.addEventListener("touchstart", event => {
    const { left, top } = canvas.getBoundingClientRect();
    const x = event.touches[0].clientX - left;
    const y = event.touches[0].clientY - top;
    touchStartPosition = { x, y };

    // Fix the positions of all nodes
    letters.forEach(l => {
        l.fx = l.x;
        l.fy = l.y;
    });

    draggedCircle = letters.find(d => Math.hypot(d.x - x, d.y - y) < d.r);
    if (draggedCircle) {
        draggedCircle.fx = draggedCircle.x;
        draggedCircle.fy = draggedCircle.y;
        simulation.alphaTarget(0.3).restart();
        event.preventDefault(); // Prevent scrolling while dragging
    }
});


canvas.addEventListener("touchmove", event => {
    if (draggedCircle) {
        const { left, top } = canvas.getBoundingClientRect();
        const x = event.touches[0].clientX - left; // Use the first touch
        const y = event.touches[0].clientY - top;
        draggedCircle.fx = x;
        draggedCircle.fy = y;
        tickCounter = 0;
        simulation.alpha(1).restart();
        drawCircles(); // You might need to redraw circles here depending on your implementation
        event.preventDefault(); // Prevent scrolling while dragging
    }
});

canvas.addEventListener("touchend", (event) => {

    if (draggedCircle) {
        const { left, top } = canvas.getBoundingClientRect();
        const x = event.changedTouches[0].clientX - left;  // changedTouches for touchend
        const y = event.changedTouches[0].clientY - top;

        // Calculate the distance moved during the touch
        const distanceMoved = Math.hypot(touchStartPosition.x - x, touchStartPosition.y - y);
        
        // If the touch moved very little, treat it as a click
        if (distanceMoved < 25) {  
            const clickedCircle = letters.find(d => Math.hypot(d.x - x, d.y - y) < d.r);
            
            if (clickedCircle && !currentWordLetterIDs.has(clickedCircle.id)) {
                if (document.getElementById('word-input').textContent === "PANDAGRAM") document.getElementById('word-input').textContent = "";
                    document.getElementById('word-input').textContent += clickedCircle.letter;
                    letterTracker[clickedCircle.id].state = 'pending';
                    drawCircles();  // Redraw circles to reflect changes.

                if (document.getElementById('word-input').textContent.length > 3){
                    document.getElementById('submit-button').textContent = "Submit";
                } else {
                    document.getElementById('submit-button').textContent = "4 Letter Min";
                }

                // Add the ID to the currentWordLetterIDs set
                currentWordLetterIDs.add(clickedCircle.id);
            }
        }

        const overlappedCircle = letters.find(d => d !== draggedCircle && Math.hypot(d.x - draggedCircle.x, d.y - draggedCircle.y) <= 20);

        if (overlappedCircle) {
            // Swap their positions without re-running the simulation
            const originalDraggedX = touchStartPosition.x;
            const originalDraggedY = touchStartPosition.y;

            overlappedCircle.x = originalDraggedX;
            overlappedCircle.y = originalDraggedY;
        }

        // Release the positions of all nodes
        letters.forEach(l => {
            l.fx = null;
            l.fy = null;
        });

        draggedCircle = null;
        drawCircles();
    }
});




// Initialize the game on window load
setupGame(puzzleNumber);