/**
 * Onboarding module.
 * Todo. So many dependencies! If possible, break the module down into pieces.
 * @param svl
 * @param audioEffect
 * @param compass
 * @param form
 * @param handAnimation
 * @param mapService
 * @param missionContainer
 * @param modalComment
 * @param modalSkip
 * @param onboardingModel
 * @param onboardingStates
 * @param ribbon
 * @param statusField
 * @param tracker
 * @param canvas
 * @param uiCanvas
 * @param contextMenu
 * @param uiOnboarding
 * @param uiLeft
 * @param user
 * @param zoomControl
 * @returns {{className: string}}
 * @constructor
 */
function Onboarding(svl, audioEffect, compass, form, handAnimation, mapService, missionContainer, modalComment,
                    modalSkip, onboardingModel, onboardingStates, ribbon, statusField, tracker, canvas, uiCanvas,
                    contextMenu, uiOnboarding, uiLeft, user, zoomControl) {
    var self = this;
    var ctx;
    var canvasWidth = 720;
    var canvasHeight = 480;
    var blink_timer = 0;
    var blink_function_identifier = [];
    var status = {
        state: 0,
        isOnboarding: true
    };
    var states = onboardingStates.get();

    var _mouseDownCanvasDrawingHandler;
    var currentState;
    var currentLabelState;
    var map = svl.map.getMap();

    this._onboardingLabels = [];

    this._removeOnboardingLabels = function () {
        for (var i = 0, len = this._onboardingLabels.length; i < len; i++) {
            this._onboardingLabels[i].remove();
        }
    };

    this.start = function () {
        status.isOnboarding = true;
        tracker.push('Onboarding_Start');

        this._removeOnboardingLabels();

        adjustMap();

        $("#navbar-retake-tutorial-btn").css("display", "none");

        var canvasUI = uiOnboarding.canvas.get(0);
        if (canvasUI) ctx = canvasUI.getContext('2d');
        uiOnboarding.holder.css("visibility", "visible");

        canvas.unlockDisableLabelDelete();
        canvas.disableLabelDelete();
        canvas.lockDisableLabelDelete();

        mapService.unlockDisableWalking();
        mapService.disableWalking();
        mapService.lockDisableWalking();

        zoomControl.unlockDisableZoomIn();
        zoomControl.disableZoomIn();
        zoomControl.lockDisableZoomIn();

        zoomControl.unlockDisableZoomOut();
        zoomControl.disableZoomOut();
        zoomControl.lockDisableZoomOut();

        ribbon.unlockDisableModeSwitch();
        ribbon.disableModeSwitch();
        ribbon.lockDisableModeSwitch();

        ribbon.unlockDisableMode();

        uiLeft.jump.addClass('disabled');
        uiLeft.stuck.addClass('disabled');

        compass.hideMessage();

        status.state = getState("initialize");
        _visit(status.state);
        handAnimation.initializeHandAnimation();

        onboardingModel.triggerStartOnboarding();
    };

    /**
     * Sets the mini map to be transparent for everything except for yellow pin.
     */
    function adjustMap() {
        var mapStyleOptions = [
            {
                featureType: "all",
                stylers: [
                    { visibility: "off" }
                ]
            },
            {
                featureType: "road",
                stylers: [
                    { visibility: "off" }
                ]
            },
            {
                "elementType": "labels",
                "stylers": [
                    { "visibility": "off" }
                ]
            },
            {
                elementType: 'geometry.fill',
                stylers: [
                    { visibility: 'off' }
                ]
            },
            {
                featureType: 'landscape.natural.landcover',
                elementType: 'geometry.fill',
                stylers: [
                    { visibility: 'on' },
                ]
            }
        ];
        map.setOptions({styles: mapStyleOptions});
        document.getElementById("google-maps-holder").style.backgroundImage = "url('"+ svl.rootDirectory + "img/onboarding/TutorialMiniMap.jpg')";
    }

    function renderRoutesOnGoogleMap(state) {

        if (svl.isOnboarding() && 'map' in svl && google && ["initialize", "walk-4"].includes(state.properties.name)) {
            var paths = [];
            //var currentPosition = svl.map.getPosition();

            // If its the first state, then initialize with a red GMaps polyline
            if (state.properties.name == "initialize") {
                // Initial Position {lat: 38.9404971, lng: -77.0676199}
                var coords = [
                    // {lat: currentPosition.lat, lng: currentPosition.lng},
                    {lat: 38.9404971, lng: -77.0676199},
                    {lat: 38.9409018, lng: -77.067814},
                    {lat: 38.9409807, lng: -77.0678717},
                    {lat: 38.9410649, lng: -77.0680104}
                ];
                paths  = [
                    new google.maps.Polyline({
                        path: coords,
                        geodesic: true,
                        strokeColor: '#ff0000',
                        strokeOpacity: 1.0,
                        strokeWeight: 2
                    })
                ];
            }
            else if (state.properties.name == "walk-4") {
                // Set the paths to a green polyline after the users walks to the next position

                // Next walk position: {lat: 38.9406143, lng: -77.0676763}
                var coords = [
                    {lat: 38.9404971, lng: -77.0676199},
                    {lat: 38.9406143, lng: -77.0676763}
                    // {lat: currentPosition.lat, lng: currentPosition.lng},
                ];
                paths  = [
                    new google.maps.Polyline({
                        path: coords,
                        geodesic: true,
                        strokeColor: '#00ff00',
                        strokeOpacity: 1.0,
                        strokeWeight: 3
                    })
                ];
            }

            // Render the paths
            for (var i = 0, len = paths.length; i < len; i++) {
                paths[i].setMap(svl.map.getMap());
            }
        }
    }

    /**
     * Clear the onboarding canvas
     * @returns {clear}
     */
    function clear() {
        if (ctx) ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        return this;
    }

    /**
     * Draw an arrow on the onboarding canvas
     * @param x1 {number} Starting x coordinate
     * @param y1 {number} Starting y coordinate
     * @param x2 {number} Ending x coordinate
     * @param y2 {number} Ending y coordinate
     * @param parameters {object} parameters
     * @returns {drawArrow}
     */
    function drawArrow(x1, y1, x2, y2, parameters) {
        if (ctx) {
            var lineWidth = parameters.lineWidth,
                fill = parameters.fill,
                lineCap = parameters.lineCap,
                arrowWidth = parameters.arrowWidth,
                strokeStyle  = parameters.strokeStyle,
                dx, dy, theta;

            if (!parameters.fill) {
                fill = 'rgba(255,255,255,1)';
            }

            dx = x2 - x1;
            dy = y2 - y1;
            theta = Math.atan2(dy, dx);

            ctx.save();
            ctx.fillStyle = fill;
            ctx.strokeStyle = strokeStyle;
            ctx.lineWidth = lineWidth;
            ctx.lineCap = lineCap;

            ctx.translate(x1, y1);
            ctx.beginPath();
            ctx.moveTo(arrowWidth * Math.sin(theta), -arrowWidth * Math.cos(theta));
            ctx.lineTo(dx + arrowWidth * Math.sin(theta), dy - arrowWidth * Math.cos(theta));

            // Draw an arrow head
            ctx.lineTo(dx + 3 * arrowWidth * Math.sin(theta), dy - 3 * arrowWidth * Math.cos(theta));
            ctx.lineTo(dx + 3 * arrowWidth * Math.cos(theta), dy + 3 * arrowWidth * Math.sin(theta));
            ctx.lineTo(dx - 3 * arrowWidth * Math.sin(theta), dy + 3 * arrowWidth * Math.cos(theta));

            ctx.lineTo(dx - arrowWidth * Math.sin(theta), dy + arrowWidth * Math.cos(theta));
            ctx.lineTo(-arrowWidth * Math.sin(theta), +arrowWidth * Math.cos(theta));

            ctx.fill();
            ctx.stroke();
            ctx.closePath();

            ctx.restore();
        }
        return this;
    }

    function drawBlinkingArrow(x1, y1, x2, y2, parameters, blink_frequency_modifier) {
        var max_frequency = 60 * blink_frequency_modifier;
        var blink_period = 0.5;
        var originalFillColor = parameters.fill;

        function helperBlinkingArrow() {
            blink_timer = (blink_timer + 1) % max_frequency;
            var param;
            if (blink_timer < blink_period * max_frequency) {
                parameters["fill"] = originalFillColor;
            } else {
                parameters["fill"] = "white";
            }
            param = parameters;
            drawArrow(x1, y1, x2, y2, param);

            //requestAnimationFrame usually calls the function argument at the refresh rate of the screen (max_frequency)
            //Assume this is 60fps. We want to have an arrow flashing period of 0.5s (blink period)
            var function_identifier = window.requestAnimationFrame(helperBlinkingArrow);
            blink_function_identifier.push(function_identifier);
        }

        helperBlinkingArrow();
    }

    function _drawAnnotations(state) {
        var imX,
            imY,
            lineLength,
            lineAngle,
            x1,
            x2,
            y1,
            y2,
            origPointPov,
            canvasCoordinate;

        var currentPov = mapService.getPov();
        var povChange = svl.map.getPovChangeStatus();

        povChange["status"] = true;

        clear();

        var blink_frequency_modifier = 0;
        for (var i = 0, len = state.annotations.length; i < len; i++) {
            if (state.annotations[i].type == "arrow") {
                blink_frequency_modifier = blink_frequency_modifier + 1;
            }
        }

        for (var i = 0, len = state.annotations.length; i < len; i++) {
            imX = state.annotations[i].x;
            imY = state.annotations[i].y;
            origPointPov = state.annotations[i].originalPov;

            // For the first arrow to be applied, looking at the initial heading (initialize state) of the onboarding.
            // This avoids applying the first arrow if the heading is not set correctly
            // This will avoid incorrection POV calculation
            var initialHeading = getState("initialize").properties.heading;
            if (state.annotations[i].name == "arrow-1a" && currentPov.heading != initialHeading &&
                jQuery.isEmptyObject(origPointPov)) {
                povChange["status"] = false;
                return this;
            }
            // Setting the original Pov only once and
            // mapping an image coordinate to a canvas coordinate
            if (jQuery.isEmptyObject(origPointPov)) {

                if (currentPov.heading < 180) {
                    if (imX > svl.svImageWidth - 3328 && imX > 3328) {
                        imX -= svl.svImageWidth;
                    }
                } else {
                    if (imX < 3328 && imX < svl.svImageWidth - 3328) {
                        imX += svl.svImageWidth;
                    }
                }

                origPointPov = util.panomarker.calculatePointPovFromImageCoordinate(imX, imY, currentPov);
                state.annotations[i].originalPov = origPointPov;

            }
            canvasCoordinate = util.panomarker.getCanvasCoordinate(canvasCoordinate, origPointPov, currentPov);

            if (state.annotations[i].type == "arrow") {
                lineLength = state.annotations[i].length;
                lineAngle = state.annotations[i].angle;
                x2 = canvasCoordinate.x;
                y2 = canvasCoordinate.y;
                x1 = x2 - lineLength * Math.sin(util.math.toRadians(lineAngle));
                y1 = y2 - lineLength * Math.cos(util.math.toRadians(lineAngle));

                //The color of the arrow will by default alternate between white and the fill specified in annotation
                var parameters = {
                    lineWidth: 1,
                    fill: state.annotations[i].fill,
                    lineCap: 'round',
                    arrowWidth: 6,
                    strokeStyle: 'rgba(96, 96, 96, 1)'
                };

                if (state.annotations[i].fill == null || state.annotations[i].fill == "white") {
                    drawArrow(x1, y1, x2, y2, parameters);
                }
                else {
                    drawBlinkingArrow(x1, y1, x2, y2, parameters, blink_frequency_modifier);
                }

            }
        }
        povChange["status"] = false;
    }


    /**
     * Get a state
     * @param stateIndex
     * @returns {*}
     */
    function getState(stateIndex) {
        return states[stateIndex];
    }

    /**
     * Hide the message box.
     */
    function hideMessage() {
        if (uiOnboarding.messageHolder.is(":visible")) uiOnboarding.messageHolder.hide();
    }

    /**
     * Transition to the next state
     * @param nextState
     */
    function next(nextState) {
        if (typeof nextState == "function") {
            status.state = getState(nextState.call(this));
            _visit(status.state);
        } else if (nextState in states) {
            status.state = getState(nextState);
            _visit(status.state);
        } else {
            _visit(null);
        }
    }

    /**
     * Show a message box
     * @param parameters
     */
    function showMessage(parameters) {
        var message = parameters.message;

        uiOnboarding.messageHolder.toggleClass("yellow-background");
        setTimeout(function () {
            uiOnboarding.messageHolder.toggleClass("yellow-background");
        }, 100);

        uiOnboarding.messageHolder.css({
            top: 0,
            left: 0,
            width: 300
        });

        uiOnboarding.messageHolder.removeClass("animated fadeIn fadeInLeft fadeInRight fadeInDown fadeInUp");
        uiOnboarding.messageHolder.removeClass("callout top bottom left right lower-right");

        if (!uiOnboarding.messageHolder.is(":visible")) uiOnboarding.messageHolder.show();

        uiOnboarding.background.css("visibility", "hidden");
        if (parameters) {
            if ("width" in parameters) {
                uiOnboarding.messageHolder.css("width", parameters.width);
            }

            if ("left" in parameters) {
                uiOnboarding.messageHolder.css("left", parameters.left);
            }

            if ("top" in parameters) {
                uiOnboarding.messageHolder.css("top", parameters.top);
            }

            if ("background" in parameters && parameters.background) {
                uiOnboarding.background.css("visibility", "visible");
            }

            if ("arrow" in parameters) {
                uiOnboarding.messageHolder.addClass("callout " + parameters.arrow);
            }

            if ("fade-direction" in parameters) {
                uiOnboarding.messageHolder.addClass("animated " + parameters["fade-direction"]);
            }
        }

        uiOnboarding.messageHolder.html((typeof message == "function" ? message() : message));
    }

    function _endTheOnboarding(skip) {
        var mapStyleOptions = [
            {
                featureType: "all",
                stylers: [
                    { visibility: "off" }
                ]
            },
            {
                featureType: "road",
                stylers: [
                    { visibility: "on" }
                ]
            },
            {
                "elementType": "labels",
                "stylers": [
                    { "visibility": "off" }
                ]
            }
        ];
        if (map) map.setOptions({styles: mapStyleOptions});
        map.setOptions({styles: mapStyleOptions});
        if (skip) {
            tracker.push("Onboarding_Skip");
            missionContainer.getCurrentMission().setProperty("skipped", true);
        }
        tracker.push('Onboarding_End');
        missionContainer.getCurrentMission().setProperty("isComplete", true);

        // Redirects to the audit page and submits all data through Form.js.
        svl.form.submitData(false);
        window.location.replace('/audit');
    }

    function _onboardingStateAnnotationExists(state) {
        return "annotations" in state && state.annotations;
    }

    function _onboardingStateMessageExists(state) {
        return "message" in state && state.message;
    }

    function getCurrentState() {
        return currentState;
    }

    function getCurrentLabelState() {
        return currentLabelState;
    }

    function blinkInterface(state) {
        // Blink parts of the interface
        if ("blinks" in state.properties && state.properties.blinks) {
            var len = state.properties.blinks.length;
            for (var i = 0; i < len; i++) {
                switch (state.properties.blinks[i]) {
                    case "google-maps":
                        mapService.blinkGoogleMaps();
                        break;
                    case "compass":
                        compass.blink();
                        break;
                    case "status-field":
                        statusField.blink();
                        break;
                    case "zoom":
                        zoomControl.blink();
                        break;
                    case "sound":
                        audioEffect.blink();
                        break;
                    case "stuck":
                        modalSkip.blink();
                        break;
                    case "feedback":
                        modalComment.blink();
                        break;
                }
            }
        }
    }

    function _incorrectLabelApplication(state, listener) {
        hideMessage();

        // TODO Get access to know which attribute needs to be deleted to log unique transitions.
        // TODO Alternatively, there should probably be a dedicated state for re-labeling, which would make this easier.
        tracker.push('Onboarding_Transition', {onboardingTransition: "delete-attribute-n"});

        // Step 1: Show message to delete.
        var message = {
            "message": i18next.t('tutorial.common.label-too-far') +
                ' <img src="' + svl.rootDirectory + "img/icons/Icon_Delete.png" +
                '" style="width: 6%; height:auto" alt="Delete Icon">',
            "position": "top-right",
            "parameters": null
        };
        showMessage(message);

        var labelTypeToLabelString = {
            "CurbRamp": "Curb Ramp",
            "NoCurbRamp": "Missing Curb Ramp",
            "Obstacle": "Obstacle in Path",
            "SurfaceProblem": "Surface Problem",
            "NoSidewalk": "No Sidewalk"
        };

        // Callback for deleted label
        var deleteLabelCallback = function () {
            if (listener) google.maps.event.removeListener(listener);

            // Remove flashing in the arrow
            clear();
            if (blink_function_identifier.length != 0) {
                while (blink_function_identifier.length != 0) {
                    window.cancelAnimationFrame(blink_function_identifier.pop());
                }
            }

            $(document).off('RemoveLabel', deleteLabelCallback);

            var stateProperties = state.properties;
            if (state.properties.constructor == Array) {
                stateProperties = state.properties[0];
            }
            var labelType = stateProperties.labelType;
            var subcategory = "subcategory" in stateProperties ? stateProperties.subcategory : null;
            var event;

            if (subcategory) {
                event = subcategory
            } else {
                event = labelType
            }

            // Start blinking and enable labeling
            ribbon.startBlinking(labelType, subcategory);
            ribbon.enableMode(labelType, subcategory);

            // Step 2: Select the appropriate label Type
            var message = {
                "message": i18next.t('tutorial.common.re-label', {label_type: labelTypeToLabelString[labelType]}),
                "position": "top-right",
                "parameters": null
            };
            showMessage(message);

            // Callback after user deleted the label and was moved to "Walk" mode.
            var callback = function () {
                ribbon.enableMode("Walk");
                ribbon.stopBlinking();

                $(document).off('ModeSwitch_' + event, callback);
                // Step 3: Re-label
                _visit(getCurrentLabelState());
            };
            $(document).on('ModeSwitch_' + event, callback);
        };
        $(document).on('RemoveLabel', deleteLabelCallback);
    }

    /**
     * Execute an instruction based on the current state.
     * @param state
     */
    function _visit(state) {
        var annotationListener;

        currentState = state;

        clear(); // Clear what ever was rendered on the onboarding-canvas in the previous state.
        if (blink_function_identifier.length != 0) {
            while (blink_function_identifier.length != 0) {
                window.cancelAnimationFrame(blink_function_identifier.pop());
            }
        }

        // End the onboarding if there is no transition state is specified. Move to the actual task
        if ("end-onboarding" in state) {
            _endTheOnboarding(state["end-onboarding"]["skip"]);
            return;
        } else {
            hideMessage();
        }

        // Show user a message box.
        if (_onboardingStateMessageExists(state)) {
            showMessage(state.message);
        }

        // Draw arrows to annotate target accessibility attributes
        if (_onboardingStateAnnotationExists(state)) {
            _drawAnnotations(state);
            if (typeof google != "undefined") {
                annotationListener = google.maps.event.addListener(svl.panorama, "pov_changed", function () {
                    //Stop the animation for the blinking arrows
                    if (blink_function_identifier.length != 0) {
                        while (blink_function_identifier.length != 0) {
                            window.cancelAnimationFrame(blink_function_identifier.pop());
                        }
                    }
                    _drawAnnotations(state);
                });
            }
        }

        // Change behavior based on the current state.
        if ("properties" in state) {
            if (state.properties.constructor == Array) {

                //Restrict panning
                mapService.setHeadingRange([state.properties[0].minHeading, state.properties[0].maxHeading]);

                // Ideally we need a for loop that goes through every element of the property array
                // and calls the corresponding action's handler.
                // Not just the label accessibility attribute's handler
                if (state.properties[0].action === "LabelAccessibilityAttribute") {
                    _visitLabelAccessibilityAttributeState(state, annotationListener);
                }
            }
            else {
                // Restrict panning.
                mapService.setHeadingRange([state.properties.minHeading, state.properties.maxHeading]);
                if (state.properties.action === "Introduction") {
                    _visitIntroduction(state, annotationListener);
                } else if (state.properties.action === "SelectLabelType") {
                    _visitSelectLabelTypeState(state, annotationListener);
                } else if (state.properties.action === "Zoom") {
                    _visitZoomState(state, annotationListener);
                } else if (state.properties.action === "RateSeverity" || state.properties.action === "RedoRateSeverity") {
                    _visitRateSeverity(state, annotationListener);
                } else if (state.properties.action === "AddTag" || state.properties.action === "RedoAddTag") {
                    _visitAddTag(state, annotationListener);
                } else if (state.properties.action === "AdjustHeadingAngle") {
                    _visitAdjustHeadingAngle(state, annotationListener);
                } else if (state.properties.action === "WalkTowards") {
                    _visitWalkTowards(state, annotationListener);
                } else if (state.properties.action === "Instruction") {
                    _visitInstruction(state, annotationListener);
                }
            }
        }
    }

    function _visitIntroduction(state, listener) {
        var pov = {
                heading: state.properties.heading,
                pitch: state.properties.pitch,
                zoom: state.properties.zoom
            },
            googleTarget,
            googleCallback,
            $target;

        // I need to nest callbacks due to the bug in Street View; I have to first set panorama, and set POV
        // once the panorama is loaded. Here I let the panorama load while the user is reading the instruction.
        // When they click OK, then the POV changes.
        if (typeof google != "undefined") {
            googleCallback = function () {
                mapService.setPano(state.panoId, true);
                google.maps.event.removeListener(googleTarget);
            };

            googleTarget = google.maps.event.addListener(svl.panorama, "position_changed", googleCallback);

            $target = $("#onboarding-message-holder").find(".onboarding-transition-trigger");
            $(".onboarding-transition-trigger").css({
                'cursor': 'pointer'
            });
            function callback () {
                if (listener) google.maps.event.removeListener(listener);
                $target.off("click", callback);
                next.call(this, state.transition);
                mapService.setPano(state.panoId, true);
                mapService.setPov(pov);
                mapService.setPosition(state.properties.lat, state.properties.lng);

                compass.hideMessage();
            }

            $target.on("click", callback);
        }
    }

    function _visitWalkTowards(state, listener) {

        // Add a link to the second pano so that the user can click on it.
        svl.panorama.setLinks([{
            description: 'afterWalkTutorial',
            heading: 340,
            pano: 'afterWalkTutorial'
        }]);
        mapService.unlockDisableWalking();
        mapService.enableWalking();
        mapService.lockDisableWalking();

        blinkInterface(state);

        var $target;
        var callback = function () {
            var panoId = mapService.getPanoId();
            if (state.properties.panoId == panoId) {
                window.setTimeout(function () {
                    mapService.unlockDisableWalking().disableWalking().lockDisableWalking();
                }, 1000);
                if (typeof google != "undefined") google.maps.event.removeListener($target);
                if (listener) google.maps.event.removeListener(listener);
                next(state.transition);
            } else {
                console.error("Pano mismatch. Shouldn't reach here");
                // Force the interface to go back to the previous position.
                mapService.setPano(state.panoId, true);
            }
        };

        // Add and remove a listener: http://stackoverflow.com/questions/1544151/google-maps-api-v3-how-to-remove-an-event-listener
        if (typeof google != "undefined") $target = google.maps.event.addListener(svl.panorama, "position_changed", callback);
    }

    function _visitAdjustHeadingAngle(state, listener) {
        var $target;
        var interval;
        interval = handAnimation.showGrabAndDragAnimation({direction: "left-to-right"});

        var callback = function () {
            var pov = mapService.getPov();
            if ((360 + state.properties.heading - pov.heading) % 360 < state.properties.tolerance) {
                if (typeof google != "undefined") google.maps.event.removeListener($target);
                if (listener) google.maps.event.removeListener(listener);
                handAnimation.hideGrabAndDragAnimation(interval);
                next(state.transition);
            }
        };

        if (typeof google != "undefined") $target = google.maps.event.addListener(svl.panorama, "pov_changed", callback);
    }

    function _visitRateSeverity(state, listener) {
        contextMenu.disableTagging();
        var $target = contextMenu.getContextMenuUI().radioButtons;
        var callback = function () {
            if (listener) google.maps.event.removeListener(listener);
            $target.off("click", callback);
            contextMenu.enableTagging();
            next.call(this, state.transition);
        };
        $target.on("click", callback);
    }
    function _visitAddTag(state, listener) {
        var $target = contextMenu.getContextMenuUI().tagHolder; // Grab tag holder so we can add an event listener.
        var callback = function () {
            if (listener) {
                google.maps.event.removeListener(listener);
            }
            $target.off("tagIds-updated", callback);
            next.call(contextMenu.getTargetLabel(), state.transition);
        };
        // We use a custom event here to ensure that this is triggered after the tags have been updated.
        $target.on("tagIds-updated", callback);
    }

    function _visitInstruction(state, listener) {

        if (state == getState("outro")) {
            $("#mini-footer-audit").css("visibility", "hidden");
        }
        blinkInterface(state);

        if (!("okButton" in state) || state.okButton) {
            // Insert an ok button.
            var okButtonText = 'OK';
            if (state.okButtonText) {
                okButtonText = state.okButtonText;
            }
            uiOnboarding.messageHolder.append("<br/><button id='onboarding-ok-button' class='button width-50'>" +
                okButtonText + "</button>");
        }

        var $target = $("#onboarding-ok-button");
        var callback = function () {
            if (listener) google.maps.event.removeListener(listener);
            $target.off("click", callback);
            if ("blinks" in state.properties && state.properties.blinks) {
                mapService.stopBlinkingGoogleMaps();
                compass.stopBlinking();
                statusField.stopBlinking();
                zoomControl.stopBlinking();
                audioEffect.stopBlinking();
                modalSkip.stopBlinking();
                modalComment.stopBlinking();
            }
            next.call(this, state.transition);
        };
        $target.on("click", callback);
    }

    /**
     * Blink the given label type and nudge them to click one of the buttons in the ribbon menu.
     * Move on to the next state if they click the button.
     * @param state
     * @param listener
     * @private
     */
    function _visitSelectLabelTypeState(state, listener) {
        var labelType = state.properties.labelType;
        var subcategory = "subcategory" in state.properties ? state.properties.subcategory : null;
        var event;

        if (subcategory) {
            event = subcategory
        } else {
            event = labelType
        }

        if (state == getState("select-label-type-1")) {
            $("#mini-footer-audit").css("visibility", "visible");
        }
        ribbon.enableMode(labelType, subcategory);
        ribbon.startBlinking(labelType, subcategory);

        // To handle when user presses ESC - disable mode only when the user places the label
        _mouseDownCanvasDrawingHandler = function () {
            ribbon.disableMode(labelType, subcategory);
        };

        var callback = function () {
            ribbon.enableMode("Walk");

            // Disable only when the user places the label
            uiCanvas.drawingLayer.on("mousedown", _mouseDownCanvasDrawingHandler);

            ribbon.stopBlinking();
            $(document).off('ModeSwitch_' + event, callback);
            if (listener) google.maps.event.removeListener(listener);
            next(state.transition);
        };

        $(document).on('ModeSwitch_' + event, callback);
    }

    /**
     * Tell the user to zoom in/out.
     * @param state
     * @param listener
     * @private
     */
    function _visitZoomState(state, listener) {
        var zoomType = state.properties.type;
        var event;

        if (zoomType == "in") {
            event = 'ZoomIn';
            zoomControl.blinkZoomIn();
            zoomControl.unlockDisableZoomIn();
            zoomControl.enableZoomIn();
            zoomControl.lockDisableZoomIn();

        } else {
            event = 'ZoomOut';
            zoomControl.blinkZoomOut();

            // Enable zoom-out
            zoomControl.unlockDisableZoomOut();
            zoomControl.enableZoomOut();
            zoomControl.lockDisableZoomOut();
        }

        var callback = function () {
            zoomControl.stopBlinking();
            if (zoomType == "in") {
                // Disable zoom-in
                zoomControl.unlockDisableZoomIn();
                zoomControl.disableZoomIn();
                zoomControl.lockDisableZoomIn();
            }
            else {
                // Disable zoom-out
                zoomControl.unlockDisableZoomOut();
                zoomControl.disableZoomOut();
                zoomControl.lockDisableZoomOut();
            }
            ribbon.enableMode("Walk");
            $(document).off(event, callback);

            if (listener) google.maps.event.removeListener(listener);
            next(state.transition);
        };

        $(document).on(event, callback);

    }

    /**
     * Tell the user to label the multiple possible target attributes.
     * @param state
     * @param listener
     * @private
     */
    function _visitLabelAccessibilityAttributeState(state, listener) {

        var $target = uiCanvas.drawingLayer;
        var properties = state.properties;
        var transition = state.transition;

        var callback = function (e) {
            var i = 0;
            var labelAppliedCorrectly = false;

            while (i < properties.length && !labelAppliedCorrectly) {
                var imageX = properties[i].imageX;
                var imageY = properties[i].imageY;
                var tolerance = properties[i].tolerance;
                var labelType = properties[i].labelType;
                var subCategory = properties[i].subcategory;

                var clickCoordinate = mouseposition(e, this),
                    pov = mapService.getPov(),
                    canvasX = clickCoordinate.x,
                    canvasY = clickCoordinate.y,
                    imageCoordinate = util.panomarker.canvasCoordinateToImageCoordinate(canvasX, canvasY, pov),
                    distance = (imageX - imageCoordinate.x) * (imageX - imageCoordinate.x) +
                        (imageY - imageCoordinate.y) * (imageY - imageCoordinate.y);

                currentLabelState = state;

                // Label applied at the correct location.
                if (distance < tolerance * tolerance) {
                    labelAppliedCorrectly = true;

                    // Disable deleting of label
                    canvas.unlockDisableLabelDelete();
                    canvas.disableLabelDelete();
                    canvas.lockDisableLabelDelete();

                    // Disable labeling mode
                    ribbon.disableMode(labelType, subCategory);
                    ribbon.enableMode("Walk");
                    uiCanvas.drawingLayer.off("mousedown", _mouseDownCanvasDrawingHandler);

                    $target.off("click", callback);
                    if (listener) google.maps.event.removeListener(listener);
                    next(transition[i]);
                    break;
                }
                i = i + 1;
            }

            // Label placed too far from desired location. Disable labeling, enable deleting, ask them to reapply label.
            if (!labelAppliedCorrectly) {
                ribbon.disableMode(labelType, subCategory);
                ribbon.enableMode("Walk");
                canvas.unlockDisableLabelDelete();
                canvas.enableLabelDelete();
                canvas.lockDisableLabelDelete();
                $target.off("click", callback);

                // Ask user to delete label and reapply the label.
                _incorrectLabelApplication(state, listener);
            }
        };
        $target.on("click", callback);
    }


    /**
     * Check if the user is working on the onboarding right now
     * @returns {boolean}
     */
    function isOnboarding() {
        return status.isOnboarding;
    }

    this.pushOnboardingLabel = function (label) {
        this._onboardingLabels.push(label);
    };

    this.removeOnboardingLabel = function (label) {
        if(this._onboardingLabels.includes(label)){
            for(var i = 0; i < this._onboardingLabels.length; i++) {
                if(this._onboardingLabels[i] == label){
                    this._onboardingLabels.remove(i);
                }
            }
        }
    };

    /**
     * Set status
     * @param key Status field name
     * @param value Status field value
     * @returns {setStatus}
     */
    function setStatus(key, value) {
        if (key in status) status[key] = value;
        return this;
    }

    self._visit = _visit;
    self.clear = clear;
    self.drawArrow = drawArrow;
    self.next = next;
    self.isOnboarding = isOnboarding;
    self.showMessage = showMessage;
    self.setStatus = setStatus;
    self.hideMessage = hideMessage;
}
