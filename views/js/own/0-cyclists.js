var cyclisters = [];
var klassen_filter = [];
var typen_filter = [];
var category_filter = "male";

var loadCyclists = function(year) {
  $(".cyclists-holder").html("\
  <div class='col-lg-12 text-center' style='margin-top:30px;'>\
    <i class='fa fa-spinner fa-spin fa-3x'></i>\
  </div>\
  ");
  makeAjax("/api/cyclists?year=" + year, function(results) {
    if (results.status == "success") {
      cyclisters = results.results;
      if (category_filter == "male") {
        showCyclists(cyclisters, true);
      } else {
        showTeams(cyclisters, true);
      }
    } else {
      console.dir(results);
    }
  }, function(error) {
    console.log(error);
    showError("Es ist ein Fehler aufgetreten. Am Besten die Seite noch einmal neu laden. Falls der Fehler häufiger auftritt bitte mich kontaktieren.");
  });
};

var loadEwige = function() {
  $(".cyclists-holder").html("\
  <div class='col-lg-12 text-center' style='margin-top:30px;'>\
    Das dauert kurz ;)....\
    <i class='fa fa-spinner fa-spin fa-3x'></i>\
  </div>\
  ");
  var loading = false;
  var loaded = 0;
  var co = 0;
  var ewigeCyclists = [];

  var loadYear = function(y) {
    if (!loading) {
      loading = true;
      makeAjax("/api/cyclists?year=" + y, function(results) {
        loaded++;
        if (results.status == "success") {
          for (var i = 0; i < results.results.length; i++) {
            ewigeCyclists.push(results.results[i]);
          }
        } else {
          console.dir(results);
        }
        loading = false;

        $(".cyclists-holder").html("\
        <div class='col-lg-12 text-center' style='margin-top:30px;'>\
          Das dauert kurz ;)....(" + loaded + " von " + co + " Jahren geladen.)\
          <i class='fa fa-spinner fa-spin fa-3x'></i>\
        </div>\
        ");

        if (loaded == co) {
          cyclisters = ewigeCyclists;
          showEwige(cyclisters, true);
        }
      }, function(error) {
        loaded++;
        console.log(error);
        loading = false;

        showError("Es ist ein Fehler aufgetreten. Am Besten die Seite noch einmal neu laden. Falls der Fehler häufiger auftritt bitte mich kontaktieren.");

        if (loaded == co) {
          cyclisters = ewigeCyclists;
          showCyclists(cyclisters, true);
        }
      });
    } else {
      setTimeout(function() {
        loadYear(y);
      }, 100);
    }
  };

  var timeoutYear = function(year, count) {
    setTimeout(function() {
      loadYear(year);
    }, 100);
  };

  for (var i = 2005; i <= 2017; i++) {
    co++;
    timeoutYear(i, co);
  }
};

