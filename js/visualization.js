/* Stacked bar chart for MP presence */
function stackedBar(g, data, width, height, margin, speed) {
  // x scale
  const x = d3.scaleBand()
    .domain(data.map(d => d.product_type))
    .range([margin.left, width - margin.right]);

  // y scale
  const y = d3.scaleLinear()
    .domain(data.map(d => d.mp_count))
    .range([height - margin.bottom, margin.top]);

  // add bars
  g.selectAll("rect")
    .data(data, d => d.product_type)
    .join(

  )
}




/* Bubble Chart */
async function bubbleChart(g, data, grouping, width, height, margin, speed) {

  const colorPalette = await d3.csv("data/colorPalette12.csv");
  const product_types = d3.map(colorPalette, d => d.product_type);
  console.log(product_types);
  const typeColors = d3.map(colorPalette, d => d.color);
  const typeGroups = d3.map(colorPalette, d => d.id);

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
      groupNames = product_types;
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

  // append one tspan for each line of info
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
      .style("fill", "white")
      .attr("text-anchor", "left")
      .style("alignment-baseline", "middle");
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
  const margin = { left: 1, right: 1, top: 1, bottom: 1 };
  const speed = 1500;
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

  const svg = d3.select("#chart")
    .attr("viewbox", [0, 0, width, height])
    .style("height", `${height}px`)
    .style("width", `${width}px`);

  const g = svg.append("g");

  const mpPresentData = uniqueData.filter(d => d.mp_present === 1);
  const filteredData = uniqueData.filter(d => d.product_type === 6);

  const scroll = scroller();
  scroll(d3.selectAll("section"));
  scroll.on("section-change", (section) => {
    switch (section) {
      case 0:
        bubbleChart(g, uniqueData, "d.product_type", width, height, margin, speed);
        d3.select("#legend1")
          .attr("opacity", 1);
        break;
      case 1:
        bubbleChart(g, uniqueData, "d.mp_present", width, height, margin, speed);
        d3.select("#legend1")
          .attr("opacity", 0);
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

// Copyright 2021, Observable Inc.
// Released under the ISC license.
// https://observablehq.com/@d3/color-legend
function Swatches(color, {
  columns = null,
  format,
  unknown: formatUnknown,
  swatchSize = 15,
  swatchWidth = swatchSize,
  swatchHeight = swatchSize,
  marginLeft = 0
} = {}) {
  const id = `-swatches-${Math.random().toString(16).slice(2)}`;
  const unknown = formatUnknown == null ? undefined : color.unknown();
  const unknowns = unknown == null || unknown === d3.scaleImplicit ? [] : [unknown];
  const domain = color.domain().concat(unknowns);
  if (format === undefined) format = x => x === unknown ? formatUnknown : x;

  function entity(character) {
    return `&#${character.charCodeAt(0).toString()};`;
  }

  if (columns !== null) return htl.html`<div style="display: flex; align-items: center; margin-left: ${+marginLeft}px; min-height: 33px; font: 10px sans-serif;">
  <style>

.${id}-item {
  break-inside: avoid;
  display: flex;
  align-items: center;
  padding-bottom: 1px;
}

.${id}-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: calc(100% - ${+swatchWidth}px - 0.5em);
}

.${id}-swatch {
  width: ${+swatchWidth}px;
  height: ${+swatchHeight}px;
  margin: 0 0.5em 0 0;
}

  </style>
  <div style=${{ width: "100%", columns }}>${domain.map(value => {
    const label = `${format(value)}`;
    return htl.html`<div class=${id}-item>
      <div class=${id}-swatch style=${{ background: color(value) }}></div>
      <div class=${id}-label title=${label}>${label}</div>
    </div>`;
  })}
  </div>
</div>`;

  return htl.html`<div style="display: flex; align-items: center; min-height: 33px; margin-left: ${+marginLeft}px; font: 10px sans-serif;">
  <style>

.${id} {
  display: inline-flex;
  align-items: center;
  margin-right: 1em;
}

.${id}::before {
  content: "";
  width: ${+swatchWidth}px;
  height: ${+swatchHeight}px;
  margin-right: 0.5em;
  background: var(--color);
}

  </style>
  <div>${domain.map(value => htl.html`<span class="${id}" style="--color: ${color(value)}">${format(value)}</span>`)}</div>`;
}

manageViz();