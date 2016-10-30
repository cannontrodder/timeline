/* jshint node: true */

function TimelinePlayer() {
	this.animations = {};

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
				options.complete = function() {for (var j = 0; j < animation.resetPlaylist.length; j++) {
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
		}
	};

	this.AttachDOMObjectsToPlaylists = function(playlists) {
		for (var i = 0; i < playlists.length; i++) {
			this.AttachDOMObjectsToPlaylist(playlists[i]);
		}
	};

	function getElementItem(selector) {
		return $(selector);
	}
}

module.exports = TimelinePlayer;