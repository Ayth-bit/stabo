mapboxgl.accessToken = 'pk.eyJ1IjoiYXl0aCIsImEiOiJjbHo3czlxcnQwYXg0MmxzODk2a3kzZnEyIn0.vsKU3Zkw2Ce2yI4LMhrP9A';
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v11',
  center: [139.6917, 35.6895], // 東京の中心座標
  zoom: 12
});

let userLocation = null;
let isDebugMode = false; // デバッグモードの状態を管理する変数

// デバッグモード切り替えボタンを追加
const debugButton = document.createElement('button');
debugButton.textContent = 'Debug Mode: OFF';
debugButton.style.position = 'absolute';
debugButton.style.top = '10px';
debugButton.style.right = '10px';
debugButton.style.zIndex = '1';
debugButton.onclick = function () {
  isDebugMode = !isDebugMode;
  debugButton.textContent = isDebugMode ? 'Debug Mode: ON' : 'Debug Mode: OFF';
  console.log('Debug mode:', isDebugMode ? 'ON' : 'OFF');
};
document.body.appendChild(debugButton);

// GeolocateControlを追加
const geolocate = new mapboxgl.GeolocateControl({
  positionOptions: {
    enableHighAccuracy: true
  },
  trackUserLocation: true,
  showUserHeading: true
});

map.addControl(geolocate);

// 地図が読み込まれた後の処理
map.on('load', function() {
  // GeolocateControlのトリガーイベントを監視
  geolocate.on('geolocate', function(e) {
    userLocation = [e.coords.longitude, e.coords.latitude];
    updateUserCircle(userLocation);
    fetchAndDisplayThreads();
  });

  // 現在位置を中心とした円のソースを追加
  map.addSource('user-circle', {
    type: 'geojson',
    data: createGeoJSONCircle([0, 0], 1)
  });

  // 円のレイヤーを追加
  map.addLayer({
    id: 'user-circle-layer',
    type: 'fill',
    source: 'user-circle',
    paint: {
      'fill-color': '#007cbf',
      'fill-opacity': 0.3
    }
  });

  // 初期位置を取得
  geolocate.trigger();

  // 右クリックイベントを追加
  map.on('contextmenu', function (e) {
    console.log('Right-click detected:', e.lngLat);
    e.preventDefault();
    if (!userLocation) return;

    const coordinates = e.lngLat;
    const distance = turf.distance(userLocation, [coordinates.lng, coordinates.lat], { units: 'kilometers' });

    if (isDebugMode || distance <= 1) {
      showThreadForm(e.point, coordinates);
    } else {
      alert('You can only create threads within a 1km radius of your current location.');
    }
  });
});

function updateUserCircle(center) {
  map.getSource('user-circle').setData(createGeoJSONCircle(center, 1));
}

function createGeoJSONCircle(center, radiusInKm, points = 64) {
  const coords = {
    latitude: center[1],
    longitude: center[0]
  };

  const km = radiusInKm;
  const ret = [];
  const distanceX = km / (111.320 * Math.cos(coords.latitude * Math.PI / 180));
  const distanceY = km / 110.574;

  let theta, x, y;
  for (let i = 0; i < points; i++) {
    theta = (i / points) * (2 * Math.PI);
    x = distanceX * Math.cos(theta);
    y = distanceY * Math.sin(theta);

    ret.push([coords.longitude + x, coords.latitude + y]);
  }
  ret.push(ret[0]);

  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [ret]
    }
  };
}


