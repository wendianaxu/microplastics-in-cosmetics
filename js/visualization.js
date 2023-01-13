

/* Bubble Chart */
async function bubbleChart(g, data, grouping, width, height, margin, speed) {

  const colorPalette = await d3.csv("data/colorPalette.csv");
  const colorPalette12 = await d3.csv("data/colorPalette12.csv");
  const product_types = d3.map(colorPalette, d => d.product_type);
  console.log(product_types);
  const typeColors = d3.map(colorPalette12, d => d.color);
  const typeGroups = d3.map(colorPalette12, d => d.id);

  const top3Types = ["Body", "Deodorant", "Eye Makeup", "Face Makeup", "Facial Care", "Hair", "Hands", "Lips", "Nails", "Perfume", "Sun Care", "Other"];

  const mp_present = ["Microplastics Free", "Contains Microplastics"];
  const mpColors = ["#007D00", "#B30000"];

   // title (tooptip)
  const title = d3.map(data, 
    d => "Product name: " + `${d.product}\n`
    + "Brand: " + `${d.brand}\n`
    + "Product type: " + `${product_types[d.product_type]}\n` 
    + "Number of microplastic ingredients: " + `${d.n_ingre}`);

  // create an array that stores product name, brand, type, and # of MP present for each product
  /* const pInfo = [
    d3.map(data, d => d.product), 
    d3.map(data, d => d.brand),
    d3.map(data, d => product_types[d.product_type]), 
    d3.map(data, d => d.n_ingre)
  ]; */

  // product info text to be shown when hovered
  const pInfo = d3.map(data, 
    d => "<strong>Product name: </strong>" + `${d.product}\n`
    + "<strong>Brand: </strong>" + `${d.brand}\n`
    + "<strong>Product type: </strong>" + `${product_types[d.product_type]}\n` 
    + "<strong>Number of microplastic ingredients: </strong>" + `${d.n_ingre}`);

  // create svg for product info
  const info_g = d3.select("#info");

  // Compute the values. 
  const D = d3.map(data, d => d);
  const V = d3.map(data, d => eval(grouping));
  //.sort((a, b) => a - b);
  const G = d3.map(data, d => eval(grouping));
  //.sort((a, b) => a - b);
  const I = d3.map(data, d => data.indexOf(d));

  const radius = width / 95;
  
  // Unique the groups.
  let groups = new d3.InternSet(I.map(i => +G[i]));
  groups = Array.from(groups).sort(
    (a, b) => a-b
  );
  

  // Construct scales.
  let color;
  switch (grouping) {
    case "d.product_type":
      color = d3.scaleOrdinal(typeGroups, typeColors);
      break;
    case "d.mp_present":
      color = d3.scaleOrdinal(groups, mpColors);
      break;
  }


  // Compute layout: create a 1-deep hierarchy, and pack it.
  const root = d3.pack()
    .size([width - margin.left - margin.right, height - margin.top - margin.bottom])
    .padding(4.5)
    .radius(() => radius)
    (d3.hierarchy({
      children: I
    })
      .sum(i => V[i])
      .sort(function comparator(a, b) {
        return a.value - b.value;
      }));



  // create graph
  g.selectAll(".circle")
    .data(root.leaves(), d => d.data)
    .join(
      enter => enter.append("circle")
        .attr("class", "circle")
        .attr("transform", d => `translate(${d.x},${d.y})`)
        .attr("r", 0)
        .attr("fill", d => color(G[d.data]))
        .transition()
        .duration(speed)
        .attr("r", radius),

      update => update.transition()
        .duration(speed)
        .attr("transform", d => `translate(${d.x},${d.y})`)
        .attr("r", radius)
        .attr("fill", d => color(G[d.data])),

      exit => exit.transition()
        .duration(speed)
        .attr("r", 0)
        .remove()
    )
    .attr("class", "circle")
    // hover behavior
    .on("mouseover", (evt, d) => showInfo(info_g, evt, d, pInfo))
    .on("mouseout", (evt, d) => {
      d3.select(evt.target)
        .attr("opacity", 1);
    })
    // tooltip
    .append("title")
    .text(d => title[d.data]);
  
  // create legend
  let legend, rows, groupNames, dx;
  switch (grouping) {
    case "d.product_type":
      legend = d3.select("#legend1");
      rows = 6;
      groupNames = top3Types;
      dx = 170;
      break;
    case "d.mp_present":
      legend = d3.select("#legend2");
      rows = 1; 
      groupNames = mp_present;
      dx = 200;
      break;
  }
  
  makeLegend(legend, groupNames, color, 15, 25, radius, rows, dx);


}

