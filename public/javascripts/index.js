document.getElementById('js-place--button').addEventListener('click', searchPlace)

function searchPlace() {
    const place = document.getElementById('js-place').value;
    const placename = document.getElementById('js-placename');
    const placeaddress = document.getElementById('js-placeaddress');
    const resultDiv = document.getElementById('js-result');
    const earthquakeCount = document.getElementById('js-info-count');
    const infoPlace = document.getElementById('js-info-place');
    const infoAddress = document.getElementById('js-info-address');
    const loading = document.querySelectorAll('.loading');
    const errorModal = document.querySelector('.modalbg');

    errorModal.querySelector('.modal__exit').addEventListener('click', e => {
        errorModal.style.display = 'none';
    }, { once: true });

    loading.forEach(loader => loader.style.display = 'flex');
    
    const url = '/xhr/placeautocomplete';

    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);

    const xhrDict = {
        204: 'No Results',
        400: 'Invalid Place',
        503: 'Service Unavailable',
        500: ''
    }

    xhr.onload = () => {
        loading.forEach(loader => loader.style.display = 'none');
        if (xhr.status === 200){
            const data = JSON.parse(xhr.responseText);
            placename.innerText = data.name;
            placeaddress.innerText = data.formatted_address;
            infoPlace.innerText = data.name;
            infoAddress.innerText = data.formatted_address;
            earthquakeCount.innerText = data.earthquakes.length;

            updateMap(data.location, data.boundingBox, data.earthquakes);
        } else {
            errorModal.style.display = 'flex';
            resultDiv.innerHTML = `<p>${xhr.responseText}</p>`;
            console.warn(`${xhr.status}: ${xhr.responseText}`);
        }
    };

    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({ place: place }));

    xhr.onerror = (e) => {
        errorModal.style.display = 'flex';
        resultDiv.innerHTML = `<p>XHR Error!</p>`;
        console.error('XHR Error: ', e);
    };
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

    searchPlace();
};

function updateMap(location, boundingBox, earthquakes) {
    map = new google.maps.Map(document.getElementById('js-map'), {
        center: location,
        restriction: { latLngBounds: boundingBox },
        ...mapParams
    });

    infoWindows = [];
    markers = earthquakes.map((earthquake, idx) => {
        const dateTime = new Date(earthquake.datetime);
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const date = dateTime.toLocaleString(undefined, dateOptions);
        const time = dateTime.toLocaleTimeString(undefined);
        
        const template = document.getElementById('js-infowindow').content.cloneNode(true);
        template.getElementById('js-date').innerText = date;
        template.getElementById('js-time').innerText = time;
        template.getElementById('js-depth').innerText = `${earthquake.depth} meters`;
        template.getElementById('js-mag').innerText = `${earthquake.magnitude}`;
        const tmpDiv = document.createElement('div');
        tmpDiv.appendChild(template)

        const marker = new google.maps.Marker({
            position: { lat: earthquake.lat, lng: earthquake.lng },
            map,
            icon: '/images/marker.png',
            title: `Magnitude: ${earthquake.magnitude}`
        });

        const infoWindow = new google.maps.InfoWindow({
            content: tmpDiv.innerHTML
        });

        infoWindows.push(infoWindow);

        marker.addListener('click', _ => {
            infoWindows.forEach(window => window.close());
            document.getElementById('js-info-date').innerText = date;
            document.getElementById('js-info-time').innerText = time;
            document.getElementById('js-info-depth').innerText = `${earthquake.depth} meters`;
            document.getElementById('js-info-mag').innerText = `${earthquake.magnitude}`;
            infoWindow.open(map, marker);
        });

        infoWindow.addListener('closeclick', _ => {
            document.getElementById('js-info-date').innerText = 'None Selected';
            document.getElementById('js-info-time').innerText = 'None Selected';
            document.getElementById('js-info-depth').innerText = 'None Selected';
            document.getElementById('js-info-mag').innerText = 'None Selected';
        });
    });
};