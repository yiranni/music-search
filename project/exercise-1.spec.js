//dependencies
const fs = require('fs');
const path = require('path');
const fetchMock = require('fetch-mock');
const $ = require('jquery'); //jQuery for convenience    

//problem config
const HTML_FILE_PATH = (__dirname + '/index.html');
const JS_FILE_PATH = __dirname + '/js/index.js';


//my custom matchers
const styleMatchers = require('../lib/style-matchers.js');
expect.extend(styleMatchers);

//load the HTML content to test with
const html = fs.readFileSync(HTML_FILE_PATH, 'utf-8');

/** Begin tests **/

describe('Source code is valid', () => {
    test('JavaScript lints without errors', async () => {
        expect([JS_FILE_PATH]).toHaveNoEsLintErrors();
    })

    describe('Includes the polyfills in the HTML', () => {
        test('loaded both polyfills', () => {
            document.documentElement.innerHTML = html; //let's just do this now

            let scriptSrcs = [];
            document.querySelectorAll('script').forEach((script) => {
                scriptSrcs.push(script.src);
            })

            expect(scriptSrcs).toEqual(expect.arrayContaining([expect.stringMatching(/fetch(\.min)?\.js/)])); //expect fetch
            expect(scriptSrcs).toEqual(expect.arrayContaining([expect.stringMatching(/es6-promise(\.auto)?(\.min)?\.js/)])); //expect promise
        })
    })
});

describe('Song searching page', () => {

    let solution; //define at global scope for unit testing functions

    beforeAll(() => {
        //load the HTML file as the document
        document.documentElement.innerHTML = html;

        //load JavaScript library separately
        window.jQuery = window.$ = $;
        fetchMock.get('*', []); //starting mock for any initial loads

        //fetch = require('node-fetch'); //"polyfill" for node
        solution = require(JS_FILE_PATH); //actually load the JavaScript file!    
    });

    beforeEach(() => {
        document.querySelector('#records').innerHTML = ''; //clear whatever we had before    
    })

    test('renders individual tracks', () => {
        solution.renderTrack(solution.EXAMPLE_SEARCH_RESULTS.results[1]); //render Bowie

        let img = $('#records img');
        expect(img.length).toBe(1); //show single element
        expect(img.attr('src')).toEqual(solution.EXAMPLE_SEARCH_RESULTS.results[1].artworkUrl100);
        let trackRegex = new RegExp(solution.EXAMPLE_SEARCH_RESULTS.results[1].trackName.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&")); //get name, escape as regex
        expect(img.attr('alt')).toMatch(trackRegex);
        expect(img.attr('title')).toMatch(trackRegex);
    })

    test('renders search results', () => {
        solution.renderSearchResults(solution.EXAMPLE_SEARCH_RESULTS); //render sample

        let records = $('#records img');
        expect(records.length).toBe(3); //3 items
        expect(records.eq(0).attr('src')).toEqual(solution.EXAMPLE_SEARCH_RESULTS.results[0].artworkUrl100); //should all be different
        expect(records.eq(1).attr('src')).toEqual(solution.EXAMPLE_SEARCH_RESULTS.results[1].artworkUrl100);
        expect(records.eq(2).attr('src')).toEqual(solution.EXAMPLE_SEARCH_RESULTS.results[2].artworkUrl100);

        //call again (should clear)
        solution.renderSearchResults(solution.EXAMPLE_SEARCH_RESULTS);
        expect($('#records img').length).toBe(3); //still 3 items (because erased others!)
    })

    test('fetches track information and renders the result', async () => {
        fetchMock.restore(); //reset the mock
        fetchMock.getOnce('*', solution.EXAMPLE_SEARCH_RESULTS); //general mock, always return sample

        await solution.fetchTrackList('sample');

        let records = $('#records img');
        expect(records.length).toBe(3); //3 items
        expect(records.eq(1).attr('src')).toEqual(solution.EXAMPLE_SEARCH_RESULTS.results[1].artworkUrl100); //one of them is correct at least   
    })

    test('searches on form submission', (done) => {

        //mock this search!
        const searchResult = {
            results: [{
                artistName: "Test",
                trackName: "Test Track",
                previewUrl: "test link",
                artworkUrl100: "test image"
            }]
        };
        const searchUrl = "https://itunes.apple.com/search?entity=song&limit=25&term=TestSearch"
        fetchMock.restore(); //reset the mock
        fetchMock.getOnce(searchUrl, searchResult);

        $('#searchQuery').val('TestSearch'); //type a search
        $('button').click(); //submit!

        setImmediate(() => { //wait until promise has resolved (one tick)
            let records = $('#records img');
            expect(records.length).toBe(1); //only one record returned
            expect(records.eq(1).attr('src')).toEqual(searchResult.artworkUrl100); //shows right image
            done(); //callback to continue tests
        })
    });

    test('handles and displays errors', async () => {

        //test error downloading
        fetchMock.restore(); //reset the mock
        fetchMock.getOnce('*', {
            throws: new Error('Could not fetch data')
        });
        await solution.fetchTrackList('badurl'); //call the fetch

        let alert = $('#records .alert.alert-danger');
        expect(alert.length).toBe(1); //should show an alert
        expect(alert.text()).toEqual("Could not fetch data");

        //clear for second test
        $('#records').html('');

        //test empty list
        fetchMock.restore(); //reset the mock
        fetchMock.getOnce('*', {
            results: []
        }); //return empty results.
        await solution.fetchTrackList('empty'); //call the fetch

        alert = $('#records .alert.alert-danger');
        expect(alert.length).toBe(1); //should show an alert
        expect(alert.text()).toEqual("No results found");
    })

    test('shows a spinner while downloading', (done) => {
        //check that the `displaySpinner()` function was called twice?

        let spinner = $('.fa-spinner');
        expect(spinner.hasClass('d-none')).toBe(true); //should not be shown

        fetchMock.restore(); //reset the mock
        fetchMock.getOnce('*', solution.EXAMPLE_SEARCH_RESULTS); //general mock, always return sample
        $('button').click(); //submit!
        //solution.fetchTrackList('sample'); //start downloading

        expect(spinner.hasClass('d-none')).toBe(false); //should be shown now (synchronous)

        setImmediate(() => { //wait until promise has resolved (one tick)
            expect(spinner.hasClass('d-none')).toBe(true); //should not be shown (async)      
            done(); //callback to continue tests
        })
    })
})
