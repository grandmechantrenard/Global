app.service('httpService', function (){
    this.getCountries = function(){
        //TODO HTTP request
        return { "countries":[
            {"id": 1, "color": "#00FF00", "name": "R1", "areas":[{"points": [[90, 90], [100, 90], [100, 100], [90, 100]]}]}, 
            {"id": 2, "color": "#FF0000", "name": "R2", "areas":[{"points": [[90, 100], [110, 100], [110, 120], [90, 120]]}]}, 
            {"id": 3, "color": "#0000FF", "name": "R3", "areas":[{"points": [[100, 85], [120, 85], [120, 100], [100, 100]]},
                                                                 {"points": [[135, 90], [136, 90], [136, 91], [135, 91]]}]}, 
            {"id": 4, "color": "#00FFFF", "name": "R4", "areas":[{"points": [[110, 100], [130, 100], [130, 130], [110, 130]]}, 
                                                                 {"points": [[117, 120], [123, 120], [123, 126], [117, 126]], "substract": 1}]}, 
            {"id": 5, "color": "#FF00FF", "name": "R5", "areas":[{"points": [[117, 120], [123, 120], [123, 126], [117, 126]]}]}, 
            {"id": 6, "color": "#FF9999", "name": "R6", "areas":[{"points": [[135, 115], [138, 110], [140, 120], [136, 126], [132, 125]]}]}
        ]};
    }

    this.getCountry = function(country){
        //TODO HTTP request
        if (country){
            var id = country["id"];
            switch(id){
                case 1: return {"id": 1, "name":"R1", "recipes": 5, "areas":[{"points": [[90, 90], [100, 90], [100, 100], [90, 100]]}], "subareas":[]};
                case 2: return {"id": 2, "name":"R2", "recipes": 174, "typicalRecipes": 63, 
                                "areas":[{"points": [[90, 100], [110, 100], [110, 120], [90, 120]]}], 
                                "subareas":[{"id": 1, "name": "R21", "points": [[92, 102], [94, 102], [94, 105], [92, 105]]},
                                            {"id": 2, "name": "R22", "points": [[95, 106], [98, 106], [98, 108], [95, 108]]}]};
                case 3: return {"id": 3, "name":"R3", "recipes": 76, "typicalRecipes": 32, 
                                "areas":[{"points": [[100, 85], [120, 85], [120, 100], [100, 100]]},
                                         {"points": [[135, 90], [136, 90], [136, 91], [135, 91]]}], 
                                "subareas":[{"id": 3, "name": "R31", "points": [[102, 92], [104, 92], [104, 95], [102, 95]]},
                                            {"id": 4, "name": "R32", "points": [[105, 96], [108, 96], [108, 98], [105, 98]]}]};
                case 4: return {"id": 4, "name":"R4", "recipes": 32, 
                                "areas":[{"points": [[110, 100], [130, 100], [130, 130], [110, 130]]}, 
                                         {"points": [[117, 120], [123, 120], [123, 126], [117, 126]], "substract": 1}], 
                                "subareas":[]};
                case 5: return {"id": 5, "name":"R5", "recipes": 4, "areas":[{"points": [[117, 120], [123, 120], [123, 126], [117, 126]]}], "subareas":[]};
                case 6: return {"id": 6, "name":"R6", "recipes": 22, "areas":[{"points": [[135, 115], [138, 110], [140, 120], [136, 126], [132, 125]]}], "subareas":[]};
                default: return null;
            }
        }
        return null;
    }

    this.getArea = function(area){
        //TODO HTTP request
        if (area){
            var id = area["id"];
            switch(id){
                case 1: return {"id": 1, "name": "R21", "recipes": 54, "typicalRecipes": 28};
                case 2: return {"id": 2, "name": "R22", "recipes": 32, "typicalRecipes": 15};
                case 3: return {"id": 3, "name": "R31", "recipes": 11, "typicalRecipes": 3};
                case 4: return {"id": 4, "name": "R32", "recipes": 25, "typicalRecipes": 7};
                default: return null;
            }
        }
        return null;
    }
    
    this.addNewArea = function(newArea, name, countries){
        //TODO HTTP request
    }
});
