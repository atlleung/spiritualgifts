// identify which version of the quiz to use based on hash
let VERSION = window.location.hash.substring(1);
if (VERSION != 'adult' && VERSION != 'youth') {
    VERSION = 'adult';
}

const question_component = (question, category, index) => {
    let radiobuttons = Array(10).fill(1).map((_, i) => `<input type="radio" class="btn-check" name="question${index}" autocomplete="off" value="${i}" id="c${index}-${i}" data-category="${category}"><label class="btn btn-outline-secondary btn-sm" for="c${index}-${i}">${i + 1}</label>`).join('');

    return `<div class="card my-4">
        <div class="card-body">
          <div class="card-title mb-4 fw-medium">
            ${index + 1}. ${question}
          </div>
          <div class="d-flex justify-content-between">
            ${radiobuttons}
            </div>
          <div class="row fs-small mt-1">
          ${VERSION == 'adult' ? `
            <div class="col">Not me at all</div>
            <div class="col text-end">100% me</div>` : `
            <div class="col">NOPE</div>
            <div class="col text-end">IT ME</div>`
        }
          </div>
        </div>
      </div>`
};

const generateCard = (gift) => {
    // Retrieve the gift information
    const giftInfo = CATEGORY.adult[gift];

    if (!giftInfo) {
        console.error(`Gift ${gift} not found`);
        return;
    }

    // Create the card container
    const card = document.createElement("div");
    card.classList.add("card");

    // Create the Blurb element
    const blurb = document.createElement("p");
    blurb.classList.add("blurb");
    blurb.innerHTML = giftInfo.Blurb;

    // Create the Attributes header
    const attributesHeader = document.createElement("h4");
    attributesHeader.innerHTML = "Attributes";

    // Create the Attributes element
    const attributes = document.createElement("ul");
    attributes.classList.add("attributes");
    for (let i = 0; i < giftInfo.Attributes.length; i++) {
        let attribute = document.createElement("li");
        attribute.innerHTML = giftInfo.Attributes[i].attribute;
        attributes.appendChild(attribute);
    }

    // Create the References header
    const referencesHeader = document.createElement("h4");
    referencesHeader.innerHTML = "References";

    // Create the References element
    const references = document.createElement("ul");
    references.classList.add("references");
    for (let i = 0; i < giftInfo.References.length; i++) {
        let reference = document.createElement("li");
        reference.innerHTML = giftInfo.References[i].ref;
        references.appendChild(reference);
    }
    // Append the elements to the card
    card.appendChild(blurb);
    card.appendChild(attributesHeader);
    card.appendChild(attributes);
    card.appendChild(referencesHeader);
    card.appendChild(references);

    // Return the generated card HTML
    return card.innerHTML;
};

const progress_component = (width, text, category) => `
<div class="progress my-2" style="height: 1.5rem;" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${category}" aria-expanded="false" aria-controls="collapse${category}">
    <div
        class="progress-bar bg-babyblue text-nowrap"
        role="progressbar"
        style="width: ${width}%"
    ></div>
    <div class="justify-content-left align-self-center ps-4 d-flex position-absolute w-100 fs-6 fw-medium">${text}</div>
</div>

<div class="collapse" id="collapse${category}">
    <div class="card card-body">${generateCard(category)}</div>
</div>`;

// score quiz
const score_quiz = () => {
    // get all the question types
    let categories = SURVEY[VERSION].map((q) => q.category);

    // get unique categories
    categories = [...new Set(categories)];

    // create an object to store the scores
    let scores = {};

    // loop through the categories
    categories.forEach((category) => {
        // get all questions for the category
        let catqs = document.querySelectorAll(`[data-category="${category}"]:checked`);

        // get the score for the category
        let score = 0;
        catqs.forEach((q) => {
            let value = parseInt(q.value);
            score += value;
        });

        // store the score
        scores[category] = score;
    });

    // write scores to screen
    let max_score = Object.keys(scores).reduce((max, category) => Math.max(max, scores[category]), 0);
    let html_scores = Object.keys(scores).map((category) => {
        let width = scores[category] / max_score * 100;
        return [width, progress_component(width, category + ': ' + scores[category], category)];
    });

    // sort by width
    html_scores.sort((a, b) => b[0] - a[0]);

    // remove width
    html_scores = html_scores.map((s) => s[1]).join('');

    const resultsdiv = document.getElementById('results');
    resultsdiv.innerHTML = `<h3 class="mt-5 mb-4">Your personal spiritual gifts inventory </h3>
    <p><b>(Click to see definitions)</b></p>` + html_scores;
    resultsdiv.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // biblegateway reftagger
    BGLinks.linkVerses();
};

const update_main_progress = () => {
    let progress = localStorage.getItem('progress-' + VERSION);
    if (progress) {
        progress = JSON.parse(progress);
        progress = progress.length;
    } else {
        progress = 0;
    }

    let totalqs = SURVEY[VERSION].length;

    document.getElementById("mainprogressbar").style.width = (progress / totalqs * 100) + '%';
    document.getElementById("mainprogresstext").innerText = progress + ' / ' + totalqs;
};


// loop through questions and write to screen
let html_questions = SURVEY[VERSION].map((q, i) => {
    return question_component(q.question, q.category, i);
}).join('');
document.getElementById('qcontainer').innerHTML = html_questions;
update_main_progress();


// bind submit button
document.getElementById('btnSubmit').addEventListener('click', score_quiz);


// check if there's an in-progress version already, and restore it
let progress = localStorage.getItem('progress-' + VERSION);

if (progress) {
    progress = JSON.parse(progress);

    document.querySelectorAll('.btn-check').forEach((el) => {
        el.checked = false;
    });

    // loop through the progress and set the values
    for (let sel of progress) {
        document.getElementById(sel).checked = true;
    }

    update_main_progress();
}


// bind change event to all the questions
document.querySelectorAll('.btn-check').forEach((el) => {
    el.addEventListener('change', (e) => {
        // scroll to next question
        let next = el.closest('.card').nextElementSibling;
        if (next) {
            next.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // save progress
        let progress = Array.from(document.querySelectorAll('.btn-check:checked')).map((el) => el.id);

        localStorage.setItem('progress-'
            + VERSION, JSON.stringify(progress));

        update_main_progress();
    });
});

// bind clear event
document.getElementById('btnClear').addEventListener('click', (e) => {
    localStorage.removeItem('progress-' + VERSION);

    document.querySelectorAll('.btn-check').forEach((el) => {
        el.checked = false;
    });
    document.getElementById('results').innerText = "";
    update_main_progress();
});

