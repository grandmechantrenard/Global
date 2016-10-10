var nameFontSize = 12;
var canv = document.getElementById('board');
var mapDiv = document.getElementById('map');
var ctx = canv.getContext('2d');
var currentZoom = 1;
var zoomLimits = [1, 10];
var countriesJSON = {};
var clickStatus = 0;
var moveStatus= 0;
var initPosition = [0, 0];
var offset = [0, 0];
var offsetInit = [0, 0];
var emptyColor = "lightblue";
var unselectedColor = "#F9F9F9";
var selectedColor = "#FFFF00";
var minNameSize = 20;

function getCountries(){
    //TODO HTTP request
    return { "countries":[
        {"id": 1, "color": "#00FF00", "name": "R1", "areas":[{"points": [[90, 90], [100, 90], [100, 100], [90, 100]]}]}, 
        {"id": 2, "color": "#FF0000", "name": "R2", "areas":[{"points": [[90, 100], [110, 100], [110, 120], [90, 120]]}]}, 
        {"id": 3, "color": "#0000FF", "name": "R3", "areas":[{"points": [[100, 85], [120, 85], [120, 100], [100, 100]]},
                                                            {"points": [[135, 90], [136, 90], [136, 91], [135, 91]]}]}, 
        {"id": 4, "color": "#00FFFF", "name": "R4", "areas":[{"points": [[110, 100], [130, 100], [130, 130], [110, 130]]}, 
                                                   {"points": [[117, 120], [123, 120], [123, 126], [117, 126]], "substract": 1}]}, 
        {"id": 5, "color": "#FF00FF", "name": "R5", "areas":[{"points": [[117, 120], [123, 120], [123, 126], [117, 126]]}]}
    ]};
}

function getCountry(country){
    //TODO HTTP request
    if (country){
        var id = country["id"];
        switch(id){
            case 1: return {"id": 1, "name":"R1", "receipes": 5, "areas":[]};
            case 2: return {"id": 2, "name":"R2", "receipes": 174, "areas":[{"name": "R21", "receipes": 54, "typicalReceipes": 28, "points": [[92, 102], [94, 102], [94, 105], [92, 105]]},
                                                                           {"name": "R22", "receipes": 32, "typicalReceipes": 15, "points": [[95, 106], [98, 106], [98, 108], [95, 108]]}]};
            case 3: return {"id": 3, "name":"R3", "receipes": 76, "areas":[{"name": "R31", "points": [[102, 92], [104, 92], [104, 95], [102, 95]]},
                                                                           {"name": "R32", "points": [[105, 96], [108, 96], [108, 98], [105, 98]]}]};
            case 4: return {"id": 4, "name":"R4", "receipes": 32, "areas":[]};
            case 5: return {"id": 5, "name":"R5", "receipes": 4, "areas":[]};
            default: return null;
        }
    }
    return null;
}

function updateLimit(limitJSON, point){                
    if (!limitJSON["minX"]){
        limitJSON["minX"] = point[0];
        limitJSON["minY"] = point[1];
        limitJSON["maxX"] = point[0];
        limitJSON["maxY"] = point[1];
    }else{
        if (limitJSON["minX"] > point[0]){
            limitJSON["minX"] = point[0];
        }
        if (limitJSON["maxX"] < point[0]){
            limitJSON["maxX"] = point[0];
        }
        if (limitJSON["minY"] > point[1]){
            limitJSON["minY"] = point[1];
        }
        if (limitJSON["maxY"] < point[1]){
            limitJSON["maxY"] = point[1];
        }
    }
}

function getLimits(){
    var limit = {};
    var countries = countriesJSON["countries"]
    for (var countryIndex=0; countryIndex < countries.length; countryIndex++){
        var country=countries[countryIndex];
        var areas=country["areas"];
        
        for (var areaIndex=0; areaIndex < areas.length; areaIndex++){
            var area=areas[areaIndex];
            var points = area["points"];
            
            for (var ptIndex=0; ptIndex < points.length; ptIndex++) {
                var point = points[ptIndex];                
                updateLimit(limit, point);
            }
        }
    }
    return limit;
}

