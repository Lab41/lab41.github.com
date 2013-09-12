(function($) {
  $(document).ready(function() {

    function kroneckerGen(initiator, iterations) {
      //$('#controller').html($('.dg.ac'));

      var numNodes = Math.pow(initiator.length, iterations);

      var nodeList = [];
      for(var i=0; i<numNodes; i++) {
          nodeList.push({"id": i});
      }

      var linkList = [];
      var linkListIndex = {};
      nodeList.forEach(function(node, nodei) {
          nodeList.forEach(function(node2, node2i) {
              //if we already tested the edge and found it nonexistent, return
              if(linkListIndex[node2i+","+nodei] === 0) {
                  linkListIndex[nodei+","+node2i] = 0;
                  return;
              }

              //if we already tested the edge and found it existed, add it and return
              if(linkListIndex[node2i+","+nodei] === 1) {
                  linkList.push({source: node, target: node2});
                  linkListIndex[nodei+","+node2i] = 1;
         	        return;
              }

              //else generate the edge
              if (Math.random() < kronProb(initiator, iterations, nodei, node2i)) {
                  linkList.push({source: node, target: node2});
                  linkListIndex[nodei+","+node2i] = 1;
              } else {
                  linkListIndex[nodei+","+node2i] = 0;
              }
          })
      });

      return {"nodes":nodeList, "links":linkList};
    }

    function kronProb(initiator, iterations, row, col) {
        var p = 1.0;
        var numInitiator = initiator.length;
        var numNodes = Math.pow(initiator.length, iterations);
        var initiatorPow = numNodes;
        for(var i=iterations-1; i>=0; i--) {
            initiatorPow /= numInitiator;
            var rowValue = Math.floor(row / initiatorPow) % numInitiator;
            var colValue = Math.floor(col / initiatorPow) % numInitiator;
            p *= initiator[rowValue][colValue];
        }
        return p;
    }
    //end of kronecker.js

    function adjacencyMatrix() {
        var margin = {top: 80, right: 0, bottom: 10, left: 80},
            width = 300,
            height = 300;

        var x = d3.scale.ordinal().rangeBands([0, width]),
            z = d3.scale.linear().domain([0, 4]).clamp(true),
            c = d3.scale.category10().domain(d3.range(10));

        var matrixSVG = d3.select("#matrix").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        function initMatrix(miserables) {
          var matrix = [],
              nodes = miserables.nodes,
              n = nodes.length;

          // Compute index per node.
          nodes.forEach(function(node, i) {
            node.index = i;
            matrix[i] = d3.range(n).map(function(j) { return {x: j, y: i, z: 0}; });
          });

          // Convert links to matrix; count character occurrences.
          miserables.links.forEach(function(link) {
            matrix[link.source.id][link.target.id].z = 8;
          });

          // Precompute the orders.
          var orderByID = d3.range(n).sort(function(a, b) { return d3.ascending(nodes[a].id, nodes[b].id); });

          var orders = {
            id: d3.range(n).sort(function(a, b) { return d3.ascending(nodes[a].id, nodes[b].id); })
          };

          // The default sort order.
          x.domain(orders.id);

          matrixSVG.append("rect")
              .attr("class", "background")
              .attr("width", width)
              .attr("height", height);

          var row = matrixSVG.selectAll(".row")
              .data(matrix)
              .enter().append("g")
              .attr("class", "row")
              .attr("transform", function(d, i) { return "translate(0," + x(i) + ")"; })
              .each(row);

          row.append("line")
              .attr("x2", width);

          row.append("text")
              .attr("x", -6)
              .attr("y", x.rangeBand() / 2)
              .attr("dy", ".32em")
              .attr("text-anchor", "end")
              .text(function(d, i) { if(config.iterations > 5) return ""; else return nodes[i].name; });

          var column = matrixSVG.selectAll(".column")
              .data(matrix)
            .enter().append("g")
              .attr("class", "column")
              .attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });

          column.append("line")
              .attr("x1", -width);

          column.append("text")
              .attr("x", 6)
              .attr("y", x.rangeBand() / 2)
              .attr("dy", ".32em")
              .attr("text-anchor", "start")
              .text(function(d, i) { if(config.iterations > 5) return ""; else return nodes[i].name; });

          function row(row) {
            var cell = d3.select(this).selectAll(".cell")
            .data(row.filter(function(d) { return d.z; }))
              .enter().append("rect")
            .attr("class", "cell")
            .attr("x", function(d) { return x(d.x); })
            .attr("width", x.rangeBand())
            .attr("height", x.rangeBand())
            .style("fill-opacity", function(d) { return z(d.z); })
            //.style("fill", function(d) { return nodes[d.x].group == nodes[d.y].group ? c(nodes[d.x].group) : null; })
            .on("mouseover", mouseover)
            .on("mouseout", mouseout);
          }

          function mouseover(p) {
            d3.selectAll(".row text").classed("active", function(d, i) { return i == p.y; });
            d3.selectAll(".column text").classed("active", function(d, i) { return i == p.x; });
          }

          function mouseout() {
            d3.selectAll("text").classed("active", false);
          }

          /*d3.select("#order").on("change", function() {
            clearTimeout(timeout);
            order(this.value);
          });*/

          function order(value) {
            x.domain(orders[value]);

            var t = matrixSVG.transition().duration(2500);

            t.selectAll(".row")
            .delay(function(d, i) { return x(i) * 4; })
            .attr("transform", function(d, i) { return "translate(0," + x(i) + ")"; })
              .selectAll(".cell")
            .delay(function(d) { return x(d.x) * 4; })
            .attr("x", function(d) { return x(d.x); });

            t.selectAll(".column")
            .delay(function(d, i) { return x(i) * 4; })
            .attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });
          }

          /*var timeout = setTimeout(function() {
            order("group");
            d3.select("#order").property("selectedIndex", 2).node().focus();
          }, 5000);*/
        }

        matrixResults.nodes.forEach(function(node) { node.name=""+node.id; });
        initMatrix(matrixResults);
    }
    //end of matrix.js

    config = { "linkDistance" : 30, "charge" : 100, "gravity" : .5,
	           "iterations" : 5, "a1" : 0.5, "a2" : 0.5, "b1" : 0.5, "b2" : 0.5};

    function getSliderSlideFunction(cellName) {
      return function(ev,ui) {
          $("#"+cellName+"value").html(ui.value/100);
          config[cellName] = ui.value/100;
          if(config.iterations < 7) { kronGen(); redrawMatrix(); restart(); }
        }
    }

    function getSliderChangeFunction(cellName) {
      return function(ev,ui) {
          if(config.iterations >= 7) { kronGen(); redrawMatrix(); restart(); }
        };
    };

    function getSliderInitObject(cellName) {
      return {
          min:    0,
          max:    100,
          create: function(ev,ui) { $("#"+cellName+"value").html(config[cellName]); },
          slide:  getSliderSlideFunction(cellName),
          change: getSliderChangeFunction(cellName),
          value:  config[cellName]*100
        };
    };

    $("#iterationsslider").slider({
                              min:    1, 
                              max:    8,
                              step:   1,
                              create: function(ev,ui) { $("#iterationsvalue").html(config.iterations); },
                              slide:  function(ev,ui) {
                                        $("#iterationsvalue").html(ui.value);
                                        config.iterations = ui.value;
                                        if(!willCreateHairball()) { kronGen(); redrawMatrix(); restart(); }
                                      },
                              change: function(ev,ui) {
                                        if(willCreateHairball()) { kronGen(); redrawMatrix(); restart(); }
                                      },
                              value:  config.iterations
                            });
                              

    $("#a1slider").slider(getSliderInitObject("a1"));
    $("#a2slider").slider(getSliderInitObject("a2"));
    $("#b1slider").slider(getSliderInitObject("b1"));
    $("#b2slider").slider(getSliderInitObject("b2"));

    $("#regenerate").button({label:"Regenerate graph"}).click(function(event) { kronGen(); redrawMatrix(); restart(); });

    var width = 400, //window.innerWidth,
        height = 400, //window.innerHeight,
        radius = 10,
        graphNodes = [],
        graphLinks = [],
        matrixNodes = [],
        matrixLinks = [];

    var graphSVG = d3.select("#graph").append("svg")
                     .attr("width", width)
                     .attr("height", height);

    var force = d3.layout.force()
                  .linkDistance(config["linkDistance"])
                  .gravity(config["gravity"])
                  .size([width, height])
                  .charge(-config["charge"]);

    kronGen();
    redrawMatrix();
    restart();
   
    function willCreateHairball() {
      return (config.iterations > 6) && (config.iterations*(config.a1+config.a2+config.b1+config.b2)) > 15.5;
    }

    function tickFunction() {
      //if(willCreateHairball()) return;
      graphSVG.selectAll("line.link")
         .attr("x1", function(d) { return d.source.x; })
         .attr("y1", function(d) { return d.source.y; })
         .attr("x2", function(d) { return d.target.x; })
         .attr("y2", function(d) { return d.target.y; });

      graphSVG.selectAll("circle.node")
         .attr("cx", function(d) { return d.x = Math.max(radius, Math.min(width - radius, d.x)); })
         .attr("cy", function(d) { return d.y = Math.max(radius, Math.min(height - radius, d.y)); });
    }

    force.on("tick", tickFunction);

    function kronGen() {
        initiator = [[config.a1,config.a2],[config.b1,config.b2]];
        iterations = config.iterations;

        matrixResults = kroneckerGen(initiator,iterations);
        if(willCreateHairball()) graphResults = kroneckerGen(initiator,Math.min(iterations,6));
        else graphResults = matrixResults;
        graphNodes = graphResults.nodes, graphLinks = graphResults.links;
        matrixNodes = matrixResults.nodes, matrixLinks = matrixResults.links;
        force.nodes(graphNodes).links(graphLinks);
        graphResults.nodes.forEach(function(node) { node.name=""+node.id; });
    }

    function restart() {
      force.start();
      
      link = graphSVG.selectAll("line.link")
      .data(graphLinks)

      link.enter().insert("line")
      .attr("class", "link")
      .attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

      link.exit().remove()

      node = graphSVG.selectAll("circle.node")
      .data(graphNodes)

      node.enter().insert("circle")
      .attr("class", "node")
      .attr("r", 5)
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })
      .call(force.drag);

      /*node.enter().insert("text")
      .attr("class", "node")
      .attr("x", function(d) { return d.x; })
      .attr("y", function(d) { return d.y; })
      .call(force.drag);*/

      //node.text(function(d) {return d.name;})

      node.exit().remove();
  
      if(false) {
          for (var i = 0; i < 20; ++i) force.tick();
          force.stop();

      graphSVG.selectAll("line.link")
         .attr("x1", function(d) { return d.source.x; })
         .attr("y1", function(d) { return d.source.y; })
         .attr("x2", function(d) { return d.target.x; })
         .attr("y2", function(d) { return d.target.y; });

      graphSVG.selectAll("circle.node")
         .attr("cx", function(d) { return d.x = Math.max(radius, Math.min(width - radius, d.x)); })
         .attr("cy", function(d) { return d.y = Math.max(radius, Math.min(height - radius, d.y)); }); 
      }
    }

    function redrawMatrix() {
      $("#matrix").html('');
      adjacencyMatrix();
    }
  });
})(jQuery);