// show product info
function showInfo(g, evt, d, a){
  // change bubble color
  d3.select(evt.target)
    .attr("opacity", 0.5);

  // remove previous info
  d3.selectAll(".text").remove();

  // append info
  g.selectAll("#info")
    .data(a[d.data].split("\n"))
    .enter()
    .append()
    .html(d => "<p>" + d + "</p>")
    .attr("class", "text")
    .attr("x", 0);

};

// legend
function makeLegend(g, groups, color, x, y, r, rows, dx){
  g.selectAll("legendCircle")
    .data(groups)
    .join("circle")
      .attr("cx", (d, i) => (i <= rows-1) ? x : (x + dx))
      .attr("cy", (d, i) => (i <= rows-1) ? (y + i * 35) : (y + (i-rows) * 35))
      .attr("r", r)
      .style("fill", d => color(groups.indexOf(d)));
  
  g.selectAll("legendText")
    .data(groups)
    .join("text")
      .attr("x", (d, i) => (i <= rows-1) ? (x + 20) : (x + 20 + dx))
      .attr("y", (d, i) => (i <= rows-1) ? (y + i * 35) : (y + (i-rows) * 35))
      .text(d => d)
      .style("fill", "#e3e3e3")
      .attr("text-anchor", "left")
      .style("alignment-baseline", "middle");
}

/* top ingredients by product type */
function topIngreChart(g, data, width, height, margin, speed){
  // data point info
  const dInfo = d3.map(data, 
    d => "<strong>Microplastic name: </strong>" + `${d.ingredients}\n`
    + "<strong>Product type: </strong>" + `${d.product_type}\n`
    + "<strong>Percentage of products with this microplastic: </strong>" + `${(d.percent_with_ingre  * 100).toFixed(2)}%\n`
    + "<strong>Rank: </strong>" + `${d.rank_in_type}`);

  // ingredient info
  const iInfo = ["<strong>Dimethicone</strong> is a silicon-based polymer. It gives a smooth texture to products such as hair conditioners, shampoos, and moisturizers. It is suspected to be bioaccumulative and toxic to aquatic organisms. ", 
  "<strong>Carbomer</strong> is a polymer made from acrylic acid. It is often used as a thickening agent or to prevent oil and water from separating. It is suspected to be hazardous to the aquatic environment. ", 
  "<strong>Acrylates/C10-30 Alkyl Acrylate Crosspolymer</strong> is added to cosmetic products to enhance texture. It thickens and stabilizes cosmetic formulations. It is poorly biodegradable. ", 
"<strong>PEG-40 Hydrogenated Castor Oil</strong> is a synthetic polymer that provides a soft feel to products and helps other ingredients solubilize. There is not enough scientific research available on its toxicity to the environment. ", 
"<strong>Cyclopentasiloxane</strong> is a silicon-based polymer. It helps products dry quickly and provides a silky feeling. It is bioaccumulative and expected to be toxic to the environment. ", 
"<strong>Polysorbate 20</strong> is used in cosmetic products to prevent oil and water from separating. There is not enough scientific research available on its toxicity to the environment. ", 
"<strong>PEG-7 Glyceryl Cocoate</strong> is a polymer that binds oil and water together and thickens cosmetic formulations. There is not enough scientific research available on its toxicity to the environment. "];

  // x scale
  const x = d3.scalePoint()
    .domain(data.map(d => d.ingredients))
    .range([margin.left + 40, width - margin.right]);

  // y scale
  const y = d3.scalePoint()
    .domain(data.map(d => d.product_type))
    .range([height - margin.bottom, margin.top + 60]);
  
  // scale for circle size
  const rScale = d3.scaleSqrt()
    .domain([0, d3.max(data.map(d => d.percent_with_ingre))])
    .range([0, 20]);
  
  // color scale for rank of ingredient frequency within product types
  const colors = ['#034e7b','#0570b0','#3690c0','#74a9cf','#a6bddb','#d0d1e6','#f1eef6'];
  const colorScale = d3.scaleOrdinal(d3.range(1, 7), colors);

  // axes
  const xAxis = g.append("g")
    .attr("class", "xAxis")
    .attr("transform", `translate(0, ${margin.top + 30})`)
    .call(d3.axisTop(x))
    .attr("opacity", 0)
    .transition()
      .duration(speed)
      .attr("opacity", 1);
  
  xAxis.select("path.domain")
  .attr("opacity", 0);

  

  const yAxis = g.append("g")
    .attr("class", "yAxis")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(y))
    .attr("opacity", 0)
    .transition()
      .duration(speed)
      .attr("opacity", 1);
  
  yAxis.select("path.domain")
  .attr("opacity", 0);

  // wrap axis text
  setTimeout(() => {
    xAxis.selectAll(".tick text")
      .call(wrap, 40, 5);
  });

  


  // append circles
  g.selectAll("circle")
    .data(data, d => d.id)
    .join(
      enter => enter.append("circle")
      .attr("transform", d => `translate(${x(d.ingredients)},${y(d.product_type)})`)
      .attr("r", 0)
      .attr("fill", d => colorScale(+d.rank_in_type))
      .transition()
      .duration(speed)
      .attr("r", d => rScale(d.percent_with_ingre))
      .attr("class", "ingreChart"),

      update => update.transition()
      .duration(speed)
      .attr("transform", d => `translate(${x(d.ingredients)},${y(d.product_type)})`)
      .attr("r", d => rScale(d.percent_with_ingre))
      .attr("class", "ingreChart"),

      exit => exit.transition()
      .duration(speed)
      .attr("r", 0)
      .remove()

    )
    .on("mouseover", evt => {
      d3.select(evt.target)
        .attr("opacity", 0.5);
      })
    .on("click", (evt, d) => showIngreInfo(d3.select("#ingre-info"), evt, d, iInfo))
    .on("mouseout", evt => {
      d3.select(evt.target)
        .attr("opacity", 1);
    })
    .append("title")
    .text(d => dInfo[d.id]);

    
  
}

