// Fire up JQTouch
var jQT = $.jQTouch({
    icon: 'icon.png',
    statusBar: 'black',
    startupScreen: 'phone_startup.png',
    preloadImages: ['Play_Button.png', 'Stop_Button.png', 'rocks.png', 'sucks.png']
});

var tmradio = tmradio || {};
tmradio.iphone = {
    prefix: 'https://music.tmradio.net/api',
    delay: null,
    token: null,
    track_info: null,
    p: null,
    s: null,
    v: null,
    // Update app-cache, if there is newer version
    updateSite: function(event) {
        window.applicationCache.swapCache();
    },
    // vote = "rocks"|"sucks"
    voteForCurentTrack: function(vote) {
        var url = null;
        if (vote == 'rocks') {
            url = tmradio.iphone.prefix + '/track/rocks.json';
        } else if (vote == 'sucks') {
            url = tmradio.iphone.prefix + '/track/sucks.json';
        } else {
            return;
        }

        $('#vote_actions').fadeOut();

        $.post(
            url,
            {"token": tmradio.iphone.token, "track_id": tmradio.iphone.track_info.id},
            'json'
        )
        .done(function(data){
            $("#results_ul").text(data.message);
            tmradio.iphone.getCurrentTrackInfo(true);
        })
        .fail(function(){
            alert('Looks like you have a bad auth-token');
            localStorage.removeItem('token');
            tmradio.iphone.token = null;
            $('#save_token_input').val('');
            $('#vote').hide();
            $('#log_in_button').text('Log In');
        });
    },
    getCurrentTrackInfo: function(oob) {
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
                var time_to_check = 1000 * (end_of_play - now + tmradio.iphone.delay + 5);
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

                if ($.inArray('music', data.labels) == -1) {
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
            '<span title="rating">⚖' + (Math.round(info.weight * 100) / 100) + '</span> ' + 
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
        var minutes = (time - seconds) / 60;

        if (seconds < 10) {
            seconds = '0' + Math.round(seconds);
        } else {
            seconds = Math.round(seconds);
        }

        return Math.round(minutes) + ':' + seconds;
    },
    download: function() {
        if (tmradio.iphone.track_info.download == null) {
            return;
        }

        window.open(tmradio.iphone.track_info.download, 'Download');
        return false;
    },
    lastfm: function() {
        if ($.inArray('music', tmradio.iphone.track_info.labels) == -1) {
            return;
        }

        var url = 'http://www.last.fm/music/'
                    + tmradio.iphone.track_info.artist.replace(' ', '+')
                    + '/_/'
                    + tmradio.iphone.track_info.title.replace(' ', '+');
        window.open(url, 'last.fm');
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
                tmradio.iphone.getCurrentTrackInfo();
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

        $('#results_ul').text('');

        var player = $('#tmRadio');
        player.get(0).pause();
        player.remove();
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
            tmradio.iphone.prefix + '/auth.json',
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
    init: function() {
        window.applicationCache.addEventListener('updateready', tmradio.iphone.updateSite, false);

        if ($('body').hasClass('fullscreen')) {
            $('#fullscreen_ad').hide();
        } else {
            window.setTimeout(tmradio.iphone.hideAd, 1000 * 5); // 5 seconds
        }

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
        tmradio.iphone.s.click(tmradio.iphone.stop)

        $('#save_token_btn').click(tmradio.iphone.saveToken);
        $('#request_token_btn').click(tmradio.iphone.requestToken)
        $('#logout').click(tmradio.iphone.logout);
    }
}

$(tmradio.iphone.init);
