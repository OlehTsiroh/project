var map;
var Route = Backbone.Model.extend({});
var RouteView = Backbone.View.extend({
  el: $('#controllPanel'),
  events: {
    'click .search': 'render',
    'click #ok': 'getWay',
  },
  template: _.template('<div style="position: relative; left: 10px; background-color: red; height: auto; clear: both">' +
                          '<p class="notMP">Find Your way</p>' +
                          '<div>' +
                            '<label>from' +
                              '<input type="text" id="from" name="from" />' +
                            '</label>' +
                            '<input type="button" value="here" id="here" name="here" />' +
                          '</div>' +
                          '<div>' +
                            '<input type="button" value="change" id="change" name="change" />' +
                          '</div>' +
                          '<div>' +
                            '<label>to' +
                              '<input type="text" id="to" name="to" />' +
                            '</label>' +
                            '<input type="button" value="ok" id="ok" name="ok" />' +
                          '</div>' +
                        '</div>'),
  busStopArray: [],
  initialize: function() {
    var that = this;
    google.maps.event.addDomListener(window, 'load', this.mapInitialize);
    $.ajax({
      type: "GET",
      dataType: 'json',
      url: 'http://localhost:8080/api/routes',
      success: function(response) {
        that.setBusStopArray(response);
      },
      error: function(err) {
        console.log('request error');
      }
    });
  },
  render: function() {
    this.$el.append(this.template);
  },
  mapInitialize: function() {
    var myLatlng = {
        lat: 49.87141,
        lng: 24.058568
      },
      mapOptions = {
        center: myLatlng,
        zoom: 10
      };
    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
  },
  setBusStopArray: function(arrayOfCoordinates) {
    var busStopArray = [];
    arrayOfCoordinates.forEach(function(el1) {
      el1.routeArray.forEach(function(el2) {
        if (el2.busStop) {
          for (var i = 0, len = busStopArray.length; i < len; i++) {
            var el3 = busStopArray[i];
            if (el2.busStop == el3.busStop && el2.lat == el3.lat && el2.lng == el3.lng) {
              if (busStopArray[i].route.indexOf(el1.name) == -1) {
                busStopArray[i].route.push(el1.name);
              }
              break;
            } else if (i == len - 1) {
              busStopArray.push(el2);
              busStopArray[i + 1].route = [el1.name];
            }
          }
          if (!len) {
            busStopArray.push(el2);
            busStopArray[0].route = [el1.name];
          };
        }
      })
    });
    this.busStopArray = busStopArray;
  },
  getNearestBusStop: function(position, radius) {
    console.log('clicked');
    var that = this,
      nearlestBusStop,
      busStopInRadius = [],
      markers = [],
      _radius = 0,
      marker = new google.maps.Marker({
        position: position,
        map: map
      }),
      circleOptions = {
        map: map,
        center: position,
        radius: _radius,
        visible: false
      },
      circle = new google.maps.Circle(circleOptions);
    that.busStopArray.forEach(function(el) {
      markers.push(new google.maps.Marker({
        position: el,
        map: map,
        visible: false
      }));
    });
    //circle.setVisible(false);
    while (!nearlestBusStop) {
      markers.forEach(function(el, i) {
        if (circle.getBounds().contains(el.getPosition())) {
          nearlestBusStop = that.busStopArray[i];
        }
      });
      _radius += 5;
      circle.setRadius(_radius);
    };
    circle.setRadius(radius);
    circle.setCenter(nearlestBusStop);
    markers.forEach(function(el, i) {
      if (circle.getBounds().contains(el.getPosition())) {
        busStopInRadius.push(that.busStopArray[i]);
      };
      el.setMap(null);
      markers = [];
    });
    marker = new google.maps.Marker({
      position: nearlestBusStop,
      map: map
    });
    return busStopInRadius;
  },
  getWay: function() {
    var amount = 0,
      dotArray = [],
      that = this;
    var listener = google.maps.event.addListener(map, 'dblclick', function(e) {
      amount++;
      console.log(e.latLng);
      dotArray.push(e.latLng);
      map.setOptions({
        disableDoubleClickZoom: true
      });
      if (amount == 2) {
        google.maps.event.removeListener(listener);
        var firstBusStops = that.getNearestBusStop(dotArray[0], 150);
        var secondBusStops = that.getNearestBusStop(dotArray[1], 150);
        console.log(firstBusStops);
        console.log(secondBusStops);
        var buses = [],
          busesNotCross = [];
        firstBusStops.forEach(function(el1) {
          secondBusStops.forEach(function(el2) {
            el2.route.forEach(function(el3) {
              if (el1.route.indexOf(el3) != -1) {
                if (buses.indexOf(el3) == -1) {
                  buses.push(el3);
                }
              } else if (busesNotCross.indexOf(el3) == -1) {
                busesNotCross.push(el3);
              }
            })
          })
        });
        /*if (!buses.length) {
          buses = busesNotCross;
        };*/
        map.setOptions({
          disableDoubleClickZoom: false
        });
        console.log(buses);
      }
    });
  }
});
routeView = new RouteView();