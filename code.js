// Fire up JQTouch
var jQT = $.jQTouch({
    icon: 'icon.png',
    statusBar: 'black',
    startupScreen: 'phone_startup.png',
    preloadImages: ['Play_Button.png', 'Stop_Button.png', 'rocks.png', 'sucks.png']
});

var tmradio = tmradio || {};
tmradio.iphone = {
    prefix: 'http://music.tmradio.net/api',
    sprefix: 'https://music.tmradio.net/api',
    is_playing: false,
    delay: null,
    track_end_time: null,
    track_time_updater: null,
    token: null,
    track_info: null,
    p: null,
    s: null,
    // Update app-cache, if there is newer version
    updateSite: function(event) {
        window.applicationCache.swapCache();
    },
    // vote = "rocks"|"sucks"
    voteForCurentTrack: function(vote) {
        var url = null;
        if (vote == 'rocks') {
            url = tmradio.iphone.sprefix + '/track/rocks.json';
        } else if (vote == 'sucks') {
            url = tmradio.iphone.sprefix + '/track/sucks.json';
        } else {
            return;
        }

        $('#vote_actions').fadeOut();

        $.post(
            url,
            {"token": tmradio.iphone.token, "track_id": tmradio.iphone.track_info.id},
            null,
            'json'
        )
        .done(function(data){
            if (data.id == tmradio.iphone.track_info.id) {
                tmradio.iphone.track_info.weight = data.weight;
                tmradio.iphone.showTrackInfo();
            }
        })
        .fail(function(){
            alert('Looks like you have a bad auth-token');
            iphone.tmradio.logout();
        });
    },
    getCurrentTrackInfo: function(oob) {
        if (tmradio.iphone.is_playing == false) {
            return;
        }

        // Show a loading message
        var results_ul = $("#results_ul")

        if (results_ul.text() == '') {
            results_ul.text("Loading…");
        }

        // Do the ajax call
        $.ajax({
            type: "GET",
            url: tmradio.iphone.prefix + "/status.json",
            dataType: "json",
            cache: false
        })
            .done(function(data){
                var now = Math.round(Date.now() / 1000);
                var end_of_play = data.last_played + data.length;
                var left_to_play = end_of_play - data.current_ts;

                tmradio.iphone.track_end_time = now + left_to_play;

                var time_to_check = 1000 * (left_to_play + tmradio.iphone.delay);
                if (time_to_check <= 0) {
                    time_to_check = 1000 * 5;
                }

                if (oob == undefined) {
                    window.setTimeout(tmradio.iphone.getCurrentTrackInfo, time_to_check);
                }

                if (tmradio.iphone.track_info == null || tmradio.iphone.track_info.id != data.id) {
                    tmradio.iphone.activateVote();
                }

                if (data.download != null) {
                    $('#download').fadeIn();
                } else {
                    $('#download').fadeOut();
                }

                if (data.track_url == null) {
                    $('#lastfm').fadeOut();
                } else {
                    $('#lastfm').fadeIn();
                }

                tmradio.iphone.track_info = data;
                tmradio.iphone.showTrackInfo();
            })
            .fail(function(req, status, err){
                results_ul.text("Что то сломалось. <br>" + status + ": " + err);
                window.setTimeout(tmradio.iphone.getCurrentTrackInfo, 1000 * 5);
            });
        
    },
    showTrackInfo: function() {
        var results_ul = $("#results_ul");
        var info = tmradio.iphone.track_info;

        if (info.length <= 0) {
            results_ul.text("JSON глючит!");
            return;
        }

        if ($.inArray('lang:ru', info.labels) != -1) {
            results_ul.text('«' + info.title + '» — ' + info.artist);
        } else {
            results_ul.text('"' + info.title + '" — ' + info.artist);
        }

        results_ul.append(
            '<br>' +
            '<span title="played ' + info.count + ' times">▶' + info.count + '</span> ' +
            '⚖<span title="rating" id="rating">' + (Math.round(info.weight * 100) / 100) + '</span> ' + 
            '🕗<span id="time">' + tmradio.iphone.formatTime(info.length) + '</span> '
        );

        if (info.image != null) {
            $('#cover').attr('src', info.image);
        } else {
            $('#cover').attr('src', 'cover.png');
        }
    },
    formatTime: function(time) {
        var seconds = time % 60;
        var _minutes = (time - seconds) / 60;
        var minutes = _minutes % 60;
        var _hours = (_minutes - minutes) / 60;

        seconds = Math.round(seconds);

        if (seconds < 10) {
            seconds = '0' + seconds;
        }

        minutes = Math.round(minutes)

        if (_hours > 0) {
            if (minutes < 10) {
                minutes = '0' + minutes;
            }

            return Math.round(_hours) + ':' + minutes + ':' + seconds;
        }

        return minutes + ':' + seconds;
    },
    download: function() {
        if (tmradio.iphone.track_info.download == null) {
            return;
        }

        window.open(tmradio.iphone.track_info.download, 'Download');
        return false;
    },
    lastfm: function() {
        if (tmradio.iphone.track_info.track_url == null) {
            return;
        }

        window.open(tmradio.iphone.track_info.track_url, 'last.fm');
        return false;
    },
    play: function() {
        tmradio.iphone.p.hide();
        tmradio.iphone.s.show();

        $('<audio id="tmRadio" src="http://stream.tmradio.net:8180/live.mp3" />')
            .appendTo($('#player'))
            .on('play', function(){
                tmradio.iphone.delay = Date.now();
                $('#results_ul').text('Loading…');
            })
            .on('playing', function(){
                tmradio.iphone.delay = (Date.now() - tmradio.iphone.delay) / 1000;
                tmradio.iphone.is_playing = true;
                tmradio.iphone.getCurrentTrackInfo();
            })
            .on('pause', function(){
                tmradio.iphone.stop();
            })
            .on('emptied', function(){ $('#results_ul').text('Error'); })
            .get(0).play();
    },
    stop: function() {
        tmradio.iphone.p.show();
        tmradio.iphone.s.hide();

        $('#track_actions2 li').hide();
        $('#vote_actions').hide();
        $('#login_ul').hide();

        $('#tmRadio').remove();

        tmradio.iphone.is_playing = false;
        tmradio.iphone.track_info = null;
        tmradio.iphone.track_end_time = null;

        $('#cover').attr('src', 'cover.png');
        $('#results_ul').text('');
    },
    activateVote: function() {
        if (tmradio.iphone.token) {
            $('#login_ul').hide();
            $('#vote_actions').show();
        } else {
            $('#vote_actions').hide();
            $('#login_ul').show();
        }
    },
    saveToken: function() {
        var input = $('#save_token_input');
        var val = null;

        if (input.val().length > 0) {
            val = input.val();
        }

        if (val == null) {
            tmradio.iphone.logout();
        } else {
            localStorage.setItem('token', val);
            tmradio.iphone.token = val;
            tmradio.iphone.activateVote();
            $('#logout_ul').show();
        }

        jQT.goBack('#home');
    },
    requestToken: function() {
        var email = $('#request_token_input').val();

        if (email.length == 0) {
            alert('enter email, please');
            return;
        }

        $.post(
            tmradio.iphone.sprefix + '/auth.json',
            {"type": "email", "id": email},
            function(data){
                alert(data['message']);
            },
            'json'
        );
    },
    hideAd: function() {
        $('#fullscreen_ad').slideUp('slow');
    },
    logout: function() {
        $('#logout_ul').fadeOut();

        localStorage.removeItem('token');
        tmradio.iphone.token = null;
        $('#save_token_input').val('');

        tmradio.iphone.activateVote();
    },
    timeFix: function() {
        if (tmradio.iphone.track_end_time == null) {
            return;
        }

        var now = Math.round(Date.now() / 1000);
        var time_left = tmradio.iphone.track_end_time - now + tmradio.iphone.delay;

        if (time_left < 0) {
            time_left = 0;
        }

        $('#time').text(tmradio.iphone.formatTime(time_left));
    },
    init: function() {
        window.applicationCache.addEventListener('updateready', tmradio.iphone.updateSite, false);

        if ($('body').hasClass('fullscreen')) {
            $('#fullscreen_ad').hide();
        } else {
            window.setTimeout(tmradio.iphone.hideAd, 1000 * 5); // 5 seconds
        }

        window.setInterval(tmradio.iphone.timeFix, 1000);

        tmradio.iphone.token = localStorage.getItem('token');

        if (tmradio.iphone.token) {
            $('#save_token_input').val(tmradio.iphone.token);
            $('#logout_ul').show();
        }

        $('#rocks').click(function(){ tmradio.iphone.voteForCurentTrack('rocks') });
        $('#sucks').click(function(){ tmradio.iphone.voteForCurentTrack('sucks') });
        $('#download').on('click', tmradio.iphone.download);
        $('#lastfm').on('click', tmradio.iphone.lastfm);

        tmradio.iphone.p = $('#play');
        tmradio.iphone.s = $('#stop');

        tmradio.iphone.p.click(tmradio.iphone.play)
        tmradio.iphone.s.click(function(){ $('#tmRadio').trigger('pause'); })

        $('#save_token_btn').click(tmradio.iphone.saveToken);
        $('#request_token_btn').click(tmradio.iphone.requestToken)
        $('#logout').click(tmradio.iphone.logout);
    }
}

$(tmradio.iphone.init);
