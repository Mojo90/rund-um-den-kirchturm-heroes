var lastScrollTop = 0;
$(window).scroll(function() {
  var scrollTop = parseInt($(window).scrollTop());
  if (scrollTop > 52) {
      $('#menu_holder').removeClass('start');
  } else {
    $('#menu_holder').addClass('start');
  }
});
