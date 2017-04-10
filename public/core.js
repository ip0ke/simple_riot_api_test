// public/core.js
var summonerData = angular.module('summonerData', []);

function mainController($scope, $http) {
    $scope.formData = {};

    // when landing on the page, get all todos and show them
    $http.get('/api/summoners')
        .success(function(data) {
            $scope.summoners = data;
            console.log(data);
        })
        .error(function(data) {
            console.log('Error: ' + data);
        });

    // get matches for summoner id
    $scope.getMatches = function(id) {
        $http.get('/api/summoner/' + id + '/matches')
            .success(function(data) {
                $scope.summoners = data;
                console.log(data);
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
    };

}