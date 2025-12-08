const MapSimulator = (function() {
  'use strict';

  let stations = [];
  let selectedStation = null;

  function init() {
    loadStationsData();
    bindEvents();
  }

  function loadStationsData() {
    fetch('data/stations.json')
      .then(function(response) {
        return response.json();
      })
      .then(function(data) {
        stations = data.stations || [];
        renderStationList();
        renderSVGMap();
        showAlerts(data.alerts || []);
      })
      .catch(function(error) {
        console.error('Failed to load stations data:', error);
        stations = getDefaultStations();
        renderStationList();
        renderSVGMap();
      });
  }

  function getDefaultStations() {
    return [
      { id: 1, name: 'Dahisar East', code: 'DHE', facilities: ['Parking'], schedule: { firstTrain: '05:30', lastTrain: '23:30', frequency: '6 minutes' } },
      { id: 2, name: 'Mira Bhayandar', code: 'MBR', facilities: ['Parking', 'Food Court'], schedule: { firstTrain: '05:36', lastTrain: '23:36', frequency: '6 minutes' } }
    ];
  }

  function bindEvents() {
    document.addEventListener('click', function(e) {
      const stationItem = e.target.closest('.station-item');
      if (stationItem) {
        const stationId = parseInt(stationItem.dataset.id);
        selectStation(stationId);
      }

      const mapStation = e.target.closest('.map-station');
      if (mapStation) {
        const stationId = parseInt(mapStation.dataset.id);
        selectStation(stationId);
      }
    });
  }

  function renderStationList() {
    const container = document.querySelector('.station-list');
    if (!container) return;

    let html = '';
    stations.forEach(function(station) {
      html += 
        '<div class="station-item" data-id="' + station.id + '" tabindex="0" role="button" aria-label="View details for ' + station.name + ' station">' +
          '<h4>' + station.name + '</h4>' +
          '<p>' + station.code + ' • ' + station.schedule.frequency + ' frequency</p>' +
        '</div>';
    });

    container.innerHTML = html;
  }

  function renderSVGMap() {
    const container = document.querySelector('.map-fallback');
    if (!container) return;

    const svgWidth = 800;
    const svgHeight = 200;
    const padding = 60;
    const stationSpacing = (svgWidth - padding * 2) / (stations.length - 1);

    let svg = '<svg class="metro-line-svg" viewBox="0 0 ' + svgWidth + ' ' + svgHeight + '" role="img" aria-label="Metro line map showing all stations">';
    
    svg += '<line x1="' + padding + '" y1="' + (svgHeight / 2) + '" x2="' + (svgWidth - padding) + '" y2="' + (svgHeight / 2) + '" stroke="var(--primary-color)" stroke-width="8" stroke-linecap="round"/>';

    stations.forEach(function(station, index) {
      const x = padding + (index * stationSpacing);
      const y = svgHeight / 2;
      const isSelected = selectedStation && selectedStation.id === station.id;

      svg += '<g class="map-station" data-id="' + station.id + '" style="cursor: pointer;" role="button" tabindex="0" aria-label="' + station.name + ' station">';
      
      svg += '<circle cx="' + x + '" cy="' + y + '" r="' + (isSelected ? 18 : 14) + '" fill="var(--bg-card)" stroke="var(--primary-color)" stroke-width="4"/>';
      
      if (isSelected) {
        svg += '<circle cx="' + x + '" cy="' + y + '" r="8" fill="var(--accent-color)"/>';
      }

      const textY = index % 2 === 0 ? y - 35 : y + 50;
      svg += '<text x="' + x + '" y="' + textY + '" text-anchor="middle" fill="var(--text-primary)" font-size="12" font-weight="600">' + station.name + '</text>';
      svg += '<text x="' + x + '" y="' + (textY + 15) + '" text-anchor="middle" fill="var(--text-muted)" font-size="10">' + station.code + '</text>';

      svg += '</g>';
    });

    svg += '</svg>';
    svg += '<p style="margin-top: 1rem; color: var(--text-muted);">Click on a station to view details</p>';

    container.innerHTML = svg;
  }

  function selectStation(stationId) {
    const station = stations.find(function(s) { return s.id === stationId; });
    if (!station) return;

    selectedStation = station;

    document.querySelectorAll('.station-item').forEach(function(item) {
      item.classList.remove('active');
      if (parseInt(item.dataset.id) === stationId) {
        item.classList.add('active');
      }
    });

    renderSVGMap();
    showStationDetails(station);
  }

  function showStationDetails(station) {
    const container = document.querySelector('.station-details');
    if (!container) return;

    let facilitiesHtml = '';
    if (station.facilities && station.facilities.length > 0) {
      station.facilities.forEach(function(facility) {
        facilitiesHtml += '<span class="facility-tag">' + facility + '</span>';
      });
    }

    let connectionsHtml = 'None';
    if (station.connections && station.connections.length > 0) {
      connectionsHtml = station.connections.join(', ');
    }

    const html = 
      '<h3>' + station.name + ' Station</h3>' +
      '<div class="station-info-grid">' +
        '<div class="station-info-item">' +
          '<h5>Station Code</h5>' +
          '<p>' + station.code + '</p>' +
        '</div>' +
        '<div class="station-info-item">' +
          '<h5>First Train</h5>' +
          '<p>' + station.schedule.firstTrain + '</p>' +
        '</div>' +
        '<div class="station-info-item">' +
          '<h5>Last Train</h5>' +
          '<p>' + station.schedule.lastTrain + '</p>' +
        '</div>' +
        '<div class="station-info-item">' +
          '<h5>Frequency</h5>' +
          '<p>' + station.schedule.frequency + '</p>' +
        '</div>' +
        '<div class="station-info-item">' +
          '<h5>Connections</h5>' +
          '<p>' + connectionsHtml + '</p>' +
        '</div>' +
      '</div>' +
      '<div class="facilities-list">' +
        '<h5 style="width: 100%; margin-bottom: 0.5rem; font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted);">Facilities</h5>' +
        facilitiesHtml +
      '</div>';

    container.innerHTML = html;
    container.classList.add('active');
  }

  function showAlerts(alerts) {
    const container = document.querySelector('.transit-alerts');
    if (!container) return;

    const activeAlerts = alerts.filter(function(a) { return a.active; });
    
    if (activeAlerts.length === 0) return;

    let html = '';
    activeAlerts.forEach(function(alert) {
      const alertClass = alert.type === 'info' ? 'alert-info' : 
                         alert.type === 'warning' ? 'alert-warning' : 'alert-error';
      const icon = alert.type === 'info' ? 'info-circle' : 
                   alert.type === 'warning' ? 'exclamation-triangle' : 'times-circle';
      
      html += 
        '<div class="alert ' + alertClass + '">' +
          '<i class="fas fa-' + icon + '"></i>' +
          '<span>' + alert.message + '</span>' +
        '</div>';
    });

    container.innerHTML = html;
  }

  function getStations() {
    return stations;
  }

  function getSelectedStation() {
    return selectedStation;
  }

  return {
    init: init,
    getStations: getStations,
    getSelected: getSelectedStation,
    select: selectStation
  };
})();

document.addEventListener('DOMContentLoaded', function() {
  if (document.querySelector('.map-container')) {
    MapSimulator.init();
  }
});
