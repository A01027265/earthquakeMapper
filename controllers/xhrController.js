const axios = require('axios').default;
const { Client } = require('@googlemaps/google-maps-services-js'); 

exports.placeAutocomplete = async (req, res, next) => {
    const xhrParams = req.body;

    if (xhrParams.place == '') {
        const placeData = {
            name: 'World',
            formatted_address: 'Top 10 in the last 12 months',
            location: {
                lat: 19.43,
                lng: -99.13
            },
            boundingBox: {
                north: 90,
                south: -90,
                east: 180,
                west: -180
            }
        };

        const geonamesURL = 'http://api.geonames.org/earthquakesJSON';
        const today = new Date();
        const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const earthquakeParams = {
            ...placeData.boundingBox,
            date,
            minMagnitude: 6.5,
            username: process.env.GEONAMES_USERNAME
        };
        
        let earthquakeAPI;
        let tempEarthquakeAPI;
        let apiEnd = false;

        while (apiEnd === false) {
            try {
                tempEarthquakeAPI = await axios.get(geonamesURL, { params: earthquakeParams });
            } catch (error) {
                res.status(500).send('Internal Server Error');
                console.error('Error: ', error);
                return;
            }

            const tmpEQ = tempEarthquakeAPI.data.earthquakes;
            const lTmpEQ = new Date(tmpEQ[tmpEQ-1].datetime);
            const yearAgo = today.setDate(today.getMonth()-12);
            if (today < lTmpEQ) earthquakeParams.minMagnitude += 0.5;
           
        }

        const earthquakeData = earthquakeAPI.data;
        placeData.earthquakes = earthquakeData.earthquakes;

        res.status(200).send(JSON.stringify(placeData));


    }

    const placeParams = {
        input: xhrParams.place,
        inputtype: 'textquery',
        fields: [
            'place_id',
            'name',
            'geometry',
            'formatted_address'
        ],
        key: process.env.GOOGLE_API_BACK
    };
    
    const client = new Client({});
    let placeAPI;

    try {
        placeAPI = await client.findPlaceFromText({ params: placeParams });
    } catch (error) {
        switch(error.response.data.status) {
            case 'ZERO_RESULTS':
                res.status(204).send('No Results');
                break;
            case 'INVALID_REQUEST':
                res.status(400).send('Invalid Place');
                break;
            case 'OVER_QUERY_LIMIT':
            case 'REQUEST_DENIED':
                res.status(503).send('Service Unavailable');
                console.error('Error: ', error.response.data);
                break;
            case 'UNKNOWN_ERROR':
                res.status(500).send('API Internal Server Error');
                console.error('Error: ', error.response.data);
                break;
            default:
                res.status(500).send('Internal Server Error');
                console.error('Error: ', error.response.data);
        }
        return;
    }

    if (!placeAPI || !placeAPI.data) {
        res.status(204).send('No Content');
        return;
    }

    const place = placeAPI.data.candidates[0];
    const placeData = {
        name: place.name,
        formatted_address: place.formatted_address,
        location: place.geometry.location,
        boundingBox: {
            north: place.geometry.viewport.northeast.lat,
            south: place.geometry.viewport.southwest.lat,
            east: place.geometry.viewport.northeast.lng,
            west: place.geometry.viewport.southwest.lng
        }
    };

    const geonamesURL = 'http://api.geonames.org/earthquakesJSON';
    const earthquakeParams = {
        ...placeData.boundingBox,
        username: process.env.GEONAMES_USERNAME
    };
    
    let earthquakeAPI;

    try {
        earthquakeAPI = await axios.get(geonamesURL, { params: earthquakeParams });
    } catch (error) {
        res.status(500).send('Internal Server Error');
        console.error('Error: ', error);
        return;
    }

    const earthquakeData = earthquakeAPI.data;
    placeData.earthquakes = earthquakeData.earthquakes;

    res.status(200).send(JSON.stringify(placeData));
};