app.controller('worldMapController', function($scope, $window, canvasService, httpService) {  
    var nameFontSize = 12;
    var mapDiv = document.getElementById('map');
    var canv = document.getElementById('board');
    var ctx = canv.getContext('2d');
    var currentZoom = 1;
    var zoomLimits = [1, 10];
    var clickStatus = 0;
    var moveStatus= 0;
    var initPosition = [0, 0];
    var offset = [0, 0];
    var offsetInit = [0, 0];
    var emptyColor = "lightblue";
    var unselectedColor = "#F9F9F9";
    var selectedColor = "#FFFF00";
    var minNameSize = 20;
    var newArea = {"points": []};
    var crossSize=4;
    
    canv.width = $window.innerWidth;
    canv.height = $window.innerHeight;
    $scope.addingRegion = false;
    $scope.countriesJSON = httpService.getCountries();
    setCurrentZoom();
    draw();
    
    $scope.zoomIn = function() {
        zoom(2);
    }
    $scope.zoomOut = function() {
        zoom(0.5);
    }
    $scope.move = function(event){
        if (clickStatus){
            moveStatus = 1;
            move(event);
        }else{
            display([event.offsetX, event.offsetY]);
        }
    }
    $scope.mousedown = function(event){
        initPosition = [event.offsetX, event.offsetY];
        clickStatus = 1;
    }
    $scope.mouseup = function(event){
        clickStatus = 0;
        if (moveStatus == 0){
            var clickedPoint=[event.offsetX, event.offsetY];
            if ($scope.addingRegion){
                newArea["points"][newArea["points"].length]=getRelativePoint(clickedPoint);
                draw();
            }else{
                select(clickedPoint);
            }
        }else{
            moveStatus = 0;
        }
    }
    $scope.setSelectedArea = function(area){
        selectArea(area);
        draw();
    }
    $scope.focusLost = function(){
        clickStatus = 0;
    }
    $scope.startAddingRegion = function(){
        $scope.addingRegion = true;
        draw();
    }
    $scope.stopAddingRegion = function(validate){
        $scope.addingRegion = false;
        if (validate){
            var countries = getCountriesNewAreaBelongsTo();
            httpService.addNewArea(newArea, countries);
            if ($scope.selectedCountry){
                //TODO ask user area name
                newArea["name"]="newName";
                $scope.selectedCountry=httpService.getCountry($scope.selectedCountry);
            }
        }
        newArea["points"]=[];
        draw();
    }
    $scope.removeLastNewRegionPoint = function(){
        newArea["points"].pop();
        draw();
    }

    /**
     * Get all the countries an area belongs to
     */
    function getCountriesNewAreaBelongsTo(){
        var possibleCountries;
        if (isACountrySelected()){
            possibleCountries=[$scope.selectedCountry];
        }else{
            possibleCountries=$scope.countriesJSON["countries"]
        }
        var countries = []
        for (var countryIndex=0;countryIndex<possibleCountries.length;countryIndex++){
            var possibleCountry=possibleCountries[countryIndex];
            var contains=false;
            for (var pointIndex=0; pointIndex<newArea["points"].length; pointIndex++){
                var point = newArea["points"][pointIndex];
                if (countryContainsPoint(point, possibleCountry)){
                    countries[countries.length]=possibleCountry;
                    contains=true;
                    break;
                }
            }
            if (!contains && canvasService.pointBelongsTo(possibleCountry["areas"][0]["points"][0], newArea["points"])){
                countries[countries.length]=possibleCountry;
            }
        }
        return countries;
    }
    /**
     * Get x and y min and max values of all countries
     */
    function getLimits(){
        var limit = {};
        var countries = $scope.countriesJSON["countries"]
        for (var countryIndex=0; countryIndex < countries.length; countryIndex++){
            var country=countries[countryIndex];
            var areas=country["areas"];
            
            for (var areaIndex=0; areaIndex < areas.length; areaIndex++){
                var area=areas[areaIndex];
                var points = area["points"];
                
                for (var ptIndex=0; ptIndex < points.length; ptIndex++) {
                    var point = points[ptIndex];                
                    canvasService.updateLimit(limit, point);
                }
            }
        }
        return limit;
    }

    /**
     * Compute zoom so that all countries are exactly displayed in the canvas
     */
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

    /**
     * Zooms in if factor > 1 and zooms out if < 1
     * @param factor zoom factor
     */
    function zoom(factor){
        var newZoom = currentZoom * factor;
        if (newZoom >= zoomLimits[0] && newZoom <= zoomLimits[1]){
            currentZoom = newZoom;
            offset[0]*=factor;
            offset[1]*=factor;
            draw();
        }
    }

    /**
     * Get the width or height of canvas element according to param
     * @param index if 0, get width if 1 get height
     * @return the required dimension of the canvas
     */
    function getCanvasSize(index){
        switch (index){
            case 0: return mapDiv.clientWidth;
            case 1: return mapDiv.clientHeight;
            default: return 0;
        }
    }

    /**
     * Get position in pixels from zoom, movements and relative position of a point
     * @param tab the point
     * @param index 0 or 1 for x and y
     * @return the relative coordinate
     */
    function getPositionInPixels(tab, index){
        return offset[index] + (offsetInit[index] + tab[index])*currentZoom - getCanvasSize(index)*(currentZoom - 1)/2;
    }

    /**
     * Get relative position of a point from the position in pixels
     * @param tab the point
     * @param index 0 or 1 for x and y
     * @return the coordinate in pixels
     */
    function getRelativePosition(tab, index){
        return (tab[index] - offset[index] + getCanvasSize(index)*(currentZoom - 1)/2)/currentZoom - offsetInit[index];
    }

    /**
     * States whether a country is currently selected
     * @return true if a country is selected, false otherwise
     */
    function isACountrySelected(){
        return $scope.selectedCountry != undefined;
    }

    /**
     * States whether the given country is selected
     * @param the country whose selection is checked
     * @return true if the country is selected, false otherwise
     */
    function isSelectedCountry(country){
        return isACountrySelected() && country != undefined && $scope.selectedCountry["id"]==country["id"];
    }

    /**
     * States whether an area is currently selected
     * @return true if an area is selected, false otherwise
     */
    function isAnAreaSelected(){
        return $scope.selectedArea != undefined;
    }

    /**
     * States whether the given area is selected
     * @param the area whose selection is checked
     * @return true if the area is selected, false otherwise
     */
    function isSelectedArea(area){
        return isAnAreaSelected() && area != undefined && $scope.selectedArea["id"]==area["id"];
    }

    /**
     * Draw the given shape in the canvas
     * @param area the list of points to draw
     * @return a JSON object containing: the min and max values for x and y for the list of points; the gravity center coordinates
     */
    function drawShape(area, keepPathOpen){
        ctx.beginPath();
        ctx.lineWidth = 2;
        var points = area["points"];
        var gravity = [0, 0];
        var curLimit = {}
        
        for (var ptIndex=0; ptIndex < points.length; ptIndex++) {
            var point = points[ptIndex];
            var x = getPositionInPixels(point, 0);
            var y = getPositionInPixels(point, 1);
                       
            canvasService.updateLimit(curLimit, [x, y]);
            
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

        if (!keepPathOpen){
            ctx.closePath();
        }
        var nbPoints = points.length;
        gravity[0] /= nbPoints;
        gravity[1] /= nbPoints;
        ctx.stroke();
        
        return {"limit": curLimit, "gravity": gravity};
    }

    /**
     * Write the given text on canvas centered on a given point. If limits are done, given limits must be at least minNameSize wide
     * @param text the text to write
     * @param point the point on which test is centered
     * @param limit the limits of the text
     */
    function writeName(text, point, limit){
        if (!limit || (((limit["maxX"]-limit["minX"]) >= minNameSize) && ((limit["maxY"]-limit["minY"]) >= minNameSize))){
            ctx.font = nameFontSize + 'px Arial';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = "black";
            ctx.textAlign = 'center';
            ctx.fillText(text, point[0], point[1]);
        }
    }
    
    /**
     * Get the color of an area, according to the current country/area selection.
     */
    function getAreaColor(country, area){
        var color;
        if (isACountrySelected()){              
            //Country is selected
            if (isSelectedCountry(country) && (!isAnAreaSelected() || $scope.addingRegion)){
                color = selectedColor;
            }else{
                color = unselectedColor;
            }
        }else{
            //Country is not selected
            if ($scope.addingRegion){
                //The user is drawing a new region
                color = unselectedColor;
            }else{
                if (area["substract"] == 1){
                    color = emptyColor;
                }else{              
                    color = country["color"];
                }
            }
        }
        return color;
    }

    /**
     * Draw the countries and areas on the canvas
     */
    function draw() {
        ctx.clearRect(0, 0, getCanvasSize(0), getCanvasSize(1));
        var countries = $scope.countriesJSON["countries"]
        for (var countryIndex=0; countryIndex < countries.length; countryIndex++){
            var country=countries[countryIndex];
            var areas=country["areas"];
            
            for (var areaIndex=0; areaIndex < areas.length; areaIndex++){
                var area=areas[areaIndex];
                var drawingResult=drawShape(area);
                
                var gravity = drawingResult["gravity"];
                var curLimit = drawingResult["limit"];
                
                ctx.fillStyle=getAreaColor(country, area);
                ctx.fill();

                if (isSelectedCountry(country)){
                    var subAreas=$scope.selectedCountry["subareas"];
                    for (var subAreaIndex=0; subAreaIndex<subAreas.length; subAreaIndex++){
                        var subArea = subAreas[subAreaIndex];
                        var subAreaDrawingResult = drawShape(subArea);
                        if (isSelectedArea(subArea)){
                            ctx.fillStyle=selectedColor;
                            ctx.fill();
                        }
                        writeName(subArea["name"], subAreaDrawingResult["gravity"], subAreaDrawingResult["limit"]);
                    }
                }else if (area["substract"] != 1){
                    writeName(country["name"], gravity, curLimit);
                }
            }
        }
        
        if ($scope.addingRegion){
            if (newArea["points"].length >= 1){
                if (newArea["points"].length == 1){
                    drawCross(newArea["points"][0])
                }else {
                    drawShape(newArea, true);
                }
            }
        }
    }
    
    function drawCross(point){
        ctx.lineWidth = 1;
        var x = getPositionInPixels(point, 0);
        var y = getPositionInPixels(point, 1);
        ctx.beginPath();
        ctx.moveTo(x-crossSize, y);
        ctx.lineTo(x+crossSize, y);
        ctx.moveTo(x, y-crossSize);
        ctx.lineTo(x, y+crossSize);
        ctx.stroke();
    }

    /**
     * Update offset tab according to mouse movement
     * @param event the mouse move event
     */
    function move(event){
        offset[0] += (event.offsetX - initPosition[0]);
        initPosition[0] = event.offsetX;
        offset[1] += (event.offsetY - initPosition[1]);
        initPosition[1] = event.offsetY;
        draw();
    }

    /**
     * Get the area belonging to a country a point belongs to
     * @param country the country whose areas are checked
     * @param point the point that may belong to an area
     */
    function getAreaPointBelongsTo(country, point){
        if (country == undefined){
            return null;
        }
        
        var areas=country["subareas"];
        for (var areaIndex=0; areaIndex < areas.length; areaIndex++){
            var area=areas[areaIndex];
            var points = area["points"];
            var belongs = canvasService.pointBelongsTo(point, points);
            
            if (belongs == 1){
                return area;
            }
        }
        return null;
    }

    /**
     * Get the country a point belongs to
     * @param point the point that may belong to a country
     */
    function getCountryPointBelongsTo(point){
        var countries=$scope.countriesJSON["countries"];
        for (var countryIndex=0; countryIndex<countries.length; countryIndex++){
            var country = countries[countryIndex];
            
            if (countryContainsPoint(point, country)){
                return country;
            }
        }
        return null;
    }
    
    /**
     * Checks that a country contains a point
     * @param point the point to check
     * @param country country to check
     * @param returns true if country countains the point, false otherwise
     */
    function countryContainsPoint(point, country){
        var areas=country["areas"];
        var into = 0;
        for (var areaIndex=0; areaIndex < areas.length; areaIndex++){
            var area=areas[areaIndex];
            var points = area["points"];
            var belongs = canvasService.pointBelongsTo(point, points);
            
            if (belongs == 1){
                if (area["substract"] == 1){
                    into = 0;
                    break;
                }else{
                    into = 1;
                }
            }
        }
        return into;
    }
    
    /**
     * Get relative point for a pixel point
     * @param point the point to convert
     */
    function getRelativePoint(point){
        return [getRelativePosition(point, 0), getRelativePosition(point, 1)];
    }

    /**
     * Display the country or area been hovered 
     * @param point the current position of the mouse
     */
    function display(point){
        var relativePoint = getRelativePoint(point);
        if (isACountrySelected()){
            var hoveredArea = getAreaPointBelongsTo($scope.selectedCountry, relativePoint);
            $scope.hoveredArea = hoveredArea;
        }else{
            var hoveredCountry = getCountryPointBelongsTo(relativePoint);
            $scope.hoveredCountry = hoveredCountry;
        }
    }

    /**
     * Display the country or area been clicked 
     * @param point the current position of the mouse
     */
    function select(point){
        var relativePoint = getRelativePoint(point);
        var area = getAreaPointBelongsTo($scope.selectedCountry, relativePoint);
        if (area){
            selectArea(area);
        }else{
            var country = httpService.getCountry(getCountryPointBelongsTo(relativePoint));
            if (country && isSelectedCountry(country) && !$scope.selectedArea){
                country=null;
            }
            $scope.selectedArea = null;
            $scope.selectedCountry = country;
        }
        draw();
    }
    
    function selectArea(area){
        $scope.selectedArea = httpService.getArea(area);
    }
});
