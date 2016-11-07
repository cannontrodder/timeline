/* jshint node: true */

function TimelinePlayer() {

	this.Clear = function() {
		this.animations = {};
		this.events = {};
		this.data = {};
	};

	this.Clear();

	this.RegisterAnimation = function(name, animation) {
		this.animations[name] = animation;
	};

	this.RegisterEvent = function(name, handler) {
		this.events[name] = handler;
	};

	this.GetAnimation = function(name) {
		var animation = this.animations[name];

		if (animation === undefined) {
			logError("Animation " + name + " is not defined.");
		}

		return animation;
	};

	this.GetAllAnimations = function() {
		return Object.values(animation);
	};

	// pass nothing in and all animations end instantly
	// otherwise they are scaled up by the factor you pass in, e.g. 2 doubles the length of the animation, 0.5 halves it
	this.DebugMode = function(speed){
		$.Velocity.mock = speed || true;
	};

	this.ResetAndPlay = function(animationName) {
		if (animationName === undefined) {
			for (var key in this.animations) {
				this.ResetAndPlay(key);
			}
			return;
		}

		var thisTimeline = this;
		this.Reset(animationName, function() {
			thisTimeline.Play(animationName);
		});
	};

	this.Play = function(animationName) {
		if (animationName === undefined) {
			for (var key in this.animations) {
				this.Play(key);
			}
			return;
		}

		var animation = this.animations[animationName].animationPlaylists;

		for (var i = 0; i < animation.length; i++) {
			$.Velocity.RunSequence(animation[i]);
		}
	};

	this.RefreshDOM = function(animationName){
		var animation = this.GetAnimation(animationName);
		this.attachDOMObjectsToPlaylists(animation.animationPlaylists);
		this.attachDOMObjectsToPlaylist(animation.resetPlaylist);
	};

	this.Reset = function(animationName, done) {
		if (animationName === undefined) {
			for (var key in this.animations) {
				this.Reset(key, done);
			}
			return;
		}

		var animation = this.animations[animationName];
		if(animation === undefined){
			logError("Animation " + animationName + " is not defined.");
		}

		this.RefreshDOM(animationName);

		for (var i = 0; i < animation.resetPlaylist.length; i++) {
			var transition = animation.resetPlaylist[i];

			var options = {
				"duration": 0
			};
			if (i === animation.resetPlaylist.length - 1) {
				options.complete = function() {
					for (var j = 0; j < animation.resetPlaylist.length; j++) {
						animation.resetPlaylist[j].e.show();
					}

					if (done !== undefined) {
						done();
					}
				};
			} else {
				options.complete = undefined;
			}
			transition.o = options;
		}

		$.Velocity.RunSequence(animation.resetPlaylist);
	};

	this.attachDOMObjectsToPlaylists = function(playlists) {
		for (var i = 0; i < playlists.length; i++) {
			this.attachDOMObjectsToPlaylist(playlists[i]);
		}
	};

	this.attachDOMObjectsToPlaylist = function(playlist) {
		for (var j = 0; j < playlist.length; j++) {
			if (typeof playlist[j].selector === 'string') {
				playlist[j] = {
					e: getElementItem(playlist[j].selector),
					p: playlist[j].p,
					o: playlist[j].o,
					selector: playlist[j].selector
				};
			}

			this.replaceEventsWithHandlers(playlist[j]);
		}
	};

	this.replaceEventsWithHandlers = function(playlistItem) {
		playlistItem.o.begin = this.replaceEventWithHandler(playlistItem.o.begin, playlistItem.e, this);
		playlistItem.o.complete = this.replaceEventWithHandler(playlistItem.o.complete, playlistItem.e, this);
	};

	this.replaceEventWithHandler = function(event, element, player) {
		if (typeof event === 'string') {
			var context = this;
			return function() {
				context.handleEvent(event, element, player);
			};
		} else {
			return event;
		}
	};

	this.handleEvent = function(name, element, player) {
		if (name.indexOf("@") === 0) { //call a handler with this name
			name = name.replace("@", "");
			if (this.events[name] !== undefined) {
				this.events[name](element, player);
			} else {
				logError("Handler " + name + " is not defined.");
			}
		} else { //start an animation with this name
			if (this.animations[name] !== undefined) {
				this.ResetAndPlay(name);
			} else {
				logError("Animation " + name + " is not defined.");
			}
		}
	};

	function getElementItem(selector) {
		var element = $(selector);
		if (element.size() === 0) {
			logError("Cannot find DOM element " + selector + " is not defined.");
		}

		return $(selector);
	}

	function logError(error) {
		console.log("Timeline ERROR: " + error);
	}
}

module.exports = TimelinePlayer;