let margin = 50;

function px(str) { return str + 'px' }

let container;
let stepDimensions;
let derivationSteps = [];
function initDerivationSteps(containerId, numberOfSteps) {
    container = document.getElementById(containerId);
    stepDimensions = calculateStepDimensions(container, numberOfSteps, margin);
    let stepPositions = calculateStepPositions(stepDimensions, numberOfSteps, margin);
    createDerivationSteps(container, stepDimensions, stepPositions);
}

function calculateStepDimensions(container, numberOfSteps, margin) {
    let containerRect = container.getBoundingClientRect();
    return {
        width: Math.round((containerRect.width - (margin*2))/5),
        height: Math.round((containerRect.height - (margin*2))/numberOfSteps)
    };
}

function calculateStepPositions(stepDimensions, numberOfSteps, margin) {
    let positions = [];
    let top = margin;
    let leftColumnLeft = margin + stepDimensions.width;
    let rightColumnLeft = leftColumnLeft + stepDimensions.width*2;
    for (let i=0; i<numberOfSteps; i++) {
        let position = [];
        position.push((i % 2 == 0) ? leftColumnLeft : rightColumnLeft);
        position.push(top);
        top += stepDimensions.height;
        positions.push(position);
    }
    return positions;
}

function createDerivationSteps(container, stepDimensions, stepPositions) {
    stepPositions.forEach((position, idx) => {
        let step = createDerivationStep(idx+1, stepDimensions, position);
        container.appendChild(step);
        setupDrag(step);
        derivationSteps.push(step);
    });
}

function createDerivationStep(id, stepDimensions, position) {
	let step = document.createElement('div');
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
    let tag = document.createElement("div");
    tag.innerHTML = id;
    tag.className = "tag";
    step.appendChild(tag);
}

function setupDrag(element) {
    let startX = 0, startY = 0, currX = 0, currY = 0;
    element.onmousedown = dragMouseDown;

    let previousStep = null;
    let previousBox = null;
    let nextStep = null;
    let nextBox = null;

    function dragMouseDown(evt) {
        evt = evt || window.event;
        startX = evt.clientX;
        startY = evt.clientY;
        document.onmousemove = elementDrag;
        document.onmouseup = closeDragElement;
        derivationSteps.forEach(step => {
            wasNotHit(step);
            step.style["z-index"] = 0;
        });
        element.style["z-index"] = 1;
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
        element.style.top = (element.offsetTop - currY) + "px";
        element.style.left = (element.offsetLeft - currX) + "px";
        handleCollisions(element, previousStep, previousBox, nextStep, nextBox);
    }
    
    function closeDragElement() {
        /* stop moving when mouse button is released:*/
        document.onmouseup = null;
        document.onmousemove = null;
        handleSnaps(element, previousStep, previousBox, nextStep, nextBox);
    }
}

function getPreviousStep(element) {
    let idx = derivationSteps.indexOf(element);
    if (idx > 0) {
        return derivationSteps[idx-1];
    } else {
        return null;
    }
}

function getNextStep(element) {
    let idx = derivationSteps.indexOf(element);
    if (idx < derivationSteps.length-1) {
        return derivationSteps[idx+1];
    } else {
        return null;
    }
}

function calculateBottomHitBox(element) {
    let bottom = element.offsetTop + element.offsetHeight;
    return {
        x: element.offsetLeft,
        width: element.offsetWidth,
        y: element.offsetTop + element.offsetHeight - stepDimensions.height/2,
        height: stepDimensions.height/2
    }
}

function calculateTopHitBox(element) {
    return {
        x: element.offsetLeft,
        width: element.offsetWidth,
        y: element.offsetTop,
        height: stepDimensions.height/2
    }
}

function collision(rect1, rect2) {
    if (rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.height + rect1.y > rect2.y) {
            return true;
    }
    return false;
}

function handleCollisions(element, previousStep, previousBox, nextStep, nextBox) {
    let collisionWithPrevious = false;
    let collisionWithNext = false;
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
    if (!element) {
        debugger;
    }
    element.classList.remove("hit");
}

function handleSnaps(element, previousStep, previousBox, nextStep, nextBox) {
    let collisionWithPrevious = false;
    let collisionWithNext = false;
    if (previousBox) {
        collisionWithPrevious = collision(previousBox, calculateTopHitBox(element));
    }
    if (nextBox) {
        collisionWithNext = collision(nextBox, calculateBottomHitBox(element));
    }
    if (collisionWithPrevious) {
        replaceWithGroup(previousStep, element);
    } else if (collisionWithNext) {
        replaceWithGroup(element, nextStep);
    }
}

// Elements must be in the order they appear in the steps list.
function replaceWithGroup(element1, element2) {
    let idx = derivationSteps.indexOf(element1);
    derivationSteps.splice(idx, 2);
    let group = createGroupElement(element1, element2);
    container.appendChild(group);
    setupDrag(group);
    derivationSteps.splice(idx, 0, group);
    console.log(derivationSteps);
}

function createGroupElement(element1, element2) {
    let left = element1.offsetLeft;
    let top = element1.offsetTop;
    container.removeChild(element1);
    container.removeChild(element2);
    element1.classList.remove("hit");
    element2.classList.remove("hit");
    element1.classList.add("grouped");
    element2.classList.add("grouped");
    
    let group = document.createElement("div");
    group.className = 'group';
	group.style.width = px(stepDimensions.width);
	group.style.height = px(stepDimensions.height*2);
    group.style.left = px(left);
    group.style.top = px(top);

    group.appendChild(element1);
    group.appendChild(element2);
    element1.style.top = px(0);
    element1.style.left = px(0);
    element2.style.top = px(stepDimensions.height);
    element2.style.left = px(0);

    return group;
}
