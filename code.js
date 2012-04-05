// Update app-cache, if there is newer version
function updateSite(event)
{
    window.applicationCache.swapCache();
}
window.applicationCache.addEventListener('updateready', updateSite, false);

// vote = "rocks"|"sucks"
function voteForCurentTrack(vote)
{
    alert("not implemented")
}

function getCurrentTrackInfo()
{
    // Show a loading message
    var results_ul = $("#results_ul")

    results_ul.text("Loading...");

    // Do the ajax call
    $.ajax({
        type: "GET",
        url: "http://music.tmradio.net/api/status.json",
        dataType: "json",
        cache: false,
        success: function(data){
            showTrackInfo(data);
        },
        error: function(req, status, err){
            results_ul.text("Что то сломалось. <br>"+status + ": " + err);
        }
    });
}

function showTrackInfo(info)
{
    var results_ul = $("#results_ul");

    if (info.length <= 0){
        results_ul.text("JSON глючит!");
    } else {
        results_ul.text("«" + info.title + "» by " + info.artist + " — ♺" + info.count + " ⚖" + Math.round(info.weight * 100) / 100);
    }
}

$(function(){
    // Fire up JQTouch
    var jQT = $.jQTouch({
        icon: 'icon.png',
        statusBar: 'black',
        startupScreen: 'phone_startup.png'
    });

    var updater = null;

    var p = $('#play');
    var s = $('#stop');
    var v = $('#vote');

    p.click(function() {
        p.hide();
        s.show();
        v.show();

        $('<audio id="tmRadio" src="http://stream.tmradio.net:8180/live.mp3" />')
            .appendTo($('#player'))
            .on('play', function(){ $('#results_ul').text('Loading…'); })
            .on('playing', function(){
                updater = window.setInterval(getCurrentTrackInfo, 1000 * 60); // 1 min
                getCurrentTrackInfo();
            })
            .on('emptied', function(){ $('#results_ul').text('Error'); })
            .get(0).play();
    })
    s.click(function() {
        p.show();
        s.hide();
        v.hide();

        window.clearInterval(updater);
        $('#results_ul').text('');

        var player = $('#tmRadio');
        player.get(0).pause();
        player.remove();
    })
})
