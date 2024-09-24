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
debugButton.onclick = function() {
  isDebugMode = !isDebugMode;
  debugButton.textContent = isDebugMode ? 'Debug Mode: ON' : 'Debug Mode: OFF';
};
document.body.appendChild(debugButton);

// 地図が読み込まれた後にスレッドを取得して表示
map.on('load', function() {
  navigator.geolocation.getCurrentPosition(function(position) {
    userLocation = [position.coords.longitude, position.coords.latitude];

    // ユーザーの現在位置に円を描画
    const radius = 1000; // 1km
    const userCircle = turf.circle(userLocation, radius / 1000, { units: 'kilometers' });
    map.addSource('user-circle', {
      type: 'geojson',
      data: userCircle
    });

    map.addLayer({
      id: 'user-circle-layer',
      type: 'fill',
      source: 'user-circle',
      paint: {
        'fill-color': '#007cbf',
        'fill-opacity': 0.3
      }
    });

    map.setCenter(userLocation);

    fetchAndDisplayThreads();
  });
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
  const marker = new mapboxgl.Marker()
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
}

map.on('contextmenu', function (e) {
  if (!userLocation) return;

  const coordinates = e.lngLat;
  const distance = turf.distance(userLocation, [coordinates.lng, coordinates.lat], { units: 'kilometers' });

  // デバッグモードがOFFの場合のみ、半径1kmの範囲外では新規スレッドの作成を禁止
  if (!isDebugMode && distance > 1) {
    alert('You can only create threads within a 1km radius of your current location.');
    return;
  }

  // スレッド作成フォームを表示
  const threadForm = document.createElement('form');
  threadForm.innerHTML = `
    <input type="text" id="thread-title" name="title" placeholder="Thread Title" required>
    <textarea id="thread-content" name="content" placeholder="Thread Content" required></textarea>
    <button type="submit">Create Thread</button>
  `;
  threadForm.style.position = 'absolute';
  threadForm.style.top = `${e.point.y}px`;
  threadForm.style.left = `${e.point.x}px`;
  threadForm.onsubmit = function(event) {
    event.preventDefault();
    const title = document.getElementById('thread-title').value;
    const content = document.getElementById('thread-content').value;
    fetch('/api/threads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title, content, coordinates: { lng: coordinates.lng, lat: coordinates.lat } })
    }).then(response => {
      if (!response.ok) {
        return response.json().then(error => {
          throw new Error(error.error || 'Unknown error occurred');
        });
      }
      return response.json();
    }).then(data => {
      console.log('Thread created:', data);
      addThreadMarker(data);
      document.body.removeChild(threadForm);
    }).catch(error => {
      console.error('Error creating thread:', error.message);
    });
  };
  document.body.appendChild(threadForm);
});

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
  }).catch(error => {
    console.error('Error deleting thread:', error.message);
  });
}