'use strict';

var margin = 50;

function px(str) {
    return str + 'px';
}

var derivationSteps = [];
function initDerivationSteps(containerId, numberOfSteps) {
    var container = document.getElementById(containerId);
    var stepDimensions = calculateStepDimensions(container, numberOfSteps, margin);
    var stepPositions = calculateStepPositions(stepDimensions, numberOfSteps, margin);
    createDerivationSteps(container, stepDimensions, stepPositions);
}

function calculateStepDimensions(container, numberOfSteps, margin) {
    var containerRect = container.getBoundingClientRect();
    return {
        width: Math.round((containerRect.width - margin * 2) / 5),
        height: Math.round((containerRect.height - margin * 2) / numberOfSteps)
    };
}

function calculateStepPositions(stepDimensions, numberOfSteps, margin) {
    var positions = [];
    var top = margin;
    var leftColumnLeft = margin + stepDimensions.width;
    var rightColumnLeft = leftColumnLeft + stepDimensions.width * 2;
    for (var i = 0; i < numberOfSteps; i++) {
        var position = [];
        position.push(i % 2 == 0 ? leftColumnLeft : rightColumnLeft);
        position.push(top);
        top += stepDimensions.height;
        positions.push(position);
    }
    return positions;
}

function createDerivationSteps(container, stepDimensions, stepPositions) {
    stepPositions.forEach(function (position, idx) {
        var step = createDerivationStep(idx + 1, stepDimensions, position);
        container.appendChild(step);
        setupDrag(step);
        derivationSteps.push(step);
    });
}

function createDerivationStep(id, stepDimensions, position) {
    var step = document.createElement('div');
    step.className = 'step';
    step.id = "step-" + id;
    appendStepTag(step, id);
    step.style.width = px(stepDimensions.width);
    step.style.height = px(stepDimensions.height);
    step.style.left = px(position[0]);
    step.style.top = px(position[1]);
    return step;
}

function appendStepTag(step, id) {
    var tag = document.createElement("div");
    tag.innerHTML = id;
    tag.className = "tag";
    step.appendChild(tag);
}

function setupDrag(element) {
    var startX = 0,
        startY = 0,
        currX = 0,
        currY = 0;
    element.onmousedown = dragMouseDown;

    var previousStep = null;
    var previousBox = null;
    var nextStep = null;
    var nextBox = null;

    function dragMouseDown(evt) {
        evt = evt || window.event;
        startX = evt.clientX;
        startY = evt.clientY;
        document.onmousemove = elementDrag;
        document.onmouseup = closeDragElement;
        derivationSteps.forEach(wasNotHit);
        previousStep = getPreviousStep(element);
        if (previousStep) previousBox = calculateBottomHitBox(previousStep);
        nextStep = getNextStep(element);
        if (nextStep) nextBox = calculateTopHitBox(nextStep);
    }

    function elementDrag(evt) {
        evt = evt || window.event;
        // calculate the new cursor position:
        currX = startX - evt.clientX;
        currY = startY - evt.clientY;
        startX = evt.clientX;
        startY = evt.clientY;
        // set the element's new position:
        element.style.top = element.offsetTop - currY + "px";
        element.style.left = element.offsetLeft - currX + "px";
        var collisionWithPrevious = false;
        var collisionWithNext = false;
        if (previousBox) {
            collisionWithPrevious = collision(previousBox, calculateTopHitBox(element));
            handleCollision(previousStep, collisionWithPrevious);
        }
        if (nextBox) {
            collisionWithNext = collision(nextBox, calculateBottomHitBox(element));
            handleCollision(nextStep, collisionWithNext);
        }
        handleCollision(element, collisionWithPrevious || collisionWithNext);
    }

    function closeDragElement() {
        /* stop moving when mouse button is released:*/
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

function getPreviousStep(element) {
    var idx = derivationSteps.indexOf(element);
    if (idx > 0) {
        return derivationSteps[idx - 1];
    } else {
        return null;
    }
}

function getNextStep(element) {
    var idx = derivationSteps.indexOf(element);
    if (idx < derivationSteps.length - 1) {
        return derivationSteps[idx + 1];
    } else {
        return null;
    }
}

function calculateBottomHitBox(element) {
    var bottom = element.offsetTop + element.offsetHeight;
    return {
        x: element.offsetLeft,
        width: element.offsetWidth,
        y: element.offsetTop + element.offsetHeight / 2,
        height: element.offsetHeight / 2
    };
}

function calculateTopHitBox(element) {
    return {
        x: element.offsetLeft,
        width: element.offsetWidth,
        y: element.offsetTop,
        height: element.offsetHeight / 2
    };
}

function collision(rect1, rect2) {
    if (rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x && rect1.y < rect2.y + rect2.height && rect1.height + rect1.y > rect2.y) {
        return true;
    }
    return false;
}

function handleCollision(element, collision) {
    if (collision) {
        wasHit(element);
    } else {
        wasNotHit(element);
    }
}

function wasHit(element) {
    element.classList.add("hit");
}

function wasNotHit(element) {
    element.classList.remove("hit");
}