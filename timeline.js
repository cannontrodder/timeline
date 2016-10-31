/* jshint node: true */

/*
 * Timeline is designed to take some guidance from the user on what to animate and what triggers it, it then bakes a timeline for each element
 * so it runs in synchronisation.
 * 
 * IE, objectb starts its animation when object a ends - if we change objecta's animation so it lasts for 1 more second, objectb starts one second later
 */

function Timeline() {
    var defaultDuration = 400;
    var nop = {
        nothing: ""
    };

    this.Compile = function(animationSource) {

        if (typeof animationSource === 'string') {
            animationSource = JSON.parse(animationSource);
        }
        this.compiledSource = {};
        this.compiledSource.title = animationSource.title;
        this.compiledSource.containerSelector = animationSource.containerSelector || "";
        this.compiledSource.pasteBoardSequences = {};
        this.compiledSource.compiledVelocitySequences = [];

        for (var i = 0; i < animationSource.animations.length; i++) {
            var animation = animationSource.animations[i];
            var pasteBoardSequence = this.getPasteboardSequenceFromAnimation(animation);
            this.compiledSource.pasteBoardSequences[animation.name] = pasteBoardSequence;
        }
        this.arrangeSequences();
        this.generateVelocitySequences();

        return this.compilePlaylists();
    };

    this.getPasteboardSequenceFromAnimation = function(animation) {
        var selector = this.getElementSelector(animation);

        if (animation.transitions !== undefined) {
            for (var i = 0; i < animation.transitions.length; i++) {
                animation.transitions[i].options = animation.transitions[i].options || {};
                defaultToIgnoringGlobalQueue(animation.transitions[i]);
            }
        }

        var pasteBoardSequence = {
            "selector": selector,
            "transitions": animation.transitions,
            "initialState": animation.initialState,
            "sequenceLength": null,
            "name": animation.name,
            "anchorOffset": animation.anchorOffset || 0,
            "anchorItem": animation.anchorItem,
            "paddingStart": animation.paddingStart || 0,
            "paddingEnd": animation.paddingEnd || 0,
            "globalPosition": null
        };

        calculateSequenceLength(pasteBoardSequence);
        return pasteBoardSequence;
    };

    this.arrangeSequences = function() {
        this.lowestPositionInUse = 0;

        var sequencesLeftToArrangeLastTime;
        var leftToArrange = 0;

        do {
            sequencesLeftToArrangeLastTime = leftToArrange;
            leftToArrange = 0;

            for (var key in this.compiledSource.pasteBoardSequences) {
                var sequence = this.compiledSource.pasteBoardSequences[key];

                if (sequence.globalPosition !== null) //ignore sequences already positioned
                {
                    continue;
                }

                if (!this.positionSequenceOnPasteboardIfPossible(sequence)) {
                    leftToArrange++;
                }
            }

        } while (leftToArrange !== sequencesLeftToArrangeLastTime && leftToArrange > 0);

        if (leftToArrange > 0) {
            console.log("Timeline ERROR: circular referenced anchor");
        }

        return;
    };

    this.generateVelocitySequences = function() {
        //for every pasteboarded sequence, add a step to the beginning that includes the offset and the padding
        var normaliseDelta = -this.lowestPositionInUse;
        this.compiledSource.compiledVelocitySequences = [];

        for (var key in this.compiledSource.pasteBoardSequences) {
            var sequence = this.compiledSource.pasteBoardSequences[key];
            sequence.globalPosition += normaliseDelta;

            //add initial delay to position animation in timeline - nothing is not a valid css element but we have to
            //put something in here because velocity does not have a NOP
            var newVelocitySequence = [{
                selector: sequence.selector,
                p: nop,
                o: {
                    duration: sequence.globalPosition + sequence.paddingStart,
                    queue: false
                }
            }];

            if (sequence.transitions !== undefined)
                for (var t = 0; t < sequence.transitions.length; t++) {
                    var velocityTransition = {
                        selector: sequence.selector,
                        p: sequence.transitions[t].transform,
                        o: sequence.transitions[t].options
                    };
                    velocityTransition.o.queue = false;
                    newVelocitySequence.push(velocityTransition);
                }

            this.compiledSource.compiledVelocitySequences.push(newVelocitySequence);
        }
    };

    this.positionSequenceOnPasteboardIfPossible = function(sequence) {
        if (sequence.anchorItem === undefined) { //depends on nothing so add to pasteboard
            this.setSequencePositionOnPasteboard(sequence, sequence.anchorOffset);
            return true;
        }

        if (sequence.anchorItem.name === undefined) {
            console.log("Timeline ERROR: Sequence " + sequence.name + " has anchorItem its name has not been declared?");
            return false;
        }

        var dependentSequence = this.compiledSource.pasteBoardSequences[sequence.anchorItem.name];

        if (dependentSequence === undefined || dependentSequence === null) {
            console.log("Timeline ERROR: Could not find " + sequence.anchorItem.name);
            return false;
        }

        if (dependentSequence.globalPosition !== null) //we can position something only if what it depends on is already positioned
        {
            var position = dependentSequence.globalPosition + sequence.anchorOffset;

            //we're now positioned with the start of this sequence against the start of the one already positioned
            //subtract the length of this sequence if we want the end to line up with the start of the positioned one
            if (sequence.anchorItem.thisAnchorPoint === "end") {
                position -= sequence.sequenceLength;
            }

            //we've positioned relative to the start of the positioned sequence, if we want to be relative to the end then
            //we need to adjust our position forward
            if (sequence.anchorItem.targetAnchorPoint === "end") {
                position += dependentSequence.sequenceLength;
            }

            this.setSequencePositionOnPasteboard(sequence, position);

            return true;
        } else
            return false;
    };

    this.setSequencePositionOnPasteboard = function(sequence, position) {
        sequence.globalPosition = position;

        if (position < this.lowestPositionInUse) {
            this.lowestPositionInUse = position;
        }
    };

    function calculateSequenceLength(sequence) {
        var transitionTotalLength = 0;

        if (sequence.transitions !== undefined) {
            for (var i = 0; i < sequence.transitions.length; i++) {
                var transition = sequence.transitions[i];
                transitionTotalLength += transition.options.duration || defaultDuration;
            }
        }

        sequence.sequenceLength = sequence.paddingStart + transitionTotalLength + sequence.paddingEnd;
    }

    function defaultToIgnoringGlobalQueue(transition) {
        if (transition.options.queue === undefined) {
            transition.options.queue = false;
        }
    }

    this.getElementSelector = function(animation) {
        if (this.compiledSource.containerSelector === undefined) {
            return animation.selector;
        } else {
            return this.compiledSource.containerSelector + " " + animation.selector;
        }
    };

    this.compilePlaylists = function() {
        var keys = Object.keys(this.compiledSource.pasteBoardSequences);
        var i;
        var sequence;

        //for every pasteboarded sequence, add a step to the beginning that includes the offset and the padding
        var normaliseDelta = -this.lowestPositionInUse;
        var compiledAnimationSequences = [];
        var compiledResetSequence = [];

        for (i = 0; i < keys.length; i++) {
            sequence = this.compiledSource.pasteBoardSequences[keys[i]];

            sequence.globalPosition += normaliseDelta;

            //add initial delay to position animation in timeline - nothing is not a valid css element but we have to
            //put something in here because velocity does not have a NOP
            var newAnimationSequence = [{
                selector: sequence.selector,
                p: nop,
                o: {
                    duration: sequence.globalPosition + sequence.paddingStart,
                    queue: false
                }
            }];

            if (sequence.transitions !== undefined)
                for (var t = 0; t < sequence.transitions.length; t++) {
                    var velocityTransition = {
                        selector: sequence.selector,
                        p: sequence.transitions[t].transform,
                        o: sequence.transitions[t].options
                    };
                    velocityTransition.o.queue = false;
                    newAnimationSequence.push(velocityTransition);
                }

            compiledAnimationSequences.push(newAnimationSequence);

            var initialState = sequence.initialState;
            var options = {
                duration: 0
            };

            if (initialState === undefined) {
                initialState = nop;
            }

            compiledResetSequence.push({
                selector: sequence.selector,
                p: initialState,
                o: options
            });
        }

        return {
            animationPlaylists: compiledAnimationSequences,
            resetPlaylist: compiledResetSequence
        };
    };
}

module.exports = Timeline;;