function fetchAndDisplayThreads() {
  fetch('/api/threads')
    .then(response => response.json())
    .then(threads => {
      threads.forEach(thread => {
        const distance = turf.distance(userLocation, [thread.coordinates.lng, thread.coordinates.lat], { units: 'kilometers' });
        if (isDebugMode || distance <= 1) {
          addThreadMarker(thread);
        }
      });
    });
}
// 地図が読み込まれた後にスレッドを取得して表示
map.on('load', function () {
  // GeolocateControlのトリガーイベントを監視
  geolocate.on('geolocate', function (e) {
    userLocation = [e.coords.longitude, e.coords.latitude];
    updateUserCircle(userLocation);
    fetchAndDisplayThreads();
  });

  // 現在位置を中心とした円のソースを追加
  map.addSource('user-circle', {
    type: 'geojson',
    data: createGeoJSONCircle([0, 0], 1)
  });

  // 円のレイヤーを追加
  map.addLayer({
    id: 'user-circle-layer',
    type: 'fill',
    source: 'user-circle',
    paint: {
      'fill-color': '#007cbf',
      'fill-opacity': 0.3
    }
  });

  // 初期位置を取得
  geolocate.trigger();

  map.on('contextmenu', function (e) {
    e.preventDefault(); // デフォルトのコンテキストメニューを防ぐ
    if (!userLocation) return;

    const coordinates = e.lngLat;
    const distance = turf.distance(userLocation, [coordinates.lng, coordinates.lat], { units: 'kilometers' });

    // デバッグモードがONの場合、または1km以内の場合にスレッド作成を許可
    if (isDebugMode || distance <= 1) {
      showThreadForm(e.point, coordinates);
    } else {
      alert('You can only create threads within a 1km radius of your current location.');
    }
  });
});

function updateUserCircle(location) {
  map.getSource('user-circle').setData(createGeoJSONCircle(location, 1));
}

function createGeoJSONCircle(center, radiusInKm, points = 64) {
  const coords = {
    latitude: center[1],
    longitude: center[0]
  };

  const km = radiusInKm;
  const ret = [];
  const distanceX = km / (111.320 * Math.cos(coords.latitude * Math.PI / 180));
  const distanceY = km / 110.574;

  let theta, x, y;
  for (let i = 0; i < points; i++) {
    theta = (i / points) * (2 * Math.PI);
    x = distanceX * Math.cos(theta);
    y = distanceY * Math.sin(theta);

    ret.push([coords.longitude + x, coords.latitude + y]);
  }
  ret.push(ret[0]);

  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [ret]
    }
  };
}

map.on('styleimagemissing', (e) => {
  const id = e.id;
  map.addImage(id, { width: 1, height: 1, data: new Uint8Array(4) });
});
function fetchAndDisplayThreads() {
  fetch('/api/threads')
    .then(response => response.json())
    .then(threads => {
      threads.forEach(thread => {
        const distance = turf.distance(userLocation, [thread.coordinates.lng, thread.coordinates.lat], { units: 'kilometers' });
        if (isDebugMode || distance <= 1) {
          addThreadMarker(thread);
        }
      });
    });
}

function addThreadMarker(thread) {
  const marker = new mapboxgl.Marker({
    element: createCustomMarkerElement(thread._id)
  })
    .setLngLat([thread.coordinates.lng, thread.coordinates.lat])
    .setPopup(new mapboxgl.Popup({ offset: 25 })
      .setHTML(`
        <h3>${thread.title}</h3>
        <p>${thread.content}</p>
        <div id="responses-${thread._id}"></div>
        <textarea id="response-text-${thread._id}" placeholder="Write a response..."></textarea>
        <button onclick="submitResponse('${thread._id}')">Submit</button>
        <button onclick="deleteThread('${thread._id}')">Delete</button>
      `))
    .addTo(map);

  // ポップアップが開かれたときにレスポンスを表示
  marker.getPopup().on('open', () => {
    const responsesDiv = document.getElementById(`responses-${thread._id}`);
    if (responsesDiv) {
      responsesDiv.innerHTML = ''; // 既存のレスポンスをクリア
      thread.responses.forEach(response => {
        const responseElement = document.createElement('div');
        responseElement.textContent = response.text;
        responsesDiv.appendChild(responseElement);
      });
    }
  });
}

function createCustomMarkerElement(threadId) {
  const el = document.createElement('div');
  el.className = 'custom-marker';
  el.style.backgroundImage = 'url(assets/images/custom-marker.png)';
  el.style.backgroundSize = 'contain';
  el.style.backgroundRepeat = 'no-repeat';
  el.style.width = '30px'; // 画像のサイズに合わせて調整
  el.style.height = '30px'; // 画像のサイズに合わせて調整
  el.dataset.threadId = threadId;
  return el;
}

