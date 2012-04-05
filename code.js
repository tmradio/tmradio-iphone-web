// Fire up JQTouch
var jQT = $.jQTouch({
    icon: 'icon.png',
    statusBar: 'black',
    startupScreen: 'phone_startup.png',
    preloadImages: ['Play_Button.png', 'Stop_Button.png', 'reload.png', 'rocks.png', 'sucks.png']
});

var tmradio = tmradio || {};
tmradio.iphone = {
    updater: null,
    token: null,
    track_info: null,
    // Update app-cache, if there is newer version
    updateSite: function(event) {
        window.applicationCache.swapCache();
    },
    // vote = "rocks"|"sucks"
    voteForCurentTrack: function(vote) {
        var url = null;
        if (vote == 'rocks') {
            url = 'http://music.tmradio.net/api/track/rocks.json';
        } else if (vote == 'sucks') {
            url = 'http://music.tmradio.net/api/track/sucks.json';
        } else {
            return;
        }

        $.post(
            url,
            {"token": tmradio.iphone.token, "track_id": tmradio.iphone.track_info.id},
            function(data){
                $("#results_ul").text(data.message);
            },
            'json'
        )
        .error(function(){
            alert('Looks like you have a bad auth-token');
            localStorage.removeItem('token');
            tmradio.iphone.token = null;
            $('#save_token_input').val('');
            $('#vote').hide();
            $('#log_in_button').text('Log In');
        });
    },
    getCurrentTrackInfo: function() {
        // Show a loading message
        var results_ul = $("#results_ul")

        results_ul.text("Loading…");

        // Do the ajax call
        $.ajax({
            type: "GET",
            url: "http://music.tmradio.net/api/status.json",
            dataType: "json",
            cache: false,
            success: function(data){
                tmradio.iphone.showTrackInfo(data);
            },
            error: function(req, status, err){
                results_ul.text("Что то сломалось. <br>" + status + ": " + err);
            }
        });
    },
    showTrackInfo: function(info) {
        var results_ul = $("#results_ul");

        if (info.length <= 0){
            tmradio.iphone.track_info = null;
            results_ul.text("JSON глючит!");
        } else {
            tmradio.iphone.track_info = info;
            results_ul.text("«" + info.title + "» by " + info.artist + " — ♺" + info.count + " ⚖" + Math.round(info.weight * 100) / 100);
        }
    },
    init: function() {
        window.applicationCache.addEventListener('updateready', tmradio.iphone.updateSite, false);

        if ($('body').hasClass('fullscreen')) {
            $('#fullscreen_ad').hide();
        }

        $('#reload').click(tmradio.iphone.getCurrentTrackInfo);
        $('#rocks').click(function(){ tmradio.iphone.voteForCurentTrack('rocks') });
        $('#sucks').click(function(){ tmradio.iphone.voteForCurentTrack('sucks') });

        tmradio.iphone.token = localStorage.getItem('token');

        if (tmradio.iphone.token) {
            $('#log_in_button').text('Relogin');
            $('#save_token_input').val(tmradio.iphone.token);
        }

        var p = $('#play');
        var s = $('#stop');
        var v = $('#vote');

        p.click(function() {
            p.hide();
            s.show();

            if (tmradio.iphone.token) {
                v.show();
            }

            $('<audio id="tmRadio" src="http://stream.tmradio.net:8180/live.mp3" />')
                .appendTo($('#player'))
                .on('play', function(){ $('#results_ul').text('Loading…'); })
                .on('playing', function(){
                    tmradio.iphone.updater = window.setInterval(tmradio.iphone.getCurrentTrackInfo, 1000 * 60); // 1 min
                    tmradio.iphone.getCurrentTrackInfo();
                })
                .on('emptied', function(){ $('#results_ul').text('Error'); })
                .get(0).play();
        })
        s.click(function() {
            p.show();
            s.hide();
            v.hide();

            window.clearInterval(tmradio.iphone.updater);
            $('#results_ul').text('');

            var player = $('#tmRadio');
            player.get(0).pause();
            player.remove();
        })

        $('#save_token_btn').click(function(){
            var input = $('#save_token_input');
            if (input.val().length == 0) {
                return;
            }

            localStorage.setItem('token', input.val());
            tmradio.iphone.token = input.val();
            alert('saved!')
            $('#log_in_button').text('Relogin');
            jQT.goBack('#home');
        });

        $('#request_token_btn').click(function(){
            var email = $('#request_token_input').val();

            if (email.length == 0) {
                alert('enter email, please');
                return;
            }

            $.post(
                'http://music.tmradio.net/api/auth.json',
                {"type": "email", "id": email},
                function(data){
                    alert(data['message']);
                },
                'json'
            );
        })
    }
}

$(tmradio.iphone.init);
