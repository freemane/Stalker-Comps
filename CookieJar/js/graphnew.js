// table
$(document).ready(function() {
    $('#test').dataTable();
} );

// graph
var nodes = [];
chrome.cookies.getAll({}, function (cookies) {
    for (var i = 0; i < cookies.length; i++) {
            var cook = cookies[i];
            var dataObject = {
        
var points = [{"data":{"id":"n40","weight":53},"position":{"x":50,"y":45},"group":"nodes","removed":false,"selected":false,"selectable":true,"locked":false,"grabbable":true,"classes":""},{"data":{"id":"n41","weight":23},"position":{"x":150,"y":45},"group":"nodes","removed":false,"selected":false,"selectable":true,"locked":false,"grabbable":true,"classes":""}];
var cy = cytoscape({

  container: document.getElementById('cy'), // container to render in

  elements: points,

  style: [ // the stylesheet for the graph
    {
      selector: 'node',
      style: {
        'background-color': '#666',
        'label': 'data(id)'
      }
    },

    {
      selector: 'edge',
      style: {
        'width': 3,
        'line-color': '#ccc',
        'target-arrow-color': '#ccc',
        'target-arrow-shape': 'triangle'
      }
    }
  ],

  layout: {
    name: 'grid',
    rows: 1
  }

});