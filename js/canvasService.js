app.service('canvasService', function (){    
    this.updateLimit = function(limitJSON, point){                
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
    };
         
    /**
     * @return {boolean} true if point is west of the line segment [segmentPoint1 segmentPoint2]
     */
    function west(A, B, point) {
        var x = point[0];
        var y = point[1];
        var s1x = A[0];
        var s2x = B[0];
        var s1y = A[1];
        var s2y = B[1];
        if (s1y <= s2y) {
            if (y <= s1y || y > s2y || x >= s1x && x >= s2x) {
                return false;
            } else if (x < s1x && x < s2x) {
                return true;
            } else {
                return (y - s1y) / (x - s1x) > (s2y - s1y) / (s2x - s1x);
            }
        } else {
            return west(B, A, point);
        }
    };

    this.pointBelongsTo = function(point, points){
        var count = 0;
        for (var pointIndex = 0; pointIndex < points.length; pointIndex++) {
            var segmentPoint1 = points[pointIndex];
            var segmentPoint2 = points[(pointIndex + 1)%points.length];
            if (west(segmentPoint1, segmentPoint2, point))
                count++;
        }
        return count % 2;
    };
});
