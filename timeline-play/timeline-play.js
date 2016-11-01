/* jshint node: true */

function TimelinePlayer() {
	this.animations = {};
	this.events = {};

	this.Clear = function() {
		this.animations = {};
	};

	this.RegisterAnimation = function(name, animation) {
		this.animations[name] = animation;
	};

	this.RegisterEvent = function(name, handler) {
		this.events[name] = handler;
	};

	this.ResetAndPlay = function(animationName) {
		var thisTimeline = this;
		this.Reset(animationName, function() {
			thisTimeline.Play(animationName);
		});
	};

	this.Play = function(animationName) {
		var animation = this.animations[animationName].animationPlaylists;

		for (var i = 0; i < animation.length; i++) {
			$.Velocity.RunSequence(animation[i]);
		}
	};

	this.Reset = function(animationName, done) {
		//this is where we attach dom elements to the playlists
		var animation = this.animations[animationName];

		this.attachDOMObjectsToPlaylists(animation.animationPlaylists);
		this.attachDOMObjectsToPlaylist(animation.resetPlaylist);

		for (var i = 0; i < animation.resetPlaylist.length; i++) {
			var transition = animation.resetPlaylist[i];
			transition.e.hide();

			var options = { "duration": 0};
			if (i === animation.resetPlaylist.length - 1) {
				options.complete = function() {
					for (var j = 0; j < animation.resetPlaylist.length; j++) {
						animation.resetPlaylist[j].e.show();
					}

					done();
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
					o: playlist[j].o
				};
			}

			this.replaceEventsWithHandlers(playlist[j]);
		}
	};

	this.replaceEventsWithHandlers = function(playlistItem) {
		playlistItem.o.begin = this.replaceEventWithHandler(playlistItem.o.begin, playlistItem.e);
		playlistItem.o.complete = this.replaceEventWithHandler(playlistItem.o.complete, playlistItem.e);
	};

	this.replaceEventWithHandler = function(event, element) {
		if (typeof event === 'string') {
			var context = this;
			return function() {
				context.handleEvent(event, element);
			};
		} else {
			return event;
		}
	};

	this.handleEvent = function(name, element) {
		if (name.indexOf("@") === 0) { //call a handler with this name
			name = name.replace("@", "");
			if (this.events[name] !== undefined) {
				this.events[name](element);
			} else {
                console.log("Timeline ERROR: handler " + name + " is not defined.");
			}
		} else { //start an animation with this name
			if (this.animations[name] !== undefined) {
				this.ResetAndPlay(name);
			} else {
                console.log("Timeline ERROR: animation " + name + " is not defined.");
			}
		}
	};

	function getElementItem(selector) {
		var element = $(selector);
		if(element.size() === 0)
			console.log("Timeline ERROR: cannot find DOM element " + selector + " is not defined.");

		return $(selector);
	}
}

module.exports = TimelinePlayer;