// レスポンスを表示
thread.responses.forEach(response => {
  const responsesDiv = document.getElementById(`responses-${thread._id}`);
  const responseElement = document.createElement('div');
  responseElement.textContent = response.text;
  responsesDiv.appendChild(responseElement);
});


function showThreadForm(point, coordinates) {
  console.log('Showing thread form:', point, coordinates); // デバッグ用ログ
  // 既存のフォームがあれば削除
  const existingForm = document.getElementById('thread-form');
  if (existingForm) {
    existingForm.remove();
  }

  // スレッド作成フォームを表示
  const threadForm = document.createElement('form');
  threadForm.id = 'thread-form';
  threadForm.innerHTML = `
    <input type="text" id="thread-title" name="title" placeholder="Thread Title" required>
    <textarea id="thread-content" name="content" placeholder="Thread Content" required></textarea>
    <button type="submit">Create Thread</button>
  `;
  threadForm.style.position = 'absolute';
  threadForm.style.top = `${point.y}px`;
  threadForm.style.left = `${point.x}px`;
  threadForm.style.backgroundColor = 'white';
  threadForm.style.padding = '10px';
  threadForm.style.borderRadius = '5px';
  threadForm.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
  threadForm.style.zIndex = '1000'; // 他の要素の上に表示されるようにする

  threadForm.onsubmit = function (event) {
    event.preventDefault();
    const title = document.getElementById('thread-title').value;
    const content = document.getElementById('thread-content').value;
    createThread(title, content, coordinates);
    threadForm.remove();
  };

  document.body.appendChild(threadForm);

  // キャンセルボタンの機能を追加
  document.getElementById('cancel-thread').addEventListener('click', function () {
    threadForm.remove();
  });
}

function createThread(title, content, coordinates) {
  console.log('Creating thread:', { title, content, coordinates });
  fetch('/api/threads', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ title, content, coordinates })
  }).then(response => {
    console.log('Server response:', response);
    if (!response.ok) {
      return response.json().then(error => {
        throw new Error(error.error || 'Unknown error occurred');
      });
    }
    return response.json();
  }).then(data => {
    console.log('Thread created:', data);
    addThreadMarker(data);
  }).catch(error => {
    console.error('Error creating thread:', error.message);
    alert('Failed to create thread: ' + error.message);
  });
}

function submitResponse(threadId) {
  const responseText = document.getElementById(`response-text-${threadId}`).value;
  fetch(`/api/responses/${threadId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text: responseText })
  }).then(response => {
    if (!response.ok) {
      return response.json().then(error => {
        throw new Error(error.error || 'Unknown error occurred');
      });
    }
    return response.json();
  }).then(responseData => {
    console.log('Response created:', responseData);
    const responsesDiv = document.getElementById(`responses-${threadId}`);
    const responseElement = document.createElement('div');
    responseElement.textContent = responseData.text;
    responsesDiv.appendChild(responseElement);
    document.getElementById(`response-text-${threadId}`).value = '';
  }).catch(error => {
    console.error('Error creating response:', error.message);
  });
}

function deleteThread(threadId) {
  fetch(`/api/threads/${threadId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(response => {
    if (!response.ok) {
      return response.json().then(error => {
        throw new Error(error.error || 'Unknown error occurred');
      });
    }
    return response.json();
  }).then(data => {
    console.log('Thread deleted:', data);
    // スレッドを削除した後の処理（マーカーの削除など）
    const marker = document.querySelector(`[data-thread-id="${threadId}"]`);
    if (marker) {
      marker.remove();
    }
    // ポップアップを閉じる
    map.getCanvas().style.cursor = '';
    const popup = document.querySelector('.mapboxgl-popup');
    if (popup) {
      popup.remove();
    }
  }).catch(error => {
    console.error('Error deleting thread:', error.message);
    alert('Failed to delete thread: ' + error.message);
  });
}