/*-- MENU LATERAL .......................................................*/
var menuRight = document.getElementById( 'cbp-spmenu-s2' ),
showRightPush = document.getElementById( 'showRightPush' ),
body = document.body;

showRightPush.onclick = function() {
  classie.toggle( this, 'active' );
  classie.toggle( body, 'cbp-spmenu-push-toleft' );
  classie.toggle( menuRight, 'cbp-spmenu-open' );
};