var showCyclists = function(cyclists, firstLoaded) {
  $("#cyclistsLastUpdated").html(new Date(cyclists[0].last_updated).toLocaleString());
  $('.container.rangliste').html('\
    <div class="row top" style="margin-top:20px;">\
      <div class="col-sm-1 col-xs-2 links">\
        <span>Rang</span>\
      </div>\
      <div class="col-sm-2 col-xs-4 mitte">\
        <span>Nachname</span>\
      </div>\
      <div class="col-sm-2 mitte first">\
        <span>Vorname</span>\
      </div>\
      <div class="col-sm-2 col-xs-3 mitte">\
        <span>Verein</span>\
      </div>\
      <div class="col-sm-2 col-xs-3 mitte">\
        <span>Team</span>\
      </div>\
      <div class="col-sm-2 rechts klasse" title="Es ist bei einem Fahrer gerade immer die aktuellste Klasse für alle Jahre hinterlegt.">\
        <span style="width:auto; padding-right: 10px;">Klasse</span>\
        <a href="#" onclick="alert(\'Es ist bei einem Fahrer gerade immer die aktuellste Klasse für alle Jahre hinterlegt.\');return false;">\
          <i class="fa fa-info-circle"></i>\
        </a>\
      </div>\
      <div class="col-sm-1 rechts points">\
        <span>Punkte</span>\
      </div>\
    </div>\
    <div class="cyclists-holder"></div>');
  $(".cyclists-holder").html("");
  //cyclists = uniqueA(cyclists);
  var event_classes = [];
  var cyclistsToShow = [];
  for (var i = 0; i < cyclists.length; i++) {
    if (klassen_filter.length == 0 || klassen_filter.indexOf(cyclists[i].klasse) > -1) {
      var results = JSON.parse(cyclists[i].results);
      var points = 0;
      for (var y = 0; y < results.length; y++) {
        if (typen_filter.length == 0 || typen_filter.indexOf(results[y].kategorie.split(".")[0]) > -1 || typen_filter[0] == results[y].kategorie) {
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
      <div class='col-sm-1 col-xs-2 links'>\
         <span>" + (i + 1) + "</span>\
      </div>\
      <div class='col-sm-2 col-xs-4 mitte'>\
         <a href=" + cyclistsToShow[i].href + " target='_blank'><span style='text-decoration: underline;'>" + cyclistsToShow[i].lastname + "</span></a>\
      </div>\
      <div class='col-sm-2 mitte first'>\
         <span>" + cyclistsToShow[i].firstname + "</span>\
      </div>\
      <div class='col-sm-2 col-xs-3 mitte'>\
         <span>" + cyclistsToShow[i].club + "</span>\
      </div>\
      <div class='col-sm-2 col-xs-3 mitte'>\
         <span>" + cyclistsToShow[i].team + "</span>\
      </div>\
      <div class='col-sm-2 mitte klasse'>\
         <span>" + cyclistsToShow[i].klasse + "</span>\
      </div>\
      <div class='col-sm-1 mitte points'>\
         <span>" + cyclistsToShow[i].points + "</span>\
      </div>\
    </div>\
    ");
  }
};

var showTeams = function(cyclists, firstLoaded) {
  $("#cyclistsLastUpdated").html(new Date(cyclists[0].last_updated).toLocaleString());
  $('.container.rangliste').html('\
    <div class="row top" style="margin-top:20px;">\
      <div class="col-sm-1 col-sm-offset-1 col-xs-2 links">\
        <span>Rang</span>\
      </div>\
      <div class="col-sm-5 col-xs-6 mitte">\
        <span>Team/Verein</span>\
      </div>\
      <div class="col-sm-2 col-xs-2 rechts">\
        <span>Punkte</span>\
      </div>\
      <div class="col-sm-2 col-xs-2 mitte">\
        <span>Anzahl Fahrer</span>\
      </div>\
    </div>\
    <div class="cyclists-holder"></div>');
  $(".cyclists-holder").html("");
  cyclists = uniqueA(cyclists);
  var event_classes = [];
  var cyclistsToShow = [];
  for (var i = 0; i < cyclists.length; i++) {
    if (klassen_filter.length == 0 || klassen_filter.indexOf(cyclists[i].klasse) > -1) {
      var results = JSON.parse(cyclists[i].results);
      var points = 0;
      for (var y = 0; y < results.length; y++) {
        if (typen_filter.length == 0 || typen_filter.indexOf(results[y].kategorie.split(".")[0]) > -1 || typen_filter[0] == results[y].kategorie) {
          points += parseInt(results[y].points) || 0;
        }
        if ($.inArray(results[y].kategorie, event_classes) == -1 && results[y].kategorie.length > 0) event_classes.push(results[y].kategorie);
      }
      cyclists[i].points = points;
      cyclistsToShow.push(cyclists[i]);
    }
  }

  if (firstLoaded) addKlassesToSelect(event_classes);

  var teamsVereine = [];
  for (var i = 0; i < cyclistsToShow.length; i++) {
    if ($.inArray(cyclistsToShow[i].club, teamsVereine) == -1 && cyclistsToShow[i].club.length > 0) teamsVereine.push(cyclistsToShow[i].club);

    // Herrmann Radteam club and team is equal thus only count club
    if ($.inArray(cyclistsToShow[i].team, teamsVereine) == -1 && cyclistsToShow[i].team.length > 0 && cyclistsToShow[i].team != "Herrmann Radteam") teamsVereine.push(cyclistsToShow[i].team);
  }

  var teamsVereineToShow = [];
  for (var i = 0; i < teamsVereine.length; i++) {
    var team = {
      name: teamsVereine[i],
      points: 0,
      cyclists: 0
    }
    for (var z = 0; z < cyclistsToShow.length; z++) {
      if (cyclistsToShow[z].club == teamsVereine[i]) {
        team.points += cyclistsToShow[z].points;
        team.cyclists++;
      }

      if (cyclistsToShow[z].team == teamsVereine[i]) {
        team.points += cyclistsToShow[z].points;
        team.cyclists++;
      }
    }
    teamsVereineToShow.push(team);
  }

  teamsVereineToShow.sort(function(a, b) {
    var keyA = a.points,
      keyB = b.points;
    // Compare the 2 dates
    if (keyA > keyB) return -1;
    if (keyA < keyB) return 1;
    return 0;
  });

  for (var i = 0; i < teamsVereineToShow.length; i++) {
    var classs = i % 2 == 0 ? "even" : "odd";
    $(".cyclists-holder").append("\
    <div class='row " + classs + "'>\
      <div class='col-sm-1 col-sm-offset-1 col-xs-2 links'>\
         <span>" + (i + 1) + "</span>\
      </div>\
      <div class='col-sm-5 col-xs-6 mitte'>\
         <span>" + teamsVereineToShow[i].name + "</span>\
      </div>\
      <div class='col-sm-2 mitte col-xs-2'>\
         <span>" + teamsVereineToShow[i].points + "</span>\
      </div>\
      <div class='col-sm-2 mitte col-xs-2'>\
         <span>" + teamsVereineToShow[i].cyclists + "</span>\
      </div>\
    </div>\
    ");
  }
};

var showEwige = function(cyclists, firstLoaded) {
  $("#cyclistsLastUpdated").html(new Date(cyclists[0].last_updated).toLocaleString());
  $('.container.rangliste').html('\
    <div class="row top" style="margin-top:20px;">\
      <div class="col-sm-1 col-xs-2 links">\
        <span>Rang</span>\
      </div>\
      <div class="col-sm-2 col-xs-4 mitte">\
        <span>Nachname</span>\
      </div>\
      <div class="col-sm-2 mitte first">\
        <span>Vorname</span>\
      </div>\
      <div class="col-sm-2 col-xs-3 mitte">\
        <span>Verein</span>\
      </div>\
      <div class="col-sm-2 col-xs-3 mitte">\
        <span>Team</span>\
      </div>\
      <div class="col-sm-2 rechts klasse" title="Es ist bei einem Fahrer gerade immer die aktuellste Klasse für alle Jahre hinterlegt.">\
        <span style="width:auto; padding-right: 10px;">Klasse</span>\
        <a href="#" onclick="alert(\'Es ist bei einem Fahrer gerade immer die aktuellste Klasse für alle Jahre hinterlegt.\');return false;">\
          <i class="fa fa-info-circle"></i>\
        </a>\
      </div>\
      <div class="col-sm-1 rechts points">\
        <span>Punkte</span>\
      </div>\
    </div>\
    <div class="cyclists-holder"></div>');
  $(".cyclists-holder").html("");
  //cyclists = uniqueA(cyclists);

  var cyclistsUnique = uniqueAFirstLast(cyclists);

  var event_classes = [];
  var cyclistsToShow = [];
  for (var i = 0; i < cyclistsUnique.length; i++) {
    if (klassen_filter.length == 0 || klassen_filter.indexOf(cyclistsUnique[i].klasse) > -1) {
      cyclistsUnique[i].points = 0;
      for (var a = 0; a < cyclists.length; a++) {
        if (cyclistsUnique[i].firstname == cyclists[a].firstname && cyclistsUnique[i].lastname == cyclists[a].lastname) {
          var results = JSON.parse(cyclists[a].results);
          var points = 0;
          for (var y = 0; y < results.length; y++) {
            if (typen_filter.length == 0 || typen_filter.indexOf(results[y].kategorie.split(".")[0]) > -1 || typen_filter[0] == results[y].kategorie) {
              points += parseInt(results[y].points) || 0;
            }
            if ($.inArray(results[y].kategorie, event_classes) == -1 && results[y].kategorie.length > 0) event_classes.push(results[y].kategorie);
          }
          cyclistsUnique[i].points += points;
        }
      }
      cyclistsToShow.push(cyclistsUnique[i]);
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

  var length = cyclistsToShow.length;
  if (length > 1000) length = 1000;

  for (var i = 0; i < length; i++) {
    var classs = i % 2 == 0 ? "even" : "odd";
    $(".cyclists-holder").append("\
    <div class='row " + classs + "'>\
      <div class='col-sm-1 col-xs-2 links'>\
         <span>" + (i + 1) + "</span>\
      </div>\
      <div class='col-sm-2 col-xs-4 mitte'>\
         <a href=" + cyclistsToShow[i].href + " target='_blank'><span style='text-decoration: underline;'>" + cyclistsToShow[i].lastname + "</span></a>\
      </div>\
      <div class='col-sm-2 mitte first'>\
         <span>" + cyclistsToShow[i].firstname + "</span>\
      </div>\
      <div class='col-sm-2 col-xs-3 mitte'>\
         <span>" + cyclistsToShow[i].club + "</span>\
      </div>\
      <div class='col-sm-2 col-xs-3 mitte'>\
         <span>" + cyclistsToShow[i].team + "</span>\
      </div>\
      <div class='col-sm-2 mitte klasse'>\
         <span>" + cyclistsToShow[i].klasse + "</span>\
      </div>\
      <div class='col-sm-1 mitte points'>\
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
  if (category_filter == "male") {
    showCyclists(cyclisters);
  } else if (category_filter == "ewige") {
    showEwige(cyclisters);
  } else {
    showTeams(cyclisters);
  }
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
  if (category_filter == "male") {
    showCyclists(cyclisters);
  } else if (category_filter == "ewige") {
    showEwige(cyclisters);
  } else {
    showTeams(cyclisters);
  }
});

$('#select_category').change(function() {
  var category = $(this).val();
  category_filter = category;
  if (category == "male") {
    $("#select_year").show();
    loadCyclists($("#select_year").val());
  } else if (category == "ewige") {
    $("#select_year").hide();
    loadEwige();
  } else {
    // team selected
    $("#select_year").show();
    loadCyclists($("#select_year").val());
  }
});