// wrap axis text
function wrap(text, wrapWidth, yAxisAdjustment = 0) {
  text.each(function() {
    var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        y = text.attr("y"),
        dy = parseFloat(text.attr("dy")) - yAxisAdjustment,
        tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", `${dy}em`);
    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > wrapWidth) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
      }
    }
  });
  return 0;
}

// show ingredient info
function showIngreInfo(g, evt, d, a) {

  // remove previous info
  g.selectAll("p").remove();

  // visible
  g.transition()
    .duration(300)
    .style("opacity", 1);

  // append info
  g.html("<p>" + a[d.i_id] + "</p>")
    .attr("x", 0)
    .select("p")
    .attr("opacity", 0)
    .transition()
    .duration(1200)
    .attr("opacity", 1);
  
  g.html("<p>" + a[d.i_id] + "</p>" + "<p>" + d.ingredients + " is found in <strong>" + `${(d.percent_with_ingre  * 100).toFixed(2)}%` 
  + "</strong> of all <em>" + d.product_type + "</em> products.</p>"
  );
}

// tooltips https://d3-graph-gallery.com/graph/interactivity_tooltip.html
// create a tooltip
/* var Tooltip = d3.select("#vis")
.append("div")
.style("opacity", 0)
.attr("class", "tooltip")
.style("background-color", "white")
.style("border", "solid")
.style("border-width", "2px")
.style("border-radius", "5px")
.style("padding", "5px")

// Three function that change the tooltip when user hover / move / leave a cell
var mouseover = function(d) {
Tooltip
  .style("opacity", 1)
d3.select(this)
  .style("stroke", "black")
  .style("opacity", 1)
}
var mousemove = function(d) {
Tooltip
  .html("Value: " + d.value)
  .style("left", (d3.mouse(this)[0]+70) + "px")
  .style("top", (d3.mouse(this)[1]) + "px")
}
var mouseleave = function(d) {
Tooltip
  .style("opacity", 0)
d3.select(this)
  .style("stroke", "none")
  .style("opacity", 0.8)
} */


