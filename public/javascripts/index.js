document.getElementById('js-place--button').addEventListener('click', searchPlace)

function searchPlace() {
    const place = document.getElementById('js-place').value;
    const placename = document.getElementById('js-placename');
    const placeaddress = document.getElementById('js-placeaddress');
    const resultDiv = document.getElementById('js-result');
    
    const url = '/xhr/placeautocomplete';

    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);

    xhr.onload = () => {
        if (xhr.status === 200){
            const data = JSON.parse(xhr.responseText);
            placename.innerText = data.name;
            placeaddress.innerText = data.formatted_address;

            updateMap(data.location, data.boundingBox, data.earthquakes);

            // resultDiv.innerHTML = JSON.stringify(data);
        } else if (xhr.status === 204) {
            resultDiv.innerHTML = '<p>No content</p>'
        } else {
            resultDiv.innerHTML = xhr.responseText;
        }
    };

    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({ place: place }));

    xhr.onerror = () => {};
};

let map;
let mapParams;
let markers;
let infoWindows;

function initMap() {
    mapParams = {
        zoom: 2,
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: true,
        mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
            mapTypeIds: ['roadmap', 'terrain']
        }
    };

    map = new google.maps.Map(document.getElementById('js-map'), {
        center: { lat: 19.43, lng: -99.13 },
        ...mapParams
    });

    
};

function updateMap(location, boundingBox, earthquakes) {
    map = new google.maps.Map(document.getElementById('js-map'), {
        center: location,
        restriction: { latLngBounds: boundingBox },
        ...mapParams
    });

    markers = earthquakes.map(earthquake => {
        const dateTime = new Date(earthquake.datetime);
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const date = dateTime.toLocaleString(undefined, dateOptions);
        const time = dateTime.toLocaleTimeString(undefined);
        
        const template = document.getElementById('js-infowindow').content.cloneNode(true);
        template.getElementById('js-date').innerText = date;
        template.getElementById('js-time').innerText = time;
        template.getElementById('js-depth').innerText = `${earthquake.depth} meters`;
        template.getElementById('js-mag').innerText = `${earthquake.magnitude}`;

        const marker = new google.maps.Marker({
            position: { lat: earthquake.lat, lng: earthquake.lng },
            map,
            title: `Magnitude: ${earthquake.magnitude}`
        });

        const infoWindow = new google.maps.InfoWindow({
            content: template
        });

        marker.addListener('click', _ => infoWindow.open(map, marker));
    });
};