//Map function

(function() {
    var app = angular.module('myApp', ['onsen']);

    //Sliding menu controller, swiping management
    app.controller('SlidingMenuController', function($scope){

        $scope.checkSlidingMenuStatus = function(){

            $scope.slidingMenu.on('postclose', function(){
                $scope.slidingMenu.setSwipeable(false);
            });
            $scope.slidingMenu.on('postopen', function(){
                $scope.slidingMenu.setSwipeable(true);
            });
        };

        $scope.checkSlidingMenuStatus();
    });

    //Map controller
    app.controller('MapController', function($scope, $timeout){

        $scope.map;
        $scope.infowindow;
        $scope.markerpos;
        $scope.directionDisplay;
        $scope.directionService;
        $scope.X = navigator.geolocation;
        $scope.closestMPos;
        $scope.closestPark;

        //Map initialization
        $timeout(function(){
            //Retrives the location from the browser
            $scope.X.getCurrentPosition($scope.success, $scope.failure);

        },100);

        $scope.success = function(position){
            $scope.directionDisplay = new google.maps.DirectionsRenderer;
            $scope.directionService = new google.maps.DirectionsService;

            //Get user's longitude and latitude
            var myLat = position.coords.latitude;
            var myLong = position.coords.longitude;

            //Creating new object for using the latitude and longitude values with Google Maps
            $scope.coords = new google.maps.LatLng(myLat,myLong);

            var mapOptions = {
                zoom: 13,
                streetViewControl: false,
                center: $scope.coords
            }

            $scope.map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);
            $scope.infowindow = new google.maps.InfoWindow();
            $scope.directionDisplay.setMap($scope.map);
            $scope.directionDisplay.setOptions({
                //Disable the default marker by directionDisplay
                suppressMarkers: true
            });
            $scope.addNearbyPlaces($scope.coords);

            //Marker for the user's current location
            var myPos = new google.maps.Marker({
                map: $scope.map,
                position: $scope.coords,
                animation: google.maps.Animation.BOUNCE,
            });
        }

        $scope.failure = function(){
            alert("Geolocation is not supported by the browser.");
        }

        $scope.addNearbyPlaces = function(coords){
            var service = new google.maps.places.PlacesService($scope.map);
            var request = {
                location: coords,
                types: ['park'],
                rankBy: google.maps.places.RankBy.DISTANCE
            }
            service.nearbySearch(request, $scope.callback);
        };

        $scope.callback = function(results, status){
            if(status === google.maps.places.PlacesServiceStatus.OK){
                for(var i = 0; i < results.length;  i++){
                    $scope.createMarker(results[i]);
                }
                var mlat = results[0].geometry.location.lat();
                var mlng = results[0].geometry.location.lng();

                $scope.closestMPos = {lat: mlat, lng: mlng};
                
                localStorage.setItem('closestPark', results[0].name);
            }

        };

        $scope.createMarker = function(place){
                var marker = new google.maps.Marker({
                map: $scope.map,
                position: place.geometry.location
            });
            google.maps.event.addListener(marker, 'click', function(event){
                var latitude = this.position.lat();
                var longitude = this.position.lng();
                $scope.markerPos = {
                    lat: latitude,
                    lng: longitude
                };
                $scope.calculateAndDisplayRoute($scope.directionService,$scope.directionDisplay, $scope.coords, $scope.markerPos);
                $scope.infowindow.setContent(place.name);
                $scope.infowindow.open($scope.map, this);
            })
        }

        $scope.calculateAndDisplayRoute = function(directionService, directionDisplay, coords, markerPos){
            directionService.route({
                origin: coords,
                destination: markerPos,
                travelMode: google.maps.TravelMode.WALKING
            }, function(response, status){
                if (status === 'OK') {
                    directionDisplay.setDirections(response);
                } else {
                    window.alert('Directions requst failed due to' + status);
                }
            });
        }

        $scope.showClosestRoute = function(){
            $scope.calculateAndDisplayRoute($scope.directionService, $scope.directionDisplay, $scope.coords, $scope.closestMPos);
        };


    });
})();