// manage visualizations
async function manageViz() {
  const width = 700;
  const height = 700;
  const marginSmall = { left: 1, right: 1, top: 1, bottom: 1 };
  const marginLarge = { left: 100, right: 50, top: 50, bottom: 50 };
  const speed = 1500;

  // bubble chart data
  let data = await d3.csv("data/top3Brands.csv");
  // sort by product id
  data = data.sort((a, b) => a.p_id - b.p_id);

  // unique product id
  const uniqueData = data.filter((value, index, a) => {
    return a.findIndex(v => v.p_id === value.p_id) === index;
  });

  console.log(uniqueData.length);

  // unique product type
  const typeData = data.filter(
    (value, index, a) => {
      return a.findIndex(v => v.product_type === value.product_type) === index;
    }
  );

  // microplastic ingredient chart data
  const ingreData = await d3.csv("data/top3IngredientByType.csv");

  const svg = d3.select("#chart")
    .attr("viewbox", [0, 0, width, height])
    .style("height", `${height}px`)
    .style("width", `${width}px`);

  const g = svg.append("g");

  /* const mpPresentData = uniqueData.filter(d => d.mp_present === 1);
  const filteredData = uniqueData.filter(d => d.product_type === 6); */

  const scroll = scroller();
  scroll(d3.selectAll("section"));
  scroll.on("section-change", (section) => {
    switch (section) {
      case 0:
        bubbleChart(g, uniqueData, "d.product_type", width, height, marginSmall, speed);
        d3.select("#legend1")
          .attr("opacity", 1);
        
        break;
      case 1:
        bubbleChart(g, uniqueData, "d.mp_present", width, height, marginSmall, speed);

        d3.select("#legend1")
          .attr("opacity", 0);

        d3.selectAll(".ingreChart")
          .transition()
          .duration(speed)
          .attr("r", 0)
          .remove();

        d3.selectAll(".xAxis,.yAxis")
          .transition()
          .duration(speed)
          .attr("opacity", 0)
          .remove();

        break;
      case 2:
        topIngreChart(g, ingreData, width, height, marginLarge, speed);
        break;
    }
  });


  // after filtering: 
  // bubbleChart(g, filtered_data, speed);

}




/* From Tutorial */

// build image list from local files
function buildImageList() {
  const images = [];

  images.push('./images/tardis.jpg');

  for (let i = 1; i <= 13; i++) {
    images.push(`./images/doctor-${i}.jpg`);
  }
  return images;
}




async function drawVisualization() {
  const width = 700;
  const height = 700;

  const innerRadius = 150;
  const outerRadius = Math.min(width, height) / 2;

  const data = await d3.csv("data/dr_who.csv");
  const images = buildImageList();

  // svg already created in index.html
  const svg = d3.select("#vis")
    .attr("viewbox", [0, 0, width, height])
    .style("height", `${height}px`)
    .style("width", `${width}px`)
  // add a mask for the image
  svg.append("clipPath")
    .attr("id", "circle-view")
    .append("circle")
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", innerRadius - 2)


  // move the origin to the center of the SVG
  const graph = svg.append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);

  // scales
  // x scale
  const x = d3.scaleBand()
    .domain(data.map(d => d.doctor))
    .range([0, 2 * Math.PI])

  // y scale
  const y = d3.scaleRadial()
    .domain([0, d3.max(data, d => +d.duration)])
    .range([innerRadius, outerRadius])

  // create arc function
  const arc = d3.arc()
    .innerRadius(innerRadius)
    .outerRadius(d => y(+d.duration))
    .startAngle(d => x(d.doctor))
    .endAngle(d => x(d.doctor) + x.bandwidth())
    .padAngle(0.01)
    .padRadius(innerRadius)


  // add image
  const image = graph.append("image")
    // x and y refer to upper left of the image
    .attr("x", -innerRadius)
    .attr("y", -innerRadius)
    .attr("width", innerRadius * 2)
    .attr("href", images[0])
    // apply mask to image
    .attr("clip-path", "url(#circle-view");


  // create bars
  graph.selectAll(".bar")
    .data(data, d => d.doctor)
    .join("path")
    .attr("class", "bar")
    // pass in the arc function
    .attr("d", arc)
    // highlight bar when hovered
    .on("mouseover", (evt, d) => {
      // select target of the event (i.e., hovered bar)
      d3.select(evt.target)
        // add class "selected" to the element
        .classed("selected", true);

      // change imgae
      d3.select("image")
        .attr("href", images[+d.doctor]);

    })
    // remove highlight when not hovered
    .on("mouseout", (evt, d) => {
      d3.select(evt.target)
        .classed("selected", false);
      // change image back to Tardis
      d3.select("image")
        .attr("href", images[0]);
    })




}

manageViz();