function setCurrentZoom(){    
    var limit = getLimits();
    var countriesWidth = limit["maxX"] - limit["minX"];
    var canvasWidth=getCanvasSize(0);
    var canvasHeight=getCanvasSize(1);
    var zoomX=canvasWidth/countriesWidth;
    
    var countriesHeight = limit["maxY"] - limit["minY"];
    var zoomY=canvasHeight/countriesHeight;
    
    currentZoom = Math.min(zoomX, zoomY);
    
    zoomLimits[0] = currentZoom;
    zoomLimits[1] = currentZoom*2048;
    offsetInit = [(canvasWidth-(limit["maxX"]+limit["minX"]))/2, (canvasHeight-(limit["maxY"]+limit["minY"]))/2]
}

function zoom(factor, scope){
    var newZoom = currentZoom * factor;
    if (newZoom >= zoomLimits[0] && newZoom <= zoomLimits[1]){
        currentZoom = newZoom;
        offset[0]*=factor;
        offset[1]*=factor;
        draw(scope);
    }
}

function getCanvasSize(index){
    switch (index){
        case 0: return mapDiv.clientWidth;
        case 1: return mapDiv.clientHeight;
        default: return 0;
    }
}

function getPosition(tab, index){
    return offset[index] + (offsetInit[index] + tab[index])*currentZoom - getCanvasSize(index)*(currentZoom - 1)/2;
}

function isACountrySelected(scope){
    return scope.selectedCountry != undefined;
}

function isSelectedCountry(scope, countryId){
    return scope.selectedCountry != undefined && scope.selectedCountry["id"]==countryId;
}

function drawShape(area, ctx){
    var points = area["points"];
    var gravity = [0, 0];
    var curLimit = {}
    
    for (var ptIndex=0; ptIndex < points.length; ptIndex++) {
        var point = points[ptIndex];
        var x = getPosition(point, 0);
        var y = getPosition(point, 1);
                   
        updateLimit(curLimit, [x, y]);
        
        if (ptIndex == 0){
            ctx.moveTo(x, y);
        }else{
            ctx.lineTo(x, y);
        }
        
        if (area["substract"] != 1){
            gravity[0] += x;
            gravity[1] += y;
        }
    }

    ctx.closePath();
    var nbPoints = points.length;
    gravity[0] /= nbPoints;
    gravity[1] /= nbPoints;
    
    return {"limit": curLimit, "gravity": gravity};
}

function writeName(area, gravity, limit, name){
    if (((limit["maxX"]-limit["minX"]) >= minNameSize) && ((limit["maxY"]-limit["minY"]) >= minNameSize)){
        ctx.font = nameFontSize + 'px Arial';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = "black";
        ctx.textAlign = 'center';
        ctx.fillText(name, gravity[0], gravity[1]);
    }
}

function draw(scope) {
    ctx.clearRect(0, 0, getCanvasSize(0), getCanvasSize(1));
    ctx.lineWidth = 2;
    var countries = countriesJSON["countries"]
    for (var countryIndex=0; countryIndex < countries.length; countryIndex++){
        var country=countries[countryIndex];
        var areas=country["areas"];
        
        for (var areaIndex=0; areaIndex < areas.length; areaIndex++){
            var area=areas[areaIndex];
            ctx.beginPath();
            var drawingResult=drawShape(area, ctx);
            
            var gravity = drawingResult["gravity"];
            var curLimit = drawingResult["limit"];
            
            var color;              
            //Selected country
            if (isACountrySelected(scope)){
                if (isSelectedCountry(scope, country["id"]) && !scope.selectedArea){
                    color = selectedColor;
                }else{
                    color = unselectedColor;
                }
            }else{
                if (area["substract"] == 1){
                    color = emptyColor;
                }else{              
                    color = country["color"];
                }
            }
            ctx.fillStyle=color;
            ctx.fill();
            ctx.stroke();

            if (isSelectedCountry(scope, country["id"])){
                var subAreas=scope.selectedCountry["areas"];
                for (var subAreaIndex=0; subAreaIndex<subAreas.length; subAreaIndex++){
                    ctx.beginPath();
                    var subArea = subAreas[subAreaIndex];
                    var subAreaDrawingResult = drawShape(subArea, ctx);
                    if (scope.selectedArea && scope.selectedArea["name"] == subArea["name"]){
                        ctx.fillStyle=selectedColor;
                        ctx.fill();
                    }
                    writeName(subArea, subAreaDrawingResult["gravity"], subAreaDrawingResult["limit"], subArea["name"]);
                    ctx.stroke();
                }
            }else if (area["substract"] != 1){
                writeName(area, gravity, curLimit, country["name"]);
            }
        }
    }
}

