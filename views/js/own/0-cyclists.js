var cyclisters = [];
var klassen_filter = [];
var typen_filter = [];

var loadCyclists = function(year) {
  $(".cyclists-holder").html("\
  <div class='col-lg-12 text-center' style='margin-top:30px;'>\
    <i class='fa fa-spinner fa-spin fa-3x'></i>\
  </div>\
  ");
  makeAjax("/api/cyclists?year=" + year, function(results) {
    if (results.status == "success") {
      cyclisters = results.results;
      showCyclists(cyclisters, true);
    } else {
      console.dir(results);
    }
  }, function(error) {
    console.log(error);
  })
};

var showCyclists = function(cyclists, firstLoaded) {
  $("#cyclistsLastUpdated").html(new Date(cyclists[0].last_updated).toLocaleString());
  $(".cyclists-holder").html("");
  cyclists = uniqueA(cyclists);
  var event_classes = [];
  var cyclistsToShow = [];
  for (var i = 0; i < cyclists.length; i++) {
    if (klassen_filter.length == 0 || klassen_filter.indexOf(cyclists[i].klasse) > -1) {
      var results = JSON.parse(cyclists[i].results);
      var points = 0;
      for (var y = 0; y < results.length; y++) {
        if (typen_filter.length == 0 || typen_filter.indexOf(results[y].kategorie.split(".")[0]) > -1) {
          points += parseInt(results[y].points) || 0;
        }
        if ($.inArray(results[y].kategorie, event_classes) == -1 && results[y].kategorie.length > 0) event_classes.push(results[y].kategorie);
      }
      cyclists[i].points = points;
      cyclistsToShow.push(cyclists[i]);
    }
  }

  if (firstLoaded) addKlassesToSelect(event_classes);

  cyclistsToShow.sort(function(a, b) {
    var keyA = a.points,
      keyB = b.points;
    // Compare the 2 dates
    if (keyA > keyB) return -1;
    if (keyA < keyB) return 1;
    return 0;
  });

  for (var i = 0; i < cyclistsToShow.length; i++) {
    var classs = i % 2 == 0 ? "even" : "odd";
    $(".cyclists-holder").append("\
    <div class='row " + classs + "'>\
      <div class='col-sm-1 links'>\
         <span>" + (i + 1) + "</span>\
      </div>\
      <div class='col-sm-2 mitte'>\
         <a href='" + cyclistsToShow[i].href + "' target='_blank'><span>" + cyclistsToShow[i].lastname + "</span></a>\
      </div>\
      <div class='col-sm-2 mitte'>\
         <span>" + cyclistsToShow[i].firstname + "</span>\
      </div>\
      <div class='col-sm-2 mitte'>\
         <span>" + cyclistsToShow[i].club + "</span>\
      </div>\
      <div class='col-sm-2 mitte'>\
         <span>" + cyclistsToShow[i].team + "</span>\
      </div>\
      <div class='col-sm-2 mitte'>\
         <span>" + cyclistsToShow[i].klasse + "</span>\
      </div>\
      <div class='col-sm-1 mitte'>\
         <span>" + cyclistsToShow[i].points + "</span>\
      </div>\
    </div>\
    ");
  }
};

var addKlassesToSelect = function(event_classes) {
  event_classes.sort(function(a, b) {
    var keyA = a,
      keyB = b;
    // Compare the 2 dates
    if (keyA < keyB) return -1;
    if (keyA > keyB) return 1;
    return 0;
  });

  $('#select_type')
    .find('option')
    .remove();

  $("#select_type").append($('<option>', {
    value: "alle",
    text: "Alle"
  }));

  $("#select_type").append($('<option>', {
    value: "deutsch",
    text: "Deutsche Rennen"
  }));

  $("#select_type").append($('<option>', {
    value: "international",
    text: "Internationale Rennen"
  }));

  for (var i = 0; i < event_classes.length; i++) {
    $("#select_type").append($('<option>', {
      value: event_classes[i],
      text: event_classes[i]
    }));
  }
};


$('#select_year').change(function() {
  loadCyclists($(this).val());
});

$('#select_klasse').change(function() {
  var klasse = $(this).val();
  klassen_filter = [];
  if (klasse == "amateureabc") {
    klassen_filter = ["A", "B", "C"];
  } else if (klasse == "amateurektabc") {
    klassen_filter = ["KT", "A", "B", "C"];
  } else if (klasse == "prosptpkt") {
    klassen_filter = ["PT", "PKT"];
  } else if (klasse == "prosptpktkt") {
    klassen_filter = ["PT", "PKT", "KT"];
  }
  showCyclists(cyclisters);
});

$('#select_type').change(function() {
  var typ = $(this).val();
  typen_filter = [];
  if (typ == "alle") {
    typen_filter = [];
  } else if (typ == "deutsch") {
    typen_filter = ["3", "4", "5", "6", "7"];
  } else if (typ == "international") {
    typen_filter = ["1", "2"];
    $("#select_type option").each(function() {
      if (["3", "4", "5", "6", "7"].indexOf($(this).val().split(".")[0]) == -1) typen_filter.push($(this).val());
    });
  } else {
    typen_filter = [typ];
  }
  showCyclists(cyclisters);
});
