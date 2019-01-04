'use strict';

// An array of objects representing the result of searching for music on iTunes.
const EXAMPLE_SEARCH_RESULTS = {
    results: [{
        artistName: "Queen",
        trackName: "Bohemian Rhapsody",
        previewUrl: "https://audio-ssl.itunes.apple.com/apple-assets-us-std-000001/Music3/v4/41/cc/ae/41ccae59-697a-414c-43b5-51bd4d88d535/mzaf_3150742134610995145.plus.aac.p.m4a",
        artworkUrl100: "http://is3.mzstatic.com/image/thumb/Music1/v4/94/92/a3/9492a374-e6e3-8e92-0630-a5761070b0f7/source/100x100bb.jpg",
    }, {
        artistName: "David Bowie",
        trackName: "Starman (2012 Remastered Version)",
        previewUrl: "https://audio-ssl.itunes.apple.com/apple-assets-us-std-000001/AudioPreview71/v4/d2/68/ea/d268ea6a-9e8b-fc0b-f519-0e8b59fd9a18/mzaf_6387986799378989474.plus.aac.p.m4a",
        artworkUrl100: "http://is3.mzstatic.com/image/thumb/Music6/v4/ab/4e/d9/ab4ed977-4b96-4791-bcec-e02c94283332/source/100x100bb.jpg",
    }, {
        artistName: "Beyoncé",
        trackName: "Formation",
        previewUrl: "https://audio-ssl.itunes.apple.com/apple-assets-us-std-000001/AudioPreview122/v4/5f/d7/5f/5fd75fd8-d0a5-ccb2-7822-bcaedee070fc/mzaf_3356445145838692600.plus.aac.p.m4a",
        artworkUrl100: "http://is1.mzstatic.com/image/thumb/Music20/v4/23/c1/9e/23c19e53-783f-ae47-7212-03cc9998bd84/source/100x100bb.jpg",
    }]
};


// render songs

function renderTrack(song) {
    let img = document.createElement("img");
    $(img).attr({
        src: song.artworkUrl100,
        alt: song.trackName,
        title: song.trackName
      });
    $("#records").append(img);
}



//render search results

function renderSearchResults(obj) {
    document.getElementById("records").innerHTML = "";
    if(obj.results.length > 0) {
        for(let item of obj.results) {
            renderTrack(item);
        }
    }else {
        renderError(new Error("No results found"));
    }
}





// fetch data, error, spinner, etc.

const URL_TEMPLATE = "https://itunes.apple.com/search?entity=song&limit=25&term={searchTerm}"; // eslint-disable-line
function fetchTrackList(searchTerm) {
    togglerSpinner();
    let url = "https://itunes.apple.com/search?entity=song&limit=25&term=" + searchTerm; 
    return fetch(url)
        .then(function(response) {
            let promise = response.json();
            return promise;
        })
        .then(function(data) {
            renderSearchResults(data)
        })
        .catch(function(error) {
            renderError(error);
        })
        .then(togglerSpinner);
}




// event listener

$('button').click(function(event) {
    event.preventDefault();
    let input = $('#searchQuery').val();
    fetchTrackList(input);
}) 


// error
function renderError(error) {
    $('#records').append('<p class="alert alert-danger"></p>');
    $('.alert-danger').text(error.message);
}


function togglerSpinner(){
    $('.fa-spinner').toggleClass('d-none'); 
  }

// Play music

const state = {
    previewAudio: new Audio()
};

// Plays the given track, spinning the given image.
function playTrackPreview(track, img) { // eslint-disable-line
    if (state.previewAudio.src !== track.previewUrl) { // if a new track to play
        document.querySelectorAll('img').forEach(function (element) {
            element.classList.remove('fa-spin');
        }); // stop whoever else is spinning

        state.previewAudio.pause(); // pause current
        state.previewAudio = new Audio(track.previewUrl); // create new audio
        state.previewAudio.play(); // play new
        img.classList.add('fa-spin'); // start the spinning
    } else {
        if (state.previewAudio.paused) {
            state.previewAudio.play();
        } else {
            state.previewAudio.pause();
        }
        img.classList.toggle('fa-spin'); // toggle the spinning
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports.EXAMPLE_SEARCH_RESULTS = EXAMPLE_SEARCH_RESULTS;
    if (typeof renderTrack !== 'undefined')
        module.exports.renderTrack = renderTrack;
    if (typeof renderSearchResults !== 'undefined')
        module.exports.renderSearchResults = renderSearchResults;
    if (typeof fetchTrackList !== 'undefined')
        module.exports.fetchTrackList = fetchTrackList;
    if (typeof toggleSpinner !== 'undefined')
        module.exports.toggleSpinner = toggleSpinner;
}
