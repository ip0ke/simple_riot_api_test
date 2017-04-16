// public/core.js
var summonerData = angular.module('summonerData', []);

function mainController($scope, $http) {
    $scope.formData = {};

    // when landing on the page, get all summoners and show them
    /*$http.get('/api/summoners')
        .success(function(data) {
            $scope.summoners = data;
            console.log(data);
        })
        .error(function(data) {
            console.log('Error: ' + data);
        });
*/
     // when submitting the add form, send the text to the node API
    $scope.searchSummonerByName = function() {
        //console.log($scope.formData);
        $http.get('/api/summoner/'+$scope.formData.text, $scope.formData)
            .success(function(data) {
                $scope.formData = {}; // clear the form so our user is ready to enter another
                $scope.summoners = data;
                console.log(data);
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
    };

}