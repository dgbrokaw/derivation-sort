'use strict';

var margin = 50;

function px(str) {
    return str + 'px';
}

var container = void 0;
var stepDimensions = void 0;
var derivationSteps = [];
function initDerivationSteps(containerId, numberOfSteps) {
    container = document.getElementById(containerId);
    stepDimensions = calculateStepDimensions(container, numberOfSteps, margin);
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

        derivationSteps.forEach(function (step) {
            wasNotHit(step);
            step.style["z-index"] = 0;
        });

        element.style["z-index"] = 1;
        element.classList.add("shadow");

        previousStep = getPreviousStep(element);
        if (previousStep) previousBox = calculateBottomHitBox(previousStep);

        nextStep = getNextStep(element);
        if (nextStep) nextBox = calculateTopHitBox(nextStep);

        handleCollisions(element, previousStep, previousBox, nextStep, nextBox);
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
        handleCollisions(element, previousStep, previousBox, nextStep, nextBox);
    }

    function closeDragElement() {
        /* stop moving when mouse button is released:*/
        document.onmouseup = null;
        document.onmousemove = null;
        element.classList.remove("shadow");
        handleSnaps(element, previousStep, previousBox, nextStep, nextBox);
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

// So touching corners don't show a match, must be a little overlapped.
// (Width not defined until runtime).
function horizontalHitBoxMargin() {
    return stepDimensions.width / 32;
}
// So you don't have to be strictly overlapping vertically to show a match.
var verticalHitBoxExtension = 5;

function calculateBottomHitBox(element) {
    var bottom = element.offsetTop + element.offsetHeight;
    return {
        x: element.offsetLeft + horizontalHitBoxMargin(),
        width: element.offsetWidth - horizontalHitBoxMargin() * 2,
        y: element.offsetTop + element.offsetHeight - stepDimensions.height / 4,
        height: stepDimensions.height / 4 + verticalHitBoxExtension
    };
}

function calculateTopHitBox(element) {
    return {
        x: element.offsetLeft + horizontalHitBoxMargin(),
        width: element.offsetWidth - horizontalHitBoxMargin() * 2,
        y: element.offsetTop - verticalHitBoxExtension,
        height: stepDimensions.height / 4
    };
}

function collision(rect1, rect2) {
    if (rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x && rect1.y < rect2.y + rect2.height && rect1.height + rect1.y > rect2.y) {
        return true;
    }
    return false;
}

function handleCollisions(element, previousStep, previousBox, nextStep, nextBox) {
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

function handleSnaps(element, previousStep, previousBox, nextStep, nextBox) {
    var collisionWithPrevious = false;
    var collisionWithNext = false;
    if (previousBox) {
        collisionWithPrevious = collision(previousBox, calculateTopHitBox(element));
    }
    if (nextBox) {
        collisionWithNext = collision(nextBox, calculateBottomHitBox(element));
    }
    // Prioritize snapping with an upstream step over a downstream step.
    if (collisionWithPrevious) {
        groupSteps(previousStep, element);
    } else if (collisionWithNext) {
        groupSteps(element, nextStep);
    }
}

// Elements must be in the order they appear in the steps list.
function groupSteps(element1, element2) {
    var idx = derivationSteps.indexOf(element1);
    derivationSteps.splice(idx, 2);

    var group = createGroupElement(element1, element2);
    container.appendChild(group);
    setupDrag(group);
    derivationSteps.splice(idx, 0, group);
}

function createGroupElement(element1, element2) {
    // Position the new group where the upstream step was.
    var left = element1.offsetLeft;
    var top = element1.offsetTop;

    container.removeChild(element1);
    container.removeChild(element2);
    wasNotHit(element1);
    wasNotHit(element2);

    // The elements may already be groups, get the steps from within.
    var steps = getStepsFromElement(element1).concat(getStepsFromElement(element2));
    steps.forEach(function (step) {
        // Remove the step in case it wasn't removed earlier.
        if (step.parent) {
            step.parent.removeChild(step);
        }
        // Let pointer events pass through to the group.
        step.classList.add("grouped");
    });

    var group = document.createElement("div");
    group.className = 'group';
    group.style.width = px(stepDimensions.width);
    group.style.height = px(stepDimensions.height * steps.length);
    group.style.left = px(left);
    group.style.top = px(top);

    steps.forEach(function (step, idx) {
        group.appendChild(step);
        step.style.top = px(stepDimensions.height * idx);
        step.style.left = px(0);
    });

    return group;
}

function getStepsFromElement(element) {
    if (element.classList.contains("step")) {
        return [element];
    } else {
        // Make a non-collection copy of the element's children just in case.
        var children = [];
        for (var i = 0; i < element.children.length; i++) {
            children.push(element.children.item(i));
        }
        return children;
    }
}
