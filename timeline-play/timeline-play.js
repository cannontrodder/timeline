/* jshint node: true */

function TimelinePlayer() {
	this.animations = {};
	this.events = {};

	this.Clear = function() {
		this.animations = {};
	};

	this.Register = function(name, animation) {
		this.animations[name] = animation;
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

		this.AttachDOMObjectsToPlaylists(animation.animationPlaylists);
		this.AttachDOMObjectsToPlaylist(animation.resetPlaylist);

		for (var i = 0; i < animation.resetPlaylist.length; i++) {
			var transition = animation.resetPlaylist[i];
			transition.e.hide();

			var options = {
				duration: 0
			};

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
		window.playlist = animation.resetPlaylist;
	};

	this.AttachDOMObjectsToPlaylist = function(playlist) {
		for (var j = 0; j < playlist.length; j++) {
			if (typeof playlist[j].selector === 'string') {
				playlist[j].e = getElementItem(playlist[j].selector);
				delete playlist[j].selector;
			}

			//if (playlist[j].o !== undefined)
				if (typeof playlist[j].o.complete === 'string') {
					var eventName = playlist[j].o.complete;
					var context = this;
					playlist[j].o.complete = function(){
						context.HandleEvent(eventName);
					};
				}
		}
	};

	this.AttachDOMObjectsToPlaylists = function(playlists) {
		for (var i = 0; i < playlists.length; i++) {
			this.AttachDOMObjectsToPlaylist(playlists[i]);
		}
	};

	this.HandleEvent = function(name){
		if(this.animations[name] !== undefined){
			console.log("We found and are going to play " + name);
			this.ResetAndPlay(name);
			return;
		}

		var event = this.events[name];

		if(event !== undefined){
			event();
			return;
		}
	};

	this.RegisterEvent = function(event, method){
		this.events[event] = method;
	};

	function getElementItem(selector) {
		return $(selector);
	}
}

module.exports = TimelinePlayer;