function move(event, scope){
    offset[0] += (event.offsetX - initPosition[0]);
    initPosition[0] = event.offsetX;
    offset[1] += (event.offsetY - initPosition[1]);
    initPosition[1] = event.offsetY;
    draw(scope);
}

function pointBelongsTo(point, points){
    //TODO
    if (point[0] >= getPosition(points[0], 0) && point[0] <= getPosition(points[2], 0)){
        if (point[1] >= getPosition(points[0], 1) && point[1] <= getPosition(points[2], 1)){
            return true;
        }        
    }
    return 0;
}

function getAreaPointBelongsTo(country, point){
    if (country == undefined){
        return null;
    }
    
    var areas=country["areas"];
    for (var areaIndex=0; areaIndex < areas.length; areaIndex++){
        var area=areas[areaIndex];
        var points = area["points"];
        var belongs = pointBelongsTo(point, points);
        
        if (belongs == 1){
            return area;
        }
    }
    return null;
}

function getCountryPointBelongsTo(point){
    var countries=countriesJSON["countries"];
    for (var countryIndex=0; countryIndex<countries.length; countryIndex++){
        var country = countries[countryIndex];
        
        var areas=country["areas"];
        var into = 0;
        for (var areaIndex=0; areaIndex < areas.length; areaIndex++){
            var area=areas[areaIndex];
            var points = area["points"];
            var belongs = pointBelongsTo(point, points);
            
            if (belongs == 1){
                if (area["substract"] == 1){
                    into = 0;
                    break;
                }else{
                    into = 1;
                }
            }
        }
        
        if (into == 1){
            return country;
        }
    }
    return null;
}

function display(scope, point){
    if (isACountrySelected(scope)){
        var hoveredArea = getAreaPointBelongsTo(scope.selectedCountry, point);
        scope.hoveredArea = hoveredArea;
    }else{
        var hoveredCountry = getCountryPointBelongsTo(point);
        scope.hoveredCountry = hoveredCountry;
    }
}

function select(scope, point){
    var area = getAreaPointBelongsTo(scope.selectedCountry, point);
    if (area){
        scope.selectedArea = area;
    }else{
        var country = getCountry(getCountryPointBelongsTo(point));
        if (country && isSelectedCountry(scope, country["id"]) && !scope.selectedArea){
            country=null;
        }
        scope.selectedArea = null;
        scope.selectedCountry = country;
    }
    draw(scope);
}

var app = angular.module("myApp",[]);
app.controller("worldMapController", ['$scope', '$window', function($scope, $window) {
    canv.width = $window.innerWidth;
    canv.height = $window.innerHeight;
    countriesJSON = getCountries();
    setCurrentZoom();
    draw($scope);
    
    $scope.zoomIn = function() {
        zoom(2, $scope);
    }
    $scope.zoomOut = function() {
        zoom(0.5, $scope);
    }
    $scope.move = function(event){
        if (clickStatus){
            moveStatus = 1;
            move(event, $scope);
        }else{
            display($scope, [event.offsetX, event.offsetY]);
        }
    }
    $scope.mousedown = function(event){
        initPosition = [event.offsetX, event.offsetY];
        clickStatus = 1;
    }
    $scope.mouseup = function(event){
        clickStatus = 0;
        if (moveStatus == 0){
            select($scope, [event.offsetX, event.offsetY]);
        }else{
            moveStatus = 0;
        }
    }
    $scope.setSelectedArea = function(area){
        $scope.selectedArea=area;
        draw($scope);
    }
    $scope.focusLost = function(){
        clickStatus = 0;
    }
}]);
